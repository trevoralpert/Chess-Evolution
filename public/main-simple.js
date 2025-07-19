console.log('🚀 Starting main-simple.js v15 - ADDING GLTF LOADER 🚀');

// Import modular components
import { PerformanceOptimizer } from './modules/PerformanceOptimizer.js';
import { gridToSpherical, sphericalToCartesian, getWorldPosition } from './modules/GridUtils.js';
import { 
  COLOR_MAP, 
  getColorFromString, 
  getPlayerColor, 
  getPieceColorForPlayer, 
  applyColorToMesh, 
  updatePlayerColorIndicators,
  initializeColorSelection,
  updateColorSelector,
  updateSelectedColorDisplay,
  setupColorSocketHandlers,
  getSelectedColor,
  setSelectedColor,
  getAvailableColors,
  setAvailableColors
} from './modules/ColorManager.js';
import {
  startTimer,
  pauseTimer,
  resumeTimer,
  updateTimerDisplay,
  updateActivePlayer,
  updateTurnQueue,
  startRealTimeTimer,
  updateTimerDisplayWithValue,
  updateTimerUI,
  startEvolutionTimer,
  clearEvolutionTimer,
  clearAllTimers,
  setupTimerSocketHandlers,
  getCurrentTimer,
  getActivePlayerId,
  getTimerState,
  isTimerActive,
  isEvolutionTimerActive
} from './modules/TimerManager.js';
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  onRightClick,
  onMouseClick,
  onTouchStart,
  onTouchEnd,
  setupMouseInteraction,
  getMouseState,
  getTouchState,
  resetMouseState,
  isCurrentlyDragging,
  mouse,
  raycaster
} from './modules/MouseInteractionManager.js';
import {
  showNotification,
  showTypedNotification,
  showCornerNotification,
  showAINotification,
  showAIPlayerAddedNotification,
  showBattleNotification,
  showTurnNotification,
  showEvolutionNotification,
  showEliminationNotification,
  showVictoryNotification,
  showGameEventNotification,
  clearAllNotifications,
  addNotificationStyles
} from './modules/NotificationManager.js';
import {
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
} from './modules/MenuManager.js';
import {
  updateUI,
  updatePlayerNameDisplay,
  updateSelectedColorDisplay as updateUISelectedColorDisplay,
  updateLobbyList,
  updateAIPlayersList,
  updateSpectatorGamesList,
  updateReplaysList,
  updateReplayUI,
  updateStatsButtonStyles,
  updateSpectatorUI,
  toggleUISection,
  updateGameVisualization,
  formatTime,
  updatePlayerList,
  updateGameBoardInfo,
  updateScoreboard,
  updateErrorDisplay,
  updateLoadingDisplay
} from './modules/UIManager.js';
import {
  TransitionManager,
  VisualEffectsManager,
  fadeIn,
  fadeOut,
  slideIn
} from './modules/VisualEffectsManager.js';
import {
  getEvolutionPointsForPiece,
  createEvolutionPointsLabel,
  updateAllEvolutionPointLabels,
  updateEvolutionPointsLabel,
  showEvolutionUI,
  hideEvolutionUI,
  refreshEvolutionBank,
  updateEvolutionBank,
  showEvolutionChoice,
  hideEvolutionChoice,
  handleEvolutionCompleted,
  showEvolutionChoiceDialog,
  chooseEvolution,
  bankEvolutionPoints,
  closeEvolutionChoiceDialog,
  setupEvolutionSocketHandlers,
  getCurrentEvolutionChoice,
  getPlayerEvolutionBank,
  setPlayerEvolutionBank
} from './modules/EvolutionManager.js';
import {
  setupSocketListeners,
  setupTournamentSocketHandlers,
  setupBattleSocketHandlers,
  setupSpectatorSocketHandlers,
  setupLobbySocketHandlers,
  setupAllSocketHandlers
} from './modules/SocketEventManager.js';

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

function startGameInitialization() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAfterDOM);
  } else {
    initializeAfterDOM();
  }
}
// Menu system functions now imported from MenuManager module



  // Set up all socket event listeners
  setupAllSocketHandlers(socket);
  
  // Set up color management socket handlers
  setupColorSocketHandlers(socket);
  
  // Set up timer management socket handlers
  setupTimerSocketHandlers(socket);
  
  // Set up evolution socket handlers
  setupEvolutionSocketHandlers(socket);
}

// Return to menu
// returnToMenu function now imported from MenuManager module

// showGameOver function now imported from MenuManager module

// Menu system initialization now handled in MenuManager module

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
    visualEffects = new VisualEffectsManager(scene, renderer);
    console.log('✨ Visual effects initialized');
  } else if (visualEffects) {
    console.log('✨ Visual effects already initialized');
  }
  
  // Set up mouse interaction for piece selection and movement
  setupMouseInteraction();
  
  console.log('✅ Game components initialized successfully');
}

// setupSocketListeners function now imported from SocketEventManager module
  });
}

// Grid utility functions - Now imported from ./modules/GridUtils.js

// Socket.io connection - will be initialized when game starts
let socket = null;
console.log('Socket.io will be initialized when game starts');

// Make socket globally accessible for evolution dialog functions
window.globalSocket = null;

// Timer management variables now imported from TimerManager module

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a);
document.body.appendChild(renderer.domElement);

// Mouse interaction setup - Now imported from MouseInteractionManager module

// UI elements that need to be available globally
const modeIndicator = document.getElementById('mode-indicator');

// Mouse state tracking - Now managed in MouseInteractionManager module

// Movement mode tracking - MOVED HERE TO FIX INITIALIZATION ORDER
let selectedMovementMode = null;

console.log('Three.js scene initialized successfully');

