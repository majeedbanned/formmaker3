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
            className="grid grid-cols-3 w-full md:w-[600px] mx-auto rtl"
            dir="rtl"
          >
            <TabsTrigger value="today">گزارش امروز</TabsTrigger>
            <TabsTrigger value="students">آمار دانش‌آموزان</TabsTrigger>
            <TabsTrigger value="courses">آمار دروس</TabsTrigger>
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
                <CardTitle className="text-lg text-red-800">
                  غیبت‌های امروز
                </CardTitle>
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
                <CardTitle className="text-lg text-yellow-800">
                  تاخیرهای امروز
                </CardTitle>
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
        </Tabs>
      )}
    </div>
  );
};

export default PresenceReport;
