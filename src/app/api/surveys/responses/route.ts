import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "../../chatbot7/config/route";
import { ObjectId } from "mongodb";

// GET endpoint to fetch survey responses
export async function GET(request: NextRequest) {
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

    // Check if user has access to this survey
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

    // Check permissions
    if (survey.creatorId !== user.id && user.userType !== "school") {
      return NextResponse.json(
        { error: "Unauthorized to view responses" },
        { status: 403 }
      );
    }

    const responses = await connection
      .collection("survey_responses")
      .find({ surveyId: new ObjectId(surveyId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ responses, survey });
  } catch (error) {
    console.error("Error fetching survey responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
      { status: 500 }
    );
  }
}

// POST endpoint to submit a survey response
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { surveyId, responses } = body;

    if (!surveyId || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Survey ID and responses are required" },
        { status: 400 }
      );
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    // Check if survey exists and is active
    const survey = await connection.collection("surveys").findOne({
      _id: new ObjectId(surveyId),
      schoolCode: user.schoolCode,
      status: "active"
    });

    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found or not active" },
        { status: 404 }
      );
    }

    // Check if survey is within date range
    const now = new Date();
    if (survey.startDate && now < new Date(survey.startDate)) {
      return NextResponse.json(
        { error: "Survey has not started yet" },
        { status: 400 }
      );
    }
    if (survey.endDate && now > new Date(survey.endDate)) {
      return NextResponse.json(
        { error: "Survey has ended" },
        { status: 400 }
      );
    }

    // Check if user has already responded (unless anonymous allowed)
    if (!survey.allowAnonymous) {
      const existingResponse = await connection.collection("survey_responses").findOne({
        surveyId: new ObjectId(surveyId),
        responderId: user.id
      });

      if (existingResponse) {
        return NextResponse.json(
          { error: "You have already responded to this survey" },
          { status: 400 }
        );
      }
    }

    // Validate responses match survey questions
    if (responses.length !== survey.questions.length) {
      return NextResponse.json(
        { error: "Response count doesn't match question count" },
        { status: 400 }
      );
    }

    const response = {
      surveyId: new ObjectId(surveyId),
      responderId: survey.allowAnonymous ? null : user.id,
      responderType: user.userType,
      responderName: survey.allowAnonymous ? "Anonymous" : user.name,
      responses: responses.map((resp: { answer: unknown }, index: number) => ({
        questionId: survey.questions[index].id || index,
        questionText: survey.questions[index].text,
        questionType: survey.questions[index].type,
        answer: resp.answer
      })),
      schoolCode: user.schoolCode,
      createdAt: new Date()
    };

    const result = await connection.collection("survey_responses").insertOne(response);

    // Update survey response count
    await connection.collection("surveys").updateOne(
      { _id: new ObjectId(surveyId) },
      { $inc: { responseCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      responseId: result.insertedId
    });
  } catch (error) {
    console.error("Error submitting survey response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
} 