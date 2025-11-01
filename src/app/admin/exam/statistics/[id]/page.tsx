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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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

interface ScanResult {
  qRCodeData?: string;
  rightAnswers?: number[];
  wrongAnswers?: number[];
  multipleAnswers?: number[];
  unAnswered?: number[];
  Useranswers?: number[];
  correctedImageUrl?: string;
  originalFilename?: string;
  processedFilePath?: string;
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
  scanResult?: ScanResult;
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

// Helper function to convert numbers to Persian digits
const toPersianDigits = (text: string | number | undefined): string => {
  if (text === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(text).replace(
    /[0-9]/g,
    (match) => persianDigits[parseInt(match)]
  );
};

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
  const [activeTab, setActiveTab] = useState("overview");

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

  // ========== STATISTICS CALCULATION FUNCTIONS ==========

  // Question-level analysis: percentage correct/wrong per question
  const getQuestionAnalysis = () => {
    return questions.map((question, index) => {
      const questionNum = index + 1;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;
      let totalAttempts = 0;
      const optionSelections: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

      participants.forEach((participant) => {
        const answer = participant.answers.find(
          (a) => a.questionId === question._id
        );
        
        if (answer) {
          totalAttempts++;
          if (answer.isCorrect === true) {
            correctCount++;
          } else if (answer.isCorrect === false) {
            wrongCount++;
          } else {
            unansweredCount++;
          }

          // Track option selections from scanResult
          if (participant.scanResult?.Useranswers) {
            const userAnswer = participant.scanResult.Useranswers[index];
            if (userAnswer && userAnswer >= 1 && userAnswer <= 4) {
              optionSelections[userAnswer] = (optionSelections[userAnswer] || 0) + 1;
            }
          } else if (answer.answer) {
            // Fallback to answer field
            const answerNum = parseInt(answer.answer);
            if (answerNum >= 1 && answerNum <= 4) {
              optionSelections[answerNum] = (optionSelections[answerNum] || 0) + 1;
            }
          }
        } else {
          unansweredCount++;
        }
      });

      const correctPercentage = totalAttempts > 0 
        ? Math.round((correctCount / participants.length) * 100) 
        : 0;
      const wrongPercentage = totalAttempts > 0 
        ? Math.round((wrongCount / participants.length) * 100) 
        : 0;
      const unansweredPercentage = Math.round((unansweredCount / participants.length) * 100);
      const difficultyRate = totalAttempts > 0 
        ? Math.round((wrongCount / totalAttempts) * 100) 
        : 0;

      return {
        questionNum,
        questionId: question._id,
        category: question.category,
        questionText: question.question.question.substring(0, 50) + "...",
        correctCount,
        wrongCount,
        unansweredCount,
        totalAttempts,
        correctPercentage,
        wrongPercentage,
        unansweredPercentage,
        difficultyRate,
        optionSelections,
        correctOption: question.question.correctoption,
        maxScore: question.score,
      };
    });
  };

  // Option selection analysis per question
  const getOptionSelectionAnalysis = () => {
    return questions.map((question, index) => {
      const optionStats = {
        option1: 0,
        option2: 0,
        option3: 0,
        option4: 0,
        unanswered: 0,
      };

      participants.forEach((participant) => {
        if (participant.scanResult?.Useranswers) {
          const userAnswer = participant.scanResult.Useranswers[index];
          if (userAnswer === 1) optionStats.option1++;
          else if (userAnswer === 2) optionStats.option2++;
          else if (userAnswer === 3) optionStats.option3++;
          else if (userAnswer === 4) optionStats.option4++;
          else optionStats.unanswered++;
        } else {
          const answer = participant.answers.find(
            (a) => a.questionId === question._id
          );
          if (answer && answer.answer) {
            const answerNum = parseInt(answer.answer);
            if (answerNum === 1) optionStats.option1++;
            else if (answerNum === 2) optionStats.option2++;
            else if (answerNum === 3) optionStats.option3++;
            else if (answerNum === 4) optionStats.option4++;
            else optionStats.unanswered++;
          } else {
            optionStats.unanswered++;
          }
        }
      });

      return {
        questionNum: index + 1,
        questionId: question._id,
        category: question.category,
        questionText: question.question.question.substring(0, 50) + "...",
        option1Text: question.question.option1 || "گزینه ۱",
        option2Text: question.question.option2 || "گزینه ۲",
        option3Text: question.question.option3 || "گزینه ۳",
        option4Text: question.question.option4 || "گزینه ۴",
        correctOption: question.question.correctoption,
        ...optionStats,
        total: participants.length,
      };
    });
  };

  // Scan results analysis
  const getScanResultsAnalysis = () => {
    const scanStats = {
      totalScanned: 0,
      totalNotScanned: 0,
      avgRightAnswers: 0,
      avgWrongAnswers: 0,
      avgMultipleAnswers: 0,
      avgUnanswered: 0,
      scanDetails: [] as Array<{
        participantId: string;
        userName: string;
        rightCount: number;
        wrongCount: number;
        multipleCount: number;
        unansweredCount: number;
        hasImage: boolean;
      }>,
    };

    let totalRight = 0;
    let totalWrong = 0;
    let totalMultiple = 0;
    let totalUnanswered = 0;

    participants.forEach((participant) => {
      if (participant.scanResult) {
        scanStats.totalScanned++;
        const rightCount = participant.scanResult.rightAnswers?.length || 0;
        const wrongCount = participant.scanResult.wrongAnswers?.length || 0;
        const multipleCount = participant.scanResult.multipleAnswers?.length || 0;
        const unansweredCount = participant.scanResult.unAnswered?.length || 0;

        totalRight += rightCount;
        totalWrong += wrongCount;
        totalMultiple += multipleCount;
        totalUnanswered += unansweredCount;

        scanStats.scanDetails.push({
          participantId: participant._id,
          userName: participant.userName || participant.userId,
          rightCount,
          wrongCount,
          multipleCount,
          unansweredCount,
          hasImage: !!participant.scanResult.correctedImageUrl,
        });
      } else {
        scanStats.totalNotScanned++;
      }
    });

    if (scanStats.totalScanned > 0) {
      scanStats.avgRightAnswers = Math.round(totalRight / scanStats.totalScanned);
      scanStats.avgWrongAnswers = Math.round(totalWrong / scanStats.totalScanned);
      scanStats.avgMultipleAnswers = Math.round(totalMultiple / scanStats.totalScanned);
      scanStats.avgUnanswered = Math.round(totalUnanswered / scanStats.totalScanned);
    }

    return scanStats;
  };

  // Score distribution
  const getScoreDistribution = () => {
    const scoreRanges = [
      { name: "0-20%", min: 0, max: 20, count: 0 },
      { name: "21-40%", min: 21, max: 40, count: 0 },
      { name: "41-60%", min: 41, max: 60, count: 0 },
      { name: "61-80%", min: 61, max: 80, count: 0 },
      { name: "81-100%", min: 81, max: 100, count: 0 },
    ];

    participants.forEach((participant) => {
      if (
        participant.sumScore !== undefined &&
        participant.maxScore &&
        participant.maxScore > 0
      ) {
        const scorePercentage =
          (participant.sumScore / participant.maxScore) * 100;
        const range = scoreRanges.find(
          (r) => scorePercentage >= r.min && scorePercentage <= r.max
        );
        if (range) range.count++;
      }
    });

    return scoreRanges;
  };

  // Category performance
  const getCategoryPerformance = () => {
    const categoryStats: Record<
      string,
      { totalScore: number; maxPossible: number; correctCount: number; wrongCount: number; unansweredCount: number }
    > = {};

    questions.forEach((question) => {
      const category = question.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { 
          totalScore: 0, 
          maxPossible: 0,
          correctCount: 0,
          wrongCount: 0,
          unansweredCount: 0,
        };
      }

      participants.forEach((participant) => {
        const answer = participant.answers.find(
          (a) => a.questionId === question._id
        );
        if (answer) {
          categoryStats[category].totalScore += answer.earnedScore || 0;
          categoryStats[category].maxPossible += answer.maxScore;
          if (answer.isCorrect === true) categoryStats[category].correctCount++;
          else if (answer.isCorrect === false) categoryStats[category].wrongCount++;
          else categoryStats[category].unansweredCount++;
        }
      });
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      performanceRate:
        stats.maxPossible > 0
          ? Math.round((stats.totalScore / stats.maxPossible) * 100)
          : 0,
      correctCount: stats.correctCount,
      wrongCount: stats.wrongCount,
      unansweredCount: stats.unansweredCount,
      totalQuestions: stats.correctCount + stats.wrongCount + stats.unansweredCount,
    }));
  };

  // Overall statistics
  const getOverallStats = () => {
    const finishedCount = participants.filter((p) => p.isFinished).length;
    const totalScore = participants.reduce((sum, p) => sum + (p.sumScore || 0), 0);
    const avgScore = participants.length > 0 ? totalScore / participants.length : 0;
    const maxScore = participants.length > 0 && participants[0].maxScore 
      ? participants[0].maxScore 
      : 0;
    
    const ranked = [...participants]
      .filter((p) => p.sumScore !== undefined)
      .sort((a, b) => (b.sumScore || 0) - (a.sumScore || 0));
    
    const highestScore = ranked.length > 0 ? ranked[0].sumScore || 0 : 0;
    const lowestScore = ranked.length > 0 
      ? ranked[ranked.length - 1].sumScore || 0 
      : 0;

    return {
      totalParticipants: participants.length,
      finishedCount,
      unfinishedCount: participants.length - finishedCount,
      finishRate: participants.length > 0 
        ? Math.round((finishedCount / participants.length) * 100) 
        : 0,
      avgScore: avgScore.toFixed(2),
      highestScore,
      lowestScore,
      maxScore,
    };
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
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          بازگشت
        </Button>
      </div>
    );
  }

  const questionAnalysis = getQuestionAnalysis();
  const optionAnalysis = getOptionSelectionAnalysis();
  const scanAnalysis = getScanResultsAnalysis();
  const scoreDistribution = getScoreDistribution();
  const categoryPerformance = getCategoryPerformance();
  const overallStats = getOverallStats();

  return (
    <div className="container py-8" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">آمار پیشرفته آزمون</h1>
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
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          بازگشت
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="questions">تحلیل سوالات</TabsTrigger>
          <TabsTrigger value="options">تحلیل گزینه‌ها</TabsTrigger>
          <TabsTrigger value="scan">آمار اسکن</TabsTrigger>
          <TabsTrigger value="categories">عملکرد دسته‌بندی</TabsTrigger>
          <TabsTrigger value="distribution">توزیع نمرات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">تعداد شرکت‌کنندگان</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{overallStats.totalParticipants}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {overallStats.finishedCount} نفر تکمیل شده ({overallStats.finishRate}%)
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">میانگین نمره</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{overallStats.avgScore}</div>
                <div className="text-sm text-gray-500 mt-1">
                  از {overallStats.maxScore} نمره
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">بالاترین نمره</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{overallStats.highestScore}</div>
                <div className="text-sm text-gray-500 mt-1">
                  از {overallStats.maxScore} نمره
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">پایین‌ترین نمره</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{overallStats.lowestScore}</div>
                <div className="text-sm text-gray-500 mt-1">
                  از {overallStats.maxScore} نمره
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="text-right">توزیع نمرات</CardTitle>
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
                      <Bar dataKey="count" name="تعداد دانش‌آموزان" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader>
                <CardTitle className="text-right">عملکرد بر اساس دسته‌بندی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="performanceRate" name="درصد موفقیت" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Question Analysis Tab */}
        <TabsContent value="questions" className="space-y-6" dir="rtl">
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">تحلیل تفصیلی سوالات</CardTitle>
              <p className="text-sm text-gray-500 mt-2 text-right">
                درصد پاسخ صحیح، اشتباه و بدون پاسخ برای هر سوال
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره</TableHead>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">متن سوال</TableHead>
                      <TableHead className="text-right">درصد صحیح</TableHead>
                      <TableHead className="text-right">درصد اشتباه</TableHead>
                      <TableHead className="text-right">بدون پاسخ</TableHead>
                      <TableHead className="text-right">ضریب سختی</TableHead>
                      <TableHead className="text-right">جمع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questionAnalysis.map((q) => (
                      <TableRow key={q.questionId}>
                        <TableCell className="font-medium">{q.questionNum}</TableCell>
                        <TableCell>{q.category}</TableCell>
                        <TableCell className="max-w-xs truncate" title={q.questionText}>
                          {q.questionText}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center flex-row-reverse">
                            {q.correctPercentage}%
                            <div className="w-16 bg-green-100 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${q.correctPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center flex-row-reverse">
                            {q.wrongPercentage}%
                            <div className="w-16 bg-red-100 rounded-full h-2 mr-2">
                              <div
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${q.wrongPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center flex-row-reverse">
                            {q.unansweredPercentage}%
                            <div className="w-16 bg-gray-100 rounded-full h-2 mr-2">
                              <div
                                className="bg-gray-600 h-2 rounded-full"
                                style={{ width: `${q.unansweredPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center flex-row-reverse">
                            {q.difficultyRate}%
                            <div
                              className={`h-2.5 rounded-full mr-2 ${
                                q.difficultyRate > 70
                                  ? "bg-red-500"
                                  : q.difficultyRate > 40
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              }`}
                              style={{ width: `${q.difficultyRate}%` }}
                            ></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          صحیح: {q.correctCount} | اشتباه: {q.wrongCount} | بدون پاسخ: {q.unansweredCount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">نمودار ضریب سختی سوالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="questionNum" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="correctPercentage" name="درصد صحیح" fill="#00C49F" />
                    <Bar dataKey="wrongPercentage" name="درصد اشتباه" fill="#FF8042" />
                    <Bar dataKey="unansweredPercentage" name="بدون پاسخ" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Option Selection Analysis Tab */}
        <TabsContent value="options" className="space-y-6" dir="rtl">
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">تحلیل انتخاب گزینه‌ها</CardTitle>
              <p className="text-sm text-gray-500 mt-2 text-right">
                تعداد انتخاب هر گزینه برای هر سوال
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره</TableHead>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">گزینه ۱</TableHead>
                      <TableHead className="text-right">گزینه ۲</TableHead>
                      <TableHead className="text-right">گزینه ۳</TableHead>
                      <TableHead className="text-right">گزینه ۴</TableHead>
                      <TableHead className="text-right">بدون پاسخ</TableHead>
                      <TableHead className="text-right">گزینه صحیح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {optionAnalysis.map((q) => (
                      <TableRow key={q.questionId}>
                        <TableCell className="font-medium">{q.questionNum}</TableCell>
                        <TableCell>{q.category}</TableCell>
                        <TableCell>
                          <div className={`p-2 rounded ${
                            q.correctOption === 1 ? "bg-green-100 font-bold" : "bg-gray-50"
                          }`}>
                            {q.option1Text} ({q.option1})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`p-2 rounded ${
                            q.correctOption === 2 ? "bg-green-100 font-bold" : "bg-gray-50"
                          }`}>
                            {q.option2Text} ({q.option2})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`p-2 rounded ${
                            q.correctOption === 3 ? "bg-green-100 font-bold" : "bg-gray-50"
                          }`}>
                            {q.option3Text} ({q.option3})
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`p-2 rounded ${
                            q.correctOption === 4 ? "bg-green-100 font-bold" : "bg-gray-50"
                          }`}>
                            {q.option4Text} ({q.option4})
                          </div>
                        </TableCell>
                        <TableCell>{q.unanswered}</TableCell>
                        <TableCell className="font-bold text-green-600">
                          گزینه {q.correctOption}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scan Results Analysis Tab */}
        <TabsContent value="scan" className="space-y-6" dir="rtl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">تعداد اسکن شده</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{scanAnalysis.totalScanned}</div>
                <div className="text-sm text-gray-500 mt-1">
                  از {participants.length} نفر
                </div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">میانگین پاسخ صحیح</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{scanAnalysis.avgRightAnswers}</div>
                <div className="text-sm text-gray-500 mt-1">در هر پاسخ‌برگ</div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">میانگین پاسخ اشتباه</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{scanAnalysis.avgWrongAnswers}</div>
                <div className="text-sm text-gray-500 mt-1">در هر پاسخ‌برگ</div>
              </CardContent>
            </Card>

            <Card dir="rtl">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-right">میانگین چند گزینه</CardTitle>
              </CardHeader>
              <CardContent className="text-right">
                <div className="text-3xl font-bold">{scanAnalysis.avgMultipleAnswers}</div>
                <div className="text-sm text-gray-500 mt-1">در هر پاسخ‌برگ</div>
              </CardContent>
            </Card>
          </div>

          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">جزئیات اسکن پاسخ‌برگ‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام کاربر</TableHead>
                      <TableHead className="text-right">پاسخ صحیح</TableHead>
                      <TableHead className="text-right">پاسخ اشتباه</TableHead>
                      <TableHead className="text-right">چند گزینه</TableHead>
                      <TableHead className="text-right">بدون پاسخ</TableHead>
                      <TableHead className="text-right">تصویر اسکن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanAnalysis.scanDetails.map((detail) => (
                      <TableRow key={detail.participantId}>
                        <TableCell>{detail.userName}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {detail.rightCount}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {detail.wrongCount}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          {detail.multipleCount}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {detail.unansweredCount}
                        </TableCell>
                        <TableCell>
                          {detail.hasImage ? (
                            <span className="text-green-600">✓ دارد</span>
                          ) : (
                            <span className="text-gray-400">✗ ندارد</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Performance Tab */}
        <TabsContent value="categories" className="space-y-6" dir="rtl">
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">عملکرد بر اساس دسته‌بندی سوالات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="performanceRate" name="درصد موفقیت" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">جدول تفصیلی دسته‌بندی‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">درصد موفقیت</TableHead>
                      <TableHead className="text-right">تعداد صحیح</TableHead>
                      <TableHead className="text-right">تعداد اشتباه</TableHead>
                      <TableHead className="text-right">بدون پاسخ</TableHead>
                      <TableHead className="text-right">جمع سوالات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPerformance.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center flex-row-reverse">
                            {cat.performanceRate}%
                            <div className="w-24 bg-gray-100 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${cat.performanceRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {cat.correctCount}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {cat.wrongCount}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {cat.unansweredCount}
                        </TableCell>
                        <TableCell>{cat.totalQuestions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6" dir="rtl">
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">توزیع نمرات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="تعداد دانش‌آموزان" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right">جدول توزیع نمرات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">بازه نمره</TableHead>
                      <TableHead className="text-right">تعداد</TableHead>
                      <TableHead className="text-right">درصد</TableHead>
                      <TableHead className="text-right">نمودار</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scoreDistribution.map((range) => {
                      const percentage = participants.length > 0
                        ? Math.round((range.count / participants.length) * 100)
                        : 0;
                      return (
                        <TableRow key={range.name}>
                          <TableCell className="font-medium">{range.name}</TableCell>
                          <TableCell>{range.count}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                          <TableCell>
                            <div className="flex items-center flex-row-reverse">
                              {percentage}%
                              <div className="w-32 bg-gray-100 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
