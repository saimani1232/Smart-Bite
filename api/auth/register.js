// User Registration API
const bcrypt = require('bcryptjs');
const { connectToDatabase } = require('../lib/mongodb');
const { generateToken } = require('../lib/auth');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
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
        const { username, password } = req.body;

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

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Check if username already exists
        const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await usersCollection.insertOne({
            username: username.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date()
        });

        // Generate token
        const token = generateToken(result.insertedId.toString(), username.toLowerCase());

        return res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: result.insertedId.toString(),
                username: username.toLowerCase()
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
