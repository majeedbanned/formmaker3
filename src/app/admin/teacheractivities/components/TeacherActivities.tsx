"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TeacherSummary from "./TeacherSummary";
import TeacherRanking from "./TeacherRanking";
import TeacherDetailedActivity from "./TeacherDetailedActivity";
import ActivityChart from "./ActivityChart";
import "../print.css";
import { useAuth } from "@/hooks/useAuth";
import ComparativeAnalysis from "./ComparativeAnalysis";
import ActivityTrends from "./ActivityTrends";
import PageHeader from "@/components/PageHeader";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

// Types
export type TeacherActivity = {
  teacherCode: string;
  teacherName: string;
  gradeCounts: number;
  presenceRecords: number;
  assessments: number;
  comments: number;
  events: number;
  totalActivities: number;
  lastActivity?: Date;
  activityByDay?: Record<string, number>;
  activityByType?: Record<string, number>;
  classCoverage?: number;
  studentCoverage?: number;
};

export type TeacherDetailedStats = {
  teacherCode: string;
  teacherName: string;
  classes: {
    classCode: string;
    className: string;
    studentCount: number;
    courseCode: string;
    courseName: string;
    presenceRecords: number;
    grades: number;
    assessments: number;
    comments: number;
    events: number;
    lastActivity?: Date;
    classCoverage: number;
  }[];
  activity: {
    date: string;
    presenceRecords: number;
    grades: number;
    assessments: number;
    comments: number;
    events: number;
    total: number;
  }[];
};

export type ActivityChartData = {
  date: string;
  total: number;
  grades: number;
  presence: number;
  assessments: number;
  comments: number;
  events: number;
  teacherCode?: string;
};

