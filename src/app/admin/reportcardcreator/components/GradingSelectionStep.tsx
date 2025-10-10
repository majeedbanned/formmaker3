"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Search,
  Calendar,
  User,
  Users,
  BookOpen,
  TrendingUp,
  Loader2,
  CheckCircle,
  X,
  Plus,
  Minus,
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { faIR } from "date-fns/locale";

// Persian digit conversion function
const toPersianDigits = (input: string | number): string => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(
    /[0-9]/g,
    (digit) => persianDigits[parseInt(digit)]
  );
};

interface GradeListItem {
  _id: string;
  title: string;
  className: string;
  courseName: string;
  teacherName?: string;
  gradingType: "numerical" | "descriptive";
  statistics?: {
    average?: number;
    total: number;
  };
  createdAt: string;
  classData?: {
    data?: {
      className?: string;
    };
  };
  subjectData?: {
    courseName?: string;
  };
}

interface SelectedGrading {
  _id: string;
  title: string;
  date?: string;
  gradingType: "numerical" | "descriptive";
  grades: {
    [studentCode: string]: {
      score?: number;
      descriptiveText?: string;
      studentName: string;
    };
  };
  statistics?: {
    average?: number;
    highest?: number;
    lowest?: number;
    total: number;
  };
  classData?: {
    data?: {
      className?: string;
    };
  };
  subjectData?: {
    courseName?: string;
    courseCode?: string;
    Grade?: string;
    vahed?: number;
    major?: string;
  };
}

interface GradingSelectionStepProps {
  userType: "teacher" | "school";
  userCode?: string;
  schoolCode: string;
  selectedGradings: SelectedGrading[];
  onGradingsSelect: (gradings: SelectedGrading[]) => void;
  isAdminTeacher?: boolean;
}

type SortField =
  | "title"
  | "className"
  | "courseName"
  | "teacherName"
  | "createdAt"
  | "average"
  | "total";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

