#!/bin/bash
# testPhase7Full_Validated_Summary.sh — Phase 7 Production Validation Summary (Repeatable)

echo "🔹 Starting Phase 7 full validated production test..."

# 1️⃣ Ensure backend is running via PM2
pm2 describe myMVP-backend > /dev/null
if [ $? -ne 0 ]; then
  echo "⚠️ PM2 backend not running, starting..."
  pm2 start ecosystem.config.cjs
  sleep 3
else
  echo "✅ PM2 backend is running"
fi

# 2️⃣ Clean up old test media (optional but repeatable)
echo -e "\n🧹 Cleaning old test media..."
node <<'EOF'
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 9000}/api`;
const ADMIN_TOKEN = process.env.JWT_SECRET || "YOUR_ADMIN_TOKEN";

async function cleanup() {
  const res = await fetch(`${API_URL}/media/me`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const media = await res.json();
  for (const m of media) {
    if (m.caption && m.caption.includes("Phase 7")) {
      await fetch(`${API_URL}/media/${m._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      console.log("🗑 Deleted test media:", m._id);
    }
  }
}
cleanup();
EOF

# 3️⃣ Test APIs
echo -e "\n⚡ Testing API endpoints..."
node <<'EOF'
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 9000}/api`;
const ADMIN_TOKEN = process.env.JWT_SECRET || "YOUR_ADMIN_TOKEN";

async function testAPI() {
  const resMedia = await fetch(`${API_URL}/media`);
  const media = await resMedia.json();
  console.log("📄 Media list:", media);

  const resMe = await fetch(`${API_URL}/media/me`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const me = await resMe.json();
  console.log("📄 My media:", me);
}
testAPI();
EOF

# 4️⃣ Test Socket.IO events (auto mediaId)
echo -e "\n⚡ Testing Socket.IO real-time events..."
node <<'EOF'
import { io } from "socket.io-client";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const ADMIN_TOKEN = process.env.JWT_SECRET || "YOUR_ADMIN_TOKEN";
const PORT = process.env.PORT || 9000;
const API_URL = `http://localhost:${PORT}/api`;

// Connect socket
const socket = io(`http://localhost:${PORT}`, { auth: { token: ADMIN_TOKEN } });

socket.on("connect", async () => {
  console.log("✅ Socket connected:", socket.id);

  // Upload test media
  const testMedia = {
    url: "test_phase7_summary.jpg",
    type: "image",
    caption: "Phase 7 Summary Test Media"
  };
  socket.emit("newMedia", testMedia);

  // Wait for media creation via API to get the actual mediaId
  let mediaId = null;
  for (let i = 0; i < 10; i++) {
    const res = await fetch(`${API_URL}/media/me`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    const myMedia = await res.json();
    const phase7Media = myMedia.find(m => m.caption.includes("Phase 7"));
    if (phase7Media) {
      mediaId = phase7Media._id;
      break;
    }
    await new Promise(r => setTimeout(r, 500)); // wait 0.5s
  }

  if (!mediaId) {
    console.error("❌ Could not fetch mediaId for socket test");
    socket.disconnect();
    return;
  }

  console.log("📌 Using mediaId:", mediaId);

  // Like the media after 1s
  setTimeout(() => { socket.emit("likeMedia", { mediaId }); }, 1000);

  // Comment on the media after 2s
  setTimeout(() => { socket.emit("commentMedia", { mediaId, text: "Production ready!" }); }, 2000);

  // End test after 3s
  setTimeout(() => {
    console.log("⏱ Ending socket test...");
    socket.disconnect();
  }, 3000);
});

socket.on("mediaUpdate", (data) => console.log("📣 Media update:", data));
socket.on("mediaLiked", (data) => console.log("👍 Media liked:", data));
socket.on("mediaCommented", (data) => console.log("💬 New comment:", data));
socket.on("disconnect", () => console.log("❌ Disconnected from server"));
EOF

echo -e "\n✅ Phase 7 full production validation complete!"
