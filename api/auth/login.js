// User Login API
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

        const { db } = await connectToDatabase();
        const usersCollection = db.collection('users');

        // Find user
        const user = await usersCollection.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate token
        const token = generateToken(user._id.toString(), user.username);

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id.toString(),
                username: user.username
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
