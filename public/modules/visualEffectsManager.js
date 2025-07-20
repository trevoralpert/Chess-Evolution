// Visual Effects Manager Module
// Handles particle systems, visual effects, and 3D animations

import { TransitionManager } from './transitionManager.js';
import { getWorldPosition } from './mathUtils.js';

export class VisualEffectsManager {
  constructor(scene, renderer, dependencies = {}) {
    this.scene = scene;
    this.renderer = renderer;
    this.activeEffects = new Map();
    this.animationQueue = [];
    this.particleSystem = null;
    this.transitionManager = new TransitionManager();
    
    // Injected dependencies to avoid global variable coupling
    this.pieceMeshes = dependencies.pieceMeshes || {};
    this.camera = dependencies.camera || null;
    
    // Initialize particle system
    this.initParticleSystem();
  }
  
  // Set dependencies after construction (for cases where they're not available during construction)
  setDependencies(dependencies) {
    if (dependencies.pieceMeshes) this.pieceMeshes = dependencies.pieceMeshes;
    if (dependencies.camera) this.camera = dependencies.camera;
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
    const mesh = this.pieceMeshes[piece.id];
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
    if (!this.camera) {
      console.warn('No camera provided to VisualEffectsManager for screen shake');
      return;
    }
    
    const originalPosition = this.camera.position.clone();
    const shakeIntensity = 0.02 * intensity;
    const duration = 300;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const shakeAmount = shakeIntensity * (1 - progress);
        this.camera.position.x = originalPosition.x + (Math.random() - 0.5) * shakeAmount;
        this.camera.position.y = originalPosition.y + (Math.random() - 0.5) * shakeAmount;
        this.camera.position.z = originalPosition.z + (Math.random() - 0.5) * shakeAmount;
        
        requestAnimationFrame(animate);
      } else {
        this.camera.position.copy(originalPosition);
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
  
  // Additional effect methods for enhanced functionality
  createHealingEffect(position, intensity = 1.0) {
    this.createSpiralEffect(position, 0x00ff88, 1000);
    this.createRadialBurst(position, 0x88ff88, 15 * intensity);
  }
  
  createTeleportEffect(fromPos, toPos) {
    // Disappear effect at origin
    this.createParticleExplosion(fromPos, 0x8888ff, 30);
    this.createSpiralEffect(fromPos, 0x4444ff, 800);
    
    // Appear effect at destination
    setTimeout(() => {
      this.createParticleExplosion(toPos, 0x8888ff, 30);
      this.createSpiralEffect(toPos, 0x4444ff, 800);
    }, 400);
  }
  
  createPowerUpEffect(position, color = 0xffff00) {
    this.createRadialBurst(position, color, 25);
    
    // Create pulsing ring
    const geometry = new THREE.RingGeometry(0.1, 0.3, 16);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = Math.PI / 2;
    
    this.scene.add(ring);
    
    // Animate ring
    const startTime = Date.now();
    const duration = 1000;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress < 1) {
        const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.2;
        ring.scale.set(pulse, pulse, 1);
        material.opacity = 0.8 * (1 - progress);
        
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(ring);
        geometry.dispose();
        material.dispose();
      }
    };
    
    animate();
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
    
    // Clean up transition manager
    if (this.transitionManager) {
      this.transitionManager.cleanup();
    }
  }
}