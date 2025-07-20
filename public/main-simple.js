console.log('🚀 Starting main-simple.js v15 - ADDING GLTF LOADER 🚀');

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

function startGameInitialization() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAfterDOM);
  } else {
    initializeAfterDOM();
  }
}

// Menu System Variables (declare at module level)
let menuScreen, gameUI, gameOverScreen;

// ✅ PHASE 5 FIX: Use var instead of let to avoid temporal dead zone issues
var lastRightClickEvent = null; // Store right-click position for context menu
let playerName = '';
let menuSelectedColor = '#00ff00';
let selectedColor = null; // Current selected color ID from color picker
let gameMode = 'quickplay';
let isInGame = false;

function initializeAfterDOM() {
  console.log('DOM ready, initializing game elements...');
  
  // Get DOM elements after page is ready
  menuScreen = document.getElementById('menu-screen');
  gameUI = document.getElementById('ui');
  gameOverScreen = document.getElementById('game-over-screen');
  
  if (!menuScreen || !gameUI) {
    console.error('Critical UI elements not found!', {
      menuScreen: !!menuScreen,
      gameUI: !!gameUI,
      gameOverScreen: !!gameOverScreen
    });
    return;
  }
  
  console.log('UI elements found successfully');
  
  // Hide timing UI initially (only show during gameplay)
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Initialize menu system
  initMenuSystem();
}

// Initialize menu system
function initMenuSystem() {
  console.log('🎮 Initializing menu system...');
  
  // Auto-color assignment - no manual color picker needed
  console.log('🎨 Auto-color assignment system initialized - colors assigned by player index');
  
  // Helper function to add loading state to button
  function setButtonLoading(button, isLoading, originalText) {
    if (isLoading) {
      button.classList.add('btn-loading');
      button.disabled = true;
      button.innerHTML = '<span class="loading loading-spinner"></span> Loading...';
    } else {
      button.classList.remove('btn-loading');
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
  
  // Helper function to validate player name
  function validateAndGetPlayerName() {
    const input = document.getElementById('player-name-input');
    let name = input.value.trim();
    
    if (!name) {
      name = 'Player ' + Math.floor(Math.random() * 1000);
      input.value = name;
      
      // Flash the input to show it was auto-filled
      input.classList.add('input-success');
      setTimeout(() => input.classList.remove('input-success'), 500);
    }
    
    return name;
  }
  
  // Menu button handlers
  document.getElementById('quick-play-btn').addEventListener('click', function() {
    const btn = this;
    const originalHTML = btn.innerHTML;
    setButtonLoading(btn, true);
    
    console.log('🚀 Quick Play - Starting vs AI...');
    playerName = validateAndGetPlayerName();
    gameMode = 'vs-ai';
    
    // Add slight delay for smoother transition
    setTimeout(() => {
      startGame();
      setButtonLoading(btn, false, originalHTML);
    }, 300);
  });
  
  document.getElementById('vs-ai-btn').addEventListener('click', function() {
    const btn = this;
    const originalHTML = btn.innerHTML;
    setButtonLoading(btn, true);
    
    console.log('🤖 Starting vs AI...');
    playerName = validateAndGetPlayerName();
    gameMode = 'vs-ai';
    
    setTimeout(() => {
      startGame();
      setButtonLoading(btn, false, originalHTML);
    }, 300);
  });
  
  document.getElementById('create-game-btn').addEventListener('click', function() {
    const btn = this;
    const originalHTML = btn.innerHTML;
    setButtonLoading(btn, true);
    
    console.log('🎯 Creating multiplayer game...');
    playerName = validateAndGetPlayerName();
    gameMode = 'create-vs-human';
    
    setTimeout(() => {
      startGame();
      setButtonLoading(btn, false, originalHTML);
    }, 300);
  });
  
  document.getElementById('join-game-btn').addEventListener('click', function() {
    const btn = this;
    const originalHTML = btn.innerHTML;
    setButtonLoading(btn, true);
    
    console.log('🤝 Joining multiplayer game...');
    playerName = validateAndGetPlayerName();
    gameMode = 'join-vs-human';
    
    setTimeout(() => {
      startGame();
      setButtonLoading(btn, false, originalHTML);
    }, 300);
  });
  
  document.getElementById('tournament-btn').addEventListener('click', () => {
    showInfoModal('Tournament Mode', 
      'Tournament functionality is implemented on the server but needs UI integration.',
      'fa-trophy',
      'warning'
    );
  });
  
  document.getElementById('spectate-btn').addEventListener('click', () => {
    showInfoModal('Spectator Mode',
      'Spectator functionality is implemented on the server but needs UI integration.',
      'fa-eye',
      'info'
    );
  });
  
  document.getElementById('evolution-guide-btn').addEventListener('click', () => {
    showEvolutionGuide();
  });
  
  // Game over screen button
  document.getElementById('return-to-menu-btn').addEventListener('click', () => {
    returnToMenu();
  });
  
  // In-game menu button
  document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to quit to menu?')) {
      // Disconnect from server
      if (socket) {
        socket.disconnect();
      }
      returnToMenu();
    }
  });
  
  // Pause button
  document.getElementById('pause-game-btn').addEventListener('click', () => {
    alert('Pause feature coming soon!');
  });
}

// Start the game
function startGame() {
  console.log('🎮 Starting game with:', { playerName, gameMode });
  console.log('🌐 Environment diagnostics:', {
    currentURL: window.location.href,
    isEmbedded: window.self !== window.top,
    origin: window.location.origin,
    protocol: window.location.protocol,
    renderer: renderer ? 'exists' : 'not initialized',
    threeJS: typeof THREE !== 'undefined' ? 'loaded' : 'not loaded'
  });
  
  // Prevent multiple connections
  if (socket && socket.connected) {
    console.log('⚠️ Already connected to server');
    return;
  }
  
  // Initialize socket connection first
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling'] // Try WebSocket first, fall back to polling
  });
  window.globalSocket = socket;
  console.log('Socket.io initialized, waiting for connection...');
  
  // Send status to parent frame if embedded
  if (window.self !== window.top) {
    window.parent.postMessage({
      type: 'evochess-status',
      status: 'socket-initializing',
      url: window.location.href
    }, '*');
  }
  
  // Add connection diagnostics for production debugging
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.type, error.message);
    if (error.type === 'TransportError') {
      console.error('Transport error - this often happens in production due to proxy/firewall issues');
    }
    
    // Notify parent frame of error
    if (window.self !== window.top) {
      window.parent.postMessage({
        type: 'evochess-error',
        error: 'Socket connection failed: ' + error.message
      }, '*');
    }
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Reconnection attempt #${attemptNumber}`);
  });
  
  socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect after maximum attempts');
    showNotification('Connection Lost', 'Unable to connect to game server. Please refresh the page.', 'error');
  });
  
  // Add connection timeout
  const connectionTimeout = setTimeout(() => {
    showInfoModal('Connection Failed', 
      'Unable to connect to the game server. Please check your internet connection and try again.',
      'fa-exclamation-triangle',
      'error'
    );
    returnToMenu();
  }, 10000); // 10 second timeout
  
  // Handle connection errors
  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    clearTimeout(connectionTimeout);
    showInfoModal('Connection Error',
      'Failed to connect to the game server. Please try again later.',
      'fa-wifi',
      'error'
    );
    returnToMenu();
  });
  
  // Wait for connection, then send appropriate game mode request
  socket.on('connection-established', (data) => {
    clearTimeout(connectionTimeout);
    console.log('✅ Connected to server:', data);
    
    // Smooth transition from menu to game
    menuScreen.style.opacity = '0';
    menuScreen.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
      menuScreen.style.display = 'none';
      gameUI.style.display = 'block';
      gameUI.style.opacity = '0';
      const timingUI = document.getElementById('timing-ui');
      if (timingUI) {
        timingUI.style.display = 'block';
        timingUI.style.opacity = '0';
      }
      
      // Chat UI is now hidden
      const chatUI = document.getElementById('chat-ui');
      // Keeping chat hidden during game
      // if (chatUI) {
      //   chatUI.style.display = 'block';
      //   chatUI.style.opacity = '0';
      // }
      
      // Fade in game UI
      requestAnimationFrame(() => {
        gameUI.style.transition = 'opacity 0.3s ease';
        gameUI.style.opacity = '1';
        if (timingUI) {
          timingUI.style.transition = 'opacity 0.3s ease';
          timingUI.style.opacity = '1';
        }
        // Chat UI fade-in removed
        // if (chatUI) {
        //   chatUI.style.transition = 'opacity 0.3s ease';
        //   chatUI.style.opacity = '1';
        // }
      });
    }, 300);
    
    isInGame = true;
    
    // Send the appropriate game creation request based on mode
    switch (gameMode) {
      case 'vs-ai':
        console.log('🤖 Requesting vs AI game...');
        socket.emit('create-vs-ai-game', {
          playerName: playerName,
          difficulty: 'MEDIUM' // Can be made configurable later
        });
        break;
        
      case 'create-vs-human':
        console.log('🎯 Requesting create vs human game...');
        socket.emit('create-vs-human-game', {
          playerName: playerName
        });
        break;
        
      case 'join-vs-human':
        console.log('🤝 Requesting join human game...');
        socket.emit('join-human-game', {
          playerName: playerName
        });
        break;
        
      default:
        console.error('Unknown game mode:', gameMode);
        socket.emit('create-vs-ai-game', {
          playerName: playerName,
          difficulty: 'MEDIUM'
        });
    }
  });
  
  // Set up all socket event listeners
  setupSocketListeners();
}

