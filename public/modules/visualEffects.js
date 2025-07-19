// Visual Effects and Highlighting Module
export class VisualEffects {
  constructor() {
    this.highlightMeshes = [];
    this.selectionHighlight = null;
    this.validMoveHighlights = [];
  }

  initialize() {
    console.log('✨ Initializing Visual Effects...');
    
    // Listen for highlighting events
    document.addEventListener('highlightValidMoves', (event) => {
      this.highlightValidMoves(event.detail.moves);
    });
    
    document.addEventListener('clearValidMoveHighlights', () => {
      this.clearValidMoveHighlights();
    });
    
    document.addEventListener('highlightSelectedPiece', (event) => {
      this.highlightSelectedPiece(event.detail.pieceId);
    });
    
    document.addEventListener('clearSelectionHighlight', () => {
      this.clearSelectionHighlight();
    });
    
    document.addEventListener('highlightValidMovesForMode', (event) => {
      this.highlightValidMovesForMode(event.detail.mode);
    });
    
    console.log('✅ Visual Effects initialized');
  }

  highlightValidMoves(moves = []) {
    console.log('✨ Highlighting valid moves:', moves);
    
    // Clear existing highlights
    this.clearValidMoveHighlights();
    
    if (!moves || moves.length === 0) {
      console.log('⚠️ No valid moves to highlight');
      return;
    }
    
    moves.forEach(move => {
      const highlight = this.createMoveHighlight(move.row, move.col, move.moveType);
      if (highlight) {
        this.validMoveHighlights.push(highlight);
        window.gameScene.add(highlight);
      }
    });
    
    console.log(`✅ Created ${this.validMoveHighlights.length} move highlights`);
  }

  clearValidMoveHighlights() {
    console.log('🧹 Clearing valid move highlights');
    
    this.validMoveHighlights.forEach(highlight => {
      if (window.gameScene) {
        window.gameScene.remove(highlight);
      }
      
      // Clean up geometry and materials
      if (highlight.geometry) highlight.geometry.dispose();
      if (highlight.material) highlight.material.dispose();
    });
    
    this.validMoveHighlights = [];
  }

  createMoveHighlight(row, col, moveType = 'move') {
    const worldPos = window.sceneManager.getWorldPosition(row, col);
    if (!worldPos) return null;
    
    // Different highlight styles based on move type
    let color, opacity, scale;
    
    switch (moveType) {
      case 'attack':
      case 'capture':
        color = 0xff0000; // Red for attacks
        opacity = 0.7;
        scale = 0.4;
        break;
      case 'split':
        color = 0xff6b6b; // Light red for splits
        opacity = 0.6;
        scale = 0.35;
        break;
      case 'special':
        color = 0xffff00; // Yellow for special moves
        opacity = 0.6;
        scale = 0.35;
        break;
      default:
        color = 0x00ff00; // Green for normal moves
        opacity = 0.5;
        scale = 0.3;
    }
    
    // Create highlight geometry
    const geometry = new THREE.SphereGeometry(scale, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      depthTest: false
    });
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.position.copy(worldPos);
    
    // Add pulsing animation
    this.addPulseAnimation(highlight);
    
