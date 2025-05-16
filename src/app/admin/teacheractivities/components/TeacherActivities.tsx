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

  // Get auth data
  const { user, isLoading: authLoading } = useAuth();

  // Use auth data to set school code
  useEffect(() => {
    if (user && user.schoolCode && !authLoading) {
      setSchoolCode(user.schoolCode);
    }
  }, [user, authLoading]);

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

  return (
    <div className="container p-4 mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">
        گزارش و رتبه‌بندی فعالیت معلمان
      </h1>

      {/* Filters section */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate">از تاریخ:</Label>
            <DatePicker
              id="startDate"
              calendar={persian}
              locale={persian_fa}
              value={startDate}
              onChange={(value) => handleDateChange("start", value)}
              format="YYYY/MM/DD"
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              calendarPosition="bottom-right"
              placeholder="تاریخ شروع"
            />
          </div>
          <div>
            <Label htmlFor="endDate">تا تاریخ:</Label>
            <DatePicker
              id="endDate"
              calendar={persian}
              locale={persian_fa}
              value={endDate}
              onChange={(value) => handleDateChange("end", value)}
              format="YYYY/MM/DD"
              className="w-full rounded-lg border border-gray-200 bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              calendarPosition="bottom-right"
              placeholder="تاریخ پایان"
            />
          </div>
          <div>
            <Label htmlFor="teacherSelect">انتخاب معلم:</Label>
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger id="teacherSelect">
                <SelectValue placeholder="همه معلمان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">همه معلمان</SelectItem>
                {Object.entries(teachers).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <Tabs
        defaultValue="summary"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="summary">خلاصه فعالیت‌ها</TabsTrigger>
          <TabsTrigger value="ranking">رتبه‌بندی معلمان</TabsTrigger>
          <TabsTrigger value="details">جزئیات فعالیت</TabsTrigger>
          <TabsTrigger value="chart">نمودار فعالیت</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="w-full">
          <TeacherSummary
            activities={teacherActivities}
            teachers={teachers}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="ranking" className="w-full">
          <TeacherRanking
            activities={teacherActivities}
            teachers={teachers}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="details" className="w-full">
          <TeacherDetailedActivity
            teacherStats={teacherDetailedStats}
            teachers={teachers}
            loading={loading}
            selectedTeacher={selectedTeacher}
          />
        </TabsContent>

        <TabsContent value="chart" className="w-full">
          <ActivityChart data={activityChartData} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* Print button */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          چاپ گزارش
        </Button>
      </div>
    </div>
  );
};

export default TeacherActivities;
