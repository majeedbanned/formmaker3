import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// MongoDB connection string
const MONGODB_URI = "mongodb://myadmin:strongpassword123@185.128.137.182:27017/files?authSource=admin";
const DATABASE_NAME = "files";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db(DATABASE_NAME);

    // Check if the menu entry already exists
    const existingSystem = await db.collection("adminsystems").findOne({
      "data.systemID": "createnewschool"
    });

    if (existingSystem) {
      return NextResponse.json({
        success: true,
        message: "Navigation entry already exists"
      });
    }

    // Add the new school creation system to adminsystems collection
    const newSystemEntry = {
      data: {
        systemID: "createnewschool",
        systemName: "ایجاد مدرسه جدید",
        schoolCode: "master", // This is for master admin only
        school: false, // Not a school-specific function
        urls: [
          { url: "admin/createnewschool" }
        ],
        urls_expanded: true,
        teacher: false, // Only for admin
        menuID: "0", // Administrative menu
        menuIDOrder: "0",
        mainUrl: "admin/createnewschool",
        defaultAccessSchool: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection("adminsystems").insertOne(newSystemEntry);

    // Check if admin menu exists, if not create it
    const existingMenu = await db.collection("adminsystemmenues").findOne({
      "data.menuID": "0"
    });

    if (!existingMenu) {
      const newMenuEntry = {
        data: {
          menuID: "0",
          menuName: "مدیریت سیستم",
          order: "0"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection("adminsystemmenues").insertOne(newMenuEntry);
    }

    return NextResponse.json({
      success: true,
      message: "Navigation setup completed successfully"
    });

  } catch (error) {
    console.error("Error setting up navigation:", error);
    
    return NextResponse.json({
      success: false,
      message: "خطا در تنظیم ناوبری",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
    
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (error) {
        console.error("Error closing MongoDB connection:", error);
      }
    }
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Navigation Setup API is running"
  });
}



