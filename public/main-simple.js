console.log('🚀 Starting main-simple.js v14 - CACHE BUST TEST 🚀');

// Check if Three.js is loaded
if (typeof THREE === 'undefined') {
  console.error('Three.js not loaded!');
} else {
  console.log('Three.js loaded successfully:', THREE);
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

// Socket.io connection
const socket = io();
console.log('Socket.io initialized');

// Three.js scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a);
document.body.appendChild(renderer.domElement);

console.log('Three.js scene initialized successfully');

// Mouse down tracking for click detection (needed regardless of camera controls)
let mouseDownTime = 0;
window.addEventListener('mousedown', (e) => {
  mouseDownTime = Date.now();
  console.log(`Mouse down at: ${mouseDownTime}`);
});

// Manual camera controls (since OrbitControls is having issues)
let controls;
if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 15;
  console.log('OrbitControls initialized successfully');
} else {
  console.log('Using manual camera controls instead of OrbitControls');
  // Simple manual camera control
  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let cameraDistance = 10;
  let cameraAngleX = 0;
  let cameraAngleY = 0;
  
  function updateCameraPosition() {
    camera.position.x = cameraDistance * Math.sin(cameraAngleX) * Math.cos(cameraAngleY);
    camera.position.y = cameraDistance * Math.sin(cameraAngleY);
    camera.position.z = cameraDistance * Math.cos(cameraAngleX) * Math.cos(cameraAngleY);
    camera.lookAt(0, 0, 0);
  }
  
  // Mouse controls for camera
  window.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });
  
  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    
    const deltaX = e.clientX - mouseX;
    const deltaY = e.clientY - mouseY;
    
    cameraAngleX += deltaX * 0.01;
    cameraAngleY += deltaY * 0.01;
    
    // Clamp Y rotation to prevent flipping
    cameraAngleY = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, cameraAngleY));
    
    updateCameraPosition();
    
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Zoom controls
  window.addEventListener('wheel', (e) => {
    cameraDistance += e.deltaY * 0.01;
    cameraDistance = Math.max(8, Math.min(15, cameraDistance));
    updateCameraPosition();
  });
  
  // Initialize camera position
  updateCameraPosition();
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
  console.log('🔧 Starting grid overlay creation...');
  
  // Use correct grid configuration
  const gridRows = 20;
  const gridCols = 8;
  
  console.log(`Grid configuration: ${gridRows} rows × ${gridCols} cols`);
  
  // Create grid squares
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      try {
        // Calculate position using correct grid size
        const { phi, theta } = gridToSpherical(gridRows, gridCols, row, col);
        const position = sphericalToCartesian(globeRadius + 0.1, phi, theta); // Moved further out
        
        // Debug first few positions
        if (row < 2 && col < 2) {
          console.log(`Position (${row}, ${col}): phi=${phi}, theta=${theta}, pos=`, position);
        }
        
        // Calculate square size based on latitude (larger at equator)
        const latFactor = Math.sin(THREE.MathUtils.degToRad(90 - (row / (gridRows - 1)) * 180));
        const squareSize = 0.4 + (latFactor * 0.2); // Made larger
        
        // Check if this is a pole position
        const isPole = (row === 0 || row === gridRows - 1);
        
        if (isPole) {
          // Create special pole marker (octagon/circle)
          const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 8);
          const poleMaterial = new THREE.MeshBasicMaterial({ 
            color: row === 0 ? 0xffd700 : 0xff4500, // Gold for north, orange for south
            transparent: true,
            opacity: 0.8 // Made more opaque
          });
          const poleMarker = new THREE.Mesh(poleGeometry, poleMaterial);
          poleMarker.position.set(position.x, position.y, position.z);
          poleMarker.lookAt(0, 0, 0);
          scene.add(poleMarker);
          poleMarkers.push(poleMarker);
        } else {
          // Create regular grid square with special equator highlighting
          const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
          
          // Check if this is the equator (row 10 in 0-19 grid)
          const isEquator = (row === 10);
          
          const squareMaterial = new THREE.MeshBasicMaterial({ 
            color: isEquator ? 0xffd700 : 0x00ff00, // Gold for equator, green for regular
            transparent: true,
            opacity: isEquator ? 0.8 : 0.6, // More opaque for equator
            side: THREE.DoubleSide
          });
          
          const square = new THREE.Mesh(squareGeometry, squareMaterial);
          square.position.set(position.x, position.y, position.z);
          square.lookAt(0, 0, 0);
          square.userData = { gridRow: row, gridCol: col, isEquator: isEquator };
          scene.add(square);
          gridSquares.push(square);
          
          // Add pulsing animation for equator squares
          if (isEquator) {
            square.userData.originalOpacity = 0.8;
            square.userData.isEquatorSquare = true;
          }
        }
      } catch (error) {
        console.error(`❌ Error creating grid square at (${row}, ${col}):`, error);
      }
    }
  }
  
  console.log(`✅ Created ${gridSquares.length} grid squares and ${poleMarkers.length} pole markers`);
}

