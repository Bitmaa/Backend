// socketTestPhase5Auto.js — Phase 5 fully automated
import { io } from "socket.io-client";

// ✅ Real admin token inserted
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDcxMDA2NiwiZXhwIjoxNzcxMzE0ODY2fQ.Dg9m3yjLSMNzLHCWT5edwI2ycwdcTJnzmN2nVs-CZDg";

const socket = io("http://localhost:9000", {
  auth: { token: ADMIN_TOKEN },
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  // Step 1: Upload a test media
  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 5 Automated Test Media",
  };
  console.log("📸 Uploading test media:", testMedia);
  socket.emit("newMedia", testMedia);

  // Listen for the server to broadcast the new media
  socket.on("mediaUpdate", (media) => {
    if (media.caption === testMedia.caption) {
      console.log("📣 Media uploaded:", media);

      const mediaId = media._id;

      // Step 2: Like the media after 500ms
      setTimeout(() => {
        console.log("👍 Liking media:", mediaId);
        socket.emit("likeMedia", { mediaId });
      }, 500);

      // Step 3: Comment on the media after 1000ms
      setTimeout(() => {
        const commentText = "Automated comment for Phase 5!";
        console.log("💬 Commenting on media:", commentText);
        socket.emit("commentMedia", { mediaId, text: commentText });
      }, 1000);

      // Step 4: End test after 2 seconds
      setTimeout(() => {
        console.log("⏱ Ending test, disconnecting...");
        socket.disconnect();
      }, 2000);
    }
  });
});

// Listen for real-time events
socket.on("mediaLiked", (data) => console.log("👍 Media liked:", data));
socket.on("mediaCommented", (data) => console.log("💬 New comment:", data));
socket.on("disconnect", () => console.log("❌ Disconnected from server"));
