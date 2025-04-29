import mongoose from 'mongoose';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

// Define the database config type
interface DatabaseConfig {
  connectionString: string;
  description: string;
}

// Load database configuration from JSON file
let databaseConfig: Record<string, DatabaseConfig> = {};
try {
  const configPath = path.join(process.cwd(), 'src/config/database.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  databaseConfig = JSON.parse(configData);
} catch (error) {
  logger.error('Failed to load database configuration:', error);
  // Initialize with empty object to avoid runtime errors
  databaseConfig = {};
}

// Cache connections by domain to avoid reconnecting for each request
const connectionCache: Record<string, {
  connection: mongoose.Connection;
  isConnected: boolean;
}> = {};

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Get the connection string for a specific domain
export const getConnectionString = (domain: string): string => {
  const config = databaseConfig[domain];
  
  if (!config || !config.connectionString) {
    throw new Error(`No database configuration found for domain: ${domain}`);
  }
  
  return config.connectionString;
};

export const connectToDatabase = async (domain: string) => {
  // Check if we already have a connection for this domain
  if (connectionCache[domain]?.isConnected) {
    logger.info(`Using existing MongoDB connection for domain: ${domain}`);
    //console.log('connectionCache[domain]', connectionCache[domain])
    return connectionCache[domain].connection;
  }

  let connectionAttempts = 0;
  
  // Get the connection string for this domain
  let connectionString: string;
  try {
    connectionString = getConnectionString(domain);
  } catch (error) {
    logger.error(`Domain configuration error: ${(error as Error).message}`);
    throw error;
  }

  // const connectWithRetry = async (): Promise<mongoose.Connection> => {
  //   try {
  //     logger.info(`Connecting to MongoDB for domain: ${domain} (attempt ${connectionAttempts + 1}/${MAX_RETRIES})`);
      
  //     // Create a new connection for this domain
  //     // Using separate mongoose connection to avoid conflicts between domains
  //     const connection = mongoose.createConnection(connectionString, {
  //       serverSelectionTimeoutMS: 15000, // Increase timeout to 15 seconds
  //       socketTimeoutMS: 45000, // Socket timeout
  //       connectTimeoutMS: 15000, // Connection timeout
  //       maxPoolSize: 10, // Maximum number of connections in the pool
  //       minPoolSize: 5, // Minimum number of connections in the pool
  //       retryWrites: true, // Enable retry for write operations
  //       retryReads: true, // Enable retry for read operations
  //       heartbeatFrequencyMS: 10000, // How often to check server status
  //     });

  //     // Set up connection event handlers
  //     connection.on('error', (err) => {
  //       logger.error(`MongoDB connection error for domain ${domain}:`, err);
  //       if (connectionCache[domain]) {
  //         connectionCache[domain].isConnected = false;
  //       }
  //     });

  //     connection.on('disconnected', () => {
  //       logger.info(`MongoDB disconnected for domain: ${domain}`);
  //       if (connectionCache[domain]) {
  //         connectionCache[domain].isConnected = false;
  //       }
  //     });

  //     connection.on('reconnected', () => {
  //       logger.info(`MongoDB reconnected for domain: ${domain}`);
  //       if (connectionCache[domain]) {
  //         connectionCache[domain].isConnected = true;
  //       }
  //     });

  //     // Cache the connection
  //     connectionCache[domain] = {
  //       connection,
  //       isConnected: true
  //     };
      
  //     connectionAttempts = 0;
  //     logger.info(`Successfully connected to MongoDB for domain: ${domain}`);
      
  //     return connection;
  //   } catch (error) {
  //     logger.error(`Error connecting to MongoDB for domain ${domain}:`, error);
      
  //     if (connectionAttempts < MAX_RETRIES) {
  //       connectionAttempts++;
  //       logger.info(`Retrying connection in ${RETRY_DELAY/1000} seconds...`);
  //       await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  //       return connectWithRetry();
  //     }
      
  //     throw new Error(`Failed to connect to MongoDB for domain ${domain} after ${MAX_RETRIES} attempts`);
  //   }
  // };


  const connectWithRetry = async (): Promise<mongoose.Connection> => {
    try {
      logger.info(
        `Connecting to MongoDB for domain: ${domain} (attempt ${connectionAttempts + 1}/${MAX_RETRIES})`
      );
  
      // ────────────────────────────────────────────────────────────────
      // 1. create the connection
      // ────────────────────────────────────────────────────────────────
      const connection = mongoose.createConnection(connectionString, {
        serverSelectionTimeoutMS: 15_000,
        socketTimeoutMS:          60_000,
        connectTimeoutMS:         15_000,
        maxPoolSize:              50,
        minPoolSize:              10,
        retryWrites:              true,
        retryReads:               true,
        heartbeatFrequencyMS:     10_000,
      });
  
      // ────────────────────────────────────────────────────────────────
      // 2. wait until the driver is *actually* ready
      //    (Mongoose ≥7.3 exposes .asPromise(); fall back for older)
      // ────────────────────────────────────────────────────────────────
      if (typeof (connection as any).asPromise === 'function') {
        await (connection as any).asPromise();        // resolves on “open”
      } else {
        await new Promise<void>((resolve, reject) => {
          connection.once('open', resolve).once('error', reject);
        });
      }
  
      // ────────────────────────────────────────────────────────────────
      // 3. housekeeping listeners
      // ────────────────────────────────────────────────────────────────
      connection.on('error', (err) => {
        logger.error(`MongoDB connection error for domain ${domain}:`, err);
        if (connectionCache[domain]) connectionCache[domain].isConnected = false;
      });
  
      connection.on('disconnected', () => {
        logger.info(`MongoDB disconnected for domain: ${domain}`);
        if (connectionCache[domain]) connectionCache[domain].isConnected = false;
      });
  
      connection.on('reconnected', () => {
        logger.info(`MongoDB reconnected for domain: ${domain}`);
        if (connectionCache[domain]) connectionCache[domain].isConnected = true;
      });
  
      // ────────────────────────────────────────────────────────────────
      // 4. cache & return
      // ────────────────────────────────────────────────────────────────
      connectionCache[domain] = { connection, isConnected: true };
      connectionAttempts = 0;
      logger.info(`Successfully connected to MongoDB for domain: ${domain}`);
  
      return connection;
    } catch (err) {
      logger.error(`Error connecting to MongoDB for domain ${domain}:`, err);
  
      if (connectionAttempts < MAX_RETRIES) {
        connectionAttempts++;
        logger.info(`Retrying connection in ${RETRY_DELAY / 1000} seconds…`);
        await new Promise((res) => setTimeout(res, RETRY_DELAY));
        return connectWithRetry();            // recursive retry
      }
  
      throw new Error(
        `Failed to connect to MongoDB for domain ${domain} after ${MAX_RETRIES} attempts`
      );
    }
  };
  
  return connectWithRetry();
};

export const getDynamicModel = (connection: mongoose.Connection, collectionName: string) => {
  // Try to get the model from this connection if it exists
  try {
    return connection.model(collectionName);
  } catch {
    // Model doesn't exist, create it
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
    //console.log("collectionName", collectionName);
    return connection.model(collectionName, schema);
  }
}; 