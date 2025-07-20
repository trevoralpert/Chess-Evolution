# EvoChess Complete Piece Movement & Special Ability Logic

## Table of Contents
1. [All Pieces by Point Value](#all-pieces-by-point-value)
2. [Special Abilities](#special-abilities)
3. [Movement-Based Evolution Bonuses](#movement-based-evolution-bonuses)
4. [Battle & Capture Rules](#battle--capture-rules)
5. [Implementation Notes](#implementation-notes)

---

## All Pieces by Point Value

### Pawn (1 point)
- **Movement**: One square forward toward opposite pole
- **Attack**: Diagonal forward (can change latitude lines)
- **Cannot**: Move backward or capture forward
- **Special**: 
  - Gains +1 evolution point after 9 moves (equator crossing)
  - Gains +8 evolution points after 18 moves (pole conquered)
  - Can evolve into any piece worth ≤ their evolution points

### Splitter (2 points)
- **Movement**: Enhanced pawn - can move forward like pawn
- **Attack**: Diagonal attacks like pawn
- **Split Ability**: 
  - Can split sideways (left/right) onto empty squares OR enemy pieces
  - Creates identical copy of itself
  - 1-turn cooldown between splits
  - Split pieces inherit parent's evolution points
- **Special**:
  - Gains +8 points when reaching opposite pole (row 0 or 19)

### King (3 points)
- **Movement**: One square in any direction (omnidirectional)
- **Special at Poles**: Can move to ANY column at the adjacent row (360° movement)
- **Special**: 
  - Game ends if captured (checkmate)
  - Cannot evolve
  - Wins all battles when attacking
  - Does not gain evolution points when capturing (Kings don't hold evolution points)

### Bishop (3 points)
- **Movement**: Unlimited diagonal movement
- **Evolution**: Can evolve with sufficient points

### Knight (3 points)
- **Movement**: L-shaped pattern (2+1 squares)
- **Special**: Can jump over other pieces
- **Evolution**: Can evolve with sufficient points

### Vaultbound (4 points)
- **Movement**: 2x3 L-shaped jumps (like knight)
- **Jump Area**: Rectangle between start and landing position
- **Capture Mechanism**:
  - Does NOT capture by landing
  - Player selects 1 enemy piece from the 2x3 jump area
  - Selected piece is captured
- **Landing**: CANNOT land on occupied squares

### Rook (5 points)
- **Movement**: Unlimited horizontal/vertical movement
- **Evolution**: Can evolve with sufficient points

### Vaultseer (7 points)
- **Movement**: Identical to Vaultbound (2x3 L-shape)
- **Capture**: Player selects up to 2 enemy pieces from jump area
- **Landing**: CANNOT land on occupied squares

### Queen (9 points)
- **Movement**: Unlimited movement in all 8 directions (combines Rook + Bishop)
- **Evolution**: Can evolve with sufficient points

### Vaultarcher (9 points)
- **Movement**: Identical to Vaultbound/Vaultseer
- **Capture**: Player selects up to 3 enemy pieces from jump area
- **Landing**: CANNOT land on occupied squares

### Vaultmistress (10 points)
- **Movement**: Same 2x3 L-shape pattern
- **Capture**: 
  - Player selects up to 3 pieces from jump area
  - CAN land on enemy pieces (automatic capture)
  - Maximum: 4 captures (3 selected + 1 landing)
- **Special**: Can produce heir (once per piece)

### Covenant Queen (12 points)
- **Dual Movement**:
  - Queen Mode: Standard queen movement
  - Vault Mode: 2x3 L-shaped jumps
- **Vault Capture**:
  - Automatically captures ALL enemy pieces in jump area
  - Plus landing square if enemy
  - Maximum: 7 captures (6 in area + 1 landing)
- **Special**: 
  - Can produce heir (once per piece)
  - Note: If evolved from an heir-producing Vaultmistress, it still retains the ability to produce its own heir (not disqualified)

---

## Special Abilities

### Heir Production (Vaultmistress & Covenant Queen)
**Setup Phase**:
- Costs one turn (piece doesn't move)
- Marks piece as "heir producer"
- Shows "H" with floating evolution points (e.g., "10H")
- Cannot be done when already in checkmate

**Activation**:
- Triggers automatically when team enters checkmate
- Spawns new King adjacent to heir-producing piece
- Original King disappears
- Does not cost a turn (automatic)

**Spawn Priority**:
1. Adjacent square to heir-producing piece
2. If all adjacent occupied, closest square that:
   - Is not currently in check
   - Is not within attack range of enemy piece
   - Ensures safe spawn for new King

**Limitations**:
- Once per piece lifetime
- Covenant Queen evolved from heir-producing Vaultmistress can still produce one heir

### Multi-Capture Selection UI
**For Vault Pieces**:
1. When vault piece makes valid jump move
2. Highlight all enemy pieces in 2x3 jump area
3. Show selection counter (e.g., "Select up to 3 pieces")
4. Player clicks enemy pieces to select
5. Confirm button to execute captures
6. Timer continues during selection

---

## Movement-Based Evolution Bonuses

### Pawn Move Bonuses
- **9 Moves**: +1 evolution point (Equator Crossed)
- **18 Moves**: +8 evolution points (Pole Conquered)
- **Automatic**: Evolution menu appears after bonus

### Splitter Position Bonus
- **Reaching Opposite Pole**: +8 evolution points
- **Triggers at**: Row 0 or Row 19
- **Automatic**: Evolution menu appears

### Capture Bonuses (All Pieces)
- **Any Capture**: Capturing piece gains evolution points equal to the value of captured piece
- **Example**: Bishop (3) captures Rook (5) → Bishop gains 5 evolution points
- **Exception**: Kings don't gain evolution points when capturing (Kings don't hold evolution points)

---

## Battle & Capture Rules

### Direct Capture
- Attacker always wins (no dice rolls)
- Exception: Simultaneous moves trigger dice battle

### King Special Rules
- Always wins when attacking
- Capture = checkmate = game over for that player
- Cannot gain evolution points from captures

### Check & Checkmate
- **Check**: King under attack, must move to safety
- **Checkmate**: No legal moves to escape check
- **Heir System**: New King spawns if heir was produced

### Evolution During Game
- Right-click any piece to see evolution options
- Can evolve if piece has enough evolution points
- Evolution preserves accumulated points
- Piece type changes but retains move count & bonuses

---

## Implementation Notes

### Jump Area Calculation
For vault pieces, the 2x3 rectangle is determined by:
1. Start position (row1, col1)
2. End position (row2, col2)
3. Rectangle covers all squares between these positions
4. Must handle spherical wrap-around at poles

### UI/UX Considerations
- Highlight valid landing squares
- Show capture area preview on hover
- Display selection UI for multi-capture pieces
- Show evolution points and heir status ("H") clearly
- Timer pauses during evolution choice, not capture selection

### AI Behavior
- Should evaluate multi-capture opportunities
- Consider heir production timing
- Avoid exposing King to checkmate
- Prioritize high-value captures with vault pieces 