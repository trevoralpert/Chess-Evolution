// 3D Rendering system for EvoChess
// Handles Three.js scene management, model loading, mesh creation, and visual updates

// Global rendering variables
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let manualCameraControls = null;

// Caches and storage
const modelCache = {};
const pieceMeshes = {};
const textLabelCache = new Map();

// Model paths for different piece types
const MODEL_PATHS = {
  'PAWN': '/models/pawn.glb',
  'ROOK': '/models/rook.glb',
  'KNIGHT': '/models/knight.glb',
  'BISHOP': '/models/bishop.glb',
  'QUEEN': '/models/queen.glb',
  'KING': '/models/king.glb',
  'JUMPER': '/models/jumper.glb',
  'SUPER_JUMPER': '/models/super_jumper.glb',
  'HYPER_JUMPER': '/models/hyper_jumper.glb',
  'SPLITTER': '/models/splitter.glb',
  'HYBRID_QUEEN': '/models/hybrid_queen.glb',
  'MISTRESS_JUMPER': '/models/mistress_jumper.glb'
};

// GLTFLoader setup
let modelLoader = null;
let hasGLTFLoader = false;

/**
 * Initialize Three.js scene, camera, renderer, and controls
 * @returns {Object} Scene components
 */
function initializeThreeJS() {
  console.log('🎬 Initializing Three.js rendering system...');
  
  // Check if Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded!');
    return null;
  }
  
  console.log('Three.js loaded successfully:', THREE);
  
  // Initialize GLTFLoader
  try {
    if (typeof THREE.GLTFLoader !== 'undefined') {
      modelLoader = new THREE.GLTFLoader();
      hasGLTFLoader = true;
      console.log('GLTFLoader initialized successfully');
    } else {
      console.warn('GLTFLoader not available');
      hasGLTFLoader = false;
    }
  } catch (error) {
    console.warn('Failed to initialize GLTFLoader:', error);
    hasGLTFLoader = false;
  }
  
  // Three.js scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a);
  document.body.appendChild(renderer.domElement);
  
  console.log('Three.js scene initialized successfully');
  
  // Setup camera controls
  setupCameraControls();
  
  return {
    scene,
    camera,
    renderer,
    controls
  };
}

/**
 * Setup camera controls (TrackballControls or OrbitControls)
 */
function setupCameraControls() {
  if (typeof THREE !== 'undefined' && THREE.TrackballControls) {
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.noPan = true;
    controls.minDistance = 8;
    controls.maxDistance = 15;
    controls.rotateSpeed = 1.8;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = true;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    console.log('TrackballControls initialized');
  } else if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
    console.log('Using OrbitControls as fallback');
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 15;
    console.log('OrbitControls initialized');
  } else {
    console.warn('No camera controls available');
  }
}

/**
 * Manual camera control system
 */
class ManualCameraControls {
  constructor(camera) {
    this.camera = camera;
    this.cameraDistance = 12;
    this.cameraAngleX = 0;
    this.cameraAngleY = 0.5;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseSensitivity = 0.005;
    this.zoomSensitivity = 0.5;
    this.minDistance = 8;
    this.maxDistance = 20;
    
    this.updateCameraPosition();
  }
  
  updateCameraPosition() {
    this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
    this.camera.position.y = this.cameraDistance * Math.sin(this.cameraAngleY);
    this.camera.position.z = this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
    this.camera.lookAt(0, 0, 0);
  }
  
  onMouseDown(event) {
    this.isDragging = true;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }
  
  onMouseMove(event) {
    if (!this.isDragging) return;
    
    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;
    
    this.cameraAngleX += deltaX * this.mouseSensitivity;
    this.cameraAngleY -= deltaY * this.mouseSensitivity;
    
    // Clamp vertical angle
    this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));
    
    this.updateCameraPosition();
    
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }
  
  onMouseUp() {
    this.isDragging = false;
  }
  
  onWheel(event) {
    const delta = event.deltaY * this.zoomSensitivity * 0.01;
    this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance + delta));
    this.updateCameraPosition();
  }
}

/**
 * Initialize manual camera controls
 * @param {THREE.Camera} cameraInstance - Camera to control
 * @returns {ManualCameraControls} Manual camera controls instance
 */
function initializeManualCameraControls(cameraInstance = camera) {
  if (!cameraInstance) return null;
  
  manualCameraControls = new ManualCameraControls(cameraInstance);
  return manualCameraControls;
}

/**
 * Create the game board (sphere with grid)
 */
