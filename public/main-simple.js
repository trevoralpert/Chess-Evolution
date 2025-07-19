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
import {
  initializeThreeJS,
  setupCameraControls,
  initializeManualCameraControls,
  ManualCameraControls,
  createGameBoard,
  loadModel,
  preloadModels,
  getModelScale,
  createCachedTextLabel,
  createPieceMeshOptimized,
  createGeometricPiece,
  updatePieceMeshOptimized,
  updateVisuals,
  updateVisualsDelta,
  removePieceEfficient,
  renderLoop,
  handleWindowResize,
  getSceneComponents,
  getPieceMeshes,
  getModelCache,
  getTextLabelCache,
  dispose
} from './modules/RenderingManager.js';
import {
  getGameState,
  setGameState,
  resetGameState,
  initializeGameComponents,
  startGameInitialization,
  getPieceSymbols,
  getCurrentlySelectedPieceId,
  setSelectedPieceId,
  getValidMoves,
  setValidMoves,
  clearValidMoves,
  getSelectedMovementMode,
  setSelectedMovementMode,
  getPlayerName,
  getPieceColorForPlayer,
  isGameActive,
  getPieceById,
  getPiecesByPlayerId,
  getPlayerById,
  getAllPlayers,
  getCurrentPlayer,
  isPieceOwnedByCurrentPlayer,
  getGameStatistics,
  highlightSelectedPiece,
  clearSelectionHighlights,
  highlightValidMoves,
  clearValidMoveHighlights,
  highlightValidMovesForMode,
  showDualMovementUI,
  hideDualMovementUI,
  selectMovementMode,
  showMoveChoiceDialog,
  closeMoveChoiceDialog,
  executeMoveChoice,
  getMoveTypeColor,
  getMoveTypeIcon,
  getMoveTypeName,
  forceRepositionAllPieces,
  updateQueueDisplay
} from './modules/GameLogicManager.js';
import {
  showStatisticsUI,
  hideStatisticsUI,
  showPersonalStats,
  showLeaderboard,
  showAchievements,
  showGlobalStats,
  refreshLeaderboard,
  displayPersonalStats,
  displayLeaderboard,
  displayAchievements,
  displayGlobalStats,
  formatLeaderboardValue,
  showTournamentUI,
  hideTournamentUI,
  showTournamentCreation,
  hideTournamentCreation,
  createTournament,
  showTournamentList,
  updateTournamentList,
  joinTournament,
  updateTournamentStatus,
  setupStatisticsSocketHandlers,
  getPlayerStats,
  getGlobalStats,
  getLeaderboardData,
  getAchievementsData,
  getTournaments,
  setTournaments
} from './modules/StatisticsManager.js';
import {
  showBattleContestPrompt,
  showDiceBattleAnimation,
  handleBattleResult,
  updateBattleUI,
  clearBattleUI,
  toggleBattleHistory,
  setupBattleSocketHandlers,
  initializeBattleSystem,
  getBattleStats,
  createBattleContestButton
} from './modules/BattleManager.js';
import {
  showLobbyUI,
  hideLobbyUI,
  showLobbyCreation,
  hideLobbyCreation,
  showLobbyRoom,
  updateLobbyRoomDisplay,
  createLobby,
  joinLobby,
  leaveLobby,
  toggleReady,
  refreshLobbies,
  updateLobbyList,
  getCurrentLobby,
  getLobbies,
  setLobbies,
  clearCurrentLobby,
  handleLobbyJoined,
  handleLobbyLeft,
  handleLobbyUpdated,
  handleLobbyCreated,
  handleGameStartFromLobby,
  setupLobbySocketHandlers,
  initializeLobbySystem,
  getLobbyStats
} from './modules/LobbyManager.js';
import {
  showSpectatorUI,
  hideSpectatorUI,
  joinSpectator,
  leaveSpectator,
  showReplayUI,
  hideReplayUI,
  playReplay,
  stopReplay,
  toggleReplayPlayback,
  playReplayStep,
  stepReplayBackward,
  stepReplayForward,
  seekReplayToPosition,
  setReplaySpeed,
  updateReplayUI,
  updateSpectatorGamesList,
  updateReplaysList,
  updateSpectatorUI,
  handleReplayLoaded,
  handleSpectatorJoined,
  handleSpectatorLeft,
  setupSpectatorSocketHandlers,
  getCurrentReplay,
  getSpectatorStatus,
  getReplayStats,
  getSpectatorStats,
  initializeSpectatorReplaySystem,
  formatGameDuration,
  formatDate
} from './modules/SpectatorReplayManager.js';
import {
  createGridOverlay,
  createGlobe,
  setupLighting,
  initializeSceneSetup,
  testModelAccess,
  setupModelLoading
} from './modules/SceneSetupManager.js';
import {
  setupSpectatorEventHandlers,
  setupReplayEventHandlers,
  setupWindowEventHandlers,
  setupAllEventHandlers,
  initializeEventHandlerSystem
} from './modules/EventHandlerManager.js';
import {
  loadGLTFLoader,
  startGameInitialization,
  initializeGame,
  initializeVisualEffects,
  initializeAllSystems,
  initializeSocketSystem,
  setupParticleSystemAnimation,
  setupUtilityFunctions,
  checkThreeJS
} from './modules/GameInitializationManager.js';

// Check if Three.js is loaded and initialize game
checkThreeJS();

// Initialize GLTFLoader and then start the game
(async function() {
  await initializeGame();
})();

// Game initialization functions now handled by GameLogicManager
  
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

// Three.js scene setup now handled by RenderingManager
const { scene, camera, renderer, controls } = initializeThreeJS();

// Create the game board
createGameBoard();

// Start render loop
renderLoop();

// Handle window resize
window.addEventListener('resize', handleWindowResize);

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

// updateQueueDisplay function now handled by GameLogicManager
// Camera controls setup now handled by RenderingManager
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
// Model loading functions now handled by RenderingManager
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

// Game state now managed by GameLogicManager

// COLOR_MAP now imported from ColorManager module

// Visual elements
// Piece meshes and caches now handled by RenderingManager
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

// Battle functions now handled by BattleManager

// Geometric piece creation functions now handled by RenderingManager

// getPlayerName function now handled by GameLogicManager
// Statistics management functions
// Statistics functions now handled by StatisticsManager
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
  setReplaySpeed(parseFloat(e.target.value));
});

document.getElementById('replay-timeline').addEventListener('input', (e) => {
  seekReplayToPosition(parseFloat(e.target.value));
});

// Spectator and replay functions now handled by SpectatorReplayManager
});

// Initialize color selection when page loads
initializeColorSelection(); 

// Performance Optimization System (duplicate removed)

// DUPLICATE CLASS DEFINITIONS REMOVED - MOVED TO TOP OF FILE

// Initialize visual effects manager after scene is ready
if (!visualEffects) {
  visualEffects = new VisualEffectsManager(scene, renderer);
}

// Initialize battle system
initializeBattleSystem();

// Initialize lobby system
initializeLobbySystem();

// Initialize spectator/replay system
initializeSpectatorReplaySystem();

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

// Evolution choice dialog functions now handled by EvolutionManager
