// Game Initialization and Menu System Module
export class GameInitialization {
  constructor() {
    this.menuScreen = null;
    this.gameUI = null;
    this.gameOverScreen = null;
    this.playerName = '';
    this.menuSelectedColor = '#00ff00';
    this.selectedColor = null;
    this.gameMode = 'quickplay';
    this.isInGame = false;
  }

  async loadGLTFLoader() {
    try {
      // Check if GLTFLoader is already available from the script tag
      if (typeof THREE.GLTFLoader !== 'undefined') {
        console.log('✅ GLTFLoader already available from script tag');
        return true;
      }
      
      // If not, try to import it (using same version as HTML file)
      const GLTFLoaderModule = await import('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js');
      THREE.GLTFLoader = GLTFLoaderModule.GLTFLoader;
      console.log('✅ GLTFLoader imported and added to THREE object');
      return true;
    } catch (error) {
      console.error('❌ Failed to load GLTFLoader:', error);
      return false;
    }
  }

  async initializeGame() {
    console.log('🔧 Loading GLTFLoader...');
    await this.loadGLTFLoader();
    console.log('🚀 GLTFLoader ready, starting game initialization...');
    
    this.startGameInitialization();
  }

  startGameInitialization() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeAfterDOM());
    } else {
      this.initializeAfterDOM();
    }
  }

  initializeAfterDOM() {
    console.log('DOM ready, initializing game elements...');
    
    // Get DOM elements after page is ready
    this.menuScreen = document.getElementById('menu-screen');
    this.gameUI = document.getElementById('ui');
    this.gameOverScreen = document.getElementById('game-over-screen');
    
    if (!this.menuScreen || !this.gameUI) {
      console.error('Critical UI elements not found!', {
        menuScreen: !!this.menuScreen,
        gameUI: !!this.gameUI,
        gameOverScreen: !!this.gameOverScreen
      });
      return;
    }
    
    console.log('UI elements found successfully');
    
    // Hide timing UI initially (only show during gameplay)
    const timingUI = document.getElementById('timing-ui');
    if (timingUI) timingUI.style.display = 'none';
    
    // Initialize menu system
    this.initMenuSystem();
  }

  initMenuSystem() {
    console.log('🎮 Initializing menu system...');
    
    // Color picker setup for menu
    const menuColorOptions = document.getElementById('menu-color-options');
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
        this.menuSelectedColor = color;
      });
      
      // Select first color by default
      if (color === colors[0]) {
        colorDiv.style.border = '2px solid white';
      }
      
      menuColorOptions.appendChild(colorDiv);
    });
    
    this.setupMenuEventListeners();
  }

  setupMenuEventListeners() {
    // Menu button handlers
    document.getElementById('quick-play-btn').addEventListener('click', () => {
      console.log('🚀 Quick Play - Starting vs AI...');
      this.playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
      this.gameMode = 'vs-ai';
      this.startGame();
    });
    
    document.getElementById('vs-ai-btn').addEventListener('click', () => {
      console.log('🤖 Starting vs AI...');
      this.playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
      this.gameMode = 'vs-ai';
      this.startGame();
    });
    
    document.getElementById('create-game-btn').addEventListener('click', () => {
      console.log('🎯 Creating multiplayer game...');
      this.playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
      this.gameMode = 'create-vs-human';
      this.startGame();
    });
    
    document.getElementById('join-game-btn').addEventListener('click', () => {
      console.log('🤝 Joining multiplayer game...');
      this.playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
      this.gameMode = 'join-vs-human';
      this.startGame();
    });
    
    document.getElementById('tournament-btn').addEventListener('click', () => {
      alert('Tournament mode coming soon!\n\nTournament functionality is implemented on the server but needs UI integration.');
    });
    
    document.getElementById('spectate-btn').addEventListener('click', () => {
      alert('Spectator mode coming soon!\n\nSpectator functionality is implemented on the server but needs UI integration.');
    });
    
    document.getElementById('evolution-guide-btn').addEventListener('click', () => {
      alert('Evolution Guide coming soon!\n\nBasic rules:\n- Pawns gain 1 point for crossing equator\n- Capture pieces to gain their value\n- Evolve pieces with points:\n  • Pawn → Splitter (2 pts)\n  • Splitter → Bishop/Knight (3 pts)\n  • And many more!');
    });
    
    // Game over screen button
    document.getElementById('return-to-menu-btn').addEventListener('click', () => {
      this.returnToMenu();
    });
    
    // In-game menu button
    document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to quit to menu?')) {
        // Disconnect from server
        if (window.gameSocket) {
          window.gameSocket.disconnect();
        }
        this.returnToMenu();
      }
    });
    
    // Pause button
    document.getElementById('pause-game-btn').addEventListener('click', () => {
      alert('Pause feature coming soon!');
    });
  }

  startGame() {
    console.log('🎮 Starting game with:', { playerName: this.playerName, gameMode: this.gameMode });
    
    // Prevent multiple connections
    if (window.gameSocket && window.gameSocket.connected) {
      console.log('⚠️ Already connected to server');
      return;
    }
    
    // Initialize socket connection first
    window.gameSocket = io();
    console.log('Socket.io initialized, waiting for connection...');
    
    // Emit game start event for other modules to listen
    document.dispatchEvent(new CustomEvent('gameStart', {
      detail: {
        playerName: this.playerName,
        gameMode: this.gameMode,
        selectedColor: this.selectedColor || this.menuSelectedColor
      }
    }));
  }

  returnToMenu() {
    console.log('🏠 Returning to menu...');
    
    // Clear any running timers
    if (window.currentTimer) {
      clearInterval(window.currentTimer);
      window.currentTimer = null;
    }
    
    // Hide game screens and timer
    this.gameUI.style.display = 'none';
    this.gameOverScreen.style.display = 'none';
    const timingUI = document.getElementById('timing-ui');
    if (timingUI) timingUI.style.display = 'none';
    
    // Show menu
    this.menuScreen.style.display = 'flex';
    this.isInGame = false;
    
    // Emit return to menu event
    document.dispatchEvent(new CustomEvent('returnToMenu'));
  }

  showGameOver(winner, stats) {
    console.log('🏁 Game Over!', winner, stats);
    
    // Clear any running timers
    if (window.currentTimer) {
      clearInterval(window.currentTimer);
      window.currentTimer = null;
    }
    
    // Hide game UI and timer
    this.gameUI.style.display = 'none';
    const timingUI = document.getElementById('timing-ui');
    if (timingUI) timingUI.style.display = 'none';
    
    // Update game over screen
    const titleEl = document.getElementById('game-over-title');
    const statsEl = document.getElementById('game-over-stats');
    
    if (winner === this.playerName) {
      titleEl.textContent = 'VICTORY!';
      titleEl.style.color = '#27ae60';
    } else {
      titleEl.textContent = 'DEFEAT';
      titleEl.style.color = '#e74c3c';
    }
    
    // Show stats
    statsEl.innerHTML = `
      <div>Winner: ${winner}</div>
      <div>Game Duration: ${stats?.duration || 'Unknown'}</div>
      <div>Your Pieces Captured: ${stats?.piecesKilled || 0}</div>
      <div>Your Pieces Lost: ${stats?.piecesLost || 0}</div>
      <div>Evolution Points Earned: ${stats?.evolutionPoints || 0}</div>
    `;
    
    // Show game over screen
    this.gameOverScreen.style.display = 'flex';
  }
}