// Performance Optimization System - Now imported from module
// Removed class definition - now imported from ./modules/PerformanceOptimizer.js
// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Mouse interaction tracking - Now managed in MouseInteractionManager module

// Mouse event handlers now imported from MouseInteractionManager module

// Timer management functions now imported from TimerManager module

// Real-time timer functions now imported from TimerManager module

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
      if (isCurrentlyDragging() && getMouseState().mouseDownTime > 0) {
        const mouseState = getMouseState();
        const deltaX = e.clientX - mouseState.mouseStartPos.x;
        const deltaY = e.clientY - mouseState.mouseStartPos.y;
        
        this.cameraAngleX += deltaX * 0.01;
        this.cameraAngleY += deltaY * 0.01;
        
        // Enable unrestricted 3D rotation - remove polar angle restrictions
        // this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));
        
        this.updateCameraPosition();
        
        // Note: mouseStartPos update is now handled in the MouseInteractionManager
        // mouseStartPos.x = e.clientX;
        // mouseStartPos.y = e.clientY;
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
const globeRadius = 5;
const sphereGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
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
    const northCapGeometry = new THREE.CircleGeometry(globeRadius * 0.08, 32); // Smaller radius
    const northCapMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x4169E1, // Blue
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const northCap = new THREE.Mesh(northCapGeometry, northCapMaterial);
    northCap.position.set(0, globeRadius + 0.05, 0); // Much lower so pieces sit well above
    northCap.rotation.x = -Math.PI / 2;
    northCap.userData = { isPole: true, poleType: 'north' };
    scene.add(northCap);
    gridSquares.push(northCap);
    
    // South pole cap (where Player 2 king is at row 19)
    const southCapGeometry = new THREE.CircleGeometry(globeRadius * 0.08, 32); // Smaller radius
    const southCapMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xDC143C, // Red
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    const southCap = new THREE.Mesh(southCapGeometry, southCapMaterial);
    southCap.position.set(0, -globeRadius - 0.05, 0); // Much lower so pieces sit well above
    southCap.rotation.x = Math.PI / 2;
    southCap.userData = { isPole: true, poleType: 'south' };
    scene.add(southCap);
    gridSquares.push(southCap);
    
    // Create concentric rings with alternating colored sections
    for (let row = 1; row < gridRows - 1; row++) { // Skip pole rows (0 and 19)
      // Calculate the Y position for this ring - MATCH PIECE POSITIONING EXACTLY
      const ringPhiDeg = (row / (gridRows - 1)) * 180; // Same formula as pieces
      const ringPhi = THREE.MathUtils.degToRad(ringPhiDeg); // Convert to radians
      const ringY = globeRadius * Math.cos(ringPhi);
      const ringRadius = globeRadius * Math.sin(ringPhi);
      
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
            globeRadius + 0.05, // radius (much lower so pieces sit well above)
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
            globeRadius + 0.06, // slightly larger radius for borders (above grid, well below pieces)
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
          globeRadius + 0.06, // slightly larger radius (above grid, well below pieces)
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

// Model file mappings - using finalized GLB files from Final pieces folder
const MODEL_PATHS = {
  'KING': './chess piece models/Final pieces/KING.glb',
  'QUEEN': './chess piece models/Final pieces/QUEEN.glb',
  'ROOK': './chess piece models/Final pieces/ROOK.glb',
  'KNIGHT': './chess piece models/Final pieces/KNIGHT.glb',
  'BISHOP': './chess piece models/Final pieces/BISHOP.glb',
  'PAWN': './chess piece models/Final pieces/PAWN.glb',
  'SPLITTER': './chess piece models/Final pieces/SPLITTER.glb',
  'JUMPER': './chess piece models/Final pieces/JUMPER.glb',
  'SUPER_JUMPER': './chess piece models/Final pieces/SUPER_JUMPER.glb',
  'HYPER_JUMPER': './chess piece models/Final pieces/HYPER_JUMPER.glb',
  'MISTRESS_JUMPER': './chess piece models/Final pieces/MISTRESS_JUMPER.glb',
  'HYBRID_QUEEN': './chess piece models/Final pieces/HYBRID_QUEEN.glb'
};

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

// Game state
let gameState = {
  players: {},
  pieces: {},
  gridConfig: { rows: 20, cols: 8 }
};

// COLOR_MAP now imported from ColorManager module

// Visual elements
const pieceMeshes = {};
let validMoves = [];
let selectedPieceId = null;

// Visual effects manager - MOVED HERE TO FIX INITIALIZATION ORDER (will be initialized after scene is ready)
let visualEffects = null;

// Text label cache - MOVED HERE TO FIX INITIALIZATION ORDER
const textLabelCache = new Map();

// CLASS DEFINITIONS - MOVED HERE TO FIX INITIALIZATION ORDER
// TransitionManager and VisualEffectsManager classes now imported from VisualEffectsManager module

// VisualEffectsManager class now imported from VisualEffectsManager module

// UI elements - moved to top of file

// Socket event handlers are now set up in setupSocketListeners() function

// Duplicate socket handlers removed - all handlers now properly set up in setupSocketListeners() function

// More duplicate socket handlers removed

// Removed all duplicate socket handlers - they are now properly handled in setupSocketListeners() function

// All remaining duplicate socket handlers below this point should also be removed

// Tournament socket handlers now in setupTournamentSocketHandlers
});

