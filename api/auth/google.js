// Google Authentication API - Verify Google token and create/login user (Firebase Firestore)
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getFirestoreDb } from '../lib/firestore.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'smartbite-jwt-secret-persistent';

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
        const { credential } = req.body || {};

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        if (!GOOGLE_CLIENT_ID) {
            console.error('GOOGLE_CLIENT_ID not configured');
            return res.status(500).json({ error: 'Google Sign-In not configured' });
        }

        // Verify the Google token
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        
        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID
            });
        } catch (verifyError) {
            console.error('Token verification failed:', verifyError.message);
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const picture = payload.picture;

        let db;
        try {
            db = getFirestoreDb();
        } catch (dbError) {
            console.error('Database connection error in /auth/google:', dbError.message);
            return res.status(503).json({ 
                error: 'Cloud database not configured',
                details: dbError.message 
            });
        }

        const usersCollection = db.collection('users');

        // Find existing user by googleId
        let userDocId = null;
        let userData = null;

        let snapshot = await usersCollection.where('googleId', '==', googleId).limit(1).get();
        if (snapshot.empty && email) {
            snapshot = await usersCollection.where('email', '==', email.toLowerCase()).limit(1).get();
        }

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            userDocId = doc.id;
            userData = doc.data();

            // Update with googleId or picture if needed
            await doc.ref.update({
                googleId,
                picture: picture || userData.picture,
                updatedAt: new Date()
            });
        } else {
            // Create new Google user
            const newUser = {
                username: name.toLowerCase().replace(/\s+/g, '_'),
                email: email.toLowerCase(),
                googleId,
                picture,
                password: await bcrypt.hash(Math.random().toString(36), 10),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await usersCollection.add(newUser);
            userDocId = docRef.id;
            userData = newUser;
        }

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: userDocId, 
                username: userData.username || name,
                email: userData.email
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: userDocId,
                username: userData.username || name,
                email: userData.email,
                picture: userData.picture || picture
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        return res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
}
