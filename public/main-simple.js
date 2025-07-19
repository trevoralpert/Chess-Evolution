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
  
  // Color picker setup for menu
  const menuColorOptions = document.getElementById('menu-color-options');
  const colors = [
    '#00ff00', '#ff0000', '#0088ff', '#ffff00', '#ff00ff', 
    '#00ffff', '#ff8800', '#ffffff', '#8800ff', '#00ff88'
  ];
  
  colors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.style.width = '30px';
    colorDiv.style.height = '30px';
    colorDiv.style.backgroundColor = color;
    colorDiv.style.border = '2px solid transparent';
    colorDiv.style.cursor = 'pointer';
    colorDiv.style.borderRadius = '5px';
    
    colorDiv.addEventListener('click', () => {
      // Remove previous selection
      menuColorOptions.querySelectorAll('div').forEach(d => {
        d.style.border = '2px solid transparent';
      });
      // Select this color
      colorDiv.style.border = '2px solid white';
      menuSelectedColor = color;
    });
    
    // Select first color by default
    if (color === colors[0]) {
      colorDiv.style.border = '2px solid white';
    }
    
    menuColorOptions.appendChild(colorDiv);
  });
  
  // Menu button handlers
  document.getElementById('quick-play-btn').addEventListener('click', () => {
    console.log('Starting quick play...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'quickplay';
    startGame();
  });
  
  document.getElementById('vs-ai-btn').addEventListener('click', () => {
    console.log('Starting vs AI...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'vsai';
    startGame();
  });
  
  document.getElementById('create-game-btn').addEventListener('click', () => {
    console.log('Starting multiplayer game...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'multiplayer';
    startGame();
  });
  
  document.getElementById('join-game-btn').addEventListener('click', () => {
    console.log('Joining multiplayer game...');
    playerName = document.getElementById('player-name-input').value || 'Player ' + Math.floor(Math.random() * 1000);
    gameMode = 'multiplayer';
    startGame();
  });
  
  document.getElementById('tournament-btn').addEventListener('click', () => {
    alert('Tournament mode coming soon!\n\nTournament functionality is implemented on the server but needs UI integration.');
  });
  
  document.getElementById('spectate-btn').addEventListener('click', () => {
    alert('Spectator mode coming soon!\n\nSpectator functionality is implemented on the server but needs UI integration.');
  });
  
  document.getElementById('evolution-guide-btn').addEventListener('click', () => {
    alert('Evolution Guide coming soon!\n\nBasic rules:\n- Pawns gain 1 point for crossing equator\n- Capture pieces to gain their value\n- Evolve pieces with points:\n  • Pawn → Splitter (2 pts)\n  • Splitter → Bishop/Knight (3 pts)\n  • And many more!');
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
  // Get the proper color ID from the new color selection system
  const colorToUse = selectedColor || 'magenta'; // Default to magenta if none selected
  console.log('🎮 Starting game with:', { playerName, color: colorToUse, gameMode });
  
  // Prevent multiple connections
  if (socket && socket.connected) {
    console.log('⚠️ Already connected to server');
    return;
  }
  
  // Hide menu, show game UI and timer
  menuScreen.style.display = 'none';
  gameUI.style.display = 'block';
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'block';
  isInGame = true;
  
  // Initialize the game with player settings
  window.playerSettings = {
    name: playerName,
    color: colorToUse,
    mode: gameMode
  };
  
  // Initialize socket connection
  socket = io();
  window.globalSocket = socket;
  console.log('Socket.io initialized for game');
  
  // Set up all socket event listeners
  setupSocketListeners();
  
  // Continue with normal game initialization after socket is ready
}

// Return to menu
function returnToMenu() {
  console.log('🏠 Returning to menu...');
  
  // Clear any running timers
  if (typeof currentTimer !== 'undefined' && currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  // Hide game screens and timer
  gameUI.style.display = 'none';
  gameOverScreen.style.display = 'none';
  const timingUI = document.getElementById('timing-ui');
  if (timingUI) timingUI.style.display = 'none';
  
  // Show menu
  menuScreen.style.display = 'flex';
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
    
    // Send player info to server
    const colorToUse = selectedColor || 'magenta'; // Use new color selection system
    socket.emit('player-joined', {
      name: playerName,
      color: colorToUse
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
      
      await updateVisuals();
      updateUI();
      console.log('🔄 Full update completed');
    } else {
      // Delta update - only update changed elements
      console.log('🔄 Processing delta update');
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
      console.error('Move failed:', data.error);
      showNotification(data.error, '#ff0000', 3000);
    }
  });

  socket.on('battle-result', (data) => {
    const { winner, loser, battleType } = data;
    console.log(`Battle result: ${winner} defeated ${loser} (${battleType})`);
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
    const { playerId, amount, reason } = data;
    console.log(`Evolution points awarded: ${amount} to ${playerId} for ${reason}`);
    
    // Update player's evolution points in game state
    if (gameState.players[playerId]) {
      gameState.players[playerId].evolutionPoints = (gameState.players[playerId].evolutionPoints || 0) + amount;
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

  // Color selection handlers
  socket.on('color-selected', (data) => {
    const { playerId, color } = data;
    console.log(`Player ${playerId} selected color: ${color}`);
    updateColorSelector();
  });

  socket.on('available-colors', (data) => {
    const { colors } = data;
    console.log('Available colors:', colors);
    updateColorSelector();
  });

  // Evolution choice handlers
  socket.on('evolution-choice-available', (data) => {
    console.log('🎯 Evolution choice available:', data);
    // Use the working dialog system instead of the broken panel system
    showEvolutionChoiceDialog(data.pieceId, data.piece, 'player_request', data.availablePaths, data.bankInfo, data.timeLeft || 30);
    showEvolutionUI(); // Auto-show evolution UI when choice is available
  });

  socket.on('evolution-choice-success', (data) => {
    console.log('🎯 Evolution choice success:', data);
    handleEvolutionCompleted(data);
  });

  socket.on('evolution-choice-failed', (data) => {
    console.log('🎯 Evolution choice failed:', data);
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
    const { pieceId, piece, reason, availablePaths, bankInfo, timeLimit } = data;
    showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit);
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
  
  // Update UI
  updateTimerDisplay();
  
  // Start the timer interval
  if (currentTimer) {
    clearInterval(currentTimer);
  }
  
  currentTimer = setInterval(() => {
    if (!isTimerPaused) {
      updateTimerDisplay();
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

function updateTimerDisplay() {
  const timeRemainingElement = document.getElementById('time-remaining');
  const timerBarElement = document.getElementById('timer-bar');
  const timerStatusElement = document.getElementById('timer-status');
  
  if (isTimerPaused) {
    const remainingSeconds = pausedTimeRemaining / 1000;
    timeRemainingElement.textContent = remainingSeconds.toFixed(1);
    timerBarElement.style.width = `${(pausedTimeRemaining / 7000) * 100}%`;
    return;
  }
  
  const elapsed = Date.now() - timerStartTime;
  const remaining = Math.max(0, timerDuration - elapsed);
  const remainingSeconds = remaining / 1000;
  
  timeRemainingElement.textContent = remainingSeconds.toFixed(1);
  
  // Update progress bar
  const progress = (remaining / timerDuration) * 100;
  timerBarElement.style.width = `${progress}%`;
  
  // Update status
  if (remaining <= 0) {
    timerStatusElement.textContent = 'Time expired!';
    timerStatusElement.style.color = '#ff0000';
    if (currentTimer) {
      clearInterval(currentTimer);
      currentTimer = null;
    }
  } else {
    timerStatusElement.textContent = 'Timer Active';
    timerStatusElement.style.color = '#ccc';
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
  'JUMPER': './chess piece models/Final pieces/JUMPER.glb',
  'SUPER_JUMPER': './chess piece models/Final pieces/SUPER_JUMPER.glb',
  'HYPER_JUMPER': './chess piece models/Final pieces/HYPER_JUMPER.glb',
  'MISTRESS_JUMPER': './chess piece models/Final pieces/MISTRESS_JUMPER.glb',
  'HYBRID_QUEEN': './chess piece models/Final pieces/HYBRID_QUEEN.glb'
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

// Color mapping from server color IDs to hex values - MOVED HERE TO FIX INITIALIZATION ORDER
const COLOR_MAP = {
  'red': 0xFF0000,
  'blue': 0x0080FF,
  'light_blue': 0x40C0FF,
  'green': 0x00FF00,
  'yellow': 0xFFD700,
  'purple': 0x8000FF,
  'magenta': 0xFF00FF,
  'cyan': 0x00FFFF,
  'orange': 0xFF8000,
  'pink': 0xFF69B4,
  'lime': 0x00FF80,
  'teal': 0x008080
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

socket.on('tournament-joined', (data) => {
  const { tournament, player } = data;
  console.log(`Joined tournament: ${tournament.name} as ${player.name}`);
  gameInfoEl.textContent = `Joined tournament: ${tournament.name}`;
  gameInfoEl.style.color = '#44ff44';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
  
  updateTournamentStatus(tournament);
});

socket.on('tournament-join-failed', (data) => {
  const { error } = data;
  console.log(`Failed to join tournament: ${error}`);
  gameInfoEl.textContent = `Failed to join tournament: ${error}`;
  gameInfoEl.style.color = '#ff4444';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
});

socket.on('tournament-started', (data) => {
  const { tournament } = data;
  console.log(`Tournament started: ${tournament.name}`);
  gameInfoEl.textContent = `Tournament started: ${tournament.name}`;
  gameInfoEl.style.color = '#ffd700';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
  
  updateTournamentStatus(tournament);
});

socket.on('tournament-updated', (data) => {
  const { tournament } = data;
  updateTournamentStatus(tournament);
});

socket.on('tournament-match-started', (data) => {
  const { tournamentId, match, tournament } = data;
  console.log(`Tournament match started: ${match.player1.name} vs ${match.player2.name}`);
  gameInfoEl.textContent = `Match started: ${match.player1.name} vs ${match.player2.name}`;
  gameInfoEl.style.color = '#ffd700';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
  
  updateTournamentStatus(tournament);
});

socket.on('tournament-match-completed', (data) => {
  const { match, tournament } = data;
  console.log(`Tournament match completed: ${match.winner.name} wins!`);
  gameInfoEl.textContent = `Match completed: ${match.winner.name} wins!`;
  gameInfoEl.style.color = '#44ff44';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
  
  updateTournamentStatus(tournament);
});

socket.on('tournament-completed', (data) => {
  const { tournament, winner, prizes, leaderboard } = data;
  console.log(`Tournament completed: ${winner.name} is the champion!`);
  gameInfoEl.textContent = `🏆 Tournament Champion: ${winner.name}! 🏆`;
  gameInfoEl.style.color = '#ffd700';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 10000);
  
  updateTournamentStatus(tournament);
  
  // Display championship celebration
  if (leaderboard && leaderboard.length > 0) {
    const championInfo = leaderboard.find(p => p.isChampion);
    if (championInfo) {
      setTimeout(() => {
        alert(`🏆 TOURNAMENT CHAMPION 🏆\n\n${championInfo.name}\n\nWins: ${championInfo.wins}\nWin Rate: ${championInfo.winRate}%\n\nCongratulations!`);
      }, 1000);
    }
  }
});

socket.on('tournament-info', (data) => {
  const { tournament } = data;
  updateTournamentStatus(tournament);
});

socket.on('battle-contest-prompt', (data) => {
  const { battleId, attackingPiece, defendingPiece, timeLimit } = data;
  console.log(`Battle contest prompt: ${attackingPiece.symbol} attacking ${defendingPiece.symbol}`);
  
  // Show contest prompt UI
  showBattleContestPrompt(battleId, attackingPiece, defendingPiece, timeLimit);
});

socket.on('dice-battle-animation', (data) => {
  const { battleLog, winner, loser, duration } = data;
  console.log(`Dice battle animation: ${battleLog.attackerDice} vs ${battleLog.defenderDice}`);
  
  // Show dice battle animation
  showDiceBattleAnimation(battleLog, winner, loser, duration);
});

socket.on('player-eliminated', (data) => {
  const { eliminatedPlayerId, playerIndex, remainingPlayers } = data;
  console.log(`PLAYER ELIMINATED: Player ${playerIndex + 1} (${eliminatedPlayerId}) eliminated! ${remainingPlayers} players remaining.`);
  
  // Update UI with elimination information
  gameInfoEl.textContent = `Player ${playerIndex + 1} eliminated! ${remainingPlayers} players left`;
  gameInfoEl.style.color = '#ff4444';
  
  // Show elimination notification
  showNotification(`Player ${playerIndex + 1} eliminated!`, '#ff4444', 3000);
  
  // Flash the globe red briefly
  const originalColor = globe.material.color.clone();
  globe.material.color.setHex(0xff4444);
  setTimeout(() => {
    globe.material.color.copy(originalColor);
  }, 500);
});

// Victory handler moved to line ~5600 to integrate with game over screen

socket.on('piece-split', (data) => {
  const { originalPieceId, newPieceId, originalPosition, newPosition, playerId } = data;
  console.log(`Piece split: ${originalPieceId} created copy ${newPieceId} at (${newPosition.row}, ${newPosition.col})`);
  
  // Show split notification
  const player = gameState.players[playerId];
  const playerIndex = Object.keys(gameState.players).indexOf(playerId) + 1;
  showNotification(`Player ${playerIndex} Splitter Split!`, player.color, 2000);
  
  // Create split effect animation
  const originalWorldPos = getWorldPosition(originalPosition.row, originalPosition.col);
  const newWorldPos = getWorldPosition(newPosition.row, newPosition.col);
  
  // Create splitting effect - line between original and new position
  const splitLineGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(originalWorldPos.x, originalWorldPos.y, originalWorldPos.z),
    new THREE.Vector3(newWorldPos.x, newWorldPos.y, newWorldPos.z)
  ]);
  
  const splitLineMaterial = new THREE.LineBasicMaterial({
    color: 0xFF6B6B, // Red color for splitter
    linewidth: 3,
    transparent: true,
    opacity: 0.8
  });
  
  const splitLine = new THREE.Line(splitLineGeometry, splitLineMaterial);
  scene.add(splitLine);
  
  // Animate the split line
  let opacity = 0.8;
  const animateSplitLine = () => {
    opacity -= 0.05;
    splitLine.material.opacity = opacity;
    
    if (opacity > 0) {
      requestAnimationFrame(animateSplitLine);
    } else {
      scene.remove(splitLine);
      splitLineGeometry.dispose();
      splitLineMaterial.dispose();
    }
  };
  
  // Start animation after a short delay
  setTimeout(() => {
    animateSplitLine();
  }, 500);
});

socket.on('split-result', (data) => {
  const { success, message } = data;
  if (success) {
    console.log('Split successful:', message);
    gameInfoEl.textContent = 'Split successful!';
    gameInfoEl.style.color = '#4CAF50';
  } else {
    console.log('Split failed:', message);
    gameInfoEl.textContent = `Split failed: ${message}`;
    gameInfoEl.style.color = '#f44336';
  }
  
  // Reset UI color after 3 seconds
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
});



socket.on('jump-capture', (data) => {
  const { jumperId, capturedPieceId, jumperPosition, capturedPosition, playerId } = data;
  console.log(`Jump capture: ${jumperId} captured ${capturedPieceId} by jumping over`);
  
  // Show jump capture notification
  const player = gameState.players[playerId];
  if (player) {
    const playerIndex = Object.keys(gameState.players).indexOf(playerId) + 1;
    showNotification(`Player ${playerIndex} Jump Capture!`, player.color, 2000);
  }
  
  // Create jump capture animation
  const jumperWorldPos = getWorldPosition(jumperPosition.row, jumperPosition.col);
  const capturedWorldPos = getWorldPosition(capturedPosition.row, capturedPosition.col);
  
  // Create arc effect showing the jump
  const jumpArcGeometry = new THREE.BufferGeometry();
  const jumpArcPoints = [];
  
  // Create arc from captured position to jumper position
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = capturedWorldPos.x + (jumperWorldPos.x - capturedWorldPos.x) * t;
    const y = capturedWorldPos.y + (jumperWorldPos.y - capturedWorldPos.y) * t + Math.sin(t * Math.PI) * 0.3;
    const z = capturedWorldPos.z + (jumperWorldPos.z - capturedWorldPos.z) * t;
    jumpArcPoints.push(new THREE.Vector3(x, y, z));
  }
  
  jumpArcGeometry.setFromPoints(jumpArcPoints);
  
  const jumpArcMaterial = new THREE.LineBasicMaterial({
    color: 0xff8800, // Orange color for jump capture
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  
  const jumpArc = new THREE.Line(jumpArcGeometry, jumpArcMaterial);
  scene.add(jumpArc);
  
  // Create explosion effect at captured position
  const explosionGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const explosionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    transparent: true,
    opacity: 0.7,
    wireframe: true
  });
  
  const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosion.position.set(capturedWorldPos.x, capturedWorldPos.y, capturedWorldPos.z);
  scene.add(explosion);
  
  // Animate the effects
  let animationTime = 0;
  const animateJumpCapture = () => {
    animationTime += 0.05;
    
    // Fade out arc
    jumpArc.material.opacity = 0.9 - animationTime;
    
    // Expand and fade explosion
    explosion.scale.set(1 + animationTime * 2, 1 + animationTime * 2, 1 + animationTime * 2);
    explosion.material.opacity = 0.7 - animationTime;
    
    if (animationTime < 1) {
      requestAnimationFrame(animateJumpCapture);
    } else {
      // Clean up
      scene.remove(jumpArc);
      scene.remove(explosion);
      jumpArcGeometry.dispose();
      jumpArcMaterial.dispose();
      explosionGeometry.dispose();
      explosionMaterial.dispose();
    }
  };
  
  animateJumpCapture();
});

socket.on('multi-jump-capture', (data) => {
  const { jumperId, capturedPieceIds, capturedPieces, jumperPosition, captureArea, playerId } = data;
  console.log(`Multi-jump capture: ${jumperId} captured ${capturedPieces.length} pieces`);
  
  // Show multi-jump capture notification
  const player = gameState.players[playerId];
  if (player) {
    const playerIndex = Object.keys(gameState.players).indexOf(playerId) + 1;
    showNotification(`Player ${playerIndex} Multi-Capture! ${capturedPieces.length} pieces!`, player.color, 3000);
  }
  
  // Create multi-capture visual effects
  const jumperWorldPos = getWorldPosition(jumperPosition.row, jumperPosition.col);
  
  // Create effects for each captured piece
  capturedPieces.forEach((capturedPiece, index) => {
    const capturedWorldPos = getWorldPosition(capturedPiece.row, capturedPiece.col);
    
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

function showNotification(message, color, duration) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: ${color};
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    font-size: 24px;
    font-weight: bold;
    border: 3px solid ${color};
    animation: pulse 1s infinite;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

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

async function updateVisuals() {
  console.log('🔧 updateVisuals called');
  console.log('🔧 gameState.pieces:', gameState.pieces);
  console.log('🔧 Number of pieces in gameState:', Object.keys(gameState.pieces || {}).length);
  console.log('🔧 Current pieceMeshes:', Object.keys(pieceMeshes));
  
  // Remove pieces that no longer exist
  Object.keys(pieceMeshes).forEach(pieceId => {
    if (!gameState.pieces[pieceId]) {
      console.log(`🔧 Removing piece ${pieceId} (no longer exists)`);
      performanceOptimizer.removePieceEfficient(pieceId);
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

// Delta update function for better performance
async function updateVisualsDelta(delta) {
  // Remove pieces
  delta.removedPieces.forEach(pieceId => {
    performanceOptimizer.removePieceEfficient(pieceId);
  });
  
  // Add new pieces
  const addPromises = delta.addedPieces.map(async piece => {
    try {
      await createPieceMeshOptimized(piece);
    } catch (error) {
      console.error(`Failed to create mesh for piece ${piece.id}:`, error);
    }
  });
  
  // Update moved pieces
  delta.movedPieces.forEach(piece => {
    performanceOptimizer.updatePieceEfficient(piece);
  });
  
  // Wait for all additions to complete
  await Promise.all(addPromises);
}

async function createPieceMesh(piece) {
  // Use optimized version
  return await createPieceMeshOptimized(piece);
}

async function createPieceMeshOptimized(piece) {
  const player = gameState.players[piece.playerId];
  const position = getWorldPosition(piece.row, piece.col);
  
  // Get player index for consistent coloring
  const playerIndex = player.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(piece.playerId);
  
  console.log(`Creating piece ${piece.type} for player ${player.name} (index: ${playerIndex})`);
  console.log(`Player object:`, player);
  const debugColor = getPlayerColor(piece.playerId, playerIndex);
  console.log(`Player color: 0x${debugColor.toString(16).padStart(6, '0').toUpperCase()}`);
  
  let mesh;
  
  // Try to load GLB model with caching
  try {
    const gltf = await performanceOptimizer.getCachedModel(piece.type);
    if (gltf && gltf.scene) {
      console.log(`Using cached GLB model for ${piece.type}`);
      
      // Clone the model scene
      mesh = gltf.scene.clone();
      
      // Apply player color tinting to materials and set userData for click detection
      const playerColor = getPieceColorForPlayer(piece, player, playerIndex);
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
      console.log(`🔧 Scaling ${piece.type} to ${modelScale}`);
      mesh.scale.set(modelScale, modelScale, modelScale);
      console.log(`🔧 Final ${piece.type} scale:`, mesh.scale);
      
    } else {
      throw new Error(`Failed to load GLB model for ${piece.type}`);
    }
    
  } catch (error) {
    console.warn(`GLB model loading failed for ${piece.type}, falling back to geometric shape:`, error);
    
    // Fallback to geometric shapes
    mesh = createGeometricPiece(piece.type);
    
    // Use player-specific color for better identification
    const pieceColor = getPieceColorForPlayer(piece, player, playerIndex);
    console.log(`Applying geometric fallback color ${pieceColor.toString(16)} to ${piece.type} mesh`);
    
    const material = performanceOptimizer.getCachedMaterial('standard', {
      color: pieceColor,
      metalness: 0.3,
      roughness: 0.7
    });
    
    mesh.material = material;
    console.log(`Material applied with color:`, material.color.getHex().toString(16));
    
    // Apply geometric shape scaling
    const scale = getGeometricScale(piece.type);
    mesh.scale.set(scale, scale, scale);
  }
  
  // Position on sphere surface
  mesh.position.set(position.x, position.y, position.z);
  mesh.userData = { pieceId: piece.id, piece: piece };
  
  // Orient piece so bottom faces sphere center (top points away from center)
  // Calculate the normal vector from center to piece position
  const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
  
  // Create a rotation matrix to align the piece with the sphere surface
  const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
  mesh.setRotationFromQuaternion(quaternion);
  
  // Apply height adjustments for GLB models to match piece positioning
  const heightAdjustment = getModelHeightAdjustment(piece.type);
  if (heightAdjustment !== 0) {
    // Move the mesh along the normal vector (away from sphere center)
    const adjustmentVector = normal.clone().multiplyScalar(heightAdjustment);
    mesh.position.add(adjustmentVector);
    console.log(`Applied height adjustment ${heightAdjustment} to ${piece.type} GLB model`);
  }
  
  // Debug: Log King positions only
  if (piece.type === 'KING') {
    console.log(`${piece.symbol} King at grid (${piece.row}, ${piece.col}) - Player ${playerIndex + 1}`);
  }
  
  // Add text label with piece symbol (cached)
  const labelTexture = createCachedTextLabel(piece.symbol);
  const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(0.5, 0.5, 1);
  label.position.set(0, 0.3, 0);
  label.raycast = function() {}; // Disable raycasting for piece symbol labels
  
  mesh.add(label);
  
  // Add floating evolution points label (skip for King pieces)
  if (piece.type !== 'KING') {
    console.log('🎯 Creating evolution points label for piece:', piece.id);
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    console.log('🎯 Evolution points retrieved:', evolutionPoints);
    const evolutionLabelTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    console.log('🎯 Evolution label texture created:', evolutionLabelTexture);
    const evolutionLabelMaterial = new THREE.SpriteMaterial({ map: evolutionLabelTexture });
    const evolutionLabel = new THREE.Sprite(evolutionLabelMaterial);
    evolutionLabel.scale.set(1.0, 0.5, 1); // Much larger scale
    evolutionLabel.position.set(0, 1.2, 0); // Higher above the piece
    console.log('🎯 Evolution label positioned at:', evolutionLabel.position, 'with scale:', evolutionLabel.scale);
    evolutionLabel.userData = { isEvolutionLabel: true };
    evolutionLabel.raycast = function() {}; // Disable raycasting for evolution labels
    
    mesh.add(evolutionLabel);
    console.log('🎯 Evolution label added to mesh, total children:', mesh.children.length);
  } else {
    console.log('🎯 Skipping evolution label for King piece (Kings do not have evolution points)');
  }
  
  // Set userData for click detection
  mesh.userData.piece = piece;
  mesh.userData.pieceId = piece.id;
  
  scene.add(mesh);
  pieceMeshes[piece.id] = mesh;
  
  console.log(`✅ Successfully added piece ${piece.type} to scene at position:`, mesh.position);
  console.log(`📊 Scene now has ${scene.children.length} total objects`);
}

// Optimized piece update function
function updatePieceMeshOptimized(piece) {
  const mesh = pieceMeshes[piece.id];
  if (mesh) {
    const position = getWorldPosition(piece.row, piece.col);
    console.log('🔄 POSITION UPDATE - Piece', piece.id, 'moved to:');
    console.log('  Grid position:', piece.row, piece.col);
    console.log('  World position:', position);
    console.log('  Previous world position:', mesh.position);
    
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.piece = piece;
    
    // Orient piece so bottom faces sphere center (top points away from center)
    const normal = new THREE.Vector3(position.x, position.y, position.z).normalize();
    const up = new THREE.Vector3(0, 1, 0); // Piece's original "up" direction
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
    mesh.setRotationFromQuaternion(quaternion);
    
    // Update evolution points label
    updateEvolutionPointsLabel(mesh, piece);
  }
}

// Update evolution points label for a specific piece
function updateEvolutionPointsLabel(mesh, piece) {
  // Find the evolution label in the mesh children
  const evolutionLabel = mesh.children.find(child => 
    child.userData && child.userData.isEvolutionLabel
  );
  
  if (evolutionLabel) {
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    const newTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    
    // Dispose of old texture to prevent memory leaks
    if (evolutionLabel.material.map) {
      evolutionLabel.material.map.dispose();
    }
    
    // Apply new texture
    evolutionLabel.material.map = newTexture;
    evolutionLabel.material.needsUpdate = true;
  }
}

// Update all evolution point labels (call this when player evolution points change)
function updateAllEvolutionPointLabels() {
    Object.values(pieceMeshes).forEach(mesh => {
    if (mesh.userData && mesh.userData.piece && mesh.userData.piece.type !== 'KING') {
      updateEvolutionPointsLabel(mesh, mesh.userData.piece);
    }
  });
}

// Cached text label creation - textLabelCache moved to top of file to fix initialization order

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

// Get evolution points for a piece from the server's player data
function getEvolutionPointsForPiece(piece) {
  // Debug logging to see what data we have
  console.log('🔍 Getting evolution points for piece:', piece.id, 'type:', piece.type);
  console.log('🔍 Piece player ID:', piece.playerId);
  console.log('🔍 GameState players:', gameState.players);
  
  const player = gameState.players[piece.playerId];
  console.log('🔍 Found player:', player);
  
  // For player evolution points (shared across all pieces), check player object
  if (player && player.evolutionPoints !== undefined) {
    console.log('🔍 Player evolution points found:', player.evolutionPoints);
    return player.evolutionPoints;
  }
  
  // For individual piece evolution points, check piece object
  if (piece.evolutionPoints !== undefined) {
    console.log('🔍 Piece evolution points found:', piece.evolutionPoints);
    return piece.evolutionPoints;
  }
  
  // King pieces don't have evolution points - hide their labels
  if (piece.type === 'KING') {
    console.log('🔍 King pieces do not have evolution points');
    return 0;
  }
  
  // Default piece values based on piece type (when no player-wide evolution points are available)
  const defaultValues = {
    'PAWN': 1,
    'ROOK': 5,
    'KNIGHT': 3,
    'BISHOP': 3,
    'QUEEN': 9,
    'JUMPER': 3,
    'SUPER_JUMPER': 5,
    'HYPER_JUMPER': 7,
    'SPLITTER': 4,
    'HYBRID_QUEEN': 12,
    'MISTRESS_JUMPER': 8
  };
  
  const defaultValue = defaultValues[piece.type] || 1;
  console.log('🔍 No evolution points found, using default for', piece.type, ':', defaultValue);
  return defaultValue;
}

// Create evolution points label with team color styling
function createEvolutionPointsLabel(evolutionPoints, playerId) {
  console.log('🎨 Creating evolution points label with points:', evolutionPoints, 'for player:', playerId);
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128; // Double the width for better quality
  canvas.height = 64; // Double the height for better quality
  
  // Get player color for styling
  const player = gameState.players[playerId];
  const playerIndex = player?.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(playerId);
  
  console.log('🎨 Player index:', playerIndex, 'Player object:', player);
  
  // Determine text color based on player
  let textColor = '#FFD700'; // Gold default
  if (playerIndex === 0) {
    textColor = '#FF6B6B'; // Red team
  } else if (playerIndex === 1) {
    textColor = '#4ECDC4'; // Blue team
  }
  
  console.log('🎨 Using text color:', textColor);
  
  // Create background with subtle glow
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  context.fillStyle = textColor;
  context.font = 'bold 20px Arial';
  context.textAlign = 'center';
  context.fillText(`${evolutionPoints}`, 32, 22);
  
  // Add small "pts" text
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.font = '12px Arial';
  context.fillText('pts', 32, 30);
  
  console.log('🎨 Canvas texture created successfully');
  return new THREE.CanvasTexture(canvas);
}

// Helper function to get appropriate scale for GLB models
function getModelScale(pieceType) {
  const scaleMap = {
    'KING': 0.5,
    'QUEEN': 0.45,
    'ROOK': 0.4,
    'KNIGHT': 0.4,
    'BISHOP': 0.4,
    'PAWN': 0.3,
    'SPLITTER': 0.35,
    'JUMPER': 0.4,
    'SUPER_JUMPER': 0.45,
    'HYPER_JUMPER': 0.5,
    'MISTRESS_JUMPER': 0.55,
    'HYBRID_QUEEN': 0.6
  };
  return scaleMap[pieceType] || 0.4;
}

// Helper function to get appropriate scale for geometric shapes (fallback)
function getGeometricScale(pieceType) {
  const scaleMap = {
    'KING': 1.2,
    'QUEEN': 1.1,
    'ROOK': 1.0,
    'KNIGHT': 1.0,
    'BISHOP': 1.0,
    'PAWN': 1.0,
    'SPLITTER': 1.0,
    'JUMPER': 1.0,
    'SUPER_JUMPER': 1.1,
    'HYPER_JUMPER': 1.15,
    'MISTRESS_JUMPER': 1.2,
    'HYBRID_QUEEN': 1.3
  };
  return scaleMap[pieceType] || 1.0;
}

// Helper function to get height adjustments for GLB models
function getModelHeightAdjustment(pieceType) {
  const adjustmentMap = {
    'KING': 0.08,        // King appears sunken, lift it up
    'QUEEN': 0.04,       // Queen might need slight adjustment
    'ROOK': 0.02,        // Rook might need slight adjustment
    'KNIGHT': 0.02,      // Knight might need slight adjustment
    'BISHOP': 0.03,      // Bishop might need slight adjustment
    'PAWN': 0.0,         // Pawn is the reference - no adjustment needed
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

function getWorldPosition(row, col) {
  console.log('🌍 getWorldPosition called with:', {
    row, col,
    gridRows: gameState.gridConfig.rows,
    gridCols: gameState.gridConfig.cols
  });
  
  // Keep original piece positioning - pieces are at grid intersections/vertices
  const { phi, theta } = gridToSpherical(
    gameState.gridConfig.rows,
    gameState.gridConfig.cols,
    row,
    col
  );
  
  const position = sphericalToCartesian(globeRadius + 0.35, phi, theta); // Positioned just above grid surface
  console.log('🌍 Calculated position:', { phi, theta, position });
  
  return position;
}

function updateUI() {
  const playerCount = Object.keys(gameState.players).length;
  playerCountEl.textContent = `Players: ${playerCount}`;
  
  const pieceCount = Object.keys(gameState.pieces).length;
  
  // Update game info based on player count
  if (playerCount >= 2) {
    gameInfoEl.textContent = `Game ready! ${pieceCount} pieces on board. Click your pieces to move.`;
    gameInfoEl.style.color = '#00ff00';
  } else if (playerCount === 1) {
    gameInfoEl.textContent = 'Waiting for opponent... Click "Add AI Player" to start!';
    gameInfoEl.style.color = '#ffaa00';
  } else {
    gameInfoEl.textContent = 'Waiting for players to join...';
    gameInfoEl.style.color = '#ffffff';
  }
  
  // Update player name display
  const activePlayerNameEl = document.getElementById('active-player-name');
  if (activePlayerNameEl) {
    const myPlayer = gameState.players[socket.id];
    if (myPlayer) {
      activePlayerNameEl.textContent = myPlayer.name || playerName || 'Unknown Player';
    } else {
      activePlayerNameEl.textContent = playerName || 'Connecting...';
    }
  }
  
  // Update selected color display
  const selectedColorEl = document.getElementById('selected-color');
  if (selectedColorEl) {
    const myPlayer = gameState.players[socket.id];
    if (myPlayer && myPlayer.selectedColor) {
      selectedColorEl.textContent = `Selected: ${myPlayer.selectedColor}`;
      selectedColorEl.style.color = myPlayer.selectedColor;
    } else {
      selectedColorEl.textContent = menuSelectedColor ? `Selected: ${menuSelectedColor}` : 'None selected';
      selectedColorEl.style.color = menuSelectedColor || '#aaa';
    }
  }
  
  // Add player color indicators
  updatePlayerColorIndicators();
}

function updatePlayerColorIndicators() {
  // Find or create player color indicator div
  let colorIndicator = document.getElementById('player-color-indicator');
  if (!colorIndicator) {
    colorIndicator = document.createElement('div');
    colorIndicator.id = 'player-color-indicator';
    colorIndicator.style.cssText = `
      margin-top: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      font-size: 12px;
    `;
    document.getElementById('ui').appendChild(colorIndicator);
  }
  
  // Clear existing content
  colorIndicator.innerHTML = '<div style="color: #ccc; margin-bottom: 5px;">Player Colors:</div>';
  
  // Add color indicators for each player
  const currentPlayerId = socket.id;
  const players = Object.values(gameState.players);
  
  players.forEach((player, index) => {
    const playerColor = getPlayerColor(player.id, player.index) || 0xffffff;
    const colorHex = '#' + playerColor.toString(16).padStart(6, '0');
    
    const playerDiv = document.createElement('div');
    playerDiv.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 3px;
      ${player.id === currentPlayerId ? 'font-weight: bold; background: rgba(255, 255, 255, 0.1); padding: 2px 4px; border-radius: 3px;' : ''}
    `;
    
    const colorSwatch = document.createElement('div');
    colorSwatch.style.cssText = `
      width: 16px;
      height: 16px;
      background-color: ${colorHex};
      border-radius: 2px;
      margin-right: 8px;
      border: 1px solid #666;
    `;
    
    const playerName = document.createElement('span');
    playerName.textContent = `${player.name}${player.id === currentPlayerId ? ' (You)' : ''}`;
    playerName.style.color = '#fff';
    
    playerDiv.appendChild(colorSwatch);
    playerDiv.appendChild(playerName);
    colorIndicator.appendChild(playerDiv);
  });
}

// selectedMovementMode moved to global scope

function showDualMovementUI() {
  const dualMovementUI = document.getElementById('dual-movement-ui');
  const modeDescription = document.getElementById('mode-description');
  
  dualMovementUI.style.display = 'block';
  modeDescription.textContent = 'Click a mode to see movement options';
  
  // Clear previous mode selection
  selectedMovementMode = null;
  updateModeButtons();
}

function hideDualMovementUI() {
  const dualMovementUI = document.getElementById('dual-movement-ui');
  dualMovementUI.style.display = 'none';
  selectedMovementMode = null;
}

function updateModeButtons() {
  const queenBtn = document.getElementById('queen-mode-btn');
  const jumperBtn = document.getElementById('jumper-mode-btn');
  
  // Reset button styles
  queenBtn.style.opacity = selectedMovementMode === 'queen' ? '1' : '0.7';
  jumperBtn.style.opacity = selectedMovementMode === 'jumper' ? '1' : '0.7';
  
  queenBtn.style.border = selectedMovementMode === 'queen' ? '2px solid #fff' : 'none';
  jumperBtn.style.border = selectedMovementMode === 'jumper' ? '2px solid #fff' : 'none';
}

function selectMovementMode(mode) {
  selectedMovementMode = mode;
  updateModeButtons();
  
  // Update mode description
  const modeDescription = document.getElementById('mode-description');
  if (mode === 'queen') {
    modeDescription.textContent = 'Queen Mode: Move like a queen (gold cubes)';
  } else if (mode === 'jumper') {
    modeDescription.textContent = 'Jumper Mode: Jump and capture multiple pieces (orange cones)';
  }
  
  // Highlight moves for selected mode
  highlightValidMovesForMode(mode);
}

function highlightValidMovesForMode(mode) {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Filter moves by selected mode
  const filteredMoves = validMoves.filter(move => 
    (mode === 'queen' && move.type === 'dual-move-queen') ||
    (mode === 'jumper' && move.type === 'dual-move-jumper')
  );
  
  // Add highlights for filtered moves
  filteredMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col);
    
    let highlightColor, highlightGeometry;
    
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

function updateLobbyList(lobbies) {
  const lobbyList = document.getElementById('lobby-list');
  
  if (lobbies.length === 0) {
    lobbyList.innerHTML = '<div style="color: #888; font-size: 12px;">No lobbies available</div>';
    return;
  }
  
  const lobbiesHtml = lobbies.map(lobby => 
    `<div style="display: flex; justify-content: space-between; align-items: center; padding: 5px; margin-bottom: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px;">
      <div>
        <div style="font-weight: bold; color: #00aaff;">${lobby.name}</div>
        <div style="font-size: 10px; color: #ccc;">by ${lobby.creator} • ${lobby.playerCount}/${lobby.maxPlayers} players • ${lobby.gameMode}</div>
      </div>
      <button onclick="joinLobby('${lobby.id}')" style="padding: 3px 8px; background: #00aaff; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">Join</button>
    </div>`
  ).join('');
  
  lobbyList.innerHTML = lobbiesHtml;
}

function getPlayerName() {
  // Try to get player name from game state or use default
  const playerKeys = Object.keys(gameState?.players || {});
  const currentPlayer = playerKeys.find(key => key === socket.id);
  return currentPlayer ? gameState.players[currentPlayer].name : 'Player';
}

// Statistics management functions
function showStatisticsUI() {
  document.getElementById('stats-ui').style.display = 'block';
  showPersonalStats();
}

function hideStatisticsUI() {
  document.getElementById('stats-ui').style.display = 'none';
}

function showPersonalStats() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'block';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-personal-stats');
  
  // Request personal stats
  socket.emit('get-player-stats', {});
}

function showLeaderboard() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'block';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-leaderboard');
  
  // Request leaderboard
  refreshLeaderboard();
}

function showAchievements() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'block';
  document.getElementById('global-stats').style.display = 'none';
  
  // Update button styles
  updateStatsButtonStyles('show-achievements');
  
  // Request achievements
  socket.emit('get-achievements', {});
}

function showGlobalStats() {
  // Hide other sections
  document.getElementById('personal-stats').style.display = 'none';
  document.getElementById('leaderboard').style.display = 'none';
  document.getElementById('achievements').style.display = 'none';
  document.getElementById('global-stats').style.display = 'block';
  
  // Update button styles
  updateStatsButtonStyles('show-global-stats');
  
  // Request global stats
  socket.emit('get-global-stats');
}

function updateStatsButtonStyles(activeButtonId) {
  const buttons = ['show-personal-stats', 'show-leaderboard', 'show-achievements', 'show-global-stats'];
  buttons.forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (buttonId === activeButtonId) {
      button.style.background = '#cc00cc';
    } else {
      button.style.background = '#6600aa';
    }
  });
}

function refreshLeaderboard() {
  const category = document.getElementById('leaderboard-category').value;
  socket.emit('get-leaderboard', { category, limit: 50 });
}

function displayPersonalStats(stats) {
  if (!stats) {
    document.getElementById('personal-stats-content').innerHTML = '<div style="color: #888;">No statistics available. Play some games to see your stats!</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Performance</div>
        <div>Games Played: ${stats.gamesPlayed}</div>
        <div>Games Won: ${stats.gamesWon}</div>
        <div>Win Rate: ${(stats.winRate * 100).toFixed(1)}%</div>
        <div>Current Rating: ${stats.currentRank}</div>
        <div>Best Rating: ${stats.bestRank}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Battle Stats</div>
        <div>Battles Won: ${stats.battlesWon}</div>
        <div>Battle Win Rate: ${(stats.battleWinRate * 100).toFixed(1)}%</div>
        <div>Pieces Killed: ${stats.piecesKilled}</div>
        <div>Pieces Lost: ${stats.piecesLost}</div>
        <div>K/D Ratio: ${stats.killDeathRatio.toFixed(2)}</div>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Evolution & Abilities</div>
        <div>Pieces Evolved: ${stats.piecesEvolved}</div>
        <div>Splitter Uses: ${stats.splitterUses}</div>
        <div>Multi-Captures: ${stats.jumperMultiCaptures}</div>
        <div>Hybrid Mode Changes: ${stats.hybridQueenModeChanges}</div>
        <div>Equator Bonuses: ${stats.equatorBonuses}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Tournaments</div>
        <div>Tournaments Joined: ${stats.tournamentsJoined}</div>
        <div>Tournament Wins: ${stats.tournamentWins}</div>
        <div>Finals Reached: ${stats.tournamentFinals}</div>
        <div>Win Streak: ${stats.currentWinStreak}</div>
        <div>Best Streak: ${stats.bestWinStreak}</div>
      </div>
    </div>
    <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
      <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Recent Games</div>
      ${stats.recentGames.map(game => `
        <div style="display: flex; justify-content: space-between; padding: 2px; border-bottom: 1px solid #333;">
          <span style="color: ${game.result === 'win' ? '#00ff00' : '#ff6600'};">${game.result.toUpperCase()}</span>
          <span>${game.gameMode}</span>
          <span>${game.moves} moves</span>
          <span>${Math.round(game.duration / 60)}m ${game.duration % 60}s</span>
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('personal-stats-content').innerHTML = html;
}

function displayLeaderboard(leaderboard, category) {
  if (!leaderboard || leaderboard.length === 0) {
    document.getElementById('leaderboard-content').innerHTML = '<div style="color: #888;">No leaderboard data available.</div>';
    return;
  }
  
  const categoryNames = {
    'rating': 'Rating',
    'wins': 'Wins',
    'winRate': 'Win Rate',
    'battles': 'Battles Won',
    'evolution': 'Evolutions',
    'tournaments': 'Tournaments'
  };
  
  const html = `
    <div style="display: flex; justify-content: space-between; padding: 5px; border-bottom: 2px solid #cc00cc; margin-bottom: 5px; font-weight: bold;">
      <span>Rank</span>
      <span>Player</span>
      <span>${categoryNames[category]}</span>
    </div>
    ${leaderboard.map(entry => `
      <div style="display: flex; justify-content: space-between; padding: 3px; border-bottom: 1px solid #333; ${entry.playerId === socket.id ? 'background: rgba(204, 0, 204, 0.2);' : ''}">
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">#${entry.rank}</span>
        <span style="color: ${entry.playerId === socket.id ? '#cc00cc' : '#fff'};">${entry.playerName}</span>
        <span style="color: ${entry.rank <= 3 ? '#ffd700' : '#fff'};">${entry.value}</span>
      </div>
    `).join('')}
  `;
  
  document.getElementById('leaderboard-content').innerHTML = html;
}

function displayAchievements(achievements) {
  if (!achievements || achievements.length === 0) {
    document.getElementById('achievements-content').innerHTML = '<div style="color: #888;">No achievements unlocked yet. Keep playing to earn achievements!</div>';
    return;
  }
  
  const rarityColors = {
    'common': '#ffffff',
    'uncommon': '#1eff00',
    'rare': '#0070dd',
    'epic': '#a335ee',
    'legendary': '#ff8000'
  };
  
  const html = achievements.map(achievement => `
    <div style="display: flex; align-items: center; padding: 8px; margin-bottom: 5px; background: rgba(0, 0, 0, 0.2); border-radius: 3px; border-left: 3px solid ${rarityColors[achievement.rarity]};">
      <div style="font-size: 20px; margin-right: 10px;">${achievement.icon}</div>
      <div style="flex: 1;">
        <div style="color: ${rarityColors[achievement.rarity]}; font-weight: bold;">${achievement.name}</div>
        <div style="color: #ccc; font-size: 10px;">${achievement.description}</div>
        <div style="color: #888; font-size: 10px;">Earned: ${new Date(achievement.earned).toLocaleDateString()}</div>
      </div>
      <div style="color: ${rarityColors[achievement.rarity]}; font-size: 10px; text-transform: uppercase;">${achievement.rarity}</div>
    </div>
  `).join('');
  
  document.getElementById('achievements-content').innerHTML = html;
}

function displayGlobalStats(stats) {
  if (!stats) {
    document.getElementById('global-stats-content').innerHTML = '<div style="color: #888;">No global statistics available.</div>';
    return;
  }
  
  const html = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Player Statistics</div>
        <div>Total Players: ${stats.totalPlayers.toLocaleString()}</div>
        <div>Average Rating: ${stats.averageRating.toFixed(0)}</div>
        <div>Top Player: ${stats.topPlayer ? stats.topPlayer.playerName : 'None'}</div>
        <div>Top Rating: ${stats.topPlayer ? stats.topPlayer.currentRank : 'N/A'}</div>
      </div>
      <div style="padding: 8px; background: rgba(0, 0, 0, 0.2); border-radius: 3px;">
        <div style="color: #cc00cc; font-size: 12px; font-weight: bold;">Game Statistics</div>
        <div>Total Games: ${stats.totalGames.toLocaleString()}</div>
        <div>Total Battles: ${stats.totalBattles.toLocaleString()}</div>
        <div>Total Evolutions: ${stats.totalEvolutions.toLocaleString()}</div>
        <div>Total Tournaments: ${stats.totalTournaments.toLocaleString()}</div>
      </div>
    </div>
  `;
  
  document.getElementById('global-stats-content').innerHTML = html;
}

// Evolution system functions
function showEvolutionUI() {
  document.getElementById('evolution-ui').style.display = 'block';
  refreshEvolutionBank();
}

function hideEvolutionUI() {
  document.getElementById('evolution-ui').style.display = 'none';
}

function refreshEvolutionBank() {
  socket.emit('get-evolution-bank');
}

function updateEvolutionBank(bankInfo) {
  playerEvolutionBank = bankInfo;
  document.getElementById('evolution-points').textContent = bankInfo.points;
  document.getElementById('evolution-total-earned').textContent = bankInfo.totalEarned;
}

// OLD BROKEN FUNCTION - NOW USING showEvolutionChoiceDialog() INSTEAD
// This function was trying to show 'evolution-choice-panel' which doesn't exist in the DOM
function showEvolutionChoice(data) {
  console.log('⚠️ showEvolutionChoice called - this function is deprecated, should use showEvolutionChoiceDialog instead');
  // Redirect to working dialog system
  showEvolutionChoiceDialog(data.pieceId, data.piece, 'fallback', data.availablePaths, data.bankInfo, data.timeLeft || 30);
}

function hideEvolutionChoice() {
  document.getElementById('evolution-choice-panel').style.display = 'none';
  if (evolutionTimer) {
    clearInterval(evolutionTimer);
    evolutionTimer = null;
  }
  currentEvolutionChoice = null;
}

function handleEvolutionCompleted(data) {
  // Hide choice panel
  hideEvolutionChoice();
  
  // Show evolution notification
  showNotification('Evolution Complete!', 
    `${data.oldType} evolved to ${data.newType} for ${data.cost} points!`, 
    'success');
  
  // Update bank
  updateEvolutionBank({ 
    points: data.newPoints, 
    totalEarned: playerEvolutionBank.totalEarned 
  });
  
  // Update game state if needed
  if (gameState.pieces[data.pieceId]) {
    gameState.pieces[data.pieceId].type = data.newType;
  }
}

function startGameCountdown(countdown) {
  const countdownEl = document.getElementById('game-starting-countdown');
  const timerEl = document.getElementById('countdown-timer');
  
  countdownEl.style.display = 'block';
  timerEl.textContent = countdown;
  
  const interval = setInterval(() => {
    countdown--;
    timerEl.textContent = countdown;
    
    if (countdown <= 0) {
      clearInterval(interval);
      countdownEl.style.display = 'none';
    }
  }, 1000);
}

// Tournament management
let currentTournament = null;
let tournaments = [];

function showTournamentUI() {
  document.getElementById('tournament-ui').style.display = 'block';
  socket.emit('get-tournaments');
}

function hideTournamentUI() {
  document.getElementById('tournament-ui').style.display = 'none';
}

function showTournamentCreation() {
  document.getElementById('tournament-lobby').style.display = 'none';
  document.getElementById('tournament-creation').style.display = 'block';
}

function hideTournamentCreation() {
  document.getElementById('tournament-lobby').style.display = 'block';
  document.getElementById('tournament-creation').style.display = 'none';
}

function createTournament() {
  const name = document.getElementById('tournament-name').value || 'EvoChess Tournament';
  const maxPlayers = parseInt(document.getElementById('tournament-max-players').value);
  
  const settings = {
    name: name,
    maxPlayers: maxPlayers,
    minPlayers: 2,
    autoStart: false
  };
  
  socket.emit('create-tournament', { settings });
  hideTournamentCreation();
}

function showTournamentList() {
  socket.emit('get-tournaments');
  updateTournamentList();
}

function updateTournamentList() {
  const listElement = document.getElementById('tournament-list');
  
  if (tournaments.length === 0) {
    listElement.innerHTML = '<div style="color: #888; font-size: 12px;">No tournaments available</div>';
    return;
  }
  
  listElement.innerHTML = tournaments.map(tournament => `
    <div style="margin-bottom: 5px; padding: 5px; background: rgba(255, 255, 255, 0.1); border-radius: 3px;">
      <div style="font-size: 13px; color: #fff; margin-bottom: 3px;">${tournament.name}</div>
      <div style="font-size: 11px; color: #ccc;">
        Players: ${tournament.players.length}/${tournament.maxPlayers} | 
        Status: ${tournament.status.toUpperCase()}
      </div>
      <div style="margin-top: 5px;">
        ${tournament.status === 'waiting' ? 
          `<button onclick="joinTournament('${tournament.id}')" style="padding: 3px 8px; background: #44ff44; color: #000; border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">Join</button>` : 
          `<button onclick="viewTournament('${tournament.id}')" style="padding: 3px 8px; background: #888; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 11px;">View</button>`
        }
        ${tournament.status === 'waiting' && tournament.players.length >= tournament.minPlayers ? 
          `<button onclick="startTournament('${tournament.id}')" style="padding: 3px 8px; background: #ff4444; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 11px; margin-left: 5px;">Start</button>` : 
          ''
        }
      </div>
    </div>
  `).join('');
}

window.joinTournament = function(tournamentId) {
  const playerName = prompt('Enter your name:') || 'Anonymous Player';
  socket.emit('join-tournament', { tournamentId, playerName });
};

window.startTournament = function(tournamentId) {
  if (confirm('Start this tournament?')) {
    socket.emit('start-tournament', { tournamentId });
  }
};

window.viewTournament = function(tournamentId) {
  socket.emit('get-tournament', { tournamentId });
};

function updateTournamentStatus(tournament) {
  currentTournament = tournament;
  
  document.getElementById('tournament-lobby').style.display = 'none';
  document.getElementById('tournament-creation').style.display = 'none';
  document.getElementById('tournament-status').style.display = 'block';
  
  const infoElement = document.getElementById('tournament-info');
  infoElement.innerHTML = `
    <strong>${tournament.name}</strong><br>
    Status: ${tournament.status.toUpperCase()}<br>
    Players: ${tournament.players.length}/${tournament.maxPlayers}<br>
    Round: ${tournament.currentRound}/${tournament.brackets.length}
  `;
  
  // Update brackets display
  updateBracketsDisplay(tournament);
}

function updateBracketsDisplay(tournament) {
  const bracketsElement = document.getElementById('tournament-brackets');
  
  if (!tournament.brackets || tournament.brackets.length === 0) {
    bracketsElement.innerHTML = 'Brackets will be generated when tournament starts';
    return;
  }
  
  bracketsElement.innerHTML = tournament.brackets.map(round => `
    <div style="margin-bottom: 10px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 3px;">
      <div style="font-weight: bold; margin-bottom: 5px;">${round.name}</div>
      ${round.matches.map(match => `
        <div style="margin-bottom: 3px; padding: 3px; background: rgba(0, 0, 0, 0.3); border-radius: 2px;">
          ${match.isBye ? 
            `<span style="color: #888;">${match.player1.name} (BYE)</span>` :
            `<span style="color: ${match.winner && match.winner.id === match.player1.id ? '#44ff44' : '#fff'};">${match.player1 ? match.player1.name : 'TBD'}</span> vs 
             <span style="color: ${match.winner && match.winner.id === match.player2.id ? '#44ff44' : '#fff'};">${match.player2 ? match.player2.name : 'TBD'}</span>
             ${match.status === 'completed' ? ` - Winner: ${match.winner.name}` : ''}
             ${match.status === 'active' ? ' - IN PROGRESS' : ''}`
          }
        </div>
      `).join('')}
    </div>
  `).join('');
}

function highlightValidMoves() {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Update mode indicator to show move selection
  if (modeIndicator && validMoves.length > 0) {
    modeIndicator.textContent = 'Select a move (click green highlights)';
    modeIndicator.style.borderColor = '#00ff00';
    modeIndicator.style.background = 'rgba(0, 50, 0, 0.8)';
  }
  
  // Check for positions with multiple move types
  const positionMoveTypes = {};
  validMoves.forEach(move => {
    const key = `${move.row},${move.col}`;
    if (!positionMoveTypes[key]) {
      positionMoveTypes[key] = [];
    }
    positionMoveTypes[key].push(move);
  });
  
  // Add new highlights
  const processedPositions = new Set();
  
  validMoves.forEach(move => {
    const posKey = `${move.row},${move.col}`;
    
    // Skip if we already processed this position
    if (processedPositions.has(posKey)) return;
    processedPositions.add(posKey);
    
    const position = getWorldPosition(move.row, move.col);
    const movesAtPosition = positionMoveTypes[posKey];
    
    // Different colors and shapes for different move types
    let highlightColor, highlightGeometry;
    
    // Check if this position has multiple move types (specifically move + split)
    const hasMultipleTypes = movesAtPosition.length > 1 && 
                           movesAtPosition.some(m => m.type === 'split') && 
                           movesAtPosition.some(m => m.type === 'move');
    
    if (hasMultipleTypes) {
      // Special highlight for positions with multiple options
      highlightColor = 0xffff00; // Yellow for multi-option
      highlightGeometry = new THREE.TorusGeometry(0.2, 0.05, 8, 16); // Ring shape
    } else if (move.type === 'attack') {
      highlightColor = 0xff4444; // Red for attack
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    } else if (move.type === 'split') {
      highlightColor = 0x44ff44; // Green for split (same as regular move)
      // Create a torus (3D ring) for split moves - more clickable than flat ring
      highlightGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
    } else if (move.type === 'jump-capture') {
      highlightColor = 0xff8800; // Orange for jump capture
      highlightGeometry = new THREE.TetrahedronGeometry(0.12); // Pyramid shape for jump
    } else if (move.type === 'multi-jump-capture') {
      highlightColor = 0xaa00ff; // Purple for multi-jump capture
      highlightGeometry = new THREE.OctahedronGeometry(0.15); // Larger octahedron for multi-capture
    } else if (move.type === 'dual-move-queen') {
      highlightColor = 0xffd700; // Gold for dual queen movement
      highlightGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18); // Cube shape for queen mode
    } else if (move.type === 'dual-move-jumper') {
      highlightColor = 0xff6600; // Orange-red for dual jumper movement
      highlightGeometry = new THREE.ConeGeometry(0.12, 0.25, 6); // Cone shape for jumper mode
    } else {
      highlightColor = 0x44ff44; // Green for regular move
      highlightGeometry = new THREE.SphereGeometry(0.25, 16, 16); // Increased size for better clicking
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.8,
      wireframe: move.type === 'jump-capture' || move.type === 'multi-jump-capture' || move.type === 'dual-move-queen' || move.type === 'dual-move-jumper', // Wireframe for special moves (not split since it uses ring geometry)
      depthTest: true,
      depthWrite: true
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y, position.z);
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    // Make sure the highlight is above the globe surface
    const heightAdjustment = 0.05;
    const normalizedPos = highlight.position.clone().normalize();
    highlight.position.addScaledVector(normalizedPos, heightAdjustment);
    
    scene.add(highlight);
    console.log(`Added ${move.type} highlight at (${move.row}, ${move.col}) - userData:`, highlight.userData, 'position:', highlight.position);
  });
}

function clearValidMoveHighlights() {
  // Remove all valid move highlights
  const highlightsToRemove = [];
  scene.children.forEach(child => {
    if (child.userData.isValidMoveHighlight) {
      highlightsToRemove.push(child);
    }
  });
  
  console.log(`🧹 Clearing ${highlightsToRemove.length} valid move highlights`);
  highlightsToRemove.forEach(child => scene.remove(child));
  
  // Clear selection highlight
  clearSelectionHighlight();
}

function clearSelectionHighlight() {
  // Remove selection highlight
  scene.children.forEach(child => {
    if (child.userData.isSelectionHighlight) {
      scene.remove(child);
    }
  });
}

function highlightSelectedPiece(pieceId) {
  // Clear previous selection highlight
  clearSelectionHighlight();
  
  const piece = gameState.pieces[pieceId];
  if (!piece) return;
  
  const position = getWorldPosition(piece.row, piece.col);
  
  // Create different selection highlights for different piece types
  if (piece.type === 'HYBRID_QUEEN') {
    // Special dual-ring highlight for Hybrid Queen
    const outerRingGeometry = new THREE.RingGeometry(0.18, 0.23, 16);
    const outerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xf39c12, // Orange for Hybrid Queen
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.position.set(position.x, position.y, position.z);
    outerRing.lookAt(0, 0, 0);
    outerRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(outerRing);
    
    // Add inner ring with different color
    const innerRingGeometry = new THREE.RingGeometry(0.12, 0.17, 16);
    const innerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700, // Gold inner ring
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
    innerRing.position.set(position.x, position.y, position.z);
    innerRing.lookAt(0, 0, 0);
    innerRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(innerRing);
  } else {
    // Standard selection highlight (yellow ring)
    const ringGeometry = new THREE.RingGeometry(0.15, 0.2, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
    selectionRing.position.set(position.x, position.y, position.z);
    selectionRing.lookAt(0, 0, 0); // Face the center of the sphere
    selectionRing.userData = { isSelectionHighlight: true, pieceId: pieceId };
    scene.add(selectionRing);
  }
}

function getCurrentlySelectedPieceId() {
  return selectedPieceId;
}



// Helper function to convert color string to hex
function getColorFromString(colorString) {
  const colorMap = {
    'red': 0xff0000,
    'blue': 0x0000ff,
    'green': 0x00ff00,
    'yellow': 0xffff00,
    'purple': 0xff00ff,
    'cyan': 0x00ffff,
    'orange': 0xff8800,
    'pink': 0xff69b4
  };
  return colorMap[colorString] || 0xffffff;
}

// COLOR_MAP moved to top of file to fix initialization order

// Get distinct player color using server-assigned color
function getPlayerColor(playerId, playerIndex) {
  const player = gameState.players[playerId];
  
  if (player && player.selectedColor && COLOR_MAP[player.selectedColor]) {
    return COLOR_MAP[player.selectedColor];
  }
  
  // Fallback to index-based colors (more reliable than string-based)
  const fallbackColors = [
    0xFF6B6B, // Red-ish
    0x4ECDC4, // Cyan/Teal
    0x45B7D1, // Blue
    0x96CEB4, // Green
    0xFECE85, // Orange
    0xF8B500, // Yellow
    0xC44569, // Pink
    0x6C5CE7  // Purple
  ];
  
  // Handle missing or invalid playerIndex
  let colorIndex = 0;
  if (typeof playerIndex === 'number' && !isNaN(playerIndex)) {
    colorIndex = playerIndex % fallbackColors.length;
  } else {
    // If no valid playerIndex, try to derive from playerId
    if (gameState && gameState.players) {
      const playerIds = Object.keys(gameState.players);
      const foundIndex = playerIds.indexOf(playerId);
      colorIndex = foundIndex >= 0 ? foundIndex % fallbackColors.length : 0;
    }
  }
  
  const fallbackColor = fallbackColors[colorIndex];
  
  console.log(`🎨 Using fallback color for player ${playerIndex || 'undefined'}: ${fallbackColor.toString(16)}`);
  return fallbackColor;
}

// Enhanced piece color function that prioritizes player identification
function getPieceColorForPlayer(piece, player, playerIndex) {
  // Check if this is a split piece that should inherit parent color
  if (piece.id && piece.id.includes('-split-')) {
    // For split pieces, find any existing piece with the same player that has a color we can inherit
    // Look for other pieces from the same player that might have evolved colors
    let parentColor = null;
    
    // Search through all existing pieces for the same player to find a color to inherit
    for (const existingPieceId in pieceMeshes) {
      const existingMesh = pieceMeshes[existingPieceId];
      if (existingMesh && existingMesh.userData && existingMesh.userData.piece) {
        const existingPiece = existingMesh.userData.piece;
        
        // If this is the same player and has the same type (SPLITTER), inherit its color
        if (existingPiece.playerId === piece.playerId && 
            existingPiece.type === piece.type &&
            existingPieceId !== piece.id) { // Don't inherit from self
          
          // Try to extract color from this mesh
          if (existingMesh.material) {
            if (Array.isArray(existingMesh.material)) {
              parentColor = existingMesh.material[0].color.clone();
            } else {
              parentColor = existingMesh.material.color.clone();
            }
          }
          
          // If no material on main mesh, check children
          if (!parentColor && existingMesh.children && existingMesh.children.length > 0) {
            for (const child of existingMesh.children) {
              if (child.material && child.material.color) {
                if (Array.isArray(child.material)) {
                  parentColor = child.material[0].color.clone();
                } else {
                  parentColor = child.material.color.clone();
                }
                break;
              }
            }
          }
          
          if (parentColor) {
            console.log(`🎨 SPLIT INHERITANCE: Split piece ${piece.id} inheriting color ${parentColor.getHexString()} from existing ${existingPiece.type} ${existingPieceId}`);
            return parentColor;
          }
        }
      }
    }
    
    console.log(`🎨 SPLIT INHERITANCE: Could not find suitable parent color for ${piece.id}, using fallback`);
  }
  
  // Use the player's selected color from the server
  const basePlayerColor = getPlayerColor(piece.playerId, playerIndex);
  
  console.log(`getPieceColorForPlayer: piece=${piece.type}, playerId=${piece.playerId}, baseColor=${basePlayerColor.toString(16)}`);
  
  // Return the exact player color without modification for consistency
  // This ensures all pieces for a player have the same color
  console.log(`Final color for ${piece.type}: ${basePlayerColor.toString(16)}`);
  
  return basePlayerColor;
}

// Handle right-click for evolution menu
function onRightClick(event) {
  console.log('🖱️ Right-click event triggered - onRightClick called');
  
  // Calculate mouse position
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  // Update raycaster
  raycaster.setFromCamera(mouse, camera);
  
  // Test all clickable objects (pieces)
  const clickableObjects = [];
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
      if (piece.playerId === socket.id) {
        console.log('🖱️ Requesting evolution choice for our piece');
        console.log('🖱️ Piece details:', { id: piece.id, type: piece.type, playerId: piece.playerId });
        
        // Request evolution choice from server
        socket.emit('request-evolution-choice', {
          pieceId: piece.id
        });
        console.log('🖱️ Evolution choice request sent to server');
        
        return true; // Click handled
      } else {
        console.log('🖱️ Cannot evolve opponent piece');
        showNotification('Evolution', 'Cannot evolve opponent pieces', 'error');
      }
    }
  }
  
  return false; // Click not handled
}

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
  
  // Add valid move highlights
  let validMoveCount = 0;
  const validMoveHighlights = [];
  scene.children.forEach(child => {
    if (child.userData && child.userData.isValidMoveHighlight) {
      clickableObjects.push(child);
      validMoveHighlights.push(child);
      validMoveCount++;
      console.log('🟢 Found valid move highlight:', child.userData.move);
    }
  });
  
  console.log('🔍 Clickable objects setup:', {
    totalClickable: clickableObjects.length,
    pieceMeshes: Object.keys(pieceMeshes).length,
    validMoveHighlights: validMoveCount
  });
  
  const intersects = raycaster.intersectObjects(clickableObjects, true); // Include child objects
  
  console.log('🔍 Raycaster debug:', {
    mouseX: mouse.x,
    mouseY: mouse.y,
    intersectsLength: intersects.length,
    sceneChildrenCount: scene.children.length,
    pieceMeshesCount: Object.keys(pieceMeshes).length,
    clickableObjectsCount: clickableObjects.length,
    validMoveHighlightsCount: clickableObjects.filter(obj => obj.userData?.isValidMoveHighlight).length,
    cameraPosition: camera.position,
    rayDirection: raycaster.ray.direction
  });
  
  // Debug: Check the structure of the first few piece meshes
  console.log('🔍 Analyzing piece mesh structure:');
  const pieceKeys = Object.keys(pieceMeshes);
  for (let i = 0; i < Math.min(3, pieceKeys.length); i++) {
    const pieceKey = pieceKeys[i];
    const pieceMesh = pieceMeshes[pieceKey];
    console.log(`🔍 Piece ${pieceKey}:`, {
      type: pieceMesh.type,
      visible: pieceMesh.visible,
      children: pieceMesh.children.length,
      position: pieceMesh.position,
      userData: pieceMesh.userData,
      hasGeometry: pieceMesh.geometry !== undefined,
      hasMaterial: pieceMesh.material !== undefined
    });
    
    // Check children for actual meshes
    if (pieceMesh.children && pieceMesh.children.length > 0) {
      console.log(`🔍 ${pieceKey} children:`, pieceMesh.children.map(child => ({
        type: child.type,
        visible: child.visible,
        hasGeometry: child.geometry !== undefined,
        hasMaterial: child.material !== undefined,
        userData: child.userData
      })));
    }
  }
  
  // Debug: Try raycasting against all scene children to see if anything hits
  console.log('🔍 Testing raycaster against all scene children...');
  const allIntersects = raycaster.intersectObjects(scene.children, true);
  console.log('🔍 All intersects:', allIntersects.length);
  if (allIntersects.length > 0) {
    console.log('🔍 First all intersect:', {
      type: allIntersects[0].object.type,
      userData: allIntersects[0].object.userData,
      parent: allIntersects[0].object.parent?.userData
    });
  }
  
  // Log first few intersects for debugging
  if (intersects.length > 0) {
    console.log('🔍 First intersect:', {
      type: intersects[0].object.type,
      userData: intersects[0].object.userData,
      hasParent: !!intersects[0].object.parent,
      parentUserData: intersects[0].object.parent?.userData,
      isValidMoveHighlight: intersects[0].object.userData?.isValidMoveHighlight
    });
    
    // Log all intersects to see if move highlights are detected
    console.log('🔍 All intersects:', intersects.map(i => ({
      type: i.object.type,
      isValidMoveHighlight: i.object.userData?.isValidMoveHighlight,
      isPiece: !!i.object.userData?.piece
    })));
  }
  
  // If no intersects, let's check what's in the scene
  if (intersects.length === 0) {
    console.log('🔍 No intersects - looking for piece objects in scene...');
    console.log('🔍 Debug: Valid move highlights in scene:', 
      scene.children.filter(c => c.userData.isValidMoveHighlight).map(c => ({
        position: c.position,
        userData: c.userData
      }))
    );
    
    // Find all objects with piece userData
    const pieceObjects = scene.children.filter(child => child.userData?.piece);
    console.log('🔍 Found piece objects:', pieceObjects.length);
    
    if (pieceObjects.length > 0) {
      console.log('🔍 First piece object:', {
        type: pieceObjects[0].type,
        name: pieceObjects[0].name,
        visible: pieceObjects[0].visible,
        position: pieceObjects[0].position,
        userData: pieceObjects[0].userData,
        hasGeometry: !!pieceObjects[0].geometry,
        hasMaterial: !!pieceObjects[0].material,
        childrenCount: pieceObjects[0].children.length
      });
      
      // Check if this piece is in the pieceMeshes array
      const pieceId = pieceObjects[0].userData.pieceId;
      const isInPieceMeshes = pieceMeshes[pieceId] === pieceObjects[0];
      console.log('🔍 Is in pieceMeshes:', isInPieceMeshes, 'pieceId:', pieceId);
    }
  }
  
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    console.log('Clicked object:', clickedObject.userData, clickedObject.type);
    console.log('Has piece:', !!clickedObject.userData.piece);
    console.log('Has valid move highlight:', !!clickedObject.userData.isValidMoveHighlight);
    console.log('Full userData:', JSON.stringify(clickedObject.userData));
    
    // Check if this is a valid move highlight first (before traversing)
    if (clickedObject.userData.isValidMoveHighlight) {
      console.log('✅ Direct hit on valid move highlight!');
    } else {
      // For GLB models, we might need to traverse up to find the piece mesh
      while (clickedObject && !clickedObject.userData.piece && !clickedObject.userData.isValidMoveHighlight) {
        clickedObject = clickedObject.parent;
      }
    }
    
    console.log('Found piece object:', clickedObject ? clickedObject.userData : 'none');
    
    // Additional check - make sure we're not missing the valid move highlight
    if (clickedObject && !clickedObject.userData.piece && !clickedObject.userData.isValidMoveHighlight) {
      console.log('⚠️ Clicked object has no piece or valid move data - checking original:', intersects[0].object.userData);
    }
    
    // Check if clicked on a piece
    if (clickedObject && clickedObject.userData.piece) {
      const piece = clickedObject.userData.piece;
      console.log('Clicked piece:', piece.symbol, piece.type);
      
      // Check if this piece belongs to the current player
      const currentPlayer = Object.values(gameState.players).find(p => p.id === window.globalSocket.id);
      console.log('Socket ID:', window.globalSocket.id);
      console.log('Current player:', currentPlayer);
      console.log('Piece player ID:', piece.playerId);
      console.log('Player ID match:', currentPlayer && piece.playerId === currentPlayer.id);
      
      // More robust ownership check - also check if piece belongs to socket ID directly
      const isOwnPiece = (currentPlayer && piece.playerId === currentPlayer.id) || 
                        (piece.playerId === window.globalSocket.id);
      
      if (isOwnPiece) {
        clickHandled = true;
        if (isRightClick) {
          // Right-click: Request evolution options
          window.globalSocket.emit('request-evolution-choice', { pieceId: piece.id });
        } else {
          // Left-click: Select piece and show moves
          selectedPieceId = piece.id;
          highlightSelectedPiece(piece.id);
          
          // Request valid moves for this piece
          window.globalSocket.emit('get-valid-moves', { pieceId: piece.id });
          
          // Update UI
          gameInfoEl.textContent = `Selected: ${piece.symbol} ${piece.type}`;
        }
      } else {
        console.log('Cannot select opponent piece');
        gameInfoEl.textContent = 'Cannot select opponent piece';
      }
    }
    
    // Check if clicked on a valid move highlight
    else if (clickedObject && clickedObject.userData.isValidMoveHighlight) {
      console.log('🎯 Valid move highlight clicked!');
      clickHandled = true;
      const move = clickedObject.userData.move;
      console.log('Clicked valid move:', move);
      console.log('Move data:', move.row, move.col, move.type);
      
      // Find the currently selected piece by checking which piece has valid moves displayed
      const currentSelectedPieceId = getCurrentlySelectedPieceId();
      console.log('🔍 MOVE TYPE DEBUG:', move.type, 'for piece:', currentSelectedPieceId);
      console.log('🎯 Current selected piece ID:', currentSelectedPieceId);
      
      if (currentSelectedPieceId) {
        // For splitters, we handle split and move actions directly based on the move type
        // No dialog needed since different visual indicators are used
        
        // Check if this is a dual movement piece and requires mode selection
        const selectedPiece = gameState.pieces[currentSelectedPieceId];
        const isDualMovement = selectedPiece && selectedPiece.type === 'HYBRID_QUEEN';
        
        if (isDualMovement && (move.type === 'dual-move-queen' || move.type === 'dual-move-jumper')) {
          // For dual movement, validate that the mode matches the selected movement mode
          if (!selectedMovementMode) {
            gameInfoEl.textContent = `Select movement mode first!`;
            gameInfoEl.style.color = '#ff6b6b';
            setTimeout(() => {
              gameInfoEl.style.color = '#ffffff';
            }, 2000);
            return;
          }
          
          const expectedMoveType = selectedMovementMode === 'queen' ? 'dual-move-queen' : 'dual-move-jumper';
          if (move.type !== expectedMoveType) {
            gameInfoEl.textContent = `Move doesn't match selected mode!`;
            gameInfoEl.style.color = '#ff6b6b';
            setTimeout(() => {
              gameInfoEl.style.color = '#ffffff';
            }, 2000);
            return;
          }
        }
        if (move.type === 'split') {
          // Send split command to server
          console.log(`🔄 SPLIT MOVE DETECTED - Sending split-piece event for ${currentSelectedPieceId} to (${move.row}, ${move.col})`);
          window.globalSocket.emit('split-piece', {
            pieceId: currentSelectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          // Update UI
          gameInfoEl.textContent = `Splitting piece...`;
          console.log(`Splitting piece ${currentSelectedPieceId} to (${move.row}, ${move.col})`);

        } else {
          // Send regular move command to server
          console.log('🚀 MOVE DEBUG - Sending move command:');
          console.log('  pieceId:', currentSelectedPieceId);
          console.log('  targetRow:', move.row, 'targetCol:', move.col);
          console.log('  Current piece position:', gameState.pieces[currentSelectedPieceId]?.mesh?.position);
          
          window.globalSocket.emit('move-piece', {
            pieceId: currentSelectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          // Update UI
          gameInfoEl.textContent = `Moving piece...`;
          console.log(`Moving piece ${currentSelectedPieceId} to (${move.row}, ${move.col})`);
        }
        
        // Clear highlights after action
        clearValidMoveHighlights();
        hideDualMovementUI();
        selectedPieceId = null;
      }
    }
    
    // Check if clicked on globe (empty space)
    else if (clickedObject === globe) {
      // Clear selection when clicking on empty space
      selectedPieceId = null;
      clearValidMoveHighlights();
      hideDualMovementUI();
      gameInfoEl.textContent = 'Click on your pieces to select them';
    }
  } else {
    // Clicked on empty space - clear selection
    selectedPieceId = null;
    clearValidMoveHighlights();
    hideDualMovementUI();
    gameInfoEl.textContent = 'Click on your pieces to select them';
  }
  
  return clickHandled;
}

// Event listener setup function - called during game initialization
function setupMouseInteraction() {
  console.log('🖱️ Setting up clean event handlers...');
  
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
  // mouseDownTime moved to global scope
  
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
  
  console.log('🖱️ Pointer event listeners attached to canvas');
}

// Touch event handling for mobile
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };

function onTouchStart(e) {
  e.preventDefault();
  touchStartTime = Date.now();
  const touch = e.touches[0];
  
  touchStartPos.x = touch.clientX;
  touchStartPos.y = touch.clientY;
}

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

// Add touch event listeners to canvas with capture phase
renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add keyboard controls for debug features
// modeIndicator moved to global scope

// Hide mode indicator since we no longer need mode switching
if (modeIndicator) {
  modeIndicator.style.display = 'none';
}

window.addEventListener('keydown', (e) => {
  
  // Add debug key to force piece click detection
  if (e.key === 'd' || e.key === 'D') {
    console.log('🔍 Debug: Force checking for pieces under mouse');
    const event = new MouseEvent('click', {
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2
    });
    onMouseClick(event);
  }
  
  // Debug key to convert selected pawn to splitter
  if (e.key === 't' || e.key === 'T') {
    if (selectedPieceId && gameState.pieces[selectedPieceId]) {
      const piece = gameState.pieces[selectedPieceId];
      if (piece.type === 'PAWN') {
        console.log('🔧 DEBUG: Converting PAWN to SPLITTER for testing');
        // Send evolution command directly
        window.globalSocket.emit('debug-evolve-piece', {
          pieceId: selectedPieceId,
          newType: 'SPLITTER'
        });
        showNotification('Debug', 'Converting PAWN to SPLITTER for testing', 'info');
      } else {
        showNotification('Debug', 'Select a PAWN first to convert to SPLITTER', 'warning');
      }
    } else {
      showNotification('Debug', 'No piece selected - select a PAWN first', 'warning');
    }
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update frame counter for performance monitoring
  performanceOptimizer.frameCount++;
  
  if (controls) {
    controls.update();
  }
  
  // Rotate globe slowly
  globe.rotation.y += 0.001;
  
  // Animate equator squares with pulsing effect
  const time = Date.now() * 0.002;
  gridSquares.forEach(square => {
    if (square.userData.isEquatorSquare) {
      // Pulsing opacity effect for equator squares
      square.material.opacity = square.userData.originalOpacity + Math.sin(time) * 0.2;
    }
  });
  
  renderer.render(scene, camera);
}

// Add event listeners for dual movement mode selection
document.getElementById('queen-mode-btn').addEventListener('click', () => {
  selectMovementMode('queen');
});

document.getElementById('jumper-mode-btn').addEventListener('click', () => {
  selectMovementMode('jumper');
});

// Tournament UI event listeners
document.getElementById('create-tournament-btn').addEventListener('click', () => {
  showTournamentCreation();
});

document.getElementById('join-tournament-btn').addEventListener('click', () => {
  showTournamentList();
});

document.getElementById('create-tournament-confirm').addEventListener('click', () => {
  createTournament();
});

document.getElementById('create-tournament-cancel').addEventListener('click', () => {
  hideTournamentCreation();
});

// Lobby system functionality
let currentLobby = null;
let isInLobby = false;

// Lobby event handlers
document.getElementById('lobby-toggle').addEventListener('click', () => {
  const lobbyUI = document.getElementById('lobby-ui');
  if (lobbyUI.style.display === 'none') {
    showLobbyUI();
  } else {
    hideLobbyUI();
  }
});

document.getElementById('create-lobby-btn').addEventListener('click', () => {
  showLobbyCreation();
});

document.getElementById('create-lobby-confirm').addEventListener('click', () => {
  createLobby();
});

document.getElementById('create-lobby-cancel').addEventListener('click', () => {
  hideLobbyCreation();
});

document.getElementById('refresh-lobbies-btn').addEventListener('click', () => {
  refreshLobbies();
});

document.getElementById('leave-lobby-btn').addEventListener('click', () => {
  leaveLobby();
});

document.getElementById('ready-toggle-btn').addEventListener('click', () => {
  toggleReady();
});

// Evolution system functionality
let currentEvolutionChoice = null;
let evolutionTimer = null;
let playerEvolutionBank = { points: 0, totalEarned: 0 };

// Evolution event handlers
document.getElementById('evolution-toggle').addEventListener('click', () => {
  const evolutionUI = document.getElementById('evolution-ui');
  if (evolutionUI.style.display === 'none') {
    showEvolutionUI();
  } else {
    hideEvolutionUI();
  }
});

document.getElementById('refresh-evolution-bank').addEventListener('click', () => {
  refreshEvolutionBank();
});

document.getElementById('show-evolution-help').addEventListener('click', () => {
  const helpDiv = document.getElementById('evolution-help');
  if (helpDiv.style.display === 'none') {
    helpDiv.style.display = 'block';
  } else {
    helpDiv.style.display = 'none';
  }
});

document.getElementById('cancel-evolution').addEventListener('click', () => {
  if (currentEvolutionChoice) {
    socket.emit('cancel-evolution-choice', { pieceId: currentEvolutionChoice.pieceId });
  }
});

// Statistics system functionality
let playerStats = null;
let currentLeaderboard = [];
let playerAchievements = [];
let globalStats = null;

// Statistics event handlers
document.getElementById('stats-toggle').addEventListener('click', () => {
  const statsUI = document.getElementById('stats-ui');
  if (statsUI.style.display === 'none') {
    showStatisticsUI();
  } else {
    hideStatisticsUI();
  }
});

document.getElementById('show-personal-stats').addEventListener('click', () => {
  showPersonalStats();
});

document.getElementById('show-leaderboard').addEventListener('click', () => {
  showLeaderboard();
});

document.getElementById('show-achievements').addEventListener('click', () => {
  showAchievements();
});

document.getElementById('show-global-stats').addEventListener('click', () => {
  showGlobalStats();
});

document.getElementById('refresh-leaderboard').addEventListener('click', () => {
  refreshLeaderboard();
});

document.getElementById('leaderboard-category').addEventListener('change', () => {
  refreshLeaderboard();
});

document.getElementById('tournament-toggle').addEventListener('click', () => {
  const tournamentUI = document.getElementById('tournament-ui');
  if (tournamentUI.style.display === 'none') {
    showTournamentUI();
  } else {
    hideTournamentUI();
  }
});

// Spectator mode functionality
let isSpectating = false;
let spectatorCount = 0;
let currentReplay = null;
let replayPlaying = false;
let replaySpeed = 1;
let replayCurrentMove = 0;

// Spectator event handlers
document.getElementById('spectator-toggle').addEventListener('click', () => {
  const spectatorUI = document.getElementById('spectator-ui');
  if (spectatorUI.style.display === 'none') {
    showSpectatorUI();
  } else {
    hideSpectatorUI();
  }
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

function updateReplayUI() {
  if (!currentReplay) return;
  
  document.getElementById('replay-current-move').textContent = replayCurrentMove;
  document.getElementById('replay-total-moves').textContent = currentReplay.moves.length;
  
  const currentTime = currentReplay.moves[replayCurrentMove - 1]?.timestamp || 0;
  const totalTime = currentReplay.duration || 0;
  
  document.getElementById('replay-current-time').textContent = formatTime(currentTime);
  document.getElementById('replay-total-time').textContent = formatTime(totalTime);
  
  document.getElementById('replay-timeline').value = (replayCurrentMove / currentReplay.moves.length) * 100;
  
  document.getElementById('replay-game-id').textContent = currentReplay.gameId;
  document.getElementById('replay-players').textContent = currentReplay.players.join(', ');
  document.getElementById('replay-duration').textContent = formatTime(totalTime);
}

function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Socket event handlers for spectator mode
socket.on('spectator-joined', (data) => {
  isSpectating = true;
  document.getElementById('join-spectator-btn').style.display = 'none';
  document.getElementById('leave-spectator-btn').style.display = 'block';
  document.getElementById('spectator-game-status').textContent = 'Spectating';
  console.log('Joined as spectator:', data);
});

socket.on('spectator-left', (data) => {
  isSpectating = false;
  document.getElementById('join-spectator-btn').style.display = 'block';
  document.getElementById('leave-spectator-btn').style.display = 'none';
  document.getElementById('spectator-game-status').textContent = 'Not spectating';
  console.log('Left spectator mode:', data);
});

socket.on('spectator-count-updated', (data) => {
  spectatorCount = data.count;
  document.getElementById('spectator-count').textContent = spectatorCount;
});

socket.on('spectatable-games', (data) => {
  updateSpectatorGamesList(data.games);
});

socket.on('replay-list', (data) => {
  updateReplaysList(data.replays);
});

socket.on('replay-data', (data) => {
  currentReplay = data.replay;
  replayCurrentMove = 0;
  document.getElementById('replay-controls').style.display = 'block';
  document.getElementById('stop-replay-btn').style.display = 'block';
  updateReplayUI();
  console.log('Loaded replay:', data.replay);
});

socket.on('replay-state', (data) => {
  if (data.gameState && data.moves) {
    // Update the game visualization with replay state
    updateGameVisualization(data.gameState, data.moves);
    updateReplayUI();
  }
});

function updateSpectatorGamesList(games) {
  const gamesList = document.getElementById('spectator-games-list');
  if (games.length === 0) {
    gamesList.innerHTML = '<div style="color: #888; font-size: 12px;">No games available to spectate</div>';
    return;
  }
  
  gamesList.innerHTML = games.map(game => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="joinSpectatorGame('${game.gameId}')">
      <div style="font-weight: bold;">Game: ${game.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">Spectators: ${game.spectatorCount}</div>
    </div>
  `).join('');
}

function updateReplaysList(replays) {
  const replaysList = document.getElementById('replay-list');
  if (replays.length === 0) {
    replaysList.innerHTML = '<div style="color: #888; font-size: 12px;">No replays available</div>';
    return;
  }
  
  replaysList.innerHTML = replays.map(replay => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; cursor: pointer;" 
         onclick="playReplay('${replay.gameId}')">
      <div style="font-weight: bold;">Game: ${replay.gameId}</div>
      <div style="font-size: 11px; color: #ccc;">
        Players: ${replay.players.join(', ')} | Duration: ${formatTime(replay.duration)} | Moves: ${replay.moveCount}
      </div>
      <div style="font-size: 10px; color: #888;">
        Played: ${new Date(replay.metadata.created).toLocaleString()}
      </div>
    </div>
  `).join('');
}

function joinSpectatorGame(gameId) {
  socket.emit('join-spectator', { gameId });
}

function updateGameVisualization(gameState, moves) {
  // Update the 3D visualization with replay data
  // This would integrate with the existing game state update logic
  console.log('Updating game visualization with replay state:', gameState, moves);
}

// AI opponent functionality
let currentAIPlayers = [];
let aiStats = {};

// AI event handlers
document.getElementById('ai-toggle').addEventListener('click', () => {
  const aiUI = document.getElementById('ai-ui');
  if (aiUI.style.display === 'none') {
    showAIUI();
  } else {
    hideAIUI();
  }
});

document.getElementById('add-ai-btn').addEventListener('click', () => {
  addAIPlayer();
});

document.getElementById('remove-all-ai-btn').addEventListener('click', () => {
  removeAllAI();
});

// Quit game button
document.getElementById('quit-game').addEventListener('click', () => {
  quitGame();
});

// AI functions
function showAIUI() {
  document.getElementById('ai-ui').style.display = 'block';
  document.getElementById('tournament-ui').style.display = 'none';
  document.getElementById('spectator-ui').style.display = 'none';
  document.getElementById('replay-ui').style.display = 'none';
  socket.emit('get-ai-difficulties');
}

function hideAIUI() {
  document.getElementById('ai-ui').style.display = 'none';
}

function addAIPlayer() {
  const difficulty = document.getElementById('ai-difficulty-select').value;
  const personalityType = document.getElementById('ai-personality-select').value;
  
  const personality = getAIPersonality(personalityType);
  
  console.log('Adding AI player...');
  socket.emit('add-ai-player', {
    difficulty,
    personality
  });
  
  // Update button state for visual feedback
  const addAIBtn = document.getElementById('add-ai-btn');
  if (addAIBtn) {
    addAIBtn.textContent = 'Adding AI...';
    addAIBtn.disabled = true;
    
    // Re-enable after a short delay
    setTimeout(() => {
      addAIBtn.textContent = 'Add AI Player';
      addAIBtn.disabled = false;
    }, 2000);
  }
}

function removeAllAI() {
  currentAIPlayers.forEach(aiPlayer => {
    socket.emit('remove-ai-player', { aiPlayerId: aiPlayer.id });
  });
  currentAIPlayers = [];
  updateAIPlayersList();
}

// Quit game function
function quitGame() {
  const confirmQuit = confirm('Are you sure you want to quit the game? This will remove all your pieces and end your session.');
  
  if (confirmQuit) {
    // Clear local game state
    gameState = {
      players: {},
      pieces: {},
      gridConfig: { rows: 20, cols: 8 }
    };
    
    // Clear visual elements
    Object.keys(pieceMeshes).forEach(pieceId => {
      scene.remove(pieceMeshes[pieceId]);
      delete pieceMeshes[pieceId];
    });
    
    // Clear highlights and selections
    clearValidMoveHighlights();
    clearSelectionHighlight();
    selectedPieceId = null;
    validMoves = [];
    
    // Update UI
    gameInfoEl.textContent = 'You have quit the game';
    gameInfoEl.style.color = '#ff6b6b';
    
    // Notify server and disconnect
    socket.emit('quit-game');
    
    // Optionally reload page after short delay
    setTimeout(() => {
      if (confirm('Would you like to reload the page to start a new game?')) {
        window.location.reload();
      }
    }, 1000);
  }
}

function getAIPersonality(personalityType) {
  const personalities = {
    balanced: {
      preferredPieces: ['QUEEN', 'ROOK', 'BISHOP'],
      playStyle: 'balanced',
      riskTolerance: 0.5,
      aggressiveness: 0.5
    },
    aggressive: {
      preferredPieces: ['QUEEN', 'KNIGHT', 'JUMPER'],
      playStyle: 'aggressive',
      riskTolerance: 0.8,
      aggressiveness: 0.8
    },
    defensive: {
      preferredPieces: ['ROOK', 'BISHOP', 'KING'],
      playStyle: 'defensive',
      riskTolerance: 0.2,
      aggressiveness: 0.2
    },
    evolution: {
      preferredPieces: ['PAWN', 'SPLITTER', 'JUMPER'],
      playStyle: 'evolution',
      riskTolerance: 0.6,
      aggressiveness: 0.4
    }
  };
  
  return personalities[personalityType] || personalities.balanced;
}

function updateAIPlayersList() {
  const aiList = document.getElementById('ai-players-list');
  
  if (currentAIPlayers.length === 0) {
    aiList.innerHTML = '<div style="color: #888; font-size: 12px;">No AI players active</div>';
    return;
  }
  
  aiList.innerHTML = currentAIPlayers.map(aiPlayer => `
    <div style="padding: 5px; margin: 2px 0; background: rgba(255, 255, 255, 0.1); border-radius: 3px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: bold; color: ${aiPlayer.color};">🤖 ${aiPlayer.name}</div>
        <div style="font-size: 11px; color: #ccc;">${aiPlayer.aiDifficulty} | ${aiPlayer.pieces.length} pieces</div>
      </div>
      <div style="display: flex; gap: 5px;">
        <button onclick="showAIStats('${aiPlayer.id}')" style="padding: 2px 5px; background: #555; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Stats</button>
        <button onclick="removeAIPlayer('${aiPlayer.id}')" style="padding: 2px 5px; background: #cc0000; color: #fff; border: none; border-radius: 2px; cursor: pointer; font-size: 10px;">Remove</button>
      </div>
    </div>
  `).join('');
}

function removeAIPlayer(aiPlayerId) {
  socket.emit('remove-ai-player', { aiPlayerId });
}

function showAIStats(aiPlayerId) {
  socket.emit('get-ai-stats', { aiPlayerId });
  document.getElementById('ai-stats').style.display = 'block';
}

function updateAIStats(aiPlayerId, stats) {
  if (stats) {
    document.getElementById('ai-moves-played').textContent = stats.movesPlayed;
    document.getElementById('ai-battles-won').textContent = stats.battlesWon;
    document.getElementById('ai-battles-lost').textContent = stats.battlesLost;
    document.getElementById('ai-pieces-evolved').textContent = stats.piecesEvolved;
    document.getElementById('ai-avg-think-time').textContent = Math.round(stats.averageThinkTime) + 'ms';
  }
}

// Socket event handlers for AI
socket.on('ai-player-added', (data) => {
  console.log('AI player added:', data);
  currentAIPlayers.push(data.aiPlayer);
  updateAIPlayersList();
  
  // Show notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50px;
    right: 20px;
    background: #00cc66;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    font-size: 14px;
  `;
  notification.textContent = `🤖 AI Player Added: ${data.aiPlayer.name} (${data.difficulty})`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
});

socket.on('ai-player-removed', (data) => {
  console.log('AI player removed:', data);
  currentAIPlayers = currentAIPlayers.filter(p => p.id !== data.aiPlayerId);
  updateAIPlayersList();
});

socket.on('ai-add-failed', (data) => {
  console.log('AI add failed:', data);
  alert('Failed to add AI player: ' + data.error);
});

socket.on('ai-difficulties', (data) => {
  console.log('AI difficulties:', data);
  // Update difficulty select if needed
  const difficultySelect = document.getElementById('ai-difficulty-select');
  if (difficultySelect && data && data.difficulties) {
    difficultySelect.innerHTML = '';
    data.difficulties.forEach((diff) => {
      const option = document.createElement('option');
      option.value = diff.key;
      option.textContent = diff.name;
      difficultySelect.appendChild(option);
    });
    // Set default to MEDIUM
    difficultySelect.value = 'MEDIUM';
  }
});

socket.on('ai-difficulty-updated', (data) => {
  console.log('AI difficulty updated:', data);
  const aiPlayer = currentAIPlayers.find(p => p.id === data.aiPlayerId);
  if (aiPlayer) {
    aiPlayer.aiDifficulty = data.newDifficulty;
    updateAIPlayersList();
  }
});

socket.on('ai-stats', (data) => {
  console.log('AI stats:', data);
  updateAIStats(data.aiPlayerId, data.stats);
});

socket.on('ai-move-completed', (data) => {
  console.log('AI move completed:', data);
  
  // Show AI move notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(0, 204, 102, 0.9);
    color: white;
    padding: 8px;
    border-radius: 3px;
    z-index: 1000;
    font-size: 12px;
    max-width: 300px;
  `;
  notification.textContent = `🤖 ${data.aiName}: ${data.moveResult}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
});

// Update currentAIPlayers when game state changes
socket.on('game-state-update', (data) => {
  // Update AI players list based on game state
  const aiPlayersInGame = Object.values(data.players).filter(p => p.isAI);
  currentAIPlayers = aiPlayersInGame;
  updateAIPlayersList();
});

// Lobby system socket handlers
socket.on('lobby-created', (data) => {
  currentLobby = data.lobby;
  isInLobby = true;
  showLobbyRoom(data.lobby);
  console.log('Lobby created:', data.lobby.name);
});

socket.on('lobby-joined', (data) => {
  currentLobby = data.lobby;
  isInLobby = true;
  showLobbyRoom(data.lobby);
  console.log('Joined lobby:', data.lobby.name);
});

socket.on('lobby-left', (data) => {
  currentLobby = null;
  isInLobby = false;
  hideLobbyCreation();
  refreshLobbies();
  console.log('Left lobby:', data.lobbyId);
});

socket.on('lobby-updated', (data) => {
  if (currentLobby && currentLobby.id === data.lobby.id) {
    currentLobby = data.lobby;
    updateLobbyRoomDisplay(data.lobby);
  }
});

socket.on('lobby-list', (data) => {
  lobbies = data.lobbies;
  updateLobbyList(lobbies);
});

socket.on('lobby-list-update', (data) => {
  lobbies = data.lobbies;
  updateLobbyList(lobbies);
});

socket.on('lobby-creation-failed', (data) => {
  alert('Failed to create lobby: ' + data.error);
});

socket.on('lobby-join-failed', (data) => {
  alert('Failed to join lobby: ' + data.error);
});

socket.on('lobby-leave-failed', (data) => {
  alert('Failed to leave lobby: ' + data.error);
});

socket.on('ready-toggled', (data) => {
  console.log('Ready status toggled:', data.ready);
});

socket.on('ready-toggle-failed', (data) => {
  alert('Failed to toggle ready status: ' + data.error);
});

socket.on('game-starting', (data) => {
  console.log('Game starting in 3 seconds...');
  startGameCountdown(data.countdown);
});

socket.on('game-started', (data) => {
  console.log('Game started!', data);
  currentLobby = null;
  isInLobby = false;
  hideLobbyUI();
  
  // The game state will be updated through the normal game-state-update event
  showNotification('Game Started!', 'The game has begun. Good luck!');
});

socket.on('lobby-settings-updated', (data) => {
  console.log('Lobby settings updated:', data.settings);
});

socket.on('lobby-settings-update-failed', (data) => {
  alert('Failed to update lobby settings: ' + data.error);
});

socket.on('lobby-info', (data) => {
  console.log('Lobby info:', data.lobby);
});

socket.on('lobby-not-found', (data) => {
  alert('Lobby not found: ' + data.lobbyId);
});

socket.on('player-lobby', (data) => {
  if (data.lobby) {
    currentLobby = data.lobby;
    isInLobby = true;
    showLobbyRoom(data.lobby);
  }
});

socket.on('lobby-stats', (data) => {
  console.log('Lobby stats:', data.stats);
});

// Statistics system socket handlers
socket.on('player-stats', (data) => {
  playerStats = data.stats;
  displayPersonalStats(playerStats);
});

socket.on('leaderboard', (data) => {
  currentLeaderboard = data.leaderboard;
  displayLeaderboard(currentLeaderboard, data.category);
});

// Delta update handlers for better performance
socket.on('piece-update', (data) => {
  const { pieceId, piece } = data;
  if (gameState.pieces) {
    gameState.pieces[pieceId] = piece;
    performanceOptimizer.updatePieceEfficient(piece);
    
    // Throttled UI update
    performanceOptimizer.createThrottledFunction('ui-update', () => {
      updateUI();
    }, 200);
  }
});

socket.on('piece-removed', (data) => {
  const { pieceId } = data;
  if (gameState.pieces && gameState.pieces[pieceId]) {
    delete gameState.pieces[pieceId];
    performanceOptimizer.removePieceEfficient(pieceId);
    
    // Throttled UI update
    performanceOptimizer.createThrottledFunction('ui-update', () => {
      updateUI();
    }, 200);
  }
});

socket.on('player-update', (data) => {
  const { playerId, player } = data;
  if (gameState.players) {
    gameState.players[playerId] = player;
    
    // Throttled UI update
    performanceOptimizer.createThrottledFunction('ui-update', () => {
      updateUI();
    }, 200);
  }
});

socket.on('achievements', (data) => {
  playerAchievements = data.achievements;
  displayAchievements(playerAchievements);
});

socket.on('global-stats', (data) => {
  globalStats = data.stats;
  displayGlobalStats(globalStats);
});

socket.on('player-rank', (data) => {
  console.log(`Player rank in ${data.category}: ${data.rank}`);
});

socket.on('game-history', (data) => {
  console.log('Game history:', data.history);
});

// Evolution system socket handlers
socket.on('evolution-bank-info', (data) => {
  updateEvolutionBank(data.bankInfo);
});

// Evolution choice handlers moved to setupSocketListeners() function

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
socket.on('timer-started', (data) => {
  console.log('Timer started:', data);
  startTimer(data.playerId, data.timeLimit, data.startTime);
  
  // Update active player display
  const player = gameState.players[data.playerId];
  if (player) {
    updateActivePlayer(data.playerId, player.name);
  }
});

socket.on('turn-changed', (data) => {
  console.log('Turn changed:', data);
  updateActivePlayer(data.activePlayer, data.playerName);
  
  // Show notification if it's your turn
  if (data.activePlayer === socket.id) {
    showNotification('Your Turn', 'Make your move!', 'info');
  }
});

socket.on('player-timeout', (data) => {
  console.log('Player timeout:', data);
  showNotification('Player Timeout', data.message, 'warning');
  
  // Clear the timer display
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  document.getElementById('timer-status').textContent = 'Player timed out';
  document.getElementById('timer-status').style.color = '#ff8800';
});

socket.on('timers-paused', (data) => {
  console.log('Timers paused:', data);
  pauseTimer();
});

socket.on('timers-resumed', (data) => {
  console.log('Timers resumed:', data);
  resumeTimer();
});

socket.on('move-pending', (data) => {
  console.log('Move pending:', data);
  showNotification('Move Pending', data.message, 'info');
  
  // Pause timer briefly to show move is being processed
  if (currentTimer) {
    clearInterval(currentTimer);
    currentTimer = null;
  }
  
  document.getElementById('timer-status').textContent = 'Processing move...';
  document.getElementById('timer-status').style.color = '#ffff00';
});

socket.on('move-collision', (data) => {
  console.log('Move collision:', data);
  showNotification('Collision!', data.message, 'warning');
  
  // Pause timer during collision resolution
  pauseTimer();
});

// Real-time system handlers
socket.on('game-ready-to-begin', (data) => {
  console.log('Game ready to begin:', data);
  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    statusEl.textContent = data.message;
    statusEl.style.color = '#00ff00';
  }
  showNotification('Game Ready', `${data.message} - ${data.playersReady} players ready`, 'success');
});

socket.on('waiting-for-players', (data) => {
  console.log('Waiting for players:', data);
  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    statusEl.textContent = `${data.message} (${data.playersReady}/${data.playersNeeded})`;
    statusEl.style.color = '#ffff00';
  }
});

socket.on('move-queued', (data) => {
  console.log('Move queued:', data);
  showNotification('Move Queued', data.message, 'info');
  
  // Show queue indicator
  const statusEl = document.getElementById('timer-status');
  if (statusEl) {
    statusEl.textContent = 'Move queued - waiting for timer';
    statusEl.style.color = '#ffaa00';
  }
});

socket.on('move-cancelled', (data) => {
  console.log('Move cancelled:', data);
  if (data.playerId === socket.id) {
    showNotification('Move Cancelled', 'Queued move has been cancelled', 'info');
    
    // Clear queue indicator
    const statusEl = document.getElementById('timer-status');
    if (statusEl) {
      statusEl.textContent = 'Timer counting down...';
      statusEl.style.color = '#ff8800';
    }
  }
});

socket.on('cancel-queued-move-result', (data) => {
  console.log('Cancel queued move result:', data);
  if (data.success) {
    showNotification('Move Cancelled', 'Queued move cancelled successfully', 'info');
  } else {
    showNotification('Cancel Failed', 'No move to cancel', 'warning');
  }
});

socket.on('player-timer-state', (data) => {
  console.log('Player timer state:', data);
  // Update UI based on timer and queue state
  updateTimerUI(data.timer, data.queuedMove);
});

socket.on('queued-move-state', (data) => {
  console.log('Queued move state:', data);
  // Update queue display
  updateQueueDisplay(data.queuedMove);
});

socket.on('collision-contest-prompt', (data) => {
  console.log('Collision contest prompt:', data);
  showNotification('Collision Contest', 
    `${data.attackingPiece.symbol} vs ${data.defendingPiece.symbol} at (${data.targetPosition.row}, ${data.targetPosition.col})`, 
    'warning');
  
  // This would normally show a contest UI, but for now just show notification
  if (data.defendingPiece.playerId === socket.id) {
    showNotification('Defend!', 'Choose to contest or decline the battle', 'info');
  }
});

// Chat system socket handlers
socket.on('chat-message', (data) => {
  console.log('Chat message received:', data);
  addChatMessage(data);
});

socket.on('chat-history', (data) => {
  console.log('Chat history received:', data);
  data.messages.forEach(message => {
    addChatMessage(message);
  });
});

socket.on('chat-error', (data) => {
  console.log('Chat error:', data);
  showNotification('Chat Error', data.error, 'error');
  updateChatStatus(`Error: ${data.error}`);
});

socket.on('player-eliminated', (data) => {
  console.log('Player eliminated:', data);
  showNotification('Player Eliminated', 
    `${data.playerName} has been eliminated! (${data.eliminationReason.replace('_', ' ')})`, 
    'warning');
});

socket.on('elimination-message', (data) => {
  console.log('Elimination message:', data);
  showNotification('Elimination', data.message, 'info');
});

socket.on('elimination-effects', (data) => {
  console.log('Elimination effects:', data);
  showNotification('Elimination Effects', data.message, 'warning');
});

socket.on('piece-removal-effect', (data) => {
  console.log('Piece removal effect:', data);
  // This could trigger visual effects for piece removal
});

socket.on('victory-message', (data) => {
  console.log('Victory message:', data);
  showNotification('Victory!', data.message, 'success');
});

socket.on('game-victory', (data) => {
  console.log('Game victory:', data);
  
  // Calculate game duration
  const gameDuration = data.gameDuration || 'Unknown';
  
  // Get player stats
  const myPlayerId = socket.id;
  const myStats = {
    piecesKilled: 0,
    piecesLost: 0,
    evolutionPoints: 0
  };
  
  // Calculate stats from game state
  if (gameState && gameState.pieces) {
    Object.values(gameState.pieces).forEach(piece => {
      if (piece.playerId === myPlayerId) {
        myStats.piecesKilled += piece.kills || 0;
      }
    });
  }
  
  // Get player info
  const myPlayer = gameState.players[myPlayerId];
  if (myPlayer) {
    myStats.evolutionPoints = myPlayer.evolutionBank?.totalEarned || 0;
  }
  
  // Show game over screen
  showGameOver(data.winnerName, {
    duration: gameDuration,
    piecesKilled: myStats.piecesKilled,
    piecesLost: myStats.piecesLost,
    evolutionPoints: myStats.evolutionPoints,
    victoryType: data.victoryType
  });
});

socket.on('territory-update', (data) => {
  console.log('Territory update:', data);
  // This could be used to update territory visualization
});

socket.on('game-draw', (data) => {
  console.log('Game draw:', data);
  showNotification('Draw!', data.message, 'info');
});

// Initialize chat system when page loads
window.addEventListener('load', () => {
  initializeChatSystem();
  
  // Add AI player button handler - removed duplicate listener
  // The button handler is already set up in the addAIPlayer function above
});

// Start animation
animate();

console.log('EvoChess client fully initialized');
console.log('Click on pieces to see valid moves');
console.log('🎮 Simplified controls: Click pieces to select, drag to rotate camera');

// Show initial help message
setTimeout(() => {
  showNotification('Controls', 
    'Click on your pieces to select them and see valid moves. Drag anywhere else to rotate the camera.',
    'info'
  );
  gameInfoEl.textContent = 'Click on your pieces to select them';
}, 2000); 

// Color selection system
let availableColors = [];

// Initialize color selection
function initializeColorSelection() {
  socket.emit('get-available-colors');
}

// Socket handlers for color selection
socket.on('available-colors', (data) => {
  availableColors = data.colors;
  updateColorSelector();
});

socket.on('color-selected', (data) => {
  console.log('🎨 Color selected:', data.colorId);
  selectedColor = data.colorId;
  updateColorSelector();
  updateSelectedColorDisplay();
  
  // Force piece color update by clearing cache and recreating pieces
  performanceOptimizer.clearPieceCache();
  if (gameState && gameState.pieces) {
    console.log('🔄 Updating piece colors after color selection');
    updateVisuals();
  }
});

socket.on('color-selection-failed', (data) => {
  console.warn('Color selection failed:', data.error);
  alert('Color selection failed: ' + data.error);
});

// AI player event handlers
socket.on('ai-player-added', (data) => {
  console.log('AI player added:', data);
  showNotification('AI Player Added', `${data.name} has joined the game!`, 'success');
});

socket.on('ai-add-failed', (data) => {
  console.error('Failed to add AI player:', data.error);
  showNotification('AI Error', data.error, 'error');
});

// Update color selector UI
function updateColorSelector() {
  const colorOptionsEl = document.getElementById('color-options');
  if (!colorOptionsEl) return;
  
  colorOptionsEl.innerHTML = '';
  
  availableColors.forEach(color => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.backgroundColor = `#${color.hex.toString(16).padStart(6, '0')}`;
    option.title = color.name;
    option.dataset.colorId = color.id;
    
    if (selectedColor === color.id) {
      option.classList.add('selected');
      option.textContent = '✓';
    }
    
    option.addEventListener('click', () => {
      console.log('🎨 User clicked on color:', color.id, color.name);
      if (selectedColor !== color.id) {
        console.log('🎨 Sending color selection to server:', color.id);
        socket.emit('select-color', { colorId: color.id });
      } else {
        console.log('🎨 Color already selected, ignoring click');
      }
    });
    
    colorOptionsEl.appendChild(option);
  });
}

// Update selected color display
function updateSelectedColorDisplay() {
  const selectedColorEl = document.getElementById('selected-color');
  if (!selectedColorEl) return;
  
  if (selectedColor) {
    const colorInfo = availableColors.find(c => c.id === selectedColor);
    if (colorInfo) {
      selectedColorEl.textContent = `Selected: ${colorInfo.name}`;
      selectedColorEl.style.color = `#${colorInfo.hex.toString(16).padStart(6, '0')}`;
    }
  } else {
    selectedColorEl.textContent = 'None selected';
    selectedColorEl.style.color = '#aaa';
  }
}

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
  
  // Validate data structure
  if (!Array.isArray(availablePaths)) {
    console.error('🎯 availablePaths is not an array:', availablePaths);
    availablePaths = [];
  }
  console.log('🎯 Evolution paths count:', availablePaths.length);
  availablePaths.forEach((path, i) => console.log(`🎯 Path ${i}:`, path));
  
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