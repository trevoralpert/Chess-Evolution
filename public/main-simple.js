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

// Visual update and piece creation functions now handled by RenderingManager
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

// Dual movement UI functions now handled by GameLogicManager
    
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
// Move choice dialog functions now handled by GameLogicManager
  if (dialog) {
    dialog.remove();
  }
  
  // Clear countdown timer
  if (window.evolutionCountdown) {
    clearInterval(window.evolutionCountdown);
    window.evolutionCountdown = null;
  }
} 