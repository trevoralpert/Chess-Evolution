const { PIECE_TYPES, MOVEMENT_PATTERNS } = require('./pieceTypes');
const { GAME_CONFIG, GridUtils } = require('./gameConfig');

// AI Difficulty Levels
const AI_DIFFICULTY = {
  EASY: {
    name: 'Easy',
    thinkingTime: 500,
    lookAhead: 1,
    randomness: 0.3,
    aggressiveness: 0.2,
    evolutionFocus: 0.1,
    description: 'Makes simple moves with some randomness'
  },
  MEDIUM: {
    name: 'Medium', 
    thinkingTime: 1000,
    lookAhead: 2,
    randomness: 0.15,
    aggressiveness: 0.4,
    evolutionFocus: 0.3,
    description: 'Balanced strategy with moderate planning'
  },
  HARD: {
    name: 'Hard',
    thinkingTime: 1500,
    lookAhead: 3,
    randomness: 0.05,
    aggressiveness: 0.6,
    evolutionFocus: 0.5,
    description: 'Strategic planning with good piece coordination'
  },
  EXPERT: {
    name: 'Expert',
    thinkingTime: 2000,
    lookAhead: 4,
    randomness: 0.02,
    aggressiveness: 0.8,
    evolutionFocus: 0.7,
    description: 'Advanced strategy with deep analysis'
  }
};

class AIManager {
  constructor() {
    this.aiPlayers = new Map(); // playerId -> AI config
    this.aiMoveQueue = new Map(); // playerId -> pending moves
    this.aiThinkingTimeout = new Map(); // playerId -> timeout
  }

  // Register an AI player
  addAIPlayer(playerId, difficulty = 'MEDIUM', personality = {}) {
    const aiConfig = {
      ...AI_DIFFICULTY[difficulty],
      playerId,
      difficulty,
      personality: {
        preferredPieces: personality.preferredPieces || ['QUEEN', 'ROOK', 'BISHOP'],
        playStyle: personality.playStyle || 'balanced', // 'aggressive', 'defensive', 'balanced'
        riskTolerance: personality.riskTolerance || 0.5,
        ...personality
      },
      stats: {
        movesPlayed: 0,
        battlesWon: 0,
        battlesLost: 0,
        piecesEvolved: 0,
        averageThinkTime: 0
      }
    };

    this.aiPlayers.set(playerId, aiConfig);
    console.log(`AI player ${playerId} registered with difficulty: ${difficulty}`);
    return aiConfig;
  }

  // Remove an AI player
  removeAIPlayer(playerId) {
    this.aiPlayers.delete(playerId);
    this.aiMoveQueue.delete(playerId);
    
    // Clear any pending thinking timeout
    if (this.aiThinkingTimeout.has(playerId)) {
      clearTimeout(this.aiThinkingTimeout.get(playerId));
      this.aiThinkingTimeout.delete(playerId);
    }
    
    console.log(`AI player ${playerId} removed`);
  }

  // Check if a player is AI
  isAIPlayer(playerId) {
    return this.aiPlayers.has(playerId);
  }

  // Get AI configuration
  getAIConfig(playerId) {
    return this.aiPlayers.get(playerId);
  }

