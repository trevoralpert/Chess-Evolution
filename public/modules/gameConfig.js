// Game Configuration Module
// Contains all game-related constants, default states, and configuration objects

// Grid and world constants
export const GRID_CONFIG = {
  rows: 20,
  cols: 8
};

export const WORLD_CONFIG = {
  globeRadius: 5,
  pieceHeightOffset: 0.35, // How high pieces float above the globe surface
  gridHeightOffset: 0.05,  // How high the grid sits above the globe
  borderHeightOffset: 0.06 // How high grid borders sit above the grid
};

// Game state template
export const createDefaultGameState = () => ({
  players: {},
  pieces: {},
  gridConfig: { ...GRID_CONFIG }
});

// Timer configuration
export const TIMER_CONFIG = {
  defaultDuration: 7000, // 7 seconds default
  realTimeUpdate: 16.67  // Assume 60 FPS for particle updates
};

// Camera configuration
export const CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  defaultPosition: { x: 0, y: 0, z: 10 }
};

// Renderer configuration
export const RENDERER_CONFIG = {
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  maxParticles: 1000,
  maxCachedModels: 50,
  maxCachedGeometries: 100,
  maxCachedMaterials: 100,
  throttleDelay: 100, // ms
  batchSize: 10 // items processed per frame
};

// Evolution configuration
export const EVOLUTION_CONFIG = {
  defaultBank: {
    points: 0,
    totalEarned: 0
  },
  contextMenuTimeout: 10000 // 10 seconds
};

// Battle configuration
export const BATTLE_CONFIG = {
  defaultIntensity: 1.0,
  lightningDuration: 300,   // ms
  shockwaveDuration: 800,   // ms
  screenShakeDuration: 300, // ms
  explosionParticleCount: 20
};

// Animation configuration
export const ANIMATION_CONFIG = {
  pieceMovementDuration: 1000,    // ms
  evolutionEffectDuration: 1500,  // ms
  spiralEffectDuration: 1500,     // ms
  textTransitionDuration: 2000,   // ms
  fadeTransitionDuration: 500,    // ms
  slideTransitionDuration: 500,   // ms
  scaleTransitionDuration: 300    // ms
};

// UI element IDs for easy reference
export const UI_ELEMENTS = {
  menuScreen: 'menu-screen',
  gameUI: 'ui',
  gameOverScreen: 'game-over-screen',
  timingUI: 'timing-ui',
  playerCount: 'player-count',
  gameInfo: 'game-info',
  status: 'status',
  modeIndicator: 'mode-indicator',
  performanceInfo: 'performance-info',
  contextTimer: 'context-timer'
};

// Socket event names for consistency
export const SOCKET_EVENTS = {
  // Game events
  GAME_STATE: 'game-state',
  GAME_OVER: 'game-over',
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  
  // Movement events
  MOVE_PIECE: 'move-piece',
  VALID_MOVES: 'valid-moves',
  PIECE_MOVED: 'piece-moved',
  
  // Evolution events
  EVOLUTION_CHOICE: 'evolution-choice',
  EVOLUTION_COMPLETED: 'evolution-completed',
  EVOLUTION_BANK_UPDATE: 'evolution-bank-update',
  
  // Battle events
  BATTLE_CONTEST: 'battle-contest',
  BATTLE_RESULT: 'battle-result',
  
  // Timer events
  TIMER_START: 'timer-start',
  TIMER_UPDATE: 'timer-update',
  TIMER_PAUSE: 'timer-pause',
  TIMER_RESUME: 'timer-resume',
  
  // Chat events
  CHAT_MESSAGE: 'chat-message',
  CHAT_HISTORY: 'chat-history',
  
  // Tournament events
  TOURNAMENT_JOINED: 'tournament-joined',
  TOURNAMENT_STARTED: 'tournament-started',
  TOURNAMENT_ENDED: 'tournament-ended',
  
  // Lobby events
  LOBBY_LIST: 'lobby-list',
  LOBBY_CREATED: 'lobby-created',
  LOBBY_JOINED: 'lobby-joined',
  
  // Statistics events
  STATS_UPDATE: 'stats-update',
  LEADERBOARD_UPDATE: 'leaderboard-update'
};

// Game mode constants
export const GAME_MODES = {
  QUICKPLAY: 'quickplay',
  VS_AI: 'vs-ai',
  MULTIPLAYER: 'multiplayer',
  TOURNAMENT: 'tournament',
  SPECTATOR: 'spectator'
};

// Player state constants
export const PLAYER_STATES = {
  WAITING: 'waiting',
  READY: 'ready',
  PLAYING: 'playing',
  SPECTATING: 'spectating',
  DISCONNECTED: 'disconnected'
};

// Piece type constants (matching server)
export const PIECE_TYPES = {
  // Base pieces
  KING: 'KING',
  QUEEN: 'QUEEN',
  ROOK: 'ROOK',
  KNIGHT: 'KNIGHT',
  BISHOP: 'BISHOP',
  PAWN: 'PAWN',
  
  // Special pieces
  SPLITTER: 'SPLITTER',
  JUMPER: 'JUMPER',
  SUPER_JUMPER: 'SUPER_JUMPER',
  HYPER_JUMPER: 'HYPER_JUMPER',
  MISTRESS_JUMPER: 'MISTRESS_JUMPER',
  HYBRID_QUEEN: 'HYBRID_QUEEN'
};

// Movement mode constants
export const MOVEMENT_MODES = {
  NORMAL: 'normal',
  JUMP: 'jump',
  SPLIT: 'split'
};

// Validation helpers
export const isValidGridPosition = (row, col) => {
  return row >= 0 && row < GRID_CONFIG.rows && 
         col >= 0 && col < GRID_CONFIG.cols;
};

export const isValidPieceType = (type) => {
  return Object.values(PIECE_TYPES).includes(type);
};

export const isValidGameMode = (mode) => {
  return Object.values(GAME_MODES).includes(mode);
};

// Default configurations for easy access
export const DEFAULTS = {
  gameState: createDefaultGameState(),
  evolutionBank: { ...EVOLUTION_CONFIG.defaultBank },
  aiStats: {},
  mouseStartPos: { x: 0, y: 0 },
  touchStartPos: { x: 0, y: 0 }
};