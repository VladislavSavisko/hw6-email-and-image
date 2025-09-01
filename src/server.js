import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import contactsRouter from "./routers/contacts.js";
import authRouter from "./routers/auth.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFoundHandler from "./middlewares/notFoundHandler.js";
import { initMongoConnection } from "./db/initMongoConnection.js";

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// routes
app.use("/auth", authRouter);
app.use("/contacts", contactsRouter); // 👈 тут вже без authenticate

// handlers
app.use(notFoundHandler);
app.use(errorHandler);

// DB connection
const { MONGODB_USER, MONGODB_PASSWORD, MONGODB_URL, MONGODB_DB } = process.env;

if (!MONGODB_USER || !MONGODB_PASSWORD || !MONGODB_URL || !MONGODB_DB) {
  console.error("❌ Missing MongoDB environment variables in .env file");
  process.exit(1);
}

const MONGO_URI = `mongodb+srv://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_URL}/${MONGODB_DB}?retryWrites=true&w=majority`;

initMongoConnection(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
