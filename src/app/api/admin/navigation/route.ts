import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";



// GET - Fetch all navigation items
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('navigation_items');
    
    const items = await collection
      .find({})
      .sort({ order: 1 })
      .toArray();

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new navigation item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, href, type, isActive, parent, order } = body;

    if (!name || !href || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('navigation_items');

    const newItem = {
      name,
      href,
      type,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      parent: parent || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newItem);
    
    return NextResponse.json({
      success: true,
      item: { ...newItem, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error creating navigation item:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 