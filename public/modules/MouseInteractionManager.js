// Mouse and touch interaction system for EvoChess
// Handles mouse clicks, touch events, piece selection, and camera controls

// Mouse interaction state
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let mouseDownTime = 0;
let isDragging = false;
let mouseStartPos = { x: 0, y: 0 };

// ✅ PHASE 5 FIX: Store right-click position for context menu
let lastRightClickEvent = null;

// Touch interaction state
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

/**
 * Handle mouse down events
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseDown(e) {
  mouseDownTime = Date.now();
  mouseStartPos = { x: e.clientX, y: e.clientY };
  isDragging = false;
  console.log(`🖱️ Mouse down at: ${mouseDownTime}`);
  
  // Don't prevent default - let OrbitControls handle the event too
  // We're just capturing it to track our own state
}

/**
 * Handle mouse move events
 * @param {MouseEvent} e - Mouse event
 */
function handleMouseMove(e) {
  if (mouseDownTime > 0) {
    const deltaX = e.clientX - mouseStartPos.x;
    const deltaY = e.clientY - mouseStartPos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Consider it dragging if moved more than 5 pixels
    if (distance > 5) {
      if (!isDragging) {
        console.log(`🖱️ Mouse drag detected - distance: ${distance}px`);
        isDragging = true;
      }
    }
    
    // Handle camera movement if using manual controls
    if (typeof manualCameraControls !== 'undefined' && manualCameraControls) {
      manualCameraControls.handleCameraMouseMove(e);
    }
  }
}

/**
 * Handle mouse up events
 * @param {MouseEvent} e - Mouse event
 * @returns {boolean} Whether the click was handled
 */
function handleMouseUp(e) {
  const mouseUpTime = Date.now();
  const clickDuration = mouseUpTime - mouseDownTime;
  
  console.log(`🖱️ Mouse up - duration: ${clickDuration}ms, isDragging: ${isDragging}, mouseDownTime: ${mouseDownTime}`);
  
  // Check if mouseDownTime was never set (indicates mouseDown wasn't called)
  if (mouseDownTime === 0) {
    console.log(`🖱️ Click ignored - mouseDown was never called`);
    return false;
  }
  
  // Only process click if it was quick and didn't drag much
  if (clickDuration < 300 && !isDragging) {
    console.log(`🖱️ Processing click event`);
    const clickHandled = onMouseClick(e);
    
    // If we successfully processed a piece click, prevent OrbitControls from handling it
    // This prevents the camera from moving when clicking on pieces
    if (clickHandled === true) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    mouseDownTime = 0;
    isDragging = false;
    return clickHandled;
  } else {
    console.log(`🖱️ Click ignored - too long (${clickDuration}ms) or dragging (${isDragging})`);
  }
  
  mouseDownTime = 0;
  isDragging = false;
  return false;
}

/**
 * Handle right-click events for evolution menu
 * @param {MouseEvent} event - Mouse event
 * @returns {boolean} Whether the click was handled
 */
