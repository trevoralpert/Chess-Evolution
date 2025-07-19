class TimingManager {
  constructor(io) {
    this.io = io;
    this.playerCooldowns = {}; // playerId -> { cooldownEnd: timestamp, timer: timeoutId }
    this.gameTimer = null;
    this.isPaused = false;
    this.pauseStartTime = null;
    this.pendingMoves = {}; // playerId -> { move: data, timestamp: number }
    this.collisionWindow = 500; // ms window for collision detection
    this.moveCooldown = 7000; // 7 seconds cooldown per move
    this.gameState = null;
    
    // New real-time system properties
    this.gameStarted = false;
    this.queuedMoves = {}; // playerId -> { pieceId, targetRow, targetCol, timestamp }
    this.playerTimers = {}; // playerId -> { timeRemaining: number, intervalId: intervalId }
    this.firstMovePlayer = null;
  }

  initialize(gameState) {
    this.gameState = gameState;
    
    // Initialize all players with timers at 0 (can move immediately)
    Object.keys(gameState.players).forEach(playerId => {
      this.playerCooldowns[playerId] = {
        cooldownEnd: 0, // Can move immediately
        timer: null
      };
      
      // Initialize player timers at 0 (ready to move)
      this.playerTimers[playerId] = {
        timeRemaining: 0,
        intervalId: null
      };
    });
    
    // Check if game can start (2+ players required)
    const playerCount = Object.keys(gameState.players).length;
    if (playerCount >= 2) {
      this.gameStarted = false; // Game ready but not started until first move
      console.log('Real-time system initialized - ready to begin when first player moves');
      this.io.emit('game-ready-to-begin', {
        message: 'Begin When Ready',
        playersReady: playerCount
      });
    } else {
      console.log('Real-time system initialized - waiting for more players');
      this.io.emit('waiting-for-players', {
        message: 'Waiting for players...',
        playersReady: playerCount,
        playersNeeded: 2
      });
    }
    
    // Broadcast that all players can move
    this.broadcastPlayerStates();
  }

  // Check if player can move (timer must be at 0)
  canPlayerMove(playerId) {
    if (!this.playerTimers[playerId]) return true;
    return this.playerTimers[playerId].timeRemaining === 0;
  }

  // Start timer countdown after a player makes a move
  startPlayerCooldown(playerId) {
    if (this.isPaused || !playerId) return;

    // Clear any existing timer
    this.clearPlayerTimer(playerId);

    // Set timer to full duration (7 seconds)
    this.playerTimers[playerId] = {
      timeRemaining: this.moveCooldown,
      intervalId: null
    };

    // Start countdown interval (update every 100ms for smooth UI)
    this.playerTimers[playerId].intervalId = setInterval(() => {
      this.playerTimers[playerId].timeRemaining -= 100;
      
      // If timer reaches 0, execute queued move (if any) and stop countdown
      if (this.playerTimers[playerId].timeRemaining <= 0) {
        this.playerTimers[playerId].timeRemaining = 0;
        clearInterval(this.playerTimers[playerId].intervalId);
        this.playerTimers[playerId].intervalId = null;
        
        // Execute queued move if exists
        if (this.queuedMoves[playerId]) {
          this.executeQueuedMove(playerId);
        }
        
        // Notify client that timer is at 0
        this.io.emit('player-timer-zero', {
          playerId: playerId
        });
      }
      
      // Broadcast timer update
      this.broadcastTimerUpdate(playerId);
    }, 100);

    // Notify all clients about the timer start
    this.io.emit('player-timer-started', {
      playerId: playerId,
      timerDuration: this.moveCooldown
    });

    console.log(`Player ${playerId} timer started for ${this.moveCooldown}ms`);
  }

  clearPlayerCooldown(playerId) {
    if (this.playerCooldowns[playerId] && this.playerCooldowns[playerId].timer) {
      clearTimeout(this.playerCooldowns[playerId].timer);
      this.playerCooldowns[playerId] = {
        cooldownEnd: 0,
        timer: null
      };
    }
  }

  handleCooldownComplete(playerId) {
    if (this.playerCooldowns[playerId]) {
      this.playerCooldowns[playerId].cooldownEnd = 0;
      this.playerCooldowns[playerId].timer = null;
    }

    // Notify client that player can move again
    this.io.emit('player-cooldown-ended', {
      playerId: playerId
    });

    console.log(`Player ${playerId} cooldown complete - can move again`);
  }

  pauseAllCooldowns() {
    if (this.isPaused) return;

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    // Pause all active cooldowns
    Object.keys(this.playerCooldowns).forEach(playerId => {
      const cooldown = this.playerCooldowns[playerId];
      if (cooldown.timer) {
        clearTimeout(cooldown.timer);
        // Extend cooldown end time by pause duration (will be calculated on resume)
      }
    });

    this.io.emit('cooldowns-paused', {
      pauseTime: this.pauseStartTime
    });

    console.log('All cooldowns paused');
  }

  resumeAllCooldowns() {
    if (!this.isPaused) return;

    this.isPaused = false;
    const pauseDuration = Date.now() - this.pauseStartTime;

    // Resume all cooldowns with extended time
    Object.keys(this.playerCooldowns).forEach(playerId => {
      const cooldown = this.playerCooldowns[playerId];
      if (cooldown.cooldownEnd > 0) {
        // Extend cooldown end time by pause duration
        cooldown.cooldownEnd += pauseDuration;
        
        const remainingTime = cooldown.cooldownEnd - Date.now();
        if (remainingTime > 0) {
          cooldown.timer = setTimeout(() => {
            this.handleCooldownComplete(playerId);
          }, remainingTime);
        } else {
          // Cooldown should have ended during pause
          this.handleCooldownComplete(playerId);
        }
      }
    });

    this.io.emit('cooldowns-resumed', {
      pauseDuration: pauseDuration
    });

    console.log(`All cooldowns resumed after ${pauseDuration}ms pause`);
  }

  // Broadcast current state of all players (can move or on cooldown)
  broadcastPlayerStates() {
    const playerStates = {};
    Object.keys(this.playerCooldowns).forEach(playerId => {
      playerStates[playerId] = {
        canMove: this.canPlayerMove(playerId),
        cooldownEnd: this.playerCooldowns[playerId].cooldownEnd
      };
    });

    this.io.emit('player-states-updated', {
      playerStates: playerStates
    });
  }

  // No longer needed - cooldown system doesn't use turns
  // Players can move whenever they're not on cooldown

  registerMove(playerId, moveData) {
    // Check if we need at least 2 players for game to start
    if (!this.gameState || !this.gameState.players) {
      return { 
        success: false, 
        error: 'Game not initialized' 
      };
    }
    
    const playerCount = Object.keys(this.gameState.players).length;
    if (playerCount < 2) {
      return { 
        success: false, 
        error: 'Waiting for more players to join' 
      };
    }

    // Check if player can move immediately (timer at 0)
    if (this.canPlayerMove(playerId)) {
      // Handle first move detection
      this.handleFirstMove(playerId);
      
      // Execute move immediately
      const timestamp = Date.now();
      
      // Check for collisions with recent moves
      const collision = this.checkCollision(moveData, timestamp);
      if (collision) {
        return { success: false, collision: true, conflictingMove: collision };
      }

      // Register the move
      this.pendingMoves[playerId] = {
        move: moveData,
        timestamp: timestamp
      };

      // Start timer countdown immediately
      this.startPlayerCooldown(playerId);

      // Execute the move after collision window
      setTimeout(() => {
        this.executePendingMove(playerId);
      }, this.collisionWindow);

      return { success: true, pending: true, immediate: true };
    } else {
      // Timer is counting down - try to queue the move
      const queueResult = this.queueMove(playerId, moveData);
      if (queueResult) {
        return { 
          success: true, 
          queued: true, 
          message: 'Move queued - will execute when timer reaches 0',
          timeRemaining: this.playerTimers[playerId].timeRemaining
        };
      } else {
        return { 
          success: false, 
          error: 'Cannot queue move - timer must be counting down' 
        };
      }
    }
  }

  checkCollision(moveData, timestamp) {
    // Check if any other player is trying to move to the same position
    for (const [playerId, pendingMove] of Object.entries(this.pendingMoves)) {
      if (Math.abs(timestamp - pendingMove.timestamp) <= this.collisionWindow) {
        // Check if moves conflict (same target position)
        if (moveData.targetRow === pendingMove.move.targetRow &&
            moveData.targetCol === pendingMove.move.targetCol) {
          return pendingMove;
        }
      }
    }
    return null;
  }

  executePendingMove(playerId) {
    const pendingMove = this.pendingMoves[playerId];
    if (!pendingMove) return;

    // Remove from pending moves
    delete this.pendingMoves[playerId];

    // Execute the move directly through the callback
    if (this.moveExecutor) {
      this.moveExecutor(playerId, pendingMove.move);
    }

    // Start cooldown for this player (no turns in cooldown-based system)
    this.startPlayerCooldown(playerId);
  }

  setMoveExecutor(executor) {
    this.moveExecutor = executor;
  }

  // No longer needed - all players can move when not on cooldown

  removePlayer(playerId) {
    // Clear any timers for this player
    this.clearPlayerTimer(playerId);
    
    // Remove from pending moves
    delete this.pendingMoves[playerId];
    
    // Remove from cooldown system
    if (this.playerCooldowns[playerId]) {
      if (this.playerCooldowns[playerId].timer) {
        clearTimeout(this.playerCooldowns[playerId].timer);
      }
      delete this.playerCooldowns[playerId];
    }
  }

  addPlayer(playerId) {
    // Initialize cooldown for new player (can move immediately)
    this.playerCooldowns[playerId] = {
      cooldownEnd: 0,
      timer: null
    };
    
    // Initialize timer for new player (can move immediately)
    this.playerTimers[playerId] = {
      timeRemaining: 0,
      intervalId: null
    };
    
    console.log(`Player ${playerId} added to real-time system - can move immediately`);
    
    // Check if game can start now (2+ players required)
    if (this.gameState && this.gameState.players) {
      const playerCount = Object.keys(this.gameState.players).length;
      if (playerCount >= 2 && !this.gameStarted) {
        this.io.emit('game-ready-to-begin', {
          message: 'Begin When Ready',
          playersReady: playerCount
        });
      }
    }
    
    // Broadcast updated player states
    this.broadcastPlayerStates();
  }

  removePlayer(playerId) {
    // Clear any active cooldown
    this.clearPlayerCooldown(playerId);
    
    // Clear any active timer
    this.clearPlayerTimer(playerId);
    
    // Remove from cooldowns and timers
    delete this.playerCooldowns[playerId];
    delete this.playerTimers[playerId];
    delete this.queuedMoves[playerId];
    
    console.log(`Player ${playerId} removed from real-time system`);
    
    // Check if we need to update game start status (only if gameState exists)
    if (this.gameState && this.gameState.players) {
      const playerCount = Object.keys(this.gameState.players).length;
      if (playerCount < 2) {
        this.io.emit('waiting-for-players', {
          message: 'Waiting for players...',
          playersReady: playerCount,
          playersNeeded: 2
        });
      }
      
      // Broadcast updated player states
      this.broadcastPlayerStates();
    }
  }

  getPlayerCooldown(playerId) {
    return this.playerCooldowns[playerId];
  }

  getGameState() {
    return {
      isPaused: this.isPaused,
      playerCooldowns: this.playerCooldowns,
      pendingMoves: Object.keys(this.pendingMoves)
    };
  }

  stopAllTimers() {
    // Clear all player cooldowns
    Object.keys(this.playerCooldowns).forEach(playerId => {
      this.clearPlayerCooldown(playerId);
    });

    // Clear all player timers
    Object.keys(this.playerTimers).forEach(playerId => {
      this.clearPlayerTimer(playerId);
    });

    // Clear game timer if it exists
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }

    // Clear cooldowns and timers
    this.playerCooldowns = {};
    this.playerTimers = {};
    this.queuedMoves = {};
    this.isPaused = false;

    // Notify all clients that timers are stopped
    this.io.emit('timers-stopped', {
      message: 'All timers stopped due to game end'
    });

    console.log('All timers stopped');
  }

  // New methods for real-time system
  clearPlayerTimer(playerId) {
    if (this.playerTimers[playerId] && this.playerTimers[playerId].intervalId) {
      clearInterval(this.playerTimers[playerId].intervalId);
      this.playerTimers[playerId] = {
        timeRemaining: 0,
        intervalId: null
      };
    }
  }

  executeQueuedMove(playerId) {
    const queuedMove = this.queuedMoves[playerId];
    if (!queuedMove) return;

    // Remove from queued moves
    delete this.queuedMoves[playerId];

    // Execute the move through the callback
    if (this.moveExecutor) {
      this.moveExecutor(playerId, {
        pieceId: queuedMove.pieceId,
        targetRow: queuedMove.targetRow,
        targetCol: queuedMove.targetCol
      });
    }

    console.log(`Executed queued move for player ${playerId}`);
  }

  broadcastTimerUpdate(playerId) {
    if (this.playerTimers[playerId]) {
      this.io.emit('player-timer-update', {
        playerId: playerId,
        timeRemaining: this.playerTimers[playerId].timeRemaining
      });
    }
  }

  queueMove(playerId, moveData) {
    // Can only queue if timer is not at 0
    if (this.playerTimers[playerId] && this.playerTimers[playerId].timeRemaining > 0) {
      this.queuedMoves[playerId] = {
        pieceId: moveData.pieceId,
        targetRow: moveData.targetRow,
        targetCol: moveData.targetCol,
        timestamp: Date.now()
      };

      // Notify client that move is queued
      this.io.emit('move-queued', {
        playerId: playerId,
        moveData: moveData
      });

      console.log(`Move queued for player ${playerId}`);
      return true;
    }
    return false;
  }

  cancelQueuedMove(playerId) {
    if (this.queuedMoves[playerId]) {
      delete this.queuedMoves[playerId];
      
      // Notify client that move is cancelled
      this.io.emit('move-cancelled', {
        playerId: playerId
      });

      console.log(`Queued move cancelled for player ${playerId}`);
      return true;
    }
    return false;
  }

  handleFirstMove(playerId) {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.firstMovePlayer = playerId;
      
      // Notify all clients that game has started
      const playerName = this.gameState?.players?.[playerId]?.name || playerId;
      this.io.emit('game-started-first-move', {
        message: `Player ${playerName} has begun moving`,
        startingPlayer: playerId
      });

      console.log(`Game started by first move from player ${playerId}`);
    }
  }

  getQueuedMove(playerId) {
    return this.queuedMoves[playerId] || null;
  }

  getPlayerTimer(playerId) {
    return this.playerTimers[playerId] || null;
  }
}

module.exports = TimingManager; 