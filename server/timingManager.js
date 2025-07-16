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
  }

  initialize(gameState) {
    this.gameState = gameState;
    
    // Initialize all players with no cooldown (can move immediately)
    Object.keys(gameState.players).forEach(playerId => {
      this.playerCooldowns[playerId] = {
        cooldownEnd: 0, // Can move immediately
        timer: null
      };
    });
    
    console.log('Cooldown-based timer system initialized - all players can move immediately');
    
    // Broadcast that all players can move
    this.broadcastPlayerStates();
  }

  // Check if player can move (not on cooldown)
  canPlayerMove(playerId) {
    if (!this.playerCooldowns[playerId]) return true;
    return Date.now() >= this.playerCooldowns[playerId].cooldownEnd;
  }

  // Start cooldown after a player makes a move
  startPlayerCooldown(playerId) {
    if (this.isPaused || !playerId) return;

    // Clear any existing cooldown timer
    this.clearPlayerCooldown(playerId);

    const cooldownEndTime = Date.now() + this.moveCooldown;
    
    this.playerCooldowns[playerId] = {
      cooldownEnd: cooldownEndTime,
      timer: setTimeout(() => {
        this.handleCooldownComplete(playerId);
      }, this.moveCooldown)
    };

    // Notify all clients about the cooldown start
    this.io.emit('player-cooldown-started', {
      playerId: playerId,
      cooldownDuration: this.moveCooldown,
      cooldownEndTime: cooldownEndTime
    });

    console.log(`Player ${playerId} on cooldown for ${this.moveCooldown}ms`);
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
    // Check if player can move (not on cooldown)
    if (!this.canPlayerMove(playerId)) {
      const remainingCooldown = this.playerCooldowns[playerId].cooldownEnd - Date.now();
      return { 
        success: false, 
        error: `On cooldown - ${Math.ceil(remainingCooldown / 1000)}s remaining` 
      };
    }

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

    // Start cooldown immediately
    this.startPlayerCooldown(playerId);

    // Execute the move after collision window
    setTimeout(() => {
      this.executePendingMove(playerId);
    }, this.collisionWindow);

    return { success: true, pending: true };
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
    
    console.log(`Player ${playerId} added to cooldown system - can move immediately`);
    
    // Broadcast updated player states
    this.broadcastPlayerStates();
  }

  removePlayer(playerId) {
    // Clear any active cooldown
    this.clearPlayerCooldown(playerId);
    
    // Remove from cooldowns
    delete this.playerCooldowns[playerId];
    
    console.log(`Player ${playerId} removed from cooldown system`);
    
    // Broadcast updated player states
    this.broadcastPlayerStates();
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

    // Clear game timer if it exists
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }

    // Clear cooldowns
    this.playerCooldowns = {};
    this.isPaused = false;

    // Notify all clients that timers are stopped
    this.io.emit('timers-stopped', {
      message: 'All timers stopped due to game end'
    });

    console.log('All timers stopped');
  }
}

module.exports = TimingManager; 