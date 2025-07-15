// Globe Chess Piece Type Definitions
// Based on the evolution chart: 1-12 point values with evolution paths

const PIECE_TYPES = {
  // Starting pieces
  PAWN: {
    symbol: '♟',
    name: 'Pawn',
    points: 1,
    description: 'Basic piece that can move forward and attack diagonally',
    evolutionPath: ['SPLITTER'],
    movementPattern: 'pawn',
    color: '#8B4513'
  },
  
  KING: {
    symbol: '♔',
    name: 'King',
    points: 3,
    description: 'Must be protected - game ends when captured',
    evolutionPath: [], // Kings don't evolve
    movementPattern: 'king',
    color: '#FFD700'
  },
  
  // Traditional chess pieces with correct values from piecevalues.py
  BISHOP: {
    symbol: '♗',
    name: 'Bishop',
    points: 3,
    description: 'Moves diagonally across the board',
    evolutionPath: ['4-POINT_BISHOP'],
    movementPattern: 'bishop',
    color: '#8A2BE2'
  },
  
  KNIGHT: {
    symbol: '♘',
    name: 'Knight',
    points: 3,
    description: 'Moves in an L-shape and can jump over pieces',
    evolutionPath: ['4-POINT_KNIGHT'],
    movementPattern: 'knight',
    color: '#32CD32'
  },
  
  ROOK: {
    symbol: '♖',
    name: 'Rook',
    points: 5,
    description: 'Moves horizontally and vertically',
    evolutionPath: ['6-POINT_ROOK'],
    movementPattern: 'rook',
    color: '#CD853F'
  },
  
  QUEEN: {
    symbol: '♕',
    name: 'Queen',
    points: 9,
    description: 'Most powerful piece - moves like bishop and rook combined',
    evolutionPath: ['10-POINT_QUEEN'],
    movementPattern: 'queen',
    color: '#FF1493'
  },
  
  // Evolution Level 1
  SPLITTER: {
    symbol: '⧨',
    name: 'Splitter',
    points: 2,
    description: 'Can split into two pieces when attacking',
    evolutionPath: ['JUMPER'],
    movementPattern: 'splitter',
    color: '#FF6B6B'
  },
  
  // Evolution Level 2
  JUMPER: {
    symbol: '⤴',
    name: 'Jumper',
    points: 4,
    description: 'Can jump over other pieces',
    evolutionPath: ['SUPER_JUMPER'],
    movementPattern: 'jumper',
    color: '#4ECDC4'
  },
  
  // Evolution Level 3
  SUPER_JUMPER: {
    symbol: '⤵',
    name: 'Super Jumper',
    points: 7,
    description: 'Enhanced jumping abilities across greater distances',
    evolutionPath: ['HYPER_JUMPER'],
    movementPattern: 'superJumper',
    color: '#45B7D1'
  },
  
  // Evolution Level 4
  HYPER_JUMPER: {
    symbol: '⟐',
    name: 'Hyper Jumper',
    points: 9,
    description: 'Can jump in complex patterns around the sphere',
    evolutionPath: ['MISTRESS_JUMPER'],
    movementPattern: 'hyperJumper',
    color: '#9B59B6'
  },
  
  // Evolution Level 5
  MISTRESS_JUMPER: {
    symbol: '⟡',
    name: 'Mistress Jumper',
    points: 10,
    description: 'Master of jumping with special abilities',
    evolutionPath: ['HYBRID_QUEEN'],
    movementPattern: 'mistressJumper',
    color: '#E74C3C'
  },
  
  // Evolution Level 6 (Maximum)
  HYBRID_QUEEN: {
    symbol: '♕',
    name: 'Hybrid Queen',
    points: 12,
    description: 'Ultimate evolved piece with queen-like powers',
    evolutionPath: [], // Maximum evolution
    movementPattern: 'hybridQueen',
    color: '#F39C12'
  }
};

