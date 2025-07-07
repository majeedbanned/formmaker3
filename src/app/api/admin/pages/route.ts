import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch all pages
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_pages');
    
    const pages = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, pages });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      slug, 
      isPublished, 
      metaDescription, 
      metaKeywords, 
      modules = [], 
      schoolId,
      content // For backward compatibility
    } = body;
    
    console.log('Creating page with data:', body);
    
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_pages');

    // Generate slug if not provided
    const pageSlug = slug || title.toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();

    // Check if slug already exists
    const existingPage = await collection.findOne({ slug: pageSlug });
    if (existingPage) {
      return NextResponse.json(
        { success: false, error: 'A page with this slug already exists' },
        { status: 409 }
      );
    }

    const newPage = {
      title,
      slug: pageSlug,
      isPublished: isPublished !== undefined ? isPublished : true,
      isActive: isPublished !== undefined ? isPublished : true, // For backward compatibility
      metaDescription: metaDescription || '',
      metaKeywords: metaKeywords || '',
      modules: modules || [],
      schoolId: schoolId || null,
      content: content || '', // For backward compatibility
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newPage);
    
    return NextResponse.json({
      success: true,
      page: { ...newPage, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 