// Battle and game action socket handlers now in setupBattleSocketHandlers
// Multi-jump capture handler now in setupBattleSocketHandlers
    // Create lightning effect from captured piece to jumper
    const lightningGeometry = new THREE.BufferGeometry();
    const lightningPoints = [];
    
    // Create jagged lightning path
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = capturedWorldPos.x + (jumperWorldPos.x - capturedWorldPos.x) * t + (Math.random() - 0.5) * 0.1;
      const y = capturedWorldPos.y + (jumperWorldPos.y - capturedWorldPos.y) * t + (Math.random() - 0.5) * 0.1;
      const z = capturedWorldPos.z + (jumperWorldPos.z - capturedWorldPos.z) * t + (Math.random() - 0.5) * 0.1;
      lightningPoints.push(new THREE.Vector3(x, y, z));
    }
    
    lightningGeometry.setFromPoints(lightningPoints);
    
    const lightningMaterial = new THREE.LineBasicMaterial({
      color: 0xaa00ff, // Purple color for multi-capture
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    
    const lightning = new THREE.Line(lightningGeometry, lightningMaterial);
    scene.add(lightning);
    
    // Create explosion effect at captured position
    const explosionGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa00ff,
      transparent: true,
      opacity: 0.6,
      wireframe: true
    });
    
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.set(capturedWorldPos.x, capturedWorldPos.y, capturedWorldPos.z);
    scene.add(explosion);
    
    // Animate the effects with staggered timing
    let animationTime = 0;
    const animateMultiCapture = () => {
      animationTime += 0.04;
      
      // Fade out lightning
      lightning.material.opacity = 0.8 - animationTime;
      
      // Expand and fade explosion
      explosion.scale.set(1 + animationTime * 3, 1 + animationTime * 3, 1 + animationTime * 3);
      explosion.material.opacity = 0.6 - animationTime;
      
      if (animationTime < 1) {
        requestAnimationFrame(animateMultiCapture);
      } else {
        // Clean up
        scene.remove(lightning);
        scene.remove(explosion);
        lightningGeometry.dispose();
        lightningMaterial.dispose();
        explosionGeometry.dispose();
        explosionMaterial.dispose();
      }
    };
    
    // Start animation with slight delay for each piece
    setTimeout(() => {
      animateMultiCapture();
    }, index * 100);
  });
});

// showNotification function now imported from NotificationManager module

function showBattleContestPrompt(battleId, attackingPiece, defendingPiece, timeLimit) {
  // Remove any existing prompt
  const existingPrompt = document.getElementById('battle-contest-prompt');
  if (existingPrompt) {
    existingPrompt.remove();
  }
  
  // Create contest prompt UI
  const promptDiv = document.createElement('div');
  promptDiv.id = 'battle-contest-prompt';
  promptDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    border: 2px solid #ff6b6b;
  `;
  
  const countdown = document.createElement('div');
  countdown.id = 'contest-countdown';
  countdown.style.cssText = `
    font-size: 24px;
    font-weight: bold;
    color: #ff6b6b;
    margin-bottom: 10px;
  `;
  
  promptDiv.innerHTML = `
    <h3>Battle Contest!</h3>
    <p>${attackingPiece.symbol} ${attackingPiece.type} (${attackingPiece.value}pts) attacking your ${defendingPiece.symbol} ${defendingPiece.type} (${defendingPiece.value}pts)</p>
    <p>Do you want to contest this battle with dice?</p>
    <button id="contest-yes" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Contest!</button>
    <button id="contest-no" style="margin: 10px; padding: 10px 20px; font-size: 16px; background: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">Auto-Resolve</button>
  `;
  
  promptDiv.appendChild(countdown);
  document.body.appendChild(promptDiv);
  
  // Add event listeners
  document.getElementById('contest-yes').addEventListener('click', () => {
    socket.emit('contest-response', { battleId, wantsToContest: true });
    promptDiv.remove();
  });
  
  document.getElementById('contest-no').addEventListener('click', () => {
    socket.emit('contest-response', { battleId, wantsToContest: false });
    promptDiv.remove();
  });
  
  // Countdown timer
  let timeLeft = timeLimit;
  const updateCountdown = () => {
    countdown.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      // Auto-resolve if no response
      socket.emit('contest-response', { battleId, wantsToContest: false });
      promptDiv.remove();
    } else {
      timeLeft--;
      setTimeout(updateCountdown, 1000);
    }
  };
  updateCountdown();
}

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
  const position = getWorldPosition(piece.row, piece.col);
  
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
              newMat.metalness = 0.4;
              newMat.roughness = 0.6;
              return newMat;
            });
          } else {
            child.material = child.material.clone();
            child.material.color.setHex(playerColor);
            child.material.metalness = 0.4;
            child.material.roughness = 0.6;
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
    
    const material = performanceOptimizer.getCachedMaterial('standard', {
      color: pieceColor,
      metalness: 0.3,
      roughness: 0.7
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
  const labelTexture = createCachedTextLabel(piece.symbol);
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
    const evolutionLabelTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
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
    const position = getWorldPosition(piece.row, piece.col);
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
    const newTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    
    // Dispose of old texture to prevent memory leaks
    if (evolutionLabel.material.map) {
      evolutionLabel.material.map.dispose();
    }
    
    // Apply new texture
    evolutionLabel.material.map = newTexture;
    evolutionLabel.material.needsUpdate = true;
  }
}

// updateAllEvolutionPointLabels function now imported from EvolutionManager module

// Cached text label creation - textLabelCache moved to top of file to fix initialization order

function createCachedTextLabel(symbol) {
  if (textLabelCache.has(symbol)) {
    return textLabelCache.get(symbol);
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;
  
  context.fillStyle = 'white';
  context.font = '32px Arial';
  context.textAlign = 'center';
  context.fillText(symbol, 32, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  textLabelCache.set(symbol, texture);
  
  return texture;
}

// getEvolutionPointsForPiece and createEvolutionPointsLabel functions now imported from EvolutionManager module
    'SPLITTER': 0.35,
    'JUMPER': 0.4,
    'SUPER_JUMPER': 0.45,
    'HYPER_JUMPER': 0.5,
    'MISTRESS_JUMPER': 0.55,
    'HYBRID_QUEEN': 0.6
  };
  return scaleMap[pieceType] || 0.4;
}

// Helper function to get appropriate scale for geometric shapes (fallback)
function getGeometricScale(pieceType) {
  const scaleMap = {
    'KING': 1.2,
    'QUEEN': 1.1,
    'ROOK': 1.0,
    'KNIGHT': 1.0,
    'BISHOP': 1.0,
    'PAWN': 1.0,
    'SPLITTER': 1.0,
    'JUMPER': 1.0,
    'SUPER_JUMPER': 1.1,
    'HYPER_JUMPER': 1.15,
    'MISTRESS_JUMPER': 1.2,
    'HYBRID_QUEEN': 1.3
  };
  return scaleMap[pieceType] || 1.0;
}

// Helper function to get height adjustments for GLB models
function getModelHeightAdjustment(pieceType) {
  const adjustmentMap = {
    'KING': 0.08,        // King appears sunken, lift it up
    'QUEEN': 0.04,       // Queen might need slight adjustment
    'ROOK': 0.02,        // Rook might need slight adjustment
    'KNIGHT': 0.02,      // Knight might need slight adjustment
    'BISHOP': 0.03,      // Bishop might need slight adjustment
    'PAWN': 0.0,         // Pawn is the reference - no adjustment needed
    'SPLITTER': 0.02,    // Evolved pieces might need adjustments
    'JUMPER': 0.03,
    'SUPER_JUMPER': 0.03,
    'HYPER_JUMPER': 0.04,
    'MISTRESS_JUMPER': 0.05,
    'HYBRID_QUEEN': 0.06
  };
  return adjustmentMap[pieceType] || 0.0;
}

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
    const position = getWorldPosition(piece.row, piece.col);
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.piece = piece;
    
    // Orient piece so bottom faces sphere center (top points away from center)
    const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
    const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.setRotationFromQuaternion(quaternion);
  }
}

// getWorldPosition function - Now imported from ./modules/GridUtils.js

// updateUI function now imported from UIManager module

// updatePlayerColorIndicators function now imported from ColorManager module

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
    const position = getWorldPosition(move.row, move.col);
    
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
            const capturedPosition = getWorldPosition(capturedPiece.row, capturedPiece.col);
            
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

function showLobbyUI() {
  document.getElementById('lobby-ui').style.display = 'block';
  refreshLobbies();
}

function hideLobbyUI() {
  document.getElementById('lobby-ui').style.display = 'none';
  document.getElementById('lobby-browser').style.display = 'block';
  document.getElementById('lobby-creation').style.display = 'none';
  document.getElementById('lobby-room').style.display = 'none';
}

function showLobbyCreation() {
  document.getElementById('lobby-browser').style.display = 'none';
  document.getElementById('lobby-creation').style.display = 'block';
  document.getElementById('lobby-room').style.display = 'none';
  
  // Set default lobby name
  document.getElementById('lobby-name').value = `${getPlayerName()}'s Lobby`;
}

