import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from 'mongodb';

interface Answer {
  questionId: string | ObjectId;
  answer: string;
  examId?: string;
  isCorrect?: boolean | null;
  maxScore: number;
  earnedScore?: number | null;
  category?: string;
  needsGrading?: boolean;
}

interface ExamParticipant {
  _id: ObjectId;
  examId: string;
  userId: string;
  answers: Answer[];
  sumScore?: number;
  maxScore?: number;
  correctAnswerCount?: number;
  wrongAnswerCount?: number;
  unansweredCount?: number;
  gradingStatus?: string;
  scanResult?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Question {
  _id: ObjectId;
  examId: string;
  score: number;
  question?: {
    correctoption?: number;
    category?: string;
  };
  createdAt?: Date;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const examId = params.id;

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Get domain from headers (or use default)
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Connect to MongoDB
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get collections
    const participantsCollection = connection.collection('examparticipants');
    const examStudentsInfoCollection = connection.collection('examstudentsinfo');
    const examQuestionsCollection = connection.collection('examquestions');
    const examCollection = connection.collection('exam');

    // Check if there are any participants for this exam
    const participantCount = await participantsCollection.countDocuments({
      examId: examId
    });

    if (participantCount === 0) {
      return NextResponse.json(
        { error: 'No participants found for this exam', count: 0 },
        { status: 404 }
      );
    }

    // Get all participants for this exam
    const participants = await participantsCollection.find({
      examId: examId
    }).toArray() as unknown as ExamParticipant[];

    // Get all questions for this exam (sorted by createdAt descending to match print order)
    const questions = await examQuestionsCollection.find({
      examId: examId
    })
    .sort({ createdAt: -1 })
    .toArray() as unknown as Question[];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found for this exam' },
        { status: 404 }
      );
    }

    // Get exam details for school code
    const examDetails = await examCollection.findOne({ _id: new ObjectId(examId) });
    const schoolCode = examDetails?.schoolCode || '';

    // Create a map of questionId to question for fast lookup
    const questionMap = new Map<string, Question>();
    questions.forEach(q => {
      questionMap.set(q._id.toString(), q);
    });

    // Calculate total max score from questions
    const totalMaxScore = questions.reduce((sum, q) => sum + (q.score || 1), 0);

    // Delete all previous records for this exam in examstudentsinfo
    // This ensures fresh data after recalculation
    const deleteResult = await examStudentsInfoCollection.deleteMany({
      examId: examId
    });

    console.log(`Deleted ${deleteResult.deletedCount} previous records from examstudentsinfo`);

    // Process each participant
    let updatedCount = 0;
    let errorCount = 0;

    for (const participant of participants) {
      try {
        // Recalculate grades based on participant's answers
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;
        let totalEarnedScore = 0;

        // Update each answer with recalculated scores
        const updatedAnswers = participant.answers.map((answer) => {
          const question = questionMap.get(answer.questionId.toString());
          
          if (!question) {
            // If question not found, keep the answer as is
            return answer;
          }

          const maxScore = question.score || 1;
          const category = question.question?.category || "test";
          
          // Determine if answer is correct, wrong, or unanswered
          let isCorrect = null;
          let earnedScore = 0;
          let needsGrading = false;

          if (!answer.answer || answer.answer.trim() === "") {
            // Unanswered
            unansweredCount++;
            isCorrect = null;
            earnedScore = 0;
          } else if (answer.isCorrect === true) {
            // Correct answer
            correctCount++;
            isCorrect = true;
            earnedScore = maxScore;
          } else if (answer.isCorrect === false) {
            // Wrong answer
            wrongCount++;
            isCorrect = false;
            earnedScore = 0;
          } else if (answer.needsGrading === true) {
            // Needs manual grading (e.g., descriptive questions)
            needsGrading = true;
            earnedScore = answer.earnedScore || 0;
          } else {
            // Default case - treat as unanswered
            unansweredCount++;
            isCorrect = null;
            earnedScore = 0;
          }

          totalEarnedScore += earnedScore;

          return {
            questionId: answer.questionId.toString(),
            answer: answer.answer,
            examId: examId,
            isCorrect: isCorrect,
            maxScore: maxScore,
            earnedScore: earnedScore,
            category: category,
            needsGrading: needsGrading
          };
        });

        // Determine grading status
        const hasNeedsGrading = updatedAnswers.some(a => a.needsGrading === true);
        const gradingStatus = hasNeedsGrading ? "pending" : 
                             participant.scanResult ? "scanned" : "completed";

        const now = new Date();
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now).replace(/‏/g, '').replace(/،/g, '');

        // Create fresh entry in examstudentsinfo
        // (all previous records were deleted before this loop)
        await examStudentsInfoCollection.insertOne({
          examId: examId,
          userId: participant.userId,
          schoolCode: schoolCode,
          entryTime: participant.createdAt || now,
          entryDate: participant.createdAt || now,
          persianEntryDate: persianDate,
          answers: updatedAnswers,
          isFinished: true,
          lastSavedTime: now,
          createdAt: participant.createdAt || now,
          updatedAt: now,
          correctAnswerCount: correctCount,
          wrongAnswerCount: wrongCount,
          unansweredCount: unansweredCount,
          sumScore: totalEarnedScore,
          maxScore: totalMaxScore,
          gradingStatus: gradingStatus,
          gradingTime: now,
          ...(participant.scanResult && { scanResult: participant.scanResult })
        });
        updatedCount++;

        // Update participant record with recalculated scores
        await participantsCollection.updateOne(
          { _id: participant._id },
          {
            $set: {
              answers: updatedAnswers,
              sumScore: totalEarnedScore,
              maxScore: totalMaxScore,
              correctAnswerCount: correctCount,
              wrongAnswerCount: wrongCount,
              unansweredCount: unansweredCount,
              gradingStatus: gradingStatus,
              updatedAt: now
            }
          }
        );
      } catch (error) {
        console.error(`Error processing participant ${participant.userId}:`, error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated grades for ${updatedCount} participant(s)`,
      updatedCount,
      errorCount,
      deletedCount: deleteResult.deletedCount,
      totalParticipants: participants.length
    });

  } catch (error) {
    console.error('Error recalculating grades:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred during recalculation' },
      { status: 500 }
    );
  }
}

