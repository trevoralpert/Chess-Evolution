# EvoChess Deployment Guide

## 🚀 Deploying to Fly.io

### Step 1: Install Fly CLI (if not already installed)
```bash
# macOS
brew install flyctl

# Or use the install script
curl -L https://fly.io/install.sh | sh
```

### Step 2: Login to Fly.io
```bash
flyctl auth login
```

### Step 3: Deploy Your App
Since you already have a `fly.toml` file configured:

```bash
# Deploy directly
flyctl deploy

# If this is your first deployment, you might need to create the app first:
flyctl apps create EvoChess
```

Your app will be available at: **https://evochess.fly.dev**

### Step 4: Set up GitHub Actions (Automatic Deployment)

1. Get your Fly.io API token:
   ```bash
   flyctl auth token
   ```

2. Add it to your GitHub repository:
   - Go to your repo on GitHub
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FLY_API_TOKEN`
   - Value: paste the token from step 1

Now every push to `main` will automatically deploy!

## 🖼️ Embedding in Your Website

### Basic iframe embed:
```html
<iframe
  src="https://evochess.fly.dev"
  width="100%"
  height="800"
  style="border: none; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  allowfullscreen>
</iframe>
```

### Responsive iframe with loading state:
```html
<div style="position: relative; width: 100%; max-width: 1200px; margin: 0 auto;">
  <div style="position: relative; padding-bottom: 75%; height: 0; overflow: hidden;">
    <iframe
      src="https://evochess.fly.dev"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
      allowfullscreen
      loading="lazy">
    </iframe>
  </div>
</div>
```

### With custom loading screen:
```html
<div id="game-container" style="position: relative; width: 100%; height: 800px;">
  <div id="loading" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #1a1a2e;">
    <div style="text-align: center; color: white;">
      <h2>Loading EvoChess...</h2>
      <div class="spinner"></div>
    </div>
  </div>
  <iframe
    src="https://evochess.fly.dev"
    style="width: 100%; height: 100%; border: none;"
    onload="document.getElementById('loading').style.display='none';"
    allowfullscreen>
  </iframe>
</div>

<style>
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

## 🌐 Custom Domain Setup

### Option 1: Subdomain (e.g., play.trevoralpert.com)

1. **In your DNS provider** (Namecheap, GoDaddy, Cloudflare, etc.):
   - Add a CNAME record:
     - Name: `play` (or whatever subdomain you want)
     - Value: `evochess.fly.dev`
     - TTL: 3600 (or auto)

2. **In Fly.io** (after DNS propagates, ~5-30 minutes):
   ```bash
   flyctl certs add play.trevoralpert.com
   flyctl certs check play.trevoralpert.com
   ```

3. Wait for SSL certificate (usually instant)

### Option 2: Direct link from your main site
Simply add a button or link:
```html
<a href="https://evochess.fly.dev" target="_blank" class="play-button">
  Play EvoChess Online
</a>
```

## 🔧 Useful Fly.io Commands

```bash
# View logs
flyctl logs

# Check app status
flyctl status

# Scale your app (if needed)
flyctl scale count 2  # Run 2 instances

# SSH into your app
flyctl ssh console

# View app info
flyctl info

# Restart app
flyctl apps restart
```

## 📱 Mobile Considerations

The game should work on mobile browsers, but for the best experience, you might want to add a notice:

```html
<script>
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  alert('EvoChess is best experienced on desktop. Mobile support is experimental.');
}
</script>
```

## 🐛 Troubleshooting

### If deployment fails:
1. Check logs: `flyctl logs`
2. Ensure all dependencies are in `package.json`
3. Verify `PORT` environment variable is used: `process.env.PORT || 3000`

### If the app crashes:
1. Check memory usage: `flyctl status`
2. Scale up if needed: `flyctl scale memory 512`

### Domain not working:
1. Verify DNS propagation: `dig play.trevoralpert.com`
2. Check certificate: `flyctl certs check play.trevoralpert.com`

## 🎮 Ready to Deploy!

Your app is configured and ready. Just run:
```bash
flyctl deploy
```

And your game will be live at https://evochess.fly.dev! 🎉 