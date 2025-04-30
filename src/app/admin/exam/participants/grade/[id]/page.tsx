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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Answer {
  questionId: string;
  answer: string;
  isCorrect?: boolean | null;
  maxScore?: number;
  earnedScore?: number | null;
  category?: string;
  needsGrading?: boolean;
  teacherComment?: string;
}

interface ExamInfo {
  _id: string;
  data: {
    examName: string;
    examCode: string;
  };
}

interface Question {
  _id: string;
  question: {
    _id: string;
    question: string;
    type: string;
    correctoption?: number;
    option1?: string;
    option2?: string;
    option3?: string;
    option4?: string;
    cat1?: string;
    correctOptionId?: string;
  };
  category?: string;
  score?: number;
}

export default function GradeParticipantAnswers({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = React.use(params);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [questions, setQuestions] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch participant data
      const participantResponse = await fetch(`/api/examparticipant/${id}`);
      if (!participantResponse.ok) {
        throw new Error("Failed to fetch participant data");
      }
      const participantData = await participantResponse.json();
      setParticipant(participantData);

      // Fetch exam information
      const examResponse = await fetch(`/api/exams/${participantData.examId}`);
      if (!examResponse.ok) {
        throw new Error("Failed to fetch exam information");
      }
      const examData = await examResponse.json();
      setExamInfo(examData);

      // Fetch questions
      const questionsResponse = await fetch(
        `/api/examquestions/${participantData.examId}`
      );
      if (!questionsResponse.ok) {
        throw new Error("Failed to fetch exam questions");
      }
      const questionsData = await questionsResponse.json();

      // Convert questions array to map for easier lookup
      const questionsMap: Record<string, Question> = {};
      questionsData.forEach((q: Question) => {
        questionsMap[q._id] = q;
      });
      setQuestions(questionsMap);

      // Initialize scores and comments from existing data
      const initialScores: Record<string, number> = {};
      const initialComments: Record<string, string> = {};
      participantData.answers.forEach((answer: Answer) => {
        initialScores[answer.questionId] = answer.earnedScore || 0;
        initialComments[answer.questionId] = answer.teacherComment || "";
      });
      setScores(initialScores);
      setComments(initialComments);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (questionId: string, value: string) => {
    const score = parseFloat(value);
    if (!isNaN(score)) {
      setScores((prev) => ({
        ...prev,
        [questionId]: score,
      }));
    }
  };

  const handleCommentChange = (questionId: string, value: string) => {
    setComments((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSave = async () => {
    if (!participant) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Prepare updated answers with new scores and comments
      const updatedAnswers = participant.answers.map((answer) => {
        return {
          ...answer,
          earnedScore: scores[answer.questionId] || 0,
          teacherComment: comments[answer.questionId] || "",
          isCorrect: scores[answer.questionId] > 0 ? true : false,
          needsGrading: false,
        };
      });

      // Calculate new totals
      const totalEarnedScore = updatedAnswers.reduce(
        (sum, answer) => sum + (scores[answer.questionId] || 0),
        0
      );
      const totalMaxScore = updatedAnswers.reduce(
        (sum, answer) => sum + (answer.maxScore || 0),
        0
      );
      const correctCount = updatedAnswers.filter(
        (a) => a.isCorrect === true
      ).length;
      const wrongCount = updatedAnswers.filter(
        (a) => a.isCorrect === false
      ).length;
      const unansweredCount = updatedAnswers.filter(
        (a) => !a.answer || a.answer.trim() === ""
      ).length;

      // Prepare update data
      const updateData = {
        answers: updatedAnswers,
        sumScore: totalEarnedScore,
        maxScore: totalMaxScore,
        correctAnswerCount: correctCount,
        wrongAnswerCount: wrongCount,
        unansweredCount: unansweredCount,
        gradingStatus: "manualGraded",
      };

      // Send update to server
      const response = await fetch(`/api/examparticipant/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to save grading");
      }

      setSaveSuccess(true);
      // Update local state with new data
      setParticipant((prev) => (prev ? { ...prev, ...updateData } : null));

      // Show success message for 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving grades:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save grades"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center">
          <Spinner className="h-12 w-12" />
          <p className="mt-4 text-lg text-gray-600">
            در حال بارگذاری داده‌ها...
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
              خطا در بارگذاری اطلاعات
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

  if (!participant || !examInfo) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl text-orange-800">
              اطلاعات یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p>اطلاعات شرکت‌کننده یا آزمون در دسترس نیست.</p>
            <Button className="mt-4" onClick={() => router.back()}>
              <ArrowLeftIcon className="h-4 w-4 ml-2" />
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group answers by category
  const answersByCategory: Record<string, Answer[]> = {};
  participant.answers.forEach((answer) => {
    const category = answer.category || "بدون دسته‌بندی";
    if (!answersByCategory[category]) {
      answersByCategory[category] = [];
    }
    answersByCategory[category].push(answer);
  });

  // Create tabs for categories
  const categories = Object.keys(answersByCategory);

  return (
    <div className="container mx-auto max-w-6xl p-4 pb-20" dir="rtl">
      <Card className="shadow-lg mb-8">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                تصحیح پاسخ‌های آزمون: {examInfo.data.examName}
              </CardTitle>
              <CardDescription className="text-blue-100 mt-1">
                {participant.userName || participant.userId} | کد آزمون:{" "}
                {examInfo.data.examCode}
              </CardDescription>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="outline"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 ml-2" />
                بازگشت به لیست شرکت‌کنندگان
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-lg font-bold mb-2">اطلاعات تصحیح</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">نمره کل</p>
                <p className="text-lg font-bold">
                  {participant.sumScore} از {participant.maxScore}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">تعداد سوالات</p>
                <p className="text-lg font-bold">
                  {participant.answers.length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">پاسخ‌های صحیح</p>
                <p className="text-lg font-bold text-green-600">
                  {participant.correctAnswerCount || 0}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">پاسخ‌های نادرست</p>
                <p className="text-lg font-bold text-red-600">
                  {participant.wrongAnswerCount || 0}
                </p>
              </div>
            </div>
          </div>

          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]}>
              <TabsList className="mb-6">
                {categories.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">شماره</TableHead>
                        <TableHead className="text-right">سوال</TableHead>
                        <TableHead className="text-right">
                          پاسخ دانش‌آموز
                        </TableHead>
                        <TableHead className="text-right">
                          نمره (از {participant.maxScore})
                        </TableHead>
                        <TableHead className="text-right">
                          توضیحات معلم
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {answersByCategory[category].map((answer, index) => {
                        const question = questions[answer.questionId];
                        const maxScore = answer.maxScore || 1;

                        return (
                          <TableRow key={answer.questionId}>
                            <TableCell className="font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <MathJax>
                                <div
                                  dangerouslySetInnerHTML={renderHTML(
                                    question?.question?.question ||
                                      "سوال موجود نیست"
                                  )}
                                ></div>
                              </MathJax>
                            </TableCell>
                            <TableCell>
                              <MathJax>
                                <div
                                  className="max-w-xs break-words"
                                  dangerouslySetInnerHTML={renderHTML(
                                    answer.answer || "بدون پاسخ"
                                  )}
                                ></div>
                              </MathJax>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min={0}
                                max={maxScore}
                                step={0.25}
                                value={scores[answer.questionId] || 0}
                                onChange={(e) =>
                                  handleScoreChange(
                                    answer.questionId,
                                    e.target.value
                                  )
                                }
                                className="w-20"
                              />
                              <span className="text-sm text-gray-500 mr-2">
                                از {maxScore}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Textarea
                                placeholder="توضیحات"
                                value={comments[answer.questionId] || ""}
                                onChange={(e) =>
                                  handleCommentChange(
                                    answer.questionId,
                                    e.target.value
                                  )
                                }
                                className="text-sm resize-none h-20"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12 text-gray-500">
              هیچ پاسخی برای این آزمون ثبت نشده است.
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-gray-50 p-4 flex justify-between">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4 ml-2" />
            انصراف
          </Button>
          <div className="flex items-center">
            {saveSuccess && (
              <span className="text-green-600 ml-2 flex items-center">
                <CheckCircleIcon className="h-5 w-5 ml-1" />
                با موفقیت ذخیره شد
              </span>
            )}
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Spinner className="h-4 w-4 ml-2" />
                  در حال ذخیره...
                </>
              ) : (
                <>
                  <PencilSquareIcon className="h-4 w-4 ml-2" />
                  ذخیره نمرات
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
