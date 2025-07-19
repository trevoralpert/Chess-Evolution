// Performance optimization system for EvoChess
// Handles caching, batching, and efficient rendering updates

class PerformanceOptimizer {
  constructor() {
    this.modelCache = new Map();
    this.geometryCache = new Map();
    this.materialCache = new Map();
    this.pooledObjects = new Map();
    this.updateThrottles = new Map();
    this.renderQueue = [];
    this.lastGameState = null;
    this.frameCount = 0;
    this.lastFPSUpdate = 0;
    this.fps = 0;
    this.memoryUsage = 0;
    
    // Initialize performance monitoring
    this.initPerformanceMonitoring();
    
    // Start processing render queue
    this.processRenderQueue();
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
    if (perfElement && typeof pieceMeshes !== 'undefined') {
      perfElement.textContent = `FPS: ${this.fps} | Memory: ${this.memoryUsage}MB | Objects: ${Object.keys(pieceMeshes).length}`;
    } else if (perfElement) {
      perfElement.textContent = `FPS: ${this.fps} | Memory: ${this.memoryUsage}MB`;
    }
  }
  
  // Throttled function creation
  createThrottledFunction(key, func, delay = 100) {
    if (this.updateThrottles.has(key)) {
      clearTimeout(this.updateThrottles.get(key).timeout);
    }
    
    const timeout = setTimeout(() => {
      func();
      this.updateThrottles.delete(key);
    }, delay);
    
    this.updateThrottles.set(key, { timeout, func });
  }
  
  // Model caching
  getCachedModel(url) {
    return this.modelCache.get(url) || null;
  }
  
  setCachedModel(url, model) {
    this.modelCache.set(url, model);
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
        geometry = new THREE.SphereGeometry(
          params.radius || 1,
          params.widthSegments || 8,
          params.heightSegments || 6
        );
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(
          params.width || 1,
          params.height || 1,
          params.depth || 1
        );
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          params.radiusTop || 1,
          params.radiusBottom || 1,
          params.height || 1,
          params.radialSegments || 8
        );
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(
          params.radius || 1,
          params.height || 1,
          params.radialSegments || 8
        );
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
  
  // Efficient piece updates (these methods need external dependencies)
  updatePieceEfficient(piece) {
    // This method will need to be moved or refactored as it depends on:
    // - pieceMeshes global variable
    // - getWorldPosition function
    // - THREE.js objects
    console.warn('updatePieceEfficient called but requires external dependencies');
  }
  
  removePieceEfficient(pieceId) {
    // This method will need to be moved or refactored as it depends on:
    // - pieceMeshes global variable
    // - scene global variable
    console.warn('removePieceEfficient called but requires external dependencies');
  }
  
  // Clear piece cache and remove all pieces from scene
  clearPieceCache() {
    // This method will need to be moved or refactored as it depends on:
    // - pieceMeshes global variable
    // - scene global variable
    console.warn('clearPieceCache called but requires external dependencies');
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

export { PerformanceOptimizer };