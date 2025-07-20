# EvoChess Deployment Verification Guide

## Deployment Chain

```
Local Development → GitHub → Fly.io → Your Website
```

## Quick Verification Steps

### 1. Check Server Health

Visit these URLs to verify the deployment:
- **Production**: https://evochess.fly.dev/health
- **Local**: http://localhost:3000/health

You should see:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2025-01-19T...",
  "environment": "production",
  "gameState": {
    "players": 0,
    "pieces": 0,
    "activeGames": 0
  }
}
```

### 2. Test Direct Access

1. Open https://evochess.fly.dev directly
2. Check browser console for errors
3. Try creating a game
4. Note the console output

### 3. Test Embedding

Use the test page at `/test-embed.html`:
1. Deploy it with your app
2. Visit https://evochess.fly.dev/test-embed.html
3. Click "Load Production" to test iframe embedding
4. Check the console output section

## Common Issues & Solutions

### Issue: Board doesn't appear when embedded

**Symptoms**:
- Players can join/see each other
- WebSocket connection works
- But no 3D board renders

**Diagnostics to check**:
1. Open browser console on your website
2. Look for these log messages:
   - `🎮 Environment diagnostics:` - Shows embedding status
   - `🌐 Rendering context:` - Shows if 3D components loaded
   - `🎮 3D Renderer initialized:` - Shows if canvas was created

**Common causes**:
1. **Canvas blocked by iframe sandbox** - Add `allow-webgl` to sandbox attribute
2. **Assets not loading** - Check for 404 errors on .glb files
3. **WebGL context lost** - May happen with multiple iframes

**Solutions**:
```html
<!-- Proper iframe setup -->
<iframe 
  src="https://evochess.fly.dev" 
  width="100%" 
  height="600"
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  allow="accelerometer; camera; encrypted-media; fullscreen; gyroscope; microphone; midi; payment; vr; xr-spatial-tracking"
></iframe>
```

### Issue: Game works locally but not in production

**Check these**:
1. Browser cache - Force refresh (Ctrl+Shift+R)
2. Check Fly.io logs: `fly logs -a evochess`
3. Verify deployment completed: `fly status -a evochess`

### Issue: Socket connection fails

**Look for**:
- `Socket connection error:` in console
- Check if using HTTPS (required for secure WebSockets)
- Verify no firewall blocking WebSocket connections

## Debugging Tools

### Browser Console Commands

Run these in the browser console to debug:

```javascript
// Check if embedded
console.log('Embedded:', window.self !== window.top);

// Check Socket.IO status
console.log('Socket connected:', window.globalSocket?.connected);

// Check Three.js status
console.log('Three.js loaded:', typeof THREE);
console.log('Renderer exists:', !!window.renderer);
console.log('Scene has children:', window.scene?.children.length);

// Check loaded models
console.log('Models loaded:', Object.keys(window.loadedModels || {}));
```

### Server Logs

Monitor real-time logs:
```bash
fly logs -a evochess --follow
```

Look for:
- `🌐 Request from embedded context:` - Shows embedded requests
- `Socket connected:` - Shows player connections
- Error messages

## Performance Monitoring

### Check Resource Loading

1. Open Network tab in browser DevTools
2. Look for:
   - Failed requests (red)
   - Slow loading assets (> 1s)
   - CORS errors

### Memory Usage

In browser console:
```javascript
console.log('Memory:', performance.memory);
```

## Deployment Checklist

Before deploying:
- [ ] Test locally with `npm start`
- [ ] Check no console errors
- [ ] Verify all assets load
- [ ] Test create game, join game, and gameplay

After deploying:
- [ ] Check /health endpoint
- [ ] Test direct access
- [ ] Test embedded access
- [ ] Monitor logs for 5 minutes
- [ ] Test on different browsers

## Contact & Support

If issues persist:
1. Check Fly.io status: https://status.flyio.net/
2. Review deployment logs: `fly logs -a evochess`
3. Test with simpler embedding first (no sandbox attributes)
4. Use test-embed.html to isolate issues 