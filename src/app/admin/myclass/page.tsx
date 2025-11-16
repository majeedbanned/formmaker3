"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

interface WeeklySchedule {
  platform: string;
  weekDay: string;
  startTime: string;
  endTime: string;
}

interface RecipientItem {
  label: string;
  value: string;
}

interface UserClassCodeOrGroup {
  label: string;
  value: string;
}

interface OnlineClass {
  _id: string;
  data: {
    onlineClassCode: string;
    onlineClassName: string;
    schoolCode: string;
    weeklySchedule: WeeklySchedule[];
    recipients: {
      students: RecipientItem[];
      groups: RecipientItem[];
      classCode: RecipientItem[];
      teachers: RecipientItem[];
    };
  };
}

// Order weekdays right-to-left for RTL layout
const weekDays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه شنبه",
  "چهارشنبه",
  "پنج شنبه",
  "جمعه",
];

// Mapping English weekday names to Persian for comparing with DB values
const weekDayMap: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج شنبه",
  Friday: "جمعه",
};

// Platform color mapping for visual differentiation
const platformColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  bigbluebutton: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-700",
  },
  adobeConnect: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-700",
  },
  Skyroom: {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-700",
  },
};

export default function MyClassPage() {
  const { user, isLoading } = useAuth();
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Fetch online classes data with role-based filtering
  useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      try {
        // Build filter query based on user role
        let filterQuery: Record<string, unknown> = {
          "data.schoolCode": user.schoolCode,
        };

        if (user.userType === "student") {
          // Students see classes where:
          // 1. They are directly listed in recipients.students, OR
          // 2. Their classCode is in recipients.classCode, OR
          // 3. Their groups are in recipients.groups

          const studentFilters = [];

          // Direct student assignment
          studentFilters.push({
            "data.recipients.students.value": user.username,
          });

          // Class-based assignment
          const userClassCode = (user as { classCode?: UserClassCodeOrGroup[] })
            .classCode;
          if (userClassCode && userClassCode.length > 0) {
            const classCodeValues = userClassCode.map(
              (c: UserClassCodeOrGroup) => c.value
            );
            studentFilters.push({
              "data.recipients.classCode.value": { $in: classCodeValues },
            });
          }

          // Group-based assignment
          const userGroups = (user as { groups?: UserClassCodeOrGroup[] })
            .groups;
          if (userGroups && userGroups.length > 0) {
            const groupValues = userGroups.map(
              (g: UserClassCodeOrGroup) => g.value
            );
            studentFilters.push({
              "data.recipients.groups.value": { $in: groupValues },
            });
          }

          // Use $or to combine all possible ways a student can access a class
          filterQuery["$or"] = studentFilters;
        } else if (user.userType === "teacher") {
          // Teachers only see classes where they are in the recipients.teachers array
          filterQuery = {
            ...filterQuery,
            "data.recipients.teachers.value": user.username,
          };
        }
        // For school admins (userType === "school"), show all classes in the school

        // console.log(
        //   "Filter query for",
        //   user.userType,
        //   ":",
        //   JSON.stringify(filterQuery, null, 2)
        // );

        const response = await fetch("/api/data/onlineclasses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            filter: filterQuery,
            sort: { "data.onlineClassName": 1 },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // console.log("data", data);
          setClasses(data);
        } else {
          console.error("Failed to fetch classes:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    fetchClasses();

    // Set current day and time
    const updateCurrentTime = () => {
      const now = new Date();

      // Get current day in Persian
      const englishDay = now.toLocaleDateString("en-US", { weekday: "long" });
      setCurrentDay(weekDayMap[englishDay]);

      // Get current time in HH:MM format
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime();
    const timeInterval = setInterval(updateCurrentTime, 60000); // Update every minute

    return () => clearInterval(timeInterval);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Check if a class is active based on current day and time
  const isClassActive = (schedule: WeeklySchedule) => {
    if (schedule.weekDay !== currentDay) return false;

    // Convert times to comparable format (minutes since midnight)
    const convertTimeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = convertTimeToMinutes(schedule.startTime);
    const endMinutes = convertTimeToMinutes(schedule.endTime);
    const currentMinutes = convertTimeToMinutes(currentTime);

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  };

  // Generate class entry URL based on platform
  const generateClassUrl = (className: string, platform: string) => {
    // This is a placeholder - actual implementation would depend on your platform integration
    switch (platform) {
      case "bigbluebutton":
        return `/meeting/bbb/${className}`;
      case "adobeConnect":
        return `/meeting/adobe/${className}`;
      case "Skyroom":
        return `/meeting/skyroom/${className}`;
      default:
        return "#";
    }
  };

  // Get classes for a specific day
  const getClassesForDay = (day: string) => {
    return classes
      .filter((cls) =>
        cls.data.weeklySchedule.some((schedule) => schedule.weekDay === day)
      )
      .flatMap((cls) =>
        cls.data.weeklySchedule
          .filter((schedule) => schedule.weekDay === day)
          .map((schedule) => ({
            _id: cls._id,
            className: cls.data.onlineClassName,
            classCode: cls.data.onlineClassCode,
            schedule,
          }))
      );
  };

  // Get title based on user role
  const getPageTitle = () => {
    switch (user?.userType) {
      case "student":
        return "برنامه کلاس‌های من";
      case "teacher":
        return "برنامه کلاس‌های تدریس";
      case "school":
        return "برنامه تمام کلاس‌های آنلاین";
      default:
        return "برنامه کلاس‌های آنلاین";
    }
  };

  return (
    <main dir="rtl" className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title={getPageTitle()}
          subtitle={getPageTitle()}
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          {/* <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1> */}

          <div className="flex items-center gap-2 text-gray-600 text-lg bg-white px-4 py-2 rounded-lg shadow-sm">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{currentDay}</span>
            <span className="mx-2">|</span>
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{currentTime}</span>
          </div>
        </div>

        {/* Add info message based on user role */}
        {user?.userType === "student" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-6">
            <p className="text-sm text-green-700">
              <span className="font-bold ml-1">توجه:</span>
              در اینجا کلاس‌هایی که به صورت مستقیم برای شما، کلاس شما، یا
              گروه‌های شما تعریف شده‌اند نمایش داده می‌شود.
            </p>
          </div>
        )}

        {user?.userType === "teacher" && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
            <p className="text-sm text-blue-700">
              <span className="font-bold ml-1">توجه:</span>
              در اینجا فقط کلاس‌هایی که شما به عنوان مدرس در آنها حضور دارید
              نمایش داده می‌شود.
            </p>
          </div>
        )}

        {classes.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              کلاسی یافت نشد
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {user?.userType === "student"
                ? "هنوز برای شما کلاسی تعریف نشده است."
                : user?.userType === "teacher"
                ? "شما در هیچ کلاس آنلاینی به عنوان مدرس حضور ندارید."
                : "هیچ کلاس آنلاینی در این مدرسه تعریف نشده است."}
            </p>
          </div>
        )}

        {classes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    روز هفته
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    کلاس‌ها
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {weekDays.map((day) => {
                  const dayClasses = getClassesForDay(day);
                  const isCurrentDay = day === currentDay;

                  return (
                    <tr
                      key={day}
                      className={`${
                        isCurrentDay
                          ? "bg-gradient-to-r from-blue-50 to-transparent"
                          : ""
                      } transition-colors hover:bg-gray-50`}
                    >
                      <td
                        className={`px-6 py-5 whitespace-nowrap ${
                          isCurrentDay
                            ? "font-bold text-blue-600"
                            : "text-gray-900"
                        }`}
                      >
                        <div className="flex items-center">
                          {isCurrentDay && (
                            <span className="mr-2 flex h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                          )}
                          <span className="text-lg">{day}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {dayClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-4">
                            {dayClasses.map((classInfo, idx) => {
                              const isActive = isClassActive(
                                classInfo.schedule
                              );
                              const platform = classInfo.schedule.platform;
                              const colorScheme = platformColors[platform] || {
                                bg: "bg-gray-50",
                                border: "border-gray-300",
                                text: "text-gray-700",
                              };

                              return (
                                <div
                                  key={`${classInfo._id}-${idx}`}
                                  className={`
                                    relative p-4 rounded-lg border ${
                                      colorScheme.border
                                    }
                                    ${
                                      isActive
                                        ? "ring-2 ring-green-400 shadow-md"
                                        : "shadow-sm"
                                    }
                                    ${
                                      colorScheme.bg
                                    } w-80 flex-shrink-0 transition-all
                                    hover:shadow-md
                                  `}
                                >
                                  {isActive && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                    </span>
                                  )}

                                  <div className="flex flex-col h-full">
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-gray-800 text-lg">
                                          {classInfo.className}
                                        </h3>
                                        <span
                                          className={`text-xs font-medium px-2 py-1 rounded-full ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}
                                        >
                                          {platform}
                                        </span>
                                      </div>

                                      <div className="flex items-center text-sm text-gray-600 mb-1">
                                        <ClockIcon className="h-4 w-4 ml-1 text-gray-400" />
                                        <span>
                                          از {classInfo.schedule.startTime} تا{" "}
                                          {classInfo.schedule.endTime}
                                        </span>
                                      </div>
                                    </div>

                                    {isActive && (
                                      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                                        <Link
                                          href={generateClassUrl(
                                            classInfo.className,
                                            platform
                                          )}
                                          className="inline-flex w-full justify-center items-center px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-md hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                                        >
                                          <VideoCameraIcon className="h-5 w-5 ml-2" />
                                          ورود به کلاس
                                        </Link>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-2">
                            کلاسی در این روز وجود ندارد
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
