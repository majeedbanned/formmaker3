import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface ExamAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean | null;
  maxScore?: number;
  earnedScore?: number | null;
  category?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the exam ID from params
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user ID
    const userId = user.id;
    if (!userId) {
      return NextResponse.json({ message: "User ID not found" }, { status: 400 });
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

    // Get exam details
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      // If ID is not a valid ObjectId, try to find it by examCode
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json(
        { message: "Exam not found" },
        { status: 404 }
      );
    }

    // Check if show answers after exam setting is enabled
    if (!exam.data?.settings?.showanswersafterexam) {
      return NextResponse.json(
        { message: "Viewing answer sheet is not enabled for this exam" },
        { status: 403 }
      );
    }

    // Check if the current user has completed this exam
    const examStudentInfo = await examStudentsInfoCollection.findOne({
      examId,
      userId,
      isFinished: true
    });

    if (!examStudentInfo) {
      return NextResponse.json(
        { message: "You have not completed this exam" },
        { status: 400 }
      );
    }

    // Get the exam questions
    const examQuestions = await examQuestionsCollection.find({ examId }).toArray();
    if (!examQuestions || examQuestions.length === 0) {
      return NextResponse.json(
        { message: "Exam questions not found" },
        { status: 404 }
      );
    }

    // Format completion date
    const completionDate = examStudentInfo.completionTime
      ? new Date(examStudentInfo.completionTime)
      : new Date(examStudentInfo.updatedAt);
      
    // Persian date formatting
    const persianCompletionDate = examStudentInfo.persianEntryDate || '';

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
      };
    });

    // Prepare the response
    const response = {
      userInfo: {
        userName: user.name || user.username,
        examCompleted: examStudentInfo.isFinished,
        completionDate: completionDate.toISOString(),
        persianCompletionDate,
      },
      examData: {
        examName: exam.data.examName,
        examCode: exam.data.examCode,
      },
      questions: formattedQuestions,
      answers: examStudentInfo.answers.map((a: ExamAnswer) => ({
        questionId: a.questionId,
        userAnswer: a.answer,
        isCorrect: a.isCorrect,
        maxScore: a.maxScore || 1,
        earnedScore: a.earnedScore,
        category: a.category,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching exam answersheet:", error);
    return NextResponse.json(
      { message: "Failed to fetch exam answersheet" },
      { status: 500 }
    );
  }
} 