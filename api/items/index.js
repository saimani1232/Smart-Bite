// Inventory Items API - GET all, POST new
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../lib/mongodb.js';
import { authenticateRequest } from '../lib/auth.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Authenticate
    const user = await authenticateRequest(req);
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { db } = await connectToDatabase();
        const itemsCollection = db.collection('items');

        // GET - Fetch all items for user
        if (req.method === 'GET') {
            const items = await itemsCollection
                .find({ userId: user.userId })
                .sort({ createdAt: -1 })
                .toArray();

            // Transform _id to id for frontend compatibility
            const transformedItems = items.map(item => ({
                id: item._id.toString(),
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                category: item.category,
                expiryDate: item.expiryDate,
                isOpened: item.isOpened || false,
                reminderDays: item.reminderDays || 0,
                reminderEmail: item.reminderEmail || '',
                reminderSent: item.reminderSent || false
            }));

            return res.status(200).json(transformedItems);
        }

        // POST - Create new item
        if (req.method === 'POST') {
            const { name, quantity, unit, category, expiryDate, isOpened, reminderDays, reminderEmail } = req.body || {};

            if (!name || !quantity || !unit || !category || !expiryDate) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const newItem = {
                userId: user.userId,
                name,
                quantity: parseFloat(quantity),
                unit,
                category,
                expiryDate,
                isOpened: isOpened || false,
                reminderDays: reminderDays || 0,
                reminderEmail: reminderEmail || '',
                reminderSent: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await itemsCollection.insertOne(newItem);

            return res.status(201).json({
                id: result.insertedId.toString(),
                ...newItem
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Items API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
