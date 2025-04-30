"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MathJax } from "better-react-mathjax";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  ArrowLeftIcon,
  PrinterIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  _id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
  category?: string;
  maxScore: number;
  explanation?: string;
}

interface ExamData {
  examName: string;
  examCode: string;
}

interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean | null;
  maxScore: number;
  earnedScore: number | null;
  category?: string;
}

interface UserInfo {
  userName: string;
  examCompleted: boolean;
  completionDate: string;
  persianCompletionDate: string;
}

interface AnswersheetData {
  userInfo: UserInfo;
  examData: ExamData;
  questions: Question[];
  answers: Answer[];
}

export default function ParticipantAnswersheet({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const [answersheet, setAnswersheet] = useState<AnswersheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const renderHTML = (html: string | undefined) => {
    if (!html) return { __html: "" };

    // First pattern: Match img tags with src attribute in single quotes
    let processed = html.replace(
      /<img([^>]*)\ssrc='([^']+)'([^>]*)>/g,
      (match, before, src, after) => {
        // Don't add prefix if it already has the prefix or is a data URL
        if (
          src.startsWith("https://file.farsamooz.ir/q/") ||
          src.startsWith("data:image")
        ) {
          return match;
        }

        return `<img${before} src='https://file.farsamooz.ir/q/${src}'${after}>`;
      }
    );

    // Second pattern: Match img tags with src attribute in double quotes
    processed = processed.replace(
      /<img([^>]*)\ssrc="([^"]+)"([^>]*)>/g,
      (match, before, src, after) => {
        // Don't add prefix if it already has the prefix or is a data URL
        if (
          src.startsWith("https://file.farsamooz.ir/q/") ||
          src.startsWith("data:image")
        ) {
          return match;
        }

        return `<img${before} src="https://file.farsamooz.ir/q/${src}"${after}>`;
      }
    );

    return { __html: processed };
  };

  useEffect(() => {
    async function fetchAnswersheet() {
      try {
        const response = await fetch(`/api/examparticipant/answersheet/${id}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch exam answersheet"
          );
        }
        const data = await response.json();
        setAnswersheet(data);

        // Set the first category as active if there are categories
        if (data.questions.length > 0) {
          const categories = Array.from(
            new Set(
              data.questions.map(
                (q: Question) => q.category || "بدون دسته‌بندی"
              )
            )
          );
          if (categories.length > 0) {
            setActiveCategory(categories[0] as string);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error fetching answersheet"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnswersheet();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center">
          <Spinner className="h-12 w-12" />
          <p className="mt-4 text-lg text-gray-600">
            در حال بارگذاری پاسخنامه...
          </p>
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
              خطا در بارگذاری پاسخنامه
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!answersheet) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl text-orange-800">
              پاسخنامه‌ای یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>اطلاعات پاسخنامه آزمون در دسترس نیست.</p>
            <Button className="mt-4" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group questions by category
  const questionsByCategory: Record<string, Question[]> = {};
  const categories: string[] = [];

  answersheet.questions.forEach((question) => {
    const category = question.category || "بدون دسته‌بندی";
    if (!questionsByCategory[category]) {
      questionsByCategory[category] = [];
      categories.push(category);
    }
    questionsByCategory[category].push(question);
  });

  return (
    <div className="container mx-auto max-w-7xl p-4 pb-20 print:p-0" dir="rtl">
      <Card className="shadow-lg mb-8 print:shadow-none">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white print:bg-white print:text-black">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                پاسخنامه آزمون: {answersheet.examData.examName}
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1 print:text-gray-600">
                {answersheet.userInfo.userName} | کد آزمون:{" "}
                {answersheet.examData.examCode}
              </CardDescription>
            </div>
            <div className="flex space-x-2 space-x-reverse print:hidden">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={handlePrint}
              >
                <PrinterIcon className="h-4 w-4 ml-2" />
                چاپ پاسخنامه
              </Button>
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 ml-2" />
                بازگشت
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold mb-2">اطلاعات آزمون</h3>
            <p className="text-gray-700">
              تاریخ تکمیل: {answersheet.userInfo.persianCompletionDate}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">کل سوالات</p>
                <p className="text-lg font-bold">
                  {answersheet.questions.length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">پاسخ‌های صحیح</p>
                <p className="text-lg font-bold text-green-600">
                  {
                    answersheet.answers.filter((a) => a.isCorrect === true)
                      .length
                  }
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">پاسخ‌های نادرست</p>
                <p className="text-lg font-bold text-red-600">
                  {
                    answersheet.answers.filter((a) => a.isCorrect === false)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4">پاسخنامه سوالات</h3>

            {categories.length > 1 ? (
              <Tabs
                defaultValue={activeCategory || categories[0]}
                onValueChange={setActiveCategory as (value: string) => void}
              >
                <TabsList className="mb-6">
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent key={category} value={category}>
                    {renderQuestionsSection(
                      questionsByCategory[category],
                      answersheet.answers
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              renderQuestionsSection(answersheet.questions, answersheet.answers)
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 flex justify-between print:hidden">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <Button variant="default" onClick={handlePrint}>
            <PrinterIcon className="h-4 w-4 ml-2" />
            چاپ پاسخنامه
          </Button>
        </CardFooter>
      </Card>

      <style jsx global>{`
        @media print {
          body * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:bg-white {
            background: white !important;
            background-image: none !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );

  function renderQuestionsSection(questions: Question[], answers: Answer[]) {
    return (
      <div>
        {questions.map((question, index) => {
          const answer = answers.find((a) => a.questionId === question._id);

          return (
            <div
              key={question._id}
              className="mb-8 pb-6 border-b border-gray-200 last:border-b-0"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-bold flex items-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-gray-100 h-6 w-6 text-sm font-medium mr-2">
                    {index + 1}
                  </span>
                  {question.category && (
                    <Badge variant="outline" className="mr-2 bg-gray-50">
                      {question.category}
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center">
                  {answer?.isCorrect === true && (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircleIcon className="h-5 w-5 mr-1" />
                      پاسخ صحیح {answer.earnedScore}/{question.maxScore}
                    </span>
                  )}
                  {answer?.isCorrect === false && (
                    <span className="flex items-center text-red-600 text-sm">
                      <XCircleIcon className="h-5 w-5 mr-1" />
                      پاسخ نادرست {answer.earnedScore || 0}/{question.maxScore}
                    </span>
                  )}
                  {answer?.isCorrect === null && (
                    <span className="flex items-center text-gray-500 text-sm">
                      <MinusCircleIcon className="h-5 w-5 mr-1" />
                      بدون پاسخ 0/{question.maxScore}
                    </span>
                  )}
                </div>
              </div>
              <MathJax>
                <div className="mb-3">
                  <div
                    className="text-gray-800 mb-3"
                    dangerouslySetInnerHTML={renderHTML(question.text)}
                  ></div>
                </div>
              </MathJax>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {question.options.map((option) => {
                  const isUserAnswer = answer?.userAnswer === option.id;
                  const isCorrectAnswer =
                    question.correctOptionId === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`border rounded-md p-3 flex items-start ${
                        isCorrectAnswer
                          ? "bg-green-50 border-green-200"
                          : isUserAnswer && !isCorrectAnswer
                          ? "bg-red-50 border-red-200"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {isCorrectAnswer ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : isUserAnswer ? (
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-gray-300"></div>
                        )}
                      </div>
                      <MathJax>
                        <div className="ml-3 mr-2">
                          <div
                            dangerouslySetInnerHTML={renderHTML(option.text)}
                          ></div>
                        </div>
                      </MathJax>
                    </div>
                  );
                })}
              </div>

              {question.explanation && (
                <div className="mt-4 bg-blue-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
                    <MathJax>
                      <div
                        className="mr-2 text-blue-700 text-sm"
                        dangerouslySetInnerHTML={renderHTML(
                          question.explanation
                        )}
                      ></div>
                    </MathJax>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
