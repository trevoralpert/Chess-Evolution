// Menu system for EvoChess
// Handles menu navigation, game modes, player setup, and UI transitions

// Menu state variables
let menuScreen, gameUI, gameOverScreen;
let playerName = '';
let menuSelectedColor = '#00ff00';
let gameMode = 'quickplay';
let isInGame = false;

/**
 * Initialize DOM elements after page load
 */
function initializeAfterDOM() {
  console.log('DOM ready, initializing game elements...');
  
  // Get DOM elements after page is ready
  menuScreen = document.getElementById('menu-screen');
  gameUI = document.getElementById('ui');
  gameOverScreen = document.getElementById('game-over-screen');
  
  if (!menuScreen || !gameUI) {
    console.error('Critical UI elements not found!', {
      menuScreen: !!menuScreen,
      gameUI: !!gameUI,
      gameOverScreen: !!gameOverScreen
    });
    return;
  }
  
  console.log('UI elements found successfully');
  
  // Hide timing UI initially (only show during gameplay)
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Initialize menu system
  initMenuSystem();
  
  return true; // Success
}

/**
 * Initialize the main menu system
 */
function initMenuSystem() {
  console.log('🎮 Initializing menu system...');
  
  // Color picker setup for menu
  const menuColorOptions = document.getElementById('menu-color-options');
  if (menuColorOptions) {
    const colors = [
      '#00ff00', '#ff0000', '#0088ff', '#ffff00', '#ff00ff', 
      '#00ffff', '#ff8800', '#ffffff', '#8800ff', '#00ff88'
    ];
    
    colors.forEach(color => {
      const colorDiv = document.createElement('div');
      colorDiv.style.width = '30px';
      colorDiv.style.height = '30px';
      colorDiv.style.backgroundColor = color;
      colorDiv.style.border = '2px solid transparent';
      colorDiv.style.cursor = 'pointer';
      colorDiv.style.borderRadius = '5px';
      
      colorDiv.addEventListener('click', () => {
        // Remove previous selection
        menuColorOptions.querySelectorAll('div').forEach(d => {
          d.style.border = '2px solid transparent';
        });
        // Select this color
        colorDiv.style.border = '2px solid white';
        menuSelectedColor = color;
      });
      
      // Select first color by default
      if (color === colors[0]) {
        colorDiv.style.border = '2px solid white';
      }
      
      menuColorOptions.appendChild(colorDiv);
    });
  }
  
  // Menu button handlers
  setupMenuButtonHandlers();
}

/**
 * Set up all menu button event handlers
 */
function setupMenuButtonHandlers() {
  // Quick play button
  const quickPlayBtn = document.getElementById('quick-play-btn');
  if (quickPlayBtn) {
    quickPlayBtn.addEventListener('click', () => {
      console.log('🚀 Quick Play - Starting vs AI...');
      playerName = document.getElementById('player-name-input')?.value || 'Player ' + Math.floor(Math.random() * 1000);
      gameMode = 'vs-ai';
      startGame();
    });
  }
  
  // VS AI button
  const vsAIBtn = document.getElementById('vs-ai-btn');
  if (vsAIBtn) {
    vsAIBtn.addEventListener('click', () => {
      console.log('🤖 Starting vs AI...');
      playerName = document.getElementById('player-name-input')?.value || 'Player ' + Math.floor(Math.random() * 1000);
      gameMode = 'vs-ai';
      startGame();
    });
  }
  
  // Create game button
  const createGameBtn = document.getElementById('create-game-btn');
  if (createGameBtn) {
    createGameBtn.addEventListener('click', () => {
      console.log('🎯 Creating multiplayer game...');
      playerName = document.getElementById('player-name-input')?.value || 'Player ' + Math.floor(Math.random() * 1000);
      gameMode = 'create-vs-human';
      startGame();
    });
  }
  
  // Join game button
  const joinGameBtn = document.getElementById('join-game-btn');
  if (joinGameBtn) {
    joinGameBtn.addEventListener('click', () => {
      console.log('🤝 Joining multiplayer game...');
      playerName = document.getElementById('player-name-input')?.value || 'Player ' + Math.floor(Math.random() * 1000);
      gameMode = 'join-vs-human';
      startGame();
    });
  }
  
  // Tournament button
  const tournamentBtn = document.getElementById('tournament-btn');
  if (tournamentBtn) {
    tournamentBtn.addEventListener('click', () => {
      alert('Tournament mode coming soon!\n\nTournament functionality is implemented on the server but needs UI integration.');
    });
  }
  
  // Spectate button
  const spectateBtn = document.getElementById('spectate-btn');
  if (spectateBtn) {
    spectateBtn.addEventListener('click', () => {
      alert('Spectator mode coming soon!\n\nSpectator functionality is implemented on the server but needs UI integration.');
    });
  }
  
  // Evolution guide button
  const evolutionGuideBtn = document.getElementById('evolution-guide-btn');
  if (evolutionGuideBtn) {
    evolutionGuideBtn.addEventListener('click', () => {
      alert('Evolution Guide coming soon!\n\nBasic rules:\n- Pawns gain 1 point for crossing equator\n- Capture pieces to gain their value\n- Evolve pieces with points:\n  • Pawn → Splitter (2 pts)\n  • Splitter → Bishop/Knight (3 pts)\n  • And many more!');
    });
  }
  
  // Game over screen button
  const returnToMenuBtn = document.getElementById('return-to-menu-btn');
  if (returnToMenuBtn) {
    returnToMenuBtn.addEventListener('click', () => {
      returnToMenu();
    });
  }
  
  // In-game menu button
  const quitToMenuBtn = document.getElementById('quit-to-menu-btn');
  if (quitToMenuBtn) {
    quitToMenuBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to quit to menu?')) {
        // Disconnect from server
        if (typeof socket !== 'undefined' && socket) {
          socket.disconnect();
        }
        returnToMenu();
      }
    });
  }
  
  // Pause button
  const pauseGameBtn = document.getElementById('pause-game-btn');
  if (pauseGameBtn) {
    pauseGameBtn.addEventListener('click', () => {
      alert('Pause feature coming soon!');
    });
  }
}

