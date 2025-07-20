// Socket Communication Module
// Centralized socket event handling and communication management

import { updateGameState, addOrUpdatePlayer, addOrUpdatePiece, setCurrentPlayerId, setActivePlayer } from './gameStateManager.js';
import { setValidMoves, showBattleContestPrompt, showDiceBattleAnimation, showMoveChoiceDialog } from './movementBattleSystem.js';
import { handleGameOver, updateAIPlayersList, startGameCountdown } from './gameInitialization.js';
import { showEvolutionChoice, handleEvolutionCompleted, updateEvolutionBank } from './evolutionUI.js';
import { updateLobbyList, updateLobbyRoomDisplay } from './lobbySystem.js';
import { displayPersonalStats, displayLeaderboard, displayAchievements, displayGlobalStats } from './statisticsUI.js';
import { updateTournamentList, updateTournamentStatus, updateBracketsDisplay } from './tournamentUI.js';
import { formatTime } from './timerFunctions.js';

// Socket connection state
let socket = null;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

/**
 * Initialize socket connection
 * @param {string} serverUrl - Server URL (optional)
 * @returns {object} Socket instance
 */
export function initializeSocket(serverUrl = null) {
  console.log('🔌 Initializing socket connection...');
  
  if (socket && socket.connected) {
    console.log('⚠️ Socket already connected');
    return socket;
  }
  
  // Initialize socket.io connection
  socket = serverUrl ? io(serverUrl) : io();
  
  // Set up basic connection handlers
  setupBasicConnectionHandlers();
  
  // Set up all game event handlers
  setupGameEventHandlers();
  
  // Set up UI event handlers
  setupUIEventHandlers();
  
  // Set up lobby event handlers
  setupLobbyEventHandlers();
  
  // Set up tournament event handlers
  setupTournamentEventHandlers();
  
  // Set up statistics event handlers
  setupStatisticsEventHandlers();
  
  // Set up evolution event handlers
  setupEvolutionEventHandlers();
  
  // Set up battle event handlers
  setupBattleEventHandlers();
  
  // Set up timer event handlers
  setupTimerEventHandlers();
  
  // Set up AI event handlers
  setupAIEventHandlers();
  
  // Set up spectator event handlers
  setupSpectatorEventHandlers();
  
  console.log('✅ Socket communication module initialized');
  return socket;
}

/**
 * Get current socket instance
 * @returns {object|null} Socket instance
 */
export function getSocket() {
  return socket;
}

/**
 * Check if socket is connected
 * @returns {boolean} Connection status
 */
export function isSocketConnected() {
  return socket && socket.connected && isConnected;
}

/**
 * Setup basic connection event handlers
 */
function setupBasicConnectionHandlers() {
  console.log('🔗 Setting up basic connection handlers...');
  
  socket.on('connect', () => {
    console.log('✅ Connected to server');
    isConnected = true;
    reconnectAttempts = 0;
    
    // Notify connection established
    if (window.onSocketConnected) {
      window.onSocketConnected();
    }
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    isConnected = false;
    
    // Notify disconnection
    if (window.onSocketDisconnected) {
      window.onSocketDisconnected();
    }
  });
  
  socket.on('connect_error', (error) => {
    console.error('🔥 Connection error:', error);
    
    // Attempt reconnection
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
      setTimeout(() => {
        socket.connect();
      }, 2000 * reconnectAttempts);
    } else {
      console.error('💀 Max reconnection attempts reached');
    }
  });
  
  socket.on('connection-established', (data) => {
    console.log('🎯 Connection established:', data);
    setCurrentPlayerId(data.playerId);
    
    // Store global reference
    window.globalSocket = socket;
    
    // Notify connection established
    if (window.onConnectionEstablished) {
      window.onConnectionEstablished(data);
    }
  });
}

/**
 * Setup game event handlers
 */