function onRightClick(event) {
  console.log('🖱️ Right-click event triggered - onRightClick called');
  
  // ✅ PHASE 5: Store right-click position for context menu
  lastRightClickEvent = {
    clientX: event.clientX,
    clientY: event.clientY,
    pageX: event.pageX,
    pageY: event.pageY
  };
  
  // Make it globally accessible for other modules
  window.lastRightClickEvent = lastRightClickEvent;
  
  // Calculate mouse position
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Test all clickable objects (pieces)
  const clickableObjects = [];
  if (typeof pieceMeshes !== 'undefined') {
    Object.values(pieceMeshes).forEach(mesh => {
      clickableObjects.push(mesh);
      if (mesh.children && mesh.children.length > 0) {
        mesh.children.forEach(child => {
          if (child.type === 'Mesh' || child.type === 'Group') {
            clickableObjects.push(child);
            if (child.children && child.children.length > 0) {
              child.children.forEach(grandchild => {
                if (grandchild.type === 'Mesh') {
                  clickableObjects.push(grandchild);
                }
              });
            }
          }
        });
      }
    });
  }

  const intersects = raycaster.intersectObjects(clickableObjects, true);
  
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    
    // Find the piece mesh by traversing up the hierarchy
    while (clickedObject && !clickedObject.userData.piece) {
      clickedObject = clickedObject.parent;
    }
    
    if (clickedObject && clickedObject.userData.piece) {
      const piece = clickedObject.userData.piece;
      console.log(`🖱️ Right-clicked piece: ${piece.type} ${piece.symbol}`);
      
      // Check if this is our piece
      if (typeof socket !== 'undefined' && piece.playerId === socket.id) {
        console.log('🖱️ Requesting evolution choice for our piece');
        
        // Request evolution choice from server
        socket.emit('request-evolution-choice', {
          pieceId: piece.id
        });
        
        return true; // Click handled
      } else {
        console.log('🖱️ Cannot evolve opponent piece');
        if (typeof showNotification === 'function') {
          showNotification('Evolution', 'Cannot evolve opponent pieces', 'error');
        }
      }
    }
  }
  
  return false; // Click not handled
}

/**
 * Handle mouse click events for piece selection and movement
 * @param {MouseEvent} event - Mouse event
 * @returns {boolean} Whether the click was handled
 */
