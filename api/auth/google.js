// Google Authentication API - Verify Google token and create/login user
import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../lib/mongodb.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

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

        if (!JWT_SECRET) {
            console.error('JWT_SECRET not configured');
            return res.status(500).json({ error: 'Server configuration error' });
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

        console.log('Google user:', { googleId, email, name });

        // Connect to database
        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Find existing user by Google ID or email
        let user = await usersCollection.findOne({
            $or: [
                { googleId },
                { email: email.toLowerCase() }
            ]
        });

        if (user) {
            // Update existing user with Google info if not already set
            if (!user.googleId) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    { 
                        $set: { 
                            googleId,
                            picture,
                            updatedAt: new Date()
                        }
                    }
                );
            }
            console.log('Existing user logged in:', user.username || user.email);
        } else {
            // Create new user
            const newUser = {
                username: name.toLowerCase().replace(/\s+/g, '_'),
                email: email.toLowerCase(),
                googleId,
                picture,
                // Random password for Google users (they can't use password login)
                password: await bcrypt.hash(Math.random().toString(36), 10),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await usersCollection.insertOne(newUser);
            user = { _id: result.insertedId, ...newUser };
            console.log('New Google user created:', user.username);
        }

        // Generate JWT
        const token = jwt.sign(
            { 
                userId: user._id.toString(), 
                username: user.username || name,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id.toString(),
                username: user.username || name,
                email: user.email,
                picture: user.picture || picture
            }
        });

    } catch (error) {
        console.error('Google auth error:', error);
        return res.status(500).json({ error: 'Authentication failed', details: error.message });
    }
}
