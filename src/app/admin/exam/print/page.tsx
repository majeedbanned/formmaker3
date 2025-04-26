"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MathJax } from "better-react-mathjax";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface Question {
  _id: string;
  id: number;
  grade: number;
  question: string;
  questionkey: string;
  cat: string;
  cat1: string;
  cat2: string;
  cat3: string;
  cat4: string;
  difficulty: string;
  type: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option1image?: string;
  option2image?: string;
  option3image?: string;
  option4image?: string;
  correctoption?: number;
}

interface ExamQuestion {
  _id: string;
  examId: string;
  question: Question;
  category: string;
  score: number;
  responseTime: number;
  addedBy: string;
  schoolCode: string;
  createdAt: string;
  updatedAt?: string;
}

interface ExamData {
  _id: string;
  data: {
    examCode: string;
    examName: string;
    dateTime: {
      startDate: string;
      endDate: string;
    };
    schoolCode: string;
    settings: {
      preexammessage?: string;
      postexammessage?: string;
    };
  };
}

interface School {
  _id: string;
  data: {
    schoolCode: string;
    schoolName: string;
    schoolLogo?: string;
    address?: string;
    phone?: string;
  };
}

// Helper function to render HTML content safely
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

// Function to convert numbers to Persian
const toPersianNumber = (num: number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .split("")
    .map((digit) => persianDigits[parseInt(digit)] || digit)
    .join("");
};

// Date formatter for Persian dates
const formatPersianDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return formatter.format(date);
  } catch {
    return dateString;
  }
};

