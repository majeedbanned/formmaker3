import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export const connectToDatabase = async (connectionString: string) => {
  if (isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  const connectWithRetry = async () => {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${connectionAttempts + 1}/${MAX_RETRIES})`);
      
      await mongoose.connect(connectionString, {
        serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
        socketTimeoutMS: 45000, // Socket timeout
        connectTimeoutMS: 15000, // Connection timeout
        maxPoolSize: 10, // Maximum number of connections in the pool
        minPoolSize: 5, // Minimum number of connections in the pool
        retryWrites: true, // Enable retry for write operations
        retryReads: true, // Enable retry for read operations
        heartbeatFrequencyMS: 10000, // How often to check server status
      });

      isConnected = true;
      connectionAttempts = 0;
      console.log('Successfully connected to MongoDB');

      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
        isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
        isConnected = true;
      });

    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      isConnected = false;
      
      if (connectionAttempts < MAX_RETRIES) {
        connectionAttempts++;
        console.log(`Retrying connection in ${RETRY_DELAY/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connectWithRetry();
      }
      
      throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
    }
  };

  return connectWithRetry();
};

export const getDynamicModel = (collectionName: string) => {
  // Check if model already exists to prevent recompilation
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }

  // Create a dynamic schema that can accept any fields
  const schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    data: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  }, { 
    timestamps: true,
    strict: false 
  });

  // Add indexes for better query performance
  schema.index({ 'data.schoolCode': 1 });
  schema.index({ 'data.username': 1 });

  return mongoose.model(collectionName, schema);
}; 