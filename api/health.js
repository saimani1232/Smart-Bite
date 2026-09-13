// Health check endpoint
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const hasFirebaseKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const hasFirebaseProjectId = !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID);
    const hasFirebaseClientEmail = !!(process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_GOOGLE_CLOUD_CLIENT_EMAIL);
    const hasFirebasePrivateKey = !!(process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_GOOGLE_CLOUD_PRIVATE_KEY);
    const hasJwtSecret = !!process.env.JWT_SECRET;

    const isConfigured = hasFirebaseKey || (hasFirebaseProjectId && hasFirebaseClientEmail && hasFirebasePrivateKey);

    return res.status(200).json({
        status: 'ok',
        database: 'Firebase Firestore',
        cloudConfigured: isConfigured,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        env: {
            FIREBASE_PROJECT_ID: hasFirebaseProjectId ? 'SET' : 'NOT SET',
            FIREBASE_CLIENT_EMAIL: hasFirebaseClientEmail ? 'SET' : 'NOT SET',
            FIREBASE_PRIVATE_KEY: hasFirebasePrivateKey ? 'SET' : 'NOT SET',
            JWT_SECRET: hasJwtSecret ? 'SET' : 'DEFAULT'
        }
    });
}
