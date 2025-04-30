import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import dayjs from "dayjs";
import jalaliday from "jalaliday";

// Set runtime to nodejs
export const runtime = 'nodejs';

// Initialize dayjs for Jalali dates
dayjs.extend(jalaliday);

// Define types for exam questions and responses
interface ExamQuestion {
  _id: string;
  examId: string;
  question: {
    type: string;
    correctoption?: string;
    text?: string;
  };
  score: number;
  category: string;
}

interface QuestionResponse {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  needsGrading?: boolean;
  maxScore?: number;
  earnedScore?: number;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
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

    // Get request body
    const body = await request.json();
    const { examId, entryTime, isFinished, responses } = body;

    if (!examId) {
      return NextResponse.json(
        { message: "Exam ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");
    const examQuestionsCollection = connection.collection("examquestions");

    // Create current date objects
    const now = new Date();
    // Format Persian date with date and time (YYYY/MM/DD HH:mm:ss)
    const persianDateTime = dayjs(now).locale('fa').format('YYYY/MM/DD HH:mm:ss');

    // Process and grade responses if exam is finished
    let gradedResponses = responses || [];
    let examStats = {};
    
    // Fetch all questions for this exam regardless of whether exam is finished
    const examQuestions = await examQuestionsCollection.find({
      examId: examId
    }).toArray() as unknown as ExamQuestion[];
    
    // Create a map of questions by their IDs for easy lookup
    const questionsMap: Record<string, ExamQuestion> = {};
    examQuestions.forEach(q => {
      questionsMap[q._id.toString()] = q;
    });
    
    // Create a map of responses by question ID for easy lookup
    const responsesMap: Record<string, QuestionResponse> = {};
    if (responses && responses.length > 0) {
      responses.forEach((resp: QuestionResponse) => {
        responsesMap[resp.questionId] = resp;
      });
    }
    
    // Get IDs of questions that have responses
    const questionIdsWithResponses = new Set(gradedResponses.map((r: QuestionResponse) => r.questionId));
    
    if (isFinished && responses && responses.length > 0) {
      // Grade each response and add isCorrect property
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      let totalScore = 0;
      
      // First, process all submitted responses
      gradedResponses = responses.map((resp: QuestionResponse) => {
        const question = questionsMap[resp.questionId];
        
        // Skip if question not found
        if (!question) {
          return resp;
        }
        
        // Get the max score for this question
        const maxScore = question.score || 0;
        // Get the category for this question
        const category = question.category || "Uncategorized";
        
        // For multiple choice questions
        if (question.question.type === " تستی " && question.question.correctoption) {
          // If answer is empty, count as unanswered
          if (!resp.answer || resp.answer.trim() === "") {
            unansweredCount++;
            return {
              ...resp,
              isCorrect: false,
              maxScore: maxScore,
              earnedScore: 0,
              category: category
            };
          }
          
          // Check if answer is correct
          const isAnswerCorrect = resp.answer === question.question.correctoption.toString();
          
          // Calculate earned score
          const earnedScore = isAnswerCorrect ? maxScore : 0;
          
          // Update counts
          if (isAnswerCorrect) {
            correctCount++;
            totalScore += earnedScore;
          } else {
            wrongCount++;
          }
          
          return {
            ...resp,
            isCorrect: isAnswerCorrect,
            maxScore: maxScore,
            earnedScore: earnedScore,
            category: category
          };
        } 
        // For essay questions - mark as needs grading
        else if (question.question.type === " تشریحی ") {
          // If answer is empty, count as unanswered
          if (!resp.answer || resp.answer.trim() === "") {
            unansweredCount++;
            return {
              ...resp,
              isCorrect: null,
              needsGrading: true,
              maxScore: maxScore,
              earnedScore: 0,
              category: category
            };
          }
          
          return {
            ...resp,
            isCorrect: null,
            needsGrading: true,
            maxScore: maxScore,
            earnedScore: null, // Will need manual grading
            category: category
          };
        }
        
        // For any other type
        return {
          ...resp,
          maxScore: maxScore,
          earnedScore: 0,
          category: category
        };
      });
      
      // Add unanswered questions to the gradedResponses array and count them
      const unansweredQuestions = examQuestions
        .filter(question => {
          const questionId = question._id.toString();
          return !responsesMap[questionId] || 
                 !responsesMap[questionId].answer ||
                 responsesMap[questionId].answer.trim() === "";
        })
        .filter(question => {
          // Only include questions that aren't already in the responses
          const questionId = question._id.toString();
          return !responsesMap[questionId];
        });
      
      // Add unanswered questions to the gradedResponses array
      unansweredQuestions.forEach(question => {
        const questionId = question._id.toString();
        // Increment the unanswered count
        unansweredCount++;
        
        // Get the max score for this question
        const maxScore = question.score || 0;
        // Get the category for this question
        const category = question.category || "Uncategorized";
        
        // Add to gradedResponses
        const isEssay = question.question.type === " تشریحی ";
        gradedResponses.push({
          questionId,
          answer: "",
          isCorrect: isEssay ? null : false,
          needsGrading: isEssay ? true : false,
          maxScore: maxScore,
          earnedScore: 0,
          category: category
        });
      });
      
      // Create exam stats object
      examStats = {
        correctAnswerCount: correctCount,
        wrongAnswerCount: wrongCount,
        unansweredCount: unansweredCount,
        sumScore: totalScore,
        maxScore: examQuestions.reduce((sum, q) => sum + (q.score || 0), 0),
        gradingStatus: "autoGraded",
        gradingTime: now
      };
    } else {
      // If not finished, still add all unanswered questions to responses array
      // Add maxScore to existing responses
      gradedResponses = gradedResponses.map((resp: QuestionResponse) => {
        const question = questionsMap[resp.questionId];
        if (question) {
          return {
            ...resp,
            maxScore: question.score || 0,
            category: question.category || "Uncategorized"
          };
        }
        return resp;
      });
      
      // Add empty responses for questions without answers
      examQuestions.forEach(question => {
        const questionId = question._id.toString();
        if (!questionIdsWithResponses.has(questionId)) {
          const isEssay = question.question.type === " تشریحی ";
          gradedResponses.push({
            questionId,
            answer: "",
            isCorrect: isEssay ? null : false,
            needsGrading: isEssay ? true : false,
            maxScore: question.score || 0,
            earnedScore: 0,
            category: question.category || "Uncategorized"
          });
        }
      });
    }

    // Check if there's an existing record
    const existingRecord = await examStudentsInfoCollection.findOne({
      examId,
      userId,
      schoolCode
    });

    if (existingRecord) {
      // Update existing record
      await examStudentsInfoCollection.updateOne(
        { 
          examId,
          userId,
          schoolCode
        },
        { 
          $set: { 
            answers: gradedResponses || existingRecord.answers,
            isFinished: isFinished || existingRecord.isFinished,
            lastSavedTime: now,
            updatedAt: now,
            ...(isFinished ? examStats : {})
          }
        }
      );
    } else {
      // Create new record
      await examStudentsInfoCollection.insertOne({
        examId,
        userId,
        schoolCode,
        entryTime: entryTime || now.toISOString(),
        entryDate: now.toISOString(),
        persianEntryDate: persianDateTime,
        answers: gradedResponses || [],
        isFinished: isFinished || false,
        lastSavedTime: now,
        createdAt: now,
        updatedAt: now,
        ...(isFinished ? examStats : {})
      });
    }

    return NextResponse.json({ 
      message: "Exam info saved successfully",
      ...(isFinished ? { stats: examStats } : {})
    });
  } catch (error) {
    console.error("Error saving exam info:", error);
    return NextResponse.json(
      { message: "Error saving exam info" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get exam ID from URL
    const url = new URL(request.url);
    const examId = url.searchParams.get("examId");
    
    if (!examId) {
      return NextResponse.json(
        { message: "Exam ID is required" },
        { status: 400 }
      );
    }

    // Get domain from request headers or use default
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examStudentsInfoCollection = connection.collection("examstudentsinfo");

    // Find student's exam info
    const examInfo = await examStudentsInfoCollection.findOne({
      examId,
      userId
    });

    if (!examInfo) {
      return NextResponse.json({ 
        message: "No exam record found",
        answers: []
      });
    }

    return NextResponse.json({ 
      examInfo: {
        entryTime: examInfo.entryTime,
        entryDate: examInfo.entryDate,
        persianEntryDate: examInfo.persianEntryDate,
        isFinished: examInfo.isFinished,
        lastSavedTime: examInfo.lastSavedTime,
        correctAnswerCount: examInfo.correctAnswerCount,
        wrongAnswerCount: examInfo.wrongAnswerCount,
        unansweredCount: examInfo.unansweredCount,
        sumScore: examInfo.sumScore,
        maxScore: examInfo.maxScore,
        gradingStatus: examInfo.gradingStatus
      },
      answers: examInfo.answers || []
    });
  } catch (error) {
    console.error("Error fetching exam info:", error);
    return NextResponse.json(
      { message: "Error fetching exam info" },
      { status: 500 }
    );
  }
} 