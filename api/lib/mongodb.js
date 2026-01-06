// MongoDB connection utility for Vercel Serverless Functions
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const options = {};

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    if (!uri) {
        throw new Error('MONGODB_URI environment variable is not set');
    }

    const client = new MongoClient(uri, options);
    await client.connect();
    const db = client.db('smartbite');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = { connectToDatabase };
