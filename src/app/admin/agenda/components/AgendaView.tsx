"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { vazirmatn } from "@/lib/fonts";
import {
  CalendarDaysIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  BookOpenIcon,
  UserIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Define types
interface Event {
  _id: string;
  title: string;
  description: string;
  persianDate: string;
  date: string;
  timeSlot: string;
  teacherCode: string;
  courseCode: string;
  classCode: string;
  schoolCode: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface Teacher {
  _id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  teacherCode?: string;
  teacherName?: string;
  data?: {
    teacherCode: string;
    teacherName: string;
    schoolCode: string;
  };
}

interface ClassData {
  classCode: string;
  className: string;
  teachers: ClassTeacher[];
  schoolCode: string;
  major?: string;
  Grade?: string;
  [key: string]: string | string[] | ClassTeacher[] | boolean | undefined;
}

interface Class {
  _id: string;
  classCode?: string;
  className?: string;
  data?: ClassData;
}

interface ClassTeacher {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: {
    day: string;
    timeSlot: string;
  }[];
  weeklySchedule_expanded?: boolean;
}

interface CourseData {
  courseCode: string;
  courseName: string;
  schoolCode: string;
  major?: string;
  Grade?: string;
  [key: string]: string | number | undefined;
}

interface Course {
  _id: string;
  courseCode?: string;
  courseName?: string;
  data?: CourseData;
}

interface AgendaViewProps {
  schoolCode: string;
  userType: string;
  teacherCode?: string;
}

interface DayWithEvents {
  day: number;
  persianDay: string;
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

// Helper function for grouping events by Persian date
const groupEventsByDate = (events: Event[]) => {
  const groupedEvents: { [key: string]: Event[] } = {};

  events.forEach((event) => {
    if (!groupedEvents[event.persianDate]) {
      groupedEvents[event.persianDate] = [];
    }
    groupedEvents[event.persianDate].push(event);
  });

  return groupedEvents;
};

// Get Persian weekday names in proper RTL order
const weekdayNames = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];

// Helper function to ensure non-undefined strings
const ensureString = (value: string | undefined): string => {
  return value || "";
};

// Safely get property from a potential data object
const getDataProperty = <T,>(
  obj: any,
  propertyName: string,
  defaultValue: T
): T => {
  if (obj && obj.data && obj.data[propertyName] !== undefined) {
    return obj.data[propertyName] as T;
  }
  if (obj && obj[propertyName] !== undefined) {
    return obj[propertyName] as T;
  }
  return defaultValue;
};

// Process the classes data to extract teacher-class-course relationships
const processClassesData = (
  classesData: Class[]
): {
  [key: string]: { classCode: string; courses: string[] }[];
} => {
  const teacherClassMap: {
    [key: string]: { classCode: string; courses: string[] }[];
  } = {};

  classesData.forEach((cls) => {
    // Extract class data
    const data = cls.data || (cls as unknown as ClassData);
    const classCode = data.classCode;
    const teachers = data.teachers || [];

    // For each teacher in the class
    teachers.forEach((teacher: ClassTeacher) => {
      const tCode = teacher.teacherCode;
      const courseCode = teacher.courseCode;

      if (!teacherClassMap[tCode]) {
        teacherClassMap[tCode] = [];
      }

      // Check if this class is already in teacher's classes
      const existingClassIndex = teacherClassMap[tCode].findIndex(
        (c) => c.classCode === classCode
      );

      if (existingClassIndex === -1) {
        // Add new class with course
        teacherClassMap[tCode].push({
          classCode,
          courses: [courseCode],
        });
      } else {
        // Add course to existing class if not already there
        if (
          !teacherClassMap[tCode][existingClassIndex].courses.includes(
            courseCode
          )
        ) {
          teacherClassMap[tCode][existingClassIndex].courses.push(courseCode);
        }
      }
    });
  });

  return teacherClassMap;
};

export default function AgendaView({
  schoolCode,
  userType,
  teacherCode,
}: AgendaViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [formData, setFormData] = useState<Partial<Event>>({
    title: "",
    description: "",
    persianDate: "",
    timeSlot: "",
    teacherCode: teacherCode || "",
    courseCode: "",
    classCode: "",
    schoolCode: schoolCode || "",
  });

  // Store teacher classes for filtering
  const [teacherClasses, setTeacherClasses] = useState<{
    [key: string]: { classCode: string; courses: string[] }[];
  }>({});

  // Selected teacher for the form when admin is creating events
  const [selectedTeacher, setSelectedTeacher] = useState<string>(
    teacherCode || ""
  );

  // Get current Persian date for initialization
  const getTodayPersianDate = () => {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return toEnglishDigits(persianDate);
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Construct API endpoint based on user type
      let endpoint = "/api/events/events";
      if (userType === "teacher" && teacherCode) {
        endpoint = `/api/events/teacher/${teacherCode}`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data);

      // Initialize current month from today's date
      setCurrentMonth(new Date());

      // Fetch reference data
      await fetchReferenceData();
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers, courses, and classes for reference
  const fetchReferenceData = async () => {
    try {
      // Fetch teachers
      const teachersResponse = await fetch("/api/teachers");
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        setTeachers(teachersData);
      }

      // Fetch courses
      const coursesResponse = await fetch("/api/courses/courses");
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Fetch classes
      const classesResponse = await fetch("/api/classes/classes");
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);

        // Process teacher-class-course relationships
        const teacherClassMap = processClassesData(classesData);
        setTeacherClasses(teacherClassMap);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [schoolCode, teacherCode, userType]);

  // Filter events based on search text
  const filteredEvents = events.filter((event) => {
    if (!filterText) return true;
    const searchText = filterText.toLowerCase();
    return (
      event.title.toLowerCase().includes(searchText) ||
      event.description.toLowerCase().includes(searchText) ||
      event.persianDate.includes(searchText)
    );
  });

  // Group events by Persian date
  const eventsGroupedByDate = groupEventsByDate(filteredEvents);

  // Get teacher name by code
  const getTeacherName = (code: string) => {
    const teacher = teachers.find((t) => t.username === code);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : code;
  };

  // Get course name by code
  const getCourseName = (code: string) => {
    const course = courses.find((c) => c.courseCode === code);
    return course ? course.courseName : code;
  };

  // Get class name by code
  const getClassName = (code: string) => {
    const classObj = classes.find((c) => c.classCode === code);
    return classObj ? classObj.className : code;
  };

  // Go to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth((prevDate) => {
      if (prevDate === null) return new Date();
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // Go to next month
  const goToNextMonth = () => {
    setCurrentMonth((prevDate) => {
      if (prevDate === null) return new Date();
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Format date to Persian
  const formatToPersianDate = (date: Date) => {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
    }).format(date);
  };

  // Get days for the current month view
  const getDaysForCurrentMonth = () => {
    if (!currentMonth) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get today for highlighting
    const todayPersianDateStr = getTodayPersianDate();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
    // For Persian calendar, the week starts with Saturday (6)
    let firstDayOfWeek = firstDayOfMonth.getDay();
    // Adjust to Persian calendar (Saturday is first day of week)
    firstDayOfWeek = (firstDayOfWeek + 1) % 7;

    const daysInMonth = lastDayOfMonth.getDate();

    const days: DayWithEvents[] = [];

    // Add previous month's days to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
      const persianDateNormalized = persianDate.replace(/[٠-٩]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) - 1728)
      );

      days.push({
        day,
        persianDay: persianDateNormalized,
        events: eventsGroupedByDate[persianDateNormalized] || [],
        isCurrentMonth: false,
        isToday: persianDateNormalized === todayPersianDateStr,
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
      const persianDateNormalized = persianDate.replace(/[٠-٩]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) - 1728)
      );

      days.push({
        day,
        persianDay: persianDateNormalized,
        events: eventsGroupedByDate[persianDateNormalized] || [],
        isCurrentMonth: true,
        isToday: persianDateNormalized === todayPersianDateStr,
      });
    }

    // Add next month's days to complete the grid (6 rows x 7 days = 42 cells)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const persianDate = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
      const persianDateNormalized = persianDate.replace(/[٠-٩]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) - 1728)
      );

      days.push({
        day,
        persianDay: persianDateNormalized,
        events: eventsGroupedByDate[persianDateNormalized] || [],
        isCurrentMonth: false,
        isToday: persianDateNormalized === todayPersianDateStr,
      });
    }

    return days;
  };

  // Extract the persian day number only
  const extractDayNumber = (persianDate: string) => {
    const parts = persianDate.split("/");
    if (parts.length === 3) {
      return parts[2].replace(/^0+/, ""); // Remove leading zeros
    }
    return "";
  };

  // Handle event selection
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  // Close event details modal
  const closeEventDetails = () => {
    setShowEventDetails(false);
    setSelectedEvent(null);
  };

  // Reset form
  const resetForm = () => {
    const initialTeacherCode = userType === "teacher" ? teacherCode : "";
    setFormData({
      title: "",
      description: "",
      persianDate: "",
      timeSlot: "",
      teacherCode: initialTeacherCode || "",
      courseCode: "",
      classCode: "",
      schoolCode: schoolCode || "",
    });
    setSelectedTeacher(initialTeacherCode || "");
    setEditMode(false);
  };

  // Open the form for creating a new event
  const openNewEventForm = (persianDay: string) => {
    resetForm();
    setSelectedDay(persianDay);
    setFormData((prev) => ({ ...prev, persianDate: persianDay }));
    setShowEventForm(true);
    setEditMode(false);
  };

  // Open the form for editing an existing event
  const openEditEventForm = (event: Event) => {
    setFormData({
      _id: event._id,
      title: event.title,
      description: event.description,
      persianDate: event.persianDate,
      date: event.date,
      timeSlot: event.timeSlot,
      teacherCode: event.teacherCode,
      courseCode: event.courseCode,
      classCode: event.classCode,
      schoolCode: event.schoolCode,
    });
    setSelectedTeacher(event.teacherCode);
    setShowEventDetails(false);
    setShowEventForm(true);
    setEditMode(true);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === "teacherCode") {
      setSelectedTeacher(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        classCode: "", // Reset selected class
        courseCode: "", // Reset selected course
      }));
    } else if (name === "classCode") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        courseCode: "", // Reset selected course when class changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Close event form
  const closeEventForm = () => {
    setShowEventForm(false);
    resetForm();
  };

  // Handle form submission
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validation
      if (
        !formData.title ||
        !formData.persianDate ||
        !formData.timeSlot ||
        !formData.teacherCode ||
        !formData.classCode ||
        !formData.courseCode
      ) {
        toast.error("لطفا فیلدهای ضروری را تکمیل کنید");
        return;
      }

      // Convert Persian date to Gregorian for storage
      // Format should be YYYY-MM-DD
      // Note: In a real implementation, you would use a proper Persian to Gregorian conversion library
      // For now, we'll use current date as a placeholder
      const gregorianDate = new Date().toISOString().split("T")[0]; // Default to today

      // Create or update event
      const endpoint = editMode
        ? `/api/events/${formData._id}`
        : "/api/events/events";
      const method = editMode ? "PUT" : "POST";

      // Create a copy of the formData without the _id field for updates
      // MongoDB doesn't allow updating the _id field
      const eventDataToSend = { ...formData };
      if (editMode) {
        // Remove _id from the data being sent for updates
        delete eventDataToSend._id;
      }

      // Ensure all required fields are included
      const eventData = {
        ...eventDataToSend,
        date: gregorianDate, // Add the Gregorian date
        schoolCode: schoolCode || formData.schoolCode, // Ensure schoolCode is included
      };

      console.log("Submitting event data:", eventData);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error:", errorData);
        throw new Error(
          `${editMode ? "ویرایش" : "ایجاد"} رویداد با خطا مواجه شد: ${
            errorData.error || response.statusText
          }`
        );
      }

      // Refresh events
      await fetchEvents();

      // Show success message
      toast.success(`رویداد با موفقیت ${editMode ? "ویرایش" : "ایجاد"} شد`);

      // Close form
      closeEventForm();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(
        "خطا در ذخیره رویداد: " +
          (error instanceof Error ? error.message : "خطای نامشخص")
      );
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("آیا از حذف این رویداد اطمینان دارید؟")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("حذف رویداد با خطا مواجه شد");
      }

      // Refresh events
      await fetchEvents();

      // Close details modal
      setShowEventDetails(false);

      // Show success message
      toast.success("رویداد با موفقیت حذف شد");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("خطا در حذف رویداد");
    }
  };

  // Check if user can edit an event
  const canEditEvent = (event: Event) => {
    return (
      userType === "school" ||
      (userType === "teacher" && event.teacherCode === teacherCode) ||
      event.createdBy === teacherCode
    );
  };

  // Get available classes for the selected teacher
  const availableClasses = useMemo(() => {
    const teacherToUse = selectedTeacher || teacherCode || "";
    if (!teacherToUse || !teacherClasses[teacherToUse]) {
      return [];
    }

    // Get class codes for this teacher
    const classCodes = teacherClasses[teacherToUse].map(
      (item) => item.classCode
    );

    // Filter classes collection to get only the classes this teacher teaches
    return classes.filter((cls) => {
      const classCode = ensureString(
        cls.classCode || (cls.data && cls.data.classCode)
      );
      return classCodes.includes(classCode);
    });
  }, [classes, teacherClasses, selectedTeacher, teacherCode]);

  // Get available courses for the selected teacher and class
  const availableCourses = useMemo(() => {
    const teacherToUse = selectedTeacher || teacherCode || "";
    const selectedClass = formData.classCode;

    if (!teacherToUse || !selectedClass) {
      return [];
    }

    // Find the selected class data to get major and grade
    const selectedClassData = classes.find((cls) => {
      const classCode = getDataProperty(cls, "classCode", "");
      return classCode === selectedClass;
    });

    if (!selectedClassData) {
      return [];
    }

    const classMajor = getDataProperty(selectedClassData, "major", "");
    const classGrade = getDataProperty(selectedClassData, "Grade", "");

    // If the teacher has specific courses in this class
    if (teacherClasses[teacherToUse]) {
      // Find the courses for this teacher and class
      const teacherClass = teacherClasses[teacherToUse].find(
        (item) => item.classCode === selectedClass
      );

      if (teacherClass) {
        // Get the course codes for this teacher and class
        const courseCodes = teacherClass.courses;

        // Filter courses collection to get only:
        // 1. The courses this teacher teaches in this class
        // 2. That match the class major and grade
        return courses.filter((course) => {
          const courseData = course.data || course;
          const courseCode = ensureString(
            course.courseCode || (course.data && course.data.courseCode)
          );

          // First check if teacher teaches this course in this class
          const isTeacherCourse = courseCodes.includes(courseCode);

          // Then check if course matches class major and grade
          const matchesMajor =
            !classMajor ||
            !getDataProperty(courseData, "major", "") ||
            getDataProperty(courseData, "major", "") === classMajor;
          const matchesGrade =
            !classGrade ||
            !getDataProperty(courseData, "Grade", "") ||
            getDataProperty(courseData, "Grade", "") === classGrade;

          return isTeacherCourse && matchesMajor && matchesGrade;
        });
      }
    }

    // If teacher has no specific courses in this class,
    // just return courses that match the major and grade
    return courses.filter((course) => {
      const courseData = course.data || course;

      const matchesMajor =
        !classMajor ||
        !getDataProperty(courseData, "major", "") ||
        getDataProperty(courseData, "major", "") === classMajor;
      const matchesGrade =
        !classGrade ||
        !getDataProperty(courseData, "Grade", "") ||
        getDataProperty(courseData, "Grade", "") === classGrade;

      return matchesMajor && matchesGrade;
    });
  }, [
    courses,
    classes,
    teacherClasses,
    selectedTeacher,
    teacherCode,
    formData.classCode,
  ]);
  const toEnglishDigits = (str: string) =>
    str
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728))
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632));

  // Calculate days remaining to an event
  // ① Make sure the helper below exists somewhere above this function:
  //
  // const toEnglishDigits = (str: string) =>
  //   str
  //     .replace(/[۰-۹]/g, d => String.fromCharCode(d.charCodeAt(0) - 1728)) // Persian
  //     .replace(/[٠-٩]/g, d => String.fromCharCode(d.charCodeAt(0) - 1632)); // Arabic-Indic

  const calculateDaysRemaining = (persianDate: string): number => {
    try {
      /* -------- 1  normalise digits and quick equality check -------- */
      const eventPersian = toEnglishDigits(persianDate.trim());
      const todayPersian = toEnglishDigits(getTodayPersianDate().trim());
      if (eventPersian === todayPersian) return 0;

      /* -------- 2  validate YYYY/MM/DD format -------- */
      const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
      if (!dateRegex.test(eventPersian) || !dateRegex.test(todayPersian)) {
        console.error("Unexpected date format:", {
          eventPersian,
          todayPersian,
        });
        return 0;
      }

      /* -------- 3  parse components -------- */
      const [eventYear, eventMonth, eventDay] = eventPersian
        .split("/")
        .map(Number);
      const [todayYear, todayMonth, todayDay] = todayPersian
        .split("/")
        .map(Number);

      /* -------- 4  basic range sanity-check -------- */
      const valid = (y: number, m: number, d: number) =>
        y >= 1300 && y <= 1500 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
      if (
        !valid(eventYear, eventMonth, eventDay) ||
        !valid(todayYear, todayMonth, todayDay)
      )
        return 0;

      /* -------- 5  rough Jalali day-count (ignores leap years) -------- */
      const jalaliMonthDays = (month: number) =>
        month <= 6 ? 31 : month <= 11 ? 30 : 29;

      const totalDays = (y: number, m: number, d: number) => {
        let days = y * 365 + d;
        for (let i = 1; i < m; i++) days += jalaliMonthDays(i);
        return days;
      };

      const eventTotal = totalDays(eventYear, eventMonth, eventDay);
      const todayTotal = totalDays(todayYear, todayMonth, todayDay);

      return eventTotal - todayTotal;
    } catch (err) {
      console.error("calculateDaysRemaining error:", err);
      return 0;
    }
  };

  // Get days remaining text with appropriate color
  const getDaysRemainingText = (
    daysRemaining: number
  ): { text: string; color: string } => {
    if (daysRemaining < 0) {
      return { text: "گذشته", color: "text-gray-500" };
    } else if (daysRemaining === 0) {
      return { text: "امروز", color: "text-green-600 font-bold" };
    } else if (daysRemaining === 1) {
      return { text: "فردا", color: "text-yellow-600" };
    } else if (daysRemaining <= 3) {
      return { text: `${daysRemaining} روز دیگر`, color: "text-yellow-600" };
    } else {
      return { text: `${daysRemaining} روز دیگر`, color: "text-blue-600" };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">تقویم رویدادها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-2 grid-cols-7">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-10 rounded-lg" />
              ))}
              {[...Array(35)].map((_, i) => (
                <Skeleton key={`day-${i}`} className="h-24 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const days = getDaysForCurrentMonth();

  return (
    <div className={`container mx-auto py-8 ${vazirmatn.className}`}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              تقویم رویدادها
            </CardTitle>
            {userType === "school" && (
              <Button
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  resetForm();
                  setShowEventForm(true);
                }}
              >
                <PlusIcon className="h-5 w-5 ml-1" />
                افزودن رویداد جدید
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Calendar controls */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={goToPreviousMonth}
                className="h-10 w-10 p-0 rounded-full"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </Button>

              <div className="relative min-w-[180px] text-center">
                <span className="text-lg font-bold">
                  {currentMonth ? formatToPersianDate(currentMonth) : ""}
                </span>
              </div>

              <Button
                variant="outline"
                onClick={goToNextMonth}
                className="h-10 w-10 p-0 rounded-full"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </Button>
            </div>

            <div className="w-full md:w-72">
              <Input
                placeholder="جستجو در رویدادها..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Calendar */}
          <div className="overflow-hidden rounded-lg border border-gray-200">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {weekdayNames.map((day, index) => (
                <div
                  key={index}
                  className="bg-gray-50 text-center py-2 font-medium text-gray-700 border-b"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {days.map((dayData, index) => {
                const dayNumber = extractDayNumber(dayData.persianDay);
                return (
                  <div
                    key={index}
                    className={cn(
                      "bg-white p-1.5 min-h-[150px] transition-colors cursor-pointer",
                      !dayData.isCurrentMonth && "bg-gray-50 text-gray-400",
                      dayData.isToday && "bg-blue-50"
                    )}
                    onClick={() => openNewEventForm(dayData.persianDay)}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={cn(
                          "inline-block rounded-full w-7 h-7 text-center leading-7 font-semibold",
                          dayData.isToday && "bg-blue-600 text-white"
                        )}
                      >
                        {dayNumber}
                      </span>
                      {dayData.events.length > 0 && (
                        <Badge
                          variant="outline"
                          className="font-normal text-xs"
                        >
                          {dayData.events.length}
                        </Badge>
                      )}
                    </div>

                    {/* Events for this day */}
                    <div className="mt-1 space-y-1 max-h-[100px] overflow-y-auto">
                      {dayData.events.slice(0, 3).map((event) => {
                        const daysRemaining = calculateDaysRemaining(
                          event.persianDate
                        );
                        const { text: remainingText, color: remainingColor } =
                          getDaysRemainingText(daysRemaining);

                        return (
                          <div
                            key={event._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                            className="text-xs p-1.5 rounded bg-white border border-blue-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                            style={{ borderRight: "3px solid #3b82f6" }}
                          >
                            {/* Title with colored background */}
                            <div className="font-medium text-gray-800 mb-0.5 truncate">
                              {event.title}
                            </div>

                            {/* Event details */}
                            <div className="flex flex-col gap-0.5 text-[10px]">
                              {/* Teacher name */}
                              <div className="flex items-center gap-1 text-gray-600">
                                <UserIcon className="h-2.5 w-2.5" />
                                <span className="truncate">
                                  {getTeacherName(event.teacherCode)}
                                </span>
                              </div>

                              {/* Class name */}
                              <div className="flex items-center gap-1 text-gray-600">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-2.5 w-2.5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                                <span className="truncate">
                                  {getClassName(event.classCode)}
                                </span>
                              </div>

                              {/* Days remaining indicator */}
                              <div className={`mt-0.5 ${remainingColor}`}>
                                <ClockIcon className="h-2.5 w-2.5 inline-block ml-0.5" />
                                {remainingText}
                              </div>
                            </div>

                            {/* Right accent color */}
                            <div className="absolute top-0 right-0 h-full w-1 bg-blue-500"></div>
                          </div>
                        );
                      })}
                      {dayData.events.length > 3 && (
                        <div
                          className="text-xs text-center text-blue-600 font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dayData.events.length - 3} رویداد دیگر...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={closeEventDetails}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{selectedEvent.title}</h3>
                <Button variant="ghost" size="sm" onClick={closeEventDetails}>
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">تاریخ:</div>
                <div className="flex items-center gap-1">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                  <span>{selectedEvent.persianDate}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">زمان:</div>
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-blue-500" />
                  <span>زنگ {selectedEvent.timeSlot}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">استاد:</div>
                <div className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4 text-blue-500" />
                  <span>{getTeacherName(selectedEvent.teacherCode)}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">درس:</div>
                <div className="flex items-center gap-1">
                  <BookOpenIcon className="h-4 w-4 text-blue-500" />
                  <span>{getCourseName(selectedEvent.courseCode)}</span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">کلاس:</div>
                <div>
                  <Badge variant="secondary">
                    {getClassName(selectedEvent.classCode)}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">توضیحات:</div>
                <div className="p-2 rounded bg-gray-50 min-h-[60px]">
                  {selectedEvent.description || "بدون توضیحات"}
                </div>
              </div>

              {canEditEvent(selectedEvent) && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => openEditEventForm(selectedEvent)}
                  >
                    <PencilIcon className="h-4 w-4 text-blue-600" />
                    ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteEvent(selectedEvent._id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                    حذف
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
          onClick={closeEventForm}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">
                  {editMode ? "ویرایش رویداد" : "افزودن رویداد جدید"}
                </h3>
                <Button variant="ghost" size="sm" onClick={closeEventForm}>
                  ✕
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmitEvent}>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">عنوان رویداد</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                    placeholder="عنوان رویداد را وارد کنید"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persianDate">تاریخ</Label>
                  <Input
                    id="persianDate"
                    name="persianDate"
                    value={formData.persianDate || ""}
                    onChange={handleInputChange}
                    placeholder="تاریخ را به صورت 1402/02/15 وارد کنید"
                    required
                    readOnly={!!selectedDay}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeSlot">زنگ</Label>
                  <Select
                    value={formData.timeSlot || ""}
                    onValueChange={(value) =>
                      handleSelectChange("timeSlot", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب زنگ" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          زنگ {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {userType === "school" && (
                  <div className="space-y-2">
                    <Label htmlFor="teacherCode">استاد</Label>
                    <Select
                      value={formData.teacherCode || ""}
                      onValueChange={(value) =>
                        handleSelectChange("teacherCode", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب استاد" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem
                            key={teacher._id}
                            value={ensureString(
                              teacher.username ||
                                teacher.teacherCode ||
                                (teacher.data && teacher.data.teacherCode)
                            )}
                          >
                            {teacher.firstName}{" "}
                            {teacher.lastName ||
                              teacher.teacherName ||
                              (teacher.data && teacher.data.teacherName)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="classCode">کلاس</Label>
                  <Select
                    value={formData.classCode || ""}
                    onValueChange={(value) =>
                      handleSelectChange("classCode", value)
                    }
                    disabled={!formData.teacherCode && userType === "school"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کلاس" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((cls) => {
                        const majorValue = getDataProperty(cls, "major", "");
                        const gradeValue = getDataProperty(cls, "Grade", "");
                        const majorInfo = majorValue ? ` - ${majorValue}` : "";
                        const gradeInfo = gradeValue
                          ? ` (پایه ${gradeValue})`
                          : "";

                        return (
                          <SelectItem
                            key={cls._id}
                            value={ensureString(
                              cls.classCode || (cls.data && cls.data.classCode)
                            )}
                          >
                            {cls.className || (cls.data && cls.data.className)}
                            <span className="text-xs text-gray-500 mr-1">
                              {majorInfo}
                              {gradeInfo}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {availableClasses.length === 0 && formData.teacherCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      این استاد در هیچ کلاسی تدریس نمی‌کند.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courseCode">درس</Label>
                  <Select
                    value={formData.courseCode || ""}
                    onValueChange={(value) =>
                      handleSelectChange("courseCode", value)
                    }
                    disabled={!formData.classCode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب درس" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course) => {
                        const gradeValue = getDataProperty(course, "Grade", "");
                        const gradeInfo = gradeValue
                          ? ` (پایه ${gradeValue})`
                          : "";

                        return (
                          <SelectItem
                            key={course._id}
                            value={ensureString(
                              course.courseCode ||
                                (course.data && course.data.courseCode)
                            )}
                          >
                            {course.courseName ||
                              (course.data && course.data.courseName)}
                            <span className="text-xs text-gray-500 mr-1">
                              {gradeInfo}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {availableCourses.length === 0 && formData.classCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      هیچ درسی متناسب با رشته و پایه این کلاس برای این استاد
                      یافت نشد.
                    </p>
                  )}
                  {formData.classCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      درس‌ها براساس رشته و پایه کلاس انتخابی فیلتر شده‌اند.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">توضیحات</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="توضیحات رویداد را وارد کنید"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEventForm}
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={
                      !formData.title ||
                      !formData.persianDate ||
                      !formData.timeSlot ||
                      !formData.teacherCode ||
                      !formData.classCode ||
                      !formData.courseCode
                    }
                  >
                    {editMode ? "ویرایش رویداد" : "افزودن رویداد"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