const TeacherActivities: React.FC = () => {
  // State for date range selection
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);


  const [startDate, setStartDate] = useState<Value>(oneMonthAgo);
  const [endDate, setEndDate] = useState<Value>(today);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [activeTab, setActiveTab] = useState("summary");

  // States for data
  const [loading, setLoading] = useState(false);
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [teachers, setTeachers] = useState<Record<string, string>>({});
  const [teacherActivities, setTeacherActivities] = useState<TeacherActivity[]>(
    []
  );
  const [teacherDetailedStats, setTeacherDetailedStats] =
    useState<TeacherDetailedStats | null>(null);
  const [activityChartData, setActivityChartData] = useState<
    ActivityChartData[]
  >([]);
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

  // Get auth data
  const { user, isLoading: authLoading } = useAuth();

  // Use auth data to set school code
  useEffect(() => {
    if (user && user.schoolCode && !authLoading) {
      setSchoolCode(user.schoolCode);

      // If user is a teacher, set them as the selected teacher
      if (user.userType === "teacher" && user.username) {
        setSelectedTeacher(user.username);
      }
    }
  }, [user, authLoading]);

  // Check if teacher has adminAccess
  useEffect(() => {
    const checkTeacherAdminAccess = async () => {
      if (authLoading) return;
      if (!user || user.userType !== "teacher" || !user.username) {
        setIsAdminTeacher(false);
        return;
      }

      try {
        const response = await fetch(`/api/teachers?schoolCode=${schoolCode}`);
        if (!response.ok) {
          console.error("Failed to fetch teacher data");
          setIsAdminTeacher(false);
          return;
        }

        const teachers = await response.json();
        const currentTeacher = teachers.find(
          (t: any) => t.data?.teacherCode === user.username
        );

        if (currentTeacher?.data?.adminAccess === true) {
          setIsAdminTeacher(true);
          // console.log("Teacher has admin access");
        } else {
          setIsAdminTeacher(false);
        }
      } catch (err) {
        console.error("Error checking teacher admin access:", err);
        setIsAdminTeacher(false);
      }
    };

    checkTeacherAdminAccess();
  }, [user, authLoading, schoolCode]);

  // Fetch teachers list
  useEffect(() => {
    if (!schoolCode) return;

    const fetchTeachers = async () => {
      try {
        const response = await fetch(`/api/formbuilder/classes-teachers`, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (response.ok) {
          const { teachers } = await response.json();
          const teacherMap: Record<string, string> = {};

          teachers.forEach(
            (teacher: {
              data: { teacherCode: string; teacherName?: string };
            }) => {
              teacherMap[teacher.data.teacherCode] =
                teacher.data.teacherName || teacher.data.teacherCode;
            }
          );

          setTeachers(teacherMap);
        }
      } catch (error) {
        console.error("Error fetching teachers:", error);
        toast.error("Failed to fetch teachers list");
      }
    };

    fetchTeachers();
  }, [schoolCode]);

  // Fetch teacher activities data when date range or school code changes
  useEffect(() => {
    if (!schoolCode || !startDate || !endDate) return;

    const fetchTeacherActivities = async () => {
      setLoading(true);
      try {
        // Format dates to YYYY-MM-DD
        const start =
          startDate instanceof Date
            ? startDate.toISOString().split("T")[0]
            : new Date(startDate as string).toISOString().split("T")[0];

        const end =
          endDate instanceof Date
            ? endDate.toISOString().split("T")[0]
            : new Date(endDate as string).toISOString().split("T")[0];

        const response = await fetch(
          `/api/teachers/activities?schoolCode=${schoolCode}&startDate=${start}&endDate=${end}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch teacher activities");
        }

        const data = await response.json();
        setTeacherActivities(data);

        // Generate activity chart data from all teachers' activity
        if (data.length > 0) {
          const aggregatedData: Record<string, ActivityChartData> = {};

          data.forEach((teacher: TeacherActivity) => {
            if (teacher.activityByDay) {
              Object.entries(teacher.activityByDay).forEach(([date, count]) => {
                if (!aggregatedData[date]) {
                  aggregatedData[date] = {
                    date,
                    total: 0,
                    grades: 0,
                    presence: 0,
                    assessments: 0,
                    comments: 0,
                    events: 0,
                    teacherCode: teacher.teacherCode,
                  };
                }
                aggregatedData[date].total += count;
              });
            }

            if (teacher.activityByType) {
              Object.entries(teacher.activityByType).forEach(
                ([type, count]) => {
                  Object.keys(teacher.activityByDay || {}).forEach((date) => {
                    if (!aggregatedData[date]) {
                      aggregatedData[date] = {
                        date,
                        total: 0,
                        grades: 0,
                        presence: 0,
                        assessments: 0,
                        comments: 0,
                        events: 0,
                        teacherCode: teacher.teacherCode,
                      };
                    }

                    // Distribute by type proportionally
                    switch (type) {
                      case "grades":
                        aggregatedData[date].grades +=
                          count /
                          Object.keys(teacher.activityByDay || {}).length;
                        break;
                      case "presence":
                        aggregatedData[date].presence +=
                          count /
                          Object.keys(teacher.activityByDay || {}).length;
                        break;
                      case "assessments":
                        aggregatedData[date].assessments +=
                          count /
                          Object.keys(teacher.activityByDay || {}).length;
                        break;
                      case "comments":
                        aggregatedData[date].comments +=
                          count /
                          Object.keys(teacher.activityByDay || {}).length;
                        break;
                      case "events":
                        aggregatedData[date].events +=
                          count /
                          Object.keys(teacher.activityByDay || {}).length;
                        break;
                    }
                  });
                }
              );
            }
          });

          // Convert to array and sort by date
          const chartData = Object.values(aggregatedData).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          setActivityChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching teacher activities:", error);
        toast.error("Failed to fetch teacher activities data");
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherActivities();
  }, [schoolCode, startDate, endDate]);

  // Fetch detailed stats for selected teacher
  useEffect(() => {
    if (!schoolCode || !selectedTeacher || !startDate || !endDate) return;

    const fetchTeacherDetailedStats = async () => {
      setLoading(true);
      try {
        // Format dates to YYYY-MM-DD
        const start =
          startDate instanceof Date
            ? startDate.toISOString().split("T")[0]
            : new Date(startDate as string).toISOString().split("T")[0];

        const end =
          endDate instanceof Date
            ? endDate.toISOString().split("T")[0]
            : new Date(endDate as string).toISOString().split("T")[0];

        const response = await fetch(
          `/api/teachers/activities/${selectedTeacher}?schoolCode=${schoolCode}&startDate=${start}&endDate=${end}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch teacher detailed stats");
        }

        const data = await response.json();
        setTeacherDetailedStats(data);

        // Create chart data for selected teacher
        if (data.activity && data.activity.length > 0) {
          const chartData: ActivityChartData[] = data.activity.map(
            (item: {
              date: string;
              total: number;
              grades: number;
              presenceRecords: number;
              assessments: number;
              comments: number;
              events: number;
            }) => ({
              date: item.date,
              total: item.total,
              grades: item.grades,
              presence: item.presenceRecords,
              assessments: item.assessments,
              comments: item.comments,
              events: item.events,
              teacherCode: data.teacherCode,
            })
          );

          setActivityChartData(chartData);
        }
      } catch (error) {
        console.error("Error fetching teacher detailed stats:", error);
        toast.error("Failed to fetch detailed teacher statistics");
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "details") {
      fetchTeacherDetailedStats();
    }
  }, [schoolCode, selectedTeacher, startDate, endDate, activeTab]);

  // Handle date change
  const handleDateChange = (type: "start" | "end", value: Value) => {
    if (type === "start") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };


  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white"
      dir="rtl"
    >
      <div className="container px-4 py-0 mx-auto ">
        {/* <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
            گزارش و رتبه‌بندی فعالیت معلمان
          </h1>
          <p className="text-gray-500 max-w-3xl">
            این بخش امکان مشاهده و ارزیابی فعالیت‌های آموزشی کادر معلمان را
            فراهم می‌کند. می‌توانید گزارش‌های مختلف را در قالب نمودار، خلاصه و
            جزئیات مشاهده کنید.
          </p>
        </header> */}
        <PageHeader
          title="گزارش و رتبه‌بندی فعالیت معلمان"
          subtitle="  این بخش امکان مشاهده و ارزیابی فعالیت‌های آموزشی کادر معلمان را
            فراهم می‌کند. می‌توانید گزارش‌های مختلف را در قالب نمودار، خلاصه و
            جزئیات مشاهده کنید."
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {/* Filters section */}
        <div className="mb-8 bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              فیلترها
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="startDate"
                  className="text-sm font-medium text-gray-700"
                >
                  از تاریخ:
                </Label>
                <DatePicker
                  id="startDate"
                  calendar={persian}
                  locale={persian_fa}
                  value={startDate}
                  onChange={(value) => handleDateChange("start", value)}
                  format="YYYY/MM/DD"
                  className="w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
                  calendarPosition="bottom-right"
                  placeholder="تاریخ شروع"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="endDate"
                  className="text-sm font-medium text-gray-700"
                >
                  تا تاریخ:
                </Label>
                <DatePicker
                  id="endDate"
                  calendar={persian}
                  locale={persian_fa}
                  value={endDate}
                  onChange={(value) => handleDateChange("end", value)}
                  format="YYYY/MM/DD"
                  className="w-full rounded-lg border border-gray-200 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm"
                  calendarPosition="bottom-right"
                  placeholder="تاریخ پایان"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="teacherSelect"
                  className="text-sm font-medium text-gray-700"
                >
                  انتخاب معلم:
                </Label>
                {user?.userType === "teacher" && !isAdminTeacher ? (
                  <div className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 text-gray-700">
                    {teachers[user.username] || user.username || "معلم جاری"}
                  </div>
                ) : (
                  <Select
                    value={selectedTeacher}
                    onValueChange={setSelectedTeacher}
                  >
                    <SelectTrigger
                      id="teacherSelect"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 shadow-sm transition-all"
                    >
                      <SelectValue placeholder="همه معلمان" />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value=" ">همه معلمان</SelectItem>
                      {Object.entries(teachers).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <Tabs
            defaultValue="summary"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="border-b border-gray-200">
              <TabsList className="flex justify-start px-4 py-0 bg-transparent">
                <TabsTrigger
                  value="summary"
                  className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  خلاصه فعالیت‌ها
                </TabsTrigger>
                <TabsTrigger
                  value="ranking"
                  className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  رتبه‌بندی معلمان
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  جزئیات فعالیت
                </TabsTrigger>
                <TabsTrigger
                  value="chart"
                  className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                  نمودار فعالیت
                </TabsTrigger>
                {(user?.userType !== "teacher" || isAdminTeacher) && (
                  <TabsTrigger
                    value="comparative"
                    className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    تحلیل مقایسه‌ای
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="trends"
                  className="py-4 px-6 font-medium transition-all data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  روند فعالیت‌ها
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent
                value="summary"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <TeacherSummary
                  activities={
                    user?.userType === "teacher" && !isAdminTeacher
                      ? teacherActivities.filter(
                          (t) => t.teacherCode === user.username
                        )
                      : teacherActivities
                  }
                  teachers={teachers}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent
                value="ranking"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <TeacherRanking
                  activities={teacherActivities}
                  teachers={teachers}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent
                value="details"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <TeacherDetailedActivity
                  teacherStats={teacherDetailedStats}
                  teachers={teachers}
                  loading={loading}
                  selectedTeacher={selectedTeacher}
                />
              </TabsContent>

              <TabsContent
                value="chart"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <ActivityChart
                  data={
                    user?.userType === "teacher" && !isAdminTeacher && selectedTeacher
                      ? activityChartData.filter(
                          (d) => d.teacherCode === user.username
                        )
                      : activityChartData
                  }
                  loading={loading}
                />
              </TabsContent>

              <TabsContent
                value="comparative"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <ComparativeAnalysis
                  activities={teacherActivities}
                  teachers={teachers}
                  loading={loading}
                />
              </TabsContent>

              <TabsContent
                value="trends"
                className="w-full mt-0 focus-visible:outline-none focus-visible:ring-0"
              >
                <ActivityTrends
                  activities={
                    user?.userType === "teacher" && !isAdminTeacher
                      ? teacherActivities.filter(
                          (t) => t.teacherCode === user.username
                        )
                      : teacherActivities
                  }
                  chartData={
                    user?.userType === "teacher" && !isAdminTeacher && selectedTeacher
                      ? activityChartData.filter(
                          (d) => d.teacherCode === user.username
                        )
                      : activityChartData
                  }
                  loading={loading}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Print button */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-5 py-2 shadow-sm transition-all hover:shadow"
          >
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
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            چاپ گزارش
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeacherActivities;
