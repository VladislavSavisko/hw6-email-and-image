import nodemailer from "nodemailer";
import dotenv from "dotenv";
import createHttpError from "http-errors";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // 587 = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendResetEmail = async (to, link) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: "Reset your password",
      html: `<p>Click the link below to reset your password:</p>
             <p><a href="${link}">${link}</a></p>
             <p>If you didn't request this, you can safely ignore this email.</p>`,
    });
  } catch (err) {
    throw createHttpError(500, "Failed to send the email, please try again later.");
  }
};
