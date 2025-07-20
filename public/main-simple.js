console.log('🚀 Starting main-simple.js v16 - MODULARIZED VERSION 🚀');

// ===== MODULE IMPORTS =====
// Import utility modules for better code organization
import { 
  gridToSpherical, 
  sphericalToCartesian, 
  getWorldPosition,
  easeOutCubic,
  clamp,
  lerp
} from './modules/mathUtils.js';

import { 
  COLOR_MAP, 
  getColorFromString, 
  getPlayerColor,
  getPieceColorForPlayer,
  lightenColor,
  darkenColor
} from './modules/colorUtils.js';

import { 
  MODEL_PATHS,
  getModelScale,
  getGeometricScale,
  getModelHeightAdjustment,
  isEvolvedPiece,
  getEvolutionLevel,
  getBasePieceType,
  getEvolutionTierName
} from './modules/modelUtils.js';

import { PerformanceOptimizer } from './modules/performanceOptimizer.js';
import { TransitionManager } from './modules/transitionManager.js';
import { VisualEffectsManager } from './modules/visualEffectsManager.js';
import { 
  GRID_CONFIG, 
  WORLD_CONFIG, 
  TIMER_CONFIG,
  createDefaultGameState,
  DEFAULTS,
  UI_ELEMENTS,
  SOCKET_EVENTS,
  GAME_MODES,
  PIECE_TYPES
} from './modules/gameConfig.js';
import { initializeThreeJS, startAnimationLoop } from './modules/sceneConfig.js';
import { initializeUIElements, getElement, setElementText, setTemporaryElementColor } from './modules/uiReferences.js';
import { getWorldPosition } from './modules/gridFunctions.js';
import { getEvolutionPointsForPiece, createEvolutionPointsLabel, createCachedTextLabel, createGeometricPiece, getPieceColorForPlayer } from './modules/pieceFunctions.js';
import { formatTime, formatTimeWithColor, createTimerDisplay, formatCountdown } from './modules/timerFunctions.js';
import { initMenuSystem, returnToMenu, showGameOver } from './modules/menuSystem.js';
import { showLobbyUI, hideLobbyUI, showLobbyCreation, hideLobbyCreation, showLobbyRoom, updateLobbyRoomDisplay, createLobby, joinLobby, leaveLobby, toggleReady, refreshLobbies, updateLobbyList, getPlayerName } from './modules/lobbySystem.js';
import { showStatisticsUI, hideStatisticsUI, showPersonalStats, showLeaderboard, showAchievements, showGlobalStats, updateStatsButtonStyles, refreshLeaderboard, displayPersonalStats, displayLeaderboard, displayAchievements, displayGlobalStats } from './modules/statisticsUI.js';
import { showEvolutionUI, hideEvolutionUI, refreshEvolutionBank, updateEvolutionBank, showEvolutionChoice, hideEvolutionChoice, handleEvolutionCompleted, chooseEvolution, bankEvolutionPoints, closeEvolutionDialog, showEvolutionContextMenu, hideEvolutionContextMenu } from './modules/evolutionUI.js';
import { showTournamentUI, hideTournamentUI, showTournamentCreation, hideTournamentCreation, createTournament, showTournamentList, updateTournamentList, updateTournamentStatus, updateBracketsDisplay } from './modules/tournamentUI.js';
import { initializeGameState, getGameState, updateGameState, getCurrentPlayerId, setCurrentPlayerId, getGameMode, setGameMode, getIsGameActive, setGameActive, addOrUpdatePlayer, addOrUpdatePiece, getPiece, getAllPieces, getPlayerPieces, isPositionOccupied, getActivePlayer, setActivePlayer, isGameOver, resetGameState } from './modules/gameStateManager.js';
import { setValidMoves, getValidMoves, clearValidMoves, setSelectedPieceId, getSelectedPieceId, clearSelectedPiece, setMovementMode, getMovementMode, executeMove, executeSplit, showBattleContestPrompt, hideBattleContestPrompt, showDiceBattleAnimation, showMoveChoiceDialog, closeMoveChoiceDialog } from './modules/movementBattleSystem.js';
import { initializeGame, startGame, startGameInitialization, quitGame, resetGame, addAIPlayer, removeAIPlayer, removeAllAI, updateAIPlayersList, showAIStats, updateAIStats, startGameCountdown, handleGameOver, isGameInitialized } from './modules/gameInitialization.js';
import { initializeSocket, getSocket, isSocketConnected, emitEvent, cleanupSocket, getConnectionStatus } from './modules/socketCommunication.js';

console.log('✅ Modules imported successfully');

// Check if Three.js is loaded
if (typeof THREE === 'undefined') {
  console.error('Three.js not loaded!');
} else {
  console.log('Three.js loaded successfully:', THREE);
}

// Load GLTFLoader and add it to THREE object
async function loadGLTFLoader() {
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

// Initialize GLTFLoader and then start the game
(async function initializeGame() {
  console.log('🔧 Loading GLTFLoader...');
  await loadGLTFLoader();
  console.log('🚀 GLTFLoader ready, starting game initialization...');
  
  // Continue with the rest of the initialization
  startGameInitialization();
})();

// startGameInitialization function now imported from gameInitialization.js module

// Menu System Variables (declare at module level)
let menuScreen, gameUI, gameOverScreen;

// ✅ PHASE 5 FIX: Use var instead of let to avoid temporal dead zone issues
var lastRightClickEvent = null; // Store right-click position for context menu
let playerName = '';
let menuSelectedColor = '#00ff00';
let selectedColor = null; // Current selected color ID from color picker
let gameMode = 'quickplay';
let isInGame = false;

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
  initMenuSystem({ socket });
}

// Initialize menu system
function initMenuSystem() {
  console.log('🎮 Initializing menu system...');
  
  // Auto-color assignment - no manual color picker needed
  console.log('🎨 Auto-color assignment system initialized - colors assigned by player index');
  
  // Menu button handlers
  document.getElementById('quick-play-btn').addEventListener('click', () => {
    console.log('🚀 Quick Play - Starting vs AI...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'vs-ai';
    startGame();
  });
  
  document.getElementById('vs-ai-btn').addEventListener('click', () => {
    console.log('🤖 Starting vs AI...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'vs-ai';
    startGame();
  });
  
  document.getElementById('create-game-btn').addEventListener('click', () => {
    console.log('🎯 Creating multiplayer game...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'create-vs-human';
    startGame();
  });
  
  document.getElementById('join-game-btn').addEventListener('click', () => {
    console.log('🤝 Joining multiplayer game...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'join-vs-human';
    startGame();
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
    returnToMenu();
  });
  
  // In-game menu button
  document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to quit to menu?')) {
      // Disconnect from server
      if (socket) {
        socket.disconnect();
      }
      returnToMenu();
    }
  });
  
  // Pause button
  document.getElementById('pause-game-btn').addEventListener('click', () => {
    alert('Pause feature coming soon!');
  });
}

// Game initialization functions now imported from gameInitialization.js module

// Menu system functions now imported from menuSystem.js module

// Initialize menu on load
  initMenuSystem({ socket });

// Continue with game initialization
function initializeGameComponents() {
  console.log('🎮 Initializing game components...');
  
  // Initialize the 3D scene if not already done
  if (!scene) {
    console.error('❌ Scene not initialized!');
    return;
  }
  
  // Start the animation loop if not already running
  if (!window.animationStarted) {
    console.log('🎬 Starting animation loop...');
    animate();
    window.animationStarted = true;
  }
  
  // Initialize visual effects if not already done
  if (!visualEffects && scene && renderer) {
    visualEffects = new VisualEffectsManager(scene, renderer, {
      pieceMeshes: pieceMeshes,
      camera: camera
    });
    console.log('✨ Visual effects initialized');
  } else if (visualEffects) {
    console.log('✨ Visual effects already initialized');
  }
  
  // Set up mouse interaction for piece selection and movement
  setupMouseInteraction();
  
  console.log('✅ Game components initialized successfully');
}

// Setup socket event listeners
function setupSocketListeners() {
  console.log('📡 Setting up socket event listeners...');
  
  // Initialize the comprehensive socket communication system
  initializeSocket();
  
  // Set up custom connection handling
  window.onSocketConnected = () => {
    statusEl.textContent = 'Connected';
    statusEl.style.color = '#00ff00';
    console.log('Socket connected successfully');
    
    // Initialize game components
    initializeGameComponents();
    
    // Send player info to server - colors auto-assigned by Phase 3 system
    emitEvent('player-joined', {
      name: playerName
      // ✅ PHASE 4 FIX: No color sent - server auto-assigns based on player index
    });
    
    // Request AI difficulties for the dropdown
    emitEvent('get-ai-difficulties');
    
    // Add AI player if vs AI mode
    if (gameMode === 'vsai') {
      setTimeout(() => {
        emitEvent('add-ai-player', {
          difficulty: 'MEDIUM',
          personality: {
            preferredPieces: ['QUEEN', 'ROOK', 'BISHOP'],
            playStyle: 'balanced',
            riskTolerance: 0.5,
            aggressiveness: 0.5
          }
        });
      }, 1000);
    }
  };

  window.onSocketDisconnected = () => {
    statusEl.textContent = 'Disconnected';
    statusEl.style.color = '#ff0000';
  };

  window.returnToMenu = () => {
    statusEl.textContent = 'Game Full';
    statusEl.style.color = '#ff8800';
    gameInfoEl.textContent = 'Game is full. Please try again later.';
  };

  // Set up global window functions for the socket communication module
  window.updateVisuals = updateVisuals;
  window.updateUI = updateUI;
  window.updateAllEvolutionPointLabels = updateAllEvolutionPointLabels;
  window.showNotification = showNotification;
  window.highlightValidMoves = highlightValidMoves;
  window.clearSelectedPiece = clearSelectedPiece;
  window.removePieceMesh = removePieceMesh;
  window.updatePieceMesh = updatePieceMesh;
  window.addChatMessage = addChatMessage;
  window.updateChatStatus = updateChatStatus;
  window.updateActivePlayer = updateActivePlayer;
  window.startTimer = startTimer;
  window.updateTimerDisplay = updateTimerDisplay;
  window.handlePlayerTimeout = handlePlayerTimeout;
  window.pauseTimer = pauseTimer;
  window.resumeTimer = resumeTimer;
  window.updateSpectatorGamesList = updateSpectatorGamesList;
  window.updateReplaysList = updateReplaysList;
  window.updateReplayUI = updateReplayUI;
  window.showTournamentResults = showTournamentResults;

  // Set up additional global window functions
  window.showDualMovementUI = showDualMovementUI;
  window.clearValidMoveHighlights = clearValidMoveHighlights;
  window.clearSelectionHighlight = clearSelectionHighlight;
  window.hideDualMovementUI = hideDualMovementUI;
  
  console.log('✅ Socket communication module initialized and window functions set up');
}

// Socket.io connection - will be initialized when game starts
}

// Socket.io connection - initialized through the socket communication module
let socket = null;
console.log('Socket.io will be initialized through the socket communication module');

// Make socket globally accessible for evolution dialog functions
window.globalSocket = null;

// Initialize socket when needed
function initializeSocketConnection() {
  socket = initializeSocket();
  window.globalSocket = socket;
  return socket;
}

// Timer management variables
let currentTimer = null;
let timerStartTime = 0;
let timerDuration = 7000; // 7 seconds default
let activePlayerId = null;
let isTimerPaused = false;
let pausedTimeRemaining = 0;

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a);
document.body.appendChild(renderer.domElement);

// Mouse interaction setup
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// UI elements that need to be available globally
const modeIndicator = document.getElementById('mode-indicator');

// Mouse state tracking
let mouseDownTime = 0;
let isDragging = false;

// Movement mode tracking - MOVED HERE TO FIX INITIALIZATION ORDER
let selectedMovementMode = null;

console.log('Three.js scene initialized successfully');

// Performance Optimization System now imported from performanceOptimizer.js module

// Initialize performance optimizer with dependencies
const performanceOptimizer = new PerformanceOptimizer({
  scene: scene,
  pieceMeshes: pieceMeshes,
  loadModel: loadModel
});

// Mouse interaction tracking
let mouseStartPos = { x: 0, y: 0 };
// isDragging moved to global scope

function handleMouseDown(e) {
  mouseDownTime = Date.now();
  mouseStartPos = { x: e.clientX, y: e.clientY };
  isDragging = false;
  console.log(`🖱️ Mouse down at: ${mouseDownTime}`);
  
  // Don't prevent default - let OrbitControls handle the event too
  // We're just capturing it to track our own state
}

function handleMouseMove(e) {
  if (mouseDownTime > 0) {
    const deltaX = e.clientX - mouseStartPos.x;
    const deltaY = e.clientY - mouseStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Consider it dragging if moved more than 5 pixels
    if (distance > 5) {
      if (!isDragging) {
        console.log(`🖱️ Mouse drag detected - distance: ${distance}px`);
        isDragging = true;
      }
    }
    
    // Handle camera movement if using manual controls
    if (manualCameraControls) {
      manualCameraControls.handleCameraMouseMove(e);
    }
  }
}

