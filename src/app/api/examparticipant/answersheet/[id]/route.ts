import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the participant ID from params
    const participantId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get school code from user
    const schoolCode = user.schoolCode;
    if (!schoolCode) {
      return NextResponse.json({ message: "School code not found" }, { status: 400 });
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");
    const examCollection = connection.collection("exam");
    const examQuestionsCollection = connection.collection("examquestions");
    const usersCollection = connection.collection("users");

    // Get participant details
    let participant;
    try {
      participant = await examStudentsInfoCollection.findOne({ _id: new ObjectId(participantId) });
    } catch (err) {
      return NextResponse.json(
        { message: "Invalid participant ID" },
        { status: 400 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { message: "Participant not found" },
        { status: 404 }
      );
    }

    // Get exam details
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(participant.examId) });
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      exam = await examCollection.findOne({ "data.examCode": participant.examId });
    }

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized (teacher, admin, or the student who took the exam)
    const isTeacherOrAdmin = user.userType === "admin" || user.userType === "teacher";
    const isParticipant = participant.userId === user.id;
    
    if (!isTeacherOrAdmin && !isParticipant) {
      return NextResponse.json(
        { message: "Not authorized to view this answersheet" },
        { status: 403 }
      );
    }

    // Get the exam questions
    const examQuestions = await examQuestionsCollection.find({ examId: participant.examId }).toArray();
    if (!examQuestions || examQuestions.length === 0) {
      return NextResponse.json(
        { message: "Exam questions not found" },
        { status: 404 }
      );
    }

    // Get user details for the participant
    let userName = participant.userId;
    try {
      const userInfo = await usersCollection.findOne({ _id: new ObjectId(participant.userId) });
      if (userInfo) {
        userName = userInfo.name || userInfo.username;
      }
    } catch (err) {
      console.error(`Error fetching user info for ${participant.userId}:`, err);
    }

    // Format completion date
    const completionDate = participant.completionTime
      ? new Date(participant.completionTime)
      : new Date(participant.updatedAt);
      
    // Persian date formatting
    const persianCompletionDate = participant.persianEntryDate || '';

    // Map questions to the expected format
    const formattedQuestions = examQuestions.map((q) => {
      // Access the question object within each document
      const questionData = q.question || {};
      
      // Create options array from option1, option2, etc.
      const options = [];
      for (let i = 1; i <= 4; i++) {
        if (questionData[`option${i}`]) {
          options.push({
            id: i.toString(),
            text: questionData[`option${i}`]
          });
        }
      }
      
      // Determine the correct option ID
      const correctOptionId = questionData.correctoption ? 
                              questionData.correctoption.toString() : 
                              "";
      
      // Determine the category
      const category = q.category || questionData.cat1 || "";
      
      return {
        _id: q._id.toString(),
        text: questionData.question || "",
        options: options,
        correctOptionId: correctOptionId,
        category: category,
        maxScore: q.score || 1, // Use the score from the main document or default to 1
        explanation: questionData.questionkey || ""
      };
    });

    // Map answers
    const formattedAnswers = participant.answers.map((a: any) => ({
      questionId: a.questionId,
      userAnswer: a.answer,
      isCorrect: a.isCorrect,
      maxScore: a.maxScore || 1,
      earnedScore: a.earnedScore,
      category: a.category,
      teacherComment: a.teacherComment || ""
    }));

    // Prepare the response
    const response = {
      userInfo: {
        userName: userName,
        examCompleted: participant.isFinished,
        completionDate: completionDate.toISOString(),
        persianCompletionDate,
      },
      examData: {
        examName: exam.data.examName,
        examCode: exam.data.examCode,
      },
      questions: formattedQuestions,
      answers: formattedAnswers,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Error fetching participant answersheet:", err);
    return NextResponse.json(
      { message: "Failed to fetch participant answersheet" },
      { status: 500 }
    );
  }
} 