export default function PrintExamPage() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("examID");

  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!examId) return;

    const fetchExamQuestions = async () => {
      setLoading(true);
      try {
        // Fetch exam details
        const examResponse = await fetch(`/api/exam/${examId}`);
        if (examResponse.ok) {
          const examData = await examResponse.json();
          setExamData(examData);

          // Fetch school information if schoolCode is available
          if (examData.data.schoolCode) {
            try {
              const schoolResponse = await fetch(
                `/api/schools/${examData.data.schoolCode}`
              );
              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json();
                setSchoolData(schoolData);
              } else {
                console.error("Error fetching school data");
              }
            } catch (error) {
              console.error("Error fetching school data:", error);
            }
          }
        } else {
          toast.error("خطا در دریافت اطلاعات آزمون");
        }

        // Fetch exam questions
        const response = await fetch(`/api/examquestions?examId=${examId}`);
        if (response.ok) {
          const questions = await response.json();
          setExamQuestions(questions);
        } else {
          toast.error("خطا در دریافت سوالات آزمون");
        }
      } catch (error) {
        console.error("Error fetching exam questions:", error);
        toast.error("خطایی در ارتباط با سرور رخ داد");
      } finally {
        setLoading(false);
      }
    };

    fetchExamQuestions();
  }, [examId]);

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!examId) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">خطا در بارگیری آزمون</h1>
        <p>شناسه آزمون یافت نشد.</p>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 ml-2" />
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto p-6">
      <div className="non-printable flex justify-between items-center mb-6">
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 ml-2" />
          بازگشت
        </Button>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <input
              type="checkbox"
              id="show-answers"
              checked={showAnswers}
              onChange={(e) => setShowAnswers(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label
              htmlFor="show-answers"
              className="text-sm font-medium text-gray-700"
            >
              نمایش پاسخ‌ها (نسخه معلم)
            </label>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 ml-2" />
            چاپ آزمون
          </Button>
        </div>
      </div>

      <div className="print-container">
        <div className="exam-header mb-8 border-b pb-6 print-header">
          <div className="flex justify-between items-center mb-4">
            <div className="w-1/3">
              {schoolData?.data.schoolLogo && (
                <img
                  src={schoolData.data.schoolLogo}
                  alt="School Logo"
                  className="max-h-24 object-contain"
                />
              )}
            </div>
            <div className="w-1/3 text-center">
              <h1 className="text-2xl font-bold mb-1">
                {examData?.data.examName || "آزمون"}
              </h1>
              <p className="text-lg">{schoolData?.data.schoolName || ""}</p>
            </div>
            <div className="w-1/3 text-left">
              <div className="text-sm text-left">
                <p>تاریخ: {formatPersianDate(new Date().toISOString())}</p>
              </div>
            </div>
          </div>

          <div className="exam-info grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mb-2">
                <span className="font-semibold ml-2">کد آزمون:</span>{" "}
                {examData?.data.examCode}
              </div>
              <div className="mb-2">
                <span className="font-semibold ml-2">زمان شروع:</span>
                {examData?.data.dateTime.startDate
                  ? formatPersianDate(examData.data.dateTime.startDate)
                  : ""}
              </div>
              <div className="mb-2">
                <span className="font-semibold ml-2">زمان پایان:</span>
                {examData?.data.dateTime.endDate
                  ? formatPersianDate(examData.data.dateTime.endDate)
                  : ""}
              </div>
            </div>
            <div>
              {schoolData?.data.address && (
                <div className="mb-2">
                  <span className="font-semibold ml-2">آدرس مدرسه:</span>{" "}
                  {schoolData.data.address}
                </div>
              )}
              {schoolData?.data.phone && (
                <div className="mb-2">
                  <span className="font-semibold ml-2">تلفن مدرسه:</span>{" "}
                  {schoolData.data.phone}
                </div>
              )}
            </div>
          </div>

          {examData?.data.settings.preexammessage && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="font-semibold mb-1">پیام آزمون:</div>
              <div
                dangerouslySetInnerHTML={renderHTML(
                  examData.data.settings.preexammessage
                )}
              />
            </div>
          )}
        </div>

        {examQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            هیچ سوالی برای این آزمون ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-8">
            {examQuestions.map((item, index) => (
              <div
                key={item._id}
                className="border rounded-lg p-4 question-item"
              >
                <div className="flex justify-between mb-2">
                  <div className="font-bold">
                    سوال {toPersianNumber(index + 1)}
                  </div>
                  <div className="text-sm">
                    <span className="ml-4">
                      نمره: {toPersianNumber(item.score)}
                    </span>
                    <span>دسته‌بندی: {item.category}</span>
                  </div>
                </div>

                <div className="mb-4 question-text">
                  <MathJax>
                    <div
                      className="text-base"
                      dangerouslySetInnerHTML={renderHTML(
                        item.question.question
                      )}
                    />
                  </MathJax>
                </div>

                {item.question.type?.includes("تستی") && (
                  <div className="grid grid-cols-2 gap-4 options-container">
                    {item.question.option1 && (
                      <div
                        className={`p-3 border rounded-md ${
                          showAnswers && item.question.correctoption === 1
                            ? "bg-green-50 border-green-300 teacher-version"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`min-w-6 h-6 rounded-full ${
                              showAnswers && item.question.correctoption === 1
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-800"
                            } flex items-center justify-center text-xs ml-2`}
                          >
                            ۱
                          </span>
                          <MathJax>
                            <div
                              className="text-base"
                              dangerouslySetInnerHTML={renderHTML(
                                item.question.option1
                              )}
                            />
                          </MathJax>
                        </div>
                      </div>
                    )}

                    {item.question.option2 && (
                      <div
                        className={`p-3 border rounded-md ${
                          showAnswers && item.question.correctoption === 2
                            ? "bg-green-50 border-green-300 teacher-version"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`min-w-6 h-6 rounded-full ${
                              showAnswers && item.question.correctoption === 2
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-800"
                            } flex items-center justify-center text-xs ml-2`}
                          >
                            ۲
                          </span>
                          <MathJax>
                            <div
                              className="text-base"
                              dangerouslySetInnerHTML={renderHTML(
                                item.question.option2
                              )}
                            />
                          </MathJax>
                        </div>
                      </div>
                    )}

                    {item.question.option3 && (
                      <div
                        className={`p-3 border rounded-md ${
                          showAnswers && item.question.correctoption === 3
                            ? "bg-green-50 border-green-300 teacher-version"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`min-w-6 h-6 rounded-full ${
                              showAnswers && item.question.correctoption === 3
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-800"
                            } flex items-center justify-center text-xs ml-2`}
                          >
                            ۳
                          </span>
                          <MathJax>
                            <div
                              className="text-base"
                              dangerouslySetInnerHTML={renderHTML(
                                item.question.option3
                              )}
                            />
                          </MathJax>
                        </div>
                      </div>
                    )}

                    {item.question.option4 && (
                      <div
                        className={`p-3 border rounded-md ${
                          showAnswers && item.question.correctoption === 4
                            ? "bg-green-50 border-green-300 teacher-version"
                            : ""
                        }`}
                      >
                        <div className="flex items-start">
                          <span
                            className={`min-w-6 h-6 rounded-full ${
                              showAnswers && item.question.correctoption === 4
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-800"
                            } flex items-center justify-center text-xs ml-2`}
                          >
                            ۴
                          </span>
                          <MathJax>
                            <div
                              className="text-base"
                              dangerouslySetInnerHTML={renderHTML(
                                item.question.option4
                              )}
                            />
                          </MathJax>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Answer space for essay questions */}
                {!item.question.type?.includes("تستی") && (
                  <div className="mt-4">
                    {showAnswers && item.question.questionkey && (
                      <div className="mb-4 bg-green-50 border border-green-300 p-3 rounded-md teacher-version">
                        <div className="text-sm font-bold mb-1 text-green-800">
                          پاسخ تشریحی:
                        </div>
                        <MathJax>
                          <div
                            className="text-base"
                            dangerouslySetInnerHTML={renderHTML(
                              item.question.questionkey
                            )}
                          />
                        </MathJax>
                      </div>
                    )}
                    <div className="answer-space print-only">
                      <div className="h-32 border-b border-dashed border-gray-300"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12pt;
            line-height: 1.5;
          }

          .non-printable {
            display: none !important;
          }

          .container {
            width: 100%;
            max-width: 100%;
            padding: 0;
            margin: 0;
          }

          .question-item {
            page-break-inside: avoid;
            border: 1px solid #ccc !important;
            margin-bottom: 20px;
          }

          .print-header {
            margin-bottom: 30px;
          }

          .question-text img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px auto;
          }

          .options-container img {
            max-width: 90%;
            height: auto;
          }

          /* Teacher version styling */
          .teacher-version {
            background-color: #f0fdf4 !important;
            border-color: #86efac !important;
          }

          /* Add a "Correct Answer" watermark for teacher version */
          .teacher-version::after {
            content: "پاسخ صحیح";
            position: absolute;
            bottom: 5px;
            right: 5px;
            font-size: 8pt;
            color: #22c55e;
            font-weight: bold;
          }

          @page {
            size: A4;
            margin: 1.5cm;
          }

          .answer-space {
            display: block;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }

          .question-text img,
          .options-container img {
            max-width: 100%;
            height: auto;
          }

          /* Make option containers relative for the watermark positioning */
          .options-container > div {
            position: relative;
          }
        }
      `}</style>
    </div>
  );
}
