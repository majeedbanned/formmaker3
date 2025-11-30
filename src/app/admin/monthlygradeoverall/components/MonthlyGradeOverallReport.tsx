"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { MultiSelect } from "@/components/ui/multi-select";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/solid";
import Excel from "exceljs";
import { saveAs } from "file-saver";

// Define the types
type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type Student = {
  studentCode: string | number;
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
  studentCode: string | number;
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

// Update the AssessmentData type to match the expected structure from the API
type AssessmentData = {
  data: {
    value: string;
    weight: number;
    title?: string;
    teacherCode?: string;
    courseCode?: string;
    schoolCode?: string;
  };
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

// Print styles for preserving colors when printing
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

// Types specific to this component
type CourseInfo = {
  courseCode: string;
  teacherCode: string;
  courseName: string;
  vahed?: number;
};

type MonthlyGrade = {
  month: string;
  value: number;
};

// Add a new type to track the weighted grade calculations for tooltips
type WeightedGradeInfo = {
  courseName: string;
  grade: number;
  vahed: number;
  weightedValue: number;
};

type StudentGradesByMonth = {
  studentCode: string;
  studentName: string;
  courseGrades: Record<string, number | null>;
  courseMonthlyGrades: Record<string, MonthlyGrade[]>;
  average: number | null;
  weightedGradesInfo: WeightedGradeInfo[];
  gradeDetails: Record<
    string,
    {
      grades: GradeEntry[];
      assessments: AssessmentEntry[];
    }
  >;
};

const MonthlyGradeOverallReport = ({
  schoolCode,
  classDocuments,
}: {
  schoolCode: string;
  classDocuments: ClassDocument[];
}) => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [yearOptions, setYearOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [courseInfo, setCourseInfo] = useState<CourseInfo[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGradesByMonth[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [courseSpecificAssessmentValues, setCourseSpecificAssessmentValues] =
    useState<Record<string, Record<string, number>>>({});
  const [showRankings, setShowRankings] = useState<boolean>(true);
  const [showProgress, setShowProgress] = useState<boolean>(true);

  // Get the current Persian year and month based on the current date
  const currentDate = new Date();
  const [currentJYear, currentJMonth] = gregorian_to_jalali(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );

  // Persian month names
  const persianMonths = [
    { value: "all", label: "همه ماه‌ها" },
    { value: "1", label: "فروردین" },
    { value: "2", label: "اردیبهشت" },
    { value: "3", label: "خرداد" },
    { value: "4", label: "تیر" },
    { value: "5", label: "مرداد" },
    { value: "6", label: "شهریور" },
    { value: "7", label: "مهر" },
    { value: "8", label: "آبان" },
    { value: "9", label: "آذر" },
    { value: "10", label: "دی" },
    { value: "11", label: "بهمن" },
    { value: "12", label: "اسفند" },
  ];

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

    // Set current month as default
    setSelectedMonths([currentJMonth.toString()]);

    setIsInitialized(true);
  }, [currentJYear, currentJMonth, isInitialized]);

  // Wrap the calculateFinalScore function in useCallback
  const calculateFinalScore = useCallback(
    (
      grades: GradeEntry[],
      assessments: AssessmentEntry[],
      courseKey: string
    ): number | null => {
      if (!grades || grades.length === 0) return null;

      // Calculate base grade normalized to 20
      // This handles grades with different totalPoints (e.g., 5/10, 16/20)
      // by calculating the weighted average and converting to base 20
      const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
      const totalPoints = grades.reduce(
        (sum, grade) => sum + (grade.totalPoints || 20),
        0
      );

      // Normalize to base 20: (achieved/possible) × 20
      // Cap at 20 to ensure no grade exceeds maximum
      const baseGrade = totalPoints > 0 ? Math.min((totalValue / totalPoints) * 20, 20) : 0;

      // If no assessments, return the base grade
      if (!assessments || assessments.length === 0) return baseGrade;

      // Calculate direct assessment adjustment (add/subtract directly)
      const assessmentAdjustment = assessments.reduce((total, assessment) => {
        // Check if there's a custom value for this course and assessment
        const courseSpecificValues =
          courseSpecificAssessmentValues[courseKey] || {};
        // Use course-specific value if available, otherwise fallback to default
        const adjustment =
          courseSpecificValues[assessment.value] !== undefined
            ? courseSpecificValues[assessment.value]
            : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

        return total + adjustment;
      }, 0);

      // Calculate final score with direct addition of assessment adjustment
      let finalScore = baseGrade + assessmentAdjustment;

      // Cap at 20
      finalScore = Math.min(finalScore, 20);

      // Ensure not negative
      finalScore = Math.max(finalScore, 0);

      return finalScore;
    },
    [courseSpecificAssessmentValues]
  );

  // Wrap the formatGradeCalculationTooltip function in useCallback
  const formatGradeCalculationTooltip = useCallback(
    (
      grades: GradeEntry[],
      assessments: AssessmentEntry[],
      courseKey: string
    ): string => {
      if (!grades || grades.length === 0) return "اطلاعاتی موجود نیست";

      // Calculate the base grade (normalized to 20)
      const totalValue = grades.reduce((sum, grade) => sum + grade.value, 0);
      const totalPoints = grades.reduce(
        (sum, grade) => sum + (grade.totalPoints || 20),
        0
      );
      // Cap at 20 to ensure no grade exceeds maximum
      const baseGrade = totalPoints > 0 ? Math.min((totalValue / totalPoints) * 20, 20) : 0;

      // Build the tooltip text
      let tooltip = "محاسبه نمره:\n\n";

      // Show each individual grade with its total points
      tooltip += "نمرات اصلی:\n";
      grades.forEach((grade, index) => {
        const gradeTotal = grade.totalPoints || 20;
        tooltip += `${index + 1}. ${toPersianDigits(
          grade.value.toFixed(2)
        )}/${toPersianDigits(gradeTotal)}`;
        if (grade.description) {
          tooltip += ` (${grade.description})`;
        }
        tooltip += "\n";
      });

      // Show calculation breakdown
      tooltip += `\nمجموع امتیازات: ${toPersianDigits(
        totalValue.toFixed(2)
      )}\n`;
      tooltip += `از کل: ${toPersianDigits(totalPoints)}\n`;
      tooltip += `نمره پایه (از ۲۰): ${toPersianDigits(baseGrade.toFixed(2))}\n`;

      // If there are assessments, show how they affected the grade
      if (assessments && assessments.length > 0) {
        tooltip += "\nارزیابی‌های معلم:\n";

        let assessmentAdjustmentTotal = 0;
        assessments.forEach((assessment) => {
          // Get course-specific assessment value or fall back to default
          const courseSpecificValues =
            courseSpecificAssessmentValues[courseKey] || {};
          const adjustment =
            courseSpecificValues[assessment.value] !== undefined
              ? courseSpecificValues[assessment.value]
              : ASSESSMENT_VALUES_MAP[assessment.value] || 0;

          assessmentAdjustmentTotal += adjustment;

          // Show the assessment with its direct adjustment value
          tooltip += `- ${assessment.title || "ارزیابی"}: ${
            assessment.value
          } (${adjustment > 0 ? "+" : ""}${adjustment})\n`;
        });

        // Show the direct calculation
        tooltip += `\nتأثیر ارزیابی‌ها: ${
          assessmentAdjustmentTotal > 0 ? "+" : ""
        }${toPersianDigits(assessmentAdjustmentTotal.toString())}\n`;

        // Calculate final score with direct addition
        let finalScore = baseGrade + assessmentAdjustmentTotal;
        // Cap at 20
        finalScore = Math.min(finalScore, 20);
        // Ensure not negative
        finalScore = Math.max(finalScore, 0);

        // Show calculation
        tooltip += `\nمحاسبه نهایی: ${toPersianDigits(
          baseGrade.toFixed(2)
        )} ${assessmentAdjustmentTotal >= 0 ? "+" : ""}${toPersianDigits(
          assessmentAdjustmentTotal.toString()
        )} = ${toPersianDigits(finalScore.toFixed(2))}`;

        // Add note if capped
        if (baseGrade + assessmentAdjustmentTotal > 20) {
          tooltip += `\n(محدود شده به حداکثر نمره ۲۰)`;
        } else if (baseGrade + assessmentAdjustmentTotal < 0) {
          tooltip += `\n(محدود شده به حداقل نمره ۰)`;
        }
      }

      return tooltip;
    },
    [courseSpecificAssessmentValues]
  );

  // Update course info when selected class changes
  useEffect(() => {
    if (!selectedClass) return;

    const classDoc = classDocuments.find(
      (doc) => doc.data.classCode === selectedClass
    );
    // console.log("classDoc", classDoc);
    if (classDoc) {
      setLoading(true);

      // Extract teacher-course pairs from the class
      const teacherCourses = classDoc.data.teachers.map((teacher) => ({
        courseCode: teacher.courseCode,
        teacherCode: teacher.teacherCode,
      }));

      // Fetch course details for each courseCode
      const fetchCourseDetails = async () => {
        try {
          // console.log("teacherCourses", teacherCourses);
          // Create promises for all course fetch operations
          const coursePromises = teacherCourses.map(async (teacherCourse) => {
            const response = await fetch(
              `/api/courses?courseCode=${teacherCourse.courseCode}&schoolCode=${schoolCode}`
            );

            // console.log("responsexx", response);
            if (!response.ok) {
              // console.error(
              //   `Failed to fetch course ${teacherCourse.courseCode}`
              // );
              return {
                ...teacherCourse,
                courseName: `درس ${teacherCourse.courseCode}`, // Fallback name
                vahed: 1, // Default value
              };
            }

            const courseData = await response.json();
            // If course data exists, use it, otherwise use fallback
            if (courseData && courseData.length > 0 && courseData[0].data) {
              const rawVahed = courseData[0].data.vahed;
              const numericVahed = Number(rawVahed ?? 1);
              const finalVahed =
                Number.isFinite(numericVahed) && numericVahed > 0
                  ? numericVahed
                  : 1;

              return {
                ...teacherCourse,
                courseName:
                  courseData[0].data.courseName ||
                  `درس ${teacherCourse.courseCode}`,
                vahed: finalVahed,
              };
            } else {
              return {
                ...teacherCourse,
                courseName: `درس ${teacherCourse.courseCode}`, // Fallback name
                vahed: 1, // Default value
              };
            }
          });

          // Fetch custom assessment values for each teacher/course
          const assessmentPromises = teacherCourses.map(
            async (teacherCourse) => {
              try {
                const response = await fetch(
                  `/api/assessments?teacherCode=${teacherCourse.teacherCode}&courseCode=${teacherCourse.courseCode}&schoolCode=${schoolCode}`
                );

                if (!response.ok) {
                  return {
                    courseKey: `${teacherCourse.teacherCode}_${teacherCourse.courseCode}`,
                    values: {},
                  };
                }

                const assessmentData =
                  (await response.json()) as AssessmentData[];
                const customValues: Record<string, number> = {};
                // console.log("assessmentData", assessmentData);
                if (assessmentData && assessmentData.data.length > 0) {
                  // Process assessment data to extract custom values
                  assessmentData.data.forEach((assessment: AssessmentData) => {
                    if (
                      assessment &&
                      assessment.value &&
                      assessment.weight !== undefined
                    ) {
                      // console.log("assessmentxxx");

                      customValues[assessment.value] = assessment.weight;
                    }
                  });
                }
                // console.log("assessment1", customValues);

                return {
                  courseKey: `${teacherCourse.teacherCode}_${teacherCourse.courseCode}`,
                  values: customValues,
                };
              } catch (error) {
                console.error("Error fetching assessment values:", error);
                return {
                  courseKey: `${teacherCourse.teacherCode}_${teacherCourse.courseCode}`,
                  values: {},
                };
              }
            }
          );

          // Wait for all course data to be fetched
          const coursesWithDetails = await Promise.all(coursePromises);
          // console.log(
          //   "Fetched courses:",
          //   coursesWithDetails.map((c) => ({
          //     courseCode: c.courseCode,
          //     courseName: c.courseName,
          //     vahed: c.vahed,
          //   }))
          // );
          setCourseInfo(coursesWithDetails);

          // Auto-select all courses when they're loaded
          const allCourseKeys = coursesWithDetails.map(
            (course) => `${course.teacherCode}_${course.courseCode}`
          );
          setSelectedCourses(allCourseKeys);

          // Process custom assessment values
          const assessmentResults = await Promise.all(assessmentPromises);
          const assessmentValuesMap: Record<
            string,
            Record<string, number>
          > = {};

          assessmentResults.forEach((result) => {
            if (Object.keys(result.values).length > 0) {
              assessmentValuesMap[result.courseKey] = result.values;
            }
          });

          setCourseSpecificAssessmentValues(assessmentValuesMap);
        } catch (error) {
          console.error("Error fetching course details:", error);

          // Fallback to basic info if there's an error
          const basicCourseInfo = teacherCourses.map((teacherCourse) => ({
            ...teacherCourse,
            courseName: `درس ${teacherCourse.courseCode}`,
            vahed: 1,
          }));

          setCourseInfo(basicCourseInfo);
        } finally {
          setLoading(false);
        }
      };

      fetchCourseDetails();
    }
  }, [selectedClass, classDocuments, schoolCode]);

  // Fetch grades data when selections change
  useEffect(() => {
    if (
      !selectedClass ||
      selectedMonths.length === 0 ||
      !selectedYear ||
      !courseInfo.length ||
      selectedCourses.length === 0
    ) {
      return;
    }

    const fetchGradesData = async () => {
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

        // Create a map to store grades by student and course
        const studentGradesMap: Record<string, StudentGradesByMonth> = {};

        // Initialize students with the gradeDetails property
        selectedClassData.students.forEach((student) => {
          const studentCode = String(student.studentCode ?? "");
          studentGradesMap[studentCode] = {
            studentCode,
            studentName: `${student.studentName} ${student.studentlname}`,
            courseGrades: {},
            courseMonthlyGrades: {},
            average: null,
            weightedGradesInfo: [],
            gradeDetails: {},
          };
        });

        // Filter courses to only fetch selected ones
        const selectedCourseInfos = courseInfo.filter((course) => {
          const courseKey = `${course.teacherCode}_${course.courseCode}`;
          return selectedCourses.includes(courseKey);
        });

        // Fetch grades for each selected teacher/course
        const promises = selectedCourseInfos.map(async (course) => {
          const response = await fetch("/api/classsheet", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              classCode: selectedClass,
              teacherCode: course.teacherCode,
              courseCode: course.courseCode,
              schoolCode,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch grade data");
          }

          const cellData: CellData[] = await response.json();

          // Filter data based on selected months
          // Filter for multiple selected months
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

              // Check if this month is in the selected months
              const monthStr = cellMonth.toString();
              if (!selectedMonths.includes(monthStr)) return false;

              // Determine the correct year for the month
              // School year logic: months 7-12 from selected year, months 1-6 from next year
              const targetYear =
                cellMonth >= 7
                  ? parseInt(selectedYear)
                  : parseInt(selectedYear) + 1;

              return cellYear === targetYear;
            } catch (err) {
              console.error("Error processing date:", cell.date, err);
              return false;
            }
          });

          // Group data by student and month
          const studentGradesForCourse: Record<
            string,
            {
              grades: GradeEntry[];
              assessments: AssessmentEntry[];
              monthlyGrades: Record<
                string,
                { grades: GradeEntry[]; assessments: AssessmentEntry[] }
              >;
            }
          > = {};

          // Collect all grades and assessments for each student
          filteredCellData.forEach((cell) => {
            const studentCode = String(cell.studentCode ?? "");

            if (!studentGradesForCourse[studentCode]) {
              studentGradesForCourse[studentCode] = {
                grades: [],
                assessments: [],
                monthlyGrades: {},
              };
            }

            // Get month from date
            if (cell.date) {
              try {
                const cellDate = new Date(cell.date);
                const [, cellMonth] = gregorian_to_jalali(
                  cellDate.getFullYear(),
                  cellDate.getMonth() + 1,
                  cellDate.getDate()
                );

                const monthKey = cellMonth.toString();

                // Initialize month data if not exists
                if (
                  !studentGradesForCourse[studentCode].monthlyGrades[monthKey]
                ) {
                  studentGradesForCourse[studentCode].monthlyGrades[monthKey] =
                    {
                      grades: [],
                      assessments: [],
                    };
                }

                // Add grades for this month
                if (cell.grades && cell.grades.length > 0) {
                  studentGradesForCourse[studentCode].monthlyGrades[
                    monthKey
                  ].grades.push(...cell.grades);
                }

                // Add assessments for this month
                if (cell.assessments && cell.assessments.length > 0) {
                  studentGradesForCourse[studentCode].monthlyGrades[
                    monthKey
                  ].assessments.push(...cell.assessments);
                }
              } catch (err) {
                console.error(
                  "Error processing date for monthly grouping:",
                  cell.date,
                  err
                );
              }
            }

            // Add grades to overall collection
            if (cell.grades && cell.grades.length > 0) {
              studentGradesForCourse[studentCode].grades.push(...cell.grades);
            }

            // Add assessments to overall collection
            if (cell.assessments && cell.assessments.length > 0) {
              studentGradesForCourse[studentCode].assessments.push(
                ...cell.assessments
              );
            }
          });

          // Calculate average for each student (either monthly or yearly average)
          Object.entries(studentGradesForCourse).forEach(
            ([studentCode, data]) => {
              const courseKey = `${course.teacherCode}_${course.courseCode}`;

              if (studentGradesMap[studentCode]) {
                // Calculate monthly grades first
                const monthlyGrades: MonthlyGrade[] = [];
                Object.entries(data.monthlyGrades).forEach(
                  ([month, monthData]) => {
                    if (monthData.grades.length > 0) {
                      const monthlyScore = calculateFinalScore(
                        monthData.grades,
                        monthData.assessments,
                        courseKey
                      );

                      if (monthlyScore !== null) {
                        monthlyGrades.push({
                          month,
                          value: monthlyScore,
                        });
                      }
                    }
                  }
                );

                // Sort monthly grades by month number
                monthlyGrades.sort(
                  (a, b) => parseInt(a.month) - parseInt(b.month)
                );

                // Store monthly grades for tooltips
                if (
                  !studentGradesMap[studentCode].courseMonthlyGrades[courseKey]
                ) {
                  studentGradesMap[studentCode].courseMonthlyGrades[courseKey] =
                    [];
                }
                studentGradesMap[studentCode].courseMonthlyGrades[courseKey] =
                  monthlyGrades;

                // Store monthly grades for each selected month
                // We'll store individual month scores in courseMonthlyGrades
                // For display, we'll show each month separately in the table
                
                // Store grade details for each month
                Object.entries(data.monthlyGrades).forEach(([month, monthData]) => {
                  if (selectedMonths.includes(month)) {
                    const monthScore = calculateFinalScore(
                      monthData.grades,
                      monthData.assessments,
                      courseKey
                    );
                    
                    // Store month-specific grade in a structured way
                    const monthKey = `${courseKey}_${month}`;
                    if (!studentGradesMap[studentCode].gradeDetails[monthKey]) {
                      studentGradesMap[studentCode].gradeDetails[monthKey] = {
                        grades: monthData.grades,
                        assessments: monthData.assessments,
                      };
                    }
                  }
                });
              }
            }
          );
        });

        // Wait for all requests to complete
        await Promise.all(promises);

        // Calculate averages and convert to array
        const gradesArray = Object.values(studentGradesMap).map((student) => {
          // Only include selected courses
          const validCourseInfos = selectedCourseInfos.filter((course) => {
            const courseKey = `${course.teacherCode}_${course.courseCode}`;
            // Check if student has any grades for this course in selected months
            return selectedMonths.some((month) => {
              const monthKey = `${courseKey}_${month}`;
              return student.gradeDetails[monthKey] !== undefined;
            });
          });

          // Calculate weighted average based on vahed values
          let totalWeight = 0;
          let weightedSum = 0;
          const weightedGradesInfo: WeightedGradeInfo[] = [];

          // Calculate average for each course across selected months
          validCourseInfos.forEach((course) => {
            const courseKey = `${course.teacherCode}_${course.courseCode}`;
            const vahed = Number(course.vahed ?? 1) || 1;
            
            // Get grades for this course across all selected months
            const courseMonthGrades: number[] = [];
            selectedMonths.forEach((month) => {
              const monthKey = `${courseKey}_${month}`;
              const monthData = student.gradeDetails[monthKey];
              if (monthData) {
                const monthScore = calculateFinalScore(
                  monthData.grades,
                  monthData.assessments,
                  courseKey
                );
                if (monthScore !== null) {
                  courseMonthGrades.push(monthScore);
                }
              }
            });
            
            // Calculate average for this course across selected months
            if (courseMonthGrades.length > 0) {
              const courseAvg = courseMonthGrades.reduce((sum, g) => sum + g, 0) / courseMonthGrades.length;
              weightedSum += courseAvg * vahed;
              totalWeight += vahed;

              // Store detailed info for tooltip
              weightedGradesInfo.push({
                courseName: course.courseName,
                grade: courseAvg,
                vahed,
                weightedValue: courseAvg * vahed,
              });
            }
          });

          // Calculate final weighted average
          let average = null;
          if (totalWeight > 0) {
            // Round to 2 decimal places for consistency
            // Cap at 20 to ensure no average exceeds maximum
            average = Math.min(Math.round((weightedSum / totalWeight) * 100) / 100, 20);
          }

          return {
            ...student,
            average,
            weightedGradesInfo,
          };
        });

        setStudentGrades(gradesArray);
      } catch (error) {
        console.error("Error fetching grade data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGradesData();
  }, [
    selectedClass,
    selectedMonths,
    selectedCourses,
    selectedYear,
    courseInfo,
    classDocuments,
    schoolCode,
    calculateFinalScore,
    courseSpecificAssessmentValues,
  ]);

  // Calculate progress between two scores (as percentage)
  const calculateProgress = (
    currentScore: number | null,
    previousScore: number | null
  ): number | null => {
    if (currentScore === null || previousScore === null || previousScore === 0)
      return null;
    return ((currentScore - previousScore) / previousScore) * 100;
  };

  // Get a color class based on score value
  const getScoreColorClass = (score: number | null): string => {
    if (score === null) return "text-gray-400";
    if (score >= 18) return "text-green-600 font-bold";
    if (score >= 15) return "text-green-500";
    if (score >= 12) return "text-blue-500";
    if (score >= 10) return "text-orange-400";
    return "text-red-500";
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
  const getSortedItems = (items: StudentGradesByMonth[]) => {
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
      } else if (sortConfig.key === "average") {
        // Sort by average
        const aValue = a.average ?? -1;
        const bValue = b.average ?? -1;
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      } else {
        // Sort by a specific course
        const aValue = a.courseGrades[sortConfig.key] ?? -1;
        const bValue = b.courseGrades[sortConfig.key] ?? -1;
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

  // Add print function
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

  // Add export to Excel function
  const exportToExcel = async () => {
    if (!selectedClass || studentGrades.length === 0 || courseInfo.length === 0)
      return;

    // Get the selected class name
    const className =
      classDocuments.find((doc) => doc.data.classCode === selectedClass)?.data
        .className || "کلاس";

    // Get the month name
    const monthName =
      persianMonths.find((m) => m.value === selectedMonth)?.label || "";

    // Create a new workbook
    const workbook = new Excel.Workbook();

    // Add a worksheet
    const worksheet = workbook.addWorksheet("گزارش نمرات تمام دروس");

    // Set RTL direction for the worksheet
    worksheet.views = [{ rightToLeft: true }];

    // Set column headers (Student info + each course + average)
    const columns = [
      { header: "ردیف", key: "rowNumber", width: 10 },
      { header: "کد دانش‌آموز", key: "studentCode", width: 15 },
      { header: "نام دانش‌آموز", key: "studentName", width: 25 },
    ];

    // Add columns for each course
    courseInfo.forEach((course) => {
      const courseKey = `${course.teacherCode}_${course.courseCode}`;
      columns.push({
        header: `${course.courseName} (${course.vahed} واحد)`,
        key: courseKey,
        width: 18,
      });
    });

    // Add average column
    columns.push({ header: "میانگین", key: "average", width: 15 });

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
        average: number | null;
        [key: string]: number | string | null;
      }

      const rowData: RowData = {
        rowNumber: index + 1,
        studentCode: student.studentCode,
        studentName: student.studentName,
        average: student.average,
      };

      // Add course grades
      courseInfo.forEach((course) => {
        const courseKey = `${course.teacherCode}_${course.courseCode}`;
        rowData[courseKey] = student.courseGrades[courseKey] ?? "";
      });

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
        // Process grade columns (start from column 4)
        for (let colIndex = 4; colIndex <= columns.length; colIndex++) {
          const cell = row.getCell(colIndex);
          const value = cell.value as number;

          if (value && typeof value === "number") {
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
      }
    });

    // Add title
    worksheet.insertRow(1, []);
    worksheet.mergeCells(`A1:${String.fromCharCode(65 + columns.length - 1)}1`);
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `گزارش نمرات تمام دروس - ${className} - ${monthName} ${
      yearOptions.find((y) => y.value === selectedYear)?.label
    }`;
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
      `گزارش_نمرات_دروس_${selectedClass}_${monthName}_${
        yearOptions.find((y) => y.value === selectedYear)?.label
      }.xlsx`
    );
  };

  // Helper function to get month name by number
  const getMonthName = (monthNumber: string): string => {
    const month = persianMonths.find((m) => m.value === monthNumber);
    return month ? month.label : monthNumber;
  };

  // Helper function to format tooltip content for monthly grades
  const formatTooltipContent = (grades: MonthlyGrade[]): string => {
    if (!grades || grades.length === 0) return "اطلاعاتی موجود نیست";

    return grades
      .map(
        (grade) =>
          `${getMonthName(grade.month)}: ${toPersianDigits(
            grade.value.toFixed(2)
          )}`
      )
      .join("\n");
  };

  // Helper function to format the weighted average tooltip content
  const formatWeightedAverageTooltip = (info: WeightedGradeInfo[]): string => {
    if (!info || info.length === 0) return "اطلاعاتی موجود نیست";

    // Calculate total weights and sum for final display
    const totalWeight = info.reduce((sum, item) => sum + item.vahed, 0);
    const weightedSum = info.reduce((sum, item) => sum + item.weightedValue, 0);
    const average = Math.round((weightedSum / totalWeight) * 100) / 100;

    // Create detailed breakdown
    let tooltip = "محاسبه میانگین بر اساس واحد:\n\n";

    // Add each course's calculation
    info.forEach((item) => {
      const formattedGrade = toPersianDigits(item.grade.toFixed(2));
      const formattedVahed = toPersianDigits(item.vahed);
      const formattedWeighted = toPersianDigits(item.weightedValue.toFixed(2));

      tooltip += `${item.courseName}: ${formattedGrade} × ${formattedVahed} واحد = ${formattedWeighted}\n`;
    });

    // Add summary calculation
    tooltip += `\nمجموع: ${toPersianDigits(weightedSum.toFixed(2))}\n`;
    tooltip += `تعداد کل واحد: ${toPersianDigits(totalWeight)}\n`;
    tooltip += `میانگین نهایی: ${toPersianDigits(average.toFixed(2))}`;

    return tooltip;
  };

  // Add custom CSS for vertical text
  const verticalTextStyles = `
    .vertical-text {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      white-space: nowrap;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      line-height: 1.2;
    }
    
    .course-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    
    .vahed-badge {
      background-color: #e2e8f0;
      border-radius: 9999px;
      padding: 1px 4px;
      font-size: 0.65rem;
      margin-top: 2px;
    }
    
    .compact-table th,
    .compact-table td {
      padding: 4px 6px !important;
      font-size: 0.875rem;
    }
    
    .compact-table th {
      padding: 6px 6px !important;
    }
  `;

  // Add function to calculate ranks for students based on grades and average
  const calculateStudentRanks = useCallback(
    (students: StudentGradesByMonth[]) => {
      // Create maps to store rankings for each course and average
      const ranksByCourse: Record<string, Record<string, number>> = {};
      const averageRanks: Record<string, number> = {};

      // Initialize rank storage for each course
      courseInfo.forEach((course) => {
        const courseKey = `${course.teacherCode}_${course.courseCode}`;
        ranksByCourse[courseKey] = {};
      });

      // Calculate ranks for each course
      courseInfo.forEach((course) => {
        const courseKey = `${course.teacherCode}_${course.courseCode}`;

        // Get all students with scores for this course
        const studentsWithScores = students
          .map((student) => ({
            studentCode: student.studentCode,
            score: student.courseGrades[courseKey],
          }))
          .filter(
            (student) => student.score !== null && student.score !== undefined
          );

        // Sort students by score (descending)
        const sortedStudents = [...studentsWithScores].sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        );

        // Assign ranks (equal scores get the same rank)
        let currentRank = 1;
        let previousScore: number | null = null;

        sortedStudents.forEach((student, index) => {
          if (student.score !== previousScore) {
            // New score, assign new rank
            currentRank = index + 1;
          }

          ranksByCourse[courseKey][student.studentCode] = currentRank;
          previousScore = student.score;
        });
      });

      // Calculate ranks for average
      const studentsWithAvg = students
        .map((student) => ({
          studentCode: student.studentCode,
          average: student.average,
        }))
        .filter((student) => student.average !== null);

      // Sort students by average (descending)
      const sortedByAvg = [...studentsWithAvg].sort(
        (a, b) => (b.average ?? 0) - (a.average ?? 0)
      );

      // Assign ranks for average
      let currentRank = 1;
      let previousAvg: number | null = null;

      sortedByAvg.forEach((student, index) => {
        if (student.average !== previousAvg) {
          // New average, assign new rank
          currentRank = index + 1;
        }

        averageRanks[student.studentCode] = currentRank;
        previousAvg = student.average;
      });

      return { courseRanks: ranksByCourse, averageRanks };
    },
    [courseInfo]
  );

  // Use the memoized ranks
  const studentRanks = useMemo(
    () => calculateStudentRanks(studentGrades),
    [calculateStudentRanks, studentGrades]
  );

  // Add function to get rank badge styles
  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) return "bg-amber-100 text-amber-800 font-bold"; // Gold
    if (rank === 2) return "bg-slate-100 text-slate-700 font-bold"; // Silver
    if (rank === 3) return "bg-orange-100 text-orange-700 font-bold"; // Bronze
    return "bg-gray-100 text-gray-700"; // Default
  };

  // Add function to render rank badge
  const renderRankBadge = (rank: number | undefined) => {
    if (!showRankings || !rank || rank > 3) return null;

    const emoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";

    return (
      <div
        className={`text-[10px] mt-0.5 px-0.5 py-0 rounded-full ${getRankBadgeClass(
          rank
        )}`}
      >
        {emoji} {toPersianDigits(rank)}
      </div>
    );
  };

  // Fix the getTopStudent function to handle all edge cases and return types correctly
  const getTopStudent = (
    students: StudentGradesByMonth[],
    courseKey: string | "average"
  ): { name: string; score: number | null } | null => {
    if (students.length === 0) return null;

    if (courseKey === "average") {
      // Find top student by average
      const validStudents = students.filter(
        (student) => student.average !== null
      );
      if (validStudents.length === 0) return null;

      // Use a safer comparison approach
      let topStudent = validStudents[0];
      for (let i = 1; i < validStudents.length; i++) {
        if ((validStudents[i].average ?? 0) > (topStudent.average ?? 0)) {
          topStudent = validStudents[i];
        }
      }

      return {
        name: topStudent.studentName,
        score: topStudent.average,
      };
    } else {
      // Find top student for a specific course
      const validStudents = students.filter(
        (student) =>
          student.courseGrades[courseKey] !== null &&
          student.courseGrades[courseKey] !== undefined
      );

      if (validStudents.length === 0) return null;

      // Use a safer comparison approach
      let topStudent = validStudents[0];
      for (let i = 1; i < validStudents.length; i++) {
        if (
          (validStudents[i].courseGrades[courseKey] ?? 0) >
          (topStudent.courseGrades[courseKey] ?? 0)
        ) {
          topStudent = validStudents[i];
        }
      }

      return {
        name: topStudent.studentName,
        score: topStudent.courseGrades[courseKey],
      };
    }
  };

  // Create a function to calculate column averages
  const calculateColumnAverages = () => {
    if (studentGrades.length === 0) return {};

    const averages: Record<string, number | null> = {};

    // Calculate average for each course
    courseInfo.forEach((course) => {
      const courseKey = `${course.teacherCode}_${course.courseCode}`;
      const validGrades = studentGrades
        .map((student) => student.courseGrades[courseKey])
        .filter(
          (grade): grade is number => grade !== null && grade !== undefined
        );

      if (validGrades.length > 0) {
        const sum = validGrades.reduce((acc, grade) => acc + grade, 0);
        // Cap at 20 to ensure no average exceeds maximum
        averages[courseKey] =
          Math.min(Math.round((sum / validGrades.length) * 100) / 100, 20);
      } else {
        averages[courseKey] = null;
      }
    });

    // Calculate overall average
    const validAverages = studentGrades
      .map((student) => student.average)
      .filter((avg): avg is number => avg !== null && avg !== undefined);

    if (validAverages.length > 0) {
      const sum = validAverages.reduce((acc, avg) => acc + avg, 0);
      // Cap at 20 to ensure no overall average exceeds maximum
      averages.overall = Math.min(Math.round((sum / validAverages.length) * 100) / 100, 20);
    } else {
      averages.overall = null;
    }

    return averages;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />
      <style dangerouslySetInnerHTML={{ __html: verticalTextStyles }} />
      <div className={`space-y-6 ${isPrinting ? "printing" : ""}`} dir="rtl">
        <Card className="print:hidden">
          {/* <CardHeader>
            <CardTitle className="text-xl">فیلترها</CardTitle>
          </CardHeader> */}
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

            {/* Multi-select for months */}
            <div className="mt-4">
              <Label>انتخاب ماه‌ها</Label>
              <MultiSelect
                options={persianMonths.filter((m) => m.value !== "all").map((m) => ({
                  label: m.label,
                  value: m.value,
                }))}
                selected={selectedMonths}
                onChange={(values) => setSelectedMonths(values as string[])}
                placeholder="انتخاب ماه‌ها"
                disabled={!selectedClass || !selectedYear}
              />
            </div>

            {/* Multi-select for courses */}
            {courseInfo.length > 0 && (
              <div className="mt-4">
                <Label>انتخاب دروس</Label>
                <MultiSelect
                  options={courseInfo.map((course) => ({
                    label: `${course.courseName} (${course.vahed} واحد)`,
                    value: `${course.teacherCode}_${course.courseCode}`,
                  }))}
                  selected={selectedCourses}
                  onChange={(values) => setSelectedCourses(values as string[])}
                  placeholder="انتخاب دروس"
                  disabled={!selectedClass}
                />
              </div>
            )}

            {/* Add checkboxes for options */}
            <div className="flex items-center space-x-4 mt-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-rankings"
                  checked={showRankings}
                  onCheckedChange={(checked) => setShowRankings(checked === true)}
                />
                <Label htmlFor="show-rankings" className="cursor-pointer">
                  نمایش رتبه‌بندی
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-progress"
                  checked={showProgress}
                  onCheckedChange={(checked) => setShowProgress(checked === true)}
                />
                <Label htmlFor="show-progress" className="cursor-pointer">
                  نمایش پیشرفت
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : selectedClass && selectedMonths.length > 0 && selectedYear && selectedCourses.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  گزارش نمرات تمام دروس -{" "}
                  {selectedClass &&
                    classDocuments.find(
                      (doc) => doc.data.classCode === selectedClass
                    )?.data.className}{" "}
                  -{" "}
                  {selectedMonths.length > 0 &&
                    selectedMonths
                      .map((m) => persianMonths.find((pm) => pm.value === m)?.label)
                      .filter(Boolean)
                      .join("، ")}{" "}
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
              {studentGrades.length > 0 && selectedCourses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table dir="rtl" className="compact-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]" rowSpan={2}>ردیف</TableHead>
                        <TableHead className="w-[60px]" rowSpan={2}>کد</TableHead>
                        <TableHead
                          className="w-[120px] cursor-pointer"
                          rowSpan={2}
                          onClick={() => requestSort("studentName")}
                        >
                          نام دانش‌آموز <SortIcon column="studentName" />
                        </TableHead>

                        {/* Course headers with months */}
                        {courseInfo
                          .filter((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedCourses.includes(courseKey);
                          })
                          .map((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return (
                              <TableHead
                                key={courseKey}
                                colSpan={selectedMonths.length}
                                className="text-center bg-gray-50"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <div className="font-bold">{course.courseName}</div>
                                  <div className="text-xs text-gray-600">
                                    {course.vahed} واحد
                                  </div>
                                </div>
                              </TableHead>
                            );
                          })}

                        {/* Average column */}
                        <TableHead
                          className="w-[65px] font-bold cursor-pointer"
                          rowSpan={2}
                          onClick={() => requestSort("average")}
                        >
                          میانگین <SortIcon column="average" />
                        </TableHead>
                      </TableRow>
                      <TableRow>
                        {/* Month headers for each course */}
                        {courseInfo
                          .filter((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedCourses.includes(courseKey);
                          })
                          .map((course) => {
                            return selectedMonths.map((month) => {
                              const monthName = persianMonths.find((m) => m.value === month)?.label || month;
                              return (
                                <TableHead
                                  key={`${course.teacherCode}_${course.courseCode}_${month}`}
                                  className="w-[60px] text-center text-xs"
                                >
                                  {monthName}
                                </TableHead>
                              );
                            });
                          })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getSortedItems(studentGrades).map((student, index) => (
                        <TableRow key={student.studentCode}>
                          <TableCell className="p-1">{toPersianDigits(index + 1)}</TableCell>
                          <TableCell className="p-1">
                            {toPersianDigits(student.studentCode)}
                          </TableCell>
                          <TableCell className="p-1 text-sm">{student.studentName}</TableCell>

                          {/* Course grades for each selected month */}
                          {courseInfo
                            .filter((course) => {
                              const courseKey = `${course.teacherCode}_${course.courseCode}`;
                              return selectedCourses.includes(courseKey);
                            })
                            .map((course) => {
                              const courseKey = `${course.teacherCode}_${course.courseCode}`;
                              return selectedMonths.map((month, monthIndex) => {
                                const monthKey = `${courseKey}_${month}`;
                                const monthData = student.gradeDetails[monthKey];
                                const score = monthData
                                  ? calculateFinalScore(
                                      monthData.grades,
                                      monthData.assessments,
                                      courseKey
                                    )
                                  : null;

                                // Calculate progress from previous month
                                let progressElement = null;
                                if (showProgress && monthIndex > 0) {
                                  const prevMonth = selectedMonths[monthIndex - 1];
                                  const prevMonthKey = `${courseKey}_${prevMonth}`;
                                  const prevMonthData = student.gradeDetails[prevMonthKey];
                                  const prevScore = prevMonthData
                                    ? calculateFinalScore(
                                        prevMonthData.grades,
                                        prevMonthData.assessments,
                                        courseKey
                                      )
                                    : null;

                                  if (score !== null && prevScore !== null) {
                                    const progress = calculateProgress(score, prevScore);
                                    if (progress !== null) {
                                      const isPositive = progress >= 0;
                                      progressElement = (
                                        <div
                                          className={`text-[10px] mt-0.5 flex items-center ${
                                            isPositive
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {isPositive ? (
                                            <ChevronUpIcon className="h-3 w-3 mr-0.5" />
                                          ) : (
                                            <ChevronDownIcon className="h-3 w-3 mr-0.5" />
                                          )}
                                          <span>
                                            {toPersianDigits(
                                              Math.abs(progress).toFixed(1)
                                            )}
                                            %
                                          </span>
                                        </div>
                                      );
                                    }
                                  }
                                }

                                return (
                                  <TableCell
                                    key={monthKey}
                                    className={`${getScoreColorClass(score)} p-1`}
                                    title={
                                      monthData
                                        ? formatGradeCalculationTooltip(
                                            monthData.grades,
                                            monthData.assessments,
                                            courseKey
                                          )
                                        : ""
                                    }
                                    style={{
                                      cursor: monthData ? "help" : "default",
                                    }}
                                  >
                                    <div className="flex flex-col items-center gap-0.5">
                                      {score !== null
                                        ? toPersianDigits(score.toFixed(2))
                                        : "-"}
                                      {progressElement}
                                    </div>
                                  </TableCell>
                                );
                              });
                            })}

                          {/* Average */}
                          <TableCell
                            className={`font-bold p-1 ${
                              student.average !== null
                                ? getScoreColorClass(student.average)
                                : "text-gray-400"
                            }`}
                            title={
                              student.weightedGradesInfo.length > 0
                                ? formatWeightedAverageTooltip(
                                    student.weightedGradesInfo
                                  )
                                : ""
                            }
                            style={{
                              cursor:
                                student.weightedGradesInfo.length > 0
                                  ? "help"
                                  : "default",
                            }}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              {student.average !== null
                                ? toPersianDigits(student.average.toFixed(2))
                                : "-"}
                              {studentRanks.averageRanks[student.studentCode] <=
                                3 &&
                                renderRankBadge(
                                  studentRanks.averageRanks[student.studentCode]
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Add top students section */}
                    <tfoot className="bg-amber-50 border-t-2 border-amber-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-1 font-bold text-amber-800 text-sm"
                        >
                          نفرات برتر
                        </td>

                        {/* Course top students - show for each selected course and month */}
                        {courseInfo
                          .filter((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedCourses.includes(courseKey);
                          })
                          .map((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedMonths.map((month) => {
                              // For top students, we'll show the best score for this course/month combination
                              // This is a simplified version - you might want to calculate actual top students per month
                              return (
                                <td key={`top-${courseKey}-${month}`} className="p-1">
                                  -
                                </td>
                              );
                            });
                          })}

                        {/* Average top student */}
                        <td className="p-1">
                          {(() => {
                            const topStudent = getTopStudent(
                              studentGrades,
                              "average"
                            );

                            if (!topStudent) return "-";

                            return (
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="text-amber-800 text-[10px]">
                                  🏆 نفر اول
                                </div>
                                <div className="font-bold text-amber-800 text-xs">
                                  {topStudent.score !== null
                                    ? toPersianDigits(
                                        topStudent.score.toFixed(2)
                                      )
                                    : "-"}
                                </div>
                                <div
                                  className="text-[10px] text-amber-800 truncate max-w-[50px]"
                                  title={topStudent.name}
                                >
                                  {topStudent.name}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>

                      {/* Column averages row */}
                      <tr className="bg-blue-50">
                        <td colSpan={3} className="p-1 font-bold text-blue-800 text-sm">
                          میانگین ستون‌ها
                        </td>

                        {/* Course column averages - show for each selected course and month */}
                        {courseInfo
                          .filter((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedCourses.includes(courseKey);
                          })
                          .map((course) => {
                            const courseKey = `${course.teacherCode}_${course.courseCode}`;
                            return selectedMonths.map((month) => {
                              // Calculate average for this course/month combination
                              const monthKey = `${courseKey}_${month}`;
                              const validGrades = studentGrades
                                .map((student) => {
                                  const monthData = student.gradeDetails[monthKey];
                                  return monthData
                                    ? calculateFinalScore(
                                        monthData.grades,
                                        monthData.assessments,
                                        courseKey
                                      )
                                    : null;
                                })
                                .filter((grade): grade is number => grade !== null);

                              const average =
                                validGrades.length > 0
                                  ? validGrades.reduce((sum, g) => sum + g, 0) /
                                    validGrades.length
                                  : null;

                              return (
                                <td key={`avg-${monthKey}`} className="p-1">
                                  <div className="flex flex-col items-center">
                                    <div className="font-bold text-blue-800 text-xs">
                                      {average !== null
                                        ? toPersianDigits(average.toFixed(2))
                                        : "-"}
                                    </div>
                                  </div>
                                </td>
                              );
                            });
                          })}

                        {/* Overall average */}
                        <td className="p-1">
                          {(() => {
                            const columnAverages = calculateColumnAverages();
                            const overallAverage = columnAverages.overall;

                            return (
                              <div className="flex flex-col items-center">
                                <div className="font-bold text-blue-800 text-xs">
                                  {overallAverage !== null
                                    ? toPersianDigits(overallAverage.toFixed(2))
                                    : "-"}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500">
                  {studentGrades.length === 0
                    ? "نمره‌ای برای ماه‌های انتخاب شده ثبت نشده است."
                    : "لطفاً درس و ماه انتخاب کنید."}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-8 text-gray-500">
            لطفاً کلاس، ماه‌ها و دروس را انتخاب کنید تا گزارش نمرات نمایش داده شود.
          </div>
        )}
      </div>
    </>
  );
};

export default MonthlyGradeOverallReport;
