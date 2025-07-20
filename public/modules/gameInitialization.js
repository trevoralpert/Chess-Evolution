// Game Initialization & Control Module
// Functions for starting games, managing players, and game control

import { GAME_MODES, AI_DIFFICULTIES } from './gameConfig.js';
import { initializeGameState, setGameMode, setCurrentPlayerId, setGameActive } from './gameStateManager.js';
import { getElement, setElementText, showElement, hideElement } from './uiReferences.js';
import { showGameOver, returnToMenu } from './menuSystem.js';

// Game initialization state
let gameInitialized = false;
let aiPlayers = [];
let currentGameSettings = null;

/**
 * Initialize game
 * @param {object} gameSettings - Game settings
 * @param {object} dependencies - Required dependencies (socket)
 */
export async function initializeGame(gameSettings = {}, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🎮 Initializing game with settings:', gameSettings);
  
  try {
    // Set game settings
    currentGameSettings = {
      mode: gameSettings.mode || GAME_MODES.VS_HUMAN,
      timeLimit: gameSettings.timeLimit || 30,
      evolutionEnabled: gameSettings.evolutionEnabled !== false,
      aiDifficulty: gameSettings.aiDifficulty || AI_DIFFICULTIES.MEDIUM,
      ...gameSettings
    };
    
    // Initialize game state
    initializeGameState();
    setGameMode(currentGameSettings.mode);
    
    // Initialize game components
    await initializeGameComponents(dependencies);
    
    gameInitialized = true;
    
    console.log('✅ Game initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing game:', error);
    throw error;
  }
}

/**
 * Initialize game components
 * @param {object} dependencies - Required dependencies
 */
export async function initializeGameComponents(dependencies = {}) {
  console.log('🔧 Initializing game components...');
  
  // Initialize UI components
  initializeGameUI();
  
  // Set up event listeners
  setupGameEventListeners(dependencies);
  
  // Initialize 3D scene if needed
  if (window.initializeThreeJS) {
    await window.initializeThreeJS();
  }
  
  console.log('✅ Game components initialized');
}

/**
 * Initialize game UI
 */
export function initializeGameUI() {
  console.log('🖥️ Initializing game UI...');
  
  // Show game interface
  const gameContainer = getElement('game-container');
  if (gameContainer) {
    showElement(gameContainer);
  }
  
  // Hide menu
  const menu = getElement('menu');
  if (menu) {
    hideElement(menu);
  }
  
  // Initialize UI elements
  updateGameModeDisplay();
  updatePlayersList();
  
  console.log('✅ Game UI initialized');
}

/**
 * Setup game event listeners
 * @param {object} dependencies - Required dependencies
 */
export function setupGameEventListeners(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔗 Setting up game event listeners...');
  
  // Quit game button
  const quitBtn = getElement('quit-game-btn');
  if (quitBtn) {
    quitBtn.addEventListener('click', () => quitGame(dependencies));
  }
  
  // Add AI player button
  const addAIBtn = getElement('add-ai-btn');
  if (addAIBtn) {
    addAIBtn.addEventListener('click', () => addAIPlayer(dependencies));
  }
  
  // Remove all AI button
  const removeAllAIBtn = getElement('remove-all-ai-btn');
  if (removeAllAIBtn) {
    removeAllAIBtn.addEventListener('click', () => removeAllAI(dependencies));
  }
  
  console.log('✅ Game event listeners set up');
}

/**
 * Start game
 * @param {object} dependencies - Required dependencies (socket)
 */
