// Game State Manager Module
export class GameStateManager {
  constructor() {
    this.gameState = {
      players: {},
      pieces: {},
      currentTurn: null,
      gameStatus: 'waiting'
    };
    this.pieceMeshes = {};
    this.validMoves = [];
    this.selectedPieceId = null;
    this.performanceOptimizer = null;
  }

  initialize() {
    console.log('🎯 Initializing Game State Manager...');
    
    // Initialize performance optimizer
    this.performanceOptimizer = new PerformanceOptimizer();
    
    // Listen for game state updates from socket
    document.addEventListener('gameStateUpdate', (event) => {
      this.handleGameStateUpdate(event.detail.gameState);
    });
    
    // Listen for move-related events
    document.addEventListener('validMovesReceived', (event) => {
      this.handleValidMovesReceived(event.detail);
    });
    
    document.addEventListener('moveResult', (event) => {
      this.handleMoveResult(event.detail);
    });
    
    document.addEventListener('pieceEvolution', (event) => {
      this.handlePieceEvolution(event.detail);
    });
    
    console.log('✅ Game State Manager initialized');
  }

  async handleGameStateUpdate(newGameState) {
    console.log('🔄 Processing game state update:', newGameState);
    console.log('🔄 Players in received state:', Object.keys(newGameState.players || {}));
    console.log('🔄 Pieces in received state:', Object.keys(newGameState.pieces || {}));
    console.log('🔄 Number of pieces received:', Object.keys(newGameState.pieces || {}).length);
    
    // Process delta updates for performance
    const delta = this.performanceOptimizer.processDeltaUpdate(newGameState);
    
    if (delta.fullUpdate) {
      // Full update on first load
      console.log('🔄 Processing full update');
      this.gameState = newGameState;
      
      // Evolution points are now included in the game state from the server
      Object.keys(this.gameState.players).forEach(playerId => {
        const evolutionPoints = this.gameState.players[playerId].evolutionPoints;
        console.log(`🎯 Player ${playerId} has ${evolutionPoints} evolution points from server`);
      });
      
      console.log('🎮 About to call updateVisuals() with pieces:', Object.keys(this.gameState.pieces || {}));
      await this.updateVisuals();
      console.log('🎮 updateVisuals() completed, rendered meshes:', Object.keys(this.pieceMeshes));
      this.updateUI();
      console.log('🔄 Full update completed');
    } else {
      // Delta update - only update changed elements
      console.log('🔄 Processing delta update');
      this.gameState = newGameState;
      await this.updateVisualsDelta(delta);
      
      // Always call updateUI immediately for player count changes
      this.updateUI();
      
      // Update evolution point labels when game state changes
      this.updateAllEvolutionPointLabels();
      
      // Throttled UI updates for other elements
      this.performanceOptimizer.createThrottledFunction('ui-update', () => {
        this.updateUI();
      }, 200);
    }
    
    console.log('Game state updated:', this.gameState);
    console.log('Players in game state:', Object.keys(this.gameState.players || {}));
    console.log('Pieces in game state:', Object.keys(this.gameState.pieces || {}));
  }

  handleValidMovesReceived(data) {
    // Only show moves if this is for the currently selected piece
    if (data.pieceId === this.selectedPieceId) {
      this.validMoves = data.moves;
      
      // Check if this is a Hybrid Queen with dual movement
      const selectedPiece = this.gameState.pieces[this.selectedPieceId];
      if (selectedPiece && selectedPiece.type === 'HYBRID_QUEEN' && data.moves.length > 0) {
        document.dispatchEvent(new CustomEvent('showDualMovementUI'));
      }
      
      document.dispatchEvent(new CustomEvent('highlightValidMoves', {
        detail: { moves: this.validMoves }
      }));
    }
  }

  handleMoveResult(data) {
    if (data.success) {
      console.log('Move successful:', data.message);
      this.selectedPieceId = null;
      this.validMoves = [];
      
      document.dispatchEvent(new CustomEvent('clearValidMoveHighlights'));
      document.dispatchEvent(new CustomEvent('clearSelectionHighlight'));
      document.dispatchEvent(new CustomEvent('hideDualMovementUI'));
    } else {
      console.error('Move failed:', data.error);
      document.dispatchEvent(new CustomEvent('showNotification', {
        detail: { message: data.error, color: '#ff0000', duration: 3000 }
      }));
    }
  }

  async handlePieceEvolution(data) {
    const { pieceId, oldType, newType, position } = data;
    console.log(`🔄 Piece evolution: ${oldType} → ${newType} for piece ${pieceId}`);
    
    // Get the piece from game state
    const piece = this.gameState.pieces[pieceId];
    if (piece) {
      console.log(`🔄 Updating visual mesh for piece evolution: ${pieceId} from ${oldType} to ${newType}`);
      
      // Emit event for piece mesh manager to handle visual update
      document.dispatchEvent(new CustomEvent('updatePieceMesh', {
        detail: { piece, preserveColor: true }
      }));
    }
  }

  async updateVisuals() {
    console.log('🎨 Updating all visuals...');
    
    if (!this.gameState || !this.gameState.pieces) {
      console.log('⚠️ No game state or pieces to render');
      return;
    }
    
    const pieces = Object.values(this.gameState.pieces);
    console.log(`🎨 Rendering ${pieces.length} pieces:`, pieces.map(p => `${p.type}@(${p.row},${p.col})`));
    
    // Create or update all piece meshes
    for (const piece of pieces) {
      await this.createOrUpdatePieceMesh(piece);
    }
    
    // Remove meshes for pieces that no longer exist
    const existingPieceIds = new Set(Object.keys(this.gameState.pieces));
    for (const pieceId in this.pieceMeshes) {
      if (!existingPieceIds.has(pieceId)) {
        this.removePieceMesh(pieceId);
      }
    }
    
    console.log('✅ Visual update completed');
  }