// Return to menu
function returnToMenu() {
  console.log('🏠 Returning to menu...');
  
  // Clear any running timers
  if (typeof currentTimer !== 'undefined' && currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  // Smooth transition back to menu
  const timingUI = document.getElementById('timing-ui');
  const chatUI = document.getElementById('chat-ui');
  
  // Fade out current screens
  if (gameUI.style.display !== 'none') {
    gameUI.style.transition = 'opacity 0.3s ease';
    gameUI.style.opacity = '0';
  }
  
  if (gameOverScreen.style.display !== 'none') {
    gameOverScreen.style.transition = 'opacity 0.3s ease';
    gameOverScreen.style.opacity = '0';
  }
  
  if (timingUI && timingUI.style.display !== 'none') {
    timingUI.style.transition = 'opacity 0.3s ease';
    timingUI.style.opacity = '0';
  }
  
  if (chatUI && chatUI.style.display !== 'none') {
    chatUI.style.transition = 'opacity 0.3s ease';
    chatUI.style.opacity = '0';
  }
  
  setTimeout(() => {
    // Hide game screens and timer
    gameUI.style.display = 'none';
    gameOverScreen.style.display = 'none';
    if (timingUI) timingUI.style.display = 'none';
    if (chatUI) chatUI.style.display = 'none';
    
    // Show menu with fade in
    menuScreen.style.display = 'flex';
    menuScreen.style.opacity = '0';
    
    requestAnimationFrame(() => {
      menuScreen.style.transition = 'opacity 0.3s ease';
      menuScreen.style.opacity = '1';
    });
  }, 300);
  isInGame = false;
  
  // Reset game state
  if (window.location.reload) {
    // Reload page to fully reset (temporary solution)
    window.location.reload();
  }
}

// Show game over screen
function showGameOver(winner, stats) {
  console.log('🏁 Game Over!', winner, stats);
  
  // Clear any running timers
  if (typeof currentTimer !== 'undefined' && currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  // Hide game UI and timer
  gameUI.style.display = 'none';
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Update game over screen
  const titleEl = document.getElementById('game-over-title');
  const statsEl = document.getElementById('game-over-stats');
  
  if (winner === playerName) {
    titleEl.textContent = 'VICTORY!';
    titleEl.style.color = '#27ae60';
  } else {
    titleEl.textContent = 'DEFEAT';
    titleEl.style.color = '#e74c3c';
  }
  
  // Show stats
  statsEl.innerHTML = `
    <div>Winner: ${winner}</div>
    <div>Game Duration: ${stats?.duration || 'Unknown'}</div>
    <div>Your Pieces Captured: ${stats?.piecesKilled || 0}</div>
    <div>Your Pieces Lost: ${stats?.piecesLost || 0}</div>
    <div>Evolution Points Earned: ${stats?.evolutionPoints || 0}</div>
  `;
  
  // Show game over screen
  gameOverScreen.style.display = 'flex';
}

// Initialize menu on load
initMenuSystem();

// Continue with game initialization
function initializeGameComponents() {
  console.log('🎮 Initializing game components...');
  
  // Initialize the 3D scene if not already done
  if (!scene) {
    console.error('❌ Scene not initialized!');
    return;
  }
  
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

// Setup socket event listeners
function setupSocketListeners() {
  console.log('📡 Setting up socket event listeners...');
  
  // Connection handlers
  socket.on('connect', () => {
    statusEl.textContent = 'Connected';
    statusEl.style.color = '#00ff00';
    console.log('Socket connected successfully');
    console.log('My socket ID:', socket.id);
    
    // Initialize game components
    initializeGameComponents();
    
    // Send player info to server - colors auto-assigned by Phase 3 system
    socket.emit('player-joined', {
      name: playerName
      // ✅ PHASE 4 FIX: No color sent - server auto-assigns based on player index
    });
    
    // Request AI difficulties for the dropdown
    socket.emit('get-ai-difficulties');
    
    // Add AI player if vs AI mode
    if (gameMode === 'vsai') {
      setTimeout(() => {
        socket.emit('add-ai-player', {
          difficulty: 'MEDIUM',
          personality: {
            preferredPieces: ['QUEEN', 'ROOK', 'BISHOP'],
            playStyle: 'balanced',
            riskTolerance: 0.5,
            aggressiveness: 0.5
          }
        });
      }, 1000);
    }
  });

  socket.on('disconnect', () => {
    statusEl.textContent = 'Disconnected';
    statusEl.style.color = '#ff0000';
  });

  socket.on('game-full', () => {
    statusEl.textContent = 'Game Full';
    statusEl.style.color = '#ff8800';
    gameInfoEl.textContent = 'Game is full. Please try again later.';
  });

  socket.on('game-state-update', async (newGameState) => {
    console.log('🔄 Received game state update:', newGameState);
    console.log('🔄 Players in received state:', Object.keys(newGameState.players || {}));
    console.log('🔄 Pieces in received state:', Object.keys(newGameState.pieces || {}));
    console.log('🔄 Number of pieces received:', Object.keys(newGameState.pieces || {}).length);
    
    // Embedding diagnostics
    console.log('🌐 Rendering context:', {
      isEmbedded: window.self !== window.top,
      sceneExists: !!scene,
      rendererExists: !!renderer,
      cameraExists: !!camera,
      canvasInDOM: renderer ? document.body.contains(renderer.domElement) : false,
      modelsLoaded: Object.keys(loadedModels).length
    });
    
    // PHASE 1D DEBUG: Force rendering in all game modes, including waiting
    console.log('🎮 EMPTY BOARD DEBUG: Current game mode:', gameMode);
    console.log('🎮 EMPTY BOARD DEBUG: Pieces to render:', Object.values(newGameState.pieces || {}).map(p => `${p.type}@(${p.row},${p.col})`));
    
    // Process delta updates for performance
    const delta = performanceOptimizer.processDeltaUpdate(newGameState);
    
    if (delta.fullUpdate) {
      // Full update on first load
      console.log('🔄 Processing full update');
      gameState = newGameState;
      
      // Evolution points are now included in the game state from the server
      Object.keys(gameState.players).forEach(playerId => {
        const evolutionPoints = gameState.players[playerId].evolutionPoints;
        console.log(`🎯 Player ${playerId} has ${evolutionPoints} evolution points from server`);
      });
      
      console.log('🎮 EMPTY BOARD DEBUG: About to call updateVisuals() with pieces:', Object.keys(gameState.pieces || {}));
      await updateVisuals();
      console.log('🎮 EMPTY BOARD DEBUG: updateVisuals() completed, rendered meshes:', Object.keys(pieceMeshes));
      updateUI();
      console.log('🔄 Full update completed');
    } else {
      // Delta update - only update changed elements
      console.log('🔄 Processing delta update');
      
      // ✅ PHASE 7: Debug piece evolution points
      const pawnPiece = Object.values(newGameState.pieces).find(p => p.type === 'PAWN' && p.row === 9);
      if (pawnPiece) {
        console.log(`🎯 PHASE 7: Pawn at row 9 data:`, pawnPiece);
      }
      
      gameState = newGameState;
      await updateVisualsDelta(delta);
      
      // Always call updateUI immediately for player count changes
      updateUI();
      
      // Update evolution point labels when game state changes
      updateAllEvolutionPointLabels();
      
      // Throttled UI updates for other elements
      performanceOptimizer.createThrottledFunction('ui-update', () => {
        updateUI();
      }, 200);
    }
    
    console.log('Game state updated:', gameState);
    console.log('Players in game state:', Object.keys(gameState.players || {}));
    console.log('Pieces in game state:', Object.keys(gameState.pieces || {}));
    console.log('My socket ID:', socket.id);
    console.log('Players object:', gameState.players);
  });

  // Essential game handlers
  socket.on('valid-moves', (data) => {
    // Only show moves if this is for the currently selected piece
    if (data.pieceId === selectedPieceId) {
      validMoves = data.moves;
      
      // Check if this is a Hybrid Queen with dual movement
      const selectedPiece = gameState.pieces[selectedPieceId];
      if (selectedPiece && selectedPiece.type === 'HYBRID_QUEEN' && data.moves.length > 0) {
        showDualMovementUI();
      }
      
      highlightValidMoves();
    }
  });

  socket.on('move-result', (data) => {
    if (data.success) {
      console.log('Move successful:', data.message);
      selectedPieceId = null;
      validMoves = [];
      clearValidMoveHighlights();
      clearSelectionHighlight();
      hideDualMovementUI();
    } else {
      console.error('Move failed:', data.message);
      showNotification(data.message || 'Move failed', '#ff0000', 3000);
    }
  });

  socket.on('battle-result', (data) => {
    const { winner, loser, battleType } = data;
    console.log(`Battle result: ${winner} defeated ${loser} (${battleType})`);
  });
  
  // Handle check notification
  socket.on('player-in-check', (data) => {
    console.log('👑 Check notification:', data);
    
    if (data.inCheck) {
      if (data.playerId === socket.id) {
        showNotification('CHECK!', 'Your king is under attack!', 'warning');
      } else {
        const player = gameState.players[data.playerId];
        if (player) {
          showNotification('Check!', `${player.name}'s king is in check`, 'info');
        }
      }
    }
  });
  
  // Handle checkmate notification
  socket.on('checkmate', (data) => {
    console.log('♔ Checkmate notification:', data);
    
    if (data.playerId === socket.id) {
      showNotification('CHECKMATE!', 'You have been checkmated!', 'error');
    } else {
      const player = gameState.players[data.playerId];
      const checkmater = gameState.players[data.checkmatedBy];
      if (player && checkmater) {
        showNotification('Checkmate!', `${checkmater.name} checkmated ${player.name}!`, 'success');
      }
    }
  });

  socket.on('piece-evolution', (data) => {
    const { pieceId, oldType, newType, position } = data;
    console.log(`🔄 Piece evolution: ${oldType} → ${newType} for piece ${pieceId}`);
    
    // Get the piece from game state
    const piece = gameState.pieces[pieceId];
    if (piece) {
      const playerId = piece.playerId;
      console.log(`🔄 Updating visual mesh for piece evolution: ${pieceId} from ${oldType} to ${newType}`);
      
      // PRESERVE ORIGINAL COLOR: Store the color from the old mesh before removing it
      let originalColor = null;
      const oldMesh = pieceMeshes[pieceId];
      if (oldMesh) {
        console.log(`🔍 Old mesh found:`, oldMesh);
        console.log(`🔍 Old mesh material:`, oldMesh.material);
        console.log(`🔍 Old mesh children:`, oldMesh.children);
        
        // Try to get color from the mesh or its children
        if (oldMesh.material) {
          if (Array.isArray(oldMesh.material)) {
            originalColor = oldMesh.material[0].color.clone();
          } else {
            originalColor = oldMesh.material.color.clone();
          }
          console.log(`🎨 Preserved original color from mesh: ${originalColor.getHexString()}`);
        } else if (oldMesh.children && oldMesh.children.length > 0) {
          // Look for color in child meshes (GLB models often have children)
          for (let child of oldMesh.children) {
            if (child.material) {
              if (Array.isArray(child.material)) {
                originalColor = child.material[0].color.clone();
              } else {
                originalColor = child.material.color.clone();
              }
              console.log(`🎨 Preserved original color from child: ${originalColor.getHexString()}`);
              break;
            }
          }
        }
        
        if (!originalColor) {
          console.log(`⚠️ Could not find original color, will use default player color`);
        }
      }
      
      // Update the piece type in game state to match server
      piece.type = newType;
      
      // Remove old mesh
      if (oldMesh) {
        // Remove old mesh from scene
        scene.remove(oldMesh);
        
        // Dispose of old mesh resources
        if (oldMesh.geometry) oldMesh.geometry.dispose();
        if (oldMesh.material) {
          if (Array.isArray(oldMesh.material)) {
            oldMesh.material.forEach(mat => mat.dispose());
          } else {
            oldMesh.material.dispose();
          }
        }
        
        // Remove from pieces cache
        delete pieceMeshes[pieceId];
        console.log(`🔄 Removed old ${oldType} mesh for piece ${pieceId}`);
      }
      
      // Create new mesh with evolved type
      createPieceMeshOptimized(piece).then(() => {
        console.log(`✅ Successfully recreated mesh as ${newType} for piece ${pieceId}`);
        
        // APPLY PRESERVED COLOR: Set the new mesh to use the original color
        if (pieceMeshes[pieceId]) {
          const newMesh = pieceMeshes[pieceId];
          
          // If we preserved a color, use it; otherwise get the proper player color
          let colorToApply = originalColor;
          if (!colorToApply) {
            // Get the proper player color
            const player = gameState.players[playerId];
            const playerIndex = Object.keys(gameState.players).indexOf(playerId);
            const playerColor = getPlayerColor(playerId, playerIndex);
            colorToApply = new THREE.Color(playerColor);
            console.log(`🎨 Using player color ${colorToApply.getHexString()} for new ${newType} mesh`);
          }
          
          // Apply color to mesh and all children
          function applyColorToMesh(mesh, color) {
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  if (mat.color) mat.color.copy(color);
                });
              } else {
                if (mesh.material.color) mesh.material.color.copy(color);
              }
            }
            // Apply to children too
            if (mesh.children) {
              mesh.children.forEach(child => applyColorToMesh(child, color));
            }
          }
          
          applyColorToMesh(newMesh, colorToApply);
          console.log(`🎨 Applied color ${colorToApply.getHexString()} to new ${newType} mesh and all children`);
        }
        
        // Create evolution effect at the piece position
        const worldPos = getWorldPosition(piece.row, piece.col);
        if (visualEffects) {
          visualEffects.createEvolutionEffect(worldPos, oldType, newType);
        }
        
        // Show notification
        const player = gameState.players[playerId];
        const playerName = player ? player.name : 'Unknown Player';
        showNotification(`${playerName}'s ${oldType} evolved to ${newType}!`, '#00ff00', 3000);
      }).catch(error => {
        console.error(`❌ Failed to recreate evolved piece mesh:`, error);
      });
    } else {
      console.warn(`⚠️ Piece ${pieceId} not found in game state for evolution`);
    }
  });

  socket.on('evolution-point-award', (data) => {
    // ✅ PHASE 6 BUG FIX: Server sends 'points', not 'amount'
    const { playerId, points, reason } = data;
    console.log(`Evolution points awarded: ${points} to ${playerId} for ${reason}`);
    
    // Update player's evolution points in game state
    if (gameState.players[playerId]) {
      gameState.players[playerId].evolutionPoints = (gameState.players[playerId].evolutionPoints || 0) + points;
      console.log(`🎯 Updated player ${playerId} evolution points to:`, gameState.players[playerId].evolutionPoints);
    }
    
    // Update all floating evolution point labels
    updateAllEvolutionPointLabels();
    
    // Update evolution bank display if this is our player
    if (socket.id === playerId) {
      refreshEvolutionBank();
    }
  });

  socket.on('player-eliminated', (data) => {
    const { playerId, playerName, reason } = data;
    console.log(`Player eliminated: ${playerName} (${reason})`);
    
    // Show elimination notification
    if (socket.id === playerId) {
      showNotification(`You have been eliminated! ${reason}`, '#ff0000', 5000);
    } else {
      showNotification(`${playerName} has been eliminated! ${reason}`, '#ff8800', 3000);
    }
    
    // Update UI
    updateUI();
  });

  // AI system handlers
  socket.on('ai-player-added', (data) => {
    const { aiPlayer } = data;
    console.log('AI player added:', aiPlayer.name);
    
    // Update AI players list
    currentAIPlayers = Object.values(gameState.players).filter(p => p.isAI);
    updateAIPlayersList();
    
    showNotification(`AI player added: ${aiPlayer.name}`, '#00ff00', 2000);
  });

  socket.on('ai-difficulties', (data) => {
    const { difficulties } = data;
    console.log('AI difficulties received:', difficulties);
    
    // Update AI difficulty dropdown
    const dropdown = document.getElementById('ai-difficulty-select');
    if (dropdown) {
      dropdown.innerHTML = '';
      Object.entries(difficulties).forEach(([key, diff]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = diff.name;
        dropdown.appendChild(option);
      });
    }
  });

  // Chat system handlers
  socket.on('chat-message', (data) => {
    addChatMessage(data);
  });

  socket.on('chat-status', (data) => {
    updateChatStatus(data.status);
  });

  // Auto-color assignment - no color selection needed
  console.log('🎨 Using auto-color assignment - no manual color selection required');

  // Evolution choice handlers
  socket.on('evolution-choice-available', (data) => {
    console.log('🎯 Evolution choice available:', data);
    showEvolutionChoice(data);
    showEvolutionUI(); // Auto-show evolution UI when choice is available
  });

  socket.on('evolution-choice-success', (data) => {
    console.log('🎯 Evolution choice success:', data);
    handleEvolutionCompleted(data);
  });

  socket.on('evolution-choice-failed', (data) => {
    console.log('🎯 Evolution choice failed:', data);
    console.log('🎯 PHASE 5 DEBUG: Error message:', data.error);
    hideEvolutionChoice();
    showNotification('Evolution Failed', data.error, 'error');
  });

  socket.on('evolution-choice-cancelled', (data) => {
    console.log('🎯 Evolution choice cancelled:', data);
    hideEvolutionChoice();
    showNotification('Evolution Cancelled', 'Evolution choice was cancelled', 'info');
  });

  socket.on('evolution-choice-dialog', (data) => {
    console.log('🎯 Evolution choice dialog event received:', data);
    console.log('🎯 PHASE 7 DEBUG: Available paths:', data.availablePaths);
    console.log('🎯 PHASE 7 DEBUG: Piece points:', data.piecePoints);
    console.log('🎯 PHASE 5 DEBUG: lastRightClickEvent:', lastRightClickEvent);
    
    const { pieceId, piece, reason, availablePaths, piecePoints, timeLimit } = data;
    // ✅ PHASE 5: Use context menu instead of popup dialog
    showEvolutionContextMenu(data, lastRightClickEvent);
  });

  socket.on('evolution-completed', (data) => {
    // Handle evolution completed by other players
    if (data.playerId !== socket.id) {
      const playerName = gameState.players[data.playerId]?.name || 'Unknown';
      showNotification('Player Evolution', 
        `${playerName}'s ${data.oldType} evolved to ${data.newType}!`, 
        'info');
    }
  });

  socket.on('evolution-point-gained', (data) => {
    console.log(`🎯 Evolution point gained event:`, data);
    
    // Update player's evolution points in game state
    if (gameState.players[data.playerId]) {
      gameState.players[data.playerId].evolutionPoints = data.totalPoints || (gameState.players[data.playerId].evolutionPoints || 0) + data.points;
      console.log(`🎯 Updated player ${data.playerId} evolution points to:`, gameState.players[data.playerId].evolutionPoints);
    }
    
    // Update all floating evolution point labels
    updateAllEvolutionPointLabels();
    
    if (data.playerId === socket.id) {
      showNotification('Evolution Points', 
        `+${data.points} points (${data.reason.replace('_', ' ')})`, 
        'success');
      
      // Update evolution bank display if UI is open
      if (document.getElementById('evolution-ui').style.display === 'block') {
        refreshEvolutionBank();
      }
    }
  });
  
  // ✅ PHASE 7: Handle equator bonus event
  socket.on('equator-bonus', (data) => {
    console.log('🎯 PHASE 7: Equator bonus event:', data);
    
    // Update the piece's evolution points
    if (gameState.pieces && gameState.pieces[data.pieceId]) {
      gameState.pieces[data.pieceId].evolutionPoints = data.piecePoints;
      console.log(`🎯 PHASE 7: Updated piece ${data.pieceId} to ${data.piecePoints} evolution points`);
    }
    
    updateAllEvolutionPointLabels();
    
    if (data.playerId === socket.id) {
      showNotification('Equator Crossed!', 
        `+1 evolution point (${data.moveCount} moves)`, 
        'success');
    }
  });
  
  // ✅ PHASE 7: Handle circumnavigation bonus event
  socket.on('circumnavigation-bonus', (data) => {
    console.log('🎯 PHASE 7: Circumnavigation bonus event:', data);
    
    // Update the piece's evolution points
    if (gameState.pieces && gameState.pieces[data.pieceId]) {
      gameState.pieces[data.pieceId].evolutionPoints = data.piecePoints;
    }
    
    updateAllEvolutionPointLabels();
    
    if (data.playerId === socket.id) {
      showNotification('Pole Conquered!', 
        `+8 evolution points (${data.moveCount} moves)`, 
        'success');
    }
  });
  
  // ✅ PHASE 7: Handle pole bonus event for splitters
  socket.on('pole-bonus', (data) => {
    console.log('🎯 PHASE 7: Pole bonus event:', data);
    
    // Update the piece's evolution points
    if (gameState.pieces && gameState.pieces[data.pieceId]) {
      gameState.pieces[data.pieceId].evolutionPoints = data.piecePoints;
    }
    
    updateAllEvolutionPointLabels();
    
    if (data.playerId === socket.id) {
      showNotification('Pole Reached!', 
        `Splitter gained +8 evolution points`, 
        'success');
    }
  });
  
  // ✅ PHASE 7: Handle piece capturing another piece
  socket.on('piece-evolution-point-gained', (data) => {
    console.log('🎯 PHASE 7: Piece gained evolution point from capture:', data);
    
    // Update the piece's evolution points
    if (gameState.pieces && gameState.pieces[data.pieceId]) {
      gameState.pieces[data.pieceId].evolutionPoints = data.piecePoints;
    }
    
    updateAllEvolutionPointLabels();
    
    if (data.playerId === socket.id) {
      showNotification('Capture Bonus!', 
        `+1 evolution point from capture`, 
        'success');
    }
  });

  socket.on('evolution-points-banked', (data) => {
    const { pieceId, playerId, points, totalPoints, reason } = data;
    
    if (playerId === socket.id) {
      gameInfoEl.textContent = `Banked ${points} evolution points! Total: ${totalPoints}`;
      showNotification('Evolution Points', 
        `Banked ${points} points. Total: ${totalPoints}`, 
        'success');
    }
  });

  // Timer system handlers
  socket.on('player-timer-started', (data) => {
    console.log('🕒 Player timer started:', data);
    if (data.playerId === socket.id) {
      // Start visual timer countdown for this player
      startRealTimeTimer(data.timerDuration);
    }
  });

  socket.on('player-timer-update', (data) => {
    console.log('🕒 Player timer update:', data);
    if (data.playerId === socket.id) {
      // Stop client-side timer when server updates start
      if (currentTimer) {
        clearInterval(currentTimer);
        currentTimer = null;
        console.log('🕒 Stopped client-side timer, using server updates');
      }
      updateTimerDisplay(data.timeRemaining);
    }
  });

  socket.on('player-timer-zero', (data) => {
    console.log('🕒 Player timer at zero:', data);
    if (data.playerId === socket.id) {
      // Timer is at 0, player can move
      const statusEl = document.getElementById('timer-status');
      if (statusEl) {
        statusEl.textContent = 'Ready to move';
        statusEl.style.color = '#00ff00';
      }
    }
  });

  socket.on('game-started-first-move', (data) => {
    console.log('🎮 Game started:', data);
    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.textContent = 'Game Active';
      statusEl.style.color = '#00ff00';
    }
    showNotification('Game Started!', data.message, 'success');
  });

  socket.on('active-player-changed', (data) => {
    console.log('🔄 Active player changed:', data);
    const activePlayerNameEl = document.getElementById('active-player-name');
    if (activePlayerNameEl) {
      activePlayerNameEl.textContent = data.playerName || 'Unknown';
    }
    
    // Show notification if it's your turn
    if (data.playerId === socket.id) {
      showNotification('Your Turn!', 'Make your move', 'info');
    }
  });
}

