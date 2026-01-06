// Single Item API - PUT update, DELETE
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

    // Get item ID from URL
    const { id } = req.query;
    if (!id || !ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid item ID' });
    }

    try {
        const { db } = await connectToDatabase();
        const itemsCollection = db.collection('items');

        // Verify item belongs to user
        const existingItem = await itemsCollection.findOne({
            _id: new ObjectId(id),
            userId: user.userId
        });

        if (!existingItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // PUT - Update item
        if (req.method === 'PUT') {
            const updates = req.body || {};
            delete updates.id; // Don't allow updating id
            delete updates.userId; // Don't allow changing owner

            const result = await itemsCollection.updateOne(
                { _id: new ObjectId(id), userId: user.userId },
                { 
                    $set: {
                        ...updates,
                        updatedAt: new Date()
                    }
                }
            );

            if (result.modifiedCount === 0) {
                return res.status(400).json({ error: 'No changes made' });
            }

            // Fetch updated item
            const updatedItem = await itemsCollection.findOne({ _id: new ObjectId(id) });

            return res.status(200).json({
                id: updatedItem._id.toString(),
                name: updatedItem.name,
                quantity: updatedItem.quantity,
                unit: updatedItem.unit,
                category: updatedItem.category,
                expiryDate: updatedItem.expiryDate,
                isOpened: updatedItem.isOpened || false,
                reminderDays: updatedItem.reminderDays || 0,
                reminderEmail: updatedItem.reminderEmail || '',
                reminderSent: updatedItem.reminderSent || false
            });
        }

        // DELETE - Remove item
        if (req.method === 'DELETE') {
            await itemsCollection.deleteOne({
                _id: new ObjectId(id),
                userId: user.userId
            });

            return res.status(200).json({ message: 'Item deleted successfully' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Item API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