  // Main AI decision making function
  async makeAIMove(playerId, gameState, getValidMoves, handlePieceMove, handlePieceSplit) {
    const aiConfig = this.aiPlayers.get(playerId);
    if (!aiConfig) {
      console.log(`No AI config found for player ${playerId}`);
      return null;
    }

    const startTime = Date.now();
    
    // Simulate thinking time
    await new Promise(resolve => {
      this.aiThinkingTimeout.set(playerId, setTimeout(resolve, aiConfig.thinkingTime));
    });

    // Analyze current game state
    const analysis = this.analyzeGameState(gameState, playerId, aiConfig);
    
    // Get all possible moves for AI's pieces
    const allMoves = this.getAllPossibleMoves(gameState, playerId, getValidMoves);
    
    if (allMoves.length === 0) {
      console.log(`No moves available for AI player ${playerId}`);
      return null;
    }

    // Score and rank moves
    const scoredMoves = this.scoreMoves(allMoves, gameState, playerId, aiConfig, analysis);
    
    // Select best move with some randomness based on difficulty
    const selectedMove = this.selectMove(scoredMoves, aiConfig);
    
    // Execute the selected move
    const moveResult = await this.executeAIMove(selectedMove, handlePieceMove, handlePieceSplit);
    
    // Update AI stats
    const thinkTime = Date.now() - startTime;
    this.updateAIStats(playerId, thinkTime, moveResult);
    
    console.log(`AI ${playerId} (${aiConfig.difficulty}) selected move: ${selectedMove.description} (score: ${selectedMove.score})`);
    
    return moveResult;
  }

  // Analyze the current game state
  analyzeGameState(gameState, playerId, aiConfig) {
    const analysis = {
      myPieces: [],
      enemyPieces: [],
      threats: [],
      opportunities: [],
      boardControl: 0,
      evolutionPotential: 0,
      gamePhase: 'opening' // opening, middle, endgame
    };

    // Count pieces and analyze positions
    let totalPieces = 0;
    let myPieceCount = 0;
    let enemyPieceCount = 0;

    Object.values(gameState.pieces).forEach(piece => {
      totalPieces++;
      if (piece.playerId === playerId) {
        myPieceCount++;
        analysis.myPieces.push(piece);
        
        // Check evolution potential
        if (piece.evolutionPoints && piece.evolutionPoints > 0) {
          analysis.evolutionPotential += piece.evolutionPoints;
        }
      } else {
        enemyPieceCount++;
        analysis.enemyPieces.push(piece);
      }
    });

    // Determine game phase
    if (totalPieces > 50) {
      analysis.gamePhase = 'opening';
    } else if (totalPieces > 20) {
      analysis.gamePhase = 'middle';
    } else {
      analysis.gamePhase = 'endgame';
    }

    // Calculate board control (simplified)
    analysis.boardControl = myPieceCount / (myPieceCount + enemyPieceCount);

    // Find threats and opportunities
    analysis.threats = this.findThreats(analysis.myPieces, analysis.enemyPieces, gameState);
    analysis.opportunities = this.findOpportunities(analysis.myPieces, analysis.enemyPieces, gameState);

    return analysis;
  }

  // Find threats to AI pieces
  findThreats(myPieces, enemyPieces, gameState) {
    const threats = [];
    
    myPieces.forEach(myPiece => {
      enemyPieces.forEach(enemyPiece => {
        const distance = this.calculateDistance(myPiece, enemyPiece);
        if (distance <= 3) { // Within threat range
          threats.push({
            threatened: myPiece,
            threatener: enemyPiece,
            distance,
            severity: this.calculateThreatSeverity(myPiece, enemyPiece)
          });
        }
      });
    });

    return threats.sort((a, b) => b.severity - a.severity);
  }

  // Find opportunities for AI pieces
  findOpportunities(myPieces, enemyPieces, gameState) {
    const opportunities = [];
    
    myPieces.forEach(myPiece => {
      enemyPieces.forEach(enemyPiece => {
        const distance = this.calculateDistance(myPiece, enemyPiece);
        if (distance <= 4) { // Within opportunity range
          opportunities.push({
            attacker: myPiece,
            target: enemyPiece,
            distance,
            value: this.calculateOpportunityValue(myPiece, enemyPiece)
          });
        }
      });
    });

    return opportunities.sort((a, b) => b.value - a.value);
  }

  // Calculate distance between two pieces
  calculateDistance(piece1, piece2) {
    const rowDiff = Math.abs(piece1.row - piece2.row);
    const colDiff = Math.min(
      Math.abs(piece1.col - piece2.col),
      GAME_CONFIG.GRID_COLS - Math.abs(piece1.col - piece2.col)
    );
    return Math.max(rowDiff, colDiff);
  }