// Grid utility functions (copied from gridToSphere.js)
function gridToSpherical(rows, cols, row, col) {
  // phi: 0° = north pole, 180° = south pole
  const phi = (row / (rows - 1)) * 180;
  // theta: 0° = 0°, 360° = 360° (longitude)
  const theta = (col / cols) * 360;
  return { phi, theta };
}

function sphericalToCartesian(r, phi, theta) {
  const phiRad = THREE.MathUtils.degToRad(phi);
  const thetaRad = THREE.MathUtils.degToRad(theta);
  
  return {
    x: r * Math.sin(phiRad) * Math.cos(thetaRad),
    y: r * Math.cos(phiRad),
    z: r * Math.sin(phiRad) * Math.sin(thetaRad),
  };
}

// Socket.io connection - will be initialized when game starts
let socket = null;
console.log('Socket.io will be initialized when game starts');

// Make socket globally accessible for evolution dialog functions
window.globalSocket = null;

// Timer management variables
let currentTimer = null;
let timerStartTime = 0;
let timerDuration = 7000; // 7 seconds default
let activePlayerId = null;
let isTimerPaused = false;
let pausedTimeRemaining = 0;

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a);
document.body.appendChild(renderer.domElement);

console.log('🎮 3D Renderer initialized:', {
  canvas: renderer.domElement,
  width: renderer.domElement.width,
  height: renderer.domElement.height,
  parent: renderer.domElement.parentElement?.tagName,
  visible: renderer.domElement.style.display !== 'none'
});