// Create grid overlay on startup
createGridOverlay();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

console.log('Lighting added to scene');

// UI elements - defined early so they're available for model loading
const playerCountEl = document.getElementById('player-count');
const gameInfoEl = document.getElementById('game-info');
const statusEl = document.getElementById('status');

// Model loading system
const modelCache = {};
const modelLoader = new THREE.GLTFLoader();

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

// Start preloading models
preloadModels().then(() => {
  console.log('All models ready for use!');
  gameInfoEl.textContent = 'Models loaded! Waiting for players...';
}).catch(error => {
  console.error('Error preloading models:', error);
  gameInfoEl.textContent = 'Error loading models. Using fallback shapes.';
});

// Old grid overlay function removed - using new version above

// Game state
let gameState = {
  players: {},
  pieces: {},
  gridConfig: { rows: 20, cols: 8 }
};

// Visual elements
const pieceMeshes = {};
let validMoves = [];
let selectedPieceId = null;

// UI elements - moved to top of file

// Socket event handlers
socket.on('connect', () => {
  statusEl.textContent = 'Connected';
  statusEl.style.color = '#00ff00';
  console.log('Socket connected successfully');
  console.log('My socket ID:', socket.id);
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
  gameState = newGameState;
  await updateVisuals();
  updateUI();
  console.log('Game state updated:', gameState);
  console.log('Players in game state:', Object.keys(gameState.players));
  console.log('My socket ID:', socket.id);
  console.log('Players object:', gameState.players);
});

socket.on('valid-moves', (data) => {
  // Only show moves if this is for the currently selected piece
  if (data.pieceId === selectedPieceId) {
    validMoves = data.moves;
    
    // Check if this is a Hybrid Queen with dual movement
    const selectedPiece = gameState.pieces[selectedPieceId];
    const isDualMovement = selectedPiece && selectedPiece.type === 'HYBRID_QUEEN';
    
    if (isDualMovement) {
      showDualMovementUI();
      // Don't highlight moves yet - wait for mode selection
      console.log(`Hybrid Queen selected - showing dual movement UI`);
    } else {
      hideDualMovementUI();
      highlightValidMoves();
      console.log(`Showing ${validMoves.length} valid moves for piece ${data.pieceId}`);
    }
  }
});

socket.on('move-result', (data) => {
  if (data.success) {
    console.log('Move successful:', data.message);
    gameInfoEl.textContent = `Move successful`;
  } else {
    console.log('Move failed:', data.message);
    gameInfoEl.textContent = `Move failed: ${data.message}`;
    gameInfoEl.style.color = '#ff6b6b';
    
    // Reset color after 3 seconds
    setTimeout(() => {
      gameInfoEl.style.color = '#ffffff';
    }, 3000);
  }
});

socket.on('battle-result', (data) => {
  const { winner, loser, position, winnerKills } = data;
  console.log(`Battle completed! Winner: ${winner}, Loser: ${loser}, Kills: ${winnerKills}`);
  
  // Update UI with battle information
  gameInfoEl.textContent = `Battle won! ${winnerKills} kills`;
  
  // Flash the battle position
  const worldPos = getWorldPosition(position.row, position.col);
  const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.8
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.set(worldPos.x, worldPos.y, worldPos.z);
  scene.add(flash);
  
  // Remove flash after animation
  setTimeout(() => {
    scene.remove(flash);
  }, 1000);
});