    return highlight;
  }

  highlightSelectedPiece(pieceId) {
    console.log('✨ Highlighting selected piece:', pieceId);
    
    // Clear existing selection highlight
    this.clearSelectionHighlight();
    
    // Get the piece mesh
    const pieceMesh = window.pieceMeshManager?.pieceMeshes?.[pieceId];
    if (!pieceMesh) {
      console.warn('⚠️ Piece mesh not found for highlighting:', pieceId);
      return;
    }
    
    // Create selection highlight
    const highlight = this.createSelectionHighlight(pieceMesh.position);
    if (highlight) {
      this.selectionHighlight = highlight;
      window.gameScene.add(highlight);
    }
  }

  clearSelectionHighlight() {
    if (this.selectionHighlight) {
      console.log('🧹 Clearing selection highlight');
      
      if (window.gameScene) {
        window.gameScene.remove(this.selectionHighlight);
      }
      
      // Clean up geometry and materials
      if (this.selectionHighlight.geometry) this.selectionHighlight.geometry.dispose();
      if (this.selectionHighlight.material) this.selectionHighlight.material.dispose();
      
      this.selectionHighlight = null;
    }
  }

  createSelectionHighlight(position) {
    // Create a ring highlight around the selected piece
    const geometry = new THREE.RingGeometry(0.4, 0.5, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthTest: false
    });
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.position.copy(position);
    highlight.position.y -= 0.1; // Slightly below the piece
    
    // Rotate to be flat on the surface
    highlight.rotation.x = -Math.PI / 2;
    
    // Add rotation animation
    this.addRotationAnimation(highlight);
    
    return highlight;
  }

  highlightValidMovesForMode(mode) {
    console.log('✨ Highlighting moves for mode:', mode);
    
    // This would filter and highlight moves based on the movement mode
    // For now, just re-highlight all valid moves
    const validMoves = window.gameStateManager?.validMoves || [];
    this.highlightValidMoves(validMoves);
  }

  addPulseAnimation(mesh) {
    // Add a simple pulse animation to the mesh
    const originalScale = mesh.scale.clone();
    const pulseSpeed = 0.02;
    const pulseAmount = 0.2;
    
    const animate = () => {
      if (mesh.parent) { // Check if mesh is still in scene
        const time = Date.now() * pulseSpeed;
        const scale = 1 + Math.sin(time) * pulseAmount;
        mesh.scale.copy(originalScale).multiplyScalar(scale);
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  addRotationAnimation(mesh) {
    // Add a rotation animation to the mesh
    const rotationSpeed = 0.01;
    
    const animate = () => {
      if (mesh.parent) { // Check if mesh is still in scene
        mesh.rotation.z += rotationSpeed;
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  // Battle and evolution effects
  createBattleEffect(position) {
    // Create a battle effect at the given position
    const particles = new THREE.Group();
    
    for (let i = 0; i < 20; i++) {
      const geometry = new THREE.SphereGeometry(0.02, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: Math.random() < 0.5 ? 0xff0000 : 0xffff00,
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);
      particle.position.add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ));
      
      particles.add(particle);
    }
    
    window.gameScene.add(particles);
    
    // Animate and remove after duration
    this.animateBattleEffect(particles, 2000);
    
    return particles;
  }

  animateBattleEffect(particles, duration) {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Remove particles
        if (window.gameScene) {
          window.gameScene.remove(particles);
        }
        
        // Clean up
        particles.children.forEach(particle => {
          if (particle.geometry) particle.geometry.dispose();
          if (particle.material) particle.material.dispose();
        });
        
        return;
      }
      
      // Animate particles
      particles.children.forEach(particle => {
        particle.position.y += 0.02;
        particle.material.opacity = 1 - progress;
      });
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  createEvolutionEffect(position) {
    // Create an evolution effect at the given position
    const geometry = new THREE.RingGeometry(0.1, 0.6, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    
    window.gameScene.add(ring);
    
    // Animate the evolution effect
    this.animateEvolutionEffect(ring, 3000);
    
    return ring;
  }

  animateEvolutionEffect(ring, duration) {
    const startTime = Date.now();
    const originalScale = ring.scale.clone();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        // Remove ring
        if (window.gameScene) {
          window.gameScene.remove(ring);
        }
        
        // Clean up
        if (ring.geometry) ring.geometry.dispose();
        if (ring.material) ring.material.dispose();
        
        return;
      }
      
      // Animate ring
      const scale = 1 + progress * 2;
      ring.scale.copy(originalScale).multiplyScalar(scale);
      ring.material.opacity = 0.8 * (1 - progress);
      ring.rotation.z += 0.05;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  // Clean up all effects
  dispose() {
    this.clearValidMoveHighlights();
    this.clearSelectionHighlight();
  }
}