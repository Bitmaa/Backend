#!/bin/bash
# Phase 5 Full Validated Test Script — Socket.IO + API + Count Checks

BASE_URL="http://127.0.0.1:9000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

echo "🔹 Starting Phase 5 full validated test..."

# Step 1️⃣ Log in as admin
echo "⚡ Logging in as admin..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "❌ Failed to get admin token!"
  exit 1
fi
echo "✅ Got admin token"

# Step 2️⃣ Socket.IO upload + like + comment
echo "⚡ Testing Socket.IO events..."
node - <<EOF
import { io } from "socket.io-client";

const socket = io("$BASE_URL", { auth: { token: "$TOKEN" } });

socket.on("connect", () => {
  console.log("✅ Connected via Socket.IO:", socket.id);

  const testMedia = { url: "test.jpg", type: "image", caption: "Phase 5 Validated Test Media" };
  console.log("📸 Uploading media:", testMedia);
  socket.emit("newMedia", testMedia);

  socket.on("mediaUpdate", (media) => {
    if (media.caption === testMedia.caption) {
      const mediaId = media._id;

      setTimeout(() => { socket.emit("likeMedia", { mediaId }); }, 500);
      setTimeout(() => { socket.emit("commentMedia", { mediaId, text: "Automated validated comment!" }); }, 1000);

      setTimeout(() => {
        console.log("⏱ Ending Socket.IO test, disconnecting...");
        socket.disconnect();
      }, 2000);
    }
  });
});

socket.on("mediaLiked", (data) => console.log("👍 Media liked:", data));
socket.on("mediaCommented", (data) => console.log("💬 Media commented:", data));
socket.on("disconnect", () => console.log("❌ Disconnected from server"));
EOF

# Step 3️⃣ API validation
echo "⚡ Validating API results..."

ADMIN_MEDIA_COUNT=$(curl -s -X GET "$BASE_URL/api/media/me" -H "Authorization: Bearer $TOKEN" | jq '. | length')
GLOBAL_MEDIA_COUNT=$(curl -s -X GET "$BASE_URL/api/media" -H "Authorization: Bearer $TOKEN" | jq '. | length')

echo "⚡ Admin media count: $ADMIN_MEDIA_COUNT"
echo "⚡ Global feed media count: $GLOBAL_MEDIA_COUNT"

# Validate counts (adjust expected numbers if needed)
EXPECTED_ADMIN=1
EXPECTED_GLOBAL=1

if [ "$ADMIN_MEDIA_COUNT" -ge "$EXPECTED_ADMIN" ]; then
  echo "✅ Admin media count is OK"
else
  echo "❌ Admin media count is INCORRECT"
fi

if [ "$GLOBAL_MEDIA_COUNT" -ge "$EXPECTED_GLOBAL" ]; then
  echo "✅ Global feed count is OK"
else
  echo "❌ Global feed count is INCORRECT"
fi

# Step 4️⃣ List captions
echo "⚡ Listing admin media captions..."
curl -s -X GET "$BASE_URL/api/media/me" -H "Authorization: Bearer $TOKEN" | jq '.[].caption'

echo "⚡ Listing global feed captions..."
curl -s -X GET "$BASE_URL/api/media" -H "Authorization: Bearer $TOKEN" | jq '.[].caption'

echo "✅ Phase 5 full validated test completed"
