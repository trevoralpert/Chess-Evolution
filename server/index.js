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
  gridConfig: {
    rows: GAME_CONFIG.GRID_ROWS,
    cols: GAME_CONFIG.GRID_COLS
  },
  playerCount: 0,
  pendingBattles: {}, // battleId -> battle info
  pendingEvolutions: {}, // Track pending evolution choices
  isInTournament: false,
  tournamentId: null,
  matchId: null,
  currentTurn: 0,
  gameStartTime: null,
  activePlayer: null,
  gameEnded: false  // CRITICAL FIX: Always start with false
};

// CRITICAL FIX: Force reset game state on server startup
console.log('🔄 Server starting - resetting game state...');
gameState.gameEnded = false;
console.log('✅ Game state reset - gameEnded:', gameState.gameEnded);

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

// Helper function to start next player's turn
function startNextPlayerTurn(currentPlayerId) {
  console.log(`🔄 startNextPlayerTurn called with playerId: ${currentPlayerId}`);
  
  try {
    if (!gameState || !gameState.players) {
      console.error('❌ gameState or gameState.players is undefined');
      return;
    }
    
    console.log(`🔄 Available players:`, Object.keys(gameState.players));
    
    const activePlayers = Object.keys(gameState.players).filter(id => {
      const player = gameState.players[id];
      const isEliminated = player.eliminated || false;
      console.log(`🔄 Player ${id}: eliminated=${isEliminated}`);
      return !isEliminated;
    });
    
    console.log(`🔄 Active players: ${activePlayers.length}`, activePlayers);
    
    if (activePlayers.length < 2) {
      console.log('🔄 Not enough active players for turn rotation');
      return;
    }
    
    const currentIndex = activePlayers.indexOf(currentPlayerId);
    if (currentIndex === -1) {
      console.error(`❌ Current player ${currentPlayerId} not found in active players`);
      return;
    }
    
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    const nextPlayerId = activePlayers[nextIndex];
    
    console.log(`🔄 Turn transition: ${currentPlayerId} → ${nextPlayerId}`);
    
    // Set as active player
    gameState.activePlayer = nextPlayerId;
    
    // Start next player's timer
    console.log(`🔄 Starting timer for next player: ${nextPlayerId}`);
    timingManager.startPlayerCooldown(nextPlayerId);
    
    // Notify clients about active player change
    io.emit('active-player-changed', {
      playerId: nextPlayerId,
      playerName: gameState.players[nextPlayerId].name
    });
  } catch (error) {
    console.error('❌ Error in startNextPlayerTurn:', error);
  }
}

// Set up move executor for timing manager
timingManager.setMoveExecutor((playerId, moveData) => {
  let result;
  
  // Check if this is a split action by checking if it came from split-piece event
  if (moveData.isSplitAction) {
    console.log(`⏰ Executing queued split for player ${playerId}:`, moveData);
    result = handlePieceSplit(playerId, moveData);
    if (result) {
      // Send split confirmation back to the client
      io.emit('split-result', { success: true, message: result.message, playerId: playerId });
      
      // Note: Turn transition handled by move executor since splits go through timing system
    }
  } else {
    console.log(`⏰ Executing queued move for player ${playerId}:`, moveData);
    result = handlePieceMove(playerId, moveData);
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
      
      // Start next player's turn after regular move completes
      console.log('🔄 Setting timeout for regular move turn transition');
      setTimeout(() => {
        console.log('🔄 Regular move timeout executing - calling startNextPlayerTurn');
        startNextPlayerTurn(playerId);
      }, 500); // Small delay to let move complete
    }
  }
});

// Setup cleanup intervals
evolutionManager.setupCleanupInterval();

// Initialize victory system and main chat room
setTimeout(() => {
  victoryManager.initializeVictorySystem();
  chatManager.createChatRoom('main', 'Game Chat', 'game');
  
  // CRITICAL FIX: Auto-reset game state if victory was prematurely declared
  // This handles the case where the game was ended incorrectly and needs to be restarted
  setTimeout(() => {
    if (gameState.gameEnded) {
      const activePlayersCount = Object.values(gameState.players).filter(p => !p.eliminated).length;
      const gameTime = gameState.gameStartTime ? (Date.now() - gameState.gameStartTime) : 0;
      const hasActivePieces = Object.keys(gameState.pieces).length > 0;
      
      // If game is marked as ended but there are still active players and pieces,
      // and the game hasn't been running for 10+ minutes, reset the game state
      if (activePlayersCount > 0 && hasActivePieces && gameTime < 600000) {
        console.log(`🔄 DETECTED PREMATURE VICTORY - Resetting game state`);
        console.log(`  Active players: ${activePlayersCount}`);
        console.log(`  Active pieces: ${Object.keys(gameState.pieces).length}`);
        console.log(`  Game time: ${gameTime}ms`);
        
        victoryManager.resetGameState();
        
        // Broadcast game reset notification
        io.emit('game-reset', {
          message: 'Game has been reset due to premature victory declaration',
          reason: 'premature_victory',
          activePlayersCount,
          activePiecesCount: Object.keys(gameState.pieces).length
        });
      }
    }
  }, 2000); // Check 2 seconds after victory system init
}, 1000);

// === GAME MODE HELPER FUNCTIONS ===

function clearGameState() {
  console.log('🧹 Clearing game state for new game');
  gameState.players = {};
  gameState.pieces = {};
  gameState.grid = {};
  gameState.playerCount = 0;
  gameState.pendingBattles = {};
  gameState.pendingEvolutions = {};
  gameState.waitingForPlayers = false;
  gameState.gameEnded = false;
  gameState.gameStartTime = null;
  gameState.activePlayer = null;
  
  // ✅ PHASE 3: No color tracking needed - colors auto-assigned by index
}

function createPlayer(socketId, playerName, playerIndex) {
  console.log(`👤 Creating player: ${playerName} (index: ${playerIndex})`);
  
  const spawnArea = GAME_CONFIG.SPAWN_AREAS[playerIndex];
  
  // ✅ PHASE 3: Auto-assign color based on player index
  const assignedColor = getPlayerColorById(playerIndex);
  const assignedColorName = getPlayerColorName(playerIndex);
  
  console.log(`🎨 Auto-assigned ${assignedColorName} (${assignedColor}) to player ${playerIndex + 1}`);
  
  const player = {
    id: socketId,
    name: playerName || `Player ${playerIndex + 1}`,
    index: playerIndex,
    color: assignedColor,
    selectedColor: assignedColor, // For compatibility
    assignedColorName: assignedColorName, // For display purposes
    spawnArea: spawnArea,
    pieces: [],
    stats: {
      piecesLost: 0,
      piecesEvolved: 0,
      battlesWon: 0,
      battlesLost: 0
    }
  };
  
  // No need to track taken colors - each player index has a unique color
  
  // Initialize evolution bank with starting points
  evolutionManager.initializePlayerBank(socketId);
  evolutionManager.addEvolutionPoints(socketId, 1, 'game_start');
  
  // Create starting pieces for the player
  createStartingPieces(player);
  
  // Add player to timing system
  timingManager.addPlayer(socketId);
  
  return player;
}

function createAIPlayer(aiPlayerId, difficulty, playerIndex) {
  console.log(`🤖 Creating AI player: ${difficulty} (index: ${playerIndex})`);
  
  const spawnArea = GAME_CONFIG.SPAWN_AREAS[playerIndex];
  
  // ✅ PHASE 3: Auto-assign color based on player index
  const assignedColor = getPlayerColorById(playerIndex);
  const assignedColorName = getPlayerColorName(playerIndex);
  
  console.log(`🎨 Auto-assigned ${assignedColorName} (${assignedColor}) to AI player ${playerIndex + 1}`);
  
  const aiPlayer = {
    id: aiPlayerId,
    index: playerIndex,
    color: assignedColor,
    selectedColor: assignedColor, // For compatibility
    assignedColorName: assignedColorName, // For display purposes
    spawnArea: spawnArea,
    pieces: [],
    isAI: true,
    aiDifficulty: difficulty,
    name: `AI ${AI_DIFFICULTY[difficulty].name}`,
    stats: {
      piecesLost: 0,
      piecesEvolved: 0,
      battlesWon: 0,
      battlesLost: 0
    }
  };
  
  // No need to track taken colors - each player index has a unique color
  
  // Register with AI manager
  aiManager.addAIPlayer(aiPlayerId, difficulty, {});
  
  // Initialize evolution bank with starting points
  evolutionManager.initializePlayerBank(aiPlayerId);
  evolutionManager.addEvolutionPoints(aiPlayerId, 1, 'game_start');
  
  // Create starting pieces for AI
  createStartingPieces(aiPlayer);
  
  // Add AI player to timing system
  timingManager.addPlayer(aiPlayerId);
  
  return aiPlayer;
}