// Mouse interaction setup
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

// UI elements that need to be available globally
const modeIndicator = document.getElementById('mode-indicator');

// Mouse state tracking
let mouseDownTime = 0;
let isDragging = false;

// Movement mode tracking - MOVED HERE TO FIX INITIALIZATION ORDER
let selectedMovementMode = null;

console.log('Three.js scene initialized successfully');

// Performance Optimization System
class PerformanceOptimizer {
  constructor() {
    this.modelCache = new Map(); // Cache for GLB models
    this.geometryCache = new Map(); // Cache for geometries
    this.materialCache = new Map(); // Cache for materials
    this.pooledObjects = new Map(); // Object pools for reuse
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
    if (perfElement) {
      perfElement.innerHTML = `
        <div>FPS: ${this.fps}</div>
        <div>Memory: ${this.memoryUsage}MB</div>
        <div>Objects: ${scene.children.length}</div>
        <div>Pieces: ${Object.keys(pieceMeshes || {}).length}</div>
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
    
    try {
      const model = await loadModel(pieceType);
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
  
  removePieceEfficient(pieceId) {
    const mesh = pieceMeshes[pieceId];
    if (mesh) {
      scene.remove(mesh);
      
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
      
      delete pieceMeshes[pieceId];
    }
  }
  
  // Clear piece cache and remove all pieces from scene
  clearPieceCache() {
    console.log('🧹 Clearing piece cache to force color updates');
    Object.keys(pieceMeshes).forEach(pieceId => {
      const mesh = pieceMeshes[pieceId];
      if (mesh) {
        scene.remove(mesh);
        
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
      delete pieceMeshes[pieceId];
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

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Mouse interaction tracking
let mouseStartPos = { x: 0, y: 0 };
// isDragging moved to global scope

function handleMouseDown(e) {
  mouseDownTime = Date.now();
  mouseStartPos = { x: e.clientX, y: e.clientY };
  isDragging = false;
  console.log(`🖱️ Mouse down at: ${mouseDownTime}`);
  
  // Don't prevent default - let OrbitControls handle the event too
  // We're just capturing it to track our own state
}

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
    if (manualCameraControls) {
      manualCameraControls.handleCameraMouseMove(e);
    }
  }
}

function handleMouseUp(e) {
  const mouseUpTime = Date.now();
  const clickDuration = mouseUpTime - mouseDownTime;
  
  console.log(`🖱️ Mouse up - duration: ${clickDuration}ms, isDragging: ${isDragging}, mouseDownTime: ${mouseDownTime}`);
  
  // Check if mouseDownTime was never set (indicates mouseDown wasn't called)
  if (mouseDownTime === 0) {
    console.log(`🖱️ Click ignored - mouseDown was never called`);
    return;
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
  } else {
    console.log(`🖱️ Click ignored - too long (${clickDuration}ms) or dragging (${isDragging})`);
  }
  
  mouseDownTime = 0;
  isDragging = false;
}

// Timer management functions
function startTimer(playerId, timeLimit, startTime) {
  activePlayerId = playerId;
  timerStartTime = startTime;
  timerDuration = timeLimit;
  isTimerPaused = false;
  
  // Update UI with initial time
  const initialRemaining = Math.max(0, timerDuration - (Date.now() - timerStartTime));
  updateTimerDisplay(initialRemaining);
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      const elapsed = Date.now() - timerStartTime;
      const remaining = Math.max(0, timerDuration - elapsed);
      updateTimerDisplay(remaining);
    }
  }, 100); // Update every 100ms for smooth animation
  
  console.log(`Timer started for player ${playerId}: ${timeLimit}ms`);
}

function pauseTimer() {
  isTimerPaused = true;
  const elapsed = Date.now() - timerStartTime;
  pausedTimeRemaining = Math.max(0, timerDuration - elapsed);
  
  document.getElementById('timer-status').textContent = 'Timer Paused (Battle/Evolution)';
  document.getElementById('timer-bar').style.background = '#666';
  
  console.log('Timer paused');
}

function resumeTimer() {
  if (isTimerPaused) {
    isTimerPaused = false;
    timerStartTime = Date.now();
    timerDuration = pausedTimeRemaining;
    
    document.getElementById('timer-status').textContent = 'Timer Active';
    document.getElementById('timer-bar').style.background = 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600, #ff0000)';
    
    console.log('Timer resumed');
  }
}



function updateActivePlayer(playerId, playerName) {
  activePlayerId = playerId;
  document.getElementById('active-player-name').textContent = playerName || 'Unknown';
  
  // Highlight if it's your turn
  const timingUI = document.getElementById('timing-ui');
  if (playerId === socket.id) {
    timingUI.style.borderColor = '#00ff00';
    timingUI.style.boxShadow = '0 0 10px #00ff00';
  } else {
    timingUI.style.borderColor = '#ff6600';
    timingUI.style.boxShadow = 'none';
  }
}

function updateTurnQueue(turnQueue) {
  const turnQueueList = document.getElementById('turn-queue-list');
  if (turnQueue && turnQueue.length > 0) {
    const queueText = turnQueue.map((playerId, index) => {
      const player = gameState.players[playerId];
      const playerName = player ? player.name : 'Unknown';
      return `${index + 1}. ${playerName}${playerId === activePlayerId ? ' (Current)' : ''}`;
    }).join(', ');
    turnQueueList.textContent = queueText;
  } else {
    turnQueueList.textContent = '-';
  }
}

// Real-time system timer functions
function startRealTimeTimer(duration) {
  timerDuration = duration;
  timerStartTime = Date.now();
  isTimerPaused = false;
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      const elapsed = Date.now() - timerStartTime;
      const remaining = Math.max(0, timerDuration - elapsed);
      updateTimerDisplay(remaining);
      
      if (remaining <= 0) {
        clearInterval(currentTimer);
        currentTimer = null;
      }
    }
  }, 100); // Update every 100ms for smooth animation
  
  console.log(`Real-time timer started: ${duration}ms`);
}

function updateTimerDisplay(timeRemaining) {
  const timeRemainingElement = document.getElementById('time-remaining');
  const timerBarElement = document.getElementById('timer-bar');
  const timerStatusElement = document.getElementById('timer-status');
  
  console.log('🕒 updateTimerDisplay called with:', timeRemaining, 'Elements found:', {
    timeRemaining: !!timeRemainingElement,
    timerBar: !!timerBarElement, 
    timerStatus: !!timerStatusElement
  });
  
  if (!timeRemainingElement || !timerBarElement || !timerStatusElement) {
    console.log('⚠️ Timer elements not found in DOM');
    return;
  }
  
  const remainingSeconds = timeRemaining / 1000;
  timeRemainingElement.textContent = remainingSeconds.toFixed(1);
  console.log('🕒 Updated timer display to:', remainingSeconds.toFixed(1));
  
  // Update progress bar
  const progress = (timeRemaining / timerDuration) * 100;
  timerBarElement.style.width = `${progress}%`;
  
  // Update status and colors
  if (timeRemaining <= 0) {
    timerStatusElement.textContent = 'Ready to move';
    timerStatusElement.style.color = '#00ff00';
    timerBarElement.style.background = '#00ff00';
  } else {
    timerStatusElement.textContent = 'Timer counting down...';
    timerStatusElement.style.color = '#ff8800';
    timerBarElement.style.background = 'linear-gradient(90deg, #00ff00, #ffff00, #ff6600, #ff0000)';
  }
}

function updateTimerUI(timer, queuedMove) {
  const timerStatusElement = document.getElementById('timer-status');
  const timeRemainingElement = document.getElementById('time-remaining');
  
  if (!timerStatusElement || !timeRemainingElement) return;
  
  if (timer) {
    const remainingSeconds = timer.timeRemaining / 1000;
    timeRemainingElement.textContent = remainingSeconds.toFixed(1);
    
    if (timer.timeRemaining <= 0) {
      timerStatusElement.textContent = 'Ready to move';
      timerStatusElement.style.color = '#00ff00';
    } else {
      if (queuedMove) {
        timerStatusElement.textContent = 'Move queued - waiting for timer';
        timerStatusElement.style.color = '#ffaa00';
      } else {
        timerStatusElement.textContent = 'Timer counting down...';
        timerStatusElement.style.color = '#ff8800';
      }
    }
  }
}

function updateQueueDisplay(queuedMove) {
  const statusElement = document.getElementById('timer-status');
  
  if (!statusElement) return;
  
  if (queuedMove) {
    statusElement.textContent = `Move queued: ${queuedMove.pieceId} → (${queuedMove.targetRow}, ${queuedMove.targetCol})`;
    statusElement.style.color = '#ffaa00';
  } else {
    statusElement.textContent = 'No move queued';
    statusElement.style.color = '#ccc';
  }
}

// Camera controls setup
let controls;
let manualCameraControls = null;

if (typeof THREE !== 'undefined' && THREE.TrackballControls) {
  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.noPan = true;
  controls.minDistance = 8;
  controls.maxDistance = 15;
  controls.rotateSpeed = 1.8;  // Increased from 1.0 for more responsive rotation
  controls.zoomSpeed = 1.2;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  
  console.log('TrackballControls initialized successfully with unlimited 3D rotation');
} else if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
  // Fallback to OrbitControls if TrackballControls not available
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 15;
  
  // Enable unrestricted 3D rotation - remove polar angle restrictions completely
  controls.minPolarAngle = 0; // Default minimum
  controls.maxPolarAngle = Math.PI; // Default maximum
  
  // Override the internal constraint logic to disable polar limits
  const originalUpdate = controls.update;
  controls.update = function() {
    // Temporarily disable polar angle constraints
    const originalMinPolar = this.minPolarAngle;
    const originalMaxPolar = this.maxPolarAngle;
    
    // Set to unlimited range during update
    this.minPolarAngle = -Infinity;
    this.maxPolarAngle = Infinity;
    
    // Call original update
    const result = originalUpdate.call(this);
    
    // Restore original values (though they won't be used)
    this.minPolarAngle = originalMinPolar;
    this.maxPolarAngle = originalMaxPolar;
    
    return result;
  };
  
  console.log('OrbitControls initialized as fallback (with attempted unrestricted rotation)');
} else {
  console.log('Using manual camera controls instead of OrbitControls');
  // Manual camera control system
  manualCameraControls = {
    cameraDistance: 10,
    cameraAngleX: 0,
    cameraAngleY: 0,
    
    updateCameraPosition() {
      camera.position.x = this.cameraDistance * Math.sin(this.cameraAngleX) * Math.cos(this.cameraAngleY);
      camera.position.y = this.cameraDistance * Math.sin(this.cameraAngleY);
      camera.position.z = this.cameraDistance * Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY);
      camera.lookAt(0, 0, 0);
    },
    
    handleCameraMouseMove(e) {
      if (isDragging && mouseDownTime > 0) {
        const deltaX = e.clientX - mouseStartPos.x;
        const deltaY = e.clientY - mouseStartPos.y;
        
        this.cameraAngleX += deltaX * 0.01;
        this.cameraAngleY += deltaY * 0.01;
        
        // Enable unrestricted 3D rotation - remove polar angle restrictions
        // this.cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraAngleY));
        
        this.updateCameraPosition();
        
        mouseStartPos.x = e.clientX;
        mouseStartPos.y = e.clientY;
      }
    },
    
    handleWheel(e) {
      this.cameraDistance += e.deltaY * 0.01;
      this.cameraDistance = Math.max(8, Math.min(15, this.cameraDistance));
      this.updateCameraPosition();
    }
  };
  
  // Initialize camera position
  manualCameraControls.updateCameraPosition();
  
  // Add wheel event listener for zoom
  window.addEventListener('wheel', (e) => {
    manualCameraControls.handleWheel(e);
  });
}
// Set initial camera position to show both poles better
camera.position.set(5, 5, 10);
camera.lookAt(0, 0, 0);

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
      
      // ✅ PHASE 7: Add yellow equator line between rows 9 and 10
      if (row === 9) {
        const equatorGeometry = new THREE.SphereGeometry(
          globeRadius + 0.08, // slightly larger radius for visibility
          64, // width segments for smooth line
          2, // thin height
          0, // full rotation
          Math.PI * 2, // full circle
          ringPhi + ringThickness / 2, // at edge of row 9
          0.008 // slightly thicker than normal borders
        );
        
        const equatorMaterial = new THREE.MeshBasicMaterial({
          color: 0xFFFF00, // Bright yellow
          transparent: true,
          opacity: 0.8,
          emissive: 0xFFFF00,
          emissiveIntensity: 0.3
        });
        
        const equatorLine = new THREE.Mesh(equatorGeometry, equatorMaterial);
        equatorLine.position.set(0, 0, 0);
        equatorLine.userData = { isEquator: true };
        scene.add(equatorLine);
        gridSquares.push(equatorLine);
        
        console.log('🎯 PHASE 7: Added yellow equator line between rows 9 and 10');
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
const modelCache = {};
let modelLoader = null;

// Initialize GLTFLoader when available
function initializeGLTFLoader() {
  if (typeof THREE.GLTFLoader !== 'undefined') {
    modelLoader = new THREE.GLTFLoader();
    console.log('✅ GLTFLoader initialized successfully');
    return true;
  } else {
    console.warn('⚠️ GLTFLoader not available, using geometric fallbacks');
    return false;
  }
}

// Try to initialize GLTFLoader
const hasGLTFLoader = initializeGLTFLoader();

// Model file mappings - using finalized GLB files from Final pieces folder
  const MODEL_PATHS = {
    'KING': './chess piece models/Final pieces/KING.glb',
    'QUEEN': './chess piece models/Final pieces/QUEEN.glb',
    'ROOK': './chess piece models/Final pieces/ROOK.glb',
    'KNIGHT': './chess piece models/Final pieces/KNIGHT.glb',
    'BISHOP': './chess piece models/Final pieces/BISHOP.glb',
    'PAWN': './chess piece models/Final pieces/PAWN.glb',
    'SPLITTER': './chess piece models/Final pieces/SPLITTER.glb',
    // ✅ PHASE 6: Updated with new piece names
    'VAULTBOUND': './chess piece models/Final pieces/VAULTBOUND.glb',
    'VAULTSEER': './chess piece models/Final pieces/VAULTSEER.glb',
    'VAULTARCHER': './chess piece models/Final pieces/VAULTARCHER.glb',
    'VAULTMISTRESS': './chess piece models/Final pieces/VAULTMISTRESS.glb',
    'COVENANT_QUEEN': './chess piece models/Final pieces/COVENANT_QUEEN.glb',
    // Keep old names for backward compatibility
    'JUMPER': './chess piece models/Final pieces/VAULTBOUND.glb',
    'SUPER_JUMPER': './chess piece models/Final pieces/VAULTSEER.glb',
    'HYPER_JUMPER': './chess piece models/Final pieces/VAULTARCHER.glb',
    'MISTRESS_JUMPER': './chess piece models/Final pieces/VAULTMISTRESS.glb',
    'HYBRID_QUEEN': './chess piece models/Final pieces/COVENANT_QUEEN.glb'
  };

// Load a 3D model with caching
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

// Preload all models with progress tracking
async function preloadModels() {
  console.log('Preloading all 3D models...');
  const pieceTypes = Object.keys(MODEL_PATHS);
  
  // Update UI with loading status
  gameInfoEl.textContent = 'Loading 3D models...';
  
  let loadedCount = 0;
  const totalCount = pieceTypes.length;
  
  const loadPromises = pieceTypes.map(async (pieceType) => {
    try {
      await loadModel(pieceType);
      loadedCount++;
      
      // Update progress
      const progress = Math.round((loadedCount / totalCount) * 100);
      gameInfoEl.textContent = `Loading 3D models... ${progress}% (${loadedCount}/${totalCount})`;
      
    } catch (error) {
      console.error(`Failed to preload ${pieceType}:`, error);
      loadedCount++;
      
      // Update progress even for failed loads
      const progress = Math.round((loadedCount / totalCount) * 100);
      gameInfoEl.textContent = `Loading 3D models... ${progress}% (${loadedCount}/${totalCount})`;
    }
  });
  
  await Promise.all(loadPromises);
  console.log('Model preloading complete!');
}

// Test if models are accessible
async function testModelAccess() {
  try {
    const response = await fetch('./chess piece models/Final pieces/KING.glb');
    if (response.ok) {
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

// Game state
let gameState = {
  players: {},
  pieces: {},
  gridConfig: { rows: 20, cols: 8 }
};

// ✅ PHASE 4: Color mapping synchronized with server auto-assignment system
const COLOR_MAP = {
  'red': 0xFF0000,      // Player 1
  'blue': 0x0080FF,     // Player 2
  'green': 0x00FF00,    // Player 3
  'orange': 0xFF8000,   // Player 4
  'purple': 0x8000FF,   // Player 5
  'yellow': 0xFFD700,   // Player 6
  'cyan': 0x00FFFF,     // Player 7
  'pink': 0xFF69B4      // Player 8
};

// Visual elements
const pieceMeshes = {};
let validMoves = [];
let selectedPieceId = null;

// Visual effects manager - MOVED HERE TO FIX INITIALIZATION ORDER (will be initialized after scene is ready)
let visualEffects = null;

// Text label cache - MOVED HERE TO FIX INITIALIZATION ORDER
const textLabelCache = new Map();

// CLASS DEFINITIONS - MOVED HERE TO FIX INITIALIZATION ORDER
// Transition manager for smooth UI transitions
class TransitionManager {
  constructor() {
    this.activeTransitions = new Map();
  }
  
  fadeIn(element, duration = 500) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = progress.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  fadeOut(element, duration = 500) {
    const startTime = Date.now();
    const startOpacity = parseFloat(element.style.opacity) || 1;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      element.style.opacity = (startOpacity * (1 - progress)).toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    animate();
  }
  
  slideIn(element, direction = 'left', duration = 500) {
    const startTime = Date.now();
    const startPos = direction === 'left' ? -element.offsetWidth : element.offsetWidth;
    
    element.style.transform = `translateX(${startPos}px)`;
    element.style.display = 'block';
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentPos = startPos * (1 - this.easeOutCubic(progress));
      element.style.transform = `translateX(${currentPos}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
}

// Enhanced Visual Effects System
class VisualEffectsManager {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.activeEffects = new Map();
    this.animationQueue = [];
    this.particleSystem = null;
    this.transitionManager = new TransitionManager();
    
    // Initialize particle system
    this.initParticleSystem();
  }
  
  initParticleSystem() {
    // Create particle system for various effects
    this.particleSystem = {
      pool: [],
      active: [],
      maxParticles: 1000
    };
    
    // Pre-create particle pool
    for (let i = 0; i < this.particleSystem.maxParticles; i++) {
      const particle = this.createParticle();
      this.particleSystem.pool.push(particle);
    }
  }
  
  createParticle() {
    const geometry = new THREE.SphereGeometry(0.02, 4, 4);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 1
    });
    
    const particle = new THREE.Mesh(geometry, material);
    particle.visible = false;
    
    // Add particle properties
    particle.userData = {
      velocity: new THREE.Vector3(),
      life: 1.0,
      maxLife: 1.0,
      size: 0.02,
      color: new THREE.Color(0xffffff)
    };
    
    this.scene.add(particle);
    return particle;
  }
  
