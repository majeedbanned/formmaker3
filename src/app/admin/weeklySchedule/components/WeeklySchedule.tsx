"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Printer, Edit } from "lucide-react";
import { toast } from "sonner";
import { ScheduleEditor } from "./ScheduleEditor";

// Define types
type ClassData = {
  _id: string;
  data: {
    classCode: string;
    className: string;
    major: string;
    Grade: string;
    schoolCode: string;
    teachers: TeacherSchedule[];
    students: Student[];
  };
};

type TeacherSchedule = {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: {
    day: string;
    timeSlot: string;
  }[];
};

type Student = {
  _id: string;
  studentCode: string;
  studentName: string;
  studentlname: string;
  phone: string;
};

type TeacherData = {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
    schoolCode: string;
  };
};

type CourseData = {
  _id: string;
  data: {
    courseCode: string;
    courseName: string;
    Grade: string;
    vahed: number;
    major: string;
    schoolCode: string;
  };
};

const DAYS_OF_WEEK = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => String(i + 1));

const WeeklySchedule = ({
  schoolCode,
  role,
  userCode,
}: {
  schoolCode: string;
  role: string;
  userCode: string;
}) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [view, setView] = useState<"class" | "teacher" | "overview">(
    role === "school" ? "overview" : "class"
  );

  // State for schedule editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<{
    classCode: string;
    className: string;
    teacherCode: string;
    teacherName: string;
    courseCode: string;
    courseName: string;
    weeklySchedule: { day: string; timeSlot: string }[];
  } | null>(null);

  // Custom styles for the component
  const customStyles = `
    .schedule-grid {
      display: grid;
      grid-template-columns: auto repeat(7, 1fr);
      gap: 4px;
      margin-top: 1rem;
      direction: rtl;
    }
    
    .schedule-header {
      font-weight: bold;
      padding: 8px;
      text-align: center;
      background-color: #f3f4f6;
      border-radius: 4px;
    }
    
    .time-slot {
      font-weight: bold;
      padding: 8px;
      text-align: center;
      background-color: #f3f4f6;
      border-radius: 4px;
    }
    
    .schedule-cell {
      min-height: 80px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
      transition: all 0.2s;
      overflow-y: auto;
      max-height: 160px;
    }
    
    .schedule-cell:hover {
      background-color: #f9fafb;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    /* Overview mode styling */
    .overview-cell {
      justify-content: flex-start;
      overflow-y: auto;
      max-height: 180px;
    }
    
    .course-name {
      font-weight: bold;
      margin-bottom: 4px;
    }
    
    .teacher-name {
      font-size: 0.85rem;
      color: #6b7280;
    }
    
    .room-number {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 2px;
    }
    
    .current-day {
      background-color: rgba(16, 185, 129, 0.1);
    }
    
    .empty-cell {
      background-color: #f9fafb;
    }
    
    /* Single day view styling */
    .single-day-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      margin-top: 1rem;
      direction: rtl;
      width: 100%;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .single-day-header {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 4px;
      background-color: #f3f4f6;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
      padding: 10px 0;
    }
    
    .time-header, .day-header {
      padding: 8px;
      text-align: center;
      font-weight: bold;
      border-radius: 4px;
      background-color: #f3f4f6;
    }
    
    .single-day-row {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 4px;
      margin-bottom: 4px;
    }
    
    .single-day-cell {
      min-height: 80px;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
      transition: all 0.2s;
    }
    
    .single-day-cell:hover {
      background-color: #f9fafb;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    
    /* Teacher's own classes highlighting */
    .teacher-own-class {
      border-radius: 6px;
      background-color: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 4px;
      position: relative;
    }
    
    .teacher-own-class::before {
      content: "";
      position: absolute;
      left: -2px;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: #34D399;
      border-radius: 4px 0 0 4px;
    }
    
    .teacher-indicator {
      font-weight: bold;
      color: #059669;
      font-size: 0.8rem;
    }
    
    /* Elements only visible on screen */
    .no-print {
      display: block;
    }
    
    /* Elements only visible when printing */
    .no-screen {
      display: none;
    }

    /* Print styles */
    @media print {
      /* Hide everything except the schedule table */
      body * {
        visibility: hidden;
      }
      
      .schedule-grid, .schedule-grid *, 
      .single-day-grid, .single-day-grid * {
        visibility: visible;
      }
      
      .filter-section, .print-header, .print-footer, .no-screen {
        display: none !important;
      }
      
      /* Page settings */
      @page {
        size: landscape;
        margin: 0.5cm;
      }
      
      /* Main container styling */
      .schedule-container {
        width: 100%;
        padding: 0;
        margin: 0;
        position: absolute;
        top: 0;
        left: 0;
      }
      
      /* Prevent page breaks inside schedule */
      .schedule-grid {
        page-break-inside: avoid;
        border-collapse: collapse;
        width: 100%;
        margin: 0 auto;
        direction: rtl;
      }
      
      /* Print-specific cell styling */
      .schedule-cell {
        border: 1px solid #000 !important;
        padding: 4px !important;
        min-height: auto !important;
        overflow: visible !important;
        max-height: none !important;
        break-inside: avoid;
      }
      
      .schedule-header, .time-slot {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
        border: 1px solid #000 !important;
        color: black !important;
        padding: 4px !important;
        text-align: center !important;
        font-size: 9pt !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Course information styling */
      .course-name {
        font-weight: bold !important;
        font-size: 9pt !important;
        margin-bottom: 1px !important;
        color: black !important;
      }
      
      .teacher-name {
        font-size: 8pt !important;
        color: #333 !important;
      }
      
      /* Badge styling for print */
      .badge-print {
        padding: 1px 4px !important;
        border: 1px solid #ccc !important;
        border-radius: 3px !important;
        font-size: 7pt !important;
        display: inline-block !important;
        margin-top: 1px !important;
        background-color: rgba(0, 0, 0, 0.03) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Current day styling */
      .current-day {
        background-color: #f5f5f5 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Empty cell styling */
      .empty-cell {
        background-color: #f9f9f9 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Overview mode specific styling */
      .overview-cell {
        break-inside: avoid !important;
      }
      
      /* Teacher's own classes in print */
      .teacher-own-class {
        border: 1px solid #34D399 !important;
        background-color: rgba(52, 211, 153, 0.05) !important;
        padding: 3px !important;
        border-radius: 3px !important;
        position: relative !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .teacher-indicator {
        font-weight: bold !important;
        color: #059669 !important;
        font-size: 7pt !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Single day print styling */
      .single-day-grid {
        width: 100% !important;
        max-width: none !important;
        border-collapse: collapse !important;
      }
      
      .single-day-header {
        display: grid !important;
        grid-template-columns: 80px 1fr !important;
        gap: 4px !important;
        border: 1px solid #000 !important;
      }
      
      .time-header, .day-header {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
        border: 1px solid #000 !important;
        padding: 4px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .single-day-row {
        display: grid !important;
        grid-template-columns: 80px 1fr !important;
        gap: 4px !important;
        margin-bottom: 2px !important;
      }
      
      .single-day-cell {
        border: 1px solid #000 !important;
        padding: 4px !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  // Helper function to get current day name
  const getCurrentDayName = (): string => {
    const days = [
      "یکشنبه",
      "دوشنبه",
      "سه‌شنبه",
      "چهارشنبه",
      "پنج‌شنبه",
      "جمعه",
      "شنبه",
    ];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  };

  // Fetch data based on role
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const coursesResponse = await fetch("/api/courses/getcourses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({ schoolCode }),
        });
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);

        // Fetch teachers
        const teachersResponse = await fetch("/api/teachers/getteachers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({ schoolCode }),
        });
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);

        // Fetch classes based on role
        let classesData: ClassData[] = [];

        if (role === "school") {
          // School admin sees all classes
          const classesResponse = await fetch("/api/classes/getclasses", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-domain": window.location.host,
            },
            body: JSON.stringify({ schoolCode }),
          });
          classesData = await classesResponse.json();
        } else if (role === "teacher") {
          // Teacher sees only their classes
          const classesResponse = await fetch(
            "/api/classes/getteacherclasses",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-domain": window.location.host,
              },
              body: JSON.stringify({ schoolCode, teacherCode: userCode }),
            }
          );
          classesData = await classesResponse.json();
          setSelectedTeacher(userCode);
        } else if (role === "student") {
          // Student sees only their class
          const classesResponse = await fetch("/api/classes/getstudentclass", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-domain": window.location.host,
            },
            body: JSON.stringify({ schoolCode, studentCode: userCode }),
          });
          classesData = await classesResponse.json();
          if (classesData.length > 0) {
            setSelectedClass(classesData[0].data.classCode);
          }
        }

        setClasses(classesData);

        // Set default selected class if available
        if (classesData.length > 0 && !selectedClass) {
          setSelectedClass(classesData[0].data.classCode);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (schoolCode) {
      fetchData();
    }
  }, [schoolCode, role, userCode]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  // Get course name from course code
  const getCourseName = (courseCode: string): string => {
    const course = courses.find((c) => c.data.courseCode === courseCode);
    return course ? course.data.courseName : courseCode;
  };

  // Get teacher name from teacher code
  const getTeacherName = (teacherCode: string): string => {
    const teacher = teachers.find((t) => t.data.teacherCode === teacherCode);
    return teacher ? teacher.data.teacherName : teacherCode;
  };

  // Generate schedule data
  const generateScheduleData = () => {
    const scheduleData: Record<
      string,
      Record<
        string,
        {
          courseCode: string;
          teacherCode: string;
          className?: string;
          classCode?: string;
        }[]
      >
    > = {};

    // Initialize empty schedule
    TIME_SLOTS.forEach((timeSlot) => {
      scheduleData[timeSlot] = {};
      DAYS_OF_WEEK.forEach((day) => {
        scheduleData[timeSlot][day] = [];
      });
    });

    if (view === "class" && selectedClass) {
      // Find selected class
      const classData = classes.find((c) => c.data.classCode === selectedClass);

      if (classData) {
        // Fill schedule with class data
        classData.data.teachers.forEach((teacher) => {
          teacher.weeklySchedule?.forEach((schedule) => {
            if (
              scheduleData[schedule.timeSlot] &&
              scheduleData[schedule.timeSlot][schedule.day]
            ) {
              scheduleData[schedule.timeSlot][schedule.day].push({
                courseCode: teacher.courseCode,
                teacherCode: teacher.teacherCode,
              });
            }
          });
        });
      }
    } else if (view === "teacher" && selectedTeacher) {
      // Fill schedule with teacher's classes
      classes.forEach((classData) => {
        const teacherSchedules = classData.data.teachers.filter(
          (t) => t.teacherCode === selectedTeacher
        );

        teacherSchedules.forEach((teacher) => {
          teacher.weeklySchedule?.forEach((schedule) => {
            if (
              scheduleData[schedule.timeSlot] &&
              scheduleData[schedule.timeSlot][schedule.day]
            ) {
              scheduleData[schedule.timeSlot][schedule.day].push({
                courseCode: teacher.courseCode,
                teacherCode: teacher.teacherCode,
                className: classData.data.className,
                classCode: classData.data.classCode,
              });
            }
          });
        });
      });
    } else if (view === "overview") {
      // Comprehensive view for school admins - show all classes
      classes.forEach((classData) => {
        classData.data.teachers.forEach((teacher) => {
          teacher.weeklySchedule?.forEach((schedule) => {
            if (
              scheduleData[schedule.timeSlot] &&
              scheduleData[schedule.timeSlot][schedule.day]
            ) {
              scheduleData[schedule.timeSlot][schedule.day].push({
                courseCode: teacher.courseCode,
                teacherCode: teacher.teacherCode,
                className: classData.data.className,
                classCode: classData.data.classCode,
              });
            }
          });
        });
      });
    }

    return scheduleData;
  };

  const scheduleData = generateScheduleData();
  const currentDay = getCurrentDayName();

  // Handle edit button click for a schedule item
  const handleEditSchedule = (
    classCode: string,
    className: string,
    teacherCode: string,
    courseCode: string
  ) => {
    // Only school admins can edit
    if (role !== "school") return;

    // Find the class
    const classData = classes.find((c) => c.data.classCode === classCode);
    if (!classData) {
      toast.error("کلاس مورد نظر یافت نشد");
      return;
    }

    // Find the teacher
    const teacherData = teachers.find(
      (t) => t.data.teacherCode === teacherCode
    );
    if (!teacherData) {
      toast.error("معلم مورد نظر یافت نشد");
      return;
    }

    // Find the course
    const courseData = courses.find((c) => c.data.courseCode === courseCode);
    if (!courseData) {
      toast.error("درس مورد نظر یافت نشد");
      return;
    }

    // Find the teacher's schedule in the class
    const teacherSchedule = classData.data.teachers.find(
      (t) => t.teacherCode === teacherCode && t.courseCode === courseCode
    );

    setEditingSchedule({
      classCode,
      className: classData.data.className,
      teacherCode,
      teacherName: teacherData.data.teacherName,
      courseCode,
      courseName: courseData.data.courseName,
      weeklySchedule: teacherSchedule?.weeklySchedule || [],
    });

    setEditorOpen(true);
  };

  // Save updated schedule
  const saveSchedule = async (
    newSchedule: { day: string; timeSlot: string }[]
  ) => {
    if (!editingSchedule) return;

    try {
      const response = await fetch("/api/classes/updateWeeklySchedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          classCode: editingSchedule.classCode,
          teacherCode: editingSchedule.teacherCode,
          courseCode: editingSchedule.courseCode,
          weeklySchedule: newSchedule,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update schedule");
      }

      // Update local classes data
      setClasses((prevClasses) => {
        return prevClasses.map((classItem) => {
          if (classItem.data.classCode !== editingSchedule.classCode) {
            return classItem;
          }

          const updatedTeachers = classItem.data.teachers.map((teacher) => {
            if (
              teacher.teacherCode === editingSchedule.teacherCode &&
              teacher.courseCode === editingSchedule.courseCode
            ) {
              return {
                ...teacher,
                weeklySchedule: newSchedule,
              };
            }
            return teacher;
          });

          return {
            ...classItem,
            data: {
              ...classItem.data,
              teachers: updatedTeachers,
            },
          };
        });
      });

      toast.success("برنامه هفتگی با موفقیت به‌روزرسانی شد");
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "خطا در به‌روزرسانی برنامه هفتگی"
      );
    }
  };

  return (
    <div className="schedule-container">
      <style>{customStyles}</style>

      {/* Schedule Editor Dialog */}
      {editingSchedule && (
        <ScheduleEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          teacherData={{
            teacherCode: editingSchedule.teacherCode,
            teacherName: editingSchedule.teacherName,
          }}
          courseData={{
            courseCode: editingSchedule.courseCode,
            courseName: editingSchedule.courseName,
          }}
          currentSchedule={editingSchedule.weeklySchedule}
          onSave={saveSchedule}
        />
      )}

      {/* Filters section */}
      <div className="filter-section no-print mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* View selection */}
          <div>
            <Tabs
              value={view}
              onValueChange={(v) =>
                setView(v as "class" | "teacher" | "overview")
              }
              className="w-full"
            >
              <TabsList className="w-full">
                {role === "school" && (
                  <TabsTrigger value="overview" className="flex-1">
                    نمای کلی مدرسه
                  </TabsTrigger>
                )}
                <TabsTrigger value="class" className="flex-1">
                  نمایش بر اساس کلاس
                </TabsTrigger>
                <TabsTrigger value="teacher" className="flex-1">
                  نمایش بر اساس معلم
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Class selector - show in class view */}
          {view === "class" && (
            <div>
              <Label htmlFor="class-select" className="block mb-2 text-right">
                کلاس
              </Label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={role === "student"}
              >
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem
                      key={classItem.data.classCode}
                      value={classItem.data.classCode}
                    >
                      {classItem.data.className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Teacher selector - show in teacher view */}
          {view === "teacher" && (
            <div>
              <Label htmlFor="teacher-select" className="block mb-2 text-right">
                معلم
              </Label>
              <Select
                value={selectedTeacher}
                onValueChange={setSelectedTeacher}
                disabled={role === "teacher"}
              >
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder="انتخاب معلم" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem
                      key={teacher.data.teacherCode}
                      value={teacher.data.teacherCode}
                    >
                      {teacher.data.teacherName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Leave empty div for spacing in overview mode */}
          {view === "overview" && <div></div>}

          {/* Day filter */}
          <div>
            <Label htmlFor="day-select" className="block mb-2 text-right">
              روز
            </Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger id="day-select">
                <SelectValue placeholder="همه روزها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">همه روزها</SelectItem>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Print button */}
          <div className="flex items-end">
            <Button variant="outline" onClick={handlePrint} className="w-full">
              <Printer className="h-4 w-4 mr-2" />
              چاپ برنامه
            </Button>
          </div>
        </div>
      </div>

      {/* Title for screen and printing */}
      <div className="text-center mb-4 print-header">
        <h2 className="text-xl font-bold">
          {view === "class" &&
            selectedClass &&
            `برنامه هفتگی کلاس ${
              classes.find((c) => c.data.classCode === selectedClass)?.data
                .className || selectedClass
            }`}
          {view === "teacher" &&
            selectedTeacher &&
            `برنامه هفتگی ${getTeacherName(selectedTeacher)}`}
          {view === "overview" && `برنامه هفتگی کلی مدرسه`}
        </h2>
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div className="text-center p-8">در حال بارگذاری...</div>
      ) : (
        <div className={`${selectedDay ? "single-day-grid" : "schedule-grid"}`}>
          {/* Day header row */}
          {!selectedDay ? (
            <>
              {/* Empty corner cell */}
              <div className="schedule-header"></div>

              {/* Day headers */}
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className={`schedule-header ${
                    day === currentDay ? "current-day" : ""
                  }`}
                >
                  {day}
                </div>
              ))}
            </>
          ) : (
            // For single day view, show a special header
            <div className="single-day-header">
              <div className="time-header">زمان</div>
              <div
                className={`day-header ${
                  selectedDay === currentDay ? "current-day" : ""
                }`}
              >
                {selectedDay}
              </div>
            </div>
          )}

          {/* Time slots and schedule cells */}
          {TIME_SLOTS.map((timeSlot) => (
            <React.Fragment key={timeSlot}>
              {!selectedDay ? (
                // Full week view
                <>
                  {/* Time slot */}
                  <div className="time-slot">{timeSlot}</div>

                  {/* Schedule cells for each day */}
                  {DAYS_OF_WEEK.map((day) => {
                    const cellData = scheduleData[timeSlot][day];
                    return (
                      <div
                        key={`${timeSlot}-${day}`}
                        className={`schedule-cell ${
                          cellData.length === 0 ? "empty-cell" : ""
                        } ${day === currentDay ? "current-day" : ""} ${
                          view === "overview" ? "overview-cell" : ""
                        }`}
                      >
                        {cellData.map((item, idx) => (
                          <div
                            key={idx}
                            className={`relative w-full mb-2 ${
                              role === "teacher" &&
                              view === "class" &&
                              item.teacherCode === userCode
                                ? "teacher-own-class"
                                : ""
                            }`}
                          >
                            {/* Edit button - only for school admin */}
                            {role === "school" && item.classCode && (
                              <button
                                onClick={() =>
                                  handleEditSchedule(
                                    item.classCode || "",
                                    item.className || "",
                                    item.teacherCode,
                                    item.courseCode
                                  )
                                }
                                className="absolute top-1 left-1 text-gray-400 hover:text-blue-500 no-print"
                                title="ویرایش برنامه"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}

                            <div className="course-name">
                              {getCourseName(item.courseCode)}
                            </div>
                            <div className="teacher-name">
                              {getTeacherName(item.teacherCode)}
                              {role === "teacher" &&
                                view === "class" &&
                                item.teacherCode === userCode && (
                                  <span className="teacher-indicator">
                                    {" "}
                                    (شما){" "}
                                  </span>
                                )}
                            </div>
                            {(view === "teacher" || view === "overview") &&
                              item.className && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 badge-print"
                                  style={{
                                    backgroundColor:
                                      view === "overview"
                                        ? `hsl(${
                                            (parseInt(item.classCode || "0") *
                                              137.5) %
                                            360
                                          }, 70%, 95%)`
                                        : undefined,
                                    borderColor:
                                      view === "overview"
                                        ? `hsl(${
                                            (parseInt(item.classCode || "0") *
                                              137.5) %
                                            360
                                          }, 70%, 85%)`
                                        : undefined,
                                  }}
                                >
                                  {item.className}
                                </Badge>
                              )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              ) : (
                // Single day view
                <div className="single-day-row">
                  <div className="time-slot">{timeSlot}</div>
                  <div
                    className={`single-day-cell ${
                      scheduleData[timeSlot][selectedDay]?.length === 0
                        ? "empty-cell"
                        : ""
                    } ${selectedDay === currentDay ? "current-day" : ""} ${
                      view === "overview" ? "overview-cell" : ""
                    }`}
                  >
                    {scheduleData[timeSlot][selectedDay]?.map((item, idx) => (
                      <div
                        key={idx}
                        className={`relative w-full mb-2 ${
                          role === "teacher" &&
                          view === "class" &&
                          item.teacherCode === userCode
                            ? "teacher-own-class"
                            : ""
                        }`}
                      >
                        {/* Edit button - only for school admin */}
                        {role === "school" && item.classCode && (
                          <button
                            onClick={() =>
                              handleEditSchedule(
                                item.classCode || "",
                                item.className || "",
                                item.teacherCode,
                                item.courseCode
                              )
                            }
                            className="absolute top-1 left-1 text-gray-400 hover:text-blue-500 no-print"
                            title="ویرایش برنامه"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        )}

                        <div className="course-name">
                          {getCourseName(item.courseCode)}
                        </div>
                        <div className="teacher-name">
                          {getTeacherName(item.teacherCode)}
                          {role === "teacher" &&
                            view === "class" &&
                            item.teacherCode === userCode && (
                              <span className="teacher-indicator"> (شما) </span>
                            )}
                        </div>
                        {(view === "teacher" || view === "overview") &&
                          item.className && (
                            <Badge
                              variant="outline"
                              className="mt-1 badge-print"
                              style={{
                                backgroundColor:
                                  view === "overview"
                                    ? `hsl(${
                                        (parseInt(item.classCode || "0") *
                                          137.5) %
                                        360
                                      }, 70%, 95%)`
                                    : undefined,
                                borderColor:
                                  view === "overview"
                                    ? `hsl(${
                                        (parseInt(item.classCode || "0") *
                                          137.5) %
                                        360
                                      }, 70%, 85%)`
                                    : undefined,
                              }}
                            >
                              {item.className}
                            </Badge>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default WeeklySchedule;
