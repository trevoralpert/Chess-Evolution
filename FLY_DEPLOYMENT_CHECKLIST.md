# 🚀 EvoChess Fly.io Deployment Checklist

## ✅ Pre-deployment Checklist

- [x] **fly.toml** configured with app name "EvoChess"
- [x] **package.json** has start script: `"start": "node server/index.js"`
- [x] Server uses `process.env.PORT || 3000`
- [x] All dependencies listed in package.json
- [x] GitHub Actions workflow created (.github/workflows/fly-deploy.yml)
- [x] Project structure correct (public/ and server/ folders)
- [x] .gitignore file exists

## 📋 Quick Deploy Steps

1. **Install Fly CLI** (if needed):
   ```bash
   brew install flyctl
   ```

2. **Login to Fly**:
   ```bash
   flyctl auth login
   ```

3. **Create the app** (first time only):
   ```bash
   flyctl apps create EvoChess
   ```

4. **Deploy**:
   ```bash
   flyctl deploy
   ```

## 🔗 Your URLs

- **Live Game**: https://evochess.fly.dev
- **Custom Domain**: https://play.trevoralpert.com (after setup)

## 📝 Notes

- The game server will automatically handle multiple regions
- WebSocket connections are automatically proxied
- Static files in `public/` are served by Express
- The app will auto-restart if it crashes

## ⚠️ Important: Fix the TypeError First!

I noticed in your terminal output there's a TypeError when a piece captures another:
```
TypeError: Cannot read properties of undefined (reading 'points')
```

You should fix this before deploying. The error is in the evolution system when trying to get available evolution paths after a capture. 