export function startGame(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚀 Starting game...');
  
  if (!gameInitialized) {
    console.error('❌ Game not initialized');
    return;
  }
  
  if (!socket) {
    console.error('❌ No socket connection');
    return;
  }
  
  // Send start game request based on mode
  switch (currentGameSettings.mode) {
    case GAME_MODES.VS_AI:
      socket.emit('create-vs-ai-game', {
        timeLimit: currentGameSettings.timeLimit,
        evolutionEnabled: currentGameSettings.evolutionEnabled,
        difficulty: currentGameSettings.aiDifficulty
      });
      break;
      
    case GAME_MODES.VS_HUMAN:
      socket.emit('create-vs-human-game', {
        timeLimit: currentGameSettings.timeLimit,
        evolutionEnabled: currentGameSettings.evolutionEnabled
      });
      break;
      
    case GAME_MODES.JOIN_GAME:
      socket.emit('join-human-game', {
        gameId: currentGameSettings.gameId || 'main'
      });
      break;
      
    default:
      console.error('❌ Unknown game mode:', currentGameSettings.mode);
      return;
  }
  
  setGameActive(true);
  
  console.log('✅ Game start request sent');
}

/**
 * Start game initialization sequence
 */
export function startGameInitialization() {
  console.log('🎬 Starting game initialization sequence...');
  
  // Show loading screen
  const loadingScreen = getElement('loading-screen');
  if (loadingScreen) {
    showElement(loadingScreen);
    setElementText(loadingScreen, 'Initializing game...');
  }
  
  // Initialize with default settings
  const defaultSettings = {
    mode: GAME_MODES.VS_HUMAN,
    timeLimit: 30,
    evolutionEnabled: true
  };
  
  initializeGame(defaultSettings, { socket: window.socket })
    .then(() => {
      console.log('✅ Game initialization sequence completed');
      
      // Hide loading screen
      if (loadingScreen) {
        hideElement(loadingScreen);
      }
      
      // Start the actual game
      startGame({ socket: window.socket });
    })
    .catch(error => {
      console.error('❌ Game initialization failed:', error);
      
      // Show error and return to menu
      if (loadingScreen) {
        setElementText(loadingScreen, 'Failed to initialize game. Returning to menu...');
        setTimeout(() => {
          hideElement(loadingScreen);
          returnToMenu();
        }, 2000);
      }
    });
}

/**
 * Quit game
 * @param {object} dependencies - Required dependencies (socket)
 */
export function quitGame(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🚪 Quitting game...');
  
  // Confirm quit
  const confirmQuit = confirm('Are you sure you want to quit the game?');
  if (!confirmQuit) {
    return;
  }
  
  // Send quit signal to server
  if (socket) {
    socket.emit('quit-game');
  }
  
  // Reset game state
  resetGame();
  
  // Return to menu
  returnToMenu();
  
  console.log('✅ Game quit');
}

/**
 * Reset game
 */
export function resetGame() {
  console.log('🔄 Resetting game...');
  
  gameInitialized = false;
  aiPlayers = [];
  currentGameSettings = null;
  
  // Reset game state
  setGameActive(false);
  
  // Clear UI
  const gameContainer = getElement('game-container');
  if (gameContainer) {
    hideElement(gameContainer);
  }
  
  console.log('✅ Game reset');
}

/**
 * Add AI player
 * @param {object} dependencies - Required dependencies (socket)
 */
export function addAIPlayer(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🤖 Adding AI player...');
  
  if (!socket) {
    console.error('❌ No socket connection');
    return;
  }
  
  const difficulty = currentGameSettings?.aiDifficulty || AI_DIFFICULTIES.MEDIUM;
  
  socket.emit('add-ai-player', {
    difficulty: difficulty,
    gameId: 'main'
  });
  
  console.log('✅ AI player add request sent');
}

/**
 * Remove AI player
 * @param {string} aiPlayerId - AI player ID to remove
 * @param {object} dependencies - Required dependencies (socket)
 */
export function removeAIPlayer(aiPlayerId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🤖 Removing AI player:', aiPlayerId);
  
  if (!socket) {
    console.error('❌ No socket connection');
    return;
  }
  
  socket.emit('remove-ai-player', { aiPlayerId });
  
  // Remove from local list
  aiPlayers = aiPlayers.filter(ai => ai.id !== aiPlayerId);
  updateAIPlayersList();
  
  console.log('✅ AI player remove request sent');
}

