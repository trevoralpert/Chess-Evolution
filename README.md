# 🌍 EvoChess

> **Revolutionary 3D spherical chess with evolutionary mechanics and real-time multiplayer**

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r155-blue.svg)](https://threejs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.0-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🎯 What Makes EvoChess Unique

EvoChess reimagines chess for the modern era by breaking fundamental constraints through innovative gameplay and AI-powered development:

### 1. 🌐 **Spherical Board** 
- Play on a 20×8 globe grid (160 positions) instead of a flat 8×8 board
- **No edges or corners** - longitude wraps around seamlessly
- **Polar dynamics** - North and South poles become strategic strongholds
- **True 3D gameplay** - Rotate the globe to view from any angle

### 2. 🧬 **Evolving Pieces**
- Pieces gain **evolution points** through combat and achievements
- **15+ evolution paths** - Transform pawns into powerful variants
- **Strategic banking** - Save points for major upgrades
- **Time-based evolution** - Some evolutions require survival time

### 3. ♟️ **Original Pieces with New Logic**
- **Vaultbound Family**: Pieces that capture by vaulting over enemies
  - Vaultbound → Vaultseer → Vaultarcher → Vaultmistress
- **Splitter**: Can divide into two weaker pieces
- **Covenant Queen**: Ultimate evolution combining Queen + Vaultbound abilities
- **Circumnavigation bonus**: +8 points for reaching the opposite pole

### 4. 🎨 **Custom 3D Assets**
- **Original 3D models** generated using [Meshy.ai](https://www.meshy.ai/)
- **Unique visual identity** - Every piece has a distinctive, professional design
- **AI-powered asset creation** - Demonstrating innovation in both gameplay and development

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- Modern web browser with WebGL support
- 2GB RAM minimum

### Installation

```bash
# Clone the repository
git clone https://github.com/trevoralpert/Chess-Evolution.git
cd Chess-Evolution

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# OR start production server
npm start

# Open in browser
http://localhost:3000
```

### Playing the Game

1. **Main Menu**
   - Enter your name (auto-generated if left blank)
   - Choose a game mode:
     - **Quick Play** - Start immediately vs AI
     - **VS AI** - Play against computer opponent
     - **Create Game** - Host a multiplayer game
     - **Join Game** - Join an existing game

2. **Game Controls**
   - **Left Click** - Select and move pieces
   - **Right Click** - Open evolution menu (when points available)
   - **Mouse Drag** - Rotate the 3D globe
   - **Scroll** - Zoom in/out

3. **Evolution System**
   - Capture pieces to gain their point value
   - Pawns gain +1 point at equator (9 moves)
   - Pawns gain +8 points for circumnavigation (18 moves)
   - Right-click any piece to evolve when you have enough points

## 🛠️ Tech Stack

### Backend
- **[Node.js](https://nodejs.org/)** - JavaScript runtime
- **[Express](https://expressjs.com/)** - Web application framework
- **[Socket.io](https://socket.io/)** - Real-time bidirectional communication
- **Custom Game Engine** - Handles game logic, timing, and state management

### Frontend
- **[Three.js](https://threejs.org/)** - 3D graphics library for WebGL
- **Vanilla JavaScript** - No framework dependencies for maximum performance
- **[GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader)** - Loads professional 3D models
- **WebGL** - Hardware-accelerated 3D rendering

### Asset Creation
- **[Meshy.ai](https://www.meshy.ai/)** - AI-powered 3D model generation for all custom pieces
- **GLB Format** - Optimized 3D models with textures and materials

### Architecture
- **Real-time Multiplayer** - WebSocket-based with delta updates
- **Modular System Design** - Separate managers for timing, evolution, battles
- **Event-driven Architecture** - Decoupled components via Socket.io events
- **Performance Optimized** - Object pooling, frustum culling, instanced rendering

## 🎮 How to Play

### Basic Controls
- **Left Click** - Select piece and move
- **Right Click** - Open evolution menu
- **Drag** - Rotate the globe
- **Scroll** - Zoom in/out

### Core Mechanics
1. **Real-time Movement** - 7-second cooldown after each move (no turns!)
2. **Battle System** - Higher value pieces win, but underdogs can contest with dice
3. **Evolution Points** - Earn through combat, use to transform pieces
4. **Victory** - Capture the enemy King or be the last player standing

## 📁 Project Structure

```
Chess-Evolution/
├── server/                    # Backend Node.js application
│   ├── index.js              # Main server & Socket.io setup
│   ├── gameConfig.js         # Game configuration & grid utilities
│   ├── pieceTypes.js         # Piece definitions & battle logic
│   ├── evolutionManager.js   # Evolution system & banking
│   ├── timingManager.js      # Real-time move system
│   ├── aiManager.js          # AI opponent logic
│   └── ...                   # Other game systems
├── public/                   # Frontend assets
│   ├── index.html           # Main game interface
│   ├── main.js              # Client game logic
│   ├── main-simple.js       # Simplified renderer
│   ├── battleSystem.js      # Battle animations
│   └── utils/               # Utility functions
├── chess piece models/       # 3D GLB models
│   └── Final pieces/        # Production-ready models
├── data/                    # Game statistics
├── localdocs/              # Development documentation
└── package.json            # Dependencies
```

## 🌟 Key Features

### Multiplayer Systems
- **Up to 8 players** simultaneously
- **Lobby System** - Create/join custom games
- **Tournament Mode** - Single elimination brackets
- **Spectator Mode** - Watch live games
- **Replay System** - Record and playback games

### Game Modes
- **Standard** - Classic EvoChess experience
- **Blitz** - 1-3 second move timers
- **Custom** - Adjustable rules and evolution rates

### AI Opponents
- **4 Difficulty Levels** - Easy, Medium, Hard, Expert
- **Distinct Personalities** - Aggressive, Defensive, Balanced, Evolution-focused
- **Dynamic Addition** - Add/remove AI players anytime

### Progression Systems
- **Statistics Tracking** - Win rate, favorite pieces, battle stats
- **Achievements** - Unlock rewards for special accomplishments
- **Leaderboards** - Global and seasonal rankings

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests (when implemented)
```

### Core Systems Overview

1. **Grid System** (`gameConfig.js`)
   - 20×8 spherical grid mapping
   - Longitude wraparound logic
   - Distance calculations on sphere

2. **Real-time System** (`timingManager.js`)
   - Individual player cooldowns
   - Move queuing and validation
   - Collision detection (500ms window)

3. **Evolution System** (`evolutionManager.js`)
   - Point banking and spending
   - Evolution path validation
   - Time-alive tracking

4. **Battle System** (`pieceTypes.js`)
   - Point-based resolution
   - Contest mechanics
   - Dice roll calculations

## 🏆 Current Status (July 2025)

### ✅ Completed Features
- **Core Gameplay** - Full chess mechanics on spherical board
- **Evolution System** - 15+ pieces with point-based evolution
- **Vault Pieces** - Complete implementation with multi-capture UI
- **Heir System** - Vaultmistress & Covenant Queen can produce heirs
- **Multiplayer** - Real-time sync with Socket.io
- **AI Players** - Three difficulty levels
- **Visual Polish** - Professional UI with smooth transitions
- **Move-Based Bonuses** - Equator & circumnavigation rewards
- **Splitter Mechanics** - Unlimited splitting with proper inheritance
- **Right-Click Evolution** - Context menu with all available paths

### 🚧 In Development
- Mobile responsive design
- Tournament mode UI
- Spectator mode UI
- Additional piece evolutions
- Sound effects and music

### 📈 Performance
- Stable with 2-4 players
- 60 FPS on modern hardware
- Low network latency design
- Optimized 3D rendering

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use ES6+ features
- Follow existing patterns
- Comment complex logic
- Test thoroughly

## 📊 Performance

### Current Optimizations
- Geometry instancing for pieces
- Frustum culling for off-screen objects
- Delta compression for network updates
- Cached materials and textures

### System Requirements
- **Minimum**: 2GB RAM, WebGL-capable browser
- **Recommended**: 4GB RAM, dedicated graphics
- **Network**: Stable broadband connection

## 🐛 Known Issues

- Mobile support is in development
- Performance may degrade with 8 players on older systems
- Some browsers may have WebGL compatibility issues

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built during **G2P5 Game Week** - proving AI-augmented development
- **[Meshy.ai](https://www.meshy.ai/)** for AI-powered 3D model generation
- Three.js community for excellent documentation
- Socket.io team for real-time infrastructure
- All contributors and playtesters

## 📞 Contact & Links

- **GitHub**: [https://github.com/trevoralpert/Chess-Evolution](https://github.com/trevoralpert/Chess-Evolution)
- **Discord**: Coming soon
- **Website**: Coming soon

---

**Welcome to the sphere. Your evolution awaits.** 🌍♟️