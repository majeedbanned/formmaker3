import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// DELETE - Remove an assessment option
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Assessment ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI || "");
    await client.connect();
    
    const db = client.db();
    const collection = db.collection("assessments");
    
    // Delete the assessment option
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });

    await client.close();
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Assessment option not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Assessment option deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting assessment option:", error);
    return NextResponse.json(
      { error: "Failed to delete assessment option" },
      { status: 500 }
    );
  }
} 