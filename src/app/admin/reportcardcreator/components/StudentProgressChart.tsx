"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, TrendingUp, TrendingDown, Target } from "lucide-react";

// Persian digit conversion function
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

// Persian date utility function
const formatPersianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const persianMonths = [
      "فرو",
      "ارد",
      "خرد",
      "تیر",
      "مرد",
      "شهر",
      "مهر",
      "آبا",
      "آذر",
      "دی",
      "بهم",
      "اسف",
    ];

    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();

    let persianYear = gregorianYear - 621;
    let persianMonth = gregorianMonth;

    if (gregorianMonth <= 3) {
      persianMonth = gregorianMonth + 9;
      persianYear--;
    } else {
      persianMonth = gregorianMonth - 3;
    }

    if (persianMonth < 1) persianMonth = 1;
    if (persianMonth > 12) persianMonth = 12;

    return `${toPersianDigits(gregorianDay)} ${
      persianMonths[persianMonth - 1]
    }`;
  } catch {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      month: "short",
      day: "numeric",
    });
  }
};

interface ChartDataPoint {
  date: string;
  score: number;
  gradingTitle: string;
  courseCode: string;
  courseVahed: number;
}

interface CourseProgressData {
  courseName: string;
  courseCode: string;
  color: string;
  data: ChartDataPoint[];
}

interface StudentProgressChartProps {
  studentName: string;
  subjects: {
    gradingId: string;
    subjectName: string;
    gradingTitle: string;
    gradingDate: string;
    score: number;
    courseCode: string;
    courseVahed: number;
  }[];
}

const CHART_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

