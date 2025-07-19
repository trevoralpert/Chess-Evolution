// Game Initialization Manager for EvoChess
// Handles core game initialization, GLTFLoader setup, and startup sequence

/**
 * Load GLTFLoader and add it to THREE object
 */
async function loadGLTFLoader() {
  try {
    // Check if GLTFLoader is already available from the script tag
    if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
      console.log('✅ GLTFLoader already available from script tag');
      return true;
    }
    
    // If not, try to import it (using same version as HTML file)
    const GLTFLoaderModule = await import('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js');
    if (typeof THREE !== 'undefined') {
      THREE.GLTFLoader = GLTFLoaderModule.GLTFLoader;
      console.log('✅ GLTFLoader imported and added to THREE object');
      return true;
    } else {
      console.error('❌ THREE.js not available for GLTFLoader setup');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to load GLTFLoader:', error);
    return false;
  }
}

/**
 * Start main game initialization
 */
function startGameInitialization() {
  console.log('🚀 Starting main game initialization...');
  
  // Initialize visual effects if not already done
  if (typeof initializeVisualEffects === 'function') {
    initializeVisualEffects();
  }
  
  // Set up mouse interaction for piece selection and movement
  if (typeof setupMouseInteraction === 'function') {
    setupMouseInteraction();
  }
  
  // Initialize all system modules
  initializeAllSystems();
  
  console.log('✅ Game components initialized successfully');
}

/**
 * Initialize visual effects system
 */
function initializeVisualEffects() {
  // Get scene and renderer references
  const sceneComponents = typeof getSceneComponents === 'function' ? getSceneComponents() : null;
  const scene = sceneComponents ? sceneComponents.scene : (typeof window !== 'undefined' ? window.scene : null);
  const renderer = sceneComponents ? sceneComponents.renderer : (typeof window !== 'undefined' ? window.renderer : null);
  
  if (!window.visualEffects && scene && renderer) {
    if (typeof VisualEffectsManager !== 'undefined') {
      window.visualEffects = new VisualEffectsManager(scene, renderer);
      console.log('✨ Visual effects initialized');
    } else {
      console.warn('⚠️ VisualEffectsManager not available');
    }
  } else if (window.visualEffects) {
    console.log('✨ Visual effects already initialized');
  } else {
    console.warn('⚠️ Scene or renderer not available for visual effects');
  }
}

/**
 * Initialize all game systems
 */
function initializeAllSystems() {
  console.log('🔧 Initializing all game systems...');
  
  // Initialize scene setup
  if (typeof initializeSceneSetup === 'function') {
    initializeSceneSetup();
  }
  
  // Initialize battle system
  if (typeof initializeBattleSystem === 'function') {
    initializeBattleSystem();
  }
  
  // Initialize lobby system
  if (typeof initializeLobbySystem === 'function') {
    initializeLobbySystem();
  }
  
  // Initialize spectator/replay system
  if (typeof initializeSpectatorReplaySystem === 'function') {
    initializeSpectatorReplaySystem();
  }
  
  // Initialize event handler system
  if (typeof initializeEventHandlerSystem === 'function') {
    initializeEventHandlerSystem();
  }
  
  // Initialize color selection
  if (typeof initializeColorSelection === 'function') {
    initializeColorSelection();
  }
  
  console.log('✅ All game systems initialized');
}

/**
 * Setup particle system animation loop
 */
function setupParticleSystemAnimation() {
  // Update particle system in animation loop
  const originalAnimate = typeof window !== 'undefined' ? window.animate : null;
  
  if (originalAnimate && window.visualEffects) {
    window.animate = function() {
      originalAnimate();
      window.visualEffects.updateParticles(16.67); // Assume 60 FPS
    };
    console.log('✅ Particle system animation loop integrated');
  } else {
    console.warn('⚠️ Could not integrate particle system animation loop');
  }
}

/**
 * Setup utility functions for repositioning pieces
 */
function setupUtilityFunctions() {
  // Force all pieces to reposition to correct height
  window.forceRepositionAllPieces = function() {
    console.log('🔄 Forcing all pieces to reposition to correct height');
    
    // Get game state and piece meshes
    const gameState = typeof getGameState === 'function' ? getGameState() : 
                     (typeof window !== 'undefined' ? window.gameState : null);
    const pieceMeshes = typeof getPieceMeshes === 'function' ? getPieceMeshes() : 
                       (typeof window !== 'undefined' ? window.pieceMeshes : null);
    
    if (gameState && gameState.pieces && pieceMeshes) {
      Object.values(gameState.pieces).forEach(piece => {
        if (pieceMeshes[piece.id]) {
          const position = typeof getWorldPosition === 'function' ? 
            getWorldPosition(piece.row, piece.col) : null;
          
          if (position) {
            const mesh = pieceMeshes[piece.id];
            mesh.position.set(position.x, position.y, position.z);
            
            // Apply height adjustment for GLB models to match piece positioning
            const heightAdjustment = typeof getModelHeightAdjustment === 'function' ? 
              getModelHeightAdjustment(piece.type) : 0;
            
            if (heightAdjustment !== 0) {
              const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
              mesh.position.add(normal.multiplyScalar(heightAdjustment));
              console.log(`🔄 Applied height adjustment ${heightAdjustment} to ${piece.type} during repositioning`);
            }
            
            console.log(`🔄 Repositioned ${piece.type} (${piece.id}) to height ${mesh.position.y}`);
          }
        }
      });
    } else {
      console.warn('⚠️ Game state or piece meshes not available for repositioning');
    }
  };
  
  // Call repositioning after a delay
  setTimeout(() => {
    const gameState = typeof getGameState === 'function' ? getGameState() : 
                     (typeof window !== 'undefined' ? window.gameState : null);
    
    if (gameState && gameState.pieces && typeof window.forceRepositionAllPieces === 'function') {
      window.forceRepositionAllPieces();
    }
  }, 2000); // Wait 2 seconds after page load
}

/**
 * Initialize socket system
 */
function initializeSocketSystem() {
  // Socket.io connection - will be initialized when game starts
  if (typeof window !== 'undefined') {
    window.socket = null;
    window.globalSocket = null;
    console.log('Socket.io will be initialized when game starts');
  }
}

/**
 * Main game initialization function
 */
async function initializeGame() {
  console.log('🔧 Loading GLTFLoader...');
  await loadGLTFLoader();
  console.log('🚀 GLTFLoader ready, starting game initialization...');
  
  // Continue with the rest of the initialization
  startGameInitialization();
  
  // Setup additional systems
  setupParticleSystemAnimation();
  setupUtilityFunctions();
  initializeSocketSystem();
  
  console.log('🎉 Game initialization complete!');
}

/**
 * Check Three.js availability
 */
function checkThreeJS() {
  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
    return false;
  } else {
    console.log('Three.js loaded successfully:', THREE);
    return true;
  }
}

export {
  // Core Initialization
  loadGLTFLoader,
  startGameInitialization,
  initializeGame,
  
  // System Initialization
  initializeVisualEffects,
  initializeAllSystems,
  initializeSocketSystem,
  
  // Utility Setup
  setupParticleSystemAnimation,
  setupUtilityFunctions,
  
  // Validation
  checkThreeJS
};