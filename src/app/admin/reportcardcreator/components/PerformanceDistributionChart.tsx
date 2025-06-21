"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Target } from "lucide-react";

// Persian digit conversion function
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

interface PerformanceDistributionChartProps {
  students: {
    studentName: string;
    subjects: {
      subjectName: string;
      score: number;
      performance: string;
    }[];
    overallAverage: number;
  }[];
}

export function PerformanceDistributionChart({
  students,
}: PerformanceDistributionChartProps) {
  const distributionData = useMemo(() => {
    // Overall performance distribution
    const overallDistribution = {
      عالی: 0,
      خوب: 0,
      متوسط: 0,
      ضعیف: 0,
      "نیازمند تقویت": 0,
    };

    // Subject-wise performance distribution
    const subjectDistribution = new Map<string, typeof overallDistribution>();

    // Grade range distribution
    const gradeRanges = {
      "18-20": 0,
      "15-17.99": 0,
      "12-14.99": 0,
      "10-11.99": 0,
      "0-9.99": 0,
    };

    students.forEach((student) => {
      // Overall average distribution
      if (student.overallAverage >= 18) gradeRanges["18-20"]++;
      else if (student.overallAverage >= 15) gradeRanges["15-17.99"]++;
      else if (student.overallAverage >= 12) gradeRanges["12-14.99"]++;
      else if (student.overallAverage >= 10) gradeRanges["10-11.99"]++;
      else gradeRanges["0-9.99"]++;

      student.subjects.forEach((subject) => {
        // Overall performance count
        overallDistribution[
          subject.performance as keyof typeof overallDistribution
        ]++;

        // Subject-wise performance
        if (!subjectDistribution.has(subject.subjectName)) {
          subjectDistribution.set(subject.subjectName, {
            عالی: 0,
            خوب: 0,
            متوسط: 0,
            ضعیف: 0,
            "نیازمند تقویت": 0,
          });
        }
        const subjectPerf = subjectDistribution.get(subject.subjectName)!;
        subjectPerf[subject.performance as keyof typeof overallDistribution]++;
      });
    });

    return {
      overallDistribution,
      subjectDistribution: Array.from(subjectDistribution.entries()),
      gradeRanges,
    };
  }, [students]);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              نمودار توزیع عملکرد قابل نمایش نیست
            </h3>
            <p className="text-sm text-muted-foreground">
              هیچ داده‌ای برای نمایش توزیع عملکرد وجود ندارد.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceColors = {
    عالی: "bg-green-500",
    خوب: "bg-blue-500",
    متوسط: "bg-yellow-500",
    ضعیف: "bg-orange-500",
    "نیازمند تقویت": "bg-red-500",
  };

  const gradeRangeColors = {
    "18-20": "bg-green-500",
    "15-17.99": "bg-blue-500",
    "12-14.99": "bg-yellow-500",
    "10-11.99": "bg-orange-500",
    "0-9.99": "bg-red-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BarChart3 className="h-5 w-5 ml-2" />
          نمودار توزیع عملکرد کلاس
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Performance Distribution */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Users className="h-4 w-4 ml-2" />
              توزیع عملکرد کلی
            </h4>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(distributionData.overallDistribution).map(
                ([performance, count]) => {
                  const total = Object.values(
                    distributionData.overallDistribution
                  ).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={performance} className="text-center">
                      <div className="mb-2">
                        <div
                          className={`h-20 ${
                            performanceColors[
                              performance as keyof typeof performanceColors
                            ]
                          } rounded-t relative`}
                          style={{ height: `${Math.max(percentage * 2, 8)}px` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {toPersianDigits(count)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-medium">{performance}</div>
                      <div className="text-xs text-gray-500">
                        {toPersianDigits(Math.round(percentage))}%
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Grade Range Distribution */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Target className="h-4 w-4 ml-2" />
              توزیع بازه نمرات (میانگین کلی دانش‌آموزان)
            </h4>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {Object.entries(distributionData.gradeRanges).map(
                ([range, count]) => {
                  const total = students.length;
                  const percentage = total > 0 ? (count / total) * 100 : 0;

                  return (
                    <div key={range} className="text-center">
                      <div className="mb-2">
                        <div
                          className={`h-20 ${
                            gradeRangeColors[
                              range as keyof typeof gradeRangeColors
                            ]
                          } rounded-t relative`}
                          style={{ height: `${Math.max(percentage * 3, 8)}px` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {toPersianDigits(count)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        {toPersianDigits(range)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {toPersianDigits(Math.round(percentage))}%
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Subject-wise Performance Distribution */}
          {distributionData.subjectDistribution.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">توزیع عملکرد به تفکیک درس</h4>
              <div className="space-y-4">
                {distributionData.subjectDistribution.map(
                  ([subject, distribution]) => {
                    const total = Object.values(distribution).reduce(
                      (a, b) => a + b,
                      0
                    );

                    return (
                      <div key={subject} className="border rounded-lg p-4">
                        <div className="font-medium mb-2">{subject}</div>
                        <div className="grid grid-cols-5 gap-1">
                          {Object.entries(distribution).map(
                            ([performance, count]) => {
                              const percentage =
                                total > 0 ? (count / total) * 100 : 0;

                              return (
                                <div key={performance} className="text-center">
                                  <div
                                    className={`h-8 ${
                                      performanceColors[
                                        performance as keyof typeof performanceColors
                                      ]
                                    } rounded relative`}
                                    style={{ opacity: percentage / 100 + 0.2 }}
                                  >
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                      {toPersianDigits(count)}
                                    </div>
                                  </div>
                                  <div className="text-xs mt-1">
                                    {performance}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-center">
                          مجموع: {toPersianDigits(total)} نمره
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-600">
                {toPersianDigits(distributionData.overallDistribution["عالی"])}
              </div>
              <div className="text-xs text-green-600">عملکرد عالی</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {toPersianDigits(distributionData.overallDistribution["خوب"])}
              </div>
              <div className="text-xs text-blue-600">عملکرد خوب</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded">
              <div className="text-lg font-semibold text-yellow-600">
                {toPersianDigits(distributionData.overallDistribution["متوسط"])}
              </div>
              <div className="text-xs text-yellow-600">عملکرد متوسط</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-semibold text-red-600">
                {toPersianDigits(
                  distributionData.overallDistribution["ضعیف"] +
                    distributionData.overallDistribution["نیازمند تقویت"]
                )}
              </div>
              <div className="text-xs text-red-600">نیاز به تقویت</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
