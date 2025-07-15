const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { GAME_CONFIG, GridUtils } = require('./gameConfig');
const { PIECE_TYPES, MOVEMENT_PATTERNS, resolveBattle: newResolveBattle, resolveDiceBattle, shouldTriggerContest, getContestTimeLimit, canEvolve, evolvePiece } = require('./pieceTypes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Game state
const gameState = {
  players: {},
  pieces: {}, // pieceId -> piece object
  grid: {}, // positionKey -> pieceId
  playerCount: 0,
  pendingBattles: {} // battleId -> battle info
};

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Check if game is full
  if (gameState.playerCount >= GAME_CONFIG.MAX_PLAYERS) {
    socket.emit('game-full');
    socket.disconnect();
    return;
  }
  
  // Find the next available player slot (reuse slots when players disconnect)
  let playerIndex = 0;
  while (playerIndex < GAME_CONFIG.MAX_PLAYERS && 
         Object.values(gameState.players).some(p => p.index === playerIndex)) {
    playerIndex++;
  }
  
  const spawnArea = GAME_CONFIG.SPAWN_AREAS[playerIndex];
  const player = {
    id: socket.id,
    index: playerIndex,
    color: getPlayerColor(playerIndex),
    spawnArea: spawnArea,
    pieces: []
  };
  
  gameState.players[socket.id] = player;
  gameState.playerCount = Object.keys(gameState.players).length;
  
  // Create starting pieces for the player
  createStartingPieces(player);
  
  // Broadcast updated game state
  broadcastGameState();
  
  socket.on('move-piece', (data) => {
    const result = handlePieceMove(socket.id, data);
    if (result) {
      // Send confirmation back to the client
      socket.emit('move-result', { success: true, message: result.message });
    }
  });
  
  socket.on('split-piece', (data) => {
    const result = handlePieceSplit(socket.id, data);
    if (result) {
      // Send confirmation back to the client
      socket.emit('split-result', { success: true, message: result.message });
    }
  });
  
  socket.on('get-valid-moves', (data) => {
    const validMoves = getValidMoves(data.pieceId);
    socket.emit('valid-moves', { pieceId: data.pieceId, moves: validMoves });
  });
  
  socket.on('contest-response', (data) => {
    handleContestResponse(socket.id, data);
  });



  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove player's pieces from grid
    const player = gameState.players[socket.id];
    if (player) {
      console.log(`Removing ${player.pieces.length} pieces for player ${player.index + 1}`);
      player.pieces.forEach(pieceId => {
        const piece = gameState.pieces[pieceId];
        if (piece) {
          const posKey = GridUtils.getPositionKey(piece.row, piece.col);
          delete gameState.grid[posKey];
          delete gameState.pieces[pieceId];
        }
      });
    }
    
    delete gameState.players[socket.id];
    gameState.playerCount = Object.keys(gameState.players).length;
    
    console.log(`Player count after disconnect: ${gameState.playerCount}`);
    broadcastGameState();
  });
});



function createStartingPieces(player) {
  const { baseRow, baseCol } = player.spawnArea;
  
  console.log(`Creating pieces for Player ${player.index + 1} at spawn area (${baseRow}, ${baseCol})`);
  
  // Create King
  const kingPos = GAME_CONFIG.STARTING_FORMATION.KING;
  const kingRow = baseRow + kingPos.row;
  const kingCol = GridUtils.normalizeCol(baseCol + kingPos.col);
  
  console.log(`King positioned at (${kingRow}, ${kingCol})`);
  
  const king = {
    id: `${player.id}-king`,
    playerId: player.id,
    type: 'KING',
    value: PIECE_TYPES.KING.points,
    symbol: PIECE_TYPES.KING.symbol,
    row: kingRow,
    col: kingCol,
    kills: 0,
    timeAlive: 0
  };
  
  gameState.pieces[king.id] = king;
  gameState.grid[GridUtils.getPositionKey(kingRow, kingCol)] = king.id;
  player.pieces.push(king.id);
  
  // Create Pawns
  GAME_CONFIG.STARTING_FORMATION.PAWNS.forEach((pawnPos, index) => {
    const pawnRow = baseRow + pawnPos.row;
    const pawnCol = GridUtils.normalizeCol(baseCol + pawnPos.col);
    
    const pawn = {
      id: `${player.id}-pawn-${index}`,
      playerId: player.id,
      type: 'PAWN',
      value: PIECE_TYPES.PAWN.points,
      symbol: PIECE_TYPES.PAWN.symbol,
      row: pawnRow,
      col: pawnCol,
      kills: 0,
      timeAlive: 0
    };
    
    gameState.pieces[pawn.id] = pawn;
    gameState.grid[GridUtils.getPositionKey(pawnRow, pawnCol)] = pawn.id;
    player.pieces.push(pawn.id);
  });
}

