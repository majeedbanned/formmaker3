import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://myadmin:strongpassword123@185.128.137.182:27017/files?authSource=admin";

interface DeleteDatabaseRequest {
  databaseName: string;
}

interface DeleteDatabaseResponse {
  success: boolean;
  message: string;
  error?: string;
}

// System databases that should never be deleted
const PROTECTED_DATABASES = ['admin', 'config', 'local', 'files', 'masterdb'];

export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteDatabaseResponse>> {
  let client: MongoClient | null = null;
  
  try {
    const body: DeleteDatabaseRequest = await request.json();
    const { databaseName } = body;

    // Validate input
    if (!databaseName) {
      return NextResponse.json({
        success: false,
        message: "نام پایگاه داده الزامی است"
      }, { status: 400 });
    }

    // Check if database is protected
    if (PROTECTED_DATABASES.includes(databaseName)) {
      return NextResponse.json({
        success: false,
        message: "این پایگاه داده محافظت شده است و قابل حذف نیست"
      }, { status: 403 });
    }

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    console.log(`Connected to MongoDB to delete database: ${databaseName}`);

    // Check if database exists
    const adminDb = client.db().admin();
    const existingDbs = await adminDb.listDatabases();
    const dbExists = existingDbs.databases.some(db => db.name === databaseName);

    if (!dbExists) {
      return NextResponse.json({
        success: false,
        message: "پایگاه داده مورد نظر یافت نشد"
      }, { status: 404 });
    }

    // Drop the database
    const targetDb = client.db(databaseName);
    await targetDb.dropDatabase();

    console.log(`Database ${databaseName} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: `پایگاه داده "${databaseName}" با موفقیت حذف شد`
    });

  } catch (error) {
    console.error("Error deleting database:", error);
    
    return NextResponse.json({
      success: false,
      message: "خطا در حذف پایگاه داده",
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

// Optional: Add GET method to show protected databases
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Delete Database API is running",
    protected_databases: PROTECTED_DATABASES,
    note: "Protected databases cannot be deleted"
  });
}