function handleMouseUp(e) {
  const mouseUpTime = Date.now();
  const clickDuration = mouseUpTime - mouseDownTime;
  
  console.log(`🖱️ Mouse up - duration: ${clickDuration}ms, isDragging: ${isDragging}, mouseDownTime: ${mouseDownTime}`);
  
  // Check if mouseDownTime was never set (indicates mouseDown wasn't called)
  if (mouseDownTime === 0) {
    console.log(`🖱️ Click ignored - mouseDown was never called`);
    return;
  }
  
  // Only process click if it was quick and didn't drag much
  if (clickDuration < 300 && !isDragging) {
    console.log(`🖱️ Processing click event`);
    const clickHandled = onMouseClick(e);
    
    // If we successfully processed a piece click, prevent OrbitControls from handling it
    // This prevents the camera from moving when clicking on pieces
    if (clickHandled === true) {
      e.preventDefault();
      e.stopPropagation();
    }
  } else {
    console.log(`🖱️ Click ignored - too long (${clickDuration}ms) or dragging (${isDragging})`);
  }
  
  mouseDownTime = 0;
  isDragging = false;
}

// Timer management functions now imported from timerFunctions.js module



function updateActivePlayer(playerId, playerName) {
  activePlayerId = playerId;
  document.getElementById('active-player-name').textContent = playerName || 'Unknown';
  
  // Highlight if it's your turn
  const timingUI = document.getElementById('timing-ui');
  if (playerId === socket.id) {
    timingUI.style.borderColor = '#00ff00';
    timingUI.style.boxShadow = '0 0 10px #00ff00';
  } else {
    timingUI.style.borderColor = '#ff6600';
    timingUI.style.boxShadow = 'none';
  }
}

function updateTurnQueue(turnQueue) {
  const turnQueueList = document.getElementById('turn-queue-list');
  if (turnQueue && turnQueue.length > 0) {
    const queueText = turnQueue.map((playerId, index) => {
      const player = gameState.players[playerId];
      const playerName = player ? player.name : 'Unknown';
      return `${index + 1}. ${playerName}${playerId === activePlayerId ? ' (Current)' : ''}`;
    }).join(', ');
    turnQueueList.textContent = queueText;
  } else {
    turnQueueList.textContent = '-';
  }
}

// Real-time system timer functions
function startRealTimeTimer(duration) {
  timerDuration = duration;
  timerStartTime = Date.now();
  isTimerPaused = false;
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      const elapsed = Date.now() - timerStartTime;
      const remaining = Math.max(0, timerDuration - elapsed);
      updateTimerDisplay(remaining);
      
      if (remaining <= 0) {
        clearInterval(currentTimer);
        currentTimer = null;
      }
    }
  }, 100); // Update every 100ms for smooth animation
  
  console.log(`Real-time timer started: ${duration}ms`);
}

// updateTimerDisplay function now imported from timerFunctions.js module

function updateTimerUI(timer, queuedMove) {
  const timerStatusElement = document.getElementById('timer-status');
  const timeRemainingElement = document.getElementById('time-remaining');
  
  if (!timerStatusElement || !timeRemainingElement) return;
  
  if (timer) {
    const remainingSeconds = timer.timeRemaining / 1000;
    timeRemainingElement.textContent = remainingSeconds.toFixed(1);
    
    if (timer.timeRemaining <= 0) {
      timerStatusElement.textContent = 'Ready to move';
      timerStatusElement.style.color = '#00ff00';
    } else {
      if (queuedMove) {
        timerStatusElement.textContent = 'Move queued - waiting for timer';
        timerStatusElement.style.color = '#ffaa00';
      } else {
        timerStatusElement.textContent = 'Timer counting down...';
        timerStatusElement.style.color = '#ff8800';
      }
    }
  }
}

function updateQueueDisplay(queuedMove) {
  const statusElement = document.getElementById('timer-status');
  
  if (!statusElement) return;
  
  if (queuedMove) {
    statusElement.textContent = `Move queued: ${queuedMove.pieceId} → (${queuedMove.targetRow}, ${queuedMove.targetCol})`;
    statusElement.style.color = '#ffaa00';
  } else {
    statusElement.textContent = 'No move queued';
    statusElement.style.color = '#ccc';
  }
}

// Camera controls setup
let controls;
let manualCameraControls = null;

if (typeof THREE !== 'undefined' && THREE.TrackballControls) {
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.noPan = true;
  controls.minDistance = 8;
  controls.maxDistance = 15;
  controls.rotateSpeed = 1.8;  // Increased from 1.0 for more responsive rotation
  controls.zoomSpeed = 1.2;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  
  console.log('TrackballControls initialized successfully with unlimited 3D rotation');
} else if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
  // Fallback to OrbitControls if TrackballControls not available
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 15;
  
  // Enable unrestricted 3D rotation - remove polar angle restrictions completely
  controls.minPolarAngle = 0; // Default minimum
  controls.maxPolarAngle = Math.PI; // Default maximum
  
  // Override the internal constraint logic to disable polar limits
  const originalUpdate = controls.update;
  controls.update = function() {
    // Temporarily disable polar angle constraints
    const originalMinPolar = this.minPolarAngle;
    const originalMaxPolar = this.maxPolarAngle;
    
    // Set to unlimited range during update
    this.minPolarAngle = -Infinity;
    this.maxPolarAngle = Infinity;
    
    // Call original update
    const result = originalUpdate.call(this);
    
    // Restore original values (though they won't be used)
    this.minPolarAngle = originalMinPolar;
    this.maxPolarAngle = originalMaxPolar;
    
    return result;
  };
  
  console.log('OrbitControls initialized as fallback (with attempted unrestricted rotation)');
} else {
  console.log('Using manual camera controls instead of OrbitControls');
  // Manual camera control system
  manualCameraControls = {
    cameraDistance: 10,
    cameraAngleX: 0,
    cameraAngleY: 0,
    
    updateCameraPosition() {
      camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
      camera.position.y = this.cameraDistance * Math.sin(this.cameraAngleY);
      camera.position.z = this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
      camera.lookAt(0, 0, 0);
    },
    
    handleCameraMouseMove(e) {
      if (isDragging && mouseDownTime > 0) {
        const deltaX = e.clientX - mouseStartPos.x;
        const deltaY = e.clientY - mouseStartPos.y;
        
        this.cameraAngleX += deltaX * 0.01;
        this.cameraAngleY += deltaY * 0.01;
        
        // Enable unrestricted 3D rotation - remove polar angle restrictions
        // this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));
        
        this.updateCameraPosition();
        
        mouseStartPos.x = e.clientX;
        mouseStartPos.y = e.clientY;
      }
    },
    
    handleWheel(e) {
      this.cameraDistance += e.deltaY * 0.01;
      this.cameraDistance = Math.max(8, Math.min(15, this.cameraDistance));
      this.updateCameraPosition();
    }
  };
  
  // Initialize camera position
  manualCameraControls.updateCameraPosition();
  
  // Add wheel event listener for zoom
  window.addEventListener('wheel', (e) => {
    manualCameraControls.handleWheel(e);
  });
}
// Set initial camera position to show both poles better
camera.position.set(5, 5, 10);
camera.lookAt(0, 0, 0);

// Globe setup
// Globe radius now imported from gameConfig.js as WORLD_CONFIG.WORLD_CONFIG.globeRadius
const sphereGeometry = new THREE.SphereGeometry(WORLD_CONFIG.WORLD_CONFIG.globeRadius, 64, 64);
const sphereMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x2266aa, 
  wireframe: false,
  transparent: true,
  opacity: 0.8
});
const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(globe);

console.log('Globe created and added to scene');

// Grid overlay
const gridSquares = [];
const poleMarkers = [];

function createGridOverlay() {
  try {
    console.log('🚨 CREATEGRIDSOVERLAY FUNCTION CALLED - THIS SHOULD DEFINITELY SHOW UP! 🚨');
    console.log('🔧 Starting grid overlay creation...');
    
    // Use correct grid configuration
    const gridRows = 20;
    const gridCols = 8;
    
    console.log(`Grid configuration: ${gridRows} rows × ${gridCols} cols`);
    
    // Create circular caps at the poles first
    // North pole cap (where Player 1 king is at row 0)
    const northCapGeometry = new THREE.CircleGeometry(WORLD_CONFIG.WORLD_CONFIG.globeRadius * 0.08, 32); // Smaller radius
    const northCapMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4169E1, // Blue
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const northCap = new THREE.Mesh(northCapGeometry, northCapMaterial);
    northCap.position.set(0, WORLD_CONFIG.globeRadius + 0.05, 0); // Much lower so pieces sit well above
    northCap.rotation.x = -Math.PI / 2;
    northCap.userData = { isPole: true, poleType: 'north' };
    scene.add(northCap);
    gridSquares.push(northCap);
    
    // South pole cap (where Player 2 king is at row 19)
    const southCapGeometry = new THREE.CircleGeometry(WORLD_CONFIG.globeRadius * 0.08, 32); // Smaller radius
    const southCapMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xDC143C, // Red
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const southCap = new THREE.Mesh(southCapGeometry, southCapMaterial);
    southCap.position.set(0, -WORLD_CONFIG.globeRadius - 0.05, 0); // Much lower so pieces sit well above
    southCap.rotation.x = Math.PI / 2;
    southCap.userData = { isPole: true, poleType: 'south' };
    scene.add(southCap);
    gridSquares.push(southCap);
    
    // Create concentric rings with alternating colored sections
    for (let row = 1; row < gridRows - 1; row++) { // Skip pole rows (0 and 19)
      // Calculate the Y position for this ring - MATCH PIECE POSITIONING EXACTLY
      const ringPhiDeg = (row / (gridRows - 1)) * 180; // Same formula as pieces
      const ringPhi = THREE.MathUtils.degToRad(ringPhiDeg); // Convert to radians
      const ringY = WORLD_CONFIG.globeRadius * Math.cos(ringPhi);
      const ringRadius = WORLD_CONFIG.globeRadius * Math.sin(ringPhi);
      
      // Calculate ring thickness (moved to outer scope)
      const ringThickness = Math.PI / gridRows + 0.005; // Slightly thinner rings for better fit
      const phiStart = ringPhi - ringThickness / 2;
      const phiEnd = ringPhi + ringThickness / 2;
      
      // Create sections within this ring
      for (let col = 0; col < gridCols; col++) {
        try {
          // Calculate angles for this section with rotations
          const baseRotation = (22.5 * Math.PI) / 180; // 22.5 degrees for all rings
          const additionalRotation = (row % 2 === 1) ? (45 * Math.PI) / 180 : 0; // Additional 45 degrees for odd rings
          const totalRotation = baseRotation + additionalRotation;
          
          const angleStart = (col / gridCols) * Math.PI * 2 + totalRotation;
          const angleEnd = ((col + 1) / gridCols) * Math.PI * 2 + totalRotation;
          
          // Each section within the ring alternates colors
          const isBlueSection = col % 2 === 0;
          
          // Create curved ring section using SphereGeometry to follow sphere surface
          
          const curvedSegmentGeometry = new THREE.SphereGeometry(
            WORLD_CONFIG.globeRadius + 0.05, // radius (much lower so pieces sit well above)
            16, // widthSegments (longitude divisions for smoothness)
            8, // heightSegments (latitude divisions for smoothness)
            angleStart, // phiStart (longitude start)
            angleEnd - angleStart, // phiLength (longitude span)
            phiStart, // thetaStart (latitude start) 
            phiEnd - phiStart // thetaLength (latitude span)
          );
          
          const curvedSegmentMaterial = new THREE.MeshBasicMaterial({ 
            color: isBlueSection ? 0x4169E1 : 0xDC143C, // Royal blue and crimson alternating
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
          });
          
          const curvedSegment = new THREE.Mesh(curvedSegmentGeometry, curvedSegmentMaterial);
          curvedSegment.position.set(0, 0, 0); // Centered at origin
          curvedSegment.userData = { gridRow: row, gridCol: col, isBlueSection: isBlueSection };
          scene.add(curvedSegment);
          gridSquares.push(curvedSegment);
          
          // Add subtle border lines between sections for better grid definition
          const borderGeometry = new THREE.SphereGeometry(
            WORLD_CONFIG.globeRadius + 0.06, // slightly larger radius for borders (above grid, well below pieces)
            2, // thin width
            8, // height segments
            angleStart, // start angle
            0.005, // very thin angular width for border
            phiStart, // latitude start
            phiEnd - phiStart // latitude span
          );
          
          const borderMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333, // dark gray borders
            transparent: true,
            opacity: 0.3
          });
          
          const border = new THREE.Mesh(borderGeometry, borderMaterial);
          border.position.set(0, 0, 0);
          scene.add(border);
          gridSquares.push(border);
          
                    // Debug first few segments
          if (row < 3 && col < 2) {
            console.log(`Ring ${row}, Section ${col}: Y=${ringY}, radius=${ringRadius}, angle=${angleStart}-${angleEnd}, isBlue=${isBlueSection}`);
          }
        } catch (error) {
          console.error(`❌ Error creating ring segment at (${row}, ${col}):`, error);
        }
      }
      
      // Add horizontal ring border after each ring (except last)
      if (row < gridRows - 1) {
        const ringBorderGeometry = new THREE.SphereGeometry(
          WORLD_CONFIG.globeRadius + 0.06, // slightly larger radius (above grid, well below pieces)
          32, // width segments
          2, // thin height
          0, // full rotation
          Math.PI * 2, // full circle
          ringPhi + ringThickness / 2 - 0.002, // at ring edge
          0.004 // very thin latitude span
        );
        
        const ringBorderMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x333333, // dark gray
          transparent: true,
          opacity: 0.3
        });
        
        const ringBorder = new THREE.Mesh(ringBorderGeometry, ringBorderMaterial);
        ringBorder.position.set(0, 0, 0);
        scene.add(ringBorder);
        gridSquares.push(ringBorder);
      }
    }
  
  console.log(`✅ Created ${gridSquares.length} grid squares and ${poleMarkers.length} pole markers`);
  
  } catch (error) {
    console.error('❌ ERROR in createGridOverlay function:', error);
    console.error('❌ Error stack:', error.stack);
  }
}