function hideLobbyCreation() {
  document.getElementById('lobby-browser').style.display = 'block';
  document.getElementById('lobby-creation').style.display = 'none';
  document.getElementById('lobby-room').style.display = 'none';
}

function showLobbyRoom(lobby) {
  document.getElementById('lobby-browser').style.display = 'none';
  document.getElementById('lobby-creation').style.display = 'none';
  document.getElementById('lobby-room').style.display = 'block';
  
  updateLobbyRoomDisplay(lobby);
}

function updateLobbyRoomDisplay(lobby) {
  document.getElementById('lobby-room-name').textContent = lobby.name;
  
  // Update players list
  const playersHtml = lobby.players.map(p => 
    `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
      <span>${p.name}${p.isCreator ? ' (Creator)' : ''}</span>
      <span style="color: ${p.ready ? '#00ff00' : '#ff6600'};">${p.ready ? 'Ready' : 'Not Ready'}</span>
    </div>`
  ).join('');
  document.getElementById('lobby-players-list').innerHTML = playersHtml;
  
  // Update settings display
  const settingsHtml = `
    <div>Max Players: ${lobby.settings.maxPlayers}</div>
    <div>Game Mode: ${lobby.settings.gameMode}</div>
    <div>Time Limit: ${lobby.settings.timeLimit}s</div>
    <div>Evolution Mode: ${lobby.settings.evolutionMode}</div>
  `;
  document.getElementById('lobby-settings-display').innerHTML = settingsHtml;
  
  // Update ready button and status
  const currentPlayer = lobby.players.find(p => p.id === socket.id);
  if (currentPlayer) {
    const readyBtn = document.getElementById('ready-toggle-btn');
    const readyStatus = document.getElementById('ready-status');
    
    if (currentPlayer.ready) {
      readyBtn.textContent = 'Not Ready';
      readyBtn.style.background = '#cc0000';
      readyStatus.textContent = 'Ready';
      readyStatus.style.color = '#00ff00';
    } else {
      readyBtn.textContent = 'Ready';
      readyBtn.style.background = '#00cc00';
      readyStatus.textContent = 'Not Ready';
      readyStatus.style.color = '#ff6600';
    }
  }
}

