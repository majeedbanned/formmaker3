"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Target, BarChart2 } from "lucide-react";

// Persian digit conversion function
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

interface ClassComparisonChartProps {
  students: {
    studentName: string;
    subjects: {
      subjectName: string;
      score: number;
      classAverage: number;
      diffFromAvg: number;
      rank: number;
      totalStudents: number;
    }[];
    overallAverage: number;
    overallRank: number;
    overallDiffFromAvg: number;
  }[];
}

export function ClassComparisonChart({ students }: ClassComparisonChartProps) {
  const comparisonData = useMemo(() => {
    // Calculate subject-wise class statistics
    const subjectStats = new Map<
      string,
      {
        subjectName: string;
        classAverage: number;
        highest: number;
        lowest: number;
        aboveAverage: number;
        belowAverage: number;
        onAverage: number;
        totalStudents: number;
      }
    >();

    students.forEach((student) => {
      student.subjects.forEach((subject) => {
        if (!subjectStats.has(subject.subjectName)) {
          subjectStats.set(subject.subjectName, {
            subjectName: subject.subjectName,
            classAverage: subject.classAverage,
            highest: subject.score,
            lowest: subject.score,
            aboveAverage: 0,
            belowAverage: 0,
            onAverage: 0,
            totalStudents: subject.totalStudents,
          });
        }

        const stats = subjectStats.get(subject.subjectName)!;
        stats.highest = Math.max(stats.highest, subject.score);
        stats.lowest = Math.min(stats.lowest, subject.score);

        if (subject.diffFromAvg > 0.1) stats.aboveAverage++;
        else if (subject.diffFromAvg < -0.1) stats.belowAverage++;
        else stats.onAverage++;
      });
    });

    // Overall class statistics
    const overallClassAverage =
      students.reduce((sum, s) => sum + s.overallAverage, 0) / students.length;
    const overallAboveAverage = students.filter(
      (s) => s.overallDiffFromAvg > 0.1
    ).length;
    const overallBelowAverage = students.filter(
      (s) => s.overallDiffFromAvg < -0.1
    ).length;
    const overallOnAverage =
      students.length - overallAboveAverage - overallBelowAverage;

    return {
      subjectStats: Array.from(subjectStats.values()),
      overallStats: {
        classAverage: overallClassAverage,
        aboveAverage: overallAboveAverage,
        belowAverage: overallBelowAverage,
        onAverage: overallOnAverage,
        totalStudents: students.length,
      },
    };
  }, [students]);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              نمودار مقایسه کلاس قابل نمایش نیست
            </h3>
            <p className="text-sm text-muted-foreground">
              هیچ داده‌ای برای مقایسه با میانگین کلاس وجود ندارد.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BarChart2 className="h-5 w-5 ml-2" />
          مقایسه عملکرد با میانگین کلاس
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Class Comparison */}
          <div>
            <h4 className="font-semibold mb-3">مقایسه کلی دانش‌آموزان</h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {toPersianDigits(comparisonData.overallStats.aboveAverage)}
                </div>
                <div className="text-sm text-green-600">بالاتر از میانگین</div>
                <div className="text-xs text-gray-500">
                  {toPersianDigits(
                    Math.round(
                      (comparisonData.overallStats.aboveAverage /
                        comparisonData.overallStats.totalStudents) *
                        100
                    )
                  )}
                  %
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-yellow-600">
                  {toPersianDigits(comparisonData.overallStats.onAverage)}
                </div>
                <div className="text-sm text-yellow-600">نزدیک میانگین</div>
                <div className="text-xs text-gray-500">
                  {toPersianDigits(
                    Math.round(
                      (comparisonData.overallStats.onAverage /
                        comparisonData.overallStats.totalStudents) *
                        100
                    )
                  )}
                  %
                </div>
              </div>

              <div className="text-center p-4 border rounded-lg bg-red-50">
                <div className="flex items-center justify-center mb-2">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {toPersianDigits(comparisonData.overallStats.belowAverage)}
                </div>
                <div className="text-sm text-red-600">پایین‌تر از میانگین</div>
                <div className="text-xs text-gray-500">
                  {toPersianDigits(
                    Math.round(
                      (comparisonData.overallStats.belowAverage /
                        comparisonData.overallStats.totalStudents) *
                        100
                    )
                  )}
                  %
                </div>
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">میانگین کلی کلاس</div>
              <div className="text-xl font-bold text-blue-600">
                {toPersianDigits(
                  comparisonData.overallStats.classAverage.toFixed(2)
                )}
              </div>
            </div>
          </div>

          {/* Subject-wise Comparison */}
          <div>
            <h4 className="font-semibold mb-3">مقایسه به تفکیک درس</h4>
            <div className="space-y-3">
              {comparisonData.subjectStats.map((subject) => (
                <div
                  key={subject.subjectName}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-medium">{subject.subjectName}</div>
                    <div className="text-sm text-gray-600">
                      میانگین:{" "}
                      {toPersianDigits(subject.classAverage.toFixed(1))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {toPersianDigits(subject.aboveAverage)}
                      </div>
                      <div className="text-xs text-green-600">بالاتر</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-yellow-600">
                        {toPersianDigits(subject.onAverage)}
                      </div>
                      <div className="text-xs text-yellow-600">مشابه</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">
                        {toPersianDigits(subject.belowAverage)}
                      </div>
                      <div className="text-xs text-red-600">پایین‌تر</div>
                    </div>
                  </div>

                  {/* Visual bar representation */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div className="flex h-4 rounded-full overflow-hidden">
                      <div
                        className="bg-green-500"
                        style={{
                          width: `${
                            (subject.aboveAverage / subject.totalStudents) * 100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="bg-yellow-500"
                        style={{
                          width: `${
                            (subject.onAverage / subject.totalStudents) * 100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${
                            (subject.belowAverage / subject.totalStudents) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      کمترین: {toPersianDigits(subject.lowest.toFixed(1))}
                    </span>
                    <span>
                      بیشترین: {toPersianDigits(subject.highest.toFixed(1))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">تحلیل عملکرد کلاس</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-2">بهترین عملکرد</div>
                {comparisonData.subjectStats.length > 0 &&
                  (() => {
                    const bestSubject = comparisonData.subjectStats.reduce(
                      (best, current) =>
                        current.classAverage > best.classAverage
                          ? current
                          : best
                    );
                    return (
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {bestSubject.subjectName}
                        </div>
                        <div className="text-gray-600">
                          میانگین:{" "}
                          {toPersianDigits(bestSubject.classAverage.toFixed(1))}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm font-medium mb-2">
                  نیازمند توجه بیشتر
                </div>
                {comparisonData.subjectStats.length > 0 &&
                  (() => {
                    const worstSubject = comparisonData.subjectStats.reduce(
                      (worst, current) =>
                        current.classAverage < worst.classAverage
                          ? current
                          : worst
                    );
                    return (
                      <div className="text-sm">
                        <div className="font-medium text-red-600">
                          {worstSubject.subjectName}
                        </div>
                        <div className="text-gray-600">
                          میانگین:{" "}
                          {toPersianDigits(
                            worstSubject.classAverage.toFixed(1)
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
