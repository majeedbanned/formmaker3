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

// Define the print styles for report cards
const printStyles = `
  @media print {
    body {
      background-color: white !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .printing {
      padding: 1rem;
    }
    .printing .card {
      box-shadow: none !important;
      border: none !important;
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
    }
    .printing tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    .printing th, .printing td {
      page-break-inside: avoid;
    }
    .printing thead {
      display: table-header-group;
    }
    .printing tfoot {
      display: table-footer-group;
    }
    @page {
      size: landscape;
      margin: 1cm;
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
  [key: string]: any;
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
      yearAverage: number | null;
    }
  >;
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
  const [courseAssessmentValues, setCourseAssessmentValues] = useState<
    Record<string, Record<string, number>>
  >({});
  const [studentReportCards, setStudentReportCards] = useState<
    StudentReportCard[]
  >([]);

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

  // Get filtered class options based on teacherCode if provided
  const getClassOptions = () => {
    let options = classDocuments.map((doc) => ({
      value: doc.data.classCode,
      label: doc.data.className,
    }));

    // If teacherCode is provided, only show classes where this teacher teaches
    if (teacherCode) {
      options = options.filter((option) => {
        const classDoc = classDocuments.find(
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
    (weightedGradesInfo: WeightedGradeInfo[]): string => {
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
      const average = Math.round((weightedSum / totalWeight) * 100) / 100;

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
        const selectedClassData = classDocuments.find(
          (doc) => doc.data.classCode === selectedClass
        )?.data;

        if (!selectedClassData) {
          console.error("Selected class not found");
          setLoading(false);
          return;
        }

        // Get all teacher-course pairs for this class
        const teacherCourses = selectedClassData.teachers;

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
        setCourseAssessmentValues(courseValues);

        // Student report card structure
        const studentReports: Record<string, StudentReportCard> = {};

        // Initialize student report cards for all students in the class
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
              yearAverage: null,
            };

            // Initialize monthly grades and assessments
            for (let i = 1; i <= 12; i++) {
              const monthKey = i.toString();
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].monthlyGrades[monthKey] = null;
              studentReports[student.studentCode].courses[
                tc.courseCode
              ].monthlyAssessments[monthKey] = [];
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
                  courseValues
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
    classDocuments,
    schoolCode,
    teachersInfo,
    coursesInfo,
    calculateFinalScore,
  ]);

  // Function to get color class based on grade
  const getScoreColorClass = (score: number | null): string => {
    if (score === null) return "text-gray-400";
    if (score >= 18) return "text-green-600 font-bold";
    if (score >= 15) return "text-green-500";
    if (score >= 12) return "text-blue-500";
    if (score >= 10) return "text-orange-400";
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

    // Create a new workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("کارنامه تحصیلی");

    // Set RTL direction
    worksheet.views = [{ rightToLeft: true }];

    // Add a title with class and school year info
    worksheet.mergeCells("A1:Z1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `کارنامه تحصیلی - ${
      classDocuments.find((doc) => doc.data.classCode === selectedClass)?.data
        .className
    } - سال تحصیلی ${yearOptions.find((y) => y.value === selectedYear)?.label}`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // For each student, create a separate worksheet
    for (const student of studentReportCards) {
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
        classDocuments.find((doc) => doc.data.classCode === selectedClass)?.data
          .className
      } - سال تحصیلی: ${
        yearOptions.find((y) => y.value === selectedYear)?.label
      }`;
      classInfo.font = { italic: true, size: 10 };
      classInfo.alignment = { horizontal: "right" };

      // Add course data
      const coursesData = Object.entries(student.courses).map(
        ([, courseData]) => {
          const rowData = {
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
      const weightedAveragesRow = {
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
        student.weightedAverage !== null
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

    // Create summary sheet with all students
    const summarySheet = workbook.addWorksheet("خلاصه کارنامه");
    summarySheet.views = [{ rightToLeft: true }];

    // Add title
    summarySheet.mergeCells("A1:Z1");
    const summaryTitle = summarySheet.getCell("A1");
    summaryTitle.value = `خلاصه کارنامه کلاس ${
      classDocuments.find((doc) => doc.data.classCode === selectedClass)?.data
        .className
    } - سال تحصیلی ${yearOptions.find((y) => y.value === selectedYear)?.label}`;
    summaryTitle.font = { size: 14, bold: true };
    summaryTitle.alignment = { horizontal: "center" };

    // Set up columns
    const summaryColumns = [
      { header: "کد دانش‌آموز", key: "studentCode", width: 15 },
      { header: "نام دانش‌آموز", key: "studentName", width: 25 },
    ];

    // Add a column for each course
    const allCourses = new Set<string>();
    studentReportCards.forEach((student) => {
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

    // Add student data
    const summaryData = studentReportCards.map((student) => {
      const rowData: Record<string, any> = {
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
        student.weightedAverage !== null
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

      return b.weightedAverage - a.weightedAverage;
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <div className={`space-y-6 ${isPrinting ? "printing" : ""}`} dir="rtl">
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-xl">فیلترها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="class-select">کلاس</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="class-select">
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

              <div>
                <Label htmlFor="year-select">سال تحصیلی</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger id="year-select">
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
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : selectedClass && selectedYear ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  کارنامه تحصیلی -{" "}
                  {selectedClass &&
                    classDocuments.find(
                      (doc) => doc.data.classCode === selectedClass
                    )?.data.className}{" "}
                  - سال تحصیلی{" "}
                  {selectedYear &&
                    yearOptions.find((y) => y.value === selectedYear)?.label}
                </CardTitle>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToExcel}
                    className="print:hidden flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors ml-2"
                  >
                    <ExcelIcon />
                    خروجی اکسل
                  </button>
                  <button
                    onClick={handlePrint}
                    className="print:hidden flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <PrinterIcon />
                    نسخه قابل چاپ
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {studentReportCards.length > 0 ? (
                <div className="space-y-8">
                  {studentReportCards.map((student) => (
                    <div
                      key={student.studentCode}
                      className="mb-8 p-2 border border-gray-200 rounded-md"
                    >
                      <h3 className="text-lg font-bold mb-3">
                        کارنامه {student.studentName} - کد:{" "}
                        {toPersianDigits(student.studentCode)}
                      </h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">
                                نام درس
                              </TableHead>
                              <TableHead className="w-[150px]">معلم</TableHead>
                              <TableHead>مهر</TableHead>
                              <TableHead>آبان</TableHead>
                              <TableHead>آذر</TableHead>
                              <TableHead>دی</TableHead>
                              <TableHead>بهمن</TableHead>
                              <TableHead>اسفند</TableHead>
                              <TableHead>فروردین</TableHead>
                              <TableHead>اردیبهشت</TableHead>
                              <TableHead>خرداد</TableHead>
                              <TableHead>تیر</TableHead>
                              <TableHead>میانگین کل</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(student.courses).map(
                              ([courseCode, courseData]) => (
                                <TableRow key={courseCode}>
                                  <TableCell className="font-medium">
                                    {courseData.courseName}
                                  </TableCell>
                                  <TableCell>
                                    {courseData.teacherName}
                                  </TableCell>
                                  {/* Months 7-12 (First half of school year) */}
                                  {[7, 8, 9, 10, 11, 12].map((month) => (
                                    <TableCell
                                      key={`month-${month}`}
                                      className={getScoreColorClass(
                                        courseData.monthlyGrades[
                                          month.toString()
                                        ]
                                      )}
                                    >
                                      {courseData.monthlyGrades[
                                        month.toString()
                                      ] !== null
                                        ? toPersianDigits(
                                            courseData.monthlyGrades[
                                              month.toString()
                                            ].toFixed(2)
                                          )
                                        : "—"}
                                    </TableCell>
                                  ))}
                                  {/* Months 1-4 (Second half of school year) */}
                                  {[1, 2, 3, 4].map((month) => (
                                    <TableCell
                                      key={`month-${month}`}
                                      className={getScoreColorClass(
                                        courseData.monthlyGrades[
                                          month.toString()
                                        ]
                                      )}
                                    >
                                      {courseData.monthlyGrades[
                                        month.toString()
                                      ] !== null
                                        ? toPersianDigits(
                                            courseData.monthlyGrades[
                                              month.toString()
                                            ].toFixed(2)
                                          )
                                        : "—"}
                                    </TableCell>
                                  ))}
                                  {/* Year Average */}
                                  <TableCell
                                    className={`font-bold ${getScoreColorClass(
                                      courseData.yearAverage
                                    )}`}
                                  >
                                    {courseData.yearAverage !== null
                                      ? toPersianDigits(
                                          courseData.yearAverage.toFixed(2)
                                        )
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                            {/* Final row with overall average */}
                            <TableRow className="bg-gray-50">
                              <TableCell colSpan={2} className="font-bold">
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

                                  return (
                                    <TableCell
                                      key={`avg-${month}`}
                                      className={`font-bold ${getScoreColorClass(
                                        weightedAvg
                                      )}`}
                                      title={`میانگین وزنی بر اساس واحد دروس`}
                                    >
                                      {weightedAvg !== null
                                        ? toPersianDigits(
                                            weightedAvg.toFixed(2)
                                          )
                                        : "—"}
                                    </TableCell>
                                  );
                                }
                              )}
                              {/* Overall average of all course averages */}
                              {(() => {
                                return (
                                  <TableCell
                                    className={`font-bold text-lg ${getScoreColorClass(
                                      student.weightedAverage
                                    )}`}
                                    title={formatWeightedAverageTooltip(
                                      student.weightedGradesInfo
                                    )}
                                    style={{
                                      cursor:
                                        student.weightedGradesInfo.length > 0
                                          ? "help"
                                          : "default",
                                    }}
                                  >
                                    {student.weightedAverage !== null
                                      ? toPersianDigits(
                                          student.weightedAverage.toFixed(2)
                                        )
                                      : "—"}
                                  </TableCell>
                                );
                              })()}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  اطلاعات کارنامه برای این کلاس در دسترس نیست.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-8 text-gray-500">
            لطفاً کلاس و سال تحصیلی را انتخاب کنید تا کارنامه نمایش داده شود.
          </div>
        )}
      </div>
    </>
  );
};

export default ReportCards;
