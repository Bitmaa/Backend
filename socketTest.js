// socketTest.js
import { io } from "socket.io-client";

// Replace with your real admin token
const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OGFkZGQyNmU0ZmI2M2IzMTliZTEyYiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MDcxMDA2NiwiZXhwIjoxNzcxMzE0ODY2fQ.Dg9m3yjLSMNzLHCWT5edwI2ycwdcTJnzmN2nVs-CZDg";

const socket = io("http://localhost:9000", {
  auth: { token: ADMIN_TOKEN },
});

socket.on("connect", () => {
  console.log("✅ Connected to server:", socket.id);

  // Emit a test media upload
  const testMedia = {
    url: "test.jpg",
    type: "image",
    caption: "Phase 4 Test Media Upload",
  };

  console.log("📸 Sending test media:", testMedia);
  socket.emit("newMedia", testMedia);

  // End test after a short delay
  setTimeout(() => {
    console.log("⏱ Ending test, disconnecting...");
    socket.disconnect();
  }, 2000);
});

socket.on("mediaUpdate", (data) => {
  console.log("📣 Media update received:", data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});
