# 🌍 BrainLift: Multiplayer Globe Chess

> **Revolutionary chess gameplay on a 3D spherical board with evolutionary mechanics and real-time multiplayer action.**

A cutting-edge strategy game that transforms traditional chess into an immersive 3D experience, featuring a spherical playing field, evolutionary piece mechanics, and innovative battle systems. Built with modern web technologies for seamless multiplayer gameplay.

## 🎯 Game Overview

**BrainLift Globe Chess** breaks the conventional rectangular chess board paradigm by placing the game on a 3D sphere. Players command armies of chess pieces that can evolve, battle with dice-based combat, and navigate a wraparound world where tactical thinking meets spatial geometry.

### 🌟 Key Features

- **🌍 3D Spherical Board**: Chess played on a complete sphere with wraparound mechanics
- **⚔️ Dynamic Battle System**: Dice-based combat with strategic contest opportunities
- **🧬 Piece Evolution**: Pieces can evolve through combat and achievements
- **🎮 Real-time Multiplayer**: Support for up to 8 players simultaneously
- **🎭 Professional 3D Models**: Custom GLB models for all piece types
- **⚡ Simultaneous Moves**: Fast-paced gameplay with timed decision-making
- **🏆 Multiple Victory Conditions**: Last-player-standing with territorial influence

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/trevoralpert/Chess-Evolution.git
   cd Chess-Evolution
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

```bash
npm start
```

## 🎮 How to Play

### Basic Controls

- **Click to Select**: Click on your pieces to select them
- **Click to Move**: Click on highlighted squares to move selected pieces
- **Green Highlights**: Valid movement positions
- **Red Highlights**: Attack positions
- **Blue Highlights**: Special ability positions (splitting, jumping)

### Game Mechanics

#### 🏁 Starting Setup
- Each player begins with a **King** and **8 Pawns** in a 3x3 formation
- Players spawn at different polar regions of the sphere
- Initial piece placement adapts to spherical geometry

#### ⚔️ Battle System
- **Automatic Battles**: Higher-value pieces defeat lower-value pieces
- **Contest System**: When lower-value pieces attack higher-value pieces, defenders can choose to contest
- **Dice Battles**: Contested battles resolved with dice rolls (highest single die wins)
- **King Invincibility**: Kings win all battles when attacking

#### 🧬 Evolution Mechanics
- Pieces gain **evolution points** through combat and achievements
- **Circumnavigation Bonus**: Pawns and Splitters gain +8 points for reaching opposite poles
- **Strategic Banking**: Players can save evolution points for major upgrades
- **Evolution Paths**: Each piece type has unique evolution possibilities

#### 🏆 Victory Conditions
- **King Capture**: Eliminate opponents by capturing their Kings
- **Last Standing**: Be the final player remaining
- **Territorial Control**: Dominate the sphere through strategic positioning

## 📋 Piece Types & Evolution

### Starting Pieces

| Piece | Points | Symbol | Description |
|-------|---------|---------|-------------|
| **Pawn** | 1 | ♟ | Forward movement, diagonal attacks |
| **King** | 3 | ♔ | Game-ending piece, omnidirectional movement |

### Traditional Chess Pieces

| Piece | Points | Symbol | Movement |
|-------|---------|---------|----------|
| **Bishop** | 3 | ♗ | Diagonal movement |
| **Knight** | 3 | ♘ | L-shaped movement, can jump |
| **Rook** | 5 | ♖ | Orthogonal movement |
| **Queen** | 9 | ♕ | Omnidirectional movement |

### Evolved Pieces

| Piece | Points | Symbol | Special Abilities |
|-------|---------|---------|------------------|
| **Splitter** | 2 | ◊ | Can split into multiple pieces |
| **Jumper** | 4 | ◈ | Captures by jumping over pieces |
| **Super Jumper** | 6 | ◉ | Multiple captures in sequence |
| **Hyper Jumper** | 8 | ⬟ | Extended jumping range |
| **Mistress Jumper** | 10 | ⬢ | Ultimate jumping with landing attacks |
| **Hybrid Queen** | 12 | ⬡ | Combines Queen and Jumper abilities |

## 🏗️ Technical Architecture

### Technology Stack

- **Backend**: Node.js with Express
- **Real-time**: Socket.io for multiplayer synchronization
- **Frontend**: Vanilla JavaScript with Three.js
- **3D Graphics**: Three.js with GLTFLoader
- **3D Models**: Professional GLB models for all pieces
- **Grid System**: Discrete spherical coordinate system

### Project Structure

```
Project_5/
├── server/
│   ├── index.js              # Main server application
│   ├── gameConfig.js         # Game configuration and grid utilities
│   └── pieceTypes.js         # Piece definitions and battle logic
├── public/
│   ├── index.html            # Main HTML file
│   ├── main.js               # Client-side game logic
│   ├── battleSystem.js       # Battle animations and effects
│   └── utils/
│       └── gridToSphere.js   # Coordinate transformation utilities
├── chess piece models/
│   └── Final pieces/         # Professional GLB 3D models
└── localdocs/                # Documentation and development notes
```

