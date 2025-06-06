import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// PUT - Update navigation item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, href, type, isActive, parent } = body;
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    if (!name || !href || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('navigation_items');

    const updateData = {
      name,
      href,
      type,
      isActive: isActive !== undefined ? isActive : true,
      parent: parent || undefined,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Navigation item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Navigation item updated successfully'
    });
  } catch (error) {
    console.error('Error updating navigation item:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete navigation item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('navigation_items');

    // Also delete any child items that have this item as parent
    await collection.deleteMany({ parent: id });

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Navigation item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Navigation item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting navigation item:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 