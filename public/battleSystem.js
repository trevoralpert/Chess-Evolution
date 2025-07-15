import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

/**
 * Resolve a battle between two pieces
 * @param {object} pieceA - First piece object with { id, value, color }
 * @param {object} pieceB - Second piece object with { id, value, color }
 * @returns {string} The ID of the winning piece
 */
export function resolveBattle(pieceA, pieceB) {
  console.log(`Battle: ${pieceA.id} (${pieceA.value}) vs ${pieceB.id} (${pieceB.value})`);
  
  // Higher point value wins
  if (pieceA.value > pieceB.value) {
    console.log(`${pieceA.id} wins by point value`);
    return pieceA.id;
  }
  if (pieceB.value > pieceA.value) {
    console.log(`${pieceB.id} wins by point value`);
    return pieceB.id;
  }
  
  // Equal values - coin flip
  const coinFlip = Math.random();
  const winner = coinFlip < 0.5 ? pieceA.id : pieceB.id;
  console.log(`Tie resolved by coin flip: ${winner} wins`);
  return winner;
}

/**
 * Show visual battle effect at the specified position
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Mesh} winnerMesh - The winning piece mesh
 * @param {THREE.Mesh} loserMesh - The losing piece mesh
 */
export function showBattleEffect(scene, winnerMesh, loserMesh) {
  // Create flash effect at battle position
  const flashGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const flashMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffff00, 
    transparent: true,
    opacity: 0.8
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  
  // Position flash at the battle location
  flash.position.copy(winnerMesh.position);
  scene.add(flash);
  
  // Animate flash
  let opacity = 0.8;
  const fadeOut = () => {
    opacity -= 0.05;
    flashMaterial.opacity = opacity;
    
    if (opacity > 0) {
      requestAnimationFrame(fadeOut);
    } else {
      scene.remove(flash);
    }
  };
  
  fadeOut();
  
  // Add particle effect
  createBattleParticles(scene, winnerMesh.position);
  
  console.log(`Battle effect shown at position:`, winnerMesh.position);
}

/**
 * Create particle effect for battle resolution
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Vector3} position - Position to create particles
 */
function createBattleParticles(scene, position) {
  const particleCount = 20;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ 
      color: Math.random() * 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(position);
    
    // Random velocity
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // Animate particles
  let life = 60; // frames
  const animateParticles = () => {
    life--;
    
    particles.forEach(particle => {
      particle.position.add(particle.velocity);
      particle.velocity.multiplyScalar(0.98); // Slow down over time
      particle.material.opacity = life / 60;
    });
    
    if (life > 0) {
      requestAnimationFrame(animateParticles);
    } else {
      // Remove particles
      particles.forEach(particle => {
        scene.remove(particle);
      });
    }
  };
  
  animateParticles();
}

/**
 * Calculate evolution points gained from battle
 * @param {object} winner - Winning piece object
 * @param {object} loser - Losing piece object
 * @returns {number} Evolution points to add
 */
export function calculateEvolutionPoints(winner, loser) {
  const pointDifference = Math.abs(winner.value - loser.value);
  
  if (winner.value > loser.value) {
    // Higher level piece beats lower level piece - gains 1 point
    return 1;
  } else if (winner.value < loser.value) {
    // Lower level piece beats higher level piece - gains difference
    return pointDifference;
  } else {
    // Equal level pieces - winner gains 1 point
    return 1;
  }
}

/**
 * Jump ball logic to prevent random streak losses
 * @param {string} playerId - Player ID
 * @param {object} gameState - Current game state
 * @returns {number} Bias modifier for coin flip (-0.1 to 0.1)
 */
export function getJumpBallBias(playerId, gameState) {
  const playerStats = gameState.playerStats[playerId] || { 
    recentBattles: [],
    coinFlipLosses: 0
  };
  
  // Check recent battles for losing streaks
  const recentLosses = playerStats.recentBattles.filter(battle => 
    battle.result === 'loss' && battle.type === 'coinflip'
  ).length;
  
  // Give slight bias to players who have lost recent coin flips
  if (recentLosses >= 2) {
    return 0.1; // 10% bias towards winning
  } else if (recentLosses >= 1) {
    return 0.05; // 5% bias towards winning
  }
  
  return 0; // No bias
}

/**
 * Enhanced battle resolution with jump ball logic
 * @param {object} pieceA - First piece
 * @param {object} pieceB - Second piece
 * @param {object} gameState - Current game state
 * @returns {object} Battle result with winner and evolution points
 */
export function resolveBattleWithJumpBall(pieceA, pieceB, gameState) {
  // Standard point value comparison
  if (pieceA.value > pieceB.value) {
    return {
      winnerId: pieceA.id,
      loserId: pieceB.id,
      evolutionPoints: calculateEvolutionPoints(pieceA, pieceB),
      battleType: 'point_value'
    };
  }
  
  if (pieceB.value > pieceA.value) {
    return {
      winnerId: pieceB.id,
      loserId: pieceA.id,
      evolutionPoints: calculateEvolutionPoints(pieceB, pieceA),
      battleType: 'point_value'
    };
  }
  
  // Equal values - apply jump ball logic
  const biasA = getJumpBallBias(pieceA.playerId, gameState);
  const biasB = getJumpBallBias(pieceB.playerId, gameState);
  
  const adjustedRandom = Math.random() + biasA - biasB;
  const winner = adjustedRandom < 0.5 ? pieceA : pieceB;
  const loser = winner === pieceA ? pieceB : pieceA;
  
  return {
    winnerId: winner.id,
    loserId: loser.id,
    evolutionPoints: calculateEvolutionPoints(winner, loser),
    battleType: 'coinflip',
    bias: biasA - biasB
  };
} 