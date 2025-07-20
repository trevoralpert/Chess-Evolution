// Performance Optimization System Module
// Handles caching, throttling, delta updates, and performance monitoring

import { getWorldPosition } from './mathUtils.js';

export class PerformanceOptimizer {
  constructor(dependencies = {}) {
    // Injected dependencies to avoid global variable coupling
    this.scene = dependencies.scene || null;
    this.pieceMeshes = dependencies.pieceMeshes || {};
    this.loadModelFunction = dependencies.loadModel || null;
    
    // Cache systems
    this.modelCache = new Map(); // Cache for GLB models
    this.geometryCache = new Map(); // Cache for geometries
    this.materialCache = new Map(); // Cache for materials
    this.pooledObjects = new Map(); // Object pools for reuse
    
    // Performance monitoring
    this.lastGameState = null; // For delta updates
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.fps = 0;
    this.memoryUsage = 0;
    this.renderQueue = []; // Queue for batched updates
    this.updateThrottles = new Map(); // Throttled update functions
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
  }
  
  // Set dependencies after construction (for cases where they're not available during construction)
  setDependencies(dependencies) {
    if (dependencies.scene) this.scene = dependencies.scene;
    if (dependencies.pieceMeshes) this.pieceMeshes = dependencies.pieceMeshes;
    if (dependencies.loadModel) this.loadModelFunction = dependencies.loadModel;
  }
  
  initPerformanceMonitoring() {
    // FPS monitoring
    setInterval(() => {
      const now = performance.now();
      const deltaTime = now - this.lastFPSUpdate;
      this.fps = Math.round(1000 / deltaTime * this.frameCount);
      this.frameCount = 0;
      this.lastFPSUpdate = now;
      
      // Memory usage monitoring
      if (performance.memory) {
        this.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      }
      
      // Update performance UI
      this.updatePerformanceUI();
    }, 1000);
  }
  
  updatePerformanceUI() {
    const perfElement = document.getElementById('performance-info');
    if (perfElement && this.scene) {
      perfElement.innerHTML = `
        <div>FPS: ${this.fps}</div>
        <div>Memory: ${this.memoryUsage}MB</div>
        <div>Objects: ${this.scene.children.length}</div>
        <div>Pieces: ${Object.keys(this.pieceMeshes).length}</div>
      `;
    }
  }
  
  // Throttled update functions
  createThrottledFunction(key, func, delay = 100) {
    if (!this.updateThrottles.has(key)) {
      this.updateThrottles.set(key, {
        timeout: null,
        lastCall: 0
      });
    }
    
    const throttle = this.updateThrottles.get(key);
    const now = Date.now();
    
    if (now - throttle.lastCall >= delay) {
      throttle.lastCall = now;
      func();
    } else {
      clearTimeout(throttle.timeout);
      throttle.timeout = setTimeout(() => {
        throttle.lastCall = Date.now();
        func();
      }, delay - (now - throttle.lastCall));
    }
  }
  
  // Model caching system
  async getCachedModel(pieceType) {
    if (this.modelCache.has(pieceType)) {
      return this.modelCache.get(pieceType);
    }
    
    if (!this.loadModelFunction) {
      console.warn('No loadModel function provided to PerformanceOptimizer');
      return null;
    }
    
    try {
      const model = await this.loadModelFunction(pieceType);
      this.modelCache.set(pieceType, model);
      return model;
    } catch (error) {
      console.warn(`Failed to load model for ${pieceType}:`, error);
      return null;
    }
  }
  
  // Geometry caching
  getCachedGeometry(type, params) {
    const key = `${type}_${JSON.stringify(params)}`;
    if (this.geometryCache.has(key)) {
      return this.geometryCache.get(key);
    }
    
    let geometry;
    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(params.radius, params.widthSegments, params.heightSegments);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(params.width, params.height, params.depth);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(params.radiusTop, params.radiusBottom, params.height);
        break;
      default:
        return null;
    }
    