function createLobby() {
  const name = document.getElementById('lobby-name').value.trim();
  const maxPlayers = parseInt(document.getElementById('lobby-max-players').value);
  const gameMode = document.getElementById('lobby-game-mode').value;
  const timeLimit = parseInt(document.getElementById('lobby-time-limit').value);
  
  if (!name) {
    alert('Please enter a lobby name');
    return;
  }
  
  const settings = {
    name: name,
    maxPlayers: maxPlayers,
    gameMode: gameMode,
    timeLimit: timeLimit,
    evolutionMode: 'standard'
  };
  
  socket.emit('create-lobby', { name, settings });
}

function joinLobby(lobbyId) {
  socket.emit('join-lobby', { lobbyId });
}

function leaveLobby() {
  if (currentLobby) {
    socket.emit('leave-lobby', { lobbyId: currentLobby.id });
  }
}

function toggleReady() {
  if (currentLobby) {
    socket.emit('toggle-ready', { lobbyId: currentLobby.id });
  }
}

function refreshLobbies() {
  socket.emit('get-lobbies');
}

// updateLobbyList function now imported from UIManager module

function getPlayerName() {
  // Try to get player name from game state or use default
  const playerKeys = Object.keys(gameState?.players || {});
  const currentPlayer = playerKeys.find(key => key === socket.id);
  return currentPlayer ? gameState.players[currentPlayer].name : 'Player';
}

// Statistics management functions
function showStatisticsUI() {
  document.getElementById('stats-ui').style.display = 'block';
  showPersonalStats();
}

function hideStatisticsUI() {
  document.getElementById('stats-ui').style.display = 'none';
}

function showPersonalStats() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'block';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-personal-stats');
  
  // Request personal stats
  socket.emit('get-player-stats', {});
}

function showLeaderboard() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'block';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-leaderboard');
  
  // Request leaderboard
  refreshLeaderboard();
}

function showAchievements() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'block';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-achievements');
  
  // Request achievements
  socket.emit('get-achievements', {});
}

function showGlobalStats() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'block';
  
  // Update button styles
  updateStatsButtonStyles('show-global-stats');
  
  // Request global stats
  socket.emit('get-global-stats');
}

// updateStatsButtonStyles function now imported from UIManager module

function refreshLeaderboard() {
  const category = document.getElementById('leaderboard-category').value;
  socket.emit('get-leaderboard', { category, limit: 50 });
}

