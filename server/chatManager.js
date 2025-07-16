class ChatManager {
  constructor(io) {
    this.io = io;
    this.chatRooms = new Map();
    this.messageHistory = new Map();
    this.playerMutes = new Set();
    this.bannedWords = new Set([
      'spam', 'cheat', 'hack', 'stupid', 'idiot', 'noob'
    ]);
    this.rateLimits = new Map(); // playerId -> { messages: [], lastReset: timestamp }
    this.MAX_MESSAGES_PER_MINUTE = 10;
    this.MAX_MESSAGE_LENGTH = 200;
    this.MAX_HISTORY_LENGTH = 100;
  }

  createChatRoom(roomId, roomName, type = 'game') {
    if (this.chatRooms.has(roomId)) {
      return this.chatRooms.get(roomId);
    }

    const chatRoom = {
      id: roomId,
      name: roomName,
      type: type, // 'game', 'lobby', 'tournament', 'global'
      participants: new Set(),
      messages: [],
      settings: {
        allowAll: true,
        allowSpectators: true,
        allowTeams: false,
        moderationEnabled: true
      },
      createdAt: Date.now()
    };

    this.chatRooms.set(roomId, chatRoom);
    this.messageHistory.set(roomId, []);
    
    console.log(`Chat room created: ${roomName} (${roomId})`);
    return chatRoom;
  }

  joinChatRoom(roomId, playerId, playerName, socketId) {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Chat room not found' };
    }

    const participant = {
      id: playerId,
      name: playerName,
      socketId: socketId,
      joinedAt: Date.now(),
      isSpectator: false,
      isModerator: false
    };

    room.participants.add(participant);

    // Send join notification
    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      playerId: playerId,
      playerName: playerName,
      timestamp: Date.now(),
      message: `${playerName} joined the chat`
    });

    // Send recent message history to new participant
    const history = this.messageHistory.get(roomId) || [];
    const recentHistory = history.slice(-20); // Last 20 messages
    
    this.io.to(socketId).emit('chat-history', {
      roomId: roomId,
      messages: recentHistory
    });

    return { success: true, room: room };
  }

  leaveChatRoom(roomId, playerId) {
    const room = this.chatRooms.get(roomId);
    if (!room) return;

    const participant = Array.from(room.participants).find(p => p.id === playerId);
    if (participant) {
      room.participants.delete(participant);
      
      // Send leave notification
      this.broadcastToRoom(roomId, {
        type: 'player_left',
        playerId: playerId,
        playerName: participant.name,
        timestamp: Date.now(),
        message: `${participant.name} left the chat`
      });
    }
  }

  sendMessage(roomId, playerId, playerName, message, messageType = 'chat') {
    const room = this.chatRooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Chat room not found' };
    }

    // Check if player is muted
    if (this.playerMutes.has(playerId)) {
      return { success: false, error: 'You are muted' };
    }

    // Check rate limiting
    const rateLimitResult = this.checkRateLimit(playerId);
    if (!rateLimitResult.allowed) {
      return { success: false, error: 'Rate limit exceeded. Please slow down.' };
    }

    // Validate message
    const validation = this.validateMessage(message);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Process message (filter, etc.)
    const processedMessage = this.processMessage(message);

    // Create message object
    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: messageType,
      playerId: playerId,
      playerName: playerName,
      message: processedMessage,
      timestamp: Date.now(),
      roomId: roomId
    };

    // Add to room messages
    room.messages.push(messageObj);
    
    // Add to history
    const history = this.messageHistory.get(roomId) || [];
    history.push(messageObj);
    
    // Keep history limited
    if (history.length > this.MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - this.MAX_HISTORY_LENGTH);
    }
    
    this.messageHistory.set(roomId, history);

    // Broadcast to room
    this.broadcastToRoom(roomId, messageObj);

    // Update rate limit
    this.updateRateLimit(playerId);

    console.log(`Chat message in ${roomId}: ${playerName}: ${processedMessage}`);
    return { success: true, message: messageObj };
  }

  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Invalid message format' };
    }

    if (message.length > this.MAX_MESSAGE_LENGTH) {
      return { valid: false, error: `Message too long (max ${this.MAX_MESSAGE_LENGTH} characters)` };
    }

    if (message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    return { valid: true };
  }

  processMessage(message) {
    let processed = message.trim();
    
    // Filter banned words
    this.bannedWords.forEach(word => {
      const regex = new RegExp(word, 'gi');
      processed = processed.replace(regex, '*'.repeat(word.length));
    });

    // Process special commands
    if (processed.startsWith('/')) {
      // Commands like /me, /whisper, etc. could be added here
      return processed;
    }

    return processed;
  }

  checkRateLimit(playerId) {
    const now = Date.now();
    const minute = 60 * 1000;
    
    if (!this.rateLimits.has(playerId)) {
      this.rateLimits.set(playerId, {
        messages: [],
        lastReset: now
      });
    }

    const playerLimit = this.rateLimits.get(playerId);
    
    // Reset if more than a minute has passed
    if (now - playerLimit.lastReset > minute) {
      playerLimit.messages = [];
      playerLimit.lastReset = now;
    }

    // Remove old messages
    playerLimit.messages = playerLimit.messages.filter(timestamp => 
      now - timestamp < minute
    );

    // Check if limit exceeded
    if (playerLimit.messages.length >= this.MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, remainingTime: minute - (now - playerLimit.messages[0]) };
    }

    return { allowed: true };
  }

  updateRateLimit(playerId) {
    const playerLimit = this.rateLimits.get(playerId);
    if (playerLimit) {
      playerLimit.messages.push(Date.now());
    }
  }

  broadcastToRoom(roomId, message) {
    const room = this.chatRooms.get(roomId);
    if (!room) return;

    room.participants.forEach(participant => {
      this.io.to(participant.socketId).emit('chat-message', message);
    });
  }

  sendSystemMessage(roomId, message, type = 'system') {
    const messageObj = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      playerId: 'system',
      playerName: 'System',
      message: message,
      timestamp: Date.now(),
      roomId: roomId
    };

    this.broadcastToRoom(roomId, messageObj);
    
    // Add to history
    const history = this.messageHistory.get(roomId) || [];
    history.push(messageObj);
    this.messageHistory.set(roomId, history);
  }

  sendGameEvent(roomId, eventType, eventData) {
    const message = this.formatGameEvent(eventType, eventData);
    if (message) {
      this.sendSystemMessage(roomId, message, 'game_event');
    }
  }

  formatGameEvent(eventType, eventData) {
    switch (eventType) {
      case 'piece_moved':
        return `${eventData.playerName} moved ${eventData.piece} to (${eventData.row}, ${eventData.col})`;
      case 'battle_started':
        return `⚔️ Battle: ${eventData.attacker} vs ${eventData.defender}`;
      case 'battle_result':
        return `🏆 ${eventData.winner} defeats ${eventData.loser}`;
      case 'piece_evolved':
        return `🧬 ${eventData.playerName}'s ${eventData.oldType} evolved to ${eventData.newType}!`;
      case 'player_eliminated':
        return `💀 ${eventData.playerName} has been eliminated!`;
      case 'game_victory':
        return `🎉 ${eventData.winnerName} wins the game!`;
      case 'evolution_points':
        return `⭐ ${eventData.playerName} gained ${eventData.points} evolution points`;
      default:
        return null;
    }
  }

  mutePlayer(playerId, reason = 'violation') {
    this.playerMutes.add(playerId);
    console.log(`Player ${playerId} muted for: ${reason}`);
    
    // Notify all rooms where this player is present
    this.chatRooms.forEach((room, roomId) => {
      const participant = Array.from(room.participants).find(p => p.id === playerId);
      if (participant) {
        this.sendSystemMessage(roomId, `${participant.name} has been muted`);
      }
    });
  }

  unmutePlayer(playerId) {
    this.playerMutes.delete(playerId);
    console.log(`Player ${playerId} unmuted`);
  }

  getPlayerStats(playerId) {
    const rateLimitData = this.rateLimits.get(playerId);
    const messagesInLastMinute = rateLimitData ? rateLimitData.messages.length : 0;
    
    return {
      isMuted: this.playerMutes.has(playerId),
      messagesInLastMinute: messagesInLastMinute,
      maxMessagesPerMinute: this.MAX_MESSAGES_PER_MINUTE
    };
  }

  getChatRoomInfo(roomId) {
    const room = this.chatRooms.get(roomId);
    if (!room) return null;

    return {
      id: room.id,
      name: room.name,
      type: room.type,
      participantCount: room.participants.size,
      participants: Array.from(room.participants).map(p => ({
        id: p.id,
        name: p.name,
        joinedAt: p.joinedAt,
        isSpectator: p.isSpectator,
        isModerator: p.isModerator
      })),
      messageCount: room.messages.length,
      settings: room.settings
    };
  }

  getAllChatRooms() {
    const rooms = [];
    this.chatRooms.forEach((room, roomId) => {
      rooms.push(this.getChatRoomInfo(roomId));
    });
    return rooms;
  }

  cleanupPlayer(playerId) {
    // Remove from all chat rooms
    this.chatRooms.forEach((room, roomId) => {
      this.leaveChatRoom(roomId, playerId);
    });

    // Clean up rate limits
    this.rateLimits.delete(playerId);
    
    // Remove mute if exists
    this.playerMutes.delete(playerId);
  }

  cleanup() {
    this.chatRooms.clear();
    this.messageHistory.clear();
    this.playerMutes.clear();
    this.rateLimits.clear();
  }
}

module.exports = ChatManager; 