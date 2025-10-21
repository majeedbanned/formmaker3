"use client";
import React, { useState, useEffect, useCallback } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Excel from "exceljs";
import { saveAs } from "file-saver";
import { useAuth } from "@/hooks/useAuth";

// Define the print styles for report cards
const printStyles = `
  @media print {
    body {
      background-color: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      font-size: 9pt !important;
    }
    .printing {
      padding: 0.5rem !important;
    }
    .printing .card {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .print\\:hidden {
      display: none !important;
    }
    .printing .overflow-x-auto {
      overflow: visible !important;
    }
    .printing table {
      width: 100%;
      page-break-inside: auto;
      border-collapse: collapse !important;
    }
    .printing tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    .printing th, .printing td {
      page-break-inside: avoid;
      padding: 3px 5px !important;
      font-size: 8pt !important;
    }
    .printing thead {
      display: table-header-group;
    }
    .printing tfoot {
      display: table-footer-group;
    }
    .printing .student-name {
      font-size: 10pt !important;
      padding: 6px !important;
      margin-bottom: 4px !important;
    }
    .printing .month-gregorian {
      font-size: 6pt !important;
    }
    .printing .grade-value {
      font-size: 8pt !important;
    }
    .printing .progress-indicator, .printing .rank-indicator {
      font-size: 6pt !important;
      padding: 0px 3px !important;
      margin-top: 1px !important;
    }
    .printing .subject-cell, .printing .teacher-cell {
      max-width: 100px !important;
      white-space: normal !important;
    }
    .printing .report-card-wrapper {
      margin-bottom: 8px !important;
      padding: 2px !important;
      page-break-before: always !important;
    }
    .printing .report-card-wrapper:first-of-type {
      page-break-before: avoid !important;
    }
    .printing .card-content {
      padding: 0 !important;
    }
    @page {
      size: landscape;
      margin: 0.5cm;
    }
  }
`;

// Add custom styles for better UI
const customStyles = `
  .report-card-wrapper {
    transition: all 0.3s ease;
  }
  
  .report-card-wrapper:hover {
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
  
  .student-name {
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    color: white;
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem 0.5rem 0 0;
    margin: -0.5rem -0.5rem 0.5rem -0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .student-name-text {
    font-weight: 700;
    font-size: 1.1rem;
  }
  
  .student-code {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.8rem;
    font-weight: normal;
  }
  
  .student-details {
    display: flex;
    gap: 1rem;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .student-detail-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  
  .student-info {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .grade-container {
    position: relative;
  }
  
  .grade-value {
    font-weight: 600;
  }
  
  .progress-indicator {
    font-size: 0.65rem;
    border-radius: 9999px;
    padding: 1px 6px;
    margin-top: 0.25rem;
    display: inline-block;
  }
  
  .progress-positive {
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(16, 185, 129);
  }
  
  .progress-negative {
    background-color: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }
  
  .progress-neutral {
    background-color: rgba(107, 114, 128, 0.1);
    color: rgb(107, 114, 128);
  }
  
  .rank-indicator {
    font-size: 0.65rem;
    border-radius: 9999px;
    padding: 1px 6px;
    background-color: rgba(139, 92, 246, 0.1);
    color: rgb(139, 92, 246);
    margin-top: 0.25rem;
    display: inline-block;
  }
  
  .overall-rank {
    background-color: rgba(79, 70, 229, 0.15);
    color: rgb(79, 70, 229);
    font-weight: 600;
  }
  
  .average-row {
    background-color: rgba(243, 244, 246, 0.7);
  }
  
  .custom-header-cell {
    background-color: #f8fafc;
    position: sticky;
    top: 0;
    font-weight: 600;
  }
  
  .subject-cell {
    background-color: #f8fafc;
    position: sticky;
    left: 0;
    min-width: 180px;
    z-index: 10;
  }
  
  .teacher-cell {
    background-color: #f8fafc;
    position: sticky;
    left: 180px;
    min-width: 150px;
    z-index: 10;
  }
  
  .month-header {
    position: relative;
  }
  
  .month-name {
    font-weight: 600;
  }
  
  .month-gregorian {
    font-size: 0.65rem;
    color: #6b7280;
    display: block;
  }
  
  .filter-card {
    background: linear-gradient(to right, #f9fafb, #f3f4f6);
    border: 1px solid #e5e7eb;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .excel-button {
    background-color: #10b981;
    color: white;
  }
  
  .excel-button:hover {
    background-color: #059669;
  }
  
  .print-button {
    background-color: #3b82f6;
    color: white;
  }
  
  .print-button:hover {
    background-color: #2563eb;
  }
  
  .option-checkbox {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .option-checkbox:hover {
    background-color: #f3f4f6;
  }
  
  .checkbox-label {
    margin-right: 0.5rem;
  }
  
  .presence-container {
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .presence-title {
    background-color: #f3f4f6;
    padding: 0.5rem 1rem;
    font-weight: 600;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .presence-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1px;
    background-color: #e5e7eb;
  }
  
  .presence-grid-cell {
    padding: 0.5rem;
    background-color: white;
    text-align: center;
  }
  
  .presence-header {
    font-weight: 600;
    background-color: #f9fafb;
  }
  
  .presence-present {
    color: #10b981;
  }
  
  .presence-absent {
    color: #ef4444;
  }
  
  .presence-late {
    color: #f59e0b;
  }
  
  .presence-total {
    color: #6b7280;
  }
  
  .assessment-container {
    margin-top: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    overflow: hidden;
  }
  
  .assessment-title {
    background-color: #f3f4f6;
    padding: 0.5rem 1rem;
    font-weight: 600;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .assessment-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .assessment-header {
    background-color: #f9fafb;
    font-weight: 600;
    text-align: right;
    padding: 0.5rem 1rem;
  }
  
  .assessment-cell {
    padding: 0.5rem 1rem;
    border-top: 1px solid #e5e7eb;
  }
  
  .assessment-value {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .assessment-excellent {
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(16, 185, 129);
  }
  
  .assessment-good {
    background-color: rgba(59, 130, 246, 0.1);
    color: rgb(59, 130, 246);
  }
  
  .assessment-average {
    background-color: rgba(245, 158, 11, 0.1);
    color: rgb(245, 158, 11);
  }
  
  .assessment-poor {
    background-color: rgba(239, 68, 68, 0.1);
    color: rgb(239, 68, 68);
  }
  
  .assessment-very-poor {
    background-color: rgba(220, 38, 38, 0.1);
    color: rgb(220, 38, 38);
  }
  
  @media print {
    .presence-container, .assessment-container {
      page-break-inside: avoid;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .presence-title, .assessment-title {
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
    }
    
    .presence-grid-cell {
      padding: 0.25rem;
      font-size: 0.7rem;
    }
    
    .assessment-header, .assessment-cell {
      padding: 0.25rem 0.5rem;
      font-size: 0.7rem;
    }
    
    .assessment-value {
      padding: 0.1rem 0.25rem;
      font-size: 0.7rem;
    }
    
    .student-name {
      padding: 0.5rem 1rem !important;
    }
    
    .student-name-text {
      font-size: 1rem !important;
    }
    
    .student-code {
      font-size: 0.7rem !important;
    }
    
    .student-details {
      font-size: 0.7rem !important;
    }
  }

  // Add additional styles for the rank display
  .rank-badge {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 9999px;
    padding: 0.15rem 0.5rem;
    font-size: 0.8rem;
    font-weight: bold;
    margin-top: 0.25rem;
    display: inline-block;
  }
  
  .header-stats {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  @media print {
    .rank-badge {
      font-size: 0.7rem !important;
      padding: 0.1rem 0.4rem !important;
    }
  }
`;

// Define types
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
};

type TeacherCourse = {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: WeeklySchedule[];
  weeklySchedule_expanded?: boolean;
};

type ClassData = {
  classCode: string;
  className: string;
  major: string;
  Grade: string;
  schoolCode: string;
  teachers: TeacherCourse[];
  teachers_expanded?: boolean;
  students: Student[];
};

type ClassDocument = {
  data: ClassData;
};

type GradeEntry = {
  value: number;
  description: string;
  date: string;
  totalPoints?: number;
};

type AssessmentEntry = {
  title: string;
  value: string;
  date: string;
  weight?: number;
};

type CellData = {
  classCode: string;
  studentCode: string;
  teacherCode: string;
  courseCode: string;
  schoolCode: string;
  date: string;
  timeSlot: string;
  note: string;
  grades: GradeEntry[];
  presenceStatus: "present" | "absent" | "late" | null;
  descriptiveStatus?: string;
  assessments?: AssessmentEntry[];
};

// Assessment values with weights
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

type CourseData = {
  courseCode: string;
  courseName: string;
  schoolCode?: string;
  vahed?: number;
  [key: string]: string | number | undefined;
};

type StudentReportCard = {
  studentCode: string;
  studentName: string;
  courses: Record<
    string,
    {
      courseName: string;
      teacherName: string;
      vahed: number;
      monthlyGrades: Record<string, number | null>;
      monthlyAssessments: Record<string, AssessmentEntry[]>;
      monthlyPresence: Record<
        string,
        {
          present: number;
          absent: number;
          late: number;
          total: number;
        }
      >;
      yearAverage: number | null;
    }
  >;
  weightedAverage?: number | null;
  weightedGradesInfo?: WeightedGradeInfo[];
};

// Type for storing the weighted grade calculation details for tooltips
type WeightedGradeInfo = {
  courseName: string;
  grade: number;
  vahed: number;
  weightedValue: number;
};

// Helper function for Persian date conversion
function gregorian_to_jalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

// Helper function: Convert numbers to Persian digits.
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join("");
}

// Add a helper function to get assessment value class
const getAssessmentValueClass = (value: string): string => {
  switch (value) {
    case "عالی":
      return "assessment-excellent";
    case "خوب":
      return "assessment-good";
    case "متوسط":
      return "assessment-average";
    case "ضعیف":
      return "assessment-poor";
    case "بسیار ضعیف":
      return "assessment-very-poor";
    default:
      return "";
  }
};