socket.on('piece-evolution', (data) => {
  const { pieceId, oldType, newType, position } = data;
  console.log(`Evolution! ${oldType} → ${newType} at position (${position.row}, ${position.col})`);
  
  // Update UI with evolution information
  gameInfoEl.textContent = `Evolution: ${oldType} → ${newType}!`;
  
  // Create evolution effect
  const worldPos = getWorldPosition(position.row, position.col);
  const evolutionGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const evolutionMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.6,
    wireframe: true
  });
  const evolutionEffect = new THREE.Mesh(evolutionGeometry, evolutionMaterial);
  evolutionEffect.position.set(worldPos.x, worldPos.y, worldPos.z);
  scene.add(evolutionEffect);
  
  // Animate evolution effect
  let scale = 0.5;
  const animateEvolution = () => {
    scale += 0.1;
    evolutionEffect.scale.set(scale, scale, scale);
    evolutionEffect.material.opacity = 0.8 - (scale * 0.2);
    
    if (scale < 2) {
      requestAnimationFrame(animateEvolution);
    } else {
      scene.remove(evolutionEffect);
    }
  };
  animateEvolution();
});

socket.on('evolution-point-award', (data) => {
  const { pieceId, pieceType, points, reason, position } = data;
  console.log(`Evolution points awarded: ${pieceType} gained ${points} points for ${reason}`);
  
  // Create special effect for circumnavigation
  if (reason === 'circumnavigation') {
    const worldPos = getWorldPosition(position.row, position.col);
    
    // Create golden ring effect for circumnavigation
    const ringGeometry = new THREE.RingGeometry(0.2, 0.4, 16);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700, // Gold color
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(worldPos.x, worldPos.y, worldPos.z);
    ring.lookAt(0, 0, 0); // Face toward center of globe
    scene.add(ring);
    
    // Show circumnavigation notification
    const player = gameState.players[gameState.pieces[pieceId]?.playerId];
    if (player) {
      const playerIndex = Object.keys(gameState.players).indexOf(player.id) + 1;
      showNotification(`🌍 Player ${playerIndex} Circumnavigation! +8 Evolution Points! 🌍`, '#FFD700', 3000);
    }
    
    // Animate ring effect
    let scale = 0.5;
    let rotation = 0;
    const animateRing = () => {
      scale += 0.05;
      rotation += 0.1;
      ring.scale.set(scale, scale, scale);
      ring.rotation.z = rotation;
      ring.material.opacity = 0.8 - (scale * 0.3);
      
      if (scale < 3) {
        requestAnimationFrame(animateRing);
      } else {
        scene.remove(ring);
        ringGeometry.dispose();
        ringMaterial.dispose();
      }
    };
    animateRing();
  }
});

socket.on('equator-bonus', (data) => {
  const { pieceId, pieceType, points, position } = data;
  console.log(`Equator bonus: ${pieceType} piece ${pieceId} reached the equator (+1 evolution point, ${points} total)`);
  
  // Visual feedback for equator bonus
  const worldPosition = getWorldPosition(position.row, position.col);
  
  // Create golden ring effect around the piece
  const ringGeometry = new THREE.RingGeometry(0.2, 0.3, 16);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.set(worldPosition.x, worldPosition.y, worldPosition.z);
  ring.lookAt(0, 0, 0);
  scene.add(ring);
  
  // Animate ring expansion
  let scale = 1;
  const ringAnimation = () => {
    scale += 0.08;
    ring.scale.set(scale, scale, scale);
    ring.material.opacity -= 0.03;
    
    if (ring.material.opacity > 0) {
      requestAnimationFrame(ringAnimation);
    } else {
      scene.remove(ring);
    }
  };
  
  ringAnimation();
  
  // Update UI
  gameInfoEl.textContent = `Pawn reached equator! +1 evolution point`;
  gameInfoEl.style.color = '#ffd700';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 2000);
});

