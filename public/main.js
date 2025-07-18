console.log('Starting main.js - attempting to import Three.js...');

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
console.log('Three.js imported successfully:', THREE);

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/OrbitControls.js';
console.log('OrbitControls imported successfully:', OrbitControls);

import { gridToSpherical, sphericalToCartesian } from './utils/gridToSphere.js';
console.log('Grid utilities imported successfully');

import { resolveBattle, showBattleEffect } from './battleSystem.js';
console.log('Battle system imported successfully');

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

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 15;
camera.position.set(0, 0, 10);

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

console.log('Globe created and added to scene');

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

console.log('Lighting added to scene');

// Game state
let gameState = {
  players: {},
  pieces: {},
  gridConfig: { rows: 20, cols: 8 }  // Fixed: Use correct 8 columns
};

// Visual elements
const pieceMeshes = {};
const selectedPiece = null;
let validMoves = [];

// UI elements
const playerCountEl = document.getElementById('player-count');
const gameInfoEl = document.getElementById('game-info');
const statusEl = document.getElementById('status');

// Socket event handlers
socket.on('connect', () => {
  statusEl.textContent = 'Connected';
  statusEl.style.color = '#00ff00';
  console.log('Socket connected successfully');
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

socket.on('game-state-update', (newGameState) => {
  gameState = newGameState;
  updateVisuals();
  updateUI();
  console.log('Game state updated:', gameState);
});

socket.on('battle-result', (battleData) => {
  console.log('Battle result:', battleData);
  
  const winnerMesh = pieceMeshes[battleData.winner];
  const loserMesh = pieceMeshes[battleData.loser];
  
  if (winnerMesh && loserMesh) {
    showBattleEffect(scene, winnerMesh, loserMesh);
  }
});

socket.on('valid-moves', (data) => {
  validMoves = data.moves;
  highlightValidMoves();
});

function updateVisuals() {
  // Remove pieces that no longer exist
  Object.keys(pieceMeshes).forEach(pieceId => {
    if (!gameState.pieces[pieceId]) {
      scene.remove(pieceMeshes[pieceId]);
      delete pieceMeshes[pieceId];
    }
  });
  
  // Add or update pieces
  Object.values(gameState.pieces).forEach(piece => {
    if (!pieceMeshes[piece.id]) {
      createPieceMesh(piece);
    } else {
      updatePieceMesh(piece);
    }
  });
}

function createPieceMesh(piece) {
  const player = gameState.players[piece.playerId];
  const position = getWorldPosition(piece.row, piece.col);
  
  // Create different geometries for different piece types
  let geometry;
  switch (piece.type) {
    case 'KING':
      geometry = new THREE.ConeGeometry(0.12, 0.3, 8);
      break;
    case 'PAWN':
      geometry = new THREE.SphereGeometry(0.08, 12, 12);
      break;
    default:
      geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15);
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: getColorFromString(player.color),
    metalness: 0.3,
    roughness: 0.7
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.userData = { pieceId: piece.id, piece: piece };
  
  // Add text label
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
  scene.children.forEach(child => {
    if (child.userData.isValidMoveHighlight) {
      scene.remove(child);
    }
  });
  
  // Add new highlights
  validMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col);
    
    const highlightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.7
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y, position.z);
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    scene.add(highlight);
  });
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

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    
    // Check if clicked on a piece
    if (clickedObject.userData.pieceId) {
      const piece = clickedObject.userData.piece;
      console.log('Clicked piece:', piece.symbol, piece.type);
      
      // Request valid moves for this piece
      socket.emit('get-valid-moves', { pieceId: piece.id });
    }
    
    // Check if clicked on a valid move highlight
    if (clickedObject.userData.isValidMoveHighlight) {
      const move = clickedObject.userData.move;
      console.log('Clicked valid move:', move);
      
      // TODO: Implement piece selection and movement
      // For now, just log the move
    }
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
  controls.update();
  
  // Rotate globe slowly
  globe.rotation.y += 0.001;
  
  renderer.render(scene, camera);
}

// Start animation
animate();

console.log('EvoChess client fully initialized');
console.log('Click on pieces to see valid moves'); 