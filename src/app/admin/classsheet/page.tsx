// components/ClassSheet.jsx

"use client";
// components/ClassSheet.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  PlusIcon,
  XMarkIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Helper function: Convert Gregorian to Jalali
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
    .map((digit) => persianDigits[parseInt(digit, 10)])
    .join("");
}

// Helper function: Convert a Date object to a formatted Jalali date string.
function formatJalaliDate(date: Date) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);
  const jYear = toPersianDigits(jy);
  const jMonth = toPersianDigits(jm.toString().padStart(2, "0"));
  const jDay = toPersianDigits(jd.toString().padStart(2, "0"));
  return `${jYear}/${jMonth}/${jDay}`;
}

type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type TeacherCourse = {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: WeeklySchedule[];
  weeklySchedule_expanded?: boolean;
};

type Student = {
  studentCode: number;
  studentName: string;
  studentlname: string;
  phone: string;
};

type GradeEntry = {
  value: number;
  description: string;
  date: string;
  totalPoints?: number; // Maximum possible points for this grade
};

type PresenceStatus = "present" | "absent" | "late";

type AssessmentEntry = {
  title: string;
  value: string;
  date: string;
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
  presenceStatus: PresenceStatus;
  descriptiveStatus?: string;
  assessments?: AssessmentEntry[]; // New field for assessment pairs
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

type CourseOption = {
  value: string;
  teacherCode: string;
  courseCode: string;
  label: string;
  weeklySchedule: WeeklySchedule[];
};

type Column = {
  date: Date;
  day: string;
  timeSlot: string;
  formattedDate: string;
};

// Predefined assessment options
const ASSESSMENT_TITLES = [
  "مهارت تفکر",
  "مهارت همکاری",
  "مشارکت در کلاس",
  "انجام تکالیف",
  "خلاقیت",
  "نظم و انضباط",
  "مسئولیت پذیری",
];

const ASSESSMENT_VALUES = ["عالی", "خوب", "متوسط", "ضعیف", "بسیار ضعیف"];

type AssessmentOption = {
  _id: string;
  schoolCode: string;
  teacherCode?: string;
  type: "title" | "value";
  value: string;
  isGlobal: boolean;
  createdAt: string;
};

// Helper function: Get Persian month name
function getPersianMonthName(month: number): string {
  const persianMonths = [
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
  return persianMonths[month - 1];
}

// Helper function: Check if date is last day of Persian month
// This function may be useful in the future for other date calculations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isLastDayOfPersianMonth(date: Date): boolean {
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const jalaliToday = gregorian_to_jalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const jalaliTomorrow = gregorian_to_jalali(
    tomorrow.getFullYear(),
    tomorrow.getMonth() + 1,
    tomorrow.getDate()
  );

  // If the month changes in Jalali calendar, it's the last day
  return jalaliToday[1] !== jalaliTomorrow[1];
}

const ClassSheet = ({
  schoolCode = "2295566177",
  teacherCode = "102",
  courseCode = "11131",
}: {
  schoolCode?: string;
  teacherCode?: string;
  courseCode?: string;
}) => {
  // Dummy class document data.
  const classDocument: ClassDocument = {
    data: {
      classCode: "232",
      className: "دوم سیب",
      major: "16000",
      Grade: "11",
      schoolCode: "2295566177",
      teachers: [
        {
          teacherCode: "102",
          courseCode: "11131",
          weeklySchedule: [
            { day: "سه‌شنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "10" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "we",
          courseCode: "11111",
          weeklySchedule: [
            { day: "شنبه", timeSlot: "8" },
            { day: "پنج‌شنبه", timeSlot: "7" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "102",
          courseCode: "22222",
          weeklySchedule: [
            { day: "چهارشنبه", timeSlot: "11" },
            { day: "پنج‌شنبه", timeSlot: "12" },
          ],
          weeklySchedule_expanded: true,
        },
      ],
      teachers_expanded: true,
      students: [
        {
          studentCode: 2295845241,
          studentName: "رضا",
          studentlname: "شیری",
          phone: "9175231560",
        },
        {
          studentCode: 2286655145,
          studentName: "محمود",
          studentlname: "قادری",
          phone: "9120011451",
        },
        {
          studentCode: 2295566177,
          studentName: "نیما",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
        {
          studentCode: 2295566173,
          studentName: "قاسم",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
      ],
    },
  };

  // Compute default start and end dates in Gregorian.
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 7); // one week before today
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultStart.getDate() + 14); // two weeks after default start

  // Initialize useState hooks outside of conditionals
  const [selectedOption, setSelectedOption] = useState<
    CourseOption | undefined
  >(undefined);
  const [startDate, setStartDate] = useState<Value>(defaultStart);
  const [endDate, setEndDate] = useState<Value>(defaultEnd);

  // Build teacher–course options (filter by teacherCode if provided).
  const teacherCourses = teacherCode
    ? classDocument.data.teachers.filter((t) => t.teacherCode === teacherCode)
    : classDocument.data.teachers;

  const courseOptions: CourseOption[] = teacherCourses.map((t) => ({
    value: `${t.teacherCode}-${t.courseCode}`,
    teacherCode: t.teacherCode,
    courseCode: t.courseCode,
    label: `معلم ${t.teacherCode} - درس ${t.courseCode}`,
    weeklySchedule: t.weeklySchedule,
  }));

  // Determine the initial selection.
  const initialSelected =
    courseCode &&
    courseOptions.find((option) => option.courseCode === courseCode)
      ? courseOptions.find((option) => option.courseCode === courseCode)
      : courseOptions[0];

  // Set selectedOption if it's still undefined (first render)
  useEffect(() => {
    if (!selectedOption && initialSelected) {
      setSelectedOption(initialSelected);
    }
  }, [initialSelected, selectedOption]);

  // State for the modal and cell data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    studentCode: number;
    columnIndex: number;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [presenceStatus, setPresenceStatus] =
    useState<PresenceStatus>("present");
  const [descriptiveStatus, setDescriptiveStatus] = useState<string>("");
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [assessments, setAssessments] = useState<AssessmentEntry[]>([]);
  const [newAssessment, setNewAssessment] = useState<AssessmentEntry>({
    title: "",
    value: "",
    date: new Date().toISOString(),
  });
  const [newGrade, setNewGrade] = useState<GradeEntry>({
    value: 0,
    description: "",
    date: new Date().toISOString(),
    totalPoints: 20,
  });
  const [cellsData, setCellsData] = useState<Record<string, CellData>>({});
  const [isLoading, setIsLoading] = useState(false);

  // State for assessments management
  const [assessmentTitles, setAssessmentTitles] =
    useState<string[]>(ASSESSMENT_TITLES);
  const [assessmentValues, setAssessmentValues] =
    useState<string[]>(ASSESSMENT_VALUES);
  const [customAssessmentTitle, setCustomAssessmentTitle] =
    useState<string>("");
  const [customAssessmentValue, setCustomAssessmentValue] =
    useState<string>("");
  const [isAddingTitle, setIsAddingTitle] = useState<boolean>(false);
  const [isAddingValue, setIsAddingValue] = useState<boolean>(false);

  // Create a unique key for each cell
  const getCellKey = (studentCode: number, column: Column) => {
    // Format the date as YYYY-MM-DD to ensure consistency
    const dateStr = column.date.toISOString().split("T")[0];

    return `${classDocument.data.classCode}_${studentCode}_${selectedOption?.teacherCode}_${selectedOption?.courseCode}_${schoolCode}_${dateStr}_${column.timeSlot}`;
  };

  // Format a cell key from database record
  const formatCellKeyFromDB = (cell: CellData) => {
    // Convert the date string to YYYY-MM-DD format
    const dateStr = new Date(cell.date).toISOString().split("T")[0];

    return `${cell.classCode}_${cell.studentCode}_${cell.teacherCode}_${cell.courseCode}_${cell.schoolCode}_${dateStr}_${cell.timeSlot}`;
  };

  // Load saved cell data when component mounts or when selected option changes
  useEffect(() => {
    const loadCellData = async () => {
      if (!selectedOption) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/classsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classCode: classDocument.data.classCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cell data");
        }

        const data = await response.json();
        console.log("Loaded data:", data);

        // Convert array of cell data to a dictionary for easier access
        const cellsDataMap: Record<string, CellData> = {};
        data.forEach((cell: CellData) => {
          const key = formatCellKeyFromDB(cell);
          cellsDataMap[key] = {
            ...cell,
            // Ensure these properties exist with defaults if they don't
            grades: cell.grades || [],
            presenceStatus: cell.presenceStatus || "present",
            note: cell.note || "",
            descriptiveStatus: cell.descriptiveStatus || "",
            assessments: cell.assessments || [],
          };
        });

        console.log("Cell data map:", cellsDataMap);
        setCellsData(cellsDataMap);
      } catch (error) {
        console.error("Error loading cell data:", error);
        toast.error("Failed to load saved data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCellData();
  }, [selectedOption, classDocument.data.classCode, schoolCode]);

  // Load custom assessment options
  useEffect(() => {
    const loadAssessmentOptions = async () => {
      try {
        const response = await fetch(
          `/api/assessments?schoolCode=${schoolCode}${
            teacherCode ? `&teacherCode=${teacherCode}` : ""
          }`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assessment options");
        }

        const { data } = await response.json();

        // Process the data
        const titles = data
          .filter((item: AssessmentOption) => item.type === "title")
          .map((item: AssessmentOption) => item.value);
        const values = data
          .filter((item: AssessmentOption) => item.type === "value")
          .map((item: AssessmentOption) => item.value);

        // Merge with default options (avoiding duplicates)
        const mergedTitles = [...new Set([...ASSESSMENT_TITLES, ...titles])];
        const mergedValues = [...new Set([...ASSESSMENT_VALUES, ...values])];

        setAssessmentTitles(mergedTitles);
        setAssessmentValues(mergedValues);
      } catch (error) {
        console.error("Error loading assessment options:", error);
      }
    };

    if (schoolCode) {
      loadAssessmentOptions();
    }
  }, [schoolCode, teacherCode]);

  // Handle cell click and display
  const getCellContent = (
    studentCode: number,
    column: Column
  ): CellData | null => {
    const cellKey = getCellKey(studentCode, column);

    // Debug: Log the cell key we're trying to find
    if (process.env.NODE_ENV === "development") {
      const simpleDateStr = column.date.toISOString().split("T")[0];
      console.log(
        `Looking for cell: ${studentCode}-${simpleDateStr}-${column.timeSlot}`,
        `Key: ${cellKey}`,
        `Has data: ${cellsData[cellKey] ? "Yes" : "No"}`
      );
    }

    // Try to find the note in our cellsData
    if (cellsData[cellKey]) {
      return cellsData[cellKey];
    }

    // Try alternative key formats in case of date format issues
    // Create a simpler key without time part
    const dateStr = column.date.toISOString();
    const simpleDateKey = `${classDocument.data.classCode}_${studentCode}_${
      selectedOption?.teacherCode
    }_${selectedOption?.courseCode}_${schoolCode}_${
      dateStr.split("T")[0]
    }T00:00:00.000Z_${column.timeSlot}`;

    if (cellsData[simpleDateKey]) {
      return cellsData[simpleDateKey];
    }

    // If still not found, try to find by iterating through all keys
    const prefix = `${classDocument.data.classCode}_${studentCode}_${selectedOption?.teacherCode}_${selectedOption?.courseCode}_${schoolCode}_`;
    const datePart = column.date.toISOString().split("T")[0]; // Just the YYYY-MM-DD part

    for (const key of Object.keys(cellsData)) {
      if (
        key.startsWith(prefix) &&
        key.includes(datePart) &&
        key.endsWith(`_${column.timeSlot}`)
      ) {
        return cellsData[key];
      }
    }

    return null;
  };

  // Handle cell click
  const handleCellClick = (
    studentCode: number,
    columnIndex: number,
    column: Column
  ) => {
    setSelectedCell({ studentCode, columnIndex });

    // Get the existing data for this cell, if any
    const cellData = getCellContent(studentCode, column);

    if (cellData) {
      setNoteText(cellData.note || "");
      setPresenceStatus(cellData.presenceStatus || "present");
      setGrades(cellData.grades || []);
      setDescriptiveStatus(cellData.descriptiveStatus || "");
      setAssessments(cellData.assessments || []);
    } else {
      setNoteText("");
      setPresenceStatus("present");
      setGrades([]);
      setDescriptiveStatus("");
      setAssessments([]);
    }

    setIsModalOpen(true);
  };

  // Add a new grade
  const handleAddGrade = () => {
    if (newGrade.value <= 0) {
      toast.error("Grade value must be greater than 0");
      return;
    }

    if (!newGrade.totalPoints || newGrade.totalPoints <= 0) {
      toast.error("Total points must be greater than 0");
      return;
    }

    if (newGrade.value > newGrade.totalPoints) {
      toast.error("Grade cannot exceed total points");
      return;
    }

    setGrades([...grades, { ...newGrade, date: new Date().toISOString() }]);
    setNewGrade({
      value: 0,
      description: "",
      date: new Date().toISOString(),
      totalPoints: newGrade.totalPoints, // Preserve the last used total points
    });
  };

  // Remove a grade
  const handleRemoveGrade = (index: number) => {
    const newGrades = [...grades];
    newGrades.splice(index, 1);
    setGrades(newGrades);
  };

  // Add a new assessment
  const handleAddAssessment = () => {
    if (!newAssessment.title) {
      toast.error("Assessment title is required");
      return;
    }

    if (!newAssessment.value) {
      toast.error("Assessment value is required");
      return;
    }

    setAssessments([
      ...assessments,
      { ...newAssessment, date: new Date().toISOString() },
    ]);
    setNewAssessment({
      title: "",
      value: "",
      date: new Date().toISOString(),
    });
  };

  // Remove an assessment
  const handleRemoveAssessment = (index: number) => {
    const newAssessments = [...assessments];
    newAssessments.splice(index, 1);
    setAssessments(newAssessments);
  };

  // Save the note
  const handleSaveNote = async () => {
    if (!selectedCell || !selectedOption) return;

    const column = columns[selectedCell.columnIndex];
    const cellKey = getCellKey(selectedCell.studentCode, column);

    setIsLoading(true);
    try {
      const cellData = {
        classCode: classDocument.data.classCode,
        studentCode: selectedCell.studentCode,
        teacherCode: selectedOption.teacherCode,
        courseCode: selectedOption.courseCode,
        schoolCode: schoolCode,
        date: column.date.toISOString().split("T")[0], // Use YYYY-MM-DD format
        timeSlot: column.timeSlot,
        note: noteText,
        grades: grades,
        presenceStatus: presenceStatus,
        descriptiveStatus: descriptiveStatus,
        assessments: assessments,
      };

      const response = await fetch("/api/classsheet/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cellData),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      // Update local state
      setCellsData((prev) => ({
        ...prev,
        [cellKey]: cellData,
      }));

      toast.success("Cell data saved successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving cell data:", error);
      toast.error("Failed to save cell data");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate average grade - kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateAverageGrade = (grades: GradeEntry[]): number | null => {
    if (!grades || grades.length === 0) return null;
    const sum = grades.reduce((total, grade) => total + grade.value, 0);
    return parseFloat((sum / grades.length).toFixed(2));
  };

  // Return early if no matching school code
  if (classDocument.data.schoolCode !== schoolCode) {
    return (
      <div className="p-4 text-center text-red-500">
        No class data available for the provided school code.
      </div>
    );
  }

  // Return early if no course options
  if (courseOptions.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        No teacher courses available.
      </div>
    );
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const option = courseOptions.find((opt) => opt.value === selectedValue);
    setSelectedOption(option);
  };

  // Function to navigate dates forward or backward by two weeks
  const navigateTwoWeeks = (direction: "forward" | "backward") => {
    const startDt =
      startDate instanceof Date ? startDate : new Date(startDate as string);
    const endDt =
      endDate instanceof Date ? endDate : new Date(endDate as string);

    const daysToAdjust = direction === "forward" ? 14 : -14;

    startDt.setDate(startDt.getDate() + daysToAdjust);
    endDt.setDate(endDt.getDate() + daysToAdjust);

    setStartDate(startDt);
    setEndDate(endDt);
  };

  // Helper: Map JavaScript's getDay() to Persian day names (week starting from "شنبه").
  const getPersianDayName = (date: Date) => {
    // In JavaScript: 0 = Sunday, 1 = Monday, …, 6 = Saturday.
    // Mapping for a Persian week starting with "شنبه":
    const mapping: Record<number, string> = {
      6: "شنبه",
      0: "یکشنبه",
      1: "دوشنبه",
      2: "سه‌شنبه",
      3: "چهارشنبه",
      4: "پنج‌شنبه",
      5: "جمعه",
    };
    return mapping[date.getDay()];
  };

  // Compute dynamic columns based on the date range.
  const columns: Column[] = [];
  const monthlyGradeColumns: Column[] = [];

  if (startDate && endDate) {
    const start =
      startDate instanceof Date ? startDate : new Date(startDate as string);
    const end = endDate instanceof Date ? endDate : new Date(endDate as string);

    // Track processed months to avoid duplicates
    const processedMonths = new Set<string>();

    // Iterate through each day in the range (inclusive).
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const persianDay = getPersianDayName(currentDate);

      // Get the Jalali date for the current date
      const jalaliDate = gregorian_to_jalali(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        currentDate.getDate()
      );

      const persianMonth = jalaliDate[1];
      const monthYearKey = `${jalaliDate[0]}-${persianMonth}`;

      // For each schedule slot, if its day matches the current date's Persian day name, add a column.
      if (selectedOption && selectedOption.weeklySchedule) {
        selectedOption.weeklySchedule.forEach((slot) => {
          if (slot.day === persianDay) {
            columns.push({
              date: new Date(currentDate),
              day: slot.day,
              timeSlot: slot.timeSlot,
              formattedDate: formatJalaliDate(currentDate),
            });

            // Add a monthly grade column for each unique month in the date range
            // But only add it once per month
            if (!processedMonths.has(monthYearKey)) {
              processedMonths.add(monthYearKey);

              // Create a date for the 15th of the month (middle of month) to avoid date calculation issues
              const monthColumnDate = new Date(currentDate);

              monthlyGradeColumns.push({
                date: monthColumnDate,
                day: "monthly",
                timeSlot: "grade",
                formattedDate: getPersianMonthName(persianMonth),
              });
            }
          }
        });
      }
    }
  }

  // Combine regular columns with month summary columns and sort chronologically
  // Place monthly columns at the end of their respective months
  const allColumns: Column[] = [];

  // Group columns by month
  const columnsByMonth = new Map<string, Column[]>();

  // Add all regular columns to their respective month groups
  columns.forEach((col) => {
    const jalaliDate = gregorian_to_jalali(
      col.date.getFullYear(),
      col.date.getMonth() + 1,
      col.date.getDate()
    );
    const monthYearKey = `${jalaliDate[0]}-${jalaliDate[1]}`;

    if (!columnsByMonth.has(monthYearKey)) {
      columnsByMonth.set(monthYearKey, []);
    }

    columnsByMonth.get(monthYearKey)!.push(col);
  });

  // For each month group, add regular columns followed by the monthly column
  // Sort months chronologically
  const sortedMonthKeys = Array.from(columnsByMonth.keys()).sort();

  sortedMonthKeys.forEach((monthYearKey) => {
    const [year, month] = monthYearKey.split("-").map(Number);

    // Get and sort the regular columns for this month
    const monthColumns = columnsByMonth.get(monthYearKey) || [];
    monthColumns.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Add the regular columns
    allColumns.push(...monthColumns);

    // Find the monthly column for this month
    const monthlyColumn = monthlyGradeColumns.find((col) => {
      const jalaliDate = gregorian_to_jalali(
        col.date.getFullYear(),
        col.date.getMonth() + 1,
        col.date.getDate()
      );
      return jalaliDate[0] === year && jalaliDate[1] === month;
    });

    // Add the monthly grade column if it exists
    if (monthlyColumn) {
      allColumns.push(monthlyColumn);
    }
  });

  // If no columns were added (can happen if there are no regular columns but there are monthly columns),
  // add all monthly columns at the end
  if (allColumns.length === 0 && monthlyGradeColumns.length > 0) {
    monthlyGradeColumns.sort((a, b) => a.date.getTime() - b.date.getTime());
    allColumns.push(...monthlyGradeColumns);
  }

  const { students } = classDocument.data;

  // Handle adding custom assessment title
  const handleAddCustomTitle = async () => {
    if (!customAssessmentTitle.trim()) {
      toast.error("عنوان ارزیابی نمی‌تواند خالی باشد");
      return;
    }

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolCode,
          teacherCode,
          type: "title",
          value: customAssessmentTitle.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add assessment title");
      }

      // Update local state
      setAssessmentTitles([...assessmentTitles, customAssessmentTitle.trim()]);
      setCustomAssessmentTitle("");
      setIsAddingTitle(false);
      toast.success("عنوان ارزیابی با موفقیت افزوده شد");
    } catch (error) {
      console.error("Error adding assessment title:", error);
      toast.error(
        error instanceof Error ? error.message : "خطا در افزودن عنوان ارزیابی"
      );
    }
  };

  // Handle adding custom assessment value
  const handleAddCustomValue = async () => {
    if (!customAssessmentValue.trim()) {
      toast.error("مقدار ارزیابی نمی‌تواند خالی باشد");
      return;
    }

    try {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolCode,
          teacherCode,
          type: "value",
          value: customAssessmentValue.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add assessment value");
      }

      // Update local state
      setAssessmentValues([...assessmentValues, customAssessmentValue.trim()]);
      setCustomAssessmentValue("");
      setIsAddingValue(false);
      toast.success("مقدار ارزیابی با موفقیت افزوده شد");
    } catch (error) {
      console.error("Error adding assessment value:", error);
      toast.error(
        error instanceof Error ? error.message : "خطا در افزودن مقدار ارزیابی"
      );
    }
  };

  return (
    <div className="p-6 bg-gray-100" dir="rtl">
      {/* Teacher-Course Selection */}
      <div className="mb-6">
        <label
          htmlFor="course-select"
          className="block mb-2 text-lg font-medium text-gray-700"
        >
          انتخاب معلم-درس:
        </label>
        <select
          id="course-select"
          value={selectedOption?.value}
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {courseOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range and Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateTwoWeeks("backward")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            دو هفته قبل
          </button>

          <div className="text-center text-lg font-medium">
            {formatJalaliDate(
              startDate instanceof Date
                ? startDate
                : new Date(startDate as string)
            )}{" "}
            تا{" "}
            {formatJalaliDate(
              endDate instanceof Date ? endDate : new Date(endDate as string)
            )}
          </div>

          <button
            onClick={() => navigateTwoWeeks("forward")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            دو هفته بعد
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              تاریخ شروع:
            </label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
              }}
              format="YYYY/MM/DD"
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              calendarPosition="bottom-right"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              تاریخ پایان:
            </label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
              }}
              format="YYYY/MM/DD"
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              calendarPosition="bottom-right"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Schedule Sheet */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow rounded-lg table-fixed">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="sticky right-0 z-10 px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 bg-blue-600">
                نام دانش‌آموز
              </th>
              {allColumns.length > 0 ? (
                allColumns.map((col, index) => (
                  <th
                    key={index}
                    className={`px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 text-sm whitespace-normal ${
                      col.day === "monthly" ? "bg-purple-600" : ""
                    }`}
                  >
                    {col.day === "monthly"
                      ? `نمره ماهانه ${col.formattedDate}`
                      : `${col.day}-زنگ ${col.timeSlot} (${col.formattedDate})`}
                  </th>
                ))
              ) : (
                <th className="px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300">
                  لطفاً تاریخ شروع و پایان را وارد کنید
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {students.map((student) => {
              const fullName = `${student.studentName} ${student.studentlname}`;
              return (
                <tr key={student.studentCode} className="hover:bg-gray-50">
                  <td className="sticky right-0 z-10 px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 bg-white">
                    {fullName}
                  </td>
                  {allColumns.map((col, index) => {
                    // Special handling for monthly grade columns
                    if (col.day === "monthly") {
                      // Get all cells for this student in this month
                      const monthCells = columns
                        .filter((regCol) => {
                          // Get Jalali month for regular column
                          const regDate = gregorian_to_jalali(
                            regCol.date.getFullYear(),
                            regCol.date.getMonth() + 1,
                            regCol.date.getDate()
                          );
                          // Get Jalali month for summary column
                          const summaryDate = gregorian_to_jalali(
                            col.date.getFullYear(),
                            col.date.getMonth() + 1,
                            col.date.getDate()
                          );
                          // Compare months
                          return regDate[1] === summaryDate[1];
                        })
                        .map((monthCol) =>
                          getCellContent(student.studentCode, monthCol)
                        )
                        .filter((cell) => cell !== null) as CellData[];

                      // Calculate monthly grade if there are any grades
                      const allGrades = monthCells.flatMap(
                        (cell) => cell.grades || []
                      );
                      const hasGrades = allGrades.length > 0;
                      let monthlyGrade = "-";
                      let gradeColor = "bg-gray-300";

                      if (hasGrades) {
                        const totalValue = allGrades.reduce(
                          (sum, grade) => sum + grade.value,
                          0
                        );
                        const totalPoints = allGrades.reduce(
                          (sum, grade) => sum + (grade.totalPoints || 20),
                          0
                        );
                        const calculatedGrade = (
                          (totalValue / totalPoints) *
                          20
                        ).toFixed(2);
                        monthlyGrade = calculatedGrade;

                        // Color based on grade value
                        const gradeValue = parseFloat(calculatedGrade);
                        if (gradeValue >= 16)
                          gradeColor = "bg-green-600 text-white";
                        else if (gradeValue >= 12)
                          gradeColor = "bg-amber-500 text-white";
                        else gradeColor = "bg-red-600 text-white";
                      }

                      return (
                        <td
                          key={`monthly-grade-${student.studentCode}-${index}`}
                          className="px-2 py-2 w-[150px] min-w-[150px] text-center border border-gray-300 bg-purple-50"
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-bold mb-1">
                              نمره ماهانه
                            </div>
                            <Badge
                              className={`text-sm font-bold ${gradeColor}`}
                            >
                              {monthlyGrade}
                            </Badge>
                            <div className="text-xs mt-1 text-gray-500">
                              تعداد نمرات: {allGrades.length}
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Regular cell handling (existing code)
                    const cellData = getCellContent(student.studentCode, col);

                    // Prepare cell display content
                    let displayContent: React.ReactNode = "*";

                    if (cellData) {
                      // Prepare the cell content
                      displayContent = (
                        <div className="flex flex-col items-center gap-1 h-full w-full">
                          {/* Presence Status Badge */}
                          <div className="w-full text-center">
                            {cellData.presenceStatus === "present" && (
                              <Badge className="bg-green-500 text-white">
                                حاضر
                              </Badge>
                            )}
                            {cellData.presenceStatus === "absent" && (
                              <Badge className="bg-red-500 text-white">
                                غایب
                              </Badge>
                            )}
                            {cellData.presenceStatus === "late" && (
                              <Badge className="bg-amber-500 text-white">
                                تاخیر
                              </Badge>
                            )}
                          </div>

                          {/* Descriptive Status Badge (if any) */}
                          {cellData.descriptiveStatus && (
                            <div className="w-full text-center mt-1">
                              <Badge className="bg-purple-500 text-white">
                                {cellData.descriptiveStatus}
                              </Badge>
                            </div>
                          )}

                          {/* Assessments (if any) */}
                          {cellData.assessments &&
                            cellData.assessments.length > 0 && (
                              <div className="w-full text-center mt-1">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {cellData.assessments.map(
                                    (assessment, idx) => (
                                      <div
                                        key={idx}
                                        className="relative group"
                                        title={`${assessment.title}: ${assessment.value}`}
                                      >
                                        <Badge className="bg-blue-500 text-white">
                                          {assessment.title.substring(0, 2)}
                                        </Badge>
                                        <div className="absolute bottom-full mb-1 z-50 w-32 bg-gray-800 text-white text-xs rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                          {assessment.title}: {assessment.value}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Grades Section */}
                          {cellData.grades && cellData.grades.length > 0 && (
                            <div className="w-full mt-1">
                              {/* Individual Grades */}
                              <div className="flex flex-wrap gap-1 justify-center">
                                {cellData.grades.map((grade, idx) => {
                                  // Calculate percentage for proper color coding
                                  const totalPoints = grade.totalPoints || 20;
                                  const percentage =
                                    (grade.value / totalPoints) * 100;

                                  return (
                                    <div
                                      key={idx}
                                      className="relative group"
                                      title={
                                        grade.description ||
                                        `نمره: ${grade.value} از ${totalPoints}`
                                      }
                                    >
                                      <Badge
                                        className={`
                                          ${
                                            percentage >= 80
                                              ? "bg-green-600"
                                              : percentage >= 60
                                              ? "bg-amber-500"
                                              : "bg-red-600"
                                          }
                                        `}
                                      >
                                        {grade.value}/{totalPoints}
                                      </Badge>
                                      {grade.description && (
                                        <div className="absolute bottom-full mb-1 z-50 w-32 bg-gray-800 text-white text-xs rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                          {grade.description}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Note Text (if any) */}
                          {cellData.note && cellData.note.trim() !== "" && (
                            <div className="text-xs truncate mt-1 text-gray-700 max-w-full">
                              {cellData.note.length > 30
                                ? `${cellData.note.substring(0, 30)}...`
                                : cellData.note}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <td
                        key={`cell-${student.studentCode}-${index}`}
                        className="px-2 py-2 w-[150px] min-w-[150px] h-14 text-center border border-gray-300 cursor-pointer hover:bg-gray-200 overflow-hidden"
                        onClick={() =>
                          handleCellClick(student.studentCode, index, col)
                        }
                      >
                        {displayContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Note Input Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              اطلاعات{" "}
              {selectedCell &&
                students.find((s) => s.studentCode === selectedCell.studentCode)
                  ?.studentName}{" "}
              {selectedCell &&
                students.find((s) => s.studentCode === selectedCell.studentCode)
                  ?.studentlname}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Presence Status */}
            <div className="space-y-2">
              <Label htmlFor="presence-status">وضعیت حضور:</Label>
              <Select
                value={presenceStatus}
                onValueChange={(value) =>
                  setPresenceStatus(value as PresenceStatus)
                }
              >
                <SelectTrigger id="presence-status">
                  <SelectValue placeholder="انتخاب وضعیت حضور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="absent">غایب</SelectItem>
                  <SelectItem value="late">با تاخیر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descriptive Status */}
            <div className="space-y-2">
              <Label htmlFor="descriptive-status">وضعیت توصیفی:</Label>
              <Select
                value={descriptiveStatus}
                onValueChange={(value) => setDescriptiveStatus(value)}
              >
                <SelectTrigger id="descriptive-status">
                  <SelectValue placeholder="انتخاب وضعیت توصیفی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="خیلی خوب">خیلی خوب</SelectItem>
                  <SelectItem value="خوب">خوب</SelectItem>
                  <SelectItem value="قابل قبول">قابل قبول</SelectItem>
                  <SelectItem value="نیازمند تلاش بیشتر">
                    نیازمند تلاش بیشتر
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grades Section */}
            <div className="space-y-2 border p-2 rounded-md">
              <Label>نمرات:</Label>

              {/* Existing Grades */}
              {grades.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {grades.map((grade, index) => {
                    const totalPoints = grade.totalPoints || 20;
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-gray-100 p-1 rounded"
                      >
                        <span className="font-bold">
                          {grade.value}/{totalPoints}
                        </span>
                        {grade.description && (
                          <span className="text-xs">({grade.description})</span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveGrade(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-sm mb-2">
                  هیچ نمره‌ای ثبت نشده است
                </div>
              )}

              {/* Add New Grade */}
              <div className="flex items-end gap-2">
                <div className="flex-grow-0">
                  <Label htmlFor="grade-value" className="text-xs">
                    نمره:
                  </Label>
                  <div className="flex items-center mt-1">
                    <Input
                      id="grade-value"
                      type="number"
                      min="0"
                      step="0.25"
                      value={newGrade.value || ""}
                      onChange={(e) =>
                        setNewGrade({
                          ...newGrade,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-20"
                    />
                    <span className="mx-1">از</span>
                    <Input
                      id="grade-total"
                      type="number"
                      min="1"
                      value={newGrade.totalPoints || 20}
                      onChange={(e) =>
                        setNewGrade({
                          ...newGrade,
                          totalPoints: parseFloat(e.target.value) || 20,
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="grade-desc" className="text-xs">
                    توضیحات:
                  </Label>
                  <Input
                    id="grade-desc"
                    type="text"
                    value={newGrade.description}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, description: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddGrade}
                  className="mb-0.5"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  افزودن
                </Button>
              </div>
            </div>

            {/* Assessments Section */}
            <div className="space-y-2 border p-2 rounded-md">
              <Label>ارزیابی‌ها:</Label>

              {/* Existing Assessments */}
              {assessments.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {assessments.map((assessment, index) => {
                    // Determine badge color based on assessment value
                    let badgeColor = "bg-gray-100";
                    if (assessment.value === "عالی")
                      badgeColor = "bg-green-100 text-green-800";
                    else if (assessment.value === "خوب")
                      badgeColor = "bg-blue-100 text-blue-800";
                    else if (assessment.value === "متوسط")
                      badgeColor = "bg-yellow-100 text-yellow-800";
                    else if (assessment.value === "ضعیف")
                      badgeColor = "bg-orange-100 text-orange-800";
                    else if (assessment.value === "بسیار ضعیف")
                      badgeColor = "bg-red-100 text-red-800";

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-1 p-1 rounded ${badgeColor}`}
                      >
                        <span className="font-bold">{assessment.title}:</span>
                        <span>{assessment.value}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAssessment(index);
                          }}
                          className="text-red-500 hover:text-red-700 ml-1"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-500 text-sm mb-2">
                  هیچ ارزیابی ثبت نشده است
                </div>
              )}

              {/* Add New Assessment */}
              <div className="flex flex-col gap-4">
                <div className="flex items-end gap-2">
                  <div className="flex-grow-0">
                    <Label htmlFor="assessment-title" className="text-xs">
                      عنوان ارزیابی:
                    </Label>
                    <div className="flex items-center">
                      <Select
                        value={newAssessment.title}
                        onValueChange={(value) =>
                          setNewAssessment({ ...newAssessment, title: value })
                        }
                      >
                        <SelectTrigger
                          id="assessment-title"
                          className="w-[180px]"
                        >
                          <SelectValue placeholder="انتخاب عنوان" />
                        </SelectTrigger>
                        <SelectContent>
                          {assessmentTitles.map((title) => (
                            <SelectItem key={title} value={title}>
                              {title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsAddingTitle(true)}
                        className="ml-1"
                      >
                        <PlusCircleIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex-grow-0">
                    <Label htmlFor="assessment-value" className="text-xs">
                      مقدار ارزیابی:
                    </Label>
                    <div className="flex items-center">
                      <Select
                        value={newAssessment.value}
                        onValueChange={(value) =>
                          setNewAssessment({ ...newAssessment, value: value })
                        }
                      >
                        <SelectTrigger
                          id="assessment-value"
                          className="w-[180px]"
                        >
                          <SelectValue placeholder="انتخاب مقدار" />
                        </SelectTrigger>
                        <SelectContent>
                          {assessmentValues.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsAddingValue(true)}
                        className="ml-1"
                      >
                        <PlusCircleIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddAssessment}
                    className="mb-0.5"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    افزودن
                  </Button>
                </div>

                {/* Add Custom Assessment Title UI */}
                {isAddingTitle && (
                  <div className="flex items-end gap-2 bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <Label htmlFor="custom-title" className="text-xs">
                        عنوان ارزیابی جدید:
                      </Label>
                      <Input
                        id="custom-title"
                        value={customAssessmentTitle}
                        onChange={(e) =>
                          setCustomAssessmentTitle(e.target.value)
                        }
                        placeholder="عنوان ارزیابی را وارد کنید..."
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomTitle}
                      className="mr-1"
                    >
                      افزودن
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingTitle(false);
                        setCustomAssessmentTitle("");
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                )}

                {/* Add Custom Assessment Value UI */}
                {isAddingValue && (
                  <div className="flex items-end gap-2 bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <Label htmlFor="custom-value" className="text-xs">
                        مقدار ارزیابی جدید:
                      </Label>
                      <Input
                        id="custom-value"
                        value={customAssessmentValue}
                        onChange={(e) =>
                          setCustomAssessmentValue(e.target.value)
                        }
                        placeholder="مقدار ارزیابی را وارد کنید..."
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomValue}
                      className="mr-1"
                    >
                      افزودن
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsAddingValue(false);
                        setCustomAssessmentValue("");
                      }}
                    >
                      انصراف
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <Label htmlFor="note-text">یادداشت:</Label>
              <Textarea
                id="note-text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="یادداشت خود را وارد کنید..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              انصراف
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={isLoading}>
              {isLoading ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassSheet;