socket.on('split-cost-applied', (data) => {
  const { pieceId, evolutionPoints, cooldownTurns, weakenedTurns } = data;
  console.log(`Split cost applied to piece ${pieceId}: -2 evolution points, ${cooldownTurns} turn cooldown, ${weakenedTurns} turn weakness`);
  
  // Update UI
  gameInfoEl.textContent = `Splitter split! -2 evolution points, ${cooldownTurns} turn cooldown`;
  gameInfoEl.style.color = '#ff9900';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
});

// Tournament socket handlers
socket.on('tournament-created', (data) => {
  const { tournament } = data;
  console.log(`Tournament created: ${tournament.name}`);
  gameInfoEl.textContent = `Tournament created: ${tournament.name}`;
  gameInfoEl.style.color = '#4444ff';
  setTimeout(() => {
    gameInfoEl.style.color = '#ffffff';
  }, 3000);
});

socket.on('tournament-list', (data) => {
  tournaments = data.tournaments;
  updateTournamentList();
});

socket.on('tournament-list-updated', (data) => {
  tournaments = data.tournaments;
  updateTournamentList();
});

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

socket.on('game-victory', (data) => {
  const { winnerId, playerIndex, winnerColor, totalPlayers } = data;
  console.log(`GAME VICTORY: Player ${playerIndex + 1} (${winnerId}) wins!`);
  
  // Update UI with victory information
  gameInfoEl.textContent = `🎉 Player ${playerIndex + 1} WINS! 🎉`;
  gameInfoEl.style.color = winnerColor;
  
  // Show victory notification
  showNotification(`🎉 Player ${playerIndex + 1} WINS! 🎉`, winnerColor, 5000);
  
  // Flash the globe with winner's color
  const originalColor = globe.material.color.clone();
  globe.material.color.setHex(parseInt(winnerColor.replace('#', '0x')));
  setTimeout(() => {
    globe.material.color.copy(originalColor);
  }, 2000);
  
  // Disable further interactions
  selectedPieceId = null;
  clearValidMoveHighlights();
  hideDualMovementUI();
});

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
  // Remove pieces that no longer exist
  Object.keys(pieceMeshes).forEach(pieceId => {
    if (!gameState.pieces[pieceId]) {
      scene.remove(pieceMeshes[pieceId]);
      delete pieceMeshes[pieceId];
    }
  });
  
  // Add or update pieces
  const piecePromises = Object.values(gameState.pieces).map(async piece => {
    if (!pieceMeshes[piece.id]) {
      try {
        await createPieceMesh(piece);
      } catch (error) {
        console.error(`Failed to create mesh for piece ${piece.id}:`, error);
      }
    } else {
      updatePieceMesh(piece);
    }
  });
  
  // Wait for all piece creation to complete
  await Promise.all(piecePromises);
}

