#!/bin/bash
# fixPhase7_Termux.sh — Termux-ready Phase 7 automation

echo "🚀 Starting Phase 7 Termux Fix & Test..."

# 1️⃣ Ensure backend folder
cd ~/myMVP/backend || exit

# 2️⃣ Install missing dependencies
echo "📦 Installing Redis..."
npm install redis

# 3️⃣ Ensure logs folder exists
mkdir -p logs

# 4️⃣ Start PM2 backend if not running
echo "⚡ Starting PM2 backend..."
pm2 start ecosystem.config.cjs --only myMVP-backend || echo "PM2 already running..."

# 5️⃣ Wait for backend to fully start
echo "⏳ Waiting 5 seconds for server to boot..."
sleep 5

# 6️⃣ Tail backend logs in background
pm2 logs myMVP-backend --lines 10 &

# 7️⃣ Run Phase 7 full validated test
echo "🧪 Running Phase 7 Full Validated Test..."
./testPhase7Full_Validated_Summary.sh

echo "✅ Phase 7 Termux Fix & Test Complete!"
