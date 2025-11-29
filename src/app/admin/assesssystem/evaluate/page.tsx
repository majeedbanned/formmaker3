"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Teacher {
  _id: string;
  data: {
    teacherCode: string;
    teacherName: string;
    teacherFamily?: string;
    fieldAssessor?: boolean;
  };
}

interface EvaluationIndicator {
  _id: string;
  data: {
    indicatorName: string;
    description?: string;
    maxScore: number;
    isActive: boolean;
    order?: number;
    category?: string;
  };
}

interface EvaluationItem {
  indicatorId: string;
  score: number;
  comment: string;
}

interface Evaluation {
  _id?: string;
  data: {
    teacherCode: string;
    assessorCode: string;
    evaluationMonth: string; // Format: YYYY/MM
    items: EvaluationItem[];
    createdAt?: Date;
    updatedAt?: Date;
  };
}

// Persian month names
const PERSIAN_MONTHS = [
  { value: "01", label: "فروردین" },
  { value: "02", label: "اردیبهشت" },
  { value: "03", label: "خرداد" },
  { value: "04", label: "تیر" },
  { value: "05", label: "مرداد" },
  { value: "06", label: "شهریور" },
  { value: "07", label: "مهر" },
  { value: "08", label: "آبان" },
  { value: "09", label: "آذر" },
  { value: "10", label: "دی" },
  { value: "11", label: "بهمن" },
  { value: "12", label: "اسفند" },
];

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  educational: "آموزشی",
  behavioral: "رفتاری",
  cultural: "فرهنگی",
  sports: "ورزشی",
  technology: "فناوری",
  general: "عمومی",
};

