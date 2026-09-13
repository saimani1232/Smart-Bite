// Single Item API - PUT update, DELETE (Firebase Firestore)
import { getFirestoreDb, formatDoc } from '../lib/firestore.js';
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

    // Get item ID from URL query
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid item ID' });
    }

    try {
        let db;
        try {
            db = getFirestoreDb();
        } catch (dbErr) {
            console.error('Database connection error in /items/[id]:', dbErr.message);
            return res.status(503).json({
                error: 'Cloud database not configured',
                details: dbErr.message
            });
        }

        const itemRef = db.collection('items').doc(id);
        const docSnapshot = await itemRef.get();

        if (!docSnapshot.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const itemData = docSnapshot.data();

        // Verify item belongs to user
        if (itemData.userId !== user.userId) {
            return res.status(403).json({ error: 'Forbidden: Item belongs to another user' });
        }

        // PUT - Update item
        if (req.method === 'PUT') {
            const updates = req.body || {};
            delete updates.id;     // Prevent changing ID
            delete updates.userId; // Prevent changing ownership

            const updatePayload = {
                ...updates,
                updatedAt: new Date()
            };

            await itemRef.update(updatePayload);

            const updatedDoc = await itemRef.get();
            const formatted = formatDoc(updatedDoc);

            return res.status(200).json(formatted);
        }

        // DELETE - Remove item
        if (req.method === 'DELETE') {
            await itemRef.delete();
            return res.status(200).json({ message: 'Item deleted successfully' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Item API error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