// Movement patterns for each piece type
const MOVEMENT_PATTERNS = {
  pawn: {
    type: 'directional',
    directions: [
      { row: 1, col: 0 }, // Forward (outward from pole on spherical board)
    ],
    attackDirections: [
      { row: 1, col: 0 }, // Same as move direction - can attack straight outward too
    ],
    maxDistance: 1,
    jumpOver: false
  },
  
  king: {
    type: 'omnidirectional',
    directions: [
      // For spherical geometry, king can move to adjacent squares in all directions
      // but not backwards off the board (no row -1 when at pole)
      { row: 0, col: -1 }, { row: 0, col: 1 },  // Lateral movement around the pole
      { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }  // Forward movement from pole
    ],
    maxDistance: 1,
    jumpOver: false
  },
  
  // Traditional chess piece movement patterns
  bishop: {
    type: 'diagonal',
    directions: [
      { row: -1, col: -1 }, { row: -1, col: 1 },
      { row: 1, col: -1 },  { row: 1, col: 1 }
    ],
    maxDistance: 8,
    jumpOver: false
  },
  
  knight: {
    type: 'knight_move',
    directions: [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 },  { row: 1, col: 2 },
      { row: 2, col: -1 },  { row: 2, col: 1 }
    ],
    maxDistance: 1,
    jumpOver: true
  },
  
  rook: {
    type: 'orthogonal',
    directions: [
      { row: -1, col: 0 }, { row: 1, col: 0 },
      { row: 0, col: -1 }, { row: 0, col: 1 }
    ],
    maxDistance: 8,
    jumpOver: false
  },
  
  queen: {
    type: 'omnidirectional',
    directions: [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 },                        { row: 0, col: 1 },
      { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
    ],
    maxDistance: 8,
    jumpOver: false
  },
  
  splitter: {
    type: 'enhanced_pawn',
    directions: [
      { row: -1, col: 0 }, // Forward
      { row: 0, col: -1 }, // Left
      { row: 0, col: 1 }   // Right
    ],
    attackDirections: [
      { row: -1, col: -1 }, { row: -1, col: 1 },
      { row: 0, col: -1 },  { row: 0, col: 1 }
    ],
    maxDistance: 1,
    jumpOver: false,
    specialAbility: 'split' // Can create a copy when attacking
  },
  
  jumper: {
    type: 'knight_like',
    directions: [
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 },  { row: 1, col: 2 },
      { row: 2, col: -1 },  { row: 2, col: 1 }
    ],
    maxDistance: 1,
    jumpOver: true
  },
  
  superJumper: {
    type: 'enhanced_knight',
    directions: [
      // Standard knight moves
      { row: -2, col: -1 }, { row: -2, col: 1 },
      { row: -1, col: -2 }, { row: -1, col: 2 },
      { row: 1, col: -2 },  { row: 1, col: 2 },
      { row: 2, col: -1 },  { row: 2, col: 1 },
      // Extended jumps
      { row: -3, col: -1 }, { row: -3, col: 1 },
      { row: -1, col: -3 }, { row: -1, col: 3 },
      { row: 1, col: -3 },  { row: 1, col: 3 },
      { row: 3, col: -1 },  { row: 3, col: 1 }
    ],
    maxDistance: 1,
    jumpOver: true
  },
  
  hyperJumper: {
    type: 'sphere_jumper',
    directions: [], // Calculated dynamically based on sphere geometry
    maxDistance: 3,
    jumpOver: true,
    specialAbility: 'sphere_wrap' // Can wrap around sphere
  },
  
  mistressJumper: {
    type: 'master_jumper',
    directions: [], // Calculated dynamically
    maxDistance: 4,
    jumpOver: true,
    specialAbility: 'teleport' // Can teleport to any empty square
  },
  
  hybridQueen: {
    type: 'queen_like',
    directions: [
      { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
      { row: 0, col: -1 },                        { row: 0, col: 1 },
      { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 }
    ],
    maxDistance: 8, // Can move across significant distances
    jumpOver: false,
    specialAbility: 'evolution_boost' // Can help other pieces evolve
  }
};

// Evolution requirements
const EVOLUTION_REQUIREMENTS = {
  kills: {
    PAWN: 1,        // Pawn needs 1 kill to become Splitter
    SPLITTER: 2,    // Splitter needs 2 kills to become Jumper
    JUMPER: 3,      // Jumper needs 3 kills to become Super Jumper
    SUPER_JUMPER: 4, // Super Jumper needs 4 kills to become Hyper Jumper
    HYPER_JUMPER: 5, // Hyper Jumper needs 5 kills to become Mistress Jumper
    MISTRESS_JUMPER: 6, // Mistress Jumper needs 6 kills to become Hybrid Queen
    // Traditional chess pieces
    BISHOP: 1,      // Bishop needs 1 kill to become 4-point Bishop
    KNIGHT: 1,      // Knight needs 1 kill to become 4-point Knight
    ROOK: 1,        // Rook needs 1 kill to become 6-point Rook
    QUEEN: 1        // Queen needs 1 kill to become 10-point Queen
  },
  
  // Alternative evolution paths (future feature)
  timeAlive: {
    PAWN: 300,      // 5 minutes
    SPLITTER: 420,  // 7 minutes
    JUMPER: 600,    // 10 minutes
    SUPER_JUMPER: 900,  // 15 minutes
    HYPER_JUMPER: 1200, // 20 minutes
    MISTRESS_JUMPER: 1800, // 30 minutes
    // Traditional chess pieces
    BISHOP: 240,    // 4 minutes
    KNIGHT: 240,    // 4 minutes
    ROOK: 360,      // 6 minutes
    QUEEN: 480      // 8 minutes
  }
};

