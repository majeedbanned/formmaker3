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
}

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

  useEffect(() => {
    if (id) {
      fetchData();
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

  useEffect(() => {
    if (participants.length > 0 && questions.length > 0) {
      calculateRankedParticipants();
    }
  }, [participants, questions]);

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

    setRankedParticipants(ranked);
  };

  const handlePrint = useReactToPrint({
    documentTitle: `${examInfo?.data.examName || "Exam"} Results`,
    // @ts-expect-error - Type definition is outdated, 'content' is a valid property
    content: () => printRef.current,
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        resolve();
      });
    },
    onAfterPrint: () => console.log("Printed successfully"),
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
        <h1 className="text-2xl font-bold text-red-600">
          خطا در بارگذاری اطلاعات
        </h1>
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
          <h1 className="text-2xl font-bold">نتایج آزمون - نسخه چاپی</h1>
          {examInfo && (
            <p className="text-gray-500">
              {examInfo.data.examName} (کد: {examInfo.data.examCode})
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ChevronLeftIcon className="h-4 w-4 ml-1" />
            بازگشت
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            <PrinterIcon className="h-4 w-4 ml-1" />
            چاپ نتایج
          </Button>
        </div>
      </div>

      <div ref={printRef} className="print-container">
        {/* Print-only header */}
        <div className="print-only mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">گزارش نتایج آزمون</h1>
          {examInfo && (
            <div>
              <p className="text-xl font-semibold">{examInfo.data.examName}</p>
              <p>کد آزمون: {examInfo.data.examCode}</p>
            </div>
          )}
        </div>

        {/* Summary statistics section - visible in both screen and print */}
        <div className="summary-stats mb-8 page-break-after">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">
            آمار کلی آزمون
          </h2>

          {overallStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-600">
                  تعداد شرکت‌کنندگان
                </h3>
                <p className="text-2xl font-bold">
                  {overallStats.totalParticipants}
                </p>
                <p className="text-sm text-gray-500">
                  {overallStats.finishedParticipants} نفر تکمیل شده (
                  {overallStats.finishRate}%)
                </p>
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-600">میانگین نمره</h3>
                <p className="text-2xl font-bold">
                  {overallStats.averageScore}
                </p>
                <p className="text-sm text-gray-500">
                  از {participants[0]?.maxScore || 0} نمره
                </p>
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-600">بالاترین نمره</h3>
                <p className="text-2xl font-bold">
                  {overallStats.highestScore}
                </p>
                {rankedParticipants.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {rankedParticipants[0].userName ||
                      rankedParticipants[0].userId}
                  </p>
                )}
              </div>

              <div className="stat-box border rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-600">
                  درصد پاسخ‌های صحیح
                </h3>
                <p className="text-2xl font-bold">
                  {overallStats.correctRate}%
                </p>
                <p className="text-sm text-gray-500">
                  صحیح: {overallStats.correctAnswers} | اشتباه:{" "}
                  {overallStats.wrongAnswers}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Individual student results - each on a separate page when printed */}
        {rankedParticipants.map((participant) => (
          <div
            key={participant._id}
            className="student-report mb-12 page-break-after"
          >
            <div className="border rounded-lg overflow-hidden shadow-sm">
              {/* Student header */}
              <div className="bg-gray-50 p-4 border-b">
                <div className="flex flex-wrap justify-between items-center">
                  <div className="flex items-center">
                    <div className="mr-4 flex-shrink-0">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 border-2 border-blue-500">
                        <span className="text-2xl font-bold text-blue-700">
                          {participant.rank}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {participant.userName || participant.userId}
                      </h3>
                      <p className="text-sm text-gray-500">
                        رتبه: {participant.rank} از {rankedParticipants.length}{" "}
                        شرکت‌کننده
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-bold">
                      نمره: {participant.sumScore} از {participant.maxScore}
                    </p>
                    {participant.maxScore && (
                      <p className="text-sm font-medium">
                        (
                        {Math.round(
                          ((participant.sumScore || 0) / participant.maxScore) *
                            100
                        )}
                        %)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Student stats */}
              <div className="p-4">
                <div className="mb-6">
                  <h4 className="font-bold mb-2">آمار کلی</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border rounded p-2 text-center bg-green-50">
                      <p className="text-sm text-gray-600">پاسخ‌های صحیح</p>
                      <p className="text-lg font-bold text-green-600">
                        {participant.correctAnswerCount || 0}
                      </p>
                    </div>
                    <div className="border rounded p-2 text-center bg-red-50">
                      <p className="text-sm text-gray-600">پاسخ‌های اشتباه</p>
                      <p className="text-lg font-bold text-red-600">
                        {participant.wrongAnswerCount || 0}
                      </p>
                    </div>
                    <div className="border rounded p-2 text-center bg-gray-50">
                      <p className="text-sm text-gray-600">بدون پاسخ</p>
                      <p className="text-lg font-bold text-gray-600">
                        {participant.unansweredCount || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div>
                  <h4 className="font-bold mb-2">عملکرد بر اساس دسته‌بندی</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-right">دسته‌بندی</th>
                        <th className="border p-2 text-center">رتبه</th>
                        <th className="border p-2 text-center">صحیح</th>
                        <th className="border p-2 text-center">اشتباه</th>
                        <th className="border p-2 text-center">بدون پاسخ</th>
                        <th className="border p-2 text-center">نمره</th>
                        <th className="border p-2 text-center">درصد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(participant.categoryStats).map((stats) => (
                        <tr key={stats.category}>
                          <td className="border p-2 font-medium">
                            {stats.category}
                          </td>
                          <td className="border p-2 text-center font-bold">
                            {stats.rank ? (
                              <div className="inline-flex items-center">
                                <span
                                  className={`
                                    inline-flex items-center justify-center 
                                    w-7 h-7 rounded-full mr-1 
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
                                  {stats.rank}
                                </span>
                                <span className="text-sm text-gray-500 mr-1">
                                  از {rankedParticipants.length}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="border p-2 text-center text-green-600">
                            {stats.correctCount}
                          </td>
                          <td className="border p-2 text-center text-red-600">
                            {stats.wrongCount}
                          </td>
                          <td className="border p-2 text-center text-gray-600">
                            {stats.unansweredCount}
                          </td>
                          <td className="border p-2 text-center">
                            {stats.earnedScore} از {stats.maxScore}
                          </td>
                          <td className="border p-2 text-center font-bold">
                            {stats.scorePercentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Performance chart (visual representation) */}
                <div className="mt-6">
                  <h4 className="font-bold mb-2">نمودار عملکرد</h4>
                  <div className="space-y-3">
                    {Object.values(participant.categoryStats).map((stats) => (
                      <div
                        key={`chart-${stats.category}`}
                        className="performance-bar"
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">
                            {stats.category}
                          </span>
                          <span className="text-sm font-medium">
                            {stats.scorePercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${stats.scorePercentage}%`,
                              backgroundColor:
                                stats.scorePercentage > 70
                                  ? "#22c55e" // green
                                  : stats.scorePercentage > 40
                                  ? "#f59e0b" // amber
                                  : "#ef4444", // red
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12pt;
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
          }

          .shadow-sm {
            box-shadow: none !important;
          }

          .border {
            border-color: #ddd !important;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