function setupGameEventHandlers() {
  console.log('🎮 Setting up game event handlers...');
  
  // Game state updates
  socket.on('game-state-update', async (newGameState) => {
    console.log('🔄 Game state update received:', newGameState);
    updateGameState(newGameState);
    
    // Update visual representation
    if (window.updateVisuals) {
      await window.updateVisuals();
    }
  });
  
  // Game full
  socket.on('game-full', () => {
    console.log('🚫 Game is full');
    alert('Game is full! Please try again later.');
    if (window.returnToMenu) {
      window.returnToMenu();
    }
  });
  
  // Game started
  socket.on('game-started-first-move', (data) => {
    console.log('🎮 Game started:', data);
    startGameCountdown(3, { socket });
  });
  
  // Active player changed
  socket.on('active-player-changed', (data) => {
    console.log('👤 Active player changed:', data);
    setActivePlayer(data.playerId);
    
    if (window.updateActivePlayer) {
      window.updateActivePlayer(data.playerId, data.playerName);
    }
  });
  
  // Player eliminated
  socket.on('player-eliminated', (data) => {
    console.log('💀 Player eliminated:', data);
    
    if (data.isGameOver) {
      handleGameOver(data.winner, data.gameStats, { socket });
    }
  });
  
  // Game creation and joining
  socket.on('game-created', (data) => {
    console.log('🎯 Game created:', data);
  });
  
  socket.on('game-joined', (data) => {
    console.log('🤝 Game joined:', data);
  });
  
  socket.on('game-creation-failed', (data) => {
    console.error('❌ Game creation failed:', data);
    alert('Failed to create game: ' + data.reason);
  });
  
  socket.on('join-failed', (data) => {
    console.error('❌ Join failed:', data);
    alert('Failed to join game: ' + data.reason);
  });
}

/**
 * Setup movement and battle event handlers
 */
function setupBattleEventHandlers() {
  console.log('⚔️ Setting up battle event handlers...');
  
  // Valid moves
  socket.on('valid-moves', (data) => {
    console.log('🎯 Valid moves received:', data);
    setValidMoves(data.moves);
    
    // Update highlights
    if (window.highlightValidMoves) {
      window.highlightValidMoves();
    }
  });
  
  // Move result
  socket.on('move-result', (data) => {
    console.log('🎯 Move result:', data);
    
    if (data.success) {
      // Clear selection
      if (window.clearSelectedPiece) {
        window.clearSelectedPiece();
      }
    } else {
      console.warn('⚠️ Move failed:', data.reason);
    }
  });
  
  // Battle contest prompt
  socket.on('battle-contest-prompt', (data) => {
    console.log('⚔️ Battle contest prompt:', data);
    showBattleContestPrompt(data.battleId, data.attackingPiece, data.defendingPiece, data.timeLimit, { socket });
  });
  
  // Dice battle animation
  socket.on('dice-battle-animation', (data) => {
    console.log('🎲 Dice battle animation:', data);
    showDiceBattleAnimation(data.battleLog, data.winner, data.loser, data.duration);
  });
  
  // Battle result
  socket.on('battle-result', (data) => {
    console.log('⚔️ Battle result:', data);
    
    // Update pieces based on battle result
    if (data.capturedPiece) {
      // Remove captured piece
      if (window.removePieceMesh) {
        window.removePieceMesh(data.capturedPiece.id);
      }
    }
  });
  
  // Piece split
  socket.on('piece-split', (data) => {
    console.log('✂️ Piece split:', data);
    
    // Update game state with new pieces
    if (data.newPieces) {
      data.newPieces.forEach(piece => {
        addOrUpdatePiece(piece);
      });
    }
  });
  
  // Split result
  socket.on('split-result', (data) => {
    console.log('✂️ Split result:', data);
    
    if (data.success) {
      console.log('✅ Split successful');
    } else {
      console.warn('⚠️ Split failed:', data.reason);
    }
  });
  
  // Jump capture
  socket.on('jump-capture', (data) => {
    console.log('🦘 Jump capture:', data);
    
    // Remove captured pieces
    if (data.capturedPieces) {
      data.capturedPieces.forEach(pieceId => {
        if (window.removePieceMesh) {
          window.removePieceMesh(pieceId);
        }
      });
    }
  });
  
  // Multi-jump capture
  socket.on('multi-jump-capture', (data) => {
    console.log('🦘🦘 Multi-jump capture:', data);
    
    // Handle multiple captures
    if (data.capturedPieces) {
      data.capturedPieces.forEach(pieceId => {
        if (window.removePieceMesh) {
          window.removePieceMesh(pieceId);
        }
      });
    }
  });
}

/**
 * Setup evolution event handlers
 */