### Core Systems

#### 🔧 Grid System
- **Discrete Coordinates**: 20x24 grid mapped to sphere surface
- **Wraparound Logic**: Horizontal movement wraps around longitude
- **Polar Handling**: Special movement rules at north/south poles
- **Position Validation**: Ensures moves stay within valid game boundaries

#### 🌐 Multiplayer Architecture
- **Socket.io Events**: Real-time communication between clients and server
- **State Synchronization**: Centralized game state with client predictions
- **Connection Management**: Automatic reconnection and player slot reuse
- **Scalable Design**: Supports up to 8 concurrent players

#### 🎨 3D Rendering
- **Three.js Engine**: WebGL-based 3D graphics
- **GLTF Models**: Professional 3D models for all piece types
- **Orbit Controls**: Smooth camera navigation around the sphere
- **Visual Effects**: Battle animations, evolution effects, and UI highlights

## 🔧 Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Production server
npm start

# Install dependencies
npm install
```

### Development Workflow

1. **Phase 1**: Foundation & Core Systems ✅
2. **Phase 2**: Battle Contest System ✅
3. **Phase 3**: Movement & Interaction ✅
4. **Phase 4**: Advanced Movement Mechanics (In Progress)
5. **Phase 5**: Sphere Geometry & Polar Systems
6. **Phase 6**: Evolution & Strategy Systems
7. **Phase 7**: Timing & Collision Systems
8. **Phase 8**: Victory & Communication
9. **Phase 9**: Visual Polish & Effects
10. **Phase 10**: Balance & Testing

### Current Status

- **✅ Complete**: Core multiplayer functionality, battle system, 3D models
- **🔄 In Progress**: Advanced movement mechanics (Splitter splitting)
- **📋 Planned**: Evolution banking, timing systems, visual polish

## 🎯 Game Design Philosophy

### Core Principles

1. **Spatial Innovation**: Breaking the 2D chess paradigm with spherical geometry
2. **Dynamic Evolution**: Pieces grow stronger through strategic gameplay
3. **Balanced Asymmetry**: Different starting positions create unique strategies
4. **Real-time Tension**: Simultaneous moves create pressure and excitement
5. **Strategic Depth**: Multiple paths to victory reward different playstyles

### Unique Innovations

- **Spherical Wraparound**: Traditional chess pieces adapted for globe geometry
- **Evolution Banking**: Strategic choice between immediate upgrades and long-term planning
- **Battle Contests**: Defender choice adds psychological strategy layer
- **Polar Mechanics**: Special movement rules at sphere poles create tactical opportunities
- **Simultaneous Play**: Real-time elements without losing chess's strategic depth

## 🤝 Contributing

We welcome contributions to BrainLift Globe Chess! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the development workflow** outlined above
4. **Submit a pull request** with detailed description

### Code Style Guidelines

- Use modern ES6+ JavaScript features
- Follow functional programming patterns where appropriate
- Maintain consistent naming conventions (camelCase for variables, PascalCase for classes)
- Write self-documenting code with descriptive variable names
- Implement proper error handling and logging

## 📈 Performance & Optimization

### Current Optimizations

- **Model Caching**: GLB models loaded once and reused
- **Efficient Raycasting**: Optimized click detection system
- **State Management**: Centralized game state with minimal network traffic
- **Geometry Optimization**: Efficient sphere coordinate calculations

### Future Optimizations

- **WebGL Instancing**: For rendering multiple identical pieces
- **Frustum Culling**: Hide pieces outside camera view
- **Level of Detail**: Reduce model complexity at distance
- **Compression**: Optimize network protocol for larger games

## 🐛 Known Issues & Limitations

### Current Limitations

- **Player Limit**: Currently supports up to 8 players
- **Mobile Support**: Optimized for desktop browsers (mobile support planned)
- **Reconnection**: Basic reconnection logic (advanced features planned)

### Planned Improvements

- **Mobile Responsive**: Touch controls and mobile UI
- **Spectator Mode**: Watch games without participating
- **Replay System**: Record and replay game sessions
- **AI Opponents**: Computer players for practice games

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js Community**: For the excellent 3D graphics library
- **Socket.io Team**: For seamless real-time multiplayer capabilities
- **Chess Community**: For inspiring the evolution of this classic game
- **WebGL Contributors**: For making 3D web graphics accessible

## 📞 Contact & Support

- **Developer**: Trevor Alpert
- **Project Repository**: [GitHub - Chess Evolution](https://github.com/trevoralpert/Chess-Evolution)
- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: See `/localdocs/` folder for detailed development notes

---

**Ready to revolutionize chess?** Join a game and experience strategy in three dimensions! 🌍♟️

*"Stop playing on squares. Start playing on spheres."* - BrainLift Philosophy