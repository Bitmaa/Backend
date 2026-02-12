import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    const adminUser = await User.create({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin user created:", adminUser);

    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
  } catch (err) {
    console.error(err);
  }
};

run();