    this.geometryCache.set(key, geometry);
    return geometry;
  }
  
  // Material caching
  getCachedMaterial(type, params) {
    const key = `${type}_${JSON.stringify(params)}`;
    if (this.materialCache.has(key)) {
      return this.materialCache.get(key);
    }
    
    let material;
    switch (type) {
      case 'standard':
        material = new THREE.MeshStandardMaterial(params);
        break;
      case 'basic':
        material = new THREE.MeshBasicMaterial(params);
        break;
      case 'lambert':
        material = new THREE.MeshLambertMaterial(params);
        break;
      default:
        return null;
    }
    
    this.materialCache.set(key, material);
    return material;
  }
  
  // Object pooling
  getPooledObject(type) {
    const pool = this.pooledObjects.get(type) || [];
    if (pool.length > 0) {
      return pool.pop();
    }
    return null;
  }
  
  returnToPool(type, object) {
    // Reset object state
    object.position.set(0, 0, 0);
    object.rotation.set(0, 0, 0);
    object.scale.set(1, 1, 1);
    object.visible = true;
    
    const pool = this.pooledObjects.get(type) || [];
    pool.push(object);
    this.pooledObjects.set(type, pool);
  }
  
  // Delta update system
  processDeltaUpdate(newGameState) {
    if (!this.lastGameState) {
      this.lastGameState = JSON.parse(JSON.stringify(newGameState));
      return { fullUpdate: true };
    }
    
    const delta = {
      addedPieces: [],
      removedPieces: [],
      movedPieces: [],
      updatedPlayers: []
    };
    
    // Check for piece changes
    const oldPieces = this.lastGameState.pieces || {};
    const newPieces = newGameState.pieces || {};
    
    // Find removed pieces
    Object.keys(oldPieces).forEach(pieceId => {
      if (!newPieces[pieceId]) {
        delta.removedPieces.push(pieceId);
      }
    });
    
    // Find added and moved pieces
    Object.keys(newPieces).forEach(pieceId => {
      if (!oldPieces[pieceId]) {
        delta.addedPieces.push(newPieces[pieceId]);
      } else {
        const oldPiece = oldPieces[pieceId];
        const newPiece = newPieces[pieceId];
        
        if (oldPiece.row !== newPiece.row || 
            oldPiece.col !== newPiece.col ||
            oldPiece.type !== newPiece.type) {
          delta.movedPieces.push(newPiece);
        }
      }
    });
    
    // Check for player changes
    const oldPlayers = this.lastGameState.players || {};
    const newPlayers = newGameState.players || {};
    
    Object.keys(newPlayers).forEach(playerId => {
      if (!oldPlayers[playerId] || 
          JSON.stringify(oldPlayers[playerId]) !== JSON.stringify(newPlayers[playerId])) {
        delta.updatedPlayers.push(newPlayers[playerId]);
      }
    });
    
    this.lastGameState = JSON.parse(JSON.stringify(newGameState));
    return delta;
  }
  
  // Batched rendering updates
  queueRenderUpdate(type, data) {
    this.renderQueue.push({ type, data, timestamp: Date.now() });
  }
  
  processRenderQueue() {
    const batch = this.renderQueue.splice(0, 10); // Process 10 items per frame
    
    batch.forEach(item => {
      switch (item.type) {
        case 'piece_update':
          this.updatePieceEfficient(item.data);
          break;
        case 'piece_remove':
          this.removePieceEfficient(item.data);
          break;
        case 'effect_create':
          this.createEffectEfficient(item.data);
          break;
      }
    });
    
    if (this.renderQueue.length > 0) {
      requestAnimationFrame(() => this.processRenderQueue());
    }
  }
  
  // Efficient piece updates
  updatePieceEfficient(piece) {
    const mesh = this.pieceMeshes[piece.id];
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
  
  removePieceEfficient(pieceId) {
    const mesh = this.pieceMeshes[pieceId];
    if (mesh && this.scene) {
      this.scene.remove(mesh);
      
      // Dispose of geometries and materials
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      delete this.pieceMeshes[pieceId];
    }
  }
  
  // Clear piece cache and remove all pieces from scene
  clearPieceCache() {
    console.log('🧹 Clearing piece cache to force color updates');
    Object.keys(this.pieceMeshes).forEach(pieceId => {
      const mesh = this.pieceMeshes[pieceId];
      if (mesh && this.scene) {
        this.scene.remove(mesh);
        
        // Dispose of geometries and materials
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
      delete this.pieceMeshes[pieceId];
    });
  }

  // Memory cleanup
  cleanup() {
    // Clear caches
    this.modelCache.clear();
    this.geometryCache.forEach(geometry => geometry.dispose());
    this.geometryCache.clear();
    this.materialCache.forEach(material => material.dispose());
    this.materialCache.clear();
    
    // Clear pools
    this.pooledObjects.forEach(pool => {
      pool.forEach(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    });
    this.pooledObjects.clear();
    
    // Clear throttles
    this.updateThrottles.forEach(throttle => {
      if (throttle.timeout) clearTimeout(throttle.timeout);
    });
    this.updateThrottles.clear();
  }
}