function setupEvolutionEventHandlers() {
  console.log('🧬 Setting up evolution event handlers...');
  
  // Evolution choice available
  socket.on('evolution-choice-available', (data) => {
    console.log('🧬 Evolution choice available:', data);
  });
  
  // Evolution choice dialog
  socket.on('evolution-choice-dialog', (data) => {
    console.log('🧬 Evolution choice dialog:', data);
    showEvolutionChoice(data, { socket });
  });
  
  // Evolution completed
  socket.on('evolution-completed', (data) => {
    console.log('🧬 Evolution completed:', data);
    handleEvolutionCompleted(data, { socket });
  });
  
  // Evolution choice success
  socket.on('evolution-choice-success', (data) => {
    console.log('✅ Evolution choice success:', data);
  });
  
  // Evolution choice failed
  socket.on('evolution-choice-failed', (data) => {
    console.warn('❌ Evolution choice failed:', data);
  });
  
  // Evolution choice cancelled
  socket.on('evolution-choice-cancelled', (data) => {
    console.log('🚫 Evolution choice cancelled:', data);
  });
  
  // Evolution point gained
  socket.on('evolution-point-gained', (data) => {
    console.log('💎 Evolution point gained:', data);
    
    // Show notification
    if (window.showNotification) {
      window.showNotification(`+${data.points} evolution points!`, '#00ff00', 2000);
    }
  });
  
  // Evolution points banked
  socket.on('evolution-points-banked', (data) => {
    console.log('💰 Evolution points banked:', data);
    updateEvolutionBank(data.bankInfo, { socket });
  });
  
  // Evolution point award
  socket.on('evolution-point-award', (data) => {
    console.log('🏆 Evolution point award:', data);
    
    // Show award notification
    if (window.showNotification) {
      window.showNotification(`Awarded ${data.points} evolution points for ${data.reason}!`, '#ffd700', 3000);
    }
  });
  
  // Evolution bank info
  socket.on('evolution-bank-info', (data) => {
    console.log('💰 Evolution bank info:', data);
    updateEvolutionBank(data, { socket });
  });
}

/**
 * Setup lobby event handlers
 */
function setupLobbyEventHandlers() {
  console.log('🏠 Setting up lobby event handlers...');
  
  // Lobby created
  socket.on('lobby-created', (data) => {
    console.log('🏗️ Lobby created:', data);
  });
  
  // Lobby joined
  socket.on('lobby-joined', (data) => {
    console.log('🚪 Lobby joined:', data);
    updateLobbyRoomDisplay(data.lobby);
  });
  
  // Lobby left
  socket.on('lobby-left', (data) => {
    console.log('🚪 Lobby left:', data);
    
    // Reset lobby state
    if (window.currentLobby) {
      window.currentLobby = null;
    }
    if (window.isInLobby) {
      window.isInLobby = false;
    }
  });
  
  // Lobby updated
  socket.on('lobby-updated', (data) => {
    console.log('🔄 Lobby updated:', data);
    updateLobbyRoomDisplay(data.lobby);
  });
  
  // Lobby list
  socket.on('lobby-list', (data) => {
    console.log('📋 Lobby list:', data);
    updateLobbyList(data.lobbies);
  });
  
  // Lobby list update
  socket.on('lobby-list-update', (data) => {
    console.log('📋 Lobby list update:', data);
    updateLobbyList(data.lobbies);
  });
  
  // Lobby errors
  socket.on('lobby-creation-failed', (data) => {
    console.error('❌ Lobby creation failed:', data);
    alert('Failed to create lobby: ' + data.reason);
  });
  
  socket.on('lobby-join-failed', (data) => {
    console.error('❌ Lobby join failed:', data);
    alert('Failed to join lobby: ' + data.reason);
  });
  
  socket.on('lobby-leave-failed', (data) => {
    console.error('❌ Lobby leave failed:', data);
    alert('Failed to leave lobby: ' + data.reason);
  });
  
  // Ready toggle
  socket.on('ready-toggled', (data) => {
    console.log('✅ Ready toggled:', data);
  });
  
  socket.on('ready-toggle-failed', (data) => {
    console.error('❌ Ready toggle failed:', data);
    alert('Failed to toggle ready: ' + data.reason);
  });
}

/**
 * Setup tournament event handlers
 */
function setupTournamentEventHandlers() {
  console.log('🏆 Setting up tournament event handlers...');
  
  // Tournament joined
  socket.on('tournament-joined', (data) => {
    console.log('🏆 Tournament joined:', data);
  });
  
  // Tournament join failed
  socket.on('tournament-join-failed', (data) => {
    console.error('❌ Tournament join failed:', data);
    alert('Failed to join tournament: ' + data.reason);
  });
  
  // Tournament started
  socket.on('tournament-started', (data) => {
    console.log('🚀 Tournament started:', data);
    updateTournamentStatus(data.tournament);
  });
  
  // Tournament updated
  socket.on('tournament-updated', (data) => {
    console.log('🔄 Tournament updated:', data);
    updateTournamentStatus(data.tournament);
  });
  
  // Tournament match events
  socket.on('tournament-match-started', (data) => {
    console.log('⚔️ Tournament match started:', data);
  });
  
  socket.on('tournament-match-completed', (data) => {
    console.log('🏁 Tournament match completed:', data);
  });
  
  // Tournament completed
  socket.on('tournament-completed', (data) => {
    console.log('🏆 Tournament completed:', data);
    
    // Show tournament results
    if (window.showTournamentResults) {
      window.showTournamentResults(data.results);
    }
  });
  
  // Tournament info
  socket.on('tournament-info', (data) => {
    console.log('ℹ️ Tournament info:', data);
    updateBracketsDisplay(data.tournament);
  });
}

