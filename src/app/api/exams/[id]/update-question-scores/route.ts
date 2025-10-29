import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import { ObjectId } from "mongodb";

interface QuestionScoreUpdate {
  questionId: string;
  newScore: number;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const examId = (await params).id;
    
    // Get current user and verify authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only school admins and teachers can update scores
    if (user.userType === 'student') {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "localhost:3000";

    // Parse request body
    const body = await request.json();
    const updates: QuestionScoreUpdate[] = body.updates;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ message: "No updates provided" }, { status: 400 });
    }

    // Connect to database
    const connection = await connectToDatabase(domain);
    
    // Get collections
    const examCollection = connection.collection("exam");
    const questionsCollection = connection.collection("examquestions");
    const participantsCollection = connection.collection("examstudentsinfo");

    // Verify exam exists and user has access
    let exam;
    try {
      exam = await examCollection.findOne({ _id: new ObjectId(examId) });
    } catch {
      exam = await examCollection.findOne({ "data.examCode": examId });
    }

    if (!exam) {
      return NextResponse.json({ message: "Exam not found" }, { status: 404 });
    }

    if (exam.data.schoolCode !== user.schoolCode) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 });
    }

    // Update question scores in database
    const updatePromises = updates.map(async (update) => {
      try {
        const result = await questionsCollection.updateOne(
          { _id: new ObjectId(update.questionId), examId: examId },
          {
            $set: {
              score: parseFloat(update.newScore.toString()),
              updatedAt: new Date().toISOString(),
            },
          }
        );
        return { questionId: update.questionId, success: result.modifiedCount > 0 };
      } catch (error) {
        console.error(`Error updating question ${update.questionId}:`, error);
        return { questionId: update.questionId, success: false };
      }
    });

    const updateResults = await Promise.all(updatePromises);
    const failedUpdates = updateResults.filter(r => !r.success);

    if (failedUpdates.length > 0) {
      return NextResponse.json({
        message: "Some questions failed to update",
        failedUpdates,
      }, { status: 400 });
    }

    // Get all updated questions to recalculate scores
    const allQuestions = await questionsCollection
      .find({ examId: examId })
      .toArray();

    // Create a map of question scores
    const questionScoreMap = new Map();
    allQuestions.forEach((q) => {
      questionScoreMap.set(q._id.toString(), q.score);
    });

    // Get all participants and recalculate their scores
    const participants = await participantsCollection
      .find({ examId: examId })
      .toArray();

    const participantUpdatePromises = participants.map(async (participant) => {
      if (!participant.answers || !Array.isArray(participant.answers)) {
        return { participantId: participant._id, success: false };
      }

      // Recalculate scores for each answer
      let totalScore = 0;
      let maxScore = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      const updatedAnswers = participant.answers.map((answer: any) => {
        const questionScore = questionScoreMap.get(answer.questionId) || answer.maxScore || 0;
        maxScore += questionScore;

        let earnedScore = 0;
        if (answer.isCorrect === true) {
          earnedScore = questionScore;
          correctCount++;
        } else if (answer.isCorrect === false) {
          earnedScore = 0;
          wrongCount++;
        } else {
          unansweredCount++;
        }

        totalScore += earnedScore;

        return {
          ...answer,
          maxScore: questionScore,
          earnedScore: earnedScore,
        };
      });

      // Update participant with new scores
      try {
        await participantsCollection.updateOne(
          { _id: participant._id },
          {
            $set: {
              answers: updatedAnswers,
              sumScore: totalScore,
              maxScore: maxScore,
              correctAnswerCount: correctCount,
              wrongAnswerCount: wrongCount,
              unansweredCount: unansweredCount,
              updatedAt: new Date().toISOString(),
            },
          }
        );
        return { participantId: participant._id, success: true };
      } catch (error) {
        console.error(`Error updating participant ${participant._id}:`, error);
        return { participantId: participant._id, success: false };
      }
    });

    const participantResults = await Promise.all(participantUpdatePromises);
    const failedParticipantUpdates = participantResults.filter(r => !r.success);

    return NextResponse.json({
      message: "Question scores updated and participant results recalculated",
      updatedQuestions: updateResults.length,
      updatedParticipants: participantResults.filter(r => r.success).length,
      failedParticipantUpdates: failedParticipantUpdates.length > 0 ? failedParticipantUpdates : undefined,
    });

  } catch (error) {
    console.error("Error updating question scores:", error);
    return NextResponse.json(
      { message: "Failed to update question scores" },
      { status: 500 }
    );
  }
}

