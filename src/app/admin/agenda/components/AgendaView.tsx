"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
}

interface Teacher {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface Class {
  _id: string;
  classCode: string;
  className: string;
}

interface Course {
  _id: string;
  courseCode: string;
  courseName: string;
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

  // Get current Persian date for initialization
  const getTodayPersianDate = () => {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    return persianDate.replace(/[٠-٩]/g, (d) =>
      String.fromCharCode(d.charCodeAt(0) - 1728)
    );
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
      const coursesResponse = await fetch("/api/courses");
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      }

      // Fetch classes
      const classesResponse = await fetch("/api/classes");
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData);
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
              <Button className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
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
                      "bg-white p-1.5 min-h-[110px] transition-colors",
                      !dayData.isCurrentMonth && "bg-gray-50 text-gray-400",
                      dayData.isToday && "bg-blue-50"
                    )}
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
                    <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                      {dayData.events.slice(0, 3).map((event) => (
                        <div
                          key={event._id}
                          onClick={() => handleEventClick(event)}
                          className="text-xs p-1 rounded bg-blue-50 border border-blue-100 truncate cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                          <span className="font-medium">{event.title}</span>
                        </div>
                      ))}
                      {dayData.events.length > 3 && (
                        <div className="text-xs text-center text-blue-600">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
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

              {(userType === "school" ||
                (userType === "teacher" &&
                  selectedEvent.teacherCode === teacherCode)) && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <PencilIcon className="h-4 w-4 text-blue-600" />
                    ویرایش
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-red-600 hover:bg-red-50"
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
    </div>
  );
}
