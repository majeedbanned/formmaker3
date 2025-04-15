import { MongoClient } from 'mongodb';

// Connection cache
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToMasterDb() {
  // If we already have a connection, return it
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  // Get the connection string from environment variables
  const uri = process.env.MASTERDB_URL;

  if (!uri) {
    throw new Error('MASTERDB_URL is not defined in .env file');
  }

  // Create a new MongoDB client
  const client = new MongoClient(uri);

  // Connect to the MongoDB server
  await client.connect();

  // Get the database from the connection string
  const dbName = new URL(uri).pathname.substring(1);
  const db = client.db(dbName);

  // Cache the client and database connection
  cachedClient = client;
  cachedDb = db;

  return db;
}
