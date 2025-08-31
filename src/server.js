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
import { authenticate } from "./middlewares/authenticate.js";

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());
app.use(cookieParser()); 


app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});


app.use("/auth", authRouter);


app.use("/contacts", authenticate, contactsRouter);


app.use(notFoundHandler);
app.use(errorHandler);


const MONGO_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URL}/${process.env.MONGODB_DB}?retryWrites=true&w=majority`;

if (!process.env.MONGODB_USER || !process.env.MONGODB_PASSWORD || !process.env.MONGODB_URL || !process.env.MONGODB_DB) {
  console.error("Missing MongoDB environment variables in .env file");
  process.exit(1);
}

initMongoConnection(MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
