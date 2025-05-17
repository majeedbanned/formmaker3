import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../../chatbot7/config/route";
import { ObjectId } from "mongodb";

// DELETE endpoint to delete a template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Connect to the domain-specific database
    const connection = await connectToDatabase(domain);
    
    // First, find the template to check authorization
    let templateId;
    try {
      templateId = new ObjectId(id);
    } catch {
      return NextResponse.json(
        { error: "Invalid template ID format" },
        { status: 400 }
      );
    }
    
    const template = await connection.collection("publication-templates").findOne({
      _id: templateId,
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to delete this template
    // Only the creator or admin can delete
    if (
      template.creatorId !== user.id &&
      user.userType !== "admin" &&
      user.userType !== "school"
    ) {
      return NextResponse.json(
        { error: "Unauthorized to delete this template" },
        { status: 403 }
      );
    }

    // Delete the template
    await connection.collection("publication-templates").deleteOne({
      _id: templateId,
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
} 