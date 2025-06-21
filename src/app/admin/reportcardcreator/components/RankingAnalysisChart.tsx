"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Crown } from "lucide-react";

// Persian digit conversion function
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

interface RankingAnalysisChartProps {
  students: {
    studentName: string;
    subjects: {
      subjectName: string;
      score: number;
      rank: number;
      totalStudents: number;
      progressInfo?: {
        rankDiff: number;
        previousRank: number;
      };
    }[];
    overallRank: number;
  }[];
}

export function RankingAnalysisChart({ students }: RankingAnalysisChartProps) {
  const rankingData = useMemo(() => {
    // Top performers analysis
    const topPerformers = students
      .slice()
      .sort((a, b) => a.overallRank - b.overallRank)
      .slice(0, 10);

    // Ranking distribution
    const rankingDistribution = {
      "رتبه ۱-۳": 0,
      "رتبه ۴-۱۰": 0,
      "رتبه ۱۱-۲۰": 0,
      "رتبه ۲۱+": 0,
    };

    students.forEach((student) => {
      if (student.overallRank <= 3) rankingDistribution["رتبه ۱-۳"]++;
      else if (student.overallRank <= 10) rankingDistribution["رتبه ۴-۱۰"]++;
      else if (student.overallRank <= 20) rankingDistribution["رتبه ۱۱-۲۰"]++;
      else rankingDistribution["رتبه ۲۱+"]++;
    });

    // Subject-wise top performers
    const subjectTopPerformers = new Map<
      string,
      Array<{
        studentName: string;
        rank: number;
        score: number;
      }>
    >();

    students.forEach((student) => {
      student.subjects.forEach((subject) => {
        if (!subjectTopPerformers.has(subject.subjectName)) {
          subjectTopPerformers.set(subject.subjectName, []);
        }

        subjectTopPerformers.get(subject.subjectName)!.push({
          studentName: student.studentName,
          rank: subject.rank,
          score: subject.score,
        });
      });
    });

    // Sort and get top 3 for each subject
    subjectTopPerformers.forEach((performers) => {
      performers.sort((a, b) => a.rank - b.rank);
    });

    // Progress analysis
    const progressAnalysis = {
      improved: 0,
      declined: 0,
      stable: 0,
    };

    students.forEach((student) => {
      student.subjects.forEach((subject) => {
        if (subject.progressInfo) {
          if (subject.progressInfo.rankDiff > 0) progressAnalysis.improved++;
          else if (subject.progressInfo.rankDiff < 0)
            progressAnalysis.declined++;
          else progressAnalysis.stable++;
        }
      });
    });

    return {
      topPerformers,
      rankingDistribution,
      subjectTopPerformers: Array.from(subjectTopPerformers.entries()),
      progressAnalysis,
    };
  }, [students]);

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">
              تحلیل رتبه‌بندی قابل نمایش نیست
            </h3>
            <p className="text-sm text-muted-foreground">
              هیچ داده‌ای برای تحلیل رتبه‌بندی وجود ندارد.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <Award className="h-4 w-4 text-blue-500" />;
  };

  const rankColors = {
    "رتبه ۱-۳": "bg-yellow-500",
    "رتبه ۴-۱۰": "bg-blue-500",
    "رتبه ۱۱-۲۰": "bg-green-500",
    "رتبه ۲۱+": "bg-gray-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Trophy className="h-5 w-5 ml-2" />
          تحلیل رتبه‌بندی و عملکرد برتر
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Top Performers */}
          <div>
            <h4 className="font-semibold mb-3">برترین دانش‌آموزان کلاس</h4>
            <div className="grid gap-2">
              {rankingData.topPerformers.slice(0, 5).map((student) => (
                <div
                  key={student.studentName}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    student.overallRank <= 3
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    {getRankIcon(student.overallRank)}
                    <div className="mr-3">
                      <div className="font-medium">{student.studentName}</div>
                      <div className="text-sm text-gray-600">
                        رتبه {toPersianDigits(student.overallRank)} از{" "}
                        {toPersianDigits(students.length)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {student.subjects.length > 0 &&
                        toPersianDigits(
                          (
                            student.subjects.reduce(
                              (sum, s) => sum + s.score,
                              0
                            ) / student.subjects.length
                          ).toFixed(1)
                        )}
                    </div>
                    <div className="text-xs text-gray-500">میانگین</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Distribution */}
          <div>
            <h4 className="font-semibold mb-3">توزیع رتبه‌بندی کلاس</h4>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Object.entries(rankingData.rankingDistribution).map(
                ([range, count]) => {
                  const percentage =
                    students.length > 0 ? (count / students.length) * 100 : 0;

                  return (
                    <div key={range} className="text-center">
                      <div className="mb-2">
                        <div
                          className={`h-20 ${
                            rankColors[range as keyof typeof rankColors]
                          } rounded-t relative`}
                          style={{ height: `${Math.max(percentage * 2, 8)}px` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {toPersianDigits(count)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs font-medium">{range}</div>
                      <div className="text-xs text-gray-500">
                        {toPersianDigits(Math.round(percentage))}%
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Subject-wise Top Performers */}
          <div>
            <h4 className="font-semibold mb-3">برترین‌ها در هر درس</h4>
            <div className="grid gap-3">
              {rankingData.subjectTopPerformers.map(([subject, performers]) => (
                <div key={subject} className="border rounded-lg p-4">
                  <div className="font-medium mb-3">{subject}</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {performers.slice(0, 3).map((performer, index) => (
                      <div
                        key={performer.studentName}
                        className={`flex items-center p-2 rounded ${
                          index === 0
                            ? "bg-yellow-50"
                            : index === 1
                            ? "bg-gray-50"
                            : "bg-amber-50"
                        }`}
                      >
                        {getRankIcon(performer.rank)}
                        <div className="mr-2 flex-1">
                          <div className="text-sm font-medium">
                            {performer.studentName}
                          </div>
                          <div className="text-xs text-gray-600">
                            نمره: {toPersianDigits(performer.score.toFixed(1))}
                          </div>
                        </div>
                        <div className="text-xs font-bold">
                          {toPersianDigits(performer.rank)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Analysis */}
          {rankingData.progressAnalysis.improved +
            rankingData.progressAnalysis.declined +
            rankingData.progressAnalysis.stable >
            0 && (
            <div>
              <h4 className="font-semibold mb-3">تحلیل تغییرات رتبه</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-600">
                    {toPersianDigits(rankingData.progressAnalysis.improved)}
                  </div>
                  <div className="text-sm text-green-600">بهبود رتبه</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-yellow-50">
                  <div className="text-2xl font-bold text-yellow-600">
                    {toPersianDigits(rankingData.progressAnalysis.stable)}
                  </div>
                  <div className="text-sm text-yellow-600">رتبه ثابت</div>
                </div>
                <div className="text-center p-4 border rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-600">
                    {toPersianDigits(rankingData.progressAnalysis.declined)}
                  </div>
                  <div className="text-sm text-red-600">کاهش رتبه</div>
                </div>
              </div>
            </div>
          )}

          {/* Achievement Summary */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">خلاصه دستاوردها</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-yellow-50 rounded">
                <Crown className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <div className="text-lg font-semibold text-yellow-600">
                  {toPersianDigits(rankingData.rankingDistribution["رتبه ۱-۳"])}
                </div>
                <div className="text-xs text-yellow-600">رتبه‌های طلایی</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded">
                <Trophy className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <div className="text-lg font-semibold text-blue-600">
                  {toPersianDigits(
                    rankingData.rankingDistribution["رتبه ۴-۱۰"]
                  )}
                </div>
                <div className="text-xs text-blue-600">رتبه‌های برتر</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <Medal className="h-6 w-6 text-green-500 mx-auto mb-1" />
                <div className="text-lg font-semibold text-green-600">
                  {toPersianDigits(
                    rankingData.rankingDistribution["رتبه ۱۱-۲۰"]
                  )}
                </div>
                <div className="text-xs text-green-600">رتبه‌های خوب</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <Award className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                <div className="text-lg font-semibold text-gray-600">
                  {toPersianDigits(rankingData.rankingDistribution["رتبه ۲۱+"])}
                </div>
                <div className="text-xs text-gray-600">سایر رتبه‌ها</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