  async updateVisualsDelta(delta) {
    console.log('🎨 Processing delta visual update');
    
    // Update changed pieces
    for (const piece of delta.changedPieces) {
      await this.createOrUpdatePieceMesh(piece);
    }
    
    // Remove deleted pieces
    for (const pieceId of delta.removedPieces) {
      this.removePieceMesh(pieceId);
    }
  }

  async createOrUpdatePieceMesh(piece) {
    // Emit event for piece mesh manager to handle
    document.dispatchEvent(new CustomEvent('createOrUpdatePieceMesh', {
      detail: { piece }
    }));
  }

  removePieceMesh(pieceId) {
    const mesh = this.pieceMeshes[pieceId];
    if (mesh && window.gameScene) {
      window.gameScene.remove(mesh);
      
      // Clean up geometry and materials
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      
      delete this.pieceMeshes[pieceId];
      console.log(`🗑️ Removed mesh for piece ${pieceId}`);
    }
  }

  updateAllEvolutionPointLabels() {
    // Emit event for piece mesh manager to handle
    document.dispatchEvent(new CustomEvent('updateAllEvolutionPointLabels'));
  }

  updateUI() {
    console.log('🔄 Updating UI...');
    
    // Update player count
    const playerCountEl = document.getElementById('player-count');
    if (playerCountEl && this.gameState.players) {
      const playerCount = Object.keys(this.gameState.players).length;
      playerCountEl.textContent = `Players: ${playerCount}`;
    }
    
    // Update game info
    const gameInfoEl = document.getElementById('game-info');
    if (gameInfoEl) {
      if (this.gameState.currentTurn) {
        const currentPlayer = this.gameState.players[this.gameState.currentTurn];
        if (currentPlayer) {
          gameInfoEl.textContent = `${currentPlayer.name}'s turn`;
        }
      } else {
        gameInfoEl.textContent = 'Waiting for game to start...';
      }
    }
    
    // Emit UI update event for other modules
    document.dispatchEvent(new CustomEvent('uiUpdate', {
      detail: { gameState: this.gameState }
    }));
  }

  // Piece selection methods
  selectPiece(pieceId) {
    this.selectedPieceId = pieceId;
    console.log('🎯 Selected piece:', pieceId);
    
    // Request valid moves from server
    if (window.globalSocket) {
      window.globalSocket.emit('get-valid-moves', { pieceId });
    }
    
    // Highlight selected piece
    document.dispatchEvent(new CustomEvent('highlightSelectedPiece', {
      detail: { pieceId }
    }));
  }

  deselectPiece() {
    this.selectedPieceId = null;
    this.validMoves = [];
    
    document.dispatchEvent(new CustomEvent('clearSelectionHighlight'));
    document.dispatchEvent(new CustomEvent('clearValidMoveHighlights'));
    document.dispatchEvent(new CustomEvent('hideDualMovementUI'));
  }

  // Getters
  getCurrentPlayer() {
    if (!this.gameState.currentTurn) return null;
    return this.gameState.players[this.gameState.currentTurn];
  }

  getPiece(pieceId) {
    return this.gameState.pieces[pieceId];
  }

  getPlayerPieces(playerId) {
    return Object.values(this.gameState.pieces).filter(piece => piece.playerId === playerId);
  }

  isMyTurn() {
    if (!window.globalSocket) return false;
    return this.gameState.currentTurn === window.globalSocket.id;
  }
}

// Performance Optimizer Class
class PerformanceOptimizer {
  constructor() {
    this.lastGameState = null;
    this.throttledFunctions = new Map();
  }

  processDeltaUpdate(newGameState) {
    if (!this.lastGameState) {
      this.lastGameState = newGameState;
      return { fullUpdate: true };
    }

    const delta = {
      fullUpdate: false,
      changedPieces: [],
      removedPieces: []
    };

    // Find changed pieces
    for (const pieceId in newGameState.pieces) {
      const newPiece = newGameState.pieces[pieceId];
      const oldPiece = this.lastGameState.pieces[pieceId];
      
      if (!oldPiece || this.pieceChanged(oldPiece, newPiece)) {
        delta.changedPieces.push(newPiece);
      }
    }

    // Find removed pieces
    for (const pieceId in this.lastGameState.pieces) {
      if (!newGameState.pieces[pieceId]) {
        delta.removedPieces.push(pieceId);
      }
    }

    this.lastGameState = newGameState;
    return delta;
  }

  pieceChanged(oldPiece, newPiece) {
    return (
      oldPiece.row !== newPiece.row ||
      oldPiece.col !== newPiece.col ||
      oldPiece.type !== newPiece.type ||
      oldPiece.evolutionPoints !== newPiece.evolutionPoints
    );
  }

  createThrottledFunction(key, func, delay) {
    if (this.throttledFunctions.has(key)) {
      clearTimeout(this.throttledFunctions.get(key));
    }
    
    const timeoutId = setTimeout(() => {
      func();
      this.throttledFunctions.delete(key);
    }, delay);
    
    this.throttledFunctions.set(key, timeoutId);
  }
}