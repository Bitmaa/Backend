#!/bin/bash

# -----------------------------
# Automated Backend Test Script
# Phase 3 (Admin API) + Phase 4 (Socket.IO)
# -----------------------------

SERVER="http://127.0.0.1:9000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

echo "🔹 Logging in as admin to get JWT token..."

TOKEN=$(curl -s -X POST "$SERVER/api/auth/login" \
-H "Content-Type: application/json" \
-d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.token')

if [[ "$TOKEN" == "null" || -z "$TOKEN" ]]; then
  echo "❌ Failed to get token. Aborting."
  exit 1
fi

echo "✅ Got token: $TOKEN"
echo ""

# -----------------------------
# Phase 3: Admin API tests
# -----------------------------
echo "-----------------------------------"
echo "1️⃣ GET all users"
curl -s -X GET "$SERVER/api/admin/users" -H "Authorization: Bearer $TOKEN" | jq
echo ""
echo "-----------------------------------"
echo "2️⃣ GET all media"
curl -s -X GET "$SERVER/api/admin/media" -H "Authorization: Bearer $TOKEN" | jq
echo ""
echo "-----------------------------------"
echo "✅ Phase 3 Admin API test completed"
echo ""

# -----------------------------
# Phase 4: Socket.IO test
# -----------------------------
echo "🔹 Testing real-time events with Socket.IO..."

# Check if node_modules/socket.io-client exists
if [ ! -d "node_modules/socket.io-client" ]; then
  echo "Installing socket.io-client..."
  npm install socket.io-client
fi

node <<EOF
import { io } from "socket.io-client";

const SERVER = "$SERVER";
const TOKEN = "$TOKEN";

const socket = io(SERVER, { auth: { token: TOKEN } });

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
});

socket.on("newMedia", (media) => {
  console.log("📡 New media received:", media);
});

// Keep script alive for 10 seconds to catch events
setTimeout(() => {
  console.log("🕒 Done testing Socket.IO events.");
  socket.disconnect();
  process.exit(0);
}, 10000);
EOF
