#!/bin/bash
# deploy.sh — Deploy myMVP backend with PM2, Redis, and health & API check

# -------------------- Config --------------------
BACKEND_DIR=~/myMVP/backend
PORT=9000

# -------------------- Start Deployment --------------------
echo "🚀 Deploying myMVP backend..."

cd $BACKEND_DIR || exit 1

# Start Redis (adjust if using a remote Redis)
echo "🔹 Starting Redis..."
redis-server --daemonize yes

# Stop and delete any existing PM2 process
if pm2 list | grep -q myMVP-backend; then
    echo "🛑 Stopping existing PM2 backend..."
    pm2 stop myMVP-backend
    pm2 delete myMVP-backend
fi

# Start backend with PM2
echo "⚡ Starting backend with PM2..."
pm2 start index.js --name myMVP-backend
pm2 save

# -------------------- Detect Local IP --------------------
LOCAL_IP=$(ip addr show wlan0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="127.0.0.1"
fi

# Wait a few seconds for the server to start
sleep 3

# -------------------- Health Check --------------------
echo "🔍 Checking backend /health..."
HEALTH=$(curl -s http://$LOCAL_IP:$PORT/health)

if [[ $HEALTH == *'"status":"ok"'* ]]; then
    echo "✅ /health OK"
else
    echo "⚠️ /health failed"
    echo "Response: $HEALTH"
fi

# -------------------- API Test --------------------
echo "🔍 Checking /api/test..."
API_TEST=$(curl -s http://$LOCAL_IP:$PORT/api/test)

if [[ $API_TEST == *'"message":"API test successful'* ]]; then
    echo "✅ /api/test OK"
else
    echo "⚠️ /api/test failed"
    echo "Response: $API_TEST"
fi

# -------------------- Summary --------------------
echo "🌐 LAN URL: http://$LOCAL_IP:$PORT"
echo "🎉 Deployment complete!"
