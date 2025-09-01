import express from "express";
import {
  registerController,
  loginController,
  logoutController,
  sendResetEmailController,
  resetPasswordController,
  refreshController,
} from "../controllers/auth.js";
import { validateBody } from "../middlewares/validateBody.js";
import { registerSchema, loginSchema } from "../validation/authValidation.js";
import sendResetEmailSchema from "../validation/sendResetEmailSchema.js";
import resetPasswordSchema from "../validation/resetPasswordSchema.js";

const router = express.Router();

// -------------------- AUTH ROUTES --------------------
router.post("/register", validateBody(registerSchema), registerController);
router.post("/login", validateBody(loginSchema), loginController);

// refresh за кукі або з body
router.post("/refresh", refreshController);

// логаут — за кукі або з body
router.post("/logout", logoutController);

// -------------------- PASSWORD RESET --------------------
router.post(
  "/send-reset-email",
  validateBody(sendResetEmailSchema),
  sendResetEmailController
);
router.post("/reset-pwd", validateBody(resetPasswordSchema), resetPasswordController);

export default router;
