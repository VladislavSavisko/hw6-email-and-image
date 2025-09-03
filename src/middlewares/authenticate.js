import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { UsersCollection } from '../db/models/user.js';
import { SessionsCollection } from '../db/models/session.js'; 

export function checkRoles(roles = []) {
  return (req, res, next) => {
    
    next();
  };
}

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw createHttpError(401, 'Authorization header missing');
        }

        const [bearer, token] = authHeader.split(' ');

        if (bearer !== 'Bearer' || !token) {
            throw createHttpError(401, 'Invalid authorization format');
        }

        const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

        let payload;
        try {
            payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw createHttpError(401, 'Access token expired');
            }
            throw createHttpError(401, 'Invalid access token');
        }

        
        const session = await SessionsCollection.findOne({ accessToken: token });
        if (!session) {
            throw createHttpError(401, 'Session expired or invalid');
        }

        
        const user = await UsersCollection.findById(payload.userId).select('-password');
        if (!user) {
            throw createHttpError(401, 'User not found');
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