// Create grid overlay on startup
console.log('🚨 ABOUT TO CALL createGridOverlay() - THIS SHOULD SHOW UP! 🚨');
createGridOverlay();

// Enhanced lighting for better piece visibility
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased ambient light
scene.add(ambientLight);

// Add hemisphere light for natural top/bottom lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6);
scene.add(hemisphereLight);

// Main directional light (increased intensity)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Secondary directional light from opposite side for better coverage
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight2.position.set(-3, 3, -3);
scene.add(directionalLight2);

// Point light near camera for additional fill lighting
const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
pointLight.position.set(0, 0, 10);
scene.add(pointLight);

console.log('Enhanced lighting added to scene');

// UI elements - defined early so they're available for model loading
const playerCountEl = document.getElementById('player-count');
const gameInfoEl = document.getElementById('game-info');
const statusEl = document.getElementById('status');

// Model loading system
const modelCache = {};
let modelLoader = null;

// Initialize GLTFLoader when available
function initializeGLTFLoader() {
  if (typeof THREE.GLTFLoader !== 'undefined') {
    modelLoader = new THREE.GLTFLoader();
    console.log('✅ GLTFLoader initialized successfully');
    return true;
  } else {
    console.warn('⚠️ GLTFLoader not available, using geometric fallbacks');
    return false;
  }
}

// Try to initialize GLTFLoader
const hasGLTFLoader = initializeGLTFLoader();

// MODEL_PATHS now imported from modelUtils.js module

// Load a 3D model with caching
async function loadModel(pieceType) {
  // Check cache first
  if (modelCache[pieceType]) {
    return modelCache[pieceType];
  }
  
  // If no GLTFLoader, return null to use geometric fallback
  if (!hasGLTFLoader || !modelLoader) {
    console.warn(`GLTFLoader not available for ${pieceType}, using geometric fallback`);
    return null;
  }
  
  const modelPath = MODEL_PATHS[pieceType];
  if (!modelPath) {
    console.warn(`No model path found for piece type: ${pieceType}`);
    return null;
  }
  
  try {
    console.log(`Loading model for ${pieceType}: ${modelPath}`);
    
    const gltf = await new Promise((resolve, reject) => {
      modelLoader.load(
        modelPath,
        resolve,
        (progress) => {
          console.log(`Loading ${pieceType}: ${(progress.loaded / progress.total * 100)}%`);
        },
        reject
      );
    });
    
    // Cache the loaded model
    modelCache[pieceType] = gltf;
    console.log(`Successfully loaded model for ${pieceType}`);
    return gltf;
    
  } catch (error) {
    console.error(`Failed to load model for ${pieceType}:`, error);
    return null;
  }
}

// Preload all models with progress tracking
async function preloadModels() {
  console.log('Preloading all 3D models...');
  const pieceTypes = Object.keys(MODEL_PATHS);
  
  // Update UI with loading status
  gameInfoEl.textContent = 'Loading 3D models...';
  
  let loadedCount = 0;
  const totalCount = pieceTypes.length;
  
  const loadPromises = pieceTypes.map(async (pieceType) => {
    try {
      await loadModel(pieceType);
      loadedCount++;
      
      // Update progress
      const progress = Math.round((loadedCount / totalCount) * 100);
      gameInfoEl.textContent = `Loading 3D models... ${progress}% (${loadedCount}/${totalCount})`;
      
    } catch (error) {
      console.error(`Failed to preload ${pieceType}:`, error);
      loadedCount++;
      
      // Update progress even for failed loads
      const progress = Math.round((loadedCount / totalCount) * 100);
      gameInfoEl.textContent = `Loading 3D models... ${progress}% (${loadedCount}/${totalCount})`;
    }
  });
  
  await Promise.all(loadPromises);
  console.log('Model preloading complete!');
}

// Test if models are accessible
async function testModelAccess() {
  try {
    const response = await fetch('./chess piece models/Final pieces/KING.glb');
    if (response.ok) {
      console.log('✅ Model files are accessible');
      return true;
    } else {
      console.warn('⚠️ Model files not accessible, status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Model files not accessible:', error);
    return false;
  }
}

// Start preloading models after checking accessibility
testModelAccess().then((accessible) => {
  if (accessible && hasGLTFLoader) {
    preloadModels().then(() => {
      console.log('All models ready for use!');
      gameInfoEl.textContent = 'Models loaded! Waiting for players...';
    }).catch(error => {
      console.error('Error preloading models:', error);
      gameInfoEl.textContent = 'Error loading models. Using fallback shapes.';
    });
  } else {
    console.log('Using geometric fallbacks for all pieces');
    gameInfoEl.textContent = 'Using geometric shapes. Waiting for players...';
  }
});

// Old grid overlay function removed - using new version above

// Game state - now using configuration from gameConfig.js
let gameState = createDefaultGameState();

// COLOR_MAP now imported from colorUtils.js module

// Visual elements
const pieceMeshes = {};
let validMoves = [];
let selectedPieceId = null;

// Visual effects manager - MOVED HERE TO FIX INITIALIZATION ORDER (will be initialized after scene is ready)
let visualEffects = null;

// Text label cache - MOVED HERE TO FIX INITIALIZATION ORDER
const textLabelCache = new Map();

// CLASS DEFINITIONS - TransitionManager now imported from transitionManager.js module

// Enhanced Visual Effects System now imported from visualEffectsManager.js module

// UI elements - moved to top of file

// Socket event handlers are now set up in setupSocketListeners() function

// Duplicate socket handlers removed - all handlers now properly set up in setupSocketListeners() function

// More duplicate socket handlers removed

// Removed all duplicate socket handlers - they are now properly handled in setupSocketListeners() function

// All socket handlers have been moved to the socketCommunication module

// Auto-update color display when game state changes
  const { tournament, player } = data;
  console.log(`Joined tournament: ${tournament.name} as ${player.name}`);
  gameInfoEl.textContent = `Joined tournament: ${tournament.name}`;
  gameInfoEl.style.color = '#44ff44';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
  
  updateTournamentStatus(tournament);
});











// Victory handler moved to line ~5600 to integrate with game over screen







function showNotification(message, color, duration) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: ${color};
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    font-size: 24px;
    font-weight: bold;
    border: 3px solid ${color};
    animation: pulse 1s infinite;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

// showBattleContestPrompt function now imported from movementBattleSystem.js module

function showDiceBattleAnimation(battleLog, winner, loser, duration) {
  // Create dice battle animation UI
  const animationDiv = document.createElement('div');
  animationDiv.id = 'dice-battle-animation';
  animationDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    z-index: 1000;
    border: 2px solid #ffd700;
    min-width: 300px;
  `;
  
  animationDiv.innerHTML = `
    <h3>⚔️ DICE BATTLE ⚔️</h3>
    <div id="dice-display" style="font-size: 24px; margin: 20px 0;"></div>
    <div id="battle-status" style="font-size: 18px; color: #ffd700;"></div>
  `;
  
  document.body.appendChild(animationDiv);
  
  const diceDisplay = document.getElementById('dice-display');
  const battleStatus = document.getElementById('battle-status');
  
  // Show initial dice
  diceDisplay.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
      <div style="text-align: center;">
        <div>Attacker</div>
        <div style="font-size: 32px; color: #ff6b6b;">${battleLog.attackerDice.join(', ')}</div>
      </div>
      <div style="text-align: center;">
        <div>Defender</div>
        <div style="font-size: 32px; color: #4CAF50;">${battleLog.defenderDice.join(', ')}</div>
      </div>
    </div>
  `;
  
  battleStatus.textContent = 'Rolling dice...';
  
  // Show tie-breaker rounds if any
  let currentRound = 0;
  const showTieBreaker = () => {
    if (currentRound < battleLog.rounds.length) {
      const round = battleLog.rounds[currentRound];
      diceDisplay.innerHTML += `
        <div style="margin: 10px 0; padding: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 5px;">
          <div>Tie-breaker ${currentRound + 1}</div>
          <div style="font-size: 20px;">
            <span style="color: #ff6b6b;">${round.attacker}</span> vs <span style="color: #4CAF50;">${round.defender}</span>
          </div>
        </div>
      `;
      currentRound++;
      setTimeout(showTieBreaker, 1000);
    } else {
      // Show final result
      battleStatus.textContent = `Battle complete!`;
      setTimeout(() => {
        animationDiv.remove();
      }, 1000);
    }
  };
  
  // Start tie-breaker sequence after initial delay
  setTimeout(showTieBreaker, 1000);
}

async function updateVisuals() {
  console.log('🔧 updateVisuals called');
  console.log('🔧 gameState.pieces:', gameState.pieces);
  console.log('🔧 Number of pieces in gameState:', Object.keys(gameState.pieces || {}).length);
  console.log('🔧 Current pieceMeshes:', Object.keys(pieceMeshes));
  
  // Remove pieces that no longer exist
  Object.keys(pieceMeshes).forEach(pieceId => {
    if (!gameState.pieces[pieceId]) {
      console.log(`🔧 Removing piece ${pieceId} (no longer exists)`);
      performanceOptimizer.removePieceEfficient(pieceId);
    }
  });
  
  // Add or update pieces
  const piecePromises = Object.values(gameState.pieces).map(async piece => {
    if (!pieceMeshes[piece.id]) {
      console.log(`🔧 Creating new mesh for piece ${piece.id} (${piece.type})`);
      try {
        await createPieceMeshOptimized(piece);
        console.log(`🔧 Successfully created mesh for piece ${piece.id}`);
      } catch (error) {
        console.error(`❌ Failed to create mesh for piece ${piece.id}:`, error);
      }
    } else {
      console.log(`🔧 Updating existing mesh for piece ${piece.id}`);
      updatePieceMeshOptimized(piece);
    }
  });
  
  // Wait for all piece creation to complete
  await Promise.all(piecePromises);
  console.log('🔧 updateVisuals completed');
}

// Delta update function for better performance
async function updateVisualsDelta(delta) {
  // Remove pieces
  delta.removedPieces.forEach(pieceId => {
    performanceOptimizer.removePieceEfficient(pieceId);
  });
  
  // Add new pieces
  const addPromises = delta.addedPieces.map(async piece => {
    try {
      await createPieceMeshOptimized(piece);
    } catch (error) {
      console.error(`Failed to create mesh for piece ${piece.id}:`, error);
    }
  });
  
  // Update moved pieces
  delta.movedPieces.forEach(piece => {
    performanceOptimizer.updatePieceEfficient(piece);
  });
  
  // Wait for all additions to complete
  await Promise.all(addPromises);
}

async function createPieceMesh(piece) {
  // Use optimized version
  return await createPieceMeshOptimized(piece);
}

