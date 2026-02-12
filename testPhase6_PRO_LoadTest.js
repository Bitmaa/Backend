// Phase 6 PRO – Real-Time Load + Stress Test
import { io } from "socket.io-client";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:9000";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123!";
const USER_PASSWORD = "User123!";

const MEDIA_COUNT = 10; // Number of posts to simulate

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function fetchUsers(token) {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
}

function connectSocket(name, token) {
  return new Promise(resolve => {
    const socket = io(BASE_URL, { auth: { token }});
    const stats = { name, connected: false, received: 0, liked: 0, commented: 0 };

    socket.on("connect", () => {
      console.log(`⚡ [${name}] connected`);
      stats.connected = true;
      resolve({ socket, stats });
    });

    socket.on("mediaUpdate", () => stats.received++);
    socket.on("mediaLiked", () => stats.liked++);
    socket.on("mediaCommented", () => stats.commented++);
  });
}

(async () => {
  console.log("\n🚀 Phase 6 PRO Load + Stress Test Starting...\n");

  const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const admin = await connectSocket("ADMIN", adminLogin.token);

  const users = (await fetchUsers(adminLogin.token)).filter(u => u.role !== "admin");

  const clients = [];
  for (const u of users) {
    const loginData = await login(u.email, USER_PASSWORD);
    clients.push(await connectSocket(u.name, loginData.token));
  }

  console.log(`\n👥 Users connected: ${clients.length}`);

  for (let i = 1; i <= MEDIA_COUNT; i++) {
    console.log(`📸 Uploading media ${i}/${MEDIA_COUNT}`);
    admin.socket.emit("newMedia", {
      url: "test.jpg",
      type: "image",
      caption: `Phase 6 PRO Test Post #${i}`
    });

    await new Promise(r => setTimeout(r, 400));
  }

  await new Promise(r => setTimeout(r, 2000));

  for (const client of clients) {
    for (let i = 0; i < MEDIA_COUNT; i++) {
      client.socket.emit("likeMedia", { mediaId: "AUTO" });
      client.socket.emit("commentMedia", { mediaId: "AUTO", text: "Stress test 👍" });
    }
  }

  await new Promise(r => setTimeout(r, 3000));

  console.log("\n-----------------------------------");
  console.log("📊 Phase 6 PRO Stress Test Summary");

  for (const c of clients) {
    console.log(`${c.stats.name}: received=${c.stats.received}, liked=${c.stats.liked}, commented=${c.stats.commented}`);
  }

  console.log("-----------------------------------");

  admin.socket.disconnect();
  clients.forEach(c => c.socket.disconnect());

  console.log("\n✅ Phase 6 PRO Load Test Completed\n");
})();