// Battle system with contest mechanics
function shouldTriggerContest(attackerPiece, defenderPiece) {
  // King wins all battles when attacking
  if (attackerPiece.type === 'KING') {
    return false; // No contest needed, King always wins when attacking
  }
  
  const attackerPoints = PIECE_TYPES[attackerPiece.type].points;
  const defenderPoints = PIECE_TYPES[defenderPiece.type].points;
  
  // Contest triggered when lower value attacks higher value
  return attackerPoints < defenderPoints;
}

function getContestTimeLimit(attackerPiece, defenderPiece) {
  const attackerPoints = PIECE_TYPES[attackerPiece.type].points;
  const defenderPoints = PIECE_TYPES[defenderPiece.type].points;
  const difference = defenderPoints - attackerPoints;
  
  // More time for bigger difference (max 10 seconds, min 2 seconds)
  return Math.min(10, Math.max(2, difference));
}

function rollDice(numDice) {
  const dice = [];
  for (let i = 0; i < numDice; i++) {
    dice.push(Math.floor(Math.random() * 6) + 1); // 1-6 dice
  }
  return dice.sort((a, b) => b - a); // Sort highest to lowest
}

function resolveDiceBattle(attackerPiece, defenderPiece) {
  const attackerPoints = PIECE_TYPES[attackerPiece.type].points;
  const defenderPoints = PIECE_TYPES[defenderPiece.type].points;
  
  let attackerDice = rollDice(attackerPoints);
  let defenderDice = rollDice(defenderPoints);
  
  const battleLog = {
    attackerDice,
    defenderDice,
    rounds: []
  };
  
  // Compare highest dice first
  let attackerHigh = attackerDice[0];
  let defenderHigh = defenderDice[0];
  
  while (attackerHigh === defenderHigh) {
    // Tie - roll one die each until someone wins
    const attackerTieBreaker = rollDice(1)[0];
    const defenderTieBreaker = rollDice(1)[0];
    
    battleLog.rounds.push({
      attacker: attackerTieBreaker,
      defender: defenderTieBreaker,
      result: attackerTieBreaker === defenderTieBreaker ? 'tie' : 'resolved'
    });
    
    attackerHigh = attackerTieBreaker;
    defenderHigh = defenderTieBreaker;
  }
  
  const winner = attackerHigh > defenderHigh ? attackerPiece : defenderPiece;
  const loser = winner === attackerPiece ? defenderPiece : attackerPiece;
  
  return { winner, loser, battleLog };
}

function resolveBattle(attackerPiece, defenderPiece) {
  // King wins all battles when attacking
  if (attackerPiece.type === 'KING') {
    return { winner: attackerPiece, loser: defenderPiece, battleType: 'king_attack' };
  }
  
  const attackerPoints = PIECE_TYPES[attackerPiece.type].points;
  const defenderPoints = PIECE_TYPES[defenderPiece.type].points;
  
  if (attackerPoints > defenderPoints) {
    return { winner: attackerPiece, loser: defenderPiece, battleType: 'automatic' };
  } else if (defenderPoints > attackerPoints) {
    return { winner: defenderPiece, loser: attackerPiece, battleType: 'automatic' };
  } else {
    // Equal values - use dice system
    return resolveDiceBattle(attackerPiece, defenderPiece);
  }
}

// Check if a piece can evolve
function canEvolve(piece) {
  const pieceType = PIECE_TYPES[piece.type];
  if (!pieceType || pieceType.evolutionPath.length === 0) {
    return false;
  }
  
  const killsRequired = EVOLUTION_REQUIREMENTS.kills[piece.type];
  return piece.kills >= killsRequired;
}

// Evolve a piece to its next form
function evolvePiece(piece) {
  const pieceType = PIECE_TYPES[piece.type];
  if (!canEvolve(piece)) {
    return piece;
  }
  
  const nextType = pieceType.evolutionPath[0];
  return {
    ...piece,
    type: nextType,
    symbol: PIECE_TYPES[nextType].symbol,
    kills: 0 // Reset kill count after evolution
  };
}

module.exports = {
  PIECE_TYPES,
  MOVEMENT_PATTERNS,
  EVOLUTION_REQUIREMENTS,
  resolveBattle,
  resolveDiceBattle,
  shouldTriggerContest,
  getContestTimeLimit,
  canEvolve,
  evolvePiece
}; 