export default function EvaluateTeacherPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [indicators, setIndicators] = useState<EvaluationIndicator[]>([]);
  const [evaluationItems, setEvaluationItems] = useState<
    Record<string, EvaluationItem>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingEvaluation, setExistingEvaluation] = useState<Evaluation | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<
    Array<{ month: string; totalScore: number; evaluationId: string }>
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Get current Persian year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    // Convert to Persian year (approximate)
    const persianYear = currentYear - 621;
    setSelectedYear(persianYear.toString());
  }, []);

  // Check if user is a field assessor or admin
  useEffect(() => {
    if (!user) {
      setCheckingAccess(false);
      return;
    }

    // Admin users (school) have full access
    if (user.userType === "school") {
      setHasAccess(true);
      setCheckingAccess(false);
      return;
    }

    if (user.userType === "teacher") {
      // Fetch current user's teacher record to check fieldAssessor
      fetch(`/api/teachers/search?teacherCode=${user.username}`, {
        headers: {
          "x-domain": window.location.host,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.teachers && data.teachers.length > 0) {
            const teacher = data.teachers[0];
            // Check if fieldAssessor is explicitly true
            const isFieldAssessor = teacher.data?.fieldAssessor === true;
            setHasAccess(isFieldAssessor);
            if (!isFieldAssessor) {
              toast.error("شما مجوز ارزیابی معلمان را ندارید");
            }
          } else {
            setHasAccess(false);
            toast.error("اطلاعات معلم یافت نشد");
          }
        })
        .catch((err) => {
          console.error("Error checking assessor status:", err);
          setHasAccess(false);
          toast.error("خطا در بررسی مجوز ارزیابی");
        })
        .finally(() => {
          setCheckingAccess(false);
        });
    } else {
      setHasAccess(false);
      setCheckingAccess(false);
      toast.error("فقط مدیران و معلمان با مجوز ارزیابی می‌توانند از این صفحه استفاده کنند");
    }
  }, [user, router]);

  // Fetch teachers when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchTeachers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setTeachers([]);
      setShowTeacherDropdown(false);
    }
  }, [searchTerm]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch(
        `/api/teachers/search?search=${encodeURIComponent(searchTerm)}&schoolCode=${user?.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
        setShowTeacherDropdown(true);
      } else {
        toast.error("خطا در دریافت لیست معلمان");
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("خطا در دریافت لیست معلمان");
    }
  };

  // Fetch indicators when month is selected
  useEffect(() => {
    if (selectedYear && selectedMonth && user?.schoolCode) {
      fetchIndicators();
    }
  }, [selectedYear, selectedMonth, user?.schoolCode]);

  // Load existing evaluation when teacher, month, and indicators are ready
  useEffect(() => {
    if (
      selectedTeacher &&
      selectedYear &&
      selectedMonth &&
      user?.username &&
      indicators.length > 0
    ) {
      loadExistingEvaluation();
    } else if (!selectedTeacher) {
      setExistingEvaluation(null);
      setEvaluationItems({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacher, selectedYear, selectedMonth, indicators.length]);

  const fetchIndicators = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/evaluation/indicators?schoolCode=${user?.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const activeIndicators = (data.indicators || []).filter(
          (ind: EvaluationIndicator) => ind.data?.isActive !== false
        );
        // Sort by order if available
        activeIndicators.sort((a: EvaluationIndicator, b: EvaluationIndicator) => {
          const orderA = a.data?.order || 0;
          const orderB = b.data?.order || 0;
          return orderA - orderB;
        });
        setIndicators(activeIndicators);

        // Initialize evaluation items with default values
        // These will be overwritten if an existing evaluation is found
        const initialItems: Record<string, EvaluationItem> = {};
        activeIndicators.forEach((ind: EvaluationIndicator) => {
          initialItems[ind._id] = {
            indicatorId: ind._id,
            score: 0, // Ensure it's a number
            comment: "",
          };
        });
        setEvaluationItems(initialItems);
      } else {
        toast.error("خطا در دریافت شاخص‌های ارزیابی");
      }
    } catch (error) {
      console.error("Error fetching indicators:", error);
      toast.error("خطا در دریافت شاخص‌های ارزیابی");
    } finally {
      setLoading(false);
    }
  };

  const loadExistingEvaluation = async () => {
    if (!selectedTeacher || !selectedYear || !selectedMonth || !user?.username) {
      return;
    }

    setLoading(true);
    try {
      const evaluationMonth = `${selectedYear}/${selectedMonth}`;
      // For admin users, use username; for teachers, also use username (which is their teacherCode)
      const assessorCode = user.userType === "school" ? `admin_${user.username}` : user.username;
      const response = await fetch(
        `/api/evaluation/get?teacherCode=${selectedTeacher.data.teacherCode}&assessorCode=${assessorCode}&evaluationMonth=${evaluationMonth}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.evaluation) {
          setExistingEvaluation(data.evaluation);
          // Populate evaluation items - ensure scores are numbers
          const items: Record<string, EvaluationItem> = {};
          data.evaluation.data.items.forEach((item: EvaluationItem) => {
            items[item.indicatorId] = {
              ...item,
              score: Number(item.score) || 0, // Ensure score is a number
            };
          });
          setEvaluationItems(items);
          toast.success("ارزیابی موجود بارگذاری شد");
        } else {
          // No existing evaluation, reset items
          setExistingEvaluation(null);
          // Initialize items from indicators if available
          if (indicators.length > 0) {
            const initialItems: Record<string, EvaluationItem> = {};
            indicators.forEach((ind: EvaluationIndicator) => {
              initialItems[ind._id] = {
                indicatorId: ind._id,
                score: 0, // Ensure it's a number
                comment: "",
              };
            });
            setEvaluationItems(initialItems);
          }
        }
      }
    } catch (error) {
      console.error("Error loading evaluation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSearchTerm(
      `${teacher.data.teacherName} ${teacher.data.teacherFamily || ""}`.trim()
    );
    setShowTeacherDropdown(false);
    // Load evaluation history for the selected teacher
    loadEvaluationHistory(teacher.data.teacherCode);
  };

  const loadEvaluationHistory = async (teacherCode: string) => {
    if (!teacherCode || !user?.username) return;

    setLoadingHistory(true);
    try {
      const assessorCode = user.userType === "school" ? `admin_${user.username}` : user.username;
      const response = await fetch(
        `/api/evaluation/history?teacherCode=${teacherCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMonthlyHistory(data.monthlyData || []);
      }
    } catch (error) {
      console.error("Error loading evaluation history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleScoreChange = (indicatorId: string, score: string) => {
    // Parse as number and handle empty string
    const numScore = score === "" ? 0 : parseFloat(score) || 0;
    const indicator = indicators.find((ind) => ind._id === indicatorId);
    const maxScore = Number(indicator?.data?.maxScore) || 100;
    const clampedScore = Math.max(0, Math.min(numScore, maxScore));

    setEvaluationItems((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        indicatorId,
        score: clampedScore, // Store as number
      },
    }));
  };

  const handleCommentChange = (indicatorId: string, comment: string) => {
    setEvaluationItems((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        indicatorId,
        comment,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedTeacher || !selectedYear || !selectedMonth || !user?.username) {
      toast.error("لطفاً معلم و ماه ارزیابی را انتخاب کنید");
      return;
    }

    if (indicators.length === 0) {
      toast.error("هیچ شاخص ارزیابی فعالی یافت نشد");
      return;
    }

    setSaving(true);
    try {
      const evaluationMonth = `${selectedYear}/${selectedMonth}`;
      // For admin users, prefix assessorCode with "admin_" to distinguish from teachers
      const assessorCode = user.userType === "school" ? `admin_${user.username}` : user.username;
      const evaluationData: Evaluation = {
        ...(existingEvaluation?._id && { _id: existingEvaluation._id }),
        data: {
          teacherCode: selectedTeacher.data.teacherCode,
          assessorCode,
          evaluationMonth,
          items: Object.values(evaluationItems),
        },
      };

      const url = existingEvaluation?._id
        ? `/api/evaluation/update`
        : `/api/evaluation/create`;
      const method = existingEvaluation?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(evaluationData),
      });

      if (response.ok) {
        const data = await response.json();
        setExistingEvaluation(data.evaluation);
        toast.success(
          existingEvaluation?._id
            ? "ارزیابی با موفقیت به‌روزرسانی شد"
            : "ارزیابی با موفقیت ثبت شد"
        );
        // Reload history to update the chart
        if (selectedTeacher) {
          loadEvaluationHistory(selectedTeacher.data.teacherCode);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "خطا در ذخیره ارزیابی");
      }
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("خطا در ذخیره ارزیابی");
    } finally {
      setSaving(false);
    }
  };

  const sortedIndicators = useMemo(() => {
    return [...indicators].sort((a, b) => {
      const orderA = a.data?.order || 0;
      const orderB = b.data?.order || 0;
      return orderA - orderB;
    });
  }, [indicators]);

  // Group indicators by category
  const groupedIndicators = useMemo(() => {
    const groups: Record<string, EvaluationIndicator[]> = {};
    
    sortedIndicators.forEach((indicator) => {
      const category = indicator.data?.category || "general";
      const categoryKey = category || "general";
      
      if (!groups[categoryKey]) {
        groups[categoryKey] = [];
      }
      groups[categoryKey].push(indicator);
    });

    // Sort categories: first show categories with labels, then "general" or uncategorized
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      // Put "general" at the end
      if (a === "general") return 1;
      if (b === "general") return -1;
      // Sort alphabetically by label
      const labelA = CATEGORY_LABELS[a] || a;
      const labelB = CATEGORY_LABELS[b] || b;
      return labelA.localeCompare(labelB, "fa");
    });

    return sortedCategories.map((category) => ({
      category,
      label: CATEGORY_LABELS[category] || category || "عمومی",
      indicators: groups[category],
    }));
  }, [sortedIndicators]);

  // Calculate real-time total score and max score
  const scoreSummary = useMemo(() => {
    let totalScore = 0;
    let maxScore = 0;

    sortedIndicators.forEach((indicator) => {
      const item = evaluationItems[indicator._id];
      // Ensure values are numbers, not strings
      const score = Number(item?.score) || 0;
      const max = Number(indicator.data?.maxScore) || 0;

      totalScore += score;
      maxScore += max;
    });

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    return {
      totalScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
      maxScore: Math.round(maxScore * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
    };
  }, [sortedIndicators, evaluationItems]);

  // Format chart data for display
  const chartData = useMemo(() => {
    return monthlyHistory.map((item) => {
      // Parse month (format: YYYY/MM) and convert to Persian month name
      const [year, month] = item.month.split("/");
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = PERSIAN_MONTHS[monthIndex]?.label || month;
      const displayLabel = `${monthName} ${year}`;

      return {
        month: item.month,
        displayLabel,
        totalScore: item.totalScore,
        evaluationId: item.evaluationId,
      };
    });
  }, [monthlyHistory]);

  if (isLoading || checkingAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have permission
  if (hasAccess === false) {
    return (
      <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
        <div className="max-w-7xl mx-auto px-4">
          <PageHeader
            title="ارزیابی عملکرد معلمان"
            subtitle="ارزیابی عملکرد معلمان بر اساس شاخص‌های تعریف شده"
            icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
            gradient={true}
          />
          <div className="mt-8 bg-white rounded-xl shadow-md p-8">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-12 h-12 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                دسترسی محدود شده است
              </h2>
             
              <Button
                onClick={() => router.push("/admin/dashboard")}
                className="mt-4"
                size="lg"
              >
                بازگشت به داشبورد
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title="ارزیابی عملکرد معلمان"
          subtitle="ارزیابی عملکرد معلمان بر اساس شاخص‌های تعریف شده"
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          gradient={true}
        />

        <div className="mt-8 bg-white rounded-xl shadow-md p-6 sm:p-8 space-y-6">
          {/* Teacher Selection */}
          <div className="space-y-2">
            <Label htmlFor="teacher-search">جستجو و انتخاب معلم</Label>
            <div className="relative">
              <Input
                id="teacher-search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.length < 2) {
                    setSelectedTeacher(null);
                  }
                }}
                placeholder="نام یا کد معلم را وارد کنید..."
                className="w-full text-right"
                dir="rtl"
              />
              {showTeacherDropdown && teachers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {teachers.map((teacher) => (
                    <button
                      key={teacher._id}
                      onClick={() => handleTeacherSelect(teacher)}
                      className="w-full px-4 py-3 text-right hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium text-gray-900">
                        {teacher.data.teacherName}{" "}
                        {teacher.data.teacherFamily || ""}
                      </div>
                      <div className="text-sm text-gray-500">
                        کد: {teacher.data.teacherCode}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedTeacher && (
              <div className="mt-2 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-gray-700">
                    معلم انتخاب شده:{" "}
                    <span className="font-semibold text-blue-700">
                      {selectedTeacher.data.teacherName}{" "}
                      {selectedTeacher.data.teacherFamily || ""}
                    </span>
                    <span className="text-gray-500 mr-2">
                      (کد: {selectedTeacher.data.teacherCode})
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year-select" className="text-sm font-semibold text-gray-700">
                سال ارزیابی
              </Label>
              <Input
                id="year-select"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                placeholder="مثال: 1403"
                min="1400"
                max="1500"
                className="text-right text-lg font-medium"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month-select" className="text-sm font-semibold text-gray-700">
                ماه ارزیابی
              </Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select" dir="rtl" className="text-lg font-medium">
                  <SelectValue placeholder="انتخاب ماه" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {PERSIAN_MONTHS.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Evaluation History Chart */}
          {selectedTeacher && (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  روند ارزیابی‌های قبلی
                </h3>
                <p className="text-sm text-gray-500">
                  نمودار مجموع نمرات در ماه‌های مختلف
                </p>
              </div>
              {loadingHistory ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600">در حال بارگذاری...</p>
                  </div>
                </div>
              ) : monthlyHistory.length > 0 ? (
                <div className="h-64 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayLabel"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        label={{
                          value: "مجموع نمرات",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fill: "#6b7280", fontSize: "12px" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value: number) => [
                          `${value.toFixed(2)}`,
                          "مجموع نمرات",
                        ]}
                        labelFormatter={(label: string) => `ماه: ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        formatter={() => "مجموع نمرات"}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalScore"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2 }}
                        activeDot={{ r: 8, stroke: "#3b82f6", strokeWidth: 2 }}
                        name="مجموع نمرات"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">
                      هنوز ارزیابی‌ای برای این معلم ثبت نشده است
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evaluation Table */}
          {selectedTeacher && selectedYear && selectedMonth && (
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">در حال بارگذاری...</p>
                </div>
              ) : indicators.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هیچ شاخص ارزیابی فعالی برای این ماه یافت نشد
                </div>
              ) : (
                <>
                  <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        شاخص‌های ارزیابی
                      </h3>
                      {existingEvaluation && (
                        <p className="text-sm text-gray-500 mt-1">
                          ارزیابی موجود بارگذاری شد - می‌توانید آن را ویرایش کنید
                        </p>
                      )}
                    </div>
                    
                    {/* Real-time Score Summary Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm min-w-[280px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          مجموع نمرات:
                        </span>
                        <span className="text-2xl font-bold text-blue-700">
                          {scoreSummary.totalScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          از حداکثر:
                        </span>
                        <span className="text-lg font-semibold text-gray-600">
                          {scoreSummary.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${
                            scoreSummary.percentage >= 80
                              ? "bg-green-500"
                              : scoreSummary.percentage >= 60
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${Math.min(scoreSummary.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">درصد:</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {scoreSummary.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead className="max-w-[300px] text-right">
                            نام شاخص
                          </TableHead>
                          <TableHead className="w-24 text-center">
                            حداکثر نمره
                          </TableHead>
                          <TableHead className="w-32 text-center">نمره</TableHead>
                          <TableHead className="text-right">توضیحات/نظرات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedIndicators.map((group, groupIndex) => {
                          let globalIndex = 0;
                          // Calculate global index for this group
                          for (let i = 0; i < groupIndex; i++) {
                            globalIndex += groupedIndicators[i].indicators.length;
                          }
                          
                          return (
                            <React.Fragment key={group.category}>
                              {/* Category Header Row */}
                              <TableRow className="bg-blue-50 hover:bg-blue-100">
                                <TableCell colSpan={5} className="py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                    <h4 className="font-bold text-lg text-blue-900">
                                      {group.label}
                                    </h4>
                                    <span className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                                      {group.indicators.length} شاخص
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {/* Indicators in this category */}
                              {group.indicators.map((indicator, localIndex) => {
                                const item =
                                  evaluationItems[indicator._id] ||
                                  ({
                                    indicatorId: indicator._id,
                                    score: 0,
                                    comment: "",
                                  } as EvaluationItem);
                                const itemScore = Number(item.score) || 0;
                                const currentIndex = globalIndex + localIndex;
                                
                                return (
                                  <TableRow 
                                    key={indicator._id}
                                    className="hover:bg-gray-50 transition-colors"
                                  >
                                    <TableCell className="text-center">
                                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                                        {currentIndex + 1}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right max-w-[300px]">
                                      <div className="truncate">
                                        <div style={{textWrap: "wrap"}} className="font-semibold text-gray-900 " title={indicator.data.indicatorName}>
                                          {indicator.data.indicatorName}
                                        </div>
                                        {indicator.data.description && (
                                          <div className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2" title={indicator.data.description}>
                                            {indicator.data.description}
                                          </div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center w-24">
                                      <span className="font-medium">{indicator.data.maxScore}</span>
                                    </TableCell>
                                    <TableCell className="text-center w-32">
                                      <div className="flex items-center justify-center gap-1">
                                        <div className="relative">
                                          <Input
                                            type="number"
                                            min="0"
                                            max={indicator.data.maxScore}
                                            value={itemScore}
                                            onChange={(e) =>
                                              handleScoreChange(
                                                indicator._id,
                                                e.target.value
                                              )
                                            }
                                            className={`w-20 text-right font-semibold text-base ${
                                              itemScore >= indicator.data.maxScore * 0.8
                                                ? "border-green-400 bg-green-50"
                                                : itemScore >= indicator.data.maxScore * 0.6
                                                ? "border-yellow-400 bg-yellow-50"
                                                : itemScore > 0
                                                ? "border-orange-400 bg-orange-50"
                                                : ""
                                            }`}
                                            dir="rtl"
                                          />
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">
                                          /{indicator.data.maxScore}
                                        </span>
                                      </div>
                                      {itemScore > indicator.data.maxScore && (
                                        <p className="text-xs text-red-500 mt-1">
                                          بیش از حد مجاز
                                        </p>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Textarea
                                        value={item.comment || ""}
                                        onChange={(e) =>
                                          handleCommentChange(
                                            indicator._id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="توضیحات یا نظرات..."
                                        rows={2}
                                        className="w-full text-right"
                                        dir="rtl"
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    {/* Score Summary Footer */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">مجموع:</span>
                        <span className="font-bold text-lg text-blue-700">
                          {scoreSummary.totalScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">از</span>
                        <span className="font-semibold text-gray-700">
                          {scoreSummary.maxScore}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">درصد:</span>
                        <span
                          className={`font-bold ${
                            scoreSummary.percentage >= 80
                              ? "text-green-600"
                              : scoreSummary.percentage >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {scoreSummary.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      size="lg"
                      className="min-w-[150px] bg-blue-600 hover:bg-blue-700"
                    >
                      {saving
                        ? "در حال ذخیره..."
                        : existingEvaluation?._id
                        ? "به‌روزرسانی ارزیابی"
                        : "ذخیره ارزیابی"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