function displayPersonalStats(stats) {
  if (!stats) {
    document.getElementById('personal-stats-content').innerHTML = '<div style="color: #888;">No statistics available. Play some games to see your stats!</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Performance</div>
        <div>Games Played: ${stats.gamesPlayed}</div>
        <div>Games Won: ${stats.gamesWon}</div>
        <div>Win Rate: ${(stats.winRate * 100).toFixed(1)}%</div>
        <div>Current Rating: ${stats.currentRank}</div>
        <div>Best Rating: ${stats.bestRank}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Battle Stats</div>
        <div>Battles Won: ${stats.battlesWon}</div>
        <div>Battle Win Rate: ${(stats.battleWinRate * 100).toFixed(1)}%</div>
        <div>Pieces Killed: ${stats.piecesKilled}</div>
        <div>Pieces Lost: ${stats.piecesLost}</div>
        <div>K/D Ratio: ${stats.killDeathRatio.toFixed(2)}</div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Evolution & Abilities</div>
        <div>Pieces Evolved: ${stats.piecesEvolved}</div>
        <div>Splitter Uses: ${stats.splitterUses}</div>
        <div>Multi-Captures: ${stats.jumperMultiCaptures}</div>
        <div>Hybrid Mode Changes: ${stats.hybridQueenModeChanges}</div>
        <div>Equator Bonuses: ${stats.equatorBonuses}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Tournaments</div>
        <div>Tournaments Joined: ${stats.tournamentsJoined}</div>
        <div>Tournament Wins: ${stats.tournamentWins}</div>
        <div>Finals Reached: ${stats.tournamentFinals}</div>
        <div>Win Streak: ${stats.currentWinStreak}</div>
        <div>Best Streak: ${stats.bestWinStreak}</div>
      </div>
    </div>
    <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
      <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Recent Games</div>
      ${stats.recentGames.map(game => `
        <div style="display: flex; justify-content: space-between; padding: 2px; border-bottom: 1px solid #333;">
          <span style="color: ${game.result === 'win' ? '#00ff00' : '#ff6600'};">${game.result.toUpperCase()}</span>
          <span>${game.gameMode}</span>
          <span>${game.moves} moves</span>
          <span>${Math.round(game.duration / 60)}m ${game.duration % 60}s</span>
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('personal-stats-content').innerHTML = html;
}

function displayLeaderboard(leaderboard, category) {
  if (!leaderboard || leaderboard.length === 0) {
    document.getElementById('leaderboard-content').innerHTML = '<div style="color: #888;">No leaderboard data available.</div>';
    return;
  }
  
  const categoryNames = {
    'rating': 'Rating',
    'wins': 'Wins',
    'winRate': 'Win Rate',
    'battles': 'Battles Won',
    'evolution': 'Evolutions',
    'tournaments': 'Tournaments'
  };
  
  const html = `
    <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 2px solid #cc00cc; margin-bottom: 5px; font-weight: bold;">
      <span>Rank</span>
      <span>Player</span>
      <span>${categoryNames[category]}</span>
    </div>
    ${leaderboard.map(entry => `
      <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #333; ${entry.playerId === socket.id ? 'background: rgba(204, 0, 204, 0.2);' : ''}">
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">#${entry.rank}</span>
        <span style="color: ${entry.playerId === socket.id ? '#cc00cc' : '#fff'};">${entry.playerName}</span>
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">${entry.value}</span>
      </div>
    `).join('')}
  `;
  
  document.getElementById('leaderboard-content').innerHTML = html;
}

function displayAchievements(achievements) {
  if (!achievements || achievements.length === 0) {
    document.getElementById('achievements-content').innerHTML = '<div style="color: #888;">No achievements unlocked yet. Keep playing to earn achievements!</div>';
    return;
  }
  
  const rarityColors = {
    'common': '#ffffff',
    'uncommon': '#1eff00',
    'rare': '#0070dd',
    'epic': '#a335ee',
    'legendary': '#ff8000'
  };
  
  const html = achievements.map(achievement => `
    <div style="display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background: rgba(0, 0, 0, 0.2); border-radius: 3px; border-left: 3px solid ${rarityColors[achievement.rarity]};">
      <div style="font-size: 20px; margin-right: 10px;">${achievement.icon}</div>
      <div style="flex: 1;">
        <div style="color: ${rarityColors[achievement.rarity]}; font-weight: bold;">${achievement.name}</div>
        <div style="color: #ccc; font-size: 10px;">${achievement.description}</div>
        <div style="color: #888; font-size: 10px;">Earned: ${new Date(achievement.earned).toLocaleDateString()}</div>
      </div>
      <div style="color: ${rarityColors[achievement.rarity]}; font-size: 10px; text-transform: uppercase;">${achievement.rarity}</div>
    </div>
  `).join('');
  
  document.getElementById('achievements-content').innerHTML = html;
}

function displayGlobalStats(stats) {
  if (!stats) {
    document.getElementById('global-stats-content').innerHTML = '<div style="color: #888;">No global statistics available.</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Player Statistics</div>
        <div>Total Players: ${stats.totalPlayers.toLocaleString()}</div>
        <div>Average Rating: ${stats.averageRating.toFixed(0)}</div>
        <div>Top Player: ${stats.topPlayer ? stats.topPlayer.playerName : 'None'}</div>
        <div>Top Rating: ${stats.topPlayer ? stats.topPlayer.currentRank : 'N/A'}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Statistics</div>
        <div>Total Games: ${stats.totalGames.toLocaleString()}</div>
        <div>Total Battles: ${stats.totalBattles.toLocaleString()}</div>
        <div>Total Evolutions: ${stats.totalEvolutions.toLocaleString()}</div>
        <div>Total Tournaments: ${stats.totalTournaments.toLocaleString()}</div>
      </div>
    </div>
  `;
  
  document.getElementById('global-stats-content').innerHTML = html;
}

// Evolution system functions now imported from EvolutionManager module

function showEvolutionChoice(data) {
// Evolution choice functions now imported from EvolutionManager module
function showTournamentUI() {
  document.getElementById('tournament-ui').style.display = 'block';
  socket.emit('get-tournaments');
}

function hideTournamentUI() {
  document.getElementById('tournament-ui').style.display = 'none';
}

function showTournamentCreation() {
  document.getElementById('tournament-lobby').style.display = 'none';
  document.getElementById('tournament-creation').style.display = 'block';
}

function hideTournamentCreation() {
  document.getElementById('tournament-lobby').style.display = 'block';
  document.getElementById('tournament-creation').style.display = 'none';
}

function createTournament() {
  const name = document.getElementById('tournament-name').value || 'EvoChess Tournament';
  const maxPlayers = parseInt(document.getElementById('tournament-max-players').value);
  
  const settings = {
    name: name,
    maxPlayers: maxPlayers,
    minPlayers: 2,
    autoStart: false
  };
  
  socket.emit('create-tournament', { settings });
  hideTournamentCreation();
}

function showTournamentList() {
  socket.emit('get-tournaments');
  updateTournamentList();
}

function updateTournamentList() {
  const listElement = document.getElementById('tournament-list');
  
  if (tournaments.length === 0) {
    listElement.innerHTML = '<div style="color: #888; font-size: 12px;">No tournaments available</div>';
    return;
  }
  
  listElement.innerHTML = tournaments.map(tournament => `
    <div style="margin-bottom: 5px; padding: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px;">
      <div style="font-size: 13px; color: #fff; margin-bottom: 3px;">${tournament.name}</div>
      <div style="font-size: 11px; color: #ccc;">
        Players: ${tournament.players.length}/${tournament.maxPlayers} | 
        Status: ${tournament.status.toUpperCase()}
      </div>
      <div style="margin-top: 5px;">
        ${tournament.status === 'waiting' ? 
          `<button onclick="joinTournament('${tournament.id}')" style="padding: 3px 8px; background: #44ff44; color: #000; border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">Join</button>` : 
          `<button onclick="viewTournament('${tournament.id}')" style="padding: 3px 8px; background: #888; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">View</button>`
        }
        ${tournament.status === 'waiting' && tournament.players.length >= tournament.minPlayers ? 
          `<button onclick="startTournament('${tournament.id}')" style="padding: 3px 8px; background: #ff4444; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 11px; margin-left: 5px;">Start</button>` : 
          ''
        }
      </div>
    </div>
  `).join('');
}

window.joinTournament = function(tournamentId) {
  const playerName = prompt('Enter your name:') || 'Anonymous Player';
  socket.emit('join-tournament', { tournamentId, playerName });
};

window.startTournament = function(tournamentId) {
  if (confirm('Start this tournament?')) {
    socket.emit('start-tournament', { tournamentId });
  }
};

window.viewTournament = function(tournamentId) {
  socket.emit('get-tournament', { tournamentId });
};

function updateTournamentStatus(tournament) {
  currentTournament = tournament;
  
  document.getElementById('tournament-lobby').style.display = 'none';
  document.getElementById('tournament-creation').style.display = 'none';
  document.getElementById('tournament-status').style.display = 'block';
  
  const infoElement = document.getElementById('tournament-info');
  infoElement.innerHTML = `
    <strong>${tournament.name}</strong><br>
    Status: ${tournament.status.toUpperCase()}<br>
    Players: ${tournament.players.length}/${tournament.maxPlayers}<br>
    Round: ${tournament.currentRound}/${tournament.brackets.length}
  `;
  
  // Update brackets display
  updateBracketsDisplay(tournament);
}

function updateBracketsDisplay(tournament) {
  const bracketsElement = document.getElementById('tournament-brackets');
  
  if (!tournament.brackets || tournament.brackets.length === 0) {
    bracketsElement.innerHTML = 'Brackets will be generated when tournament starts';
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
    const position = getWorldPosition(move.row, move.col);
    
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
  
  const position = getWorldPosition(piece.row, piece.col);
  
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



// Color functions now imported from ColorManager module


// Enhanced piece color function that prioritizes player identification
function getPieceColorForPlayer(piece, player, playerIndex) {
  // Check if this is a split piece that should inherit parent color
  if (piece.id && piece.id.includes('-split-')) {
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

// Mouse functions now imported from MouseInteractionManager module

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
    showLobbyUI();
  } else {
    hideLobbyUI();
  }
});

document.getElementById('create-lobby-btn').addEventListener('click', () => {
  showLobbyCreation();
});

document.getElementById('create-lobby-confirm').addEventListener('click', () => {
  createLobby();
});

document.getElementById('create-lobby-cancel').addEventListener('click', () => {
  hideLobbyCreation();
});

document.getElementById('refresh-lobbies-btn').addEventListener('click', () => {
  refreshLobbies();
});

document.getElementById('leave-lobby-btn').addEventListener('click', () => {
  leaveLobby();
});

document.getElementById('ready-toggle-btn').addEventListener('click', () => {
  toggleReady();
});

// Evolution system functionality
let currentEvolutionChoice = null;
// evolutionTimer now managed in TimerManager module
let playerEvolutionBank = { points: 0, totalEarned: 0 };

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

// updateReplayUI and formatTime functions now imported from UIManager module

// Spectator and replay socket handlers now in setupSpectatorSocketHandlers
// Remaining socket handlers now managed by setupAllSocketHandlers
});

// Initialize color selection when page loads
initializeColorSelection(); 

// Performance Optimization System (duplicate removed)

// DUPLICATE CLASS DEFINITIONS REMOVED - MOVED TO TOP OF FILE

// Initialize visual effects manager after scene is ready
if (!visualEffects) {
  visualEffects = new VisualEffectsManager(scene, renderer);
}

// Update particle system in animation loop
const originalAnimate = window.animate;
window.animate = function() {
  originalAnimate();
  visualEffects.updateParticles(16.67); // Assume 60 FPS
};

// ... existing code ...

// Force all pieces to reposition to correct height
function forceRepositionAllPieces() {
  console.log('🔄 Forcing all pieces to reposition to correct height');
  Object.values(gameState.pieces || {}).forEach(piece => {
    if (pieceMeshes[piece.id]) {
      const position = getWorldPosition(piece.row, piece.col);
      const mesh = pieceMeshes[piece.id];
      mesh.position.set(position.x, position.y, position.z);
      
      // Apply height adjustment for GLB models to match piece positioning
      const heightAdjustment = getModelHeightAdjustment(piece.type);
      if (heightAdjustment !== 0) {
        const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
        mesh.position.add(normal.multiplyScalar(heightAdjustment));
        console.log(`🔄 Applied height adjustment ${heightAdjustment} to ${piece.type} during repositioning`);
      }
      
      console.log(`🔄 Repositioned ${piece.type} (${piece.id}) to height ${mesh.position.y}`);
    }
  });
}

// Call this once after the page loads to fix any height issues
setTimeout(() => {
  if (gameState && gameState.pieces) {
    forceRepositionAllPieces();
  }
}, 2000); // Wait 2 seconds after page load

// ... existing code ...

function showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit) {
  console.log('🎯 showEvolutionChoiceDialog called with:', { pieceId, piece, reason, availablePaths, bankInfo, timeLimit });
  
  // Create dialog HTML with inline styles
  const dialogHtml = `
    <div id="evolution-choice-dialog" class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div class="modal-content" style="
        background-color: #2a2a2a;
        color: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h2 style="margin-top: 0; color: #4CAF50;">Evolution Choice</h2>
        <p>Your ${piece.type} can evolve! Choose your path:</p>
        
        <div class="evolution-info" style="
          background-color: #3a3a3a;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        ">
          <p><strong>Reason:</strong> ${reason.replace('_', ' ')}</p>
          <p><strong>Current Points:</strong> ${bankInfo.points}</p>
          <p><strong>Time Limit:</strong> <span id="evolution-timer">${timeLimit}</span> seconds</p>
        </div>
        
        <div class="evolution-options" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="evolution-paths" style="flex: 2; min-width: 300px;">
            ${availablePaths.map(path => `
              <div class="evolution-path ${bankInfo.points >= path.cost ? 'affordable' : 'expensive'}" style="
                background-color: ${bankInfo.points >= path.cost ? '#4a4a4a' : '#3a3a3a'};
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 10px;
                border: 2px solid ${bankInfo.points >= path.cost ? '#4CAF50' : '#ff4444'};
              ">
                <h3 style="margin-top: 0; color: ${bankInfo.points >= path.cost ? '#4CAF50' : '#ff4444'};">
                  ${path.targetType}
                </h3>
                <p>${path.description}</p>
                <p><strong>Cost:</strong> ${path.cost} points</p>
                <button class="evolution-btn" 
                        data-piece-id="${pieceId}"
                        data-path='${JSON.stringify(path)}'
                        ${bankInfo.points >= path.cost ? '' : 'disabled'}
                        style="
                          background-color: ${bankInfo.points >= path.cost ? '#4CAF50' : '#666'};
                          color: white;
                          border: none;
                          padding: 10px 20px;
                          border-radius: 5px;
                          cursor: ${bankInfo.points >= path.cost ? 'pointer' : 'not-allowed'};
                          font-size: 14px;
                          pointer-events: ${bankInfo.points >= path.cost ? 'auto' : 'none'};
                          position: relative;
                          z-index: 1001;
                        ">
                  Evolve (${path.cost} points)
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="bank-option" style="
            flex: 1;
            min-width: 200px;
            background-color: #4a4a4a;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #FFA500;
          ">
            <h3 style="margin-top: 0; color: #FFA500;">Bank Points</h3>
            <p>Save your evolution points for later use</p>
            <button class="bank-btn" data-piece-id="${pieceId}" style="
              background-color: #FFA500;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              pointer-events: auto;
              position: relative;
              z-index: 1001;
            ">
              Bank Points
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners to buttons
  const evolutionBtns = document.querySelectorAll('.evolution-btn');
  const bankBtns = document.querySelectorAll('.bank-btn');
  
  console.log('🎯 Found evolution buttons:', evolutionBtns.length);
  console.log('🎯 Found bank buttons:', bankBtns.length);
  
  evolutionBtns.forEach((button, index) => {
    console.log(`🎯 Adding click listener to evolution button ${index}`);
    button.addEventListener('click', function(e) {
      console.log('🎯 Evolution button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      const pieceId = this.getAttribute('data-piece-id');
      const path = JSON.parse(this.getAttribute('data-path'));
      chooseEvolution(pieceId, path);
    });
  });
  
  bankBtns.forEach((button, index) => {
    console.log(`🎯 Adding click listener to bank button ${index}`);
    button.addEventListener('click', function(e) {
      console.log('🎯 Bank button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      const pieceId = this.getAttribute('data-piece-id');
      bankEvolutionPoints(pieceId);
    });
  });
  
  // Start countdown timer
  let timeLeft = timeLimit;
  const timerElement = document.getElementById('evolution-timer');
  
  const countdown = setInterval(() => {
    timeLeft--;
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      // Auto-bank if no choice made
      bankEvolutionPoints(pieceId);
    }
  }, 1000);
  
  // Store countdown reference for cleanup
  window.evolutionCountdown = countdown;
}

function chooseEvolution(pieceId, evolutionPath) {
  // Send evolution choice to server
  window.globalSocket.emit('evolution-choice-response', {
    pieceId: pieceId,
    choice: { evolutionPath: evolutionPath }
  });
  
  // Close dialog
  closeEvolutionDialog();
}

function bankEvolutionPoints(pieceId) {
  // Send bank choice to server
  window.globalSocket.emit('evolution-choice-response', {
    pieceId: pieceId,
    choice: 'bank'
  });
  
  // Close dialog
  closeEvolutionDialog();
}

// Make these functions globally accessible for onclick handlers
window.chooseEvolution = chooseEvolution;
window.bankEvolutionPoints = bankEvolutionPoints;

// Move choice dialog for splitters
function showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions) {
  // Create dialog HTML
  const dialogHtml = `
    <div id="move-choice-dialog" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 20px;
      color: white;
      text-align: center;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
    ">
      <h3 style="margin: 0 0 20px 0; color: #ff6b6b;">Choose Action</h3>
      <p style="margin-bottom: 20px;">Position (${targetRow}, ${targetCol}) - Multiple actions available:</p>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="move-choice-regular" style="
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">→</div>
          <div>Move</div>
          <div style="font-size: 12px; opacity: 0.8;">Regular movement</div>
        </button>
        
        <button id="move-choice-split" style="
          background-color: #ff6b6b;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">⧨</div>
          <div>Split</div>
          <div style="font-size: 12px; opacity: 0.8;">Create two pieces</div>
        </button>
      </div>
      
      <button id="move-choice-cancel" style="
        background-color: #666;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 15px;
        pointer-events: auto;
        position: relative;
        z-index: 10001;
      ">Cancel</button>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners
  document.getElementById('move-choice-regular').addEventListener('click', function() {
    executeMoveChoice(pieceId, targetRow, targetCol, 'move');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-split').addEventListener('click', function() {
    executeMoveChoice(pieceId, targetRow, targetCol, 'split');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-cancel').addEventListener('click', function() {
    closeMoveChoiceDialog();
  });
}

function closeMoveChoiceDialog() {
  const dialog = document.getElementById('move-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
}

function executeMoveChoice(pieceId, targetRow, targetCol, moveType) {
  if (moveType === 'split') {
    console.log(`🔄 SPLIT chosen - Sending split-piece event for ${pieceId} to (${targetRow}, ${targetCol})`);
    window.globalSocket.emit('split-piece', {
      pieceId: pieceId,
      targetRow: targetRow,
      targetCol: targetCol
    });
    gameInfoEl.textContent = `Splitting piece...`;
  } else {
    console.log('🚀 MOVE chosen - Sending move-piece event');
    window.globalSocket.emit('move-piece', {
      pieceId: pieceId,
      targetRow: targetRow,
      targetCol: targetCol
    });
    gameInfoEl.textContent = `Moving piece...`;
  }
  
  // Clear highlights after action
  clearValidMoveHighlights();
  selectedPieceId = null;
}

function closeEvolutionDialog() {
  const dialog = document.getElementById('evolution-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
  
  // Clear countdown timer
  if (window.evolutionCountdown) {
    clearInterval(window.evolutionCountdown);
    window.evolutionCountdown = null;
  }
} 