async function createPieceMesh(piece) {
  const player = gameState.players[piece.playerId];
  const position = getWorldPosition(piece.row, piece.col);
  
  let mesh;
  
  // Try to load GLB model first
  try {
    const gltf = await loadModel(piece.type);
    if (gltf && gltf.scene) {
      console.log(`Using GLB model for ${piece.type}`);
      
      // Clone the model scene
      mesh = gltf.scene.clone();
      
      // Apply player color tinting to materials
      const playerColor = getColorFromString(player.color);
      mesh.traverse((child) => {
        if (child.isMesh && child.material) {
          // Create a copy of the material to avoid affecting other instances
          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => {
              const newMat = mat.clone();
              newMat.color.multiplyScalar(0.7); // Darken the base color
              newMat.color.lerp(new THREE.Color(playerColor), 0.3); // Blend with player color
              return newMat;
            });
          } else {
            child.material = child.material.clone();
            child.material.color.multiplyScalar(0.7); // Darken the base color
            child.material.color.lerp(new THREE.Color(playerColor), 0.3); // Blend with player color
          }
        }
      });
      
      // Scale the model appropriately for the sphere
      const modelScale = getModelScale(piece.type);
      mesh.scale.set(modelScale, modelScale, modelScale);
      
    } else {
      throw new Error(`Failed to load GLB model for ${piece.type}`);
    }
    
  } catch (error) {
    console.warn(`GLB model loading failed for ${piece.type}, falling back to geometric shape:`, error);
    
    // Fallback to geometric shapes
    mesh = createGeometricPiece(piece.type);
    
    // Use piece-specific color if available, otherwise use player color
    const pieceColor = getPieceColor(piece.type) || getColorFromString(player.color);
    
    const material = new THREE.MeshStandardMaterial({
      color: pieceColor,
      metalness: 0.3,
      roughness: 0.7
    });
    
    mesh.material = material;
    
    // Apply geometric shape scaling
    const scale = getGeometricScale(piece.type);
    mesh.scale.set(scale, scale, scale);
  }
  
  // Position on sphere surface
  mesh.position.set(position.x, position.y, position.z);
  mesh.userData = { pieceId: piece.id, piece: piece };
  
  // Debug: Log King positions only
  if (piece.type === 'KING') {
    console.log(`${piece.symbol} King at grid (${piece.row}, ${piece.col})`);
  }
  
  // Add text label with piece symbol
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;
  
  context.fillStyle = 'white';
  context.font = '32px Arial';
  context.textAlign = 'center';
  context.fillText(piece.symbol, 32, 40);
  
  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.SpriteMaterial({ map: texture });
  const label = new THREE.Sprite(labelMaterial);
  label.scale.set(0.5, 0.5, 1);
  label.position.set(0, 0.3, 0);
  
  mesh.add(label);
  scene.add(mesh);
  pieceMeshes[piece.id] = mesh;
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

// Helper function to create geometric shape fallbacks
function createGeometricPiece(pieceType) {
  let geometry;
  
  switch (pieceType) {
    case 'KING':
      geometry = new THREE.ConeGeometry(0.12, 0.3, 8);
      break;
    case 'QUEEN':
      geometry = new THREE.ConeGeometry(0.12, 0.25, 8);
      break;
    case 'ROOK':
      geometry = new THREE.BoxGeometry(0.15, 0.2, 0.15);
      break;
    case 'KNIGHT':
      geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      break;
    case 'BISHOP':
      geometry = new THREE.ConeGeometry(0.1, 0.25, 6);
      break;
    case 'PAWN':
      geometry = new THREE.SphereGeometry(0.08, 12, 12);
      break;
    case 'SPLITTER':
      geometry = new THREE.OctahedronGeometry(0.1);
      break;
    case 'JUMPER':
      geometry = new THREE.TetrahedronGeometry(0.12);
      break;
    case 'SUPER_JUMPER':
      geometry = new THREE.IcosahedronGeometry(0.1);
      break;
    case 'HYPER_JUMPER':
      geometry = new THREE.DodecahedronGeometry(0.1);
      break;
    case 'MISTRESS_JUMPER':
      geometry = new THREE.CylinderGeometry(0.08, 0.12, 0.2, 8);
      break;
    case 'HYBRID_QUEEN':
      geometry = new THREE.ConeGeometry(0.12, 0.25, 8);
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
  }
}

function getWorldPosition(row, col) {
  const { phi, theta } = gridToSpherical(
    gameState.gridConfig.rows,
    gameState.gridConfig.cols,
    row,
    col
  );
  return sphericalToCartesian(globeRadius + 0.15, phi, theta);
}

function updateUI() {
  const playerCount = Object.keys(gameState.players).length;
  playerCountEl.textContent = `Players: ${playerCount}`;
  
  const pieceCount = Object.keys(gameState.pieces).length;
  gameInfoEl.textContent = `${pieceCount} pieces on board`;
}

let selectedMovementMode = null;

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

