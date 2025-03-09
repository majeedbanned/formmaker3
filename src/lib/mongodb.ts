import mongoose from 'mongoose';

let isConnected = false;

export const connectToDatabase = async (connectionString: string) => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(connectionString);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
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

  return mongoose.model(collectionName, schema);
}; 