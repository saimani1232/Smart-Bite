// Auth utility functions
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbite-secret-key-change-in-production';

export function generateToken(userId, username) {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function getTokenFromHeader(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

export async function authenticateRequest(req) {
    const token = getTokenFromHeader(req);
    if (!token) {
        return null;
    }
    return verifyToken(token);
}