/**
 * Start the game with current settings
 */
function startGame() {
  console.log('🎮 Starting game with:', { playerName, gameMode });
  
  // Prevent multiple connections
  if (typeof socket !== 'undefined' && socket && socket.connected) {
    console.log('⚠️ Already connected to server');
    return;
  }
  
  // Initialize socket connection first
  if (typeof io !== 'undefined') {
    socket = io();
    if (typeof window !== 'undefined') {
      window.globalSocket = socket;
    }
    console.log('Socket.io initialized, waiting for connection...');
    
    // Wait for connection, then send appropriate game mode request
    socket.on('connection-established', (data) => {
      console.log('✅ Connected to server:', data);
      
      // Hide menu, show game UI and timer
      if (menuScreen) menuScreen.style.display = 'none';
      if (gameUI) gameUI.style.display = 'block';
      const timingUI = document.getElementById('timing-ui');
      if (timingUI) timingUI.style.display = 'block';
      isInGame = true;
      
      // Send the appropriate game creation request based on mode
      switch (gameMode) {
        case 'vs-ai':
          console.log('🤖 Requesting vs AI game...');
          socket.emit('create-vs-ai-game', {
            playerName: playerName,
            difficulty: 'MEDIUM' // Can be made configurable later
          });
          break;
          
        case 'create-vs-human':
          console.log('🎯 Requesting create vs human game...');
          socket.emit('create-vs-human-game', {
            playerName: playerName
          });
          break;
          
        case 'join-vs-human':
          console.log('🤝 Requesting join human game...');
          socket.emit('join-human-game', {
            playerName: playerName
          });
          break;
          
        default:
          console.error('Unknown game mode:', gameMode);
          socket.emit('create-vs-ai-game', {
            playerName: playerName,
            difficulty: 'MEDIUM'
          });
      }
    });
    
    // Set up socket listeners (these need to be called from main)
    if (typeof setupSocketListeners === 'function') {
      setupSocketListeners();
    }
    
    if (typeof setupColorSocketHandlers === 'function') {
      setupColorSocketHandlers(socket);
    }
    
    if (typeof setupTimerSocketHandlers === 'function') {
      setupTimerSocketHandlers(socket);
    }
  }
}

/**
 * Return to the main menu
 */
function returnToMenu() {
  console.log('🏠 Returning to menu...');
  
  // Clear any running timers
  if (typeof clearAllTimers === 'function') {
    clearAllTimers();
  }
  
  // Hide game screens and timer
  if (gameUI) gameUI.style.display = 'none';
  if (gameOverScreen) gameOverScreen.style.display = 'none';
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Show menu
  if (menuScreen) menuScreen.style.display = 'flex';
  isInGame = false;
  
  // Reset game state
  if (typeof window !== 'undefined' && window.location && window.location.reload) {
    // Reload page to fully reset (temporary solution)
    window.location.reload();
  }
}