/**
 * Remove all AI players
 * @param {object} dependencies - Required dependencies (socket)
 */
export function removeAllAI(dependencies = {}) {
  console.log('🤖 Removing all AI players...');
  
  const aiPlayersCopy = [...aiPlayers];
  
  aiPlayersCopy.forEach(aiPlayer => {
    removeAIPlayer(aiPlayer.id, dependencies);
  });
  
  console.log('✅ All AI players removed');
}

/**
 * Update AI players list
 * @param {Array} newAIPlayers - New AI players list
 */
export function updateAIPlayersList(newAIPlayers = null) {
  if (newAIPlayers) {
    aiPlayers = newAIPlayers;
  }
  
  console.log('🤖 Updating AI players list:', aiPlayers);
  
  const aiListContainer = getElement('ai-players-list');
  if (!aiListContainer) return;
  
  if (aiPlayers.length === 0) {
    setElementText(aiListContainer, 'No AI players');
    return;
  }
  
  const aiHTML = aiPlayers.map(aiPlayer => `
    <div class="ai-player-item" data-ai-id="${aiPlayer.id}">
      <div class="ai-info">
        <span class="ai-name">${aiPlayer.name || 'AI Player'}</span>
        <span class="ai-difficulty">${aiPlayer.difficulty || 'Medium'}</span>
      </div>
      <div class="ai-actions">
        <button class="remove-ai-btn" onclick="removeAIPlayer('${aiPlayer.id}')">Remove</button>
        <button class="ai-stats-btn" onclick="showAIStats('${aiPlayer.id}')">Stats</button>
      </div>
    </div>
  `).join('');
  
  aiListContainer.innerHTML = aiHTML;
}

/**
 * Show AI stats
 * @param {string} aiPlayerId - AI player ID
 */
export function showAIStats(aiPlayerId) {
  const aiPlayer = aiPlayers.find(ai => ai.id === aiPlayerId);
  if (!aiPlayer) {
    console.warn('⚠️ AI player not found:', aiPlayerId);
    return;
  }
  
  console.log('📊 Showing AI stats for:', aiPlayer);
  
  // Create stats dialog
  const statsDialog = document.createElement('div');
  statsDialog.className = 'ai-stats-dialog';
  statsDialog.innerHTML = `
    <div class="stats-overlay">
      <div class="stats-content">
        <h3>AI Player Stats</h3>
        <div class="ai-info">
          <p><strong>Name:</strong> ${aiPlayer.name || 'AI Player'}</p>
          <p><strong>Difficulty:</strong> ${aiPlayer.difficulty || 'Medium'}</p>
          <p><strong>Games Played:</strong> ${aiPlayer.stats?.gamesPlayed || 0}</p>
          <p><strong>Games Won:</strong> ${aiPlayer.stats?.gamesWon || 0}</p>
          <p><strong>Win Rate:</strong> ${aiPlayer.stats?.winRate || '0%'}</p>
        </div>
        <button class="close-stats-btn">Close</button>
      </div>
    </div>
  `;
  
  // Style and add to page
  statsDialog.style.position = 'fixed';
  statsDialog.style.top = '0';
  statsDialog.style.left = '0';
  statsDialog.style.width = '100%';
  statsDialog.style.height = '100%';
  statsDialog.style.zIndex = '10000';
  statsDialog.style.display = 'flex';
  statsDialog.style.alignItems = 'center';
  statsDialog.style.justifyContent = 'center';
  statsDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  
  // Add close handler
  const closeBtn = statsDialog.querySelector('.close-stats-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(statsDialog);
    });
  }
  
  document.body.appendChild(statsDialog);
}

/**
 * Update AI stats
 * @param {string} aiPlayerId - AI player ID
 * @param {object} stats - New stats
 */
export function updateAIStats(aiPlayerId, stats) {
  const aiPlayer = aiPlayers.find(ai => ai.id === aiPlayerId);
  if (aiPlayer) {
    aiPlayer.stats = { ...aiPlayer.stats, ...stats };
    console.log('📊 AI stats updated:', aiPlayerId, stats);
  }
}

