import createHttpError from 'http-errors';
import { 
    registerUser, 
    createSession, 
    refreshSession, 
    logoutSession, 
    loginUser, 
    logoutSessionsByUserId,
    sendResetPasswordEmail,
    resetPasswordWithToken
} from '../services/auth.js';

export const registerUserController = async (req, res, next) => {
    try {
        const user = await registerUser(req.body);

        await logoutSessionsByUserId(user._id); 

        const { accessToken, refreshToken } = await createSession(user._id);
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
        });

        res.status(201).json({
            status: 201,
            message: 'Successfully registered a user!',
            data: { user, accessToken },
        });
    } catch (err) {
        next(err);
    }
};

export const refreshUserController = async (req, res, next) => {
    try {
        const refreshToken =
            req.cookies?.refreshToken ||
            req.headers['authorization']?.replace('Bearer ', '');

        if (!refreshToken) {
            throw createHttpError(401, 'No refresh token provided');
        }

        const { accessToken, refreshToken: newRefreshToken } = await refreshSession(refreshToken);
        const isProduction = process.env.NODE_ENV === 'production';

        res
            .cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: isProduction, 
                sameSite: 'strict',
            })
            .status(200)
            .json({
                status: 200,
                message: 'Successfully refreshed a session!',
                data: { accessToken },
            });
    } catch (err) {
        next(err);
    }
};

export const logoutController = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            throw createHttpError(401, 'No refresh token provided');
        }

        
        await logoutSession(refreshToken);

        
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

export const loginUserController = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const { accessToken, refreshToken } = await loginUser(email, password);

        const isProduction = process.env.NODE_ENV === 'production';

        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction, 
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        res.status(200).json({
            status: 200,
            message: 'Successfully logged in an user!',
            data: { accessToken },
        });
    } catch (err) {
        next(err);
    }
};

export const sendResetEmailController = async (req, res, next) => {
    try {
        const { email } = req.body;

        await sendResetPasswordEmail(email);

        res.status(200).json({
            status: 200,
            message: 'Reset password email has been successfully sent.',
            data: {},
        });
    } catch (err) {
        next(err);
    }
};

export const resetPasswordController = async (req, res, next) => { 

    try {
        const { token, password } = req.body;

        await resetPasswordWithToken(token, password);

        res.status(200).json({
            status: 200,
            message: 'Password has been successfully reset.',
            data: {},
        });
    } catch (error) {
        next(error);

    }
};