function showEvolutionChoice(data) {
  currentEvolutionChoice = data;
  
  // Show evolution choice panel
  document.getElementById('evolution-choice-panel').style.display = 'block';
  
  // Update piece info
  document.getElementById('evolution-piece-name').textContent = `${data.piece.type} (${data.piece.symbol})`;
  document.getElementById('evolution-piece-age').textContent = `Age: ${Math.floor(data.availablePaths[0]?.currentAliveTime || 0)}s`;
  
  // Display available paths
  const pathsContainer = document.getElementById('evolution-paths');
  pathsContainer.innerHTML = '';
  
  data.availablePaths.forEach(path => {
    const pathDiv = document.createElement('div');
    pathDiv.style.cssText = `
      margin-bottom: 5px; 
      padding: 8px; 
      background: rgba(0, 0, 0, 0.2); 
      border-radius: 3px; 
      border: 1px solid ${path.canAfford && path.meetsRequirements ? '#00aa00' : '#666'};
      cursor: ${path.canAfford && path.meetsRequirements ? 'pointer' : 'default'};
    `;
    
    const rarityColors = {
      'common': '#ffffff',
      'uncommon': '#1eff00',
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    
    pathDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 16px; margin-right: 8px;">${path.icon}</span>
          <div>
            <div style="color: ${rarityColors[path.rarity]}; font-weight: bold; font-size: 12px;">${path.name}</div>
            <div style="color: #ccc; font-size: 10px;">${path.description}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #ffd700; font-size: 12px; font-weight: bold;">Cost: ${path.cost}</div>
          <div style="color: #888; font-size: 10px;">
            ${path.timeRequirement > 0 ? `Time: ${Math.floor(path.timeRequirement)}s` : 'No time req'}
          </div>
          ${!path.canAfford ? '<div style="color: #ff0000; font-size: 10px;">Not enough points</div>' : ''}
          ${!path.meetsRequirements ? '<div style="color: #ff0000; font-size: 10px;">Requirements not met</div>' : ''}
        </div>
      </div>
    `;
    
    if (path.canAfford && path.meetsRequirements) {
      pathDiv.addEventListener('click', () => {
        socket.emit('make-evolution-choice', { 
          pieceId: data.pieceId, 
          pathId: path.id 
        });
      });
    }
    
    pathsContainer.appendChild(pathDiv);
  });
  
  // Start timer
  let timeLeft = data.timeLeft || 30;
  evolutionTimer = setInterval(() => {
    timeLeft--;
    document.getElementById('evolution-timer').textContent = `Time left: ${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(evolutionTimer);
      hideEvolutionChoice();
    }
  }, 1000);
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
  const name = document.getElementById('tournament-name').value || 'Globe Chess Tournament';
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
  
  // Add new highlights
  validMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col);
    
    // Different colors and shapes for different move types
    let highlightColor, highlightGeometry;
    
    if (move.type === 'attack') {
      highlightColor = 0xff4444; // Red for attack
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    } else if (move.type === 'split') {
      highlightColor = 0xff6b6b; // Lighter red for split
      highlightGeometry = new THREE.OctahedronGeometry(0.12); // Different shape for split

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
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.8,
      wireframe: move.type === 'split' || move.type === 'jump-capture' || move.type === 'multi-jump-capture' || move.type === 'dual-move-queen' || move.type === 'dual-move-jumper' // Wireframe for special moves
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y, position.z);
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    scene.add(highlight);
    console.log(`Added ${move.type} highlight at (${move.row}, ${move.col})`);
  });
}

