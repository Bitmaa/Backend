#!/bin/bash
# Phase 5 Full Test Script — Socket.IO + API Validation

BASE_URL="http://127.0.0.1:9000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

echo "🔹 Starting Phase 5 full test..."

# Step 1️⃣ Log in as admin to get token
echo "⚡ Logging in as admin..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token!"
  exit 1
fi

echo "✅ Got admin token: $TOKEN"

# Step 2️⃣ Test media upload + like + comment via Socket.IO
echo "⚡ Testing Socket.IO connection and Phase 5 events..."
node - <<EOF
import { io } from "socket.io-client";

const socket = io("$BASE_URL", {
  auth: { token: "$TOKEN" },
});

socket.on("connect", () => {
  console.log("✅ Connected via Socket.IO:", socket.id);

  // Upload test media
  const testMedia = { url: "test.jpg", type: "image", caption: "Phase 5 Automated Test Media" };
  console.log("📸 Uploading media:", testMedia);
  socket.emit("newMedia", testMedia);

  // Listen for mediaUpdate to get mediaId
  socket.on("mediaUpdate", (media) => {
    if (media.caption === testMedia.caption) {
      const mediaId = media._id;

      // Like media after 500ms
      setTimeout(() => {
        console.log("👍 Liking media:", mediaId);
        socket.emit("likeMedia", { mediaId });
      }, 500);

      // Comment after 1000ms
      setTimeout(() => {
        const commentText = "Automated comment for Phase 5!";
        console.log("💬 Commenting on media:", commentText);
        socket.emit("commentMedia", { mediaId, text: commentText });
      }, 1000);

      // End test after 2s
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

# Step 3️⃣ Check backend APIs
echo "⚡ Checking /api/media/me..."
curl -s -X GET "$BASE_URL/api/media/me" -H "Authorization: Bearer $TOKEN" | jq

echo "⚡ Checking /api/media..."
curl -s -X GET "$BASE_URL/api/media" -H "Authorization: Bearer $TOKEN" | jq

echo "✅ Phase 5 full test completed."
