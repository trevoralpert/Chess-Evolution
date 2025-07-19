// Mouse and Touch Interaction Module
export class MouseInteraction {
  constructor() {
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.mouseDownTime = 0;
    this.isDragging = false;
    this.mouseStartPos = { x: 0, y: 0 };
    this.touchStartTime = 0;
    this.touchStartPos = { x: 0, y: 0 };
    this.selectedMovementMode = null;
  }

  initialize() {
    console.log('🖱️ Initializing Mouse Interaction...');
    
    this.setupMouseInteraction();
    this.setupTouchInteraction();
    
    console.log('✅ Mouse Interaction initialized');
  }

  setupMouseInteraction() {
    const canvas = window.gameRenderer ? window.gameRenderer.domElement : document.body;
    
    canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    canvas.addEventListener('contextmenu', (e) => this.onRightClick(e));
    canvas.addEventListener('click', (e) => this.onMouseClick(e));
  }

  setupTouchInteraction() {
    const canvas = window.gameRenderer ? window.gameRenderer.domElement : document.body;
    
    canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  handleMouseDown(e) {
    this.mouseDownTime = Date.now();
    this.mouseStartPos.x = e.clientX;
    this.mouseStartPos.y = e.clientY;
    this.isDragging = false;
  }

  handleMouseMove(e) {
    const deltaX = Math.abs(e.clientX - this.mouseStartPos.x);
    const deltaY = Math.abs(e.clientY - this.mouseStartPos.y);
    
    if (deltaX > 5 || deltaY > 5) {
      this.isDragging = true;
    }
    
    // Update mouse position for raycasting
    const rect = window.gameRenderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  handleMouseUp(e) {
    const clickDuration = Date.now() - this.mouseDownTime;
    
    // Only process as click if not dragging and quick click
    if (!this.isDragging && clickDuration < 300) {
      this.processClick(e.clientX, e.clientY);
    }
    
    this.isDragging = false;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.touchStartTime = Date.now();
      this.touchStartPos.x = e.touches[0].clientX;
      this.touchStartPos.y = e.touches[0].clientY;
    }
  }

  handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling
  }

  handleTouchEnd(e) {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartPos.x);
      const deltaY = Math.abs(touch.clientY - this.touchStartPos.y);
      const duration = Date.now() - this.touchStartTime;
      
