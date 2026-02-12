import jwt from "jsonwebtoken";

export const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Not authorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach user info to socket
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};
