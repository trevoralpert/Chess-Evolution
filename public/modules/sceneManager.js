// 3D Scene Manager Module
export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.globe = null;
    this.gridSquares = [];
    this.poleMarkers = [];
    this.globeRadius = 5;
    this.animationStarted = false;
  }

  initialize() {
    console.log('🎬 Initializing 3D Scene Manager...');
    
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLighting();
    this.createGlobe();
    this.createGridOverlay();
    this.setupControls();
    
    // Listen for socket connection to start game components
    document.addEventListener('socketConnected', () => {
      this.initializeGameComponents();
    });
    
    console.log('✅ Scene Manager initialized successfully');
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000011); // Dark blue space background
    window.gameScene = this.scene; // Make globally accessible
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 10);
    window.gameCamera = this.camera; // Make globally accessible
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    window.gameRenderer = this.renderer; // Make globally accessible
  }

  createLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Hemisphere light for sky/ground lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6);
    this.scene.add(hemisphereLight);

    // Directional light (main light source)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Second directional light for fill lighting
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-5, 5, -5);
    this.scene.add(directionalLight2);

    // Point light for additional illumination
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 5, 0);
    this.scene.add(pointLight);
  }

  createGlobe() {
    // Create the main globe geometry
    const sphereGeometry = new THREE.SphereGeometry(this.globeRadius, 64, 64);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      transparent: true,
      opacity: 0.8,
      wireframe: false
    });
    
    this.globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.globe.receiveShadow = true;
    this.scene.add(this.globe);
  }

  createGridOverlay() {
    const rows = 8;
    const cols = 8;
    
    // Clear existing grid
    this.gridSquares.forEach(square => this.scene.remove(square));
    this.gridSquares = [];
    
    // Create grid squares
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const { phi, theta } = this.gridToSpherical(rows, cols, row, col);
        const position = this.sphericalToCartesian(this.globeRadius + 0.01, phi, theta);
        
        // Create square geometry
        const squareGeometry = new THREE.PlaneGeometry(0.6, 0.6);
        const squareMaterial = new THREE.MeshBasicMaterial({
          color: (row + col) % 2 === 0 ? 0x404040 : 0x606060,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        
        const square = new THREE.Mesh(squareGeometry, squareMaterial);
        square.position.copy(position);
        
        // Orient the square to face outward from the globe
        square.lookAt(this.globe.position);
        square.rotateY(Math.PI);
        
        // Store grid coordinates
        square.userData = { row, col, gridPosition: { row, col } };
        
        this.gridSquares.push(square);
        this.scene.add(square);
      }
    }
    
    // Create pole markers
    this.createPoleMarkers();
  }

  createPoleMarkers() {
    // Clear existing pole markers
    this.poleMarkers.forEach(marker => this.scene.remove(marker));
    this.poleMarkers = [];
    
    // North pole marker
    const northPoleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const northPoleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const northPole = new THREE.Mesh(northPoleGeometry, northPoleMaterial);
    northPole.position.set(0, this.globeRadius + 0.2, 0);
    this.poleMarkers.push(northPole);
    this.scene.add(northPole);
    
    // South pole marker
    const southPoleGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const southPoleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const southPole = new THREE.Mesh(southPoleGeometry, southPoleMaterial);
    southPole.position.set(0, -this.globeRadius - 0.2, 0);
    this.poleMarkers.push(southPole);
    this.scene.add(southPole);
  }

  setupControls() {
    // Basic orbit controls would be set up here if using OrbitControls
    // For now, we'll use manual camera controls
    this.setupManualCameraControls();
  }

  setupManualCameraControls() {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let rotationX = 0;
    let rotationY = 0;

    const onMouseDown = (event) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      targetRotationX += deltaY * 0.01;
      targetRotationY += deltaX * 0.01;
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (event) => {
      const delta = event.deltaY * 0.01;
      this.camera.position.multiplyScalar(1 + delta * 0.1);
      
      // Clamp camera distance
      const distance = this.camera.position.length();
      if (distance < 8) {
        this.camera.position.normalize().multiplyScalar(8);
      } else if (distance > 20) {
        this.camera.position.normalize().multiplyScalar(20);
      }
    };

    // Add event listeners
    this.renderer.domElement.addEventListener('mousedown', onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', onMouseUp);
    this.renderer.domElement.addEventListener('wheel', onWheel);

    // Update camera rotation in animation loop
    const updateCamera = () => {
      rotationX += (targetRotationX - rotationX) * 0.1;
      rotationY += (targetRotationY - rotationY) * 0.1;
      
      // Apply rotation around the globe
      const distance = this.camera.position.length();
      this.camera.position.x = Math.cos(rotationY) * Math.cos(rotationX) * distance;
      this.camera.position.y = Math.sin(rotationX) * distance;
      this.camera.position.z = Math.sin(rotationY) * Math.cos(rotationX) * distance;
      
      this.camera.lookAt(0, 0, 0);
      
      requestAnimationFrame(updateCamera);
    };
    
    updateCamera();
  }

  initializeGameComponents() {
    console.log('🎮 Initializing game components...');
    
    if (!this.scene) {
      console.error('❌ Scene not initialized!');
      return;
    }
    
    // Start the animation loop if not already running
    if (!this.animationStarted) {
      console.log('🎬 Starting animation loop...');
      this.animate();
      this.animationStarted = true;
      window.animationStarted = true;
    }
    
    console.log('✅ Game components initialized successfully');
  }

  animate() {
    const animateLoop = () => {
      requestAnimationFrame(animateLoop);
      
      // Render the scene
      this.renderer.render(this.scene, this.camera);
      
      // Emit animation frame event for other modules
      document.dispatchEvent(new CustomEvent('animationFrame'));
    };
    
    animateLoop();
  }

  // Utility methods for coordinate conversion
  gridToSpherical(rows, cols, row, col) {
    const phi = (row / (rows - 1)) * Math.PI; // 0 to π (north to south)
    const theta = (col / cols) * 2 * Math.PI; // 0 to 2π (around the globe)
    return { phi, theta };
  }

  sphericalToCartesian(r, phi, theta) {
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  }

  getWorldPosition(row, col) {
    const rows = 8;
    const cols = 8;
    const { phi, theta } = this.gridToSpherical(rows, cols, row, col);
    return this.sphericalToCartesian(this.globeRadius + 0.02, phi, theta);
  }

  // Handle window resize
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Clean up resources
  dispose() {
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
    
    // Clean up geometries and materials
    this.gridSquares.forEach(square => {
      square.geometry.dispose();
      square.material.dispose();
    });
    
    this.poleMarkers.forEach(marker => {
      marker.geometry.dispose();
      marker.material.dispose();
    });
    
    if (this.globe) {
      this.globe.geometry.dispose();
      this.globe.material.dispose();
    }
  }
}

// Set up window resize handler
window.addEventListener('resize', () => {
  if (window.sceneManager) {
    window.sceneManager.onWindowResize();
  }
});