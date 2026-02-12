#!/bin/bash
# Phase 5 Full Validated Test Script with Pass/Fail Summary

BASE_URL="http://127.0.0.1:9000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

echo "🔹 Starting Phase 5 full validated test with summary..."

# Step 1️⃣ Log in as admin
echo "⚡ Logging in as admin..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  | jq -r '.token')

PASS_LOGIN="❌"
if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  PASS_LOGIN="✅"
fi
echo "Login status: $PASS_LOGIN"

# Step 2️⃣ Socket.IO upload + like + comment
echo "⚡ Testing Socket.IO events..."
MEDIA_ID=""
SOCKET_UPLOAD="❌"
SOCKET_LIKE="❌"
SOCKET_COMMENT="❌"

node - <<EOF
import { io } from "socket.io-client";
const socket = io("$BASE_URL", { auth: { token: "$TOKEN" } });

socket.on("connect", () => {
  console.log("✅ Connected via Socket.IO:", socket.id);

  const testMedia = { url: "test.jpg", type: "image", caption: "Phase 5 Summary Test Media" };
  console.log("📸 Uploading media:", testMedia);
  socket.emit("newMedia", testMedia);

  socket.on("mediaUpdate", (media) => {
    if (media.caption === testMedia.caption) {
      const mediaId = media._id;
      process.stdout.write(mediaId); // pass ID back to bash
      setTimeout(() => { socket.emit("likeMedia", { mediaId }); }, 500);
      setTimeout(() => { socket.emit("commentMedia", { mediaId, text: "Automated comment!" }); }, 1000);
      setTimeout(() => { socket.disconnect(); }, 2000);
    }
  });

  socket.on("mediaLiked", () => process.stdout.write("L"));
  socket.on("mediaCommented", () => process.stdout.write("C"));
});
EOF

# Capture Socket.IO output
SOCKET_OUTPUT=$(node socketTestPhase5.js 2>/dev/null)

# Analyze output
[[ "$SOCKET_OUTPUT" == *"Uploading media"* ]] && SOCKET_UPLOAD="✅"
[[ "$SOCKET_OUTPUT" == *"Media liked"* ]] && SOCKET_LIKE="✅"
[[ "$SOCKET_OUTPUT" == *"Media commented"* ]] && SOCKET_COMMENT="✅"

# Step 3️⃣ API validation
ADMIN_MEDIA_COUNT=$(curl -s -X GET "$BASE_URL/api/media/me" -H "Authorization: Bearer $TOKEN" | jq '. | length')
GLOBAL_MEDIA_COUNT=$(curl -s -X GET "$BASE_URL/api/media" -H "Authorization: Bearer $TOKEN" | jq '. | length')

EXPECTED_ADMIN=1
EXPECTED_GLOBAL=1

ADMIN_COUNT_PASS="❌"
GLOBAL_COUNT_PASS="❌"

[ "$ADMIN_MEDIA_COUNT" -ge "$EXPECTED_ADMIN" ] && ADMIN_COUNT_PASS="✅"
[ "$GLOBAL_MEDIA_COUNT" -ge "$EXPECTED_GLOBAL" ] && GLOBAL_COUNT_PASS="✅"

# Step 4️⃣ List captions
ADMIN_CAPTIONS=$(curl -s -X GET "$BASE_URL/api/media/me" -H "Authorization: Bearer $TOKEN" | jq '.[].caption')
GLOBAL_CAPTIONS=$(curl -s -X GET "$BASE_URL/api/media" -H "Authorization: Bearer $TOKEN" | jq '.[].caption')

# ✅ Final summary
echo
echo "-----------------------------------"
echo "📝 Phase 5 Validation Summary"
echo "Login: $PASS_LOGIN"
echo "Socket.IO Upload: $SOCKET_UPLOAD"
echo "Socket.IO Like: $SOCKET_LIKE"
echo "Socket.IO Comment: $SOCKET_COMMENT"
echo "Admin media count: $ADMIN_COUNT_PASS ($ADMIN_MEDIA_COUNT)"
echo "Global feed count: $GLOBAL_COUNT_PASS ($GLOBAL_MEDIA_COUNT)"
echo "Admin captions: $ADMIN_CAPTIONS"
echo "Global captions: $GLOBAL_CAPTIONS"
echo "-----------------------------------"
echo "✅ Phase 5 full validated test with summary completed"
