import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../chatbot7/config/route";
import { ObjectId } from "mongodb";

// GET endpoint to fetch surveys
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolCode = searchParams.get("schoolCode");

    if (!schoolCode) {
      return NextResponse.json(
        { error: "School code is required" },
        { status: 400 }
      );
    }

    // Authorization check
    if (user.schoolCode !== schoolCode && user.userType !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized to access this school's data" },
        { status: 403 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Build query based on user type
    const query: Record<string, unknown> = { schoolCode };
    
    if (user.userType === "teacher") {
      // Teachers can only see their own surveys
      query.creatorId = user.id;
    }

    const surveys = await connection
      .collection("surveys")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ surveys });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json(
      { error: "Failed to fetch surveys" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new survey
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      description, 
      questions, 
      targetType, // "classes" or "teachers"
      targetIds, // array of class codes or teacher codes
      status, // "draft", "active", "closed"
      startDate,
      endDate,
      allowAnonymous,
      showResults
    } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Title and questions are required" },
        { status: 400 }
      );
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.text || !question.type) {
        return NextResponse.json(
          { error: "Each question must have text and type" },
          { status: 400 }
        );
      }
      if (!["text", "radio", "checkbox", "rating"].includes(question.type)) {
        return NextResponse.json(
          { error: "Invalid question type" },
          { status: 400 }
        );
      }
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    const survey = {
      title,
      description: description || "",
      questions,
      targetType: targetType || "classes",
      targetIds: targetIds || [],
      status: status || "draft",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      allowAnonymous: allowAnonymous || false,
      showResults: showResults || false,
      schoolCode: user.schoolCode,
      creatorId: user.id,
      creatorType: user.userType,
      creatorName: user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      responseCount: 0
    };

    const result = await connection.collection("surveys").insertOne(survey);

    return NextResponse.json({
      success: true,
      surveyId: result.insertedId,
      survey: { ...survey, _id: result.insertedId }
    });
  } catch (error) {
    console.error("Error creating survey:", error);
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a survey
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { surveyId, ...updateData } = body;

    if (!surveyId) {
      return NextResponse.json(
        { error: "Survey ID is required" },
        { status: 400 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Check if user owns the survey or is school admin
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

    if (survey.creatorId !== user.id && user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized to update this survey" },
        { status: 403 }
      );
    }

    const result = await connection.collection("surveys").updateOne(
      { _id: new ObjectId(surveyId) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error updating survey:", error);
    return NextResponse.json(
      { error: "Failed to update survey" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a survey
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get("surveyId");

    if (!surveyId) {
      return NextResponse.json(
        { error: "Survey ID is required" },
        { status: 400 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Check if user owns the survey or is school admin
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

    if (survey.creatorId !== user.id && user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized to delete this survey" },
        { status: 403 }
      );
    }

    // Delete survey and all its responses
    await connection.collection("surveys").deleteOne({ _id: new ObjectId(surveyId) });
    await connection.collection("survey_responses").deleteMany({ surveyId: new ObjectId(surveyId) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting survey:", error);
    return NextResponse.json(
      { error: "Failed to delete survey" },
      { status: 500 }
    );
  }
} 