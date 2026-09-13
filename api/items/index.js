// Inventory Items API - GET all, POST new (Firebase Firestore)
import { getFirestoreDb } from '../lib/firestore.js';
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
        let db;
        try {
            db = getFirestoreDb();
        } catch (dbErr) {
            console.error('Database connection error in /items:', dbErr.message);
            return res.status(503).json({
                error: 'Cloud database not configured',
                details: dbErr.message
            });
        }

        const itemsCollection = db.collection('items');

        // GET - Fetch all items for user
        if (req.method === 'GET') {
            const snapshot = await itemsCollection
                .where('userId', '==', user.userId)
                .get();

            const items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                items.push({
                    id: doc.id,
                    name: data.name,
                    quantity: data.quantity,
                    unit: data.unit,
                    category: data.category,
                    expiryDate: data.expiryDate,
                    isOpened: data.isOpened || false,
                    openedDate: data.openedDate || undefined,
                    reminderDays: data.reminderDays || 0,
                    reminderEmail: data.reminderEmail || '',
                    reminderPhone: data.reminderPhone || '',
                    reminderSent: data.reminderSent || false,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
                });
            });

            // Sort by createdAt descending
            items.sort((a, b) => {
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });

            return res.status(200).json(items);
        }

        // POST - Create new item
        if (req.method === 'POST') {
            const { name, quantity, unit, category, expiryDate, isOpened, reminderDays, reminderEmail, reminderPhone } = req.body || {};

            if (!name || !quantity || !unit || !category || !expiryDate) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const now = new Date();
            const newItemData = {
                userId: user.userId,
                name,
                quantity: parseFloat(quantity),
                unit,
                category,
                expiryDate,
                isOpened: isOpened || false,
                reminderDays: reminderDays || 0,
                reminderEmail: reminderEmail || '',
                reminderPhone: reminderPhone || '',
                reminderSent: false,
                createdAt: now,
                updatedAt: now
            };

            const docRef = await itemsCollection.add(newItemData);

            return res.status(201).json({
                id: docRef.id,
                ...newItemData,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Items API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
