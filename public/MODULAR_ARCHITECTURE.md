# Modular Architecture Documentation

## Overview

The `main-simple.js` file has been refactored from a single 7000+ line file into a modular architecture with separate, focused modules. This improves maintainability, reduces context overload, and makes it easier to work on specific functionality without affecting other parts of the system.

## Architecture

### Core Files

- **`main-simple-modular.js`** - Main orchestrator that imports and coordinates all modules
- **`main-simple.js`** - Original monolithic file (preserved for reference)

### Module Structure

```
public/modules/
├── gameInitialization.js    # Menu system and game startup
├── socketManager.js         # Socket.io communication
├── sceneManager.js          # 3D scene setup and management
├── gameStateManager.js      # Game state and logic management
├── mouseInteraction.js      # Mouse/touch input handling
└── pieceMeshManager.js      # 3D piece rendering and models
```

## Module Responsibilities

### 1. GameInitialization (`gameInitialization.js`)
- **Purpose**: Handles menu system, game startup, and overall game flow
- **Key Features**:
  - GLTF loader initialization
  - Menu system setup and event handling
  - Color picker functionality
  - Game mode selection (vs AI, multiplayer, etc.)
  - Game over screen management
  - Return to menu functionality

### 2. SocketManager (`socketManager.js`)
- **Purpose**: Manages all Socket.io communication with the server
- **Key Features**:
  - Socket connection management
  - Event listener setup for all server events
  - Converts socket events to DOM events for other modules
  - Handles game state updates, moves, battles, evolution, etc.
  - Provides utility methods for emitting events

### 3. SceneManager (`sceneManager.js`)
- **Purpose**: Manages the 3D scene, camera, renderer, and lighting
- **Key Features**:
  - Three.js scene setup and initialization
  - Camera and renderer configuration
  - Lighting system setup
  - Globe and grid creation
  - Manual camera controls
  - Animation loop management
  - Window resize handling

### 4. GameStateManager (`gameStateManager.js`)
- **Purpose**: Manages game state, piece tracking, and game logic
- **Key Features**:
  - Game state synchronization with server
  - Performance optimization with delta updates
  - Piece selection and move validation
  - UI updates based on game state
  - Player and turn management
  - Evolution point tracking

### 5. MouseInteraction (`mouseInteraction.js`)
- **Purpose**: Handles all mouse and touch input for game interaction
- **Key Features**:
  - Mouse and touch event handling
  - Raycasting for piece and grid selection
  - Piece selection and movement logic
  - Move validation and execution
  - Support for special moves (splitting, hybrid movement)
  - Drag detection and click processing

### 6. PieceMeshManager (`pieceMeshManager.js`)
- **Purpose**: Manages 3D piece meshes, models, and visual representations
- **Key Features**:
  - 3D model loading and caching
  - Geometric piece fallbacks
  - Piece mesh creation and updates
  - Color application and management
  - Evolution point labels
  - Model scaling and positioning
  - Resource cleanup and disposal

## Inter-Module Communication

Modules communicate through a combination of:

1. **DOM Events**: Custom events dispatched on `document` for loose coupling
2. **Global References**: Modules are accessible via `window` for direct access when needed
3. **Event-Driven Architecture**: Most communication is event-based to maintain separation

### Key Events

- `gameStart` - Triggered when a game begins
- `gameStateUpdate` - Game state changes from server
- `selectPiece` / `deselectPiece` - Piece selection changes
- `validMovesReceived` - Valid moves for selected piece
- `moveResult` - Result of move attempt
- `pieceEvolution` - Piece evolution events
- `socketConnected` / `socketDisconnected` - Connection status
- `showNotification` - Display user notifications

## Migration Benefits

### Before (Monolithic)
- ❌ Single 7000+ line file
- ❌ All functionality mixed together
- ❌ Difficult to maintain and debug
- ❌ High context switching overhead
- ❌ Risk of unintended side effects

### After (Modular)
- ✅ Focused modules with single responsibilities
- ✅ Easier to understand and maintain each module
- ✅ Reduced context overload
- ✅ Better separation of concerns
- ✅ Easier testing and debugging
- ✅ Improved code reusability

## Usage

### Switching to Modular Architecture

1. **Update HTML**: Change the script import in your HTML file:
   ```html
   <!-- Replace this -->
   <script src="main-simple.js"></script>
   
   <!-- With this -->
   <script type="module" src="main-simple-modular.js"></script>
   ```

2. **Module Loading**: The modular version automatically loads all required modules

3. **Backwards Compatibility**: The original `main-simple.js` is preserved for reference

### Adding New Functionality

1. **Identify the appropriate module** based on functionality
2. **Add methods to the relevant module class**
3. **Use DOM events for inter-module communication**
4. **Update the main file if new modules are needed**

### Creating New Modules

1. Create a new `.js` file in the `modules/` directory
2. Export a class with `initialize()` method
3. Import and initialize in `main-simple-modular.js`
4. Set up event listeners for communication

## Future Improvements

### Potential Additional Modules
- **TimerManager** - Game timing and turn management
- **EvolutionManager** - Evolution system and dialogs
- **UIManager** - UI state and component management
- **EffectsManager** - Visual effects and animations
- **LobbyManager** - Multiplayer lobby system
- **TournamentManager** - Tournament functionality
- **StatisticsManager** - Player stats and leaderboards
- **ChatManager** - In-game chat system

### Performance Optimizations
- Lazy loading of non-critical modules
- Module-level performance profiling
- Memory usage optimization per module
- Asset preloading strategies

### Testing Strategy
- Unit tests for individual modules
- Integration tests for module communication
- End-to-end tests for complete game flow
- Performance benchmarking

## Troubleshooting

### Common Issues

1. **Module Loading Errors**: Ensure all import paths are correct and files exist
2. **Event Communication**: Check that events are properly dispatched and listened to
3. **Global References**: Verify that modules are properly attached to `window`
4. **Initialization Order**: Modules must be initialized in the correct sequence

### Debugging Tips

1. **Console Logs**: Each module logs its initialization status
2. **Event Monitoring**: Use browser dev tools to monitor custom events
3. **Module State**: Access module instances via `window` for debugging
4. **Performance Profiling**: Use browser tools to profile individual modules

## Conclusion

The modular architecture significantly improves the maintainability and scalability of the chess game codebase. Each module has a clear responsibility and can be developed, tested, and debugged independently while maintaining the overall game functionality.