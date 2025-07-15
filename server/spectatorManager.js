class SpectatorManager {
  constructor() {
    this.spectators = new Map(); // gameId -> Set of spectator sockets
    this.gameReplays = new Map(); // gameId -> replay data
    this.activeRecordings = new Map(); // gameId -> recording state
  }

  // Spectator management
  addSpectator(gameId, socket) {
    if (!this.spectators.has(gameId)) {
      this.spectators.set(gameId, new Set());
    }
    this.spectators.get(gameId).add(socket);
    
    // Send current game state to new spectator
    return {
      type: 'spectator_joined',
      gameId,
      spectatorId: socket.id,
      spectatorCount: this.spectators.get(gameId).size
    };
  }

  removeSpectator(gameId, socket) {
    if (this.spectators.has(gameId)) {
      this.spectators.get(gameId).delete(socket);
      
      // Clean up empty spectator sets
      if (this.spectators.get(gameId).size === 0) {
        this.spectators.delete(gameId);
      }
      
      return {
        type: 'spectator_left',
        gameId,
        spectatorId: socket.id,
        spectatorCount: this.spectators.has(gameId) ? this.spectators.get(gameId).size : 0
      };
    }
    return null;
  }

  getSpectators(gameId) {
    return this.spectators.get(gameId) || new Set();
  }

  getSpectatorCount(gameId) {
    return this.spectators.has(gameId) ? this.spectators.get(gameId).size : 0;
  }

  // Broadcast to all spectators of a game
  broadcastToSpectators(gameId, event, data) {
    const spectators = this.getSpectators(gameId);
    spectators.forEach(socket => {
      socket.emit(event, data);
    });
  }

  // Game recording for replays
  startRecording(gameId, gameState) {
    this.activeRecordings.set(gameId, {
      gameId,
      startTime: Date.now(),
      moves: [],
      gameState: this.deepClone(gameState),
      currentTurn: 0,
      players: gameState.players ? Object.keys(gameState.players) : [],
      metadata: {
        created: new Date().toISOString(),
        version: '1.0'
      }
    });
    
    console.log(`Started recording game ${gameId}`);
  }

  recordMove(gameId, moveData) {
    const recording = this.activeRecordings.get(gameId);
    if (recording) {
      recording.moves.push({
        timestamp: Date.now() - recording.startTime,
        turn: recording.currentTurn++,
        ...moveData
      });
    }
  }

  recordBattle(gameId, battleData) {
    const recording = this.activeRecordings.get(gameId);
    if (recording) {
      recording.moves.push({
        timestamp: Date.now() - recording.startTime,
        turn: recording.currentTurn,
        type: 'battle',
        ...battleData
      });
    }
  }

  recordGameEvent(gameId, eventType, eventData) {
    const recording = this.activeRecordings.get(gameId);
    if (recording) {
      recording.moves.push({
        timestamp: Date.now() - recording.startTime,
        turn: recording.currentTurn,
        type: eventType,
        ...eventData
      });
    }
  }

  finishRecording(gameId, finalGameState) {
    const recording = this.activeRecordings.get(gameId);
    if (recording) {
      recording.endTime = Date.now();
      recording.duration = recording.endTime - recording.startTime;
      recording.finalGameState = this.deepClone(finalGameState);
      recording.metadata.finished = new Date().toISOString();
      
      // Save to permanent storage
      this.gameReplays.set(gameId, recording);
      this.activeRecordings.delete(gameId);
      
      console.log(`Finished recording game ${gameId}, duration: ${recording.duration}ms`);
      return recording;
    }
    return null;
  }

  // Replay management
  getReplay(gameId) {
    return this.gameReplays.get(gameId);
  }

  getAllReplays() {
    return Array.from(this.gameReplays.values()).map(replay => ({
      gameId: replay.gameId,
      startTime: replay.startTime,
      endTime: replay.endTime,
      duration: replay.duration,
      players: replay.players,
      moveCount: replay.moves.length,
      metadata: replay.metadata
    }));
  }

  deleteReplay(gameId) {
    return this.gameReplays.delete(gameId);
  }

  // Replay playback utilities
  getReplayStateAtTime(gameId, timestamp) {
    const replay = this.getReplay(gameId);
    if (!replay) return null;

    const relevantMoves = replay.moves.filter(move => move.timestamp <= timestamp);
    
    return {
      gameState: replay.gameState,
      moves: relevantMoves,
      currentMove: relevantMoves.length - 1,
      timestamp,
      totalMoves: replay.moves.length,
      duration: replay.duration
    };
  }

  getReplayStateAtMove(gameId, moveIndex) {
    const replay = this.getReplay(gameId);
    if (!replay || moveIndex >= replay.moves.length) return null;

    const relevantMoves = replay.moves.slice(0, moveIndex + 1);
    const timestamp = replay.moves[moveIndex].timestamp;
    
    return {
      gameState: replay.gameState,
      moves: relevantMoves,
      currentMove: moveIndex,
      timestamp,
      totalMoves: replay.moves.length,
      duration: replay.duration
    };
  }

  // Utility functions
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  }

  // Get active games that can be spectated
  getSpectableGames() {
    return Array.from(this.spectators.keys()).map(gameId => ({
      gameId,
      spectatorCount: this.getSpectatorCount(gameId),
      canSpectate: true
    }));
  }

  // Clean up when a game ends
  cleanupGame(gameId) {
    // Remove spectators
    this.spectators.delete(gameId);
    
    // Finish recording if still active
    if (this.activeRecordings.has(gameId)) {
      this.finishRecording(gameId, null);
    }
  }
}

module.exports = SpectatorManager; 