import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

// GET endpoint to fetch a single survey by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveyId = params.id;

    if (!surveyId) {
      return NextResponse.json(
        { error: "Survey ID is required" },
        { status: 400 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Find the survey
    const survey = await connection.collection("surveys").findOne({
      _id: new ObjectId(surveyId),
      schoolCode: user.schoolCode
    });

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found" },
        { status: 404 }
      );
    }

    // Check permissions - user must be the creator or school admin
    if (survey.creatorId !== user.id && user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized to access this survey" },
        { status: 403 }
      );
    }

    return NextResponse.json({ survey });
  } catch (error) {
    console.error("Error fetching survey:", error);
    return NextResponse.json(
      { error: "Failed to fetch survey" },
      { status: 500 }
    );
  }
} 