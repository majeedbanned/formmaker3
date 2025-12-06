import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface ScanResult {
  qRCodeData?: string;
  rightAnswers: number[];
  wrongAnswers: number[];
  multipleAnswers: number[];
  unAnswered: number[];
  Useranswers: number[];
  correctedImageUrl: string;
  originalFilename?: string;
  processedFilePath?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Auth
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Parse request body
    const body = await request.json();
    const { examId, studentCode, scanResult } = body;

    if (!examId || !studentCode || !scanResult) {
      return NextResponse.json(
        { error: "examId, studentCode, and scanResult are required" },
        { status: 400 }
      );
    }

    // Validate examId
    if (!ObjectId.isValid(examId)) {
      return NextResponse.json({ error: "Invalid examId" }, { status: 400 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    if (!connection) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Get exam details
    const examCollection = connection.collection("exam");
    const examDetails = await examCollection.findOne({
      _id: new ObjectId(examId),
    });

    if (!examDetails) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const schoolCode = examDetails.schoolCode || user.schoolCode || "";

    // Get questions
    const examQuestionsCollection = connection.collection("examquestions");
    const questions = await examQuestionsCollection
      .find({ examId })
      .sort({ createdAt: -1 })
      .toArray();

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No questions found for this exam" },
        { status: 404 }
      );
    }

    // Calculate total max score
    const totalMaxScore = questions.reduce(
      (sum, q) => sum + (q.score || 1),
      0
    );

    // Build answers array matching the structure from batch scan
    const answers = questions.map((question, index) => {
      const questionNumber = index + 1;
      const answerValue = scanResult.Useranswers[index]
        ? scanResult.Useranswers[index].toString()
        : "";
      const isCorrect = scanResult.rightAnswers.includes(questionNumber);
      const maxScore = question.score || 1;
      const earnedScore = isCorrect ? maxScore : 0;

      return {
        questionId: question._id.toString(),
        answer: answerValue,
        examId,
        isCorrect,
        maxScore,
        earnedScore,
        category: question.category || "test",
        needsGrading: false,
      };
    });

    const now = new Date();
    const persianDate = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(now)
      .replace(/‏/g, "")
      .replace(/،/g, "");

    // Update or create participant record
    const participantsCollection = connection.collection("examparticipants");
    const participant = await participantsCollection.findOne({
      examId,
      userId: studentCode,
    });

    if (participant) {
      await participantsCollection.updateOne(
        { _id: participant._id },
        {
          $set: {
            answers: answers,
            isFinished: true,
            sumScore: scanResult.rightAnswers.length,
            maxScore: questions.length,
            correctAnswerCount: scanResult.rightAnswers.length,
            wrongAnswerCount: scanResult.wrongAnswers.length,
            unansweredCount: scanResult.unAnswered.length,
            gradingStatus: "scanned",
            scanResult: scanResult,
            updatedAt: now,
          },
        }
      );
    } else {
      await participantsCollection.insertOne({
        examId,
        userId: studentCode,
        answers: answers,
        isFinished: true,
        sumScore: scanResult.rightAnswers.length,
        maxScore: questions.length,
        correctAnswerCount: scanResult.rightAnswers.length,
        wrongAnswerCount: scanResult.wrongAnswers.length,
        unansweredCount: scanResult.unAnswered.length,
        gradingStatus: "scanned",
        scanResult: scanResult,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update or create examstudentsinfo record (main record)
    const examStudentsInfoCollection =
      connection.collection("examstudentsinfo");
    const existingEntry = await examStudentsInfoCollection.findOne({
      examId,
      userId: studentCode,
    });

    if (existingEntry) {
      await examStudentsInfoCollection.updateOne(
        { _id: existingEntry._id },
        {
          $set: {
            answers,
            isFinished: true,
            lastSavedTime: now,
            updatedAt: now,
            correctAnswerCount: scanResult.rightAnswers.length,
            wrongAnswerCount: scanResult.wrongAnswers.length,
            unansweredCount: scanResult.unAnswered.length,
            sumScore: scanResult.rightAnswers.length,
            maxScore: totalMaxScore,
            gradingStatus: "scanned",
            gradingTime: now,
            scanResult: scanResult,
            qrCodeData: scanResult.qRCodeData || studentCode,
          },
        }
      );
    } else {
      await examStudentsInfoCollection.insertOne({
        examId,
        userId: studentCode,
        schoolCode,
        entryTime: now,
        entryDate: now,
        persianEntryDate: persianDate,
        answers,
        isFinished: true,
        lastSavedTime: now,
        createdAt: now,
        updatedAt: now,
        correctAnswerCount: scanResult.rightAnswers.length,
        wrongAnswerCount: scanResult.wrongAnswers.length,
        unansweredCount: scanResult.unAnswered.length,
        sumScore: scanResult.rightAnswers.length,
        maxScore: totalMaxScore,
        gradingStatus: "scanned",
        gradingTime: now,
        scanResult: scanResult,
        qrCodeData: scanResult.qRCodeData || studentCode,
      });
    }

    return NextResponse.json({
      success: true,
      message: `نتایج دانش‌آموز ${studentCode} با موفقیت ذخیره شد`,
      data: {
        studentCode,
        correctCount: scanResult.rightAnswers.length,
        wrongCount: scanResult.wrongAnswers.length,
        unansweredCount: scanResult.unAnswered.length,
        score: scanResult.rightAnswers.length,
        maxScore: totalMaxScore,
      },
    });
  } catch (error) {
    console.error("Error saving manual scan result:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred during processing",
      },
      { status: 500 }
    );
  }
}


