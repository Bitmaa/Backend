k// Phase 6 – Multi-User Real-Time Validation (Automated Media ID)
import { io } from "socket.io-client";
import fetch from "node-fetch";

// ---------- CONFIG ----------
const BASE_URL = "http://localhost:9000";
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyIiwi..."; // your admin token
const USER1_TOKEN = "YOUR_USER1_TOKEN"; // replace with real token
const USER2_TOKEN = "YOUR_USER2_TOKEN"; // replace with real token

// ---------- UTILITY ----------
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
      if (name === "Admin" && !state.uploaded) {
        state.uploaded = true;
        state.mediaId = media._id; // capture real media ID
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
  console.log("🔹 Phase 6 Multi-User Real-Time Validation (Automated) Starting...");

  // Connect all clients
  const admin = await connectClient("Admin", ADMIN_TOKEN);
  const user1 = await connectClient("User1", USER1_TOKEN);
  const user2 = await connectClient("User2", USER2_TOKEN);

  // Admin uploads media
  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 6 Auto Test Media",
  };
  console.log("📸 [Admin] Uploading media:", testMedia);
  admin.client.emit("newMedia", testMedia);

  // Wait for admin's media to propagate
  await new Promise((r) => setTimeout(r, 1500));

  // Capture the media ID
  const mediaId = admin.state.mediaId;
  if (!mediaId) {
    console.error("❌ Could not get media ID. Aborting test.");
    process.exit(1);
  }

  // Users like and comment
  user1.client.emit("likeMedia", { mediaId });
  user2.client.emit("likeMedia", { mediaId });

  user1.client.emit("commentMedia", { mediaId, text: "Nice post!" });
  user2.client.emit("commentMedia", { mediaId, text: "Cool!" });

  // Wait for events to propagate
  await new Promise((r) => setTimeout(r, 2000));

  // Disconnect all clients
  admin.client.disconnect();
  user1.client.disconnect();
  user2.client.disconnect();

  // ---------- SUMMARY ----------
  console.log("\n-----------------------------------");
  console.log("📝 Phase 6 Multi-User Summary (Automated):");
  console.log(`Admin uploaded: ${admin.state.uploaded ? "✅" : "❌"}`);
  console.log(`User1 liked: ${user1.state.liked ? "✅" : "❌"}, commented: ${user1.state.commented ? "✅" : "❌"}`);
  console.log(`User2 liked: ${user2.state.liked ? "✅" : "❌"}, commented: ${user2.state.commented ? "✅" : "❌"}`);
  console.log("-----------------------------------\n");
  console.log("✅ Phase 6 completed successfully.");
})();
