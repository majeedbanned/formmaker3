"use client";
import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import Excel from "exceljs";
import { saveAs } from "file-saver";

// Update the print styles to preserve colors and set landscape mode
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

// Define the types
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: number;
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
  studentCode: number;
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

// Assessment values with weights
const ASSESSMENT_VALUES_MAP: Record<string, number> = {
  عالی: 2,
  خوب: 1,
  متوسط: 0,
  ضعیف: -1,
  "بسیار ضعیف": -2,
};

type TeacherWithCourse = {
  teacherCode: string;
  courseCode: string;
  label: string;
};

type MonthlyGrade = {
  month: number;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  averageGrade: number | null;
  finalScore: number | null;
};

type StudentGrade = {
  studentCode: number;
  studentName: string;
  monthlyGrades: Record<string, MonthlyGrade>;
  yearAverage: string;
};

const MonthlyGradeReport = ({
  schoolCode,
  classDocuments,
}: {
  schoolCode: string;
  classDocuments: ClassDocument[];
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacherCourse, setSelectedTeacherCourse] =
    useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [teacherCourseOptions, setTeacherCourseOptions] = useState<
    TeacherWithCourse[]
  >([]);
  const [yearOptions, setYearOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

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

  // Update teacher/course options when selected class changes
  useEffect(() => {
    if (!selectedClass) return;

    const classDoc = classDocuments.find(
      (doc) => doc.data.classCode === selectedClass
    );

    if (classDoc) {
      const options: TeacherWithCourse[] = [];

      // For simplicity, we'll assign placeholder labels
      classDoc.data.teachers.forEach((teacher) => {
        options.push({
          teacherCode: teacher.teacherCode,
          courseCode: teacher.courseCode,
          label: `Teacher ${teacher.teacherCode} - Course ${teacher.courseCode}`,
        });
      });

      setTeacherCourseOptions(options);

      // Select the first teacher/course option by default
      // Only set if it's not already set or if the current value is invalid
      if (
        options.length > 0 &&
        (!selectedTeacherCourse ||
          !options.find(
            (o) => `${o.teacherCode}_${o.courseCode}` === selectedTeacherCourse
          ))
      ) {
        setSelectedTeacherCourse(
          `${options[0].teacherCode}_${options[0].courseCode}`
        );
      }
    }
  }, [selectedClass, classDocuments, selectedTeacherCourse]);

  // Calculate a weighted score that includes both grades and assessments
  const calculateFinalScore = (
    grades: GradeEntry[],
    assessments: AssessmentEntry[]
  ): number | null => {
    if (grades.length === 0) return null;

    // Calculate average grade
    const gradeAverage =
      grades.reduce((sum, grade) => sum + grade.value, 0) / grades.length;

    // Calculate assessment factor (0.8 to 1.2 multiplier based on assessments)
    let assessmentFactor = 1.0; // Default neutral factor

    if (assessments.length > 0) {
      // Get average assessment weight
      const totalAssessmentWeight = assessments.reduce((sum, assessment) => {
        const weight = ASSESSMENT_VALUES_MAP[assessment.value] || 0;
        return sum + weight;
      }, 0);

      // Convert to a factor between 0.8 and 1.2
      // (2 is max positive, -2 is max negative in our scale)
      assessmentFactor = 1 + (totalAssessmentWeight / assessments.length) * 0.1;
    }

    // Apply assessment factor to grade
    return gradeAverage * assessmentFactor;
  };

  // Calculate progress between two months (as percentage)
  const calculateProgress = (
    currentScore: number | null,
    previousScore: number | null
  ): number | null => {
    if (currentScore === null || previousScore === null || previousScore === 0)
      return null;
    return ((currentScore - previousScore) / previousScore) * 100;
  };

  // Fetch grades data when selection changes
  useEffect(() => {
    if (!selectedClass || !selectedTeacherCourse || !selectedYear) {
      return;
    }

    const fetchGradesData = async () => {
      setLoading(true);
      try {
        const [teacherCode, courseCode] = selectedTeacherCourse.split("_");

        const selectedClassData = classDocuments.find(
          (doc) => doc.data.classCode === selectedClass
        )?.data;

        if (!selectedClassData) {
          console.error("Selected class not found");
          setLoading(false);
          return;
        }

        // Fetch all grade data for this class, teacher, and course
        const response = await fetch("/api/classsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classCode: selectedClass,
            teacherCode,
            courseCode,
            schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch grade data");
        }

        const cellData: CellData[] = await response.json();

        // Filter for the selected school year (7-12 in previous year, 1-6 in current year)
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
                cellYear.toString() === (parseInt(selectedYear) + 1).toString()
              );
            }
          } catch (err) {
            console.error("Error processing date:", cell.date, err);
            return false;
          }
        });

        // Group grades by student and month
        const gradesByStudent = selectedClassData.students.map((student) => {
          const studentCells = filteredCellData.filter(
            (cell) => cell.studentCode === student.studentCode
          );

          // Initialize monthly grades structure
          const monthlyGrades: Record<string, MonthlyGrade> = {};
          for (let i = 1; i <= 12; i++) {
            monthlyGrades[i.toString()] = {
              month: i,
              grades: [],
              assessments: [],
              averageGrade: null,
              finalScore: null,
            };
          }

          // Populate with actual data
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

              // Add grades
              if (cell.grades && cell.grades.length > 0) {
                monthlyGrades[monthKey].grades.push(...cell.grades);
              }

              // Add assessments
              if (cell.assessments && cell.assessments.length > 0) {
                monthlyGrades[monthKey].assessments.push(...cell.assessments);
              }
            } catch (err) {
              console.error("Error processing cell date:", cell.date, err);
            }
          });

          // Calculate averages and final scores for each month
          let totalFinalScore = 0;
          let monthsWithScores = 0;

          Object.keys(monthlyGrades).forEach((month) => {
            const monthData = monthlyGrades[month];

            // Calculate average grade if there are grades
            if (monthData.grades.length > 0) {
              monthData.averageGrade =
                monthData.grades.reduce((sum, grade) => sum + grade.value, 0) /
                monthData.grades.length;
            }

            // Calculate final score (grades adjusted by assessments)
            monthData.finalScore = calculateFinalScore(
              monthData.grades,
              monthData.assessments
            );

            if (monthData.finalScore !== null) {
              totalFinalScore += monthData.finalScore;
              monthsWithScores++;
            }
          });

          // Calculate year average
          const yearAverage =
            monthsWithScores > 0
              ? (totalFinalScore / monthsWithScores).toFixed(2)
              : "-";

          return {
            studentCode: student.studentCode,
            studentName: `${student.studentName} ${student.studentlname}`,
            monthlyGrades,
            yearAverage,
          };
        });

        setStudentGrades(gradesByStudent);
      } catch (error) {
        console.error("Error fetching grade data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradesData();
  }, [
    selectedClass,
    selectedTeacherCourse,
    selectedYear,
    classDocuments,
    schoolCode,
  ]);

  // Get a color class based on score value
  const getScoreColorClass = (score: number | null): string => {
    if (score === null) return "text-gray-400";
    if (score >= 18) return "text-green-600 font-bold";
    if (score >= 15) return "text-green-500";
    if (score >= 12) return "text-blue-500";
    if (score >= 10) return "text-orange-400";
    return "text-red-500";
  };

  // Add function to get rank badge colors
  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return "bg-amber-200 text-amber-800 font-bold"; // Gold
    if (rank === 2) return "bg-gray-200 text-gray-700 font-bold"; // Silver
    if (rank === 3) return "bg-orange-200 text-orange-700 font-bold"; // Bronze
    return "bg-gray-200 text-gray-700"; // Default gray
  };

  // Update the calculateStudentRanks function to also calculate ranks for year average
  const calculateStudentRanks = () => {
    const ranksByMonth: Record<string, Record<number, number>> = {};
    const yearAverageRanks: Record<number, number> = {};

    // Initialize rank storage for each month
    for (let i = 1; i <= 12; i++) {
      ranksByMonth[i.toString()] = {};
    }

    // Get all months (1-12)
    const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

    // Calculate ranks for each month
    allMonths.forEach((month) => {
      // Get all students with scores for this month
      const studentsWithScores = studentGrades
        .map((student) => ({
          studentCode: student.studentCode,
          finalScore: student.monthlyGrades[month]?.finalScore,
        }))
        .filter(
          (student) =>
            student.finalScore !== null && student.finalScore !== undefined
        );

      // Sort students by score (descending)
      const sortedStudents = [...studentsWithScores].sort(
        (a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)
      );

      // Assign ranks (equal scores get the same rank)
      let currentRank = 1;
      let previousScore: number | null = null;

      sortedStudents.forEach((student, index) => {
        if (student.finalScore !== previousScore) {
          // New score, assign new rank
          currentRank = index + 1;
        }

        ranksByMonth[month][student.studentCode] = currentRank;
        previousScore = student.finalScore;
      });
    });

    // Calculate ranks for year average
    const studentsWithYearAvg = studentGrades
      .map((student) => ({
        studentCode: student.studentCode,
        yearAverage:
          student.yearAverage !== "-" ? parseFloat(student.yearAverage) : null,
      }))
      .filter((student) => student.yearAverage !== null);

    // Sort students by year average (descending)
    const sortedByYearAvg = [...studentsWithYearAvg].sort(
      (a, b) => (b.yearAverage ?? 0) - (a.yearAverage ?? 0)
    );

    // Assign ranks for year average
    let currentRank = 1;
    let previousAvg: number | null = null;

    sortedByYearAvg.forEach((student, index) => {
      if (student.yearAverage !== previousAvg) {
        // New average, assign new rank
        currentRank = index + 1;
      }

      yearAverageRanks[student.studentCode] = currentRank;
      previousAvg = student.yearAverage;
    });

    return { monthlyRanks: ranksByMonth, yearAverageRanks };
  };

  // Add a function to calculate overall progress for a student
  const calculateOverallProgress = (student: StudentGrade): number | null => {
    // Get the first and last months that have scores
    const monthsWithScores = Object.entries(student.monthlyGrades)
      .filter(([, monthData]) => monthData.finalScore !== null)
      .map(([month]) => parseInt(month));

    if (monthsWithScores.length < 2) return null;

    // Sort months
    monthsWithScores.sort((a, b) => a - b);

    const firstMonth = monthsWithScores[0].toString();
    const lastMonth = monthsWithScores[monthsWithScores.length - 1].toString();

    const firstScore = student.monthlyGrades[firstMonth].finalScore;
    const lastScore = student.monthlyGrades[lastMonth].finalScore;

    if (firstScore === null || lastScore === null) return null;

    // Calculate overall progress percentage
    return ((lastScore - firstScore) / firstScore) * 100;
  };

  // Add function to request sort
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";

    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }

    setSortConfig({ key, direction });
  };

  // Add function to get sorted items
  const getSortedItems = (items: StudentGrade[]) => {
    if (!sortConfig) return items;

    return [...items].sort((a, b) => {
      // Handle different sort keys
      if (sortConfig.key === "studentName") {
        // Sort by student name
        if (a.studentName < b.studentName)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (a.studentName > b.studentName)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      } else if (sortConfig.key === "yearAverage") {
        // Sort by year average
        const aValue = a.yearAverage !== "-" ? parseFloat(a.yearAverage) : -1;
        const bValue = b.yearAverage !== "-" ? parseFloat(b.yearAverage) : -1;
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      } else {
        // Sort by a specific month
        const monthKey = sortConfig.key;
        const aValue = a.monthlyGrades[monthKey]?.finalScore ?? -1;
        const bValue = b.monthlyGrades[monthKey]?.finalScore ?? -1;
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }
    });
  };

  // Add a sorting indicator component
  const SortIcon = ({ column }: { column: string }) => {
    if (!sortConfig || sortConfig.key !== column) {
      return <span className="text-gray-400 inline-block ml-1">⇅</span>;
    }

    return (
      <span className="text-black inline-block ml-1">
        {sortConfig.direction === "ascending" ? "↑" : "↓"}
      </span>
    );
  };

  // Add print function here
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

  // Add PrinterIcon component here
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

  // Add ExcelIcon component inside the MonthlyGradeReport component
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

  // Add export to Excel function inside the MonthlyGradeReport component
  const exportToExcel = async () => {
    // Create a new workbook
    const workbook = new Excel.Workbook();

    // Add a worksheet
    const worksheet = workbook.addWorksheet("گزارش نمرات ماهانه");

    // Set RTL direction for the worksheet
    worksheet.views = [{ rightToLeft: true }];

    // Set column headers (all months of the year + student info)
    const columns = [
      { header: "ردیف", key: "rowNumber", width: 10 },
      { header: "کد دانش‌آموز", key: "studentCode", width: 15 },
      { header: "نام دانش‌آموز", key: "studentName", width: 25 },
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
      { header: "مرداد", key: "5", width: 12 },
      { header: "شهریور", key: "6", width: 12 },
      { header: "میانگین", key: "yearAverage", width: 15 },
    ];

    worksheet.columns = columns;

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE7E6E6" },
    };

    // Add data rows
    getSortedItems(studentGrades).forEach((student, index) => {
      interface RowData {
        rowNumber: number;
        studentCode: number;
        studentName: string;
        yearAverage: number | string;
        [key: string]: number | string | null;
      }

      const rowData: RowData = {
        rowNumber: index + 1,
        studentCode: student.studentCode,
        studentName: student.studentName,
        yearAverage:
          student.yearAverage !== "-" ? parseFloat(student.yearAverage) : "",
      };

      // Add month scores
      ["7", "8", "9", "10", "11", "12", "1", "2", "3", "4", "5", "6"].forEach(
        (month) => {
          const score = student.monthlyGrades[month]?.finalScore;
          rowData[month] = score !== null ? score : "";
        }
      );

      worksheet.addRow(rowData);
    });

    // Set borders for all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        // Center align all cells
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    });

    // Color coding for scores
    worksheet.eachRow((row, rowNum) => {
      if (rowNum > 1) {
        // Skip header row
        // Process monthly score columns (index 3-14)
        for (let colIndex = 4; colIndex <= 15; colIndex++) {
          const cell = row.getCell(colIndex);
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

        // Style year average column (index 16)
        const avgCell = row.getCell(16);
        const avgValue = avgCell.value as number;

        if (avgValue) {
          avgCell.font = { bold: true };

          if (avgValue >= 18) {
            avgCell.font.color = { argb: "FF008000" }; // Dark green
          } else if (avgValue >= 15) {
            avgCell.font.color = { argb: "FF228B22" }; // Green
          } else if (avgValue >= 12) {
            avgCell.font.color = { argb: "FF0000FF" }; // Blue
          } else if (avgValue >= 10) {
            avgCell.font.color = { argb: "FFFF8C00" }; // Orange
          } else {
            avgCell.font.color = { argb: "FFFF0000" }; // Red
          }
        }
      }
    });

    // Add title
    worksheet.insertRow(1, []);
    worksheet.mergeCells("A1:P1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `گزارش نمرات ماهانه - ${
      classDocuments.find((doc) => doc.data.classCode === selectedClass)?.data
        .className
    } - سال تحصیلی ${yearOptions.find((y) => y.value === selectedYear)?.label}`;
    titleCell.font = { size: 14, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Use FileSaver to save the Excel file
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `گزارش_نمرات_ماهانه_${selectedClass}_${new Date()
        .toLocaleDateString("fa-IR")
        .replace(/\//g, "-")}.xlsx`
    );
  };

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
                    {classDocuments.map((classDoc) => (
                      <SelectItem
                        key={classDoc.data.classCode}
                        value={classDoc.data.classCode}
                      >
                        {classDoc.data.className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="teacher-course-select">معلم / درس</Label>
                <Select
                  value={selectedTeacherCourse}
                  onValueChange={setSelectedTeacherCourse}
                  disabled={!selectedClass || teacherCourseOptions.length === 0}
                >
                  <SelectTrigger id="teacher-course-select">
                    <SelectValue placeholder="انتخاب معلم / درس" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherCourseOptions.map((option) => (
                      <SelectItem
                        key={`${option.teacherCode}_${option.courseCode}`}
                        value={`${option.teacherCode}_${option.courseCode}`}
                      >
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

            <div className="flex items-center space-x-2 mt-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-progress"
                  checked={showProgress}
                  onCheckedChange={(checked) =>
                    setShowProgress(checked === true)
                  }
                />
                <Label htmlFor="show-progress" className="cursor-pointer">
                  نمایش درصد پیشرفت/پسرفت ماهانه
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-rank"
                  checked={showRank}
                  onCheckedChange={(checked) => setShowRank(checked === true)}
                />
                <Label htmlFor="show-rank" className="cursor-pointer">
                  نمایش رتبه در کلاس
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : selectedClass && selectedTeacherCourse && selectedYear ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  گزارش نمرات ماهانه -{" "}
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
              {studentGrades.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table dir="rtl">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ردیف</TableHead>
                        <TableHead className="w-[90px]">کد</TableHead>
                        <TableHead
                          className="min-w-[150px] cursor-pointer"
                          onClick={() => requestSort("studentName")}
                        >
                          نام دانش‌آموز <SortIcon column="studentName" />
                        </TableHead>
                        {/* First half of school year (months 7-12) */}
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("7")}
                        >
                          مهر <SortIcon column="7" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("8")}
                        >
                          آبان <SortIcon column="8" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("9")}
                        >
                          آذر <SortIcon column="9" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("10")}
                        >
                          دی <SortIcon column="10" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("11")}
                        >
                          بهمن <SortIcon column="11" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("12")}
                        >
                          اسفند <SortIcon column="12" />
                        </TableHead>
                        {/* Second half of school year (months 1-6) */}
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("1")}
                        >
                          فروردین <SortIcon column="1" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("2")}
                        >
                          اردیبهشت <SortIcon column="2" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("3")}
                        >
                          خرداد <SortIcon column="3" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("4")}
                        >
                          تیر <SortIcon column="4" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("5")}
                        >
                          مرداد <SortIcon column="5" />
                        </TableHead>
                        <TableHead
                          className="w-[80px] cursor-pointer"
                          onClick={() => requestSort("6")}
                        >
                          شهریور <SortIcon column="6" />
                        </TableHead>
                        <TableHead
                          className="w-[90px] font-bold cursor-pointer"
                          onClick={() => requestSort("yearAverage")}
                        >
                          میانگین <SortIcon column="yearAverage" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedItems(studentGrades).map((student, index) => (
                        <TableRow key={student.studentCode}>
                          <TableCell>{toPersianDigits(index + 1)}</TableCell>
                          <TableCell>
                            {toPersianDigits(student.studentCode)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              {(showRank &&
                                (() => {
                                  const { yearAverageRanks } =
                                    calculateStudentRanks();
                                  const rank =
                                    yearAverageRanks[student.studentCode];
                                  if (rank && rank <= 3) {
                                    return (
                                      <div
                                        className={`font-bold ${
                                          rank === 1
                                            ? "text-amber-700"
                                            : rank === 2
                                            ? "text-gray-700"
                                            : "text-orange-700"
                                        }`}
                                      >
                                        {student.studentName}
                                        <span className="inline-block mr-2 text-xs">
                                          {rank === 1
                                            ? "🥇"
                                            : rank === 2
                                            ? "🥈"
                                            : "🥉"}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return <div>{student.studentName}</div>;
                                })()) || <div>{student.studentName}</div>}

                              {/* Overall progress label */}
                              {(() => {
                                const overallProgress =
                                  calculateOverallProgress(student);
                                if (overallProgress !== null) {
                                  const isPositive = overallProgress >= 0;
                                  return (
                                    <div
                                      className={`text-xs mt-1 flex items-center ${
                                        isPositive
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      <span className="ml-1">پیشرفت کلی:</span>
                                      {isPositive ? (
                                        <ChevronUpIcon className="h-3 w-3 ml-1" />
                                      ) : (
                                        <ChevronDownIcon className="h-3 w-3 ml-1" />
                                      )}
                                      <span>
                                        {toPersianDigits(
                                          Math.abs(overallProgress).toFixed(2)
                                        )}
                                        %
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </TableCell>

                          {/* Display months in order of school year (7-12, 1-6) */}
                          {/* First half (Fall/Winter) */}
                          {[7, 8, 9, 10, 11, 12].map((month, monthIndex) => {
                            const currentScore =
                              student.monthlyGrades[month.toString()]
                                ?.finalScore;
                            let progressElement = null;
                            let rankElement = null;

                            if (showProgress && monthIndex > 0) {
                              const previousMonth = [7, 8, 9, 10, 11, 12][
                                monthIndex - 1
                              ];
                              const previousScore =
                                student.monthlyGrades[previousMonth.toString()]
                                  ?.finalScore;
                              const progress = calculateProgress(
                                currentScore,
                                previousScore
                              );

                              if (progress !== null) {
                                const isPositive = progress >= 0;
                                progressElement = (
                                  <div
                                    className={`text-xs mt-1 flex items-center ${
                                      isPositive
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {isPositive ? (
                                      <ChevronUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ChevronDownIcon className="h-3 w-3 mr-1" />
                                    )}
                                    <span>
                                      {toPersianDigits(
                                        Math.abs(progress).toFixed(2)
                                      )}
                                      %
                                    </span>
                                  </div>
                                );
                              }
                            }

                            // Add rank display if enabled
                            if (showRank && currentScore !== null) {
                              const { monthlyRanks } = calculateStudentRanks();
                              const studentRank =
                                monthlyRanks[month.toString()][
                                  student.studentCode
                                ];
                              if (studentRank) {
                                rankElement = (
                                  <div
                                    className={`text-xs mt-1 px-1 rounded ${getRankBadgeClass(
                                      studentRank
                                    )}`}
                                  >
                                    رتبه: {toPersianDigits(studentRank)}
                                  </div>
                                );
                              }
                            }

                            return (
                              <TableCell
                                key={`month-${month}`}
                                className={getScoreColorClass(currentScore)}
                              >
                                {currentScore !== null
                                  ? toPersianDigits(
                                      currentScore.toFixed(2) || "-"
                                    )
                                  : "-"}
                                {progressElement}
                                {rankElement}
                              </TableCell>
                            );
                          })}

                          {/* Second half (Spring/Summer) */}
                          {[1, 2, 3, 4, 5, 6].map((month, monthIndex) => {
                            const currentScore =
                              student.monthlyGrades[month.toString()]
                                ?.finalScore;
                            let progressElement = null;
                            let rankElement = null;

                            if (showProgress) {
                              let previousMonth;
                              const previousScore = (() => {
                                if (monthIndex === 0) {
                                  // Compare with Esfand (month 12)
                                  previousMonth = 12;
                                } else {
                                  // Compare with previous month in this half
                                  previousMonth = [1, 2, 3, 4, 5, 6][
                                    monthIndex - 1
                                  ];
                                }

                                return student.monthlyGrades[
                                  previousMonth.toString()
                                ]?.finalScore;
                              })();

                              const progress = calculateProgress(
                                currentScore,
                                previousScore
                              );

                              if (progress !== null) {
                                const isPositive = progress >= 0;
                                progressElement = (
                                  <div
                                    className={`text-xs mt-1 flex items-center ${
                                      isPositive
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {isPositive ? (
                                      <ChevronUpIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                      <ChevronDownIcon className="h-3 w-3 mr-1" />
                                    )}
                                    <span>
                                      {toPersianDigits(
                                        Math.abs(progress).toFixed(2)
                                      )}
                                      %
                                    </span>
                                  </div>
                                );
                              }
                            }

                            // Add rank display if enabled
                            if (showRank && currentScore !== null) {
                              const { monthlyRanks } = calculateStudentRanks();
                              const studentRank =
                                monthlyRanks[month.toString()][
                                  student.studentCode
                                ];
                              if (studentRank) {
                                rankElement = (
                                  <div
                                    className={`text-xs mt-1 px-1 rounded ${getRankBadgeClass(
                                      studentRank
                                    )}`}
                                  >
                                    رتبه: {toPersianDigits(studentRank)}
                                  </div>
                                );
                              }
                            }

                            return (
                              <TableCell
                                key={`month-${month}`}
                                className={getScoreColorClass(currentScore)}
                              >
                                {currentScore !== null
                                  ? toPersianDigits(
                                      currentScore.toFixed(2) || "-"
                                    )
                                  : "-"}
                                {progressElement}
                                {rankElement}
                              </TableCell>
                            );
                          })}

                          {/* Year average */}
                          <TableCell
                            className={`font-bold ${
                              student.yearAverage !== "-"
                                ? getScoreColorClass(
                                    parseFloat(student.yearAverage)
                                  )
                                : "text-gray-400"
                            }`}
                          >
                            {student.yearAverage !== "-"
                              ? toPersianDigits(
                                  parseFloat(student.yearAverage).toFixed(2)
                                )
                              : toPersianDigits(student.yearAverage)}

                            {showRank &&
                              student.yearAverage !== "-" &&
                              (() => {
                                const { yearAverageRanks } =
                                  calculateStudentRanks();
                                const rank =
                                  yearAverageRanks[student.studentCode];
                                if (rank) {
                                  return (
                                    <div
                                      className={`text-xs mt-1 px-1 rounded ${getRankBadgeClass(
                                        rank
                                      )}`}
                                    >
                                      رتبه: {toPersianDigits(rank)}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  نمره‌ای برای این سال تحصیلی ثبت نشده است.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-8 text-gray-500">
            لطفاً کلاس، معلم/درس و سال تحصیلی را انتخاب کنید تا گزارش نمرات
            نمایش داده شود.
          </div>
        )}
      </div>
    </>
  );
};

export default MonthlyGradeReport;
