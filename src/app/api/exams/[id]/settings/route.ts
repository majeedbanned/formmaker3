import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

// GET exam settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = params.id;
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const examCollection = connection.collection("exam");
    const exam = await examCollection.findOne({ _id: new ObjectId(examId) });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({
      settings: exam.data?.settings || {},
      printSettings: exam.printSettings || {}
    });
  } catch (error) {
    console.error("Error fetching exam settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam settings" },
      { status: 500 }
    );
  }
}

// PATCH - Update exam print settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const examId = params.id;
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const body = await request.json();
    
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const examCollection = connection.collection("exam");
    
    // Update print settings
    const updateData: any = {};
    
    if (body.useNegativeMarking !== undefined) {
      updateData["printSettings.useNegativeMarking"] = body.useNegativeMarking;
    }
    
    if (body.wrongAnswersPerDeduction !== undefined) {
      updateData["printSettings.wrongAnswersPerDeduction"] = body.wrongAnswersPerDeduction;
    }
    
    if (body.useWeighting !== undefined) {
      updateData["printSettings.useWeighting"] = body.useWeighting;
    }
    
    if (body.categoryWeights !== undefined) {
      updateData["printSettings.categoryWeights"] = body.categoryWeights;
    }

    const result = await examCollection.updateOne(
      { _id: new ObjectId(examId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Print settings updated successfully"
    });
  } catch (error) {
    console.error("Error updating exam settings:", error);
    return NextResponse.json(
      { error: "Failed to update exam settings" },
      { status: 500 }
    );
  }
}