export function GradingSelectionStep({
  userType,
  userCode,
  schoolCode,
  selectedGradings,
  onGradingsSelect,
  isAdminTeacher = false,
}: GradingSelectionStepProps) {
  const [gradeLists, setGradeLists] = useState<GradeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedGradingType, setSelectedGradingType] = useState("");
  const [error, setError] = useState("");

  // Advanced features
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [averageRange, setAverageRange] = useState({ min: "", max: "" });
  const [totalRange, setTotalRange] = useState({ min: "", max: "" });
  const [compactMode, setCompactMode] = useState(false);
  const [showStatistics, setShowStatistics] = useState(true);
  const [bulkSelecting, setBulkSelecting] = useState(false);

  // Filter options
  const [teachers, setTeachers] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchGradeLists();
  }, [userType, userCode, schoolCode, isAdminTeacher]);

  useEffect(() => {
    // Extract unique filter options from grade lists
    if (gradeLists.length > 0) {
      const uniqueTeachers = [
        ...new Set(
          gradeLists
            .map((gl) => gl.teacherName)
            .filter((name): name is string => Boolean(name))
        ),
      ];
      const uniqueClasses = [
        ...new Set(gradeLists.map((gl) => gl.className).filter(Boolean)),
      ];
      const uniqueCourses = [
        ...new Set(gradeLists.map((gl) => gl.courseName).filter(Boolean)),
      ];

      setTeachers(uniqueTeachers);
      setClasses(uniqueClasses);
      setCourses(uniqueCourses);
    }
  }, [gradeLists]);

  const fetchGradeLists = async () => {
    try {
      setLoading(true);

      // Admin teachers don't pass teacherCode to see all grade lists
      const params = new URLSearchParams({
        schoolCode,
        ...(userType === "teacher" && !isAdminTeacher && userCode && { teacherCode: userCode }),
      });

      const response = await fetch(`/api/gradingsystem/grade-lists?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch grade lists");
      }

      const data = await response.json();
      setGradeLists(data.gradeLists || []);
    } catch (error) {
      console.error("Error fetching grade lists:", error);
      setError("خطا در دریافت فهرست نمرات");
    } finally {
      setLoading(false);
    }
  };

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedTeacher("");
    setSelectedClass("");
    setSelectedCourse("");
    setSelectedGradingType("");
    setDateRange({ from: "", to: "" });
    setAverageRange({ min: "", max: "" });
    setTotalRange({ min: "", max: "" });
    setCurrentPage(1);
  }, []);

  const filteredAndSortedGradeLists = useMemo(() => {
    let filtered = gradeLists.filter((gradeList) => {
      const matchesSearch =
        gradeList.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gradeList.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gradeList.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gradeList.teacherName &&
          gradeList.teacherName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesTeacher =
        !selectedTeacher || gradeList.teacherName === selectedTeacher;
      const matchesClass =
        !selectedClass || gradeList.className === selectedClass;
      const matchesCourse =
        !selectedCourse || gradeList.courseName === selectedCourse;
      const matchesGradingType =
        !selectedGradingType ||
        (gradeList.gradingType || "numerical") === selectedGradingType;

      // Date range filter
      const matchesDateRange = (() => {
        if (!dateRange.from && !dateRange.to) return true;
        const itemDate = new Date(gradeList.createdAt);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && itemDate < fromDate) return false;
        if (toDate && itemDate > toDate) return false;
        return true;
      })();

      // Average range filter
      const matchesAverageRange = (() => {
        if (!averageRange.min && !averageRange.max) return true;
        if (!gradeList.statistics?.average) return false;
        const avg = gradeList.statistics.average;
        const min = averageRange.min ? parseFloat(averageRange.min) : null;
        const max = averageRange.max ? parseFloat(averageRange.max) : null;

        if (min !== null && avg < min) return false;
        if (max !== null && avg > max) return false;
        return true;
      })();

      // Total range filter
      const matchesTotalRange = (() => {
        if (!totalRange.min && !totalRange.max) return true;
        if (!gradeList.statistics?.total) return false;
        const total = gradeList.statistics.total;
        const min = totalRange.min ? parseInt(totalRange.min) : null;
        const max = totalRange.max ? parseInt(totalRange.max) : null;

        if (min !== null && total < min) return false;
        if (max !== null && total > max) return false;
        return true;
      })();

      return (
        matchesSearch &&
        matchesTeacher &&
        matchesClass &&
        matchesCourse &&
        matchesGradingType &&
        matchesDateRange &&
        matchesAverageRange &&
        matchesTotalRange
      );
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "title":
          aValue = a.title;
          bValue = b.title;
          break;
        case "className":
          aValue = a.className;
          bValue = b.className;
          break;
        case "courseName":
          aValue = a.courseName;
          bValue = b.courseName;
          break;
        case "teacherName":
          aValue = a.teacherName || "";
          bValue = b.teacherName || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "average":
          aValue = a.statistics?.average || 0;
          bValue = b.statistics?.average || 0;
          break;
        case "total":
          aValue = a.statistics?.total || 0;
          bValue = b.statistics?.total || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    gradeLists,
    searchTerm,
    selectedTeacher,
    selectedClass,
    selectedCourse,
    selectedGradingType,
    dateRange,
    averageRange,
    totalRange,
    sortField,
    sortDirection,
  ]);

  const paginatedGradeLists = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedGradeLists.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredAndSortedGradeLists, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    filteredAndSortedGradeLists.length / itemsPerPage
  );

  const hasActiveFilters = useMemo(() => {
    return !!(
      selectedTeacher ||
      selectedClass ||
      selectedCourse ||
      selectedGradingType ||
      dateRange.from ||
      dateRange.to ||
      averageRange.min ||
      averageRange.max ||
      totalRange.min ||
      totalRange.max
    );
  }, [
    selectedTeacher,
    selectedClass,
    selectedCourse,
    selectedGradingType,
    dateRange,
    averageRange,
    totalRange,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleGradingToggle = async (gradeList: GradeListItem) => {
    const isSelected = selectedGradings.some((g) => g._id === gradeList._id);

    if (isSelected) {
      // Remove from selection
      const newSelection = selectedGradings.filter(
        (g) => g._id !== gradeList._id
      );
      onGradingsSelect(newSelection);
    } else {
      // Add to selection - fetch full details
      try {
        const response = await fetch(
          `/api/gradingsystem/grade-list/${gradeList._id}?schoolCode=${schoolCode}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch grade list details");
        }

        const data = await response.json();
        const fullGradeData = {
          ...data.gradeListData,
          gradingType: gradeList.gradingType || "numerical",
          statistics: gradeList.statistics,
        };

        const newSelection = [...selectedGradings, fullGradeData];
        onGradingsSelect(newSelection);
      } catch (error) {
        console.error("Error fetching grade list details:", error);
      }
    }
  };

  const selectAll = async () => {
    setBulkSelecting(true);
    const allPromises = filteredAndSortedGradeLists.map(async (gradeList) => {
      try {
        const response = await fetch(
          `/api/gradingsystem/grade-list/${gradeList._id}?schoolCode=${schoolCode}`
        );
        if (response.ok) {
          const data = await response.json();
          return {
            ...data.gradeListData,
            gradingType: gradeList.gradingType || "numerical",
            statistics: gradeList.statistics,
          };
        }
      } catch (error) {
        console.error("Error fetching grade list details:", error);
      }
      return null;
    });

    Promise.all(allPromises).then((results) => {
      const validResults = results.filter(Boolean);
      onGradingsSelect(validResults);
      setBulkSelecting(false);
    });
  };

  const selectPage = async () => {
    setBulkSelecting(true);
    const pagePromises = paginatedGradeLists.map(async (gradeList) => {
      try {
        const response = await fetch(
          `/api/gradingsystem/grade-list/${gradeList._id}?schoolCode=${schoolCode}`
        );
        if (response.ok) {
          const data = await response.json();
          return {
            ...data.gradeListData,
            gradingType: gradeList.gradingType || "numerical",
            statistics: gradeList.statistics,
          };
        }
      } catch (error) {
        console.error("Error fetching grade list details:", error);
      }
      return null;
    });

    Promise.all(pagePromises).then((results) => {
      const validResults = results.filter(Boolean);
      const newSelection = [...selectedGradings];
      validResults.forEach((result) => {
        if (!newSelection.some((g) => g._id === result._id)) {
          newSelection.push(result);
        }
      });
      onGradingsSelect(newSelection);
      setBulkSelecting(false);
    });
  };

  const clearAll = () => {
    onGradingsSelect([]);
  };

  const renderGradeCard = (gradeList: GradeListItem) => {
    const isSelected = selectedGradings.some((g) => g._id === gradeList._id);

    if (viewMode === "list") {
      return (
        <div
          key={gradeList._id}
          className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
            isSelected ? "ring-2 ring-primary bg-primary/5" : ""
          } ${compactMode ? "py-2" : ""}`}
          onClick={() => handleGradingToggle(gradeList)}
        >
          <Checkbox checked={isSelected} className="shrink-0" />

          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
            <div className="md:col-span-2">
              <div className="font-medium">{gradeList.title}</div>
              {!compactMode && (
                <div className="text-sm text-muted-foreground">
                  {format(new Date(gradeList.createdAt), "yyyy/MM/dd", {
                    locale: faIR,
                  })}
                </div>
              )}
            </div>

            <div className="text-sm">
              <div className="flex items-center">
                <Users className="h-3 w-3 ml-1" />
                {gradeList.className}
              </div>
            </div>

            <div className="text-sm">
              <div className="flex items-center">
                <BookOpen className="h-3 w-3 ml-1" />
                {gradeList.courseName}
              </div>
            </div>

            {userType === "school" && (
              <div className="text-sm">
                <div className="flex items-center">
                  <User className="h-3 w-3 ml-1" />
                  {gradeList.teacherName || "نامشخص"}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge
                variant={
                  gradeList.gradingType === "descriptive"
                    ? "secondary"
                    : "default"
                }
                className="text-xs"
              >
                {gradeList.gradingType === "descriptive" ? "توصیفی" : "نمره‌ای"}
              </Badge>

              {showStatistics && gradeList.statistics && (
                <div className="text-xs text-muted-foreground">
                  {gradeList.gradingType !== "descriptive" &&
                    gradeList.statistics.average && (
                      <span>
                        م:{" "}
                        {toPersianDigits(
                          gradeList.statistics.average.toFixed(1)
                        )}
                      </span>
                    )}
                  <span className="mr-1">
                    {toPersianDigits(gradeList.statistics.total)}{" "}
                    {gradeList.gradingType === "descriptive"
                      ? "ارزیابی"
                      : "نمره"}
                  </span>
                </div>
              )}

              {isSelected && <CheckCircle className="h-4 w-4 text-primary" />}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Card
        key={gradeList._id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? "ring-2 ring-primary bg-primary/5" : ""
        }`}
        onClick={() => handleGradingToggle(gradeList)}
      >
        <CardContent className={`${compactMode ? "p-4" : "p-6"}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Checkbox checked={isSelected} className="mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className={`font-semibold ${
                      compactMode ? "text-base" : "text-lg"
                    } truncate`}
                  >
                    {gradeList.title}
                  </h3>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 ml-2 shrink-0" />
                    <span className="truncate">{gradeList.className}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <BookOpen className="h-4 w-4 ml-2 shrink-0" />
                    <span className="truncate">{gradeList.courseName}</span>
                  </div>
                  {userType === "school" && gradeList.teacherName && (
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 ml-2 shrink-0" />
                      <span className="truncate">{gradeList.teacherName}</span>
                    </div>
                  )}
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 ml-2 shrink-0" />
                    <span>
                      {formatDistanceToNow(new Date(gradeList.createdAt), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </span>
                  </div>
                </div>

                {!compactMode && (
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge
                      variant={
                        gradeList.gradingType === "descriptive"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {gradeList.gradingType === "descriptive"
                        ? "توصیفی"
                        : "نمره‌ای"}
                    </Badge>

                    {showStatistics &&
                      gradeList.statistics &&
                      gradeList.gradingType !== "descriptive" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>
                            میانگین:{" "}
                            {toPersianDigits(
                              gradeList.statistics.average?.toFixed(1) || "0"
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {toPersianDigits(gradeList.statistics.total)} نمره
                          </span>
                        </div>
                      )}

                    {showStatistics &&
                      gradeList.statistics &&
                      gradeList.gradingType === "descriptive" && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>
                            {toPersianDigits(gradeList.statistics.total)}{" "}
                            ارزیابی
                          </span>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-3">در حال بارگذاری فهرست نمرات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchGradeLists}>تلاش مجدد</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">انتخاب نمره‌دهی‌ها</h2>
          <Badge variant="outline">
            {toPersianDigits(filteredAndSortedGradeLists.length)} از{" "}
            {toPersianDigits(gradeLists.length)} مورد
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* View Settings */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>تنظیمات نمایش</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode" className="text-sm">
                    حالت فشرده
                  </Label>
                  <Switch
                    id="compact-mode"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-stats" className="text-sm">
                    نمایش آمار
                  </Label>
                  <Switch
                    id="show-stats"
                    checked={showStatistics}
                    onCheckedChange={setShowStatistics}
                  />
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>تعداد در صفحه</DropdownMenuLabel>
              {[6, 12, 24, 48].map((count) => (
                <DropdownMenuCheckboxItem
                  key={count}
                  checked={itemsPerPage === count}
                  onCheckedChange={() => {
                    setItemsPerPage(count);
                    setCurrentPage(1);
                  }}
                >
                  {toPersianDigits(count)} مورد
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-l-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-r-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 ml-1" />
            فیلترها
            {hasActiveFilters && (
              <Badge className="mr-1 h-4 w-4 p-0 text-xs">!</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو در عنوان، کلاس، درس یا استاد..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-right"
        />
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">فیلترهای پیشرفته</CardTitle>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 ml-1" />
                  حذف همه فیلترها
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">فیلترهای اصلی</TabsTrigger>
                <TabsTrigger value="date">بازه زمانی</TabsTrigger>
                <TabsTrigger value="stats">آمار</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">استاد</Label>
                    <Select
                      value={selectedTeacher}
                      onValueChange={setSelectedTeacher}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب استاد" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher} value={teacher}>
                            {teacher}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">کلاس</Label>
                    <Select
                      value={selectedClass}
                      onValueChange={setSelectedClass}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب کلاس" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((className) => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">درس</Label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب درس" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">نوع نمره‌دهی</Label>
                    <Select
                      value={selectedGradingType}
                      onValueChange={setSelectedGradingType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="نوع نمره‌دهی" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="numerical">نمره‌ای</SelectItem>
                        <SelectItem value="descriptive">توصیفی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="date" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">از تاریخ</Label>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          from: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">تا تاریخ</Label>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) =>
                        setDateRange((prev) => ({
                          ...prev,
                          to: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      بازه میانگین نمرات
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="حداقل"
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={averageRange.min}
                        onChange={(e) =>
                          setAverageRange((prev) => ({
                            ...prev,
                            min: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="حداکثر"
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={averageRange.max}
                        onChange={(e) =>
                          setAverageRange((prev) => ({
                            ...prev,
                            max: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      بازه تعداد نمرات
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="حداقل"
                        type="number"
                        min="0"
                        value={totalRange.min}
                        onChange={(e) =>
                          setTotalRange((prev) => ({
                            ...prev,
                            min: e.target.value,
                          }))
                        }
                      />
                      <Input
                        placeholder="حداکثر"
                        type="number"
                        min="0"
                        value={totalRange.max}
                        onChange={(e) =>
                          setTotalRange((prev) => ({
                            ...prev,
                            max: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Sort and Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortDirection === "asc" ? (
                  <SortAsc className="h-4 w-4 ml-1" />
                ) : (
                  <SortDesc className="h-4 w-4 ml-1" />
                )}
                مرتب‌سازی
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>مرتب‌سازی بر اساس</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[
                { field: "createdAt" as SortField, label: "تاریخ ایجاد" },
                { field: "title" as SortField, label: "عنوان" },
                { field: "className" as SortField, label: "کلاس" },
                { field: "courseName" as SortField, label: "درس" },
                { field: "teacherName" as SortField, label: "استاد" },
                { field: "average" as SortField, label: "میانگین" },
                { field: "total" as SortField, label: "تعداد نمرات" },
              ].map(({ field, label }) => (
                <DropdownMenuItem key={field} onClick={() => handleSort(field)}>
                  {label}
                  {sortField === field &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    ))}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />

          {/* Bulk Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={selectPage}
            disabled={paginatedGradeLists.length === 0 || bulkSelecting}
          >
            {bulkSelecting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <Plus className="h-4 w-4 ml-1" />
            )}
            انتخاب صفحه ({toPersianDigits(paginatedGradeLists.length)})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={filteredAndSortedGradeLists.length === 0 || bulkSelecting}
          >
            {bulkSelecting ? (
              <Loader2 className="h-4 w-4 animate-spin ml-1" />
            ) : (
              <Plus className="h-4 w-4 ml-1" />
            )}
            انتخاب همه ({toPersianDigits(filteredAndSortedGradeLists.length)})
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={selectedGradings.length === 0}
          >
            <Minus className="h-4 w-4 ml-1" />
            حذف همه
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {toPersianDigits(selectedGradings.length)} نمره‌دهی انتخاب شده
        </div>
      </div>

      {/* Grade Lists */}
      {filteredAndSortedGradeLists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">نمره‌دهی یافت نشد</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? "نمره‌دهی با فیلترهای انتخاب شده یافت نشد."
                  : "هنوز نمره‌دهی ثبت نشده است."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearAllFilters}
                >
                  حذف فیلترها
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          }
        >
          {paginatedGradeLists.map(renderGradeCard)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)}
            ({toPersianDigits(filteredAndSortedGradeLists.length)} مورد)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              قبلی
            </Button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(
                1,
                Math.min(totalPages, currentPage - 2 + i)
              );
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {toPersianDigits(pageNum)}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              بعدی
            </Button>
          </div>
        </div>
      )}

      {/* Selected Gradings Summary */}
      {selectedGradings.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 ml-2" />
                نمره‌دهی‌های انتخاب شده (
                {toPersianDigits(selectedGradings.length)})
              </div>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {selectedGradings.map((grading) => (
                <div
                  key={grading._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{grading.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {grading.classData?.data?.className} -{" "}
                      {grading.subjectData?.courseName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        grading.gradingType === "descriptive"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {grading.gradingType === "descriptive"
                        ? "توصیفی"
                        : "نمره‌ای"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSelection = selectedGradings.filter(
                          (g) => g._id !== grading._id
                        );
                        onGradingsSelect(newSelection);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
