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
    const { title, content, slug, isActive, metaDescription } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
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
      content,
      slug: pageSlug,
      isActive: isActive !== undefined ? isActive : true,
      metaDescription: metaDescription || '',
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