function onMouseClick(event) {
  console.log('🖱️ Click event triggered - onMouseClick called');
  
  // Check if this is a right-click
  const isRightClick = event.button === 2;
  
  let clickHandled = false;
  
  // For now, just allow all clicks - we can add drag detection later if needed
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // Get all potential clickable objects (pieces and valid move highlights)
  const clickableObjects = [];
  
  // Add piece meshes and their children (GLB models have geometry in children)
  if (typeof pieceMeshes !== 'undefined') {
    Object.values(pieceMeshes).forEach(mesh => {
      clickableObjects.push(mesh);
      // Also add child meshes that contain the actual geometry
      if (mesh.children && mesh.children.length > 0) {
        mesh.children.forEach(child => {
          if (child.type === 'Mesh' || child.type === 'Group') {
            clickableObjects.push(child);
            // Add nested children if they exist (GLB can have nested structure)
            if (child.children && child.children.length > 0) {
              child.children.forEach(grandchild => {
                if (grandchild.type === 'Mesh') {
                  clickableObjects.push(grandchild);
                }
              });
            }
          }
        });
      }
    });
  }
  
  // Add valid move highlights
  let validMoveCount = 0;
  const validMoveHighlights = [];
  if (typeof scene !== 'undefined') {
    scene.children.forEach(child => {
      if (child.userData && child.userData.isValidMoveHighlight) {
        clickableObjects.push(child);
        validMoveHighlights.push(child);
        validMoveCount++;
        console.log('🟢 Found valid move highlight:', child.userData.move);
      }
    });
  }
  
  console.log('🔍 Clickable objects setup:', {
    totalClickable: clickableObjects.length,
    pieceMeshes: typeof pieceMeshes !== 'undefined' ? Object.keys(pieceMeshes).length : 0,
    validMoveHighlights: validMoveCount
  });
  
  const intersects = raycaster.intersectObjects(clickableObjects, true); // Include child objects
  
  console.log('🔍 Raycaster debug:', {
    mouseX: mouse.x,
    mouseY: mouse.y,
    intersectsLength: intersects.length,
    sceneChildrenCount: typeof scene !== 'undefined' ? scene.children.length : 0,
    pieceMeshesCount: typeof pieceMeshes !== 'undefined' ? Object.keys(pieceMeshes).length : 0,
    clickableObjectsCount: clickableObjects.length,
    validMoveHighlightsCount: clickableObjects.filter(obj => obj.userData?.isValidMoveHighlight).length,
    cameraPosition: typeof camera !== 'undefined' ? camera.position : null,
    rayDirection: raycaster.ray.direction
  });
  
  // Process intersections for piece selection and movement
  if (intersects.length > 0) {
    console.log(`🔍 Found ${intersects.length} intersections`);
    
    // Check for valid move highlight clicks first
    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[i];
      const clickedObject = intersect.object;
      
      if (clickedObject.userData && clickedObject.userData.isValidMoveHighlight) {
        const move = clickedObject.userData.move;
        console.log(`🟢 Clicked valid move highlight: ${move.row}, ${move.col}`);
        
        // Execute the move
        if (typeof selectedPieceId !== 'undefined' && selectedPieceId && typeof socket !== 'undefined') {
          console.log(`🚀 Executing move for piece ${selectedPieceId} to (${move.row}, ${move.col})`);
          
          // Check if this piece can split (SPLITTER type)
          const selectedPiece = typeof gameState !== 'undefined' && gameState.pieces ? gameState.pieces[selectedPieceId] : null;
          if (selectedPiece && selectedPiece.type === 'SPLITTER') {
            // Check if both move and split are possible
            const canMove = typeof validMoves !== 'undefined' && validMoves.some(m => m.row === move.row && m.col === move.col && m.type === 'move');
            const canSplit = typeof validMoves !== 'undefined' && validMoves.some(m => m.row === move.row && m.col === move.col && m.type === 'split');
            
            if (canMove && canSplit) {
              // Show choice dialog
              if (typeof showMoveChoiceDialog === 'function') {
                showMoveChoiceDialog(selectedPieceId, move.row, move.col, { canMove, canSplit });
              }
              clickHandled = true;
              return clickHandled;
            }
          }
          
          // Regular move
          socket.emit('move-piece', {
            pieceId: selectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          if (typeof gameInfoEl !== 'undefined') {
            gameInfoEl.textContent = `Moving piece...`;
          }
        }
        
        clickHandled = true;
        return clickHandled;
      }
    }
    
    // If no valid move was clicked, check for piece selection
    for (let i = 0; i < intersects.length; i++) {
      const intersect = intersects[i];
      let clickedObject = intersect.object;
      
      // Find the piece mesh by traversing up the hierarchy
      while (clickedObject && !clickedObject.userData.piece) {
        clickedObject = clickedObject.parent;
      }
      
      if (clickedObject && clickedObject.userData.piece) {
        const piece = clickedObject.userData.piece;
        console.log(`🔍 Clicked piece: ${piece.type} ${piece.symbol} at (${piece.row}, ${piece.col})`);
        
        // Check if this is our piece and it's our turn
        if (typeof socket !== 'undefined' && piece.playerId === socket.id) {
          console.log('🔍 Selecting our piece');
          
          // Set selected piece
          if (typeof selectedPieceId !== 'undefined') {
            selectedPieceId = piece.id;
          }
          
          // Request valid moves from server
          socket.emit('get-valid-moves', { pieceId: piece.id });
          
          if (typeof gameInfoEl !== 'undefined') {
            gameInfoEl.textContent = `Selected ${piece.type}. Click a highlighted square to move.`;
          }
          
          clickHandled = true;
          return clickHandled;
        } else {
          console.log('🔍 Cannot select opponent piece or not our turn');
          if (typeof showNotification === 'function') {
            showNotification('Selection', 'Cannot select opponent pieces or not your turn', 'warning');
          }
        }
      }
    }
  } else {
    console.log('🔍 No intersections found - clearing selection');
    
    // Clear selection if clicking empty space
    if (typeof selectedPieceId !== 'undefined') {
      selectedPieceId = null;
    }
    if (typeof clearValidMoveHighlights === 'function') {
      clearValidMoveHighlights();
    }
    if (typeof clearSelectionHighlight === 'function') {
      clearSelectionHighlight();
    }
    if (typeof gameInfoEl !== 'undefined') {
      gameInfoEl.textContent = 'Click your pieces to select them.';
    }
  }
  
  return clickHandled;
}

/**
 * Handle touch start events
 * @param {TouchEvent} e - Touch event
 */
function onTouchStart(e) {
  e.preventDefault();
  touchStartTime = Date.now();
  const touch = e.touches[0];
  
  touchStartPos.x = touch.clientX;
  touchStartPos.y = touch.clientY;
}

/**
 * Handle touch end events
 * @param {TouchEvent} e - Touch event
 */
function onTouchEnd(e) {
  e.preventDefault();
  const touchDuration = Date.now() - touchStartTime;
  const touch = e.changedTouches[0];
  const touchEndPos = { x: touch.clientX, y: touch.clientY };
  
  // Calculate distance moved
  const deltaX = touchEndPos.x - touchStartPos.x;
  const deltaY = touchEndPos.y - touchStartPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // If touch was brief and didn't move much, treat as tap
  if (touchDuration < 300 && distance < 20) {
    onMouseClick({ clientX: touchEndPos.x, clientY: touchEndPos.y });
  }
}

/**
 * Set up all mouse and touch event listeners
 */
function setupMouseInteraction() {
  console.log('🖱️ Setting up clean event handlers...');
  
  if (typeof renderer === 'undefined' || !renderer.domElement) {
    console.error('Renderer not available for mouse interaction setup');
    return;
  }
  
  // Use a single click event with capture phase to get priority over OrbitControls
  renderer.domElement.addEventListener('click', (event) => {
    console.log('🖱️ Click event captured!');
    
    // Process the click and check if it was handled by piece selection
    const clickHandled = onMouseClick(event);
    
    // If we handled a piece/move click, prevent OrbitControls from processing it
    if (clickHandled) {
      console.log('🖱️ Click handled by piece selection - preventing camera movement');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true); // Use capture phase to run before OrbitControls
  
  // Add right-click for evolution menu
  renderer.domElement.addEventListener('contextmenu', (event) => {
    console.log('🖱️ Right-click event captured!');
    event.preventDefault(); // Prevent context menu
    
    const clickHandled = onRightClick(event);
    if (clickHandled) {
      console.log('🖱️ Right-click handled by evolution menu');
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);
  
  // Add mouse tracking for drag detection (simplified)
  let isMouseDown = false;
  
  renderer.domElement.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseDownTime = Date.now();
    handleMouseDown(e);
  }, false);
  
  renderer.domElement.addEventListener('mousemove', (e) => {
    handleMouseMove(e);
  }, false);
  
  renderer.domElement.addEventListener('mouseup', (e) => {
    isMouseDown = false;
    handleMouseUp(e);
  }, false);
  
  renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault(); // Prevent context menu on right-click
  }, false);
  
  // Add touch event listeners to canvas with capture phase
  renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
  renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
  
  console.log('🖱️ Pointer event listeners attached to canvas');
}

/**
 * Get current mouse state
 * @returns {Object} Mouse state object
 */
function getMouseState() {
  return {
    mouse: { x: mouse.x, y: mouse.y },
    mouseDownTime,
    isDragging,
    mouseStartPos: { ...mouseStartPos }
  };
}

/**
 * Get current touch state
 * @returns {Object} Touch state object
 */
function getTouchState() {
  return {
    touchStartTime,
    touchStartPos: { ...touchStartPos }
  };
}

/**
 * Reset mouse interaction state
 */
function resetMouseState() {
  mouseDownTime = 0;
  isDragging = false;
  mouseStartPos = { x: 0, y: 0 };
  touchStartTime = 0;
  touchStartPos = { x: 0, y: 0 };
}

/**
 * Check if currently dragging
 * @returns {boolean} Whether currently in a drag operation
 */
function isCurrentlyDragging() {
  return isDragging;
}

export {
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
  raycaster,
  lastRightClickEvent
};