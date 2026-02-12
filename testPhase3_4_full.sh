#!/bin/bash

# -----------------------------
# Full Automated Backend Test Script
# Phase 3 (Admin API) + Phase 4 (Socket.IO + Media Upload)
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
# Phase 4: Media Upload + Socket.IO test
# -----------------------------
echo "🔹 Testing media upload + real-time events with Socket.IO..."

# Check socket.io-client
if [ ! -d "node_modules/socket.io-client" ]; then
  echo "Installing socket.io-client..."
  npm install socket.io-client
fi

# Make sure 'test.jpg' exists in backend folder for upload
if [ ! -f "test.jpg" ]; then
  echo "⚠️ test.jpg not found. Please add a small image in backend folder for upload."
  exit 1
fi

node <<EOF
import { io } from "socket.io-client";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

const SERVER = "$SERVER";
const TOKEN = "$TOKEN";

// Socket.IO connection
const socket = io(SERVER, { auth: { token: TOKEN } });

socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Socket disconnected:", reason);
});

socket.on("newMedia", (media) => {
  console.log("📡 New media received via socket:", media);
});

// Upload media via API
(async () => {
  const form = new FormData();
  form.append("file", fs.createReadStream("test.jpg"));

  const response = await fetch("\${SERVER}/api/media/upload", {
    method: "POST",
    headers: { "Authorization": "Bearer \${TOKEN}" },
    body: form
  });

  const result = await response.json();
  console.log("📤 Media upload result:", result);
})();

// Keep script alive for 15 seconds to catch socket events
setTimeout(() => {
  console.log("🕒 Done testing Socket.IO events.");
  socket.disconnect();
  process.exit(0);
}, 15000);
EOF
