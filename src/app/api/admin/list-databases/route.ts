import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://myadmin:strongpassword123@185.128.137.182:27017/files?authSource=admin";

interface DatabaseInfo {
  name: string;
  size: number;
}

interface ListDatabasesResponse {
  success: boolean;
  databases: DatabaseInfo[];
  message?: string;
  error?: string;
}

export async function GET(): Promise<NextResponse<ListDatabasesResponse>> {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    console.log("Connected to MongoDB for listing databases");

    // Get list of databases
    const adminDb = client.db().admin();
    const databasesList = await adminDb.listDatabases();

    // Filter out system databases and format the response
    const userDatabases: DatabaseInfo[] = databasesList.databases
      .filter(db => 
        !['admin', 'config', 'local'].includes(db.name) // Exclude system databases
      )
      .map(db => ({
        name: db.name,
        size: db.sizeOnDisk || 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    console.log(`Found ${userDatabases.length} user databases`);

    return NextResponse.json({
      success: true,
      databases: userDatabases
    });

  } catch (error) {
    console.error("Error listing databases:", error);
    
    return NextResponse.json({
      success: false,
      databases: [],
      message: "خطا در دریافت لیست پایگاه‌های داده",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
    
  } finally {
    if (client) {
      try {
        await client.close();
        console.log("MongoDB connection closed");
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}
