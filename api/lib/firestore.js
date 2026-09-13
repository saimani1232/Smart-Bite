// Firebase Firestore connection utility for Vercel Serverless Functions
// Provides a permanent, never-expiring cloud database backend for SmartBite.
import admin from 'firebase-admin';

let cachedDb = null;

function parsePrivateKey(raw) {
    if (!raw) return '';
    let key = raw.replace(/^["']|["']$/g, '');
    key = key.replace(/\\\\n/g, '\n').replace(/\\n/g, '\n');
    return key;
}

export function getFirestoreDb() {
    if (cachedDb) {
        return cachedDb;
    }

    // Check if Firebase app is already initialized
    if (admin.apps.length > 0) {
        cachedDb = admin.firestore();
        return cachedDb;
    }

    // Try full service account JSON first
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
        try {
            const parsed = typeof serviceAccountJson === 'string' 
                ? JSON.parse(serviceAccountJson) 
                : serviceAccountJson;
            admin.initializeApp({
                credential: admin.credential.cert(parsed)
            });
            cachedDb = admin.firestore();
            return cachedDb;
        } catch (e) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
        }
    }

    // Fall back to discrete environment variables
    // (Also checks Google Cloud Vision variables as fallback)
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                      process.env.GOOGLE_CLOUD_PROJECT_ID || 
                      process.env.VITE_GOOGLE_CLOUD_PROJECT_ID;

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 
                        process.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL;

    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || 
                          process.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKeyRaw) {
        throw new Error(
            'Firebase credentials not configured. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment variables.'
        );
    }

    const privateKey = parsePrivateKey(privateKeyRaw);

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        })
    });

    cachedDb = admin.firestore();
    return cachedDb;
}

// Convert Firestore document snapshot to clean JSON object
export function formatDoc(doc) {
    if (!doc.exists) return null;
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt
    };
}
