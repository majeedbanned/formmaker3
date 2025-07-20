import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

interface GalleryImage {
  id: number;
  src: string;
  title: string;
  width: number;
  height: number;
}

interface Gallery {
  id: string;
  name: string;
  images: GalleryImage[];
}

interface GalleryData {
  title: string;
  subtitle: string;
  description: string;
  galleries: Gallery[];
  isVisible: boolean;
}

// GET - Fetch gallery data
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain");
    
    if (!domain) {
      return NextResponse.json({ error: "Domain header is required" }, { status: 400 });
    }

    const db = await connectToDatabase(domain);
    const collection = db.collection("gallery_settings");
    
    let gallery = await collection.findOne({});
    
    if (!gallery) {
      // Return default gallery data
      const defaultGallery: GalleryData = {
        title: "گالری تصاویر",
        subtitle: "لحظه‌های ماندگار",
        description: "مجموعه‌ای از تصاویر محیط‌های آموزشی، مدارس و رویدادهای مرتبط   .",
        isVisible: true,
        galleries: [
          {
            id: "school",
            name: "محیط مدارس",
            images: [
              {
                id: 1,
                src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "کلاس درس مدرن",
                width: 600,
                height: 400,
              },
              {
                id: 2,
                src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "کتابخانه دیجیتال",
                width: 400,
                height: 600,
              },
            ],
          },
          {
            id: "events",
            name: "رویدادها",
            images: [
              {
                id: 3,
                src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
                title: "همایش سالانه",
                width: 600,
                height: 400,
              },
            ],
          },
        ],
      };
      
      gallery = defaultGallery;
    }
    
    return NextResponse.json({ success: true, gallery });
  } catch (error) {
    console.error("Error fetching gallery data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save gallery data
export async function POST(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain");
    
    if (!domain) {
      return NextResponse.json({ error: "Domain header is required" }, { status: 400 });
    }

    const data: GalleryData = await request.json();
    
    // Validate required fields
    if (!data.title || !data.subtitle || !data.description) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    const db = await connectToDatabase(domain);
    const collection = db.collection("gallery_settings");
    
    // Update or create gallery configuration using updateOne with $set to avoid _id conflicts
    const result = await collection.updateOne(
      {},
      {
        $set: {
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          galleries: data.galleries,
          isVisible: data.isVisible,
          updatedAt: new Date(),
        }
      },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: "Gallery data saved successfully",
      result,
    });
  } catch (error) {
    console.error("Error saving gallery data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 