  getParticle() {
    if (this.particleSystem.pool.length > 0) {
      const particle = this.particleSystem.pool.pop();
      this.particleSystem.active.push(particle);
      return particle;
    }
    return null;
  }
  
  returnParticle(particle) {
    particle.visible = false;
    particle.userData.life = 1.0;
    particle.userData.velocity.set(0, 0, 0);
    
    const index = this.particleSystem.active.indexOf(particle);
    if (index > -1) {
      this.particleSystem.active.splice(index, 1);
      this.particleSystem.pool.push(particle);
    }
  }
  
  // Enhanced piece movement with smooth transitions
  animatePieceMovement(piece, fromPos, toPos, duration = 1000) {
    const mesh = pieceMeshes[piece.id];
    if (!mesh) return;
    
    // Create smooth curve for movement
    const curve = new THREE.QuadraticBezierCurve3(
      fromPos,
      new THREE.Vector3(
        (fromPos.x + toPos.x) / 2,
        Math.max(fromPos.y, toPos.y) + 0.5, // Arc above surface
        (fromPos.z + toPos.z) / 2
      ),
      toPos
    );
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = this.easeInOutCubic(progress);
      
      // Update position along curve
      const position = curve.getPoint(easeProgress);
      mesh.position.copy(position);
      
      // Add rotation animation
      mesh.rotation.y += 0.1;
      
      // Add scale animation
      const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
      mesh.scale.set(scale, scale, scale);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Reset scale
        mesh.scale.set(1, 1, 1);
      }
    };
    
    animate();
  }
  
  // Enhanced battle effects with particles
  createBattleEffect(pos1, pos2, winner, intensity = 1.0) {
    // Create lightning effect
    this.createLightningEffect(pos1, pos2, intensity);
    
    // Create particle explosion
    this.createParticleExplosion(pos1, 0xff4444, 20 * intensity);
    this.createParticleExplosion(pos2, 0x4444ff, 20 * intensity);
    
    // Create shockwave
    this.createShockwave(winner === 'pos1' ? pos1 : pos2, intensity);
    
    // Screen shake effect
    this.createScreenShake(intensity * 0.5);
  }
  
  createLightningEffect(pos1, pos2, intensity) {
    const segments = 20;
    const points = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = pos1.x + (pos2.x - pos1.x) * t + (Math.random() - 0.5) * 0.2 * intensity;
      const y = pos1.y + (pos2.y - pos1.y) * t + (Math.random() - 0.5) * 0.2 * intensity;
      const z = pos1.z + (pos2.z - pos1.z) * t + (Math.random() - 0.5) * 0.2 * intensity;
      
      points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 0.8,
      transparent: true,
      linewidth: 3
    });
    
    const lightning = new THREE.Line(geometry, material);
    this.scene.add(lightning);
    
    // Animate lightning
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / 300; // 300ms duration
      
      if (progress < 1) {
        // Flickering effect
        material.opacity = 0.8 * (1 - progress) * (Math.random() * 0.5 + 0.5);
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(lightning);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animate();
  }
  
  createParticleExplosion(center, color, count) {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      particle.position.copy(center);
      particle.visible = true;
      
      // Random velocity
      const speed = 0.02 + Math.random() * 0.08;
      particle.userData.velocity.set(
        (Math.random() - 0.5) * speed,
        Math.random() * speed,
        (Math.random() - 0.5) * speed
      );
      
      // Set color and life
      particle.material.color.setHex(color);
      particle.userData.life = 1.0;
      particle.userData.maxLife = 1.0 + Math.random() * 2.0;
    }
  }
  
  createShockwave(center, intensity) {
    const geometry = new THREE.RingGeometry(0, 0.1, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    
    const shockwave = new THREE.Mesh(geometry, material);
    shockwave.position.copy(center);
    shockwave.lookAt(center.clone().add(new THREE.Vector3(0, 1, 0)));
    
    this.scene.add(shockwave);
    
    // Animate shockwave
    const startTime = Date.now();
    const maxRadius = 2.0 * intensity;
    const duration = 800;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const radius = maxRadius * progress;
        shockwave.scale.set(radius, radius, 1);
        material.opacity = 0.6 * (1 - progress);
        
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(shockwave);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animate();
  }
  
  createScreenShake(intensity) {
    const originalPosition = camera.position.clone();
    const shakeIntensity = 0.02 * intensity;
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const shakeAmount = shakeIntensity * (1 - progress);
        camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeAmount;
        camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeAmount;
        camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeAmount;
        
        requestAnimationFrame(animate);
      } else {
        camera.position.copy(originalPosition);
      }
    };
    
    animate();
  }
  
  // Enhanced evolution effects
  createEvolutionEffect(position, fromType, toType) {
    // Create spiral particle effect
    this.createSpiralEffect(position, 0x00ff00, 1500);
    
    // Create type transition effect
    this.createTypeTransitionEffect(position, fromType, toType);
    
    // Create radial burst
    this.createRadialBurst(position, 0x00ff00, 30);
  }
  
  createSpiralEffect(center, color, duration) {
    const particleCount = 50;
    const spiralParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      particle.position.copy(center);
      particle.visible = true;
      particle.material.color.setHex(color);
      
      // Spiral parameters
      particle.userData.spiralAngle = (i / particleCount) * Math.PI * 4;
      particle.userData.spiralRadius = 0;
      particle.userData.spiralSpeed = 0.1 + Math.random() * 0.1;
      particle.userData.spiralHeight = 0;
      
      spiralParticles.push(particle);
    }
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        spiralParticles.forEach(particle => {
          if (!particle.visible) return;
          
          // Update spiral motion
          particle.userData.spiralAngle += particle.userData.spiralSpeed;
          particle.userData.spiralRadius = progress * 0.8;
          particle.userData.spiralHeight = progress * 1.5;
          
          // Calculate position
          const x = center.x + Math.cos(particle.userData.spiralAngle) * particle.userData.spiralRadius;
          const y = center.y + particle.userData.spiralHeight;
          const z = center.z + Math.sin(particle.userData.spiralAngle) * particle.userData.spiralRadius;
          
          particle.position.set(x, y, z);
          particle.material.opacity = 1 - progress;
        });
        
        requestAnimationFrame(animate);
      } else {
        // Clean up particles
        spiralParticles.forEach(particle => {
          this.returnParticle(particle);
        });
      }
    };
    
    animate();
  }
  
  createTypeTransitionEffect(position, fromType, toType) {
    // Create floating text effect showing evolution
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.fillText(`${fromType} → ${toType}`, canvas.width / 2, canvas.height / 2 + 8);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ 
      map: texture,
      transparent: true,
      opacity: 1
    });
    
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.8;
    sprite.scale.set(0.5, 0.2, 1);
    
    this.scene.add(sprite);
    
    // Animate text
    const startTime = Date.now();
    const duration = 2000;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        // Float upward
        sprite.position.y = position.y + 0.8 + progress * 0.5;
        
        // Fade out
        material.opacity = 1 - progress;
        
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(sprite);
        texture.dispose();
        material.dispose();
      }
    };
    
    animate();
  }
  
  createRadialBurst(center, color, count) {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle();
      if (!particle) continue;
      
      particle.position.copy(center);
      particle.visible = true;
      particle.material.color.setHex(color);
      
      // Radial velocity
      const angle = (i / count) * Math.PI * 2;
      const speed = 0.05 + Math.random() * 0.03;
      
      particle.userData.velocity.set(
        Math.cos(angle) * speed,
        Math.random() * 0.02,
        Math.sin(angle) * speed
      );
      
      particle.userData.life = 1.0;
      particle.userData.maxLife = 1.0 + Math.random() * 1.0;
    }
  }
  
  // Update particle system
  updateParticles(deltaTime) {
    this.particleSystem.active.forEach(particle => {
      if (!particle.visible) return;
      
      // Update position
      particle.position.add(particle.userData.velocity);
      
      // Update life
      particle.userData.life -= deltaTime / 1000;
      
      // Update opacity based on life
      particle.material.opacity = particle.userData.life / particle.userData.maxLife;
      
      // Apply gravity
      particle.userData.velocity.y -= 0.001;
      
      // Check if particle should be returned to pool
      if (particle.userData.life <= 0) {
        this.returnParticle(particle);
      }
    });
  }
  
  // Utility functions
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
  }
  
  // Cleanup
  cleanup() {
    this.activeEffects.clear();
    this.animationQueue.length = 0;
    
    // Clean up particles
    [...this.particleSystem.pool, ...this.particleSystem.active].forEach(particle => {
      this.scene.remove(particle);
      if (particle.geometry) particle.geometry.dispose();
      if (particle.material) particle.material.dispose();
    });
  }
}

