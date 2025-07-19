# Testing Checklist for Modular Architecture

## Pre-Testing Setup

### 1. Create Testing Branch
```bash
git checkout -b feature/modular-architecture
git add .
git commit -m "Refactor: Break down main-simple.js into modular architecture

- Split 7000+ line file into 8 focused modules
- Implement event-driven inter-module communication
- Preserve all original functionality
- Add comprehensive documentation"
```

### 2. Update HTML File
**IMPORTANT**: Change the script tag in `public/index.html`:

**Find line 534:**
```html
<script src="./main-simple.js?v=23&debug=true"></script>
```

**Replace with:**
```html
<script type="module" src="./main-simple-modular.js?v=24&debug=true"></script>
```

## Core Functionality Testing

### ✅ 1. Initial Load & Menu System
- [ ] Page loads without console errors
- [ ] Menu screen displays correctly
- [ ] Color picker works (can select different colors)
- [ ] Player name input accepts text
- [ ] All menu buttons are clickable and show appropriate messages

### ✅ 2. Game Connection & Setup
- [ ] "Quick Play" button initiates game
- [ ] Socket connection establishes (check console for "Connected" message)
- [ ] Menu transitions to game UI
- [ ] Timer UI appears
- [ ] 3D globe renders correctly with grid overlay

### ✅ 3. 3D Scene Rendering
- [ ] Globe appears with proper lighting
- [ ] Chess grid overlay is visible on globe surface
- [ ] Camera controls work (mouse drag to rotate, scroll to zoom)
- [ ] North/South pole markers are visible
- [ ] Scene renders smoothly without flickering

### ✅ 4. Piece Rendering & Management
- [ ] Chess pieces appear on the board (either 3D models or geometric fallbacks)
- [ ] Pieces have correct colors for different players
- [ ] Evolution point labels appear on pieces (if any have points)
- [ ] Pieces are positioned correctly on grid squares

### ✅ 5. Mouse Interaction
- [ ] Clicking on your pieces selects them (if it's your turn)
- [ ] Selected pieces show white ring highlight
- [ ] Valid moves show green sphere highlights
- [ ] Clicking on valid move squares executes moves
- [ ] Right-clicking deselects pieces
- [ ] Clicking opponent pieces shows "Not your piece" message

### ✅ 6. Game State Management
- [ ] Player count updates correctly
- [ ] Turn indicator shows current player
- [ ] Game state updates when moves are made
- [ ] UI reflects current game status

### ✅ 7. Socket Communication
- [ ] All server events are received and processed
- [ ] Game state updates propagate correctly
- [ ] Move requests are sent to server
- [ ] Battle results are handled
- [ ] Evolution events work properly

### ✅ 8. Visual Effects
- [ ] Move highlights appear and animate
- [ ] Selection highlights work properly
- [ ] Highlights clear when deselecting
- [ ] Different move types show different colored highlights

## Advanced Feature Testing

### ✅ 9. Evolution System
- [ ] Evolution choice dialogs appear when triggered
- [ ] Evolution point labels update correctly
- [ ] Piece meshes update after evolution
- [ ] Colors are preserved during evolution

### ✅ 10. Special Moves (if applicable)
- [ ] Splitter pieces show move choice dialog
- [ ] Dual movement UI appears for hybrid pieces
- [ ] Movement mode buttons work correctly
- [ ] Special move execution works

### ✅ 11. Notifications
- [ ] Error messages appear with red styling
- [ ] Success messages appear with green styling
- [ ] Notifications fade in/out smoothly
- [ ] Multiple notifications don't overlap

### ✅ 12. Game Flow
- [ ] Game over screen appears when game ends
- [ ] Return to menu button works
- [ ] Quit to menu button works (with confirmation)
- [ ] Page reload properly resets everything

## Performance & Stability Testing

### ✅ 13. Console Monitoring
- [ ] No JavaScript errors in console
- [ ] Module initialization logs appear in correct order
- [ ] Event communication logs show proper flow
- [ ] No memory leaks or excessive logging

### ✅ 14. Memory Management
- [ ] Pieces are properly cleaned up when removed
- [ ] Highlights are disposed of correctly
- [ ] No WebGL context errors
- [ ] Smooth performance during extended play

### ✅ 15. Module Communication
- [ ] Events flow correctly between modules
- [ ] Global module references work
- [ ] No circular dependencies or conflicts
- [ ] Clean separation of concerns maintained

## Browser Compatibility

### ✅ 16. Cross-Browser Testing
- [ ] Works in Chrome/Chromium
- [ ] Works in Firefox
- [ ] Works in Safari (if available)
- [ ] Works in Edge
- [ ] Mobile browsers (if applicable)

## Fallback Testing

### ✅ 17. Model Loading Fallbacks
- [ ] If 3D models fail to load, geometric pieces appear
- [ ] GLTFLoader errors are handled gracefully
- [ ] Game continues to work with geometric pieces

### ✅ 18. Network Issues
- [ ] Socket disconnection is handled properly
- [ ] Reconnection attempts work
- [ ] UI shows appropriate connection status

## Comparison Testing

### ✅ 19. Feature Parity
- [ ] All features from original work identically
- [ ] No functionality has been lost
- [ ] Performance is equal or better
- [ ] Visual appearance is identical

## Debugging Tools

### Console Commands for Testing
Open browser console and test these:

```javascript
// Check module initialization
console.log('Modules loaded:', {
  gameInit: !!window.gameInit,
  socketManager: !!window.socketManager,
  sceneManager: !!window.sceneManager,
  gameStateManager: !!window.gameStateManager,
  mouseInteraction: !!window.mouseInteraction,
  pieceMeshManager: !!window.pieceMeshManager,
  visualEffects: !!window.visualEffects,
  uiManager: !!window.uiManager
});

// Check game state
console.log('Game State:', window.gameStateManager?.gameState);

// Check piece meshes
console.log('Piece Meshes:', Object.keys(window.pieceMeshManager?.pieceMeshes || {}));

// Test notification system
document.dispatchEvent(new CustomEvent('showNotification', {
  detail: { message: 'Test notification!', color: '#00ff00', duration: 2000 }
}));
```

## Rollback Plan

If issues are found:

### Quick Rollback
1. Change HTML back to original script:
   ```html
   <script src="./main-simple.js?v=23&debug=true"></script>
   ```

### Full Rollback
```bash
git checkout main
git branch -D feature/modular-architecture  # if needed
```

## Success Criteria

✅ **All core functionality working**
✅ **No console errors**
✅ **Smooth performance**
✅ **Visual parity with original**
✅ **All game features functional**

## Common Issues & Solutions

### Module Loading Errors
- Ensure all file paths are correct
- Check that all modules export their classes properly
- Verify import statements match export names

### Event Communication Issues
- Check that events are dispatched with correct names
- Verify event listeners are set up properly
- Use browser dev tools to monitor custom events

### 3D Rendering Issues
- Check WebGL support in browser
- Verify Three.js is loaded before modules
- Check for WebGL context errors

### Socket Connection Issues
- Verify server is running
- Check network connectivity
- Monitor socket events in browser dev tools

---

## Final Notes

- Test thoroughly in a development environment first
- Keep the original `main-simple.js` as backup
- Monitor console output during all testing
- Document any issues found for future reference

Good luck with testing! 🚀