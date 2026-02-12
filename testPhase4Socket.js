import { io } from "socket.io-client";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Admin credentials
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123!";

// Server URL
const SERVER_URL = "http://127.0.0.1:9000";

async function main() {
  try {
    // 1️⃣ Login as admin to get token
    const res = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    const token = data.token;

    if (!token) {
      console.error("❌ Failed to get token:", data);
      return;
    }
    console.log("✅ Got token:", token);

    // 2️⃣ Connect to Socket.IO with token
    const socket = io(SERVER_URL, {
      auth: { token },
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected, id:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("⚠️ Socket disconnected:", reason);
    });

    // 3️⃣ Listen for real-time events
    socket.on("newMedia", (media) => {
      console.log("📡 New media received:", media);
    });

    // 4️⃣ Example: emit test event (optional)
    socket.emit("testEvent", { message: "Hello from testPhase4Socket!" });

  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
