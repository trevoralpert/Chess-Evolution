// Scene Setup Manager for EvoChess
// Handles Three.js scene setup, grid overlay creation, and lighting configuration

/**
 * Create grid overlay on the sphere
 */
function createGridOverlay() {
  try {
    console.log('🚨 CREATEGRIDSOVERLAY FUNCTION CALLED - THIS SHOULD DEFINITELY SHOW UP! 🚨');
    console.log('🔧 Starting grid overlay creation...');
    
    // Get scene reference
    const { scene } = typeof getSceneComponents === 'function' ? getSceneComponents() : 
                      { scene: typeof window !== 'undefined' ? window.scene : null };
    
    if (!scene) {
      console.error('Scene not available for grid overlay creation');
      return;
    }
    
    // Grid configuration
    const gridRows = 20;
    const gridCols = 8;
    const globeRadius = 5;
    
    console.log(`Grid configuration: ${gridRows} rows × ${gridCols} cols`);
    
    const gridSquares = [];
    
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
            color: 0x333333, // Dark gray borders
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          });
          
          const border = new THREE.Mesh(borderGeometry, borderMaterial);
          border.position.set(0, 0, 0);
          border.userData = { isBorder: true };
          scene.add(border);
          
        } catch (error) {
          console.error(`Error creating grid section at row ${row}, col ${col}:`, error);
        }
      }
    }
    
    console.log(`✅ Grid overlay created successfully with ${gridSquares.length} squares`);
    return gridSquares;
    
  } catch (error) {
    console.error('Error creating grid overlay:', error);
    return [];
  }
}

/**
 * Create the main globe
 */
function createGlobe() {
  const { scene } = typeof getSceneComponents === 'function' ? getSceneComponents() : 
                    { scene: typeof window !== 'undefined' ? window.scene : null };
  
  if (!scene) {
    console.error('Scene not available for globe creation');
    return null;
  }
  
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
  return globe;
}

/**
 * Setup enhanced lighting for better piece visibility
 */
function setupLighting() {
  const { scene } = typeof getSceneComponents === 'function' ? getSceneComponents() : 
                    { scene: typeof window !== 'undefined' ? window.scene : null };
  
  if (!scene) {
    console.error('Scene not available for lighting setup');
    return;
  }
  
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
  
  return {
    ambientLight,
    hemisphereLight,
    directionalLight,
    directionalLight2,
    pointLight
  };
}

/**
 * Initialize the complete scene setup
 */
function initializeSceneSetup() {
  console.log('🌍 Initializing Scene Setup...');
  
  // Create globe
  const globe = createGlobe();
  
  // Setup lighting
  const lights = setupLighting();
  
  // Create grid overlay
  const gridSquares = createGridOverlay();
  
  console.log('✅ Scene Setup initialized successfully');
  
  return {
    globe,
    lights,
    gridSquares
  };
}

/**
 * Test model accessibility
 */
async function testModelAccess() {
  try {
    const response = await fetch('./models/king.glb', { method: 'HEAD' });
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

/**
 * Setup model loading system
 */
async function setupModelLoading() {
  const gameInfoEl = document.getElementById('game-info');
  
  // Check if GLTFLoader is available
  const hasGLTFLoader = typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined';
  
  if (!hasGLTFLoader) {
    console.log('GLTFLoader not available, using geometric fallbacks');
    if (gameInfoEl) {
      gameInfoEl.textContent = 'Using geometric shapes. Waiting for players...';
    }
    return false;
  }
  
  // Test model accessibility and preload if available
  const accessible = await testModelAccess();
  
  if (accessible) {
    try {
      // Preload models if preloadModels function is available
      if (typeof preloadModels === 'function') {
        await preloadModels();
        console.log('All models ready for use!');
        if (gameInfoEl) {
          gameInfoEl.textContent = 'Models loaded! Waiting for players...';
        }
        return true;
      } else {
        console.log('preloadModels function not available');
        if (gameInfoEl) {
          gameInfoEl.textContent = 'Models ready! Waiting for players...';
        }
        return true;
      }
    } catch (error) {
      console.error('Error preloading models:', error);
      if (gameInfoEl) {
        gameInfoEl.textContent = 'Error loading models. Using fallback shapes.';
      }
      return false;
    }
  } else {
    console.log('Using geometric fallbacks for all pieces');
    if (gameInfoEl) {
      gameInfoEl.textContent = 'Using geometric shapes. Waiting for players...';
    }
    return false;
  }
}

export {
  // Scene Setup
  createGridOverlay,
  createGlobe,
  setupLighting,
  initializeSceneSetup,
  
  // Model Loading
  testModelAccess,
  setupModelLoading
};