function createGameBoard() {
  if (!scene) {
    console.error('Scene not initialized');
    return;
  }
  
  console.log('🌍 Creating game board...');
  
  const globeRadius = 5;
  
  // Position camera
  camera.position.set(5, 5, 10);
  camera.lookAt(0, 0, 0);
  
  // Create main sphere
  const sphereGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a4a3a,
    wireframe: false,
    transparent: true,
    opacity: 0.8
  });
  
  const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
  scene.add(globe);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);
  
  // Create polar caps
  createPolarCaps(globeRadius);
  
  // Create latitude rings
  createLatitudeRings(globeRadius);
  
  console.log('🌍 Game board created successfully');
}

/**
 * Create polar caps for the sphere
 * @param {number} globeRadius - Radius of the main sphere
 */
function createPolarCaps(globeRadius) {
  // North polar cap
  const northCapGeometry = new THREE.CircleGeometry(globeRadius * 0.08, 32);
  const northCapMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const northCap = new THREE.Mesh(northCapGeometry, northCapMaterial);
  northCap.position.set(0, globeRadius + 0.01, 0);
  northCap.rotation.x = -Math.PI / 2;
  scene.add(northCap);
  
  // South polar cap
  const southCapGeometry = new THREE.CircleGeometry(globeRadius * 0.08, 32);
  const southCapMaterial = new THREE.MeshBasicMaterial({
    color: 0x87ceeb,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const southCap = new THREE.Mesh(southCapGeometry, southCapMaterial);
  southCap.position.set(0, -globeRadius - 0.01, 0);
  southCap.rotation.x = Math.PI / 2;
  scene.add(southCap);
}

/**
 * Create latitude rings on the sphere
 * @param {number} globeRadius - Radius of the main sphere
 */
function createLatitudeRings(globeRadius) {
  const ringLatitudes = [-60, -30, 0, 30, 60];
  
  ringLatitudes.forEach(ringPhiDeg => {
    const ringPhi = THREE.MathUtils.degToRad(ringPhiDeg);
    const ringY = globeRadius * Math.sin(ringPhi);
    const ringRadius = globeRadius * Math.cos(ringPhi);
    
    // Create curved ring section using SphereGeometry to follow sphere surface
    const curvedSegmentGeometry = new THREE.SphereGeometry(
      globeRadius + 0.005,
      64,
      8,
      0,
      Math.PI * 2,
      Math.PI/2 + ringPhi - 0.02,
      0.04
    );
    
    const curvedSegmentMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a6b5a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const curvedSegment = new THREE.Mesh(curvedSegmentGeometry, curvedSegmentMaterial);
    curvedSegment.position.set(0, 0, 0);
    scene.add(curvedSegment);
    
    // Create ring borders
    const borderGeometry = new THREE.SphereGeometry(
      globeRadius + 0.008,
      64,
      4,
      0,
      Math.PI * 2,
      Math.PI/2 + ringPhi - 0.01,
      0.02
    );
    
    const borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x6a8b7a,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    scene.add(border);
    
    // Additional ring border for emphasis
    const ringBorderGeometry = new THREE.SphereGeometry(
      globeRadius + 0.006,
      64,
      2,
      0,
      Math.PI * 2,
      Math.PI/2 + ringPhi - 0.005,
      0.01
    );
    
    const ringBorderMaterial = new THREE.MeshBasicMaterial({
      color: 0x8aab9a,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const ringBorder = new THREE.Mesh(ringBorderGeometry, ringBorderMaterial);
    scene.add(ringBorder);
  });
}

/**
 * Load a 3D model with caching
 * @param {string} pieceType - Type of piece to load
 * @returns {Promise<Object|null>} Loaded GLTF model or null
 */
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

/**
 * Preload all models with progress tracking
 * @returns {Promise<void>}
 */
async function preloadModels() {
  console.log('Preloading all 3D models...');
  const pieceTypes = Object.keys(MODEL_PATHS);
  
  // Update UI with loading status
  const gameInfoEl = document.getElementById('game-info');
  if (gameInfoEl) {
    gameInfoEl.textContent = 'Loading 3D models...';
  }
  
  let loadedCount = 0;
  const totalCount = pieceTypes.length;
  
  const loadPromises = pieceTypes.map(async (pieceType) => {
    try {
      await loadModel(pieceType);
      loadedCount++;
      
      // Update progress
      const progress = Math.round((loadedCount / totalCount) * 100);
      if (gameInfoEl) {
        gameInfoEl.textContent = `Loading 3D models... ${progress}% (${loadedCount}/${totalCount})`;
      }
      
      console.log(`Preloaded ${pieceType} (${loadedCount}/${totalCount})`);
    } catch (error) {
      console.error(`Failed to preload ${pieceType}:`, error);
      loadedCount++;
    }
  });
  
  await Promise.all(loadPromises);
  
  if (gameInfoEl) {
    gameInfoEl.textContent = '3D models loaded successfully!';
    setTimeout(() => {
      if (gameInfoEl) {
        gameInfoEl.textContent = '';
      }
    }, 2000);
  }
  
  console.log('All models preloaded successfully');
}

/**
 * Get appropriate scale for GLB models
 * @param {string} pieceType - Type of piece
 * @returns {number} Scale factor
 */
function getModelScale(pieceType) {
  const scaleMap = {
    'KING': 0.5,
    'QUEEN': 0.45,
    'ROOK': 0.4,
    'KNIGHT': 0.4,
    'BISHOP': 0.4,
    'PAWN': 0.35,
    'JUMPER': 0.42,
    'SUPER_JUMPER': 0.46,
    'HYPER_JUMPER': 0.5,
    'SPLITTER': 0.38,
    'HYBRID_QUEEN': 0.48,
    'MISTRESS_JUMPER': 0.52
  };
  
  return scaleMap[pieceType] || 0.4;
}

/**
 * Create cached text label
 * @param {string} symbol - Symbol to display
 * @returns {THREE.CanvasTexture} Text label texture
 */
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

/**
 * Create piece mesh with optimized loading
 * @param {Object} piece - Piece data
 * @returns {Promise<THREE.Object3D>} Created mesh
 */
async function createPieceMeshOptimized(piece) {
  const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
  if (!gameState) {
    console.error('Game state not available for piece mesh creation');
    return null;
  }
  
  const player = gameState.players[piece.playerId];
  const getWorldPosition = typeof window !== 'undefined' && window.getWorldPosition ? window.getWorldPosition : 
                          (row, col) => ({ x: col, y: 0, z: row });
  const position = getWorldPosition(piece.row, piece.col);
  
  // Get player index for consistent coloring
  const playerIndex = player.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(piece.playerId);
  
  console.log(`Creating piece ${piece.type} for player ${player.name} (index: ${playerIndex})`);
  
  let mesh;
  
  // Try to load GLB model with caching
  try {
    const performanceOptimizer = typeof getPerformanceOptimizer === 'function' ? getPerformanceOptimizer() : null;
    const gltf = performanceOptimizer ? await performanceOptimizer.getCachedModel(piece.type) : await loadModel(piece.type);
    
    if (gltf && gltf.scene) {
      console.log(`Using cached GLB model for ${piece.type}`);
      
      // Clone the model scene
      mesh = gltf.scene.clone();
      
      // Apply player color tinting to materials and set userData for click detection
      const playerColor = typeof getPieceColorForPlayer === 'function' ? 
                         getPieceColorForPlayer(piece, player, playerIndex) : 0xff0000;
      
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
      // Fallback to geometric shapes
      console.log(`Using geometric fallback for ${piece.type}`);
      mesh = createGeometricPiece(piece, player, playerIndex);
    }
  } catch (error) {
    console.error(`Error loading model for ${piece.type}:`, error);
    mesh = createGeometricPiece(piece, player, playerIndex);
  }
  
  // Set position
  mesh.position.set(position.x, position.y, position.z);
  
  // Set userData for click detection
  mesh.userData.piece = piece;
  mesh.userData.pieceId = piece.id;
  
  // Add text label
  addTextLabel(mesh, piece);
  
  // Add evolution points label (skip for King pieces)
  if (piece.type !== 'KING') {
    addEvolutionPointsLabel(mesh, piece);
  }
  
  // Add to scene and cache
  scene.add(mesh);
  pieceMeshes[piece.id] = mesh;
  
  console.log(`Successfully created mesh for piece ${piece.id}`);
  return mesh;
}

/**
 * Create geometric fallback piece
 * @param {Object} piece - Piece data
 * @param {Object} player - Player data
 * @param {number} playerIndex - Player index
 * @returns {THREE.Mesh} Geometric mesh
 */
function createGeometricPiece(piece, player, playerIndex) {
  // Create basic geometric shape based on piece type
  let geometry;
  
  switch (piece.type) {
    case 'KING':
      geometry = new THREE.ConeGeometry(0.3, 0.8, 8);
      break;
    case 'QUEEN':
      geometry = new THREE.ConeGeometry(0.25, 0.7, 8);
      break;
    case 'ROOK':
      geometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
      break;
    case 'BISHOP':
      geometry = new THREE.ConeGeometry(0.2, 0.6, 6);
      break;
    case 'KNIGHT':
      geometry = new THREE.BoxGeometry(0.3, 0.5, 0.5);
      break;
    case 'PAWN':
      geometry = new THREE.SphereGeometry(0.15, 8, 8);
      break;
    default:
      geometry = new THREE.BoxGeometry(0.3, 0.5, 0.3);
  }
  
  // Get material with caching
  const performanceOptimizer = typeof getPerformanceOptimizer === 'function' ? getPerformanceOptimizer() : null;
  const playerColor = typeof getPlayerColor === 'function' ? getPlayerColor(piece.playerId, playerIndex) : 0xff0000;
  
  let material;
  if (performanceOptimizer) {
    material = performanceOptimizer.getCachedMaterial('standard', {
      color: playerColor,
      metalness: 0.4,
      roughness: 0.6
    });
  } else {
    material = new THREE.MeshStandardMaterial({
      color: playerColor,
      metalness: 0.4,
      roughness: 0.6
    });
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  console.log(`Material applied with color:`, material.color.getHex().toString(16));
  
  return mesh;
}

/**
 * Add text label to piece mesh
 * @param {THREE.Object3D} mesh - Piece mesh
 * @param {Object} piece - Piece data
 */
function addTextLabel(mesh, piece) {
  const pieceSymbols = typeof getPieceSymbols === 'function' ? getPieceSymbols() : {};
  const symbol = pieceSymbols[piece.type] || piece.type[0];
  
  const labelTexture = createCachedTextLabel(symbol);
  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(0.8, 0.4, 1);
  label.position.set(0, 0.8, 0);
  label.userData = { isLabel: true };
  label.raycast = function() {}; // Disable raycasting for labels
  
  mesh.add(label);
}

/**
 * Add evolution points label to piece mesh
 * @param {THREE.Object3D} mesh - Piece mesh
 * @param {Object} piece - Piece data
 */
function addEvolutionPointsLabel(mesh, piece) {
  console.log('🎯 Creating evolution points label for piece:', piece.id);
  
  const getEvolutionPointsForPiece = typeof window !== 'undefined' && window.getEvolutionPointsForPiece ? 
                                    window.getEvolutionPointsForPiece : () => 1;
  const createEvolutionPointsLabel = typeof window !== 'undefined' && window.createEvolutionPointsLabel ? 
                                    window.createEvolutionPointsLabel : null;
  
  const evolutionPoints = getEvolutionPointsForPiece(piece);
  console.log('🎯 Evolution points retrieved:', evolutionPoints);
  
  if (createEvolutionPointsLabel) {
    const evolutionLabelTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    console.log('🎯 Evolution label texture created:', evolutionLabelTexture);
    
    if (evolutionLabelTexture) {
      const evolutionLabelMaterial = new THREE.SpriteMaterial({ map: evolutionLabelTexture });
      const evolutionLabel = new THREE.Sprite(evolutionLabelMaterial);
      evolutionLabel.scale.set(1.0, 0.5, 1);
      evolutionLabel.position.set(0, 1.2, 0);
      console.log('🎯 Evolution label positioned at:', evolutionLabel.position, 'with scale:', evolutionLabel.scale);
      evolutionLabel.userData = { isEvolutionLabel: true };
      evolutionLabel.raycast = function() {}; // Disable raycasting for evolution labels
      
      mesh.add(evolutionLabel);
      console.log('🎯 Evolution label added to mesh, total children:', mesh.children.length);
    }
  }
}

/**
 * Update piece mesh position and properties
 * @param {Object} piece - Updated piece data
 */
function updatePieceMeshOptimized(piece) {
  const mesh = pieceMeshes[piece.id];
  if (!mesh) return;
  
  const getWorldPosition = typeof window !== 'undefined' && window.getWorldPosition ? window.getWorldPosition : 
                          (row, col) => ({ x: col, y: 0, z: row });
  const position = getWorldPosition(piece.row, piece.col);
  
  // Update position
  mesh.position.set(position.x, position.y, position.z);
  
  // Update evolution points label if it exists
  const evolutionLabel = mesh.children.find(child => child.userData && child.userData.isEvolutionLabel);
  if (evolutionLabel) {
    const getEvolutionPointsForPiece = typeof window !== 'undefined' && window.getEvolutionPointsForPiece ? 
                                      window.getEvolutionPointsForPiece : () => 1;
    const createEvolutionPointsLabel = typeof window !== 'undefined' && window.createEvolutionPointsLabel ? 
                                      window.createEvolutionPointsLabel : null;
    
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    if (createEvolutionPointsLabel) {
      const newTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
      if (newTexture) {
        // Dispose old texture
        if (evolutionLabel.material.map) {
          evolutionLabel.material.map.dispose();
        }
        evolutionLabel.material.map = newTexture;
        evolutionLabel.material.needsUpdate = true;
      }
    }
  }
}

/**
 * Update all visuals based on game state
 * @returns {Promise<void>}
 */
async function updateVisuals() {
  console.log('🔧 updateVisuals called');
  
  const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
  if (!gameState) {
    console.error('Game state not available for visual update');
    return;
  }
  
  console.log('🔧 gameState.pieces:', gameState.pieces);
  console.log('🔧 Number of pieces in gameState:', Object.keys(gameState.pieces || {}).length);
  console.log('🔧 Current pieceMeshes:', Object.keys(pieceMeshes));
  
  // Remove pieces that no longer exist
  Object.keys(pieceMeshes).forEach(pieceId => {
    if (!gameState.pieces[pieceId]) {
      console.log(`🔧 Removing piece ${pieceId} (no longer exists)`);
      removePieceEfficient(pieceId);
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

/**
 * Delta update function for better performance
 * @param {Object} delta - Delta changes
 * @returns {Promise<void>}
 */
async function updateVisualsDelta(delta) {
  // Remove pieces
  delta.removedPieces.forEach(pieceId => {
    removePieceEfficient(pieceId);
  });
  
  // Add new pieces
  const addPromises = delta.addedPieces.map(async piece => {
    await createPieceMeshOptimized(piece);
  });
  
  // Update existing pieces
  delta.updatedPieces.forEach(piece => {
    updatePieceMeshOptimized(piece);
  });
  
  await Promise.all(addPromises);
}

/**
 * Remove piece efficiently with proper cleanup
 * @param {string} pieceId - ID of piece to remove
 */
function removePieceEfficient(pieceId) {
  const mesh = pieceMeshes[pieceId];
  if (!mesh) return;
  
  // Remove from scene
  scene.remove(mesh);
  
  // Dispose of geometries and materials
  mesh.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  
  // Remove from cache
  delete pieceMeshes[pieceId];
  
  console.log(`🗑️ Removed piece ${pieceId} from scene`);
}

/**
 * Render loop function
 */
function renderLoop() {
  requestAnimationFrame(renderLoop);
  
  // Update controls
  if (controls && controls.update) {
    controls.update();
  }
  
  // Render the scene
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/**
 * Handle window resize
 */
function handleWindowResize() {
  if (!camera || !renderer) return;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Get scene components
 * @returns {Object} Scene, camera, renderer, controls
 */
function getSceneComponents() {
  return {
    scene,
    camera,
    renderer,
    controls,
    manualCameraControls
  };
}

/**
 * Get piece meshes cache
 * @returns {Object} Piece meshes
 */
function getPieceMeshes() {
  return pieceMeshes;
}

/**
 * Get model cache
 * @returns {Object} Model cache
 */
function getModelCache() {
  return modelCache;
}

/**
 * Get text label cache
 * @returns {Map} Text label cache
 */
function getTextLabelCache() {
  return textLabelCache;
}

/**
 * Dispose of all rendering resources
 */
function dispose() {
  // Dispose of all piece meshes
  Object.keys(pieceMeshes).forEach(pieceId => {
    removePieceEfficient(pieceId);
  });
  
  // Dispose of cached textures
  textLabelCache.forEach(texture => {
    texture.dispose();
  });
  textLabelCache.clear();
  
  // Dispose of renderer
  if (renderer) {
    renderer.dispose();
  }
  
  console.log('🗑️ Rendering resources disposed');
}

export {
  initializeThreeJS,
  setupCameraControls,
  initializeManualCameraControls,
  ManualCameraControls,
  createGameBoard,
  createPolarCaps,
  createLatitudeRings,
  loadModel,
  preloadModels,
  getModelScale,
  createCachedTextLabel,
  createPieceMeshOptimized,
  createGeometricPiece,
  addTextLabel,
  addEvolutionPointsLabel,
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
};