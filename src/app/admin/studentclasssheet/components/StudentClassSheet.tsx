"use client";
import React, { useState, useMemo } from "react";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  InformationCircleIcon,
  BookOpenIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Types
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

type StudentGradeData = {
  _id: string;
  classCode: string;
  courseCode: string;
  courseName?: string;
  teacherCode: string;
  teacherName?: string;
  date: string;
  timeSlot: string;
  grades: GradeEntry[];
  assessments: AssessmentEntry[];
  presenceStatus: "present" | "absent" | "late" | null;
  note: string;
  persianDate: string;
  persianMonth: string;
};

type StudentClassSheetProps = {
  gradeData: StudentGradeData[];
  studentCode?: string;
  studentName?: string;
};

// Helper functions
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)])
    .join("");
}

const PERSIAN_DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const PERSIAN_MONTHS = [
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

const StudentClassSheet: React.FC<StudentClassSheetProps> = ({ gradeData }) => {
  const [currentDate, setCurrentDate] = useState(
    new DateObject({ calendar: persian, locale: persian_fa })
  );
  const [viewMode, setViewMode] = useState<
    "calendar" | "summary" | "statistics"
  >("calendar");
  const [selectedDay, setSelectedDay] = useState<{
    date: string;
    coursesData: Map<string, StudentGradeData[]>;
    dayNumber: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [selectedStatsFilter, setSelectedStatsFilter] = useState<
    "all" | "month" | "semester"
  >("all");
  const [managedWidgets, setManagedWidgets] = useState<string[]>([
    "grades",
    "attendance",
    "courses",
    "trends",
    "achievements",
  ]);

  // Process data by Persian date and group by course
  const dataByDate = useMemo(() => {
    const dataMap = new Map<string, Map<string, StudentGradeData[]>>();
    gradeData.forEach((item) => {
      const dateKey = item.persianDate;
      const courseKey = item.courseName || item.courseCode;

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, new Map());
      }

      const dateData = dataMap.get(dateKey)!;
      if (!dateData.has(courseKey)) {
        dateData.set(courseKey, []);
      }

      dateData.get(courseKey)!.push(item);
    });
    return dataMap;
  }, [gradeData]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalGrades = gradeData.flatMap((item) =>
      item.grades.map((g) => g.value)
    );
    const totalSessions = gradeData.length;
    const presentSessions = gradeData.filter(
      (item) => item.presenceStatus === "present"
    ).length;

    return {
      averageGrade:
        totalGrades.length > 0
          ? totalGrades.reduce((a, b) => a + b, 0) / totalGrades.length
          : 0,
      totalSessions,
      attendanceRate:
        totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0,
      totalAssessments: gradeData.reduce(
        (acc, item) => acc + item.assessments.length,
        0
      ),
    };
  }, [gradeData]);

  // Detailed statistics
  const detailedStats = useMemo(() => {
    const filteredData =
      selectedStatsFilter === "month"
        ? gradeData.filter((item) => {
            const itemDateParts = item.persianDate.split("/");
            const itemYear = parseInt(
              itemDateParts[0].replace(/[۰-۹]/g, (w) =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(w).toString()
              )
            );
            const itemMonth = parseInt(
              itemDateParts[1].replace(/[۰-۹]/g, (w) =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(w).toString()
              )
            );
            return (
              itemMonth === currentDate.month.number &&
              itemYear === currentDate.year
            );
          })
        : selectedStatsFilter === "semester"
        ? gradeData.filter((item) => {
            const itemDateParts = item.persianDate.split("/");
            const itemYear = parseInt(
              itemDateParts[0].replace(/[۰-۹]/g, (w) =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(w).toString()
              )
            );
            return itemYear === currentDate.year;
          })
        : gradeData;

    // Course Performance
    const courseStats = new Map<
      string,
      {
        sessions: number;
        averageGrade: number;
        attendanceRate: number;
        totalGrades: number[];
        assessments: number;
        lastActivity: string;
      }
    >();

    filteredData.forEach((item) => {
      const courseName = item.courseName || item.courseCode;
      if (!courseStats.has(courseName)) {
        courseStats.set(courseName, {
          sessions: 0,
          averageGrade: 0,
          attendanceRate: 0,
          totalGrades: [],
          assessments: 0,
          lastActivity: item.persianDate,
        });
      }

      const stats = courseStats.get(courseName)!;
      stats.sessions++;
      stats.totalGrades.push(...item.grades.map((g) => g.value));
      stats.assessments += item.assessments.length;
      if (item.presenceStatus === "present") {
        stats.attendanceRate++;
      }
      if (item.persianDate > stats.lastActivity) {
        stats.lastActivity = item.persianDate;
      }
    });

    // Calculate averages
    courseStats.forEach((stats) => {
      stats.averageGrade =
        stats.totalGrades.length > 0
          ? stats.totalGrades.reduce((a, b) => a + b, 0) /
            stats.totalGrades.length
          : 0;
      stats.attendanceRate =
        stats.sessions > 0 ? (stats.attendanceRate / stats.sessions) * 100 : 0;
    });

    // Time-based analysis
    const monthlyData = new Map<
      string,
      { grades: number[]; sessions: number; attendance: number }
    >();
    filteredData.forEach((item) => {
      const monthKey = item.persianMonth;
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { grades: [], sessions: 0, attendance: 0 });
      }
      const monthStats = monthlyData.get(monthKey)!;
      monthStats.grades.push(...item.grades.map((g) => g.value));
      monthStats.sessions++;
      if (item.presenceStatus === "present") {
        monthStats.attendance++;
      }
    });

    // Grade distribution
    const allGrades = filteredData.flatMap((item) =>
      item.grades.map((g) => g.value)
    );
    const gradeDistribution = {
      excellent: allGrades.filter((g) => g >= 17).length,
      good: allGrades.filter((g) => g >= 14 && g < 17).length,
      average: allGrades.filter((g) => g >= 12 && g < 14).length,
      poor: allGrades.filter((g) => g < 12).length,
    };

    // Best performing metrics
    const bestCourse = Array.from(courseStats.entries()).sort(
      ([, a], [, b]) => b.averageGrade - a.averageGrade
    )[0];

    const mostActiveCourse = Array.from(courseStats.entries()).sort(
      ([, a], [, b]) => b.sessions - a.sessions
    )[0];

    const totalPresent = filteredData.filter(
      (item) => item.presenceStatus === "present"
    ).length;
    const totalLate = filteredData.filter(
      (item) => item.presenceStatus === "late"
    ).length;
    const totalAbsent = filteredData.filter(
      (item) => item.presenceStatus === "absent"
    ).length;

    return {
      courseStats,
      monthlyData,
      gradeDistribution,
      bestCourse,
      mostActiveCourse,
      attendanceBreakdown: {
        present: totalPresent,
        late: totalLate,
        absent: totalAbsent,
      },
      totalFilteredSessions: filteredData.length,
      averageGradeFiltered:
        allGrades.length > 0
          ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length
          : 0,
    };
  }, [gradeData, selectedStatsFilter, currentDate]);

  const navigateMonth = (direction: "next" | "prev") => {
    const newDate = new DateObject(currentDate);
    if (direction === "next") {
      newDate.add(1, "month");
    } else {
      newDate.subtract(1, "month");
    }
    setCurrentDate(newDate);
  };

  const getCalendarDays = () => {
    const startOfMonth = new DateObject(currentDate).setDay(1);

    // Find the start of the calendar grid (may include days from previous month)
    const startOfCalendar = new DateObject(startOfMonth);
    while (startOfCalendar.weekDay.index !== 6) {
      // Saturday = 6 in Persian calendar
      startOfCalendar.subtract(1, "day");
    }

    // Generate 42 days (6 weeks) for the calendar grid
    const days = [];
    const currentDay = new DateObject(startOfCalendar);

    for (let i = 0; i < 42; i++) {
      days.push(new DateObject(currentDay));
      currentDay.add(1, "day");
    }

    return days;
  };

  const formatPersianDate = (date: DateObject) => {
    return `${toPersianDigits(date.year)}/${toPersianDigits(
      date.month.number.toString().padStart(2, "0")
    )}/${toPersianDigits(date.day.toString().padStart(2, "0"))}`;
  };

  const getPresenceIcon = (status: string | null, size = "w-4 h-4") => {
    switch (status) {
      case "present":
        return (
          <CheckCircleIcon className={`${size} text-green-500`} title="حاضر" />
        );
      case "absent":
        return <XCircleIcon className={`${size} text-red-500`} title="غایب" />;
      case "late":
        return (
          <ExclamationCircleIcon
            className={`${size} text-yellow-500`}
            title="تأخیر"
          />
        );
      default:
        return (
          <ClockIcon className={`${size} text-gray-400`} title="وضعیت نامشخص" />
        );
    }
  };

  const getGradeColor = (grade: number, totalPoints?: number) => {
    const percentage = totalPoints ? (grade / totalPoints) * 100 : grade * 5;
    if (percentage >= 85) return "bg-green-100 text-green-800 border-green-200";
    if (percentage >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage >= 60)
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getGradePercentage = (grade: number, totalPoints?: number) => {
    return totalPoints ? (grade / totalPoints) * 100 : grade * 5;
  };

  const Tooltip: React.FC<{ children: React.ReactNode; content: string }> = ({
    children,
    content,
  }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full right-1/2 transform translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
        {content}
      </div>
    </div>
  );

  const handleCellClick = (
    dateKey: string,
    coursesData: Map<string, StudentGradeData[]>,
    dayNumber: number
  ) => {
    if (coursesData.size > 0) {
      setSelectedDay({ date: dateKey, coursesData, dayNumber });
      const firstCourse = Array.from(coursesData.keys())[0];
      setActiveTab(firstCourse);
    }
  };

  const closeModal = () => {
    setSelectedDay(null);
    setActiveTab("");
  };

  const renderDetailModal = () => {
    if (!selectedDay) return null;

    const courses = Array.from(selectedDay.coursesData.entries());

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          dir="rtl"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  جزئیات روز {toPersianDigits(selectedDay.dayNumber)}
                </h2>
                <p className="text-blue-100 mt-1">{selectedDay.date}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Course Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {courses.map(([courseName, sessions]) => (
                <button
                  key={courseName}
                  onClick={() => setActiveTab(courseName)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTab === courseName
                      ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <BookOpenIcon className="w-4 h-4" />
                  {courseName}
                  <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {toPersianDigits(sessions.length)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {courses.map(([courseName, sessions]) => (
              <div
                key={courseName}
                className={activeTab === courseName ? "block" : "hidden"}
              >
                <div className="space-y-6">
                  {sessions.map((session, sessionIndex) => (
                    <div
                      key={sessionIndex}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                    >
                      {/* Session Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ClockIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">
                              جلسه {toPersianDigits(sessionIndex + 1)}
                            </h3>
                            <p className="text-gray-600">
                              ساعت {toPersianDigits(session.timeSlot)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPresenceIcon(session.presenceStatus, "w-6 h-6")}
                          <span className="text-sm font-medium">
                            {session.presenceStatus === "present"
                              ? "حاضر"
                              : session.presenceStatus === "absent"
                              ? "غایب"
                              : session.presenceStatus === "late"
                              ? "تأخیر"
                              : "نامشخص"}
                          </span>
                        </div>
                      </div>

                      {/* Teacher Info */}
                      {session.teacherName && (
                        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-100">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-700">
                              استاد:
                            </span>
                            <span className="text-gray-800">
                              {session.teacherName}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Grades Section */}
                      {session.grades.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <AcademicCapIcon className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold text-gray-800">
                              نمرات
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {session.grades.map((grade, gradeIndex) => (
                              <div
                                key={gradeIndex}
                                className="bg-white p-4 rounded-lg border border-gray-100"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`px-3 py-2 rounded-lg font-bold text-lg border ${getGradeColor(
                                      grade.value,
                                      grade.totalPoints
                                    )}`}
                                  >
                                    {toPersianDigits(grade.value)}
                                    {grade.totalPoints &&
                                      `/${toPersianDigits(grade.totalPoints)}`}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {toPersianDigits(
                                      getGradePercentage(
                                        grade.value,
                                        grade.totalPoints
                                      ).toFixed(0)
                                    )}
                                    %
                                  </span>
                                </div>
                                {grade.description && (
                                  <p className="text-gray-600 text-sm">
                                    {grade.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assessments Section */}
                      {session.assessments.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ChartBarIcon className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-gray-800">
                              ارزیابی‌ها
                            </h4>
                          </div>
                          <div className="space-y-3">
                            {session.assessments.map(
                              (assessment, assessIndex) => (
                                <div
                                  key={assessIndex}
                                  className="bg-white p-4 rounded-lg border border-gray-100"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-medium text-gray-800">
                                        {assessment.title}
                                      </h5>
                                      <p className="text-purple-600 font-semibold">
                                        {assessment.value}
                                      </p>
                                    </div>
                                    {assessment.weight && (
                                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                                        ضریب:{" "}
                                        {toPersianDigits(assessment.weight)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      {session.note && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <PencilIcon className="w-5 h-5 text-orange-600" />
                            <h4 className="font-semibold text-gray-800">
                              یادداشت استاد
                            </h4>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-gray-700">{session.note}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCalendarView = () => {
    const calendarDays = getCalendarDays();

    return (
      <div className="bg-white rounded-lg shadow-lg p-6" dir="rtl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-reverse space-x-4">
            <Tooltip content="ماه قبل">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6 text-gray-600" />
              </button>
            </Tooltip>
            <h2 className="text-2xl font-bold text-gray-800">
              {PERSIAN_MONTHS[currentDate.month.number - 1]}{" "}
              {toPersianDigits(currentDate.year)}
            </h2>
            <Tooltip content="ماه بعد">
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
              </button>
            </Tooltip>
          </div>
          <Tooltip content="بازگشت به امروز">
            <button
              onClick={() =>
                setCurrentDate(
                  new DateObject({ calendar: persian, locale: persian_fa })
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <CalendarIcon className="w-4 h-4" />
              امروز
            </button>
          </Tooltip>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {PERSIAN_DAYS.map((day, index) => (
            <div
              key={index}
              className="p-4 text-center font-medium text-gray-600 border-b-2 border-gray-200"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth =
              day.month.number === currentDate.month.number;
            const isToday =
              day.format("YYYY/MM/DD") ===
              new DateObject({ calendar: persian, locale: persian_fa }).format(
                "YYYY/MM/DD"
              );
            const dateKey = formatPersianDate(day);
            const coursesData = dataByDate.get(dateKey) || new Map();

            return (
              <div
                key={index}
                className={`min-h-[140px] max-h-[140px] border border-gray-200 p-2 transition-all hover:bg-gray-50 overflow-hidden cursor-pointer ${
                  !isCurrentMonth ? "bg-gray-50 text-gray-400" : "bg-white"
                } ${isToday ? "ring-2 ring-blue-500 bg-blue-50" : ""} ${
                  coursesData.size > 0 ? "hover:shadow-md" : ""
                }`}
                dir="rtl"
                onClick={() => handleCellClick(dateKey, coursesData, day.day)}
              >
                {/* Day Number */}
                <div
                  className={`text-sm font-medium mb-2 text-right ${
                    isToday ? "text-blue-600" : ""
                  }`}
                >
                  {toPersianDigits(day.day)}
                </div>

                {/* Day Content - Grouped by Course */}
                {isCurrentMonth && coursesData.size > 0 && (
                  <div className="h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="space-y-1 pr-1">
                      {Array.from(coursesData.entries()).map(
                        ([courseName, sessions], courseIndex) => (
                          <div
                            key={courseIndex}
                            className="border border-gray-100 rounded-md p-1 bg-gray-50 flex-shrink-0"
                          >
                            {/* Course Header */}
                            <div className="flex items-center justify-between mb-1">
                              <Tooltip content={`درس: ${courseName}`}>
                                <div className="flex items-center gap-1">
                                  <BookOpenIcon className="w-3 h-3 text-gray-600" />
                                  <span className="font-medium text-xs text-gray-700 truncate max-w-[60px]">
                                    {courseName}
                                  </span>
                                </div>
                              </Tooltip>
                              <span className="text-xs text-gray-500">
                                {toPersianDigits(sessions.length)}
                              </span>
                            </div>

                            {/* Sessions for this course */}
                            <div className="space-y-1">
                              {sessions.map(
                                (
                                  session: StudentGradeData,
                                  sessionIndex: number
                                ) => (
                                  <div
                                    key={sessionIndex}
                                    className="text-xs bg-white rounded p-1"
                                  >
                                    {/* Session Info */}
                                    <div className="flex items-center justify-between mb-1">
                                      <Tooltip
                                        content={`زمان کلاس: ${session.timeSlot}`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <ClockIcon className="w-3 h-3 text-gray-500" />
                                          <span className="text-gray-600">
                                            {toPersianDigits(session.timeSlot)}
                                          </span>
                                        </div>
                                      </Tooltip>
                                      <Tooltip
                                        content={
                                          session.presenceStatus === "present"
                                            ? "حاضر بوده‌اید"
                                            : session.presenceStatus ===
                                              "absent"
                                            ? "غایب بوده‌اید"
                                            : session.presenceStatus === "late"
                                            ? "با تأخیر حاضر شده‌اید"
                                            : "وضعیت حضور ثبت نشده"
                                        }
                                      >
                                        {getPresenceIcon(
                                          session.presenceStatus,
                                          "w-3 h-3"
                                        )}
                                      </Tooltip>
                                    </div>

                                    {/* Grades */}
                                    {session.grades.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        <div className="flex items-center gap-1">
                                          <AcademicCapIcon className="w-3 h-3 text-gray-500" />
                                          <span className="text-gray-500 text-xs">
                                            نمرات:
                                          </span>
                                        </div>
                                        {session.grades
                                          .slice(0, 2)
                                          .map(
                                            (
                                              grade: GradeEntry,
                                              gradeIndex: number
                                            ) => (
                                              <Tooltip
                                                key={gradeIndex}
                                                content={`نمره: ${toPersianDigits(
                                                  grade.value
                                                )}${
                                                  grade.totalPoints
                                                    ? ` از ${toPersianDigits(
                                                        grade.totalPoints
                                                      )}`
                                                    : ""
                                                } - درصد: ${toPersianDigits(
                                                  getGradePercentage(
                                                    grade.value,
                                                    grade.totalPoints
                                                  ).toFixed(0)
                                                )}% - ${
                                                  grade.description ||
                                                  "بدون توضیح"
                                                }`}
                                              >
                                                <span
                                                  className={`px-1 py-0.5 rounded text-xs font-medium border ${getGradeColor(
                                                    grade.value,
                                                    grade.totalPoints
                                                  )}`}
                                                >
                                                  {toPersianDigits(grade.value)}
                                                  {grade.totalPoints &&
                                                    `/${toPersianDigits(
                                                      grade.totalPoints
                                                    )}`}
                                                </span>
                                              </Tooltip>
                                            )
                                          )}
                                        {session.grades.length > 2 && (
                                          <Tooltip
                                            content={`${toPersianDigits(
                                              session.grades.length - 2
                                            )} نمره دیگر`}
                                          >
                                            <span className="text-xs text-blue-600 cursor-pointer">
                                              +
                                              {toPersianDigits(
                                                session.grades.length - 2
                                              )}
                                            </span>
                                          </Tooltip>
                                        )}
                                      </div>
                                    )}

                                    {/* Assessments */}
                                    {session.assessments.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-1">
                                        <div className="flex items-center gap-1">
                                          <ChartBarIcon className="w-3 h-3 text-gray-500" />
                                          <span className="text-gray-500 text-xs">
                                            ارزیابی:
                                          </span>
                                        </div>
                                        {session.assessments
                                          .slice(0, 1)
                                          .map(
                                            (
                                              assessment: AssessmentEntry,
                                              assessIndex: number
                                            ) => (
                                              <Tooltip
                                                key={assessIndex}
                                                content={`ارزیابی: ${
                                                  assessment.title
                                                } - مقدار: ${assessment.value}${
                                                  assessment.weight
                                                    ? ` - ضریب: ${assessment.weight}`
                                                    : ""
                                                }`}
                                              >
                                                <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-xs border border-purple-200">
                                                  {assessment.title}:{" "}
                                                  {assessment.value}
                                                </span>
                                              </Tooltip>
                                            )
                                          )}
                                        {session.assessments.length > 1 && (
                                          <Tooltip
                                            content={`${toPersianDigits(
                                              session.assessments.length - 1
                                            )} ارزیابی دیگر`}
                                          >
                                            <span className="text-xs text-purple-600 cursor-pointer">
                                              +
                                              {toPersianDigits(
                                                session.assessments.length - 1
                                              )}
                                            </span>
                                          </Tooltip>
                                        )}
                                      </div>
                                    )}

                                    {/* Teacher Note */}
                                    {session.note && (
                                      <Tooltip
                                        content={`یادداشت استاد: ${session.note}`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <PencilIcon className="w-3 h-3 text-gray-500" />
                                          <div className="text-xs text-gray-600 bg-yellow-50 p-1 rounded truncate border border-yellow-200">
                                            {session.note.substring(0, 15)}...
                                          </div>
                                        </div>
                                      </Tooltip>
                                    )}

                                    {/* Teacher Name */}
                                    {session.teacherName && (
                                      <Tooltip
                                        content={`استاد: ${session.teacherName}`}
                                      >
                                        <div className="flex items-center gap-1 mt-1">
                                          <UserIcon className="w-3 h-3 text-gray-400" />
                                          <span className="text-xs text-gray-500 truncate">
                                            {session.teacherName}
                                          </span>
                                        </div>
                                      </Tooltip>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg" dir="rtl">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <InformationCircleIcon className="w-4 h-4" />
            راهنمای نمادها
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span>حاضر</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-4 h-4 text-red-500" />
              <span>غایب</span>
            </div>
            <div className="flex items-center gap-2">
              <ExclamationCircleIcon className="w-4 h-4 text-yellow-500" />
              <span>تأخیر</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span>
              <span>نمره عالی (۸۵%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></span>
              <span>نمره خوب (۷۰-۸۴%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span>
              <span>نمره متوسط (۶۰-۶۹%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
              <span>نمره ضعیف (&lt;۶۰%)</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-gray-600" />
              <span>نام درس</span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <InformationCircleIcon className="w-4 h-4" />
              برای مشاهده جزئیات کامل، روی هر خانه کلیک کنید
            </p>
          </div>
        </div>

        {/* Modal */}
        {renderDetailModal()}
      </div>
    );
  };

  const renderSummaryView = () => {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Tooltip content="میانگین کلی نمرات شما در تمام دروس">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">میانگین کل</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(overallStats.averageGrade.toFixed(1))}
                  </p>
                </div>
                <AcademicCapIcon className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </Tooltip>

          <Tooltip content="درصد حضور شما در کلاس‌ها">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">درصد حضور</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(overallStats.attendanceRate.toFixed(0))}%
                  </p>
                </div>
                <UserIcon className="w-8 h-8 text-green-200" />
              </div>
            </div>
          </Tooltip>

          <Tooltip content="تعداد کل جلسات برگزار شده">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">کل جلسات</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(overallStats.totalSessions)}
                  </p>
                </div>
                <CalendarIcon className="w-8 h-8 text-purple-200" />
              </div>
            </div>
          </Tooltip>

          <Tooltip content="تعداد کل ارزیابی‌های انجام شده">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 cursor-help">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">کل ارزیابی‌ها</p>
                  <p className="text-2xl font-bold">
                    {toPersianDigits(overallStats.totalAssessments)}
                  </p>
                </div>
                <ChartBarIcon className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </Tooltip>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ClockIcon className="w-5 h-5" />
            آخرین فعالیت‌ها
          </h3>
          <div className="space-y-4">
            {gradeData.slice(0, 10).map((session, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Tooltip
                      content={
                        session.presenceStatus === "present"
                          ? "حاضر بوده‌اید"
                          : session.presenceStatus === "absent"
                          ? "غایب بوده‌اید"
                          : session.presenceStatus === "late"
                          ? "با تأخیر حاضر شده‌اید"
                          : "وضعیت حضور ثبت نشده"
                      }
                    >
                      {getPresenceIcon(session.presenceStatus)}
                    </Tooltip>
                    <div>
                      <span className="font-medium text-gray-800">
                        {session.courseName || session.courseCode}
                      </span>
                      {session.teacherName && (
                        <p className="text-sm text-gray-500">
                          استاد: {session.teacherName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-sm text-gray-500">
                      {toPersianDigits(session.persianDate)}
                    </span>
                    <p className="text-xs text-gray-400">
                      ساعت {toPersianDigits(session.timeSlot)}
                    </p>
                  </div>
                </div>

                {session.grades.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <AcademicCapIcon className="w-4 h-4" />
                      نمرات:
                    </span>
                    {session.grades.map((grade, gradeIndex) => (
                      <Tooltip
                        key={gradeIndex}
                        content={`نمره: ${toPersianDigits(grade.value)}${
                          grade.totalPoints
                            ? ` از ${toPersianDigits(grade.totalPoints)}`
                            : ""
                        } - درصد: ${toPersianDigits(
                          getGradePercentage(
                            grade.value,
                            grade.totalPoints
                          ).toFixed(0)
                        )}% - ${grade.description || "بدون توضیح"}`}
                      >
                        <span
                          className={`px-2 py-1 rounded-md text-sm font-medium border cursor-help ${getGradeColor(
                            grade.value,
                            grade.totalPoints
                          )}`}
                        >
                          {toPersianDigits(grade.value)}
                          {grade.totalPoints &&
                            `/${toPersianDigits(grade.totalPoints)}`}
                        </span>
                      </Tooltip>
                    ))}
                  </div>
                )}

                {session.assessments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <ChartBarIcon className="w-4 h-4" />
                      ارزیابی‌ها:
                    </span>
                    {session.assessments.map((assessment, assessIndex) => (
                      <Tooltip
                        key={assessIndex}
                        content={`ارزیابی: ${assessment.title} - مقدار: ${
                          assessment.value
                        }${
                          assessment.weight
                            ? ` - ضریب: ${assessment.weight}`
                            : ""
                        }`}
                      >
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs border border-purple-200 cursor-help">
                          {assessment.title}: {assessment.value}
                        </span>
                      </Tooltip>
                    ))}
                  </div>
                )}

                {session.note && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center gap-1 mb-1">
                      <PencilIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        یادداشت استاد:
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{session.note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const toggleWidget = (widgetId: string) => {
    setManagedWidgets((prev) =>
      prev.includes(widgetId)
        ? prev.filter((id) => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const renderStatisticsView = () => {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Statistics Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">آمار و تحلیل عملکرد</h2>
              <p className="text-purple-100 mt-1">
                تحلیل جامع فعالیت‌های تحصیلی شما
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatsFilter}
                onChange={(e) =>
                  setSelectedStatsFilter(
                    e.target.value as "all" | "month" | "semester"
                  )
                }
                className="bg-white/20 text-white rounded-lg px-4 py-2 border border-white/30"
              >
                <option value="all">کل دوره</option>
                <option value="semester">سال جاری</option>
                <option value="month">ماه جاری</option>
              </select>
            </div>
          </div>
        </div>

        {/* Widget Management */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            مدیریت نمایش آمار
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "grades", name: "نمرات", icon: "🎓" },
              { id: "attendance", name: "حضور و غیاب", icon: "✅" },
              { id: "courses", name: "عملکرد دروس", icon: "📚" },
              { id: "trends", name: "روند پیشرفت", icon: "📈" },
              { id: "achievements", name: "دستاورد ها", icon: "🏆" },
            ].map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  managedWidgets.includes(widget.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{widget.icon}</span>
                {widget.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grades Widget */}
          {managedWidgets.includes("grades") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  تحلیل نمرات
                </h3>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {toPersianDigits(
                      detailedStats.averageGradeFiltered.toFixed(1)
                    )}
                  </p>
                  <p className="text-green-600">میانگین کلی</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-700">
                      {toPersianDigits(
                        detailedStats.gradeDistribution.excellent
                      )}
                    </p>
                    <p className="text-blue-600 text-sm">عالی (۱۷+)</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-700">
                      {toPersianDigits(detailedStats.gradeDistribution.good)}
                    </p>
                    <p className="text-green-600 text-sm">خوب (۱۴-۱۶)</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xl font-bold text-yellow-700">
                      {toPersianDigits(detailedStats.gradeDistribution.average)}
                    </p>
                    <p className="text-yellow-600 text-sm">متوسط (۱۲-۱۳)</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xl font-bold text-red-700">
                      {toPersianDigits(detailedStats.gradeDistribution.poor)}
                    </p>
                    <p className="text-red-600 text-sm">ضعیف (&lt;۱۲)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Widget */}
          {managedWidgets.includes("attendance") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  حضور و غیاب
                </h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-700">
                      {toPersianDigits(
                        detailedStats.attendanceBreakdown.present
                      )}
                    </p>
                    <p className="text-green-600 text-sm">حاضر</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <p className="text-xl font-bold text-yellow-700">
                      {toPersianDigits(detailedStats.attendanceBreakdown.late)}
                    </p>
                    <p className="text-yellow-600 text-sm">تأخیر</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-xl font-bold text-red-700">
                      {toPersianDigits(
                        detailedStats.attendanceBreakdown.absent
                      )}
                    </p>
                    <p className="text-red-600 text-sm">غایب</p>
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {toPersianDigits(
                      detailedStats.totalFilteredSessions > 0
                        ? (
                            (detailedStats.attendanceBreakdown.present /
                              detailedStats.totalFilteredSessions) *
                            100
                          ).toFixed(0)
                        : 0
                    )}
                    %
                  </p>
                  <p className="text-blue-600">درصد حضور</p>
                </div>
              </div>
            </div>
          )}

          {/* Course Performance Widget */}
          {managedWidgets.includes("courses") && (
            <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  عملکرد دروس
                </h3>
              </div>

              <div className="space-y-4">
                {Array.from(detailedStats.courseStats.entries()).map(
                  ([courseName, stats]) => (
                    <div
                      key={courseName}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-800">
                          {courseName}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {toPersianDigits(stats.sessions)} جلسه
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="font-bold text-green-700">
                            {toPersianDigits(stats.averageGrade.toFixed(1))}
                          </p>
                          <p className="text-green-600">میانگین</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="font-bold text-blue-700">
                            {toPersianDigits(stats.attendanceRate.toFixed(0))}%
                          </p>
                          <p className="text-blue-600">حضور</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="font-bold text-purple-700">
                            {toPersianDigits(stats.assessments)}
                          </p>
                          <p className="text-purple-600">ارزیابی</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Best Performance Widget */}
          {managedWidgets.includes("achievements") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  دستاوردها
                </h3>
              </div>

              <div className="space-y-4">
                {detailedStats.bestCourse && (
                  <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏆</span>
                      <p className="font-medium text-gray-800">بهترین عملکرد</p>
                    </div>
                    <p className="text-yellow-700 font-semibold">
                      {detailedStats.bestCourse[0]}
                    </p>
                    <p className="text-sm text-gray-600">
                      میانگین:{" "}
                      {toPersianDigits(
                        detailedStats.bestCourse[1].averageGrade.toFixed(1)
                      )}
                    </p>
                  </div>
                )}

                {detailedStats.mostActiveCourse && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📚</span>
                      <p className="font-medium text-gray-800">فعال‌ترین درس</p>
                    </div>
                    <p className="text-blue-700 font-semibold">
                      {detailedStats.mostActiveCourse[0]}
                    </p>
                    <p className="text-sm text-gray-600">
                      {toPersianDigits(
                        detailedStats.mostActiveCourse[1].sessions
                      )}{" "}
                      جلسه
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Monthly Trends Widget */}
          {managedWidgets.includes("trends") && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <CalendarIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  روند ماهانه
                </h3>
              </div>

              <div className="space-y-3">
                {Array.from(detailedStats.monthlyData.entries()).map(
                  ([month, data]) => (
                    <div
                      key={month}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-800">{month}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600">
                          میانگین:{" "}
                          {toPersianDigits(
                            data.grades.length > 0
                              ? (
                                  data.grades.reduce((a, b) => a + b, 0) /
                                  data.grades.length
                                ).toFixed(1)
                              : "0"
                          )}
                        </span>
                        <span className="text-blue-600">
                          جلسات: {toPersianDigits(data.sessions)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex gap-1">
          <Tooltip content="مشاهده اطلاعات در قالب تقویم">
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "calendar"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              تقویم
            </button>
          </Tooltip>
          <Tooltip content="مشاهده خلاصه عملکرد و آمار">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "summary"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              خلاصه عملکرد
            </button>
          </Tooltip>
          <Tooltip content="مشاهده آمار تفصیلی و تحلیل عملکرد">
            <button
              onClick={() => setViewMode("statistics")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                viewMode === "statistics"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              <AcademicCapIcon className="w-4 h-4" />
              آمار تفصیلی
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      {viewMode === "calendar" && renderCalendarView()}
      {viewMode === "summary" && renderSummaryView()}
      {viewMode === "statistics" && renderStatisticsView()}
    </div>
  );
};

export default StudentClassSheet;