function clearValidMoveHighlights() {
  // Remove all valid move highlights
  scene.children.forEach(child => {
    if (child.userData.isValidMoveHighlight) {
      scene.remove(child);
    }
  });
  
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

// Helper function to get piece-specific colors based on evolution level
function getPieceColor(pieceType) {
  const pieceColors = {
    'PAWN': 0x8B4513,      // Brown - starting piece
    'KING': 0xFFD700,      // Gold - special piece
    'SPLITTER': 0xFF6B6B,  // Red - evolution level 1
    'JUMPER': 0x4ECDC4,    // Teal - evolution level 2
    'SUPER_JUMPER': 0x45B7D1, // Blue - evolution level 3
    'HYPER_JUMPER': 0x9B59B6, // Purple - evolution level 4
    'MISTRESS_JUMPER': 0xE74C3C, // Red - evolution level 5
    'HYBRID_QUEEN': 0xF39C12  // Orange - evolution level 6 (max)
  };
  return pieceColors[pieceType];
}

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  console.log('Click event triggered');
  
  // Check if this is a right-click
  const isRightClick = event.button === 2;
  
  // For now, just allow all clicks - we can add drag detection later if needed
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true); // Include child objects
  
  if (intersects.length > 0) {
    let clickedObject = intersects[0].object;
    console.log('Clicked object:', clickedObject.userData, clickedObject.type);
    console.log('Has piece:', !!clickedObject.userData.piece);
    console.log('Has valid move highlight:', !!clickedObject.userData.isValidMoveHighlight);
    
    // For GLB models, we might need to traverse up to find the piece mesh
    while (clickedObject && !clickedObject.userData.piece && !clickedObject.userData.isValidMoveHighlight) {
      clickedObject = clickedObject.parent;
    }
    
    console.log('Found piece object:', clickedObject ? clickedObject.userData : 'none');
    
    // Check if clicked on a piece
    if (clickedObject && clickedObject.userData.piece) {
      const piece = clickedObject.userData.piece;
      console.log('Clicked piece:', piece.symbol, piece.type);
      
      // Check if this piece belongs to the current player
      const currentPlayer = Object.values(gameState.players).find(p => p.id === socket.id);
      console.log('Socket ID:', socket.id);
      console.log('Current player:', currentPlayer);
      console.log('Piece player ID:', piece.playerId);
      console.log('Player ID match:', currentPlayer && piece.playerId === currentPlayer.id);
      
      if (currentPlayer && piece.playerId === currentPlayer.id) {
        if (isRightClick) {
          // Right-click: Request evolution options
          socket.emit('request-evolution-choice', { pieceId: piece.id });
        } else {
          // Left-click: Select piece and show moves
          selectedPieceId = piece.id;
          highlightSelectedPiece(piece.id);
          
          // Request valid moves for this piece
          socket.emit('get-valid-moves', { pieceId: piece.id });
          
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
      const move = clickedObject.userData.move;
      console.log('Clicked valid move:', move);
      console.log('Move data:', move.row, move.col, move.type);
      
      // Find the currently selected piece by checking which piece has valid moves displayed
      const currentSelectedPieceId = getCurrentlySelectedPieceId();
      if (currentSelectedPieceId) {
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
          socket.emit('split-piece', {
            pieceId: currentSelectedPieceId,
            targetRow: move.row,
            targetCol: move.col
          });
          
          // Update UI
          gameInfoEl.textContent = `Splitting piece...`;
          console.log(`Splitting piece ${currentSelectedPieceId} to (${move.row}, ${move.col})`);

        } else {
          // Send regular move command to server
          socket.emit('move-piece', {
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
}

window.addEventListener('click', onMouseClick);
window.addEventListener('contextmenu', (event) => {
  event.preventDefault(); // Prevent context menu on right-click
});
window.addEventListener('mousedown', onMouseClick);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
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
  
  socket.emit('add-ai-player', {
    difficulty,
    personality
  });
}

function removeAllAI() {
  currentAIPlayers.forEach(aiPlayer => {
    socket.emit('remove-ai-player', { aiPlayerId: aiPlayer.id });
  });
  currentAIPlayers = [];
  updateAIPlayersList();
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

socket.on('evolution-choice-available', (data) => {
  showEvolutionChoice(data);
  showEvolutionUI(); // Auto-show evolution UI when choice is available
});

socket.on('evolution-choice-success', (data) => {
  handleEvolutionCompleted(data);
});

socket.on('evolution-choice-failed', (data) => {
  hideEvolutionChoice();
  showNotification('Evolution Failed', data.error, 'error');
});

socket.on('evolution-choice-cancelled', (data) => {
  hideEvolutionChoice();
  showNotification('Evolution Cancelled', 'Evolution choice was cancelled', 'info');
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

socket.on('evolution-point-award', (data) => {
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

// Start animation
animate();

console.log('Globe Chess client fully initialized');
console.log('Click on pieces to see valid moves'); 