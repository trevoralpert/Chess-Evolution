#!/bin/bash

echo "🚀 Checking EvoChess deployment status..."
echo "========================================="

# Check app status
echo -e "\n📊 App Status:"
flyctl status

# Check if app is running
echo -e "\n🌐 Checking if app is accessible:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://evochess.fly.dev

# Show recent logs
echo -e "\n📜 Recent logs (last 10 lines):"
flyctl logs | tail -10

echo -e "\n✅ If you see HTTP Status: 200, your app is live!"
echo "🔗 Visit: https://evochess.fly.dev" 