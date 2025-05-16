import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherActivity, ActivityChartData } from "./TeacherActivities";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

interface ActivityTrendsProps {
  activities: TeacherActivity[];
  chartData: ActivityChartData[];
  loading: boolean;
}

interface WeeklyData {
  week: string;
  total: number;
  grades: number;
  presence: number;
  assessments: number;
  comments: number;
  events: number;
  displayName: string;
  growthRate?: number;
}

interface DayOfWeekData {
  day: string;
  total: number;
  count: number;
  average?: number;
}

interface HeatmapDay {
  date: string;
  count: number;
  intensity: number;
  empty?: boolean;
}

const ActivityTrends: React.FC<ActivityTrendsProps> = ({
  activities,
  chartData,
  loading,
}) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [dayOfWeekData, setDayOfWeekData] = useState<DayOfWeekData[]>([]);
  const [growthData, setGrowthData] = useState<WeeklyData[]>([]);

  useEffect(() => {
    if (chartData.length === 0) return;

    // Process data to get weekly stats
    const weeklyStats: Record<string, any> = {};
    const dayOfWeekStats: Record<string, any> = {
      "0": { day: "یکشنبه", total: 0, count: 0 },
      "1": { day: "دوشنبه", total: 0, count: 0 },
      "2": { day: "سه‌شنبه", total: 0, count: 0 },
      "3": { day: "چهارشنبه", total: 0, count: 0 },
      "4": { day: "پنج‌شنبه", total: 0, count: 0 },
      "5": { day: "جمعه", total: 0, count: 0 },
      "6": { day: "شنبه", total: 0, count: 0 },
    };

    // Process chart data for trends
    chartData.forEach((item) => {
      const date = new Date(item.date);
      const weekNum = getWeekNumber(date);
      const weekKey = `${date.getFullYear()}-W${weekNum}`;
      const dayOfWeek = date.getDay().toString();

      // Weekly stats
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          week: weekKey,
          total: 0,
          grades: 0,
          presence: 0,
          assessments: 0,
          comments: 0,
          events: 0,
          displayName: `هفته ${weekNum}`,
        };
      }

      weeklyStats[weekKey].total += item.total;
      weeklyStats[weekKey].grades += item.grades;
      weeklyStats[weekKey].presence += item.presence;
      weeklyStats[weekKey].assessments += item.assessments;
      weeklyStats[weekKey].comments += item.comments;
      weeklyStats[weekKey].events += item.events;

      // Day of week stats
      dayOfWeekStats[dayOfWeek].total += item.total;
      dayOfWeekStats[dayOfWeek].count += 1;
    });

    // Convert weekly stats to array and sort
    const sortedWeeklyData = Object.values(weeklyStats).sort((a, b) =>
      a.week.localeCompare(b.week)
    );

    // Calculate growth trends
    const growthTrends = sortedWeeklyData.map((week, index, arr) => {
      if (index === 0) {
        return {
          ...week,
          growthRate: 0,
        };
      }

      const prevWeek = arr[index - 1];
      const growthRate =
        prevWeek.total > 0
          ? ((week.total - prevWeek.total) / prevWeek.total) * 100
          : 0;

      return {
        ...week,
        growthRate: Number(growthRate.toFixed(1)),
      };
    });

    // Convert day of week stats to array
    const dayOfWeekArray = Object.values(dayOfWeekStats).map((day: any) => ({
      ...day,
      average: day.count > 0 ? Math.round(day.total / day.count) : 0,
    }));

    setWeeklyData(sortedWeeklyData);
    setDayOfWeekData(dayOfWeekArray);
    setGrowthData(growthTrends);
  }, [chartData]);

  // Helper to get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  // Generate activity heatmap data
  const getActivityHeatmap = () => {
    if (!chartData.length) return [];

    const activityByDay: Record<string, number> = {};

    // Get all days in date range
    const dates = chartData.map((item) => new Date(item.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Fill in all dates in range
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      activityByDay[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add actual activities
    chartData.forEach((item) => {
      activityByDay[item.date] = item.total;
    });

    return Object.entries(activityByDay).map(([date, count]) => ({
      date,
      count,
      intensity: getIntensityLevel(count),
    }));
  };

  // Helper to determine activity intensity
  const getIntensityLevel = (count: number) => {
    if (count === 0) return 0;
    if (count < 10) return 1;
    if (count < 25) return 2;
    if (count < 50) return 3;
    if (count < 100) return 4;
    return 5;
  };

  const heatmapData = getActivityHeatmap();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" dir="rtl">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Weekly Trend Analysis */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-100">
          <CardTitle className="flex items-center text-blue-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            روند فعالیت‌ها در طول زمان
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {weeklyData.length > 0 ? (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="مجموع فعالیت‌ها"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                  />
                  <Area
                    type="monotone"
                    dataKey="grades"
                    name="نمرات"
                    stackId="2"
                    stroke="#10b981"
                    fill="#d1fae5"
                  />
                  <Area
                    type="monotone"
                    dataKey="presence"
                    name="حضور و غیاب"
                    stackId="2"
                    stroke="#f59e0b"
                    fill="#fef3c7"
                  />
                  <Area
                    type="monotone"
                    dataKey="assessments"
                    name="ارزیابی‌ها"
                    stackId="2"
                    stroke="#8b5cf6"
                    fill="#ede9fe"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
              داده‌ای برای نمایش روند هفتگی وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth Rate Analysis */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-100">
          <CardTitle className="flex items-center text-green-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-green-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
            نرخ رشد فعالیت‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {growthData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={growthData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayName" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "نرخ رشد"]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="growthRate"
                    name="درصد رشد"
                    stroke="#10b981"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
              داده‌ای برای نمایش نرخ رشد وجود ندارد
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="bg-green-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-green-800 mb-1">
                  بیشترین رشد هفتگی
                </h3>
                {growthData.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-green-700">
                      {Math.max(
                        ...growthData.map((item) => item.growthRate)
                      ).toFixed(1)}
                      %
                    </p>
                    <Badge className="bg-green-100 text-green-800">
                      {
                        growthData.reduce((max, item) =>
                          item.growthRate > max.growthRate ? item : max
                        ).displayName
                      }
                    </Badge>
                  </div>
                ) : (
                  <p className="text-gray-500">داده‌ای موجود نیست</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-blue-800 mb-1">
                  میانگین نرخ رشد
                </h3>
                {growthData.length > 0 ? (
                  <p className="text-2xl font-bold text-blue-700">
                    {(
                      growthData.reduce(
                        (sum, item) => sum + item.growthRate,
                        0
                      ) / growthData.length
                    ).toFixed(1)}
                    %
                  </p>
                ) : (
                  <p className="text-gray-500">داده‌ای موجود نیست</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-amber-50">
              <CardContent className="p-4">
                <h3 className="font-medium text-amber-800 mb-1">
                  پرفعالیت‌ترین هفته
                </h3>
                {weeklyData.length > 0 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-amber-700">
                      {Math.max(
                        ...weeklyData.map((item) => item.total)
                      ).toLocaleString()}
                    </p>
                    <Badge className="bg-amber-100 text-amber-800">
                      {
                        weeklyData.reduce((max, item) =>
                          item.total > max.total ? item : max
                        ).displayName
                      }
                    </Badge>
                  </div>
                ) : (
                  <p className="text-gray-500">داده‌ای موجود نیست</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-100">
          <CardTitle className="flex items-center text-purple-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-purple-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            تحلیل روزهای هفته
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {dayOfWeekData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dayOfWeekData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="average"
                    name="میانگین فعالیت"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
              داده‌ای برای تحلیل روزهای هفته وجود ندارد
            </div>
          )}

          {dayOfWeekData.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-purple-800 mb-1">
                    پرفعالیت‌ترین روز هفته
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-purple-700">
                      {
                        dayOfWeekData.reduce((max, day) =>
                          day.average > max.average ? day : max
                        ).day
                      }
                    </p>
                    <Badge className="bg-purple-100 text-purple-800">
                      {dayOfWeekData
                        .reduce((max, day) =>
                          day.average > max.average ? day : max
                        )
                        .average.toLocaleString()}{" "}
                      فعالیت
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-purple-800 mb-1">
                    کم‌فعالیت‌ترین روز هفته
                  </h3>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-purple-700">
                      {
                        dayOfWeekData
                          .filter((day) => day.count > 0)
                          .reduce((min, day) =>
                            day.average < min.average ? day : min
                          ).day
                      }
                    </p>
                    <Badge className="bg-purple-100 text-purple-800">
                      {dayOfWeekData
                        .filter((day) => day.count > 0)
                        .reduce((min, day) =>
                          day.average < min.average ? day : min
                        )
                        .average.toLocaleString()}{" "}
                      فعالیت
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card className="border-none shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-100">
          <CardTitle className="flex items-center text-teal-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-teal-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            نقشه حرارتی فعالیت‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {heatmapData.length > 0 ? (
            <div className="overflow-auto">
              <div className="grid grid-cols-7 gap-1 min-w-[700px]">
                {/* Day headers */}
                {[
                  "شنبه",
                  "یکشنبه",
                  "دوشنبه",
                  "سه‌شنبه",
                  "چهارشنبه",
                  "پنج‌شنبه",
                  "جمعه",
                ].map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 pb-1"
                  >
                    {day}
                  </div>
                ))}

                {/* Group and render heatmap cells by week */}
                {(() => {
                  const weeks: any[] = [];
                  let currentWeek: any[] = Array(7).fill(null);
                  let dayIndex = new Date(heatmapData[0].date).getDay();

                  // Adjust dayIndex for Iranian calendar (Saturday is first day)
                  dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

                  // Fill empty cells at beginning
                  for (let i = 0; i < dayIndex; i++) {
                    currentWeek[i] = { empty: true };
                  }

                  heatmapData.forEach((day, index) => {
                    const date = new Date(day.date);
                    dayIndex = date.getDay();

                    // Adjust dayIndex for Iranian calendar (Saturday is first day)
                    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;

                    // Start a new week if needed
                    if (index > 0 && dayIndex === 0) {
                      weeks.push([...currentWeek]);
                      currentWeek = Array(7).fill(null);
                    }

                    currentWeek[dayIndex] = day;

                    // Push last week
                    if (index === heatmapData.length - 1) {
                      // Fill empty cells at end
                      for (let i = dayIndex + 1; i < 7; i++) {
                        currentWeek[i] = { empty: true };
                      }
                      weeks.push([...currentWeek]);
                    }
                  });

                  return weeks.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      {week.map((day, dayIndex) => {
                        if (day?.empty) {
                          return (
                            <div
                              key={`empty-${weekIndex}-${dayIndex}`}
                              className="h-10 rounded-md bg-gray-100"
                            ></div>
                          );
                        } else if (day) {
                          const classes = [
                            "h-10 rounded-md flex items-center justify-center text-xs font-medium",
                            day.intensity === 0
                              ? "bg-gray-100 text-gray-500"
                              : "",
                            day.intensity === 1
                              ? "bg-teal-100 text-teal-800"
                              : "",
                            day.intensity === 2
                              ? "bg-teal-200 text-teal-800"
                              : "",
                            day.intensity === 3
                              ? "bg-teal-300 text-teal-800"
                              : "",
                            day.intensity === 4
                              ? "bg-teal-400 text-teal-800"
                              : "",
                            day.intensity === 5 ? "bg-teal-500 text-white" : "",
                          ]
                            .filter(Boolean)
                            .join(" ");

                          return (
                            <div
                              key={day.date}
                              className={classes}
                              title={`${new Date(day.date).toLocaleDateString(
                                "fa-IR"
                              )}: ${day.count} فعالیت`}
                            >
                              {day.count > 0 ? day.count : ""}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </React.Fragment>
                  ));
                })()}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl">
              داده‌ای برای نمایش نقشه حرارتی وجود ندارد
            </div>
          )}

          <div className="flex items-center justify-center mt-4 gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-xs text-gray-500">بدون فعالیت</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-teal-100 rounded"></div>
              <span className="text-xs text-gray-500">کم</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-teal-300 rounded"></div>
              <span className="text-xs text-gray-500">متوسط</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <span className="text-xs text-gray-500">زیاد</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTrends;