// Main ReportCards component
const ReportCards = ({
  schoolCode,
  teacherCode,
  classDocuments,
}: {
  schoolCode: string;
  teacherCode?: string;
  classDocuments: ClassDocument[];
}) => {
  // Get auth data
  const { user, isLoading: authLoading } = useAuth();

  // Component state
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [yearOptions, setYearOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [teachersInfo, setTeachersInfo] = useState<Record<string, string>>({});
  const [coursesInfo, setCoursesInfo] = useState<Record<string, CourseData>>(
    {}
  );
  const [assessmentValues, setAssessmentValues] = useState<
    Record<string, Record<string, number>>
  >({});
  const [studentReportCards, setStudentReportCards] = useState<
    StudentReportCard[]
  >([]);
  // Add new state for display options
  const [showProgress, setShowProgress] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showPresence, setShowPresence] = useState(false);
  const [showAssessments, setShowAssessments] = useState(false);
  // Add a new state for showing overall statistics
  const [showOverallStats, setShowOverallStats] = useState(false);
  // Add a new state variable for selected student
  const [selectedStudent, setSelectedStudent] = useState<string>("all");

  // Add state for filtered documents based on user type
  const [filteredClassDocuments, setFilteredClassDocuments] =
    useState<ClassDocument[]>(classDocuments);

  // Filter class documents based on user type
  useEffect(() => {
    if (authLoading || !user) return;

    if (user.userType === "teacher") {
      // For teachers: Only show classes they teach
      const teacherClasses = classDocuments.filter((doc) =>
        doc.data.teachers.some(
          (teacher) => teacher.teacherCode === user.username
        )
      );
      setFilteredClassDocuments(teacherClasses);

      // Auto-select the first class if there's only one
      if (teacherClasses.length === 1 && !selectedClass) {
        setTimeout(() => setSelectedClass(teacherClasses[0].data.classCode), 0);
      }
    } else if (user.userType === "student") {
      // For students: Only show classes they are in
      const studentClasses = classDocuments.filter((doc) =>
        doc.data.students.some(
          (student) => student.studentCode === user.username
        )
      );
      setFilteredClassDocuments(studentClasses);

      // Auto-select the student's class
      if (studentClasses.length > 0 && !selectedClass) {
        setTimeout(() => setSelectedClass(studentClasses[0].data.classCode), 0);
      }

      // Auto-select the student
      if (user.username) {
        setTimeout(() => setSelectedStudent(user.username), 0);
      }
    } else {
      // For school admins: Show all classes
      setFilteredClassDocuments(classDocuments);
    }
  }, [user, authLoading, classDocuments, selectedClass]);

  // Get the current Persian year based on the current date
  const currentDate = new Date();
  const [currentJYear] = gregorian_to_jalali(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );

  // Generate year options once on component mount
  useEffect(() => {
    if (isInitialized) return;

    // Create year options (current year and previous year)
    const years = [
      {
        value: currentJYear.toString(),
        label: toPersianDigits(currentJYear),
      },
      {
        value: (currentJYear - 1).toString(),
        label: toPersianDigits(currentJYear - 1),
      },
    ];

    setYearOptions(years);
    setSelectedYear(currentJYear.toString());
    setIsInitialized(true);
  }, [currentJYear, isInitialized]);

  // Fetch teachers and courses info
  useEffect(() => {
    const fetchTeachersAndCourses = async () => {
      if (!schoolCode) return;

      try {
        // Fetch teachers
        const teachersResponse = await fetch(
          `/api/formbuilder/classes-teachers`,
          {
            headers: {
              "x-domain": window.location.host,
            },
          }
        );

        if (teachersResponse.ok) {
          const { teachers } = await teachersResponse.json();

          // Create a map of teacher codes to names
          const teacherMap: Record<string, string> = {};
          teachers.forEach(
            (teacher: {
              data: { teacherCode: string; teacherName?: string };
            }) => {
              teacherMap[teacher.data.teacherCode] =
                teacher.data.teacherName || teacher.data.teacherCode;
            }
          );

          setTeachersInfo(teacherMap);
        }

        // Fetch courses with vahed information
        const coursesResponse = await fetch(
          `/api/courses/sheet?schoolCode=${schoolCode}`
        );
        console.log("coursesResponse", coursesResponse);
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log("coursesData", coursesData);
          // Create a map of course codes to course data
          const courseMap: Record<string, CourseData> = {};

          if (Array.isArray(coursesData)) {
            coursesData.forEach((course) => {
              // Handle different data structures
              const courseCode =
                course.courseCode || (course.data && course.data.courseCode);
              if (courseCode) {
                // Create a standardized course data object
                courseMap[courseCode] = {
                  courseCode,
                  courseName:
                    course.courseName ||
                    (course.data && course.data.courseName) ||
                    courseCode,
                  vahed:
                    course.vahed || (course.data && course.data.vahed) || 1, // Default to 1 if not specified
                  schoolCode,
                };
              }
            });
          }

          setCoursesInfo(courseMap);
        }
      } catch (err) {
        console.error("Error fetching teacher/course data:", err);
      }
    };

    fetchTeachersAndCourses();
  }, [schoolCode]);

  // Get filtered class options based on user type and teacherCode
  const getClassOptions = () => {
    let options = filteredClassDocuments.map((doc) => ({
      value: doc.data.classCode,
      label: doc.data.className,
    }));

    // If teacherCode is provided from props and user is not a student, filter by that teacherCode
    if (teacherCode && user?.userType !== "student") {
      options = options.filter((option) => {
        const classDoc = filteredClassDocuments.find(
          (doc) => doc.data.classCode === option.value
        );
        if (!classDoc) return false;

        return classDoc.data.teachers.some(
          (teacher) => teacher.teacherCode === teacherCode
        );
      });

      // Auto-select the first class if there's only one
      if (options.length === 1 && !selectedClass) {
        setTimeout(() => setSelectedClass(options[0].value), 0);
      }
    }

    return options;
  };

  // Add a function to calculate final score with assessments
  const calculateFinalScore = useCallback(
    (
      grades: number | null,
      assessments: AssessmentEntry[],
      courseKey: string,
      assessmentValues: Record<string, Record<string, number>>
    ): number | null => {
      if (grades === null) return null;

      // If no assessments, return the average grade
      if (!assessments || assessments.length === 0) return grades;

      // Get course-specific assessment values if available
      const courseValues = assessmentValues[courseKey] || {};

      // Calculate direct assessment adjustment (add/subtract directly)
      const assessmentAdjustment = assessments.reduce((total, assessment) => {
        // Check if there's a custom value for this assessment
        const adjustment =
          courseValues[assessment.value] !== undefined
            ? courseValues[assessment.value]
            : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

        return total + adjustment;
      }, 0);

      // Calculate final score with direct addition of assessment adjustment
      let finalScore = grades + assessmentAdjustment;

      // Cap at 20
      finalScore = Math.min(finalScore, 20);

      // Ensure not negative
      finalScore = Math.max(finalScore, 0);

      return finalScore;
    },
    []
  );

  // Helper function to format weighted average tooltip
  const formatWeightedAverageTooltip = useCallback(
    (weightedGradesInfo: WeightedGradeInfo[] | undefined): string => {
      if (!weightedGradesInfo || weightedGradesInfo.length === 0)
        return "اطلاعاتی موجود نیست";

      // Calculate total weights and sum for final display
      const totalWeight = weightedGradesInfo.reduce(
        (sum, item) => sum + item.vahed,
        0
      );
      const weightedSum = weightedGradesInfo.reduce(
        (sum, item) => sum + item.weightedValue,
        0
      );
      const average =
        totalWeight > 0
          ? Math.round((weightedSum / totalWeight) * 100) / 100
          : 0;

      // Create detailed breakdown
      let tooltip = "محاسبه میانگین بر اساس واحد:\n\n";

      // Add each course's calculation
      weightedGradesInfo.forEach((item) => {
        const formattedGrade = toPersianDigits(item.grade.toFixed(2));
        const formattedVahed = toPersianDigits(item.vahed);
        const formattedWeighted = toPersianDigits(
          item.weightedValue.toFixed(2)
        );

        tooltip += `${item.courseName}: ${formattedGrade} × ${formattedVahed} واحد = ${formattedWeighted}\n`;
      });

      // Add summary calculation
      tooltip += `\nمجموع: ${toPersianDigits(weightedSum.toFixed(2))}\n`;
      tooltip += `تعداد کل واحد: ${toPersianDigits(totalWeight)}\n`;
      tooltip += `میانگین نهایی: ${toPersianDigits(average.toFixed(2))}`;

      return tooltip;
    },
    []
  );

  // Fetch grades when selection changes
  useEffect(() => {
    if (!selectedClass || !selectedYear) {
      return;
    }

    const fetchReportCardData = async () => {
      setLoading(true);
      try {
        const selectedClassData = filteredClassDocuments.find(
          (doc) => doc.data.classCode === selectedClass
        )?.data;

        if (!selectedClassData) {
          console.error("Selected class not found");
          setLoading(false);
          return;
        }

        // Get all teacher-course pairs for this class
        let teacherCourses = selectedClassData.teachers;

        // If user is a teacher, filter to only their courses
        if (user?.userType === "teacher") {
          teacherCourses = teacherCourses.filter(
            (tc) => tc.teacherCode === user.username
          );
        }

        // Create a map to store assessment values by course
        const courseValues: Record<string, Record<string, number>> = {};

        // Fetch assessment values for each teacher-course pair
        for (const tc of teacherCourses) {
          try {
            const response = await fetch(
              `/api/assessments?teacherCode=${tc.teacherCode}&courseCode=${tc.courseCode}&schoolCode=${schoolCode}`
            );

            if (!response.ok) continue;

            const data = await response.json();
            if (!data || !data.data || !Array.isArray(data.data)) continue;

            // Process assessment data to extract custom values
            const customValues: Record<string, number> = {};
            data.data.forEach(
              (assessment: { value?: string; weight?: number }) => {
                if (
                  assessment &&
                  assessment.value &&
                  assessment.weight !== undefined
                ) {
                  customValues[assessment.value] = assessment.weight;
                }
              }
            );

            // Store the custom values keyed by courseCode
            courseValues[tc.courseCode] = customValues;
          } catch (error) {
            console.error(
              `Error fetching assessment values for ${tc.courseCode}:`,
              error
            );
          }
        }

        // Update assessment values state
        setAssessmentValues(courseValues);

        // Student report card structure
        const studentReports: Record<string, StudentReportCard> = {};

        // Initialize student report cards for students to process
        selectedClassData.students.forEach((student) => {
          studentReports[student.studentCode] = {
            studentCode: student.studentCode,
            studentName: `${student.studentName} ${student.studentlname}`,
            courses: {},
          };
        });

        // Fetch grades for each teacher-course combination
        for (const tc of teacherCourses) {
          // Get teacher and course names
          const teacherName = teachersInfo[tc.teacherCode] || tc.teacherCode;
          const courseData = coursesInfo[tc.courseCode] || {
            courseCode: tc.courseCode,
            courseName: `درس ${tc.courseCode}`,
            vahed: 1, // Default to 1 if not specified
          };
          const courseName = courseData.courseName || `درس ${tc.courseCode}`;
          const vahed = courseData.vahed || 1;

          // Fetch all grade data for this teacher-course
          const response = await fetch("/api/classsheet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              classCode: selectedClass,
              teacherCode: tc.teacherCode,
              courseCode: tc.courseCode,
              schoolCode,
            }),
          });

          if (!response.ok) {
            console.error(`Failed to fetch grade data for ${courseName}`);
            continue;
          }

          const cellData: CellData[] = await response.json();

          // Filter for the selected school year
          const filteredCellData = cellData.filter((cell) => {
            if (!cell.date) return false;

            try {
              const cellDate = new Date(cell.date);
              // Check if date is valid
              if (isNaN(cellDate.getTime())) return false;

              const [cellYear, cellMonth] = gregorian_to_jalali(
                cellDate.getFullYear(),
                cellDate.getMonth() + 1,
                cellDate.getDate()
              );

              // School year logic: months 7-12 from previous year, months 1-6 from current year
              if (cellMonth >= 7) {
                // First half of school year (Fall/Winter)
                return cellYear.toString() === selectedYear;
              } else {
                // Second half of school year (Spring/Summer)
                return (
                  cellYear.toString() ===
                  (parseInt(selectedYear) + 1).toString()
                );
              }
            } catch (err) {
              console.error("Error processing date:", cell.date, err);
              return false;
            }
          });

          // Group grades by student and month
          selectedClassData.students.forEach((student) => {
            const studentCells = filteredCellData.filter(
              (cell) => cell.studentCode === student.studentCode
            );

            // Initialize course structure
            studentReports[student.studentCode].courses[tc.courseCode] = {
              courseName,
              teacherName,
              vahed,
              monthlyGrades: {},
              monthlyAssessments: {}, // Add assessments tracking
              monthlyPresence: {}, // Add presence tracking
              yearAverage: null,
            };

            // Initialize monthly grades, assessments, and presence
            for (let i = 1; i <= 12; i++) {
              const monthKey = i.toString();
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].monthlyGrades[monthKey] = null;
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].monthlyAssessments[monthKey] = [];
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].monthlyPresence[monthKey] = {
                present: 0,
                absent: 0,
                late: 0,
                total: 0,
              };
            }

            // Process cells for each month
            studentCells.forEach((cell) => {
              if (!cell.date) return;

              try {
                const cellDate = new Date(cell.date);
                const [, cellMonth] = gregorian_to_jalali(
                  cellDate.getFullYear(),
                  cellDate.getMonth() + 1,
                  cellDate.getDate()
                );

                const monthKey = cellMonth.toString();

                // If there are grades for this cell, calculate average for this month
                if (cell.grades && cell.grades.length > 0) {
                  const gradeAverage =
                    cell.grades.reduce((sum, grade) => sum + grade.value, 0) /
                    cell.grades.length;

                  // Store or update the monthly grade
                  const currentGrade =
                    studentReports[student.studentCode].courses[tc.courseCode]
                      .monthlyGrades[monthKey];

                  if (currentGrade === null) {
                    studentReports[student.studentCode].courses[
                      tc.courseCode
                    ].monthlyGrades[monthKey] = gradeAverage;
                  } else {
                    // If already has a grade for this month, take the average
                    studentReports[student.studentCode].courses[
                      tc.courseCode
                    ].monthlyGrades[monthKey] =
                      (currentGrade + gradeAverage) / 2;
                  }
                }

                // Store assessments
                if (cell.assessments && cell.assessments.length > 0) {
                  studentReports[student.studentCode].courses[
                    tc.courseCode
                  ].monthlyAssessments[monthKey] = [
                    ...studentReports[student.studentCode].courses[
                      tc.courseCode
                    ].monthlyAssessments[monthKey],
                    ...cell.assessments,
                  ];
                }

                // Track presence status
                if (cell.presenceStatus !== null) {
                  const presence =
                    studentReports[student.studentCode].courses[tc.courseCode]
                      .monthlyPresence[monthKey];
                  presence.total += 1;

                  if (cell.presenceStatus === "present") {
                    presence.present += 1;
                  } else if (cell.presenceStatus === "absent") {
                    presence.absent += 1;
                  } else if (cell.presenceStatus === "late") {
                    presence.late += 1;
                  }
                }
              } catch (err) {
                console.error("Error processing cell date:", cell.date, err);
              }
            });

            // Calculate final grades with assessments for each month
            for (let month = 1; month <= 12; month++) {
              const monthKey = month.toString();
              const rawGrade =
                studentReports[student.studentCode].courses[tc.courseCode]
                  .monthlyGrades[monthKey];
              const assessments =
                studentReports[student.studentCode].courses[tc.courseCode]
                  .monthlyAssessments[monthKey];

              if (rawGrade !== null) {
                // Apply assessments to get final grade
                studentReports[student.studentCode].courses[
                  tc.courseCode
                ].monthlyGrades[monthKey] = calculateFinalScore(
                  rawGrade,
                  assessments,
                  tc.courseCode,
                  assessmentValues
                );
              }
            }

            // Calculate year average for this course using adjusted grades
            const grades = Object.values(
              studentReports[student.studentCode].courses[tc.courseCode]
                .monthlyGrades
            ).filter((grade) => grade !== null) as number[];

            if (grades.length > 0) {
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].yearAverage =
                grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
            }
          });
        }

        // Convert to array for easier rendering
        const reportCardsArray = Object.values(studentReports).map(
          (student) => {
            // Calculate weighted average based on vahed values for each student
            const weightedGradesInfo: WeightedGradeInfo[] = [];
            let totalWeight = 0;
            let weightedSum = 0;

            // Process each course
            Object.values(student.courses).forEach((course) => {
              if (course.yearAverage !== null) {
                const weightedValue = course.yearAverage * course.vahed;
                weightedSum += weightedValue;
                totalWeight += course.vahed;

                // Store weighted grade info for tooltip
                weightedGradesInfo.push({
                  courseName: course.courseName,
                  grade: course.yearAverage,
                  vahed: course.vahed,
                  weightedValue,
                });
              }
            });

            // Calculate final weighted average
            const weightedAverage =
              totalWeight > 0
                ? Math.round((weightedSum / totalWeight) * 100) / 100
                : null;

            // Add weighted average info to the student record
            return {
              ...student,
              weightedAverage,
              weightedGradesInfo,
            };
          }
        );

        setStudentReportCards(reportCardsArray);
      } catch (error) {
        console.error("Error fetching report card data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportCardData();
  }, [
    selectedClass,
    selectedYear,
    filteredClassDocuments,
    schoolCode,
    teachersInfo,
    coursesInfo,
    calculateFinalScore,
    user,
  ]);

  // Function to get color class based on grade
  const getScoreColorClass = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return "text-gray-400";
    if (score >= 18) return "text-emerald-600 font-bold";
    if (score >= 15) return "text-green-600";
    if (score >= 12) return "text-blue-600";
    if (score >= 10) return "text-amber-500";
    return "text-red-500";
  };

  // Handle printing function
  const handlePrint = () => {
    setIsPrinting(true);

    // Allow time for the styles to be applied
    setTimeout(() => {
      window.print();
      // Reset after printing is done
      setTimeout(() => {
        setIsPrinting(false);
      }, 500);
    }, 100);
  };

  // Export to Excel function
  const exportToExcel = async () => {
    if (studentReportCards.length === 0) return;

    // Filter students based on selection and user role
    // Students should only export their own report card
    const studentsToExport =
      user?.userType === "student"
        ? studentReportCards.filter(
            (student) => student.studentCode === user.username
          )
        : selectedStudent === "all"
        ? studentReportCards
        : studentReportCards.filter(
            (student) => student.studentCode === selectedStudent
          );

    // If no students to export (shouldn't happen, but safety check)
    if (studentsToExport.length === 0) {
      console.error("No students to export");
      return;
    }

    // Create a new workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("کارنامه تحصیلی");

    // Set RTL direction
    worksheet.views = [{ rightToLeft: true }];

    // Add a title with class and school year info
    worksheet.mergeCells("A1:Z1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `کارنامه تحصیلی - ${
      filteredClassDocuments.find((doc) => doc.data.classCode === selectedClass)
        ?.data.className
    } - سال تحصیلی ${yearOptions.find((y) => y.value === selectedYear)?.label}`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // For each student, create a separate worksheet
    for (const student of studentsToExport) {
      const studentSheet = workbook.addWorksheet(`${student.studentName}`);
      studentSheet.views = [{ rightToLeft: true }];

      // Add student info as title
      studentSheet.mergeCells("A1:N1");
      const studentTitle = studentSheet.getCell("A1");
      studentTitle.value = `کارنامه ${student.studentName} - کد: ${student.studentCode}`;
      studentTitle.font = { size: 14, bold: true };
      studentTitle.alignment = { horizontal: "center" };

      // Set column headers
      const columns = [
        { header: "نام درس", key: "courseName", width: 25 },
        { header: "معلم", key: "teacherName", width: 25 },
        { header: "واحد", key: "vahed", width: 10 },
        { header: "مهر", key: "7", width: 12 },
        { header: "آبان", key: "8", width: 12 },
        { header: "آذر", key: "9", width: 12 },
        { header: "دی", key: "10", width: 12 },
        { header: "بهمن", key: "11", width: 12 },
        { header: "اسفند", key: "12", width: 12 },
        { header: "فروردین", key: "1", width: 12 },
        { header: "اردیبهشت", key: "2", width: 12 },
        { header: "خرداد", key: "3", width: 12 },
        { header: "تیر", key: "4", width: 12 },
        { header: "میانگین", key: "average", width: 15 },
      ];

      studentSheet.columns = columns;

      // Style header row
      const headerRow = studentSheet.getRow(3);
      headerRow.font = { bold: true, size: 12 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE7E6E6" },
      };

      // Add class info
      studentSheet.mergeCells("A2:N2");
      const classInfo = studentSheet.getCell("A2");
      classInfo.value = `کلاس: ${
        filteredClassDocuments.find(
          (doc) => doc.data.classCode === selectedClass
        )?.data.className
      } - سال تحصیلی: ${
        yearOptions.find((y) => y.value === selectedYear)?.label
      }`;
      classInfo.font = { italic: true, size: 10 };
      classInfo.alignment = { horizontal: "right" };

      // Add course data
      const coursesData = Object.entries(student.courses).map(
        ([, courseData]) => {
          const rowData: {
            courseName: string;
            teacherName: string;
            vahed: number;
            average: number | null;
            [key: string]: string | number | null;
          } = {
            courseName: courseData.courseName,
            teacherName: courseData.teacherName,
            vahed: courseData.vahed,
            average:
              courseData.yearAverage !== null
                ? Number(courseData.yearAverage.toFixed(2))
                : null,
          };

          // Add monthly grades
          for (let month = 1; month <= 12; month++) {
            const monthKey = month.toString();
            if (
              courseData.monthlyGrades &&
              monthKey in courseData.monthlyGrades
            ) {
              rowData[monthKey] =
                courseData.monthlyGrades[monthKey] !== null
                  ? Number(courseData.monthlyGrades[monthKey].toFixed(2))
                  : null;
            } else {
              rowData[monthKey] = null;
            }
          }

          return rowData;
        }
      );

      // Add rows to sheet
      studentSheet.addRows(coursesData);

      // Add weighted averages row
      const weightedAveragesRow: {
        courseName: string;
        teacherName: string;
        vahed: string;
        average?: number | null;
        [key: string]: string | number | null | undefined;
      } = {
        courseName: "میانگین کل (با احتساب واحد)",
        teacherName: "",
        vahed: "",
      };

      // Calculate monthly weighted averages
      for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString();

        // Calculate weighted average
        let totalWeight = 0;
        let weightedSum = 0;

        Object.values(student.courses).forEach((course) => {
          const monthGrade = course.monthlyGrades[monthKey];
          if (monthGrade !== null) {
            weightedSum += monthGrade * course.vahed;
            totalWeight += course.vahed;
          }
        });

        weightedAveragesRow[monthKey] =
          totalWeight > 0
            ? Number((weightedSum / totalWeight).toFixed(2))
            : null;
      }

      // Calculate overall weighted average
      weightedAveragesRow["average"] =
        student.weightedAverage !== null &&
        student.weightedAverage !== undefined
          ? Number(student.weightedAverage.toFixed(2))
          : null;

      // Add weighted averages row
      studentSheet.addRow(weightedAveragesRow);

      // Style the weighted averages row
      const lastRow = studentSheet.lastRow;
      if (lastRow) {
        lastRow.font = { bold: true };
        lastRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEEF3FD" },
        };
      }

      // Add formula explanation
      studentSheet.mergeCells(
        `A${studentSheet.rowCount + 2}:N${studentSheet.rowCount + 2}`
      );
      const formulaCell = studentSheet.getCell(`A${studentSheet.rowCount + 2}`);
      formulaCell.value =
        "فرمول محاسبه میانگین وزنی: مجموع (نمره × واحد) ÷ مجموع واحدها";
      formulaCell.font = {
        italic: true,
        size: 10,
        color: { argb: "FF555555" },
      };
      formulaCell.alignment = { horizontal: "right" };

      // Apply borders and styling
      studentSheet.eachRow((row, rowNum) => {
        if (rowNum >= 3) {
          // Skip title rows
          row.eachCell((cell, colNum) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };

            // Center align cells
            cell.alignment = { horizontal: "center", vertical: "middle" };

            // Color code grades (skip first 3 columns: courseName, teacherName, vahed)
            if (rowNum > 3 && colNum > 3) {
              const value = cell.value as number;

              if (value) {
                if (value >= 18) {
                  cell.font = { color: { argb: "FF008000" }, bold: true }; // Dark green
                } else if (value >= 15) {
                  cell.font = { color: { argb: "FF228B22" } }; // Green
                } else if (value >= 12) {
                  cell.font = { color: { argb: "FF0000FF" } }; // Blue
                } else if (value >= 10) {
                  cell.font = { color: { argb: "FFFF8C00" } }; // Orange
                } else {
                  cell.font = { color: { argb: "FFFF0000" } }; // Red
                }
              }
            }
          });
        }
      });
    }

    // Create summary sheet with filtered students
    const summarySheet = workbook.addWorksheet("خلاصه کارنامه");
    summarySheet.views = [{ rightToLeft: true }];

    // Add title
    summarySheet.mergeCells("A1:Z1");
    const summaryTitle = summarySheet.getCell("A1");
    summaryTitle.value = `خلاصه کارنامه کلاس ${
      filteredClassDocuments.find((doc) => doc.data.classCode === selectedClass)
        ?.data.className
    } - سال تحصیلی ${yearOptions.find((y) => y.value === selectedYear)?.label}`;
    summaryTitle.font = { size: 14, bold: true };
    summaryTitle.alignment = { horizontal: "center" };

    // Set up columns
    const summaryColumns = [
      { header: "کد دانش‌آموز", key: "studentCode", width: 15 },
      { header: "نام دانش‌آموز", key: "studentName", width: 25 },
    ];

    // Add a column for each course (from filtered students only)
    const allCourses = new Set<string>();
    studentsToExport.forEach((student) => {
      Object.values(student.courses).forEach((course) => {
        allCourses.add(course.courseName);
      });
    });

    const courseList = Array.from(allCourses);
    courseList.forEach((courseName) => {
      summaryColumns.push({
        header: courseName,
        key: courseName,
        width: 15,
      });
    });

    // Add overall average column
    summaryColumns.push({
      header: "میانگین کل (با احتساب واحد)",
      key: "weightedAverage",
      width: 20,
    });

    summarySheet.columns = summaryColumns;

    // Style header row
    const summaryHeaderRow = summarySheet.getRow(2);
    summaryHeaderRow.font = { bold: true, size: 12 };
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };

    // Add student data (filtered students only)
    const summaryData = studentsToExport.map((student) => {
      const rowData: Record<string, string | number | null> = {
        studentCode: student.studentCode,
        studentName: student.studentName,
      };

      // Add each course average
      courseList.forEach((courseName) => {
        const course = Object.values(student.courses).find(
          (c) => c.courseName === courseName
        );
        rowData[courseName] =
          course && course.yearAverage !== null
            ? Number(course.yearAverage.toFixed(2))
            : null;
      });

      // Add weighted average
      rowData.weightedAverage =
        student.weightedAverage !== null &&
        student.weightedAverage !== undefined
          ? Number(student.weightedAverage.toFixed(2))
          : null;

      return rowData;
    });

    // Sort by weighted average (descending)
    summaryData.sort((a, b) => {
      // Handle null values
      if (a.weightedAverage === null && b.weightedAverage === null) return 0;
      if (a.weightedAverage === null) return 1;
      if (b.weightedAverage === null) return -1;

      return (b.weightedAverage as number) - (a.weightedAverage as number);
    });

    // Add rows to sheet
    summarySheet.addRows(summaryData);

    // Add formula explanation
    summarySheet.mergeCells(
      `A${summarySheet.rowCount + 2}:${String.fromCharCode(
        65 + summaryColumns.length - 1
      )}${summarySheet.rowCount + 2}`
    );
    const formulaCell = summarySheet.getCell(`A${summarySheet.rowCount + 2}`);
    formulaCell.value =
      "فرمول محاسبه میانگین وزنی: مجموع (نمره × واحد) ÷ مجموع واحدها";
    formulaCell.font = { italic: true, size: 10, color: { argb: "FF555555" } };
    formulaCell.alignment = { horizontal: "right" };

    // Style the summary sheet
    summarySheet.eachRow((row, rowNum) => {
      if (rowNum >= 2) {
        // Skip title row
        row.eachCell((cell, colNum) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };

          // Center align cells
          cell.alignment = { horizontal: "center", vertical: "middle" };

          // Color code grades (skip first 2 columns: studentCode, studentName)
          if (rowNum > 2 && colNum > 2) {
            const value = cell.value as number;

            if (value) {
              if (value >= 18) {
                cell.font = { color: { argb: "FF008000" }, bold: true }; // Dark green
              } else if (value >= 15) {
                cell.font = { color: { argb: "FF228B22" } }; // Green
              } else if (value >= 12) {
                cell.font = { color: { argb: "FF0000FF" } }; // Blue
              } else if (value >= 10) {
                cell.font = { color: { argb: "FFFF8C00" } }; // Orange
              } else {
                cell.font = { color: { argb: "FFFF0000" } }; // Red
              }
            }
          }
        });
      }
    });

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Use FileSaver to save the Excel file
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `کارنامه_تحصیلی_${selectedClass}_${new Date()
        .toLocaleDateString("fa-IR")
        .replace(/\//g, "-")}.xlsx`
    );
  };

  // PrinterIcon component
  const PrinterIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-5 w-5"
    >
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  );

  // ExcelIcon component
  const ExcelIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-5 w-5"
    >
      <path d="M41,13H7V39H41V13Z" fill="#107C41" />
      <path
        d="M27.55,31.17l3.4-6,2,0-4.1,7.11-1.9,0-4.08-7.13,2,0Z"
        fill="#FFF"
      />
      <path
        d="M16.26,31.17l3.4-6,2,0L17.56,32.3l-1.9,0-4.08-7.13,2,0Z"
        fill="#FFF"
      />
    </svg>
  );

  // Calculate student rankings by month and course
  const calculateRankings = useCallback(() => {
    if (!studentReportCards.length) return {};

    const rankings: Record<string, Record<string, Record<string, number>>> = {};

    // Get all courseKeys
    const allCourseKeys = new Set<string>();
    studentReportCards.forEach((student) => {
      Object.keys(student.courses).forEach((courseKey) => {
        allCourseKeys.add(courseKey);
      });
    });

    // For each course and month, calculate rankings
    allCourseKeys.forEach((courseKey) => {
      rankings[courseKey] = {};

      // For each month
      for (let month = 1; month <= 12; month++) {
        const monthKey = month.toString();
        rankings[courseKey][monthKey] = {};

        // Get all grades for this course and month
        const grades = studentReportCards
          .map((student) => ({
            studentCode: student.studentCode,
            grade: student.courses[courseKey]?.monthlyGrades[monthKey] ?? null,
          }))
          .filter((item) => item.grade !== null)
          .sort((a, b) => (b.grade as number) - (a.grade as number));

        // Assign rankings
        grades.forEach((item, index) => {
          rankings[courseKey][monthKey][item.studentCode] = index + 1;
        });
      }
    });

    return rankings;
  }, [studentReportCards]);

  // Calculate progress percentages between months
  const calculateProgress = useCallback(
    (
      currentGrade: number | null,
      previousGrade: number | null
    ): number | null => {
      if (currentGrade === null || previousGrade === null) return null;
      if (previousGrade === 0) return null; // Avoid division by zero

      const progressPercent =
        ((currentGrade - previousGrade) / previousGrade) * 100;
      return Math.round(progressPercent * 10) / 10; // Round to 1 decimal place
    },
    []
  );

  // Get progress indicator color class
  const getProgressColorClass = useCallback(
    (progress: number | null): string => {
      if (progress === null) return "";
      if (progress > 5) return "progress-positive";
      if (progress > 0) return "progress-positive";
      if (progress === 0) return "progress-neutral";
      if (progress > -5) return "progress-negative";
      return "progress-negative";
    },
    []
  );

  // Get progress indicator symbol
  const getProgressSymbol = useCallback((progress: number | null): string => {
    if (progress === null) return "";
    if (progress > 0) return "↑";
    if (progress === 0) return "→";
    return "↓";
  }, []);

  // Combined compact presence and assessment info component
  const CompactInfoDisplay = ({
    presenceData,
    assessmentData,
    showPresence,
    showAssessments,
  }: {
    presenceData: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    >;
    assessmentData: Record<string, AssessmentEntry[]>;
    showPresence: boolean;
    showAssessments: boolean;
  }) => {
    // No data, return null
    if (
      (!showPresence && !showAssessments) ||
      (showPresence &&
        Object.values(presenceData).every((d) => d.total === 0) &&
        showAssessments &&
        Object.values(assessmentData).flatMap((a) => a).length === 0)
    ) {
      return null;
    }

    // Calculate presence totals across all months
    const totals = Object.values(presenceData).reduce(
      (acc, curr) => {
        acc.present += curr.present;
        acc.absent += curr.absent;
        acc.late += curr.late;
        acc.total += curr.total;
        return acc;
      },
      { present: 0, absent: 0, late: 0, total: 0 }
    );

    // Group assessments by title and get most recent
    const groupedAssessments: Record<string, AssessmentEntry> = {};
    if (showAssessments) {
      Object.values(assessmentData)
        .flat()
        .forEach((assessment) => {
          // If we don't have this title yet, or this one is more recent
          if (
            !groupedAssessments[assessment.title] ||
            new Date(assessment.date) >
              new Date(groupedAssessments[assessment.title].date)
          ) {
            groupedAssessments[assessment.title] = assessment;
          }
        });
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {showPresence && totals.total > 0 && (
          <div className="inline-flex items-center text-xs bg-gray-100 rounded p-1">
            <span className="presence-present mr-1">
              حاضر: {toPersianDigits(totals.present)}
              {totals.total > 0
                ? ` (${toPersianDigits(
                    Math.round((totals.present / totals.total) * 100)
                  )}٪)`
                : ""}
            </span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="presence-absent mr-1">
              غایب: {toPersianDigits(totals.absent)}
              {totals.total > 0
                ? ` (${toPersianDigits(
                    Math.round((totals.absent / totals.total) * 100)
                  )}٪)`
                : ""}
            </span>
            <span className="text-gray-300 mx-1">|</span>
            <span className="presence-late">
              تأخیر: {toPersianDigits(totals.late)}
              {totals.total > 0
                ? ` (${toPersianDigits(
                    Math.round((totals.late / totals.total) * 100)
                  )}٪)`
                : ""}
            </span>
          </div>
        )}

        {showAssessments && Object.keys(groupedAssessments).length > 0 && (
          <div className="inline-flex flex-wrap gap-1 text-xs">
            {Object.entries(groupedAssessments).map(([title, assessment]) => (
              <div
                key={title}
                className="bg-gray-100 rounded p-1 flex items-center"
              >
                <span className="font-medium">{title}: </span>
                <span
                  className={`ml-1 assessment-value text-[0.65rem] ${getAssessmentValueClass(
                    assessment.value
                  )}`}
                >
                  {assessment.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Add the new checkbox to the options section in the filter card
  const OverallStatistics = ({ student }: { student: StudentReportCard }) => {
    // Calculate overall presence statistics across all courses
    const overallPresence = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0,
    };

    // Calculate assessment statistics (count of each type of assessment)
    const assessmentCounts: Record<string, number> = {};

    // Calculate monthly average trends
    const monthlyAverages: Record<
      string,
      { sum: number; count: number; avg: number | null }
    > = {};
    for (let i = 1; i <= 12; i++) {
      monthlyAverages[i.toString()] = { sum: 0, count: 0, avg: null };
    }

    // Calculate subject performance data
    const subjectPerformance: {
      best: { subject: string; avg: number } | null;
      worst: { subject: string; avg: number } | null;
      mostImproved: { subject: string; improvement: number } | null;
    } = {
      best: null,
      worst: null,
      mostImproved: null,
    };

    // Collect all data from courses
    Object.entries(student.courses).forEach(([, courseData]) => {
      // Collect presence data
      Object.values(courseData.monthlyPresence).forEach((monthData) => {
        overallPresence.present += monthData.present;
        overallPresence.absent += monthData.absent;
        overallPresence.late += monthData.late;
        overallPresence.total += monthData.total;
      });

      // Collect assessment data
      Object.values(courseData.monthlyAssessments)
        .flat()
        .forEach((assessment) => {
          assessmentCounts[assessment.value] =
            (assessmentCounts[assessment.value] || 0) + 1;
        });

      // Collect monthly averages
      Object.entries(courseData.monthlyGrades).forEach(([month, grade]) => {
        if (grade !== null) {
          monthlyAverages[month].sum += grade;
          monthlyAverages[month].count += 1;
        }
      });

      // Store subject performance
      if (courseData.yearAverage !== null) {
        // Check if this is the best subject
        if (
          !subjectPerformance.best ||
          courseData.yearAverage > subjectPerformance.best.avg
        ) {
          subjectPerformance.best = {
            subject: courseData.courseName,
            avg: courseData.yearAverage,
          };
        }

        // Check if this is the worst subject
        if (
          !subjectPerformance.worst ||
          courseData.yearAverage < subjectPerformance.worst.avg
        ) {
          subjectPerformance.worst = {
            subject: courseData.courseName,
            avg: courseData.yearAverage,
          };
        }

        // Calculate improvement (from first month with data to last month with data)
        const monthsWithGrades = Object.entries(courseData.monthlyGrades)
          .filter(([, grade]) => grade !== null)
          .map(([month]) => parseInt(month))
          .sort((a, b) => a - b);

        if (monthsWithGrades.length >= 2) {
          const firstMonth = monthsWithGrades[0].toString();
          const lastMonth =
            monthsWithGrades[monthsWithGrades.length - 1].toString();

          const firstGrade = courseData.monthlyGrades[firstMonth];
          const lastGrade = courseData.monthlyGrades[lastMonth];

          if (firstGrade !== null && lastGrade !== null) {
            const improvement = lastGrade - firstGrade;

            if (
              !subjectPerformance.mostImproved ||
              improvement > subjectPerformance.mostImproved.improvement
            ) {
              subjectPerformance.mostImproved = {
                subject: courseData.courseName,
                improvement,
              };
            }
          }
        }
      }
    });

    // Calculate final monthly averages
    Object.keys(monthlyAverages).forEach((month) => {
      if (monthlyAverages[month].count > 0) {
        monthlyAverages[month].avg =
          monthlyAverages[month].sum / monthlyAverages[month].count;
      }
    });

    // Convert assessment counts to percentages
    const totalAssessments = Object.values(assessmentCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    const assessmentPercentages: Record<
      string,
      { count: number; percentage: number }
    > = {};

    Object.entries(assessmentCounts).forEach(([value, count]) => {
      assessmentPercentages[value] = {
        count,
        percentage: totalAssessments > 0 ? (count / totalAssessments) * 100 : 0,
      };
    });

    // No data available
    if (
      overallPresence.total === 0 &&
      totalAssessments === 0 &&
      !subjectPerformance.best &&
      Object.values(monthlyAverages).every((m) => m.avg === null)
    ) {
      return (
        <div className="text-center text-gray-500 py-4">
          آمار کافی برای نمایش وجود ندارد.
        </div>
      );
    }

    return (
      <div className="mt-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        <h4 className="text-lg font-bold border-b border-gray-200 pb-2 mb-4">
          آمار کلی عملکرد دانش‌آموز
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Presence Statistics */}
          {overallPresence.total > 0 && (
            <div className="border rounded-md p-3 bg-white shadow-sm">
              <h5 className="font-semibold border-b pb-1 mb-2">
                وضعیت حضور و غیاب
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>حاضر:</span>
                  <span className="text-green-600 font-medium">
                    {toPersianDigits(overallPresence.present)} (
                    {toPersianDigits(
                      Math.round(
                        (overallPresence.present / overallPresence.total) * 100
                      )
                    )}
                    %)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>غایب:</span>
                  <span className="text-red-600 font-medium">
                    {toPersianDigits(overallPresence.absent)} (
                    {toPersianDigits(
                      Math.round(
                        (overallPresence.absent / overallPresence.total) * 100
                      )
                    )}
                    %)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>با تأخیر:</span>
                  <span className="text-amber-600 font-medium">
                    {toPersianDigits(overallPresence.late)} (
                    {toPersianDigits(
                      Math.round(
                        (overallPresence.late / overallPresence.total) * 100
                      )
                    )}
                    %)
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span>مجموع جلسات:</span>
                  <span className="font-medium">
                    {toPersianDigits(overallPresence.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Statistics */}
          {totalAssessments > 0 && (
            <div className="border rounded-md p-3 bg-white shadow-sm">
              <h5 className="font-semibold border-b pb-1 mb-2">
                ارزیابی‌های کیفی
              </h5>
              <div className="space-y-2">
                {Object.entries(assessmentPercentages).map(([value, data]) => (
                  <div key={value} className="flex justify-between">
                    <span>
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-1 ${getAssessmentValueClass(
                          value
                        )}`}
                      ></span>
                      {value}:
                    </span>
                    <span className="font-medium">
                      {toPersianDigits(data.count)} (
                      {toPersianDigits(Math.round(data.percentage))}%)
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-gray-100">
                  <span>مجموع ارزیابی‌ها:</span>
                  <span className="font-medium">
                    {toPersianDigits(totalAssessments)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Subject Performance */}
          {(subjectPerformance.best ||
            subjectPerformance.worst ||
            subjectPerformance.mostImproved) && (
            <div className="border rounded-md p-3 bg-white shadow-sm">
              <h5 className="font-semibold border-b pb-1 mb-2">
                عملکرد در دروس
              </h5>
              <div className="space-y-2">
                {subjectPerformance.best && (
                  <div className="flex justify-between">
                    <span>بهترین درس:</span>
                    <span className="text-emerald-600 font-medium">
                      {subjectPerformance.best.subject} (
                      {toPersianDigits(subjectPerformance.best.avg.toFixed(2))})
                    </span>
                  </div>
                )}

                {subjectPerformance.worst && (
                  <div className="flex justify-between">
                    <span>ضعیف‌ترین درس:</span>
                    <span className="text-red-600 font-medium">
                      {subjectPerformance.worst.subject} (
                      {toPersianDigits(subjectPerformance.worst.avg.toFixed(2))}
                      )
                    </span>
                  </div>
                )}

                {subjectPerformance.mostImproved && (
                  <div className="flex justify-between">
                    <span>بیشترین پیشرفت:</span>
                    <span
                      className={
                        subjectPerformance.mostImproved.improvement > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {subjectPerformance.mostImproved.subject} (
                      {toPersianDigits(
                        (subjectPerformance.mostImproved.improvement > 0
                          ? "+"
                          : "") +
                          subjectPerformance.mostImproved.improvement.toFixed(2)
                      )}
                      )
                    </span>
                  </div>
                )}

                {student.weightedAverage !== undefined &&
                  student.weightedAverage !== null && (
                    <div className="flex justify-between pt-1 border-t border-gray-100">
                      <span>میانگین کل:</span>
                      <span
                        className={`font-medium ${getScoreColorClass(
                          student.weightedAverage
                        )}`}
                      >
                        {toPersianDigits(student.weightedAverage.toFixed(2))}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          <div className="border rounded-md p-3 bg-white shadow-sm md:col-span-2 lg:col-span-3">
            <h5 className="font-semibold border-b pb-1 mb-2">
              روند پیشرفت ماهانه
            </h5>
            {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4].some(
              (m) => monthlyAverages[m.toString()].avg !== null
            ) ? (
              <div className="flex items-end justify-between h-32 px-2 relative mt-4">
                {/* Background grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="border-t border-gray-100 w-full h-0"
                    />
                  ))}
                </div>

                {/* Y-axis labels */}
                <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[9px] text-gray-400 pointer-events-none">
                  <div className="-translate-y-2">۲۰</div>
                  <div>۱۵</div>
                  <div>۱۰</div>
                  <div>۵</div>
                  <div className="translate-y-2">۰</div>
                </div>

                <div className="w-full flex items-end justify-between pl-6">
                  {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4].map((monthNum) => {
                    const month = monthNum.toString();
                    const monthNames = [
                      "فروردین",
                      "اردیبهشت",
                      "خرداد",
                      "تیر",
                      "مرداد",
                      "شهریور",
                      "مهر",
                      "آبان",
                      "آذر",
                      "دی",
                      "بهمن",
                      "اسفند",
                    ];
                    const data = monthlyAverages[month];
                    const avg = data?.avg;

                    // Calculate height based on average (or 0 if no data)
                    const height =
                      avg !== null && avg !== undefined
                        ? Math.max(4, Math.min(100, (avg / 20) * 100)) // Scale to percentage, min 4% height
                        : 0; // No bar if no data

                    return (
                      <div
                        key={month}
                        className="flex flex-col items-center group"
                      >
                        {avg !== null && avg !== undefined ? (
                          <div className="relative">
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              {monthNames[parseInt(month) - 1]}:{" "}
                              {toPersianDigits(avg.toFixed(2))}
                            </div>
                            <div
                              className={`w-4 rounded-t ${getScoreBarColor(
                                avg
                              )}`}
                              style={{ height: `${height}%` }}
                            ></div>
                          </div>
                        ) : (
                          <div className="w-4 h-1 bg-gray-200 rounded-t opacity-50"></div>
                        )}
                        <div className="text-xs mt-1 text-gray-600">
                          {monthNames[parseInt(month) - 1].substring(0, 3)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get bar color
  const getScoreBarColor = (score: number): string => {
    if (score >= 18) return "bg-emerald-500";
    if (score >= 15) return "bg-green-500";
    if (score >= 12) return "bg-blue-500";
    if (score >= 10) return "bg-amber-400";
    return "bg-red-500";
  };

  // Modify the add student options function to disable selection for students
  const getStudentOptions = () => {
    // If user is a student, they shouldn't be able to select other students
    if (user?.userType === "student") {
      return [];
    }

    if (!selectedClass) return [];

    const classData = filteredClassDocuments.find(
      (doc) => doc.data.classCode === selectedClass
    )?.data;

    if (!classData) return [];

    // Create options for dropdown with "all" as first option
    const options = [
      { value: "all", label: "همه دانش‌آموزان" },
      ...classData.students?.map((student) => ({
        value: student.studentCode,
        label: `${student.studentName} ${student.studentlname}`,
      })),
    ];

    return options;
  };

  // Update useEffect to reset selected student when class changes
  useEffect(() => {
    setSelectedStudent("all");
  }, [selectedClass]);

  // Add a function to calculate overall class ranking for a student
  const calculateOverallRanking = (studentCode: string): number | null => {
    // Get all students with valid weighted averages
    const rankings = studentReportCards
      .filter(
        (student) =>
          student.weightedAverage !== null &&
          student.weightedAverage !== undefined
      )
      .sort((a, b) => {
        // Safe comparison with fallback to 0
        const avgA = a.weightedAverage ?? 0;
        const avgB = b.weightedAverage ?? 0;
        return avgB - avgA;
      })
      .map((student) => student.studentCode);

    // Find the position of the student
    const position = rankings.indexOf(studentCode);
    return position !== -1 ? position + 1 : null;
  };

  // Update useEffect to set all display options to checked for students
  useEffect(() => {
    if (authLoading) return;

    if (user?.userType === "student") {
      setShowProgress(true);
      setShowRanking(true);
      setShowPresence(true);
      setShowAssessments(true);
      setShowOverallStats(true);
    }
  }, [user, authLoading]);

  // Function to generate tooltip content for a grade
  const generateGradeTooltip = useCallback(
    (
      courseCode: string,
      monthKey: string,
      grade: number | null,
      assessments: AssessmentEntry[]
    ) => {
      if (grade === null) return "نمره‌ای ثبت نشده است";

      // Get course-specific assessment values if available
      const courseValues = assessmentValues[courseCode] || {};

      // Calculate base grade before assessments
      let baseGrade = grade;
      let adjustmentTotal = 0;

      // Calculate total assessment adjustments that were applied
      if (assessments && assessments.length > 0) {
        assessments.forEach((assessment) => {
          const adjustment =
            courseValues[assessment.value] !== undefined
              ? courseValues[assessment.value]
              : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

          adjustmentTotal += adjustment;
        });

        // Recalculate base grade
        baseGrade = grade - adjustmentTotal;
        // Handle edge cases to prevent negative base grades
        baseGrade = Math.max(0, baseGrade);
      }

      let tooltip = `فرمول محاسبه نمره:\n`;
      tooltip += `نمره اصلی: ${toPersianDigits(baseGrade.toFixed(2))}\n`;

      if (assessments && assessments.length > 0) {
        tooltip += `\nتعدیل‌های کیفی:\n`;
        assessments.forEach((assessment) => {
          const adjustment =
            courseValues[assessment.value] !== undefined
              ? courseValues[assessment.value]
              : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

          tooltip += `${assessment.title} (${assessment.value}): ${
            adjustment >= 0 ? "+" : ""
          }${toPersianDigits(adjustment)}\n`;
        });

        tooltip += `\nمجموع تعدیل‌ها: ${
          adjustmentTotal >= 0 ? "+" : ""
        }${toPersianDigits(adjustmentTotal)}\n`;
        tooltip += `نتیجه نهایی: ${toPersianDigits(baseGrade.toFixed(2))} ${
          adjustmentTotal >= 0 ? "+" : ""
        }${toPersianDigits(adjustmentTotal)} = ${toPersianDigits(
          grade.toFixed(2)
        )}`;
      }

      return tooltip;
    },
    [assessmentValues]
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles + customStyles }} />
      <div className={`space-y-6 ${isPrinting ? "printing" : ""}`} dir="rtl">
        <Card className="print:hidden filter-card shadow-sm">
          <CardHeader className="pb-2">
            {/* <CardTitle className="text-xl text-gray-800">
              تنظیمات نمایش
            </CardTitle> */}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label
                  htmlFor="class-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  کلاس
                </Label>
                <Select
                  value={selectedClass}
                  onValueChange={setSelectedClass}
                  disabled={user?.userType === "student"}
                >
                  <SelectTrigger
                    id="class-select"
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show student selection dropdown only if not a student user */}
              {selectedClass && user?.userType !== "student" && (
                <div>
                  <Label
                    htmlFor="student-select"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    دانش‌آموز
                  </Label>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                  >
                    <SelectTrigger
                      id="student-select"
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <SelectValue placeholder="انتخاب دانش‌آموز" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStudentOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label
                  htmlFor="year-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  سال تحصیلی
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger
                    id="year-select"
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <SelectValue placeholder="انتخاب سال" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enhanced horizontal checkboxes */}
            <div className="mt-6">
              <Label className="block text-sm font-medium text-gray-700 mb-3">
                گزینه‌های نمایش
              </Label>
              <div className="flex flex-wrap gap-3 items-center">
                <div
                  className={`rounded-lg border border-gray-200 p-3 cursor-pointer transition-all ${
                    showProgress
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setShowProgress(!showProgress)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        showProgress
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {showProgress && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${
                        showProgress
                          ? "text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      درصد پیشرفت
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg border border-gray-200 p-3 cursor-pointer transition-all ${
                    showRanking
                      ? "bg-purple-50 border-purple-200 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setShowRanking(!showRanking)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        showRanking
                          ? "bg-purple-500 border-purple-500"
                          : "border-gray-300"
                      }`}
                    >
                      {showRanking && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${
                        showRanking
                          ? "text-purple-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      نمایش رتبه
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg border border-gray-200 p-3 cursor-pointer transition-all ${
                    showPresence
                      ? "bg-green-50 border-green-200 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setShowPresence(!showPresence)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        showPresence
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {showPresence && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${
                        showPresence
                          ? "text-green-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      حضور و غیاب
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg border border-gray-200 p-3 cursor-pointer transition-all ${
                    showAssessments
                      ? "bg-amber-50 border-amber-200 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setShowAssessments(!showAssessments)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        showAssessments
                          ? "bg-amber-500 border-amber-500"
                          : "border-gray-300"
                      }`}
                    >
                      {showAssessments && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${
                        showAssessments
                          ? "text-amber-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      جدول ارزیابی‌ها
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-lg border border-gray-200 p-3 cursor-pointer transition-all ${
                    showOverallStats
                      ? "bg-indigo-50 border-indigo-200 shadow-sm"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => setShowOverallStats(!showOverallStats)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        showOverallStats
                          ? "bg-indigo-500 border-indigo-500"
                          : "border-gray-300"
                      }`}
                    >
                      {showOverallStats && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`${
                        showOverallStats
                          ? "text-indigo-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      آمار کلی
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : selectedClass && selectedYear ? (
          <Card className="shadow-md">
            <CardHeader className="pb-2 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-gray-800">
                  کارنامه تحصیلی -{" "}
                  {selectedClass &&
                    filteredClassDocuments.find(
                      (doc) => doc.data.classCode === selectedClass
                    )?.data.className}{" "}
                  - سال تحصیلی{" "}
                  {selectedYear &&
                    yearOptions.find((y) => y.value === selectedYear)?.label}
                </CardTitle>
                <div className="action-buttons">
                  <button
                    onClick={exportToExcel}
                    className="print:hidden action-button excel-button"
                  >
                    <ExcelIcon />
                    خروجی اکسل
                  </button>
                  <button
                    onClick={handlePrint}
                    className="print:hidden action-button print-button"
                  >
                    <PrinterIcon />
                    نسخه قابل چاپ
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {studentReportCards.length > 0 ? (
                <div className="space-y-8">
                  {(() => {
                    // Calculate rankings once
                    const rankings = showRanking ? calculateRankings() : {};

                    // Filter students based on selection
                    const filteredStudents =
                      selectedStudent === "all"
                        ? studentReportCards
                        : studentReportCards.filter(
                            (student) => student.studentCode === selectedStudent
                          );

                    return filteredStudents.map((student) => (
                      <div
                        key={student.studentCode}
                        className="mb-8 p-2 border border-gray-200 rounded-md report-card-wrapper bg-white print:page-break-before-always"
                      >
                        <div className="student-name">
                          <div>
                            <div className="student-name-text">
                              {student.studentName}
                              <span className="student-code mr-2">
                                کد: {toPersianDigits(student.studentCode)}
                              </span>
                            </div>
                            <div className="student-details">
                              <div className="student-detail-item">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span>
                                  کلاس:{" "}
                                  {
                                    filteredClassDocuments.find(
                                      (doc) =>
                                        doc.data.classCode === selectedClass
                                    )?.data.className
                                  }
                                </span>
                              </div>
                              <div className="student-detail-item">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="18"
                                    rx="2"
                                    ry="2"
                                  ></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                <span>
                                  سال تحصیلی:{" "}
                                  {
                                    yearOptions.find(
                                      (y) => y.value === selectedYear
                                    )?.label
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="hidden md:block header-stats">
                            {student.weightedAverage !== null &&
                              student.weightedAverage !== undefined && (
                                <div
                                  className="text-white text-center rounded-full bg-white/20 px-3 py-1"
                                  title={formatWeightedAverageTooltip(
                                    student.weightedGradesInfo
                                  )}
                                >
                                  <div className="text-sm">معدل کل</div>
                                  <div className="text-xl font-bold">
                                    {toPersianDigits(
                                      student.weightedAverage.toFixed(2)
                                    )}
                                  </div>
                                  {showRanking && (
                                    <div className="rank-badge">
                                      رتبه کل:{" "}
                                      {toPersianDigits(
                                        calculateOverallRanking(
                                          student.studentCode
                                        ) || 0
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table className="w-full border-collapse">
                            <TableHeader>
                              <TableRow>
                                <TableHead className="custom-header-cell subject-cell">
                                  نام درس
                                </TableHead>
                                <TableHead className="custom-header-cell teacher-cell">
                                  معلم
                                </TableHead>
                                {/* Months 7-12 (First half of school year) */}
                                {[
                                  {
                                    num: 7,
                                    persian: "مهر",
                                    gregorian: "Sep/Oct",
                                  },
                                  {
                                    num: 8,
                                    persian: "آبان",
                                    gregorian: "Oct/Nov",
                                  },
                                  {
                                    num: 9,
                                    persian: "آذر",
                                    gregorian: "Nov/Dec",
                                  },
                                  {
                                    num: 10,
                                    persian: "دی",
                                    gregorian: "Dec/Jan",
                                  },
                                  {
                                    num: 11,
                                    persian: "بهمن",
                                    gregorian: "Jan/Feb",
                                  },
                                  {
                                    num: 12,
                                    persian: "اسفند",
                                    gregorian: "Feb/Mar",
                                  },
                                ].map((month) => (
                                  <TableHead
                                    key={`month-head-${month.num}`}
                                    className="custom-header-cell text-center month-header"
                                  >
                                    <span className="month-name">
                                      {month.persian}
                                    </span>
                                    <span className="month-gregorian">
                                      {month.gregorian}
                                    </span>
                                  </TableHead>
                                ))}
                                {/* Months 1-4 (Second half of school year) */}
                                {[
                                  {
                                    num: 1,
                                    persian: "فروردین",
                                    gregorian: "Mar/Apr",
                                  },
                                  {
                                    num: 2,
                                    persian: "اردیبهشت",
                                    gregorian: "Apr/May",
                                  },
                                  {
                                    num: 3,
                                    persian: "خرداد",
                                    gregorian: "May/Jun",
                                  },
                                  {
                                    num: 4,
                                    persian: "تیر",
                                    gregorian: "Jun/Jul",
                                  },
                                ].map((month) => (
                                  <TableHead
                                    key={`month-head-${month.num}`}
                                    className="custom-header-cell text-center month-header"
                                  >
                                    <span className="month-name">
                                      {month.persian}
                                    </span>
                                    <span className="month-gregorian">
                                      {month.gregorian}
                                    </span>
                                  </TableHead>
                                ))}
                                <TableHead className="custom-header-cell text-center">
                                  میانگین کل
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(student.courses).map(
                                ([courseCode, courseData]) => {
                                  // Calculate course ranking among all students
                                  let courseRanking: number | null = null;

                                  if (
                                    showRanking &&
                                    courseData.yearAverage !== null
                                  ) {
                                    // Get all students' year averages for this course
                                    const courseAverages = studentReportCards
                                      .map((otherStudent) => {
                                        const otherCourseData =
                                          otherStudent.courses[courseCode];
                                        return {
                                          studentCode: otherStudent.studentCode,
                                          average:
                                            otherCourseData?.yearAverage ??
                                            null,
                                        };
                                      })
                                      .filter((item) => item.average !== null)
                                      .sort(
                                        (a, b) =>
                                          (b.average as number) -
                                          (a.average as number)
                                      );

                                    // Find this student's position
                                    const position = courseAverages.findIndex(
                                      (item) =>
                                        item.studentCode === student.studentCode
                                    );

                                    if (position !== -1) {
                                      courseRanking = position + 1;
                                    }
                                  }

                                  return (
                                    <React.Fragment key={courseCode}>
                                      <TableRow className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium subject-cell border-r whitespace-nowrap">
                                          {courseData.courseName}
                                        </TableCell>
                                        <TableCell className="teacher-cell border-r whitespace-nowrap">
                                          {courseData.teacherName}
                                        </TableCell>
                                        {/* Months 7-12 (First half of school year) */}
                                        {[7, 8, 9, 10, 11, 12].map(
                                          (month, index) => (
                                            <TableCell
                                              key={`month-${month}`}
                                              className={`text-center border-r px-2 py-3 ${getScoreColorClass(
                                                courseData.monthlyGrades[
                                                  month.toString()
                                                ]
                                              )}`}
                                            >
                                              {courseData.monthlyGrades[
                                                month.toString()
                                              ] !== null ? (
                                                <div
                                                  className="grade-container"
                                                  title={generateGradeTooltip(
                                                    courseCode,
                                                    month.toString(),
                                                    courseData.monthlyGrades[
                                                      month.toString()
                                                    ],
                                                    courseData
                                                      .monthlyAssessments[
                                                      month.toString()
                                                    ]
                                                  )}
                                                >
                                                  <div className="grade-value">
                                                    {toPersianDigits(
                                                      courseData.monthlyGrades[
                                                        month.toString()
                                                      ]?.toFixed(2) || ""
                                                    )}
                                                  </div>

                                                  {/* Progress percentage */}
                                                  {showProgress &&
                                                    index > 0 && (
                                                      <div
                                                        className={
                                                          getProgressColorClass(
                                                            calculateProgress(
                                                              courseData
                                                                .monthlyGrades[
                                                                month.toString()
                                                              ],
                                                              courseData
                                                                .monthlyGrades[
                                                                (
                                                                  month - 1
                                                                ).toString()
                                                              ] ||
                                                                (month === 7
                                                                  ? null
                                                                  : courseData
                                                                      .monthlyGrades[
                                                                      "6"
                                                                    ])
                                                            )
                                                          ) +
                                                          " progress-indicator"
                                                        }
                                                      >
                                                        {(() => {
                                                          const prevMonth =
                                                            month === 7
                                                              ? 6
                                                              : month - 1;
                                                          const progress =
                                                            calculateProgress(
                                                              courseData
                                                                .monthlyGrades[
                                                                month.toString()
                                                              ],
                                                              courseData
                                                                .monthlyGrades[
                                                                prevMonth.toString()
                                                              ]
                                                            );

                                                          if (progress === null)
                                                            return null;

                                                          return (
                                                            <>
                                                              {getProgressSymbol(
                                                                progress
                                                              )}{" "}
                                                              {toPersianDigits(
                                                                Math.abs(
                                                                  progress
                                                                ).toFixed(1)
                                                              )}
                                                              %
                                                            </>
                                                          );
                                                        })()}
                                                      </div>
                                                    )}

                                                  {/* Ranking */}
                                                  {showRanking &&
                                                    rankings[courseCode]?.[
                                                      month.toString()
                                                    ]?.[
                                                      student.studentCode
                                                    ] && (
                                                      <div className="rank-indicator">
                                                        رتبه:{" "}
                                                        {toPersianDigits(
                                                          rankings[courseCode][
                                                            month.toString()
                                                          ][student.studentCode]
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                              ) : (
                                                "—"
                                              )}
                                            </TableCell>
                                          )
                                        )}

                                        {/* Months 1-4 (Second half of school year) */}
                                        {[1, 2, 3, 4].map((month) => (
                                          <TableCell
                                            key={`month-${month}`}
                                            className={`text-center border-r px-2 py-3 ${getScoreColorClass(
                                              courseData.monthlyGrades[
                                                month.toString()
                                              ]
                                            )}`}
                                          >
                                            {courseData.monthlyGrades[
                                              month.toString()
                                            ] !== null ? (
                                              <div
                                                className="grade-container"
                                                title={generateGradeTooltip(
                                                  courseCode,
                                                  month.toString(),
                                                  courseData.monthlyGrades[
                                                    month.toString()
                                                  ],
                                                  courseData.monthlyAssessments[
                                                    month.toString()
                                                  ]
                                                )}
                                              >
                                                <div className="grade-value">
                                                  {toPersianDigits(
                                                    courseData.monthlyGrades[
                                                      month.toString()
                                                    ]?.toFixed(2) || ""
                                                  )}
                                                </div>

                                                {/* Progress percentage */}
                                                {showProgress && (
                                                  <div
                                                    className={
                                                      getProgressColorClass(
                                                        calculateProgress(
                                                          courseData
                                                            .monthlyGrades[
                                                            month.toString()
                                                          ],
                                                          month === 1
                                                            ? courseData
                                                                .monthlyGrades[
                                                                "12"
                                                              ]
                                                            : courseData
                                                                .monthlyGrades[
                                                                (
                                                                  month - 1
                                                                ).toString()
                                                              ]
                                                        )
                                                      ) + " progress-indicator"
                                                    }
                                                  >
                                                    {(() => {
                                                      const prevMonth =
                                                        month === 1
                                                          ? 12
                                                          : month - 1;
                                                      const progress =
                                                        calculateProgress(
                                                          courseData
                                                            .monthlyGrades[
                                                            month.toString()
                                                          ],
                                                          courseData
                                                            .monthlyGrades[
                                                            prevMonth.toString()
                                                          ]
                                                        );

                                                      if (progress === null)
                                                        return null;

                                                      return (
                                                        <>
                                                          {getProgressSymbol(
                                                            progress
                                                          )}{" "}
                                                          {toPersianDigits(
                                                            Math.abs(
                                                              progress
                                                            ).toFixed(1)
                                                          )}
                                                          %
                                                        </>
                                                      );
                                                    })()}
                                                  </div>
                                                )}

                                                {/* Ranking */}
                                                {showRanking &&
                                                  rankings[courseCode]?.[
                                                    month.toString()
                                                  ]?.[student.studentCode] && (
                                                    <div className="rank-indicator">
                                                      رتبه:{" "}
                                                      {toPersianDigits(
                                                        rankings[courseCode][
                                                          month.toString()
                                                        ][student.studentCode]
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            ) : (
                                              "—"
                                            )}
                                          </TableCell>
                                        ))}

                                        {/* Year Average */}
                                        <TableCell
                                          className={`font-bold text-center border-r px-3 py-3 ${getScoreColorClass(
                                            courseData.yearAverage
                                          )}`}
                                        >
                                          <div
                                            className="grade-container"
                                            title={
                                              courseData.yearAverage !== null
                                                ? `میانگین نمرات ماهانه\n${Object.entries(
                                                    courseData.monthlyGrades
                                                  )
                                                    .filter(
                                                      ([, grade]) =>
                                                        grade !== null
                                                    )
                                                    .map(([month, grade]) => {
                                                      const monthNames = [
                                                        "فروردین",
                                                        "اردیبهشت",
                                                        "خرداد",
                                                        "تیر",
                                                        "مرداد",
                                                        "شهریور",
                                                        "مهر",
                                                        "آبان",
                                                        "آذر",
                                                        "دی",
                                                        "بهمن",
                                                        "اسفند",
                                                      ];
                                                      const monthIndex =
                                                        parseInt(month) - 1;
                                                      return `${
                                                        monthNames[monthIndex]
                                                      }: ${toPersianDigits(
                                                        grade?.toFixed(2) || ""
                                                      )}`;
                                                    })
                                                    .join("\n")}`
                                                : "نمره‌ای ثبت نشده است"
                                            }
                                          >
                                            <div className="grade-value">
                                              {courseData.yearAverage !== null
                                                ? toPersianDigits(
                                                    courseData.yearAverage.toFixed(
                                                      2
                                                    )
                                                  )
                                                : "—"}
                                            </div>
                                            {/* Show ranking for yearly course average */}
                                            {showRanking &&
                                              courseRanking !== null && (
                                                <div className="rank-indicator">
                                                  رتبه:{" "}
                                                  {toPersianDigits(
                                                    courseRanking
                                                  )}
                                                </div>
                                              )}
                                          </div>
                                        </TableCell>
                                      </TableRow>

                                      {/* Add the compact info display row if needed */}
                                      {(showPresence || showAssessments) && (
                                        <TableRow className="border-b">
                                          <TableCell
                                            colSpan={14}
                                            className="px-2 py-0.5 border-r"
                                          >
                                            <CompactInfoDisplay
                                              presenceData={
                                                courseData.monthlyPresence
                                              }
                                              assessmentData={
                                                courseData.monthlyAssessments
                                              }
                                              showPresence={showPresence}
                                              showAssessments={showAssessments}
                                            />
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  );
                                }
                              )}

                              {/* Final row with overall average */}
                              <TableRow className="average-row border-t-2 border-indigo-100">
                                <TableCell
                                  colSpan={2}
                                  className="font-bold subject-cell border-r"
                                >
                                  میانگین کل (با احتساب واحد)
                                </TableCell>
                                {/* Calculate average for each month across all courses */}
                                {[7, 8, 9, 10, 11, 12, 1, 2, 3, 4].map(
                                  (month) => {
                                    const monthKey = month.toString();

                                    // Calculate weighted average by course vahed
                                    let totalWeight = 0;
                                    let weightedSum = 0;

                                    Object.values(student.courses).forEach(
                                      (course) => {
                                        const grade =
                                          course.monthlyGrades[monthKey];
                                        const vahed = course.vahed || 1;

                                        if (grade !== null) {
                                          weightedSum += grade * vahed;
                                          totalWeight += vahed;
                                        }
                                      }
                                    );

                                    const weightedAvg =
                                      totalWeight > 0
                                        ? weightedSum / totalWeight
                                        : null;

                                    // Calculate previous month for progress indicators
                                    let prevMonthKey: string;
                                    if (month === 7) {
                                      prevMonthKey = "6"; // Shahrivar
                                    } else if (month === 1) {
                                      prevMonthKey = "12"; // Esfand to Farvardin transition
                                    } else {
                                      prevMonthKey = (month - 1).toString();
                                    }

                                    // Calculate previous month weighted average
                                    let prevTotalWeight = 0;
                                    let prevWeightedSum = 0;

                                    Object.values(student.courses).forEach(
                                      (course) => {
                                        const grade =
                                          course.monthlyGrades[prevMonthKey];
                                        const vahed = course.vahed || 1;

                                        if (grade !== null) {
                                          prevWeightedSum += grade * vahed;
                                          prevTotalWeight += vahed;
                                        }
                                      }
                                    );

                                    const prevWeightedAvg =
                                      prevTotalWeight > 0
                                        ? prevWeightedSum / prevTotalWeight
                                        : null;

                                    // Calculate progress percentage
                                    const progress =
                                      weightedAvg !== null &&
                                      prevWeightedAvg !== null
                                        ? ((weightedAvg - prevWeightedAvg) /
                                            prevWeightedAvg) *
                                          100
                                        : null;

                                    // Find class position for this student (class ranking)
                                    let classRanking: number | null = null;

                                    if (weightedAvg !== null) {
                                      // Get all other students' averages for this month
                                      const monthlyAverages = studentReportCards
                                        .map((otherStudent) => {
                                          let otherTotalWeight = 0;
                                          let otherWeightedSum = 0;

                                          Object.values(
                                            otherStudent.courses
                                          ).forEach((course) => {
                                            const grade =
                                              course.monthlyGrades[monthKey];
                                            const vahed = course.vahed || 1;

                                            if (grade !== null) {
                                              otherWeightedSum += grade * vahed;
                                              otherTotalWeight += vahed;
                                            }
                                          });

                                          return {
                                            studentCode:
                                              otherStudent.studentCode,
                                            average:
                                              otherTotalWeight > 0
                                                ? otherWeightedSum /
                                                  otherTotalWeight
                                                : null,
                                          };
                                        })
                                        .filter((item) => item.average !== null)
                                        .sort(
                                          (a, b) =>
                                            (b.average as number) -
                                            (a.average as number)
                                        );

                                      // Find this student's position
                                      const position =
                                        monthlyAverages.findIndex(
                                          (item) =>
                                            item.studentCode ===
                                            student.studentCode
                                        );

                                      if (position !== -1) {
                                        classRanking = position + 1;
                                      }
                                    }

                                    return (
                                      <TableCell
                                        key={`avg-${month}`}
                                        className={`font-bold text-center border-r ${getScoreColorClass(
                                          weightedAvg
                                        )}`}
                                        title={`میانگین وزنی بر اساس واحد دروس`}
                                      >
                                        <div className="grade-container">
                                          <div className="grade-value">
                                            {weightedAvg !== null
                                              ? toPersianDigits(
                                                  weightedAvg.toFixed(2)
                                                )
                                              : "—"}
                                          </div>

                                          {/* Show progress for monthly average */}
                                          {showProgress &&
                                            progress !== null && (
                                              <div
                                                className={
                                                  getProgressColorClass(
                                                    progress
                                                  ) + " progress-indicator"
                                                }
                                              >
                                                {getProgressSymbol(progress)}{" "}
                                                {toPersianDigits(
                                                  Math.abs(progress).toFixed(1)
                                                )}
                                                %
                                              </div>
                                            )}

                                          {/* Show ranking among class */}
                                          {showRanking &&
                                            classRanking !== null && (
                                              <div className="rank-indicator">
                                                رتبه:{" "}
                                                {toPersianDigits(classRanking)}
                                              </div>
                                            )}
                                        </div>
                                      </TableCell>
                                    );
                                  }
                                )}

                                {/* Overall average of all course averages */}
                                {(() => {
                                  // Calculate overall class ranking
                                  let overallRanking: number | null = null;

                                  if (
                                    showRanking &&
                                    student.weightedAverage !== null &&
                                    student.weightedAverage !== undefined
                                  ) {
                                    // Get all students' overall weighted averages
                                    const overallAverages = studentReportCards
                                      .map((otherStudent) => ({
                                        studentCode: otherStudent.studentCode,
                                        average:
                                          otherStudent.weightedAverage || null,
                                      }))
                                      .filter((item) => item.average !== null)
                                      .sort(
                                        (a, b) =>
                                          (b.average as number) -
                                          (a.average as number)
                                      );

                                    // Find this student's position
                                    const position = overallAverages.findIndex(
                                      (item) =>
                                        item.studentCode === student.studentCode
                                    );

                                    if (position !== -1) {
                                      overallRanking = position + 1;
                                    }
                                  }

                                  return (
                                    <TableCell
                                      className={`font-bold text-lg text-center border-r px-3 py-3 ${getScoreColorClass(
                                        student.weightedAverage || null
                                      )}`}
                                      title={formatWeightedAverageTooltip(
                                        student.weightedGradesInfo
                                      )}
                                      style={{
                                        cursor:
                                          student.weightedGradesInfo &&
                                          student.weightedGradesInfo.length > 0
                                            ? "help"
                                            : "default",
                                      }}
                                    >
                                      <div className="grade-container">
                                        <div className="grade-value">
                                          {student.weightedAverage !== null &&
                                          student.weightedAverage !== undefined
                                            ? toPersianDigits(
                                                student.weightedAverage.toFixed(
                                                  2
                                                )
                                              )
                                            : "—"}
                                        </div>

                                        {/* Show overall class ranking */}
                                        {showRanking &&
                                          overallRanking !== null && (
                                            <div className="rank-indicator overall-rank">
                                              رتبه کل:{" "}
                                              {toPersianDigits(overallRanking)}
                                            </div>
                                          )}
                                      </div>
                                    </TableCell>
                                  );
                                })()}
                              </TableRow>
                            </TableBody>
                          </Table>

                          {/* Show overall statistics if enabled */}
                          {showOverallStats && (
                            <OverallStatistics student={student} />
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500 bg-white rounded-md shadow-sm border border-gray-200">
                  لطفاً کلاس و سال تحصیلی را انتخاب کنید تا کارنامه نمایش داده
                  شود.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-8 text-gray-500 bg-white rounded-md shadow-sm border border-gray-200">
            لطفاً کلاس و سال تحصیلی را انتخاب کنید تا کارنامه نمایش داده شود.
          </div>
        )}
      </div>
    </>
  );
};

export default ReportCards;
