// Piece Mesh Manager Module
export class PieceMeshManager {
  constructor() {
    this.modelCache = {};
    this.modelLoader = null;
    this.pieceMeshes = {};
    this.textLabelCache = new Map();
    this.hasGLTFLoader = false;
    this.MODEL_PATHS = {
      PAWN: '/chess piece models/Pawn.glb',
      ROOK: '/chess piece models/Rook.glb',
      KNIGHT: '/chess piece models/Knight.glb',
      BISHOP: '/chess piece models/Bishop.glb',
      QUEEN: '/chess piece models/Queen.glb',
      KING: '/chess piece models/King.glb'
    };
    this.COLOR_MAP = {
      white: 0xffffff,
      black: 0x333333,
      red: 0xff0000,
      blue: 0x0088ff,
      green: 0x00ff00,
      yellow: 0xffff00,
      purple: 0x8800ff,
      orange: 0xff8800,
      cyan: 0x00ffff,
      magenta: 0xff00ff
    };
  }

  initialize() {
    console.log('🎨 Initializing Piece Mesh Manager...');
    
    this.initializeGLTFLoader();
    this.preloadModels();
    
    // Listen for piece mesh events
    document.addEventListener('createOrUpdatePieceMesh', (event) => {
      this.createOrUpdatePieceMesh(event.detail.piece);
    });
    
    document.addEventListener('updatePieceMesh', (event) => {
      this.updatePieceMesh(event.detail.piece, event.detail.preserveColor);
    });
    
    document.addEventListener('updateAllEvolutionPointLabels', () => {
      this.updateAllEvolutionPointLabels();
    });
    
    // Make pieceMeshes accessible to other modules
    if (window.gameStateManager) {
      window.gameStateManager.pieceMeshes = this.pieceMeshes;
    }
    
    console.log('✅ Piece Mesh Manager initialized');
  }