  // Calculate threat severity
  calculateThreatSeverity(myPiece, enemyPiece) {
    const valueDiff = enemyPiece.value - myPiece.value;
    const distance = this.calculateDistance(myPiece, enemyPiece);
    return valueDiff + (4 - distance) * 0.1;
  }

  // Calculate opportunity value
  calculateOpportunityValue(myPiece, enemyPiece) {
    const valueDiff = enemyPiece.value - myPiece.value;
    const distance = this.calculateDistance(myPiece, enemyPiece);
    return valueDiff + (4 - distance) * 0.1;
  }

  // Get all possible moves for AI player
  getAllPossibleMoves(gameState, playerId, getValidMoves) {
    const allMoves = [];
    const player = gameState.players[playerId];
    
    if (!player) return allMoves;

    player.pieces.forEach(pieceId => {
      const piece = gameState.pieces[pieceId];
      if (!piece) return;

      const validMoves = getValidMoves(pieceId);
      
      validMoves.forEach(move => {
        allMoves.push({
          pieceId,
          piece,
          move,
          type: move.type || 'move',
          targetRow: move.row,
          targetCol: move.col
        });
      });
    });

    return allMoves;
  }

  // Score all possible moves
  scoreMoves(moves, gameState, playerId, aiConfig, analysis) {
    return moves.map(moveOption => {
      const score = this.calculateMoveScore(moveOption, gameState, playerId, aiConfig, analysis);
      return {
        ...moveOption,
        score,
        description: this.getMoveDescription(moveOption)
      };
    }).sort((a, b) => b.score - a.score);
  }

  // Calculate score for a specific move
  calculateMoveScore(moveOption, gameState, playerId, aiConfig, analysis) {
    let score = 0;
    const { piece, move, type } = moveOption;

    // Base positional score
    score += this.getPositionalScore(piece, move, gameState, aiConfig);

    // Piece-specific scoring
    score += this.getPieceTypeScore(piece, move, gameState, aiConfig);

    // Tactical scoring
    if (type === 'attack' || type === 'battle') {
      score += this.getTacticalScore(piece, move, gameState, aiConfig);
    }

    // Jump capture scoring
    if (type === 'jump-capture' || type === 'multi-jump-capture') {
      score += this.getJumpCaptureScore(piece, move, gameState, aiConfig);
    }

    // Split scoring
    if (type === 'split') {
      score += this.getSplitScore(piece, move, gameState, aiConfig);
    }

    // Dual movement scoring (Hybrid Queen)
    if (type === 'dual-move-queen' || type === 'dual-move-jumper') {
      score += this.getDualMovementScore(piece, move, gameState, aiConfig);
    }

    // Strategic considerations
    score += this.getStrategicScore(piece, move, gameState, aiConfig, analysis);

    // Evolution considerations
    score += this.getEvolutionScore(piece, move, gameState, aiConfig);

    // Safety considerations
    score += this.getSafetyScore(piece, move, gameState, aiConfig);

    return score;
  }

  // Get positional score for a move
  getPositionalScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Center control bonus
    const centerRow = Math.floor(GAME_CONFIG.GRID_ROWS / 2);
    const rowDistanceFromCenter = Math.abs(move.row - centerRow);
    score += (10 - rowDistanceFromCenter) * 0.1;

    // Equator bonus for pawns
    if (piece.type === 'PAWN' && move.row === 10) {
      score += 5;
    }

    // Pole proximity for circumnavigation
    if (piece.type === 'PAWN' || piece.type === 'SPLITTER') {
      if (move.row === 0 || move.row === GAME_CONFIG.GRID_ROWS - 1) {
        score += 8; // Circumnavigation bonus
      }
    }