export function StudentProgressChart({
  studentName,
  subjects,
}: StudentProgressChartProps) {
  const chartData = useMemo(() => {
    // Group subjects by course (using courseCode + subjectName for better accuracy)
    const courseGroups = subjects.reduce((groups, subject) => {
      const key = subject.courseCode
        ? `${subject.courseCode}-${subject.subjectName}`
        : subject.subjectName;

      if (!groups[key]) {
        groups[key] = {
          courseName: subject.subjectName,
          courseCode: subject.courseCode,
          data: [],
        };
      }

      groups[key].data.push({
        date: subject.gradingDate,
        score: subject.score,
        gradingTitle: subject.gradingTitle,
        courseCode: subject.courseCode,
        courseVahed: subject.courseVahed,
      });

      return groups;
    }, {} as Record<string, { courseName: string; courseCode: string; data: ChartDataPoint[] }>);

    // Sort data points by date for each course and assign colors
    const courseProgressData: CourseProgressData[] = Object.values(courseGroups)
      .map((course, index) => ({
        ...course,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: course.data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }))
      .filter((course) => course.data.length > 1); // Only show courses with multiple assessments

    return courseProgressData;
  }, [subjects]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">نمودار پیشرفت قابل نمایش نیست</h3>
            <p className="text-sm text-muted-foreground">
              برای نمایش نمودار، هر درس باید حداقل دو ارزیابی داشته باشد.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate chart dimensions and scales
  const chartWidth = 800;
  const chartHeight = 400;
  const margin = { top: 20, right: 120, bottom: 60, left: 60 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Get all unique dates across all courses
  const allDates = Array.from(
    new Set(chartData.flatMap((course) => course.data.map((d) => d.date)))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Calculate scales
  const minScore = Math.min(
    0,
    ...chartData.flatMap((course) => course.data.map((d) => d.score))
  );
  const maxScore = Math.max(
    20,
    ...chartData.flatMap((course) => course.data.map((d) => d.score))
  );

  const xScale = (dateIndex: number) =>
    (dateIndex / (allDates.length - 1)) * innerWidth;
  const yScale = (score: number) =>
    innerHeight - ((score - minScore) / (maxScore - minScore)) * innerHeight;

  // Generate grid lines
  const yTicks = [];
  for (let i = Math.ceil(minScore); i <= Math.floor(maxScore); i += 2) {
    yTicks.push(i);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <LineChart className="h-5 w-5 ml-2" />
          نمودار پیشرفت تحصیلی - {studentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg
            width={chartWidth}
            height={chartHeight}
            className="border rounded"
          >
            {/* Grid lines */}
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {/* Horizontal grid lines */}
              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={0}
                    y1={yScale(tick)}
                    x2={innerWidth}
                    y2={yScale(tick)}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={-10}
                    y={yScale(tick) + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-500"
                  >
                    {toPersianDigits(tick)}
                  </text>
                </g>
              ))}

              {/* Vertical grid lines */}
              {allDates.map((date, index) => (
                <g key={date}>
                  <line
                    x1={xScale(index)}
                    y1={0}
                    x2={xScale(index)}
                    y2={innerHeight}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={xScale(index)}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {formatPersianDate(date)}
                  </text>
                </g>
              ))}

              {/* Chart lines */}
              {chartData.map((course) => {
                const pathData = course.data
                  .map((point) => {
                    const dateIndex = allDates.indexOf(point.date);
                    const x = xScale(dateIndex);
                    const y = yScale(point.score);
                    return `${x},${y}`;
                  })
                  .join(" L ");

                return (
                  <g key={`${course.courseCode}-${course.courseName}`}>
                    {/* Line */}
                    <path
                      d={`M ${pathData}`}
                      fill="none"
                      stroke={course.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {course.data.map((point, pointIndex) => {
                      const dateIndex = allDates.indexOf(point.date);
                      const x = xScale(dateIndex);
                      const y = yScale(point.score);

                      return (
                        <g key={pointIndex}>
                          <circle
                            cx={x}
                            cy={y}
                            r={4}
                            fill={course.color}
                            stroke="white"
                            strokeWidth={2}
                          />

                          {/* Tooltip on hover */}
                          <circle
                            cx={x}
                            cy={y}
                            r={8}
                            fill="transparent"
                            className="cursor-pointer"
                          >
                            <title>
                              {course.courseName} - {point.gradingTitle}
                              {"\n"}نمره: {toPersianDigits(point.score)}
                              {"\n"}تاریخ: {formatPersianDate(point.date)}
                            </title>
                          </circle>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Axes */}
              <line
                x1={0}
                y1={innerHeight}
                x2={innerWidth}
                y2={innerHeight}
                stroke="#374151"
                strokeWidth={2}
              />
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={innerHeight}
                stroke="#374151"
                strokeWidth={2}
              />

              {/* Axis labels */}
              <text
                x={innerWidth / 2}
                y={innerHeight + 50}
                textAnchor="middle"
                className="text-sm font-medium fill-gray-700"
              >
                زمان ارزیابی
              </text>
              <text
                x={-40}
                y={innerHeight / 2}
                textAnchor="middle"
                transform={`rotate(-90, -40, ${innerHeight / 2})`}
                className="text-sm font-medium fill-gray-700"
              >
                نمره
              </text>
            </g>

            {/* Legend */}
            <g
              transform={`translate(${chartWidth - margin.right + 10}, ${
                margin.top
              })`}
            >
              <text x={0} y={0} className="text-sm font-medium fill-gray-700">
                دروس:
              </text>
              {chartData.map((course, index) => {
                const y = 20 + index * 25;
                return (
                  <g key={`${course.courseCode}-${course.courseName}`}>
                    <line
                      x1={0}
                      y1={y}
                      x2={20}
                      y2={y}
                      stroke={course.color}
                      strokeWidth={3}
                    />
                    <circle
                      cx={10}
                      cy={y}
                      r={3}
                      fill={course.color}
                      stroke="white"
                      strokeWidth={1}
                    />
                    <text x={25} y={y + 4} className="text-xs fill-gray-600">
                      {course.courseCode && (
                        <tspan className="font-mono">
                          [{course.courseCode}]{" "}
                        </tspan>
                      )}
                      {course.courseName}
                    </text>

                    {/* Progress indicator */}
                    {course.data.length >= 2 && (
                      <g>
                        <text
                          x={25}
                          y={y + 16}
                          className="text-xs fill-gray-500"
                        >
                          {(() => {
                            const firstScore = course.data[0].score;
                            const lastScore =
                              course.data[course.data.length - 1].score;
                            const diff = lastScore - firstScore;

                            if (Math.abs(diff) < 0.1) {
                              return (
                                <>
                                  <Target className="w-3 h-3 inline ml-1" />
                                  ثابت
                                </>
                              );
                            } else if (diff > 0) {
                              return (
                                <>
                                  <TrendingUp className="w-3 h-3 inline ml-1 text-green-600" />
                                  <tspan className="text-green-600">
                                    +{toPersianDigits(diff.toFixed(1))}
                                  </tspan>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <TrendingDown className="w-3 h-3 inline ml-1 text-red-600" />
                                  <tspan className="text-red-600">
                                    {toPersianDigits(diff.toFixed(1))}
                                  </tspan>
                                </>
                              );
                            }
                          })()}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-lg font-semibold text-blue-600">
              {toPersianDigits(chartData.length)}
            </div>
            <div className="text-xs text-blue-600">
              درس با پیشرفت قابل ردیابی
            </div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-lg font-semibold text-green-600">
              {toPersianDigits(
                chartData.filter((course) => {
                  const firstScore = course.data[0].score;
                  const lastScore = course.data[course.data.length - 1].score;
                  return lastScore > firstScore;
                }).length
              )}
            </div>
            <div className="text-xs text-green-600">درس با روند صعودی</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded">
            <div className="text-lg font-semibold text-red-600">
              {toPersianDigits(
                chartData.filter((course) => {
                  const firstScore = course.data[0].score;
                  const lastScore = course.data[course.data.length - 1].score;
                  return lastScore < firstScore;
                }).length
              )}
            </div>
            <div className="text-xs text-red-600">درس با روند نزولی</div>
          </div>
        </div>

        {/* Detailed Progress Analysis */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">تحلیل تفصیلی پیشرفت</h4>
          <div className="grid gap-3">
            {chartData.map((course) => {
              const firstScore = course.data[0].score;
              const lastScore = course.data[course.data.length - 1].score;
              const diff = lastScore - firstScore;
              const assessmentCount = course.data.length;

              return (
                <div
                  key={`${course.courseCode}-${course.courseName}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {course.courseCode && (
                        <span className="text-blue-600 font-mono ml-1">
                          [{course.courseCode}]
                        </span>
                      )}
                      {course.courseName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {toPersianDigits(assessmentCount)} ارزیابی • از{" "}
                      {formatPersianDate(course.data[0].date)} تا{" "}
                      {formatPersianDate(
                        course.data[course.data.length - 1].date
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center">
                      {Math.abs(diff) < 0.1 ? (
                        <Target className="w-4 h-4 ml-1 text-gray-500" />
                      ) : diff > 0 ? (
                        <TrendingUp className="w-4 h-4 ml-1 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 ml-1 text-red-600" />
                      )}
                      <span
                        className={`font-bold ${
                          Math.abs(diff) < 0.1
                            ? "text-gray-600"
                            : diff > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {Math.abs(diff) < 0.1
                          ? "ثابت"
                          : `${diff >= 0 ? "+" : ""}${toPersianDigits(
                              diff.toFixed(1)
                            )}`}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {toPersianDigits(firstScore.toFixed(1))} →{" "}
                      {toPersianDigits(lastScore.toFixed(1))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