// UI elements - moved to top of file

// Socket event handlers are now set up in setupSocketListeners() function

// Duplicate socket handlers removed - all handlers now properly set up in setupSocketListeners() function

// More duplicate socket handlers removed

// Removed all duplicate socket handlers - they are now properly handled in setupSocketListeners() function

// All remaining duplicate socket handlers below this point should also be removed
// [REMOVED: 62 duplicate socket handlers that were causing "Cannot read properties of null" errors in production]

// Chat system variables
let chatVisible = true;
let chatMessages = [];

// Chat system functions
function initializeChatSystem() {
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-chat');
  const toggleButton = document.getElementById('toggle-chat');
  
  // Send message on Enter key
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendChatMessage();
    }
  });
  
  // Send message on button click
  sendButton.addEventListener('click', sendChatMessage);
  
  // Toggle chat visibility
  toggleButton.addEventListener('click', toggleChat);
  
  // Add keyboard shortcut to cancel queued moves
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Cancel queued move
      socket.emit('cancel-queued-move');
    }
  });
  
  console.log('Chat system initialized');
}

function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();
  
  if (message.length === 0) return;
  if (message.length > 200) {
    showNotification('Chat Error', 'Message too long (max 200 characters)', 'error');
    return;
  }
  
  socket.emit('send-chat-message', {
    roomId: 'main',
    message: message
  });
  
  chatInput.value = '';
}

function toggleChat() {
  const chatUI = document.getElementById('chat-ui');
  const toggleButton = document.getElementById('toggle-chat');
  
  if (chatVisible) {
    chatUI.style.height = '40px';
    chatUI.style.overflow = 'hidden';
    toggleButton.textContent = 'Show';
    chatVisible = false;
  } else {
    chatUI.style.height = '300px';
    chatUI.style.overflow = 'visible';
    toggleButton.textContent = 'Hide';
    chatVisible = true;
  }
}