  initializeGLTFLoader() {
    try {
      if (typeof THREE.GLTFLoader !== 'undefined') {
        this.modelLoader = new THREE.GLTFLoader();
        this.hasGLTFLoader = true;
        console.log('✅ GLTFLoader initialized successfully');
      } else {
        console.warn('⚠️ GLTFLoader not available, using geometric pieces');
        this.hasGLTFLoader = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize GLTFLoader:', error);
      this.hasGLTFLoader = false;
    }
  }

  async preloadModels() {
    if (!this.hasGLTFLoader) {
      console.log('📦 Skipping model preload - using geometric pieces');
      return;
    }
    
    console.log('📦 Preloading 3D models...');
    
    const modelTypes = ['PAWN', 'ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING'];
    const loadPromises = modelTypes.map(type => this.loadModel(type));
    
    try {
      await Promise.all(loadPromises);
      console.log('✅ All models preloaded successfully');
    } catch (error) {
      console.warn('⚠️ Some models failed to preload, will use geometric fallbacks:', error);
    }
  }

  async loadModel(pieceType) {
    const modelPath = this.MODEL_PATHS[pieceType];
    if (!modelPath || !this.hasGLTFLoader) {
      return null;
    }

    if (this.modelCache[pieceType]) {
      return this.modelCache[pieceType];
    }

    try {
      console.log(`📦 Loading model for ${pieceType} from ${modelPath}`);
      
      const gltf = await new Promise((resolve, reject) => {
        this.modelLoader.load(
          modelPath,
          resolve,
          undefined,
          reject
        );
      });

      if (gltf && gltf.scene) {
        this.modelCache[pieceType] = gltf.scene.clone();
        console.log(`✅ Model loaded successfully for ${pieceType}`);
        return this.modelCache[pieceType];
      } else {
        throw new Error('Invalid GLTF structure');
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load model for ${pieceType}:`, error);
      return null;
    }
  }

  async createOrUpdatePieceMesh(piece) {
    console.log('🎨 Creating/updating piece mesh:', piece);
    
    const existingMesh = this.pieceMeshes[piece.id];
    if (existingMesh) {
      // Update existing mesh
      await this.updatePieceMesh(piece);
    } else {
      // Create new mesh
      await this.createPieceMesh(piece);
    }
  }

  async createPieceMesh(piece) {
    console.log(`🎨 Creating new mesh for piece ${piece.id} (${piece.type}) at (${piece.row}, ${piece.col})`);
    
    // Try to load 3D model first
    let mesh = await this.loadModel(piece.type);
    
    if (mesh) {
      // Use 3D model
      mesh = mesh.clone();
      const scale = this.getModelScale(piece.type);
      mesh.scale.setScalar(scale);
      
      // Apply height adjustment
      const heightAdjustment = this.getModelHeightAdjustment(piece.type);
      mesh.position.y += heightAdjustment;
    } else {
      // Use geometric fallback
      mesh = this.createGeometricPiece(piece.type);
    }
    
    // Set position
    const worldPos = window.sceneManager.getWorldPosition(piece.row, piece.col);
    mesh.position.copy(worldPos);
    
    // Apply color
    this.applyColorToMesh(mesh, piece);
    
    // Store piece data
    mesh.userData.pieceId = piece.id;
    mesh.userData.piece = piece;
    
    // Add evolution points label
    this.updateEvolutionPointsLabel(mesh, piece);
    
    // Add to scene and cache
    window.gameScene.add(mesh);
    this.pieceMeshes[piece.id] = mesh;
    
    console.log(`✅ Created mesh for piece ${piece.id}`);
  }

  async updatePieceMesh(piece, preserveColor = false) {
    const mesh = this.pieceMeshes[piece.id];
    if (!mesh) {
      console.warn(`⚠️ No mesh found for piece ${piece.id}, creating new one`);
      await this.createPieceMesh(piece);
      return;
    }
    
    console.log(`🔄 Updating mesh for piece ${piece.id}`);
    
    // Store original color if preserving
    let originalColor = null;
    if (preserveColor && mesh.material) {
      if (Array.isArray(mesh.material)) {
        originalColor = mesh.material[0].color.clone();
      } else {
        originalColor = mesh.material.color.clone();
      }
    }
    
    // Update position
    const worldPos = window.sceneManager.getWorldPosition(piece.row, piece.col);
    mesh.position.copy(worldPos);
    
    // Update piece data
    mesh.userData.piece = piece;
    
    // Apply color (preserve if requested)
    if (!preserveColor) {
      this.applyColorToMesh(mesh, piece);
    } else if (originalColor) {
      this.applyColorToMesh(mesh, piece, originalColor);
    }
    
    // Update evolution points label
    this.updateEvolutionPointsLabel(mesh, piece);
    
    console.log(`✅ Updated mesh for piece ${piece.id}`);
  }

  applyColorToMesh(mesh, piece, preservedColor = null) {
    if (!mesh || !piece) return;
    
    // Get player and color info
    const player = window.gameStateManager?.gameState?.players?.[piece.playerId];
    if (!player) {
      console.warn('⚠️ Player not found for piece:', piece.playerId);
      return;
    }
    
    // Determine color
    let targetColor;
    if (preservedColor) {
      targetColor = preservedColor;
    } else {
      const playerIndex = Object.keys(window.gameStateManager.gameState.players).indexOf(piece.playerId);
      targetColor = this.getPieceColorForPlayer(piece, player, playerIndex);
    }
    
    // Apply color to mesh materials
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            mat.color.copy(targetColor);
          });
        } else {
          child.material.color.copy(targetColor);
        }
      }
    });
  }

  getPieceColorForPlayer(piece, player, playerIndex) {
    // Use player's selected color if available
    if (player.color && this.COLOR_MAP[player.color]) {
      return new THREE.Color(this.COLOR_MAP[player.color]);
    }
    
    // Fallback to index-based colors
    const colors = [0xff0000, 0x0088ff, 0x00ff00, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800, 0x8800ff];
    const colorHex = colors[playerIndex % colors.length];
    return new THREE.Color(colorHex);
  }

  updateEvolutionPointsLabel(mesh, piece) {
    // Remove existing label
    const existingLabel = mesh.getObjectByName('evolutionLabel');
    if (existingLabel) {
      mesh.remove(existingLabel);
    }
    
    // Get evolution points
    const evolutionPoints = this.getEvolutionPointsForPiece(piece);
    if (evolutionPoints <= 0) return;
    
    // Create new label
    const label = this.createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    if (label) {
      label.name = 'evolutionLabel';
      label.position.set(0, 0.5, 0); // Position above the piece
      mesh.add(label);
    }
  }

  updateAllEvolutionPointLabels() {
    console.log('🔄 Updating all evolution point labels');
    
    Object.values(this.pieceMeshes).forEach(mesh => {
      const piece = mesh.userData.piece;
      if (piece) {
        this.updateEvolutionPointsLabel(mesh, piece);
      }
    });
  }

  getEvolutionPointsForPiece(piece) {
    if (!piece || !window.gameStateManager?.gameState?.players) return 0;
    
    const player = window.gameStateManager.gameState.players[piece.playerId];
    if (!player) return 0;
    
    // Evolution points are stored per piece or per player
    return piece.evolutionPoints || player.evolutionPoints || 0;
  }

  createEvolutionPointsLabel(evolutionPoints, playerId) {
    const symbol = evolutionPoints.toString();
    
    // Check cache first
    const cacheKey = `${symbol}_${playerId}`;
    if (this.textLabelCache.has(cacheKey)) {
      return this.textLabelCache.get(cacheKey).clone();
    }
    
    // Create new label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 64;
    canvas.height = 32;
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.fillStyle = '#00ff00';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(symbol, canvas.width / 2, canvas.height / 2);
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1);
    
    // Cache the sprite
    this.textLabelCache.set(cacheKey, sprite);
    
    return sprite.clone();
  }

  getModelScale(pieceType) {
    const scales = {
      PAWN: 0.3,
      ROOK: 0.35,
      KNIGHT: 0.32,
      BISHOP: 0.33,
      QUEEN: 0.38,
      KING: 0.4,
      // Evolution pieces
      SPLITTER: 0.32,
      HYBRID_QUEEN: 0.38,
      SUPER_PAWN: 0.35,
      FORTRESS: 0.4
    };
    return scales[pieceType] || 0.3;
  }

  getModelHeightAdjustment(pieceType) {
    const adjustments = {
      PAWN: 0,
      ROOK: 0.1,
      KNIGHT: 0.05,
      BISHOP: 0.08,
      QUEEN: 0.12,
      KING: 0.15
    };
    return adjustments[pieceType] || 0;
  }

  createGeometricPiece(pieceType) {
    const group = new THREE.Group();
    
    // Base geometry and material
    let geometry, material;
    
    switch (pieceType) {
      case 'PAWN':
        geometry = new THREE.SphereGeometry(0.15, 16, 16);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      case 'ROOK':
        geometry = new THREE.BoxGeometry(0.25, 0.35, 0.25);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      case 'KNIGHT':
        geometry = new THREE.ConeGeometry(0.15, 0.35, 8);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      case 'BISHOP':
        geometry = new THREE.ConeGeometry(0.12, 0.4, 8);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      case 'QUEEN':
        geometry = new THREE.SphereGeometry(0.18, 16, 16);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const crown = new THREE.ConeGeometry(0.08, 0.15, 6);
        const crownMesh = new THREE.Mesh(crown, material);
        crownMesh.position.y = 0.25;
        group.add(crownMesh);
        break;
      case 'KING':
        geometry = new THREE.CylinderGeometry(0.15, 0.18, 0.35, 8);
        material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        break;
      default:
        geometry = new THREE.SphereGeometry(0.15, 16, 16);
        material = new THREE.MeshStandardMaterial({ color: 0xff00ff });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    
    return group;
  }

  // Clean up resources
  dispose() {
    // Clean up all piece meshes
    Object.values(this.pieceMeshes).forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });
    
    // Clear caches
    this.pieceMeshes = {};
    this.modelCache = {};
    this.textLabelCache.clear();
  }
}