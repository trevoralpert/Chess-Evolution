class TimingManager {
  constructor(io) {
    this.io = io;
    this.playerTimers = {}; // playerId -> { timer: timeoutId, startTime: timestamp, remainingTime: ms }
    this.gameTimer = null;
    this.isPaused = false;
    this.pauseStartTime = null;
    this.pendingMoves = {}; // playerId -> { move: data, timestamp: number }
    this.collisionWindow = 500; // ms window for collision detection
    this.moveTimeout = 7000; // 7 seconds per move
    this.currentActivePlayer = null;
    this.turnQueue = [];
    this.gameState = null;
  }

  initialize(gameState) {
    this.gameState = gameState;
    this.turnQueue = Object.keys(gameState.players);
    this.currentActivePlayer = this.turnQueue[0];
    this.startPlayerTimer(this.currentActivePlayer);
  }

  startPlayerTimer(playerId) {
    if (this.isPaused || !playerId) return;

    // Clear any existing timer
    this.clearPlayerTimer(playerId);

    const startTime = Date.now();
    this.playerTimers[playerId] = {
      startTime: startTime,
      remainingTime: this.moveTimeout,
      timer: setTimeout(() => {
        this.handleTimeout(playerId);
      }, this.moveTimeout)
    };

    // Notify all clients about the timer start
    this.io.emit('timer-started', {
      playerId: playerId,
      timeLimit: this.moveTimeout,
      startTime: startTime
    });

    console.log(`Timer started for player ${playerId}: ${this.moveTimeout}ms`);
  }

  clearPlayerTimer(playerId) {
    if (this.playerTimers[playerId]) {
      clearTimeout(this.playerTimers[playerId].timer);
      delete this.playerTimers[playerId];
    }
  }

  pauseAllTimers() {
    if (this.isPaused) return;

    this.isPaused = true;
    this.pauseStartTime = Date.now();

    // Pause all active timers
    Object.keys(this.playerTimers).forEach(playerId => {
      const timer = this.playerTimers[playerId];
      if (timer.timer) {
        clearTimeout(timer.timer);
        // Calculate remaining time
        const elapsed = Date.now() - timer.startTime;
        timer.remainingTime = Math.max(0, timer.remainingTime - elapsed);
      }
    });

    this.io.emit('timers-paused', {
      pauseTime: this.pauseStartTime
    });

    console.log('All timers paused');
  }

  resumeAllTimers() {
    if (!this.isPaused) return;

    this.isPaused = false;
    const pauseDuration = Date.now() - this.pauseStartTime;

    // Resume all timers with remaining time
    Object.keys(this.playerTimers).forEach(playerId => {
      const timer = this.playerTimers[playerId];
      if (timer.remainingTime > 0) {
        timer.startTime = Date.now();
        timer.timer = setTimeout(() => {
          this.handleTimeout(playerId);
        }, timer.remainingTime);
      }
    });

    this.io.emit('timers-resumed', {
      pauseDuration: pauseDuration
    });

    console.log(`All timers resumed after ${pauseDuration}ms pause`);
  }

  handleTimeout(playerId) {
    console.log(`Player ${playerId} timed out!`);
    
    // Clear the timer
    this.clearPlayerTimer(playerId);

    // Notify all clients
    this.io.emit('player-timeout', {
      playerId: playerId,
      message: 'Player timed out - turn skipped'
    });

    // Move to next player
    this.nextTurn();
  }

  nextTurn() {
    if (this.turnQueue.length === 0) return;

    // Find next active player
    const currentIndex = this.turnQueue.indexOf(this.currentActivePlayer);
    let nextIndex = (currentIndex + 1) % this.turnQueue.length;
    let attempts = 0;

    // Skip disconnected players
    while (attempts < this.turnQueue.length) {
      const nextPlayerId = this.turnQueue[nextIndex];
      if (this.gameState.players[nextPlayerId]) {
        this.currentActivePlayer = nextPlayerId;
        this.startPlayerTimer(nextPlayerId);
        
        this.io.emit('turn-changed', {
          activePlayer: nextPlayerId,
          playerName: this.gameState.players[nextPlayerId].name
        });
        return;
      }
      nextIndex = (nextIndex + 1) % this.turnQueue.length;
      attempts++;
    }

    console.log('No active players found for next turn');
  }

  registerMove(playerId, moveData) {
    if (!this.isActivePlayer(playerId)) {
      return { success: false, error: 'Not your turn' };
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

    // Clear the player's timer
    this.clearPlayerTimer(playerId);

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

    // Move to next turn
    this.nextTurn();
  }

  setMoveExecutor(executor) {
    this.moveExecutor = executor;
  }

  isActivePlayer(playerId) {
    return this.currentActivePlayer === playerId;
  }

  removePlayer(playerId) {
    // Clear any timers for this player
    this.clearPlayerTimer(playerId);
    
    // Remove from pending moves
    delete this.pendingMoves[playerId];
    
    // Remove from turn queue
    const index = this.turnQueue.indexOf(playerId);
    if (index > -1) {
      this.turnQueue.splice(index, 1);
    }

    // If this was the active player, move to next
    if (this.currentActivePlayer === playerId) {
      this.nextTurn();
    }
  }

  addPlayer(playerId) {
    if (!this.turnQueue.includes(playerId)) {
      this.turnQueue.push(playerId);
    }
  }

  getCurrentActivePlayer() {
    return this.currentActivePlayer;
  }

  getPlayerTimer(playerId) {
    return this.playerTimers[playerId];
  }

  getGameState() {
    return {
      activePlayer: this.currentActivePlayer,
      isPaused: this.isPaused,
      turnQueue: this.turnQueue,
      pendingMoves: Object.keys(this.pendingMoves)
    };
  }
}

module.exports = TimingManager; 