"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ArrowLeftIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

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
  entryDate: string;
  persianEntryDate: string;
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

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export default function ExamStatisticsPage({
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

  // Generate statistics data
  const getScoreDistribution = () => {
    const scoreRanges = [
      { name: "0-20%", count: 0 },
      { name: "21-40%", count: 0 },
      { name: "41-60%", count: 0 },
      { name: "61-80%", count: 0 },
      { name: "81-100%", count: 0 },
    ];

    participants.forEach((participant) => {
      if (
        participant.sumScore !== undefined &&
        participant.maxScore &&
        participant.maxScore > 0
      ) {
        const scorePercentage =
          (participant.sumScore / participant.maxScore) * 100;
        if (scorePercentage <= 20) scoreRanges[0].count++;
        else if (scorePercentage <= 40) scoreRanges[1].count++;
        else if (scorePercentage <= 60) scoreRanges[2].count++;
        else if (scorePercentage <= 80) scoreRanges[3].count++;
        else scoreRanges[4].count++;
      }
    });

    return scoreRanges;
  };

  const getQuestionDifficultyData = () => {
    const questionStats = questions.map((question) => {
      const questionId = question._id;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      participants.forEach((participant) => {
        const answer = participant.answers.find(
          (a) => a.questionId === questionId
        );
        if (answer) {
          if (answer.isCorrect === true) correctCount++;
          else if (answer.isCorrect === false) wrongCount++;
          else unansweredCount++;
        }
      });

      const totalAttempts = correctCount + wrongCount;
      const difficultyRate =
        totalAttempts > 0 ? (wrongCount / totalAttempts) * 100 : 0;

      return {
        id: questionId,
        category: question.category,
        score: question.score,
        correctCount,
        wrongCount,
        unansweredCount,
        difficultyRate: Math.round(difficultyRate),
      };
    });

    return questionStats;
  };

  const getCompletionRateData = () => {
    const finishedCount = participants.filter((p) => p.isFinished).length;
    const unfinishedCount = participants.length - finishedCount;

    return [
      { name: "تکمیل شده", value: finishedCount },
      { name: "ناتمام", value: unfinishedCount },
    ];
  };

  const getParticipantRanking = () => {
    const rankedParticipants = [...participants]
      .filter((p) => p.sumScore !== undefined)
      .sort((a, b) => {
        const scoreA = a.sumScore || 0;
        const scoreB = b.sumScore || 0;
        return scoreB - scoreA;
      })
      .map((participant, index) => {
        // Calculate statistics by category
        const categoryStats: Record<
          string,
          {
            correct: number;
            wrong: number;
            unanswered: number;
            maxPossible: number;
            percentage: number;
          }
        > = {};

        // Initialize with all question categories
        questions.forEach((question) => {
          const category = question.category;
          if (!categoryStats[category]) {
            categoryStats[category] = {
              correct: 0,
              wrong: 0,
              unanswered: 0,
              maxPossible: 0,
              percentage: 0,
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
                correct: 0,
                wrong: 0,
                unanswered: 0,
                maxPossible: 0,
                percentage: 0,
              };
            }

            // Update category stats
            categoryStats[category].maxPossible += answer.maxScore;

            if (answer.isCorrect === true) {
              categoryStats[category].correct += 1;
            } else if (answer.isCorrect === false) {
              categoryStats[category].wrong += 1;
            } else {
              categoryStats[category].unanswered += 1;
            }
          }
        });

        // Calculate percentages for each category
        Object.keys(categoryStats).forEach((category) => {
          const stats = categoryStats[category];
          const totalQuestions = stats.correct + stats.wrong + stats.unanswered;
          if (totalQuestions > 0) {
            stats.percentage = Math.round(
              (stats.correct / totalQuestions) * 100
            );
          }
        });

        return {
          ...participant,
          rank: index + 1,
          categoryStats,
        };
      });

    return rankedParticipants;
  };

  const getCategoryPerformance = () => {
    const categoryStats: Record<
      string,
      { totalScore: number; maxPossible: number }
    > = {};

    questions.forEach((question) => {
      const category = question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { totalScore: 0, maxPossible: 0 };
      }

      participants.forEach((participant) => {
        const answer = participant.answers.find(
          (a) => a.questionId === question._id
        );
        if (answer) {
          categoryStats[category].totalScore += answer.earnedScore || 0;
          categoryStats[category].maxPossible += answer.maxScore;
        }
      });
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      name: category,
      performanceRate:
        stats.maxPossible > 0
          ? Math.round((stats.totalScore / stats.maxPossible) * 100)
          : 0,
    }));
  };

  if (isLoading) {
    return (
      <div className="container py-8 text-center" dir="rtl">
        <Spinner className="h-8 w-8" />
        <p className="mt-2">در حال بارگذاری آمار آزمون...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-red-600">
          خطا در بارگذاری آمار
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

  const scoreDistribution = getScoreDistribution();
  const questionDifficultyData = getQuestionDifficultyData();
  const completionRateData = getCompletionRateData();
  const rankedParticipants = getParticipantRanking();
  const categoryPerformanceData = getCategoryPerformance();
  console.log("www", participants);
  return (
    <div className="container py-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">آمار آزمون</h1>
          {examInfo && (
            <p className="text-gray-500">
              {examInfo.data.examName} (کد: {examInfo.data.examCode})
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 ml-1" />
          بازگشت
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">تعداد شرکت‌کنندگان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{participants.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {completionRateData[0].value} نفر تکمیل شده (
              {Math.round(
                (completionRateData[0].value / participants.length) * 100
              )}
              %)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">میانگین نمره</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {participants.length > 0
                ? (
                    participants.reduce(
                      (sum, p) => sum + (p.sumScore || 0),
                      0
                    ) / participants.length
                  ).toFixed(2)
                : "0"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              از{" "}
              {participants.length > 0 && participants[0].maxScore
                ? participants[0].maxScore
                : 0}{" "}
              نمره
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">بالاترین نمره</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {rankedParticipants.length > 0
                ? rankedParticipants[0].sumScore
                : "0"}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {rankedParticipants.length > 0
                ? rankedParticipants[0].userName || rankedParticipants[0].userId
                : ""}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>توزیع نمرات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="تعداد دانش‌آموزان"
                    fill="#8884d8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نرخ تکمیل آزمون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex justify-center items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionRateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {completionRateData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>عملکرد بر اساس دسته‌بندی سوالات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="performanceRate"
                    name="درصد موفقیت"
                    fill="#82ca9d"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>ضریب سختی سوالات</CardTitle>
            <p className="text-sm text-gray-500">
              درصد بالاتر نشان‌دهنده سوالات سخت‌تر است (نسبت پاسخ‌های اشتباه به
              کل پاسخ‌ها)
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">شماره</TableHead>
                    <TableHead className="text-right">دسته‌بندی</TableHead>
                    <TableHead className="text-right">ضریب سختی</TableHead>
                    <TableHead className="text-right">
                      تعداد پاسخ صحیح
                    </TableHead>
                    <TableHead className="text-right">
                      تعداد پاسخ اشتباه
                    </TableHead>
                    <TableHead className="text-right">بدون پاسخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questionDifficultyData.map((question, index) => (
                    <TableRow key={question.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{question.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div
                            className="h-2.5 rounded-full mr-2"
                            style={{
                              width: `${question.difficultyRate}%`,
                              backgroundColor:
                                question.difficultyRate > 70
                                  ? "red"
                                  : question.difficultyRate > 40
                                  ? "orange"
                                  : "green",
                            }}
                          ></div>
                          {question.difficultyRate}%
                        </div>
                      </TableCell>
                      <TableCell>{question.correctCount}</TableCell>
                      <TableCell>{question.wrongCount}</TableCell>
                      <TableCell>{question.unansweredCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>رتبه‌بندی شرکت‌کنندگان</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رتبه</TableHead>
                    <TableHead className="text-right">نام کاربر</TableHead>
                    <TableHead className="text-right">نمره کل</TableHead>
                    <TableHead className="text-right">دسته‌بندی</TableHead>
                    <TableHead className="text-right">صحیح</TableHead>
                    <TableHead className="text-right">اشتباه</TableHead>
                    <TableHead className="text-right">بدون پاسخ</TableHead>
                    <TableHead className="text-right">درصد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankedParticipants
                    .map((participant) => {
                      // Get all unique categories
                      const categories = Object.keys(
                        participant.categoryStats || {}
                      );

                      // Calculate overall statistics
                      const overallCorrect =
                        participant.correctAnswerCount || 0;
                      const overallWrong = participant.wrongAnswerCount || 0;
                      const overallUnanswered =
                        participant.unansweredCount || 0;
                      const overallTotal =
                        overallCorrect + overallWrong + overallUnanswered;
                      const overallPercentage =
                        overallTotal > 0
                          ? Math.round((overallCorrect / overallTotal) * 100)
                          : 0;

                      // First row is overall stats
                      return [
                        // Overall stats row
                        <TableRow key={`${participant._id}-overall`}>
                          <TableCell rowSpan={categories.length + 1}>
                            {participant.rank}
                          </TableCell>
                          <TableCell
                            rowSpan={categories.length + 1}
                            className="font-medium"
                          >
                            {participant.userName || participant.userId}
                          </TableCell>
                          <TableCell rowSpan={categories.length + 1}>
                            {participant.sumScore !== undefined
                              ? `${participant.sumScore} از ${
                                  participant.maxScore || 0
                                }`
                              : "نامشخص"}
                          </TableCell>
                          <TableCell className="font-bold">کل</TableCell>
                          <TableCell>{overallCorrect}</TableCell>
                          <TableCell>{overallWrong}</TableCell>
                          <TableCell>{overallUnanswered}</TableCell>
                          <TableCell>{overallPercentage}%</TableCell>
                        </TableRow>,

                        // Category-specific rows
                        ...categories.map((category) => (
                          <TableRow key={`${participant._id}-${category}`}>
                            <TableCell>{category}</TableCell>
                            <TableCell>
                              {participant.categoryStats[category].correct}
                            </TableCell>
                            <TableCell>
                              {participant.categoryStats[category].wrong}
                            </TableCell>
                            <TableCell>
                              {participant.categoryStats[category].unanswered}
                            </TableCell>
                            <TableCell>
                              {participant.categoryStats[category].percentage}%
                            </TableCell>
                          </TableRow>
                        )),
                      ];
                    })
                    .flat()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
