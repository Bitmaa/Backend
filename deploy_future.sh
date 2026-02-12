#!/bin/bash

# -------------------------------
# Future-proof backend deploy with health check
# -------------------------------

echo "🚀 Starting deployment process..."

# 1️⃣ Stop and delete any existing PM2 process
echo "Stopping existing PM2 instances of myMVP-backend..."
pm2 stop myMVP-backend
pm2 delete myMVP-backend

# 2️⃣ Kill any leftover node process on port 9000
echo "Checking for processes on port 9000..."
PID=$(lsof -ti:9000)
if [ -n "$PID" ]; then
    echo "Killing process $PID on port 9000..."
    kill -9 $PID
fi

# 3️⃣ Start Redis if not running
REDIS_STATUS=$(redis-cli ping 2>/dev/null)
if [ "$REDIS_STATUS" != "PONG" ]; then
    echo "Starting Redis..."
    redis-server --daemonize yes
else
    echo "Redis already running ✅"
fi

# 4️⃣ Start backend with PM2
echo "Starting myMVP-backend with PM2..."
pm2 start index.js --name myMVP-backend

# 5️⃣ Save PM2 process list for automatic restart on reboot
echo "Saving PM2 process list for future restarts..."
pm2 save

# 6️⃣ Ensure PM2 startup on device reboot
echo "Setting PM2 to auto-start on system reboot..."
pm2 startup | tail -n 1 | bash

# 7️⃣ Wait a few seconds for backend to fully start
echo "⏱ Waiting 5 seconds for backend to boot..."
sleep 5

# 8️⃣ Health check
echo "Checking backend health..."
HEALTH=$(curl -s http://localhost:9000/health)
if [[ "$HEALTH" == *"ok"* ]]; then
    echo "✅ Backend is healthy: $HEALTH"
else
    echo "❌ Backend health check failed. Logs:"
    pm2 logs myMVP-backend --lines 20
fi

# 9️⃣ Show PM2 status
pm2 status