async function createPieceMeshOptimized(piece) {
  const player = gameState.players[piece.playerId];
  const position = getWorldPosition(piece.row, piece.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
  
  // Get player index for consistent coloring
  const playerIndex = player.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(piece.playerId);
  
  console.log(`Creating piece ${piece.type} for player ${player.name} (index: ${playerIndex})`);
  console.log(`Player object:`, player);
  const debugColor = getPlayerColor(piece.playerId, playerIndex);
  console.log(`Player color: 0x${debugColor.toString(16).padStart(6, '0').toUpperCase()}`);
  
  let mesh;
  
  // Try to load GLB model with caching
  try {
    const gltf = await performanceOptimizer.getCachedModel(piece.type);
    if (gltf && gltf.scene) {
      console.log(`Using cached GLB model for ${piece.type}`);
      
      // Clone the model scene
      mesh = gltf.scene.clone();
      
      // Apply player color tinting to materials and set userData for click detection
      const playerColor = getPieceColorForPlayer(piece, player, playerIndex);
      console.log(`Applying GLB color ${playerColor.toString(16)} to ${piece.type} mesh`);
      mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          // Create material and cache it
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => {
              const newMat = mat.clone();
              newMat.color.setHex(playerColor);
              // ✅ PHASE 3: Balanced material properties for optimal visual distinction
              newMat.emissive.setHex(playerColor).multiplyScalar(0.15); // Subtle glow
              newMat.metalness = 0.3; // Reduced metalness for better color visibility
              newMat.roughness = 0.6; // Balanced roughness for good lighting response
              return newMat;
            });
          } else {
            child.material = child.material.clone();
            child.material.color.setHex(playerColor);
            // ✅ PHASE 3: Balanced material properties for optimal visual distinction
            child.material.emissive.setHex(playerColor).multiplyScalar(0.15); // Subtle glow
            child.material.metalness = 0.3; // Reduced metalness for better color visibility
            child.material.roughness = 0.6; // Balanced roughness for good lighting response
          }
          
          // Set userData on child meshes for click detection
          child.userData.piece = piece;
          child.userData.pieceId = piece.id;
        }
      });
      
      // Scale the model appropriately for the sphere
      const modelScale = getModelScale(piece.type);
      mesh.scale.set(modelScale, modelScale, modelScale);
      
    } else {
      throw new Error(`Failed to load GLB model for ${piece.type}`);
    }
    
  } catch (error) {
    console.warn(`GLB model loading failed for ${piece.type}, falling back to geometric shape:`, error);
    
    // Fallback to geometric shapes
    mesh = createGeometricPiece(piece.type);
    
    // Use player-specific color for better identification
    const pieceColor = getPieceColorForPlayer(piece, player, playerIndex);
    console.log(`Applying geometric fallback color ${pieceColor.toString(16)} to ${piece.type} mesh`);
    
    // ✅ PHASE 3: Balanced material properties for geometric fallbacks
    const material = performanceOptimizer.getCachedMaterial('standard', {
      color: pieceColor,
      emissive: new THREE.Color(pieceColor).multiplyScalar(0.15), // Subtle glow
      metalness: 0.3, // Balanced metalness
      roughness: 0.6  // Balanced roughness
    });
    
    mesh.material = material;
    console.log(`Material applied with color:`, material.color.getHex().toString(16));
    
    // Apply geometric shape scaling
    const scale = getGeometricScale(piece.type);
    mesh.scale.set(scale, scale, scale);
  }
  
  // Position on sphere surface
  mesh.position.set(position.x, position.y, position.z);
  mesh.userData = { pieceId: piece.id, piece: piece };
  
  // Orient piece so bottom faces sphere center (top points away from center)
  // Calculate the normal vector from center to piece position
  const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
  
  // Create a rotation matrix to align the piece with the sphere surface
  const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
  mesh.setRotationFromQuaternion(quaternion);
  
  // Apply height adjustments for GLB models to match piece positioning
  const heightAdjustment = getModelHeightAdjustment(piece.type);
  if (heightAdjustment !== 0) {
    // Move the mesh along the normal vector (away from sphere center)
    const adjustmentVector = normal.clone().multiplyScalar(heightAdjustment);
    mesh.position.add(adjustmentVector);
    console.log(`Applied height adjustment ${heightAdjustment} to ${piece.type} GLB model`);
  }
  
  // Debug: Log King positions only
  if (piece.type === 'KING') {
    console.log(`${piece.symbol} King at grid (${piece.row}, ${piece.col}) - Player ${playerIndex + 1}`);
  }
  
  // Add text label with piece symbol (cached)
  const labelTexture = createCachedTextLabel(piece.symbol, textLabelCache);
  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(0.5, 0.5, 1);
  label.position.set(0, 0.3, 0);
  label.raycast = function() {}; // Disable raycasting for piece symbol labels
  
  mesh.add(label);
  
  // Add floating evolution points label (skip for King pieces)
  if (piece.type !== 'KING') {
    console.log('🎯 Creating evolution points label for piece:', piece.id);
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    console.log('🎯 Evolution points retrieved:', evolutionPoints);
    const evolutionLabelTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId, gameState);
    console.log('🎯 Evolution label texture created:', evolutionLabelTexture);
    const evolutionLabelMaterial = new THREE.SpriteMaterial({ map: evolutionLabelTexture });
    const evolutionLabel = new THREE.Sprite(evolutionLabelMaterial);
    evolutionLabel.scale.set(1.0, 0.5, 1); // Much larger scale
    evolutionLabel.position.set(0, 1.2, 0); // Higher above the piece
    console.log('🎯 Evolution label positioned at:', evolutionLabel.position, 'with scale:', evolutionLabel.scale);
    evolutionLabel.userData = { isEvolutionLabel: true };
    evolutionLabel.raycast = function() {}; // Disable raycasting for evolution labels
    
    mesh.add(evolutionLabel);
    console.log('🎯 Evolution label added to mesh, total children:', mesh.children.length);
  } else {
    console.log('🎯 Skipping evolution label for King piece (Kings do not have evolution points)');
  }
  
  // Set userData for click detection
  mesh.userData.piece = piece;
  mesh.userData.pieceId = piece.id;
  
  scene.add(mesh);
  pieceMeshes[piece.id] = mesh;
  
  console.log(`✅ Successfully added piece ${piece.type} to scene at position:`, mesh.position);
  console.log(`📊 Scene now has ${scene.children.length} total objects`);
}

// Optimized piece update function
function updatePieceMeshOptimized(piece) {
  const mesh = pieceMeshes[piece.id];
  if (mesh) {
    const position = getWorldPosition(piece.row, piece.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
    console.log('🔄 POSITION UPDATE - Piece', piece.id, 'moved to:');
    console.log('  Grid position:', piece.row, piece.col);
    console.log('  World position:', position);
    console.log('  Previous world position:', mesh.position);
    
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.piece = piece;
    
    // Orient piece so bottom faces sphere center (top points away from center)
    const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
    const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.setRotationFromQuaternion(quaternion);
    
    // Update evolution points label
    updateEvolutionPointsLabel(mesh, piece);
  }
}

// Update evolution points label for a specific piece
function updateEvolutionPointsLabel(mesh, piece) {
  // Find the evolution label in the mesh children
  const evolutionLabel = mesh.children.find(child => 
    child.userData && child.userData.isEvolutionLabel
  );
  
  if (evolutionLabel) {
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    const newTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId, gameState);
    
    // Dispose of old texture to prevent memory leaks
    if (evolutionLabel.material.map) {
      evolutionLabel.material.map.dispose();
    }
    
    // Apply new texture
    evolutionLabel.material.map = newTexture;
    evolutionLabel.material.needsUpdate = true;
  }
}

// Update all evolution point labels (call this when player evolution points change)
function updateAllEvolutionPointLabels() {
    Object.values(pieceMeshes).forEach(mesh => {
    if (mesh.userData && mesh.userData.piece && mesh.userData.piece.type !== 'KING') {
      updateEvolutionPointsLabel(mesh, mesh.userData.piece);
    }
  });
}

// Cached text label creation - textLabelCache moved to top of file to fix initialization order

// createCachedTextLabel function now imported from pieceFunctions.js module

// getEvolutionPointsForPiece function now imported from pieceFunctions.js module

// createEvolutionPointsLabel function now imported from pieceFunctions.js module

// Model utility functions now imported from modelUtils.js module

// Helper function to create geometric shape fallbacks
function createGeometricPiece(pieceType) {
  let geometry;
  
  switch (pieceType) {
    case 'KING':
      geometry = new THREE.ConeGeometry(0.12, 0.3, 8);
      // Translate king cone up so its base aligns with pawn sphere base
      geometry.translate(0, 0.07, 0); // 0.15 (cone half-height) - 0.08 (sphere radius) = 0.07
      break;
    case 'QUEEN':
      geometry = new THREE.ConeGeometry(0.12, 0.25, 8);
      // Translate queen cone up so its base aligns with pawn sphere base
      geometry.translate(0, 0.045, 0); // 0.125 (cone half-height) - 0.08 (sphere radius) = 0.045
      break;
    case 'ROOK':
      geometry = new THREE.BoxGeometry(0.15, 0.2, 0.15);
      // Translate rook box up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // 0.10 (box half-height) - 0.08 (sphere radius) = 0.02
      break;
    case 'KNIGHT':
      geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      // Translate knight box up so its base aligns with pawn sphere base
      geometry.translate(0, -0.005, 0); // 0.075 (box half-height) - 0.08 (sphere radius) = -0.005
      break;
    case 'BISHOP':
      geometry = new THREE.ConeGeometry(0.1, 0.25, 6);
      // Translate bishop cone up so its base aligns with pawn sphere base
      geometry.translate(0, 0.045, 0); // 0.125 (cone half-height) - 0.08 (sphere radius) = 0.045
      break;
    case 'PAWN':
      geometry = new THREE.SphereGeometry(0.08, 12, 12);
      // Pawn sphere is the reference - no translation needed
      break;
    case 'SPLITTER':
      geometry = new THREE.OctahedronGeometry(0.1);
      // Translate splitter octahedron up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // 0.10 (octahedron half-height) - 0.08 (sphere radius) = 0.02
      break;
    case 'JUMPER':
      geometry = new THREE.TetrahedronGeometry(0.12);
      // Translate jumper tetrahedron up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // Approximate adjustment for tetrahedron
      break;
    case 'SUPER_JUMPER':
      geometry = new THREE.IcosahedronGeometry(0.1);
      // Translate super jumper icosahedron up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // 0.10 (icosahedron half-height) - 0.08 (sphere radius) = 0.02
      break;
    case 'HYPER_JUMPER':
      geometry = new THREE.DodecahedronGeometry(0.1);
      // Translate hyper jumper dodecahedron up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // 0.10 (dodecahedron half-height) - 0.08 (sphere radius) = 0.02
      break;
    case 'MISTRESS_JUMPER':
      geometry = new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8);
      // Translate mistress jumper cylinder up so its base aligns with pawn sphere base
      geometry.translate(0, 0.02, 0); // 0.10 (cylinder half-height) - 0.08 (sphere radius) = 0.02
      break;
    case 'HYBRID_QUEEN':
      geometry = new THREE.ConeGeometry(0.12, 0.25, 8);
      // Translate hybrid queen cone up so its base aligns with pawn sphere base
      geometry.translate(0, 0.045, 0); // 0.125 (cone half-height) - 0.08 (sphere radius) = 0.045
      break;
    default:
      geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  }
  
  return new THREE.Mesh(geometry);
}

