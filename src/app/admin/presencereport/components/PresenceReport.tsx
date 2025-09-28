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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { gregorian_to_jalali } from "@/utils/date-utils";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";

// Define types
type CellData = {
  classCode: string;
  studentCode: string;
  teacherCode: string;
  courseCode: string;
  schoolCode: string;
  date: string;
  timeSlot: string;
  note: string;
  grades: {
    value: number;
    description: string;
    date: string;
    totalPoints?: number;
  }[];
  presenceStatus: "present" | "absent" | "late" | null;
  descriptiveStatus?: string;
};

type PresenceRecord = {
  classCode: string;
  className: string;
  studentCode: string;
  studentName: string;
  teacherCode: string;
  teacherName: string;
  courseCode: string;
  courseName: string;
  date: string;
  timeSlot: string;
  presenceStatus: "present" | "absent" | "late";
};

type StudentStats = {
  studentCode: string;
  studentName: string;
  className: string;
  totalAbsent: number;
  totalLate: number;
  totalPresent: number;
  absentPercentage: number;
  latePercentage: number;
  presencePercentage: number;
  lastStatus?: {
    date: string;
    status: "present" | "absent" | "late";
    courseName: string;
  };
};

type CourseStats = {
  courseCode: string;
  courseName: string;
  teacherName: string;
  totalAbsent: number;
  totalLate: number;
  totalPresent: number;
  absentPercentage: number;
  latePercentage: number;
  presencePercentage: number;
};

type Student = {
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
};

type ClassDocument = {
  data: {
    classCode: string;
    className: string;
    major: string;
    Grade: string;
    schoolCode: string;
    teachers: {
      teacherCode: string;
      courseCode: string;
    }[];
    students: Student[];
  };
};

type StudentPhone = {
  number: string;
  owner: string;
};

type StudentWithPhones = Student & {
  phones: StudentPhone[];
};

// Helper function: Convert numbers to Persian digits.
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
    .join("");
}

// Helper function to format date
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const [jYear, jMonth, jDay] = gregorian_to_jalali(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    return toPersianDigits(`${jYear}/${jMonth}/${jDay}`);
  } catch {
    return "—";
  }
}

