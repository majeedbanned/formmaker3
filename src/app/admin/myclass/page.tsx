"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { VideoCameraIcon, CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface WeeklySchedule {
  platform: string;
  weekDay: string;
  startTime: string;
  endTime: string;
}

interface OnlineClass {
  _id: string;
  data: {
    onlineClassCode: string;
    onlineClassName: string;
    schoolCode: string;
    weeklySchedule: WeeklySchedule[];
    recipients: {
      students: any;
      groups: any;
      classCode: any;
      teachers: any;
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
const platformColors: Record<string, { bg: string, border: string, text: string }> = {
  "bigbluebutton": { 
    bg: "bg-blue-50", 
    border: "border-blue-400",
    text: "text-blue-700"
  },
  "adobeConnect": { 
    bg: "bg-red-50", 
    border: "border-red-400",
    text: "text-red-700"
  },
  "Skyroom": { 
    bg: "bg-purple-50", 
    border: "border-purple-400",
    text: "text-purple-700"
  },
};

export default function MyClassPage() {
  const { user, isLoading } = useAuth();
  const [classes, setClasses] = useState<OnlineClass[]>([]);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");

  // Fetch online classes data
  useEffect(() => {
    if (!user) return;

    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/data/onlineclasses");
        if (response.ok) {
          const data = await response.json();
          setClasses(data);
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
    return classes.filter(cls =>
      cls.data.weeklySchedule.some(schedule => schedule.weekDay === day)
    ).flatMap(cls =>
      cls.data.weeklySchedule
        .filter(schedule => schedule.weekDay === day)
        .map(schedule => ({
          _id: cls._id,
          className: cls.data.onlineClassName,
          classCode: cls.data.onlineClassCode,
          schedule
        }))
    );
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            برنامه کلاس‌های من
          </h1>
          <div className="flex items-center gap-2 text-gray-600 text-lg bg-white px-4 py-2 rounded-lg shadow-sm">
            <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{currentDay}</span>
            <span className="mx-2">|</span>
            <ClockIcon className="h-5 w-5 text-blue-500" />
            <span className="font-medium">{currentTime}</span>
          </div>
        </div>

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
                    <td className={`px-6 py-5 whitespace-nowrap ${isCurrentDay ? "font-bold text-blue-600" : "text-gray-900"}`}>
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
                            const isActive = isClassActive(classInfo.schedule);
                            const platform = classInfo.schedule.platform;
                            const colorScheme = platformColors[platform] || { 
                              bg: "bg-gray-50", 
                              border: "border-gray-300",
                              text: "text-gray-700" 
                            };
                            
                            return (
                              <div
                                key={`${classInfo._id}-${idx}`}
                                className={`
                                  relative p-4 rounded-lg border ${colorScheme.border}
                                  ${isActive 
                                    ? "ring-2 ring-green-400 shadow-md" 
                                    : "shadow-sm"
                                  }
                                  ${colorScheme.bg} w-80 flex-shrink-0 transition-all
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
                                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}`}>
                                        {platform}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-600 mb-1">
                                      <ClockIcon className="h-4 w-4 ml-1 text-gray-400" />
                                      <span>از {classInfo.schedule.startTime} تا {classInfo.schedule.endTime}</span>
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
      </div>
    </main>
  );
}