function addChatMessage(messageData) {
  const messagesContainer = document.getElementById('chat-messages');
  const messageElement = document.createElement('div');
  
  const timestamp = new Date(messageData.timestamp).toLocaleTimeString();
  const messageStyle = getChatMessageStyle(messageData.type);
  
  messageElement.innerHTML = `
    <div style="margin-bottom: 4px; ${messageStyle}">
      <span style="color: #888; font-size: 10px;">[${timestamp}]</span>
      <span style="color: ${getPlayerColor(messageData.playerId)}; font-weight: bold;">${messageData.playerName}:</span>
      <span style="color: #fff;">${messageData.message}</span>
    </div>
  `;
  
  messagesContainer.appendChild(messageElement);
  
  // Auto-scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Remove placeholder message if it exists
  const placeholder = messagesContainer.querySelector('[style*="font-style: italic"]');
  if (placeholder) {
    placeholder.remove();
  }
  
  // Keep only last 50 messages
  while (messagesContainer.children.length > 50) {
    messagesContainer.removeChild(messagesContainer.firstChild);
  }
}

function getChatMessageStyle(messageType) {
  const styles = {
    'chat': '',
    'system': 'color: #ffff00; font-style: italic;',
    'game_event': 'color: #00cc88; font-style: italic;',
    'player_joined': 'color: #00ff00; font-style: italic;',
    'player_left': 'color: #ff8800; font-style: italic;'
  };
  
  return styles[messageType] || '';
}

// Removed duplicate getPlayerColor function - using the one that supports color selection system

function updateChatStatus(status) {
  const chatStatus = document.getElementById('chat-status');
  chatStatus.textContent = status;
}

// Timer system socket handlers
// [REMOVED: 27 more duplicate socket handlers that were causing "Cannot read properties of null" errors]

function updatePlayerColorDisplay() {
  const colorDisplayEl = document.getElementById('player-color-display');
  if (!colorDisplayEl) return;
  
  const myPlayer = gameState.players[socket.id];
  if (myPlayer) {
    const playerColor = getPlayerColor(myPlayer.id, myPlayer.index);
    const colorHex = '#' + playerColor.toString(16).padStart(6, '0');
    
    colorDisplayEl.textContent = `Player ${myPlayer.index + 1} Color`;
    colorDisplayEl.style.color = colorHex;
    colorDisplayEl.style.fontWeight = 'bold';
  } else {
    colorDisplayEl.textContent = 'Auto-assigned on join';
    colorDisplayEl.style.color = '#888';
  }
}

// Auto-update color display when game state changes
socket.on('game-state-update', (data) => {
  // ... existing game state update logic ...
  updatePlayerColorDisplay(); // Update color display
}); 

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

// ✅ PHASE 5: Legacy dialog system - replaced by context menu
// function showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit) {
//   console.log('🎯 showEvolutionChoiceDialog called with:', { pieceId, piece, reason, availablePaths, bankInfo, timeLimit });

function showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit) {
  console.log('🎯 PHASE 5: Legacy showEvolutionChoiceDialog - redirecting to context menu');
  // Fallback to context menu if called directly
  showEvolutionContextMenu({pieceId, piece, reason, availablePaths, bankInfo, timeLimit}, lastRightClickEvent || {clientX: window.innerWidth/2, clientY: window.innerHeight/2});
  return; // Skip the old dialog code below
  
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
function showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions) {
  // Create dialog HTML
  const dialogHtml = `
    <div id="move-choice-dialog" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 20px;
      color: white;
      text-align: center;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
    ">
      <h3 style="margin: 0 0 20px 0; color: #ff6b6b;">Choose Action</h3>
      <p style="margin-bottom: 20px;">Position (${targetRow}, ${targetCol}) - Multiple actions available:</p>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="move-choice-regular" style="
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">→</div>
          <div>Move</div>
          <div style="font-size: 12px; opacity: 0.8;">Regular movement</div>
        </button>
        
        <button id="move-choice-split" style="
          background-color: #ff6b6b;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">⧨</div>
          <div>Split</div>
          <div style="font-size: 12px; opacity: 0.8;">Create two pieces</div>
        </button>
      </div>
      
      <button id="move-choice-cancel" style="
        background-color: #666;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 15px;
        pointer-events: auto;
        position: relative;
        z-index: 10001;
      ">Cancel</button>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners
  document.getElementById('move-choice-regular').addEventListener('click', function() {
    executeMoveChoice(pieceId, targetRow, targetCol, 'move');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-split').addEventListener('click', function() {
    executeMoveChoice(pieceId, targetRow, targetCol, 'split');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-cancel').addEventListener('click', function() {
    closeMoveChoiceDialog();
  });
}

function closeMoveChoiceDialog() {
  const dialog = document.getElementById('move-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
}

function executeMoveChoice(pieceId, targetRow, targetCol, moveType) {
  if (moveType === 'split') {
    console.log(`🔄 SPLIT chosen - Sending split-piece event for ${pieceId} to (${targetRow}, ${targetCol})`);
    window.globalSocket.emit('split-piece', {
      pieceId: pieceId,
      targetRow: targetRow,
      targetCol: targetCol
    });
    gameInfoEl.textContent = `Splitting piece...`;
  } else {
    console.log('🚀 MOVE chosen - Sending move-piece event');
    window.globalSocket.emit('move-piece', {
      pieceId: pieceId,
      targetRow: targetRow,
      targetCol: targetCol
    });
    gameInfoEl.textContent = `Moving piece...`;
  }
  
  // Clear highlights after action
  clearValidMoveHighlights();
  selectedPieceId = null;
}

function closeEvolutionDialog() {
  const dialog = document.getElementById('evolution-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
  
  // Clear countdown timer
  if (window.evolutionCountdown) {
    clearInterval(window.evolutionCountdown);
    window.evolutionCountdown = null;
  }
}

// ✅ PHASE 5: Evolution Context Menu System
function showEvolutionContextMenu(data, mouseEvent) {
  console.log('🎯 PHASE 5: showEvolutionContextMenu called with:', data);
  
  // Remove any existing context menu
  hideEvolutionContextMenu();
  
  if (!mouseEvent) {
    console.warn('⚠️ No mouse event provided for context menu position');
    return;
  }
  
  const { pieceId, piece, reason, availablePaths, piecePoints, timeLimit } = data;
  
  // Create context menu at mouse position
  const contextMenu = document.createElement('div');
  contextMenu.id = 'evolution-context-menu';
  contextMenu.style.cssText = `
    position: fixed;
    left: ${mouseEvent.clientX}px;
    top: ${mouseEvent.clientY}px;
    background: #2a2a2a;
    color: white;
    border: 2px solid #4CAF50;
    border-radius: 8px;
    padding: 8px 0;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    min-width: 200px;
    font-family: 'Orbitron', monospace;
    font-size: 14px;
    animation: contextMenuFadeIn 0.2s ease-out;
  `;
  
  // Add CSS animation for smooth appearance
  const style = document.createElement('style');
  style.textContent = `
    @keyframes contextMenuFadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .context-menu-item {
      padding: 10px 15px;
      cursor: pointer;
      border-bottom: 1px solid #444;
      transition: background-color 0.2s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .context-menu-item:last-child {
      border-bottom: none;
    }
    .context-menu-item:hover {
      background-color: #4CAF50;
      color: white;
    }
    .context-menu-item.disabled {
      color: #666;
      cursor: not-allowed;
    }
    .context-menu-item.disabled:hover {
      background-color: transparent;
      color: #666;
    }
    .context-menu-header {
      padding: 8px 15px;
      background: #4CAF50;
      color: white;
      font-weight: bold;
      font-size: 12px;
      text-align: center;
    }
    .context-menu-cost {
      color: #ffd700;
      font-size: 12px;
      font-weight: bold;
    }
  `;
  
  if (!document.getElementById('context-menu-styles')) {
    style.id = 'context-menu-styles';
    document.head.appendChild(style);
  }
  
  // Create menu content
  let menuHTML = `
    <div class="context-menu-header">
      ${piece.symbol} ${piece.type} Evolution
      <div style="font-size: 10px; font-weight: normal; margin-top: 2px;">
        Points: ${piecePoints} | Time: <span id="context-timer">${timeLimit}s</span>
      </div>
    </div>
  `;
  
  // ✅ PHASE 6: Group evolution paths by cost
  const pathsByPointCost = {};
  availablePaths.forEach(path => {
    if (!pathsByPointCost[path.cost]) {
      pathsByPointCost[path.cost] = [];
    }
    pathsByPointCost[path.cost].push(path);
  });
  
  // Sort point costs
  const sortedCosts = Object.keys(pathsByPointCost).map(Number).sort((a, b) => a - b);
  
  // Add evolution paths grouped by cost
  sortedCosts.forEach(cost => {
    // Add section header for each point value
    if (pathsByPointCost[cost].length > 0) {
      menuHTML += `
        <div style="padding: 5px 15px; font-size: 11px; color: #888; background: #1a1a1a; font-weight: bold;">
          ${cost} POINT${cost > 1 ? 'S' : ''}
        </div>
      `;
      
      pathsByPointCost[cost].forEach(path => {
        const canAfford = piecePoints >= path.cost;
        const itemClass = canAfford ? 'context-menu-item' : 'context-menu-item disabled';
        
        menuHTML += `
          <div class="${itemClass}" data-action="evolve" data-piece-id="${pieceId}" data-path='${JSON.stringify(path)}'>
            <div>
              <div>${path.icon} ${path.name}</div>
              <div style="font-size: 11px; color: #ccc;">${path.description}</div>
            </div>
            <div class="context-menu-cost">${path.cost}pts</div>
          </div>
        `;
      });
    }
  });
  
  // ✅ PHASE 6: Removed bank option - point-based system doesn't need banking
  
  contextMenu.innerHTML = menuHTML;
  document.body.appendChild(contextMenu);
  
  // Position adjustment to keep menu on screen
  const menuRect = contextMenu.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  if (menuRect.right > windowWidth) {
    contextMenu.style.left = (mouseEvent.clientX - menuRect.width) + 'px';
  }
  if (menuRect.bottom > windowHeight) {
    contextMenu.style.top = (mouseEvent.clientY - menuRect.height) + 'px';
  }
  
  // Add click handlers
  contextMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.context-menu-item');
    if (!item || item.classList.contains('disabled')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const action = item.getAttribute('data-action');
    const pieceId = item.getAttribute('data-piece-id');
    
    if (action === 'evolve') {
      const path = JSON.parse(item.getAttribute('data-path'));
      console.log('🎯 PHASE 6: Context menu evolution chosen:', path);
      chooseEvolution(pieceId, path);
    }
    
    hideEvolutionContextMenu();
  });
  
  // Start countdown timer
  let timeLeft = timeLimit;
  const timerElement = document.getElementById('context-timer');
  
  const countdown = setInterval(() => {
    timeLeft--;
    if (timerElement) {
      timerElement.textContent = timeLeft + 's';
    }
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      console.log('🎯 PHASE 6: Context menu timeout, closing menu');
      // ✅ PHASE 6: Just close the menu on timeout - no auto-banking
      hideEvolutionContextMenu();
    }
  }, 1000);
  
  // Store countdown reference for cleanup
  window.evolutionContextCountdown = countdown;
  
  // Hide menu when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('click', hideEvolutionContextMenu, { once: true });
  }, 100);
  
  console.log('🎯 PHASE 5: Evolution context menu displayed successfully');
}

function hideEvolutionContextMenu() {
  const contextMenu = document.getElementById('evolution-context-menu');
  if (contextMenu) {
    contextMenu.remove();
  }
  
  // Clear countdown timer
  if (window.evolutionContextCountdown) {
    clearInterval(window.evolutionContextCountdown);
    window.evolutionContextCountdown = null;
  }
}

// Show vault capture selection UI
function showVaultCaptureSelection(data) {
  const { pieceId, pieceType, jumpArea, enemyPieces, maxCaptures, canLandOnEnemy, landingCapture, timeLimit } = data;
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'vault-capture-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
  `;
  
  // Create selection dialog
  const dialog = document.createElement('div');
  dialog.className = 'vault-capture-dialog';
  dialog.style.cssText = `
    background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
    border: 2px solid #FFD700;
    border-radius: 15px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  `;
  
  // Title
  const title = document.createElement('h2');
  title.textContent = `${pieceType} Capture Selection`;
  title.style.cssText = `
    color: #FFD700;
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
  `;
  dialog.appendChild(title);
  
  // Instructions
  const instructions = document.createElement('p');
  instructions.textContent = `Select up to ${maxCaptures} enemy pieces to capture:`;
  instructions.style.cssText = `
    color: #fff;
    text-align: center;
    margin-bottom: 20px;
  `;
  dialog.appendChild(instructions);
  
  // Enemy pieces list
  const piecesList = document.createElement('div');
  piecesList.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
  `;
  
  const selectedPieces = new Set();
  
  enemyPieces.forEach(enemy => {
    const pieceCard = document.createElement('div');
    pieceCard.style.cssText = `
      background: #333;
      border: 2px solid #666;
      border-radius: 10px;
      padding: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    
    const symbol = document.createElement('div');
    symbol.textContent = enemy.symbol;
    symbol.style.cssText = `
      font-size: 32px;
      margin-bottom: 5px;
    `;
    pieceCard.appendChild(symbol);
    
    const type = document.createElement('div');
    type.textContent = enemy.type;
    type.style.cssText = `
      color: #ccc;
      font-size: 12px;
    `;
    pieceCard.appendChild(type);
    
    const position = document.createElement('div');
    position.textContent = `(${enemy.position.row}, ${enemy.position.col})`;
    position.style.cssText = `
      color: #999;
      font-size: 10px;
    `;
    pieceCard.appendChild(position);
    
    pieceCard.onclick = () => {
      if (selectedPieces.has(enemy.id)) {
        selectedPieces.delete(enemy.id);
        pieceCard.style.border = '2px solid #666';
        pieceCard.style.background = '#333';
      } else if (selectedPieces.size < maxCaptures) {
        selectedPieces.add(enemy.id);
        pieceCard.style.border = '2px solid #FFD700';
        pieceCard.style.background = '#444';
      }
      updateConfirmButton();
    };
    
    piecesList.appendChild(pieceCard);
  });
  
  dialog.appendChild(piecesList);
  
  // Landing capture info
  if (landingCapture && canLandOnEnemy) {
    const landingInfo = document.createElement('div');
    landingInfo.style.cssText = `
      background: #444;
      border: 2px solid #FF6600;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
      text-align: center;
    `;
    landingInfo.innerHTML = `
      <p style="color: #FF6600; margin: 0 0 10px 0;">Landing Square Capture:</p>
      <div style="font-size: 24px;">${landingCapture.symbol}</div>
      <div style="color: #ccc; font-size: 14px;">${landingCapture.type} at (${landingCapture.position.row}, ${landingCapture.position.col})</div>
      <div style="color: #999; font-size: 12px; margin-top: 10px;">This piece will be captured automatically when landing</div>
    `;
    dialog.appendChild(landingInfo);
  }
  
  // Timer
  const timer = document.createElement('div');
  timer.style.cssText = `
    text-align: center;
    color: #FFD700;
    font-size: 18px;
    margin-bottom: 20px;
  `;
  let timeRemaining = timeLimit;
  const updateTimer = () => {
    timer.textContent = `Time remaining: ${timeRemaining}s`;
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      // Auto-submit with current selection
      submitSelection();
    }
  };
  updateTimer();
  const timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimer();
  }, 1000);
  dialog.appendChild(timer);
  
  // Buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    justify-content: center;
  `;
  
  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Confirm Selection';
  confirmButton.style.cssText = `
    background: #FFD700;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.5;
  `;
  confirmButton.disabled = true;
  
  const updateConfirmButton = () => {
    if (selectedPieces.size > 0) {
      confirmButton.disabled = false;
      confirmButton.style.opacity = '1';
      confirmButton.textContent = `Capture ${selectedPieces.size} piece${selectedPieces.size > 1 ? 's' : ''}`;
    } else {
      confirmButton.disabled = true;
      confirmButton.style.opacity = '0.5';
      confirmButton.textContent = 'Select pieces to capture';
    }
  };
  
  const submitSelection = () => {
    clearInterval(timerInterval);
    socket.emit('vault-capture-response', {
      selectedCaptures: Array.from(selectedPieces)
    });
    document.body.removeChild(overlay);
  };
  
  confirmButton.onclick = submitSelection;
  buttonContainer.appendChild(confirmButton);
  
  dialog.appendChild(buttonContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  updateConfirmButton();
}

// Create heir production visual effect
function createHeirProductionEffect(worldPos) {
  // Create golden crown particles
  const particleCount = 50;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 1
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(worldPos.x, worldPos.y, worldPos.z);
    
    // Random velocity
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      Math.random() * 0.03 + 0.01,
      (Math.random() - 0.5) * 0.02
    );
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // Create golden ring effect
  const ringGeometry = new THREE.RingGeometry(0.1, 0.3, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFD700,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(worldPos.x, worldPos.y, worldPos.z);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
  
  // Animate the effect
  let animationTime = 0;
  const animateHeirEffect = () => {
    animationTime += 0.02;
    
    // Animate particles
    particles.forEach((particle, index) => {
      particle.position.add(particle.userData.velocity);
      particle.userData.velocity.y -= 0.0005; // Gravity
      particle.material.opacity = 1 - animationTime;
      particle.scale.setScalar(1 + animationTime * 0.5);
    });
    
    // Animate ring
    ring.scale.setScalar(1 + animationTime * 3);
    ring.material.opacity = 0.8 - animationTime;
    
    if (animationTime < 1) {
      requestAnimationFrame(animateHeirEffect);
    } else {
      // Clean up
      particles.forEach(particle => {
        scene.remove(particle);
        particle.geometry.dispose();
        particle.material.dispose();
      });
      scene.remove(ring);
      ringGeometry.dispose();
      ringMaterial.dispose();
    }
  };
  
  animateHeirEffect();
}

// Show info modal
function showInfoModal(title, message, icon, type = 'info') {
  const modal = document.createElement('div');
  modal.className = 'modal modal-open';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  const modalBox = document.createElement('div');
  modalBox.className = 'modal-box';
  modalBox.style.cssText = `
    background: #2a2a3e;
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transform: scale(0.9);
    transition: transform 0.3s ease;
  `;
  
  const colors = {
    info: '#3ABFF8',
    warning: '#FBBD23',
    error: '#F87272',
    success: '#36D399'
  };
  
  modalBox.innerHTML = `
    <h3 class="font-bold text-2xl mb-4 flex items-center gap-3">
      <i class="fas ${icon}" style="color: ${colors[type]};"></i>
      ${title}
    </h3>
    <p class="text-base-content/80 mb-6">${message}</p>
    <div class="modal-action">
      <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
        <i class="fas fa-check mr-2"></i>OK
      </button>
    </div>
  `;
  
  modal.appendChild(modalBox);
  document.body.appendChild(modal);
  
  // Animate in
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modalBox.style.transform = 'scale(1)';
  });
}

// Show evolution guide
function showEvolutionGuide() {
  const modal = document.createElement('div');
  modal.className = 'modal modal-open';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  const modalBox = document.createElement('div');
  modalBox.className = 'modal-box';
  modalBox.style.cssText = `
    background: #2a2a3e;
    border-radius: 15px;
    padding: 30px;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transform: scale(0.9);
    transition: transform 0.3s ease;
  `;
  
  modalBox.innerHTML = `
    <h3 class="font-bold text-2xl mb-4 flex items-center gap-3">
      <i class="fas fa-dna" style="color: #36D399;"></i>
      Evolution Guide
    </h3>
    
    <div class="space-y-4">
      <div class="alert alert-info">
        <i class="fas fa-info-circle"></i>
        <span>Capture pieces to gain evolution points equal to their value!</span>
      </div>
      
      <h4 class="font-bold text-lg text-primary">Basic Rules:</h4>
      <ul class="list-disc list-inside space-y-2 text-base-content/80">
        <li>Pawns gain +1 point after 9 moves (crossing equator)</li>
        <li>Pawns gain +8 points after 18 moves (circumnavigation)</li>
        <li>Splitters gain +8 points when reaching poles</li>
        <li>Right-click any piece to evolve with available points</li>
      </ul>
      
      <h4 class="font-bold text-lg text-primary mt-4">Evolution Paths:</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div class="badge badge-lg gap-2">Pawn → Splitter (2 pts)</div>
        <div class="badge badge-lg gap-2">Splitter → Bishop/Knight (3 pts)</div>
        <div class="badge badge-lg gap-2">Bishop/Knight → Vaultbound (4 pts)</div>
        <div class="badge badge-lg gap-2">Rook → Vaultseer (7 pts)</div>
        <div class="badge badge-lg gap-2">Queen → Covenant Queen (12 pts)</div>
      </div>
      
      <h4 class="font-bold text-lg text-primary mt-4">Special Abilities:</h4>
      <ul class="list-disc list-inside space-y-2 text-base-content/80">
        <li><strong>Splitter:</strong> Can split into copies</li>
        <li><strong>Vault Pieces:</strong> Jump over enemies to capture</li>
        <li><strong>Vaultmistress:</strong> Can produce heirs</li>
        <li><strong>Covenant Queen:</strong> Dual movement modes + heir production</li>
      </ul>
    </div>
    
    <div class="modal-action mt-6">
      <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
        <i class="fas fa-check mr-2"></i>Got it!
      </button>
    </div>
  `;
  
  modal.appendChild(modalBox);
  document.body.appendChild(modal);
  
  // Animate in
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modalBox.style.transform = 'scale(1)';
  });
} 