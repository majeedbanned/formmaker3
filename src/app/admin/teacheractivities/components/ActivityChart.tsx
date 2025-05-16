import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ActivityChartData } from "./TeacherActivities";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface ActivityChartProps {
  data: ActivityChartData[];
  loading: boolean;
}

const ActivityChart: React.FC<ActivityChartProps> = ({ data, loading }) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  // Calculate summary statistics
  const totalActivities = data.reduce((sum, day) => sum + day.total, 0);
  const averageActivitiesPerDay =
    data.length > 0 ? totalActivities / data.length : 0;

  const mostActiveDay =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.total > current.total ? prev : current
        )
      : null;

  const leastActiveDay =
    data.length > 0 && data.some((day) => day.total > 0)
      ? data
          .filter((day) => day.total > 0)
          .reduce((prev, current) =>
            prev.total < current.total ? prev : current
          )
      : null;

  // Prepare activity by type data
  const activityByType = [
    { name: "نمرات", value: data.reduce((sum, day) => sum + day.grades, 0) },
    {
      name: "حضور و غیاب",
      value: data.reduce((sum, day) => sum + day.presence, 0),
    },
    {
      name: "ارزیابی‌ها",
      value: data.reduce((sum, day) => sum + day.assessments, 0),
    },
    {
      name: "یادداشت‌ها",
      value: data.reduce((sum, day) => sum + day.comments, 0),
    },
    { name: "رویدادها", value: data.reduce((sum, day) => sum + day.events, 0) },
  ];

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#6366f1", "#ec4899"];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-1/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800">کل فعالیت‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">
              {totalActivities.toLocaleString()}
            </p>
            <div className="mt-2">
              <p className="text-sm text-blue-600">
                در {data.length} روز فعالیت
              </p>
              <p className="text-sm text-blue-600 mt-1">
                میانگین روزانه: {averageActivitiesPerDay.toFixed(1)} فعالیت
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800">پرفعالیت‌ترین روز</CardTitle>
          </CardHeader>
          <CardContent>
            {mostActiveDay ? (
              <>
                <p className="text-xl font-bold text-green-700">
                  {formatDate(mostActiveDay.date)}
                </p>
                <p className="text-3xl font-bold text-green-700 my-2">
                  {mostActiveDay.total.toLocaleString()} فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveDay.grades} نمره
                  </Badge>
                  <Badge className="bg-green-200 text-green-800">
                    {mostActiveDay.presence} حضور و غیاب
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800">کم‌فعالیت‌ترین روز</CardTitle>
          </CardHeader>
          <CardContent>
            {leastActiveDay ? (
              <>
                <p className="text-xl font-bold text-amber-700">
                  {formatDate(leastActiveDay.date)}
                </p>
                <p className="text-3xl font-bold text-amber-700 my-2">
                  {leastActiveDay.total.toLocaleString()} فعالیت
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className="bg-amber-200 text-amber-800">
                    {leastActiveDay.grades} نمره
                  </Badge>
                  <Badge className="bg-amber-200 text-amber-800">
                    {leastActiveDay.presence} حضور و غیاب
                  </Badge>
                </div>
              </>
            ) : (
              <p className="text-gray-500">اطلاعاتی موجود نیست</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Over Time Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>روند فعالیت‌ها در طول زمان</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                    labelFormatter={(label: string) => formatDate(label)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="کل فعالیت‌ها"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="grades"
                    name="نمرات"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="presence"
                    name="حضور و غیاب"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity by Type Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>فعالیت‌ها به تفکیک نوع</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  )}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                    labelFormatter={(label: string) => formatDate(label)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="grades"
                    name="نمرات"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                  />
                  <Area
                    type="monotone"
                    dataKey="presence"
                    name="حضور و غیاب"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                  />
                  <Area
                    type="monotone"
                    dataKey="assessments"
                    name="ارزیابی‌ها"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                  />
                  <Area
                    type="monotone"
                    dataKey="comments"
                    name="یادداشت‌ها"
                    stackId="1"
                    stroke="#6366f1"
                    fill="#6366f1"
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    name="رویدادها"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>توزیع فعالیت‌ها بر اساس نوع</CardTitle>
        </CardHeader>
        <CardContent>
          {activityByType.some((item) => item.value > 0) ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityByType}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                  <Bar dataKey="value" name="تعداد فعالیت">
                    {activityByType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              داده‌ای برای نمایش وجود ندارد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityChart;