// Main PresenceReport component
const PresenceReport = ({
  schoolCode,
  teacherCode,
  classDocuments,
}: {
  schoolCode: string;
  teacherCode?: string;
  classDocuments: ClassDocument[];
}) => {
  // Add custom styles
  const customStyles = `
    .filter-card {
      background: linear-gradient(to right, #f9fafb, #f3f4f6);
      border: 1px solid #e5e7eb;
    }
    
    .stat-card {
      transition: all 0.3s ease;
      border-radius: 0.5rem;
      overflow: hidden;
    }
    
    .stat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    
    .status-badge {
      border-radius: 9999px;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      display: inline-block;
    }
    
    .status-present {
      background-color: rgba(16, 185, 129, 0.1);
      color: rgb(16, 185, 129);
    }
    
    .status-absent {
      background-color: rgba(239, 68, 68, 0.1);
      color: rgb(239, 68, 68);
    }
    
    .status-late {
      background-color: rgba(245, 158, 11, 0.1);
      color: rgb(245, 158, 11);
    }
    
    .chart-container {
      height: 200px;
      display: flex;
      align-items: flex-end;
      gap: 8px;
      padding: 16px;
    }
    
    .chart-bar {
      flex-grow: 1;
      border-radius: 4px 4px 0 0;
      position: relative;
    }
    
    .chart-bar-label {
      position: absolute;
      bottom: -24px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.75rem;
      color: #6b7280;
    }
    
    .chart-bar-value {
      position: absolute;
      top: -24px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    // body, html {
    //   direction: rtl;
    //   text-align: right;
    // }

    .table-data {
      text-align: right;
    }

    .pagination {
      flex-direction: row-reverse;
    }

    input, select, textarea {
      text-align: right;
    }

    .rmdp-container {
      text-align: right;
      direction: rtl;
    }

    .table th, .table td {
      text-align: right;
    }

    /* Fix for RTL progress bars */
    .progress-bar-rtl {
      direction: ltr;
    }

    /* Fix for RTL flexbox */
    .flex-row-reverse {
      flex-direction: row-reverse;
    }
    
    /* Chart specific styles */
    .chart-wrapper {
      position: relative;
      height: 20rem; /* 320px */
      margin-top: 1.5rem;
    }
    
    .chart-bar {
      transition: all 0.3s ease;
    }
    
    .chart-bar:hover {
      opacity: 0.9;
      transform: translateY(-3px);
    }
    
    @media print {
      .print-hidden {
        display: none !important;
      }

      /* Optimize for printing */
      body {
        font-size: 12px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Reduce spacing */
      .space-y-6 > * + * {
        margin-top: 1rem !important;
      }

      .card {
        margin-bottom: 0.75rem !important;
        box-shadow: none !important;
        border: 1px solid #e5e7eb !important;
      }

      /* Make card headers more compact */
      .card-header {
        padding: 0.5rem 1rem !important;
      }

      .card-content {
        padding: 0.75rem 1rem !important;
      }

      /* Make tables more compact */
      .table th, .table td {
        padding: 0.4rem 0.5rem !important;
        font-size: 11px !important;
        white-space: nowrap !important;
      }

      /* Keep colors on print */
      .text-red-600, .text-red-700, .text-red-800 {
        color: #dc2626 !important;
      }
      
      .text-green-600, .text-green-700, .text-green-800 {
        color: #059669 !important;
      }
      
      .text-yellow-600, .text-yellow-700, .text-yellow-800 {
        color: #d97706 !important;
      }

      /* Summary cards more compact */
      .grid.grid-cols-4 {
        grid-gap: 0.5rem !important;
      }

      .card-content {
        padding-top: 0.5rem !important;
        padding-bottom: 0.5rem !important;
      }

      /* Optimize tables for limited width */
      .table-container {
        width: 100% !important;
        overflow-x: visible !important;
      }

      /* Reduce progress bar heights */
      .h-2\.5 {
        height: 0.4rem !important;
      }

      .h-8 {
        height: 1.2rem !important;
      }

      /* Scale down headings */
      h1, h2, h3, .text-xl, .text-lg {
        font-size: 14px !important;
      }

      .text-3xl {
        font-size: 18px !important;
      }
 
      /* Add page break controls */
      .page-break-before {
        page-break-before: always;
      }
      
      .no-page-break {
        page-break-inside: avoid;
      }
      
      /* Make summary cards more space efficient in print */
      .print-grid-cols-4 {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.5rem;
      }
      
      /* Reduce card padding further for print */
      .summary-card {
        padding: 0.3rem !important;
      }
      
      /* Make status badges more compact for print */
      .text-xs {
        font-size: 9px !important;
      }
      
      /* Smaller font for table content in print */
      tbody td {
        font-size: 10px !important;
      }
      
      /* Hide empty spaces in print */
      .print-hidden, .empty-message {
        display: none !important;
      }
      
      /* Each tab section should start on a new page */
      .tabs-content-wrapper {
        page-break-before: always;
      }
      
      .table-container {
        page-break-inside: avoid;
      }
      
      /* Chart print optimizations */
      .chart-wrapper {
        height: 15rem !important; /* Smaller chart for print */
      }
      
      .chart-bar-label {
        font-size: 8px !important;
      }
      
      .transform.-rotate-45 {
        font-size: 7px !important;
      }
    }
  `;

  // Component state
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [persianDate, setPersianDate] = useState<Value>(new Date());
  const [loading, setLoading] = useState(false);
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([]);
  const [todayAbsent, setTodayAbsent] = useState<PresenceRecord[]>([]);
  const [todayLate, setTodayLate] = useState<PresenceRecord[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [teachersInfo, setTeachersInfo] = useState<Record<string, string>>({});
  const [coursesInfo, setCoursesInfo] = useState<
    Record<string, { courseName: string }>
  >({});
  const [activeTab, setActiveTab] = useState("today");
  const [dailyAbsenceData, setDailyAbsenceData] = useState<{
    dates: string[];
    counts: number[];
    persianDates: string[];
  }>({ dates: [], counts: [], persianDates: [] });

  // SMS related state
  const [isSmsDialogOpen, setIsSmsDialogOpen] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<StudentWithPhones[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<Record<string, string[]>>({});
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSection, setSmsSection] = useState<"absent" | "late">("absent");
  const [isSmsEnabled, setIsSmsEnabled] = useState<boolean | null>(null);
  const [isCheckingSmsStatus, setIsCheckingSmsStatus] = useState(true);
  const [smsCredit, setSmsCredit] = useState<string>("0");
  const [isLoadingCredit, setIsLoadingCredit] = useState(false);
  const [smsHistory, setSmsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showSmsHistory, setShowSmsHistory] = useState(false);
  const [smsHistoryPagination, setSmsHistoryPagination] = useState<any>(null);
  const [smsHistoryFilters, setSmsHistoryFilters] = useState({
    page: 1,
    search: "",
    section: "",
    status: "",
    startDate: "",
    endDate: ""
  });
  const { user } = useAuth();

  // Fetch SMS credit
  const fetchSmsCredit = async () => {
    if (user?.userType !== "school" || !isSmsEnabled) return;

    try {
      setIsLoadingCredit(true);
      const response = await fetch("/api/sms/credit", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSmsCredit(data.credit);
      } else {
        console.error("Failed to fetch SMS credit");
      }
    } catch (error) {
      console.error("Error fetching SMS credit:", error);
    } finally {
      setIsLoadingCredit(false);
    }
  };

  // Fetch SMS history with filters and pagination
  const fetchSmsHistory = async (filters = smsHistoryFilters) => {
    if (user?.userType !== "school") return;

    try {
      setIsLoadingHistory(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', '20');
      
      if (filters.search) params.append('search', filters.search);
      if (filters.section) params.append('section', filters.section);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/sms/history?${params.toString()}`, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSmsHistory(data.history || []);
        setSmsHistoryPagination(data.pagination || null);
      } else {
        console.error("Failed to fetch SMS history");
      }
    } catch (error) {
      console.error("Error fetching SMS history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Check SMS activation status
  useEffect(() => {
    const checkSmsStatus = async () => {
      if (user?.userType !== "school") {
        setIsCheckingSmsStatus(false);
        return;
      }

      try {
        const response = await fetch("/api/sms/status-check", {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsSmsEnabled(data.isSmsEnabled);
          
          // If SMS is enabled, fetch credit and history
          if (data.isSmsEnabled) {
            await fetchSmsCredit();
            await fetchSmsHistory();
          }
        } else {
          setIsSmsEnabled(false);
        }
      } catch (error) {
        console.error("Error checking SMS status:", error);
        setIsSmsEnabled(false);
      } finally {
        setIsCheckingSmsStatus(false);
      }
    };

    checkSmsStatus();
  }, [user?.userType, schoolCode]);

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

        // Fetch courses
        const coursesResponse = await fetch(
          `/api/courses/sheet?schoolCode=${schoolCode}`
        );

        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json();

          // Create a map of course codes to course data
          const courseMap: Record<string, { courseName: string }> = {};

          if (Array.isArray(coursesData)) {
            coursesData.forEach((course) => {
              // Handle different data structures
              const courseCode =
                course.courseCode || (course.data && course.data.courseCode);
              if (courseCode) {
                courseMap[courseCode] = {
                  courseName:
                    course.courseName ||
                    (course.data && course.data.courseName) ||
                    courseCode,
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

  // Fetch presence data
  const fetchPresenceData = useCallback(async () => {
    if (!selectedClass && !schoolCode) return;

    setLoading(true);
    try {
      // Prepare API parameters
      const params: Record<string, string> = {
        schoolCode,
      };

      if (selectedClass) {
        params.classCode = selectedClass;
      }

      if (teacherCode) {
        params.teacherCode = teacherCode;
      }

      // Build query string
      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&");

      // Fetch presence data
      const response = await fetch(`/api/presence?${queryString}`);

      if (!response.ok) {
        throw new Error("Failed to fetch presence data");
      }

      const cellData: CellData[] = await response.json();

      // Process and filter presence data
      const records: PresenceRecord[] = [];

      for (const cell of cellData) {
        if (cell.presenceStatus === null) continue;

        // Find class and student info
        const classInfo = classDocuments.find(
          (doc) => doc.data.classCode === cell.classCode
        );
        if (!classInfo) continue;

        const studentInfo = classInfo.data.students.find(
          (student) => student.studentCode === cell.studentCode
        );
        if (!studentInfo) continue;

        // Get teacher and course names
        const teacherName = teachersInfo[cell.teacherCode] || cell.teacherCode;
        const courseName =
          coursesInfo[cell.courseCode]?.courseName || cell.courseCode;

        records.push({
          classCode: cell.classCode,
          className: classInfo.data.className,
          studentCode: cell.studentCode,
          studentName: `${studentInfo.studentName} ${studentInfo.studentlname}`,
          teacherCode: cell.teacherCode,
          teacherName,
          courseCode: cell.courseCode,
          courseName,
          date: cell.date,
          timeSlot: cell.timeSlot,
          presenceStatus: cell.presenceStatus,
        });
      }

      setPresenceRecords(records);

      // Process today's data
      const today = new Date(selectedDate);
      today.setHours(0, 0, 0, 0);

      const todayRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      setTodayAbsent(
        todayRecords.filter((record) => record.presenceStatus === "absent")
      );
      setTodayLate(
        todayRecords.filter((record) => record.presenceStatus === "late")
      );

      // Process student statistics
      const studentStatsMap = new Map<string, StudentStats>();

      for (const record of records) {
        const key = record.studentCode;

        if (!studentStatsMap.has(key)) {
          studentStatsMap.set(key, {
            studentCode: record.studentCode,
            studentName: record.studentName,
            className: record.className,
            totalAbsent: 0,
            totalLate: 0,
            totalPresent: 0,
            absentPercentage: 0,
            latePercentage: 0,
            presencePercentage: 0,
          });
        }

        const stats = studentStatsMap.get(key)!;

        if (record.presenceStatus === "absent") {
          stats.totalAbsent += 1;
        } else if (record.presenceStatus === "late") {
          stats.totalLate += 1;
        } else if (record.presenceStatus === "present") {
          stats.totalPresent += 1;
        }

        // Update last status if this record is newer
        if (
          !stats.lastStatus ||
          new Date(record.date) > new Date(stats.lastStatus.date)
        ) {
          stats.lastStatus = {
            date: record.date,
            status: record.presenceStatus,
            courseName: record.courseName,
          };
        }
      }

      // Calculate percentages
      for (const stats of studentStatsMap.values()) {
        const total = stats.totalAbsent + stats.totalLate + stats.totalPresent;
        if (total > 0) {
          stats.absentPercentage = Math.round(
            (stats.totalAbsent / total) * 100
          );
          stats.latePercentage = Math.round((stats.totalLate / total) * 100);
          stats.presencePercentage = Math.round(
            (stats.totalPresent / total) * 100
          );
        }
      }

      // Sort by absence percentage (descending)
      const sortedStudentStats = Array.from(studentStatsMap.values()).sort(
        (a, b) => b.absentPercentage - a.absentPercentage
      );

      setStudentStats(sortedStudentStats);

      // Process course statistics
      const courseStatsMap = new Map<string, CourseStats>();

      for (const record of records) {
        const key = record.courseCode;

        if (!courseStatsMap.has(key)) {
          courseStatsMap.set(key, {
            courseCode: record.courseCode,
            courseName: record.courseName,
            teacherName: record.teacherName,
            totalAbsent: 0,
            totalLate: 0,
            totalPresent: 0,
            absentPercentage: 0,
            latePercentage: 0,
            presencePercentage: 0,
          });
        }

        const stats = courseStatsMap.get(key)!;

        if (record.presenceStatus === "absent") {
          stats.totalAbsent += 1;
        } else if (record.presenceStatus === "late") {
          stats.totalLate += 1;
        } else if (record.presenceStatus === "present") {
          stats.totalPresent += 1;
        }
      }

      // Calculate percentages
      for (const stats of courseStatsMap.values()) {
        const total = stats.totalAbsent + stats.totalLate + stats.totalPresent;
        if (total > 0) {
          stats.absentPercentage = Math.round(
            (stats.totalAbsent / total) * 100
          );
          stats.latePercentage = Math.round((stats.totalLate / total) * 100);
          stats.presencePercentage = Math.round(
            (stats.totalPresent / total) * 100
          );
        }
      }

      // Sort by absence percentage (descending)
      const sortedCourseStats = Array.from(courseStatsMap.values()).sort(
        (a, b) => b.absentPercentage - a.absentPercentage
      );

      setCourseStats(sortedCourseStats);

      // Process daily absence data
      processAbsenceByDay(records);
    } catch (error) {
      console.error("Error fetching presence data:", error);
    } finally {
      setLoading(false);
    }
  }, [
    selectedClass,
    selectedDate,
    schoolCode,
    teacherCode,
    classDocuments,
    teachersInfo,
    coursesInfo,
  ]);

  // Fetch data when selection changes
  useEffect(() => {
    fetchPresenceData();
  }, [fetchPresenceData]);

  // Add a print function after the fetchPresenceData function
  const handlePrint = () => {
    window.print();
  };

  // Handle date change from Persian calendar
  const handleDateChange = (date: Value) => {
    setPersianDate(date);

    // Convert to JavaScript Date object
    if (date) {
      const dateObj = date as unknown as { toDate: () => Date };
      if (dateObj.toDate) {
        const jsDate = dateObj.toDate();
        // Format as ISO string and extract the date part (YYYY-MM-DD)
        setSelectedDate(jsDate.toISOString().split("T")[0]);
      }
    }
  };

  // Process daily absence data
  const processAbsenceByDay = (records: PresenceRecord[]) => {
    // Group absences by date
    const dateCountMap = new Map<string, number>();

    for (const record of records) {
      if (record.presenceStatus === "absent") {
        const date = record.date.split("T")[0]; // Get just the date part
        dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
      }
    }

    // Sort dates
    const sortedDates = Array.from(dateCountMap.keys()).sort();

    // Get counts and format Persian dates
    const counts = sortedDates.map((date) => dateCountMap.get(date) || 0);
    const persianDates = sortedDates.map((date) => formatDate(date));

    setDailyAbsenceData({
      dates: sortedDates,
      counts,
      persianDates,
    });
  };

  // SMS Functions
  const openSmsDialog = async (section: "absent" | "late") => {
    setSmsSection(section);
    
    // Get the appropriate records based on section
    const records = section === "absent" ? todayAbsent : todayLate;
    
    if (records.length === 0) {
      toast.warning(`هیچ ${section === "absent" ? "غیبتی" : "تاخیری"} در تاریخ انتخاب شده ثبت نشده است.`);
      return;
    }

    // Fetch student phone numbers
    try {
      const studentCodes = records.map(record => record.studentCode);
      const response = await fetch("/api/students/phone-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          studentCodes,
          schoolCode,
        }),
      });

      if (response.ok) {
        const { students } = await response.json();
        setSelectedStudents(students);
        
        // Initialize selected phones for each student
        const initialSelectedPhones: Record<string, string[]> = {};
        students.forEach((student: StudentWithPhones) => {
          initialSelectedPhones[student.studentCode] = [];
        });
        setSelectedPhones(initialSelectedPhones);
        
        setIsSmsDialogOpen(true);
        setSmsMessage(`سلام، متاسفانه فرزند شما در تاریخ ${formatDate(selectedDate)} ${section === "absent" ? "غایب" : "با تاخیر"} بوده است.`);
      } else {
        toast.error("خطا در دریافت شماره‌های تلفن دانش‌آموزان");
      }
    } catch (error) {
      console.error("Error fetching student phones:", error);
      toast.error("خطا در دریافت شماره‌های تلفن دانش‌آموزان");
    }
  };

  const handlePhoneSelection = (studentCode: string, phoneNumber: string, checked: boolean) => {
    setSelectedPhones(prev => {
      const current = prev[studentCode] || [];
      if (checked) {
        return { ...prev, [studentCode]: [...current, phoneNumber] };
      } else {
        return { ...prev, [studentCode]: current.filter(phone => phone !== phoneNumber) };
      }
    });
  };

  const sendSms = async () => {
    if (!smsMessage.trim()) {
      toast.error("لطفا متن پیام را وارد کنید");
      return;
    }

    const allSelectedPhones = Object.values(selectedPhones).flat();
    if (allSelectedPhones.length === 0) {
      toast.error("لطفا حداقل یک شماره تلفن را انتخاب کنید");
      return;
    }

    setIsSendingSms(true);

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          fromNumber: "9998762911", // Default SMS sender number
          toNumbers: allSelectedPhones,
          message: smsMessage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Save SMS response to database
        try {
          await fetch("/api/sms/save-response", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-domain": window.location.host,
            },
            body: JSON.stringify({
              messageId: result.messageIds?.[0] || `sms-${Date.now()}`,
              fromNumber: "9998762911",
              toNumbers: allSelectedPhones,
              message: smsMessage,
              recipientCount: allSelectedPhones.length,
              senderCode: user?.username,
              schoolCode: schoolCode,
              smsResult: result,
              section: smsSection
            }),
          });
        } catch (saveError) {
          console.error("Error saving SMS response:", saveError);
        }

        toast.success(`پیامک با موفقیت به ${allSelectedPhones.length} شماره ارسال شد`);
        setIsSmsDialogOpen(false);
        setSmsMessage("");
        setSelectedPhones({});
        setSelectedStudents([]);
        
        // Refresh SMS history
        fetchSmsHistory();
      } else {
        const errorData = await response.json();
        toast.error(`خطا در ارسال پیامک: ${errorData.error || "خطای نامشخص"}`);
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("خطا در ارسال پیامک");
    } finally {
      setIsSendingSms(false);
    }
  };

  const closeSmsDialog = () => {
    setIsSmsDialogOpen(false);
    setSmsMessage("");
    setSelectedPhones({});
    setSelectedStudents([]);
  };

  // SMS History functions
  const handleSmsHistorySearch = (searchTerm: string) => {
    const newFilters = { ...smsHistoryFilters, search: searchTerm, page: 1 };
    setSmsHistoryFilters(newFilters);
    fetchSmsHistory(newFilters);
  };

  const handleSmsHistoryFilter = (key: string, value: string) => {
    const newFilters = { ...smsHistoryFilters, [key]: value, page: 1 };
    setSmsHistoryFilters(newFilters);
    fetchSmsHistory(newFilters);
  };

  const handleSmsHistoryPageChange = (page: number) => {
    const newFilters = { ...smsHistoryFilters, page };
    setSmsHistoryFilters(newFilters);
    fetchSmsHistory(newFilters);
  };

  const openSmsHistoryDialog = () => {
    setShowSmsHistory(true);
    fetchSmsHistory();
  };

  const closeSmsHistoryDialog = () => {
    setShowSmsHistory(false);
    // Reset filters when closing
    setSmsHistoryFilters({
      page: 1,
      search: "",
      section: "",
      status: "",
      startDate: "",
      endDate: ""
    });
  };

  //dir="rtl" lang="fa"
  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <Card className="filter-card shadow-sm print:hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gray-800">
              تنظیمات گزارش
            </CardTitle>
            <Button
              onClick={handlePrint}
              className="print:hidden bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2 rtl"
            >
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
                className="ml-1"
              >
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              چاپ گزارش
            </Button>
          </div>
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
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger
                  id="class-select"
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <SelectValue
                    placeholder={
                      teacherCode ? "همه کلاس‌های من" : "همه کلاس‌ها"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">
                    {teacherCode ? "همه کلاس‌های من" : "همه کلاس‌ها"}
                  </SelectItem>
                  {getClassOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="date-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                تاریخ
              </Label>
              <div className="relative">
                <DatePicker
                  id="date-select"
                  calendar={persian}
                  locale={persian_fa}
                  value={persianDate}
                  onChange={handleDateChange}
                  format="YYYY/MM/DD"
                  className="w-full rounded-md border border-gray-300"
                  inputClass="w-full rounded-md border border-gray-300 p-2 text-right"
                  calendarPosition="bottom-right"
                  containerClassName="rmdp-container"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchPresenceData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md rtl"
              >
                به‌روزرسانی گزارش
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Status Warning */}
      {user?.userType === "school" && !isCheckingSmsStatus && isSmsEnabled === false && (
        <Card className="bg-orange-50 border-orange-200 print:hidden">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-orange-600 ml-3"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <div>
                <h3 className="text-orange-800 font-medium">سرویس پیامک فعال نیست</h3>
                <p className="text-orange-700 text-sm mt-1">
                  برای ارسال پیامک به والدین دانش‌آموزان غایب یا با تاخیر، ابتدا باید سرویس پیامک را فعال کنید.{" "}
                  <a
                    href="/admin/smssend"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    برای فعالسازی اینجا کلیک کنید
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SMS Credit Info */}
      {user?.userType === "school" && !isCheckingSmsStatus && isSmsEnabled === true && (
        <Card className="bg-blue-50 border-blue-200 print:hidden">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-600 ml-3"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <div>
                  <h3 className="text-blue-800 font-medium">سرویس پیامک فعال</h3>
                  <p className="text-blue-700 text-sm">
                    می‌توانید پیامک به والدین دانش‌آموزان ارسال کنید
                  </p>
                </div>
              </div>
              <div className="bg-white shadow rounded-lg px-4 py-2 flex items-center gap-2">
                <div className="text-right flex flex-row justify-center items-center gap-2">
                  <p className="text-lg font-semibold">
                    {isLoadingCredit ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 mr-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>
                        درحال بارگیری...
                      </span>
                    ) : (
                      `${Number(smsCredit).toLocaleString()} ریال`
                    )}
                  </p>
                  <p className="text-sm text-gray-500">اعتبار پیامک</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={fetchSmsCredit}
                    className="text-blue-500 hover:text-blue-700"
                    disabled={isLoadingCredit}
                    title="بروزرسانی اعتبار"
                  >
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
                      className={`${isLoadingCredit ? "animate-spin" : ""}`}
                    >
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                      <path d="M21 3v5h-5"></path>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                      <path d="M3 21v-5h5"></path>
                    </svg>
                  </button>
                  <button
                    onClick={openSmsHistoryDialog}
                    className="text-green-500 hover:text-green-700"
                    title="تاریخچه پیامک‌ها"
                  >
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
                      <path d="M3 3h18v18H3zM9 9h6v6H9z"></path>
                      <path d="M9 1v6"></path>
                      <path d="M15 1v6"></path>
                      <path d="M9 17v6"></path>
                      <path d="M15 17v6"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 rtl"
          dir="rtl"
        >
          <TabsList
            className="grid grid-cols-4 w-full md:w-[800px] mx-auto rtl"
            dir="rtl"
          >
            <TabsTrigger value="today">گزارش امروز</TabsTrigger>
            <TabsTrigger value="students">آمار دانش‌آموزان</TabsTrigger>
            <TabsTrigger value="courses">آمار دروس</TabsTrigger>
            <TabsTrigger value="chart">نمودار غیبت روزانه</TabsTrigger>
          </TabsList>

          {/* Today's Report */}
          <TabsContent value="today" className="space-y-6 tabs-content-wrapper">
            {/* Today's Overview */}
            <Card className="no-page-break">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-800 flex justify-between items-center">
                  <span>گزارش حضور و غیاب {formatDate(selectedDate)}</span>
                  <span className="text-sm font-normal text-gray-500">
                    {selectedClass
                      ? `کلاس: ${
                          classDocuments.find(
                            (doc) => doc.data.classCode === selectedClass
                          )?.data.className || ""
                        }`
                      : "همه کلاس‌ها"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-grid-cols-3">
                  {/* Summary Cards */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center stat-card summary-card">
                    <div className="text-green-800 text-sm font-medium mb-1">
                      تعداد کل حضور امروز
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      {toPersianDigits(
                        presenceRecords.filter((record) => {
                          const recordDate = new Date(record.date);
                          recordDate.setHours(0, 0, 0, 0);
                          const today = new Date(selectedDate);
                          today.setHours(0, 0, 0, 0);
                          return (
                            recordDate.getTime() === today.getTime() &&
                            record.presenceStatus === "present"
                          );
                        }).length
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center stat-card summary-card">
                    <div className="text-red-800 text-sm font-medium mb-1">
                      تعداد غیبت‌های امروز
                    </div>
                    <div className="text-3xl font-bold text-red-700">
                      {toPersianDigits(todayAbsent.length)}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center stat-card summary-card">
                    <div className="text-yellow-800 text-sm font-medium mb-1">
                      تعداد تاخیرهای امروز
                    </div>
                    <div className="text-3xl font-bold text-yellow-700">
                      {toPersianDigits(todayLate.length)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Today's Absences */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-red-800">
                    غیبت‌های امروز
                  </CardTitle>
                  {user?.userType === "school" && todayAbsent.length > 0 && (
                    <>
                      {isCheckingSmsStatus ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="h-4 w-4 mr-2 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
                          در حال بررسی وضعیت پیامک...
                        </div>
                      ) : isSmsEnabled ? (
                        <Button
                          onClick={() => openSmsDialog("absent")}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
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
                            className="ml-2"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          ارسال پیامک
                        </Button>
                      ) : (
                        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                          <div className="flex items-center">
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
                              className="ml-2"
                            >
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span className="ml-2">
                              سرویس پیامک فعال نیست. برای فعالسازی{" "}
                              <a
                                href="/admin/smssend"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                اینجا کلیک کنید
                              </a>
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todayAbsent.length > 0 ? (
                  <div className="table-container overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            نام دانش‌آموز
                          </TableHead>
                          <TableHead className="text-right">کلاس</TableHead>
                          <TableHead className="text-right">درس</TableHead>
                          <TableHead className="text-right">معلم</TableHead>
                          <TableHead className="text-right">ساعت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayAbsent.map((record, index) => (
                          <TableRow key={`absent-${index}`}>
                            <TableCell className="font-medium">
                              {record.studentName}
                            </TableCell>
                            <TableCell>{record.className}</TableCell>
                            <TableCell>{record.courseName}</TableCell>
                            <TableCell>{record.teacherName}</TableCell>
                            <TableCell>{record.timeSlot}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    هیچ غیبتی در تاریخ انتخاب شده ثبت نشده است.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Late Arrivals */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-yellow-800">
                    تاخیرهای امروز
                  </CardTitle>
                  {user?.userType === "school" && todayLate.length > 0 && (
                    <>
                      {isCheckingSmsStatus ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="h-4 w-4 mr-2 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
                          در حال بررسی وضعیت پیامک...
                        </div>
                      ) : isSmsEnabled ? (
                        <Button
                          onClick={() => openSmsDialog("late")}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          size="sm"
                        >
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
                            className="ml-2"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          ارسال پیامک
                        </Button>
                      ) : (
                        <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                          <div className="flex items-center">
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
                              className="ml-2"
                            >
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                              <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span className="ml-2">
                              سرویس پیامک فعال نیست. برای فعالسازی{" "}
                              <a
                                href="/admin/smssend"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                اینجا کلیک کنید
                              </a>
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todayLate.length > 0 ? (
                  <div className="table-container overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            نام دانش‌آموز
                          </TableHead>
                          <TableHead className="text-right">کلاس</TableHead>
                          <TableHead className="text-right">درس</TableHead>
                          <TableHead className="text-right">معلم</TableHead>
                          <TableHead className="text-right">ساعت</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todayLate.map((record, index) => (
                          <TableRow key={`late-${index}`}>
                            <TableCell className="font-medium">
                              {record.studentName}
                            </TableCell>
                            <TableCell>{record.className}</TableCell>
                            <TableCell>{record.courseName}</TableCell>
                            <TableCell>{record.teacherName}</TableCell>
                            <TableCell>{record.timeSlot}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    هیچ تاخیری در تاریخ انتخاب شده ثبت نشده است.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Statistics */}
          <TabsContent
            value="students"
            className="space-y-6 tabs-content-wrapper"
          >
            {/* Summary Cards for Student Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print-grid-cols-4 no-page-break">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-blue-800 text-sm font-medium mb-2">
                      تعداد کل دانش‌آموزان
                    </div>
                    <div className="text-3xl font-bold text-blue-700">
                      {toPersianDigits(studentStats.length)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-red-800 text-sm font-medium mb-2">
                      میانگین غیبت‌ها
                    </div>
                    <div className="text-3xl font-bold text-red-700">
                      {toPersianDigits(
                        Math.round(
                          studentStats.reduce(
                            (sum, student) => sum + student.totalAbsent,
                            0
                          ) / (studentStats.length || 1)
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-yellow-800 text-sm font-medium mb-2">
                      میانگین تاخیرها
                    </div>
                    <div className="text-3xl font-bold text-yellow-700">
                      {toPersianDigits(
                        Math.round(
                          studentStats.reduce(
                            (sum, student) => sum + student.totalLate,
                            0
                          ) / (studentStats.length || 1)
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-green-800 text-sm font-medium mb-2">
                      میانگین حضور
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      {toPersianDigits(
                        Math.round(
                          studentStats.reduce(
                            (sum, student) => sum + student.totalPresent,
                            0
                          ) / (studentStats.length || 1)
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-800">
                  آمار دانش‌آموزان با بیشترین غیبت
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentStats.length > 0 ? (
                  <div className="table-container overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">
                            نام دانش‌آموز
                          </TableHead>
                          <TableHead className="text-right">کلاس</TableHead>
                          <TableHead className="text-right">
                            تعداد حضور
                          </TableHead>
                          <TableHead className="text-right">
                            تعداد غیبت
                          </TableHead>
                          <TableHead className="text-right">
                            تعداد تاخیر
                          </TableHead>
                          <TableHead className="text-right">
                            درصد غیبت
                          </TableHead>
                          <TableHead className="text-right">
                            آخرین وضعیت
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {studentStats.slice(0, 10).map((student, index) => (
                          <TableRow key={`student-${index}`}>
                            <TableCell className="font-medium">
                              {student.studentName}
                            </TableCell>
                            <TableCell>{student.className}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {toPersianDigits(student.totalPresent)}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {toPersianDigits(student.totalAbsent)}
                            </TableCell>
                            <TableCell className="text-yellow-600 font-medium">
                              {toPersianDigits(student.totalLate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 progress-bar-rtl">
                                  <div
                                    className="bg-red-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${student.absentPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span>
                                  {toPersianDigits(student.absentPercentage)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.lastStatus && (
                                <div className="flex flex-col">
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full inline-flex items-center justify-center w-fit ${
                                      student.lastStatus.status === "present"
                                        ? "bg-green-100 text-green-800"
                                        : student.lastStatus.status === "absent"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {student.lastStatus.status === "present"
                                      ? "حاضر"
                                      : student.lastStatus.status === "absent"
                                      ? "غایب"
                                      : "با تاخیر"}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1">
                                    {formatDate(student.lastStatus.date)} -{" "}
                                    {student.lastStatus.courseName}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    داده‌ای برای نمایش وجود ندارد.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Statistics */}
          <TabsContent
            value="courses"
            className="space-y-6 tabs-content-wrapper"
          >
            {/* Summary Cards for Course Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print-grid-cols-4 no-page-break">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-purple-800 text-sm font-medium mb-2">
                      تعداد کل دروس
                    </div>
                    <div className="text-3xl font-bold text-purple-700">
                      {toPersianDigits(courseStats.length)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-green-800 text-sm font-medium mb-2">
                      میانگین حضور
                    </div>
                    <div className="text-3xl font-bold text-green-700">
                      {toPersianDigits(
                        Math.round(
                          courseStats.reduce(
                            (sum, course) => sum + course.totalPresent,
                            0
                          ) / (courseStats.length || 1)
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 summary-card">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-red-800 text-sm font-medium mb-2">
                      میانگین غیبت‌ها
                    </div>
                    <div className="text-3xl font-bold text-red-700">
                      {toPersianDigits(
                        Math.round(
                          courseStats.reduce(
                            (sum, course) => sum + course.totalAbsent,
                            0
                          ) / (courseStats.length || 1)
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-indigo-800 text-sm font-medium mb-2">
                      درس با بیشترین غیبت
                    </div>
                    <div className="text-xl font-bold text-indigo-700 truncate">
                      {courseStats.length > 0 ? courseStats[0].courseName : "-"}
                    </div>
                    {courseStats.length > 0 && (
                      <div className="text-sm text-indigo-500 mt-1">
                        {toPersianDigits(courseStats[0].absentPercentage)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-800">
                  آمار دروس با بیشترین غیبت
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courseStats.length > 0 ? (
                  <div className="table-container overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">نام درس</TableHead>
                          <TableHead className="text-right">معلم</TableHead>
                          <TableHead className="text-right">
                            تعداد حضور
                          </TableHead>
                          <TableHead className="text-right">
                            تعداد غیبت
                          </TableHead>
                          <TableHead className="text-right">
                            تعداد تاخیر
                          </TableHead>
                          <TableHead className="text-right">
                            درصد غیبت
                          </TableHead>
                          <TableHead className="text-right">
                            نمودار وضعیت
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courseStats.slice(0, 10).map((course, index) => (
                          <TableRow key={`course-${index}`}>
                            <TableCell className="font-medium">
                              {course.courseName}
                            </TableCell>
                            <TableCell>{course.teacherName}</TableCell>
                            <TableCell className="text-green-600 font-medium">
                              {toPersianDigits(course.totalPresent)}
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">
                              {toPersianDigits(course.totalAbsent)}
                            </TableCell>
                            <TableCell className="text-yellow-600 font-medium">
                              {toPersianDigits(course.totalLate)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 progress-bar-rtl">
                                  <div
                                    className="bg-red-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${course.absentPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span>
                                  {toPersianDigits(course.absentPercentage)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {/* Mini chart showing present/absent/late distribution */}
                              <div className="flex h-8 w-full overflow-hidden rounded progress-bar-rtl">
                                <div
                                  className="bg-green-500 h-full"
                                  style={{
                                    width: `${course.presencePercentage}%`,
                                    minWidth:
                                      course.presencePercentage > 0
                                        ? "8px"
                                        : "0",
                                  }}
                                  title={`حضور: ${toPersianDigits(
                                    course.presencePercentage
                                  )}%`}
                                ></div>
                                <div
                                  className="bg-red-500 h-full"
                                  style={{
                                    width: `${course.absentPercentage}%`,
                                    minWidth:
                                      course.absentPercentage > 0 ? "8px" : "0",
                                  }}
                                  title={`غیبت: ${toPersianDigits(
                                    course.absentPercentage
                                  )}%`}
                                ></div>
                                <div
                                  className="bg-yellow-500 h-full"
                                  style={{
                                    width: `${course.latePercentage}%`,
                                    minWidth:
                                      course.latePercentage > 0 ? "8px" : "0",
                                  }}
                                  title={`تاخیر: ${toPersianDigits(
                                    course.latePercentage
                                  )}%`}
                                ></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    داده‌ای برای نمایش وجود ندارد.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart Statistics */}
          <TabsContent value="chart" className="space-y-6 tabs-content-wrapper">
            <Card className="no-page-break">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-800">
                  نمودار غیبت‌های روزانه در مدرسه
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyAbsenceData.dates.length > 0 ? (
                  <>
                    <div className="relative mt-6 h-80">
                      {/* Date labels on X axis */}
                      <div className="flex justify-between mx-2 pt-2 border-t border-gray-200">
                        {dailyAbsenceData.persianDates.map((date, index) => (
                          <div
                            key={`date-${index}`}
                            className="text-xs text-gray-500 transform -rotate-45 origin-top-left"
                          >
                            {date}
                          </div>
                        ))}
                      </div>

                      {/* Y axis labels */}
                      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pb-8">
                        {Array.from({ length: 6 }, (_, i) => {
                          const max = Math.max(...dailyAbsenceData.counts);
                          const value = Math.round((max / 5) * (5 - i));
                          return (
                            <div
                              key={`y-${i}`}
                              className="transform -translate-x-2"
                            >
                              {toPersianDigits(value)}
                            </div>
                          );
                        })}
                      </div>

                      {/* Chart content */}
                      <div className="absolute left-6 right-0 bottom-8 top-0 flex items-end">
                        {dailyAbsenceData.counts.map((count, index) => {
                          const maxCount = Math.max(...dailyAbsenceData.counts);
                          const height =
                            maxCount > 0 ? (count / maxCount) * 100 : 0;

                          return (
                            <div
                              key={`bar-${index}`}
                              className="flex-1 mx-1 flex flex-col items-center"
                            >
                              {/* Bar */}
                              <div
                                className="w-full bg-gradient-to-t from-red-500 to-red-300 rounded-t"
                                style={{ height: `${height}%` }}
                                title={`${
                                  dailyAbsenceData.persianDates[index]
                                }: ${toPersianDigits(count)} غیبت`}
                              />

                              {/* Count on top of bar */}
                              <div className="text-xs font-semibold text-red-700 mt-1 mb-1">
                                {toPersianDigits(count)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-center mt-16 text-sm text-gray-600">
                      نمودار تعداد غیبت‌های روزانه در مدرسه بر اساس تاریخ
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    داده‌ای برای نمایش نمودار وجود ندارد.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional charts could be added here */}
            <Card className="no-page-break">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-800">
                  آمار و تحلیل روزانه
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyAbsenceData.dates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-grid-cols-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 stat-card summary-card">
                      <div className="text-red-800 text-sm font-medium mb-1">
                        روز با بیشترین غیبت
                      </div>
                      <div className="text-xl font-bold text-red-700">
                        {(() => {
                          const maxIndex = dailyAbsenceData.counts.indexOf(
                            Math.max(...dailyAbsenceData.counts)
                          );
                          return maxIndex >= 0
                            ? dailyAbsenceData.persianDates[maxIndex]
                            : "-";
                        })()}
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        {toPersianDigits(Math.max(...dailyAbsenceData.counts))}{" "}
                        غیبت
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 stat-card summary-card">
                      <div className="text-blue-800 text-sm font-medium mb-1">
                        میانگین غیبت روزانه
                      </div>
                      <div className="text-xl font-bold text-blue-700">
                        {toPersianDigits(
                          Math.round(
                            dailyAbsenceData.counts.reduce(
                              (sum, count) => sum + count,
                              0
                            ) / (dailyAbsenceData.counts.length || 1)
                          )
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 stat-card summary-card">
                      <div className="text-green-800 text-sm font-medium mb-1">
                        کل غیبت‌ها
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        {toPersianDigits(
                          dailyAbsenceData.counts.reduce(
                            (sum, count) => sum + count,
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500 empty-message">
                    داده‌ای برای نمایش آمار وجود ندارد.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* SMS Dialog */}
      <Dialog open={isSmsDialogOpen} onOpenChange={setIsSmsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              ارسال پیامک به دانش‌آموزان {smsSection === "absent" ? "غایب" : "با تاخیر"}
            </DialogTitle>
            <DialogDescription>
              انتخاب شماره‌های تلفن و نوشتن متن پیام برای ارسال به والدین
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Message Text */}
            <div>
              <Label htmlFor="sms-message" className="text-sm font-medium">
                متن پیام
              </Label>
              <Textarea
                id="sms-message"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="متن پیام را وارد کنید..."
                className="mt-2 min-h-[100px] text-right"
              />
            </div>

            {/* Students and Phone Numbers */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                انتخاب شماره‌های تلفن
              </Label>
              <div className="space-y-4 max-h-[300px] overflow-y-auto border rounded-md p-4">
                {selectedStudents.map((student) => (
                  <div key={student.studentCode} className="border-b pb-3 last:border-b-0">
                    <div className="font-medium text-gray-900 mb-2">
                      {student.studentName} {student.studentlname}
                    </div>
                    <div className="space-y-2">
                      {student.phones && student.phones.length > 0 ? (
                        student.phones.map((phone, index) => (
                          <div key={index} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id={`phone-${student.studentCode}-${index}`}
                              checked={selectedPhones[student.studentCode]?.includes(phone.number) || false}
                              onCheckedChange={(checked) =>
                                handlePhoneSelection(student.studentCode, phone.number, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`phone-${student.studentCode}-${index}`}
                              className="flex-1 text-sm"
                            >
                              {phone.number} ({phone.owner})
                            </Label>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">
                          هیچ شماره تلفنی ثبت نشده است
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            {Object.values(selectedPhones).flat().length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm text-blue-800">
                  <strong>خلاصه:</strong> پیام به {Object.values(selectedPhones).flat().length} شماره ارسال خواهد شد
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={closeSmsDialog}
              disabled={isSendingSms}
            >
              انصراف
            </Button>
            <Button
              type="button"
              onClick={sendSms}
              disabled={isSendingSms || Object.values(selectedPhones).flat().length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSendingSms && (
                <span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              )}
              {isSendingSms ? "در حال ارسال..." : "ارسال پیامک"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SMS History Dialog */}
      <Dialog open={showSmsHistory} onOpenChange={setShowSmsHistory}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              تاریخچه پیامک‌های ارسالی
            </DialogTitle>
            <DialogDescription>
              مشاهده و جستجو در تاریخچه پیامک‌های ارسال شده
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="search-input" className="text-sm font-medium">
                  جستجو در متن پیام
                </Label>
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="جستجو در متن پیام‌ها..."
                    value={smsHistoryFilters.search}
                    onChange={(e) => handleSmsHistorySearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                </div>
              </div>

              <div>
                <Label htmlFor="section-filter" className="text-sm font-medium">
                  نوع پیام
                </Label>
                <select
                  id="section-filter"
                  value={smsHistoryFilters.section}
                  onChange={(e) => handleSmsHistoryFilter('section', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">همه</option>
                  <option value="absent">غیبت</option>
                  <option value="late">تاخیر</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status-filter" className="text-sm font-medium">
                  وضعیت
                </Label>
                <select
                  id="status-filter"
                  value={smsHistoryFilters.status}
                  onChange={(e) => handleSmsHistoryFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">همه</option>
                  <option value="success">موفق</option>
                  <option value="failed">ناموفق</option>
                </select>
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date" className="text-sm font-medium">
                  از تاریخ
                </Label>
                <input
                  id="start-date"
                  type="date"
                  value={smsHistoryFilters.startDate}
                  onChange={(e) => handleSmsHistoryFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="end-date" className="text-sm font-medium">
                  تا تاریخ
                </Label>
                <input
                  id="end-date"
                  type="date"
                  value={smsHistoryFilters.endDate}
                  onChange={(e) => handleSmsHistoryFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results */}
            <div className="border rounded-lg">
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {smsHistoryPagination && (
                      <>
                        نمایش {((smsHistoryPagination.page - 1) * smsHistoryPagination.limit) + 1} تا{' '}
                        {Math.min(smsHistoryPagination.page * smsHistoryPagination.limit, smsHistoryPagination.totalCount)} از{' '}
                        {smsHistoryPagination.totalCount} نتیجه
                      </>
                    )}
                  </div>
                  <Button
                    onClick={() => fetchSmsHistory()}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <span className="h-4 w-4 mr-2 rounded-full border-2 border-gray-400 border-t-transparent animate-spin"></span>
                    ) : (
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
                        className="ml-2"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                        <path d="M21 3v5h-5"></path>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                        <path d="M3 21v-5h5"></path>
                      </svg>
                    )}
                    بروزرسانی
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : smsHistory.length > 0 ? (
                  <div className="divide-y">
                    {smsHistory.map((record, index) => (
                      <div key={record.id || index} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.section === 'absent' ? 'غیبت' : record.section === 'late' ? 'تاخیر' : 'نامشخص'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'success' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.status === 'success' ? 'موفق' : 'ناموفق'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(record.sentAt)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>متن پیام:</strong> {record.message}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>تعداد گیرندگان:</strong> {record.recipientCount} نفر
                          {record.toNumbers && record.toNumbers.length > 0 && (
                            <span className="mr-4">
                              <strong>شماره‌ها:</strong> {record.toNumbers.slice(0, 3).join(', ')}
                              {record.toNumbers.length > 3 && ` و ${record.toNumbers.length - 3} شماره دیگر`}
                            </span>
                          )}
                        </div>
                        {record.smsResult && record.smsResult.error && (
                          <div className="text-sm text-red-600 mt-2">
                            <strong>خطا:</strong> {record.smsResult.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mx-auto mb-4 text-gray-400"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p>هیچ پیامکی یافت نشد</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {smsHistoryPagination && smsHistoryPagination.totalPages > 1 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex justify-center items-center gap-2">
                    <Button
                      onClick={() => handleSmsHistoryPageChange(smsHistoryPagination.page - 1)}
                      disabled={!smsHistoryPagination.hasPrevPage}
                      variant="outline"
                      size="sm"
                    >
                      قبلی
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, smsHistoryPagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => handleSmsHistoryPageChange(pageNum)}
                            variant={smsHistoryPagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={() => handleSmsHistoryPageChange(smsHistoryPagination.page + 1)}
                      disabled={!smsHistoryPagination.hasNextPage}
                      variant="outline"
                      size="sm"
                    >
                      بعدی
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={closeSmsHistoryDialog}
            >
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresenceReport;
