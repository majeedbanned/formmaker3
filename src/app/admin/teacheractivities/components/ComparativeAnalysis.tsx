import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TeacherActivity } from "./TeacherActivities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface ComparativeAnalysisProps {
  activities: TeacherActivity[];
  teachers: Record<string, string>;
  loading: boolean;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({
  activities,
  teachers,
  loading,
}) => {
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Array<Record<string, string | number>>>([]);
  const [radarData, setRadarData] = useState<Array<Record<string, string | number>>>([]);

  // Generate chart data when selected teachers change
  useEffect(() => {
    if (selectedTeachers.length === 0) {
      setComparisonData([]);
      setRadarData([]);
      return;
    }

    // Find the selected teacher activities
    const selectedActivities = activities.filter((teacher) =>
      selectedTeachers.includes(teacher.teacherCode)
    );

    // Generate comparison data for bar chart
    const barData = [
      {
        name: "نمرات",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.gradeCounts,
          }),
          {}
        ),
      },
      {
        name: "حضور و غیاب",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.presenceRecords,
          }),
          {}
        ),
      },
      {
        name: "ارزیابی‌ها",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.assessments,
          }),
          {}
        ),
      },
      {
        name: "یادداشت‌ها",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.comments,
          }),
          {}
        ),
      },
      {
        name: "رویدادها",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.events,
          }),
          {}
        ),
      },
      {
        name: "مجموع",
        ...selectedActivities.reduce(
          (acc, teacher) => ({
            ...acc,
            [teachers[teacher.teacherCode] || teacher.teacherCode]:
              teacher.totalActivities,
          }),
          {}
        ),
      },
    ];

    setComparisonData(barData);

    // Generate radar chart data
    const radarChartData = selectedActivities.map((teacher) => {
      // Calculate normalized values (0-100) for each metric to make them comparable
      const maxGrades = Math.max(...activities.map((t) => t.gradeCounts || 0));
      const maxPresence = Math.max(
        ...activities.map((t) => t.presenceRecords || 0)
      );
      const maxAssessments = Math.max(
        ...activities.map((t) => t.assessments || 0)
      );
      const maxComments = Math.max(...activities.map((t) => t.comments || 0));
      const maxEvents = Math.max(...activities.map((t) => t.events || 0));
      const maxTotal = Math.max(
        ...activities.map((t) => t.totalActivities || 0)
      );

      return {
        subject: teachers[teacher.teacherCode] || teacher.teacherCode,
        نمرات: maxGrades ? (teacher.gradeCounts / maxGrades) * 100 : 0,
        "حضور و غیاب": maxPresence
          ? (teacher.presenceRecords / maxPresence) * 100
          : 0,
        ارزیابی‌ها: maxAssessments
          ? (teacher.assessments / maxAssessments) * 100
          : 0,
        یادداشت‌ها: maxComments ? (teacher.comments / maxComments) * 100 : 0,
        رویدادها: maxEvents ? (teacher.events / maxEvents) * 100 : 0,
        مجموع: maxTotal ? (teacher.totalActivities / maxTotal) * 100 : 0,
        "پوشش کلاس‌ها": teacher.classCoverage || 0,
        "پوشش دانش‌آموزان": teacher.studentCoverage || 0,
      };
    });

    setRadarData(radarChartData);
  }, [selectedTeachers, activities, teachers]);

  // Handle teacher selection
  const handleTeacherSelect = (value: string) => {
    if (selectedTeachers.includes(value)) {
      setSelectedTeachers(selectedTeachers.filter((t) => t !== value));
    } else {
      if (selectedTeachers.length < 5) {
        setSelectedTeachers([...selectedTeachers, value]);
      }
    }
  };

  // Colors for the charts
  const chartColors = [
    "#3b82f6", // blue-500
    "#ef4444", // red-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#8b5cf6", // violet-500
  ];

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
      {/* Teacher selection section */}
      <Card className="border-none shadow-md bg-white rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-100">
          <CardTitle className="flex items-center text-indigo-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-indigo-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            انتخاب معلمان برای مقایسه
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <p className="text-gray-500 mb-4">
              تا ۵ معلم را برای مقایسه‌ی عملکردشان انتخاب کنید.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedTeachers.map((teacherCode, index) => (
                <Badge
                  key={teacherCode}
                  className="px-3 py-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer flex items-center gap-1 rounded-lg text-sm"
                  onClick={() => handleTeacherSelect(teacherCode)}
                  style={{ borderLeft: `3px solid ${chartColors[index]}` }}
                >
                  {teachers[teacherCode] || teacherCode}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                onValueChange={handleTeacherSelect}
                value=""
                disabled={selectedTeachers.length >= 5}
              >
                <SelectTrigger className="w-full md:w-64 bg-white">
                  <SelectValue
                    placeholder={
                      selectedTeachers.length >= 5
                        ? "حداکثر ۵ معلم انتخاب شده است"
                        : "انتخاب معلم برای مقایسه"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(teachers)
                    .filter(
                      ([code]) =>
                        !selectedTeachers.includes(code) &&
                        activities.some(
                          (teacher) => teacher.teacherCode === code
                        )
                    )
                    .map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedTeachers.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedTeachers([])}
                  className="border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  پاک کردن همه
                </Button>
              )}
            </div>
          </div>

          {selectedTeachers.length > 0 ? (
            <div className="space-y-8">
              {/* Bar Chart Comparison */}
              <Card className="overflow-hidden border-gray-100">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base text-gray-800">
                    مقایسه آماری فعالیت‌های معلمان
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={400}
                        data={comparisonData}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {selectedTeachers.map((teacherCode, index) => (
                          <Bar
                            key={teacherCode}
                            dataKey={teachers[teacherCode] || teacherCode}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart Comparison */}
              <Card className="overflow-hidden border-gray-100">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base text-gray-800">
                    تحلیل نسبی توانمندی‌های معلمان (درصد از بهترین عملکرد)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[500px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        outerRadius={150}
                        width={500}
                        height={500}
                        data={[
                          {
                            subject: "نمرات",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item.نمرات,
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "حضور و غیاب",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item["حضور و غیاب"],
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "ارزیابی‌ها",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item.ارزیابی‌ها,
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "یادداشت‌ها",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item.یادداشت‌ها,
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "رویدادها",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item.رویدادها,
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "پوشش کلاس‌ها",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item["پوشش کلاس‌ها"],
                              }),
                              {}
                            ),
                          },
                          {
                            subject: "پوشش دانش‌آموزان",
                            ...radarData.reduce(
                              (acc, item) => ({
                                ...acc,
                                [item.subject]: item["پوشش دانش‌آموزان"],
                              }),
                              {}
                            ),
                          },
                        ]}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        {selectedTeachers.map((teacherCode, index) => (
                          <Radar
                            key={teacherCode}
                            name={teachers[teacherCode] || teacherCode}
                            dataKey={teachers[teacherCode] || teacherCode}
                            stroke={chartColors[index % chartColors.length]}
                            fill={chartColors[index % chartColors.length]}
                            fillOpacity={0.2}
                          />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Table */}
              <Card className="overflow-hidden border-gray-100">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-base text-gray-800">
                    جدول مقایسه آماری
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="px-4 py-3 text-right font-medium text-gray-700">
                            نام معلم
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            کل فعالیت‌ها
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            نمرات
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            حضور و غیاب
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            ارزیابی‌ها
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            یادداشت‌ها
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            رویدادها
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            پوشش کلاس‌ها
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700">
                            پوشش دانش‌آموزان
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTeachers.map((teacherCode, index) => {
                          const teacher = activities.find(
                            (t) => t.teacherCode === teacherCode
                          );
                          if (!teacher) return null;

                          return (
                            <tr
                              key={teacherCode}
                              className="border-b border-gray-100 hover:bg-gray-50"
                              style={{
                                borderRight: `4px solid ${
                                  chartColors[index % chartColors.length]
                                }`,
                              }}
                            >
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {teachers[teacherCode] || teacherCode}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-sm font-medium">
                                  {teacher.totalActivities.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-green-700">
                                {teacher.gradeCounts.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-amber-700">
                                {teacher.presenceRecords.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-purple-700">
                                {teacher.assessments.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-indigo-700">
                                {teacher.comments.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-pink-700">
                                {teacher.events.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center text-teal-700">
                                {teacher.classCoverage?.toFixed(1) || 0}%
                              </td>
                              <td className="px-4 py-3 text-center text-cyan-700">
                                {teacher.studentCoverage?.toFixed(1) || 0}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-gray-400 mb-4"
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
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                معلمی برای مقایسه انتخاب نشده است
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                لطفاً از لیست معلمان، حداقل یک معلم را برای مشاهده تحلیل مقایسه‌ای
                انتخاب کنید.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparativeAnalysis; 