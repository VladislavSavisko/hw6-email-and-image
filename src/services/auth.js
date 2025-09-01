import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Session from "../models/Session.js";

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const RESET_TOKEN_SECRET = process.env.JWT_SECRET || "reset_secret";
const APP_DOMAIN = process.env.APP_DOMAIN || "http://localhost:3000/auth";

// -------------------- Nodemailer Transporter (Brevo SMTP) --------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
};

// -------------------- helpers --------------------
const signAccess = (uid) =>
  jwt.sign({ id: uid }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });

const signRefresh = (uid) =>
  jwt.sign({ id: uid }, REFRESH_TOKEN_SECRET, { expiresIn: "30d" });

// -------------------- REGISTER --------------------
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw createHttpError(409, "Email in use");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword });
  return user.toJSON(); // без пароля
};

// -------------------- LOGIN --------------------
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw createHttpError(401, "Invalid email or password");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw createHttpError(401, "Invalid email or password");

  // однокористувацька сесія — гасимо попередні
  await Session.deleteMany({ userId: user._id });

  const accessToken = signAccess(user._id);
  const refreshToken = signRefresh(user._id);

  await Session.create({
    userId: user._id,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + 15 * 60 * 1000),
    refreshTokenValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken,
    refreshCookieOptions,
  };
};

// -------------------- REFRESH --------------------
export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) throw createHttpError(401, "No refresh token");

  let payload;
  try {
    payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
  } catch {
    throw createHttpError(401, "Invalid or expired refresh token");
  }

  const session = await Session.findOne({ userId: payload.id, refreshToken });
  if (!session) throw createHttpError(401, "Session expired or invalid");

  const user = await User.findById(payload.id);
  if (!user) throw createHttpError(401, "User not found");

  // ротація токенів
  const accessToken = signAccess(user._id);
  const newRefreshToken = signRefresh(user._id);

  session.accessToken = accessToken;
  session.refreshToken = newRefreshToken;
  session.accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000);
  session.refreshTokenValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await session.save();

  return {
    user: user.toJSON(),
    accessToken,
    newRefreshToken,
    refreshCookieOptions,
  };
};

// -------------------- LOGOUT --------------------
export const logoutUser = async (refreshToken) => {
  if (!refreshToken) throw createHttpError(401, "No refresh token");
  await Session.deleteOne({ refreshToken });
};

// -------------------- SEND RESET EMAIL --------------------
export const sendResetEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw createHttpError(404, "User not found!");

  const token = jwt.sign({ email }, RESET_TOKEN_SECRET, { expiresIn: "5m" });
  const resetLink = `${APP_DOMAIN}/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. The link is valid for 5 minutes.</p>`,
    });
  } catch {
    throw createHttpError(
      500,
      "Failed to send the email, please try again later."
    );
  }
};

// -------------------- RESET PASSWORD --------------------
export const resetPassword = async (token, newPassword) => {
  try {
    const { email } = jwt.verify(token, RESET_TOKEN_SECRET);

    const user = await User.findOne({ email });
    if (!user) throw createHttpError(404, "User not found!");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // вбиваємо всі сесії
    await Session.deleteMany({ userId: user._id });
  } catch {
    throw createHttpError(401, "Token is expired or invalid.");
  }
};
