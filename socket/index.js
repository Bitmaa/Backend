import jwt from "jsonwebtoken";
import { socketAuth } from "./socket/index.js";

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("🔥 User connected:", socket.user.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.user.id);
  });
});

export const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};
