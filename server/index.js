const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { GAME_CONFIG, GridUtils } = require('./gameConfig');
const { PIECE_TYPES, MOVEMENT_PATTERNS, resolveBattle: newResolveBattle, resolveDiceBattle, shouldTriggerContest, getContestTimeLimit, canEvolve, evolvePiece } = require('./pieceTypes');
const { TournamentManager, TOURNAMENT_STATUS, MATCH_STATUS } = require('./tournamentManager');
const SpectatorManager = require('./spectatorManager');
const { AIManager, AI_DIFFICULTY } = require('./aiManager');
const LobbyManager = require('./lobbyManager');
const StatisticsManager = require('./statisticsManager');
const EvolutionManager = require('./evolutionManager');
const TimingManager = require('./timingManager');
const VictoryManager = require('./victoryManager');
const ChatManager = require('./chatManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, '../public')));

// Serve chess piece models from /chess piece models
app.use('/chess piece models', express.static(path.join(__dirname, '../chess piece models')));

// Game state
const gameState = {
  players: {},
  pieces: {}, // pieceId -> piece object
  grid: {}, // positionKey -> pieceId
  playerCount: 0,
  pendingBattles: {}, // battleId -> battle info
  currentTurn: 0,
  activePlayer: null,
  gameStartTime: null
};

// Tournament management
const tournamentManager = new TournamentManager();

// Spectator and replay management
const spectatorManager = new SpectatorManager();

// AI management
const aiManager = new AIManager();

// Lobby management
const lobbyManager = new LobbyManager();

// Statistics and leaderboard management
const statisticsManager = new StatisticsManager();

// Evolution banking and choice management
const evolutionManager = new EvolutionManager();

// Timing and collision management
const timingManager = new TimingManager(io);

// Victory and elimination management
const victoryManager = new VictoryManager(io, gameState, timingManager);

// Chat and communication management
const chatManager = new ChatManager(io);

// Set up move executor for timing manager
timingManager.setMoveExecutor((playerId, moveData) => {
  const result = handlePieceMove(playerId, moveData);
  if (result) {
    // Record the move
    spectatorManager.recordMove('main', {
      type: 'move',
      playerId: playerId,
      pieceId: moveData.pieceId,
      fromPosition: { row: result.fromRow, col: result.fromCol },
      toPosition: { row: moveData.targetRow, col: moveData.targetCol },
      moveType: result.moveType || 'normal',
      captures: result.captures || []
    });
    
    // Send confirmation back to the client
    io.emit('move-result', { success: true, message: result.message, playerId: playerId });
    
    // Send game event to chat
    const player = gameState.players[playerId];
    if (player) {
      chatManager.sendGameEvent('main', 'piece_moved', {
        playerName: player.name,
        piece: gameState.pieces[moveData.pieceId]?.symbol || 'piece',
        row: moveData.targetRow,
        col: moveData.targetCol
      });
    }
  }
});

// Setup cleanup intervals
evolutionManager.setupCleanupInterval();

// Initialize victory system and main chat room
setTimeout(() => {
  victoryManager.initializeVictorySystem();
  chatManager.createChatRoom('main', 'Game Chat', 'game');
}, 1000);

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
  
  // Assign first available color
  const availableColors = getAvailableColors();
  const defaultColor = availableColors.length > 0 ? availableColors[0].id : 'red';
  
  const player = {
    id: socket.id,
    name: `Player ${playerIndex + 1}`,
    index: playerIndex,
    color: defaultColor,
    selectedColor: defaultColor,
    spawnArea: spawnArea,
    pieces: [],
    stats: {
      piecesLost: 0,
      piecesEvolved: 0,
      battlesWon: 0,
      battlesLost: 0
    }
  };
  
  // Mark color as taken
  takenColors.add(defaultColor);
  
  gameState.players[socket.id] = player;
  gameState.playerCount = Object.keys(gameState.players).length;
  
  // Initialize evolution bank with starting points
  evolutionManager.initializePlayerBank(socket.id);
  evolutionManager.addEvolutionPoints(socket.id, 5, 'game_start'); // Starting with 5 evolution points
  
  // Start recording if this is the first player
  if (gameState.playerCount === 1) {
    spectatorManager.startRecording('main', gameState);
    gameState.gameStartTime = Date.now(); // Set game start time
  }
  
  // Create starting pieces for the player
  createStartingPieces(player);
  
  // Add player to timing system
  timingManager.addPlayer(socket.id);
  
  // Initialize timing system if this is the first player
  if (gameState.playerCount === 1) {
    timingManager.initialize(gameState);
  }
  
  // Add player to main chat room
  chatManager.joinChatRoom('main', socket.id, player.name, socket.id);
  
  // Broadcast updated game state
  broadcastGameState();
  
  socket.on('move-piece', (data) => {
    // Check timing system for turn validation and collision detection
    const timingResult = timingManager.registerMove(socket.id, data);
    
    if (!timingResult.success) {
      if (timingResult.collision) {
        // Handle collision - trigger battle
        socket.emit('move-collision', {
          message: 'Collision detected! Resolving battle...',
          conflictingMove: timingResult.conflictingMove
        });
        
        // Trigger battle between pieces
        handleMoveCollision(socket.id, data, timingResult.conflictingMove);
      } else {
        socket.emit('move-result', { success: false, message: timingResult.error });
      }
      return;
    }
    
    if (timingResult.queued) {
      // Move is queued, will be executed when timer reaches 0
      socket.emit('move-queued', { 
        message: timingResult.message,
        queued: true,
        timeRemaining: timingResult.timeRemaining
      });
    } else {
      // Move is pending, will be executed after collision window
      socket.emit('move-pending', { 
        message: 'Move registered, checking for conflicts...',
        pending: true 
      });
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

  // Real-time system handlers
  socket.on('cancel-queued-move', () => {
    const result = timingManager.cancelQueuedMove(socket.id);
    socket.emit('cancel-queued-move-result', { success: result });
  });
  
  socket.on('get-player-timer', () => {
    const timer = timingManager.getPlayerTimer(socket.id);
    const queuedMove = timingManager.getQueuedMove(socket.id);
    socket.emit('player-timer-state', { 
      timer: timer,
      queuedMove: queuedMove
    });
  });
  
  socket.on('get-queued-move', () => {
    const queuedMove = timingManager.getQueuedMove(socket.id);
    socket.emit('queued-move-state', { queuedMove: queuedMove });
  });

  // Tournament socket handlers
  socket.on('create-tournament', (data) => {
    const tournament = tournamentManager.createTournament(data.settings);
    socket.emit('tournament-created', { tournament });
    io.emit('tournament-list-updated', { tournaments: tournamentManager.getAllTournaments() });
    console.log(`Tournament created: ${tournament.id}`);
  });

  socket.on('join-tournament', (data) => {
    const { tournamentId, playerName } = data;
    const player = gameState.players[socket.id];
    const result = tournamentManager.registerPlayer(tournamentId, socket.id, playerName || `Player ${socket.id}`);
    
    if (result.success) {
      socket.emit('tournament-joined', { tournament: result.tournament, player: result.player });
      io.emit('tournament-updated', { tournament: result.tournament });
      console.log(`Player ${socket.id} joined tournament ${tournamentId}`);
    } else {
      socket.emit('tournament-join-failed', { error: result.error });
    }
  });

  socket.on('start-tournament', (data) => {
    const { tournamentId } = data;
    const result = tournamentManager.startTournament(tournamentId);
    
    if (result.success) {
      io.emit('tournament-started', { tournament: result.tournament });
      console.log(`Tournament started: ${tournamentId}`);
      
      // Start first matches
      const nextMatch = tournamentManager.getNextMatch(tournamentId);
      if (nextMatch) {
        startTournamentMatch(tournamentId, nextMatch);
      }
    } else {
      socket.emit('tournament-start-failed', { error: result.error });
    }
  });

  socket.on('get-tournaments', () => {
    socket.emit('tournament-list', { tournaments: tournamentManager.getAllTournaments() });
  });

  socket.on('get-tournament', (data) => {
    const { tournamentId } = data;
    const tournament = tournamentManager.getTournament(tournamentId);
    if (tournament) {
      socket.emit('tournament-info', { tournament });
    } else {
      socket.emit('tournament-not-found', { tournamentId });
    }
  });

  // Spectator socket handlers
  socket.on('join-spectator', (data) => {
    const { gameId } = data;
    const result = spectatorManager.addSpectator(gameId || 'main', socket);
    
    socket.emit('spectator-joined', result);
    
    // Send current game state to spectator
    socket.emit('game-state', {
      players: gameState.players,
      pieces: gameState.pieces,
      gridConfig: {
        rows: GAME_CONFIG.GRID_ROWS,
        cols: GAME_CONFIG.GRID_COLS
      },
      spectatorMode: true
    });
    
    // Broadcast spectator count update
    spectatorManager.broadcastToSpectators(gameId || 'main', 'spectator-count-updated', {
      count: spectatorManager.getSpectatorCount(gameId || 'main')
    });
    
    console.log(`Spectator joined: ${socket.id} for game ${gameId || 'main'}`);
  });

  socket.on('leave-spectator', (data) => {
    const { gameId } = data;
    const result = spectatorManager.removeSpectator(gameId || 'main', socket);
    
    if (result) {
      socket.emit('spectator-left', result);
      
      // Broadcast spectator count update
      spectatorManager.broadcastToSpectators(gameId || 'main', 'spectator-count-updated', {
        count: result.spectatorCount
      });
      
      console.log(`Spectator left: ${socket.id} from game ${gameId || 'main'}`);
    }
  });

  socket.on('get-spectatable-games', () => {
    const games = spectatorManager.getSpectableGames();
    socket.emit('spectatable-games', { games });
  });

  socket.on('get-replays', () => {
    const replays = spectatorManager.getAllReplays();
    socket.emit('replay-list', { replays });
  });

  socket.on('get-replay', (data) => {
    const { gameId } = data;
    const replay = spectatorManager.getReplay(gameId);
    if (replay) {
      socket.emit('replay-data', { replay });
    } else {
      socket.emit('replay-not-found', { gameId });
    }
  });

  socket.on('replay-seek', (data) => {
    const { gameId, timestamp, moveIndex } = data;
    let replayState = null;
    
    if (timestamp !== undefined) {
      replayState = spectatorManager.getReplayStateAtTime(gameId, timestamp);
    } else if (moveIndex !== undefined) {
      replayState = spectatorManager.getReplayStateAtMove(gameId, moveIndex);
    }
    
    if (replayState) {
      socket.emit('replay-state', replayState);
    } else {
      socket.emit('replay-seek-error', { gameId, timestamp, moveIndex });
    }
  });

  socket.on('delete-replay', (data) => {
    const { gameId } = data;
    const deleted = spectatorManager.deleteReplay(gameId);
    socket.emit('replay-deleted', { gameId, success: deleted });
    
    // Broadcast updated replay list
    const replays = spectatorManager.getAllReplays();
    io.emit('replay-list', { replays });
  });

  // AI socket handlers
  socket.on('add-ai-player', (data) => {
    const { difficulty, personality } = data;
    const aiPlayerId = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if game is full
    if (gameState.playerCount >= GAME_CONFIG.MAX_PLAYERS) {
      socket.emit('ai-add-failed', { error: 'Game is full' });
      return;
    }
    
    // Find the next available player slot
    let playerIndex = 0;
    while (playerIndex < GAME_CONFIG.MAX_PLAYERS && 
           Object.values(gameState.players).some(p => p.index === playerIndex)) {
      playerIndex++;
    }
    
    const spawnArea = GAME_CONFIG.SPAWN_AREAS[playerIndex];
    
    // Assign first available color for AI
    const availableColors = getAvailableColors();
    const defaultColor = availableColors.length > 0 ? availableColors[0].id : 'red';
    
    const aiPlayer = {
      id: aiPlayerId,
      index: playerIndex,
      color: defaultColor,
      selectedColor: defaultColor,
      spawnArea: spawnArea,
      pieces: [],
      isAI: true,
      aiDifficulty: difficulty || 'MEDIUM',
      name: `AI ${AI_DIFFICULTY[difficulty || 'MEDIUM'].name}`,
      stats: {
        piecesLost: 0,
        piecesEvolved: 0,
        battlesWon: 0,
        battlesLost: 0
      }
    };
    
    // Mark color as taken
    takenColors.add(defaultColor);
    
    // Add to game state
    gameState.players[aiPlayerId] = aiPlayer;
    gameState.playerCount = Object.keys(gameState.players).length;
    
    // Register with AI manager
    aiManager.addAIPlayer(aiPlayerId, difficulty || 'MEDIUM', personality || {});
    
    // Initialize evolution bank with starting points
    evolutionManager.initializePlayerBank(aiPlayerId);
    evolutionManager.addEvolutionPoints(aiPlayerId, 5, 'game_start');
    
    // Create starting pieces for AI
    createStartingPieces(aiPlayer);
    
    // Add AI player to timing system
    timingManager.addPlayer(aiPlayerId);
    
    // Broadcast updated game state
    broadcastGameState();
    
    socket.emit('ai-player-added', { 
      aiPlayer,
      difficulty: difficulty || 'MEDIUM',
      description: AI_DIFFICULTY[difficulty || 'MEDIUM'].description
    });
    
    console.log(`AI player ${aiPlayerId} added with difficulty: ${difficulty || 'MEDIUM'}`);
    
    // Trigger AI move if it's the AI's turn
    setTimeout(() => {
      checkAITurn(aiPlayerId);
    }, 1000);
  });

  socket.on('remove-ai-player', (data) => {
    const { aiPlayerId } = data;
    
    if (gameState.players[aiPlayerId] && gameState.players[aiPlayerId].isAI) {
      // Remove AI player's pieces
      const aiPlayer = gameState.players[aiPlayerId];
      aiPlayer.pieces.forEach(pieceId => {
        const piece = gameState.pieces[pieceId];
        if (piece) {
          const posKey = GridUtils.getPositionKey(piece.row, piece.col);
          delete gameState.grid[posKey];
          delete gameState.pieces[pieceId];
        }
      });
      
      // Remove from game state
      delete gameState.players[aiPlayerId];
      gameState.playerCount = Object.keys(gameState.players).length;
      
      // Remove from AI manager
      aiManager.removeAIPlayer(aiPlayerId);
      
      // Broadcast updated game state
      broadcastGameState();
      
      socket.emit('ai-player-removed', { aiPlayerId });
      console.log(`AI player ${aiPlayerId} removed`);
    }
  });

  socket.on('get-ai-difficulties', () => {
    socket.emit('ai-difficulties', { 
      difficulties: Object.keys(AI_DIFFICULTY).map(key => ({
        key,
        ...AI_DIFFICULTY[key]
      }))
    });
  });

  socket.on('update-ai-difficulty', (data) => {
    const { aiPlayerId, newDifficulty } = data;
    
    if (gameState.players[aiPlayerId] && gameState.players[aiPlayerId].isAI) {
      const success = aiManager.updateAIDifficulty(aiPlayerId, newDifficulty);
      if (success) {
        gameState.players[aiPlayerId].aiDifficulty = newDifficulty;
        gameState.players[aiPlayerId].name = `AI ${AI_DIFFICULTY[newDifficulty].name}`;
        
        broadcastGameState();
        socket.emit('ai-difficulty-updated', { aiPlayerId, newDifficulty });
      } else {
        socket.emit('ai-difficulty-update-failed', { aiPlayerId, error: 'Invalid difficulty' });
      }
    }
  });

  socket.on('get-ai-stats', (data) => {
    const { aiPlayerId } = data;
    const stats = aiManager.getAIStats(aiPlayerId);
    socket.emit('ai-stats', { aiPlayerId, stats });
  });

  // Lobby system handlers
  socket.on('create-lobby', (data) => {
    const { name, settings } = data;
    const playerName = gameState.players[socket.id]?.name || `Player ${socket.id.substring(0, 6)}`;
    
    try {
      const lobby = lobbyManager.createLobby(socket.id, playerName, { name, ...settings });
      socket.emit('lobby-created', { lobby });
      
      // Send updated lobby list to all clients
      io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
      
      console.log(`Lobby created: ${lobby.name} by ${playerName}`);
    } catch (error) {
      socket.emit('lobby-creation-failed', { error: error.message });
    }
  });

  socket.on('join-lobby', (data) => {
    const { lobbyId } = data;
    const playerName = gameState.players[socket.id]?.name || `Player ${socket.id.substring(0, 6)}`;
    
    const result = lobbyManager.joinLobby(lobbyId, socket.id, playerName);
    
    if (result.success) {
      // Join socket room for lobby
      socket.join(lobbyId);
      
      // Notify all players in the lobby
      io.to(lobbyId).emit('lobby-updated', { lobby: result.lobby });
      
      // Send updated lobby list to all clients
      io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
      
      socket.emit('lobby-joined', { lobby: result.lobby });
    } else {
      socket.emit('lobby-join-failed', { error: result.error });
    }
  });

  socket.on('leave-lobby', (data) => {
    const { lobbyId } = data;
    const result = lobbyManager.leaveLobby(lobbyId, socket.id);
    
    if (result.success) {
      socket.leave(lobbyId);
      
      if (result.lobbyDeleted) {
        // Lobby was deleted, notify all clients
        io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
      } else {
        // Notify remaining players in the lobby
        io.to(lobbyId).emit('lobby-updated', { lobby: result.lobby });
        
        // Send updated lobby list
        io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
      }
      
      socket.emit('lobby-left', { lobbyId });
    } else {
      socket.emit('lobby-leave-failed', { error: result.error });
    }
  });

  socket.on('toggle-ready', (data) => {
    const { lobbyId } = data;
    const result = lobbyManager.toggleReady(lobbyId, socket.id);
    
    if (result.success) {
      // Notify all players in the lobby
      io.to(lobbyId).emit('lobby-updated', { lobby: result.lobby });
      
      // If ready to start, begin game countdown
      if (result.readyToStart) {
        io.to(lobbyId).emit('game-starting', { 
          countdown: 3,
          lobby: result.lobby
        });
        
        // Start game after countdown
        setTimeout(() => {
          startGameFromLobby(lobbyId);
        }, 3000);
      }
      
      socket.emit('ready-toggled', { ready: result.lobby.players.find(p => p.id === socket.id).ready });
    } else {
      socket.emit('ready-toggle-failed', { error: result.error });
    }
  });

  socket.on('update-lobby-settings', (data) => {
    const { lobbyId, settings } = data;
    const result = lobbyManager.updateLobbySettings(lobbyId, socket.id, settings);
    
    if (result.success) {
      // Notify all players in the lobby
      io.to(lobbyId).emit('lobby-updated', { lobby: result.lobby });
      
      // Send updated lobby list
      io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
      
      socket.emit('lobby-settings-updated', { settings: result.lobby.settings });
    } else {
      socket.emit('lobby-settings-update-failed', { error: result.error });
    }
  });

  socket.on('get-lobbies', () => {
    const lobbies = lobbyManager.getAvailableLobbies();
    socket.emit('lobby-list', { lobbies });
  });

  socket.on('get-lobby', (data) => {
    const { lobbyId } = data;
    const lobby = lobbyManager.getLobby(lobbyId);
    
    if (lobby) {
      socket.emit('lobby-info', { lobby });
    } else {
      socket.emit('lobby-not-found', { lobbyId });
    }
  });

  socket.on('get-player-lobby', () => {
    const lobby = lobbyManager.getPlayerLobby(socket.id);
    socket.emit('player-lobby', { lobby });
  });

  socket.on('get-lobby-stats', () => {
    const stats = lobbyManager.getLobbyStats();
    socket.emit('lobby-stats', { stats });
  });

  // Statistics and leaderboard handlers
  socket.on('get-player-stats', (data) => {
    const { playerId } = data;
    const targetId = playerId || socket.id;
    const stats = statisticsManager.getPlayerStats(targetId);
    socket.emit('player-stats', { playerId: targetId, stats });
  });

  socket.on('get-leaderboard', (data) => {
    const { category = 'rating', limit = 100 } = data;
    const leaderboard = statisticsManager.getLeaderboard(category, limit);
    socket.emit('leaderboard', { category, leaderboard });
  });

  socket.on('get-player-rank', (data) => {
    const { playerId, category = 'rating' } = data;
    const targetId = playerId || socket.id;
    const rank = statisticsManager.getPlayerRank(targetId, category);
    socket.emit('player-rank', { playerId: targetId, category, rank });
  });

  socket.on('get-game-history', (data) => {
    const { limit = 50 } = data;
    const history = statisticsManager.getGameHistory(limit);
    socket.emit('game-history', { history });
  });

  socket.on('get-global-stats', () => {
    const stats = statisticsManager.getGlobalStats();
    socket.emit('global-stats', { stats });
  });

  socket.on('get-achievements', (data) => {
    const { playerId } = data;
    const targetId = playerId || socket.id;
    const stats = statisticsManager.getPlayerStats(targetId);
    const achievements = stats ? stats.achievements : [];
    socket.emit('achievements', { playerId: targetId, achievements });
  });

  // Evolution system handlers
  socket.on('request-evolution-choice', (data) => {
    const { pieceId } = data;
    const piece = gameState.pieces[pieceId];
    
    if (!piece || piece.playerId !== socket.id) {
      socket.emit('evolution-choice-failed', { error: 'Invalid piece or not your piece' });
      return;
    }
    
    const choice = evolutionManager.createEvolutionChoice(pieceId, piece, socket.id);
    
    if (!choice) {
      socket.emit('evolution-choice-failed', { error: 'No evolution paths available for this piece' });
      return;
    }
    
    // Pause cooldowns during evolution choice
    timingManager.pauseAllCooldowns();
    
    socket.emit('evolution-choice-available', {
      pieceId: pieceId,
      piece: piece,
      availablePaths: choice.availablePaths,
      bankInfo: evolutionManager.getPlayerBankInfo(socket.id),
      timeLeft: 30
    });
  });

  socket.on('make-evolution-choice', (data) => {
    const { pieceId, pathId } = data;
    const result = evolutionManager.processEvolutionChoice(socket.id, pieceId, pathId);
    
    if (!result.success) {
      socket.emit('evolution-choice-failed', { error: result.error });
      return;
    }
    
    // Apply the evolution to the piece
    const piece = gameState.pieces[pieceId];
    if (piece) {
      const oldType = piece.type;
      const newType = result.evolution.toType;
      
      // Update piece type and properties
      const newPieceData = PIECE_TYPES[newType];
      if (newPieceData) {
        piece.type = newType;
        piece.symbol = newPieceData.symbol;
        piece.value = newPieceData.points;
        
        // Update game state
        gameState.pieces[pieceId] = piece;
        
        // Record evolution in statistics
        statisticsManager.recordEvolution(socket.id, oldType, newType, result.evolution.cost);
        
        // Broadcast evolution event
        io.emit('evolution-completed', {
          pieceId: pieceId,
          playerId: socket.id,
          oldType: oldType,
          newType: newType,
          cost: result.evolution.cost,
          newPoints: result.evolution.newPoints,
          position: { row: piece.row, col: piece.col }
        });
        
        // Update game state
        broadcastGameState();
      }
    }
    
    socket.emit('evolution-choice-success', {
      pieceId: pieceId,
      evolution: result.evolution,
      bankInfo: evolutionManager.getPlayerBankInfo(socket.id)
    });
    
    // Resume cooldowns after evolution choice is complete
    timingManager.resumeAllCooldowns();
  });

  socket.on('cancel-evolution-choice', (data) => {
    const { pieceId } = data;
    const success = evolutionManager.cancelEvolutionChoice(socket.id, pieceId);
    
    if (success) {
      socket.emit('evolution-choice-cancelled', { pieceId });
    } else {
      socket.emit('evolution-choice-failed', { error: 'No pending choice to cancel' });
    }
    
    // Resume cooldowns after evolution choice is cancelled
    timingManager.resumeAllCooldowns();
  });

  socket.on('get-evolution-bank', () => {
    const bankInfo = evolutionManager.getPlayerBankInfo(socket.id);
    socket.emit('evolution-bank-info', { bankInfo });
  });

  socket.on('get-evolution-leaderboard', (data) => {
    const { limit = 10 } = data;
    const leaderboard = evolutionManager.getEvolutionLeaderboard(limit);
    socket.emit('evolution-leaderboard', { leaderboard });
  });

  socket.on('get-evolution-stats', () => {
    const stats = evolutionManager.getEvolutionStats();
    socket.emit('evolution-stats', { stats });
  });

  // Chat system handlers
  socket.on('send-chat-message', (data) => {
    const { roomId, message } = data;
    const player = gameState.players[socket.id];
    
    if (!player) {
      socket.emit('chat-error', { error: 'Not connected as a player' });
      return;
    }
    
    const result = chatManager.sendMessage(roomId || 'main', socket.id, player.name, message);
    
    if (!result.success) {
      socket.emit('chat-error', { error: result.error });
    }
  });

  // Color selection handlers
  socket.on('get-available-colors', () => {
    const availableColors = getAvailableColors();
    socket.emit('available-colors', { colors: availableColors });
  });

  socket.on('select-color', (data) => {
    const { colorId } = data;
    console.log(`🎨 Server: Player ${socket.id} wants to select color ${colorId}`);
    const result = setPlayerColor(socket.id, colorId);
    
    if (result.success) {
      console.log(`🎨 Server: Color ${colorId} successfully assigned to player ${socket.id}`);
      socket.emit('color-selected', { colorId: colorId });
      
      // Broadcast updated game state to all players
      broadcastGameState();
      
      // Broadcast available colors to all players
      const availableColors = getAvailableColors();
      io.emit('available-colors', { colors: availableColors });
    } else {
      console.log(`🎨 Server: Color selection failed for player ${socket.id}:`, result.error);
      socket.emit('color-selection-failed', { error: result.error });
    }
  });

  socket.on('get-chat-history', (data) => {
    const { roomId } = data;
    const roomInfo = chatManager.getChatRoomInfo(roomId || 'main');
    
    if (roomInfo) {
      socket.emit('chat-room-info', { roomInfo });
    }
  });

  socket.on('get-chat-stats', () => {
    const stats = chatManager.getPlayerStats(socket.id);
    socket.emit('chat-stats', { stats });
  });

  // Handle quit game request
  socket.on('quit-game', () => {
    console.log(`Player ${socket.id} requested to quit game`);
    
    // Remove from spectators if they were spectating
    spectatorManager.removeSpectator('main', socket);
    
    // Clean up AI if this was managing AI players
    aiManager.cleanup(socket.id);
    
    // Handle lobby disconnect
    const affectedLobbyId = lobbyManager.handleDisconnect(socket.id);
    if (affectedLobbyId) {
      const lobby = lobbyManager.getLobby(affectedLobbyId);
      if (lobby) {
        // Notify remaining players in the lobby
        io.to(affectedLobbyId).emit('lobby-updated', { lobby });
      }
      
      // Send updated lobby list to all clients
      io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
    }
    
    // Remove player from game
    const player = gameState.players[socket.id];
    if (player) {
      console.log(`Removing ${player.pieces.length} pieces for player ${player.index + 1}`);
      
      // Remove all pieces belonging to this player
      player.pieces.forEach(pieceId => {
        const piece = gameState.pieces[pieceId];
        if (piece) {
          const posKey = GridUtils.getPositionKey(piece.row, piece.col);
          delete gameState.grid[posKey];
          delete gameState.pieces[pieceId];
        }
      });
      
      // Remove player from players list
      delete gameState.players[socket.id];
      gameState.playerCount = Object.keys(gameState.players).length;
      
      // Remove from evolution and timing systems
      evolutionManager.removePlayer(socket.id);
      timingManager.removePlayer(socket.id);
      
      // Remove from chat
      chatManager.leaveChatRoom('main', socket.id);
      
      // Free up the player's color
      if (player.selectedColor) {
        takenColors.delete(player.selectedColor);
        
        // Broadcast updated available colors to all players
        const availableColors = getAvailableColors();
        io.emit('available-colors', { colors: availableColors });
      }
      
      // Check if only one player remains
      if (gameState.playerCount === 1) {
        console.log('Only one player remaining, stopping turn timers');
        timingManager.stopAllTimers();
      }
      
      // Check victory conditions
      victoryManager.checkVictory();
      
      // Broadcast updated game state
      broadcastGameState();
      
      console.log(`Player count after quit: ${gameState.playerCount}`);
    }
    
    // Disconnect the socket
    socket.disconnect();
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Remove from spectators if they were spectating
    spectatorManager.removeSpectator('main', socket);
    
    // Clean up AI if this was managing AI players
    aiManager.cleanup(socket.id);
    
    // Handle lobby disconnect
    const affectedLobbyId = lobbyManager.handleDisconnect(socket.id);
    if (affectedLobbyId) {
      const lobby = lobbyManager.getLobby(affectedLobbyId);
      if (lobby) {
        // Notify remaining players in the lobby
        io.to(affectedLobbyId).emit('lobby-updated', { lobby });
      }
      
      // Send updated lobby list to all clients
      io.emit('lobby-list-update', { lobbies: lobbyManager.getAvailableLobbies() });
    }
    
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
      
              // Free up the player's color
        if (player.selectedColor) {
          takenColors.delete(player.selectedColor);
          
          // Broadcast updated available colors to all players
          const availableColors = getAvailableColors();
          io.emit('available-colors', { colors: availableColors });
        }
      }
    
    delete gameState.players[socket.id];
    gameState.playerCount = Object.keys(gameState.players).length;
    
    // Remove player from timing system
    timingManager.removePlayer(socket.id);
    
    // Clean up chat system
    chatManager.cleanupPlayer(socket.id);
    
    // If game is empty, finish recording
    if (gameState.playerCount === 0) {
      spectatorManager.finishRecording('main', gameState);
    }
    
    console.log(`Player count after disconnect: ${gameState.playerCount}`);
    broadcastGameState();
  });
});

// AI Turn Management
function checkAITurn(aiPlayerId) {
  const aiPlayer = gameState.players[aiPlayerId];
  if (!aiPlayer || !aiPlayer.isAI) return;
  
  // Check if it's this AI's turn (simplified - in a real turn system this would be more complex)
  if (Object.keys(gameState.players).length > 1) {
    setTimeout(() => {
      triggerAIMove(aiPlayerId);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  }
}

async function triggerAIMove(aiPlayerId) {
  const aiPlayer = gameState.players[aiPlayerId];
  if (!aiPlayer || !aiPlayer.isAI) return;
  
  if (!aiManager.isAIPlayer(aiPlayerId)) return;
  
  // Check if AI player can move (not on cooldown)
  if (!timingManager.canPlayerMove(aiPlayerId)) {
    console.log(`AI ${aiPlayerId} is on cooldown, scheduling retry`);
    
    // Retry after cooldown period
    setTimeout(() => {
      triggerAIMove(aiPlayerId);
    }, 1000); // Check again in 1 second
    return;
  }
  
  try {
    console.log(`Triggering AI move for ${aiPlayerId}`);
    
    // Use the same move system as human players
    const moveResult = await aiManager.makeAIMove(
      aiPlayerId,
      gameState,
      getValidMoves,
      (playerId, moveData) => {
        // Register move through timing system like human players
        const timingResult = timingManager.registerMove(playerId, moveData);
        
        if (timingResult.success) {
          // Move will be executed after collision window
          return { success: true, message: `AI move registered: ${moveData.pieceId}` };
        } else {
          return { success: false, message: timingResult.error };
        }
      },
      handlePieceSplit
    );
    
    if (moveResult) {
      console.log(`AI ${aiPlayerId} move successful:`, moveResult.message);
      
      // Record the AI move
      spectatorManager.recordMove('main', {
        type: 'ai-move',
        playerId: aiPlayerId,
        aiDifficulty: aiPlayer.aiDifficulty,
        result: moveResult
      });
      
      // Broadcast AI move notification
      io.emit('ai-move-completed', {
        aiPlayerId,
        aiName: aiPlayer.name,
        moveResult: moveResult.message
      });
      
      // Schedule next AI turn if game is still active
      if (gameState.playerCount > 1) {
        setTimeout(() => {
          checkAITurn(aiPlayerId);
        }, 8000 + Math.random() * 2000); // 8-10 second delay to respect cooldown
      }
    } else {
      console.log(`AI ${aiPlayerId} could not make move, retrying later`);
      
      // Retry after a delay if no move was made
      setTimeout(() => {
        checkAITurn(aiPlayerId);
      }, 2000);
    }
  } catch (error) {
    console.error(`AI move error for ${aiPlayerId}:`, error);
    
    // Retry after error
    setTimeout(() => {
      checkAITurn(aiPlayerId);
    }, 3000);
  }
}

function startAITurnCycle() {
  // Start AI turn cycle for all AI players
  Object.values(gameState.players).forEach(player => {
    if (player.isAI) {
      setTimeout(() => {
        checkAITurn(player.id);
      }, Math.random() * 5000); // Stagger AI starts
    }
  });
}

// AI Battle Integration
function handleAIBattle(aiPlayerId, battleResult) {
  const aiConfig = aiManager.getAIConfig(aiPlayerId);
  if (!aiConfig) return;
  
  // Update AI stats based on battle result
  if (battleResult.winner === aiPlayerId) {
    aiConfig.stats.battlesWon++;
  } else {
    aiConfig.stats.battlesLost++;
  }
  
  console.log(`AI ${aiPlayerId} battle result: ${battleResult.winner === aiPlayerId ? 'Won' : 'Lost'}`);
}

// AI Evolution Integration
function handleAIEvolution(aiPlayerId, evolutionResult) {
  const aiConfig = aiManager.getAIConfig(aiPlayerId);
  if (!aiConfig) return;
  
  aiConfig.stats.piecesEvolved++;
  
  console.log(`AI ${aiPlayerId} evolved piece: ${evolutionResult.newType}`);
}

// Lobby System Integration
function startGameFromLobby(lobbyId) {
  const lobby = lobbyManager.getLobby(lobbyId);
  if (!lobby || !lobbyManager.canStartGame(lobby)) {
    console.log(`Cannot start game from lobby ${lobbyId}`);
    return;
  }
  
  console.log(`Starting game from lobby: ${lobby.name}`);
  
  // Clear existing game state
  gameState.players = {};
  gameState.pieces = {};
  gameState.grid = {};
  gameState.playerCount = 0;
  gameState.pendingBattles = {};
  gameState.currentTurn = 0;
  gameState.activePlayer = null;
  
  // Create players from lobby
  lobby.players.forEach((lobbyPlayer, index) => {
    const spawnArea = GridUtils.getSpawnArea(index);
    const player = {
      id: lobbyPlayer.id,
      index: index,
      name: lobbyPlayer.name,
      color: getPlayerColor(index),
      selectedColor: getPlayerColor(index),
      pieces: [],
      spawnArea: spawnArea,
      isAI: false,
      stats: {
        piecesLost: 0,
        piecesEvolved: 0,
        battlesWon: 0,
        battlesLost: 0
      }
    };
    
    gameState.players[lobbyPlayer.id] = player;
    gameState.playerCount++;
    
    // Create starting pieces
    createStartingPieces(player);
  });
  
  // Set active player
  const playerIds = Object.keys(gameState.players);
  if (playerIds.length > 0) {
    gameState.activePlayer = playerIds[0];
  }
  
  // Update lobby status
  const gameId = `game_${Date.now()}`;
  lobbyManager.startGame(lobbyId, gameId);
  
  // Set game metadata for statistics
  gameState.gameId = gameId;
  gameState.gameMode = lobby.settings.gameMode || 'standard';
  gameState.startTime = new Date();
  
  // Record game start for all players
  Object.values(gameState.players).forEach(player => {
    statisticsManager.recordGameStart(player.id, gameId, gameState.gameMode);
    statisticsManager.initPlayerStats(player.id, player.name);
    
    // Initialize evolution bank with starting points
    evolutionManager.initializePlayerBank(player.id);
    evolutionManager.addEvolutionPoints(player.id, 5, 'game_start'); // Starting with 5 evolution points
  });
  
  // Start recording for spectators
  spectatorManager.startRecording('main', gameState);
  
  // Notify players that game has started
  io.to(lobbyId).emit('game-started', {
    gameId: gameId,
    players: gameState.players,
    activePlayer: gameState.activePlayer
  });
  
  // Send initial game state
  broadcastGameState();
  
  // Start AI turn cycle if needed
  startAITurnCycle();
  
  console.log(`Game started successfully with ${gameState.playerCount} players`);
}



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
  
  // Track piece birth for evolution system
  evolutionManager.trackPieceBirth(king.id, king);
  
  // Create Pawns - adjust formation based on spawn location
  // North pole players (row 0-9): pawns move south (+1 row)
  // South pole players (row 10-19): pawns move north (-1 row)
  const isNorthPole = baseRow <= 9;
  const pawnRowOffset = isNorthPole ? 1 : -1;
  
  GAME_CONFIG.STARTING_FORMATION.PAWNS.forEach((pawnPos, index) => {
    const pawnRow = baseRow + (pawnRowOffset * Math.abs(pawnPos.row));
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
    
    // Track piece birth for evolution system
    evolutionManager.trackPieceBirth(pawn.id, pawn);
  });
}

function handleDualMovementQueen(playerId, pieceId, matchingMove, targetRow, targetCol) {
  const piece = gameState.pieces[pieceId];
  
  // Store original position for recording
  const originalRow = piece.row;
  const originalCol = piece.col;
  
  // Handle capture if there's an enemy piece
  if (matchingMove.capture) {
    const capturedPiece = gameState.pieces[matchingMove.capture];
    if (capturedPiece && capturedPiece.playerId !== playerId) {
      console.log(`Dual Queen capture: ${piece.symbol} captures ${capturedPiece.symbol}`);
      
      // Remove captured piece
      const capturedPosKey = GridUtils.getPositionKey(capturedPiece.row, capturedPiece.col);
      delete gameState.grid[capturedPosKey];
      delete gameState.pieces[matchingMove.capture];
      
      // Remove from player's pieces array
      const capturedPlayer = gameState.players[capturedPiece.playerId];
      if (capturedPlayer) {
        capturedPlayer.pieces = capturedPlayer.pieces.filter(id => id !== matchingMove.capture);
      }
      
      // Award kill to Hybrid Queen
      piece.kills = (piece.kills || 0) + 1;
    }
  }
  
  // Move piece
  const oldPosKey = GridUtils.getPositionKey(piece.row, piece.col);
  delete gameState.grid[oldPosKey];
  
  piece.row = targetRow;
  piece.col = targetCol;
  gameState.grid[GridUtils.getPositionKey(targetRow, targetCol)] = pieceId;
  
  // Check circumnavigation
  const circumnavigatedPlayer = checkCircumnavigation(piece);
  if (circumnavigatedPlayer) {
    awardCircumnavigationBonus(circumnavigatedPlayer, piece);
  }
  
  // Check equator bonus for pawns
  checkEquatorBonus(piece);
  
  // Clean up expired weakening effects
  cleanupWeakeningEffects();
  
  console.log(`Piece ${piece.symbol} moved to (${targetRow}, ${targetCol}) in Queen mode`);
  broadcastGameState();
  
  return { 
    success: true, 
    message: `Hybrid Queen moved in Queen mode`,
    fromRow: originalRow,
    fromCol: originalCol,
    moveType: 'dual-queen'
  };
}

function handleDualMovementJumper(playerId, pieceId, matchingMove, targetRow, targetCol) {
  const piece = gameState.pieces[pieceId];
  
  // Store original position for recording
  const originalRow = piece.row;
  const originalCol = piece.col;
  
  // Handle multi-capture for jumper mode
  if (matchingMove.multiCapture && matchingMove.multiCapture.length > 0) {
    console.log(`Dual Jumper multi-capture: ${piece.symbol} captures ${matchingMove.multiCapture.length} pieces`);
    
    // Remove all captured pieces
    matchingMove.multiCapture.forEach(capturedPieceId => {
      const capturedPiece = gameState.pieces[capturedPieceId];
      if (capturedPiece) {
        const capturedPosKey = GridUtils.getPositionKey(capturedPiece.row, capturedPiece.col);
        delete gameState.grid[capturedPosKey];
        delete gameState.pieces[capturedPieceId];
        
        // Remove from player's pieces array
        const capturedPlayer = gameState.players[capturedPiece.playerId];
        if (capturedPlayer) {
          capturedPlayer.pieces = capturedPlayer.pieces.filter(id => id !== capturedPieceId);
        }
      }
    });
    
    // Award kills to Hybrid Queen
    piece.kills = (piece.kills || 0) + matchingMove.multiCapture.length;
    
    // Handle landing piece capture if applicable
    if (matchingMove.capture) {
      const landingPiece = gameState.pieces[matchingMove.capture];
      if (landingPiece && landingPiece.playerId !== playerId) {
        const landingPosKey = GridUtils.getPositionKey(landingPiece.row, landingPiece.col);
        delete gameState.grid[landingPosKey];
        delete gameState.pieces[matchingMove.capture];
        
        // Remove from player's pieces array
        const landingPlayer = gameState.players[landingPiece.playerId];
        if (landingPlayer) {
          landingPlayer.pieces = landingPlayer.pieces.filter(id => id !== matchingMove.capture);
        }
        
        piece.kills = (piece.kills || 0) + 1;
      }
    }
  }
  
  // Move piece
  const oldPosKey = GridUtils.getPositionKey(piece.row, piece.col);
  delete gameState.grid[oldPosKey];
  
  piece.row = targetRow;
  piece.col = targetCol;
  gameState.grid[GridUtils.getPositionKey(targetRow, targetCol)] = pieceId;
  
  // Check circumnavigation
  const circumnavigatedPlayer = checkCircumnavigation(piece);
  if (circumnavigatedPlayer) {
    awardCircumnavigationBonus(circumnavigatedPlayer, piece);
  }
  
  // Check equator bonus for pawns
  checkEquatorBonus(piece);
  
  // Broadcast multi-capture event
  io.emit('multi-jump-capture', {
    jumperId: pieceId,
    capturedPieceIds: matchingMove.multiCapture || [],
    jumperPosition: { row: piece.row, col: piece.col },
    playerId: playerId,
    captureCount: (matchingMove.multiCapture ? matchingMove.multiCapture.length : 0) + (matchingMove.capture ? 1 : 0)
  });
  
  console.log(`Piece ${piece.symbol} moved to (${targetRow}, ${targetCol}) in Jumper mode`);
  broadcastGameState();
  
  return { 
    success: true, 
    message: `Hybrid Queen moved in Jumper mode`,
    fromRow: originalRow,
    fromCol: originalCol,
    moveType: 'dual-jumper'
  };
}

function handlePieceMove(playerId, moveData) {
  const { pieceId, targetRow, targetCol } = moveData;
  const piece = gameState.pieces[pieceId];
  
  // Store original position for recording
  const originalRow = piece ? piece.row : null;
  const originalCol = piece ? piece.col : null;
  
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
        const oldType = piece.type;
        const evolvedPiece = evolvePiece(piece);
        gameState.pieces[piece.id] = evolvedPiece;
        
        console.log(`Evolution: ${piece.symbol} evolved to ${evolvedPiece.symbol}!`);
        
        // Record evolution statistics
        const player = gameState.players[piece.playerId];
        if (player) {
          player.stats.piecesEvolved = (player.stats.piecesEvolved || 0) + 1;
          statisticsManager.recordEvolution(piece.playerId, oldType, evolvedPiece.type, 0);
          
          // Update session stats if available
          if (player.stats.currentSession) {
            player.stats.currentSession.pieces.evolved++;
          }
        }
        
        // Broadcast evolution event
        io.emit('piece-evolution', {
          pieceId: piece.id,
          oldType: oldType,
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
      
      return { 
        success: true, 
        message: successMsg,
        fromRow: originalRow,
        fromCol: originalCol,
        moveType: 'jump-capture',
        captures: [capturedPieceId]
      };
    }
  }
  
  // Handle multi-jump-capture moves (evolved jumpers)
  if (matchingMove.type === 'multi-jump-capture') {
    return handleMultiJumpCapture(playerId, pieceId, matchingMove, targetRow, targetCol);
  }
  
  // Handle dual movement (Hybrid Queen)
  if (matchingMove.type === 'dual-move-queen') {
    return handleDualMovementQueen(playerId, pieceId, matchingMove, targetRow, targetCol);
  }
  
  if (matchingMove.type === 'dual-move-jumper') {
    return handleDualMovementJumper(playerId, pieceId, matchingMove, targetRow, targetCol);
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
      return { 
        success: true, 
        message: `Battle initiated: ${piece.symbol} vs ${targetPiece.symbol}`,
        fromRow: originalRow,
        fromCol: originalCol,
        moveType: 'battle'
      };
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
    const bank = evolutionManager.addEvolutionPoints(piece.playerId, 8, 'circumnavigation');
    console.log(`${piece.symbol} completed circumnavigation! +8 evolution points (${bank.points} total)`);
    
    // Broadcast evolution point award
    io.emit('evolution-point-award', {
      pieceId: piece.id,
      pieceType: piece.type,
      playerId: piece.playerId,
      points: 8,
      totalPoints: bank.points,
      reason: 'circumnavigation',
      position: { row: piece.row, col: piece.col }
    });
  }
  
  // Check equator bonus for pawns
  checkEquatorBonus(piece);
  
  const successMsg = `Piece ${piece.symbol} moved to (${targetRow}, ${targetCol})`;
  console.log(successMsg);
  
  // Advance turn counter
  gameState.currentTurn++;
  
  broadcastGameState();
  
  return { 
    success: true, 
    message: successMsg,
    fromRow: originalRow,
    fromCol: originalCol,
    moveType: 'normal'
  };
}

function checkSplitterBalance(piece, playerId) {
  const player = gameState.players[playerId];
  const currentTurn = gameState.currentTurn || 0;
  
  // Check cooldown: 3 turns between splits
  const lastSplitTurn = piece.lastSplitTurn || 0;
  const cooldownPassed = (currentTurn - lastSplitTurn) >= 3;
  
  if (!cooldownPassed) {
    return { 
      allowed: false, 
      reason: `Splitter must wait ${3 - (currentTurn - lastSplitTurn)} more turns before splitting again` 
    };
  }
  
  // Check evolution point cost: 2 points required
  const bank = evolutionManager.getPlayerBankInfo(playerId);
  if (bank.points < 2) {
    return { 
      allowed: false, 
      reason: `Splitter needs 2 evolution points to split (has ${bank.points})` 
    };
  }
  
  // Check population limit: max 3 splitters per player
  const splitterCount = player.pieces.filter(pieceId => 
    gameState.pieces[pieceId] && gameState.pieces[pieceId].type === 'SPLITTER'
  ).length;
  
  if (splitterCount >= 3) {
    return { 
      allowed: false, 
      reason: `Maximum 3 splitters per player (currently have ${splitterCount})` 
    };
  }
  
  return { allowed: true };
}

function applySplitCosts(piece, playerId) {
  const currentTurn = gameState.currentTurn || 0;
  
  // Deduct evolution points from bank
  const bank = evolutionManager.getPlayerBankInfo(playerId);
  evolutionManager.addEvolutionPoints(playerId, -2, 'splitter_split_cost');
  
  // Set cooldown
  piece.lastSplitTurn = currentTurn;
  
  // Temporary weakening: reduce attack value for 2 turns
  piece.splitWeakened = true;
  piece.weakenedUntilTurn = currentTurn + 2;
  
  console.log(`Splitter split cost applied: -2 evolution points, cooldown until turn ${currentTurn + 3}`);
  
  // Broadcast split cost event
  const updatedBank = evolutionManager.getPlayerBankInfo(playerId);
  io.emit('split-cost-applied', {
    pieceId: piece.id,
    evolutionPoints: updatedBank.points,
    cooldownTurns: 3,
    weakenedTurns: 2
  });
}

function cleanupWeakeningEffects() {
  const currentTurn = gameState.currentTurn || 0;
  
  Object.values(gameState.pieces).forEach(piece => {
    if (piece.splitWeakened && piece.weakenedUntilTurn <= currentTurn) {
      piece.splitWeakened = false;
      delete piece.weakenedUntilTurn;
      console.log(`Piece ${piece.symbol} recovered from split weakness`);
    }
  });
}

function checkEquatorBonus(piece) {
  // Only apply equator bonus to pawns
  if (piece.type !== 'PAWN') return;
  
  // Check if pawn is on the equator (row 10 in 0-19 grid)
  const isOnEquator = (piece.row === 10);
  
  // Check if this is the first time reaching the equator
  if (isOnEquator && !piece.hasReachedEquator) {
    piece.hasReachedEquator = true;
    const bank = evolutionManager.addEvolutionPoints(piece.playerId, 1, 'equator_bonus');
    
    console.log(`${piece.symbol} reached the equator! +1 evolution point (${bank.points} total)`);
    
    // Broadcast equator bonus event
    io.emit('equator-bonus', {
      pieceId: piece.id,
      pieceType: piece.type,
      playerId: piece.playerId,
      points: 1,
      totalPoints: bank.points,
      position: { row: piece.row, col: piece.col }
    });
  }
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
  
  // Check splitter balance limitations
  const balanceCheck = checkSplitterBalance(piece, playerId);
  if (!balanceCheck.allowed) {
    const errorMsg = `Split denied: ${balanceCheck.reason}`;
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
  
  // Track birth of new split piece
  evolutionManager.trackPieceBirth(splitPieceId, splitPiece);
  
  // Apply split costs and cooldown
  applySplitCosts(piece, playerId);
  
  // Record splitter usage statistics
  statisticsManager.recordSpecialAbility(playerId, 'splitter', {
    originalPosition: { row: piece.row, col: piece.col },
    newPosition: { row: targetRow, col: targetCol }
  });
  
  // Update evolution manager piece stats
  evolutionManager.updatePieceStats(pieceId, 'splits');
  
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

function handleMultiJumpCapture(playerId, pieceId, matchingMove, targetRow, targetCol) {
  const piece = gameState.pieces[pieceId];
  const enemyPiecesInArea = matchingMove.enemyPiecesInArea;
  const landingCapture = matchingMove.landingCapture;
  const maxCaptures = matchingMove.maxCaptures;
  
  // Store original position for recording
  const originalRow = piece.row;
  const originalCol = piece.col;
  
  // Determine which pieces to capture based on jumper type
  let piecesToCapture = [];
  
  if (maxCaptures === 'unlimited') {
    // Hybrid Queen - capture ALL pieces in area
    piecesToCapture = enemyPiecesInArea.map(ep => ep.id);
  } else {
    // Other jumpers - capture up to maxCaptures pieces
    // For now, we'll auto-select the first available pieces
    // TODO: Later we can add player choice UI
    piecesToCapture = enemyPiecesInArea.slice(0, maxCaptures).map(ep => ep.id);
  }
  
  // Add landing capture if applicable (Mistress Jumper and Hybrid Queen)
  if (landingCapture && matchingMove.canLandOnEnemy) {
    piecesToCapture.push(landingCapture.id);
  }
  
  // Remove all captured pieces
  let capturedPieces = [];
  piecesToCapture.forEach(capturedPieceId => {
    const capturedPiece = gameState.pieces[capturedPieceId];
    if (capturedPiece) {
      // Remove from grid and game state
      const capturedPosKey = GridUtils.getPositionKey(capturedPiece.row, capturedPiece.col);
      delete gameState.grid[capturedPosKey];
      delete gameState.pieces[capturedPieceId];
      
      // Remove from player's pieces array
      const capturedPlayer = gameState.players[capturedPiece.playerId];
      if (capturedPlayer) {
        capturedPlayer.pieces = capturedPlayer.pieces.filter(id => id !== capturedPieceId);
      }
      
      capturedPieces.push(capturedPiece);
    }
  });
  
  // Award kills to jumping piece
  piece.kills = (piece.kills || 0) + capturedPieces.length;
  
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
  
  // Broadcast multi-jump capture event
  io.emit('multi-jump-capture', {
    jumperId: pieceId,
    capturedPieceIds: piecesToCapture,
    capturedPieces: capturedPieces,
    jumperPosition: { row: piece.row, col: piece.col },
    captureArea: matchingMove.captureArea,
    playerId: playerId
  });
  
  const successMsg = `Multi-jump capture: ${piece.symbol} captured ${capturedPieces.length} pieces`;
  console.log(successMsg);
  broadcastGameState();
  
  return { 
    success: true, 
    message: successMsg,
    fromRow: originalRow,
    fromCol: originalCol,
    moveType: 'multi-jump-capture',
    captures: piecesToCapture
  };
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
  // Pause cooldowns during battle
  timingManager.pauseAllCooldowns();
  
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
  // Record the battle
  spectatorManager.recordBattle('main', {
    winnerId: winner.id,
    loserId: loser.id,
    winnerType: winner.type,
    loserType: loser.type,
    position: { row: loser.row, col: loser.col }
  });
  
  // Record battle statistics
  const battleWinnerPlayer = gameState.players[winner.playerId];
  const battleLoserPlayer = gameState.players[loser.playerId];
  
  if (battleWinnerPlayer && battleLoserPlayer) {
    // Initialize stats if missing
    if (!battleWinnerPlayer.stats) {
      battleWinnerPlayer.stats = { piecesLost: 0, piecesEvolved: 0, battlesWon: 0, battlesLost: 0 };
    }
    if (!battleLoserPlayer.stats) {
      battleLoserPlayer.stats = { piecesLost: 0, piecesEvolved: 0, battlesWon: 0, battlesLost: 0 };
    }

    // Update player stats
    battleWinnerPlayer.stats.battlesWon = (battleWinnerPlayer.stats.battlesWon || 0) + 1;
    battleLoserPlayer.stats.battlesLost = (battleLoserPlayer.stats.battlesLost || 0) + 1;
    
    // Record in statistics manager
    statisticsManager.recordBattle(winner.playerId, 'combat', 'win', loser.playerId);
    statisticsManager.recordBattle(loser.playerId, 'combat', 'loss', winner.playerId);
    
    // Update evolution manager piece stats
    evolutionManager.updatePieceStats(winner.id, 'battlesWon');
    evolutionManager.updatePieceStats(winner.id, 'piecesKilled');
    evolutionManager.updatePieceStats(loser.id, 'battlesLost');
    
    // Update session stats if available
    if (battleWinnerPlayer.stats.currentSession) {
      battleWinnerPlayer.stats.currentSession.battles++;
    }
    if (battleLoserPlayer.stats.currentSession) {
      battleLoserPlayer.stats.currentSession.battles++;
    }
  }
  
  // Increment winner's kill count
  winner.kills = (winner.kills || 0) + 1;
  
  // Award evolution points for attacking splitters
  if (loser.type === 'SPLITTER') {
    const bank = evolutionManager.addEvolutionPoints(winner.playerId, 1, 'defeated_splitter');
    console.log(`${winner.symbol} gains evolution point for defeating Splitter! (${bank.points} total)`);
    
    // Broadcast evolution point gain
    io.emit('evolution-point-gained', {
      winnerId: winner.id,
      playerId: winner.playerId,
      points: 1,
      totalPoints: bank.points,
      reason: 'defeated_splitter'
    });
  }
  
  // Remove loser from game
  const loserPosKey = GridUtils.getPositionKey(loser.row, loser.col);
  delete gameState.grid[loserPosKey];
  delete gameState.pieces[loser.id];
  
  // Clean up evolution tracking for dead piece
  evolutionManager.handlePieceDeath(loser.id);
  
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
    
    // Handle AI evolution integration
    if (gameState.players[winner.playerId] && gameState.players[winner.playerId].isAI) {
      handleAIEvolution(winner.playerId, { oldType: winner.type, newType: evolvedPiece.type });
    }
    
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
    
    // Send battle result to chat
    chatManager.sendGameEvent('main', 'battle_result', {
      winner: winner.symbol,
      loser: loser.symbol
    });
    
    // Use new victory manager for elimination
    victoryManager.handlePlayerElimination(loser.playerId, 'king_captured');
  } else {
    // Send battle result to chat for non-elimination battles
    chatManager.sendGameEvent('main', 'battle_result', {
      winner: winner.symbol,
      loser: loser.symbol
    });
  }
  
  // Handle AI battle integration
  if (gameState.players[winner.playerId] && gameState.players[winner.playerId].isAI) {
    handleAIBattle(winner.playerId, { winner: winner.playerId, loser: loser.playerId });
  }
  if (gameState.players[loser.playerId] && gameState.players[loser.playerId].isAI) {
    handleAIBattle(loser.playerId, { winner: winner.playerId, loser: loser.playerId });
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
  
  // Resume cooldowns after battle completion
  timingManager.resumeAllCooldowns();
}

function handleMoveCollision(playerId, moveData, conflictingMove) {
  const piece1 = gameState.pieces[moveData.pieceId];
  const piece2 = gameState.pieces[conflictingMove.move.pieceId];
  
  if (!piece1 || !piece2) {
    console.log('Invalid pieces in collision');
    return;
  }
  
  console.log(`Move collision detected: ${piece1.symbol} vs ${piece2.symbol} at (${moveData.targetRow}, ${moveData.targetCol})`);
  
  // Create a battle between the two pieces
  const battleId = `collision-${Date.now()}`;
  const pendingBattle = {
    id: battleId,
    attackingPiece: piece1,
    defendingPiece: piece2,
    type: 'collision',
    targetRow: moveData.targetRow,
    targetCol: moveData.targetCol
  };
  
  gameState.pendingBattles[battleId] = pendingBattle;
  
  // Check if this should trigger a contest
  if (shouldTriggerContest(piece1, piece2)) {
    const timeLimit = getContestTimeLimit(piece1, piece2);
    
    // Notify defending player about the collision contest
    io.to(piece2.playerId).emit('collision-contest-prompt', {
      battleId: battleId,
      attackingPiece: piece1,
      defendingPiece: piece2,
      timeLimit: timeLimit,
      targetPosition: { row: moveData.targetRow, col: moveData.targetCol }
    });
    
    // Start contest timer
    setTimeout(() => {
      if (gameState.pendingBattles[battleId]) {
        console.log(`Collision contest timeout for battle ${battleId}`);
        handleContestResponse(piece2.playerId, { battleId, wantsToContest: false });
      }
    }, timeLimit);
  } else {
    // Immediate battle resolution
    resolveBattleImmediate(piece1, piece2);
  }
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
  
  // Calculate game duration
  const gameStartTime = gameState.startTime || new Date();
  const gameDuration = (new Date() - gameStartTime) / 1000; // in seconds
  
  // Record statistics for all players
  const gameId = gameState.gameId || `game_${Date.now()}`;
  const gameMode = gameState.gameMode || 'standard';
  
  Object.values(gameState.players).forEach(player => {
    const result = player.id === victoryPlayer.id ? 'win' : 'loss';
    const finalStats = {
      piecesLost: player.stats?.piecesLost || 0,
      piecesEvolved: player.stats?.piecesEvolved || 0,
      battlesWon: player.stats?.battlesWon || 0,
      battlesLost: player.stats?.battlesLost || 0,
      gameMode: gameMode
    };
    
    statisticsManager.recordGameEnd(player.id, gameId, result, gameDuration, finalStats);
    
    // Initialize player stats if they don't exist
    statisticsManager.initPlayerStats(player.id, player.name);
  });
  
  // Finish recording the game
  spectatorManager.finishRecording('main', gameState);
  
  // Check if this is a tournament game
  if (gameState.isInTournament) {
    handleTournamentGameEnd(gameState, victoryPlayer.id);
  }
  
  // Broadcast victory event
  io.emit('game-victory', {
    winnerId: victoryPlayer.id,
    playerIndex: victoryPlayer.index,
    winnerColor: victoryPlayer.color,
    totalPlayers: Object.keys(gameState.players).length,
    isInTournament: gameState.isInTournament || false,
    tournamentId: gameState.tournamentId || null,
    matchId: gameState.matchId || null
  });
  
  // Optional: Reset game state after victory
  // resetGameState();
}

function getJumpCaptureArea(startRow, startCol, endRow, endCol) {
  // Calculate the 2x3 rectangular area that a jumper passes over
  // Based on the user's drawing, this is the area between start and end positions
  
  const captureArea = [];
  
  // Calculate the direction vector
  const rowDiff = endRow - startRow;
  const colDiff = endCol - startCol;
  
  // For knight-like moves, the 2x3 area is the rectangular region the piece "jumps over"
  // We'll calculate the midpoint and expand to create the 2x3 area
  const midRow = Math.floor((startRow + endRow) / 2);
  const midCol = GridUtils.normalizeCol(Math.floor((startCol + endCol) / 2));
  
  // Create a 2x3 area centered around the trajectory
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const areaRow = midRow + dr;
      const areaCol = GridUtils.normalizeCol(midCol + dc);
      
      if (GridUtils.isValidPosition(areaRow, areaCol)) {
        // Skip the start and end positions
        if (!((areaRow === startRow && areaCol === startCol) || 
              (areaRow === endRow && areaCol === endCol))) {
          captureArea.push({ row: areaRow, col: areaCol });
        }
      }
    }
  }
  
  return captureArea;
}

function getEnemyPiecesInArea(area, excludePlayerId) {
  // Get all enemy pieces within the specified area
  const enemyPieces = [];
  
  area.forEach(pos => {
    const posKey = GridUtils.getPositionKey(pos.row, pos.col);
    const pieceId = gameState.grid[posKey];
    
    if (pieceId) {
      const piece = gameState.pieces[pieceId];
      if (piece && piece.playerId !== excludePlayerId) {
        enemyPieces.push({
          id: pieceId,
          piece: piece,
          position: pos
        });
      }
    }
  });
  
  return enemyPieces;
}

function generateMovesForPattern(piece, pattern, mode) {
  const validMoves = [];
  
  if (mode === 'queen') {
    // Handle Queen-style omnidirectional movement
    pattern.directions.forEach(dir => {
      for (let distance = 1; distance <= pattern.maxDistance; distance++) {
        const targetRow = piece.row + (dir.row * distance);
        const targetCol = GridUtils.normalizeCol(piece.col + (dir.col * distance));
        
        if (!GridUtils.isValidPosition(targetRow, targetCol)) break;
        
        const targetKey = GridUtils.getPositionKey(targetRow, targetCol);
        const targetPieceId = gameState.grid[targetKey];
        
        if (targetPieceId) {
          // If occupied by enemy, can capture
          if (gameState.pieces[targetPieceId].playerId !== piece.playerId) {
            validMoves.push({
              row: targetRow,
              col: targetCol,
              type: 'dual-move-queen',
              mode: 'queen',
              capture: targetPieceId
            });
          }
          break; // Can't move past any piece
        } else {
          // Empty space - can move here
          validMoves.push({
            row: targetRow,
            col: targetCol,
            type: 'dual-move-queen',
            mode: 'queen'
          });
        }
      }
    });
  } else if (mode === 'jumper') {
    // Handle Jumper-style movement with multi-capture
    pattern.directions.forEach(dir => {
      const landingRow = piece.row + dir.row;
      const landingCol = GridUtils.normalizeCol(piece.col + dir.col);
      
      if (!GridUtils.isValidPosition(landingRow, landingCol)) return;
      
      const landingPosKey = GridUtils.getPositionKey(landingRow, landingCol);
      const landingPieceId = gameState.grid[landingPosKey];
      
      // Check if landing is allowed based on piece type
      const canLandHere = !landingPieceId || (pattern.multiCapture.canLandOnEnemy && landingPieceId);
      
      if (canLandHere) {
        // Calculate the 2x3 area this jump passes over
        const captureArea = getJumpCaptureArea(piece.row, piece.col, landingRow, landingCol);
        const enemyPiecesInArea = getEnemyPiecesInArea(captureArea, piece.playerId);
        
        // Check if there are enemy pieces to capture or if it's a valid move
        if (enemyPiecesInArea.length > 0 || !landingPieceId) {
          validMoves.push({
            row: landingRow,
            col: landingCol,
            type: 'dual-move-jumper',
            mode: 'jumper',
            capture: landingPieceId,
            multiCapture: enemyPiecesInArea.slice(0, pattern.multiCapture.maxCaptures)
          });
        }
      }
    });
  }
  
  return validMoves;
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
  
  // Handle dual movement pieces (Hybrid Queen)
  if (movementPattern.dualMovement && movementPattern.modes) {
    const queenMoves = generateMovesForPattern(piece, movementPattern.modes.queen, 'queen');
    const jumperMoves = generateMovesForPattern(piece, movementPattern.modes.jumper, 'jumper');
    
    return [...queenMoves, ...jumperMoves];
  }
  
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
    if (movementPattern.jumpOver && (piece.type === 'JUMPER' || piece.type === 'SUPER_JUMPER' || piece.type === 'HYPER_JUMPER' || piece.type === 'MISTRESS_JUMPER' || piece.type === 'HYBRID_QUEEN')) {
      // Evolved jumpers use multi-capture system
      movementPattern.directions.forEach(dir => {
        const landingRow = piece.row + dir.row; // Landing position
        const landingCol = GridUtils.normalizeCol(piece.col + dir.col);
        
        // Check if landing position is valid
        if (!GridUtils.isValidPosition(landingRow, landingCol)) return;
        
        // Check landing position occupancy
        const landingPosKey = GridUtils.getPositionKey(landingRow, landingCol);
        const landingPieceId = gameState.grid[landingPosKey];
        
        // Get multi-capture capabilities
        const multiCapture = movementPattern.multiCapture;
        
        // Check if landing is allowed based on piece type
        const canLandHere = !landingPieceId || (multiCapture.canLandOnEnemy && landingPieceId);
        
        if (canLandHere) {
          // Calculate the 2x3 area this jump passes over
          const captureArea = getJumpCaptureArea(piece.row, piece.col, landingRow, landingCol);
          const enemyPiecesInArea = getEnemyPiecesInArea(captureArea, piece.playerId);
          
          // Check if there are enemy pieces to capture or if it's a valid move
          if (enemyPiecesInArea.length > 0 || !landingPieceId) {
            // Check if landing piece is enemy (for Mistress/Hybrid Queen)
            let landingCapture = null;
            if (landingPieceId) {
              const landingPiece = gameState.pieces[landingPieceId];
              if (landingPiece.playerId !== piece.playerId) {
                landingCapture = {
                  id: landingPieceId,
                  piece: landingPiece,
                  position: { row: landingRow, col: landingCol }
                };
              }
            }
            
            validMoves.push({
              row: landingRow,
              col: landingCol,
              type: 'multi-jump-capture',
              captureArea: captureArea,
              enemyPiecesInArea: enemyPiecesInArea,
              landingCapture: landingCapture,
              maxCaptures: multiCapture.maxCaptures,
              canLandOnEnemy: multiCapture.canLandOnEnemy
            });
          }
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

// Store last game state for delta updates
let lastBroadcastState = null;

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
  
  // Also broadcast to spectators
  spectatorManager.broadcastToSpectators('main', 'game-state-update', clientGameState);
  
  // Store for delta updates
  lastBroadcastState = JSON.parse(JSON.stringify(clientGameState));
}

// Optimized broadcast for specific updates
function broadcastPieceUpdate(pieceId, piece) {
  io.emit('piece-update', { pieceId, piece });
}

function broadcastPieceRemoved(pieceId) {
  io.emit('piece-removed', { pieceId });
}

function broadcastPlayerUpdate(playerId, player) {
  io.emit('player-update', { playerId, player });
}

// Available colors for player selection
const AVAILABLE_COLORS = [
  { id: 'red', name: 'Red', hex: 0xFF0000 },
  { id: 'blue', name: 'Blue', hex: 0x0080FF },
  { id: 'light_blue', name: 'Light Blue', hex: 0x40C0FF },
  { id: 'green', name: 'Green', hex: 0x00FF00 },
  { id: 'yellow', name: 'Yellow', hex: 0xFFD700 },
  { id: 'purple', name: 'Purple', hex: 0x8000FF },
  { id: 'magenta', name: 'Magenta', hex: 0xFF00FF },
  { id: 'cyan', name: 'Cyan', hex: 0x00FFFF },
  { id: 'orange', name: 'Orange', hex: 0xFF8000 },
  { id: 'pink', name: 'Pink', hex: 0xFF69B4 },
  { id: 'lime', name: 'Lime', hex: 0x00FF80 },
  { id: 'teal', name: 'Teal', hex: 0x008080 }
];

// Track taken colors
const takenColors = new Set();

function getPlayerColor(index) {
  const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan', 'orange', 'pink'];
  return colors[index % colors.length];
}

function getAvailableColors() {
  return AVAILABLE_COLORS.filter(color => !takenColors.has(color.id));
}

function isColorAvailable(colorId) {
  return !takenColors.has(colorId);
}

function setPlayerColor(playerId, colorId) {
  const player = gameState.players[playerId];
  if (!player) return { success: false, error: 'Player not found' };
  
  if (!isColorAvailable(colorId)) {
    return { success: false, error: 'Color not available' };
  }
  
  // Remove old color if player had one
  if (player.selectedColor) {
    takenColors.delete(player.selectedColor);
  }
  
  // Set new color
  player.selectedColor = colorId;
  player.color = colorId; // Update the color field for compatibility
  takenColors.add(colorId);
  
  return { success: true, color: colorId };
}

// Tournament match handling
function startTournamentMatch(tournamentId, match) {
  const tournament = tournamentManager.getTournament(tournamentId);
  if (!tournament) return;

  match.status = MATCH_STATUS.ACTIVE;
  match.startedAt = new Date();
  
  // Create isolated game state for this match
  const matchGameState = {
    players: {},
    pieces: {},
    grid: {},
    playerCount: 0,
    pendingBattles: {},
    currentTurn: 0,
    activePlayer: null,
    tournamentId: tournamentId,
    matchId: match.id,
    isInTournament: true
  };

  // Initialize players for this match
  initializeTournamentPlayers(matchGameState, match.player1, match.player2);
  
  // Broadcast match start
  io.emit('tournament-match-started', {
    tournamentId,
    match,
    tournament,
    gameState: matchGameState
  });
  
  console.log(`Tournament match started: ${match.id} (${match.player1.name} vs ${match.player2.name})`);
}

function initializeTournamentPlayers(gameState, player1, player2) {
  const players = [player1, player2];
  
  players.forEach((player, index) => {
    const spawnArea = getSpawnArea(index);
    const playerData = {
      id: player.id,
      name: player.name,
      index: index,
      pieces: [],
      spawnArea: spawnArea,
      isInTournament: true,
      stats: {
        piecesLost: 0,
        piecesEvolved: 0,
        battlesWon: 0,
        battlesLost: 0
      }
    };
    
    gameState.players[player.id] = playerData;
    gameState.playerCount++;
    
    // Initialize evolution bank with starting points
    evolutionManager.initializePlayerBank(player.id);
    evolutionManager.addEvolutionPoints(player.id, 5, 'tournament_start');
    
    // Create pieces for this player
    const pieceIds = createPiecesForPlayer(gameState, player.id, spawnArea);
    playerData.pieces = pieceIds;
  });
}

function handleTournamentGameEnd(gameState, winnerId) {
  if (!gameState.isInTournament) return;
  
  const tournament = tournamentManager.getTournament(gameState.tournamentId);
  if (!tournament) return;
  
  // Report match result
  const result = tournamentManager.reportMatchResult(
    gameState.tournamentId,
    gameState.matchId,
    winnerId,
    {
      duration: Date.now() - gameState.startTime,
      totalMoves: gameState.totalMoves || 0,
      finalPieceCount: Object.keys(gameState.pieces).length
    }
  );
  
  if (result.success) {
    // Broadcast match completion
    io.emit('tournament-match-completed', {
      tournamentId: gameState.tournamentId,
      match: result.match,
      tournament: result.tournament
    });
    
    // Check if tournament is complete
    if (tournament.status === TOURNAMENT_STATUS.COMPLETED) {
      // Award prizes
      const prizes = tournamentManager.awardTournamentPrizes(gameState.tournamentId);
      const leaderboard = tournamentManager.getTournamentLeaderboard(gameState.tournamentId);
      
      io.emit('tournament-completed', {
        tournament: tournament,
        winner: tournament.winner,
        prizes: prizes,
        leaderboard: leaderboard
      });
      console.log(`Tournament completed: ${tournament.id}, Winner: ${tournament.winner.name}`);
    } else {
      // Start next match if available
      const nextMatch = tournamentManager.getNextMatch(gameState.tournamentId);
      if (nextMatch) {
        setTimeout(() => {
          startTournamentMatch(gameState.tournamentId, nextMatch);
        }, 3000); // 3 second delay between matches
      }
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Grid system: ${GAME_CONFIG.GRID_ROWS}x${GAME_CONFIG.GRID_COLS}`);
  console.log(`Max players: ${GAME_CONFIG.MAX_PLAYERS}`);
}); 