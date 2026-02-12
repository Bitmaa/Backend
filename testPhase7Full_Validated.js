// testPhase7Full_Validated.js — Phase 7 Production Validation
import { io } from "socket.io-client";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Use admin token from environment or login API
const ADMIN_TOKEN = process.env.JWT_SECRET || "YOUR_ADMIN_TOKEN";

// Base URLs
const API_URL = `http://localhost:${process.env.PORT || 9000}/api`;

// -------------------- Helper functions ------------------
async function loginAdmin() {
  return ADMIN_TOKEN; // in prod, fetch from login endpoint if needed
}

// Test Socket.IO connection
async function testSocket() {
  const socket = io(`http://localhost:${process.env.PORT || 9000}`, {
    auth: { token: ADMIN_TOKEN },
  });

  socket.on("connect", () => {
    console.log("✅ Connected via Socket.IO:", socket.id);

    const testMedia = {
      url: "test_phase7.jpg",
      type: "image",
      caption: "Phase 7 Test Media Upload",
    };

    console.log("📸 Sending test media:", testMedia);
    socket.emit("newMedia", testMedia);

    // Like after 1s
    setTimeout(() => {
      socket.emit("likeMedia", { mediaId: "REPLACE_WITH_MEDIA_ID" });
    }, 1000);

    // Comment after 2s
    setTimeout(() => {
      socket.emit("commentMedia", { mediaId: "REPLACE_WITH_MEDIA_ID", text: "Production ready!" });
    }, 2000);

    // Disconnect after 3s
    setTimeout(() => {
      console.log("⏱ Ending Socket test...");
      socket.disconnect();
    }, 3000);
  });

  socket.on("mediaUpdate", (data) => console.log("📣 Media update:", data));
  socket.on("mediaLiked", (data) => console.log("👍 Media liked:", data));
  socket.on("mediaCommented", (data) => console.log("💬 New comment:", data));
  socket.on("disconnect", () => console.log("❌ Disconnected from server"));
}

// Test API endpoints
async function testAPIs() {
  console.log("\n⚡ Testing GET /api/media...");
  const resMedia = await fetch(`${API_URL}/media`);
  const media = await resMedia.json();
  console.log("📄 Media list:", media);

  console.log("\n⚡ Testing GET /api/media/me...");
  const resMe = await fetch(`${API_URL}/media/me`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const me = await resMe.json();
  console.log("📄 My media:", me);
}

// -------------------- Run Phase 7 Validation ------------------
(async () => {
  console.log("🔹 Starting Phase 7 full production validation...");
  await loginAdmin();
  await testAPIs();
  await testSocket();
})();