    return score;
  }

  // Get piece-type specific score
  getPieceTypeScore(piece, move, gameState, aiConfig) {
    const pieceType = PIECE_TYPES[piece.type];
    let score = 0;

    // Prefer using higher-value pieces based on AI personality
    if (aiConfig.personality.preferredPieces.includes(piece.type)) {
      score += 1;
    }

    // King safety
    if (piece.type === 'KING') {
      score -= 3; // Generally avoid moving king unless necessary
    }

    // Advanced piece utilization
    if (['HYBRID_QUEEN', 'SUPER_JUMPER', 'HYPER_JUMPER', 'MISTRESS_JUMPER'].includes(piece.type)) {
      score += 2; // Prioritize using evolved pieces
    }

    return score;
  }

  // Get tactical score for attacks
  getTacticalScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Check what we're attacking
    const targetPosKey = GridUtils.getPositionKey(move.row, move.col);
    const targetPieceId = gameState.grid[targetPosKey];
    
    if (targetPieceId) {
      const targetPiece = gameState.pieces[targetPieceId];
      if (targetPiece && targetPiece.playerId !== piece.playerId) {
        // Value difference
        const valueDiff = targetPiece.value - piece.value;
        score += valueDiff * 2;
        
        // King capture is highest priority
        if (targetPiece.type === 'KING') {
          score += 1000;
        }
        
        // Aggressiveness factor
        score += aiConfig.aggressiveness * 3;
      }
    }

    return score;
  }

  // Get jump capture score
  getJumpCaptureScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Multi-capture bonus
    if (move.type === 'multi-jump-capture') {
      const captureCount = move.capturedPieceIds ? move.capturedPieceIds.length : 1;
      score += captureCount * 5;
    } else {
      score += 8; // Single jump capture
    }

    return score;
  }

  // Get split score
  getSplitScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Evolution cost consideration
    if (piece.evolutionPoints >= 2) {
      score += 3;
    } else {
      score -= 5; // Don't split if we don't have points
    }

    // Population consideration
    const player = gameState.players[piece.playerId];
    const splitterCount = player.pieces.filter(pieceId => 
      gameState.pieces[pieceId] && gameState.pieces[pieceId].type === 'SPLITTER'
    ).length;
    
    if (splitterCount >= 3) {
      score -= 10; // At population limit
    }

    return score;
  }

  // Get dual movement score
  getDualMovementScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Prefer jumper mode for captures
    if (move.mode === 'jumper' && (move.multiCapture || move.capture)) {
      score += 6;
    }
    
    // Prefer queen mode for positioning
    if (move.mode === 'queen' && !move.capture) {
      score += 2;
    }

    return score;
  }

  // Get strategic score
  getStrategicScore(piece, move, gameState, aiConfig, analysis) {
    let score = 0;
    
    // Game phase adjustments
    if (analysis.gamePhase === 'opening') {
      // Develop pieces
      score += 1;
    } else if (analysis.gamePhase === 'endgame') {
      // King activity
      if (piece.type === 'KING') {
        score += 2;
      }
    }

    // Threat response
    const threat = analysis.threats.find(t => t.threatened.id === piece.id);
    if (threat) {
      score += 4; // Move threatened pieces
    }

    return score;
  }

  // Get evolution score
  getEvolutionScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Evolution potential
    if (piece.evolutionPoints > 0) {
      score += piece.evolutionPoints * aiConfig.evolutionFocus;
    }

    // Moves that might lead to evolution
    if (move.type === 'attack' || move.type === 'jump-capture') {
      score += aiConfig.evolutionFocus * 2;
    }

    return score;
  }

  // Get safety score
  getSafetyScore(piece, move, gameState, aiConfig) {
    let score = 0;
    
    // Check if move puts piece in danger
    // This is a simplified safety check
    const dangerLevel = this.calculateMoveDanger(piece, move, gameState);
    score -= dangerLevel * (1 - aiConfig.personality.riskTolerance);

    return score;
  }

  // Calculate danger level of a move
  calculateMoveDanger(piece, move, gameState) {
    let danger = 0;
    
    // Check if enemy pieces can attack this position
    Object.values(gameState.pieces).forEach(enemyPiece => {
      if (enemyPiece.playerId !== piece.playerId) {
        const distance = this.calculateDistance(
          { row: move.row, col: move.col },
          enemyPiece
        );
        if (distance <= 2) {
          danger += enemyPiece.value * 0.1;
        }
      }
    });

    return danger;
  }

  // Select move with randomness based on difficulty
  selectMove(scoredMoves, aiConfig) {
    if (scoredMoves.length === 0) return null;

    const randomness = aiConfig.randomness;
    
    if (Math.random() < randomness) {
      // Random selection from top moves
      const topMovesCount = Math.min(5, scoredMoves.length);
      const randomIndex = Math.floor(Math.random() * topMovesCount);
      return scoredMoves[randomIndex];
    } else {
      // Select best move
      return scoredMoves[0];
    }
  }

  // Execute the selected AI move
  async executeAIMove(selectedMove, handlePieceMove, handlePieceSplit) {
    if (!selectedMove) return null;

    const { pieceId, targetRow, targetCol, type } = selectedMove;

    try {
      if (type === 'split') {
        return await handlePieceSplit(selectedMove.piece.playerId, {
          pieceId,
          targetRow,
          targetCol
        });
      } else {
        return await handlePieceMove(selectedMove.piece.playerId, {
          pieceId,
          targetRow,
          targetCol
        });
      }
    } catch (error) {
      console.error(`AI move execution error:`, error);
      return null;
    }
  }

  // Get move description
  getMoveDescription(moveOption) {
    const { piece, move, type } = moveOption;
    const pieceSymbol = piece.symbol || piece.type;
    
    switch (type) {
      case 'attack':
        return `${pieceSymbol} attacks (${move.row}, ${move.col})`;
      case 'jump-capture':
        return `${pieceSymbol} jumps to capture at (${move.row}, ${move.col})`;
      case 'multi-jump-capture':
        return `${pieceSymbol} multi-captures at (${move.row}, ${move.col})`;
      case 'split':
        return `${pieceSymbol} splits to (${move.row}, ${move.col})`;
      case 'dual-move-queen':
        return `${pieceSymbol} moves as Queen to (${move.row}, ${move.col})`;
      case 'dual-move-jumper':
        return `${pieceSymbol} moves as Jumper to (${move.row}, ${move.col})`;
      default:
        return `${pieceSymbol} moves to (${move.row}, ${move.col})`;
    }
  }

  // Update AI statistics
  updateAIStats(playerId, thinkTime, moveResult) {
    const aiConfig = this.aiPlayers.get(playerId);
    if (!aiConfig) return;

    aiConfig.stats.movesPlayed++;
    aiConfig.stats.averageThinkTime = 
      (aiConfig.stats.averageThinkTime + thinkTime) / 2;

    if (moveResult && moveResult.success) {
      console.log(`AI ${playerId} move successful: ${moveResult.message}`);
    }
  }

  // Get AI player statistics
  getAIStats(playerId) {
    const aiConfig = this.aiPlayers.get(playerId);
    return aiConfig ? aiConfig.stats : null;
  }

  // Get all AI players
  getAllAIPlayers() {
    return Array.from(this.aiPlayers.values());
  }

  // Update AI difficulty
  updateAIDifficulty(playerId, newDifficulty) {
    const aiConfig = this.aiPlayers.get(playerId);
    if (aiConfig && AI_DIFFICULTY[newDifficulty]) {
      Object.assign(aiConfig, AI_DIFFICULTY[newDifficulty]);
      aiConfig.difficulty = newDifficulty;
      console.log(`AI player ${playerId} difficulty updated to ${newDifficulty}`);
      return true;
    }
    return false;
  }

  // Clean up AI player
  cleanup(playerId) {
    this.removeAIPlayer(playerId);
  }
}

module.exports = { AIManager, AI_DIFFICULTY }; 