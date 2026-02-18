#!/bin/bash

# ==== CONFIG ====
APP_NAME="myMVP-backend"
APP_PATH="$HOME/myMVP/backend"
NODE_PORT=9000
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379
MAX_RETRIES=5
WAIT_SECONDS=5

# ==== DETERMINE ENVIRONMENT ====
if [ "$1" == "dev" ]; then
    ENV_FILE=".env.development"
    echo "🌱 Using DEVELOPMENT environment"
else
    ENV_FILE=".env"
    echo "🚀 Using PRODUCTION environment"
fi

echo "🔹 Starting full deployment for $APP_NAME ..."

# 1️⃣ Kill existing backend Node instances
echo "🛑 Stopping old PM2 process (if exists)..."
pm2 stop $APP_NAME 2>/dev/null
pm2 delete $APP_NAME 2>/dev/null

echo "🛠 Killing any Node process on port $NODE_PORT..."
fuser -k $NODE_PORT/tcp 2>/dev/null || true

# 2️⃣ Start Redis if not running
if ! pgrep -x redis-server > /dev/null; then
    echo "📡 Starting Redis server..."
    redis-server --daemonize yes
else
    echo "✅ Redis already running"
fi

# ==== HEALTH CHECKS WITH RETRIES ====
echo "🔍 Performing health checks..."

# --- Redis Health Check ---
retry_count=0
until redis-cli -h $REDIS_HOST -p $REDIS_PORT ping | grep -q PONG; do
    retry_count=$((retry_count+1))
    if [ $retry_count -gt $MAX_RETRIES ]; then
        echo "❌ Redis not responding after $MAX_RETRIES attempts. Aborting deployment!"
        exit 1
    fi
    echo "⏳ Redis not ready. Retrying ($retry_count/$MAX_RETRIES) in $WAIT_SECONDS sec..."
    sleep $WAIT_SECONDS
done
echo "✅ Redis is alive"

# --- MongoDB Health Check ---
retry_count=0
until node -e "
import mongoose from 'mongoose';
import 'dotenv/config';
import path from 'path';

const envPath = path.resolve('$APP_PATH/$ENV_FILE');
const uri = process.env.MONGO_URI;

mongoose.set('strictQuery', false);
import('dotenv').then(dotenv => dotenv.config({ path: envPath }));

mongoose.connect(uri)
  .then(() => { console.log('✅ MongoDB connection successful'); process.exit(0); })
  .catch(() => { process.exit(1); });
"; do
    retry_count=$((retry_count+1))
    if [ $retry_count -gt $MAX_RETRIES ]; then
        echo "❌ MongoDB failed after $MAX_RETRIES attempts. Aborting deployment!"
        exit 1
    fi
    echo "⏳ MongoDB not ready. Retrying ($retry_count/$MAX_RETRIES) in $WAIT_SECONDS sec..."
    sleep $WAIT_SECONDS
done

# 3️⃣ Start backend via PM2 with proper .env
echo "🚀 Starting Node backend via PM2..."
cd $APP_PATH
pm2 start index.js --name $APP_NAME --env-file $ENV_FILE

# 4️⃣ Save PM2 for auto-start on reboot
pm2 save
pm2 startup | tail -n 1

# 5️⃣ Backend port check
if nc -z localhost $NODE_PORT; then
    echo "✅ Backend Node server is listening on port $NODE_PORT"
else
    echo "❌ Backend Node server NOT listening on port $NODE_PORT"
fi

# 6️⃣ Tail last 20 logs
echo "📄 Tailing PM2 logs..."
pm2 logs $APP_NAME --lines 20
