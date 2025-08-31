import * as authService from "../services/auth.js";

// -------------------- REGISTER --------------------
export const registerController = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      status: 201,
      message: "User registered successfully",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- LOGIN --------------------
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser({ email, password });

    res.status(200).json({
      status: 200,
      message: "Login successful",
      data: { user, accessToken, refreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- LOGOUT --------------------
export const logoutController = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logoutUser(refreshToken);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

// -------------------- SEND RESET EMAIL --------------------
export const sendResetEmailController = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.sendResetEmail(email);
    res.status(200).json({
      status: 200,
      message: "Reset password email has been successfully sent.",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- RESET PASSWORD --------------------
export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.status(200).json({
      status: 200,
      message: "Password has been successfully reset.",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
