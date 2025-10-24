import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import databaseConfig from "@/config/database.json";

// Define the database config type
interface DatabaseConfig {
  [domain: string]: {
    connectionString: string;
    schoolCode?: string;
    description?: string;
  };
}

const dbConfig = databaseConfig as DatabaseConfig;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formId, destinationDomain } = body;

    if (!formId || !destinationDomain) {
      return NextResponse.json(
        { error: "فرم و دامنه مقصد الزامی است" },
        { status: 400 }
      );
    }

    // Get source domain from headers
    const sourceDomain = request.headers.get("x-domain") || request.headers.get("host") || "localhost:3000";

    // Check if destination domain exists in config
    if (!dbConfig[destinationDomain]) {
      return NextResponse.json(
        { 
          error: "دامنه مقصد در سیستم یافت نشد",
          errorFa: "دامنه مقصد در پیکربندی سیستم تعریف نشده است"
        },
        { status: 404 }
      );
    }

    // Get connection strings
    const sourceConnectionString = dbConfig[sourceDomain]?.connectionString;
    const destinationConnectionString = dbConfig[destinationDomain]?.connectionString;

    if (!sourceConnectionString || !destinationConnectionString) {
      return NextResponse.json(
        { 
          error: "خطا در دریافت اطلاعات اتصال",
          errorFa: "اطلاعات اتصال پایگاه داده یافت نشد"
        },
        { status: 500 }
      );
    }

    // Connect to source database and get the form
    let sourceClient: MongoClient | null = null;
    let destinationClient: MongoClient | null = null;

    try {
      // Connect to source database
      sourceClient = await MongoClient.connect(sourceConnectionString);
      const sourceDb = sourceClient.db();
      const sourceFormsCollection = sourceDb.collection("forms");

      // Find the form
      const form = await sourceFormsCollection.findOne({ 
        _id: new ObjectId(formId) 
      });

      if (!form) {
        return NextResponse.json(
          { error: "فرم یافت نشد" },
          { status: 404 }
        );
      }

      // Remove _id to create a new document
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, createdAt, updatedAt, ...formData } = form;

      // Create a new form object with fresh timestamps
      const newForm = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add a note that this form was copied
        metadata: {
          ...formData.metadata,
          copiedFrom: sourceDomain,
          copiedAt: new Date(),
        },
      };

      // Connect to destination database
      destinationClient = await MongoClient.connect(destinationConnectionString);
      const destinationDb = destinationClient.db();
      const destinationFormsCollection = destinationDb.collection("forms");

      // Insert the form into destination database
      const result = await destinationFormsCollection.insertOne(newForm);

      return NextResponse.json({
        success: true,
        message: "فرم با موفقیت کپی شد",
        insertedId: result.insertedId.toString(),
        destinationDomain,
      });
    } finally {
      // Close connections
      if (sourceClient) {
        await sourceClient.close();
      }
      if (destinationClient) {
        await destinationClient.close();
      }
    }
  } catch (error) {
    console.error("Error copying form:", error);
    return NextResponse.json(
      { 
        error: "خطا در کپی کردن فرم",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