function updatePieceMesh(piece) {
  const mesh = pieceMeshes[piece.id];
  if (mesh) {
    const position = getWorldPosition(piece.row, piece.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.piece = piece;
    
    // Orient piece so bottom faces sphere center (top points away from center)
    const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
    const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.setRotationFromQuaternion(quaternion);
  }
}

// getWorldPosition function now imported from gridFunctions.js module

function updateUI() {
  const playerCount = Object.keys(gameState.players).length;
  playerCountEl.textContent = `Players: ${playerCount}`;
  
  const pieceCount = Object.keys(gameState.pieces).length;
  
  // Update game info based on player count
  if (playerCount >= 2) {
    gameInfoEl.textContent = `Game ready! ${pieceCount} pieces on board. Click your pieces to move.`;
    gameInfoEl.style.color = '#00ff00';
  } else if (playerCount === 1) {
    gameInfoEl.textContent = 'Waiting for opponent... Click "Add AI Player" to start!';
    gameInfoEl.style.color = '#ffaa00';
  } else {
    gameInfoEl.textContent = 'Waiting for players to join...';
    gameInfoEl.style.color = '#ffffff';
  }
  
  // Update player name display
  const activePlayerNameEl = document.getElementById('active-player-name');
  if (activePlayerNameEl) {
    const myPlayer = gameState.players[socket.id];
    if (myPlayer) {
      activePlayerNameEl.textContent = myPlayer.name || playerName || 'Unknown Player';
    } else {
      activePlayerNameEl.textContent = playerName || 'Connecting...';
    }
  }
  
  // Update auto-assigned color display
  updatePlayerColorDisplay();
  
  // Add player color indicators
  updatePlayerColorIndicators();
}

function updatePlayerColorIndicators() {
  // Find or create player color indicator div
  let colorIndicator = document.getElementById('player-color-indicator');
  if (!colorIndicator) {
    colorIndicator = document.createElement('div');
    colorIndicator.id = 'player-color-indicator';
    colorIndicator.style.cssText = `
      margin-top: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      font-size: 12px;
    `;
    document.getElementById('ui').appendChild(colorIndicator);
  }
  
  // Clear existing content
  colorIndicator.innerHTML = '<div style="color: #ccc; margin-bottom: 5px;">Player Colors:</div>';
  
  // Add color indicators for each player
  const currentPlayerId = socket.id;
  const players = Object.values(gameState.players);
  
  players.forEach((player, index) => {
    const playerColor = getPlayerColor(player.id, player.index) || 0xffffff;
    const colorHex = '#' + playerColor.toString(16).padStart(6, '0');
    
    const playerDiv = document.createElement('div');
    playerDiv.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 3px;
      ${player.id === currentPlayerId ? 'font-weight: bold; background: rgba(255, 255, 255, 0.1); padding: 2px 4px; border-radius: 3px;' : ''}
    `;
    
    const colorSwatch = document.createElement('div');
    colorSwatch.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: ${colorHex};
      border-radius: 2px;
      margin-right: 8px;
      border: 1px solid #666;
    `;
    
    const playerName = document.createElement('span');
    playerName.textContent = `${player.name}${player.id === currentPlayerId ? ' (You)' : ''}`;
    playerName.style.color = '#fff';
    
    playerDiv.appendChild(colorSwatch);
    playerDiv.appendChild(playerName);
    colorIndicator.appendChild(playerDiv);
  });
}

// selectedMovementMode moved to global scope

function showDualMovementUI() {
  const dualMovementUI = document.getElementById('dual-movement-ui');
  const modeDescription = document.getElementById('mode-description');
  
  dualMovementUI.style.display = 'block';
  modeDescription.textContent = 'Click a mode to see movement options';
  
  // Clear previous mode selection
  selectedMovementMode = null;
  updateModeButtons();
}

function hideDualMovementUI() {
  const dualMovementUI = document.getElementById('dual-movement-ui');
  dualMovementUI.style.display = 'none';
  selectedMovementMode = null;
}

function updateModeButtons() {
  const queenBtn = document.getElementById('queen-mode-btn');
  const jumperBtn = document.getElementById('jumper-mode-btn');
  
  // Reset button styles
  queenBtn.style.opacity = selectedMovementMode === 'queen' ? '1' : '0.7';
  jumperBtn.style.opacity = selectedMovementMode === 'jumper' ? '1' : '0.7';
  
  queenBtn.style.border = selectedMovementMode === 'queen' ? '2px solid #fff' : 'none';
  jumperBtn.style.border = selectedMovementMode === 'jumper' ? '2px solid #fff' : 'none';
}

function selectMovementMode(mode) {
  selectedMovementMode = mode;
  updateModeButtons();
  
  // Update mode description
  const modeDescription = document.getElementById('mode-description');
  if (mode === 'queen') {
    modeDescription.textContent = 'Queen Mode: Move like a queen (gold cubes)';
  } else if (mode === 'jumper') {
    modeDescription.textContent = 'Jumper Mode: Jump and capture multiple pieces (orange cones)';
  }
  
  // Highlight moves for selected mode
  highlightValidMovesForMode(mode);
}

function highlightValidMovesForMode(mode) {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Filter moves by selected mode
  const filteredMoves = validMoves.filter(move => 
    (mode === 'queen' && move.type === 'dual-move-queen') ||
    (mode === 'jumper' && move.type === 'dual-move-jumper')
  );
  
  // Add highlights for filtered moves
  filteredMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
    
    let highlightColor, highlightGeometry;
    
    if (move.type === 'dual-move-queen') {
      highlightColor = 0xffd700; // Gold for dual queen movement
      highlightGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18); // Cube shape for queen mode
    } else if (move.type === 'dual-move-jumper') {
      highlightColor = 0xff6600; // Orange-red for dual jumper movement
      highlightGeometry = new THREE.ConeGeometry(0.12, 0.25, 6); // Cone shape for jumper mode
      
      // Add multi-capture area visualization for jumper moves
      if (move.multiCapture && move.multiCapture.length > 0) {
        // Add purple wireframe octahedrons for captured pieces
        move.multiCapture.forEach(capturedPieceId => {
          const capturedPiece = gameState.pieces[capturedPieceId];
          if (capturedPiece) {
            const capturedPosition = getWorldPosition(capturedPiece.row, capturedPiece.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
            
            const captureGeometry = new THREE.OctahedronGeometry(0.1);
            const captureMaterial = new THREE.MeshBasicMaterial({
              color: 0xaa00ff, // Purple for captures
              transparent: true,
              opacity: 0.6,
              wireframe: true
            });
            
            const captureHighlight = new THREE.Mesh(captureGeometry, captureMaterial);
            captureHighlight.position.set(capturedPosition.x, capturedPosition.y, capturedPosition.z);
            captureHighlight.userData = { isValidMoveHighlight: true, isCaptureIndicator: true };
            
            scene.add(captureHighlight);
          }
        });
      }
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.8,
      wireframe: true
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y, position.z);
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    scene.add(highlight);
  });
  
  console.log(`Highlighted ${filteredMoves.length} moves for ${mode} mode`);
}

// Lobby management
let lobbies = [];

// Lobby system functions now imported from lobbySystem.js module

// Statistics management functions now imported from statisticsUI.js module

// Evolution system functions now imported from evolutionUI.js module

// startGameCountdown function now imported from gameInitialization.js module

// Tournament management
let currentTournament = null;
let tournaments = [];

// Tournament system functions now imported from tournamentUI.js module
    return;
  }
  
  bracketsElement.innerHTML = tournament.brackets.map(round => `
    <div style="margin-bottom: 10px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 3px;">
      <div style="font-weight: bold; margin-bottom: 5px;">${round.name}</div>
      ${round.matches.map(match => `
        <div style="margin-bottom: 3px; padding: 3px; background: rgba(0, 0, 0, 0.3); border-radius: 2px;">
          ${match.isBye ? 
            `<span style="color: #888;">${match.player1.name} (BYE)</span>` :
            `<span style="color: ${match.winner && match.winner.id === match.player1.id ? '#44ff44' : '#fff'};">${match.player1 ? match.player1.name : 'TBD'}</span> vs 
             <span style="color: ${match.winner && match.winner.id === match.player2.id ? '#44ff44' : '#fff'};">${match.player2 ? match.player2.name : 'TBD'}</span>
             ${match.status === 'completed' ? ` - Winner: ${match.winner.name}` : ''}
             ${match.status === 'active' ? ' - IN PROGRESS' : ''}`
          }
        </div>
      `).join('')}
    </div>
  `).join('');
}

function highlightValidMoves() {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Update mode indicator to show move selection
  if (modeIndicator && validMoves.length > 0) {
    modeIndicator.textContent = 'Select a move (click green highlights)';
    modeIndicator.style.borderColor = '#00ff00';
    modeIndicator.style.background = 'rgba(0, 50, 0, 0.8)';
  }
  
  // Check for positions with multiple move types
  const positionMoveTypes = {};
  validMoves.forEach(move => {
    const key = `${move.row},${move.col}`;
    if (!positionMoveTypes[key]) {
      positionMoveTypes[key] = [];
    }
    positionMoveTypes[key].push(move);
  });
  
  // Add new highlights - create separate highlight for each move type
  validMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
    
    // Different colors and shapes for different move types
    let highlightColor, highlightGeometry;
    
    if (move.type === 'attack') {
      highlightColor = 0xff4444; // Red for attack
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    } else if (move.type === 'split') {
      highlightColor = 0xffff00; // BRIGHT YELLOW for split moves - visually distinct from regular moves
      // Create a torus (3D ring) for split moves - more clickable than flat ring
      highlightGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
    } else if (move.type === 'jump-capture') {
      highlightColor = 0xff8800; // Orange for jump capture
      highlightGeometry = new THREE.TetrahedronGeometry(0.12); // Pyramid shape for jump
    } else if (move.type === 'multi-jump-capture') {
      highlightColor = 0xaa00ff; // Purple for multi-jump capture
      highlightGeometry = new THREE.OctahedronGeometry(0.15); // Larger octahedron for multi-capture
    } else if (move.type === 'dual-move-queen') {
      highlightColor = 0xffd700; // Gold for dual queen movement
      highlightGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18); // Cube shape for queen mode
    } else if (move.type === 'dual-move-jumper') {
      highlightColor = 0xff6600; // Orange-red for dual jumper movement
      highlightGeometry = new THREE.ConeGeometry(0.12, 0.25, 6); // Cone shape for jumper mode
    } else {
      highlightColor = 0x44ff44; // Green for regular move
      highlightGeometry = new THREE.SphereGeometry(0.25, 16, 16); // Increased size for better clicking
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.8,
      wireframe: move.type === 'jump-capture' || move.type === 'multi-jump-capture' || move.type === 'dual-move-queen' || move.type === 'dual-move-jumper', // Wireframe for special moves (not split since it uses ring geometry)
      depthTest: true,
      depthWrite: true
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y, position.z);
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    // Make sure the highlight is above the globe surface
    const heightAdjustment = move.type === 'split' ? 0.08 : 0.05; // Split highlights slightly higher
    const normalizedPos = highlight.position.clone().normalize();
    highlight.position.addScaledVector(normalizedPos, heightAdjustment);
    
    scene.add(highlight);
    console.log(`Added ${move.type} highlight at (${move.row}, ${move.col}) - userData:`, highlight.userData, 'position:', highlight.position);
  });
}

function clearValidMoveHighlights() {
  // Remove all valid move highlights
  const highlightsToRemove = [];
  scene.children.forEach(child => {
    if (child.userData.isValidMoveHighlight) {
      highlightsToRemove.push(child);
    }
  });
  
  console.log(`🧹 Clearing ${highlightsToRemove.length} valid move highlights`);
  highlightsToRemove.forEach(child => scene.remove(child));
  
  // Clear selection highlight
  clearSelectionHighlight();
}

function clearSelectionHighlight() {
  // Remove selection highlight
  scene.children.forEach(child => {
    if (child.userData.isSelectionHighlight) {
      scene.remove(child);
    }
  });
}

function highlightSelectedPiece(pieceId) {
  // Clear previous selection highlight
  clearSelectionHighlight();
  
  const piece = gameState.pieces[pieceId];
  if (!piece) return;
  
  const position = getWorldPosition(piece.row, piece.col, gameState.gridConfig.rows, gameState.gridConfig.cols);
  
  // Create different selection highlights for different piece types
  if (piece.type === 'HYBRID_QUEEN') {
    // Special dual-ring highlight for Hybrid Queen
    const outerRingGeometry = new THREE.RingGeometry(0.18, 0.23, 16);
    const outerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xf39c12, // Orange for Hybrid Queen
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.position.set(position.x, position.y, position.z);
    outerRing.lookAt(0, 0, 0);
    outerRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(outerRing);
    
    // Add inner ring with different color
    const innerRingGeometry = new THREE.RingGeometry(0.12, 0.17, 16);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700, // Gold inner ring
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.position.set(position.x, position.y, position.z);
    innerRing.lookAt(0, 0, 0);
    innerRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(innerRing);
  } else {
    // Standard selection highlight (yellow ring)
    const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    selectionRing.position.set(position.x, position.y, position.z);
    selectionRing.lookAt(0, 0, 0); // Face the center of the sphere
    selectionRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(selectionRing);
  }
}

function getCurrentlySelectedPieceId() {
  return selectedPieceId;
}



// Color utility functions now imported from colorUtils.js module

// Enhanced piece color function that prioritizes player identification
function getPieceColorForPlayer(piece, player, playerIndex) {
  // ✅ PHASE 4: Check if piece has inherited color from server (for split pieces)
  if (piece.inheritedColor && COLOR_MAP[piece.inheritedColor]) {
    const inheritedHexColor = COLOR_MAP[piece.inheritedColor];
    console.log(`🎨 PHASE 4 - SPLIT INHERITANCE SUCCESS: Split piece ${piece.id} using server-inherited color ${piece.inheritedColor} → 0x${inheritedHexColor.toString(16).toUpperCase()}`);
    return inheritedHexColor;
  }
  
  // Debug: Log if inheritedColor exists but not found in COLOR_MAP
  if (piece.inheritedColor && !COLOR_MAP[piece.inheritedColor]) {
    console.warn(`🚨 PHASE 4 - COLOR_MAP MISMATCH: Split piece ${piece.id} has inheritedColor '${piece.inheritedColor}' but it's not in COLOR_MAP:`, Object.keys(COLOR_MAP));
  }
  
  // Legacy fallback: Check if this is a split piece that needs to inherit color from existing meshes
  if (piece.id && piece.id.includes('-split-') && !piece.inheritedColor) {
    console.log(`🎨 SPLIT INHERITANCE: Legacy fallback for split piece ${piece.id} without server color info`);
    // For split pieces, find any existing piece with the same player that has a color we can inherit
    // Look for other pieces from the same player that might have evolved colors
    let parentColor = null;
    
    // Search through all existing pieces for the same player to find a color to inherit
    for (const existingPieceId in pieceMeshes) {
      const existingMesh = pieceMeshes[existingPieceId];
      if (existingMesh && existingMesh.userData && existingMesh.userData.piece) {
        const existingPiece = existingMesh.userData.piece;
        
        // If this is the same player and has the same type (SPLITTER), inherit its color
        if (existingPiece.playerId === piece.playerId && 
            existingPiece.type === piece.type &&
            existingPieceId !== piece.id) { // Don't inherit from self
          
          // Try to extract color from this mesh
          if (existingMesh.material) {
            if (Array.isArray(existingMesh.material)) {
              parentColor = existingMesh.material[0].color.clone();
            } else {
              parentColor = existingMesh.material.color.clone();
            }
          }
          
          // If no material on main mesh, check children
          if (!parentColor && existingMesh.children && existingMesh.children.length > 0) {
            for (const child of existingMesh.children) {
              if (child.material && child.material.color) {
                if (Array.isArray(child.material)) {
                  parentColor = child.material[0].color.clone();
                } else {
                  parentColor = child.material.color.clone();
                }
                break;
              }
            }
          }
          
          if (parentColor) {
            console.log(`🎨 SPLIT INHERITANCE: Split piece ${piece.id} inheriting color ${parentColor.getHexString()} from existing ${existingPiece.type} ${existingPieceId}`);
            return parentColor;
          }
        }
      }
    }
    
    console.log(`🎨 SPLIT INHERITANCE: Could not find suitable parent color for ${piece.id}, using fallback`);
  }
  
  // Use the player's selected color from the server
  const basePlayerColor = getPlayerColor(piece.playerId, playerIndex);
  
  console.log(`getPieceColorForPlayer: piece=${piece.type}, playerId=${piece.playerId}, baseColor=${basePlayerColor.toString(16)}`);
  
  // Return the exact player color without modification for consistency
  // This ensures all pieces for a player have the same color
  console.log(`Final color for ${piece.type}: ${basePlayerColor.toString(16)}`);
  
  return basePlayerColor;
}

