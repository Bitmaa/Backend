// Phase 6 – Fully Automated Multi-User Test
import { io } from "socket.io-client";
import fetch from "node-fetch";

// ---------- CONFIG ----------
const BASE_URL = "http://localhost:9000";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin123!";
const ADMIN_NAME = "Admin";

// ---------- UTILITY ----------
async function loginUser(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Login failed for ${email}`);
  return { token: data.token, id: data.user.id, name: data.user.name };
}

async function fetchUsers(adminToken) {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const users = await res.json();
  return users.filter((u) => u.role !== "admin");
}

function connectClient(name, token) {
  return new Promise((resolve) => {
    const client = io(BASE_URL, { auth: { token } });
    const state = {
      name,
      connected: false,
      uploaded: false,
      liked: false,
      commented: false,
      mediaId: null,
    };

    client.on("connect", () => {
      state.connected = true;
      console.log(`⚡ [${name}] Connected via Socket.IO: ${client.id}`);
      resolve({ client, state });
    });

    client.on("mediaUpdate", (media) => {
      console.log(`📣 [${name}] mediaUpdate received: ${media.caption}`);
      if (name === ADMIN_NAME && !state.uploaded) {
        state.uploaded = true;
        state.mediaId = media._id;
      }
    });

    client.on("mediaLiked", (data) => {
      console.log(`👍 [${name}] mediaLiked: ${data.mediaId}`);
      state.liked = true;
    });

    client.on("mediaCommented", (data) => {
      console.log(`💬 [${name}] mediaCommented: ${data.mediaId}`);
      state.commented = true;
    });

    client.on("disconnect", () => console.log(`❌ [${name}] Disconnected`));
  });
}

// ---------- MAIN ----------
(async () => {
  console.log("🔹 Phase 6 Fully Automated Multi-User Test Starting...");

  // 1️⃣ Log in as Admin
  const adminLogin = await loginUser(ADMIN_EMAIL, ADMIN_PASSWORD);
  const admin = await connectClient(ADMIN_NAME, adminLogin.token);

  // 2️⃣ Fetch all users
  const usersList = await fetchUsers(adminLogin.token);
  console.log(`👥 Found ${usersList.length} user(s) in the system.`);

  // 3️⃣ Log in dynamically as each user and connect via Socket.IO
  const userClients = [];
  for (const u of usersList) {
    // Here we assume test users have same password pattern; adjust as needed
    const login = await loginUser(u.email, "User123!"); // replace with real test password
    const client = await connectClient(u.name, login.token);
    userClients.push(client);
  }

  // 4️⃣ Admin uploads media
  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 6 Fully Automated Test Media",
  };
  console.log("📸 [Admin] Uploading media:", testMedia);
  admin.client.emit("newMedia", testMedia);

  // 5️⃣ Wait for media propagation
  await new Promise((r) => setTimeout(r, 1500));
  const mediaId = admin.state.mediaId;
  if (!mediaId) {
    console.error("❌ Could not get media ID. Aborting test.");
    process.exit(1);
  }

  // 6️⃣ Users like and comment
  for (const user of userClients) {
    user.client.emit("likeMedia", { mediaId });
    user.client.emit("commentMedia", { mediaId, text: `Nice post from ${user.state.name}!` });
  }

  // 7️⃣ Wait for events
  await new Promise((r) => setTimeout(r, 2000));

  // 8️⃣ Disconnect all clients
  admin.client.disconnect();
  for (const user of userClients) user.client.disconnect();

  // 9️⃣ Summary
  console.log("\n-----------------------------------");
  console.log("📝 Phase 6 Fully Automated Multi-User Summary:");
  console.log(`Admin uploaded: ${admin.state.uploaded ? "✅" : "❌"}`);
  for (const user of userClients) {
    console.log(
      `${user.state.name} liked: ${user.state.liked ? "✅" : "❌"}, commented: ${user.state.commented ? "✅" : "❌"}`
    );
  }
  console.log("-----------------------------------\n");
  console.log("✅ Phase 6 Fully Automated Test Completed!");
})();
