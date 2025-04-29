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
import { ClockIcon, BookOpenIcon, CheckCircleIcon } from "lucide-react";
import dayjs from "dayjs";
import jalaliday from "jalaliday";
import "dayjs/locale/fa";

// Initialize dayjs
dayjs.extend(jalaliday);
dayjs.locale("fa");

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

interface StudentResponse {
  questionId: string;
  answer: string;
  examId: string;
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
  const [examFinished, setExamFinished] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [firstEntryTime, setFirstEntryTime] = useState<Date | null>(null);
  const [persianEntryDateTime, setPersianEntryDateTime] = useState<
    string | null
  >(null);

  // Convert seconds to mm:ss format
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate remaining time based on entry time and exam duration
  const calculateRemainingTime = (entryTime: Date, durationMinutes: number) => {
    const examEndTime = new Date(
      entryTime.getTime() + durationMinutes * 60 * 1000
    );
    const now = new Date();
    const diffMs = examEndTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  // Fetch exam details and questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        // Check if user already participated in this exam
        const checkResponse = await fetch(`/api/examstudentsinfo/check/${id}`);
        const checkData = await checkResponse.json();

        if (checkData.participated) {
          if (checkData.isFinished) {
            setExamFinished(true);
            return;
          }

          // Load entry time if available
          if (checkData.entryTime) {
            setFirstEntryTime(new Date(checkData.entryTime));
          }

          // Load Persian date/time if available
          if (checkData.persianEntryDate) {
            setPersianEntryDateTime(checkData.persianEntryDate);
          }

          // Load saved answers if available
          if (checkData.answers && checkData.answers.length > 0) {
            const answersMap: Record<string, string> = {};
            checkData.answers.forEach((response: StudentResponse) => {
              answersMap[response.questionId] = response.answer;
            });
            setAnswers(answersMap);

            setLastSaveTime(dayjs().locale("fa").format("HH:mm:ss"));
          }
        } else {
          // Set current time as first entry time for new participants
          setFirstEntryTime(new Date());
          setPersianEntryDateTime(
            dayjs().locale("fa").format("YYYY/MM/DD HH:mm:ss")
          );
        }

        // Fetch exam details
        const examResponse = await fetch(`/api/exam/${id}`);
        if (!examResponse.ok) {
          throw new Error("Failed to fetch exam");
        }
        const examData = await examResponse.json();
        setExam(examData);

        // Initialize timer based on first entry time if available
        if (
          examData.data.allQuestionsInOnePage?.isActive &&
          examData.data.allQuestionsInOnePage?.examTime
        ) {
          const durationMinutes =
            parseInt(examData.data.allQuestionsInOnePage.examTime, 10) || 60;

          if (firstEntryTime) {
            // Calculate remaining time based on first entry time
            const remainingSeconds = calculateRemainingTime(
              firstEntryTime,
              durationMinutes
            );
            setTimeLeft(remainingSeconds);
          } else {
            // Set full duration for new participants
            setTimeLeft(durationMinutes * 60);
          }
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

  // Update timer when firstEntryTime is set
  useEffect(() => {
    if (!firstEntryTime || !exam?.data.allQuestionsInOnePage?.isActive) return;

    const durationMinutes =
      parseInt(exam.data.allQuestionsInOnePage.examTime, 10) || 60;
    const remainingSeconds = calculateRemainingTime(
      firstEntryTime,
      durationMinutes
    );
    setTimeLeft(remainingSeconds);
  }, [firstEntryTime, exam]);

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

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!exam || Object.keys(answers).length === 0 || examFinished) return;

    const autoSaveTimer = setInterval(() => {
      saveTemporarily(false);
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [answers, exam, examFinished]);

  // Handle answer changes
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Save temporarily
  const saveTemporarily = async (showToast = true) => {
    await saveExam(false, showToast);
  };

  // Finalize exam
  const finishExam = async () => {
    await saveExam(true);
  };

  // Save exam to database
  const saveExam = async (isFinished: boolean, showToast = true) => {
    setSaving(true);
    try {
      // Format answers for the database
      const responses = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
        examId: id,
      }));

      // Prepare entry time data
      const entryTimeData = firstEntryTime
        ? firstEntryTime.toISOString()
        : new Date().toISOString();

      // Save exam info with responses
      const infoResult = await fetch("/api/examstudentsinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: id,
          entryTime: entryTimeData,
          isFinished,
          responses,
        }),
      });

      if (!infoResult.ok) {
        throw new Error("Failed to save exam info");
      }

      // Update last save time
      setLastSaveTime(dayjs().locale("fa").format("HH:mm:ss"));

      if (showToast) {
        toast.success(
          isFinished ? "آزمون با موفقیت ثبت شد" : "پاسخ‌ها موقتاً ذخیره شدند"
        );
      }

      if (isFinished) {
        // Set exam as finished locally
        setExamFinished(true);
        // Redirect back to exams page if finished
        router.push("/admin/onlineexam");
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      if (showToast) {
        toast.error("خطا در ذخیره پاسخ‌ها");
      }
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

  if (examFinished) {
    return (
      <div className="container mx-auto max-w-7xl p-4" dir="rtl">
        <Card className="shadow-lg border-orange-300">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-xl text-orange-800 flex items-center">
              <CheckCircleIcon className="ml-2 h-6 w-6" />
              شما قبلاً در این آزمون شرکت کرده‌اید
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-700">
              امکان شرکت مجدد در این آزمون وجود ندارد.
            </p>
            <Button
              onClick={() => router.push("/admin/onlineexam")}
              className="bg-orange-600 hover:bg-orange-700"
            >
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
        <Card className="shadow-lg border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl text-red-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              آزمون یافت نشد
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-700">
              اطلاعات آزمون قابل دسترسی نیست.
            </p>
            <Button
              onClick={() => router.push("/admin/onlineexam")}
              className="bg-red-600 hover:bg-red-700"
            >
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
        <Card className="shadow-lg border-yellow-300">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="text-xl text-yellow-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              این آزمون در حال حاضر فعال نیست
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-700">
              لطفاً با ادمین سیستم تماس بگیرید.
            </p>
            <Button
              onClick={() => router.push("/admin/onlineexam")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              بازگشت به لیست آزمون‌ها
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto pb-10 rtl" dir="rtl">
      <Card className="shadow-lg mb-6 border-blue-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-l from-blue-50 to-blue-100 flex flex-row justify-between items-center">
          <div className="flex items-center">
            <BookOpenIcon className="ml-2 h-6 w-6 text-blue-600" />
            <div>
              <CardTitle className="text-xl text-blue-800">
                {exam.data.examName}
              </CardTitle>
              <p className="text-sm text-blue-600 mt-1">
                کد آزمون: {exam.data.examCode}
              </p>
              {persianEntryDateTime && (
                <p className="text-xs text-gray-600 mt-1">
                  زمان شروع: {persianEntryDateTime}
                </p>
              )}
              {lastSaveTime && (
                <p className="text-xs text-gray-600 mt-1">
                  آخرین ذخیره: {lastSaveTime}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white border border-blue-300 shadow-sm text-blue-800 px-4 py-2 rounded-md font-mono text-lg flex items-center">
            <ClockIcon className="ml-2 h-5 w-5 text-blue-600" />
            {formatTime(timeLeft)}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {exam.data.settings?.preexammessage && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-md mb-6 text-blue-800">
              {exam.data.settings.preexammessage}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            dir="rtl"
            className="border border-gray-100 rounded-lg p-1 bg-gray-50"
          >
            <TabsList className="mb-6 flex flex-wrap bg-white w-full p-1 border border-gray-100 rounded-md shadow-sm">
              {categories.map((category) => {
                // Calculate question count and total score for this category
                const categoryQuestions = questions.filter(
                  (q) => q.category === category
                );
                const questionCount = categoryQuestions.length;
                const totalScore = categoryQuestions.reduce(
                  (sum, q) => sum + (q.score || 0),
                  0
                );

                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="text-sm md:text-base px-4 py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-none flex flex-col items-center"
                  >
                    <span className="font-medium">
                      {category === "test1"
                        ? "سوالات تستی"
                        : category === "essay"
                        ? "سوالات تشریحی"
                        : category}
                    </span>
                    <div className="flex items-center mt-1 gap-2 text-xs text-gray-500">
                      <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                        {questionCount} سوال
                      </span>
                      <span className="flex items-center bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {totalScore} نمره
                      </span>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((category) => {
              // Get questions for this category and their total score
              const categoryQuestions = questions.filter(
                (q) => q.category === category
              );
              const totalScore = categoryQuestions.reduce(
                (sum, q) => sum + (q.score || 0),
                0
              );

              return (
                <TabsContent
                  key={category}
                  value={category}
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <div className="mb-4 px-4 py-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <h2 className="font-semibold text-gray-800">
                      {category === "test1"
                        ? "سوالات تستی"
                        : category === "essay"
                        ? "سوالات تشریحی"
                        : category}
                    </h2>
                    <div className="flex gap-3">
                      <span className="flex items-center text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                        </svg>
                        {categoryQuestions.length} سوال
                      </span>
                      <span className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        مجموع نمره: {totalScore}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-8">
                    {categoryQuestions.map((question, index) => (
                      <div
                        key={question._id}
                        className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between mb-4 pb-2 border-b border-gray-100">
                          <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                            <span className="flex items-center justify-center rounded-full bg-blue-100 text-blue-800 w-7 h-7 ml-2 text-sm">
                              {index + 1}
                            </span>
                            <span>
                              {question.score > 0 && (
                                <span className="text-blue-600 mr-2">
                                  ({question.score} نمره)
                                </span>
                              )}
                            </span>
                          </h3>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {question.question.type}
                          </span>
                        </div>
                        <div
                          className="mb-6 leading-relaxed text-gray-700"
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
                              <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-3 rounded-lg transition-colors border border-gray-100 hover:border-blue-200">
                                <RadioGroupItem
                                  value="1"
                                  id={`${question._id}-option1`}
                                  className="ml-3 mt-1"
                                />
                                <Label
                                  htmlFor={`${question._id}-option1`}
                                  className="cursor-pointer w-full text-gray-700"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option1
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-3 rounded-lg transition-colors border border-gray-100 hover:border-blue-200">
                                <RadioGroupItem
                                  value="2"
                                  id={`${question._id}-option2`}
                                  className="ml-3 mt-1"
                                />
                                <Label
                                  htmlFor={`${question._id}-option2`}
                                  className="cursor-pointer w-full text-gray-700"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option2
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-3 rounded-lg transition-colors border border-gray-100 hover:border-blue-200">
                                <RadioGroupItem
                                  value="3"
                                  id={`${question._id}-option3`}
                                  className="ml-3 mt-1"
                                />
                                <Label
                                  htmlFor={`${question._id}-option3`}
                                  className="cursor-pointer w-full text-gray-700"
                                >
                                  <div
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.question.option3
                                    )}
                                  />
                                </Label>
                              </div>
                              <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-3 rounded-lg transition-colors border border-gray-100 hover:border-blue-200">
                                <RadioGroupItem
                                  value="4"
                                  id={`${question._id}-option4`}
                                  className="ml-3 mt-1"
                                />
                                <Label
                                  htmlFor={`${question._id}-option4`}
                                  className="cursor-pointer w-full text-gray-700"
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
                            className="min-h-[150px] w-full border-gray-200 focus:border-blue-300 focus:ring-blue-200"
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
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => saveTemporarily()}
          disabled={saving}
          className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-5 rounded-lg shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          ذخیره موقت
        </Button>
        <Button
          onClick={() => setShowConfirmFinish(true)}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-lg shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          پایان و ثبت آزمون
        </Button>
      </div>

      <AlertDialog open={showConfirmFinish} onOpenChange={setShowConfirmFinish}>
        <AlertDialogContent
          dir="rtl"
          className="bg-white rounded-lg max-w-md mx-auto"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-gray-800 font-bold">
              تایید پایان آزمون
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              آیا از پایان دادن به آزمون اطمینان دارید؟ پس از تایید، امکان
              ویرایش پاسخ‌ها وجود نخواهد داشت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse justify-start gap-2 mt-6">
            <AlertDialogAction
              onClick={finishExam}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-md text-white"
            >
              تایید و پایان آزمون
            </AlertDialogAction>
            <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-md">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