// Handle right-click for evolution menu
function onRightClick(event) {
  console.log('🖱️ Right-click event triggered - onRightClick called');
  
  // ✅ PHASE 5: Store right-click position for context menu
  lastRightClickEvent = {
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY
  };
  
  // Calculate mouse position
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Test all clickable objects (pieces)
  const clickableObjects = [];
  Object.values(pieceMeshes).forEach(mesh => {
    clickableObjects.push(mesh);
    if (mesh.children && mesh.children.length > 0) {
      mesh.children.forEach(child => {
        if (child.type === 'Mesh' || child.type === 'Group') {
          clickableObjects.push(child);
          if (child.children && child.children.length > 0) {
            child.children.forEach(grandchild => {
              if (grandchild.type === 'Mesh') {
                clickableObjects.push(grandchild);
              }
            });
          }
        }
      });
    }
  });

  const intersects = raycaster.intersectObjects(clickableObjects, true);
  
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    
    // Find the piece mesh by traversing up the hierarchy
    while (clickedObject && !clickedObject.userData.piece) {
      clickedObject = clickedObject.parent;
    }
    
    if (clickedObject && clickedObject.userData.piece) {
      const piece = clickedObject.userData.piece;
      console.log(`🖱️ Right-clicked piece: ${piece.type} ${piece.symbol}`);
      
      // Check if this is our piece
      if (piece.playerId === socket.id) {
        console.log('🖱️ Requesting evolution choice for our piece');
        
        // Request evolution choice from server
        socket.emit('request-evolution-choice', {
          pieceId: piece.id
        });
        
        return true; // Click handled
      } else {
        console.log('🖱️ Cannot evolve opponent piece');
        showNotification('Evolution', 'Cannot evolve opponent pieces', 'error');
      }
    }
  }
  
  return false; // Click not handled
}