      // Process as tap if small movement and quick duration
      if (deltaX < 10 && deltaY < 10 && duration < 300) {
        this.processClick(touch.clientX, touch.clientY);
      }
    }
  }

  onRightClick(event) {
    event.preventDefault();
    console.log('🖱️ Right click detected - deselecting piece');
    
    // Deselect current piece
    document.dispatchEvent(new CustomEvent('deselectPiece'));
    
    return false;
  }

  onMouseClick(event) {
    // Prevent default click behavior during dragging
    if (this.isDragging) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }

  processClick(clientX, clientY) {
    // Update mouse coordinates for raycasting
    const rect = window.gameRenderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Perform raycasting
    this.raycaster.setFromCamera(this.mouse, window.gameCamera);
    
    // Check for piece intersections first
    const pieceIntersects = this.raycastPieces();
    if (pieceIntersects.length > 0) {
      this.handlePieceClick(pieceIntersects[0]);
      return;
    }
    
    // Check for grid square intersections
    const gridIntersects = this.raycastGridSquares();
    if (gridIntersects.length > 0) {
      this.handleGridClick(gridIntersects[0]);
      return;
    }
    
    // Click on empty space - deselect
    document.dispatchEvent(new CustomEvent('deselectPiece'));
  }

  raycastPieces() {
    if (!window.gameStateManager || !window.gameStateManager.pieceMeshes) {
      return [];
    }
    
    const pieceMeshes = Object.values(window.gameStateManager.pieceMeshes);
    return this.raycaster.intersectObjects(pieceMeshes, true);
  }

  raycastGridSquares() {
    if (!window.sceneManager || !window.sceneManager.gridSquares) {
      return [];
    }
    
    return this.raycaster.intersectObjects(window.sceneManager.gridSquares);
  }

  handlePieceClick(intersection) {
    // Find the piece mesh in the hierarchy
    let pieceMesh = intersection.object;
    while (pieceMesh.parent && !pieceMesh.userData.pieceId) {
      pieceMesh = pieceMesh.parent;
    }
    
    const pieceId = pieceMesh.userData.pieceId;
    if (!pieceId) {
      console.warn('⚠️ Clicked piece mesh has no pieceId');
      return;
    }
    
    console.log('🎯 Piece clicked:', pieceId);
    
    // Get the piece data
    const piece = window.gameStateManager.getPiece(pieceId);
    if (!piece) {
      console.warn('⚠️ Piece not found in game state:', pieceId);
      return;
    }
    
    // Check if it's the player's piece and their turn
    const isMyPiece = piece.playerId === window.globalSocket?.id;
    const isMyTurn = window.gameStateManager.isMyTurn();
    
    if (isMyPiece && isMyTurn) {
      // Select the piece
      document.dispatchEvent(new CustomEvent('selectPiece', {
        detail: { pieceId }
      }));
    } else {
      console.log('⚠️ Cannot select piece - not your piece or not your turn');
      document.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          message: isMyTurn ? 'Not your piece!' : 'Not your turn!',
          color: '#ff8800',
          duration: 2000
        }
      }));
    }
  }

  handleGridClick(intersection) {
    const gridSquare = intersection.object;
    const { row, col } = gridSquare.userData;
    
    console.log('🎯 Grid square clicked:', row, col);
    
    // Check if we have a selected piece
    const selectedPieceId = window.gameStateManager.selectedPieceId;
    if (!selectedPieceId) {
      console.log('⚠️ No piece selected');
      return;
    }
    
    // Check if this position is a valid move
    const validMoves = window.gameStateManager.validMoves;
    const isValidMove = validMoves.some(move => move.row === row && move.col === col);
    
    if (!isValidMove) {
      console.log('⚠️ Invalid move position');
      document.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          message: 'Invalid move!',
          color: '#ff0000',
          duration: 2000
        }
      }));
      return;
    }
    
    // Check if the target position has multiple move options (for splitters)
    const moveOptions = validMoves.filter(move => move.row === row && move.col === col);
    if (moveOptions.length > 1) {
      // Show move choice dialog for splitters
      document.dispatchEvent(new CustomEvent('showMoveChoiceDialog', {
        detail: {
          pieceId: selectedPieceId,
          targetRow: row,
          targetCol: col,
          moveOptions: moveOptions
        }
      }));
      return;
    }
    
    // Execute the move
    this.executeMove(selectedPieceId, row, col, moveOptions[0]?.moveType || 'move');
  }

  executeMove(pieceId, targetRow, targetCol, moveType) {
    console.log('🚀 Executing move:', { pieceId, targetRow, targetCol, moveType });
    
    if (moveType === 'split') {
      console.log(`🔄 Sending split-piece event for ${pieceId} to (${targetRow}, ${targetCol})`);
      if (window.globalSocket) {
        window.globalSocket.emit('split-piece', {
          pieceId: pieceId,
          targetRow: targetRow,
          targetCol: targetCol
        });
      }
      
      const gameInfoEl = document.getElementById('game-info');
      if (gameInfoEl) gameInfoEl.textContent = 'Splitting piece...';
    } else {
      console.log('🚀 Sending move-piece event');
      if (window.globalSocket) {
        window.globalSocket.emit('move-piece', {
          pieceId: pieceId,
          targetRow: targetRow,
          targetCol: targetCol
        });
      }
      
      const gameInfoEl = document.getElementById('game-info');
      if (gameInfoEl) gameInfoEl.textContent = 'Moving piece...';
    }
    
    // Clear highlights after action
    document.dispatchEvent(new CustomEvent('clearValidMoveHighlights'));
    document.dispatchEvent(new CustomEvent('deselectPiece'));
  }

  // Movement mode selection for hybrid pieces
  selectMovementMode(mode) {
    this.selectedMovementMode = mode;
    console.log('🎯 Selected movement mode:', mode);
    
    // Update UI to show selected mode
    document.dispatchEvent(new CustomEvent('updateModeButtons', {
      detail: { selectedMode: mode }
    }));
    
    // Highlight valid moves for the selected mode
    document.dispatchEvent(new CustomEvent('highlightValidMovesForMode', {
      detail: { mode: mode }
    }));
  }

  // Get current mouse position in normalized device coordinates
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  // Get world position from screen coordinates
  getWorldPositionFromScreen(clientX, clientY) {
    const rect = window.gameRenderer.domElement.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    const mouse = new THREE.Vector2(x, y);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, window.gameCamera);
    
    // Intersect with the globe surface
    if (window.sceneManager && window.sceneManager.globe) {
      const intersects = raycaster.intersectObject(window.sceneManager.globe);
      if (intersects.length > 0) {
        return intersects[0].point;
      }
    }
    
    return null;
  }
}