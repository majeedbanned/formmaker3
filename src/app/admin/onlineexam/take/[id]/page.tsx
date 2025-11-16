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
import { MathJax } from "better-react-mathjax";

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
  responseTime?: number; // Time in seconds for this question
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
    separatePages?: {
      isActive: boolean;
      questionTime: string;
    };
    imageFile?: {
      isActive: boolean;
      examTime: string;
      imageFile: string[]; // Array of image URLs
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

// Image Popup Component
const ImagePopup = ({
  images,
  currentIndex,
  onNext,
  onPrev,
  onClose,
}: {
  images: string[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) => {
  if (!images || images.length === 0) return null;

  // console.log("images", images);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      dir="rtl"
    >
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg">
            تصویر سوالات ({currentIndex + 1} از {images.length})
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-blue-700 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <img
            src={`${images[currentIndex].path}`}
            alt={`صفحه ${currentIndex + 1}`}
            className="max-w-full mx-auto"
          />
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onPrev}
            disabled={currentIndex <= 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            صفحه قبلی
          </button>

          <span className="flex items-center text-gray-600">
            {currentIndex + 1} از {images.length}
          </span>

          <button
            onClick={onNext}
            disabled={currentIndex >= images.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            صفحه بعدی
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
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
  const [serverDateTime, setServerDateTime] = useState<string>("");

  // For separate pages mode
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState<number>(0);
  const [isQuestionTimerActive, setIsQuestionTimerActive] =
    useState<boolean>(false);

  // For image-based exam mode
  const [showImagePopup, setShowImagePopup] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [imageExamTimeLeft, setImageExamTimeLeft] = useState<number>(0);

  // Convert seconds to mm:ss format
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Fetch server time
  const fetchServerTime = async () => {
    try {
      const response = await fetch('/api/server-time');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setServerDateTime(data.serverTime.persian);
        }
      }
    } catch (error) {
      console.error('Error fetching server time:', error);
    }
  };

  // Update server time every minute
  useEffect(() => {
    fetchServerTime(); // Initial fetch
    const interval = setInterval(fetchServerTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time based on entry time and exam duration
  const calculateRemainingTime = (entryTime: Date, durationMinutes: number) => {
    const examEndTime = new Date(
      entryTime.getTime() + durationMinutes * 60 * 1000
    );
    const now = new Date();
    const diffMs = examEndTime.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };

  // Calculate remaining time for a question
  const calculateQuestionRemainingTime = (
    questionResponseTime?: number,
    defaultTime?: string
  ) => {
    // First check if the question has its own response time
    if (questionResponseTime) {
      return questionResponseTime;
    }
    // Otherwise use the default time from exam settings
    if (defaultTime) {
      return parseInt(defaultTime, 10);
    }
    // Fallback to 60 seconds
    return 60;
  };

  // Start the timer for the current question
  const startQuestionTimer = (questionIndex: number) => {
    const currentQuestion = questions[questionIndex];
    if (!currentQuestion) return;

    const defaultTime = exam?.data.separatePages?.questionTime;
    const questionTime = calculateQuestionRemainingTime(
      currentQuestion.responseTime,
      defaultTime
    );

    setQuestionTimeLeft(questionTime);
    setIsQuestionTimerActive(true);
  };

  // Move to the next question
  const moveToNextQuestion = () => {
    // Save the current answer first
    saveTemporarily(false);

    // If we're at the last question, show confirmation dialog
    if (currentQuestionIndex >= questions.length - 1) {
      setShowConfirmFinish(true);
      return;
    }

    // Otherwise move to the next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setIsQuestionTimerActive(false);

    // Start the timer for the next question
    startQuestionTimer(currentQuestionIndex + 1);
  };

  // Auto-move to next question when time expires
  useEffect(() => {
    if (
      !isQuestionTimerActive ||
      questionTimeLeft > 0 ||
      !exam?.data.separatePages?.isActive
    )
      return;

    // console.log("Question time expired", {
    //   currentQuestionIndex,
    //   total: questions.length,
    // });

    // Time's up for this question
    if (currentQuestionIndex >= questions.length - 1) {
      // If this is the last question, automatically finish the exam
      // console.log("Last question reached, finishing exam");
      saveExam(true);
    } else {
      // Otherwise move to the next question
      // console.log("Moving to next question", currentQuestionIndex + 1);

      // Save current answer first
      saveTemporarily(false);

      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setIsQuestionTimerActive(false);

      // Start the timer for the next question after a short delay
      setTimeout(() => {
        // console.log("Starting timer for next question", nextIndex);
        startQuestionTimer(nextIndex);
      }, 300);
    }
  }, [
    questionTimeLeft,
    isQuestionTimerActive,
    currentQuestionIndex,
    questions.length,
    exam?.data.separatePages?.isActive,
  ]);

  // Question timer countdown
  useEffect(() => {
    if (
      !isQuestionTimerActive ||
      questionTimeLeft <= 0 ||
      !exam?.data.separatePages?.isActive
    )
      return;

    const timer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    questionTimeLeft,
    isQuestionTimerActive,
    exam?.data.separatePages?.isActive,
  ]);

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

        // Initialize timer for image-based exam
        if (
          examData.data.imageFile?.isActive &&
          examData.data.imageFile?.examTime
        ) {
          const durationMinutes =
            parseInt(examData.data.imageFile.examTime, 10) || 60;

          if (firstEntryTime) {
            // Calculate remaining time based on first entry time
            const remainingSeconds = calculateRemainingTime(
              firstEntryTime,
              durationMinutes
            );
            setImageExamTimeLeft(remainingSeconds);
          } else {
            // Set full duration for new participants
            setImageExamTimeLeft(durationMinutes * 60);
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

        // If in separate pages mode, prepare question navigation
        if (examData.data.separatePages?.isActive && questionsData.length > 0) {
          // Set the current question to the first unanswered question
          if (
            checkData.participated &&
            checkData.answers &&
            checkData.answers.length > 0
          ) {
            // Create a map to easily check if a question is answered
            const answersMap: Record<string, string> = {};
            checkData.answers.forEach((response: StudentResponse) => {
              answersMap[response.questionId] = response.answer;
            });

            // Find the first unanswered question
            const firstUnansweredIndex = questionsData.findIndex(
              (q) => !answersMap[q._id] || answersMap[q._id].trim() === ""
            );

            // If all questions are answered, show the last question
            // Otherwise show the first unanswered question
            const indexToShow =
              firstUnansweredIndex === -1
                ? questionsData.length - 1
                : firstUnansweredIndex;

            setCurrentQuestionIndex(indexToShow);

            // Start timer for this question
            setTimeout(() => {
              startQuestionTimer(indexToShow);
            }, 300);
          } else {
            // No previous answers, start with the first question
            setTimeout(() => {
              startQuestionTimer(0);
            }, 300);
          }
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

  // Ensure question timer starts when exam data and questions are loaded
  useEffect(() => {
    if (
      loading ||
      !exam?.data.separatePages?.isActive ||
      questions.length === 0 ||
      isQuestionTimerActive ||
      questionTimeLeft > 0
    ) {
      return;
    }

    // Start the timer for the first question if it hasn't started yet
    startQuestionTimer(currentQuestionIndex);
  }, [
    loading,
    exam,
    questions,
    isQuestionTimerActive,
    questionTimeLeft,
    currentQuestionIndex,
  ]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!exam || Object.keys(answers).length === 0 || examFinished) return;

    const autoSaveTimer = setInterval(() => {
      saveTemporarily(false);
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [answers, exam, examFinished]);

  // Update timer when firstEntryTime is set for allQuestionsInOnePage mode
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

  // Timer countdown for allQuestionsInOnePage mode
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
  }, [timeLeft, exam?.data.allQuestionsInOnePage?.isActive]);

  // Timer countdown for imageFile mode
  useEffect(() => {
    if (imageExamTimeLeft <= 0 || !exam?.data.imageFile?.isActive) return;

    const timer = setInterval(() => {
      setImageExamTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          saveExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [imageExamTimeLeft, exam?.data.imageFile?.isActive]);

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
        // Close the confirmation dialog
        setShowConfirmFinish(false);
        // Redirect back to exams page if finished
        setTimeout(() => {
          router.push("/admin/onlineexam");
        }, 500);
      }
    } catch (error) {
      console.error("Error saving exam:", error);
      if (showToast) {
        toast.error("خطا در ذخیره پاسخ‌ها");
      }
    } finally {
      setSaving(false);
    }
  };

  // Handle image navigation
  const nextImage = () => {
    if (!exam?.data.imageFile?.imageFile) return;

    if (currentImageIndex < exam.data.imageFile.imageFile.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  // Toggle image popup
  const toggleImagePopup = () => {
    setShowImagePopup(!showImagePopup);
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

  // Separate Pages Mode
  if (exam.data.separatePages?.isActive) {
    const currentQuestion = questions[currentQuestionIndex];

    if (!currentQuestion) {
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
                سوالی یافت نشد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <p className="mb-4 text-gray-700">
                هیچ سوالی برای این آزمون تعریف نشده است.
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

    return (
      <div className="container mx-auto pb-10 rtl" dir="rtl">
        {/* Server DateTime Display */}
        {serverDateTime && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                زمان سرور: {serverDateTime}
              </span>
            </div>
          </div>
        )}
        
        <Card className="shadow-xl mb-6 border-blue-200 overflow-hidden rounded-xl bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-l from-blue-100/80 to-blue-50 flex flex-row justify-between items-center border-b border-blue-100">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-600/10 p-2 mr-2">
                <BookOpenIcon className="ml-2 h-7 w-7 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-800 font-bold">
                  {exam.data.examName}
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  کد آزمون: {exam.data.examCode}
                </p>
                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                  <p className="text-xs text-gray-600 flex items-center">
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
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
                    </svg>
                    سوال {currentQuestionIndex + 1} از {questions.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-blue-200 shadow-md text-blue-800 px-5 py-3 rounded-lg font-mono text-lg flex items-center">
              <ClockIcon className="ml-2 h-5 w-5 text-blue-600" />
              <span className="font-bold">{formatTime(questionTimeLeft)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {exam.data.settings?.preexammessage &&
              currentQuestionIndex === 0 && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-blue-800 shadow-inner">
                  <div className="flex items-start">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-2 mt-0.5 flex-shrink-0 text-blue-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="12" y1="16" x2="12" y2="16" />
                    </svg>
                    <p>{exam.data.settings.preexammessage}</p>
                  </div>
                </div>
              )}

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between mb-6 pb-3 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                  <span className="flex items-center justify-center rounded-full bg-blue-100 text-blue-800 w-8 h-8 ml-3 text-sm font-bold">
                    {currentQuestionIndex + 1}
                  </span>
                  <span>
                    {currentQuestion.score > 0 && (
                      <span className="text-blue-600 mr-2 font-medium">
                        ({currentQuestion.score} نمره)
                      </span>
                    )}
                  </span>
                </h3>
                <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                  {currentQuestion.category === "test1"
                    ? "تستی"
                    : currentQuestion.category === "essay"
                    ? "تشریحی"
                    : currentQuestion.category}
                </span>
              </div>
              <MathJax>
                <div
                  className="mb-6 leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={renderHTML(
                    currentQuestion.question.question
                  )}
                />
              </MathJax>
              {/* Multiple choice questions */}
              {currentQuestion.question.type === " تستی " && (
                <RadioGroup
                  value={answers[currentQuestion._id] || ""}
                  onValueChange={(value) =>
                    handleAnswerChange(currentQuestion._id, value)
                  }
                  className="space-y-4"
                >
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                      <RadioGroupItem
                        value="1"
                        id={`${currentQuestion._id}-option1`}
                        className="ml-3 mt-1"
                      />
                      <Label
                        htmlFor={`${currentQuestion._id}-option1`}
                        className="cursor-pointer w-full text-gray-700"
                      >
                        <MathJax>
                          <div
                            dangerouslySetInnerHTML={renderHTML(
                              currentQuestion.question.option1
                            )}
                          />
                        </MathJax>
                      </Label>
                    </div>
                    <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                      <RadioGroupItem
                        value="2"
                        id={`${currentQuestion._id}-option2`}
                        className="ml-3 mt-1"
                      />
                      <Label
                        htmlFor={`${currentQuestion._id}-option2`}
                        className="cursor-pointer w-full text-gray-700"
                      >
                        <MathJax>
                          <div
                            dangerouslySetInnerHTML={renderHTML(
                              currentQuestion.question.option2
                            )}
                          />
                        </MathJax>
                      </Label>
                    </div>
                    <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                      <RadioGroupItem
                        value="3"
                        id={`${currentQuestion._id}-option3`}
                        className="ml-3 mt-1"
                      />
                      <Label
                        htmlFor={`${currentQuestion._id}-option3`}
                        className="cursor-pointer w-full text-gray-700"
                      >
                        <MathJax>
                          <div
                            dangerouslySetInnerHTML={renderHTML(
                              currentQuestion.question.option3
                            )}
                          />
                        </MathJax>
                      </Label>
                    </div>
                    <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                      <RadioGroupItem
                        value="4"
                        id={`${currentQuestion._id}-option4`}
                        className="ml-3 mt-1"
                      />
                      <Label
                        htmlFor={`${currentQuestion._id}-option4`}
                        className="cursor-pointer w-full text-gray-700"
                      >
                        <MathJax>
                          <div
                            dangerouslySetInnerHTML={renderHTML(
                              currentQuestion.question.option4
                            )}
                          />
                        </MathJax>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {/* Essay questions */}
              {currentQuestion.question.type === " تشریحی " && (
                <Textarea
                  placeholder="پاسخ خود را اینجا بنویسید..."
                  className="min-h-[150px] w-full border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-lg"
                  value={answers[currentQuestion._id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion._id, e.target.value)
                  }
                />
              )}

              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => saveTemporarily()}
                  disabled={saving}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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
                  onClick={moveToNextQuestion}
                  disabled={saving}
                  className={`${
                    currentQuestionIndex >= questions.length - 1
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all`}
                >
                  {currentQuestionIndex >= questions.length - 1 ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      سوال بعدی
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center mt-6">
          <div className="flex items-center justify-center w-full max-w-lg bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
            <span className="mr-2 text-sm text-gray-600">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
        </div>

        <AlertDialog
          open={showConfirmFinish}
          onOpenChange={setShowConfirmFinish}
        >
          <AlertDialogContent
            dir="rtl"
            className="bg-white rounded-xl max-w-md mx-auto shadow-2xl border-0"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-gray-800 font-bold flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                تایید پایان آزمون
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                آیا از پایان دادن به آزمون اطمینان دارید؟ پس از تایید، امکان
                ویرایش پاسخ‌ها وجود نخواهد داشت.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3 mt-6">
              <AlertDialogAction
                onClick={finishExam}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-white transition-colors"
              >
                تایید و پایان آزمون
              </AlertDialogAction>
              <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg transition-colors">
                انصراف
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Image-Based Exam Mode
  if (exam?.data.imageFile?.isActive) {
    // Make sure we have the image files
    const imageFiles = exam.data.imageFile.imageFile || [];

    return (
      <div className="container mx-auto pb-10 rtl" dir="rtl">
        {/* Server DateTime Display */}
        {serverDateTime && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-center">
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                زمان سرور: {serverDateTime}
              </span>
            </div>
          </div>
        )}
        
        <Card className="shadow-xl mb-6 border-blue-200 overflow-hidden rounded-xl bg-gradient-to-br from-white to-blue-50">
          <CardHeader className="bg-gradient-to-l from-blue-100/80 to-blue-50 flex flex-row justify-between items-center border-b border-blue-100">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-600/10 p-2 mr-2">
                <BookOpenIcon className="ml-2 h-7 w-7 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-800 font-bold">
                  {exam.data.examName}
                </CardTitle>
                <p className="text-sm text-blue-600 mt-1">
                  کد آزمون: {exam.data.examCode}
                </p>
                {persianEntryDateTime && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center">
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
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    زمان شروع: {persianEntryDateTime}
                  </p>
                )}
                {lastSaveTime && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center">
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
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    آخرین ذخیره: {lastSaveTime}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white border border-blue-200 shadow-md text-blue-800 px-5 py-3 rounded-lg font-mono text-lg flex items-center">
              <ClockIcon className="ml-2 h-5 w-5 text-blue-600" />
              <span className="font-bold">{formatTime(imageExamTimeLeft)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {exam.data.settings?.preexammessage && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-blue-800 shadow-inner">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2 mt-0.5 flex-shrink-0 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="12" y1="16" x2="12" y2="16" />
                  </svg>
                  <p>{exam.data.settings.preexammessage}</p>
                </div>
              </div>
            )}

            <div className="mb-6 flex justify-center">
              <Button
                onClick={toggleImagePopup}
                className="bg-blue-600 hover:bg-blue-700 flex items-center px-6 py-3 shadow-md"
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                مشاهده تصاویر سوالات
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                پاسخنامه
              </h3>

              <div className="space-y-8">
                {questions.map((question, index) => (
                  <div
                    key={question._id}
                    className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex justify-between mb-4 pb-3 border-b border-gray-100">
                      <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                        <span className="flex items-center justify-center rounded-full bg-blue-100 text-blue-800 w-8 h-8 ml-3 text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>
                          {question.score > 0 && (
                            <span className="text-blue-600 mr-2 font-medium">
                              ({question.score} نمره)
                            </span>
                          )}
                        </span>
                      </h3>
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                        {question.category === "test1"
                          ? "تستی"
                          : question.category === "essay"
                          ? "تشریحی"
                          : question.category}
                      </span>
                    </div>

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
                          <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                            <RadioGroupItem
                              value="1"
                              id={`${question._id}-option1`}
                              className="ml-3 mt-1"
                            />
                            <Label
                              htmlFor={`${question._id}-option1`}
                              className="cursor-pointer w-full text-gray-700"
                            >
                              گزینه 1
                            </Label>
                          </div>
                          <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                            <RadioGroupItem
                              value="2"
                              id={`${question._id}-option2`}
                              className="ml-3 mt-1"
                            />
                            <Label
                              htmlFor={`${question._id}-option2`}
                              className="cursor-pointer w-full text-gray-700"
                            >
                              گزینه 2
                            </Label>
                          </div>
                          <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                            <RadioGroupItem
                              value="3"
                              id={`${question._id}-option3`}
                              className="ml-3 mt-1"
                            />
                            <Label
                              htmlFor={`${question._id}-option3`}
                              className="cursor-pointer w-full text-gray-700"
                            >
                              گزینه 3
                            </Label>
                          </div>
                          <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
                            <RadioGroupItem
                              value="4"
                              id={`${question._id}-option4`}
                              className="ml-3 mt-1"
                            />
                            <Label
                              htmlFor={`${question._id}-option4`}
                              className="cursor-pointer w-full text-gray-700"
                            >
                              گزینه 4
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    )}

                    {/* Essay questions */}
                    {question.question.type === " تشریحی " && (
                      <Textarea
                        placeholder="پاسخ خود را اینجا بنویسید..."
                        className="min-h-[150px] w-full border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-lg"
                        value={answers[question._id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(question._id, e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => saveTemporarily()}
            disabled={saving}
            className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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
            className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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

        {showImagePopup && (
          <ImagePopup
            images={imageFiles}
            currentIndex={currentImageIndex}
            onNext={nextImage}
            onPrev={prevImage}
            onClose={toggleImagePopup}
          />
        )}

        <AlertDialog
          open={showConfirmFinish}
          onOpenChange={setShowConfirmFinish}
        >
          <AlertDialogContent
            dir="rtl"
            className="bg-white rounded-xl max-w-md mx-auto shadow-2xl border-0"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-gray-800 font-bold flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2 text-amber-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                تایید پایان آزمون
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                آیا از پایان دادن به آزمون اطمینان دارید؟ پس از تایید، امکان
                ویرایش پاسخ‌ها وجود نخواهد داشت.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3 mt-6">
              <AlertDialogAction
                onClick={finishExam}
                className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-white transition-colors"
              >
                تایید و پایان آزمون
              </AlertDialogAction>
              <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg transition-colors">
                انصراف
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Only continue if allQuestionsInOnePage is active
  if (
    !exam.data.allQuestionsInOnePage?.isActive &&
    !exam.data.separatePages?.isActive &&
    !exam.data.imageFile?.isActive
  ) {
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

  // Original All Questions In One Page Mode
  return (
    <div className="container mx-auto pb-10 rtl" dir="rtl">
      <Card className="shadow-xl mb-6 border-blue-200 overflow-hidden rounded-xl bg-gradient-to-br from-white to-blue-50">
        <CardHeader className="bg-gradient-to-l from-blue-100/80 to-blue-50 flex flex-row justify-between items-center border-b border-blue-100">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-600/10 p-2 mr-2">
              <BookOpenIcon className="ml-2 h-7 w-7 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-800 font-bold">
                {exam.data.examName}
              </CardTitle>
              <p className="text-sm text-blue-600 mt-1">
                کد آزمون: {exam.data.examCode}
              </p>
              {persianEntryDateTime && (
                <p className="text-xs text-gray-600 mt-1 flex items-center">
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
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  زمان شروع: {persianEntryDateTime}
                </p>
              )}
              {lastSaveTime && (
                <p className="text-xs text-gray-600 mt-1 flex items-center">
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
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  آخرین ذخیره: {lastSaveTime}
                </p>
              )}
            </div>
          </div>
          <div className="bg-white border border-blue-200 shadow-md text-blue-800 px-5 py-3 rounded-lg font-mono text-lg flex items-center">
            <ClockIcon className="ml-2 h-5 w-5 text-blue-600" />
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {exam.data.settings?.preexammessage && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6 text-blue-800 shadow-inner">
              <div className="flex items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2 mt-0.5 flex-shrink-0 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="12" y1="16" x2="12" y2="16" />
                </svg>
                <p>{exam.data.settings.preexammessage}</p>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            dir="rtl"
            className="border border-gray-100 rounded-xl p-2 bg-gray-50 shadow-sm"
          >
            <div className="overflow-x-auto pb-1 mb-3">
              <TabsList className="mb-3 flex flex-nowrap bg-white h-[75px] gap-1 w-max min-w-full p-2 border border-gray-100 rounded-lg shadow-sm">
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

                  // Calculate unanswered questions count
                  const unansweredCount = categoryQuestions.filter(
                    (q) => !answers[q._id]
                  ).length;

                  return (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="text-sm md:text-base border-[.5px] border-gray-200 px-5 py-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-md data-[state=active]:border-blue-200 flex flex-col items-center rounded-lg transition-all hover:bg-blue-50 whitespace-nowrap"
                    >
                      <span className="font-medium">
                        {category === "test1"
                          ? "سوالات تستی"
                          : category === "essay"
                          ? "سوالات تشریحی"
                          : category}
                      </span>
                      <div className="flex items-center mt-1.5 gap-2 text-xs text-gray-500">
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
                        {unansweredCount > 0 && (
                          <span className="flex items-center bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
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
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {unansweredCount} بی‌پاسخ
                          </span>
                        )}
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {categories.map((category) => {
              // Get questions for this category and their total score
              const categoryQuestions = questions.filter(
                (q) => q.category === category
              );
              const totalScore = categoryQuestions.reduce(
                (sum, q) => sum + (q.score || 0),
                0
              );

              // Calculate unanswered questions count
              const unansweredCount = categoryQuestions.filter(
                (q) => !answers[q._id]
              ).length;

              return (
                <TabsContent
                  key={category}
                  value={category}
                  className="p-5 bg-white rounded-xl shadow-sm"
                >
                  <div className="mb-6 px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex justify-between items-center border border-gray-200">
                    <h2 className="font-semibold text-gray-800 flex items-center">
                      <span className="flex justify-center items-center rounded-full bg-blue-100 h-8 w-8 mr-2">
                        {category === "test1" ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9 11 12 14 22 4"></polyline>
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-blue-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                        )}
                      </span>
                      {category === "test1"
                        ? "سوالات تستی"
                        : category === "essay"
                        ? "سوالات تشریحی"
                        : category}
                    </h2>
                    <div className="flex gap-3">
                      <span className="flex items-center text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-lg shadow-sm">
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
                      <span className="flex items-center text-sm text-green-700 bg-green-50 px-3 py-1 rounded-lg shadow-sm">
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
                      {unansweredCount > 0 && (
                        <span className="flex items-center text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-lg shadow-sm">
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
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                          {unansweredCount} سوال بی‌پاسخ
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-8">
                    {categoryQuestions.map((question, index) => {
                      // Check if this question is answered
                      const isAnswered = !!answers[question._id];

                      return (
                        <div
                          key={question._id}
                          className={`border ${
                            isAnswered ? "border-gray-200" : "border-amber-200"
                          } rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all ${
                            isAnswered ? "" : "bg-amber-50/30"
                          }`}
                        >
                          <div className="flex justify-between mb-4 pb-3 border-b border-gray-100">
                            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                              <span
                                className={`flex items-center justify-center rounded-full ${
                                  isAnswered
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                } w-8 h-8 ml-3 text-sm font-bold`}
                              >
                                {index + 1}
                              </span>
                              <span>
                                {question.score > 0 && (
                                  <span className="text-blue-600 mr-2 font-medium">
                                    ({question.score} نمره)
                                  </span>
                                )}
                              </span>
                              {!isAnswered && (
                                <span className="mr-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                  بی‌پاسخ
                                </span>
                              )}
                            </h3>
                            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
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
                                <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
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
                                <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
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
                                <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
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
                                <div className="flex items-start bg-gray-50 hover:bg-blue-50 p-4 rounded-lg transition-colors border border-gray-200 hover:border-blue-300 hover:shadow-sm">
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
                              className="min-h-[150px] w-full border-gray-200 focus:border-blue-300 focus:ring-blue-200 rounded-lg"
                              value={answers[question._id] || ""}
                              onChange={(e) =>
                                handleAnswerChange(question._id, e.target.value)
                              }
                            />
                          )}
                        </div>
                      );
                    })}
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
          className="border-blue-500 text-blue-600 hover:bg-blue-50 px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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
          className="bg-green-600 hover:bg-green-700 px-6 py-5 rounded-lg shadow-md hover:shadow-lg transition-all"
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
          className="bg-white rounded-xl max-w-md mx-auto shadow-2xl border-0"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-gray-800 font-bold flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2 text-amber-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              تایید پایان آزمون
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              آیا از پایان دادن به آزمون اطمینان دارید؟ پس از تایید، امکان
              ویرایش پاسخ‌ها وجود نخواهد داشت.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row-reverse justify-start gap-3 mt-6">
            <AlertDialogAction
              onClick={finishExam}
              className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg text-white transition-colors"
            >
              تایید و پایان آزمون
            </AlertDialogAction>
            <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-5 py-2 rounded-lg transition-colors">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
