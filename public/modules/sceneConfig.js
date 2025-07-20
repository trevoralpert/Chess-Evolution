// Scene Configuration Module
// Handles Three.js scene, camera, renderer, and lighting setup

import { CAMERA_CONFIG, RENDERER_CONFIG, WORLD_CONFIG } from './gameConfig.js';

/**
 * Create and configure the main Three.js scene
 * @returns {THREE.Scene} Configured scene
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011); // Dark blue space background
  return scene;
}

/**
 * Create and configure the camera
 * @returns {THREE.PerspectiveCamera} Configured camera
 */
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    window.innerWidth / window.innerHeight,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far
  );
  
  // Set default position
  camera.position.set(
    CAMERA_CONFIG.defaultPosition.x,
    CAMERA_CONFIG.defaultPosition.y,
    CAMERA_CONFIG.defaultPosition.z
  );
  
  return camera;
}

/**
 * Create and configure the WebGL renderer
 * @returns {THREE.WebGLRenderer} Configured renderer
 */
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer(RENDERER_CONFIG);
  
  // Set size to full window
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Enable shadows for better visual quality
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Append to DOM
  document.body.appendChild(renderer.domElement);
  
  return renderer;
}

/**
 * Create and configure all lighting for the scene
 * @param {THREE.Scene} scene - Scene to add lights to
 * @returns {object} Object containing all light references
 */
export function createLighting(scene) {
  const lights = {};
  
  // Enhanced ambient lighting for better piece visibility
  lights.ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(lights.ambient);
  
  // Add hemisphere light for natural top/bottom lighting
  lights.hemisphere = new THREE.HemisphereLight(0xffffff, 0x404040, 0.6);
  scene.add(lights.hemisphere);
  
  // Main directional light (increased intensity)
  lights.directional1 = new THREE.DirectionalLight(0xffffff, 1.0);
  lights.directional1.position.set(5, 5, 5);
  lights.directional1.castShadow = true;
  lights.directional1.shadow.mapSize.width = 2048;
  lights.directional1.shadow.mapSize.height = 2048;
  scene.add(lights.directional1);
  
  // Secondary directional light from opposite side for better coverage
  lights.directional2 = new THREE.DirectionalLight(0xffffff, 0.6);
  lights.directional2.position.set(-3, 3, -3);
  scene.add(lights.directional2);
  
  // Point light near camera for additional fill lighting
  lights.point = new THREE.PointLight(0xffffff, 0.5, 100);
  lights.point.position.set(0, 0, 10);
  scene.add(lights.point);
  
  console.log('Enhanced lighting added to scene');
  
  return lights;
}

/**
 * Create the main globe mesh
 * @returns {THREE.Mesh} Globe mesh
 */
export function createGlobe() {
  const sphereGeometry = new THREE.SphereGeometry(WORLD_CONFIG.globeRadius, 64, 64);
  const sphereMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a4d3a,
    roughness: 0.8,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9
  });
  
  const globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
  globe.receiveShadow = true;
  
  return globe;
}

/**
 * Create pole markers for the globe
 * @param {THREE.Scene} scene - Scene to add markers to
 * @returns {Array} Array of pole marker meshes
 */
export function createPoleMarkers(scene) {
  const poleMarkers = [];
  
  // North pole cap
  const northCapGeometry = new THREE.CircleGeometry(WORLD_CONFIG.globeRadius * 0.08, 32);
  const northCapMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x88ccff, 
    transparent: true, 
    opacity: 0.7 
  });
  const northCap = new THREE.Mesh(northCapGeometry, northCapMaterial);
  northCap.position.set(0, WORLD_CONFIG.globeRadius + WORLD_CONFIG.gridHeightOffset, 0);
  northCap.lookAt(0, WORLD_CONFIG.globeRadius + 1, 0);
  scene.add(northCap);
  poleMarkers.push(northCap);
  
  // South pole cap
  const southCapGeometry = new THREE.CircleGeometry(WORLD_CONFIG.globeRadius * 0.08, 32);
  const southCapMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff8888, 
    transparent: true, 
    opacity: 0.7 
  });
  const southCap = new THREE.Mesh(southCapGeometry, southCapMaterial);
  southCap.position.set(0, -WORLD_CONFIG.globeRadius - WORLD_CONFIG.gridHeightOffset, 0);
  southCap.lookAt(0, -WORLD_CONFIG.globeRadius - 1, 0);
  scene.add(southCap);
  poleMarkers.push(southCap);
  
  return poleMarkers;
}

/**
 * Create mouse and raycaster for interaction
 * @returns {object} Mouse and raycaster objects
 */
export function createInteractionObjects() {
  return {
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster()
  };
}

/**
 * Handle window resize
 * @param {THREE.Camera} camera - Camera to update
 * @param {THREE.WebGLRenderer} renderer - Renderer to update
 */
export function handleWindowResize(camera, renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Initialize complete Three.js scene with all components
 * @returns {object} Object containing all scene components
 */
export function initializeThreeJS() {
  console.log('🎬 Initializing Three.js scene...');
  
  // Create core components
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer();
  const lights = createLighting(scene);
  const interaction = createInteractionObjects();
  
  // Create world objects
  const globe = createGlobe();
  scene.add(globe);
  
  const poleMarkers = createPoleMarkers(scene);
  
  // Set up window resize handler
  window.addEventListener('resize', () => {
    handleWindowResize(camera, renderer);
  });
  
  console.log('✅ Three.js scene initialized successfully');
  
  return {
    scene,
    camera,
    renderer,
    lights,
    globe,
    poleMarkers,
    mouse: interaction.mouse,
    raycaster: interaction.raycaster
  };
}

/**
 * Animation loop setup
 * @param {THREE.Scene} scene - Scene to render
 * @param {THREE.Camera} camera - Camera for rendering
 * @param {THREE.WebGLRenderer} renderer - Renderer
 * @param {Function} updateCallback - Optional callback for updates
 */
export function startAnimationLoop(scene, camera, renderer, updateCallback = null) {
  function animate() {
    requestAnimationFrame(animate);
    
    // Call update callback if provided
    if (updateCallback) {
      updateCallback();
    }
    
    // Render the scene
    renderer.render(scene, camera);
  }
  
  animate();
  console.log('🎬 Animation loop started');
}