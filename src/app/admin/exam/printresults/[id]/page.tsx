"use client";

import React, { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChevronLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean | null;
  needsGrading: boolean;
  maxScore: number;
  earnedScore: number;
  category: string;
  teacherComment?: string;
}

interface Participant {
  _id: string;
  examId: string;
  userId: string;
  schoolCode: string;
  entryTime: string;
  persianEntryDate?: string;
  isFinished: boolean;
  sumScore?: number;
  maxScore?: number;
  correctAnswerCount?: number;
  wrongAnswerCount?: number;
  unansweredCount?: number;
  gradingStatus?: string;
  userName?: string;
  answers: Answer[];
}

interface Question {
  _id: string;
  examId: string;
  category: string;
  score: number;
  question: {
    question: string;
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    correctoption?: number;
    cat1?: string;
    difficulty?: string;
  };
}

interface ExamInfo {
  _id: string;
  data: {
    examName: string;
    examCode: string;
    schoolCode: string;
    settings?: {
      questionsDirection?: string;
      showScoreAfterExam?: boolean;
      showanswersafterexam?: boolean;
    };
  };
}

interface CategoryStats {
  category: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  correctPercentage: number;
  maxScore: number;
  earnedScore: number;
  scorePercentage: number;
  rank?: number;
  percentile?: number;
  comparisonToAverage?: number; // Percentage points above/below average
}

// Add these type extensions to the Participant type
type DifficultyLevel = "easy" | "medium" | "hard";

type DifficultyAnalysis = Record<
  DifficultyLevel,
  {
    total: number;
    correct: number;
    percentage: number;
  }
>;

type VisualAnswersByCategory = Record<
  string,
  Array<{
    questionId: string;
    isCorrect: boolean | null;
    questionNumber: number;
    maxScore: number;
    earnedScore: number;
  }>
>;

// In the Participant interface, add these properties at the end
interface Participant {
  // ... existing properties ...
  difficultyAnalysis?: DifficultyAnalysis;
  visualAnswers?: VisualAnswersByCategory;
}

