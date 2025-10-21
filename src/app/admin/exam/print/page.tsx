"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MathJax } from "better-react-mathjax";
import { toast } from "sonner";
import { Printer, ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import RichTextEditor from "@/components/ui/rich-text-editor";

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
    recipients?: {
      students?: { label: string; value: string }[];
      groups?: { label: string; value: string }[];
      classCode?: { label: string; value: string }[];
      teachers?: { label: string; value: string }[];
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

// Helper function to convert ArrayBuffer to Base64 string (browser-compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function PrintExamContent() {
  const searchParams = useSearchParams();
  const examID = searchParams.get("examID");
  const [loading, setLoading] = useState(true);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examUsers, setExamUsers] = useState<
    {
      id: string;
      username: string;
      name: string;
      className?: string;
      role: "student" | "teacher";
    }[]
  >([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [editQuestionData, setEditQuestionData] = useState({
    score: "",
    responseTime: "",
    category: "",
    question: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctoption: 1,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null
  );
  const [showAnswers, setShowAnswers] = useState(false);
  const [printTemplate, setPrintTemplate] = useState<
    "regular" | "compact" | "dense"
  >("regular");
  const [isAnswerSheetMode, setIsAnswerSheetMode] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isMultipleAnswerSheetMode, setIsMultipleAnswerSheetMode] =
    useState(false);
  const [studentsToPrint, setStudentsToPrint] = useState<
    Array<{
      username: string;
      name: string;
      className?: string;
      role: "student" | "teacher";
    }>
  >([]);
  const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
  const [answerSheetDropdownOpen, setAnswerSheetDropdownOpen] = useState(false);

  useEffect(() => {
    if (!examID) return;

    const fetchExamQuestions = async () => {
      setLoading(true);
      try {
        // Fetch exam details
        const examResponse = await fetch(`/api/exam/${examID}`);
        if (examResponse.ok) {
          const examData = await examResponse.json();
          setExamData(examData);

          // Fetch school information if schoolCode   is available
          console.log("examData34", examData);
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

              // Fetch exam participants if recipients data exists
              console.log("examData33", examData);
              if (examData.data.recipients) {
                try {
                  // Use the API route instead of the direct function call
                  const usersResponse = await fetch("/api/exam/users", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      domain: examData.data.schoolCode,
                      recipients: examData.data.recipients,
                    }),
                  });

                  if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    console.log("usersData33", usersData);
                    setExamUsers(usersData);
                  } else {
                    console.error("Error fetching exam participants from API");
                  }
                } catch (error) {
                  console.error("Error fetching exam participants:", error);
                }
              }
            } catch (error) {
              console.error("Error fetching school data:", error);
            }
          }
        } else {
          toast.error("خطا در دریافت اطلاعات آزمون");
        }

        // Fetch exam questions
        const response = await fetch(`/api/examquestions?examId=${examID}`);
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
  }, [examID]);

  const handlePrint = () => {
    setIsPrintMode(true);
    // Use setTimeout to ensure the state update is processed before printing
    setTimeout(() => {
      window.print();
      // Reset to normal mode after printing
      setTimeout(() => {
        setIsPrintMode(false);
      }, 500);
    }, 100);
  };

  const handlePrintAnswerSheet = () => {
    setIsAnswerSheetMode(true);
    setIsPrintMode(true);
    setIsMultipleAnswerSheetMode(false);
    setStudentsToPrint([]);
    // Use setTimeout to ensure the state update is processed before printing
    setTimeout(() => {
      window.print();
      // Reset to normal mode after printing
      setTimeout(() => {
        setIsAnswerSheetMode(false);
        setIsPrintMode(false);
      }, 500);
    }, 100);
  };

  const handlePrintAllRecipientAnswerSheets = () => {
    // Filter only student users
    const students = examUsers.filter((user) => user.role === "student");

    if (students.length === 0) {
      toast.error("هیچ دانش آموزی در لیست شرکت کنندگان وجود ندارد.");
      return;
    }

    // Ask for confirmation if there are many students
    if (students.length > 10) {
      const shouldProceed = window.confirm(
        `این عملیات ${students.length} پاسخنامه چاپ خواهد کرد. آیا ادامه می‌دهید؟`
      );
      if (!shouldProceed) return;
    }

    // Set all the required states
    setIsAnswerSheetMode(true);
    setIsMultipleAnswerSheetMode(true);
    setIsPrintMode(true);
    setStudentsToPrint(students);

    // Use setTimeout to ensure the state update is processed before printing
    setTimeout(() => {
      window.print();
      // Reset to normal mode after printing
      setTimeout(() => {
        setIsAnswerSheetMode(false);
        setIsMultipleAnswerSheetMode(false);
        setIsPrintMode(false);
        setStudentsToPrint([]);
      }, 500);
    }, 100);

    //toast.success(`${students.length} پاسخنامه آماده‌ی چاپ شد.`);
  };

  const handlePrintQRAnswerSheet = async () => {
    try {
      // Filter only student users
      const studentsForQR = examUsers.filter((user) => user.role === "student");

      if (studentsForQR.length === 0) {
        toast.error("هیچ دانش آموزی در لیست شرکت کنندگان وجود ندارد.");
        return;
      }

      toast.info("در حال ساخت پاسخنامه‌های QR...");

      // Dynamically import libraries
      const jspdfModule = await import("jspdf");
      const qrcodeModule = await import("qrcode");

      // Create PDF document in landscape orientation
      const pdf = new jspdfModule.default({
        orientation: "landscape", // Changed to landscape
        unit: "mm",
        format: "a4",
        compress: true, // Enable compression
      });

      // Add Farsi font
      try {
        // Add Vazirmatn font for Farsi text support - optimization: load once and reuse
        const fontPath = "/fonts/Vazirmatn-Regular.ttf";
        // Get the font data
        const fontResponse = await fetch(fontPath);
        if (!fontResponse.ok) throw new Error("Could not load font");
        const fontArrayBuffer = await fontResponse.arrayBuffer();

        // Convert ArrayBuffer to Base64 string for jsPDF (browser-compatible)
        const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

        // Add the font to PDF with subset embedding to reduce size
        pdf.addFileToVFS("Vazirmatn-Regular.ttf", fontBase64);
        pdf.addFont(
          "Vazirmatn-Regular.ttf",
          "Vazirmatn",
          "normal",
          "Identity-H"
        );
        // Set the font
        pdf.setFont("Vazirmatn");
      } catch (fontError) {
        console.error("Failed to load Farsi font:", fontError);
        // Continue with default font if can't load Vazirmatn
      }

      // A4 landscape dimensions (297x210 mm)
      const pageWidth = 297;
      const pageHeight = 210;

      // A5 dimensions for side-by-side layout
      const a5Width = pageWidth / 2;
      const a5Height = pageHeight;

      // Load and optimize the template image
      const img = new Image();
      img.src = "/answersheet/sheet1.png";

      // Wait for image to load
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Calculate number of pages needed (2 students per page)
      const totalPages = Math.ceil(studentsForQR.length / 2);

      // QR code optimization settings
      const qrOptions = {
        errorCorrectionLevel: "H" as const, // Type-safe error correction level
        margin: 1,
        width: 100,
        scale: 4, // Smaller scale for better compression
        color: {
          dark: "#000000", // Black dots
          light: "#ffffff", // White background
        },
      };

      // Process students two at a time
      for (let page = 0; page < totalPages; page++) {
        // Add new page after first page
        if (page > 0) {
          pdf.addPage();
        }

        // Add template image once per page with quality settings
        pdf.addImage(
          img,
          "PNG",
          0,
          0,
          pageWidth / 2,
          a5Height,
          undefined,
          "SLOW"
        );

        // Process first student on current page
        if (page * 2 < studentsForQR.length) {
          const student1 = studentsForQR[page * 2];

          // Generate and add QR code for first student with optimization
          console.log("student1", student1);
          const qrDataUrl1 = await qrcodeModule.toDataURL(
            student1.username.toString(),
            qrOptions
          );

          pdf.addImage(qrDataUrl1, "PNG", 15, 20, 25, 25);

          // Add first student info with RTL text
          pdf.setFont("Vazirmatn", "normal");
          pdf.setFontSize(12);

          // Using right-to-left for Farsi text
          const student1Name = `نام و نام خانوادگی: ${student1.name}`;
          const student1Code = `کد دانش آموزی: ${student1.username}`;
          const student1Class = `کلاس: ${student1.className || ""}`;
          const examNameText = `آزمون: ${examData?.data.examName || ""}`;

          pdf.text(student1Name, a5Width - 10, 20, {
            align: "right",
          });
          pdf.text(student1Code, a5Width - 10, 27, {
            align: "right",
          });
          pdf.text(student1Class, a5Width - 10, 34, {
            align: "right",
          });
          pdf.text(examNameText, a5Width - 10, 40, {
            align: "right",
          });
        }

        // Process second student on current page
        if (page * 2 + 1 < studentsForQR.length) {
          const student2 = studentsForQR[page * 2 + 1];

          // Only add template image for right side if not already added
          // if (
          //   page * 2 + 1 === studentsForQR.length - 1 &&
          //   studentsForQR.length % 2 !== 0
          // ) {
          // }
          pdf.addImage(img, "PNG", a5Width, 0, a5Width, a5Height);

          // Generate and add QR code for second student with optimization
          const qrDataUrl2 = await qrcodeModule.toDataURL(
            student2.username.toString(),
            qrOptions
          );

          pdf.addImage(qrDataUrl2, "PNG", a5Width + 15, 20, 25, 25);

          // Add second student info with RTL text
          pdf.setFont("Vazirmatn", "normal");
          pdf.setFontSize(12);

          // Using right-to-left for Farsi text
          const student2Name = `نام و نام خانوادگی: ${student2.name}`;
          const student2Code = `کد دانش آموزی: ${student2.username}`;
          const student2Class = `کلاس: ${student2.className || ""}`;
          const examNameText = `آزمون: ${examData?.data.examName || ""}`;

          pdf.text(student2Name, pageWidth - 10, 20, {
            align: "right",
          });
          pdf.text(student2Code, pageWidth - 10, 27, {
            align: "right",
          });
          pdf.text(student2Class, pageWidth - 10, 34, {
            align: "right",
          });
          pdf.text(examNameText, pageWidth - 10, 40, {
            align: "right",
          });
        }
      }

      // Set PDF properties to optimize file size
      pdf.setProperties({
        title: `پاسخنامه ${examData?.data.examName || "آزمون"}`,
        creator: "Farsamooz",
      });

      // Save and download PDF
      pdf.save("generated.pdf");
      toast.success(
        `پاسخنامه‌های QR برای ${studentsForQR.length} دانش آموز با موفقیت ساخته شد.`
      );
    } catch (error) {
      console.error("Error generating QR answer sheets:", error);
      toast.error("خطا در ساخت پاسخنامه‌های QR");
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleEditQuestion = (question: ExamQuestion) => {
    setEditingQuestionId(question._id);
    setEditQuestionData({
      score: question.score.toString(),
      responseTime: question.responseTime.toString(),
      category: question.category || "",
      question: question.question.question || "",
      option1: question.question.option1 || "",
      option2: question.question.option2 || "",
      option3: question.question.option3 || "",
      option4: question.question.option4 || "",
      correctoption: question.question.correctoption || 1,
    });
    setEditDialogOpen(true);
  };

  const handleEditQuestionChange = (field: string, value: string) => {
    setEditQuestionData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEditedQuestion = async () => {
    if (!editingQuestionId) return;

    try {
      const response = await fetch(`/api/examquestions/${editingQuestionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: parseFloat(editQuestionData.score),
          responseTime: parseInt(editQuestionData.responseTime),
          category: editQuestionData.category,
          question: editQuestionData.question,
          option1: editQuestionData.option1,
          option2: editQuestionData.option2,
          option3: editQuestionData.option3,
          option4: editQuestionData.option4,
          correctoption: parseInt(editQuestionData.correctoption.toString()),
        }),
      });

      if (response.ok) {
        const updatedQuestion = await response.json();

        // Update the questions list
        setExamQuestions((questions) =>
          questions.map((q) =>
            q._id === editingQuestionId ? { ...q, ...updatedQuestion } : q
          )
        );

        toast.success("سوال با موفقیت ویرایش شد");
        setEditDialogOpen(false);
        setEditingQuestionId(null);
      } else {
        const error = await response.json();
        toast.error(`خطا در ویرایش سوال: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating question:", error);
      toast.error("خطا در ویرایش سوال");
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuestionId) return;

    try {
      const response = await fetch(`/api/examquestions/${deletingQuestionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the question from the list
        setExamQuestions((questions) =>
          questions.filter((q) => q._id !== deletingQuestionId)
        );

        toast.success("سوال با موفقیت حذف شد");
        setDeleteDialogOpen(false);
        setDeletingQuestionId(null);
      } else {
        const error = await response.json();
        toast.error(`خطا در حذف سوال: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("خطا در حذف سوال");
    }
  };

  const renderParticipantsList = () => {
    if (!examUsers || examUsers.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          هیچ شرکت کننده‌ای برای این آزمون یافت نشد.
        </div>
      );
    }

    // Group by role
    const students = examUsers.filter((user) => user.role === "student");
    const teachers = examUsers.filter((user) => user.role === "teacher");

    return (
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">
          لیست شرکت کنندگان ({examUsers.length} نفر)
        </h3>
        {teachers.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold mb-1">
              اساتید ({teachers.length} نفر):
            </h4>
            <ul className="list-disc list-inside">
              {teachers.map((teacher) => (
                <li key={teacher.username}>{teacher.name}</li>
              ))}
            </ul>
          </div>
        )}
        {students.length > 0 && (
          <div>
            <h4 className="font-semibold mb-1">
              دانش آموزان ({students.length} نفر):
            </h4>
            <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
              {students.map((student) => (
                <li key={student.username}>
                  {student.name}{" "}
                  {student.className && (
                    <span className="text-sm text-gray-500">
                      ({student.className})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
        <span className="mr-2">در حال بارگذاری...</span>
      </div>
    );
  }

  if (!examID) {
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
    <div
      dir="rtl"
      className={`container mx-auto p-6 print-template-${printTemplate} ${
        isAnswerSheetMode ? "answer-sheet-mode" : ""
      } ${isPrintMode ? "print-mode" : ""}`}
    >
      <div className="non-printable flex flex-col mb-6">
        <div className="flex justify-between items-center mb-2">
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

            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 ml-2">
                قالب چاپ:
              </span>
              <select
                value={printTemplate}
                onChange={(e) =>
                  setPrintTemplate(
                    e.target.value as "regular" | "compact" | "dense"
                  )
                }
                className="text-sm border border-gray-300 rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="regular">معمولی</option>
                <option value="compact">فشرده</option>
                <option value="dense">خیلی فشرده</option>
              </select>
            </div>

            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              چاپ آزمون
            </Button>

            <div className="relative">
              <Button
                variant="secondary"
                onClick={() =>
                  setAnswerSheetDropdownOpen(!answerSheetDropdownOpen)
                }
                className="flex items-center"
              >
                <Printer className="h-4 w-4 ml-2" />
                چاپ پاسخنامه
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </Button>

              {answerSheetDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white shadow-lg rounded-md border border-gray-200 z-10">
                  <ul className="py-1">
                    <li>
                      <button
                        onClick={() => {
                          handlePrintAnswerSheet();
                          setAnswerSheetDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                      >
                        چاپ پاسخنامه ساده
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handlePrintAllRecipientAnswerSheets();
                          setAnswerSheetDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                      >
                        چاپ پاسخنامه برای همه شرکت‌کنندگان
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          handlePrintQRAnswerSheet();
                          setAnswerSheetDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-right"
                      >
                        پاسخنامه QR
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="print:hidden"
              onClick={() => setParticipantsDialogOpen(true)}
            >
              <Users className="h-4 w-4 ml-2" />
              شرکت کنندگان
            </Button>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-1 pr-1">
          <p className="mb-1">
            <span className="font-semibold">قالب معمولی:</span> حداکثر ۳ سوال در
            هر صفحه، خوانایی بالا
          </p>
          <p className="mb-1">
            <span className="font-semibold">قالب فشرده:</span> حداکثر ۵ سوال در
            هر صفحه، صرفه‌جویی در مصرف کاغذ
          </p>
          <p>
            <span className="font-semibold">قالب خیلی فشرده:</span> حداکثر ۸
            سوال در هر صفحه، سه ستونی، حداکثر صرفه‌جویی در مصرف کاغذ
          </p>
        </div>
      </div>

      {/* Answer Sheet (only visible when printing in answer sheet mode) */}
      {isAnswerSheetMode && (
        <div className="answer-sheet-container">
          {isMultipleAnswerSheetMode && studentsToPrint.length > 0 ? (
            // Multiple student answer sheets
            studentsToPrint.map((student, index) => (
              <div
                key={student.username}
                className={index > 0 ? "page-break-before" : ""}
              >
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
                        پاسخنامه {examData?.data.examName || "آزمون"}
                      </h1>
                      <p className="text-lg">
                        {schoolData?.data.schoolName || ""}
                      </p>
                    </div>
                    <div className="w-1/3 text-left">
                      <div className="text-sm text-left">
                        <p>
                          تاریخ: {formatPersianDate(new Date().toISOString())}
                        </p>
                        <p>کد آزمون: {examData?.data.examCode}</p>
                      </div>
                    </div>
                  </div>

                  <div className="student-info mt-6 mb-4">
                    <div className="flex justify-between mb-4">
                      <div className="w-1/2">
                        <div className="flex items-center mb-3">
                          <span className="font-semibold ml-2">
                            نام و نام خانوادگی:
                          </span>
                          <div className="border-b border-black w-64 h-6 flex items-center">
                            {student.name}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold ml-2">کلاس:</span>
                          <div className="border-b border-black w-32 h-6 flex items-center">
                            {student.className || ""}
                          </div>
                        </div>
                      </div>
                      <div className="w-1/2">
                        <div className="flex items-center mb-3">
                          <span className="font-semibold ml-2">
                            شماره دانش‌آموزی:
                          </span>
                          <div className="border-b border-black w-32 h-6 flex items-center">
                            {student.username}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold ml-2">تاریخ:</span>
                          <div className="border-b border-black w-32 h-6 flex items-center">
                            {formatPersianDate(new Date().toISOString())}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multiple choice answers section */}
                <div className="multiple-choice-answers mb-8">
                  <h2 className="text-lg font-bold mb-4">
                    پاسخنامه سوالات تستی
                  </h2>
                  <div className="grid grid-cols-4 gap-4">
                    {examQuestions
                      .filter((q) => q.question.type?.includes("تستی"))
                      .map((question) => {
                        // Find the original index of this question in the full questions array
                        const originalIndex = examQuestions.findIndex(
                          (q) => q._id === question._id
                        );

                        return (
                          <div
                            key={`mc-${question._id}-${student.username}`}
                            className="answer-item p-3 border rounded-md"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-bold">
                                سوال {toPersianNumber(originalIndex + 1)}
                              </div>
                              <div className="text-sm">
                                {toPersianNumber(question.score)} نمره
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex items-center justify-center border rounded-md p-2">
                                <span className="text-sm">۱</span>
                                <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                              </div>
                              <div className="flex items-center justify-center border rounded-md p-2">
                                <span className="text-sm">۲</span>
                                <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                              </div>
                              <div className="flex items-center justify-center border rounded-md p-2">
                                <span className="text-sm">۳</span>
                                <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                              </div>
                              <div className="flex items-center justify-center border rounded-md p-2">
                                <span className="text-sm">۴</span>
                                <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Descriptive answers section */}
                <div className="descriptive-answers">
                  <h2 className="text-lg font-bold mb-4">
                    پاسخنامه سوالات تشریحی
                  </h2>
                  <div className="space-y-6">
                    {examQuestions
                      .filter((q) => !q.question.type?.includes("تستی"))
                      .map((question) => {
                        // Find the original index of this question in the full questions array
                        const originalIndex = examQuestions.findIndex(
                          (q) => q._id === question._id
                        );

                        return (
                          <div
                            key={`desc-${question._id}-${student.username}`}
                            className="p-4 border rounded-md"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-bold">
                                سوال {toPersianNumber(originalIndex + 1)}
                              </div>
                              <div className="text-sm">
                                {toPersianNumber(question.score)} نمره
                              </div>
                            </div>
                            <div className="min-h-32 border-t border-dashed border-gray-300 pt-2"></div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Single answer sheet (original implementation)
            <>
              <div className="exam-header mb-8 border-b pb-6 print-header">
                {/* Original answer sheet header content */}
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
                      پاسخنامه {examData?.data.examName || "آزمون"}
                    </h1>
                    <p className="text-lg">
                      {schoolData?.data.schoolName || ""}
                    </p>
                  </div>
                  <div className="w-1/3 text-left">
                    <div className="text-sm text-left">
                      <p>
                        تاریخ: {formatPersianDate(new Date().toISOString())}
                      </p>
                      <p>کد آزمون: {examData?.data.examCode}</p>
                    </div>
                  </div>
                </div>

                <div className="student-info mt-6 mb-4">
                  <div className="flex justify-between mb-4">
                    <div className="w-1/2">
                      <div className="flex items-center mb-3">
                        <span className="font-semibold ml-2">
                          نام و نام خانوادگی:
                        </span>
                        <div className="border-b border-black w-64 h-6"></div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold ml-2">کلاس:</span>
                        <div className="border-b border-black w-32 h-6"></div>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <div className="flex items-center mb-3">
                        <span className="font-semibold ml-2">
                          شماره دانش‌آموزی:
                        </span>
                        <div className="border-b border-black w-32 h-6"></div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold ml-2">تاریخ:</span>
                        <div className="border-b border-black w-32 h-6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multiple choice answers section */}
              <div className="multiple-choice-answers mb-8">
                {/* Original multiple choice content */}
                <h2 className="text-lg font-bold mb-4">پاسخنامه سوالات تستی</h2>
                <div className="grid grid-cols-4 gap-4">
                  {examQuestions
                    .filter((q) => q.question.type?.includes("تستی"))
                    .map((question) => {
                      // Find the original index of this question in the full questions array
                      const originalIndex = examQuestions.findIndex(
                        (q) => q._id === question._id
                      );

                      return (
                        <div
                          key={`mc-${question._id}`}
                          className="answer-item p-3 border rounded-md"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold">
                              سوال {toPersianNumber(originalIndex + 1)}
                            </div>
                            <div className="text-sm">
                              {toPersianNumber(question.score)} نمره
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-center border rounded-md p-2">
                              <span className="text-sm">۱</span>
                              <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                            </div>
                            <div className="flex items-center justify-center border rounded-md p-2">
                              <span className="text-sm">۲</span>
                              <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                            </div>
                            <div className="flex items-center justify-center border rounded-md p-2">
                              <span className="text-sm">۳</span>
                              <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                            </div>
                            <div className="flex items-center justify-center border rounded-md p-2">
                              <span className="text-sm">۴</span>
                              <div className="w-5 h-5 border border-black rounded-full ml-1"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Descriptive answers section */}
              <div className="descriptive-answers">
                {/* Original descriptive answers content */}
                <h2 className="text-lg font-bold mb-4">
                  پاسخنامه سوالات تشریحی
                </h2>
                <div className="space-y-6">
                  {examQuestions
                    .filter((q) => !q.question.type?.includes("تستی"))
                    .map((question) => {
                      // Find the original index of this question in the full questions array
                      const originalIndex = examQuestions.findIndex(
                        (q) => q._id === question._id
                      );

                      return (
                        <div
                          key={`desc-${question._id}`}
                          className="p-4 border rounded-md"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold">
                              سوال {toPersianNumber(originalIndex + 1)}
                            </div>
                            <div className="text-sm">
                              {toPersianNumber(question.score)} نمره
                            </div>
                          </div>
                          <div className="min-h-32 border-t border-dashed border-gray-300 pt-2"></div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Regular exam content (hidden when in answer sheet mode) */}
      <div
        className={`print-container ${
          isAnswerSheetMode ? "hidden-when-answer-sheet" : ""
        }`}
      >
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
                {examData?.data?.dateTime?.startDate
                  ? formatPersianDate(examData.data?.dateTime?.startDate)
                  : ""}
              </div>
              <div className="mb-2">
                <span className="font-semibold ml-2">زمان پایان:</span>
                {examData?.data?.dateTime?.endDate
                  ? formatPersianDate(examData.data?.dateTime?.endDate)
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

          {examData?.data?.settings?.preexammessage && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <div className="font-semibold mb-1">پیام آزمون:</div>
              <div
                dangerouslySetInnerHTML={renderHTML(
                  examData.data?.settings?.preexammessage
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
                  <div className="flex items-center gap-2">
                    <div className="text-sm ml-4">
                      <span className="ml-4">
                        نمره: {toPersianNumber(item.score)}
                      </span>
                      <span>دسته‌بندی: {item.category}</span>
                    </div>
                    <div className="flex items-center non-printable">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-blue-600"
                        onClick={() => handleEditQuestion(item)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">ویرایش</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-red-600"
                        onClick={() => handleDeleteQuestion(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">حذف</span>
                      </Button>
                    </div>
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
                  <div
                    className={`grid ${
                      printTemplate === "dense" ? "grid-cols-3" : "grid-cols-2"
                    } gap-4 options-container`}
                  >
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
            ${printTemplate === "regular"
              ? "font-size: 12pt; line-height: 1.5;"
              : ""}
            ${printTemplate === "compact"
              ? "font-size: 10pt; line-height: 1.3;"
              : ""}
            ${printTemplate === "dense"
              ? "font-size: 9pt; line-height: 1.2;"
              : ""}
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

          .hidden-when-answer-sheet {
            display: none !important;
          }

          .answer-sheet-container {
            display: block !important;
          }

          .question-item {
            page-break-inside: avoid;
            border: 1px solid #ccc !important;
            margin-bottom: ${printTemplate === "regular"
              ? "20px"
              : printTemplate === "compact"
              ? "12px"
              : "8px"};
            padding: ${printTemplate === "regular"
              ? "16px"
              : printTemplate === "compact"
              ? "10px"
              : "6px"} !important;
          }

          .print-header {
            margin-bottom: ${printTemplate === "regular"
              ? "30px"
              : printTemplate === "compact"
              ? "20px"
              : "15px"};
          }

          .question-text img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: ${printTemplate === "regular"
              ? "10px auto"
              : printTemplate === "compact"
              ? "5px auto"
              : "3px auto"};
          }

          .options-container {
            grid-gap: ${printTemplate === "regular"
              ? "1rem"
              : printTemplate === "compact"
              ? "0.5rem"
              : "0.25rem"} !important;
          }

          .options-container > div {
            padding: ${printTemplate === "regular"
              ? "0.75rem"
              : printTemplate === "compact"
              ? "0.5rem"
              : "0.25rem"} !important;
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
            font-size: ${printTemplate === "regular"
              ? "8pt"
              : printTemplate === "compact"
              ? "7pt"
              : "6pt"};
            color: #22c55e;
            font-weight: bold;
          }

          /* Answer sheet specific styles */
          .multiple-choice-answers {
            page-break-before: auto;
            page-break-after: auto;
            page-break-inside: avoid;
          }

          .descriptive-answers {
            page-break-before: auto;
          }

          @page {
            size: A4;
            margin: ${printTemplate === "regular"
              ? "1.5cm"
              : printTemplate === "compact"
              ? "1cm"
              : "0.7cm"};
          }

          .answer-space {
            display: block;
          }

          /* Essay answer space height varies by template */
          .answer-space .h-32 {
            height: ${printTemplate === "regular"
              ? "8rem"
              : printTemplate === "compact"
              ? "5rem"
              : "3rem"} !important;
          }

          /* Adjust grid layout based on template */
          ${printTemplate === "dense"
            ? `
          .options-container {
            grid-template-columns: 1fr 1fr 1fr !important;
          }`
            : ""}

          /* Page break for multiple answer sheets */
          .page-break-before {
            page-break-before: always;
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

          /* Preview styles for different templates */
          .print-template-compact .question-item {
            padding: 10px;
            margin-bottom: 12px;
            font-size: 0.9rem;
          }

          .print-template-compact .options-container {
            gap: 0.5rem;
          }

          .print-template-compact .options-container > div {
            padding: 0.5rem;
          }

          .print-template-dense .question-item {
            padding: 6px;
            margin-bottom: 8px;
            font-size: 0.85rem;
            line-height: 1.2;
          }

          .print-template-dense .options-container {
            gap: 0.25rem;
          }

          .print-template-dense .options-container > div {
            padding: 0.25rem;
          }

          .print-template-dense .print-header {
            margin-bottom: 15px;
          }
        }

        /* Only show answer sheet in print mode */
        .answer-sheet-container {
          display: none;
        }

        .answer-sheet-mode:not(.print) .answer-sheet-container {
          display: none;
        }

        /* Print mode specific styles */
        .print-mode .non-printable {
          display: none;
        }
      `}</style>

      {/* Participants Dialog */}
      <Dialog
        open={participantsDialogOpen}
        onOpenChange={setParticipantsDialogOpen}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>شرکت کنندگان آزمون</DialogTitle>
            <DialogDescription>
              لیست تمام شرکت کنندگان در این آزمون
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">{renderParticipantsList()}</div>

          <DialogFooter className="flex justify-end mt-4">
            <Button onClick={() => setParticipantsDialogOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>ویرایش سوال</DialogTitle>
            <DialogDescription>
              اطلاعات سوال را ویرایش کنید و دکمه ذخیره را بزنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="question-category"
                  className="text-sm font-medium"
                >
                  دسته‌بندی
                </label>
                <input
                  id="question-category"
                  className="border rounded p-2"
                  value={editQuestionData.category}
                  onChange={(e) =>
                    handleEditQuestionChange("category", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="question-score" className="text-sm font-medium">
                  نمره
                </label>
                <input
                  id="question-score"
                  type="number"
                  className="border rounded p-2"
                  value={editQuestionData.score}
                  onChange={(e) =>
                    handleEditQuestionChange("score", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="question-time" className="text-sm font-medium">
                  زمان پاسخگویی (ثانیه)
                </label>
                <input
                  id="question-time"
                  type="number"
                  className="border rounded p-2"
                  value={editQuestionData.responseTime}
                  onChange={(e) =>
                    handleEditQuestionChange("responseTime", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <label htmlFor="question-text" className="text-sm font-medium">
                متن سوال
              </label>
              <RichTextEditor
                className="mb-4"
                value={editQuestionData.question}
                onChange={(value) =>
                  setEditQuestionData({ ...editQuestionData, question: value })
                }
              />
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">گزینه‌ها</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="option1"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <span className="rounded-full bg-gray-200 text-gray-800 flex items-center justify-center w-5 h-5 text-xs">
                      ۱
                    </span>
                    <span>گزینه اول</span>
                  </label>
                  <RichTextEditor
                    className="mb-4"
                    value={editQuestionData.option1}
                    onChange={(value) =>
                      setEditQuestionData({
                        ...editQuestionData,
                        option1: value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="option2"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <span className="rounded-full bg-gray-200 text-gray-800 flex items-center justify-center w-5 h-5 text-xs">
                      ۲
                    </span>
                    <span>گزینه دوم</span>
                  </label>
                  <RichTextEditor
                    className="mb-4"
                    value={editQuestionData.option2}
                    onChange={(value) =>
                      setEditQuestionData({
                        ...editQuestionData,
                        option2: value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="option3"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <span className="rounded-full bg-gray-200 text-gray-800 flex items-center justify-center w-5 h-5 text-xs">
                      ۳
                    </span>
                    <span>گزینه سوم</span>
                  </label>
                  <RichTextEditor
                    className="mb-4"
                    value={editQuestionData.option3}
                    onChange={(value) =>
                      setEditQuestionData({
                        ...editQuestionData,
                        option3: value,
                      })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <label
                    htmlFor="option4"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <span className="rounded-full bg-gray-200 text-gray-800 flex items-center justify-center w-5 h-5 text-xs">
                      ۴
                    </span>
                    <span>گزینه چهارم</span>
                  </label>
                  <RichTextEditor
                    className="mb-4"
                    value={editQuestionData.option4}
                    onChange={(value) =>
                      setEditQuestionData({
                        ...editQuestionData,
                        option4: value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <label htmlFor="correct-option" className="text-sm font-medium">
                گزینه صحیح (۱ تا ۴)
              </label>
              <input
                id="correct-option"
                type="number"
                min="1"
                max="4"
                className="border rounded p-2 w-20"
                value={editQuestionData.correctoption}
                onChange={(e) =>
                  handleEditQuestionChange("correctoption", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleSaveEditedQuestion}>ذخیره تغییرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف سوال</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف این سوال اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              تایید حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PrintExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          <span className="mr-2">در حال بارگذاری...</span>
        </div>
      }
    >
      <PrintExamContent />
    </Suspense>
  );
}