function initializeGameSystems() {
  console.log('🎮 Initializing game systems');
  
  // Start recording for spectators
  spectatorManager.startRecording('main', gameState);
  gameState.gameStartTime = Date.now();
  
  // Always initialize timing system with the new gameState (even with 0 players)
  timingManager.initialize(gameState);
  
  // Add players to main chat room
  Object.values(gameState.players).forEach(player => {
    if (!player.isAI) {
      chatManager.joinChatRoom('main', player.id, player.name, player.id);
    }
  });
  
  // Start AI turn cycle if needed
  setTimeout(() => {
    const hasAI = Object.values(gameState.players).some(p => p.isAI);
    if (hasAI) {
      startAITurnCycle();
    }
  }, 1000);
}

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Send connection confirmation (no auto-player creation)
  socket.emit('connection-established', {
    socketId: socket.id,
    availableGameModes: ['create-vs-ai', 'create-vs-human', 'join-human-game', 'spectate']
  });
  
  // Send current game state for spectator preview if game exists
  if (Object.keys(gameState.players).length > 0) {
    socket.emit('game-preview', {
      playersCount: gameState.playerCount,
      gameInProgress: !gameState.gameEnded,
      canJoin: gameState.playerCount < GAME_CONFIG.MAX_PLAYERS
    });
  }
  
  // === NEW GAME MODE HANDLERS ===
  
  // Quick Play vs AI - Immediate 1v1 game  
  socket.on('create-vs-ai-game', (data) => {
    const { playerName, difficulty } = data;
    console.log(`🤖 Creating vs AI game: ${playerName} vs AI (${difficulty})`);
    
    // Clear any existing game
    clearGameState();
    
    // Create human player
    const humanPlayer = createPlayer(socket.id, playerName, 0);
    gameState.players[socket.id] = humanPlayer;
    gameState.playerCount = 1;
    
    // Create AI opponent
    const aiPlayerId = `ai-${Date.now()}`;
    const aiPlayer = createAIPlayer(aiPlayerId, difficulty || 'MEDIUM', 1);
    gameState.players[aiPlayerId] = aiPlayer;
    gameState.playerCount = 2;
    
    // Initialize game systems
    initializeGameSystems();
    
    // Start the game immediately
    socket.emit('game-created', { 
      gameType: 'vs-ai',
      players: gameState.players,
      message: `Game started: ${playerName} vs AI ${difficulty}` 
    });
    
    broadcastGameState();
  });
  
  // Create game vs Human - Wait for another player
  socket.on('create-vs-human-game', (data) => {
    const { playerName } = data;
    console.log(`👥 Creating vs Human game: ${playerName} waiting for opponent`);
    
    // Check if there's already a waiting game
    if (gameState.playerCount > 0) {
      socket.emit('game-creation-failed', { 
        error: 'A game is already in progress. Try joining instead.' 
      });
      return;
    }
    
    // Clear any existing game
    clearGameState();
    
    // Create human player and wait
    const humanPlayer = createPlayer(socket.id, playerName, 0);
    gameState.players[socket.id] = humanPlayer;
    gameState.playerCount = 1;
    gameState.waitingForPlayers = true;
    
    // Initialize basic systems (no AI)
    initializeGameSystems();
    
    socket.emit('game-created', { 
      gameType: 'vs-human-waiting',
      players: gameState.players,
      message: `Game created: ${playerName} waiting for opponent...` 
    });
    
    // Broadcast that a game is waiting for players
    io.emit('game-waiting-for-players', {
      creatorName: playerName,
      playersNeeded: 1
    });
    
    // Broadcast initial game state so the first player can see their pieces while waiting
    broadcastGameState();
  });
  
  // Join Human Game - Join existing waiting game  
  socket.on('join-human-game', (data) => {
    const { playerName } = data;
    console.log(`🤝 ${playerName} attempting to join human game`);
    
    // Check if there's a waiting game
    if (gameState.playerCount !== 1 || !gameState.waitingForPlayers) {
      socket.emit('join-failed', { 
        error: 'No games available to join. Try creating a new game.' 
      });
      return;
    }
    
    // Check if game is full
    if (gameState.playerCount >= GAME_CONFIG.MAX_PLAYERS) {
      socket.emit('join-failed', { error: 'Game is full' });
      return;
    }
    
    // Add as second player
    const humanPlayer = createPlayer(socket.id, playerName, 1);
    gameState.players[socket.id] = humanPlayer;
    gameState.playerCount = 2;
    gameState.waitingForPlayers = false;
    
    // Add player to timing system  
    timingManager.addPlayer(socket.id);
    
    // Start the game now that we have 2 players
    socket.emit('game-joined', { 
      gameType: 'vs-human',
      players: gameState.players,
      message: `${playerName} joined the game!` 
    });
    
    // Notify other players
    socket.broadcast.emit('player-joined-game', {
      playerName: playerName,
      totalPlayers: gameState.playerCount
    });
    
    broadcastGameState();
  });
  
  // Handle player information updates
  socket.on('player-joined', (data) => {
    const { name } = data; // ✅ PHASE 4 FIX: No longer accept color - auto-assigned by Phase 3 system
    const player = gameState.players[socket.id];
    
    if (player) {
      // Update player name if provided
      if (name) {
        player.name = name;
        console.log(`Player ${socket.id} updated name to: ${name}`);
      }
      
      // ✅ PHASE 4: Color is already auto-assigned in createPlayer() - no manual override allowed
      
      // Initialize statistics with proper name
      statisticsManager.initPlayerStats(socket.id, player.name);
      
      // Broadcast updated game state
      broadcastGameState();
    }
  });
  
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
    // Mark this as a split action for the move executor
    data.isSplitAction = true;
    
    // Check timing system for turn validation and collision detection
    const timingResult = timingManager.registerMove(socket.id, data);
    
    if (!timingResult.success) {
      if (timingResult.collision) {
        // Handle collision - trigger battle (splits can also collide)
        socket.emit('move-collision', {
          message: 'Split collision detected! Resolving battle...',
          conflictingMove: timingResult.conflictingMove
        });
        
        // Trigger battle between pieces
        handleMoveCollision(socket.id, data, timingResult.conflictingMove);
      } else {
        socket.emit('split-result', { success: false, message: timingResult.error });
      }
      return;
    }
    
    if (timingResult.queued) {
      // Split is queued, will be executed when timer reaches 0
      socket.emit('move-queued', { 
        message: `Split queued: ${timingResult.message}`,
        queued: true,
        timeRemaining: timingResult.timeRemaining
      });
    } else {
      // Split is pending, will be executed after collision window
      socket.emit('move-pending', { 
        message: 'Split registered, checking for conflicts...',
        pending: true 
      });
    }
  });
  
  socket.on('get-valid-moves', (data) => {
    const validMoves = getValidMoves(data.pieceId);
    console.log(`📋 Valid moves for piece ${data.pieceId}:`, validMoves.map(m => `(${m.row},${m.col}) type:${m.type}`));
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
    evolutionManager.addEvolutionPoints(aiPlayerId, 1, 'game_start');
    
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
    console.log(`🎯 PHASE 5 DEBUG: request-evolution-choice received for piece ${pieceId}`);
    
    const piece = gameState.pieces[pieceId];
    console.log(`🎯 PHASE 5 DEBUG: piece found:`, piece ? `${piece.type} at (${piece.row},${piece.col})` : 'NOT FOUND');
    
    if (!piece || piece.playerId !== socket.id) {
      console.log(`🎯 PHASE 5 DEBUG: Invalid piece or ownership - piece exists: ${!!piece}, owner match: ${piece?.playerId === socket.id}`);
      socket.emit('evolution-choice-failed', { error: 'Invalid piece or not your piece' });
      return;
    }
    
    // ✅ PHASE 6 BUG FIX: Use proper evolution path system and correct event name
    const availablePaths = evolutionManager.getAvailableEvolutionPaths(pieceId, piece, socket.id);
    console.log(`🎯 PHASE 5 DEBUG: Available paths:`, availablePaths.length, availablePaths.map(p => p.targetType));
    
    // ✅ PHASE 5 FIX: Show evolution dialog even if no affordable paths (player can see what's available)
    if (availablePaths.length === 0) {
      console.log(`🎯 PHASE 5 DEBUG: No evolution paths defined for piece type ${piece.type}`);
      socket.emit('evolution-choice-failed', { error: `No evolution paths available for ${piece.type} pieces` });
      return;
    }
    
    // ✅ PHASE 7: Use piece's evolution points instead of player bank
    const piecePoints = piece.evolutionPoints || PIECE_TYPES[piece.type].points;
    console.log(`🎯 PHASE 7 DEBUG: Piece has ${piecePoints} evolution points`);
    
    // Pause cooldowns during evolution choice
    timingManager.pauseAllCooldowns();
    
    // ✅ PHASE 7: Send piece points instead of bank info
    console.log(`🎯 PHASE 5 DEBUG: Emitting evolution-choice-dialog to client`);
    socket.emit('evolution-choice-dialog', {
      pieceId: pieceId,
      piece: piece,
      reason: 'right_click', // Indicate this was requested via right-click
      availablePaths: availablePaths,
      piecePoints: piecePoints,  // Send piece's evolution points
      timeLimit: 30 // 30 seconds to make choice
    });
  });

  socket.on('make-evolution-choice', (data) => {
    const { pieceId, pathId } = data;
    
    console.log(`📝 Evolution choice started for piece ${pieceId}, path ${pathId}`);
    console.log(`📝 Current player count: ${Object.keys(gameState.players).length}`);
    console.log(`📝 Players with pieces:`, Object.entries(gameState.players).map(([id, p]) => 
      `${p.name}: ${p.pieces.filter(pid => gameState.pieces[pid]).length} pieces`
    ));
    
    // Pause victory checks during evolution
    victoryManager.pauseForEvolution();
    
    const result = evolutionManager.processEvolutionChoice(socket.id, pieceId, pathId);
    
    if (!result.success) {
      socket.emit('evolution-choice-failed', { error: result.error });
      
      // Resume victory checks on failure
      victoryManager.resumeAfterEvolution();
      return;
    }
    
    // Apply the evolution to the piece
    const piece = gameState.pieces[pieceId];
    if (piece) {
      const oldType = piece.type;
      const newType = result.evolution.toType;
      
      console.log(`📝 Evolving piece ${pieceId} from ${oldType} to ${newType}`);
      console.log(`📝 Player ${socket.id} pieces before evolution:`, gameState.players[socket.id].pieces);
      console.log(`📝 Piece exists in gameState.pieces:`, !!gameState.pieces[pieceId]);
      
      // Update piece type and properties
      const newPieceData = PIECE_TYPES[newType];
      if (newPieceData) {
        piece.type = newType;
        piece.symbol = newPieceData.symbol;
        piece.value = newPieceData.points;
        
        // Update game state
        gameState.pieces[pieceId] = piece;
        
        console.log(`📝 Evolution complete. Piece ${pieceId} is now ${newType}`);
        console.log(`📝 Updated piece:`, piece);
        console.log(`📝 Player ${socket.id} pieces after evolution:`, gameState.players[socket.id].pieces);
        console.log(`📝 All pieces for player:`, gameState.players[socket.id].pieces.map(pid => ({
          id: pid,
          exists: !!gameState.pieces[pid],
          type: gameState.pieces[pid]?.type
        })));
        
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
    
    // Keep victory checks paused for a bit longer after evolution
    setTimeout(() => {
      victoryManager.resumeAfterEvolution();
    }, 3000); // 3 second delay after evolution
      }
    }
    
    socket.emit('evolution-choice-success', {
      pieceId: pieceId,
      evolution: result.evolution,
      bankInfo: evolutionManager.getPlayerBankInfo(socket.id)
    });
    
    // Resume cooldowns after evolution choice is complete
    timingManager.resumeAllCooldowns();
    
    // Start next player's turn after evolution completes
    console.log('🔄 Setting timeout for evolution turn transition');
    setTimeout(() => {
      console.log('🔄 Evolution timeout executing - calling startNextPlayerTurn');
      startNextPlayerTurn(socket.id);
    }, 500); // Small delay to let evolution complete
    
    // Victory checks will be resumed after evolution-completed is broadcast
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

  // Evolution choice dialog handlers
  socket.on('evolution-choice-response', (data) => {
    const { pieceId, choice } = data;
    handleEvolutionChoiceResponse(socket.id, pieceId, choice);
  });
  
  // Vault capture selection handlers
  socket.on('vault-capture-response', (data) => {
    handleVaultCaptureResponse(socket.id, data);
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

  // ✅ PHASE 3: Auto-Color Assignment - No color selection handlers needed
  // Colors are assigned automatically based on player index
  console.log('🎨 Auto-color assignment active - manual color selection disabled');

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
  // Debug command to evolve a piece for testing
  socket.on('debug-evolve-piece', (data) => {
    const { pieceId, newType } = data;
    const piece = gameState.pieces[pieceId];
    
    if (!piece || piece.playerId !== socket.id) {
      console.log('Debug evolve failed - invalid piece');
      return;
    }
    
    console.log(`🔧 DEBUG: Evolving ${piece.type} to ${newType}`);
    
    // Pause victory checks during debug evolution
    victoryManager.pauseForEvolution();
    
    // Update piece type
    const oldType = piece.type;
    piece.type = newType;
    piece.symbol = PIECE_TYPES[newType].symbol;
    piece.value = PIECE_TYPES[newType].points;
    
    // Ensure piece is still properly tracked in game state
    gameState.pieces[pieceId] = piece;
    
    // Broadcast the evolution
    io.emit('piece-evolved', {
      pieceId: pieceId,
      oldType: oldType,
      newType: newType,
      playerId: socket.id,
      position: { row: piece.row, col: piece.col }
    });
    
    // Update game state
    broadcastGameState();
    
    // Resume victory checks after a delay
    setTimeout(() => {
      victoryManager.resumeAfterEvolution();
    }, 2000);
  });

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
      
      // ✅ PHASE 3: No color freeing needed - colors are auto-assigned by index
      // Colors are automatically available for the next player with the same index
      
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
      
              // ✅ PHASE 3: No color freeing needed - auto-assigned by index
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
  gameState.pendingEvolutions = {}; // Track pending evolution choices
  gameState.isInTournament = false;
  gameState.tournamentId = null;
  gameState.matchId = null;
  gameState.currentTurn = 0;
  gameState.gameStartTime = null;
  gameState.activePlayer = null;
  gameState.gameEnded = false; // Track if game has ended
  
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
    evolutionManager.addEvolutionPoints(player.id, 1, 'game_start'); // Starting with 1 evolution point
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
  
  console.log(`🎯 Creating pieces for Player ${player.index + 1} at spawn area (${baseRow}, ${baseCol})`);
  console.log(`🎯 Player details:`, { id: player.id, name: player.name, color: player.color });
  
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
    timeAlive: 0,
    moveCount: 0,  // ✅ PHASE 7: Track move count for evolution bonuses
    evolutionPoints: PIECE_TYPES.KING.points  // ✅ PHASE 7: Track piece's individual evolution points
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
      timeAlive: 0,
      moveCount: 0,  // ✅ PHASE 7: Track move count for evolution bonuses
      evolutionPoints: PIECE_TYPES.PAWN.points  // ✅ PHASE 7: Pawns start with 1 evolution point
    };
    
    gameState.pieces[pawn.id] = pawn;
    gameState.grid[GridUtils.getPositionKey(pawnRow, pawnCol)] = pawn.id;
    player.pieces.push(pawn.id);
    
    // Track piece birth for evolution system
    evolutionManager.trackPieceBirth(pawn.id, pawn);
  });
  
  console.log(`🎯 Created ${player.pieces.length} pieces for player ${player.name}:`, player.pieces);
  console.log(`🎯 Total pieces in gameState:`, Object.keys(gameState.pieces).length);
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
      
      // Award evolution points for jump capture (equal to captured piece value)
      const capturedPieceValue = PIECE_TYPES[capturedPiece.type]?.points || 0;
      const bank = evolutionManager.addEvolutionPoints(piece.playerId, capturedPieceValue, 'jump_capture');
      console.log(`${piece.symbol} gains ${capturedPieceValue} evolution points for capturing ${capturedPiece.type}! (${bank.points} total)`);
      
      // Check if player has evolution points to offer choice dialog
      if (bank.points > 0) {
        offerEvolutionChoice(piece.playerId, piece.id, 'jump_capture');
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
    const result = handleMultiJumpCapture(playerId, pieceId, matchingMove, targetRow, targetCol);
    // If capture selection is pending, don't proceed with turn transition
    if (result && result.pending) {
      return null; // This prevents the normal turn transition
    }
    return result;
  }
  
  // Handle dual movement (Hybrid Queen)
  if (matchingMove.type === 'dual-move-queen') {
    return handleDualMovementQueen(playerId, pieceId, matchingMove, targetRow, targetCol);
  }
  
  if (matchingMove.type === 'dual-move-jumper') {
    return handleDualMovementJumper(playerId, pieceId, matchingMove, targetRow, targetCol);
  }
  
  // Handle heir production (Vaultmistress and Covenant Queen)
  if (matchingMove.type === 'produce-heir') {
    return handleHeirProduction(playerId, pieceId);
  }
  
  // Check if position is occupied (for regular moves)
  const targetPosKey = GridUtils.getPositionKey(targetRow, targetCol);
  const targetPieceId = gameState.grid[targetPosKey];
  
  // Early block: Pawns/Splitters cannot move onto an occupied pole square (even enemy).
  const destinationIsPole = (targetRow === 0 || targetRow === GAME_CONFIG.GRID_ROWS - 1);
  if (destinationIsPole && (piece.type === 'PAWN' || piece.type === 'SPLITTER') && targetPieceId) {
    const errorMsg = `Invalid move: ${piece.type} cannot enter occupied pole square (${targetRow}, ${targetCol})`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('move-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
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
  
  // ✅ PHASE 7: Increment move count
  piece.moveCount = (piece.moveCount || 0) + 1;
  console.log(`🎯 PHASE 7: ${piece.type} moved - moveCount: ${piece.moveCount}`);
  
  // ✅ PHASE 7: Check move-based bonuses for pawns
  if (piece.type === 'PAWN') {
    checkMoveBasedBonuses(piece);
  }
  
  // ✅ PHASE 7: Check position-based bonus for splitters
  if (piece.type === 'SPLITTER') {
    checkSplitterPositionBonus(piece);
  }
  
  const successMsg = `Piece ${piece.symbol} moved to (${targetRow}, ${targetCol})`;
  console.log(successMsg);
  
  // Advance turn counter
  gameState.currentTurn++;
  
  broadcastGameState();
  
  // Check for checkmate after the move
  for (const opponentId of Object.keys(gameState.players)) {
    if (opponentId !== playerId) {
      if (isKingInCheck(opponentId)) {
        console.log(`👑 Player ${opponentId} is in CHECK!`);
        
        // Notify players about check
        io.emit('player-in-check', {
          playerId: opponentId,
          inCheck: true
        });
        
              // Check for checkmate
      if (isPlayerInCheckmate(opponentId)) {
        console.log(`♔ CHECKMATE! Player ${opponentId} has been checkmated!`);
        
        // Check if player has an heir before handling elimination
        const hasHeir = spawnHeirIfAvailable(opponentId);
        
        if (!hasHeir) {
          // No heir - handle checkmate like king capture
          victoryManager.handlePlayerElimination(opponentId, 'checkmate');
          
          // Notify about checkmate
          io.emit('checkmate', {
            playerId: opponentId,
            checkmatedBy: playerId
          });
        } else {
          // Heir spawned - player continues
          console.log(`👑 New King spawned from heir for player ${opponentId}!`);
          io.emit('heir-activated', {
            playerId: opponentId,
            message: 'Heir has become the new King!'
          });
        }
      }
      } else {
        // Clear check status if player is no longer in check
        io.emit('player-in-check', {
          playerId: opponentId,
          inCheck: false
        });
      }
    }
  }
  
  // ✅ PHASE 7: Check circumnavigation (reaching opposite pole) for all standard moves
  const circumnavigatedPlayer = checkCircumnavigation(piece);
  if (circumnavigatedPlayer) {
    awardCircumnavigationBonus(circumnavigatedPlayer, piece);
  }
  
  // Disallow Pawns and Splitters from entering an occupied pole square (row 0 or 19)
  const isPoleDestination = (targetRow === 0 || targetRow === GAME_CONFIG.GRID_ROWS - 1);
  if (isPoleDestination && (piece.type === 'PAWN' || piece.type === 'SPLITTER')) {
    const destPosKey = GridUtils.getPositionKey(targetRow, targetCol);
    if (gameState.grid[destPosKey]) {
      const errorMsg = `Invalid move: ${piece.type} cannot enter occupied pole square (${targetRow}, ${targetCol})`;
      console.log(errorMsg);
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit('move-result', { success: false, message: errorMsg });
      }
      return null;
    }
  }
  
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
  
  // Check cooldown: 1 turn between splits (reduced from 3)
  const lastSplitTurn = piece.lastSplitTurn || 0;
  const cooldownPassed = (currentTurn - lastSplitTurn) >= 1;
  
  if (!cooldownPassed) {
    return { 
      allowed: false, 
      reason: `Splitter must wait ${1 - (currentTurn - lastSplitTurn)} more turns before splitting again` 
    };
  }
  
  // PHASE 1C: Remove evolution point cost requirement - splitting is inherent to Splitters!
  // Splitters can split without consuming evolution points
  
  // Population limit removed - unlimited splitters allowed
  return { allowed: true };
}

function applySplitCosts(piece, playerId) {
  const currentTurn = gameState.currentTurn || 0;
  
  // PHASE 1C: Splitters should NOT lose points when splitting - splitting is free!
  // Remove evolution point deduction - splitters maintain their inherent 2-point value
  const bank = evolutionManager.getPlayerBankInfo(playerId);
  
  // Set cooldown only
  piece.lastSplitTurn = currentTurn;
  
  // Temporary weakening: reduce attack value for 2 turns
  piece.splitWeakened = true;
  piece.weakenedUntilTurn = currentTurn + 2;
  
  console.log(`Splitter split executed: NO evolution point cost, cooldown until turn ${currentTurn + 1}`);
  
  // Broadcast split cost event (no evolution point cost)
  io.emit('split-cost-applied', {
    pieceId: piece.id,
    evolutionPoints: bank.points, // No change in points
    cooldownTurns: 1,
    weakenedTurns: 2,
    splitFree: true // Indicate that splitting was free
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

// ✅ PHASE 7: Move-based evolution point system
function checkMoveBasedBonuses(piece) {
  // Only apply move-based bonuses to pawns
  if (piece.type !== 'PAWN') return;
  
  const moveCount = piece.moveCount || 0;
  
  // Check for equator bonus at 9 moves
  if (moveCount === 9 && !piece.hasEquatorBonus) {
    piece.hasEquatorBonus = true;
    // ✅ PHASE 7: Add evolution point to the piece itself
    piece.evolutionPoints = (piece.evolutionPoints || 1) + 1;
    
    console.log(`🎯 PHASE 7: ${piece.symbol} crossed equator (9 moves)! Now has ${piece.evolutionPoints} evolution points`);
    
    // Broadcast equator bonus event
    io.emit('equator-bonus', {
      pieceId: piece.id,
      pieceType: piece.type,
      playerId: piece.playerId,
      points: 1,
      piecePoints: piece.evolutionPoints,  // Send the piece's total points
      moveCount: moveCount,
      position: { row: piece.row, col: piece.col }
    });
    
    // Broadcast game state to update floating numbers
    broadcastGameState();
    
    // Offer evolution choice to human players
    const pieceOwner = gameState.players[piece.playerId];
    if (pieceOwner && !pieceOwner.isAI) {
      offerEvolutionChoice(piece.playerId, piece.id, 'equator_bonus');
    }
  }
  
  // Check for circumnavigation bonus at 18 moves
  if (moveCount === 18 && !piece.hasCircumnavigationBonus) {
    piece.hasCircumnavigationBonus = true;
    // ✅ PHASE 7: Add evolution points to the piece itself
    piece.evolutionPoints = (piece.evolutionPoints || 1) + 8;
    
    console.log(`🎯 PHASE 7: ${piece.symbol} completed circumnavigation (18 moves)! Now has ${piece.evolutionPoints} evolution points`);
    
    // Broadcast circumnavigation bonus event
    io.emit('circumnavigation-bonus', {
      pieceId: piece.id,
      pieceType: piece.type,
      playerId: piece.playerId,
      points: 8,
      piecePoints: piece.evolutionPoints,  // Send the piece's total points
      moveCount: moveCount,
      position: { row: piece.row, col: piece.col }
    });
    
    // Broadcast game state to update floating numbers
    broadcastGameState();
    
    // Offer evolution choice to human players
    const pieceOwner = gameState.players[piece.playerId];
    if (pieceOwner && !pieceOwner.isAI) {
      offerEvolutionChoice(piece.playerId, piece.id, 'circumnavigation_bonus');
    }
  }
}

// ✅ PHASE 7: Position-based bonus for splitters
function checkSplitterPositionBonus(piece) {
  // Only apply to splitters
  if (piece.type !== 'SPLITTER') return;
  
  // Check if splitter is at row 0 or 19 (poles)
  if ((piece.row === 0 || piece.row === 19) && !piece.hasCircumnavigationBonus) {
    piece.hasCircumnavigationBonus = true;
    // ✅ PHASE 7: Add evolution points to the piece itself
    piece.evolutionPoints = (piece.evolutionPoints || 2) + 8;
    
    console.log(`🎯 PHASE 7: ${piece.symbol} reached pole! Now has ${piece.evolutionPoints} evolution points`);
    
    // Broadcast pole bonus event
    io.emit('pole-bonus', {
      pieceId: piece.id,
      pieceType: piece.type,
      playerId: piece.playerId,
      points: 8,
      piecePoints: piece.evolutionPoints,  // Send the piece's total points
      moveCount: piece.moveCount || 0,
      position: { row: piece.row, col: piece.col }
    });
    
    // Broadcast game state to update floating numbers
    broadcastGameState();
  }
}

function checkCircumnavigation(piece) {
  // Check if a pawn or splitter has reached the opposite pole
  const player = gameState.players[piece.playerId];
  if (!player) return null;
  
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
  
  // ✅ PHASE 6 BUG FIX: Return player object if circumnavigation achieved, null if not
  if (piece.row === oppositeRow) {
    return player; // Return the player object for consistent API
  }
  
  return null; // No circumnavigation
}

// ✅ PHASE 6 BUG FIX: Add missing awardCircumnavigationBonus function
function awardCircumnavigationBonus(player, piece) {
  // ✅ PHASE 7 UPDATE: Award circumnavigation bonus directly to the piece rather than banking to the player
  // Only Pawns and Splitters are eligible for circumnavigation bonus
  if (piece.type !== 'PAWN' && piece.type !== 'SPLITTER') {
    return; // Other piece types do not receive this bonus
  }
  if (!player || !piece) {
    console.warn('⚠️ awardCircumnavigationBonus called with invalid parameters');
    return;
  }
  
  // Only award once per piece
  if (piece.hasCircumnavigationBonus) return;
  piece.hasCircumnavigationBonus = true;

  // Add 8 evolution points to the piece itself
  piece.evolutionPoints = (piece.evolutionPoints || PIECE_TYPES[piece.type].points) + 8;
  console.log(`🎯 PHASE 7: ${piece.symbol} completed circumnavigation! Now has ${piece.evolutionPoints} evolution points`);
  
  // Broadcast circumnavigation bonus event so clients can update UI
  io.emit('circumnavigation-bonus', {
    pieceId: piece.id,
    pieceType: piece.type,
    playerId: player.id,
    points: 8,
    piecePoints: piece.evolutionPoints,
    moveCount: piece.moveCount || 0,
    position: { row: piece.row, col: piece.col }
  });
  
  // Push updated game state so floating numbers & labels refresh
  broadcastGameState();
  
  // Offer evolution choice to a human player if they own this piece
  if (!player.isAI) {
    offerEvolutionChoice(player.id, piece.id, 'circumnavigation_bonus');
  }
}

function handlePieceSplit(playerId, splitData) {
  const { pieceId, targetRow, targetCol } = splitData;
  const piece = gameState.pieces[pieceId];
  
  // CRITICAL FIX: Check if game has actually ended by looking at player count, not just the flag
  const activePlayers = Object.values(gameState.players).filter(p => !p.eliminated);
  const alivePlayers = activePlayers.filter(p => {
    if (!p.pieces || !Array.isArray(p.pieces)) return false;
    return p.pieces.filter(pieceId => {
      const piece = gameState.pieces[pieceId];
      return piece && piece.playerId === p.id;
    }).length > 0;
  });
  
  // Only block splits if there's actually less than 2 players with pieces
  if (alivePlayers.length < 2) {
    const errorMsg = `Cannot split: only ${alivePlayers.length} player(s) remaining`;
    console.log(errorMsg);
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('split-result', { success: false, message: errorMsg });
    }
    return null;
  }
  
  // REMOVED: Check if game has ended flag - this was causing false positives
  // The above check for actual player count is more reliable
  
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
  const matchingSplitMove = validMoves.find(move => 
    move.row === targetRow && move.col === targetCol && move.type === 'split'
  );
  
  if (!matchingSplitMove) {
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
  
  // Check if target position is occupied and handle enemy capture
  const targetPosKey = GridUtils.getPositionKey(targetRow, targetCol);
  const targetPieceId = gameState.grid[targetPosKey];
  
  let capturedPiece = null;
  if (targetPieceId) {
    const targetPiece = gameState.pieces[targetPieceId];
    if (targetPiece && targetPiece.playerId !== playerId) {
      // Enemy piece - capture it!
      capturedPiece = targetPiece;
      console.log(`Splitter capture: ${piece.symbol} splits onto and captures ${capturedPiece.symbol}`);
      
      // Remove captured piece from game
      delete gameState.grid[targetPosKey];
      delete gameState.pieces[targetPieceId];
      
      // Remove from player's pieces array
      const capturedPlayer = gameState.players[capturedPiece.playerId];
      if (capturedPlayer) {
        capturedPlayer.pieces = capturedPlayer.pieces.filter(id => id !== targetPieceId);
      }
      
      // Award kill to splitting piece
      piece.kills = (piece.kills || 0) + 1;
      
      // Award evolution points for capture
          const capturedPieceValue = PIECE_TYPES[targetPiece.type]?.points || 0;
    const bank = evolutionManager.addEvolutionPoints(piece.playerId, capturedPieceValue, 'split_capture');
    console.log(`${piece.symbol} gains ${capturedPieceValue} evolution points for capturing ${targetPiece.type}! (${bank.points} total)`);
      
      // Clean up evolution tracking for dead piece
      evolutionManager.handlePieceDeath(targetPieceId);
      
    } else if (targetPiece && targetPiece.playerId === playerId) {
      const errorMsg = `Invalid split: cannot split onto own piece`;
      console.log(errorMsg);
      const playerSocket = io.sockets.sockets.get(playerId);
      if (playerSocket) {
        playerSocket.emit('split-result', { success: false, message: errorMsg });
      }
      return null;
    }
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
    moveCount: 0, // ✅ PHASE 7: New split pieces start with 0 moves
    evolutionPoints: piece.evolutionPoints || PIECE_TYPES.SPLITTER.points, // ✅ PHASE 7: Inherit parent's evolution points
    isSplitCopy: true, // Mark this as a split copy
    // ✅ PHASE 4: Copy color information from parent piece to ensure split pieces match team colors
    inheritedColor: player.selectedColor || player.color, // Inherit player's color
    parentPieceId: piece.id // Track which piece this was split from for debugging
  };
  
  // Debug: Log the color inheritance for split pieces
  console.log(`🎨 PHASE 4 - SPLIT COLOR INHERITANCE: Split piece ${splitPieceId} inherits color '${splitPiece.inheritedColor}' from player ${player.name} (selectedColor: '${player.selectedColor}', color: '${player.color}')`);
  console.log(`🎨 Player ${player.name} color assignment: selectedColor='${player.selectedColor}', color='${player.color}', assignedColorName='${player.assignedColorName}'`);
  
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
  
  const successMsg = capturedPiece ? 
    `Splitter ${piece.symbol} split to (${targetRow}, ${targetCol}) and captured ${capturedPiece.symbol}` :
    `Splitter ${piece.symbol} split to (${targetRow}, ${targetCol})`;
  console.log(successMsg);
  
  // Broadcast split event
  io.emit('piece-split', {
    originalPieceId: pieceId,
    newPieceId: splitPieceId,
    originalPosition: { row: piece.row, col: piece.col },
    newPosition: { row: targetRow, col: targetCol },
    playerId: playerId,
    capturedPiece: capturedPiece ? {
      id: capturedPiece.id,
      type: capturedPiece.type,
      symbol: capturedPiece.symbol,
      position: { row: targetRow, col: targetCol }
    } : null
  });
  
  // Advance turn counter
  gameState.currentTurn++;
  
  broadcastGameState();
  
  // Note: Turn transition is now handled by move executor since splits go through timing system
  return { success: true, message: successMsg };
}

function handleVaultCaptureResponse(playerId, data) {
  const pendingCapture = gameState.pendingCaptures?.[playerId];
  if (!pendingCapture) {
    console.log('No pending capture found for player');
    return;
  }
  
  // Clean up pending capture
  delete gameState.pendingCaptures[playerId];
  
  // Resume timers
  timingManager.resumeAllCooldowns();
  
  // Process the capture with selected pieces
  const result = handleMultiJumpCapture(
    playerId,
    pendingCapture.pieceId,
    pendingCapture.matchingMove,
    pendingCapture.targetRow,
    pendingCapture.targetCol,
    data.selectedCaptures
  );
  
  if (result && !result.pending) {
    // Record the move
    spectatorManager.recordMove('main', {
      type: 'move',
      playerId: playerId,
      pieceId: pendingCapture.pieceId,
      fromPosition: { row: pendingCapture.originalRow, col: pendingCapture.originalCol },
      toPosition: { row: pendingCapture.targetRow, col: pendingCapture.targetCol },
      moveType: result.moveType || 'multi-jump-capture',
      captures: result.captures || []
    });
    
    // Send confirmation back to the client
    io.emit('move-result', { success: true, message: result.message, playerId: playerId });
    
    // Start next player's turn
    setTimeout(() => {
      startNextPlayerTurn(playerId);
    }, 500);
  }
}

function handleHeirProduction(playerId, pieceId) {
  const piece = gameState.pieces[pieceId];
  if (!piece) {
    console.log(`Piece not found: ${pieceId}`);
    return { success: false, message: 'Piece not found' };
  }
  
  // Mark piece as having produced heir
  piece.hasProducedHeir = true;
  
  // Store original position for recording
  const originalRow = piece.row;
  const originalCol = piece.col;
  
  console.log(`${piece.symbol} (${piece.type}) is producing an heir`);
  
  // Broadcast heir production event
  io.emit('heir-produced', {
    pieceId: pieceId,
    pieceType: piece.type,
    playerId: playerId,
    position: { row: piece.row, col: piece.col }
  });
  
  // Update game state to show piece has heir
  broadcastGameState();
  
  return { 
    success: true, 
    message: `${piece.type} produced an heir`,
    fromRow: originalRow,
    fromCol: originalCol,
    moveType: 'produce-heir'
  };
}

function handleMultiJumpCapture(playerId, pieceId, matchingMove, targetRow, targetCol, selectedCaptures = null) {
  const piece = gameState.pieces[pieceId];
  const enemyPiecesInArea = matchingMove.enemyPiecesInArea;
  const landingCapture = matchingMove.landingCapture;
  const maxCaptures = matchingMove.maxCaptures;
  
  // Store original position for recording
  const originalRow = piece.row;
  const originalCol = piece.col;
  
  // Check if this is a vault piece that needs player selection
  const isVaultPiece = ['VAULTBOUND', 'VAULTSEER', 'VAULTARCHER', 'VAULTMISTRESS'].includes(piece.type);
  // New rule: vault pieces auto-capture lowest-value targets, no UI selection
  const needsSelection = false;
  if (isVaultPiece && !selectedCaptures) {
    // Sort enemy pieces by point value ascending, then choose up to maxCaptures
    const sortedByValue = enemyPiecesInArea.sort((a, b) => {
      const av = PIECE_TYPES[a.piece.type]?.points || 0;
      const bv = PIECE_TYPES[b.piece.type]?.points || 0;
      return av - bv;
    });
    selectedCaptures = maxCaptures === 'all' ? sortedByValue.map(ep => ep.id)
      : sortedByValue.slice(0, maxCaptures).map(ep => ep.id);
  }
  
  if (needsSelection && gameState.players[playerId] && !gameState.players[playerId].isAI) {
    // Pause timers and request player selection
    timingManager.pauseAllCooldowns();
    
    // Store pending capture for later
    gameState.pendingCaptures = gameState.pendingCaptures || {};
    gameState.pendingCaptures[playerId] = {
      pieceId,
      matchingMove,
      targetRow,
      targetCol,
      originalRow,
      originalCol,
      timestamp: Date.now()
    };
    
    // Send capture selection request to player
    const playerSocket = io.sockets.sockets.get(playerId);
    if (playerSocket) {
      playerSocket.emit('vault-capture-selection', {
        pieceId,
        pieceType: piece.type,
        jumpArea: matchingMove.captureArea,
        enemyPieces: enemyPiecesInArea.map(ep => ({
          id: ep.id,
          type: ep.piece.type,
          symbol: ep.piece.symbol,
          position: ep.position
        })),
        maxCaptures,
        canLandOnEnemy: matchingMove.canLandOnEnemy,
        landingCapture: landingCapture ? {
          id: landingCapture.id,
          type: landingCapture.piece.type,
          symbol: landingCapture.piece.symbol,
          position: landingCapture.position
        } : null,
        timeLimit: 30 // 30 seconds to choose
      });
    }
    
    // Set timeout for automatic selection
    setTimeout(() => {
      if (gameState.pendingCaptures[playerId]) {
        console.log('Vault capture selection timed out - auto-selecting');
        const autoSelected = enemyPiecesInArea.slice(0, maxCaptures).map(ep => ep.id);
        handleVaultCaptureResponse(playerId, { selectedCaptures: autoSelected });
      }
    }, 30000);
    
    return { success: true, message: 'Waiting for capture selection...', pending: true };
  }
  
  // Determine which pieces to capture based on jumper type
  let piecesToCapture = [];
  
  if (maxCaptures === 'unlimited' || maxCaptures === 'all') {
    // Hybrid Queen and Covenant Queen - capture ALL pieces in area
    piecesToCapture = enemyPiecesInArea.map(ep => ep.id);
  } else if (selectedCaptures) {
    // Use player's selected captures
    piecesToCapture = selectedCaptures;
  } else {
    // Auto-select for AI or non-vault pieces
    piecesToCapture = enemyPiecesInArea.slice(0, maxCaptures).map(ep => ep.id);
  }
  
  // Add landing capture if applicable (Vaultmistress, Covenant Queen, Mistress Jumper and Hybrid Queen)
  if (landingCapture && matchingMove.canLandOnEnemy && !piecesToCapture.includes(landingCapture.id)) {
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
  
  // Award evolution points for multi-jump capture (sum of all captured piece values)
  let totalCaptureValue = 0;
  capturedPieces.forEach(capturedPiece => {
    totalCaptureValue += PIECE_TYPES[capturedPiece.type]?.points || 0;
  });
  const bank = evolutionManager.addEvolutionPoints(piece.playerId, totalCaptureValue, 'multi_jump_capture');
  console.log(`${piece.symbol} gains ${totalCaptureValue} evolution points for multi-jump capture! (${bank.points} total)`);
  
  // Check if player has evolution points to offer choice dialog
  if (bank.points > 0) {
    offerEvolutionChoice(piece.playerId, piece.id, 'multi_jump_capture');
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
  
  // SIMPLIFIED BATTLE SYSTEM: Attacker always wins in direct attacks
  // No more value-based restrictions or contests
  console.log(`Direct attack: ${attackingPiece.symbol} captures ${defendingPiece.symbol}`);
  
  // Winner is always the attacker in direct attacks
  completeBattleResolution(attackingPiece, defendingPiece);
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
  
  // ✅ PHASE 7: Award evolution points equal to captured piece value (Kings have no value)
  const capturedPieceValue = loser.type === 'KING' ? 0 : (PIECE_TYPES[loser.type]?.points || 0);
  if (capturedPieceValue > 0) {
    winner.evolutionPoints = (winner.evolutionPoints || PIECE_TYPES[winner.type].points) + capturedPieceValue;
    console.log(`🎯 PHASE 7: ${winner.symbol} captured ${loser.symbol}! Gained ${capturedPieceValue} points, now has ${winner.evolutionPoints} evolution points`);
    
    // Broadcast evolution point gain
    io.emit('piece-evolution-point-gained', {
      pieceId: winner.id,
      pieceType: winner.type,
      playerId: winner.playerId,
      points: capturedPieceValue,
      piecePoints: winner.evolutionPoints,  // Send the piece's total points
      reason: 'capture',
      position: { row: winner.row, col: winner.col }
    });
  } else if (loser.type === 'KING') {
    console.log(`🎯 ${winner.symbol} captured ${loser.symbol}! Kings provide no evolution points.`);
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
  
  // Check if winner can evolve using new evolution system
  // Only check if piece has evolution points, not kill counts
  const bankInfo = evolutionManager.getPlayerBankInfo(winner.playerId);
  const hasEvolutionPoints = bankInfo && bankInfo.points > 0;
  
  if (hasEvolutionPoints) {
    // Handle AI evolution automatically (AI doesn't get choice dialog)
    if (gameState.players[winner.playerId] && gameState.players[winner.playerId].isAI) {
      // AI still uses automatic evolution but through the new system
      const availablePaths = evolutionManager.getAvailableEvolutionPaths(winner.playerId, winner.id);
      if (availablePaths.length > 0) {
        // AI picks the first available evolution path
        const chosenPath = availablePaths[0];
        const result = evolutionManager.processEvolutionChoice(winner.playerId, winner.id, chosenPath.id);
        
        if (result.success) {
          // Apply the evolution
          const oldType = winner.type;
          const newType = result.evolution.toType;
          const newPieceData = PIECE_TYPES[newType];
          
          if (newPieceData) {
            winner.type = newType;
            winner.symbol = newPieceData.symbol;
            winner.value = newPieceData.points;
            gameState.pieces[winner.id] = winner;
            
            console.log(`AI Evolution: ${winner.symbol} evolved to ${newPieceData.symbol}!`);
            handleAIEvolution(winner.playerId, { oldType: oldType, newType: newType });
            
            // Broadcast evolution event
            io.emit('piece-evolution', {
              pieceId: winner.id,
              oldType: oldType,
              newType: newType,
              position: { row: winner.row, col: winner.col }
            });
          }
        }
      }
    } else {
      // Offer choice dialog to human players
      offerEvolutionChoice(winner.playerId, winner.id, 'battle_victory');
    }
  }
  
  // Check for checkmate (King capture) and player elimination
  if (loser.type === 'KING') {
    console.log(`CHECKMATE! King ${loser.symbol} captured - Player ${loser.playerId} eliminated!`);
    
    // Check if player has an heir before handling elimination
    const hasHeir = spawnHeirIfAvailable(loser.playerId);
    
    if (!hasHeir) {
      // Send battle result to chat
      chatManager.sendGameEvent('main', 'battle_result', {
        winner: winner.symbol,
        loser: loser.symbol
      });
      
      // Use new victory manager for elimination
      victoryManager.handlePlayerElimination(loser.playerId, 'king_captured');
    } else {
      // Heir spawned - player continues
      console.log(`👑 New King spawned from heir for player ${loser.playerId}!`);
      io.emit('heir-activated', {
        playerId: loser.playerId,
        message: 'Heir has become the new King!'
      });
      
      // Send special battle result for heir activation
      chatManager.sendGameEvent('main', 'heir_activated', {
        winner: winner.symbol,
        loser: loser.symbol,
        newKing: true
      });
    }
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
  
  // SIMPLIFIED COLLISION SYSTEM: Always use dice battle for simultaneous moves
  // No more contests - go straight to dice battle
  console.log(`Simultaneous move collision - initiating dice battle!`);
  
  // Notify both players about the collision battle
  io.emit('collision-battle-start', {
    piece1: {
      id: piece1.id,
      type: piece1.type,
      symbol: piece1.symbol,
      value: piece1.value,
      playerId: piece1.playerId
    },
    piece2: {
      id: piece2.id,
      type: piece2.type,
      symbol: piece2.symbol,
      value: piece2.value,
      playerId: piece2.playerId
    },
    targetPosition: { row: moveData.targetRow, col: moveData.targetCol }
  });
  
  // Go straight to dice battle for collisions
  resolveBattleWithDice(piece1, piece2);
}

function calculateBattleAnimationDuration(battleLog) {
  // 1 second per die + 1 second for each tie-breaker round
  const initialDiceTime = 1; // 1 second for initial dice
  const tieBreakerTime = battleLog.rounds.length * 1; // 1 second per tie-breaker
  return initialDiceTime + tieBreakerTime;
}

function offerEvolutionChoice(playerId, pieceId, reason) {
  console.log(`🎯 OFFER EVOLUTION - Called for player ${playerId}, piece ${pieceId}, reason: ${reason}`);
  
  const piece = gameState.pieces[pieceId];
  if (!piece) {
    console.log(`🎯 OFFER EVOLUTION - No piece found for ${pieceId}`);
    return;
  }
  
  // ✅ PHASE 6 BUG FIX: Use proper EvolutionManager method instead of incomplete standalone function
  const availablePaths = evolutionManager.getAvailableEvolutionPaths(pieceId, piece, playerId);
  console.log(`🎯 OFFER EVOLUTION - Available paths:`, availablePaths);
  if (availablePaths.length === 0) {
    console.log(`🎯 OFFER EVOLUTION - No available paths for ${piece.type}`);
    return;
  }
  
  // Get player's current evolution points
  const bankInfo = evolutionManager.getPlayerBankInfo(playerId);
  console.log(`🎯 OFFER EVOLUTION - Bank info:`, bankInfo);
  
  // Pause all game timers while player makes choice
  timingManager.pauseAllCooldowns();
  
  // Send evolution choice dialog to player
  const playerSocket = io.sockets.sockets.get(playerId);
  console.log(`🎯 OFFER EVOLUTION - Player socket found:`, !!playerSocket);
  if (playerSocket) {
    console.log(`🎯 OFFER EVOLUTION - Emitting evolution-choice-dialog to ${playerId}`);
    playerSocket.emit('evolution-choice-dialog', {
      pieceId: pieceId,
      piece: piece,
      reason: reason,
      availablePaths: availablePaths,
      bankInfo: bankInfo,
      timeLimit: 30 // 30 seconds to make choice
    });
  }
  
  // Set timeout for automatic banking if no choice made
  setTimeout(() => {
    if (gameState.pieces[pieceId] && gameState.pieces[pieceId].type === piece.type) {
      // No evolution choice was made, bank the points
      bankEvolutionPoints(playerId, pieceId, reason);
    }
  }, 30000); // 30 seconds
}

function getAvailableEvolutionPaths(piece) {
  const availablePaths = [];
  
  // Based on piece type, determine available evolution paths
  switch (piece.type) {
    case 'PAWN':
      availablePaths.push({
        id: 'pawn_to_splitter',
        targetType: 'SPLITTER',
        cost: 1,
        description: 'Evolve to Splitter - Can split into two pieces'
      });
      break;
    case 'SPLITTER':
      availablePaths.push({
        id: 'splitter_to_bishop',
        targetType: 'BISHOP',
        cost: 3,
        description: 'Evolve to Bishop - Diagonal movement'
      });
      availablePaths.push({
        id: 'splitter_to_knight',
        targetType: 'KNIGHT',
        cost: 3,
        description: 'Evolve to Knight - L-shaped movement'
      });
      break;
    // Add more evolution paths as needed
  }
  
  return availablePaths;
}

function bankEvolutionPoints(playerId, pieceId, reason) {
  const piece = gameState.pieces[pieceId];
  if (!piece) return;
  
  // Award evolution points based on reason
  let pointsAwarded = 0;
  switch (reason) {
    case 'jump_capture':
    case 'multi_jump_capture':
      pointsAwarded = 1;
      break;
    case 'battle_victory':
      pointsAwarded = 2;
      break;
    default:
      pointsAwarded = 1;
  }
  
  const bank = evolutionManager.addEvolutionPoints(playerId, pointsAwarded, `banked_${reason}`);
  
  console.log(`${piece.symbol} banked ${pointsAwarded} evolution points from ${reason} (${bank.points} total)`);
  
  // Broadcast banking event
  io.emit('evolution-points-banked', {
    pieceId: pieceId,
    playerId: playerId,
    points: pointsAwarded,
    totalPoints: bank.points,
    reason: reason
  });
  
  // Resume game timers
  timingManager.resumeAllCooldowns();
}

function handleEvolutionChoiceResponse(playerId, pieceId, choice) {
  const piece = gameState.pieces[pieceId];
  if (!piece || piece.playerId !== playerId) return;
  
  if (choice === 'bank') {
    // Player chose to bank the points
    bankEvolutionPoints(playerId, pieceId, 'player_choice');
  } else if (choice.evolutionPath) {
    // Player chose to evolve
    const evolutionPath = choice.evolutionPath;
    const bankInfo = evolutionManager.getPlayerBankInfo(playerId);
    
    // Check if player has enough points
    if (piece.evolutionPoints >= evolutionPath.cost) {
      // ✅ PHASE 7: Use piece's own evolution points instead of player bank
      // No deduction needed - piece keeps its points through evolution
      
      // Perform evolution
      const oldType = piece.type;
      const newType = evolutionPath.targetType;
      
      // Update piece type and properties
      const newPieceData = PIECE_TYPES[newType];
      if (newPieceData) {
        piece.type = newType;
        piece.symbol = newPieceData.symbol;
        piece.value = newPieceData.points;
        // ✅ PHASE 7: Preserve the piece's accumulated evolution points
        // evolutionPoints stays the same - only the type changes
        
        // Update game state
        gameState.pieces[pieceId] = piece;
        
        // Record evolution statistics
        const player = gameState.players[playerId];
        if (player) {
          player.stats.piecesEvolved = (player.stats.piecesEvolved || 0) + 1;
          statisticsManager.recordEvolution(playerId, oldType, newType, evolutionPath.cost);
        }
        
        console.log(`Player Evolution: ${oldType} evolved to ${newType} for ${evolutionPath.cost} points`);
        
        // Broadcast evolution event
        io.emit('piece-evolution', {
          pieceId: pieceId,
          oldType: oldType,
          newType: newType,
          position: { row: piece.row, col: piece.col }
        });
        
        // Update game state
        broadcastGameState();
      }
    } else {
      // Not enough points, bank instead
      bankEvolutionPoints(playerId, pieceId, 'insufficient_points');
    }
    
    // Resume game timers
    timingManager.resumeAllCooldowns();
  }
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
  // Based on the user's drawing, this is the rectangle between start and end positions
  
  const captureArea = [];
  
  // Calculate the bounding box between start and end positions
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  
  // The 2x3 area is the rectangle that includes all squares between start and end
  // For a knight move, this will be either a 2x3 or 3x2 rectangle
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      // Skip the start and end positions themselves
      if ((row === startRow && col === startCol) || 
          (row === endRow && col === endCol)) {
        continue;
      }
      
      if (GridUtils.isValidPosition(row, col)) {
        captureArea.push({ 
          row: row, 
          col: GridUtils.normalizeCol(col) 
        });
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
  
  // Add heir production option for Vaultmistress and Covenant Queen
  if ((piece.type === 'VAULTMISTRESS' || piece.type === 'COVENANT_QUEEN') && 
      !piece.hasProducedHeir && !gameState.players[piece.playerId]?.isInCheckmate) {
    validMoves.push({
      row: piece.row,
      col: piece.col,
      type: 'produce-heir',
      specialAbility: true
    });
  }
  
  return validMoves;
}

// Check if a position is under attack by the opponent
function isPositionUnderAttack(row, col, byPlayerId) {
  // Check all opponent pieces to see if any can attack this position
  for (const pieceId in gameState.pieces) {
    const piece = gameState.pieces[pieceId];
    if (piece.playerId === byPlayerId) {
      const moves = getValidMoves(pieceId);
      for (const move of moves) {
        if (move.row === row && move.col === col && (move.type === 'attack' || move.type === 'multi-jump-capture')) {
          return true;
        }
      }
    }
  }
  return false;
}

// Check if a player's king is in check
function isKingInCheck(playerId) {
  // Find the player's king
  let kingPiece = null;
  for (const pieceId in gameState.pieces) {
    const piece = gameState.pieces[pieceId];
    if (piece.type === 'KING' && piece.playerId === playerId) {
      kingPiece = piece;
      break;
    }
  }
  
  if (!kingPiece) return false; // No king found
  
  // Get all opponent player IDs
  const opponentIds = Object.keys(gameState.players).filter(id => id !== playerId);
  
  // Check if any opponent can attack the king's position
  for (const opponentId of opponentIds) {
    if (isPositionUnderAttack(kingPiece.row, kingPiece.col, opponentId)) {
      return true;
    }
  }
  
  return false;
}

// Spawn heir if available when player is checkmated
function spawnHeirIfAvailable(playerId) {
  const player = gameState.players[playerId];
  if (!player) return false;
  
  // Find heir-producing piece
  let heirProducer = null;
  for (const pieceId of player.pieces) {
    const piece = gameState.pieces[pieceId];
    if (piece && piece.hasProducedHeir && 
        (piece.type === 'VAULTMISTRESS' || piece.type === 'COVENANT_QUEEN')) {
      heirProducer = piece;
      break;
    }
  }
  
  if (!heirProducer) return false;
  
  // Find old King to remove
  let oldKing = null;
  for (const pieceId of player.pieces) {
    const piece = gameState.pieces[pieceId];
    if (piece && piece.type === 'KING') {
      oldKing = piece;
      break;
    }
  }
  
  if (oldKing) {
    // Remove old King
    const oldKingPosKey = GridUtils.getPositionKey(oldKing.row, oldKing.col);
    delete gameState.grid[oldKingPosKey];
    delete gameState.pieces[oldKing.id];
    player.pieces = player.pieces.filter(id => id !== oldKing.id);
  }
  
  // Find safe adjacent square for new King
  const adjacentPositions = [
    { row: heirProducer.row - 1, col: heirProducer.col - 1 },
    { row: heirProducer.row - 1, col: heirProducer.col },
    { row: heirProducer.row - 1, col: heirProducer.col + 1 },
    { row: heirProducer.row, col: heirProducer.col - 1 },
    { row: heirProducer.row, col: heirProducer.col + 1 },
    { row: heirProducer.row + 1, col: heirProducer.col - 1 },
    { row: heirProducer.row + 1, col: heirProducer.col },
    { row: heirProducer.row + 1, col: heirProducer.col + 1 }
  ];
  
  let spawnPosition = null;
  
  // First try adjacent squares
  for (const pos of adjacentPositions) {
    const normalizedCol = GridUtils.normalizeCol(pos.col);
    if (GridUtils.isValidPosition(pos.row, normalizedCol)) {
      const posKey = GridUtils.getPositionKey(pos.row, normalizedCol);
      if (!gameState.grid[posKey] && !isPositionUnderAttack(pos.row, normalizedCol, playerId)) {
        spawnPosition = { row: pos.row, col: normalizedCol };
        break;
      }
    }
  }
  
  // If no safe adjacent square, find closest safe square
  if (!spawnPosition) {
    for (let distance = 2; distance <= 5; distance++) {
      for (let dr = -distance; dr <= distance; dr++) {
        for (let dc = -distance; dc <= distance; dc++) {
          if (Math.abs(dr) === distance || Math.abs(dc) === distance) {
            const row = heirProducer.row + dr;
            const col = GridUtils.normalizeCol(heirProducer.col + dc);
            if (GridUtils.isValidPosition(row, col)) {
              const posKey = GridUtils.getPositionKey(row, col);
              if (!gameState.grid[posKey] && !isPositionUnderAttack(row, col, playerId)) {
                spawnPosition = { row, col };
                break;
              }
            }
          }
        }
        if (spawnPosition) break;
      }
      if (spawnPosition) break;
    }
  }
  
  if (!spawnPosition) {
    console.log('No safe position found for heir King!');
    return false;
  }
  
  // Create new King
  const newKing = {
    id: `${playerId}-king-heir-${Date.now()}`,
    playerId: playerId,
    type: 'KING',
    value: PIECE_TYPES.KING.points,
    symbol: PIECE_TYPES.KING.symbol,
    row: spawnPosition.row,
    col: spawnPosition.col,
    kills: 0,
    timeAlive: 0,
    moveCount: 0,
    evolutionPoints: PIECE_TYPES.KING.points,
    isHeir: true
  };
  
  gameState.pieces[newKing.id] = newKing;
  gameState.grid[GridUtils.getPositionKey(spawnPosition.row, spawnPosition.col)] = newKing.id;
  player.pieces.push(newKing.id);
  
  console.log(`New heir King spawned at (${spawnPosition.row}, ${spawnPosition.col}) for player ${playerId}`);
  
  // Mark heir producer as having used heir
  heirProducer.heirUsed = true;
  
  broadcastGameState();
  return true;
}

// Check if a player is in checkmate
function isPlayerInCheckmate(playerId) {
  // First check if the king is in check
  if (!isKingInCheck(playerId)) {
    return false; // Not in check, so not checkmate
  }
  
  // Try all possible moves for all player's pieces
  for (const pieceId in gameState.pieces) {
    const piece = gameState.pieces[pieceId];
    if (piece.playerId !== playerId) continue;
    
    const moves = getValidMoves(pieceId);
    for (const move of moves) {
      // Try the move
      const originalRow = piece.row;
      const originalCol = piece.col;
      const originalGridKey = GridUtils.getPositionKey(originalRow, originalCol);
      const targetGridKey = GridUtils.getPositionKey(move.row, move.col);
      const capturedPieceId = gameState.grid[targetGridKey];
      let capturedPiece = null;
      
      // Make the move temporarily
      piece.row = move.row;
      piece.col = move.col;
      gameState.grid[originalGridKey] = null;
      if (capturedPieceId) {
        capturedPiece = gameState.pieces[capturedPieceId];
        delete gameState.pieces[capturedPieceId];
      }
      gameState.grid[targetGridKey] = pieceId;
      
      // Check if still in check
      const stillInCheck = isKingInCheck(playerId);
      
      // Undo the move
      piece.row = originalRow;
      piece.col = originalCol;
      gameState.grid[originalGridKey] = pieceId;
      gameState.grid[targetGridKey] = capturedPieceId;
      if (capturedPiece) {
        gameState.pieces[capturedPieceId] = capturedPiece;
      }
      
      // If this move gets us out of check, not checkmate
      if (!stillInCheck) {
        return false;
      }
    }
  }
  
  // No moves get us out of check - it's checkmate
  return true;
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
    
    // For pawns and splitters, determine movement direction based on spawn location
    if (piece.type === 'PAWN' || piece.type === 'SPLITTER') {
      const player = gameState.players[piece.playerId];
      if (player) {
        const spawnRow = player.spawnArea.baseRow;
        const isNorthPole = spawnRow <= 9; // North half of sphere
        
        if (piece.type === 'PAWN') {
          if (isNorthPole) {
            // North pole pawns move toward south (+1 row)
            moveDirections = [{ row: 1, col: 0 }];
            attackDirections = [{ row: 1, col: -1 }, { row: 1, col: 1 }];
          } else {
            // South pole pawns move toward north (-1 row)
            moveDirections = [{ row: -1, col: 0 }];
            attackDirections = [{ row: -1, col: -1 }, { row: -1, col: 1 }];
          }
        } else if (piece.type === 'SPLITTER') {
          // SPLITTERS ARE ENHANCED PAWNS - They can move forward like pawns AND split sideways
          if (isNorthPole) {
            // North pole splitters move toward south (+1 row) like pawns
            moveDirections = [{ row: 1, col: 0 }]; // Forward movement like pawns
            attackDirections = [{ row: 1, col: -1 }, { row: 1, col: 1 }]; // Diagonal attacks like pawns
          } else {
            // South pole splitters move toward north (-1 row) like pawns  
            moveDirections = [{ row: -1, col: 0 }]; // Forward movement like pawns
            attackDirections = [{ row: -1, col: -1 }, { row: -1, col: 1 }]; // Diagonal attacks like pawns
          }
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
    if (piece.type === 'SPLITTER') {
      const player = gameState.players[piece.playerId];
      if (player) {
        // Splitters can only split sideways (left/right), never forward or backward
        const splitDirs = [
          { row: 0, col: -1 }, // Left
          { row: 0, col: 1 }   // Right
        ];
        
        splitDirs.forEach(dir => {
          const targetRow = piece.row + dir.row;
          const targetCol = GridUtils.normalizeCol(piece.col + dir.col);
          
          if (GridUtils.isValidPosition(targetRow, targetCol)) {
            const posKey = GridUtils.getPositionKey(targetRow, targetCol);
            const occupyingPieceId = gameState.grid[posKey];
            
            if (!occupyingPieceId) {
              // Can split to empty squares
              validMoves.push({ row: targetRow, col: targetCol, type: 'split' });
            } else {
              // Can split onto enemy pieces (captures them)
              const occupyingPiece = gameState.pieces[occupyingPieceId];
              if (occupyingPiece && occupyingPiece.playerId !== piece.playerId) {
                validMoves.push({ row: targetRow, col: targetCol, type: 'split', capture: occupyingPieceId });
              }
            }
          }
        });
      }
    }
    
  } else {
    // Standard movement patterns (omnidirectional, diagonal, orthogonal, etc.)
    
    // Special handling for jumping pieces (Jumpers and evolved jumpers, including vault pieces)
    if (movementPattern.jumpOver && (piece.type === 'JUMPER' || piece.type === 'SUPER_JUMPER' || piece.type === 'HYPER_JUMPER' || piece.type === 'MISTRESS_JUMPER' || piece.type === 'HYBRID_QUEEN' || piece.type === 'VAULTBOUND' || piece.type === 'VAULTSEER' || piece.type === 'VAULTARCHER' || piece.type === 'VAULTMISTRESS' || piece.type === 'COVENANT_QUEEN')) {
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
  
  // Filter: Pawns and Splitters cannot move onto an occupied pole square
  if (piece.type === 'PAWN' || piece.type === 'SPLITTER') {
    const filtered = [];
    validMoves.forEach(mv => {
      const isPole = (mv.row === 0 || mv.row === GAME_CONFIG.GRID_ROWS - 1);
      if (isPole) {
        const key = GridUtils.getPositionKey(mv.row, mv.col);
        if (!gameState.grid[key]) {
          filtered.push(mv); // only keep if pole square empty
        }
      } else {
        filtered.push(mv);
      }
    });
    return filtered;
  }
  
  return validMoves;
}

// Store last game state for delta updates
let lastBroadcastState = null;

function broadcastGameState() {
  console.log('📡 Broadcasting game state with:', {
    playerCount: Object.keys(gameState.players).length,
    pieceCount: Object.keys(gameState.pieces).length,
    pieces: Object.keys(gameState.pieces)
  });
  
  // Include evolution points from evolutionManager in the game state
  const playersWithEvolutionPoints = {};
  Object.keys(gameState.players).forEach(playerId => {
    const bankInfo = evolutionManager.getPlayerBankInfo(playerId);
    playersWithEvolutionPoints[playerId] = {
      ...gameState.players[playerId],
      evolutionPoints: bankInfo ? bankInfo.points : 0
    };
  });
  
  // ✅ PHASE 7: Ensure pieces include evolutionPoints field
  const piecesWithEvolutionPoints = {};
  Object.keys(gameState.pieces).forEach(pieceId => {
    const piece = gameState.pieces[pieceId];
    piecesWithEvolutionPoints[pieceId] = {
      ...piece,
      evolutionPoints: piece.evolutionPoints || PIECE_TYPES[piece.type].points
    };
  });
  
  const clientGameState = {
    players: playersWithEvolutionPoints,
    pieces: piecesWithEvolutionPoints,
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
  
  // Update check / checkmate status for all players
  evaluateCheckStates();
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

// ✅ PHASE 3: Auto-Color Assignment System
// 8 distinct colors for automatic assignment based on player index
const AUTO_ASSIGN_COLORS = [
  { id: 'red', name: 'Red', hex: 0xFF0000 },
  { id: 'blue', name: 'Blue', hex: 0x0080FF },
  { id: 'green', name: 'Green', hex: 0x00FF00 },
  { id: 'orange', name: 'Orange', hex: 0xFF8000 },
  { id: 'purple', name: 'Purple', hex: 0x8000FF },
  { id: 'yellow', name: 'Yellow', hex: 0xFFD700 },
  { id: 'cyan', name: 'Cyan', hex: 0x00FFFF },
  { id: 'pink', name: 'Pink', hex: 0xFF69B4 }
];

// Auto-assign color based on player index (0-7)
function getPlayerColorById(playerIndex) {
  const colorIndex = playerIndex % AUTO_ASSIGN_COLORS.length;
  return AUTO_ASSIGN_COLORS[colorIndex].id;
}

// Get color name for display
function getPlayerColorName(playerIndex) {
  const colorIndex = playerIndex % AUTO_ASSIGN_COLORS.length;
  return AUTO_ASSIGN_COLORS[colorIndex].name;
}

// No color availability checking needed - colors assigned automatically
function getPlayerColor(index) {
  return getPlayerColorById(index);
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
    pendingEvolutions: {}, // Track pending evolution choices
    isInTournament: true,
    tournamentId: tournamentId,
    matchId: match.id,
    currentTurn: 0,
    gameStartTime: null,
    activePlayer: null,
    gameEnded: false // Track if game has ended
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
    evolutionManager.addEvolutionPoints(player.id, 1, 'tournament_start');
    
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

// ---------- Check / Checkmate Utilities ----------
function evaluateCheckStates() {
  // Loop through every player and broadcast current check / checkmate status
  Object.keys(gameState.players).forEach(playerId => {
    const inCheck = isKingInCheck(playerId);
    io.emit('player-in-check', { playerId, inCheck });

    // If player in check, test for checkmate
    if (inCheck && isPlayerInCheckmate(playerId)) {
      console.log(`♔ CHECKMATE detected against ${playerId}`);
      const attackerId = Object.keys(gameState.players).find(id => id !== playerId);
      victoryManager.handlePlayerElimination(playerId, 'checkmate');
      io.emit('checkmate', { playerId, checkmatedBy: attackerId });
    }
  });
}