import mongoose from 'mongoose';

// Define interface for collection schema
export interface ICollectionField {
  name: string;
  type: string;
  description: string;
}

export interface ICollectionRelationship {
  with: string;
  type: string;
  joinField: string;
  targetField: string;
  description: string;
}

export interface ICollection {
  name: string;
  description: string;
  fields: ICollectionField[];
  relationships: ICollectionRelationship[];
}

export interface IMongoQueryExample {
  farsi_query: string;
  mongo_query: {
    collection: string;
    operation: string;
    query: Record<string, unknown> | Array<Record<string, unknown>>;
  };
}

export interface IDBSchema {
  collections: ICollection[];
  common_query_examples?: IMongoQueryExample[];
}

// Define interfaces for type safety
export interface IAssistant {
  assistantId: string;
  name: string;
  instructions: string;
  dbSchema: IDBSchema | null;
  fileId?: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IThread {
  threadId: string;
  userId: string;
  assistantId: string;
  domain: string;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
}

// Schema for storing OpenAI assistant configurations
const assistantSchema = new mongoose.Schema<IAssistant>({
  assistantId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
    required: true,
  },
  dbSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  fileId: {
    type: String,
    default: null,
  },
  domain: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Schema for storing user threads
const threadSchema = new mongoose.Schema<IThread>({
  threadId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  assistantId: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index for userId and assistantId
threadSchema.index({ userId: 1, assistantId: 1 });

// Function to get the assistant model for a specific MongoDB connection
export const getAssistantModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<IAssistant>('Assistant');
  } catch {
    return connection.model<IAssistant>('Assistant', assistantSchema);
  }
};

// Function to get the thread model for a specific MongoDB connection
export const getThreadModel = (connection: mongoose.Connection) => {
  try {
    return connection.model<IThread>('Thread');
  } catch {
    return connection.model<IThread>('Thread', threadSchema);
  }
}; 