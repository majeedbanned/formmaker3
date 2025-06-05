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
    let query: Record<string, unknown> = { schoolCode };
    
    if (user.userType === "teacher") {
      // Teachers can see:
      // 1. Their own surveys
      // 2. Surveys targeted to their classes
      const teacherClasses = user.classCode?.map((c: { value: string }) => c.value) || [];
      
      query = {
        $and: [
          { schoolCode },
          {
            $or: [
              { creatorId: user.id }, // Their own surveys
              { classTargets: { $in: teacherClasses } }, // Surveys for their classes
              { teacherTargets: { $in: [user.username] } } // Surveys directly targeted to them
            ]
          }
        ]
      };
    } else if (user.userType === "student") {
      // Students can see surveys targeted to their classes or directly to them
      const studentClasses = user.classCode?.map((c: { value: string }) => c.value) || [];
      
      query = {
        $and: [
          { schoolCode },
          { status: "active" }, // Only active surveys
          {
            $or: [
              { classTargets: { $in: studentClasses } }, // Surveys for their classes
              { teacherTargets: { $in: [user.username] } } // Surveys directly targeted to them (though rare)
            ]
          }
        ]
      };
    }
    // School admins (user.userType === "school") see all surveys (no additional filtering)

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

    // Students cannot create surveys
    if (user.userType === "student") {
      return NextResponse.json(
        { error: "Students are not allowed to create surveys" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const { 
      title, 
      description, 
      questions, 
      classTargets, // array of class codes
      teacherTargets, // array of teacher codes
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

    // For teachers, validate they can only target their own classes
    if (user.userType === "teacher") {
      const teacherClasses = user.classCode?.map((c: { value: string }) => c.value) || [];
      
      // Check if teacher is trying to target classes they don't teach
      if (classTargets && classTargets.length > 0) {
        const invalidClasses = classTargets.filter((classCode: string) => 
          !teacherClasses.includes(classCode)
        );
        if (invalidClasses.length > 0) {
          return NextResponse.json(
            { error: "Teachers can only create surveys for their own classes" },
            { status: 403 }
          );
        }
      }

      // Teachers cannot target other teachers
      if (teacherTargets && teacherTargets.length > 0) {
        return NextResponse.json(
          { error: "Teachers cannot target other teachers" },
          { status: 403 }
        );
      }
    }

    const domain = request.headers.get('x-domain') || 'localhost:3000';
    const connection = await connectToDatabase(domain);

    const survey = {
      title,
      description: description || "",
      questions,
      classTargets: classTargets || [],
      teacherTargets: teacherTargets || [],
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

    // Teachers can only edit surveys they created, school admins can edit any survey
    if (user.userType === "teacher" && survey.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Teachers can only edit surveys they created" },
        { status: 403 }
      );
    } else if (user.userType !== "school" && survey.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this survey" },
        { status: 403 }
      );
    }

    // Remove _id field from updateData to prevent MongoDB error
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...cleanUpdateData } = updateData;

    const result = await connection.collection("surveys").updateOne(
      { _id: new ObjectId(surveyId) },
      { 
        $set: { 
          ...cleanUpdateData, 
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