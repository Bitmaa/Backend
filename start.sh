
#!/bin/bash

# --- 1. Start Redis if not running ---
if ! pgrep -x "redis-server" > /dev/null
then
    echo "Starting Redis..."
    redis-server --daemonize yes
    sleep 2  # give Redis a moment to start
else
    echo "Redis is already running."
fi

# --- 2. Stop existing PM2 instances ---
if pm2 list | grep -q "myMVP-backend"; then
    echo "Stopping existing PM2 instances of myMVP-backend..."
    pm2 delete myMVP-backend
fi

# --- 3. Start backend with PM2 ---
echo "Starting myMVP-backend with PM2..."
pm2 start index.js --name myMVP-backend --update-env

echo "✅ All done! Backend is running."
