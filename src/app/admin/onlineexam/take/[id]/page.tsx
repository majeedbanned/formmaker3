"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Question {
  _id: string;
  examId: string;
  question: {
    _id: string;
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    correctoption?: number;
    type: string;
  };
  category: string;
  score: number;
}

interface Exam {
  _id: string;
  data: {
    examCode: string;
    examName: string;
    schoolCode: string;
    allQuestionsInOnePage: {
      examTime: string;
      isActive: boolean;
    };
    settings: {
      questionsDirection: string;
      preexammessage: string;
      postexammessage: string;
    };
  };
}

// Function to safely render HTML with image path prefixing
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

export default function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [alreadyParticipated, setAlreadyParticipated] = useState(false);

  // Convert seconds to mm:ss format
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Fetch exam details and questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Check if user already participated in this exam
        const checkResponse = await fetch(`/api/examstudentsinfo/check/${id}`);
        const checkData = await checkResponse.json();

        if (checkData.participated) {
          setAlreadyParticipated(true);
          return;
        }

        // Fetch exam details
        const examResponse = await fetch(`/api/exam/${id}`);
        if (!examResponse.ok) {
          throw new Error("Failed to fetch exam");
        }
        const examData = await examResponse.json();
        setExam(examData);

        // Initialize timer
        if (
          examData.data.allQuestionsInOnePage?.isActive &&
          examData.data.allQuestionsInOnePage?.examTime
        ) {
          const minutes =
            parseInt(examData.data.allQuestionsInOnePage.examTime, 10) || 60;
          setTimeLeft(minutes * 60);
        }

        // Fetch questions
        const questionsResponse = await fetch(`/api/examquestions/${id}`);
        if (!questionsResponse.ok) {
          throw new Error("Failed to fetch questions");
        }
        const questionsData: Question[] = await questionsResponse.json();
        setQuestions(questionsData);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(questionsData.map((q) => q.category)),
        ];
        setCategories(uniqueCategories);

        // Set first category as active tab
        if (uniqueCategories.length > 0) {
          setActiveTab(uniqueCategories[0]);
        }
      } catch (error) {
        console.error("Error fetching exam data:", error);
        toast.error("خطا در بارگذاری آزمون");
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || !exam?.data.allQuestionsInOnePage?.isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          saveExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, exam]);

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Save temporarily
  const saveTemporarily = async () => {
    await saveExam(false);
  };

  // Finalize exam
  const finishExam = async () => {
    await saveExam(true);
  };

  // Save exam to database
  const saveExam = async (isFinished: boolean) => {
    setSaving(true);
    try {
      // Format answers for the database
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        examId: id,
      }));

      // Save responses
      const responseResult = await fetch("/api/examstudentsresponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });

      if (!responseResult.ok) {
        throw new Error("Failed to save answers");
      }

      // Save exam info
      const infoResult = await fetch("/api/examstudentsinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: id,
          entryTime: new Date().toISOString(),
          entryDate: new Date().toISOString(),
          isFinished,
        }),
      });

      if (!infoResult.ok) {
        throw new Error("Failed to save exam info");
      }

      toast.success(
        isFinished ? "آزمون با موفقیت ثبت شد" : "پاسخ‌ها موقتاً ذخیره شدند"
      );

      if (isFinished) {
        // Redirect back to exams page if finished
        router.push("/admin/onlineexam");
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      toast.error("خطا در ذخیره پاسخ‌ها");
    } finally {
      setSaving(false);
      setShowConfirmFinish(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (alreadyParticipated) {
    return (
      <div className="container mx-auto max-w-7xl p-4" dir="rtl">
        <Card className="shadow-lg">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-xl text-yellow-800">
              شما قبلاً در این آزمون شرکت کرده‌اید
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">امکان شرکت مجدد در این آزمون وجود ندارد.</p>
            <Button onClick={() => router.push("/admin/onlineexam")}>
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl p-4" dir="rtl">
        <Card className="shadow-lg">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl text-red-800">
              آزمون یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">اطلاعات آزمون قابل دسترسی نیست.</p>
            <Button onClick={() => router.push("/admin/onlineexam")}>
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only continue if allQuestionsInOnePage is active
  if (!exam.data.allQuestionsInOnePage?.isActive) {
    return (
      <div className="container mx-auto max-w-7xl p-4" dir="rtl">
        <Card className="shadow-lg">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-xl text-yellow-800">
              این آزمون در حال حاضر فعال نیست
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4">لطفاً با ادمین سیستم تماس بگیرید.</p>
            <Button onClick={() => router.push("/admin/onlineexam")}>
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-10 rtl" dir="rtl">
      <Card className="shadow-lg mb-6">
        <CardHeader className="bg-blue-50 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-xl text-blue-800">
              {exam.data.examName}
            </CardTitle>
            <p className="text-sm text-blue-600 mt-1">
              کد آزمون: {exam.data.examCode}
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-md font-mono text-lg">
            {formatTime(timeLeft)}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {exam.data.settings?.preexammessage && (
            <div className="bg-blue-50 p-4 rounded-md mb-6 text-blue-800">
              {exam.data.settings.preexammessage}
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="mb-6 flex flex-wrap">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-sm md:text-base"
                >
                  {category === "test1"
                    ? "سوالات تستی"
                    : category === "essay"
                    ? "سوالات تشریحی"
                    : category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <div className="space-y-8">
                  {questions
                    .filter((q) => q.category === category)
                    .map((question, index) => (
                      <div
                        key={question._id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            سوال {index + 1}{" "}
                            {question.score > 0 && `(${question.score} نمره)`}
                          </h3>
                        </div>
                        <div
                          className="mb-4"
                          dangerouslySetInnerHTML={renderHTML(
                            question.question.question
                          )}
                        />

                        {/* Multiple choice questions */}
                        {question.question.type === " تستی " && (
                          <RadioGroup
                            value={answers[question._id] || ""}
                            onValueChange={(value) =>
                              handleAnswerChange(question._id, value)
                            }
                            className="space-y-4"
                          >
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                              <div className="flex items-start">
                                <RadioGroupItem
                                  value="1"
                                  id={`${question._id}-option1`}
                                  className="ml-2"
                                />
                                <Label
                                  htmlFor={`${question._id}-option1`}
                                  className="cursor-pointer"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option1
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start">
                                <RadioGroupItem
                                  value="2"
                                  id={`${question._id}-option2`}
                                  className="ml-2"
                                />
                                <Label
                                  htmlFor={`${question._id}-option2`}
                                  className="cursor-pointer"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option2
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start">
                                <RadioGroupItem
                                  value="3"
                                  id={`${question._id}-option3`}
                                  className="ml-2"
                                />
                                <Label
                                  htmlFor={`${question._id}-option3`}
                                  className="cursor-pointer"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option3
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start">
                                <RadioGroupItem
                                  value="4"
                                  id={`${question._id}-option4`}
                                  className="ml-2"
                                />
                                <Label
                                  htmlFor={`${question._id}-option4`}
                                  className="cursor-pointer"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option4
                                    )}
                                  />
                                </Label>
                              </div>
                            </div>
                          </RadioGroup>
                        )}

                        {/* Essay questions */}
                        {question.question.type === " تشریحی " && (
                          <Textarea
                            placeholder="پاسخ خود را اینجا بنویسید..."
                            className="min-h-[100px] w-full"
                            value={answers[question._id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(question._id, e.target.value)
                            }
                          />
                        )}
                      </div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={saveTemporarily}
          disabled={saving}
          className="border-blue-500 text-blue-500 hover:bg-blue-50"
        >
          ذخیره موقت
        </Button>
        <Button
          onClick={() => setShowConfirmFinish(true)}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700"
        >
          پایان و ثبت آزمون
        </Button>
      </div>

      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تایید پایان آزمون</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از پایان دادن به آزمون اطمینان دارید؟ پس از تایید، امکان
              ویرایش پاسخ‌ها وجود نخواهد داشت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse justify-start gap-2">
            <AlertDialogAction
              onClick={finishExam}
              className="bg-green-600 hover:bg-green-700"
            >
              تایید و پایان آزمون
            </AlertDialogAction>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
