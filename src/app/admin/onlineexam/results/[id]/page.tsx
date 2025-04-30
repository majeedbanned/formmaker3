"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";

interface ExamResultsData {
  userResults: {
    userName: string;
    sumScore: number;
    maxScore: number;
    correctAnswerCount: number;
    wrongAnswerCount: number;
    unansweredCount: number;
    examName: string;
    examCode: string;
    completionDate: string;
    persianCompletionDate: string;
  };
  categoryResults: {
    category: string;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unansweredQuestions: number;
    earnedScore: number;
    maxScore: number;
  }[];
  schoolStats: {
    totalParticipants: number;
    averageScore: number;
    averagePercentage: number;
    userRank: number;
    percentile: number;
    maxPossibleScore: number;
  };
  detailedAnswers: {
    questionId: string;
    category: string;
    userAnswer: string;
    isCorrect: boolean | null;
    earnedScore: number | null;
    maxScore: number;
  }[];
}

export default function ExamResults({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [results, setResults] = useState<ExamResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/examresults/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch exam results");
        }
        setResults(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching results");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [id]);

  // Function to get performance level based on percentage
  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { label: "عالی", color: "bg-green-500" };
    if (percentage >= 75) return { label: "خوب", color: "bg-blue-500" };
    if (percentage >= 60) return { label: "قابل قبول", color: "bg-yellow-500" };
    if (percentage >= 40)
      return { label: "نیاز به تلاش بیشتر", color: "bg-orange-500" };
    return { label: "ضعیف", color: "bg-red-500" };
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center">
          <Spinner className="h-12 w-12" />
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری نتایج...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl text-red-800 flex items-center">
              <XCircleIcon className="h-6 w-6 mr-2" />
              خطا در بارگذاری نتایج
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button
              className="mt-4"
              onClick={() => router.push("/admin/onlineexam")}
            >
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl text-orange-800">
              نتیجه‌ای یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>اطلاعات نتیجه آزمون در دسترس نیست.</p>
            <Button
              className="mt-4"
              onClick={() => router.push("/admin/onlineexam")}
            >
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate percentages and performance levels
  const scorePercentage =
    (results.userResults.sumScore / results.userResults.maxScore) * 100;
  const performanceLevel = getPerformanceLevel(scorePercentage);

  return (
    <div className="container mx-auto max-w-7xl p-4 pb-20" dir="rtl">
      <Card className="shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                نتایج آزمون: {results.userResults.examName}
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                کد آزمون: {results.userResults.examCode}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push("/admin/onlineexam")}
            >
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت به لیست آزمون‌ها
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-2">
                <CardTitle className="text-lg text-gray-800 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 ml-2 text-blue-600" />
                  خلاصه عملکرد
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                      نمره شما: {results.userResults.sumScore} از{" "}
                      {results.userResults.maxScore}
                    </span>
                    <span className="text-sm font-medium">
                      {scorePercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={scorePercentage}
                    className={`h-3 ${performanceLevel.color}`}
                  />
                  <div className="mt-1 text-sm text-right text-gray-500">
                    سطح عملکرد: {performanceLevel.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6">
                  <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mb-1" />
                    <div className="text-xl font-bold text-green-700">
                      {results.userResults.correctAnswerCount}
                    </div>
                    <div className="text-xs text-gray-600">پاسخ صحیح</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-red-50 rounded-lg">
                    <XCircleIcon className="h-6 w-6 text-red-500 mb-1" />
                    <div className="text-xl font-bold text-red-700">
                      {results.userResults.wrongAnswerCount}
                    </div>
                    <div className="text-xs text-gray-600">پاسخ نادرست</div>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <MinusCircleIcon className="h-6 w-6 text-gray-400 mb-1" />
                    <div className="text-xl font-bold text-gray-700">
                      {results.userResults.unansweredCount}
                    </div>
                    <div className="text-xs text-gray-600">بدون پاسخ</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-2">
                <CardTitle className="text-lg text-gray-800 flex items-center">
                  <TrophyIcon className="h-5 w-5 ml-2 text-amber-500" />
                  رتبه‌بندی
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-center bg-blue-50 px-6 py-3 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {results.schoolStats.userRank}
                    </div>
                    <div className="text-sm text-gray-600">
                      از {results.schoolStats.totalParticipants} شرکت‌کننده
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      درصد رتبه (صدک)
                    </div>
                    <div className="text-lg font-semibold">
                      {results.schoolStats.percentile.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">
                      میانگین نمرات
                    </div>
                    <div className="text-lg font-semibold">
                      {results.schoolStats.averageScore.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Category Performance & Details */}
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="categories" className="text-base">
                <ChartBarIcon className="h-4 w-4 ml-2" />
                عملکرد به تفکیک دسته‌بندی
              </TabsTrigger>
              <TabsTrigger value="comparison" className="text-base">
                <UserGroupIcon className="h-4 w-4 ml-2" />
                مقایسه با دیگران
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="p-1">
              <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">تعداد سوالات</TableHead>
                      <TableHead className="text-right">
                        پاسخ‌های صحیح
                      </TableHead>
                      <TableHead className="text-right">
                        پاسخ‌های نادرست
                      </TableHead>
                      <TableHead className="text-right">بدون پاسخ</TableHead>
                      <TableHead className="text-right">نمره</TableHead>
                      <TableHead className="text-right">عملکرد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.categoryResults.map((category, index) => {
                      const categoryPercentage =
                        category.maxScore > 0
                          ? (category.earnedScore / category.maxScore) * 100
                          : 0;
                      const catPerformance =
                        getPerformanceLevel(categoryPercentage);

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {category.category}
                          </TableCell>
                          <TableCell>{category.totalQuestions}</TableCell>
                          <TableCell className="text-green-600">
                            {category.correctAnswers}
                          </TableCell>
                          <TableCell className="text-red-600">
                            {category.wrongAnswers}
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {category.unansweredQuestions}
                          </TableCell>
                          <TableCell>
                            {category.earnedScore} از {category.maxScore}
                          </TableCell>
                          <TableCell>
                            <div className="w-full">
                              <Progress
                                value={categoryPercentage}
                                className={`h-2 ${catPerformance.color}`}
                              />
                              <div className="mt-1 text-xs">
                                {categoryPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4 p-1">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 pb-3">
                  <CardTitle className="text-lg text-purple-800">
                    مقایسه عملکرد با سایر شرکت‌کنندگان
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">نمره شما</span>
                        <span className="text-sm font-medium">
                          {scorePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={scorePercentage}
                        className="h-4 bg-gray-100"
                      >
                        <div
                          className="h-full bg-blue-600 rounded-r-sm flex items-center justify-center text-xs text-white"
                          style={{ width: `${scorePercentage}%` }}
                        >
                          {scorePercentage > 15
                            ? `${results.userResults.sumScore}`
                            : ""}
                        </div>
                      </Progress>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">میانگین مدرسه</span>
                        <span className="text-sm font-medium">
                          {results.schoolStats.averagePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={results.schoolStats.averagePercentage}
                        className="h-4 bg-gray-100"
                      >
                        <div
                          className="h-full bg-green-500 rounded-r-sm flex items-center justify-center text-xs text-white"
                          style={{
                            width: `${results.schoolStats.averagePercentage}%`,
                          }}
                        >
                          {results.schoolStats.averagePercentage > 15
                            ? `${results.schoolStats.averageScore.toFixed(1)}`
                            : ""}
                        </div>
                      </Progress>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          تعداد شرکت‌کنندگان
                        </div>
                        <div className="text-xl font-bold text-blue-700">
                          {results.schoolStats.totalParticipants}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          میانگین نمره
                        </div>
                        <div className="text-xl font-bold text-green-700">
                          {results.schoolStats.averageScore.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <div className="text-sm text-gray-600 mb-1">
                          رتبه شما
                        </div>
                        <div className="text-xl font-bold text-purple-700">
                          {results.schoolStats.userRank} از{" "}
                          {results.schoolStats.totalParticipants}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="bg-gray-50 p-6 flex justify-between">
          <div className="text-sm text-gray-500">
            تاریخ تکمیل آزمون: {results.userResults.persianCompletionDate}
          </div>
          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            چاپ نتایج
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
