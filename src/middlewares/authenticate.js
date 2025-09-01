import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import User from "../models/User.js";
import Session from "../models/Session.js";
import dotenv from "dotenv";

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;

export const authenticate = async (req, res, next) => {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not defined in .env");
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) throw createHttpError(401, "No access token provided");

    let payload;
    try {
      payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw createHttpError(401, "Access token expired");
      }
      throw createHttpError(401, "Invalid access token");
    }

    const session = await Session.findOne({ userId: payload.id, accessToken: token });
    if (!session) throw createHttpError(401, "Session expired or invalid");

    const user = await User.findById(payload.id);
    if (!user) throw createHttpError(401, "User not found");

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (err) {
    next(err);
  }
};