/**
 * Update game mode display
 */
export function updateGameModeDisplay() {
  const gameModeDisplay = getElement('game-mode-display');
  if (gameModeDisplay && currentGameSettings) {
    setElementText(gameModeDisplay, `Mode: ${currentGameSettings.mode}`);
  }
}

/**
 * Update players list
 */
export function updatePlayersList() {
  console.log('👥 Updating players list...');
  
  const playersListContainer = getElement('players-list');
  if (!playersListContainer) return;
  
  // This will be populated by game state updates
  setElementText(playersListContainer, 'Waiting for players...');
}

/**
 * Start game countdown
 * @param {number} countdown - Countdown time in seconds
 */
export function startGameCountdown(countdown) {
  console.log('⏱️ Starting game countdown:', countdown);
  
  const countdownDisplay = getElement('countdown-display');
  if (!countdownDisplay) return;
  
  showElement(countdownDisplay);
  
  let remaining = countdown;
  
  const countdownInterval = setInterval(() => {
    setElementText(countdownDisplay, `Game starts in ${remaining}...`);
    
    remaining--;
    
    if (remaining < 0) {
      clearInterval(countdownInterval);
      hideElement(countdownDisplay);
    }
  }, 1000);
}

/**
 * Handle game over
 * @param {object} winner - Winner data
 * @param {object} gameStats - Game statistics
 */
export function handleGameOver(winner, gameStats) {
  console.log('🏁 Game over:', { winner, gameStats });
  
  setGameActive(false);
  
  // Show game over screen
  showGameOver(winner, gameStats);
  
  // Reset game state after delay
  setTimeout(() => {
    resetGame();
  }, 5000);
}

/**
 * Get current game settings
 * @returns {object|null} Current game settings
 */
export function getCurrentGameSettings() {
  return currentGameSettings ? { ...currentGameSettings } : null;
}

/**
 * Check if game is initialized
 * @returns {boolean} True if game is initialized
 */
export function isGameInitialized() {
  return gameInitialized;
}

/**
 * Get AI players
 * @returns {Array} Array of AI players
 */
export function getAIPlayers() {
  return [...aiPlayers];
}

/**
 * Setup game initialization socket handlers
 * @param {object} socket - Socket connection
 */
export function setupGameInitializationSocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up game initialization socket handlers...');
  
  // Connection established
  socket.on('connection-established', (data) => {
    console.log('🔗 Connection established:', data);
    setCurrentPlayerId(data.playerId);
  });
  
  // Game full
  socket.on('game-full', () => {
    console.log('🚫 Game is full');
    alert('Game is full! Please try again later.');
    returnToMenu();
  });
  
  // AI player added
  socket.on('ai-player-added', (data) => {
    console.log('🤖 AI player added:', data);
    aiPlayers.push(data.aiPlayer);
    updateAIPlayersList();
  });
  
  // AI difficulties received
  socket.on('ai-difficulties', (data) => {
    console.log('🤖 AI difficulties received:', data);
    // Update difficulty selector if needed
  });
  
  // Player eliminated
  socket.on('player-eliminated', (data) => {
    console.log('💀 Player eliminated:', data);
    
    if (data.isGameOver) {
      handleGameOver(data.winner, data.gameStats);
    }
  });
  
  // Game started
  socket.on('game-started-first-move', (data) => {
    console.log('🎮 Game started:', data);
    startGameCountdown(3);
  });
  
  console.log('✅ Game initialization socket handlers set up');
}

// Global functions for onclick handlers
if (typeof window !== 'undefined') {
  window.removeAIPlayer = (aiPlayerId) => {
    removeAIPlayer(aiPlayerId, { socket: window.socket });
  };
  
  window.showAIStats = (aiPlayerId) => {
    showAIStats(aiPlayerId);
  };
}