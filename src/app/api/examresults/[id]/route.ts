import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface QuestionResponse {
  questionId: string;
  answer: string;
  isCorrect?: boolean | null;
  needsGrading?: boolean;
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

    // Check if the current user has completed this exam
    const userExamInfo = await examStudentsInfoCollection.findOne({
      examId,
      userId,
      isFinished: true
    });

    if (!userExamInfo) {
      return NextResponse.json(
        { message: "You have not completed this exam" },
        { status: 400 }
      );
    }

    // Check if the exam settings allow showing scores after completion
    const showScoreAfterExam = exam.data?.settings?.showScoreAfterExam === true;
    
    if (!showScoreAfterExam) {
      return NextResponse.json(
        { message: "Exam results are not available" },
        { status: 403 }
      );
    }

    // Get the results for the current user
    const userResults = {
      userName: user.name || user.username,
      sumScore: userExamInfo.sumScore || 0,
      maxScore: userExamInfo.maxScore || 0,
      correctAnswerCount: userExamInfo.correctAnswerCount || 0,
      wrongAnswerCount: userExamInfo.wrongAnswerCount || 0,
      unansweredCount: userExamInfo.unansweredCount || 0,
      examName: exam.data.examName,
      examCode: exam.data.examCode,
      completionDate: userExamInfo.updatedAt,
      persianCompletionDate: userExamInfo.persianEntryDate
    };

    // Get category-based statistics
    const userAnswers = userExamInfo.answers || [];
    
    // Create a map of categories for easier lookup
    const categoryResultsMap = new Map();

    // Process each answer to build category statistics
    userAnswers.forEach((answer: QuestionResponse) => {
      const category = answer.category || "Uncategorized";
      
      if (!categoryResultsMap.has(category)) {
        categoryResultsMap.set(category, {
          category,
          totalQuestions: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          unansweredQuestions: 0,
          earnedScore: 0,
          maxScore: 0
        });
      }
      
      const categoryStats = categoryResultsMap.get(category);
      categoryStats.totalQuestions += 1;
      categoryStats.maxScore += (answer.maxScore || 0);
      
      if (!answer.answer || answer.answer.trim() === "") {
        categoryStats.unansweredQuestions += 1;
      } else if (answer.isCorrect === true) {
        categoryStats.correctAnswers += 1;
        categoryStats.earnedScore += (answer.earnedScore || 0);
      } else if (answer.isCorrect === false) {
        categoryStats.wrongAnswers += 1;
      }
    });
    
    const categoryResults = Array.from(categoryResultsMap.values());

    // Get school averages and rankings
    // Find all finished exams for this exam ID
    const allResults = await examStudentsInfoCollection.find({
      examId,
      isFinished: true,
      schoolCode
    }).toArray();
    
    // Calculate school average
    let totalScore = 0;
    let totalMaxScore = 0;
    const totalParticipants = allResults.length;
    
    allResults.forEach(result => {
      totalScore += (result.sumScore || 0);
      totalMaxScore += (result.maxScore || 0);
    });
    
    const averageScore = totalParticipants > 0 ? totalScore / totalParticipants : 0;
    const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    
    // Determine user ranking
    const sortedResults = allResults.sort((a, b) => {
      const scoreA = a.sumScore || 0;
      const scoreB = b.sumScore || 0;
      return scoreB - scoreA; // Sort in descending order
    });
    
    const userRank = sortedResults.findIndex(result => result.userId === userId) + 1;
    const percentile = totalParticipants > 0 ? ((totalParticipants - userRank) / totalParticipants) * 100 : 0;
    
    // Return all the results
    return NextResponse.json({
      userResults,
      categoryResults,
      schoolStats: {
        totalParticipants,
        averageScore,
        averagePercentage,
        userRank,
        percentile,
        maxPossibleScore: userResults.maxScore
      },
      detailedAnswers: userAnswers.map((answer: QuestionResponse) => ({
        questionId: answer.questionId,
        category: answer.category,
        userAnswer: answer.answer,
        isCorrect: answer.isCorrect,
        earnedScore: answer.earnedScore,
        maxScore: answer.maxScore
      }))
    });
    
  } catch (error) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      { message: "Error fetching exam results" },
      { status: 500 }
    );
  }
} 