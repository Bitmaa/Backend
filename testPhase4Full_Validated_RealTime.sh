#!/bin/bash
# testPhase4Full_Validated_RealTime.sh
# Phase 4: Full media upload + real-time Socket.IO logging + validation

ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDcxMDA2NiwiZXhwIjoxNzcxMzE0ODY2fQ.Dg9m3yjLSMNzLHCWT5edwI2ycwdcTJnzmN2nVs-CZDg"
USER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IjY5OGEzYjZhOTljZjEyMWFiNDYwZGRiZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzcwNjY2ODc3LCJleHAiOjE3NzEyNzE2Nzd9.X5SSDUpvkIjMsHNqbGWbQtXoYqYqKZCg7NLkrTTse6s"

echo "🔹 Starting Phase 4 full validation with real-time logging..."

# -------------------- Helper function --------------------
emit_media_realtime() {
  TOKEN=$1
  URL=$2
  CAPTION=$3
  USER=$4
  node -e "
import { io } from 'socket.io-client';
const socket = io('http://localhost:9000', { auth: { token: '$TOKEN' } });

socket.on('connect', () => {
    console.log('⚡ [$USER] Connected via Socket.IO:', socket.id);
    console.log('📸 [$USER] Uploading media:', '$CAPTION');
    socket.emit('newMedia', { url: '$URL', type: 'image', caption: '$CAPTION' });
    setTimeout(() => { socket.disconnect(); }, 1500);
});

socket.on('mediaUpdate', (data) => {
    console.log('📣 [$USER] Media update received:', data);
});

socket.on('disconnect', () => {
    console.log('❌ [$USER] Disconnected');
});
"
}

# -------------------- Emit media --------------------
echo "⚡ Admin uploading media..."
emit_media_realtime $ADMIN_TOKEN "admin1.jpg" "Admin first post" "ADMIN"
sleep 1
emit_media_realtime $ADMIN_TOKEN "admin2.jpg" "Admin second post" "ADMIN"
sleep 2

echo "⚡ User uploading media..."
emit_media_realtime $USER_TOKEN "user1.jpg" "User first post" "USER"
sleep 1
emit_media_realtime $USER_TOKEN "user2.jpg" "User second post" "USER"
sleep 2

# -------------------- API validation --------------------
ADMIN_MEDIA=$(curl -s -X GET http://127.0.0.1:9000/api/media/me \
-H "Authorization: Bearer $ADMIN_TOKEN")
USER_MEDIA=$(curl -s -X GET http://127.0.0.1:9000/api/media/me \
-H "Authorization: Bearer $USER_TOKEN")
GLOBAL_MEDIA=$(curl -s -X GET http://127.0.0.1:9000/api/media \
-H "Authorization: Bearer $ADMIN_TOKEN")

echo "-----------------------------------"
echo "⚡ Validating results..."

# Count media
ADMIN_COUNT=$(echo $ADMIN_MEDIA | jq length)
USER_COUNT=$(echo $USER_MEDIA | jq length)
GLOBAL_COUNT=$(echo $GLOBAL_MEDIA | jq length)

# Check captions
ADMIN_CAPTIONS=$(echo $ADMIN_MEDIA | jq -r '.[].caption')
USER_CAPTIONS=$(echo $USER_MEDIA | jq -r '.[].caption')

PASS=true

if [[ $ADMIN_COUNT -ne 2 ]]; then
  echo "❌ Admin media count incorrect: $ADMIN_COUNT (expected 2)"
  PASS=false
else
  echo "✅ Admin media count correct: $ADMIN_COUNT"
fi

if [[ $USER_COUNT -ne 2 ]]; then
  echo "❌ User media count incorrect: $USER_COUNT (expected 2)"
  PASS=false
else
  echo "✅ User media count correct: $USER_COUNT"
fi

if [[ $GLOBAL_COUNT -lt 4 ]]; then
  echo "❌ Global feed count incorrect: $GLOBAL_COUNT (expected >=4)"
  PASS=false
else
  echo "✅ Global feed count correct: $GLOBAL_COUNT"
fi

echo "✅ Admin captions:"
echo "$ADMIN_CAPTIONS"
echo "✅ User captions:"
echo "$USER_CAPTIONS"

echo "-----------------------------------"
if [ "$PASS" = true ]; then
  echo "🎉 Phase 4 real-time validation PASSED!"
else
  echo "⚠️ Phase 4 real-time validation FAILED!"
fi