/**
 * Show the game over screen
 * @param {string} winner - Name of the winning player
 * @param {Object} stats - Game statistics
 */
function showGameOver(winner, stats) {
  console.log('🏁 Game Over!', winner, stats);
  
  // Clear any running timers
  if (typeof clearAllTimers === 'function') {
    clearAllTimers();
  }
  
  // Hide game UI and timer
  if (gameUI) gameUI.style.display = 'none';
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Update game over screen
  const titleEl = document.getElementById('game-over-title');
  const statsEl = document.getElementById('game-over-stats');
  
  if (titleEl) {
    if (winner === playerName) {
      titleEl.textContent = 'VICTORY!';
      titleEl.style.color = '#27ae60';
    } else {
      titleEl.textContent = 'DEFEAT';
      titleEl.style.color = '#e74c3c';
    }
  }
  
  // Show stats
  if (statsEl) {
    statsEl.innerHTML = `
      <div>Winner: ${winner}</div>
      <div>Game Duration: ${stats?.duration || 'Unknown'}</div>
      <div>Your Pieces Captured: ${stats?.piecesKilled || 0}</div>
      <div>Your Pieces Lost: ${stats?.piecesLost || 0}</div>
      <div>Evolution Points Earned: ${stats?.evolutionPoints || 0}</div>
    `;
  }
  
  // Show game over screen
  if (gameOverScreen) gameOverScreen.style.display = 'flex';
}

/**
 * Start game countdown display
 * @param {number} countdown - Initial countdown value in seconds
 */
function startGameCountdown(countdown) {
  const countdownEl = document.getElementById('game-starting-countdown');
  const timerEl = document.getElementById('countdown-timer');
  
  if (countdownEl) countdownEl.style.display = 'block';
  if (timerEl) timerEl.textContent = countdown;
  
  const interval = setInterval(() => {
    countdown--;
    if (timerEl) timerEl.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(interval);
      if (countdownEl) countdownEl.style.display = 'none';
    }
  }, 1000);
}

/**
 * Set the current game mode
 * @param {string} mode - Game mode ('vs-ai', 'create-vs-human', 'join-vs-human', etc.)
 */
function setGameMode(mode) {
  gameMode = mode;
}

/**
 * Get the current game mode
 * @returns {string} Current game mode
 */
function getGameMode() {
  return gameMode;
}

/**
 * Set the player name
 * @param {string} name - Player name
 */
function setPlayerName(name) {
  playerName = name;
}

/**
 * Get the player name
 * @returns {string} Current player name
 */
function getPlayerName() {
  return playerName;
}

/**
 * Set the menu selected color
 * @param {string} color - Color hex string
 */
function setMenuSelectedColor(color) {
  menuSelectedColor = color;
}

/**
 * Get the menu selected color
 * @returns {string} Current menu selected color
 */
function getMenuSelectedColor() {
  return menuSelectedColor;
}

/**
 * Check if currently in game
 * @returns {boolean} Whether currently in a game
 */
function getIsInGame() {
  return isInGame;
}

/**
 * Set the in-game status
 * @param {boolean} inGame - Whether currently in game
 */
function setIsInGame(inGame) {
  isInGame = inGame;
}

/**
 * Get menu DOM elements
 * @returns {Object} Object containing menu DOM elements
 */
function getMenuElements() {
  return {
    menuScreen,
    gameUI,
    gameOverScreen
  };
}

/**
 * Update the selected color display in menu
 */
function updateSelectedColorDisplay() {
  const selectedColorEl = document.getElementById('selected-color');
  if (selectedColorEl) {
    selectedColorEl.textContent = menuSelectedColor ? `Selected: ${menuSelectedColor}` : 'None selected';
    selectedColorEl.style.color = menuSelectedColor || '#aaa';
  }
}

export {
  initializeAfterDOM,
  initMenuSystem,
  setupMenuButtonHandlers,
  startGame,
  returnToMenu,
  showGameOver,
  startGameCountdown,
  setGameMode,
  getGameMode,
  setPlayerName,
  getPlayerName,
  setMenuSelectedColor,
  getMenuSelectedColor,
  getIsInGame,
  setIsInGame,
  getMenuElements,
  updateSelectedColorDisplay
};