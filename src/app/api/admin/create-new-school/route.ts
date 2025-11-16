import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// MongoDB connection string - you might want to move this to environment variables
const MONGODB_URI = "mongodb://myadmin:strongpassword123@185.128.137.182:27017/files?authSource=admin";
const SOURCE_DATABASE = "files";

interface CreateSchoolRequest {
  databaseName: string;
  domain: string;
  schoolCode: string;
  schoolName: string;
  maghta: string;
}

interface CreateSchoolResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Collections to copy with their content
const COLLECTIONS_TO_COPY = [
  "schools",
  "adminsystemmenues", 
  "adminsystems",
  "pageModules"
];

export async function POST(request: NextRequest): Promise<NextResponse<CreateSchoolResponse>> {
  let client: MongoClient | null = null;
  
  try {
    const body: CreateSchoolRequest = await request.json();
    const { databaseName, domain, schoolCode, schoolName, maghta } = body;

    // Validate input
    if (!databaseName || !domain || !schoolCode || !schoolName || !maghta) {
      return NextResponse.json({
        success: false,
        message: "تمام فیلدها الزامی هستند"
      }, { status: 400 });
    }

    // Validate database name format (only alphanumeric and hyphens)
    if (!/^[a-zA-Z0-9_-]+$/.test(databaseName)) {
      return NextResponse.json({
        success: false,
        message: "نام پایگاه داده فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد"
      }, { status: 400 });
    }

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    // console.log("Connected to MongoDB successfully");

    // Check if database already exists
    const adminDb = client.db().admin();
    const existingDbs = await adminDb.listDatabases();
    const dbExists = existingDbs.databases.some(db => db.name === databaseName);

    if (dbExists) {
      return NextResponse.json({
        success: false,
        message: "پایگاه داده با این نام از قبل وجود دارد"
      }, { status: 400 });
    }

    // Get source and target databases
    const sourceDb = client.db(SOURCE_DATABASE);
    const targetDb = client.db(databaseName);

    // console.log(`Starting to copy collections from ${SOURCE_DATABASE} to ${databaseName}`);

    // Copy each collection with its data
    for (const collectionName of COLLECTIONS_TO_COPY) {
      try {
        // console.log(`Copying collection: ${collectionName}`);
        
        // Get all documents from source collection
        const sourceCollection = sourceDb.collection(collectionName);
        const documents = await sourceCollection.find({}).toArray();
        
        // console.log(`Found ${documents.length} documents in ${collectionName}`);

        if (documents.length > 0) {
          // Create target collection and insert documents
          const targetCollection = targetDb.collection(collectionName);
          
          // Remove _id field and modify data based on user inputs
          const documentsToInsert = documents.map(doc => {
            const { _id, ...docWithoutId } = doc;
            
            // Update specific fields based on collection type
            if (collectionName === "schools" && docWithoutId.data) {
              docWithoutId.data = {
                ...docWithoutId.data,
                schoolName: schoolName,
                schoolCode: schoolCode,
                username: schoolCode,
                password: schoolCode,
                domain: domain,
                maghta: maghta
              };
            } else if (collectionName === "pageModules") {
              docWithoutId.schoolId = schoolCode;
            }
            
            return docWithoutId;
          });
          
          await targetCollection.insertMany(documentsToInsert);
          // console.log(`Successfully copied ${documents.length} documents to ${collectionName}`);
        } else {
          // Create empty collection even if source is empty
          await targetDb.createCollection(collectionName);
          // console.log(`Created empty collection: ${collectionName}`);
        }
      } catch (error) {
        console.error(`Error copying collection ${collectionName}:`, error);
        // Continue with other collections even if one fails
      }
    }

    // Create indexes if needed (you can add specific indexes here)
    try {
      // Example: Create index on schoolCode in schools collection
      await targetDb.collection("schools").createIndex({ "data.schoolCode": 1 }, { unique: true });
      // console.log("Created indexes successfully");
    } catch (error) {
      console.error("Error creating indexes:", error);
      // Non-critical error, continue
    }

    // console.log(`Database ${databaseName} created successfully with all collections`);

    return NextResponse.json({
      success: true,
      message: `پایگاه داده "${databaseName}" با موفقیت ایجاد شد و تمام جداول کپی شدند`
    });

  } catch (error) {
    console.error("Error in create-new-school API:", error);
    
    return NextResponse.json({
      success: false,
      message: "خطا در ایجاد پایگاه داده جدید",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
    
  } finally {
    // Close MongoDB connection
    if (client) {
      try {
        await client.close();
        // console.log("MongoDB connection closed");
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}

// Optional: Add GET method to check API status
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Create New School API is running",
    collections_to_copy: COLLECTIONS_TO_COPY
  });
}

