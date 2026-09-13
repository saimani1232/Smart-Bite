// User Registration API (Firebase Firestore)
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

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        let db;
        try {
            db = getFirestoreDb();
        } catch (dbError) {
            console.error('Database connection error in /auth/register:', dbError.message);
            return res.status(503).json({ 
                error: 'Cloud database not configured',
                details: dbError.message 
            });
        }

        const usersCollection = db.collection('users');

        // Check if username already exists
        const existingUsers = await usersCollection
            .where('username', '==', username.toLowerCase())
            .limit(1)
            .get();

        if (!existingUsers.empty) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in Firestore
        const now = new Date();
        const docRef = await usersCollection.add({
            username: username.toLowerCase(),
            password: hashedPassword,
            createdAt: now,
            updatedAt: now
        });

        // Generate token
        const token = generateToken(docRef.id, username.toLowerCase());

        return res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: docRef.id,
                username: username.toLowerCase()
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}