/**
 * Setup statistics event handlers
 */
function setupStatisticsEventHandlers() {
  console.log('📊 Setting up statistics event handlers...');
  
  // Player stats
  socket.on('player-stats', (data) => {
    console.log('📊 Player stats:', data);
    displayPersonalStats(data.stats);
  });
  
  // Leaderboard
  socket.on('leaderboard', (data) => {
    console.log('🏆 Leaderboard:', data);
    displayLeaderboard(data.leaderboard, data.category);
  });
  
  // Achievements
  socket.on('achievements', (data) => {
    console.log('🏅 Achievements:', data);
    displayAchievements(data.achievements);
  });
  
  // Global stats
  socket.on('global-stats', (data) => {
    console.log('🌍 Global stats:', data);
    displayGlobalStats(data.stats);
  });
  
  // Player rank
  socket.on('player-rank', (data) => {
    console.log('📈 Player rank:', data);
  });
  
  // Game history
  socket.on('game-history', (data) => {
    console.log('📚 Game history:', data);
  });
}

/**
 * Setup timer event handlers
 */
function setupTimerEventHandlers() {
  console.log('⏱️ Setting up timer event handlers...');
  
  // Player timer events
  socket.on('player-timer-started', (data) => {
    console.log('⏱️ Player timer started:', data);
    
    if (window.startTimer) {
      window.startTimer(data.playerId, data.timeLimit, data.startTime);
    }
  });
  
  socket.on('player-timer-update', (data) => {
    console.log('⏱️ Player timer update:', data);
    
    if (window.updateTimerDisplay) {
      window.updateTimerDisplay(data.timeRemaining);
    }
  });
  
  socket.on('player-timer-zero', (data) => {
    console.log('⏱️ Player timer zero:', data);
    
    // Handle timeout
    if (window.handlePlayerTimeout) {
      window.handlePlayerTimeout(data.playerId);
    }
  });
  
  // Timer control events
  socket.on('timer-started', (data) => {
    console.log('⏱️ Timer started:', data);
  });
  
  socket.on('turn-changed', (data) => {
    console.log('🔄 Turn changed:', data);
  });
  
  socket.on('player-timeout', (data) => {
    console.log('⏰ Player timeout:', data);
  });
  
  socket.on('timers-paused', (data) => {
    console.log('⏸️ Timers paused:', data);
    
    if (window.pauseTimer) {
      window.pauseTimer();
    }
  });
  
  socket.on('timers-resumed', (data) => {
    console.log('▶️ Timers resumed:', data);
    
    if (window.resumeTimer) {
      window.resumeTimer();
    }
  });
}

/**
 * Setup AI event handlers
 */
function setupAIEventHandlers() {
  console.log('🤖 Setting up AI event handlers...');
  
  // AI player added
  socket.on('ai-player-added', (data) => {
    console.log('🤖 AI player added:', data);
    
    // Update AI players list
    if (window.currentAIPlayers) {
      window.currentAIPlayers.push(data.aiPlayer);
      updateAIPlayersList(window.currentAIPlayers);
    }
  });
  
  // AI player removed
  socket.on('ai-player-removed', (data) => {
    console.log('🤖 AI player removed:', data);
    
    // Update AI players list
    if (window.currentAIPlayers) {
      window.currentAIPlayers = window.currentAIPlayers.filter(ai => ai.id !== data.aiPlayerId);
      updateAIPlayersList(window.currentAIPlayers);
    }
  });
  
  // AI difficulties
  socket.on('ai-difficulties', (data) => {
    console.log('🤖 AI difficulties:', data);
    
    // Update difficulty selector if available
    const difficultySelect = document.getElementById('ai-difficulty-select');
    if (difficultySelect && data.difficulties) {
      difficultySelect.innerHTML = data.difficulties.map(diff => 
        `<option value="${diff}">${diff.charAt(0).toUpperCase() + diff.slice(1)}</option>`
      ).join('');
    }
  });
  
  // AI errors
  socket.on('ai-add-failed', (data) => {
    console.error('❌ AI add failed:', data);
    alert('Failed to add AI player: ' + data.reason);
  });
  
  // AI stats and updates
  socket.on('ai-difficulty-updated', (data) => {
    console.log('🤖 AI difficulty updated:', data);
  });
  
  socket.on('ai-stats', (data) => {
    console.log('📊 AI stats:', data);
  });
  
  socket.on('ai-move-completed', (data) => {
    console.log('🤖 AI move completed:', data);
  });
}

