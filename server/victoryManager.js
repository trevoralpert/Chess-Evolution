class VictoryManager {
  constructor(io, gameState, timingManager = null) {
    this.io = io;
    this.gameState = gameState;
    this.timingManager = timingManager;
    this.victoryConditions = {
      lastPlayerStanding: true,
      territoryControl: true,
      pointThreshold: false,
      timeLimit: false
    };
    this.territoryInfluence = {};
    this.eliminationEffects = {};
    this.gameStartTime = Date.now();
    this.victoryCheckInterval = null;
  }

  initializeVictorySystem() {
    // Initialize territory influence tracking
    this.calculateTerritoryInfluence();
    
    // Start periodic victory checks
    this.victoryCheckInterval = setInterval(() => {
      this.checkVictoryConditions();
    }, 5000); // Check every 5 seconds
    
    console.log('Victory system initialized with territory influence');
  }

  calculateTerritoryInfluence() {
    const GRID_ROWS = 20;
    const GRID_COLS = 8;
    
    // Reset territory influence
    this.territoryInfluence = {};
    
    // Initialize player territories
    Object.keys(this.gameState.players).forEach(playerId => {
      this.territoryInfluence[playerId] = {
        controlledSquares: 0,
        pieceCount: 0,
        territoryPercentage: 0,
        strongholds: 0,
        borderControl: 0,
        centerControl: 0,
        powerProjection: 0
      };
    });

    // Calculate influence for each grid position
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const influence = this.calculatePositionInfluence(row, col);
        
        // Award territory points based on influence
        Object.keys(influence).forEach(playerId => {
          if (influence[playerId] > 0) {
            this.territoryInfluence[playerId].controlledSquares += influence[playerId];
          }
        });
      }
    }

    // Calculate territory percentages and special bonuses
    const totalSquares = GRID_ROWS * GRID_COLS;
    Object.keys(this.territoryInfluence).forEach(playerId => {
      const territory = this.territoryInfluence[playerId];
      territory.territoryPercentage = (territory.controlledSquares / totalSquares) * 100;
      territory.pieceCount = this.gameState.players[playerId]?.pieces?.length || 0;
      
      // Calculate strongholds (areas with 3+ pieces nearby)
      territory.strongholds = this.calculateStrongholds(playerId);
      
      // Calculate border control (pieces on edges)
      territory.borderControl = this.calculateBorderControl(playerId);
      
      // Calculate center control (pieces in center area)
      territory.centerControl = this.calculateCenterControl(playerId);
      
      // Calculate power projection (reach of pieces)
      territory.powerProjection = this.calculatePowerProjection(playerId);
    });

    // Broadcast territory update
    this.io.emit('territory-update', {
      territoryInfluence: this.territoryInfluence,
      timestamp: Date.now()
    });
  }

  calculatePositionInfluence(row, col) {
    const influence = {};
    const INFLUENCE_RANGE = 3;
    
    // Check all pieces for influence on this position
    Object.values(this.gameState.pieces).forEach(piece => {
      const distance = Math.sqrt(
        Math.pow(piece.row - row, 2) + Math.pow(piece.col - col, 2)
      );
      
      if (distance <= INFLUENCE_RANGE) {
        const pieceInfluence = this.getPieceInfluenceValue(piece) * (1 - distance / INFLUENCE_RANGE);
        influence[piece.playerId] = (influence[piece.playerId] || 0) + pieceInfluence;
      }
    });
    
    return influence;
  }

  getPieceInfluenceValue(piece) {
    const baseInfluence = {
      'PAWN': 1,
      'KNIGHT': 2,
      'BISHOP': 2,
      'ROOK': 3,
      'QUEEN': 4,
      'KING': 5,
      'SPLITTER': 2,
      'JUMPER': 3,
      'SUPER_JUMPER': 4,
      'HYPER_JUMPER': 5,
      'MISTRESS_JUMPER': 6,
      'HYBRID_QUEEN': 7
    };
    
    return baseInfluence[piece.type] || 1;
  }

  calculateStrongholds(playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return 0;
    
    let strongholds = 0;
    const pieces = player.pieces.map(id => this.gameState.pieces[id]).filter(Boolean);
    
    pieces.forEach(piece => {
      const nearbyAllies = pieces.filter(otherPiece => {
        if (otherPiece.id === piece.id) return false;
        const distance = Math.sqrt(
          Math.pow(piece.row - otherPiece.row, 2) + 
          Math.pow(piece.col - otherPiece.col, 2)
        );
        return distance <= 2;
      });
      
      if (nearbyAllies.length >= 2) {
        strongholds++;
      }
    });
    
    return strongholds;
  }

  calculateBorderControl(playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return 0;
    
    const pieces = player.pieces.map(id => this.gameState.pieces[id]).filter(Boolean);
    return pieces.filter(piece => 
      piece.row === 0 || piece.row === 19 || piece.col === 0 || piece.col === 7
    ).length;
  }

  calculateCenterControl(playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return 0;
    
    const pieces = player.pieces.map(id => this.gameState.pieces[id]).filter(Boolean);
    return pieces.filter(piece => 
      piece.row >= 8 && piece.row <= 11 && piece.col >= 2 && piece.col <= 5
    ).length;
  }

  calculatePowerProjection(playerId) {
    const player = this.gameState.players[playerId];
    if (!player) return 0;
    
    const pieces = player.pieces.map(id => this.gameState.pieces[id]).filter(Boolean);
    return pieces.reduce((total, piece) => {
      return total + this.getPieceInfluenceValue(piece);
    }, 0);
  }

  checkVictoryConditions() {
    const players = Object.values(this.gameState.players);
    const alivePlayers = players.filter(p => p.pieces && p.pieces.length > 0);
    
    console.log(`Victory check: ${alivePlayers.length} alive players, ${Object.keys(this.gameState.players).length} total players`);
    
    // Don't check victory conditions if there's only one player and game just started
    // This prevents immediate victory declaration when only one player joins
    if (alivePlayers.length <= 1) {
      // Only declare victory if we had multiple players before (actual game happened)
      // or if the game has been running for some time
      const totalPlayers = Object.keys(this.gameState.players).length;
      const gameTime = this.gameState.gameStartTime ? (Date.now() - this.gameState.gameStartTime) : 0;
      const hasGameStarted = gameTime > 10000; // 10 seconds
      
      console.log(`Single player check: totalPlayers=${totalPlayers}, gameTime=${gameTime}ms, hasGameStarted=${hasGameStarted}`);
      
      if (totalPlayers > 1 || hasGameStarted) {
        console.log(`Declaring victory: totalPlayers > 1 (${totalPlayers > 1}) OR hasGameStarted (${hasGameStarted})`);
        // Last player standing
        if (alivePlayers.length === 1) {
          this.declareVictory(alivePlayers[0], 'last_player_standing');
        } else {
          this.declareVictory(null, 'draw');
        }
      } else {
        console.log(`Not declaring victory: game just started with single player`);
      }
      return;
    }

    // Check territory control victory
    if (this.victoryConditions.territoryControl) {
      const territoryWinner = this.checkTerritoryVictory();
      if (territoryWinner) {
        this.declareVictory(territoryWinner, 'territory_control');
        return;
      }
    }

    // Update territory influence
    this.calculateTerritoryInfluence();
  }

  checkTerritoryVictory() {
    const MIN_TERRITORY_PERCENT = 60;
    const MIN_STRONGHOLDS = 3;
    const MIN_GAME_TIME = 300000; // 5 minutes

    // Only check territory victory after minimum game time
    if (Date.now() - this.gameStartTime < MIN_GAME_TIME) {
      return null;
    }

    const territoryLeader = Object.keys(this.territoryInfluence)
      .map(playerId => ({
        playerId,
        ...this.territoryInfluence[playerId]
      }))
      .sort((a, b) => b.territoryPercentage - a.territoryPercentage)[0];

    if (territoryLeader.territoryPercentage >= MIN_TERRITORY_PERCENT && 
        territoryLeader.strongholds >= MIN_STRONGHOLDS) {
      return this.gameState.players[territoryLeader.playerId];
    }

    return null;
  }

  handlePlayerElimination(playerId, eliminationReason = 'king_captured') {
    const player = this.gameState.players[playerId];
    if (!player) return;

    console.log(`Eliminating player ${playerId} (${player.name}) - Reason: ${eliminationReason}`);

    // Create elimination effects
    this.createEliminationEffects(player, eliminationReason);

    // Remove all pieces belonging to this player with effects
    const playerPieces = [...player.pieces];
    playerPieces.forEach((pieceId, index) => {
      setTimeout(() => {
        const piece = this.gameState.pieces[pieceId];
        if (piece) {
          this.removePieceWithEffect(piece, 'elimination');
        }
      }, index * 100); // Stagger removal for visual effect
    });

    // Mark player as eliminated but don't remove immediately
    player.eliminated = true;
    player.eliminationReason = eliminationReason;
    player.eliminationTime = Date.now();

    // Remove from timing system
    if (global.timingManager) {
      global.timingManager.removePlayer(playerId);
    }

    // Broadcast elimination event with enhanced data
    this.io.emit('player-eliminated', {
      eliminatedPlayerId: playerId,
      playerIndex: player.index,
      playerName: player.name,
      eliminationReason: eliminationReason,
      remainingPlayers: Object.keys(this.gameState.players).filter(id => !this.gameState.players[id].eliminated).length,
      territoryControlled: this.territoryInfluence[playerId]?.territoryPercentage || 0,
      piecesLost: player.pieces.length,
      gameTime: Date.now() - this.gameStartTime
    });

    // Show elimination message to all players
    this.io.emit('elimination-message', {
      message: `${player.name} has been eliminated! (${eliminationReason.replace('_', ' ')})`,
      playerId: playerId,
      playerColor: player.color,
      type: 'elimination'
    });

    // Remove player after effects
    setTimeout(() => {
      delete this.gameState.players[playerId];
      this.gameState.playerCount = Object.keys(this.gameState.players).length;
      
      // Check for victory after elimination
      this.checkVictoryConditions();
    }, 2000);
  }

  createEliminationEffects(player, reason) {
    const effects = {
      playerId: player.id,
      reason: reason,
      color: player.color,
      pieces: player.pieces.map(id => this.gameState.pieces[id]).filter(Boolean),
      startTime: Date.now(),
      duration: 2000
    };

    this.eliminationEffects[player.id] = effects;

    // Broadcast elimination effects
    this.io.emit('elimination-effects', {
      effects: effects,
      message: this.getEliminationMessage(player, reason)
    });
  }

  getEliminationMessage(player, reason) {
    const messages = {
      'king_captured': `${player.name}'s King has been captured!`,
      'no_valid_moves': `${player.name} has no valid moves remaining!`,
      'timeout': `${player.name} has been inactive for too long!`,
      'surrender': `${player.name} has surrendered!`,
      'territory_loss': `${player.name} has lost all territory!`
    };

    return messages[reason] || `${player.name} has been eliminated!`;
  }

  removePieceWithEffect(piece, effectType) {
    // Remove from grid
    const posKey = `${piece.row},${piece.col}`;
    delete this.gameState.grid[posKey];
    
    // Remove from pieces
    delete this.gameState.pieces[piece.id];
    
    // Broadcast piece removal effect
    this.io.emit('piece-removal-effect', {
      pieceId: piece.id,
      position: { row: piece.row, col: piece.col },
      symbol: piece.symbol,
      effectType: effectType
    });

    console.log(`Removed piece ${piece.symbol} at (${piece.row}, ${piece.col}) with ${effectType} effect`);
  }

  declareVictory(victoryPlayer, victoryType) {
    // Stop victory checks
    if (this.victoryCheckInterval) {
      clearInterval(this.victoryCheckInterval);
    }

    // Stop all timers to end the game
    if (this.timingManager) {
      this.timingManager.stopAllTimers();
    }

    if (!victoryPlayer) {
      // Draw condition
      this.io.emit('game-draw', {
        message: 'Game ended in a draw!',
        remainingPlayers: Object.keys(this.gameState.players).length,
        gameTime: Date.now() - this.gameStartTime
      });
      return;
    }

    console.log(`VICTORY! ${victoryPlayer.name} wins by ${victoryType}!`);

    // Calculate game duration
    const gameDuration = (Date.now() - this.gameStartTime) / 1000; // in seconds
    
    // Calculate final territory statistics
    const finalTerritoryStats = this.territoryInfluence[victoryPlayer.id] || {};
    
    // Create victory data
    const victoryData = {
      winnerId: victoryPlayer.id,
      winnerName: victoryPlayer.name,
      playerIndex: victoryPlayer.index,
      winnerColor: victoryPlayer.color,
      victoryType: victoryType,
      gameDuration: gameDuration,
      totalPlayers: Object.keys(this.gameState.players).length + Object.keys(this.eliminationEffects).length,
      territoryControlled: finalTerritoryStats.territoryPercentage || 0,
      piecesRemaining: victoryPlayer.pieces?.length || 0,
      strongholds: finalTerritoryStats.strongholds || 0,
      isInTournament: this.gameState.isInTournament || false,
      tournamentId: this.gameState.tournamentId || null,
      matchId: this.gameState.matchId || null
    };

    // Broadcast victory event
    this.io.emit('game-victory', victoryData);

    // Show victory message
    this.io.emit('victory-message', {
      message: `🎉 ${victoryPlayer.name} wins by ${victoryType.replace('_', ' ')}! 🎉`,
      victoryType: victoryType,
      winnerColor: victoryPlayer.color,
      gameTime: gameDuration
    });

    // Record statistics (this should be handled by the main server)
    this.recordVictoryStatistics(victoryPlayer, victoryType, gameDuration);

    // Check if this is a tournament game
    if (this.gameState.isInTournament) {
      this.handleTournamentVictory(victoryPlayer.id);
    }

    // Optional: Reset game state after victory
    // this.resetGameState();
  }

  recordVictoryStatistics(victoryPlayer, victoryType, gameDuration) {
    // This should be called by the main server's statistics system
    const gameId = this.gameState.gameId || `game_${Date.now()}`;
    const gameMode = this.gameState.gameMode || 'standard';
    
    // Record for all players
    Object.values(this.gameState.players).forEach(player => {
      if (player.eliminated) return; // Skip eliminated players
      
      const result = player.id === victoryPlayer.id ? 'win' : 'loss';
      const finalStats = {
        piecesLost: player.stats?.piecesLost || 0,
        piecesEvolved: player.stats?.piecesEvolved || 0,
        battlesWon: player.stats?.battlesWon || 0,
        battlesLost: player.stats?.battlesLost || 0,
        territoryControlled: this.territoryInfluence[player.id]?.territoryPercentage || 0,
        victoryType: victoryType,
        gameMode: gameMode
      };
      
      // This would be called by the main server
      console.log(`Recording victory stats for ${player.name}: ${result} by ${victoryType}`);
    });
  }

  handleTournamentVictory(winnerId) {
    // This should be handled by the tournament system
    console.log(`Tournament victory for player ${winnerId}`);
  }

  getVictoryStatus() {
    return {
      territoryInfluence: this.territoryInfluence,
      eliminationEffects: this.eliminationEffects,
      gameTime: Date.now() - this.gameStartTime,
      victoryConditions: this.victoryConditions
    };
  }

  cleanup() {
    if (this.victoryCheckInterval) {
      clearInterval(this.victoryCheckInterval);
    }
  }
}

module.exports = VictoryManager; 