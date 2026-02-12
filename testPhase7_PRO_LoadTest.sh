#!/bin/bash
# testPhase7_PRO_LoadTest.sh — Phase 7 Production Load + Scaling Test

echo "🚀 Phase 7 PRO Load + Scaling Test Starting..."

# 1️⃣ Ensure PM2 backend is running
pm2 describe myMVP-backend > /dev/null
if [ $? -ne 0 ]; then
  echo "⚠️ PM2 backend not running, starting..."
  pm2 start ecosystem.config.cjs
  sleep 5
else
  echo "✅ PM2 backend running"
fi

# 2️⃣ Load test configuration
NUM_USERS=10       # Number of simulated users
NUM_REQUESTS=50    # API requests per user
NUM_EVENTS=20      # Socket events per user
PORT=${PORT:-9000}
ADMIN_TOKEN=${JWT_SECRET:-"YOUR_ADMIN_TOKEN"}
API_URL="http://localhost:$PORT/api"

# 3️⃣ Function to simulate API load
function apiLoadTest() {
  local user=$1
  for i in $(seq 1 $NUM_REQUESTS); do
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/media" > /dev/null
  done
  echo "📄 [$user] Completed $NUM_REQUESTS API requests"
}

# 4️⃣ Function to simulate Socket.IO load
function socketLoadTest() {
  local user=$1
  node <<'EOF'
import { io } from "socket.io-client";
import dotenv from "dotenv";
dotenv.config();

const ADMIN_TOKEN = process.env.JWT_SECRET || "YOUR_ADMIN_TOKEN";
const PORT = process.env.PORT || 9000;

const socket = io(`http://localhost:${PORT}`, { auth: { token: ADMIN_TOKEN } });

socket.on("connect", () => {
  console.log("✅ [User] Socket connected:", socket.id);

  for (let i = 0; i < 20; i++) {
    const media = {
      url: `load_test_${i}.jpg`,
      type: "image",
      caption: `Phase 7 Load Test #${i}`
    };
    socket.emit("newMedia", media);

    // Like and comment after random delay
    setTimeout(() => socket.emit("likeMedia", { mediaId: "REPLACE_WITH_MEDIA_ID" }), 500);
    setTimeout(() => socket.emit("commentMedia", { mediaId: "REPLACE_WITH_MEDIA_ID", text: "🔥" }), 1000);
  }

  setTimeout(() => { socket.disconnect(); }, 5000);
});

socket.on("disconnect", () => console.log("❌ [User] Socket disconnected"));
EOF
}

# 5️⃣ Run load tests in parallel
echo -e "\n⚡ Starting parallel load tests..."

for i in $(seq 1 $NUM_USERS); do
  apiLoadTest "API_User_$i" &
  socketLoadTest "Socket_User_$i" &
done

wait
echo -e "\n✅ Phase 7 PRO Load + Scaling Test Complete!"
