// components/ClassSheet.jsx

"use client";
// components/ClassSheet.jsx
import React, { useState, useEffect, useMemo } from "react";
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
  ChatBubbleLeftIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown } from "lucide-react";

// Import required chart libraries
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  studentCode: string;
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
  weight?: number; // Add weight property to assessments
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
  presenceStatus: PresenceStatus | null;
  descriptiveStatus?: string;
  assessments?: AssessmentEntry[]; // New field for assessment pairs
  persianDate?: string; // Optional Persian date
  persianMonth?: string; // Optional Persian month name
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

// Assessment values with weights
const ASSESSMENT_VALUES = [
  { value: "عالی", weight: 2 },
  { value: "خوب", weight: 1 },
  { value: "متوسط", weight: 0 },
  { value: "ضعیف", weight: -1 },
  { value: "بسیار ضعیف", weight: -2 },
];

// Value-only array for backward compatibility and UI
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ASSESSMENT_VALUE_STRINGS = ASSESSMENT_VALUES.map((item) => item.value);

type AssessmentValueWeight = {
  value: string;
  weight: number;
};

type AssessmentOption = {
  _id: string;
  schoolCode: string;
  teacherCode?: string;
  type: "title" | "value";
  value: string;
  weight?: number;
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

// Add new types for TeacherComment and Event
type TeacherComment = {
  _id?: string;
  schoolCode: string;
  teacherCode: string;
  courseCode: string;
  classCode: string;
  date: string;
  timeSlot: string;
  comment: string;
  createdAt?: string;
  updatedAt?: string;
};

type Event = {
  _id?: string;
  schoolCode: string;
  teacherCode: string;
  courseCode: string;
  classCode: string;
  date: string;
  timeSlot: string;
  title: string;
  description: string;
  persianDate: string;
  createdAt?: string;
  updatedAt?: string;
};

const ClassSheet = ({
  schoolCode,
  teacherCode,
  courseCode,
  classDocuments,
}: {
  schoolCode?: string;
  teacherCode?: string;
  courseCode?: string;
  classDocuments?: ClassDocument[];
}) => {
  // State to track which class is currently selected
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);

  // Safe access to classDocuments
  const safeClassDocuments = classDocuments || [];

  // Safely get the selected class document
  const selectedClassDocument = safeClassDocuments[selectedClassIndex] || {
    data: {
      classCode: "",
      className: "",
      major: "",
      Grade: "",
      schoolCode: "",
      teachers: [],
      students: [],
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
    (CourseOption & { classIndex: number }) | undefined
  >(undefined);
  const [courseSelectOpen, setCourseSelectOpen] = useState(false);
  const [startDate, setStartDate] = useState<Value>(defaultStart);
  const [endDate, setEndDate] = useState<Value>(defaultEnd);

  // New state to store course and teacher names
  const [coursesInfo, setCoursesInfo] = useState<Record<string, string>>({});
  const [teachersInfo, setTeachersInfo] = useState<Record<string, string>>({});

  // Build teacher-course options from all classes (filter by teacherCode if provided)
  const courseOptions: (CourseOption & {
    classIndex: number;
    classCode: string;
    className: string;
  })[] = [];

  // Collect courses from all classes
  safeClassDocuments.forEach((classDoc, classIndex) => {
    // Skip if the class is undefined or doesn't have required data
    if (!classDoc || !classDoc.data) return;

    const teachers = teacherCode
      ? classDoc.data.teachers.filter((t) => t.teacherCode === teacherCode)
      : classDoc.data.teachers;

    teachers.forEach((t) => {
      // Get teacher and course names from the fetched data
      const teacherName =
        teachersInfo[t.teacherCode] || `معلم ${t.teacherCode}`;
      const courseName = coursesInfo[t.courseCode] || `درس ${t.courseCode}`;

      console.log(
        `Building option for: courseCode=${t.courseCode}, courseName=${courseName}, teacherCode=${t.teacherCode}, teacherName=${teacherName}`
      );

      courseOptions.push({
        value: `${t.teacherCode}-${t.courseCode}-${classDoc.data.classCode}`,
        teacherCode: t.teacherCode,
        courseCode: t.courseCode,
        classCode: classDoc.data.classCode,
        className: classDoc.data.className,
        classIndex: classIndex,
        label: `${classDoc.data.className} - ${teacherName} - ${courseName}`,
        weeklySchedule: t.weeklySchedule,
      });
    });
  });

  // Determine the initial selection.
  const initialSelected =
    courseCode && courseOptions.length > 0
      ? courseOptions.find((option) => option.courseCode === courseCode)
      : courseOptions.length > 0
      ? courseOptions[0]
      : undefined;

  // Set selectedOption and selectedClassIndex if they're still undefined (first render)
  useEffect(() => {
    if (!selectedOption && initialSelected) {
      setSelectedOption(initialSelected);
      setSelectedClassIndex(initialSelected.classIndex);
    }
  }, [initialSelected, selectedOption]);

  // Update selected class when option changes
  useEffect(() => {
    if (selectedOption && typeof selectedOption.classIndex === "number") {
      setSelectedClassIndex(selectedOption.classIndex);
    }
  }, [selectedOption]);

  // State for the modal and cell data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    studentCode: string;
    columnIndex: number;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus | "">("");
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
    useState<AssessmentValueWeight[]>(ASSESSMENT_VALUES);
  const [customAssessmentTitle, setCustomAssessmentTitle] =
    useState<string>("");
  const [customAssessmentValue, setCustomAssessmentValue] =
    useState<string>("");
  const [customAssessmentWeight, setCustomAssessmentWeight] =
    useState<number>(0);
  const [isAddingTitle, setIsAddingTitle] = useState<boolean>(false);
  const [isAddingValue, setIsAddingValue] = useState<boolean>(false);

  // Add new state for monthly report modal
  const [isMonthlyReportOpen, setIsMonthlyReportOpen] = useState(false);
  const [monthlyReportData, setMonthlyReportData] = useState<any>(null);

  // State for student full report
  const [isStudentReportOpen, setIsStudentReportOpen] = useState(false);
  const [studentReportData, setStudentReportData] = useState<any>(null);

  // State for bulk operations
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Column | null>(null);
  const [bulkGrade, setBulkGrade] = useState<GradeEntry>({
    value: 0,
    description: "",
    date: new Date().toISOString(),
    totalPoints: 20,
  });
  const [bulkPresenceStatus, setBulkPresenceStatus] = useState<
    PresenceStatus | ""
  >("");
  const [bulkDescriptiveStatus, setBulkDescriptiveStatus] = useState("");
  const [bulkAssessment, setBulkAssessment] = useState<AssessmentEntry>({
    title: "",
    value: "",
    date: new Date().toISOString(),
  });
  const [bulkNote, setBulkNote] = useState("");
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // New state for teacher comment
  const [isTeacherCommentModalOpen, setIsTeacherCommentModalOpen] =
    useState(false);
  const [teacherComment, setTeacherComment] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [existingComment, setExistingComment] = useState<TeacherComment | null>(
    null
  );

  // New state for events
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // New state to track columns with comments or events
  const [columnsWithComments, setColumnsWithComments] = useState<Set<string>>(
    new Set()
  );
  const [columnsWithEvents, setColumnsWithEvents] = useState<Set<string>>(
    new Set()
  );

  // Add a state to track if comments and events have been fetched
  const [hasFetchedData, setHasFetchedData] = useState(false);

  // State for group grade entry
  const [isGroupGradeModalOpen, setIsGroupGradeModalOpen] = useState(false);
  const [groupGrades, setGroupGrades] = useState<Record<string, { value: number; totalPoints: number; description: string }>>({});
  const [isSavingGroupGrades, setIsSavingGroupGrades] = useState(false);

  // Create a unique key for each cell
  const getCellKey = (studentCode: string, column: Column) => {
    // Format the date as YYYY-MM-DD to ensure consistency
    const dateStr = column.date.toISOString().split("T")[0];

    return `${selectedClassDocument.data.classCode}_${studentCode}_${selectedOption?.teacherCode}_${selectedOption?.courseCode}_${schoolCode}_${dateStr}_${column.timeSlot}`;
  };

  // Format a cell key from database record
  const formatCellKeyFromDB = (cell: CellData) => {
    // Ensure consistent date format by creating a new Date and extracting YYYY-MM-DD
    const date = new Date(cell.date);
    const dateStr = date.toISOString().split("T")[0];

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
            classCode: selectedClassDocument.data.classCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cell data");
        }

        const data = await response.json();
        //console.log("Loaded data:", data);

        // Convert array of cell data to a dictionary for easier access
        const cellsDataMap: Record<string, CellData> = {};
        data.forEach((cell: CellData) => {
          const key = formatCellKeyFromDB(cell);
          cellsDataMap[key] = {
            ...cell,
            // Ensure these properties exist with defaults if they don't
            grades: cell.grades || [],
            presenceStatus: cell.presenceStatus || null,
            note: cell.note || "",
            descriptiveStatus: cell.descriptiveStatus || "",
            assessments: cell.assessments || [],
          };
        });

        // console.log("Cell data map:", cellsDataMap);
        setCellsData(cellsDataMap);
      } catch (error) {
        console.error("Error loading cell data:", error);
        toast.error("Failed to load saved data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCellData();
  }, [selectedOption, selectedClassDocument.data.classCode, schoolCode]);

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
          .map((item: AssessmentOption) => ({
            value: item.value,
            weight: item.weight || 0,
          }));

        // Merge with default options (avoiding duplicates)
        const mergedTitles = [...new Set([...ASSESSMENT_TITLES, ...titles])];

        // Merge values while preserving weights
        const mergedValues: AssessmentValueWeight[] = [...ASSESSMENT_VALUES];
        values.forEach((customValue: AssessmentValueWeight) => {
          // Only add if it doesn't exist
          if (!mergedValues.some((v) => v.value === customValue.value)) {
            mergedValues.push(customValue);
          }
        });

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

  // Load teacher and course names from the database
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

        // Fetch courses
        const coursesResponse = await fetch(
          `/api/courses/sheet?schoolCode=${schoolCode}`
        );
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();
          console.log("Courses data:", coursesData);

          // Create a map of course codes to names
          const courseMap: Record<string, string> = {};

          // Helper function to recursively find courseCode and courseName in nested objects
          const findCourseInfo = (
            obj: any,
            path = ""
          ): { courseCode?: string; courseName?: string } => {
            const result: { courseCode?: string; courseName?: string } = {};

            if (!obj || typeof obj !== "object") return result;

            // Direct properties
            if (obj.courseCode) result.courseCode = obj.courseCode;
            if (obj.courseName) result.courseName = obj.courseName;

            // Check if this is a MongoDB Map converted to JSON (data field with object entries)
            if (obj.data && typeof obj.data === "object") {
              // Case 1: Direct properties in data
              if (obj.data.courseCode) result.courseCode = obj.data.courseCode;
              if (obj.data.courseName) result.courseName = obj.data.courseName;

              // Case 2: MongoDB stores Map as an object with individual entries
              // Check each property of data for courseCode and courseName
              for (const key in obj.data) {
                if (key === "courseCode") result.courseCode = obj.data[key];
                if (key === "courseName") result.courseName = obj.data[key];
              }
            }

            // If we haven't found either code or name yet, search deeper
            if (!result.courseCode || !result.courseName) {
              for (const key in obj) {
                if (typeof obj[key] === "object" && obj[key] !== null) {
                  // Skip data since we already checked it above
                  if (key === "data") continue;

                  const childResult = findCourseInfo(
                    obj[key],
                    `${path}.${key}`
                  );
                  if (childResult.courseCode && !result.courseCode)
                    result.courseCode = childResult.courseCode;
                  if (childResult.courseName && !result.courseName)
                    result.courseName = childResult.courseName;
                }
              }
            }

            return result;
          };

          if (Array.isArray(coursesData)) {
            coursesData.forEach((course, index) => {
              try {
                // Check if the course has direct courseCode and courseName properties
                // (from our API transformation)
                if (course.courseCode) {
                  courseMap[course.courseCode] =
                    course.courseName || course.courseCode;
                  console.log(
                    `Direct mapping: ${course.courseCode} -> ${
                      courseMap[course.courseCode]
                    }`
                  );
                }
                // Fallback to our existing recursive search if needed
                else {
                  // Try to find course info in any nested structure
                  const { courseCode, courseName } = findCourseInfo(course);

                  if (courseCode) {
                    // Use found courseName or fall back to courseCode
                    courseMap[courseCode] = courseName || courseCode;
                    console.log(
                      `Nested search mapping: ${courseCode} -> ${courseMap[courseCode]}`
                    );
                  } else {
                    console.log(
                      `No courseCode found in course ${index}:`,
                      course
                    );
                  }
                }
              } catch (e) {
                console.error("Error processing course data:", e, course);
              }
            });
          }

          console.log("Final course map:", courseMap);
          setCoursesInfo(courseMap);
        }
      } catch (error) {
        console.error("Error fetching teachers and courses:", error);
      }
    };

    fetchTeachersAndCourses();
  }, [schoolCode]);

  // Handle cell click and display
  const getCellContent = (
    studentCode: string,
    column: Column
  ): CellData | null => {
    // Get the standard cell key
    const cellKey = getCellKey(studentCode, column);

    // Debug: Log the cell key we're trying to find
    if (process.env.NODE_ENV === "development") {
      const simpleDateStr = column.date.toISOString().split("T")[0];
      //   console.log(
      //     `Looking for cell: ${studentCode}-${simpleDateStr}-${column.timeSlot}`,
      //     `Key: ${cellKey}`,
      //     `Has data: ${cellsData[cellKey] ? "Yes" : "No"}`
      //   );
    }

    // Try to find the cell in our cellsData using the standard key
    if (cellsData[cellKey]) {
      return cellsData[cellKey];
    }

    // If not found with standard key, try with a more flexible approach
    // Create a prefix to match the beginning of the key (everything except date and time slot)
    const prefix = `${selectedClassDocument.data.classCode}_${studentCode}_${selectedOption?.teacherCode}_${selectedOption?.courseCode}_${schoolCode}_`;

    // Get just the YYYY-MM-DD part of the date for matching
    const datePart = column.date.toISOString().split("T")[0];

    // Search through all keys for a match
    for (const key of Object.keys(cellsData)) {
      // Check if the key starts with our prefix, contains our date, and ends with our time slot
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
    studentCode: string,
    columnIndex: number,
    column: Column
  ) => {
    // console.log(`Clicked cell for student ${studentCode}, column:`, column);
    // Save both columnIndex and the actual column object to ensure consistency
    setSelectedCell({ studentCode, columnIndex });

    // Get the existing data for this cell, if any
    const cellData = getCellContent(studentCode, column);
    // console.log("Cell data found:", cellData);

    if (cellData) {
      setNoteText(cellData.note || "");
      setPresenceStatus(cellData.presenceStatus || "");
      setGrades(cellData.grades || []);
      setDescriptiveStatus(cellData.descriptiveStatus || "");
      setAssessments(cellData.assessments || []);
    } else {
      setNoteText("");
      setPresenceStatus("");
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

  // Find assessment weight based on value
  const getAssessmentWeight = (value: string): number => {
    const assessment = assessmentValues.find((av) => av.value === value);
    return assessment?.weight || 0;
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

    // Get the weight for the selected assessment value
    const weight = getAssessmentWeight(newAssessment.value);

    setAssessments([
      ...assessments,
      {
        ...newAssessment,
        date: new Date().toISOString(),
        weight: weight, // Add weight to the assessment
      },
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

    const column = allColumns[selectedCell.columnIndex];
    // console.log("Saving for column:", column);

    // Ensure we use a consistent date format for the cell key
    const cellKey = getCellKey(selectedCell.studentCode, column);
    // console.log("Cell key for saving:", cellKey);

    setIsLoading(true);
    try {
      // Use the column's date with consistent formatting
      const formattedDate = column.date.toISOString().split("T")[0];

      // Get Persian date components
      const [jYear, jMonth, jDay] = gregorian_to_jalali(
        column.date.getFullYear(),
        column.date.getMonth() + 1,
        column.date.getDate()
      );

      // Get Persian month name
      const persianMonth = getPersianMonthName(jMonth);

      // Format Persian date
      const persianDate = formatJalaliDate(column.date);

      // Ensure all assessments have weight property
      const assessmentsWithWeights = assessments.map((assessment) => {
        // If assessment already has weight, use it; otherwise, get weight from the value
        if (assessment.weight !== undefined) {
          return assessment;
        }
        return {
          ...assessment,
          weight: getAssessmentWeight(assessment.value),
        };
      });

      const cellData = {
        classCode: selectedClassDocument.data.classCode,
        studentCode: selectedCell.studentCode,
        teacherCode: selectedOption.teacherCode,
        courseCode: selectedOption.courseCode,
        schoolCode: schoolCode,
        date: formattedDate, // Use YYYY-MM-DD format consistently
        timeSlot: column.timeSlot, // Ensure timeSlot from original column is used
        note: noteText,
        grades: grades,
        presenceStatus: presenceStatus || null, // Don't default to present
        descriptiveStatus: descriptiveStatus,
        assessments: assessmentsWithWeights,
        persianDate: persianDate, // Add Persian date
        persianMonth: persianMonth, // Add Persian month name
      };

      //   console.log("Saving cell data:", cellData);

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

      // Update local state with the consistent key
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
  if (selectedClassDocument.data.schoolCode !== schoolCode) {
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
    if (option) {
      setSelectedOption(option);
    }
  };

  // Function to navigate dates forward or backward by two weeks
  const navigateTwoWeeks = (direction: "forward" | "backward") => {
    if (!startDate || !endDate) return;

    // Clone the dates to avoid mutating the state directly
    let newStartDate: Date;
    let newEndDate: Date;

    // Handle both Date objects and Value objects from react-multi-date-picker
    if (startDate instanceof Date) {
      newStartDate = new Date(startDate);
    } else if (typeof startDate === "string") {
      newStartDate = new Date(startDate);
    } else {
      // Handle Value from react-multi-date-picker
      const dateObj = startDate as unknown as { toDate: () => Date };
      newStartDate = dateObj.toDate ? dateObj.toDate() : new Date();
    }

    if (endDate instanceof Date) {
      newEndDate = new Date(endDate);
    } else if (typeof endDate === "string") {
      newEndDate = new Date(endDate);
    } else {
      // Handle Value from react-multi-date-picker
      const dateObj = endDate as unknown as { toDate: () => Date };
      newEndDate = dateObj.toDate ? dateObj.toDate() : new Date();
    }

    const daysToAdjust = direction === "forward" ? 14 : -14;

    newStartDate.setDate(newStartDate.getDate() + daysToAdjust);
    newEndDate.setDate(newEndDate.getDate() + daysToAdjust);

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  // Helper: Map JavaScript's getDay() to Persian day names (week starting from "شنبه").
  const getPersianDayName = (date: Date) => {
    // In JavaScript: 0 = Sunday, 1 = Monday, …, 6 = Saturday.
    // Mapping for a Persian week starting with "شنبه":
    const mapping: Record<number, string> = {
      6: "شنبه",
      0: "یکشنبه",
      1: "دوشنبه",
      2: "سه شنبه",
      3: "چهارشنبه",
      4: "پنج شنبه",
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

  // Sort students by last name (studentlname) by default whenever class changes
  const students = useMemo(() => {
    const { students: unsortedStudents } = selectedClassDocument.data;
    return unsortedStudents ? [...unsortedStudents].sort((a, b) => {
      return a.studentlname.localeCompare(b.studentlname, 'fa');
    }) : [];
  }, [selectedClassDocument.data]);

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
          weight: customAssessmentWeight,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add assessment value");
      }

      // Update local state
      setAssessmentValues([
        ...assessmentValues,
        { value: customAssessmentValue.trim(), weight: customAssessmentWeight },
      ]);
      setCustomAssessmentValue("");
      setCustomAssessmentWeight(0);
      setIsAddingValue(false);
      toast.success("مقدار ارزیابی با موفقیت افزوده شد");
    } catch (error) {
      console.error("Error adding assessment value:", error);
      toast.error(
        error instanceof Error ? error.message : "خطا در افزودن مقدار ارزیابی"
      );
    }
  };

  // Handler for monthly cell click
  const handleMonthlyCellClick = (
    student: Student,
    monthName: string,
    monthCells: CellData[]
  ) => {
    // Calculate attendance statistics
    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      unset: 0,
    };

    monthCells.forEach((cell) => {
      if (cell.presenceStatus === "present") attendanceSummary.present++;
      else if (cell.presenceStatus === "absent") attendanceSummary.absent++;
      else if (cell.presenceStatus === "late") attendanceSummary.late++;
      else attendanceSummary.unset++;
    });

    // Get all grades for the month
    const allGrades = monthCells.flatMap((cell) => cell.grades || []);

    // Calculate the base grade (without assessment adjustments)
    let baseGrade = 0;
    let finalGrade = 0;
    let assessmentAdjustment = 0;

    if (allGrades.length > 0) {
      // Calculate total value and points for grades
      const totalValue = allGrades.reduce((sum, grade) => sum + grade.value, 0);
      const totalPoints = allGrades.reduce(
        (sum, grade) => sum + (grade.totalPoints || 20),
        0
      );

      // Calculate the base grade
      baseGrade = (totalValue / totalPoints) * 20;

      // Calculate assessment point adjustments
      const monthAssessments = monthCells.flatMap(
        (cell) => cell.assessments || []
      );

      assessmentAdjustment = monthAssessments.reduce((sum, assessment) => {
        const weight = getAssessmentWeight(assessment.value);
        return sum + weight;
      }, 0);

      // Apply adjustment (but keep grade within 0-20 range)
      finalGrade = Math.max(0, Math.min(20, baseGrade + assessmentAdjustment));
    }

    // Organize assessments by title
    const assessmentsSummary: Record<string, string[]> = {};
    monthCells.forEach((cell) => {
      if (cell.assessments && cell.assessments.length > 0) {
        cell.assessments.forEach((assessment) => {
          if (!assessmentsSummary[assessment.title]) {
            assessmentsSummary[assessment.title] = [];
          }
          assessmentsSummary[assessment.title].push(assessment.value);
        });
      }
    });

    // Set the monthly report data
    setMonthlyReportData({
      student: student,
      month: monthName,
      cells: monthCells,
      baseGrade,
      finalGrade,
      assessmentAdjustment,
      allGrades,
      attendanceSummary,
      assessmentsSummary,
    });

    // Open the modal
    setIsMonthlyReportOpen(true);
  };

  // Handle student name cell click to show full report
  const handleStudentNameClick = (student: Student) => {
    if (!selectedOption) return;

    // Find all months in our data
    const months = new Set<string>();
    const studentCells = Object.values(cellsData).filter(
      (cell) => cell.studentCode === student.studentCode
    );

    // Process all cells to get unique months
    studentCells.forEach((cell) => {
      const cellDate = new Date(cell.date);
      const jalaliDate = gregorian_to_jalali(
        cellDate.getFullYear(),
        cellDate.getMonth() + 1,
        cellDate.getDate()
      );
      // Use monthYear directly to add to the Set
      const monthName = getPersianMonthName(jalaliDate[1]);
      months.add(`${monthName} ${jalaliDate[0]}`);
    });

    // Prepare monthly data
    const monthlyGrades = Array.from(months).map((monthStr) => {
      const [monthName, yearStr] = monthStr.split(" ");
      const monthIndex =
        [
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
        ].indexOf(monthName) + 1;
      const year = parseInt(yearStr);

      // Get all cells for this student in this month
      const monthCells = studentCells.filter((cell) => {
        const cellDate = new Date(cell.date);
        const jalaliDate = gregorian_to_jalali(
          cellDate.getFullYear(),
          cellDate.getMonth() + 1,
          cellDate.getDate()
        );
        return jalaliDate[0] === year && jalaliDate[1] === monthIndex;
      });

      // Calculate attendance
      const attendance = {
        present: 0,
        absent: 0,
        late: 0,
      };

      monthCells.forEach((cell) => {
        if (cell.presenceStatus === "present") attendance.present++;
        else if (cell.presenceStatus === "absent") attendance.absent++;
        else if (cell.presenceStatus === "late") attendance.late++;
      });

      // Get all grades for the month
      const allGrades = monthCells.flatMap((cell) => cell.grades || []);

      // Calculate grade
      let baseGrade = 0;
      let grade = 0;
      let assessmentAdjustment = 0;

      if (allGrades.length > 0) {
        // Calculate total value and points for grades
        const totalValue = allGrades.reduce(
          (sum, grade) => sum + grade.value,
          0
        );
        const totalPoints = allGrades.reduce(
          (sum, grade) => sum + (grade.totalPoints || 20),
          0
        );

        // Calculate the base grade
        baseGrade = (totalValue / totalPoints) * 20;

        // Calculate assessment point adjustments
        const monthAssessments = monthCells.flatMap(
          (cell) => cell.assessments || []
        );

        assessmentAdjustment = monthAssessments.reduce((sum, assessment) => {
          const weight = getAssessmentWeight(assessment.value);
          return sum + weight;
        }, 0);

        // Apply adjustment (but keep grade within 0-20 range)
        grade = Math.max(0, Math.min(20, baseGrade + assessmentAdjustment));
      }

      return {
        month: monthStr,
        grade,
        baseGrade,
        assessmentAdjustment,
        totalGrades: allGrades.length,
        attendance,
      };
    });

    // Sort months chronologically
    monthlyGrades.sort((a, b) => {
      const [aMonthName, aYearStr] = a.month.split(" ");
      const [bMonthName, bYearStr] = b.month.split(" ");

      const aYear = parseInt(aYearStr);
      const bYear = parseInt(bYearStr);

      if (aYear !== bYear) return aYear - bYear;

      const aMonthIndex = [
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
      ].indexOf(aMonthName);
      const bMonthIndex = [
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
      ].indexOf(bMonthName);

      return aMonthIndex - bMonthIndex;
    });

    // Calculate total attendance
    const totalAttendance = monthlyGrades.reduce(
      (total, month) => {
        return {
          present: total.present + month.attendance.present,
          absent: total.absent + month.attendance.absent,
          late: total.late + month.attendance.late,
        };
      },
      { present: 0, absent: 0, late: 0 }
    );

    // Calculate average grade
    const validGrades = monthlyGrades.filter((month) => month.grade > 0);
    const averageGrade =
      validGrades.length > 0
        ? validGrades.reduce((sum, month) => sum + month.grade, 0) /
          validGrades.length
        : 0;

    // Collect all assessment data
    const totalAssessments: Record<string, Record<string, number>> = {};

    studentCells.forEach((cell) => {
      if (cell.assessments && cell.assessments.length > 0) {
        cell.assessments.forEach((assessment) => {
          if (!totalAssessments[assessment.title]) {
            totalAssessments[assessment.title] = {};
          }

          if (!totalAssessments[assessment.title][assessment.value]) {
            totalAssessments[assessment.title][assessment.value] = 0;
          }

          totalAssessments[assessment.title][assessment.value]++;
        });
      }
    });

    // Set the data and open the modal
    setStudentReportData({
      student,
      monthlyGrades,
      totalAttendance,
      averageGrade,
      totalAssessments,
    });

    setIsStudentReportOpen(true);
  };

  // Handle column header click for bulk add
  const handleColumnHeaderClick = (column: Column) => {
    if (!selectedOption) return;

    // Set selected column regardless of which modal will open
    setSelectedColumn(column);

    // For monthly columns, don't show action menu
    if (column.day === "monthly") return;

    // Show a custom menu with options
    const menu = document.createElement("div");
    menu.className =
      "fixed bg-white shadow-lg rounded-md p-2 z-50 border flex flex-col";
    menu.style.zIndex = "1000";

    // Helper function to create menu items
    const createMenuItem = (text: string, onClick: () => void) => {
      const item = document.createElement("button");
      item.className =
        "px-4 py-2 hover:bg-gray-100 text-right w-full rounded-md transition-colors";
      item.innerText = text;
      item.onclick = (e) => {
        e.preventDefault();
        onClick();
        document.body.removeChild(menu);
      };
      return item;
    };

    // Add menu options
    menu.appendChild(
      createMenuItem("وارد کردن دسته جمعی", () => {
        // Reset bulk form fields
        setBulkGrade({
          value: 0,
          description: "",
          date: new Date().toISOString(),
          totalPoints: 20,
        });
        setBulkPresenceStatus("");
        setBulkDescriptiveStatus("");
        setBulkAssessment({
          title: "",
          value: "",
          date: new Date().toISOString(),
        });
        setBulkNote("");

        // Open the bulk modal
        setIsBulkModalOpen(true);
      })
    );

    menu.appendChild(
      createMenuItem("یادداشت روزانه معلم", () => {
        // Load existing comment and open modal
        fetchTeacherComment(column);
      })
    );

    menu.appendChild(
      createMenuItem("رویدادها", () => {
        // Load events and open modal
        fetchEvents(column);
      })
    );

    menu.appendChild(
      createMenuItem("افزودن نمره گروهی", () => {
        // Initialize group grades for all students
        const initialGrades: Record<string, { value: number; totalPoints: number; description: string }> = {};
        students.forEach((student) => {
          initialGrades[student.studentCode] = {
            value: 0,
            totalPoints: 20,
            description: "",
          };
        });
        setGroupGrades(initialGrades);
        setIsGroupGradeModalOpen(true);
      })
    );

    // Position menu near the cursor
    const handleClickOutside = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
        document.removeEventListener("click", handleClickOutside);
      }
    };

    // Add to DOM and position it
    document.body.appendChild(menu);

    // Get the cursor position from the event (assuming it's available)
    // If not, we could use the column header position in the UI as fallback
    const event = window.event as MouseEvent;
    if (event) {
      menu.style.top = `${event.clientY + 10}px`;
      menu.style.left = `${event.clientX}px`;
    } else {
      // Fallback position: center of viewport
      menu.style.top = "50%";
      menu.style.left = "50%";
      menu.style.transform = "translate(-50%, -50%)";
    }

    // Remove menu when clicking outside
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
  };

  // Function to fetch teacher comment
  const fetchTeacherComment = async (column: Column) => {
    if (!selectedOption || !column) return;

    try {
      setIsSavingComment(true);

      // Format date consistently
      const formattedDate = column.date.toISOString().split("T")[0];

      const response = await fetch(
        `/api/teacherComment?schoolCode=${schoolCode}&teacherCode=${selectedOption.teacherCode}&courseCode=${selectedOption.courseCode}&classCode=${selectedClassDocument.data.classCode}&date=${formattedDate}&timeSlot=${column.timeSlot}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch teacher comment");
      }

      const data = await response.json();

      if (data && data.comment) {
        setExistingComment(data);
        setTeacherComment(data.comment);
      } else {
        setExistingComment(null);
        setTeacherComment("");
      }

      // Open modal
      setIsTeacherCommentModalOpen(true);
    } catch (error) {
      console.error("Error fetching teacher comment:", error);
      toast.error("Failed to load teacher comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  // Function to save teacher comment
  const handleSaveTeacherComment = async () => {
    if (!selectedOption || !selectedColumn) return;

    try {
      setIsSavingComment(true);

      // Format date consistently
      const formattedDate = selectedColumn.date.toISOString().split("T")[0];

      const commentData = {
        _id: existingComment?._id,
        schoolCode,
        teacherCode: selectedOption.teacherCode,
        courseCode: selectedOption.courseCode,
        classCode: selectedClassDocument.data.classCode,
        date: formattedDate,
        timeSlot: selectedColumn.timeSlot,
        comment: teacherComment,
      };

      const response = await fetch("/api/teacherComment", {
        method: existingComment ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error("Failed to save teacher comment");
      }

      toast.success("یادداشت با موفقیت ذخیره شد");

      // Update columnsWithComments state
      if (teacherComment.trim()) {
        // Add this column to the set if there's a comment
        setColumnsWithComments((prev) => {
          const newSet = new Set(prev);
          newSet.add(getColumnKey(selectedColumn));
          return newSet;
        });
      } else {
        // Remove this column from the set if comment is empty
        setColumnsWithComments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(getColumnKey(selectedColumn));
          return newSet;
        });
      }

      setIsTeacherCommentModalOpen(false);
    } catch (error) {
      console.error("Error saving teacher comment:", error);
      toast.error("Failed to save teacher comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  // Function to fetch events
  const fetchEvents = async (column: Column) => {
    if (!selectedOption || !column) return;

    try {
      setIsLoadingEvents(true);

      // Format date consistently
      const formattedDate = column.date.toISOString().split("T")[0];

      const response = await fetch(
        `/api/events?schoolCode=${schoolCode}&teacherCode=${selectedOption.teacherCode}&courseCode=${selectedOption.courseCode}&classCode=${selectedClassDocument.data.classCode}&date=${formattedDate}&timeSlot=${column.timeSlot}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();

      setEvents(data || []);

      // Reset new event form
      setNewEventTitle("");
      setNewEventDescription("");

      // Open modal
      setIsEventModalOpen(true);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Function to save a new event
  const handleAddEvent = async () => {
    if (!selectedOption || !selectedColumn) return;

    if (!newEventTitle.trim()) {
      toast.error("عنوان رویداد الزامی است");
      return;
    }

    try {
      setIsSavingEvent(true);

      // Format date consistently
      const formattedDate = selectedColumn.date.toISOString().split("T")[0];

      const eventData = {
        schoolCode,
        teacherCode: selectedOption.teacherCode,
        courseCode: selectedOption.courseCode,
        classCode: selectedClassDocument.data.classCode,
        date: formattedDate,
        timeSlot: selectedColumn.timeSlot,
        title: newEventTitle,
        description: newEventDescription,
        persianDate: formatJalaliDate(selectedColumn.date),
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to add event");
      }

      const savedEvent = await response.json();

      // Update local events state
      setEvents([...events, savedEvent]);

      // Update columnsWithEvents state
      setColumnsWithEvents((prev) => {
        const newSet = new Set(prev);
        newSet.add(getColumnKey(selectedColumn));
        return newSet;
      });

      // Reset form
      setNewEventTitle("");
      setNewEventDescription("");

      toast.success("رویداد با موفقیت افزوده شد");
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Function to delete an event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Update local events state
      const updatedEvents = events.filter((event) => event._id !== eventId);
      setEvents(updatedEvents);

      // If no events left for this column, remove it from the set
      if (selectedColumn && updatedEvents.length === 0) {
        setColumnsWithEvents((prev) => {
          const newSet = new Set(prev);
          newSet.delete(getColumnKey(selectedColumn));
          return newSet;
        });
      }

      toast.success("رویداد با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  // Add a bulk grade for all students
  const handleAddBulkGrade = () => {
    if (bulkGrade.value <= 0) {
      toast.error("Grade value must be greater than 0");
      return;
    }

    if (!bulkGrade.totalPoints || bulkGrade.totalPoints <= 0) {
      toast.error("Total points must be greater than 0");
      return;
    }

    if (bulkGrade.value > bulkGrade.totalPoints) {
      toast.error("Grade cannot exceed total points");
      return;
    }

    // Don't reset the grade since we need to use it in the save function
    toast.success("Grade prepared for bulk save");
  };

  // Add a bulk assessment for all students
  const handleAddBulkAssessment = () => {
    if (!bulkAssessment.title) {
      toast.error("Assessment title is required");
      return;
    }

    if (!bulkAssessment.value) {
      toast.error("Assessment value is required");
      return;
    }

    setBulkAssessment({
      title: "",
      value: "",
      date: new Date().toISOString(),
    });

    toast.success("Assessment prepared for bulk save");
  };

  // Save bulk data for all students
  const handleBulkSave = async () => {
    if (!selectedColumn || !selectedOption) return;

    setIsBulkLoading(true);
    try {
      // Create an array of promises for each student
      const savePromises = students.map(async (student) => {
        // Get existing cell data for this student and column
        const existingCell = getCellContent(
          student.studentCode,
          selectedColumn
        );

        // Ensure consistent date format for saving
        const formattedDate = selectedColumn.date.toISOString().split("T")[0];

        // Get Persian date components
        const [jYear, jMonth, jDay] = gregorian_to_jalali(
          selectedColumn.date.getFullYear(),
          selectedColumn.date.getMonth() + 1,
          selectedColumn.date.getDate()
        );

        // Get Persian month name
        const persianMonth = getPersianMonthName(jMonth);

        // Format Persian date
        const persianDate = formatJalaliDate(selectedColumn.date);

        // Prepare cell data with bulk values
        const cellData = {
          classCode: selectedClassDocument.data.classCode,
          studentCode: student.studentCode,
          teacherCode: selectedOption.teacherCode,
          courseCode: selectedOption.courseCode,
          schoolCode: schoolCode,
          date: formattedDate, // Use YYYY-MM-DD format consistently
          timeSlot: selectedColumn.timeSlot, // Ensure timeSlot from original column is used
          note: bulkNote,
          grades: existingCell?.grades || [],
          presenceStatus: bulkPresenceStatus || null, // Don't default to present
          descriptiveStatus: bulkDescriptiveStatus,
          assessments: existingCell?.assessments || [],
          persianDate: persianDate, // Add Persian date
          persianMonth: persianMonth, // Add Persian month name
        };

        // Add the bulk grade if value > 0
        if (bulkGrade.value > 0) {
          cellData.grades.push({
            ...bulkGrade,
            description:
              bulkGrade.description ||
              `نمره گروهی افزوده شده در ${formatJalaliDate(new Date())}`,
            date: new Date().toISOString(),
          });
        }

        // Add the bulk assessment if both title and value are provided
        if (bulkAssessment.title && bulkAssessment.value) {
          // Get the weight for the assessment value
          const weight = getAssessmentWeight(bulkAssessment.value);

          cellData.assessments.push({
            ...bulkAssessment,
            date: new Date().toISOString(),
            weight: weight, // Add weight to the assessment
          });
        }

        // Save the data
        const response = await fetch("/api/classsheet/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cellData),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to save data for student ${student.studentCode}`
          );
        }

        // Update local state with a consistent cell key
        const cellKey = getCellKey(student.studentCode, selectedColumn);
        setCellsData((prev) => ({
          ...prev,
          [cellKey]: cellData,
        }));

        return { success: true, studentCode: student.studentCode };
      });

      // Wait for all saves to complete
      await Promise.all(savePromises);

      toast.success("Bulk data saved successfully for all students");
      setIsBulkModalOpen(false);

      // Reset the bulk grade after saving
      setBulkGrade({
        value: 0,
        description: "",
        date: new Date().toISOString(),
        totalPoints: 20,
      });

      // Reset the bulk assessment after saving
      setBulkAssessment({
        title: "",
        value: "",
        date: new Date().toISOString(),
      });

      // Reload the cell data after saving
      if (selectedOption) {
        // Fetch data from API again
        const response = await fetch("/api/classsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classCode: selectedClassDocument.data.classCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to reload cell data");
        }

        const data = await response.json();

        // Convert array of cell data to a dictionary for easier access
        const cellsDataMap: Record<string, CellData> = {};
        data.forEach((cell: CellData) => {
          const key = formatCellKeyFromDB(cell);
          cellsDataMap[key] = {
            ...cell,
            // Ensure these properties exist with defaults if they don't
            grades: cell.grades || [],
            presenceStatus: cell.presenceStatus || null,
            note: cell.note || "",
            descriptiveStatus: cell.descriptiveStatus || "",
            assessments: cell.assessments || [],
          };
        });

        setCellsData(cellsDataMap);
      }
    } catch (error) {
      console.error("Error saving bulk data:", error);
      toast.error("Failed to save bulk data for all students");
    } finally {
      setIsBulkLoading(false);
    }
  };

  // Save group grades for all students
  const handleSaveGroupGrades = async () => {
    if (!selectedColumn || !selectedOption) return;

    // Validate that at least one grade has been entered
    const hasAnyGrade = Object.values(groupGrades).some((grade) => grade.value > 0);
    if (!hasAnyGrade) {
      toast.error("لطفاً حداقل یک نمره وارد کنید");
      return;
    }

    setIsSavingGroupGrades(true);
    try {
      // Create an array of promises for each student with a grade
      const savePromises = students
        .filter((student) => {
          const grade = groupGrades[student.studentCode];
          return grade && grade.value > 0;
        })
        .map(async (student) => {
          // Get existing cell data for this student and column
          const existingCell = getCellContent(student.studentCode, selectedColumn);

          // Ensure consistent date format for saving
          const formattedDate = selectedColumn.date.toISOString().split("T")[0];

          // Get Persian date components
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_jYear, jMonth, _jDay] = gregorian_to_jalali(
            selectedColumn.date.getFullYear(),
            selectedColumn.date.getMonth() + 1,
            selectedColumn.date.getDate()
          );

          // Get Persian month name
          const persianMonth = getPersianMonthName(jMonth);

          // Format Persian date
          const persianDate = formatJalaliDate(selectedColumn.date);

          // Get the grade for this student
          const studentGrade = groupGrades[student.studentCode];

          // Prepare cell data
          const cellData = {
            classCode: selectedClassDocument.data.classCode,
            studentCode: student.studentCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
            date: formattedDate,
            timeSlot: selectedColumn.timeSlot,
            note: existingCell?.note || "",
            grades: [
              ...(existingCell?.grades || []),
              {
                value: studentGrade.value,
                description: studentGrade.description || `نمره گروهی ${formatJalaliDate(new Date())}`,
                date: new Date().toISOString(),
                totalPoints: studentGrade.totalPoints,
              },
            ],
            presenceStatus: existingCell?.presenceStatus || null,
            descriptiveStatus: existingCell?.descriptiveStatus || "",
            assessments: existingCell?.assessments || [],
            persianDate: persianDate,
            persianMonth: persianMonth,
          };

          // Save the data
          const response = await fetch("/api/classsheet/save", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(cellData),
          });

          if (!response.ok) {
            throw new Error(`Failed to save data for student ${student.studentCode}`);
          }

          // Update local state with a consistent cell key
          const cellKey = getCellKey(student.studentCode, selectedColumn);
          setCellsData((prev) => ({
            ...prev,
            [cellKey]: cellData,
          }));

          return { success: true, studentCode: student.studentCode };
        });

      // Wait for all saves to complete
      await Promise.all(savePromises);

      toast.success("نمرات گروهی با موفقیت ذخیره شد");
      setIsGroupGradeModalOpen(false);

      // Reset group grades
      setGroupGrades({});

      // Reload the cell data after saving
      if (selectedOption) {
        const response = await fetch("/api/classsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classCode: selectedClassDocument.data.classCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to reload cell data");
        }

        const data = await response.json();

        // Convert array of cell data to a dictionary for easier access
        const cellsDataMap: Record<string, CellData> = {};
        data.forEach((cell: CellData) => {
          const key = formatCellKeyFromDB(cell);
          cellsDataMap[key] = {
            ...cell,
            grades: cell.grades || [],
            presenceStatus: cell.presenceStatus || null,
            note: cell.note || "",
            descriptiveStatus: cell.descriptiveStatus || "",
            assessments: cell.assessments || [],
          };
        });

        setCellsData(cellsDataMap);
      }
    } catch (error) {
      console.error("Error saving group grades:", error);
      toast.error("خطا در ذخیره نمرات گروهی");
    } finally {
      setIsSavingGroupGrades(false);
    }
  };

  // Function to generate a unique key for column identification
  const getColumnKey = (column: Column) => {
    // Format the date as YYYY-MM-DD to ensure consistency
    const dateStr = column.date.toISOString().split("T")[0];
    return `${dateStr}_${column.timeSlot}`;
  };

  // Function to check for teacher comments and events on initial load
  const fetchCommentsAndEvents = async () => {
    if (!selectedOption || !allColumns.length) return;

    try {
      const commentColumns = new Set<string>();
      const eventColumns = new Set<string>();

      // Only check columns that are not monthly
      const columnsToCheck = allColumns.filter((col) => col.day !== "monthly");

      // Process columns in batches to avoid too many concurrent requests
      const batchSize = 5;
      for (let i = 0; i < columnsToCheck.length; i += batchSize) {
        const batch = columnsToCheck.slice(i, i + batchSize);

        // Create promises for all comment and event fetches
        const commentPromises = batch.map((column) => {
          const formattedDate = column.date.toISOString().split("T")[0];
          return fetch(
            `/api/teacherComment?schoolCode=${schoolCode}&teacherCode=${selectedOption.teacherCode}&courseCode=${selectedOption.courseCode}&classCode=${selectedClassDocument.data.classCode}&date=${formattedDate}&timeSlot=${column.timeSlot}`
          ).then((res) => res.json());
        });

        const eventPromises = batch.map((column) => {
          const formattedDate = column.date.toISOString().split("T")[0];
          return fetch(
            `/api/events?schoolCode=${schoolCode}&teacherCode=${selectedOption.teacherCode}&courseCode=${selectedOption.courseCode}&classCode=${selectedClassDocument.data.classCode}&date=${formattedDate}&timeSlot=${column.timeSlot}`
          ).then((res) => res.json());
        });

        // Wait for all promises in the batch
        const commentResults = await Promise.all(commentPromises);
        const eventResults = await Promise.all(eventPromises);

        // Process results and update sets
        commentResults.forEach((result, index) => {
          if (result && result.comment) {
            commentColumns.add(getColumnKey(batch[index]));
          }
        });

        eventResults.forEach((result, index) => {
          if (result && Array.isArray(result) && result.length > 0) {
            eventColumns.add(getColumnKey(batch[index]));
          }
        });
      }

      // Update state with found columns
      setColumnsWithComments(commentColumns);
      setColumnsWithEvents(eventColumns);
      setHasFetchedData(true);
    } catch (error) {
      console.error("Error fetching comments and events:", error);
    }
  };

  // Call fetchCommentsAndEvents when course option changes or allColumns is populated
  useEffect(() => {
    if (selectedOption && allColumns.length > 0 && !hasFetchedData) {
      fetchCommentsAndEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption, allColumns.length, hasFetchedData]);

  // Reset hasFetchedData when selectedOption changes
  useEffect(() => {
    setHasFetchedData(false);
  }, [selectedOption]);

  return (
    <div className="p-0 bg-gray-100" dir="rtl">
      {/* Teacher-Course Selection and Date Range in a single row */}
      <div className="mb-0 items-end bg-white px-0 py-4 flex flex-col md:flex-row md:space-x-4 md:space-x-reverse space-y-4 md:space-y-0">
        {/* Teacher-Course Selection */}
        <div className="md:w-1/3">
          <label
            htmlFor="course-select"
            className="block mb-1 text-sm font-medium text-gray-700"
          >
            انتخاب معلم-درس:
          </label>
          <Popover open={courseSelectOpen} onOpenChange={setCourseSelectOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={courseSelectOpen}
                className="w-full justify-between text-sm h-auto py-2 px-3"
              >
                {selectedOption
                  ? selectedOption.label
                  : "انتخاب معلم-درس..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="جستجوی معلم یا درس..."
                  className="h-9"
                />
                <CommandList>
                  <CommandEmpty>موردی یافت نشد.</CommandEmpty>
                  <CommandGroup>
                    {courseOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        keywords={[
                          option.className || "",
                          option.courseCode,
                          option.teacherCode,
                          coursesInfo[option.courseCode] || "",
                          teachersInfo[option.teacherCode] || "",
                        ]}
                        onSelect={() => {
                          setSelectedOption(option);
                          handleSelectChange({
                            target: { value: option.value },
                          } as React.ChangeEvent<HTMLSelectElement>);
                          setCourseSelectOpen(false);
                        }}
                      >
                        <Check
                          className={`ml-2 h-4 w-4 ${
                            selectedOption?.value === option.value
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range Section */}

        <div className="border-0  md:w-1/3 flex flex-col md:flex-row gap-4">
          <div className="relative">
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
              }}
              format="YYYY/MM/DD"
              style={{
                padding: "17px",
              }}
              //   containerStyle={{
              //     padding: "17px",
              //   }}
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              calendarPosition="bottom-right"
              placeholder="تاریخ شروع"
            />
            {/* <span className="absolute right-3 top-1.5 text-xs text-gray-500">
              تاریخ شروع
            </span> */}
          </div>
          <div className="relative">
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              style={{
                padding: "17px",
              }}
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
              }}
              format="YYYY/MM/DD"
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              calendarPosition="bottom-right"
              placeholder="تاریخ پایان"
            />
            {/* <span className="absolute right-3 top-1.5 text-xs text-gray-500">
              تاریخ پایان
            </span> */}
          </div>
        </div>

        <div className="md:w-1/3 flex flex-col items-end">
          <div className="flex  mb-0 justify-between">
            {/* <span className="text-sm font-medium text-gray-700">تاریخ:</span> */}
            <div className="flex space-x-2 space-x-reverse items-center">
              <button
                onClick={() => navigateTwoWeeks("backward")}
                className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-xs"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                دو هفته قبل
              </button>

              <div className="text-center text-sm font-medium px-3 py-1.5 bg-gray-50 rounded-lg">
                {formatJalaliDate(
                  startDate instanceof Date
                    ? startDate
                    : new Date(startDate as string)
                )}{" "}
                تا{" "}
                {formatJalaliDate(
                  endDate instanceof Date
                    ? endDate
                    : new Date(endDate as string)
                )}
              </div>

              <button
                onClick={() => navigateTwoWeeks("forward")}
                className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-xs"
              >
                دو هفته بعد
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Schedule Sheet */}
      <div className="bg-white   p-0 overflow-x-auto">
        <table className="min-w-full bg-white border-collapse rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className=" px-3 py-3 w-[160px] min-w-[160px] h-12 border-r border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-sm shadow-sm">
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <span>دانش‌آموزان</span>
                </div>
              </th>
              {allColumns.length > 0 ? (
                allColumns.map((col, index) => (
                  <th
                    key={index}
                    className={`px-4 py-4 w-[150px] min-w-[150px] h-14 border-b border-gray-200 text-sm whitespace-normal font-medium transition-colors ${
                      col.day === "monthly"
                        ? "bg-purple-600 text-white"
                        : "bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
                    }`}
                    onClick={() =>
                      col.day !== "monthly" && handleColumnHeaderClick(col)
                    }
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {col.day === "monthly" ? (
                        <>
                          <span className="font-bold">نمره ماهانه</span>
                          <span>{col.formattedDate}</span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center">
                            <span>
                              {col.day} - زنگ {col.timeSlot}
                            </span>

                            {/* Show comment and event icons if they exist */}
                            <div className="flex ml-2 space-x-1">
                              {columnsWithComments.has(getColumnKey(col)) && (
                                <ChatBubbleLeftIcon
                                  className="h-4 w-4 text-yellow-300"
                                  title="یادداشت روزانه معلم"
                                />
                              )}
                              {columnsWithEvents.has(getColumnKey(col)) && (
                                <CalendarIcon
                                  className="h-4 w-4 text-yellow-300"
                                  title="رویداد"
                                />
                              )}
                            </div>
                          </div>
                          <span className="text-xs opacity-90">
                            {col.formattedDate}
                          </span>
                          <span className="text-xl mt-1">➕</span>
                        </>
                      )}
                    </div>
                  </th>
                ))
              ) : (
                <th className="px-4 py-3 w-[150px] min-w-[150px] h-14 border-b border-gray-200 bg-gray-100 text-center">
                  لطفاً تاریخ شروع و پایان را وارد کنید
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {students?.map((student) => {
              const fullName = `${student.studentName} ${student.studentlname}`;
              return (
                <tr key={student.studentCode}>
                  <td
                    className="sticky right-0 z-10 px-2 py-2 w-[160px] min-w-[160px] h-12 border-r border-b border-gray-200 bg-white cursor-pointer hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50 shadow-sm transition-all duration-200"
                    onClick={() => handleStudentNameClick(student)}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {/* Student Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden shadow-md ring-1 ring-white">
                          <img
                            src={`/avatars/${student.studentCode}.jpg`}
                            alt={`${fullName} Avatar`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initial-based avatar
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const parent = target.parentElement;
                              if (parent) {
                                parent.className =
                                  "w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md ring-1 ring-white";
                                parent.innerHTML = `<span class="text-white font-bold text-sm">${student.studentName.charAt(
                                  0
                                )}</span>`;
                              }
                            }}
                          />
                        </div>
                        {/* Activity status indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white shadow-sm"></div>
                      </div>

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 text-xs truncate">
                            {fullName}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {student.studentCode}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-sm hover:shadow-md transition-all duration-200">
                          گزارش
                        </div>
                      </div>
                    </div>
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
                      let gradeColor = "bg-gray-200 text-gray-700";
                      let assessmentAdjustment = 0;

                      if (hasGrades) {
                        // Calculate total value and points for grades
                        const totalValue = allGrades.reduce(
                          (sum, grade) => sum + grade.value,
                          0
                        );
                        const totalPoints = allGrades.reduce(
                          (sum, grade) => sum + (grade.totalPoints || 20),
                          0
                        );

                        // Calculate assessment point adjustments
                        const monthAssessments = monthCells.flatMap(
                          (cell) => cell.assessments || []
                        );

                        assessmentAdjustment = monthAssessments.reduce(
                          (sum, assessment) => {
                            const weight = getAssessmentWeight(
                              assessment.value
                            );
                            return sum + weight;
                          },
                          0
                        );

                        // Calculate the base grade
                        const baseGrade = (totalValue / totalPoints) * 20;

                        // Apply assessment adjustment (but keep grade within 0-20 range)
                        const finalGrade = Math.max(
                          0,
                          Math.min(20, baseGrade + assessmentAdjustment)
                        );

                        monthlyGrade = finalGrade.toFixed(2);

                        // Color based on grade value
                        const gradeValue = parseFloat(monthlyGrade);
                        if (gradeValue >= 16)
                          gradeColor = "bg-green-600 text-white";
                        else if (gradeValue >= 12)
                          gradeColor = "bg-amber-500 text-white";
                        else gradeColor = "bg-red-600 text-white";
                      }

                      return (
                        <td
                          key={`monthly-grade-${student.studentCode}-${index}`}
                          className="px-3 py-3 w-[150px] min-w-[150px] text-center border-b border-gray-200 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors hover:shadow-md hover:border-purple-300"
                          onClick={() =>
                            handleMonthlyCellClick(
                              student,
                              col.formattedDate,
                              monthCells
                            )
                          }
                        >
                          <div className="flex flex-col items-center">
                            <div className="text-sm font-medium mb-2 text-purple-800">
                              نمره ماهانه
                            </div>
                            <Badge
                              className={`text-base font-bold px-3 py-1 ${gradeColor}`}
                            >
                              {monthlyGrade}
                            </Badge>
                            <div className="text-xs mt-2 text-gray-500">
                              {allGrades.length} نمره
                            </div>
                            {assessmentAdjustment !== 0 && (
                              <div className="text-xs mt-1 text-gray-500 flex items-center">
                                <span>تعدیل:</span>
                                <Badge
                                  className={`mr-1 px-1.5 ${
                                    assessmentAdjustment > 0
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {assessmentAdjustment > 0 ? "+" : ""}
                                  {assessmentAdjustment}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Regular cell handling (existing code)
                    const cellData = getCellContent(student.studentCode, col);

                    // Prepare cell display content
                    let displayContent: React.ReactNode = (
                      <div className="flex items-center justify-center h-full w-full opacity-30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </div>
                    );

                    if (cellData) {
                      // Prepare the cell content
                      displayContent = (
                        <div className="flex flex-col items-center gap-1.5 h-full w-full">
                          {/* Presence Status Badge */}
                          <div className="w-full text-center">
                            {cellData.presenceStatus === "present" && (
                              <Badge className="bg-green-100 text-green-800 font-medium border border-green-200 shadow-sm">
                                حاضر
                              </Badge>
                            )}
                            {cellData.presenceStatus === "absent" && (
                              <Badge className="bg-red-100 text-red-800 font-medium border border-red-200 shadow-sm">
                                غایب
                              </Badge>
                            )}
                            {cellData.presenceStatus === "late" && (
                              <Badge className="bg-amber-100 text-amber-800 font-medium border border-amber-200 shadow-sm">
                                تاخیر
                              </Badge>
                            )}
                          </div>

                          {/* Descriptive Status Badge (if any) */}
                          {cellData.descriptiveStatus && (
                            <div className="w-full text-center mt-1">
                              <Badge className="bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
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
                                        <Badge className="bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
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
                                          border shadow-sm
                                          ${
                                            percentage >= 80
                                              ? "bg-green-100 text-green-800 border-green-200"
                                              : percentage >= 60
                                              ? "bg-amber-100 text-amber-800 border-amber-200"
                                              : "bg-red-100 text-red-800 border-red-200"
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
                            <div className="text-xs truncate mt-1.5 text-gray-700 max-w-full bg-gray-50 px-2 py-0.5 rounded-sm border border-gray-100 w-full text-center">
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
                        className="px-2 py-2 w-[150px] min-w-[150px] h-14 text-center border border-gray-200 cursor-pointer transition-all overflow-hidden hover:bg-blue-50 hover:shadow-md hover:border-blue-200"
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
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
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

          <div className="space-y-4 mt-4">
            {/* Presence Status */}
            <div>
              <Label htmlFor="presenceStatus" className="block mb-2">
                وضعیت حضور
              </Label>
              <Select
                value={presenceStatus}
                onValueChange={(value) =>
                  setPresenceStatus(value as PresenceStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب وضعیت حضور" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value=" ">انتخاب کنید</SelectItem>
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
                    // Get assessment weight
                    const weight = getAssessmentWeight(assessment.value);

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
                        {weight !== 0 && (
                          <span className="text-xs text-gray-600">
                            ({weight > 0 ? "+" : ""}
                            {weight})
                          </span>
                        )}
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
                          {assessmentValues.map((valueObj) => (
                            <SelectItem
                              key={valueObj.value}
                              value={valueObj.value}
                            >
                              {valueObj.value}{" "}
                              {valueObj.weight !== 0 && (
                                <span className="text-xs text-gray-600">
                                  ({valueObj.weight > 0 ? "+" : ""}
                                  {valueObj.weight})
                                </span>
                              )}
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
                  <div className="flex flex-col gap-2 bg-gray-50 p-2 rounded">
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
                    <div className="flex-1">
                      <Label htmlFor="custom-weight" className="text-xs">
                        تاثیر در نمره ماهانه:
                      </Label>
                      <Input
                        id="custom-weight"
                        type="number"
                        min="-5"
                        max="5"
                        step="0.5"
                        value={customAssessmentWeight}
                        onChange={(e) =>
                          setCustomAssessmentWeight(
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="میزان تاثیر را وارد کنید..."
                        className="mt-1"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        مقدار مثبت باعث افزایش و مقدار منفی باعث کاهش نمره
                        می‌شود.
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
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
                          setCustomAssessmentWeight(0);
                        }}
                      >
                        انصراف
                      </Button>
                    </div>
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

      {/* Monthly Report Modal */}
      <Dialog open={isMonthlyReportOpen} onOpenChange={setIsMonthlyReportOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>
              گزارش ماهانه {monthlyReportData?.month} -{" "}
              {monthlyReportData?.student?.studentName}{" "}
              {monthlyReportData?.student?.studentlname}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {monthlyReportData && (
              <>
                {/* Grade Summary */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold mb-3">خلاصه نمرات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">نمره پایه</div>
                      <div className="text-2xl font-bold">
                        {monthlyReportData.baseGrade.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        بدون تعدیل ارزیابی‌ها
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">
                        تعدیل ارزیابی‌ها
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {monthlyReportData.assessmentAdjustment > 0 ? "+" : ""}
                        {monthlyReportData.assessmentAdjustment.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        تاثیر ارزیابی‌ها در نمره
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">نمره نهایی</div>
                      <div
                        className={`text-2xl font-bold ${
                          monthlyReportData.finalGrade >= 16
                            ? "text-green-600"
                            : monthlyReportData.finalGrade >= 12
                            ? "text-amber-500"
                            : "text-red-600"
                        }`}
                      >
                        {monthlyReportData.finalGrade.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">از ۲۰</div>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg font-bold mb-3">خلاصه حضور و غیاب</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">حضور</div>
                      <div className="text-2xl font-bold text-green-600">
                        {monthlyReportData.attendanceSummary.present}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">جلسه</div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">غیبت</div>
                      <div className="text-2xl font-bold text-red-600">
                        {monthlyReportData.attendanceSummary.absent}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">جلسه</div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg shadow-sm">
                      <div className="text-sm font-medium mb-2">تاخیر</div>
                      <div className="text-2xl font-bold text-amber-500">
                        {monthlyReportData.attendanceSummary.late}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">جلسه</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Grades */}
                {monthlyReportData.allGrades.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold mb-3">نمرات جزئی</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="p-2 text-right">تاریخ</th>
                            <th className="p-2 text-right">نمره</th>
                            <th className="p-2 text-right">از</th>
                            <th className="p-2 text-right">توضیحات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {monthlyReportData.allGrades.map((grade, idx) => {
                            // Format the date from ISO string
                            const gradeDate = new Date(grade.date);
                            const formattedDate = gradeDate
                              ? formatJalaliDate(gradeDate)
                              : "-";

                            return (
                              <tr
                                key={idx}
                                className="border-b border-gray-200 hover:bg-gray-100"
                              >
                                <td className="p-2">{formattedDate}</td>
                                <td className="p-2 font-bold">{grade.value}</td>
                                <td className="p-2">
                                  {grade.totalPoints || 20}
                                </td>
                                <td className="p-2">
                                  {grade.description || "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Assessments Summary */}
                {Object.keys(monthlyReportData.assessmentsSummary).length >
                  0 && (
                  <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold mb-3">خلاصه ارزیابی‌ها</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(monthlyReportData.assessmentsSummary).map(
                        ([title, values]) => (
                          <div
                            key={title}
                            className="p-3 bg-white rounded-lg shadow-sm"
                          >
                            <h4 className="font-bold text-md mb-2">{title}</h4>
                            <div className="flex flex-wrap gap-2">
                              {values.map((value, idx) => {
                                // Get weight for this assessment value
                                const weight = getAssessmentWeight(value);

                                // Choose color based on value
                                let bgColor = "bg-gray-100";
                                if (value === "عالی")
                                  bgColor = "bg-green-100 text-green-800";
                                else if (value === "خوب")
                                  bgColor = "bg-blue-100 text-blue-800";
                                else if (value === "متوسط")
                                  bgColor = "bg-yellow-100 text-yellow-800";
                                else if (value === "ضعیف")
                                  bgColor = "bg-orange-100 text-orange-800";
                                else if (value === "بسیار ضعیف")
                                  bgColor = "bg-red-100 text-red-800";

                                return (
                                  <div
                                    key={idx}
                                    className={`px-2 py-1 rounded-full ${bgColor} text-sm flex items-center`}
                                  >
                                    {value}
                                    {weight !== 0 && (
                                      <span className="text-xs text-gray-600 ml-1">
                                        ({weight > 0 ? "+" : ""}
                                        {weight})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={() => setIsMonthlyReportOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Report Modal */}
      <Dialog open={isStudentReportOpen} onOpenChange={setIsStudentReportOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle>
              گزارش کامل {studentReportData?.student?.studentName}{" "}
              {studentReportData?.student?.studentlname}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {studentReportData && (
              <>
                {/* GPA and Attendance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-lg font-medium mb-2">معدل کل</div>
                    <div
                      className={`text-3xl font-bold ${
                        studentReportData.averageGrade >= 16
                          ? "text-green-600"
                          : studentReportData.averageGrade >= 12
                          ? "text-amber-500"
                          : "text-red-600"
                      }`}
                    >
                      {studentReportData.averageGrade.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">از ۲۰</div>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-lg font-medium mb-2">حضور</div>
                    <div className="text-3xl font-bold text-green-600">
                      {studentReportData.totalAttendance.present}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">جلسه</div>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-lg font-medium mb-2">غیبت</div>
                    <div className="text-3xl font-bold text-red-600">
                      {studentReportData.totalAttendance.absent}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">جلسه</div>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="text-lg font-medium mb-2">تاخیر</div>
                    <div className="text-3xl font-bold text-amber-500">
                      {studentReportData.totalAttendance.late}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">جلسه</div>
                  </div>
                </div>

                {/* Progress Chart */}
                {studentReportData.monthlyGrades.length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                    <h3 className="text-lg font-bold mb-4">
                      نمودار پیشرفت تحصیلی
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={studentReportData.monthlyGrades}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis
                            domain={[0, 20]}
                            ticks={[0, 5, 10, 15, 20]}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: number) => value.toFixed(2)}
                            labelFormatter={(label: string) => `ماه: ${label}`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="grade"
                            name="نمره نهایی"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ r: 6 }}
                            activeDot={{ r: 8 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="baseGrade"
                            name="نمره پایه (بدون تعدیل)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Monthly Data Table */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
                  <h3 className="text-lg font-bold mb-4">جدول نمرات ماهانه</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-right border">ماه</th>
                          <th className="p-2 text-right border">نمره نهایی</th>
                          <th className="p-2 text-right border">نمره پایه</th>
                          <th className="p-2 text-right border">
                            تعدیل ارزیابی‌ها
                          </th>
                          <th className="p-2 text-right border">تعداد نمرات</th>
                          <th className="p-2 text-right border">حضور</th>
                          <th className="p-2 text-right border">غیبت</th>
                          <th className="p-2 text-right border">تاخیر</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentReportData.monthlyGrades.map((month, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-2 border font-bold">
                              {month.month}
                            </td>
                            <td
                              className={`p-2 border font-bold ${
                                month.grade >= 16
                                  ? "text-green-600"
                                  : month.grade >= 12
                                  ? "text-amber-500"
                                  : month.grade > 0
                                  ? "text-red-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {month.grade > 0 ? month.grade.toFixed(2) : "-"}
                            </td>
                            <td className="p-2 border">
                              {month.baseGrade > 0
                                ? month.baseGrade.toFixed(2)
                                : "-"}
                            </td>
                            <td className="p-2 border">
                              {month.assessmentAdjustment !== 0
                                ? `${
                                    month.assessmentAdjustment > 0 ? "+" : ""
                                  }${month.assessmentAdjustment.toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="p-2 border">
                              {month.totalGrades || "-"}
                            </td>
                            <td className="p-2 border text-green-600">
                              {month.attendance.present || "-"}
                            </td>
                            <td className="p-2 border text-red-600">
                              {month.attendance.absent || "-"}
                            </td>
                            <td className="p-2 border text-amber-500">
                              {month.attendance.late || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assessment Summary */}
                {Object.keys(studentReportData.totalAssessments).length > 0 && (
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold mb-4">خلاصه ارزیابی‌ها</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(studentReportData.totalAssessments).map(
                        ([title, values]) => (
                          <div
                            key={title}
                            className="p-3 bg-gray-50 rounded-lg shadow-sm"
                          >
                            <h4 className="font-bold text-md mb-2">{title}</h4>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(values).map(
                                ([value, count], idx) => {
                                  // Get weight for this assessment value
                                  const weight = getAssessmentWeight(value);

                                  // Choose color based on value
                                  let bgColor = "bg-gray-100";
                                  if (value === "عالی")
                                    bgColor = "bg-green-100 text-green-800";
                                  else if (value === "خوب")
                                    bgColor = "bg-blue-100 text-blue-800";
                                  else if (value === "متوسط")
                                    bgColor = "bg-yellow-100 text-yellow-800";
                                  else if (value === "ضعیف")
                                    bgColor = "bg-orange-100 text-orange-800";
                                  else if (value === "بسیار ضعیف")
                                    bgColor = "bg-red-100 text-red-800";

                                  return (
                                    <div
                                      key={idx}
                                      className={`px-2 py-1 rounded-full ${bgColor} text-sm flex items-center`}
                                    >
                                      {value}
                                      <span className="mx-1">×</span>
                                      <span className="font-bold">{count}</span>
                                      {weight !== 0 && (
                                        <span className="text-xs text-gray-600 ml-1">
                                          ({weight > 0 ? "+" : ""}
                                          {weight})
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={() => setIsStudentReportOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Modal */}
      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              وارد کردن دسته جمعی{" "}
              {selectedColumn && (
                <>
                  برای تاریخ{" "}
                  <span className="text-blue-600">
                    {selectedColumn.formattedDate} ({selectedColumn.day} - زنگ{" "}
                    {selectedColumn.timeSlot})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 mt-4 max-h-[70vh] overflow-y-auto p-4">
            {/* Presence Status */}
            <div>
              <Label htmlFor="bulkPresenceStatus" className="block mb-2">
                وضعیت حضور (همه دانش آموزان)
              </Label>
              <Select
                value={bulkPresenceStatus}
                onValueChange={(value) =>
                  setBulkPresenceStatus(value as PresenceStatus | "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب وضعیت حضور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">انتخاب کنید</SelectItem>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="absent">غایب</SelectItem>
                  <SelectItem value="late">با تاخیر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descriptive Status */}
            <div>
              <Label htmlFor="bulkDescriptiveStatus" className="block mb-2">
                وضعیت توصیفی (همه دانش آموزان)
              </Label>
              <Select
                value={bulkDescriptiveStatus}
                onValueChange={(value) => setBulkDescriptiveStatus(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب وضعیت توصیفی" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="1">بدون وضعیت</SelectItem> */}
                  <SelectItem value="نیاز به تلاش بیشتر">
                    نیاز به تلاش بیشتر
                  </SelectItem>
                  <SelectItem value="قابل قبول">قابل قبول</SelectItem>
                  <SelectItem value="خوب">خوب</SelectItem>
                  <SelectItem value="خیلی خوب">خیلی خوب</SelectItem>
                  <SelectItem value="عالی">عالی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Grade */}
            <div className="border p-4 rounded-md bg-blue-50">
              <h3 className="font-bold mb-3">
                افزودن نمره برای همه دانش آموزان
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulkGradeValue" className="block mb-2">
                    مقدار نمره
                  </Label>
                  <Input
                    id="bulkGradeValue"
                    type="number"
                    value={bulkGrade.value}
                    onChange={(e) =>
                      setBulkGrade((prev) => ({
                        ...prev,
                        value: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="bulkGradeTotalPoints" className="block mb-2">
                    از چند نمره
                  </Label>
                  <Input
                    id="bulkGradeTotalPoints"
                    type="number"
                    value={bulkGrade.totalPoints}
                    onChange={(e) =>
                      setBulkGrade((prev) => ({
                        ...prev,
                        totalPoints: parseFloat(e.target.value) || 20,
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="bulkGradeDescription" className="block mb-2">
                    توضیحات نمره (اختیاری)
                  </Label>
                  <Input
                    id="bulkGradeDescription"
                    value={bulkGrade.description}
                    onChange={(e) =>
                      setBulkGrade((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Assessment */}
            <div className="border p-4 rounded-md bg-green-50">
              <h3 className="font-bold mb-3">
                افزودن ارزیابی برای همه دانش آموزان
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bulkAssessmentTitle" className="block mb-2">
                    عنوان ارزیابی
                  </Label>
                  <Select
                    value={bulkAssessment.title}
                    onValueChange={(value) =>
                      setBulkAssessment((prev) => ({ ...prev, title: value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب عنوان ارزیابی" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_TITLES.map((title, idx) => (
                        <SelectItem key={idx} value={title}>
                          {title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bulkAssessmentValue" className="block mb-2">
                    مقدار ارزیابی
                  </Label>
                  <Select
                    value={bulkAssessment.value}
                    onValueChange={(value) =>
                      setBulkAssessment((prev) => ({ ...prev, value }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="انتخاب مقدار ارزیابی" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSESSMENT_VALUES.map((entry, index) => (
                        <SelectItem key={index} value={entry.value}>
                          {entry.value}{" "}
                          {entry.weight !== 0 && (
                            <span>
                              ({entry.weight > 0 ? "+" : ""}
                              {entry.weight})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="bulkNote" className="block mb-2">
                یادداشت (برای همه دانش آموزان)
              </Label>
              <Textarea
                id="bulkNote"
                value={bulkNote}
                onChange={(e) => setBulkNote(e.target.value)}
                className="min-h-[100px] w-full"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBulkModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={handleBulkSave}
              disabled={isBulkLoading}
              className="mr-2"
            >
              {isBulkLoading ? "در حال ذخیره..." : "ذخیره برای همه دانش آموزان"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Comment Modal */}
      <Dialog
        open={isTeacherCommentModalOpen}
        onOpenChange={setIsTeacherCommentModalOpen}
      >
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              یادداشت روزانه معلم{" "}
              {selectedColumn && (
                <>
                  برای تاریخ{" "}
                  <span className="text-blue-600">
                    {selectedColumn.formattedDate} ({selectedColumn.day} - زنگ{" "}
                    {selectedColumn.timeSlot})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <div className="mb-3">
              <Label htmlFor="teacherComment">یادداشت فعالیت‌های کلاسی:</Label>
              <Textarea
                id="teacherComment"
                rows={6}
                placeholder="یادداشت خود را وارد کنید..."
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                className="mt-1 w-full"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              onClick={handleSaveTeacherComment}
              disabled={isSavingComment}
            >
              {isSavingComment ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-r-transparent rounded-full mr-2"></span>
                  ذخیره...
                </>
              ) : (
                "ذخیره یادداشت"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTeacherCommentModalOpen(false)}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Events Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              رویدادهای{" "}
              {selectedColumn && (
                <>
                  تاریخ{" "}
                  <span className="text-blue-600">
                    {selectedColumn.formattedDate} ({selectedColumn.day} - زنگ{" "}
                    {selectedColumn.timeSlot})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {/* Existing Events */}
            {isLoadingEvents ? (
              <div className="text-center p-4">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-r-transparent rounded-full mx-auto mb-2"></div>
                <p>در حال بارگیری رویدادها...</p>
              </div>
            ) : events.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">رویدادهای ثبت شده:</h3>
                <div className="space-y-3 max-h-[40vh] overflow-y-auto p-1">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="border rounded-md p-3 bg-gray-50 relative hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => handleDeleteEvent(event._id!)}
                        className="absolute top-2 left-2 text-red-500 hover:text-red-700"
                        title="حذف رویداد"
                        aria-label="Delete event"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                      <h4 className="font-bold">{event.title}</h4>
                      <p className="text-gray-600 text-sm mb-1">
                        {event.persianDate}
                      </p>
                      <p className="text-gray-800">{event.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-4 mb-6 bg-gray-50 rounded-md">
                <p>هیچ رویدادی برای این تاریخ ثبت نشده است.</p>
              </div>
            )}

            {/* Add New Event Form */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">افزودن رویداد جدید:</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventTitle">عنوان رویداد:</Label>
                  <Input
                    id="eventTitle"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="عنوان رویداد را وارد کنید..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDescription">توضیحات:</Label>
                  <Textarea
                    id="eventDescription"
                    rows={3}
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="توضیحات رویداد را وارد کنید..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-start mt-4">
            <Button
              type="button"
              onClick={handleAddEvent}
              disabled={isSavingEvent || !newEventTitle.trim()}
            >
              {isSavingEvent ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-r-transparent rounded-full mr-2"></span>
                  افزودن...
                </>
              ) : (
                "افزودن رویداد"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEventModalOpen(false)}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Grade Entry Modal */}
      <Dialog open={isGroupGradeModalOpen} onOpenChange={setIsGroupGradeModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0" dir="rtl">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold">
              افزودن نمره گروهی{" "}
              {selectedColumn && (
                <>
                  برای تاریخ{" "}
                  <span className="text-blue-600">
                    {selectedColumn.formattedDate} ({selectedColumn.day} - زنگ{" "}
                    {selectedColumn.timeSlot})
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                💡 برای ورود سریع نمرات، از کلید Tab برای رفتن به فیلد بعدی استفاده کنید. 
                نمرات با مقدار 0 ذخیره نخواهند شد.
              </p>
            </div>

            {/* Set default values for all */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-md font-bold mb-3">تنظیم مقادیر پیش‌فرض</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">نمره پیش‌فرض از:</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    onChange={(e) => {
                      const defaultTotal = parseFloat(e.target.value) || 20;
                      const newGrades = { ...groupGrades };
                      Object.keys(newGrades).forEach((key) => {
                        newGrades[key].totalPoints = defaultTotal;
                      });
                      setGroupGrades(newGrades);
                    }}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">توضیحات پیش‌فرض:</Label>
                  <Input
                    type="text"
                    placeholder="توضیحات..."
                    onChange={(e) => {
                      const defaultDesc = e.target.value;
                      const newGrades = { ...groupGrades };
                      Object.keys(newGrades).forEach((key) => {
                        newGrades[key].description = defaultDesc;
                      });
                      setGroupGrades(newGrades);
                    }}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newGrades = { ...groupGrades };
                      Object.keys(newGrades).forEach((key) => {
                        newGrades[key].value = 0;
                      });
                      setGroupGrades(newGrades);
                    }}
                    className="w-full"
                  >
                    پاک کردن همه نمرات
                  </Button>
                </div>
              </div>
            </div>

            {/* Students Grid */}
            <div className="border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-3 text-right border-b w-8">#</th>
                    <th className="p-3 text-right border-b">نام دانش‌آموز</th>
                    <th className="p-3 text-right border-b w-32">نمره</th>
                    <th className="p-3 text-right border-b w-24">از</th>
                    <th className="p-3 text-right border-b">توضیحات</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => {
                    const grade = groupGrades[student.studentCode] || {
                      value: 0,
                      totalPoints: 20,
                      description: "",
                    };
                    
                    return (
                      <tr
                        key={student.studentCode}
                        className={`border-b hover:bg-gray-50 ${
                          grade.value > 0 ? "bg-green-50" : ""
                        }`}
                      >
                        <td className="p-2 text-center text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {student.studentName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {student.studentName} {student.studentlname}
                              </div>
                              <div className="text-xs text-gray-500">
                                {student.studentCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.25"
                            value={grade.value || ""}
                            onChange={(e) => {
                              const newGrades = { ...groupGrades };
                              newGrades[student.studentCode] = {
                                ...grade,
                                value: parseFloat(e.target.value) || 0,
                              };
                              setGroupGrades(newGrades);
                            }}
                            className="w-full"
                            placeholder="0"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min="1"
                            value={grade.totalPoints || 20}
                            onChange={(e) => {
                              const newGrades = { ...groupGrades };
                              newGrades[student.studentCode] = {
                                ...grade,
                                totalPoints: parseFloat(e.target.value) || 20,
                              };
                              setGroupGrades(newGrades);
                            }}
                            className="w-full"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            value={grade.description}
                            onChange={(e) => {
                              const newGrades = { ...groupGrades };
                              newGrades[student.studentCode] = {
                                ...grade,
                                description: e.target.value,
                              };
                              setGroupGrades(newGrades);
                            }}
                            className="w-full"
                            placeholder="توضیحات..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                تعداد نمرات وارد شده:{" "}
                <span className="font-bold">
                  {Object.values(groupGrades).filter((g) => g.value > 0).length}
                </span>{" "}
                از {students.length} دانش‌آموز
              </p>
            </div>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 sm:justify-start">
            <Button
              type="button"
              onClick={handleSaveGroupGrades}
              disabled={isSavingGroupGrades}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSavingGroupGrades ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-r-transparent rounded-full mr-2"></span>
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره نمرات"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGroupGradeModalOpen(false)}
              disabled={isSavingGroupGrades}
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassSheet;
