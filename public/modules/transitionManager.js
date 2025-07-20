// Transition Manager Module
// Handles smooth UI transitions and animations

import { easeOutCubic } from './mathUtils.js';

export class TransitionManager {
  constructor() {
    this.activeTransitions = new Map();
  }
  
  /**
   * Fade in an element
   * @param {HTMLElement} element - Element to fade in
   * @param {number} duration - Animation duration in milliseconds
   */
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
  
  /**
   * Fade out an element
   * @param {HTMLElement} element - Element to fade out
   * @param {number} duration - Animation duration in milliseconds
   */
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
  
  /**
   * Slide in an element
   * @param {HTMLElement} element - Element to slide in
   * @param {string} direction - Direction to slide from ('left' or 'right')
   * @param {number} duration - Animation duration in milliseconds
   */
  slideIn(element, direction = 'left', duration = 500) {
    const startTime = Date.now();
    const startPos = direction === 'left' ? -element.offsetWidth : element.offsetWidth;
    
    element.style.transform = `translateX(${startPos}px)`;
    element.style.display = 'block';
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentPos = startPos * (1 - easeOutCubic(progress));
      element.style.transform = `translateX(${currentPos}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Slide out an element
   * @param {HTMLElement} element - Element to slide out
   * @param {string} direction - Direction to slide to ('left' or 'right')
   * @param {number} duration - Animation duration in milliseconds
   */
  slideOut(element, direction = 'left', duration = 500) {
    const startTime = Date.now();
    const endPos = direction === 'left' ? -element.offsetWidth : element.offsetWidth;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentPos = endPos * easeOutCubic(progress);
      element.style.transform = `translateX(${currentPos}px)`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    animate();
  }
  
  /**
   * Scale in an element
   * @param {HTMLElement} element - Element to scale in
   * @param {number} duration - Animation duration in milliseconds
   */
  scaleIn(element, duration = 300) {
    element.style.transform = 'scale(0)';
    element.style.display = 'block';
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const scale = easeOutCubic(progress);
      element.style.transform = `scale(${scale})`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  /**
   * Scale out an element
   * @param {HTMLElement} element - Element to scale out
   * @param {number} duration - Animation duration in milliseconds
   */
  scaleOut(element, duration = 300) {
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const scale = 1 - easeOutCubic(progress);
      element.style.transform = `scale(${scale})`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    };
    
    animate();
  }
  
  /**
   * Animate element opacity with custom easing
   * @param {HTMLElement} element - Element to animate
   * @param {number} fromOpacity - Starting opacity (0-1)
   * @param {number} toOpacity - Ending opacity (0-1)
   * @param {number} duration - Animation duration in milliseconds
   * @param {Function} callback - Optional callback when animation completes
   */
  animateOpacity(element, fromOpacity, toOpacity, duration = 300, callback = null) {
    element.style.opacity = fromOpacity.toString();
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentOpacity = fromOpacity + (toOpacity - fromOpacity) * easeOutCubic(progress);
      element.style.opacity = currentOpacity.toString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (callback) {
        callback();
      }
    };
    
    animate();
  }
  
  /**
   * Stop all active transitions for an element
   * @param {HTMLElement} element - Element to stop transitions for
   */
  stopTransitions(element) {
    // This is a placeholder - in a more advanced implementation,
    // we would track active animations and cancel them
    if (this.activeTransitions.has(element)) {
      this.activeTransitions.delete(element);
    }
  }
  
  /**
   * Clean up all active transitions
   */
  cleanup() {
    this.activeTransitions.clear();
  }
}