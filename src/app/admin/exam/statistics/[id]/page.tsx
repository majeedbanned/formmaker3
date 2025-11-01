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
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
        // Use scanResult data if available (more accurate)
        if (participant.scanResult) {
          const isCorrect = participant.scanResult.rightAnswers?.includes(questionNum);
          const isWrong = participant.scanResult.wrongAnswers?.includes(questionNum);
          const isUnanswered = participant.scanResult.unAnswered?.includes(questionNum);
          const isMultiple = participant.scanResult.multipleAnswers?.includes(questionNum);

          if (isCorrect) {
            correctCount++;
            totalAttempts++;
          } else if (isWrong || isMultiple) {
            wrongCount++;
            totalAttempts++;
          } else if (isUnanswered) {
            unansweredCount++;
          }

          // Track option selections from scanResult
          if (participant.scanResult.Useranswers) {
            const userAnswer = participant.scanResult.Useranswers[index];
            if (userAnswer && userAnswer >= 1 && userAnswer <= 4) {
              optionSelections[userAnswer] = (optionSelections[userAnswer] || 0) + 1;
            }
          }
        } else {
          // Fallback to answers array if no scanResult
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

            // Track option selections from answer field
            if (answer.answer) {
              const answerNum = parseInt(answer.answer);
              if (answerNum >= 1 && answerNum <= 4) {
                optionSelections[answerNum] = (optionSelections[answerNum] || 0) + 1;
              }
            }
          } else {
            unansweredCount++;
          }
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
        cat1: question.question.cat1,
        questionText: question.question.question, // Full HTML question text
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
        const questionNum = index + 1;
        
        // Use scanResult data if available (more accurate)
        if (participant.scanResult) {
          const isUnanswered = participant.scanResult.unAnswered?.includes(questionNum);
          
          if (isUnanswered) {
            optionStats.unanswered++;
          } else if (participant.scanResult.Useranswers) {
            const userAnswer = participant.scanResult.Useranswers[index];
            if (userAnswer === 1) optionStats.option1++;
            else if (userAnswer === 2) optionStats.option2++;
            else if (userAnswer === 3) optionStats.option3++;
            else if (userAnswer === 4) optionStats.option4++;
            else optionStats.unanswered++;
          }
        } else {
          // Fallback to answers array if no scanResult
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
        questionText: question.question.question, // Full HTML question text
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

  // Generate AI Analysis
  const generateAIAnalysis = async () => {
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      // Prepare comprehensive statistics
      const statsData = {
        examName: examInfo?.data.examName || "آزمون",
        examCode: examInfo?.data.examCode || "",
        totalParticipants: overallStats.totalParticipants,
        finishedCount: overallStats.finishedCount,
        averageScore: parseFloat(overallStats.avgScore),
        maxScore: overallStats.maxScore,
        highestScore: overallStats.highestScore,
        lowestScore: overallStats.lowestScore,
        questionAnalysis: questionAnalysis.map(q => ({
          questionNum: q.questionNum,
          category: q.category,
          topic: q.cat1 || q.category, // cat1 is the specific topic
          correctPercentage: q.correctPercentage,
          wrongPercentage: q.wrongPercentage,
          unansweredPercentage: q.unansweredPercentage,
          difficultyRate: q.difficultyRate,
          correctCount: q.correctCount,
          wrongCount: q.wrongCount,
          unansweredCount: q.unansweredCount,
        })),
        categoryPerformance: categoryPerformance.map(c => ({
          category: c.category,
          performanceRate: c.performanceRate,
          correctCount: c.correctCount,
          wrongCount: c.wrongCount,
          unansweredCount: c.unansweredCount,
        })),
        scanAnalysis: scanAnalysis.totalScanned > 0 ? {
          totalScanned: scanAnalysis.totalScanned,
          totalNotScanned: scanAnalysis.totalNotScanned,
          avgRightAnswers: scanAnalysis.avgRightAnswers,
          avgWrongAnswers: scanAnalysis.avgWrongAnswers,
          avgMultipleAnswers: scanAnalysis.avgMultipleAnswers,
          avgUnanswered: scanAnalysis.avgUnanswered,
        } : undefined,
        scoreDistribution: scoreDistribution.map(d => ({
          range: d.name,
          count: d.count,
          percentage: participants.length > 0
            ? Math.round((d.count / participants.length) * 100)
            : 0,
        })),
      };

      const response = await fetch(`/api/exams/${id}/ai-analysis`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statistics: statsData }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI analysis");
      }

      const data = await response.json();
      setAiAnalysis(data.analysis);
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      setAiError(error instanceof Error ? error.message : "خطا در تولید تحلیل هوش مصنوعی");
    } finally {
      setIsGeneratingAI(false);
    }
  };

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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="questions">تحلیل سوالات</TabsTrigger>
          <TabsTrigger value="options">تحلیل گزینه‌ها</TabsTrigger>
          <TabsTrigger value="scan">آمار اسکن</TabsTrigger>
          <TabsTrigger value="categories">عملکرد دسته‌بندی</TabsTrigger>
          <TabsTrigger value="distribution">توزیع نمرات</TabsTrigger>
          <TabsTrigger value="ai">🤖 تحلیل هوش مصنوعی</TabsTrigger>
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
              <div className="space-y-4">
                {questionAnalysis.map((q) => (
                  <div
                    key={q.questionId}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-4 pb-3 border-b">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                        {q.questionNum}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          دسته‌بندی: <span className="font-medium text-gray-700">{q.category}</span>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-800"
                          dangerouslySetInnerHTML={{ __html: q.questionText }}
                        />
                      </div>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Correct Percentage */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">پاسخ صحیح</div>
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {q.correctPercentage}%
                        </div>
                        <div className="w-full bg-green-100 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${q.correctPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.correctCount} نفر
                        </div>
                      </div>

                      {/* Wrong Percentage */}
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">پاسخ اشتباه</div>
                        <div className="text-2xl font-bold text-red-600 mb-2">
                          {q.wrongPercentage}%
                        </div>
                        <div className="w-full bg-red-100 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{ width: `${q.wrongPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.wrongCount} نفر
                        </div>
                      </div>

                      {/* Unanswered Percentage */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">بدون پاسخ</div>
                        <div className="text-2xl font-bold text-gray-600 mb-2">
                          {q.unansweredPercentage}%
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gray-600 h-2 rounded-full"
                            style={{ width: `${q.unansweredPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.unansweredCount} نفر
                        </div>
                      </div>

                      {/* Difficulty Rate */}
                      <div className={`rounded-lg p-3 ${
                        q.difficultyRate > 70
                          ? "bg-red-50"
                          : q.difficultyRate > 40
                          ? "bg-orange-50"
                          : "bg-green-50"
                      }`}>
                        <div className="text-xs text-gray-600 mb-1">ضریب سختی</div>
                        <div className={`text-2xl font-bold mb-2 ${
                          q.difficultyRate > 70
                            ? "text-red-600"
                            : q.difficultyRate > 40
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}>
                          {q.difficultyRate}%
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              q.difficultyRate > 70
                                ? "bg-red-500"
                                : q.difficultyRate > 40
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${q.difficultyRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {q.difficultyRate > 70
                            ? "سوال سخت"
                            : q.difficultyRate > 40
                            ? "سوال متوسط"
                            : "سوال آسان"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                نمایش تعداد و درصد انتخاب هر گزینه توسط دانش‌آموزان - گزینه صحیح با پس‌زمینه سبز نشان داده شده
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {optionAnalysis.map((q) => (
                  <div
                    key={q.questionId}
                    className="border rounded-lg p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-blue-100">
                      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-md">
                        {q.questionNum}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {q.category}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            ✓ پاسخ صحیح: گزینه {q.correctOption}
                          </span>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: q.questionText }}
                        />
                      </div>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1 */}
                      <div className={`rounded-lg p-4 border-2 transition-all ${
                        q.correctOption === 1 
                          ? "bg-green-50 border-green-400 shadow-md" 
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              q.correctOption === 1
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              ۱
                            </div>
                            {q.correctOption === 1 && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                                ✓ صحیح
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`text-2xl font-bold ${
                              q.correctOption === 1 ? "text-green-600" : "text-gray-700"
                            }`}>
                              {q.option1}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((q.option1 / q.total) * 100)}% انتخاب
                            </div>
                          </div>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 mb-3"
                          dangerouslySetInnerHTML={{ __html: q.option1Text }}
                        />
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              q.correctOption === 1 ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.round((q.option1 / q.total) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Option 2 */}
                      <div className={`rounded-lg p-4 border-2 transition-all ${
                        q.correctOption === 2 
                          ? "bg-green-50 border-green-400 shadow-md" 
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              q.correctOption === 2
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              ۲
                            </div>
                            {q.correctOption === 2 && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                                ✓ صحیح
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`text-2xl font-bold ${
                              q.correctOption === 2 ? "text-green-600" : "text-gray-700"
                            }`}>
                              {q.option2}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((q.option2 / q.total) * 100)}% انتخاب
                            </div>
                          </div>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 mb-3"
                          dangerouslySetInnerHTML={{ __html: q.option2Text }}
                        />
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              q.correctOption === 2 ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.round((q.option2 / q.total) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Option 3 */}
                      <div className={`rounded-lg p-4 border-2 transition-all ${
                        q.correctOption === 3 
                          ? "bg-green-50 border-green-400 shadow-md" 
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              q.correctOption === 3
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              ۳
                            </div>
                            {q.correctOption === 3 && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                                ✓ صحیح
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`text-2xl font-bold ${
                              q.correctOption === 3 ? "text-green-600" : "text-gray-700"
                            }`}>
                              {q.option3}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((q.option3 / q.total) * 100)}% انتخاب
                            </div>
                          </div>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 mb-3"
                          dangerouslySetInnerHTML={{ __html: q.option3Text }}
                        />
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              q.correctOption === 3 ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.round((q.option3 / q.total) * 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Option 4 */}
                      <div className={`rounded-lg p-4 border-2 transition-all ${
                        q.correctOption === 4 
                          ? "bg-green-50 border-green-400 shadow-md" 
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              q.correctOption === 4
                                ? "bg-green-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}>
                              ۴
                            </div>
                            {q.correctOption === 4 && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-medium">
                                ✓ صحیح
                              </span>
                            )}
                          </div>
                          <div className="text-left">
                            <div className={`text-2xl font-bold ${
                              q.correctOption === 4 ? "text-green-600" : "text-gray-700"
                            }`}>
                              {q.option4}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((q.option4 / q.total) * 100)}% انتخاب
                            </div>
                          </div>
                        </div>
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 mb-3"
                          dangerouslySetInnerHTML={{ __html: q.option4Text }}
                        />
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              q.correctOption === 4 ? "bg-green-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.round((q.option4 / q.total) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Unanswered Summary */}
                    {q.unanswered > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-yellow-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span className="font-medium text-yellow-800">
                              بدون پاسخ: {q.unanswered} نفر
                            </span>
                          </div>
                          <span className="text-sm text-yellow-700">
                            ({Math.round((q.unanswered / q.total) * 100)}%)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Quick Stats Summary */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">جمع شرکت‌کنندگان</div>
                          <div className="font-bold text-gray-700">{q.total}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">محبوب‌ترین انتخاب</div>
                          <div className="font-bold text-blue-600">
                            گزینه {(() => {
                              const counts = [q.option1, q.option2, q.option3, q.option4];
                              const maxCount = Math.max(...counts);
                              return counts.indexOf(maxCount) + 1;
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">بیشترین انتخاب</div>
                          <div className="font-bold text-purple-600">
                            {Math.max(q.option1, q.option2, q.option3, q.option4)} نفر
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">کمترین انتخاب</div>
                          <div className="font-bold text-orange-600">
                            {Math.min(q.option1, q.option2, q.option3, q.option4)} نفر
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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

        {/* AI Analysis Tab */}
        <TabsContent value="ai" className="space-y-6" dir="rtl">
          <Card dir="rtl">
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                🤖 تحلیل توسط هوش مصنوعی
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2 text-right">
                دریافت تحلیل جامع و توصیه‌های آموزشی از هوش مصنوعی بر اساس آمار آزمون
              </p>
            </CardHeader>
            <CardContent>
              {!aiAnalysis ? (
                <div className="text-center py-12">
                  <div className="mb-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      تحلیل هوشمند آمار آزمون
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                      با کلیک روی دکمه زیر، هوش مصنوعی تمام آمار آزمون را تحلیل کرده و 
                      یک گزارش جامع شامل نقاط قوت، نقاط ضعف و توصیه‌های آموزشی ارائه می‌دهد.
                    </p>
                    
                    {/* Features List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto text-right">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-blue-600 text-2xl mb-2">📊</div>
                        <h4 className="font-bold text-blue-900 mb-1">تحلیل عمیق</h4>
                        <p className="text-sm text-blue-700">
                          بررسی دقیق همه جنبه‌های آزمون
                        </p>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-green-600 text-2xl mb-2">💡</div>
                        <h4 className="font-bold text-green-900 mb-1">توصیه‌های عملی</h4>
                        <p className="text-sm text-green-700">
                          راهکارهای کاربردی برای بهبود
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-purple-600 text-2xl mb-2">🎯</div>
                        <h4 className="font-bold text-purple-900 mb-1">شناسایی مشکلات</h4>
                        <p className="text-sm text-purple-700">
                          تشخیص سوالات و مفاهیم چالش‌برانگیز
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={generateAIAnalysis}
                      disabled={isGeneratingAI}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
                    >
                      {isGeneratingAI ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 ml-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          در حال تحلیل توسط هوش مصنوعی...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 ml-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          تحلیل هوشمند آزمون
                        </>
                      )}
                    </Button>

                    {aiError && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
                        <div className="flex items-start gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-red-600 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <div>
                            <h4 className="font-bold text-red-900 mb-1">خطا</h4>
                            <p className="text-sm text-red-700">{aiError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Analysis Display */}
                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">
                            تحلیل هوش مصنوعی
                          </h3>
                          <p className="text-sm text-gray-600">
                            تحلیل شده توسط GPT-4
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={generateAIAnalysis}
                          disabled={isGeneratingAI}
                          variant="outline"
                          className="text-sm"
                        >
                          {isGeneratingAI ? "در حال تولید..." : "🔄 تحلیل مجدد"}
                        </Button>
                        <Button
                          onClick={() => {
                            const blob = new Blob([aiAnalysis], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `AI-Analysis-${examInfo?.data.examCode || 'exam'}.md`;
                            a.click();
                          }}
                          variant="outline"
                          className="text-sm"
                        >
                          💾 دانلود
                        </Button>
                      </div>
                    </div>
                    
                    {/* Markdown Content */}
                    <div className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed">
                      {aiAnalysis.split('\n').map((line, index) => {
                        // Headers
                        if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-purple-900">{line.replace('### ', '')}</h3>;
                        }
                        if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-purple-900">{line.replace('## ', '')}</h2>;
                        }
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-3xl font-bold mt-10 mb-5 text-purple-900">{line.replace('# ', '')}</h1>;
                        }
                        
                        // Check for formatting
                        const boldRegex = /\*\*(.*?)\*\*/g;
                        const italicRegex = /\*(.*?)\*/g;
                        
                        const boldMatches = [...line.matchAll(boldRegex)];
                        const italicMatches = [...line.matchAll(italicRegex)];
                        
                        if (boldMatches.length > 0 || italicMatches.length > 0 || line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
                          return (
                            <p key={index} className="mb-2" dangerouslySetInnerHTML={{
                              __html: line
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                .replace(/^- /, '• ')
                                .replace(/^\d+\. /, (match) => `<span class="font-bold text-purple-600">${match}</span> `)
                            }} />
                          );
                        }
                        
                        // Regular paragraphs
                        if (line.trim()) {
                          return <p key={index} className="mb-4 text-justify">{line}</p>;
                        }
                        
                        return <br key={index} />;
                      })}
                    </div>
                  </div>

                  {/* Additional Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">📈</div>
                      <div className="text-sm text-gray-600 mb-1">میانگین کلاس</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((parseFloat(overallStats.avgScore) / overallStats.maxScore) * 100)}%
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-sm text-gray-600 mb-1">نرخ تکمیل</div>
                      <div className="text-2xl font-bold text-green-600">
                        {overallStats.finishRate}%
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl mb-2">⭐</div>
                      <div className="text-sm text-gray-600 mb-1">بالاترین نمره</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {overallStats.highestScore}/{overallStats.maxScore}
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <strong>نکته:</strong> این تحلیل توسط هوش مصنوعی تولید شده و ممکن است همیشه دقیق نباشد.
                        لطفاً از قضاوت حرفه‌ای خود استفاده کنید و این تحلیل را به عنوان یک راهنما در نظر بگیرید.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