function onMouseClick(event) {
  console.log('🖱️ Click event triggered - onMouseClick called');
  
  // Check if this is a right-click
  const isRightClick = event.button === 2;
  
  let clickHandled = false;
  
  // For now, just allow all clicks - we can add drag detection later if needed
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // Get all potential clickable objects (pieces and valid move highlights)
  const clickableObjects = [];
  
  // Add piece meshes and their children (GLB models have geometry in children)
  Object.values(pieceMeshes).forEach(mesh => {
    clickableObjects.push(mesh);
    // Also add child meshes that contain the actual geometry
    if (mesh.children && mesh.children.length > 0) {
      mesh.children.forEach(child => {
        if (child.type === 'Mesh' || child.type === 'Group') {
          clickableObjects.push(child);
          // Add nested children if they exist (GLB can have nested structure)
          if (child.children && child.children.length > 0) {
            child.children.forEach(grandchild => {
              if (grandchild.type === 'Mesh') {
                clickableObjects.push(grandchild);
              }
            });
          }
        }
      });
    }
  });
  
  // Add valid move highlights
  let validMoveCount = 0;
  const validMoveHighlights = [];
  scene.children.forEach(child => {
    if (child.userData && child.userData.isValidMoveHighlight) {
      clickableObjects.push(child);
      validMoveHighlights.push(child);
      validMoveCount++;
      console.log('🟢 Found valid move highlight:', child.userData.move);
    }
  });
  
  console.log('🔍 Clickable objects setup:', {
    totalClickable: clickableObjects.length,
    pieceMeshes: Object.keys(pieceMeshes).length,
    validMoveHighlights: validMoveCount
  });
  
  const intersects = raycaster.intersectObjects(clickableObjects, true); // Include child objects
  
  console.log('🔍 Raycaster debug:', {
    mouseX: mouse.x,
    mouseY: mouse.y,
    intersectsLength: intersects.length,
    sceneChildrenCount: scene.children.length,
    pieceMeshesCount: Object.keys(pieceMeshes).length,
    clickableObjectsCount: clickableObjects.length,
    validMoveHighlightsCount: clickableObjects.filter(obj => obj.userData?.isValidMoveHighlight).length,
    cameraPosition: camera.position,
    rayDirection: raycaster.ray.direction
  });
  
  // Debug: Check the structure of the first few piece meshes
  console.log('🔍 Analyzing piece mesh structure:');
  const pieceKeys = Object.keys(pieceMeshes);
  for (let i = 0; i < Math.min(3, pieceKeys.length); i++) {
    const pieceKey = pieceKeys[i];
    const pieceMesh = pieceMeshes[pieceKey];
    console.log(`🔍 Piece ${pieceKey}:`, {
      type: pieceMesh.type,
      visible: pieceMesh.visible,
      children: pieceMesh.children.length,
      position: pieceMesh.position,
      userData: pieceMesh.userData,
      hasGeometry: pieceMesh.geometry !== undefined,
      hasMaterial: pieceMesh.material !== undefined
    });
    
    // Check children for actual meshes
    if (pieceMesh.children && pieceMesh.children.length > 0) {
      console.log(`🔍 ${pieceKey} children:`, pieceMesh.children.map(child => ({
        type: child.type,
        visible: child.visible,
        hasGeometry: child.geometry !== undefined,
        hasMaterial: child.material !== undefined,
        userData: child.userData
      })));
    }
  }
  
  // Debug: Try raycasting against all scene children to see if anything hits
  console.log('🔍 Testing raycaster against all scene children...');
  const allIntersects = raycaster.intersectObjects(scene.children, true);
  console.log('🔍 All intersects:', allIntersects.length);
  if (allIntersects.length > 0) {
    console.log('🔍 First all intersect:', {
      type: allIntersects[0].object.type,
      userData: allIntersects[0].object.userData,
      parent: allIntersects[0].object.parent?.userData
    });
  }
  
  // Log first few intersects for debugging
  if (intersects.length > 0) {
    console.log('🔍 First intersect:', {
      type: intersects[0].object.type,
      userData: intersects[0].object.userData,
      hasParent: !!intersects[0].object.parent,
      parentUserData: intersects[0].object.parent?.userData,
      isValidMoveHighlight: intersects[0].object.userData?.isValidMoveHighlight
    });
    
    // Log all intersects to see if move highlights are detected
    console.log('🔍 All intersects:', intersects.map(i => ({
      type: i.object.type,
      isValidMoveHighlight: i.object.userData?.isValidMoveHighlight,
      isPiece: !!i.object.userData?.piece
    })));
  }
  
  // If no intersects, let's check what's in the scene
  if (intersects.length === 0) {
    console.log('🔍 No intersects - looking for piece objects in scene...');
    console.log('🔍 Debug: Valid move highlights in scene:', 
      scene.children.filter(c => c.userData.isValidMoveHighlight).map(c => ({
        position: c.position,
        userData: c.userData
      }))
    );
    
    // Find all objects with piece userData
    const pieceObjects = scene.children.filter(child => child.userData?.piece);
    console.log('🔍 Found piece objects:', pieceObjects.length);
    
    if (pieceObjects.length > 0) {
      console.log('🔍 First piece object:', {
        type: pieceObjects[0].type,
        name: pieceObjects[0].name,
        visible: pieceObjects[0].visible,
        position: pieceObjects[0].position,
        userData: pieceObjects[0].userData,
        hasGeometry: !!pieceObjects[0].geometry,
        hasMaterial: !!pieceObjects[0].material,
        childrenCount: pieceObjects[0].children.length
      });
      
      // Check if this piece is in the pieceMeshes array
      const pieceId = pieceObjects[0].userData.pieceId;
      const isInPieceMeshes = pieceMeshes[pieceId] === pieceObjects[0];
      console.log('🔍 Is in pieceMeshes:', isInPieceMeshes, 'pieceId:', pieceId);
    }
  }
  
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    console.log('Clicked object:', clickedObject.userData, clickedObject.type);
    console.log('Has piece:', !!clickedObject.userData.piece);
    console.log('Has valid move highlight:', !!clickedObject.userData.isValidMoveHighlight);
    console.log('Full userData:', JSON.stringify(clickedObject.userData));
    
    // Check if this is a valid move highlight first (before traversing)
    if (clickedObject.userData.isValidMoveHighlight) {
      console.log('✅ Direct hit on valid move highlight!');
    } else {
      // For GLB models, we might need to traverse up to find the piece mesh
      while (clickedObject && !clickedObject.userData.piece && !clickedObject.userData.isValidMoveHighlight) {
        clickedObject = clickedObject.parent;
      }
    }
    
    console.log('Found piece object:', clickedObject ? clickedObject.userData : 'none');
    
    // Additional check - make sure we're not missing the valid move highlight
    if (clickedObject && !clickedObject.userData.piece && !clickedObject.userData.isValidMoveHighlight) {
      console.log('⚠️ Clicked object has no piece or valid move data - checking original:', intersects[0].object.userData);
    }
    
    // Check if clicked on a piece
    if (clickedObject && clickedObject.userData.piece) {
      const piece = clickedObject.userData.piece;
      console.log('Clicked piece:', piece.symbol, piece.type);
      
      // Check if this piece belongs to the current player
      const currentPlayer = Object.values(gameState.players).find(p => p.id === window.globalSocket.id);
      console.log('Socket ID:', window.globalSocket.id);
      console.log('Current player:', currentPlayer);
      console.log('Piece player ID:', piece.playerId);
      console.log('Player ID match:', currentPlayer && piece.playerId === currentPlayer.id);
      
      // More robust ownership check - also check if piece belongs to socket ID directly
      const isOwnPiece = (currentPlayer && piece.playerId === currentPlayer.id) || 
                        (piece.playerId === window.globalSocket.id);
      
      if (isOwnPiece) {
        clickHandled = true;
        if (isRightClick) {
          // Right-click: Request evolution options
          window.globalSocket.emit('request-evolution-choice', { pieceId: piece.id });
        } else {
          // Left-click: Select piece and show moves
          selectedPieceId = piece.id;
          highlightSelectedPiece(piece.id);
          
          // Request valid moves for this piece
          window.globalSocket.emit('get-valid-moves', { pieceId: piece.id });
          
          // Update UI
          gameInfoEl.textContent = `Selected: ${piece.symbol} ${piece.type}`;
        }
      } else {
        console.log('Cannot select opponent piece');
        gameInfoEl.textContent = 'Cannot select opponent piece';
      }
    }
    
    // Check if clicked on a valid move highlight
    else if (clickedObject && clickedObject.userData.isValidMoveHighlight) {
      console.log('🎯 Valid move highlight clicked!');
      clickHandled = true;
      const move = clickedObject.userData.move;
      console.log('Clicked valid move:', move);
      console.log('Move data:', move.row, move.col, move.type);
      
      // Find the currently selected piece by checking which piece has valid moves displayed
      const currentSelectedPieceId = getCurrentlySelectedPieceId();
      console.log('🔍 MOVE TYPE DEBUG:', move.type, 'for piece:', currentSelectedPieceId);
      console.log('🎯 Current selected piece ID:', currentSelectedPieceId);
      
      if (currentSelectedPieceId) {
        // For splitters, we handle split and move actions directly based on the move type
        // No dialog needed since different visual indicators are used
        
        // Check if this is a dual movement piece and requires mode selection
        const selectedPiece = gameState.pieces[currentSelectedPieceId];
        const isDualMovement = selectedPiece && selectedPiece.type === 'HYBRID_QUEEN';
        
        if (isDualMovement && (move.type === 'dual-move-queen' || move.type === 'dual-move-jumper')) {
          // For dual movement, validate that the mode matches the selected movement mode
          if (!selectedMovementMode) {
            gameInfoEl.textContent = `Select movement mode first!`;
            gameInfoEl.style.color = '#ff6b6b';
            setTimeout(() => {
              gameInfoEl.style.color = '#ffffff';
            }, 2000);
            return;
          }
          
          const expectedMoveType = selectedMovementMode === 'queen' ? 'dual-move-queen' : 'dual-move-jumper';
          if (move.type !== expectedMoveType) {
            gameInfoEl.textContent = `Move doesn't match selected mode!`;
            gameInfoEl.style.color = '#ff6b6b';
            setTimeout(() => {
              gameInfoEl.style.color = '#ffffff';
            }, 2000);
            return;
          }
        }
        if (move.type === 'split') {
          // Send split command to server
          console.log(`🔄 SPLIT MOVE DETECTED - Sending split-piece event for ${currentSelectedPieceId} to (${move.row}, ${move.col})`);
          window.globalSocket.emit('split-piece', {
            pieceId: currentSelectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          // Update UI
          gameInfoEl.textContent = `Splitting piece...`;
          console.log(`Splitting piece ${currentSelectedPieceId} to (${move.row}, ${move.col})`);

        } else {
          // Send regular move command to server
          console.log('🚀 MOVE DEBUG - Sending move command:');
          console.log('  pieceId:', currentSelectedPieceId);
          console.log('  targetRow:', move.row, 'targetCol:', move.col);
          console.log('  Current piece position:', gameState.pieces[currentSelectedPieceId]?.mesh?.position);
          
          window.globalSocket.emit('move-piece', {
            pieceId: currentSelectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          // Update UI
          gameInfoEl.textContent = `Moving piece...`;
          console.log(`Moving piece ${currentSelectedPieceId} to (${move.row}, ${move.col})`);
        }
        
        // Clear highlights after action
        clearValidMoveHighlights();
        hideDualMovementUI();
        selectedPieceId = null;
      }
    }
    
    // Check if clicked on globe (empty space)
    else if (clickedObject === globe) {
      // Clear selection when clicking on empty space
      selectedPieceId = null;
      clearValidMoveHighlights();
      hideDualMovementUI();
      gameInfoEl.textContent = 'Click on your pieces to select them';
    }
  } else {
    // Clicked on empty space - clear selection
    selectedPieceId = null;
    clearValidMoveHighlights();
    hideDualMovementUI();
    gameInfoEl.textContent = 'Click on your pieces to select them';
  }
  
  return clickHandled;
}

// Event listener setup function - called during game initialization
function setupMouseInteraction() {
  console.log('🖱️ Setting up clean event handlers...');
  
  // Use a single click event with capture phase to get priority over OrbitControls
  renderer.domElement.addEventListener('click', (event) => {
    console.log('🖱️ Click event captured!');
    
    // Process the click and check if it was handled by piece selection
    const clickHandled = onMouseClick(event);
    
    // If we handled a piece/move click, prevent OrbitControls from processing it
    if (clickHandled) {
      console.log('🖱️ Click handled by piece selection - preventing camera movement');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true); // Use capture phase to run before OrbitControls
  
  // Add right-click for evolution menu
  renderer.domElement.addEventListener('contextmenu', (event) => {
    console.log('🖱️ Right-click event captured!');
    event.preventDefault(); // Prevent context menu
    
    const clickHandled = onRightClick(event);
    if (clickHandled) {
      console.log('🖱️ Right-click handled by evolution menu');
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
  
  // Add mouse tracking for drag detection (simplified)
  let isMouseDown = false;
  // mouseDownTime moved to global scope
  
  renderer.domElement.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseDownTime = Date.now();
    handleMouseDown(e);
  }, false);
  
  renderer.domElement.addEventListener('mousemove', (e) => {
    handleMouseMove(e);
  }, false);
  
  renderer.domElement.addEventListener('mouseup', (e) => {
    isMouseDown = false;
    handleMouseUp(e);
  }, false);
  
  renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent context menu on right-click
  }, false);
  
  console.log('🖱️ Pointer event listeners attached to canvas');
}

// Touch event handling for mobile
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

function onTouchStart(e) {
  e.preventDefault();
  touchStartTime = Date.now();
  const touch = e.touches[0];
  
  touchStartPos.x = touch.clientX;
  touchStartPos.y = touch.clientY;
}

function onTouchEnd(e) {
  e.preventDefault();
  const touchDuration = Date.now() - touchStartTime;
  const touch = e.changedTouches[0];
  const touchEndPos = { x: touch.clientX, y: touch.clientY };
  
  // Calculate distance moved
  const deltaX = touchEndPos.x - touchStartPos.x;
  const deltaY = touchEndPos.y - touchStartPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // If touch was brief and didn't move much, treat as tap
  if (touchDuration < 300 && distance < 20) {
    onMouseClick({ clientX: touchEndPos.x, clientY: touchEndPos.y });
  }
}

// Add touch event listeners to canvas with capture phase
renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add keyboard controls for debug features
// modeIndicator moved to global scope

// Hide mode indicator since we no longer need mode switching
if (modeIndicator) {
  modeIndicator.style.display = 'none';
}

window.addEventListener('keydown', (e) => {
  
  // Add debug key to force piece click detection
  if (e.key === 'd' || e.key === 'D') {
    console.log('🔍 Debug: Force checking for pieces under mouse');
    const event = new MouseEvent('click', {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2
    });
    onMouseClick(event);
  }
  
  // Debug key to convert selected pawn to splitter
  if (e.key === 't' || e.key === 'T') {
    if (selectedPieceId && gameState.pieces[selectedPieceId]) {
      const piece = gameState.pieces[selectedPieceId];
      if (piece.type === 'PAWN') {
        console.log('🔧 DEBUG: Converting PAWN to SPLITTER for testing');
        // Send evolution command directly
        window.globalSocket.emit('debug-evolve-piece', {
          pieceId: selectedPieceId,
          newType: 'SPLITTER'
        });
        showNotification('Debug', 'Converting PAWN to SPLITTER for testing', 'info');
      } else {
        showNotification('Debug', 'Select a PAWN first to convert to SPLITTER', 'warning');
      }
    } else {
      showNotification('Debug', 'No piece selected - select a PAWN first', 'warning');
    }
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update frame counter for performance monitoring
  performanceOptimizer.frameCount++;
  
  if (controls) {
    controls.update();
  }
  
  // Rotate globe slowly
  globe.rotation.y += 0.001;
  
  // Animate equator squares with pulsing effect
  const time = Date.now() * 0.002;
  gridSquares.forEach(square => {
    if (square.userData.isEquatorSquare) {
      // Pulsing opacity effect for equator squares
      square.material.opacity = square.userData.originalOpacity + Math.sin(time) * 0.2;
    }
  });
  
  renderer.render(scene, camera);
}

// Add event listeners for dual movement mode selection
document.getElementById('queen-mode-btn').addEventListener('click', () => {
  selectMovementMode('queen');
});

document.getElementById('jumper-mode-btn').addEventListener('click', () => {
  selectMovementMode('jumper');
});

// Tournament UI event listeners
document.getElementById('create-tournament-btn').addEventListener('click', () => {
  showTournamentCreation();
});

document.getElementById('join-tournament-btn').addEventListener('click', () => {
  showTournamentList();
});

document.getElementById('create-tournament-confirm').addEventListener('click', () => {
  createTournament();
});

document.getElementById('create-tournament-cancel').addEventListener('click', () => {
  hideTournamentCreation();
});

// Lobby system functionality
let currentLobby = null;
let isInLobby = false;

// Lobby event handlers
document.getElementById('lobby-toggle').addEventListener('click', () => {
  const lobbyUI = document.getElementById('lobby-ui');
  if (lobbyUI.style.display === 'none') {
            showLobbyUI({ socket });
  } else {
    hideLobbyUI();
  }
});

document.getElementById('create-lobby-btn').addEventListener('click', () => {
  showLobbyCreation();
});

document.getElementById('create-lobby-confirm').addEventListener('click', () => {
  createLobby({ socket });
});

document.getElementById('create-lobby-cancel').addEventListener('click', () => {
  hideLobbyCreation();
});

document.getElementById('refresh-lobbies-btn').addEventListener('click', () => {
  refreshLobbies({ socket });
});

document.getElementById('leave-lobby-btn').addEventListener('click', () => {
  leaveLobby();
});

document.getElementById('ready-toggle-btn').addEventListener('click', () => {
  toggleReady();
});

// Evolution system functionality
let currentEvolutionChoice = null;
let evolutionTimer = null;
let playerEvolutionBank = { points: 0, totalEarned: 0 };
// ✅ PHASE 6 BUG FIX: lastRightClickEvent now declared at top of file

// Evolution event handlers
document.getElementById('evolution-toggle').addEventListener('click', () => {
  const evolutionUI = document.getElementById('evolution-ui');
  if (evolutionUI.style.display === 'none') {
    showEvolutionUI();
  } else {
    hideEvolutionUI();
  }
});

document.getElementById('refresh-evolution-bank').addEventListener('click', () => {
  refreshEvolutionBank();
});

document.getElementById('show-evolution-help').addEventListener('click', () => {
  const helpDiv = document.getElementById('evolution-help');
  if (helpDiv.style.display === 'none') {
    helpDiv.style.display = 'block';
  } else {
    helpDiv.style.display = 'none';
  }
});

document.getElementById('cancel-evolution').addEventListener('click', () => {
  if (currentEvolutionChoice) {
    socket.emit('cancel-evolution-choice', { pieceId: currentEvolutionChoice.pieceId });
  }
});

// Statistics system functionality
let playerStats = null;
let currentLeaderboard = [];
let playerAchievements = [];
let globalStats = null;

// Statistics event handlers
document.getElementById('stats-toggle').addEventListener('click', () => {
  const statsUI = document.getElementById('stats-ui');
  if (statsUI.style.display === 'none') {
    showStatisticsUI();
  } else {
    hideStatisticsUI();
  }
});

document.getElementById('show-personal-stats').addEventListener('click', () => {
  showPersonalStats();
});

document.getElementById('show-leaderboard').addEventListener('click', () => {
  showLeaderboard();
});

document.getElementById('show-achievements').addEventListener('click', () => {
  showAchievements();
});

document.getElementById('show-global-stats').addEventListener('click', () => {
  showGlobalStats();
});

document.getElementById('refresh-leaderboard').addEventListener('click', () => {
  refreshLeaderboard();
});

document.getElementById('leaderboard-category').addEventListener('change', () => {
  refreshLeaderboard();
});

document.getElementById('tournament-toggle').addEventListener('click', () => {
  const tournamentUI = document.getElementById('tournament-ui');
  if (tournamentUI.style.display === 'none') {
    showTournamentUI();
  } else {
    hideTournamentUI();
  }
});

// Spectator mode functionality
let isSpectating = false;
let spectatorCount = 0;
let currentReplay = null;
let replayPlaying = false;
let replaySpeed = 1;
let replayCurrentMove = 0;

// Spectator event handlers
document.getElementById('spectator-toggle').addEventListener('click', () => {
  const spectatorUI = document.getElementById('spectator-ui');
  if (spectatorUI.style.display === 'none') {
    showSpectatorUI();
  } else {
    hideSpectatorUI();
  }
});

document.getElementById('join-spectator-btn').addEventListener('click', () => {
  joinSpectator();
});

document.getElementById('leave-spectator-btn').addEventListener('click', () => {
  leaveSpectator();
});

// Replay event handlers
document.getElementById('replay-toggle').addEventListener('click', () => {
  const replayUI = document.getElementById('replay-ui');
  if (replayUI.style.display === 'none') {
    showReplayUI();
  } else {
    hideReplayUI();
  }
});

document.getElementById('refresh-replays-btn').addEventListener('click', () => {
  socket.emit('get-replays');
});

document.getElementById('stop-replay-btn').addEventListener('click', () => {
  stopReplay();
});

document.getElementById('replay-play-pause').addEventListener('click', () => {
  toggleReplayPlayback();
});

document.getElementById('replay-step-back').addEventListener('click', () => {
  stepReplayBackward();
});

document.getElementById('replay-step-forward').addEventListener('click', () => {
  stepReplayForward();
});

document.getElementById('replay-speed').addEventListener('change', (e) => {
  replaySpeed = parseFloat(e.target.value);
});

document.getElementById('replay-timeline').addEventListener('input', (e) => {
  seekReplayToPosition(parseFloat(e.target.value));
});

// Spectator functions
function showSpectatorUI() {
  document.getElementById('spectator-ui').style.display = 'block';
  document.getElementById('tournament-ui').style.display = 'none';
  document.getElementById('replay-ui').style.display = 'none';
  socket.emit('get-spectatable-games');
}

function hideSpectatorUI() {
  document.getElementById('spectator-ui').style.display = 'none';
  if (isSpectating) {
    leaveSpectator();
  }
}

function joinSpectator() {
  socket.emit('join-spectator', { gameId: 'main' });
}

function leaveSpectator() {
  socket.emit('leave-spectator', { gameId: 'main' });
}

// Replay functions
function showReplayUI() {
  document.getElementById('replay-ui').style.display = 'block';
  document.getElementById('tournament-ui').style.display = 'none';
  document.getElementById('spectator-ui').style.display = 'none';
  socket.emit('get-replays');
}

function hideReplayUI() {
  document.getElementById('replay-ui').style.display = 'none';
  if (currentReplay) {
    stopReplay();
  }
}

function playReplay(gameId) {
  socket.emit('get-replay', { gameId });
}

function stopReplay() {
  currentReplay = null;
  replayPlaying = false;
  replayCurrentMove = 0;
  document.getElementById('replay-controls').style.display = 'none';
  document.getElementById('stop-replay-btn').style.display = 'none';
  updateReplayUI();
}

function toggleReplayPlayback() {
  if (!currentReplay) return;
  
  replayPlaying = !replayPlaying;
  document.getElementById('replay-play-pause').textContent = replayPlaying ? '⏸️' : '▶️';
  
  if (replayPlaying) {
    playReplayStep();
  }
}

function playReplayStep() {
  if (!replayPlaying || !currentReplay) return;
  
  if (replayCurrentMove < currentReplay.moves.length) {
    replayCurrentMove++;
    socket.emit('replay-seek', { 
      gameId: currentReplay.gameId, 
      moveIndex: replayCurrentMove - 1 
    });
    
    setTimeout(() => {
      playReplayStep();
    }, 1000 / replaySpeed);
  } else {
    replayPlaying = false;
    document.getElementById('replay-play-pause').textContent = '▶️';
  }
}

function stepReplayBackward() {
  if (!currentReplay || replayCurrentMove <= 0) return;
  
  replayCurrentMove--;
  socket.emit('replay-seek', { 
    gameId: currentReplay.gameId, 
    moveIndex: replayCurrentMove - 1 
  });
}

function stepReplayForward() {
  if (!currentReplay || replayCurrentMove >= currentReplay.moves.length) return;
  
  replayCurrentMove++;
  socket.emit('replay-seek', { 
    gameId: currentReplay.gameId, 
    moveIndex: replayCurrentMove - 1 
  });
}

function seekReplayToPosition(position) {
  if (!currentReplay) return;
  
  const targetMove = Math.floor((position / 100) * currentReplay.moves.length);
  replayCurrentMove = targetMove;
  socket.emit('replay-seek', { 
    gameId: currentReplay.gameId, 
    moveIndex: targetMove - 1 
  });
}

function updateReplayUI() {
  if (!currentReplay) return;
  
  document.getElementById('replay-current-move').textContent = replayCurrentMove;
  document.getElementById('replay-total-moves').textContent = currentReplay.moves.length;
  
  const currentTime = currentReplay.moves[replayCurrentMove - 1]?.timestamp || 0;
  const totalTime = currentReplay.duration || 0;
  
  document.getElementById('replay-current-time').textContent = formatTime(currentTime);
  document.getElementById('replay-total-time').textContent = formatTime(totalTime);
  
  document.getElementById('replay-timeline').value = (replayCurrentMove / currentReplay.moves.length) * 100;
  
  document.getElementById('replay-game-id').textContent = currentReplay.gameId;
  document.getElementById('replay-players').textContent = currentReplay.players.join(', ');
  document.getElementById('replay-duration').textContent = formatTime(totalTime);
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Socket event handlers for spectator mode







function updateSpectatorGamesList(games) {
  const gamesList = document.getElementById('spectator-games-list');
  if (games.length === 0) {
    gamesList.innerHTML = '<div style="color: #888; font-size: 12px;">No games available to spectate</div>';
    return;
  }
  
  gamesList.innerHTML = games.map(game => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="joinSpectatorGame('${game.gameId}')">
      <div style="font-weight: bold;">Game: ${game.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">Spectators: ${game.spectatorCount}</div>
    </div>
  `).join('');
}

function updateReplaysList(replays) {
  const replaysList = document.getElementById('replay-list');
  if (replays.length === 0) {
    replaysList.innerHTML = '<div style="color: #888; font-size: 12px;">No replays available</div>';
    return;
  }
  
  replaysList.innerHTML = replays.map(replay => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="playReplay('${replay.gameId}')">
      <div style="font-weight: bold;">Game: ${replay.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">
        Players: ${replay.players.join(', ')} | Duration: ${formatTime(replay.duration)} | Moves: ${replay.moveCount}
      </div>
      <div style="font-size: 10px; color: #888;">
        Played: ${new Date(replay.metadata.created).toLocaleString()}
      </div>
    </div>
  `).join('');
}

function joinSpectatorGame(gameId) {
  socket.emit('join-spectator', { gameId });
}

function updateGameVisualization(gameState, moves) {
  // Update the 3D visualization with replay data
  // This would integrate with the existing game state update logic
  console.log('Updating game visualization with replay state:', gameState, moves);
}

// AI opponent functionality
let currentAIPlayers = [];
let aiStats = {};

// AI event handlers
document.getElementById('ai-toggle').addEventListener('click', () => {
  const aiUI = document.getElementById('ai-ui');
  if (aiUI.style.display === 'none') {
    showAIUI();
  } else {
    hideAIUI();
  }
});

document.getElementById('add-ai-btn').addEventListener('click', () => {
  addAIPlayer();
});

document.getElementById('remove-all-ai-btn').addEventListener('click', () => {
  removeAllAI();
});

// Quit game button
document.getElementById('quit-game').addEventListener('click', () => {
  quitGame();
});

// AI functions
function showAIUI() {
  document.getElementById('ai-ui').style.display = 'block';
  document.getElementById('tournament-ui').style.display = 'none';
  document.getElementById('spectator-ui').style.display = 'none';
  document.getElementById('replay-ui').style.display = 'none';
  socket.emit('get-ai-difficulties');
}

function hideAIUI() {
  document.getElementById('ai-ui').style.display = 'none';
}

// addAIPlayer function now imported from gameInitialization.js module

// removeAllAI function now imported from gameInitialization.js module

// quitGame function now imported from gameInitialization.js module

function getAIPersonality(personalityType) {
  const personalities = {
    balanced: {
      preferredPieces: ['QUEEN', 'ROOK', 'BISHOP'],
      playStyle: 'balanced',
      riskTolerance: 0.5,
      aggressiveness: 0.5
    },
    aggressive: {
      preferredPieces: ['QUEEN', 'KNIGHT', 'JUMPER'],
      playStyle: 'aggressive',
      riskTolerance: 0.8,
      aggressiveness: 0.8
    },
    defensive: {
      preferredPieces: ['ROOK', 'BISHOP', 'KING'],
      playStyle: 'defensive',
      riskTolerance: 0.2,
      aggressiveness: 0.2
    },
    evolution: {
      preferredPieces: ['PAWN', 'SPLITTER', 'JUMPER'],
      playStyle: 'evolution',
      riskTolerance: 0.6,
      aggressiveness: 0.4
    }
  };
  
  return personalities[personalityType] || personalities.balanced;
}

function updateAIPlayersList() {
  const aiList = document.getElementById('ai-players-list');
  
  if (currentAIPlayers.length === 0) {
    aiList.innerHTML = '<div style="color: #888; font-size: 12px;">No AI players active</div>';
    return;
  }
  
  aiList.innerHTML = currentAIPlayers.map(aiPlayer => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: bold; color: ${aiPlayer.color};">🤖 ${aiPlayer.name}</div>
        <div style="font-size: 11px; color: #ccc;">${aiPlayer.aiDifficulty} | ${aiPlayer.pieces.length} pieces</div>
      </div>
      <div style="display: flex; gap: 5px;">
        <button onclick="showAIStats('${aiPlayer.id}')" style="padding: 2px 5px; background: #555; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Stats</button>
        <button onclick="removeAIPlayer('${aiPlayer.id}')" style="padding: 2px 5px; background: #cc0000; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Remove</button>
      </div>
    </div>
  `).join('');
}

function removeAIPlayer(aiPlayerId) {
  socket.emit('remove-ai-player', { aiPlayerId });
}

function showAIStats(aiPlayerId) {
  socket.emit('get-ai-stats', { aiPlayerId });
  document.getElementById('ai-stats').style.display = 'block';
}

function updateAIStats(aiPlayerId, stats) {
  if (stats) {
    document.getElementById('ai-moves-played').textContent = stats.movesPlayed;
    document.getElementById('ai-battles-won').textContent = stats.battlesWon;
    document.getElementById('ai-battles-lost').textContent = stats.battlesLost;
    document.getElementById('ai-pieces-evolved').textContent = stats.piecesEvolved;
    document.getElementById('ai-avg-think-time').textContent = Math.round(stats.averageThinkTime) + 'ms';
  }
}

// Socket event handlers for AI







// Update currentAIPlayers when game state changes

// Lobby system socket handlers











// === NEW GAME MODE EVENT HANDLERS ===
















// Statistics system socket handlers


// Delta update handlers for better performance







// Evolution system socket handlers

// Evolution choice handlers moved to setupSocketListeners() function

// Chat system variables
let chatVisible = true;
let chatMessages = [];

// Chat system functions
function initializeChatSystem() {
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-chat');
  const toggleButton = document.getElementById('toggle-chat');
  
  // Send message on Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  // Send message on button click
  sendButton.addEventListener('click', sendChatMessage);
  
  // Toggle chat visibility
  toggleButton.addEventListener('click', toggleChat);
  
  // Add keyboard shortcut to cancel queued moves
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Cancel queued move
      socket.emit('cancel-queued-move');
    }
  });
  
  console.log('Chat system initialized');
}

function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (message.length === 0) return;
  if (message.length > 200) {
    showNotification('Chat Error', 'Message too long (max 200 characters)', 'error');
    return;
  }
  
  socket.emit('send-chat-message', {
    roomId: 'main',
    message: message
  });
  
  chatInput.value = '';
}

function toggleChat() {
  const chatUI = document.getElementById('chat-ui');
  const toggleButton = document.getElementById('toggle-chat');
  
  if (chatVisible) {
    chatUI.style.height = '40px';
    chatUI.style.overflow = 'hidden';
    toggleButton.textContent = 'Show';
    chatVisible = false;
  } else {
    chatUI.style.height = '300px';
    chatUI.style.overflow = 'visible';
    toggleButton.textContent = 'Hide';
    chatVisible = true;
  }
}

function addChatMessage(messageData) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  
  const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
  const messageStyle = getChatMessageStyle(messageData.type);
  
  messageElement.innerHTML = `
    <div style="margin-bottom: 4px; ${messageStyle}">
      <span style="color: #888; font-size: 10px;">[${timestamp}]</span>
      <span style="color: ${getPlayerColor(messageData.playerId)}; font-weight: bold;">${messageData.playerName}:</span>
      <span style="color: #fff;">${messageData.message}</span>
    </div>
  `;
  
  messagesContainer.appendChild(messageElement);
  
  // Auto-scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Remove placeholder message if it exists
  const placeholder = messagesContainer.querySelector('[style*="font-style: italic"]');
  if (placeholder) {
    placeholder.remove();
  }
  
  // Keep only last 50 messages
  while (messagesContainer.children.length > 50) {
    messagesContainer.removeChild(messagesContainer.firstChild);
  }
}

function getChatMessageStyle(messageType) {
  const styles = {
    'chat': '',
    'system': 'color: #ffff00; font-style: italic;',
    'game_event': 'color: #00cc88; font-style: italic;',
    'player_joined': 'color: #00ff00; font-style: italic;',
    'player_left': 'color: #ff8800; font-style: italic;'
  };
  
  return styles[messageType] || '';
}

// Removed duplicate getPlayerColor function - using the one that supports color selection system

function updateChatStatus(status) {
  const chatStatus = document.getElementById('chat-status');
  chatStatus.textContent = status;
}

// Timer system socket handlers







// Real-time system handlers








// Chat system socket handlers











// Initialize chat system when page loads
window.addEventListener('load', () => {
  initializeChatSystem();
  
  // Add AI player button handler - removed duplicate listener
  // The button handler is already set up in the addAIPlayer function above
});

// Start animation
animate();

console.log('EvoChess client fully initialized');
console.log('Click on pieces to see valid moves');
console.log('🎮 Simplified controls: Click pieces to select, drag to rotate camera');

// Show initial help message
setTimeout(() => {
  showNotification('Controls', 
    'Click on your pieces to select them and see valid moves. Drag anywhere else to rotate the camera.',
    'info'
  );
  gameInfoEl.textContent = 'Click on your pieces to select them';
}, 2000); 

// ✅ PHASE 3: Auto-Color Assignment System
// Colors are now assigned automatically based on player index - no manual selection needed
console.log('🎨 Auto-color assignment system active - colors assigned by player index');

// AI player event handlers


// ✅ PHASE 3: Auto-Color Assignment - Display current player's color
function updatePlayerColorDisplay() {
  const colorDisplayEl = document.getElementById('player-color-display');
  if (!colorDisplayEl) return;
  
  const myPlayer = gameState.players[socket.id];
  if (myPlayer) {
    const playerColor = getPlayerColor(myPlayer.id, myPlayer.index);
    const colorHex = '#' + playerColor.toString(16).padStart(6, '0');
    
    colorDisplayEl.textContent = `Player ${myPlayer.index + 1} Color`;
    colorDisplayEl.style.color = colorHex;
    colorDisplayEl.style.fontWeight = 'bold';
  } else {
    colorDisplayEl.textContent = 'Auto-assigned on join';
    colorDisplayEl.style.color = '#888';
  }
}

// Auto-update color display when game state changes
