"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";

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
  grades: { [studentCode: string]: any };
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
  };
}

interface GradingSelectionStepProps {
  userType: "teacher" | "school";
  userCode?: string;
  schoolCode: string;
  selectedGradings: SelectedGrading[];
  onGradingsSelect: (gradings: SelectedGrading[]) => void;
}

export function GradingSelectionStep({
  userType,
  userCode,
  schoolCode,
  selectedGradings,
  onGradingsSelect,
}: GradingSelectionStepProps) {
  const [gradeLists, setGradeLists] = useState<GradeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedGradingType, setSelectedGradingType] = useState("");
  const [error, setError] = useState("");

  // Filter options
  const [teachers, setTeachers] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);

  useEffect(() => {
    fetchGradeLists();
  }, [userType, userCode, schoolCode]);

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

      const params = new URLSearchParams({
        schoolCode,
        ...(userType === "teacher" && userCode && { teacherCode: userCode }),
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

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedTeacher("");
    setSelectedClass("");
    setSelectedCourse("");
    setSelectedGradingType("");
  };

  const filteredGradeLists = gradeLists.filter((gradeList) => {
    const matchesSearch =
      gradeList.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gradeList.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gradeList.teacherName &&
        gradeList.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTeacher =
      !selectedTeacher || gradeList.teacherName === selectedTeacher;
    const matchesClass =
      !selectedClass || gradeList.className === selectedClass;
    const matchesCourse =
      !selectedCourse || gradeList.courseName === selectedCourse;
    const matchesGradingType =
      !selectedGradingType ||
      (gradeList.gradingType || "numerical") === selectedGradingType;

    return (
      matchesSearch &&
      matchesTeacher &&
      matchesClass &&
      matchesCourse &&
      matchesGradingType
    );
  });

  const hasActiveFilters =
    selectedTeacher || selectedClass || selectedCourse || selectedGradingType;

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

  const selectAll = () => {
    const allPromises = filteredGradeLists.map(async (gradeList) => {
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
    });
  };

  const clearAll = () => {
    onGradingsSelect([]);
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
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در عنوان، کلاس، درس یا استاد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-right"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="whitespace-nowrap"
            >
              <X className="h-4 w-4 ml-1" />
              حذف فیلترها
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger>
              <SelectValue placeholder="فیلتر بر اساس استاد" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher} value={teacher}>
                  {teacher}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="فیلتر بر اساس کلاس" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger>
              <SelectValue placeholder="فیلتر بر اساس درس" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

        {/* Bulk Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={filteredGradeLists.length === 0}
            >
              <Plus className="h-4 w-4 ml-1" />
              انتخاب همه ({filteredGradeLists.length})
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
            {selectedGradings.length} نمره‌دهی انتخاب شده
          </div>
        </div>
      </div>

      {/* Grade Lists */}
      {filteredGradeLists.length === 0 ? (
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGradeLists.map((gradeList) => {
            const isSelected = selectedGradings.some(
              (g) => g._id === gradeList._id
            );

            return (
              <Card
                key={gradeList._id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary bg-primary/5" : ""
                }`}
                onClick={() => handleGradingToggle(gradeList)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleGradingToggle(gradeList)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">
                            {gradeList.title}
                          </h3>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Users className="h-4 w-4 ml-2" />
                            <span>{gradeList.className}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <BookOpen className="h-4 w-4 ml-2" />
                            <span>{gradeList.courseName}</span>
                          </div>
                          {userType === "school" && gradeList.teacherName && (
                            <div className="flex items-center text-muted-foreground">
                              <User className="h-4 w-4 ml-2" />
                              <span>{gradeList.teacherName}</span>
                            </div>
                          )}
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 ml-2" />
                            <span>
                              {formatDistanceToNow(
                                new Date(gradeList.createdAt),
                                {
                                  addSuffix: true,
                                  locale: faIR,
                                }
                              )}
                            </span>
                          </div>
                        </div>

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

                          {gradeList.statistics &&
                            gradeList.gradingType !== "descriptive" && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <TrendingUp className="h-4 w-4" />
                                <span>
                                  میانگین:{" "}
                                  {gradeList.statistics.average?.toFixed(1)}
                                </span>
                                <span>•</span>
                                <span>{gradeList.statistics.total} نمره</span>
                              </div>
                            )}

                          {gradeList.statistics &&
                            gradeList.gradingType === "descriptive" && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4" />
                                <span>
                                  {gradeList.statistics.total} ارزیابی
                                </span>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Gradings Summary */}
      {selectedGradings.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg text-primary flex items-center">
              <CheckCircle className="h-5 w-5 ml-2" />
              نمره‌دهی‌های انتخاب شده ({selectedGradings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {selectedGradings.map((grading) => (
                <div
                  key={grading._id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{grading.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {grading.classData?.data?.className} -{" "}
                      {grading.subjectData?.courseName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