// Helper function to convert numbers to Persian digits
const toPersianDigits = (text: string | number | undefined): string => {
  if (text === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(text).replace(
    /[0-9]/g,
    (match) => persianDigits[parseInt(match)]
  );
};

export default function PrintExamResults({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankedParticipants, setRankedParticipants] = useState<
    (Participant & {
      rank: number;
      categoryStats: Record<string, CategoryStats>;
    })[]
  >([]);

  const printRef = useRef<HTMLDivElement>(null);
  const id = params.id;
  const [printTemplate, setPrintTemplate] = useState<"full" | "compact">("full");
  const [useNegativeMarking, setUseNegativeMarking] = useState(false);
  const [wrongAnswersPerDeduction, setWrongAnswersPerDeduction] = useState(3); // n wrong answers = 1 point deduction
  const [useWeighting, setUseWeighting] = useState(false);
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showGradeEditor, setShowGradeEditor] = useState(false);
  const [editedScores, setEditedScores] = useState<Record<string, number>>({});
  const [isSavingScores, setIsSavingScores] = useState(false);

  useEffect(() => {
    if (id) {
      fetchData();
      loadScoringSettings();
    }
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch participants data
      const participantsResponse = await fetch(`/api/examparticipants/${id}`);
      if (!participantsResponse.ok) {
        throw new Error("Failed to fetch participants data");
      }
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData);

      // Fetch exam information
      const examResponse = await fetch(`/api/exams/${id}`);
      if (!examResponse.ok) {
        throw new Error("Failed to fetch exam information");
      }
      const examData = await examResponse.json();
      setExamInfo(examData);

      // Fetch questions
      const questionsResponse = await fetch(`/api/examquestions/${id}`);
      if (!questionsResponse.ok) {
        throw new Error("Failed to fetch exam questions");
      }
      const questionsData = await questionsResponse.json();
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const loadScoringSettings = async () => {
    try {
      const response = await fetch(`/api/exams/${id}/scoring-settings`);
      if (response.ok) {
        const settings = await response.json();
        setUseNegativeMarking(settings.useNegativeMarking || false);
        setWrongAnswersPerDeduction(settings.wrongAnswersPerDeduction || 3);
        setUseWeighting(settings.useWeighting || false);
        if (settings.categoryWeights && Object.keys(settings.categoryWeights).length > 0) {
          setCategoryWeights(settings.categoryWeights);
        }
        setSettingsLoaded(true);
      }
    } catch (error) {
      console.error("Error loading scoring settings:", error);
    }
  };

  const saveScoringSettings = async () => {
    setIsSavingSettings(true);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/exams/${id}/scoring-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useNegativeMarking,
          wrongAnswersPerDeduction,
          useWeighting,
          categoryWeights,
        }),
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', text: 'تنظیمات با موفقیت ذخیره شد' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error("Error saving scoring settings:", error);
      setSaveMessage({ type: 'error', text: 'خطا در ذخیره تنظیمات' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveQuestionScores = async () => {
    setIsSavingScores(true);
    setSaveMessage(null);
    try {
      // Prepare updates array
      const updates = Object.entries(editedScores).map(([questionId, newScore]) => ({
        questionId,
        newScore,
      }));

      const response = await fetch(`/api/exams/${id}/update-question-scores`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        const result = await response.json();
        setSaveMessage({
          type: 'success',
          text: `نمرات ${result.updatedQuestions} سوال بروزرسانی و نتایج ${result.updatedParticipants} شرکت‌کننده محاسبه شد`,
        });
        
        // Reload data to show updated results
        await fetchData();
        
        setShowGradeEditor(false);
        setTimeout(() => setSaveMessage(null), 5000);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save scores');
      }
    } catch (error) {
      console.error("Error saving question scores:", error);
      setSaveMessage({ type: 'error', text: 'خطا در ذخیره نمرات' });
      setTimeout(() => setSaveMessage(null), 3000);
    } finally {
      setIsSavingScores(false);
    }
  };

  useEffect(() => {
    if (participants.length > 0 && questions.length > 0) {
      calculateRankedParticipants();
    }
  }, [participants, questions]);

  // Initialize category weights when questions are loaded (only if not loaded from DB)
  useEffect(() => {
    if (questions.length > 0 && Object.keys(categoryWeights).length === 0 && settingsLoaded) {
      const initialWeights: Record<string, number> = {};
      const categories = new Set(questions.map(q => q.category));
      categories.forEach(category => {
        initialWeights[category] = 1; // Default weight is 1
      });
      setCategoryWeights(initialWeights);
    }
  }, [questions, settingsLoaded]);

  // Initialize edited scores when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && Object.keys(editedScores).length === 0) {
      const scores: Record<string, number> = {};
      questions.forEach(question => {
        scores[question._id] = question.score;
      });
      setEditedScores(scores);
    }
  }, [questions]);

  const calculateRankedParticipants = () => {
    const ranked = [...participants]
      .filter((p) => p.sumScore !== undefined)
      .sort((a, b) => {
        const scoreA = a.sumScore || 0;
        const scoreB = b.sumScore || 0;
        return scoreB - scoreA;
      })
      .map((participant, index) => {
        // Calculate statistics by category
        const categoryStats: Record<string, CategoryStats> = {};

        // Initialize with all question categories
        questions.forEach((question) => {
          const category = question.category;
          if (!categoryStats[category]) {
            categoryStats[category] = {
              category,
              correctCount: 0,
              wrongCount: 0,
              unansweredCount: 0,
              totalQuestions: 0,
              correctPercentage: 0,
              maxScore: 0,
              earnedScore: 0,
              scorePercentage: 0,
            };
          }
        });

        // Calculate stats for each answer
        participant.answers.forEach((answer) => {
          const question = questions.find((q) => q._id === answer.questionId);
          if (question) {
            const category = question.category;
            if (!categoryStats[category]) {
              categoryStats[category] = {
                category,
                correctCount: 0,
                wrongCount: 0,
                unansweredCount: 0,
                totalQuestions: 0,
                correctPercentage: 0,
                maxScore: 0,
                earnedScore: 0,
                scorePercentage: 0,
              };
            }

            // Update category stats
            categoryStats[category].totalQuestions += 1;
            categoryStats[category].maxScore += answer.maxScore;
            categoryStats[category].earnedScore += answer.earnedScore || 0;

            if (answer.isCorrect === true) {
              categoryStats[category].correctCount += 1;
            } else if (answer.isCorrect === false) {
              categoryStats[category].wrongCount += 1;
            } else {
              categoryStats[category].unansweredCount += 1;
            }
          }
        });

        // Calculate percentages for each category
        Object.keys(categoryStats).forEach((category) => {
          const stats = categoryStats[category];
          if (stats.totalQuestions > 0) {
            stats.correctPercentage = Math.round(
              (stats.correctCount / stats.totalQuestions) * 100
            );
          }
          if (stats.maxScore > 0) {
            stats.scorePercentage = Math.round(
              (stats.earnedScore / stats.maxScore) * 100
            );
          }
        });

        return {
          ...participant,
          rank: index + 1,
          categoryStats,
        };
      });

    // Calculate ranking per category
    // First, create a map of categories and all participant scores for that category
    const categoryScoresMap: Record<
      string,
      { participantId: string; score: number; maxScore: number }[]
    > = {};

    // Initialize the map with empty arrays for each category
    questions.forEach((question) => {
      const category = question.category;
      if (!categoryScoresMap[category]) {
        categoryScoresMap[category] = [];
      }
    });

    // Fill the map with scores from each participant
    ranked.forEach((participant) => {
      Object.entries(participant.categoryStats).forEach(([category, stats]) => {
        categoryScoresMap[category].push({
          participantId: participant._id,
          score: stats.earnedScore,
          maxScore: stats.maxScore,
        });
      });
    });

    // Sort each category by score (descending) and assign ranks
    Object.keys(categoryScoresMap).forEach((category) => {
      categoryScoresMap[category].sort((a, b) => b.score - a.score);

      // Create a map of participant IDs to their ranks
      const participantRanks: Record<string, number> = {};
      categoryScoresMap[category].forEach((entry, index) => {
        participantRanks[entry.participantId] = index + 1;
      });

      // Assign category ranks to each participant
      ranked.forEach((participant) => {
        if (participant.categoryStats[category]) {
          participant.categoryStats[category].rank =
            participantRanks[participant._id];
        }
      });
    });

    // Calculate class averages for each category
    const categoryAverages: Record<
      string,
      {
        avgScore: number;
        totalParticipants: number;
        maxPossible: number;
        scoreDistribution: Record<string, number>; // For percentile calculation
      }
    > = {};

    // Initialize averages
    questions.forEach((question) => {
      const category = question.category;
      if (!categoryAverages[category]) {
        categoryAverages[category] = {
          avgScore: 0,
          totalParticipants: 0,
          maxPossible: 0,
          scoreDistribution: {},
        };
      }
    });

    // Sum up scores for averages
    ranked.forEach((participant) => {
      Object.entries(participant.categoryStats).forEach(([category, stats]) => {
        if (!categoryAverages[category]) {
          categoryAverages[category] = {
            avgScore: 0,
            totalParticipants: 0,
            maxPossible: 0,
            scoreDistribution: {},
          };
        }

        categoryAverages[category].avgScore += stats.earnedScore;
        categoryAverages[category].totalParticipants += 1;
        categoryAverages[category].maxPossible = stats.maxScore; // All participants have same max possible

        // Record score for percentile calculation
        const scoreKey = stats.earnedScore.toString();
        categoryAverages[category].scoreDistribution[scoreKey] =
          (categoryAverages[category].scoreDistribution[scoreKey] || 0) + 1;
      });
    });

    // Calculate final averages
    Object.keys(categoryAverages).forEach((category) => {
      const data = categoryAverages[category];
      if (data.totalParticipants > 0) {
        data.avgScore = data.avgScore / data.totalParticipants;
      }
    });

    // Calculate relative performance and percentiles
    ranked.forEach((participant) => {
      Object.entries(participant.categoryStats).forEach(([category, stats]) => {
        const avgData = categoryAverages[category];

        // Calculate comparison to average (percentage points above/below)
        if (avgData && avgData.maxPossible > 0) {
          const participantPercentage =
            (stats.earnedScore / stats.maxScore) * 100;
          const avgPercentage = (avgData.avgScore / avgData.maxPossible) * 100;
          stats.comparisonToAverage = Math.round(
            participantPercentage - avgPercentage
          );
        }

        // Calculate percentile
        if (avgData && avgData.totalParticipants > 0) {
          // Count how many scores are below this participant's score
          let countBelow = 0;
          Object.entries(avgData.scoreDistribution).forEach(
            ([scoreStr, count]) => {
              const score = parseFloat(scoreStr);
              if (score < stats.earnedScore) {
                countBelow += count;
              }
            }
          );

          // Calculate percentile (percentage of scores below this one)
          stats.percentile = Math.round(
            (countBelow / avgData.totalParticipants) * 100
          );
        }
      });
    });

    // Calculate performance by difficulty level
    ranked.forEach((participant) => {
      // Create difficulty analysis object
      const difficultyAnalysis: DifficultyAnalysis = {
        easy: { total: 0, correct: 0, percentage: 0 },
        medium: { total: 0, correct: 0, percentage: 0 },
        hard: { total: 0, correct: 0, percentage: 0 },
      };

      // Analyze each answer
      participant.answers.forEach((answer) => {
        const question = questions.find((q) => q._id === answer.questionId);
        if (question && question.question.difficulty) {
          // Categorize by difficulty level
          let difficultyLevel: DifficultyLevel = "medium"; // Default

          // Map the difficulty text to our categories
          const diffText = question.question.difficulty.toLowerCase();
          if (
            diffText.includes("آسان") ||
            diffText.includes("ساده") ||
            diffText.includes("easy")
          ) {
            difficultyLevel = "easy";
          } else if (
            diffText.includes("دشوار") ||
            diffText.includes("سخت") ||
            diffText.includes("hard")
          ) {
            difficultyLevel = "hard";
          }

          // Count total and correct answers by difficulty
          difficultyAnalysis[difficultyLevel].total += 1;
          if (answer.isCorrect === true) {
            difficultyAnalysis[difficultyLevel].correct += 1;
          }
        }
      });

      // Calculate percentages
      Object.keys(difficultyAnalysis).forEach((level) => {
        const key = level as DifficultyLevel;
        const data = difficultyAnalysis[key];
        if (data.total > 0) {
          data.percentage = Math.round((data.correct / data.total) * 100);
        }
      });

      // Add difficulty analysis to participant data
      participant.difficultyAnalysis = difficultyAnalysis;
    });

    // Organize answers for visual representation
    ranked.forEach((participant) => {
      // Group answers by category for visualization
      const answersByCategory: Record<
        string,
        Array<{
          questionId: string;
          isCorrect: boolean | null;
          questionNumber: number;
          maxScore: number;
          earnedScore: number;
        }>
      > = {};

      // Initialize categories
      questions.forEach((question) => {
        if (!answersByCategory[question.category]) {
          answersByCategory[question.category] = [];
        }
      });

      // Map questions to their sequence numbers
      const questionSequence: Record<string, number> = {};
      questions.forEach((question, index) => {
        questionSequence[question._id] = index + 1;
      });

      // Organize participant answers by category
      participant.answers.forEach((answer) => {
        const question = questions.find((q) => q._id === answer.questionId);
        if (question) {
          const category = question.category;
          if (!answersByCategory[category]) {
            answersByCategory[category] = [];
          }

          answersByCategory[category].push({
            questionId: answer.questionId,
            isCorrect: answer.isCorrect,
            questionNumber: questionSequence[answer.questionId],
            maxScore: answer.maxScore,
            earnedScore: answer.earnedScore,
          });
        }
      });

      // Sort answers by question number within each category
      Object.keys(answersByCategory).forEach((category) => {
        answersByCategory[category].sort(
          (a, b) => a.questionNumber - b.questionNumber
        );
      });

      // Add to participant data
      participant.visualAnswers = answersByCategory;
    });

    setRankedParticipants(ranked);
  };

  // Calculate negative marking score for a participant
  const calculateNegativeMarkingScore = (
    correctCount: number,
    wrongCount: number,
    maxScorePerQuestion: number
  ) => {
    // Each correct answer gets full points
    const correctPoints = correctCount * maxScorePerQuestion;
    
    // Each wrong answer deducts 1/3 of a point (or based on wrongAnswersPerDeduction)
    const deductionPerWrong = maxScorePerQuestion / wrongAnswersPerDeduction;
    const deductedPoints = wrongCount * deductionPerWrong;
    
    // Unanswered questions = 0 points (no deduction)
    return Math.max(0, correctPoints - deductedPoints);
  };

  // Calculate total weighted score for a participant
  const calculateWeightedScore = (categoryStats: Record<string, CategoryStats>) => {
    let totalWeightedScore = 0;
    let totalWeightedMax = 0;

    Object.entries(categoryStats).forEach(([category, stats]) => {
      const weight = categoryWeights[category] || 1;
      
      // Get the score to use (negative marking or regular)
      const score = useNegativeMarking
        ? calculateNegativeMarkingScore(
            stats.correctCount,
            stats.wrongCount,
            stats.totalQuestions > 0 ? stats.maxScore / stats.totalQuestions : 1
          )
        : stats.earnedScore;
      
      totalWeightedScore += score * weight;
      totalWeightedMax += stats.maxScore * weight;
    });

    return { score: totalWeightedScore, maxScore: totalWeightedMax };
  };

  const handlePrint = useReactToPrint({
    // Known issue with react-to-print types in Next.js environment
    contentRef: printRef,
    documentTitle: `${examInfo?.data.examName || "Exam"} Results`,
  });

  if (isLoading) {
    return (
      <div className="container py-8 text-center" dir="rtl">
        <Spinner className="h-8 w-8" />
        <p className="mt-2">در حال بارگذاری اطلاعات آزمون...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center" dir="rtl">
        <h1 className="text-2xl text-red-600">خطا در بارگذاری اطلاعات</h1>
        <p className="mt-2">{error}</p>
        <Button
          onClick={() => router.back()}
          className="mt-4 flex items-center"
        >
          <ChevronLeftIcon className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
      </div>
    );
  }

  const calculateOverallStats = () => {
    if (participants.length === 0) return null;

    const totalParticipants = participants.length;
    const finishedParticipants = participants.filter(
      (p) => p.isFinished
    ).length;
    const finishRate = Math.round(
      (finishedParticipants / totalParticipants) * 100
    );

    const averageScore =
      participants.reduce((sum, p) => sum + (p.sumScore || 0), 0) /
      totalParticipants;

    const correctAnswers = participants.reduce(
      (sum, p) => sum + (p.correctAnswerCount || 0),
      0
    );
    const wrongAnswers = participants.reduce(
      (sum, p) => sum + (p.wrongAnswerCount || 0),
      0
    );
    const unansweredQuestions = participants.reduce(
      (sum, p) => sum + (p.unansweredCount || 0),
      0
    );

    const totalAnswers = correctAnswers + wrongAnswers + unansweredQuestions;
    const correctRate =
      totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    return {
      totalParticipants,
      finishedParticipants,
      finishRate,
      averageScore: averageScore.toFixed(2),
      highestScore:
        rankedParticipants.length > 0 ? rankedParticipants[0].sumScore : 0,
      correctAnswers,
      wrongAnswers,
      unansweredQuestions,
      correctRate,
    };
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="container py-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">نتایج آزمون - نسخه چاپی</h1>
          {examInfo && (
            <p className="text-gray-500">
              {examInfo.data.examName} (کد:{" "}
              {toPersianDigits(examInfo.data.examCode)})
            </p>
          )}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-2 border rounded-lg p-1 bg-gray-50">
            <button
              onClick={() => setPrintTemplate("full")}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                printTemplate === "full"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              قالب کامل
            </button>
            <button
              onClick={() => setPrintTemplate("compact")}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                printTemplate === "compact"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              قالب فشرده (۲ نفر در صفحه)
            </button>
          </div>
          
          {/* Negative Marking Controls */}
          <div className="flex gap-2 items-center border rounded-lg p-2 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useNegativeMarking}
                onChange={(e) => setUseNegativeMarking(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">نمره منفی</span>
            </label>
            {useNegativeMarking && (
              <div className="flex items-center gap-2 mr-2 border-r pr-2">
                <span className="text-sm">هر</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={wrongAnswersPerDeduction}
                  onChange={(e) => setWrongAnswersPerDeduction(parseInt(e.target.value) || 3)}
                  className="w-12 px-2 py-1 border rounded text-center text-sm"
                />
                <span className="text-sm">پاسخ اشتباه = ۱ نمره کسر</span>
              </div>
            )}
          </div>

          {/* Weighting Controls */}
          <div className="flex gap-2 items-center border rounded-lg p-2 bg-gray-50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useWeighting}
                onChange={(e) => setUseWeighting(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm">ضریب دروس</span>
            </label>
            {useWeighting && (
              <button
                onClick={() => setShowWeightModal(true)}
                className="mr-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                تنظیم ضرایب
              </button>
            )}
          </div>

          {/* Edit Question Grades Button */}
          <Button
            onClick={() => setShowGradeEditor(true)}
            className="flex items-center bg-purple-600 hover:bg-purple-700"
          >
            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            ویرایش نمرات سوالات
          </Button>

          {/* Save Settings Button */}
          <Button
            onClick={saveScoringSettings}
            disabled={isSavingSettings}
            className="flex items-center bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSavingSettings ? (
              <Spinner className="h-4 w-4 ml-1" />
            ) : (
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            )}
            {isSavingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 ml-1" />
            بازگشت
          </Button>
          <Button
            onClick={() => handlePrint()}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            <PrinterIcon className="h-4 w-4 ml-1" />
            چاپ نتایج
          </Button>
        </div>
        
        {/* Save Message */}
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-400' 
              : 'bg-red-100 text-red-800 border border-red-400'
          }`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      <div ref={printRef} className="print-container">
        {/* Print-only header */}
        <div className="print-only mb-8 text-center">
          <h1 className="text-2xl mb-2">گزارش نتایج آزمون</h1>
          {examInfo && (
            <div>
              <p className="text-xl">{examInfo.data.examName}</p>
              <p>کد آزمون: {toPersianDigits(examInfo.data.examCode)}</p>
            </div>
          )}
          {(useNegativeMarking || useWeighting) && (
            <div className="mt-3 space-y-2">
              {useNegativeMarking && (
                <div className="p-2 bg-yellow-100 border border-yellow-400 rounded inline-block">
                  <p className="text-sm text-yellow-900">
                    <strong>⚠️ محاسبه با نمره منفی:</strong> هر {toPersianDigits(wrongAnswersPerDeduction)} پاسخ اشتباه = ۱ نمره کسر
                  </p>
                </div>
              )}
              {useWeighting && (
                <div className="p-2 bg-blue-100 border border-blue-400 rounded inline-block">
                  <p className="text-sm text-blue-900">
                    <strong>📊 محاسبه با ضریب دروس:</strong> نمرات دروس با ضرایب مختلف محاسبه شده‌اند
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Summary statistics section - visible in both screen and print */}
        <div className="summary-stats mb-8 page-break-after">
          <h2 className="text-xl mb-4 border-b pb-2 print-large">
            آمار کلی آزمون
          </h2>

          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-grid-compact">
              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="text-gray-600">تعداد شرکت‌کنندگان</h3>
                <p className="text-2xl">
                  {toPersianDigits(overallStats.totalParticipants)}
                </p>
                <p className="text-sm text-gray-500">
                  {toPersianDigits(overallStats.finishedParticipants)} نفر تکمیل
                  شده ({toPersianDigits(overallStats.finishRate)}%)
                </p>
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="text-gray-600">میانگین نمره</h3>
                <p className="text-2xl">
                  {toPersianDigits(overallStats.averageScore)}
                </p>
                <p className="text-sm text-gray-500">
                  از {toPersianDigits(participants[0]?.maxScore || 0)} نمره
                </p>
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="text-gray-600">بالاترین نمره</h3>
                <p className="text-2xl">
                  {toPersianDigits(overallStats.highestScore)}
                </p>
                {rankedParticipants.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {rankedParticipants[0].userName ||
                      rankedParticipants[0].userId}
                  </p>
                )}
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="text-gray-600">درصد پاسخ‌های صحیح</h3>
                <p className="text-2xl">
                  {toPersianDigits(overallStats.correctRate)}%
                </p>
                <p className="text-sm text-gray-500">
                  صحیح: {toPersianDigits(overallStats.correctAnswers)} | اشتباه:{" "}
                  {toPersianDigits(overallStats.wrongAnswers)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Individual student results - each on a separate page when printed */}
        {rankedParticipants.map((participant, index) => (
          <div
            key={participant._id}
            className={`student-report mb-12 print-student ${
              printTemplate === "compact" 
                ? "print-compact-student" 
                : "page-break-after"
            } ${
              printTemplate === "compact" && index % 2 === 1 
                ? "page-break-after" 
                : ""
            }`}
          >
            <div className="border rounded-lg overflow-hidden shadow-sm print-no-shadow">
              {/* Student header */}
              <div className="bg-gray-50 p-4 border-b print-compact-header">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex items-center">
                    <div className="mr-4 flex-shrink-0">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-500 print-rank-badge">
                        <span className="text-2xl text-blue-700">
                          {toPersianDigits(participant.rank)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg">
                        {participant.userName || participant.userId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        رتبه: {toPersianDigits(participant.rank)} از{" "}
                        {toPersianDigits(rankedParticipants.length)} شرکت‌کننده
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    {useWeighting ? (
                      <>
                        {(() => {
                          const weighted = calculateWeightedScore(participant.categoryStats);
                          return (
                            <>
                              <p className="text-xl">
                                نمره (با ضریب):{" "}
                                {toPersianDigits(weighted.score.toFixed(2))} از{" "}
                                {toPersianDigits(weighted.maxScore.toFixed(2))}
                              </p>
                              <p className="text-sm text-gray-600">
                                نمره بدون ضریب: {toPersianDigits(participant.sumScore || 0)} از{" "}
                                {toPersianDigits(participant.maxScore || 0)}
                              </p>
                              {weighted.maxScore > 0 && (
                                <p className="text-sm">
                                  (
                                  {toPersianDigits(
                                    Math.round((weighted.score / weighted.maxScore) * 100)
                                  )}
                                  %)
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : useNegativeMarking ? (
                      <>
                        <p className="text-xl">
                          نمره (با احتساب منفی):{" "}
                          {toPersianDigits(
                            calculateNegativeMarkingScore(
                              participant.correctAnswerCount || 0,
                              participant.wrongAnswerCount || 0,
                              participant.maxScore && participant.answers.length > 0
                                ? participant.maxScore / participant.answers.length
                                : 1
                            ).toFixed(2)
                          )}{" "}
                          از {toPersianDigits(participant.maxScore || 0)}
                        </p>
                        <p className="text-sm text-gray-600">
                          نمره اصلی: {toPersianDigits(participant.sumScore || 0)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xl">
                          نمره: {toPersianDigits(participant.sumScore || 0)} از{" "}
                          {toPersianDigits(participant.maxScore || 0)}
                        </p>
                        {participant.maxScore && (
                          <p className="text-sm">
                            (
                            {toPersianDigits(
                              Math.round(
                                ((participant.sumScore || 0) /
                                  participant.maxScore) *
                                  100
                              )
                            )}
                            %)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Student stats */}
              <div className="p-4 print-compact-body">
                <div className="mb-4 print-stats-row">
                  <h4 className="mb-2 print-section-title">آمار کلی</h4>
                  <div className="grid grid-cols-3 gap-4 print-grid-compact">
                    <div className="border rounded p-2 text-center bg-green-50 print-stat-box">
                      <p className="text-sm text-gray-600">پاسخ‌های صحیح</p>
                      <p className="text-lg text-green-600">
                        {toPersianDigits(participant.correctAnswerCount || 0)}
                      </p>
                    </div>
                    <div className="border rounded p-2 text-center bg-red-50 print-stat-box">
                      <p className="text-sm text-gray-600">پاسخ‌های اشتباه</p>
                      <p className="text-lg text-red-600">
                        {toPersianDigits(participant.wrongAnswerCount || 0)}
                      </p>
                    </div>
                    <div className="border rounded p-2 text-center bg-gray-50 print-stat-box">
                      <p className="text-sm text-gray-600">بدون پاسخ</p>
                      <p className="text-lg text-gray-600">
                        {toPersianDigits(participant.unansweredCount || 0)}
                      </p>
                    </div>
                  </div>
                  {useNegativeMarking && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-blue-900">
                        <strong>روش محاسبه نمره منفی:</strong>
                      </p>
                      <ul className="text-blue-800 mr-4 mt-1 space-y-1">
                        <li>• هر پاسخ صحیح: نمره کامل</li>
                        <li>
                          • هر {toPersianDigits(wrongAnswersPerDeduction)} پاسخ اشتباه: کسر ۱ نمره
                        </li>
                        <li>• پاسخ ندادن: ۰ نمره (بدون کسر)</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Difficulty Analysis */}
                {participant.difficultyAnalysis && (
                  <div className="mb-4 print-stats-row">
                    <h4 className="mb-2 print-section-title">
                      تحلیل عملکرد بر اساس سختی سوالات
                    </h4>
                    <div className="grid grid-cols-3 gap-4 print-grid-compact">
                      <div className="border rounded p-3 text-center bg-green-50 print-stat-box">
                        <p className="text-sm text-gray-700">سوالات آسان</p>
                        <p className="text-xl text-green-600">
                          {toPersianDigits(
                            participant.difficultyAnalysis.easy.percentage
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">
                          {toPersianDigits(
                            participant.difficultyAnalysis.easy.correct
                          )}{" "}
                          از{" "}
                          {toPersianDigits(
                            participant.difficultyAnalysis.easy.total
                          )}{" "}
                          صحیح
                        </p>
                      </div>
                      <div className="border rounded p-3 text-center bg-blue-50 print-stat-box">
                        <p className="text-sm text-gray-700">سوالات متوسط</p>
                        <p className="text-xl text-blue-600">
                          {toPersianDigits(
                            participant.difficultyAnalysis.medium.percentage
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">
                          {toPersianDigits(
                            participant.difficultyAnalysis.medium.correct
                          )}{" "}
                          از{" "}
                          {toPersianDigits(
                            participant.difficultyAnalysis.medium.total
                          )}{" "}
                          صحیح
                        </p>
                      </div>
                      <div className="border rounded p-3 text-center bg-red-50 print-stat-box">
                        <p className="text-sm text-gray-700">سوالات سخت</p>
                        <p className="text-xl text-red-600">
                          {toPersianDigits(
                            participant.difficultyAnalysis.hard.percentage
                          )}
                          %
                        </p>
                        <p className="text-xs text-gray-500">
                          {toPersianDigits(
                            participant.difficultyAnalysis.hard.correct
                          )}{" "}
                          از{" "}
                          {toPersianDigits(
                            participant.difficultyAnalysis.hard.total
                          )}{" "}
                          صحیح
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Category breakdown */}
                <div className="mb-4 print-stats-row">
                  <h4 className="mb-2 print-section-title">
                    عملکرد بر اساس دسته‌بندی
                  </h4>
                  <table className="w-full border-collapse print-table-compact">
                    <thead>
                      <tr className="bg-gray-50 print-table-row">
                        <th className="border p-2 text-right print-table-cell">
                          دسته‌بندی
                        </th>
                        {useWeighting && (
                          <th className="border p-2 text-center print-table-cell">
                            ضریب
                          </th>
                        )}
                        <th className="border p-2 text-center print-table-cell">
                          رتبه
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          صدک
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          نسبت به میانگین
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          صحیح
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          اشتباه
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          بدون پاسخ
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          {useWeighting ? "نمره (با ضریب)" : useNegativeMarking ? "نمره (منفی)" : "نمره"}
                        </th>
                        <th className="border p-2 text-center print-table-cell">
                          درصد
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(participant.categoryStats).map((stats) => {
                        const weight = categoryWeights[stats.category] || 1;
                        const baseScore = useNegativeMarking
                          ? calculateNegativeMarkingScore(
                              stats.correctCount,
                              stats.wrongCount,
                              stats.totalQuestions > 0
                                ? stats.maxScore / stats.totalQuestions
                                : 1
                            )
                          : stats.earnedScore;
                        const weightedScore = baseScore * weight;
                        const weightedMaxScore = stats.maxScore * weight;
                        
                        return (
                          <tr key={stats.category} className="print-table-row">
                            <td className="border p-2 print-table-cell">
                              {stats.category}
                            </td>
                            {useWeighting && (
                              <td className="border p-2 text-center print-table-cell font-bold">
                                {toPersianDigits(weight)}×
                              </td>
                            )}
                          <td className="border p-2 text-center print-table-cell">
                            {stats.rank ? (
                              <div className="inline-flex items-center">
                                <span
                                  className={`
                                    inline-flex items-center justify-center 
                                    w-7 h-7 rounded-full mr-1 print-rank 
                                    ${
                                      stats.rank === 1
                                        ? "bg-yellow-100 text-yellow-800 border border-yellow-500"
                                        : stats.rank === 2
                                        ? "bg-gray-100 text-gray-800 border border-gray-400"
                                        : stats.rank === 3
                                        ? "bg-amber-100 text-amber-800 border border-amber-500"
                                        : "bg-blue-50 text-blue-800"
                                    }
                                  `}
                                >
                                  {toPersianDigits(stats.rank)}
                                </span>
                                <span className="text-sm text-gray-500 mr-1 print-hide-mobile">
                                  از{" "}
                                  {toPersianDigits(rankedParticipants.length)}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="border p-2 text-center print-table-cell">
                            {stats.percentile !== undefined
                              ? toPersianDigits(stats.percentile)
                              : "-"}
                          </td>
                          <td className="border p-2 text-center print-table-cell">
                            {stats.comparisonToAverage !== undefined ? (
                              <span
                                className={
                                  stats.comparisonToAverage > 0
                                    ? "text-green-600"
                                    : stats.comparisonToAverage < 0
                                    ? "text-red-600"
                                    : "text-gray-600"
                                }
                              >
                                {stats.comparisonToAverage > 0 ? "+" : ""}
                                {toPersianDigits(stats.comparisonToAverage)}%
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="border p-2 text-center text-green-600 print-table-cell">
                            {toPersianDigits(stats.correctCount)}
                          </td>
                          <td className="border p-2 text-center text-red-600 print-table-cell">
                            {toPersianDigits(stats.wrongCount)}
                          </td>
                          <td className="border p-2 text-center text-gray-600 print-table-cell">
                            {toPersianDigits(stats.unansweredCount)}
                          </td>
                          <td className="border p-2 text-center print-table-cell">
                            {useWeighting ? (
                              <>
                                {toPersianDigits(weightedScore.toFixed(2))} از{" "}
                                {toPersianDigits(weightedMaxScore.toFixed(2))}
                              </>
                            ) : useNegativeMarking ? (
                              <>
                                {toPersianDigits(baseScore.toFixed(2))} از{" "}
                                {toPersianDigits(stats.maxScore)}
                              </>
                            ) : (
                              <>
                                {toPersianDigits(stats.earnedScore)} از{" "}
                                {toPersianDigits(stats.maxScore)}
                              </>
                            )}
                          </td>
                          <td className="border p-2 text-center print-table-cell">
                            {useWeighting ? (
                              <>
                                {toPersianDigits(
                                  Math.round((weightedScore / weightedMaxScore) * 100)
                                )}
                                %
                              </>
                            ) : useNegativeMarking ? (
                              <>
                                {toPersianDigits(
                                  Math.round((baseScore / stats.maxScore) * 100)
                                )}
                                %
                              </>
                            ) : (
                              <>{toPersianDigits(stats.scorePercentage)}%</>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Visual answer representation */}
                {printTemplate === "full" && participant.visualAnswers && (
                  <div className="mb-4 print-stats-row print-visual-answers">
                    <h4 className="mb-2 print-section-title">
                      نمایش پاسخ‌های سوالات
                    </h4>
                    <div className="grid grid-cols-2 gap-4 print-answers-grid">
                      {Object.entries(participant.visualAnswers).map(
                        ([category, answers]) => (
                          <div
                            key={`visual-${category}`}
                            className="mb-3 print-answer-category"
                          >
                            <h5 className="text-gray-700 mb-1 print-category-title">
                              {category}
                            </h5>
                            <div className="flex flex-wrap gap-1 print-answers-wrap">
                              {answers.map((answer) => (
                                <div
                                  key={`q-${answer.questionId}`}
                                  className={`
                                w-8 h-8 rounded-lg border flex items-center justify-center print-answer-box
                                ${
                                  answer.isCorrect === true
                                    ? "bg-green-100 border-green-500 text-green-800 print-correct"
                                    : answer.isCorrect === false
                                    ? "bg-red-100 border-red-500 text-red-800 print-wrong"
                                    : "bg-gray-100 border-gray-400 text-gray-800 print-unanswered"
                                }
                              `}
                                  title={`سوال ${toPersianDigits(
                                    answer.questionNumber
                                  )}: ${
                                    answer.isCorrect === true
                                      ? `پاسخ صحیح (${toPersianDigits(
                                          answer.earnedScore
                                        )} از ${toPersianDigits(
                                          answer.maxScore
                                        )})`
                                      : answer.isCorrect === false
                                      ? "پاسخ اشتباه"
                                      : "بدون پاسخ"
                                  }`}
                                >
                                  {toPersianDigits(answer.questionNumber)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm print-legend">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-100 border border-green-500 rounded mr-1"></div>
                        <span>پاسخ صحیح</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-100 border border-red-500 rounded mr-1"></div>
                        <span>پاسخ اشتباه</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded mr-1"></div>
                        <span>بدون پاسخ</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance chart (visual representation) */}
                {printTemplate === "full" && (
                  <div className="mt-4 print-stats-row">
                    <h4 className="mb-2 print-section-title">نمودار عملکرد</h4>
                    <div className="space-y-2 print-performance-chart">
                      {Object.values(participant.categoryStats).map((stats) => {
                        const weight = categoryWeights[stats.category] || 1;
                        const baseScore = useNegativeMarking
                          ? calculateNegativeMarkingScore(
                              stats.correctCount,
                              stats.wrongCount,
                              stats.totalQuestions > 0
                                ? stats.maxScore / stats.totalQuestions
                                : 1
                            )
                          : stats.earnedScore;
                        
                        const percentage = useWeighting
                          ? Math.round(((baseScore * weight) / (stats.maxScore * weight)) * 100)
                          : Math.round((baseScore / stats.maxScore) * 100);
                        
                        return (
                          <div
                            key={`chart-${stats.category}`}
                            className="performance-bar"
                          >
                            <div className="flex justify-between mb-1 print-chart-header">
                              <span className="text-sm">
                                {stats.category}
                                {useWeighting && (
                                  <span className="mr-1 text-blue-600">
                                    ({toPersianDigits(weight)}×)
                                  </span>
                                )}
                              </span>
                              <span className="text-sm">
                                {toPersianDigits(percentage)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 print-bar-bg">
                              <div
                                className="h-2.5 rounded-full print-bar-progress"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor:
                                    percentage > 70
                                      ? "#22c55e" // green
                                      : percentage > 40
                                      ? "#f59e0b" // amber
                                      : "#ef4444", // red
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weight Configuration Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <h3 className="text-xl mb-4 border-b pb-2">تنظیم ضرایب دروس</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.keys(categoryWeights).sort().map((category) => (
                <div key={category} className="flex items-center justify-between border-b pb-2">
                  <label className="text-sm font-medium">{category}</label>
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={categoryWeights[category]}
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value) || 1;
                      setCategoryWeights(prev => ({
                        ...prev,
                        [category]: newValue
                      }));
                    }}
                    className="w-20 px-2 py-1 border rounded text-center"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => {
                  // Reset all weights to 1
                  const resetWeights: Record<string, number> = {};
                  Object.keys(categoryWeights).forEach(cat => {
                    resetWeights[cat] = 1;
                  });
                  setCategoryWeights(resetWeights);
                }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                بازنشانی به ۱
              </button>
              <button
                onClick={() => setShowWeightModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                تایید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Grade Editor Modal */}
      {showGradeEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" dir="rtl">
            <h3 className="text-xl mb-4 border-b pb-2 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              ویرایش نمرات سوالات
            </h3>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ توجه:</strong> تغییر نمرات سوالات، نتایج تمام شرکت‌کنندگان را بازمحاسبه می‌کند.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              <div className="grid grid-cols-12 gap-2 p-2 bg-gray-100 rounded font-bold text-sm sticky top-0">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-6">سوال</div>
                <div className="col-span-2 text-center">دسته‌بندی</div>
                <div className="col-span-2 text-center">نمره فعلی</div>
                <div className="col-span-1 text-center">نمره جدید</div>
              </div>
              
              {questions.map((question, index) => (
                <div key={question._id} className="grid grid-cols-12 gap-2 p-2 border rounded hover:bg-gray-50 items-center">
                  <div className="col-span-1 text-center text-sm text-gray-600">
                    {toPersianDigits(index + 1)}
                  </div>
                  <div className="col-span-6 text-sm">
                    <div
                      className="line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: question.question?.question || 'سوال بدون متن'
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-center text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {question.category}
                    </span>
                  </div>
                  <div className="col-span-2 text-center font-medium">
                    {toPersianDigits(question.score)}
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editedScores[question._id] || question.score}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value) || 0;
                        setEditedScores(prev => ({
                          ...prev,
                          [question._id]: newValue
                        }));
                      }}
                      className="w-full px-2 py-1 border rounded text-center focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 justify-end border-t pt-4">
              <button
                onClick={() => {
                  // Reset to original scores
                  const original: Record<string, number> = {};
                  questions.forEach(q => {
                    original[q._id] = q.score;
                  });
                  setEditedScores(original);
                }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
              >
                بازگشت به نمرات اصلی
              </button>
              <button
                onClick={() => {
                  setShowGradeEditor(false);
                  // Reset to original scores on cancel
                  const original: Record<string, number> = {};
                  questions.forEach(q => {
                    original[q._id] = q.score;
                  });
                  setEditedScores(original);
                }}
                className="px-4 py-2 border rounded text-sm hover:bg-gray-50"
                disabled={isSavingScores}
              >
                انصراف
              </button>
              <button
                onClick={saveQuestionScores}
                disabled={isSavingScores}
                className="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
              >
                {isSavingScores ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ذخیره و بازمحاسبه نتایج
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @font-face {
          font-family: "Vazirmatn";
          src: url("/fonts/Vazirmatn-Regular.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "Vazirmatn";
          src: url("/fonts/Vazirmatn-Bold.woff2") format("woff2");
          font-weight: bold;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "Vazirmatn";
          src: url("/fonts/Vazirmatn-Medium.woff2") format("woff2");
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }

        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 10pt !important;
            font-family: "Vazirmatn", sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            direction: rtl !important;
          }

          @page {
            size: A4;
            margin: 1cm;
          }

          .container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .page-break-after {
            page-break-after: always;
          }

          .print-only {
            display: block !important;
          }

          button,
          .no-print {
            display: none !important;
          }

          .student-report {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 0 !important;
            padding: 0 !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }

          .border {
            border-color: #ddd !important;
          }

          /* More compact styling */
          .print-compact-header {
            padding: 0.5cm !important;
          }

          .print-compact-body {
            padding: 0.3cm !important;
          }

          .print-stats-row {
            margin-bottom: 0.3cm !important;
          }

          .print-section-title {
            margin-bottom: 0.1cm !important;
            font-size: 11pt !important;
          }

          .print-grid-compact {
            gap: 0.2cm !important;
          }

          .print-stat-box {
            padding: 0.1cm !important;
          }

          .print-table-compact {
            font-size: 9pt !important;
            border-collapse: collapse !important;
          }

          .print-table-cell {
            padding: 0.1cm !important;
          }

          .print-table-row {
            line-height: 1.2 !important;
          }

          .print-answers-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.2cm !important;
          }

          .print-answer-box {
            width: 0.5cm !important;
            height: 0.5cm !important;
            font-size: 8pt !important;
            border-radius: 0.1cm !important;
          }

          .print-answers-wrap {
            gap: 0.1cm !important;
          }

          .print-category-title {
            font-size: 9pt !important;
            margin-bottom: 0.1cm !important;
          }

          .print-legend {
            font-size: 8pt !important;
            margin-top: 0.1cm !important;
          }

          .print-rank-badge {
            width: 1cm !important;
            height: 1cm !important;
          }

          .print-performance-chart {
            margin-top: 0.1cm !important;
          }

          .print-chart-header {
            margin-bottom: 0.05cm !important;
          }

          .print-no-shadow {
            box-shadow: none !important;
          }

          .print-bar-bg {
            height: 0.15cm !important;
          }

          .print-bar-progress {
            height: 0.15cm !important;
          }

          .print-student {
            max-height: 26.7cm !important; /* A4 height minus margins */
            overflow: hidden !important;
          }

          /* Compact template styles - 2 students per page */
          .print-compact-student {
            max-height: 13cm !important; /* Half page minus some margin */
            overflow: hidden !important;
            page-break-inside: avoid !important;
            margin-bottom: 0.3cm !important;
          }

          .print-compact-student .print-compact-header {
            padding: 0.3cm !important;
          }

          .print-compact-student .print-compact-body {
            padding: 0.2cm !important;
          }

          .print-compact-student .print-stats-row {
            margin-bottom: 0.2cm !important;
          }

          .print-compact-student .print-section-title {
            margin-bottom: 0.05cm !important;
            font-size: 10pt !important;
          }

          .print-compact-student .print-grid-compact {
            gap: 0.15cm !important;
          }

          .print-compact-student .print-stat-box {
            padding: 0.08cm !important;
          }

          .print-compact-student .print-stat-box p {
            font-size: 8pt !important;
          }

          .print-compact-student .print-stat-box .text-lg {
            font-size: 12pt !important;
          }

          .print-compact-student .print-stat-box .text-xl {
            font-size: 14pt !important;
          }

          .print-compact-student .print-table-compact {
            font-size: 7.5pt !important;
          }

          .print-compact-student .print-table-cell {
            padding: 0.05cm !important;
          }

          .print-compact-student .print-rank-badge {
            width: 0.8cm !important;
            height: 0.8cm !important;
          }

          .print-compact-student .print-rank-badge span {
            font-size: 14pt !important;
          }

          .print-compact-student h3 {
            font-size: 12pt !important;
          }

          .print-compact-student .text-xl {
            font-size: 14pt !important;
          }

          .print-compact-student .text-lg {
            font-size: 11pt !important;
          }

          .print-compact-student .text-sm {
            font-size: 8pt !important;
          }

          .print-compact-student .text-xs {
            font-size: 7pt !important;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }

          body {
            font-family: "Vazirmatn", sans-serif;
          }
        }
      `}</style>
    </div>
  );
}
