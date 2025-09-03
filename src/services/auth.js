
import { UsersCollection } from '../db/models/user.js';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SessionsCollection } from '../db/models/session.js';
import { sendMail } from '../utils/sendMail.js';
import handlebars from 'handlebars';
import path from 'node:path';
import fs from 'node:fs/promises';
import { TEMPLATES_DIR, SMTP } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';

export const registerUser = async (payload) => {
    const { email, password, name } = payload;

    const existingUser = await UsersCollection.findOne({ email });
    if (existingUser) {
        throw createHttpError(409, 'Email in use');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    

    
    const newUser = await UsersCollection.create({
        name,
        email,
        password: hashedPassword,

    });

    const userObject = newUser.toObject();
    delete userObject.password;

    return userObject;
};

export const createSession = async (userId) => {
    const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET;

    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
        throw new Error('JWT secrets are not defined in environment variables!');
    }

    const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: '30d' });

    const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await SessionsCollection.create({
        userId,
        accessToken,
        refreshToken,
        accessTokenValidUntil,
        refreshTokenValidUntil,
    });

    return { accessToken, refreshToken };
};

export const refreshSession = async (refreshToken) => {
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

    
    const session = await SessionsCollection.findOne({ refreshToken });
    if (!session) {
        throw createHttpError(401, 'Invalid refresh token');
    }

    if (new Date() > session.refreshTokenValidUntil) {
        throw createHttpError(401, 'Refresh token expired');
    }


    await SessionsCollection.deleteOne({ _id: session._id });

    const accessToken = jwt.sign(
        { userId: session.userId },
        ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
        { userId: session.userId },
        REFRESH_TOKEN_SECRET,
        { expiresIn: '30d' }
    );
  
    const accessTokenValidUntil = new Date(Date.now() + 15 * 60 * 1000);
    const refreshTokenValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await SessionsCollection.create({
        userId: session.userId,
        accessToken,
        refreshToken: newRefreshToken,
        accessTokenValidUntil,
        refreshTokenValidUntil,
    });

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};

export const logoutSession = async (refreshToken) => {
    const session = await SessionsCollection.findOneAndDelete({ refreshToken });
    if (!session) {
        throw createHttpError(401, 'Invalid session');
    }
};

export const logoutSessionsByUserId = async (userId) => {
    await SessionsCollection.deleteMany({ userId });
};

export const loginUser = async (email, password) => {
    const user = await UsersCollection.findOne({ email });
    if (!user) {
        throw createHttpError(401, 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw createHttpError(401, 'Invalid email or password');
    }

    await logoutSessionsByUserId(user._id);

    const { accessToken, refreshToken } = await createSession(user._id);

    const userObject = user.toObject();
    delete userObject.password;

    return { user: userObject, accessToken, refreshToken };
};


export const sendResetPasswordEmail = async (email) => {
    const user = await UsersCollection.findOne({ email });
    if (!user) {
        throw createHttpError(404, 'User not found!');
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    const APP_DOMAIN = process.env.APP_DOMAIN;

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '5m' });

    const resetLink = `${APP_DOMAIN}/reset-password?token=${token}`;

    
    const wasSent = await sendMail({
        to: email,
        subject: 'Password reset',
        html: `<p>To reset your password click <a href="${resetLink}">here</a><br/>Або скопіюйте це посилання в браузер:<br/>${resetLink}</p>`
    });

    if (!wasSent) {
        throw createHttpError(500, 'Failed to send the email, please try again later.');
    }

    return true;
};

export const resetPasswordWithToken = async (token, newPassword) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        throw createHttpError(401, 'Token is expired or invalid.');
    }

    const user = await UsersCollection.findOne({ email: payload.email });
    if (!user) {
        throw createHttpError(404, 'User not found!');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    await logoutSessionsByUserId(user._id);

    return true;
};

export const requestResetToken = async (email) => {
  const user = await UsersCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }
  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar('JWT_SECRET'),
    {
      expiresIn: '15m',
    },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendMail({
    to: email,
    subject: 'Reset your password',
    html,
  });
};