// Phase 6 – Fully Dynamic Multi-User Real-Time Test
import { io } from "socket.io-client";
import fetch from "node-fetch";

// ---------- CONFIG ----------
const BASE_URL = "http://localhost:9000";
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyIiwi..."; // Admin token
const ADMIN_NAME = "Admin";

// ---------- UTILITY ----------
async function fetchUsers() {
  const res = await fetch(`${BASE_URL}/api/admin/users`, {
    headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
  });
  const data = await res.json();
  // Exclude Admin
  return data.filter((u) => u.role !== "admin");
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
  console.log("🔹 Phase 6 Fully Dynamic Multi-User Test Starting...");

  // Fetch all users dynamically
  const users = await fetchUsers();
  console.log(`👥 Found ${users.length} user(s) in the system.`);

  // Connect Admin
  const admin = await connectClient(ADMIN_NAME, ADMIN_TOKEN);

  // Connect all users
  const userClients = [];
  for (const user of users) {
    const client = await connectClient(user.name, user.token); // assumes token stored in user object
    userClients.push(client);
  }

  // Admin uploads media
  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 6 Dynamic Multi-User Media",
  };
  console.log("📸 [Admin] Uploading media:", testMedia);
  admin.client.emit("newMedia", testMedia);

  // Wait for media to propagate
  await new Promise((r) => setTimeout(r, 1500));

  // Capture media ID
  const mediaId = admin.state.mediaId;
  if (!mediaId) {
    console.error("❌ Could not get media ID. Aborting test.");
    process.exit(1);
  }

  // Users like and comment
  for (const user of userClients) {
    user.client.emit("likeMedia", { mediaId });
    user.client.emit("commentMedia", { mediaId, text: `Nice post from ${user.state.name}!` });
  }

  // Wait for events
  await new Promise((r) => setTimeout(r, 2000));

  // Disconnect all clients
  admin.client.disconnect();
  for (const user of userClients) user.client.disconnect();

  // ---------- SUMMARY ----------
  console.log("\n-----------------------------------");
  console.log("📝 Phase 6 Dynamic Multi-User Summary:");
  console.log(`Admin uploaded: ${admin.state.uploaded ? "✅" : "❌"}`);
  for (const user of userClients) {
    console.log(
      `${user.state.name} liked: ${user.state.liked ? "✅" : "❌"}, commented: ${user.state.commented ? "✅" : "❌"}`
    );
  }
  console.log("-----------------------------------\n");
  console.log("✅ Phase 6 Dynamic Multi-User Test Completed!");
})();
