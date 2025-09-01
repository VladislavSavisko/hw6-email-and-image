import * as authService from "../services/auth.js";

// -------------------- REGISTER --------------------
export const registerController = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json({
      status: 201,
      message: "User registered successfully",
      data: { user }, // без пароля (ховається в toJSON)
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- LOGIN --------------------
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken, refreshCookieOptions } =
      await authService.loginUser({ email, password });

    // записуємо refreshToken у httpOnly cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(200).json({
      status: 200,
      message: "Login successful",
      data: { user, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- REFRESH --------------------
export const refreshController = async (req, res, next) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const refreshToken = tokenFromCookie || tokenFromBody;

    const { accessToken, newRefreshToken, refreshCookieOptions, user } =
      await authService.refreshTokens(refreshToken);

    // оновлюємо refreshToken у cookie (ротація)
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    res.status(200).json({
      status: 200,
      message: "Tokens refreshed",
      data: { user, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// -------------------- LOGOUT --------------------
export const logoutController = async (req, res, next) => {
  try {
    const tokenFromCookie = req.cookies?.refreshToken;
    const tokenFromBody = req.body?.refreshToken;
    const refreshToken = tokenFromCookie || tokenFromBody;

    await authService.logoutUser(refreshToken);

    // чистимо кукі
    res.clearCookie("refreshToken");
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
    // після ресету паролю поточні сесії видаляються
    res.clearCookie("refreshToken");
    res.status(200).json({
      status: 200,
      message: "Password has been successfully reset.",
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
