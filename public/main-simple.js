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
          // Create regular grid square
          const squareGeometry = new THREE.PlaneGeometry(squareSize, squareSize);
          const squareMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00, // Bright green for visibility
            transparent: true,
            opacity: 0.6, // Made more opaque
            side: THREE.DoubleSide
          });
          const square = new THREE.Mesh(squareGeometry, squareMaterial);
          square.position.set(position.x, position.y, position.z);
          square.lookAt(0, 0, 0);
          square.userData = { gridRow: row, gridCol: col };
          scene.add(square);
          gridSquares.push(square);
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
    highlightValidMoves();
    console.log(`Showing ${validMoves.length} valid moves for piece ${data.pieceId}`);
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
    } else {
      highlightColor = 0x44ff44; // Green for regular move
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.8,
      wireframe: move.type === 'split' // Wireframe for split moves to make them distinctive
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
  
  // Create a selection ring around the piece
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
        // Select this piece
        selectedPieceId = piece.id;
        highlightSelectedPiece(piece.id);
        
        // Request valid moves for this piece
        socket.emit('get-valid-moves', { pieceId: piece.id });
        
        // Update UI
        gameInfoEl.textContent = `Selected: ${piece.symbol} ${piece.type}`;
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
        selectedPieceId = null;
      }
    }
    
    // Check if clicked on globe (empty space)
    else if (clickedObject === globe) {
      // Clear selection when clicking on empty space
      selectedPieceId = null;
      clearValidMoveHighlights();
      gameInfoEl.textContent = 'Click on your pieces to select them';
    }
  } else {
    // Clicked on empty space - clear selection
    selectedPieceId = null;
    clearValidMoveHighlights();
    gameInfoEl.textContent = 'Click on your pieces to select them';
  }
}

window.addEventListener('click', onMouseClick);

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
  
  renderer.render(scene, camera);
}

// Start animation
animate();

console.log('Globe Chess client fully initialized');
console.log('Click on pieces to see valid moves'); 