/**
 * Setup spectator event handlers
 */
function setupSpectatorEventHandlers() {
  console.log('👀 Setting up spectator event handlers...');
  
  // Spectator joined
  socket.on('spectator-joined', (data) => {
    console.log('👀 Spectator joined:', data);
  });
  
  // Spectator left
  socket.on('spectator-left', (data) => {
    console.log('👀 Spectator left:', data);
  });
  
  // Spectator count updated
  socket.on('spectator-count-updated', (data) => {
    console.log('👀 Spectator count updated:', data);
    
    // Update spectator count display
    const spectatorCount = document.getElementById('spectator-count');
    if (spectatorCount) {
      spectatorCount.textContent = data.count;
    }
  });
  
  // Spectatable games
  socket.on('spectatable-games', (data) => {
    console.log('👀 Spectatable games:', data);
    
    if (window.updateSpectatorGamesList) {
      window.updateSpectatorGamesList(data.games);
    }
  });
  
  // Replay events
  socket.on('replay-list', (data) => {
    console.log('📼 Replay list:', data);
    
    if (window.updateReplaysList) {
      window.updateReplaysList(data.replays);
    }
  });
  
  socket.on('replay-data', (data) => {
    console.log('📼 Replay data:', data);
  });
  
  socket.on('replay-state', (data) => {
    console.log('📼 Replay state:', data);
    
    if (window.updateReplayUI) {
      window.updateReplayUI(data);
    }
  });
}

/**
 * Setup UI-related event handlers
 */
function setupUIEventHandlers() {
  console.log('🖥️ Setting up UI event handlers...');
  
  // Piece updates
  socket.on('piece-update', (data) => {
    console.log('♟️ Piece update:', data);
    addOrUpdatePiece(data.piece);
    
    // Update visual representation
    if (window.updatePieceMesh) {
      window.updatePieceMesh(data.piece);
    }
  });
  
  // Piece removed
  socket.on('piece-removed', (data) => {
    console.log('♟️ Piece removed:', data);
    
    // Remove from visual representation
    if (window.removePieceMesh) {
      window.removePieceMesh(data.pieceId);
    }
  });
  
  // Player updates
  socket.on('player-update', (data) => {
    console.log('👤 Player update:', data);
    addOrUpdatePlayer(data.player);
  });
  
  // Chat events
  socket.on('chat-message', (data) => {
    console.log('💬 Chat message:', data);
    
    if (window.addChatMessage) {
      window.addChatMessage(data);
    }
  });
  
  socket.on('chat-status', (data) => {
    console.log('💬 Chat status:', data);
    
    if (window.updateChatStatus) {
      window.updateChatStatus(data.status);
    }
  });
  
  // Move events
  socket.on('move-pending', (data) => {
    console.log('⏳ Move pending:', data);
  });
  
  socket.on('move-collision', (data) => {
    console.log('💥 Move collision:', data);
  });
}

/**
 * Emit event to server
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function emitEvent(event, data = {}) {
  if (!socket || !socket.connected) {
    console.error('❌ Cannot emit event - socket not connected:', event);
    return false;
  }
  
  console.log('📤 Emitting event:', event, data);
  socket.emit(event, data);
  return true;
}

/**
 * Clean up socket connection
 */
export function cleanupSocket() {
  console.log('🧹 Cleaning up socket connection...');
  
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  
  isConnected = false;
  reconnectAttempts = 0;
  
  console.log('✅ Socket cleanup complete');
}

/**
 * Get connection status information
 * @returns {object} Connection status
 */
export function getConnectionStatus() {
  return {
    isConnected: isConnected,
    socketConnected: socket && socket.connected,
    reconnectAttempts: reconnectAttempts,
    maxReconnectAttempts: maxReconnectAttempts
  };
}

// Export socket for global access (if needed)
export { socket };

// Global initialization function
if (typeof window !== 'undefined') {
  window.initializeSocketCommunication = initializeSocket;
  window.getSocketCommunication = getSocket;
  window.emitSocketEvent = emitEvent;
}