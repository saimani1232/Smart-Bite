// User Login API (Firebase Firestore)
import bcrypt from 'bcryptjs';
import { getFirestoreDb } from '../lib/firestore.js';
import { generateToken } from '../lib/auth.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body || {};

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        let db;
        try {
            db = getFirestoreDb();
        } catch (dbError) {
            console.error('Database connection error in /auth/login:', dbError.message);
            return res.status(503).json({ 
                error: 'Cloud database not configured',
                details: dbError.message 
            });
        }

        const usersCollection = db.collection('users');

        // Find user by username
        const snapshot = await usersCollection
            .where('username', '==', username.toLowerCase())
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = generateToken(userDoc.id, user.username);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: userDoc.id,
                username: user.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