function handlePieceMove(playerId, moveData) {
  const { pieceId, targetRow, targetCol } = moveData;
  const piece = gameState.pieces[pieceId];
  
  // Validate move
  if (!piece || piece.playerId !== playerId) {
    const errorMsg = `Invalid move: piece ${pieceId} does not belong to player ${playerId}`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('move-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  if (!GridUtils.isValidPosition(targetRow, targetCol)) {
    const errorMsg = `Invalid move: target position (${targetRow}, ${targetCol}) is out of bounds`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('move-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Check if this move is valid according to piece movement rules
  const validMoves = getValidMoves(pieceId);
  const matchingMove = validMoves.find(move => 
    move.row === targetRow && move.col === targetCol
  );
  
  if (!matchingMove) {
    const errorMsg = `Invalid move: (${targetRow}, ${targetCol}) is not a valid move for piece ${pieceId}`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('move-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Handle jump-capture moves
  if (matchingMove.type === 'jump-capture') {
    // Remove the jumped-over piece
    const capturedPieceId = matchingMove.capturedPieceId;
    const capturedPiece = gameState.pieces[capturedPieceId];
    
    if (capturedPiece) {
      console.log(`Jump capture: ${piece.symbol} jumps over ${capturedPiece.symbol}`);
      
      // Remove captured piece from grid and game state
      const capturedPosKey = GridUtils.getPositionKey(capturedPiece.row, capturedPiece.col);
      delete gameState.grid[capturedPosKey];
      delete gameState.pieces[capturedPieceId];
      
      // Remove from player's pieces array
      const capturedPlayer = gameState.players[capturedPiece.playerId];
      if (capturedPlayer) {
        capturedPlayer.pieces = capturedPlayer.pieces.filter(id => id !== capturedPieceId);
      }
      
      // Award kill to jumping piece
      piece.kills = (piece.kills || 0) + 1;
      
      // Move jumper to landing position
      const oldPosKey = GridUtils.getPositionKey(piece.row, piece.col);
      delete gameState.grid[oldPosKey];
      
      piece.row = targetRow;
      piece.col = targetCol;
      gameState.grid[GridUtils.getPositionKey(targetRow, targetCol)] = pieceId;
      
      // Check if jumper can evolve
      if (canEvolve(piece)) {
        const evolvedPiece = evolvePiece(piece);
        gameState.pieces[piece.id] = evolvedPiece;
        
        console.log(`Evolution: ${piece.symbol} evolved to ${evolvedPiece.symbol}!`);
        
        // Broadcast evolution event
        io.emit('piece-evolution', {
          pieceId: piece.id,
          oldType: piece.type,
          newType: evolvedPiece.type,
          position: { row: evolvedPiece.row, col: evolvedPiece.col }
        });
      }
      
      // Broadcast jump capture event
      io.emit('jump-capture', {
        jumperId: pieceId,
        capturedPieceId: capturedPieceId,
        jumperPosition: { row: piece.row, col: piece.col },
        capturedPosition: matchingMove.capturedPosition,
        playerId: playerId
      });
      
      const successMsg = `Jump capture: ${piece.symbol} captured ${capturedPiece.symbol} by jumping over`;
      console.log(successMsg);
      broadcastGameState();
      
      return { success: true, message: successMsg };
    }
  }
  
  // Check if position is occupied (for regular moves)
  const targetPosKey = GridUtils.getPositionKey(targetRow, targetCol);
  const targetPieceId = gameState.grid[targetPosKey];
  
  if (targetPieceId) {
    // Position occupied - battle!
    const targetPiece = gameState.pieces[targetPieceId];
    if (targetPiece.playerId !== playerId) {
      console.log(`Battle initiated: ${piece.symbol} vs ${targetPiece.symbol}`);
      handleBattle(piece, targetPiece);
      return { success: true, message: `Battle initiated: ${piece.symbol} vs ${targetPiece.symbol}` };
    } else {
      const errorMsg = `Invalid move: cannot attack own piece`;
      console.log(errorMsg);
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit('move-result', { success: false, message: errorMsg });
      }
      return null;
    }
  }
  
  // Move piece
  const oldPosKey = GridUtils.getPositionKey(piece.row, piece.col);
  delete gameState.grid[oldPosKey];
  
  piece.row = targetRow;
  piece.col = targetCol;
  gameState.grid[targetPosKey] = pieceId;
  
  // Check for circumnavigation bonus (pawns and splitters reaching opposite pole)
  if ((piece.type === 'PAWN' || piece.type === 'SPLITTER') && checkCircumnavigation(piece)) {
    piece.evolutionPoints = (piece.evolutionPoints || 0) + 8;
    console.log(`${piece.symbol} completed circumnavigation! +8 evolution points (${piece.evolutionPoints} total)`);
    
    // Broadcast evolution point award
    io.emit('evolution-point-award', {
      pieceId: piece.id,
      pieceType: piece.type,
      points: piece.evolutionPoints,
      reason: 'circumnavigation',
      position: { row: piece.row, col: piece.col }
    });
  }
  
  const successMsg = `Piece ${piece.symbol} moved to (${targetRow}, ${targetCol})`;
  console.log(successMsg);
  broadcastGameState();
  
  return { success: true, message: successMsg };
}

function checkCircumnavigation(piece) {
  // Check if a pawn or splitter has reached the opposite pole
  const player = gameState.players[piece.playerId];
  if (!player) return false;
  
  const spawnRow = player.spawnArea.baseRow;
  const isNorthPole = spawnRow <= 9; // North half of sphere
  
  // Determine opposite pole based on spawn position
  let oppositeRow;
  if (isNorthPole) {
    // Spawned at north pole, opposite is south pole (row 19)
    oppositeRow = GAME_CONFIG.GRID_ROWS - 1;
  } else {
    // Spawned at south pole, opposite is north pole (row 0)
    oppositeRow = 0;
  }
  
  // Check if piece has reached the opposite pole
  return piece.row === oppositeRow;
}

function handlePieceSplit(playerId, splitData) {
  const { pieceId, targetRow, targetCol } = splitData;
  const piece = gameState.pieces[pieceId];
  
  // Validate split
  if (!piece || piece.playerId !== playerId) {
    const errorMsg = `Invalid split: piece ${pieceId} does not belong to player ${playerId}`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Only splitters can split
  if (piece.type !== 'SPLITTER') {
    const errorMsg = `Invalid split: only Splitters can split`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  if (!GridUtils.isValidPosition(targetRow, targetCol)) {
    const errorMsg = `Invalid split: target position (${targetRow}, ${targetCol}) is out of bounds`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Check if this split is valid according to piece split rules
  const validMoves = getValidMoves(pieceId);
  const isValidSplit = validMoves.some(move => 
    move.row === targetRow && move.col === targetCol && move.type === 'split'
  );
  
  if (!isValidSplit) {
    const errorMsg = `Invalid split: (${targetRow}, ${targetCol}) is not a valid split position for piece ${pieceId}`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Check if target position is occupied
  const targetPosKey = GridUtils.getPositionKey(targetRow, targetCol);
  const targetPieceId = gameState.grid[targetPosKey];
  
  if (targetPieceId) {
    const errorMsg = `Invalid split: target position is occupied`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // Create the split piece (duplicate)
  const player = gameState.players[playerId];
  const splitPieceId = `${playerId}-splitter-split-${Date.now()}`;
  const splitPiece = {
    id: splitPieceId,
    playerId: playerId,
    type: 'SPLITTER',
    value: PIECE_TYPES.SPLITTER.points,
    symbol: PIECE_TYPES.SPLITTER.symbol,
    row: targetRow,
    col: targetCol,
    kills: 0,
    timeAlive: 0,
    isSplitCopy: true // Mark this as a split copy
  };
  
  // Add the split piece to the game
  gameState.pieces[splitPieceId] = splitPiece;
  gameState.grid[targetPosKey] = splitPieceId;
  player.pieces.push(splitPieceId);
  
  const successMsg = `Splitter ${piece.symbol} split to (${targetRow}, ${targetCol})`;
  console.log(successMsg);
  
  // Broadcast split event
  io.emit('piece-split', {
    originalPieceId: pieceId,
    newPieceId: splitPieceId,
    originalPosition: { row: piece.row, col: piece.col },
    newPosition: { row: targetRow, col: targetCol },
    playerId: playerId
  });
  
  broadcastGameState();
  
  return { success: true, message: successMsg };
}



function handleBattle(attackingPiece, defendingPiece) {
  console.log(`Battle: ${attackingPiece.symbol} (${attackingPiece.value}pts) vs ${defendingPiece.symbol} (${defendingPiece.value}pts)`);
  
  // Check if this should trigger a contest
  if (shouldTriggerContest(attackingPiece, defendingPiece)) {
    initiateBattleContest(attackingPiece, defendingPiece);
  } else {
    // Resolve battle immediately
    resolveBattleImmediate(attackingPiece, defendingPiece);
  }
}

function initiateBattleContest(attackingPiece, defendingPiece) {
  const battleId = `${attackingPiece.id}-vs-${defendingPiece.id}-${Date.now()}`;
  const timeLimit = getContestTimeLimit(attackingPiece, defendingPiece);
  
  // Store pending battle
  gameState.pendingBattles[battleId] = {
    attackingPiece,
    defendingPiece,
    timeLimit,
    startTime: Date.now()
  };
  
  // Notify defender about contest opportunity
  const defenderSocket = io.sockets.sockets.get(defendingPiece.playerId);
  if (defenderSocket) {
    defenderSocket.emit('battle-contest-prompt', {
      battleId,
      attackingPiece: {
        id: attackingPiece.id,
        type: attackingPiece.type,
        symbol: attackingPiece.symbol,
        value: attackingPiece.value
      },
      defendingPiece: {
        id: defendingPiece.id,
        type: defendingPiece.type,
        symbol: defendingPiece.symbol,
        value: defendingPiece.value
      },
      timeLimit
    });
  }
  
  // Set timeout for automatic resolution
  setTimeout(() => {
    if (gameState.pendingBattles[battleId]) {
      console.log(`Battle contest timed out: ${battleId}`);
      // Defender didn't respond in time - resolve automatically
      resolveBattleImmediate(attackingPiece, defendingPiece);
      delete gameState.pendingBattles[battleId];
    }
  }, timeLimit * 1000);
}

function handleContestResponse(playerId, data) {
  const { battleId, wantsToContest } = data;
  const pendingBattle = gameState.pendingBattles[battleId];
  
  if (!pendingBattle) {
    console.log(`No pending battle found: ${battleId}`);
    return;
  }
  
  if (pendingBattle.defendingPiece.playerId !== playerId) {
    console.log(`Invalid contest response from ${playerId}`);
    return;
  }
  
  delete gameState.pendingBattles[battleId];
  
  if (wantsToContest) {
    console.log(`Defender contests battle: ${battleId}`);
    resolveBattleWithDice(pendingBattle.attackingPiece, pendingBattle.defendingPiece);
  } else {
    console.log(`Defender declines contest: ${battleId}`);
    resolveBattleImmediate(pendingBattle.attackingPiece, pendingBattle.defendingPiece);
  }
}

function resolveBattleWithDice(attackingPiece, defendingPiece) {
  const battleResult = resolveDiceBattle(attackingPiece, defendingPiece);
  const winner = battleResult.winner;
  const loser = battleResult.loser;
  
  console.log(`Dice battle won by: ${winner.symbol} (${winner.value}pts)`);
  
  // Broadcast dice battle animation
  io.emit('dice-battle-animation', {
    battleLog: battleResult.battleLog,
    winner: winner.id,
    loser: loser.id,
    duration: calculateBattleAnimationDuration(battleResult.battleLog)
  });
  
  // Resolve after animation
  setTimeout(() => {
    completeBattleResolution(winner, loser);
  }, calculateBattleAnimationDuration(battleResult.battleLog) * 1000);
}

function resolveBattleImmediate(attackingPiece, defendingPiece) {
  const battleResult = newResolveBattle(attackingPiece, defendingPiece);
  const winner = battleResult.winner;
  const loser = battleResult.loser;
  
  console.log(`Immediate battle won by: ${winner.symbol} (${winner.value}pts)`);
  
  completeBattleResolution(winner, loser);
}

function completeBattleResolution(winner, loser) {
  // Increment winner's kill count
  winner.kills = (winner.kills || 0) + 1;
  
  // Award evolution points for attacking splitters
  if (loser.type === 'SPLITTER') {
    winner.evolutionPoints = (winner.evolutionPoints || 0) + 1;
    console.log(`${winner.symbol} gains evolution point for defeating Splitter! (${winner.evolutionPoints} total)`);
    
    // Broadcast evolution point gain
    io.emit('evolution-point-gained', {
      winnerId: winner.id,
      points: winner.evolutionPoints,
      reason: 'defeated_splitter'
    });
  }
  
  // Remove loser from game
  const loserPosKey = GridUtils.getPositionKey(loser.row, loser.col);
  delete gameState.grid[loserPosKey];
  delete gameState.pieces[loser.id];
  
  // Remove from player's pieces array
  const loserPlayer = gameState.players[loser.playerId];
  if (loserPlayer) {
    loserPlayer.pieces = loserPlayer.pieces.filter(id => id !== loser.id);
  }
  
  // Move winner to the contested position
  if (winner.id !== loser.id) { // Attacker won
    const oldPosKey = GridUtils.getPositionKey(winner.row, winner.col);
    delete gameState.grid[oldPosKey];
    
    winner.row = loser.row;
    winner.col = loser.col;
    gameState.grid[GridUtils.getPositionKey(winner.row, winner.col)] = winner.id;
  }
  
  // Check if winner can evolve
  if (canEvolve(winner)) {
    const evolvedPiece = evolvePiece(winner);
    
    // Update piece in game state
    gameState.pieces[winner.id] = evolvedPiece;
    
    console.log(`Evolution: ${winner.symbol} evolved to ${evolvedPiece.symbol}!`);
    
    // Broadcast evolution event
    io.emit('piece-evolution', {
      pieceId: winner.id,
      oldType: winner.type,
      newType: evolvedPiece.type,
      position: { row: evolvedPiece.row, col: evolvedPiece.col }
    });
  }
  
  // Check for checkmate (King capture) and player elimination
  if (loser.type === 'KING') {
    console.log(`CHECKMATE! King ${loser.symbol} captured - Player ${loser.playerId} eliminated!`);
    eliminatePlayer(loser.playerId);
    
    // Check for victory condition
    const remainingPlayers = Object.keys(gameState.players).length;
    if (remainingPlayers === 1) {
      const victoryPlayer = Object.values(gameState.players)[0];
      declareVictory(victoryPlayer);
    }
  }
  
  // Broadcast battle result
  io.emit('battle-result', {
    winner: winner.id,
    loser: loser.id,
    position: { row: winner.row, col: winner.col },
    winnerKills: winner.kills,
    wasKingCaptured: loser.type === 'KING'
  });
  
  broadcastGameState();
}

function calculateBattleAnimationDuration(battleLog) {
  // 1 second per die + 1 second for each tie-breaker round
  const initialDiceTime = 1; // 1 second for initial dice
  const tieBreakerTime = battleLog.rounds.length * 1; // 1 second per tie-breaker
  return initialDiceTime + tieBreakerTime;
}

function eliminatePlayer(playerId) {
  const player = gameState.players[playerId];
  if (!player) return;
  
  console.log(`Eliminating player ${playerId} (Player ${player.index + 1})`);
  
  // Remove all pieces belonging to this player
  const playerPieces = [...player.pieces]; // Create copy to avoid mutation during iteration
  playerPieces.forEach(pieceId => {
    const piece = gameState.pieces[pieceId];
    if (piece) {
      // Remove from grid
      const posKey = GridUtils.getPositionKey(piece.row, piece.col);
      delete gameState.grid[posKey];
      
      // Remove from pieces
      delete gameState.pieces[pieceId];
      
      console.log(`Removed piece ${piece.symbol} at (${piece.row}, ${piece.col})`);
    }
  });
  
  // Remove player from game
  delete gameState.players[playerId];
  gameState.playerCount = Object.keys(gameState.players).length;
  
  console.log(`Player eliminated. Remaining players: ${gameState.playerCount}`);
  
  // Broadcast elimination event
  io.emit('player-eliminated', {
    eliminatedPlayerId: playerId,
    playerIndex: player.index,
    remainingPlayers: gameState.playerCount
  });
}

function declareVictory(victoryPlayer) {
  console.log(`VICTORY! Player ${victoryPlayer.index + 1} wins the game!`);
  
  // Broadcast victory event
  io.emit('game-victory', {
    winnerId: victoryPlayer.id,
    playerIndex: victoryPlayer.index,
    winnerColor: victoryPlayer.color,
    totalPlayers: Object.keys(gameState.players).length
  });
  
  // Optional: Reset game state after victory
  // resetGameState();
}

function getValidMoves(pieceId) {
  const piece = gameState.pieces[pieceId];
  if (!piece) return [];
  
  const pieceType = PIECE_TYPES[piece.type];
  const movementPattern = MOVEMENT_PATTERNS[pieceType.movementPattern];
  
  if (!movementPattern) {
    console.warn(`No movement pattern found for piece type: ${piece.type}`);
    return [];
  }
  
  const validMoves = [];
  
  // Handle different movement pattern types
  if (movementPattern.type === 'directional' || movementPattern.type === 'enhanced_pawn' || movementPattern.type === 'latitude_based') {
    // Pawn and Splitter movement - separate move and attack directions
    let moveDirections = movementPattern.directions || [];
    let attackDirections = movementPattern.attackDirections || movementPattern.directions;
    
    // For pawns, determine movement direction based on spawn location
    if (piece.type === 'PAWN') {
      const player = gameState.players[piece.playerId];
      if (player) {
        const spawnRow = player.spawnArea.baseRow;
        const isNorthPole = spawnRow <= 9; // North half of sphere
        
        if (isNorthPole) {
          // North pole pawns move toward south (+1 row)
          moveDirections = [{ row: 1, col: 0 }];
          attackDirections = [{ row: 1, col: -1 }, { row: 1, col: 1 }];
        } else {
          // South pole pawns move toward north (-1 row)
          moveDirections = [{ row: -1, col: 0 }];
          attackDirections = [{ row: -1, col: -1 }, { row: -1, col: 1 }];
        }
      }
    }
    
    // Check regular movement directions
    moveDirections.forEach(dir => {
      const targetRow = piece.row + dir.row;
      const targetCol = GridUtils.normalizeCol(piece.col + dir.col);
      
      if (GridUtils.isValidPosition(targetRow, targetCol)) {
        const posKey = GridUtils.getPositionKey(targetRow, targetCol);
        const occupyingPieceId = gameState.grid[posKey];
        
        if (!occupyingPieceId) {
          validMoves.push({ row: targetRow, col: targetCol, type: 'move' });
        }
      }
    });
    
    // Check attack directions
    attackDirections.forEach(dir => {
      const targetRow = piece.row + dir.row;
      const targetCol = GridUtils.normalizeCol(piece.col + dir.col);
      
      if (GridUtils.isValidPosition(targetRow, targetCol)) {
        const posKey = GridUtils.getPositionKey(targetRow, targetCol);
        const occupyingPieceId = gameState.grid[posKey];
        
        if (occupyingPieceId) {
          const occupyingPiece = gameState.pieces[occupyingPieceId];
          if (occupyingPiece.playerId !== piece.playerId) {
            validMoves.push({ row: targetRow, col: targetCol, type: 'attack' });
          }
        }
      }
    });
    
    // Check split directions (SPLITTER only)
    if (piece.type === 'SPLITTER' && movementPattern.splitDirections) {
      movementPattern.splitDirections.forEach(dir => {
        const targetRow = piece.row + dir.row;
        const targetCol = GridUtils.normalizeCol(piece.col + dir.col);
        
        if (GridUtils.isValidPosition(targetRow, targetCol)) {
          const posKey = GridUtils.getPositionKey(targetRow, targetCol);
          const occupyingPieceId = gameState.grid[posKey];
          
          if (!occupyingPieceId) {
            // Only allow split to empty squares
            validMoves.push({ row: targetRow, col: targetCol, type: 'split' });
          }
        }
      });
    }
    
  } else {
    // Standard movement patterns (omnidirectional, diagonal, orthogonal, etc.)
    
    // Special handling for jumping pieces (Jumpers and evolved jumpers)
    if (movementPattern.jumpOver && (piece.type === 'JUMPER' || piece.type === 'SUPER_JUMPER' || piece.type === 'HYPER_JUMPER' || piece.type === 'MISTRESS_JUMPER')) {
      // Jumpers capture by jumping OVER pieces (not landing on them)
      movementPattern.directions.forEach(dir => {
        const jumpOverRow = piece.row + (dir.row / 2); // Midpoint to jump over
        const jumpOverCol = GridUtils.normalizeCol(piece.col + (dir.col / 2));
        const landingRow = piece.row + dir.row; // Landing position
        const landingCol = GridUtils.normalizeCol(piece.col + dir.col);
        
        // Check if jumping positions are valid
        if (!GridUtils.isValidPosition(jumpOverRow, jumpOverCol) || !GridUtils.isValidPosition(landingRow, landingCol)) return;
        
        // Check if there's a piece to jump over
        const jumpOverPosKey = GridUtils.getPositionKey(jumpOverRow, jumpOverCol);
        const jumpOverPieceId = gameState.grid[jumpOverPosKey];
        
        // Check landing position
        const landingPosKey = GridUtils.getPositionKey(landingRow, landingCol);
        const landingPieceId = gameState.grid[landingPosKey];
        
        if (jumpOverPieceId && !landingPieceId) {
          // There's a piece to jump over and landing position is empty
          const jumpOverPiece = gameState.pieces[jumpOverPieceId];
          
          if (jumpOverPiece.playerId !== piece.playerId) {
            // Enemy piece - can capture by jumping over
            validMoves.push({ 
              row: landingRow, 
              col: landingCol, 
              type: 'jump-capture',
              capturedPieceId: jumpOverPieceId,
              capturedPosition: { row: jumpOverRow, col: jumpOverCol }
            });
          }
        } else if (!jumpOverPieceId && !landingPieceId) {
          // No piece to jump over and landing position is empty - regular move
          validMoves.push({ row: landingRow, col: landingCol, type: 'move' });
        }
      });
    } else {
      // Standard movement for non-jumping pieces
      
      // Special handling for King at poles
      if (piece.type === 'KING' && (piece.row === 0 || piece.row === GAME_CONFIG.GRID_ROWS - 1)) {
        // King at north pole (row 0) or south pole (row 19)
        const isPoleNorth = piece.row === 0;
        const targetRow = isPoleNorth ? 1 : GAME_CONFIG.GRID_ROWS - 2;
        
        // At poles, king can move to any column at the adjacent row (full 360° movement)
        for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
          const posKey = GridUtils.getPositionKey(targetRow, col);
          const occupyingPieceId = gameState.grid[posKey];
          
          if (!occupyingPieceId) {
            // Empty position - can move here
            validMoves.push({ row: targetRow, col: col, type: 'move' });
          } else {
            // Position occupied
            const occupyingPiece = gameState.pieces[occupyingPieceId];
            if (occupyingPiece.playerId !== piece.playerId) {
              // Enemy piece - can attack
              validMoves.push({ row: targetRow, col: col, type: 'attack' });
            }
          }
        }
      } else {
        // Standard movement for all other pieces and king not at poles
        movementPattern.directions.forEach(dir => {
          const maxDistance = movementPattern.maxDistance || 1;
          
          for (let distance = 1; distance <= maxDistance; distance++) {
            const targetRow = piece.row + (dir.row * distance);
            const targetCol = GridUtils.normalizeCol(piece.col + (dir.col * distance));
            
            if (!GridUtils.isValidPosition(targetRow, targetCol)) break;
            
            const posKey = GridUtils.getPositionKey(targetRow, targetCol);
            const occupyingPieceId = gameState.grid[posKey];
            
            if (!occupyingPieceId) {
              // Empty position - can move here
              validMoves.push({ row: targetRow, col: targetCol, type: 'move' });
            } else {
              // Position occupied
              const occupyingPiece = gameState.pieces[occupyingPieceId];
              if (occupyingPiece.playerId !== piece.playerId) {
                // Enemy piece - can attack
                validMoves.push({ row: targetRow, col: targetCol, type: 'attack' });
              }
              
              // Cannot continue further in this direction unless piece can jump
              if (!movementPattern.jumpOver) break;
            }
          }
        });
      }
    }
  }
  
  return validMoves;
}

function broadcastGameState() {
  const clientGameState = {
    players: gameState.players,
    pieces: gameState.pieces,
    gridConfig: {
      rows: GAME_CONFIG.GRID_ROWS,
      cols: GAME_CONFIG.GRID_COLS
    }
  };
  
  io.emit('game-state-update', clientGameState);
}

function getPlayerColor(index) {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange', 'pink'];
  return colors[index % colors.length];
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Grid system: ${GAME_CONFIG.GRID_ROWS}x${GAME_CONFIG.GRID_COLS}`);
  console.log(`Max players: ${GAME_CONFIG.MAX_PLAYERS}`);
}); 