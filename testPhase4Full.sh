#!/bin/bash
# Phase 4 Full Test Script — Socket.IO + Media API

# Replace with your real admin token
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDcxMDA2NiwiZXhwIjoxNzcxMzE0ODY2fQ.Dg9m3yjLSMNzLHCWT5edwI2ycwdcTJnzmN2nVs-CZDg"

echo "🔹 Starting Phase 4 test..."

# -------------------------------
# 1️⃣ Test Socket.IO Real-Time Media
# -------------------------------
echo "⚡ Testing Socket.IO connection and newMedia event..."

node <<'JS'
import { io } from "socket.io-client";

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const socket = io("http://localhost:9000", {
  auth: { token: ADMIN_TOKEN },
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 4 Full Test Upload",
  };

  console.log("📸 Sending test media:", testMedia);
  socket.emit("newMedia", testMedia);

  // Disconnect after 2 sec
  setTimeout(() => {
    console.log("⏱ Ending Socket.IO test, disconnecting...");
    socket.disconnect();
  }, 2000);
});

socket.on("mediaUpdate", (data) => {
  console.log("📣 Media update received:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
JS

# -------------------------------
# 2️⃣ Test Media API Endpoints
# -------------------------------
echo "-----------------------------------"
echo "⚡ Testing GET /api/media/me"
curl -X GET http://127.0.0.1:9000/api/media/me \
-H "Authorization: Bearer $ADMIN_TOKEN"
echo -e "\n-----------------------------------"

echo "⚡ Testing GET /api/media"
curl -X GET http://127.0.0.1:9000/api/media \
-H "Authorization: Bearer $ADMIN_TOKEN"
echo -e "\n-----------------------------------"

echo "✅ Phase 4 full test completed"
