"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Types
interface Question {
  _id: string;
  id: number;
  grade: number;
  question: string;
  questionkey: string;
  cat: string;
  cat1: string;
  cat2: string;
  cat3: string;
  cat4: string;
  difficulty: string;
  type: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option1image?: string;
  option2image?: string;
  option3image?: string;
  option4image?: string;
  correctoption?: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface Categories {
  grades: number[];
  cat1: string[];
  cat2: string[];
  cat3: string[];
  cat4: string[];
}

// Add a utility function to convert numbers to Persian
const toPersianNumber = (num: number): string => {
  if (!num) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

export default function QuestionBankPage() {
  // State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [categories, setCategories] = useState<Categories>({
    grades: [],
    cat1: [],
    cat2: [],
    cat3: [],
    cat4: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    grade: "",
    cat1: "",
    cat2: "",
    cat3: "",
    cat4: "",
    difficulty: "",
    type: "",
  });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );
  const [showQuestionDetail, setShowQuestionDetail] = useState<boolean>(false);

  // Router and search params
  const router = useRouter();
  const searchParams = useSearchParams();

  // Apply URL parameters to filters on component mount
  useEffect(() => {
    const page = searchParams.get("page") || "1";
    const grade = searchParams.get("grade") || "";
    const cat1 = searchParams.get("cat1") || "";
    const cat2 = searchParams.get("cat2") || "";
    const cat3 = searchParams.get("cat3") || "";
    const cat4 = searchParams.get("cat4") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const type = searchParams.get("type") || "";

    setFilters({ grade, cat1, cat2, cat3, cat4, difficulty, type });

    fetchQuestions(parseInt(page, 10), {
      grade,
      cat1,
      cat2,
      cat3,
      cat4,
      difficulty,
      type,
    });
    fetchCategories({ grade, cat1, cat2, cat3, cat4, difficulty, type });
  }, [searchParams]);

  // Fetch questions with pagination and filters
  const fetchQuestions = async (page: number, filterParams = filters) => {
    setLoading(true);
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("limit", "10");

      if (filterParams.grade) queryParams.append("grade", filterParams.grade);
      if (filterParams.cat1) queryParams.append("cat1", filterParams.cat1);
      if (filterParams.cat2) queryParams.append("cat2", filterParams.cat2);
      if (filterParams.cat3) queryParams.append("cat3", filterParams.cat3);
      if (filterParams.cat4) queryParams.append("cat4", filterParams.cat4);
      if (filterParams.difficulty)
        queryParams.append("difficulty", filterParams.difficulty);
      if (filterParams.type) queryParams.append("type", filterParams.type);

      const response = await fetch(
        `/api/questionbank?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }

      const data = await response.json();
      setQuestions(data.questions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for filters
  const fetchCategories = async (filterParams = filters) => {
    try {
      // Build query string for category dependencies
      const queryParams = new URLSearchParams();

      if (filterParams.grade) queryParams.append("grade", filterParams.grade);
      if (filterParams.cat1) queryParams.append("cat1", filterParams.cat1);
      if (filterParams.cat2) queryParams.append("cat2", filterParams.cat2);
      if (filterParams.cat3) queryParams.append("cat3", filterParams.cat3);
      if (filterParams.cat4) queryParams.append("cat4", filterParams.cat4);
      if (filterParams.difficulty)
        queryParams.append("difficulty", filterParams.difficulty);
      if (filterParams.type) queryParams.append("type", filterParams.type);

      const response = await fetch(
        `/api/questionbank/categories?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Apply filters
  const applyFilters = () => {
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", "1");

    if (filters.grade) queryParams.append("grade", filters.grade);
    if (filters.cat1) queryParams.append("cat1", filters.cat1);
    if (filters.cat2) queryParams.append("cat2", filters.cat2);
    if (filters.cat3) queryParams.append("cat3", filters.cat3);
    if (filters.cat4) queryParams.append("cat4", filters.cat4);
    if (filters.difficulty)
      queryParams.append("difficulty", filters.difficulty);
    if (filters.type) queryParams.append("type", filters.type);

    // Update URL and trigger data fetch
    router.push(`/admin/questionbank?${queryParams.toString()}`);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      grade: "",
      cat1: "",
      cat2: "",
      cat3: "",
      cat4: "",
      difficulty: "",
      type: "",
    });

    router.push("/admin/questionbank");
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };

    // Reset dependent filters
    if (field === "grade") {
      newFilters.cat1 = "";
      newFilters.cat2 = "";
      newFilters.cat3 = "";
      newFilters.cat4 = "";
      fetchCategories({ ...newFilters });
    } else if (field === "cat1") {
      newFilters.cat2 = "";
      newFilters.cat3 = "";
      newFilters.cat4 = "";
      fetchCategories({ ...newFilters });
    } else if (field === "cat2") {
      newFilters.cat3 = "";
      newFilters.cat4 = "";
      fetchCategories({ ...newFilters });
    } else if (field === "cat3") {
      newFilters.cat4 = "";
      fetchCategories({ ...newFilters });
    }

    setFilters(newFilters);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    queryParams.set("page", newPage.toString());
    router.push(`/admin/questionbank?${queryParams.toString()}`);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const { page, pages } = pagination;
    const items = [];

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => page > 1 && handlePageChange(page - 1)}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          قبلی
        </PaginationPrevious>
      </PaginationItem>
    );

    // First page
    if (pages > 0) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink
            isActive={page === 1}
            onClick={() => handlePageChange(1)}
          >
            {toPersianNumber(1)}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis after first page
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }

    // Pages around current
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(pages - 1, page + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
          >
            {toPersianNumber(i)}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis before last page
    if (page < pages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <span className="flex h-9 w-9 items-center justify-center">...</span>
        </PaginationItem>
      );
    }

    // Last page
    if (pages > 1) {
      items.push(
        <PaginationItem key={pages}>
          <PaginationLink
            isActive={page === pages}
            onClick={() => handlePageChange(pages)}
          >
            {toPersianNumber(pages)}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => page < pages && handlePageChange(page + 1)}
          className={page >= pages ? "pointer-events-none opacity-50" : ""}
        >
          بعدی
        </PaginationNext>
      </PaginationItem>
    );

    return items;
  };

  // Render HTML content safely
  const renderHTML = (html: string) => {
    return { __html: html };
  };

  // Add a function to handle row click to show question details
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionDetail(true);
  };

  return (
    <div dir="rtl" className="container mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">بانک سوالات</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">تعداد کل:</span>
          <span className="font-bold">{toPersianNumber(pagination.total)}</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">فیلترها</CardTitle>
          <CardDescription>
            سوالات را بر اساس پایه و دسته‌بندی فیلتر کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
            {/* Grade Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">پایه تحصیلی</label>
              <Select
                value={filters.grade}
                onValueChange={(value) => handleFilterChange("grade", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب پایه" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  {categories.grades.map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      پایه {toPersianNumber(grade)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cat1 Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">درس</label>
              <Select
                value={filters.cat1}
                onValueChange={(value) => handleFilterChange("cat1", value)}
                disabled={!filters.grade}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب درس" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  {categories.cat1.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cat2 Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">فصل</label>
              <Select
                value={filters.cat2}
                onValueChange={(value) => handleFilterChange("cat2", value)}
                disabled={!filters.cat1}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب فصل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  {categories.cat2.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cat3 Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">بخش</label>
              <Select
                value={filters.cat3}
                onValueChange={(value) => handleFilterChange("cat3", value)}
                disabled={!filters.cat2}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب بخش" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  {categories.cat3.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cat4 Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">موضوع</label>
              <Select
                value={filters.cat4}
                onValueChange={(value) => handleFilterChange("cat4", value)}
                disabled={!filters.cat3 || categories.cat4.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب موضوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  {categories.cat4.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">سطح سختی</label>
              <Select
                value={filters.difficulty || ""}
                onValueChange={(value) =>
                  handleFilterChange("difficulty", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب سختی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  <SelectItem value=" آسان ">آسان</SelectItem>
                  <SelectItem value=" متوسط ">متوسط</SelectItem>
                  <SelectItem value=" سخت ">سخت</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium">نوع سوال</label>
              <Select
                value={filters.type || ""}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">همه</SelectItem>
                  <SelectItem value=" تستی ">تستی</SelectItem>
                  <SelectItem value=" تشریحی ">تشریحی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetFilters}>
              <X className="h-4 w-4 ml-2" />
              حذف فیلترها
            </Button>
            <Button onClick={applyFilters}>
              <Filter className="h-4 w-4 ml-2" />
              اعمال فیلترها
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">سوالات</CardTitle>
          <CardDescription>لیست سوالات با امکان مشاهده جزئیات</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ سوالی با این فیلترها یافت نشد
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">شماره</TableHead>
                      <TableHead className="w-20">پایه</TableHead>
                      <TableHead>سوال</TableHead>
                      <TableHead className="w-24">درس</TableHead>
                      <TableHead className="w-20">نوع</TableHead>
                      <TableHead className="w-20">سختی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question) => (
                      <TableRow
                        key={question._id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleQuestionClick(question)}
                      >
                        <TableCell className="font-medium">
                          {question.id}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {toPersianNumber(question.grade)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {/* Category breadcrumb */}
                          <div className="flex items-center flex-wrap text-[9px] text-gray-500 mb-1 gap-1">
                            {question.cat && (
                              <>
                                <span>{question.cat}</span>
                                <span>›</span>
                              </>
                            )}
                            {question.cat1 && (
                              <>
                                <span>{question.cat1}</span>
                                {question.cat2 && <span>›</span>}
                              </>
                            )}
                            {question.cat2 && (
                              <>
                                <span>{question.cat2}</span>
                                {question.cat3 && <span>›</span>}
                              </>
                            )}
                            {question.cat3 && (
                              <>
                                <span>{question.cat3}</span>
                                {question.cat4 && <span>›</span>}
                              </>
                            )}
                            {question.cat4 && <span>{question.cat4}</span>}
                          </div>

                          <div
                            className="line-clamp-2 text-sm"
                            dangerouslySetInnerHTML={renderHTML(
                              question.question
                            )}
                          />
                          {question.type?.includes("تستی") && (
                            <div className="mt-1 grid grid-cols-2 gap-1">
                              {question.option1 && (
                                <div className="text-[10px] text-gray-600 flex items-start">
                                  <span
                                    className={`min-w-4 h-4 rounded-full ${
                                      question.correctoption === 1
                                        ? "bg-green-600/70"
                                        : "bg-primary/20"
                                    } ${
                                      question.correctoption === 1
                                        ? "text-white"
                                        : "text-primary"
                                    } flex items-center justify-center text-[10px] ml-1`}
                                  >
                                    ۱
                                  </span>
                                  <div
                                    className="truncate max-w-[90%] text-xs"
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.option1
                                    )}
                                  />
                                </div>
                              )}
                              {question.option2 && (
                                <div className="text-[10px] text-gray-600 flex items-start">
                                  <span
                                    className={`min-w-4 h-4 rounded-full ${
                                      question.correctoption === 2
                                        ? "bg-green-600/70"
                                        : "bg-primary/20"
                                    } ${
                                      question.correctoption === 2
                                        ? "text-white"
                                        : "text-primary"
                                    } flex items-center justify-center text-[10px] ml-1`}
                                  >
                                    ۲
                                  </span>
                                  <div
                                    className="truncate max-w-[90%] text-xs"
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.option2
                                    )}
                                  />
                                </div>
                              )}
                              {question.option3 && (
                                <div className="text-[10px] text-gray-600 flex items-start">
                                  <span
                                    className={`min-w-4 h-4 rounded-full ${
                                      question.correctoption === 3
                                        ? "bg-green-600/70"
                                        : "bg-primary/20"
                                    } ${
                                      question.correctoption === 3
                                        ? "text-white"
                                        : "text-primary"
                                    } flex items-center justify-center text-[10px] ml-1`}
                                  >
                                    ۳
                                  </span>
                                  <div
                                    className="truncate max-w-[90%] text-xs"
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.option3
                                    )}
                                  />
                                </div>
                              )}
                              {question.option4 && (
                                <div className="text-[10px] text-gray-600 flex items-start">
                                  <span
                                    className={`min-w-4 h-4 rounded-full ${
                                      question.correctoption === 4
                                        ? "bg-green-600/70"
                                        : "bg-primary/20"
                                    } ${
                                      question.correctoption === 4
                                        ? "text-white"
                                        : "text-primary"
                                    } flex items-center justify-center text-[10px] ml-1`}
                                  >
                                    ۴
                                  </span>
                                  <div
                                    className="truncate max-w-[90%] text-xs"
                                    dangerouslySetInnerHTML={renderHTML(
                                      question.option4
                                    )}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {question.cat1}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="secondary">{question.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge
                            variant={
                              question.difficulty?.includes("سخت")
                                ? "destructive"
                                : question.difficulty?.includes("متوسط")
                                ? "secondary"
                                : "outline"
                            }
                            className="whitespace-nowrap"
                          >
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 0 && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="text-sm text-gray-500 mb-2">
                    صفحه {toPersianNumber(pagination.page)} از{" "}
                    {toPersianNumber(pagination.pages)} - نمایش{" "}
                    {toPersianNumber(
                      (pagination.page - 1) * pagination.limit + 1
                    )}{" "}
                    تا{" "}
                    {toPersianNumber(
                      Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )
                    )}{" "}
                    از {toPersianNumber(pagination.total)} سوال
                  </div>
                  <Pagination>
                    <PaginationContent>
                      {getPaginationItems()}
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Question Detail Dialog */}
      <Dialog open={showQuestionDetail} onOpenChange={setShowQuestionDetail}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between">
              <span>
                سوال شماره{" "}
                {selectedQuestion && toPersianNumber(selectedQuestion.id)}
              </span>
              <Badge
                variant={
                  selectedQuestion?.difficulty?.includes("سخت")
                    ? "destructive"
                    : selectedQuestion?.difficulty?.includes("متوسط")
                    ? "secondary"
                    : "outline"
                }
              >
                {selectedQuestion?.difficulty}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-sm">
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="font-semibold">پایه:</span>{" "}
                  {selectedQuestion && toPersianNumber(selectedQuestion.grade)}
                </div>
                <div>
                  <span className="font-semibold">نوع:</span>{" "}
                  {selectedQuestion?.type}
                </div>
                <div>
                  <span className="font-semibold">درس:</span>{" "}
                  {selectedQuestion?.cat1}
                </div>
                <div>
                  <span className="font-semibold">فصل:</span>{" "}
                  {selectedQuestion?.cat2}
                </div>
                {selectedQuestion?.cat3 && (
                  <div>
                    <span className="font-semibold">بخش:</span>{" "}
                    {selectedQuestion.cat3}
                  </div>
                )}
                {selectedQuestion?.cat4 && (
                  <div>
                    <span className="font-semibold">موضوع:</span>{" "}
                    {selectedQuestion.cat4}
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* Category breadcrumb path */}
          {selectedQuestion && (
            <div className="flex items-center flex-wrap text-sm text-gray-500 mb-4">
              {selectedQuestion.cat && (
                <>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {selectedQuestion.cat}
                  </span>
                  <span className="mx-1">›</span>
                </>
              )}
              {selectedQuestion.cat1 && (
                <>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {selectedQuestion.cat1}
                  </span>
                  {selectedQuestion.cat2 && <span className="mx-1">›</span>}
                </>
              )}
              {selectedQuestion.cat2 && (
                <>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {selectedQuestion.cat2}
                  </span>
                  {selectedQuestion.cat3 && <span className="mx-1">›</span>}
                </>
              )}
              {selectedQuestion.cat3 && (
                <>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    {selectedQuestion.cat3}
                  </span>
                  {selectedQuestion.cat4 && <span className="mx-1">›</span>}
                </>
              )}
              {selectedQuestion.cat4 && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {selectedQuestion.cat4}
                </span>
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">متن سوال:</div>
            <div className="p-4 border rounded-md bg-slate-50">
              {selectedQuestion && (
                <div
                  className="text-base"
                  dangerouslySetInnerHTML={renderHTML(
                    selectedQuestion.question
                  )}
                />
              )}
            </div>

            {/* Show options for multiple choice questions */}
            {selectedQuestion?.type?.includes("تستی") && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {selectedQuestion.option1 && (
                  <div
                    className={`p-3 border rounded-md hover:bg-slate-100 ${
                      selectedQuestion.correctoption === 1
                        ? "bg-green-50 border-green-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full ${
                          selectedQuestion.correctoption === 1
                            ? "bg-green-600"
                            : "bg-primary"
                        } text-white flex items-center justify-center text-xs ml-2`}
                      >
                        ۱
                      </span>
                      <div
                        className="text-base"
                        dangerouslySetInnerHTML={renderHTML(
                          selectedQuestion.option1
                        )}
                      />
                    </div>
                    {selectedQuestion.option1image && (
                      <div className="mt-2">
                        <img
                          src={selectedQuestion.option1image}
                          alt="گزینه 1"
                          className="max-h-20 rounded"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedQuestion.option2 && (
                  <div
                    className={`p-3 border rounded-md hover:bg-slate-100 ${
                      selectedQuestion.correctoption === 2
                        ? "bg-green-50 border-green-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full ${
                          selectedQuestion.correctoption === 2
                            ? "bg-green-600"
                            : "bg-primary"
                        } text-white flex items-center justify-center text-xs ml-2`}
                      >
                        ۲
                      </span>
                      <div
                        className="text-base"
                        dangerouslySetInnerHTML={renderHTML(
                          selectedQuestion.option2
                        )}
                      />
                    </div>
                    {selectedQuestion.option2image && (
                      <div className="mt-2">
                        <img
                          src={selectedQuestion.option2image}
                          alt="گزینه 2"
                          className="max-h-20 rounded"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedQuestion.option3 && (
                  <div
                    className={`p-3 border rounded-md hover:bg-slate-100 ${
                      selectedQuestion.correctoption === 3
                        ? "bg-green-50 border-green-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full ${
                          selectedQuestion.correctoption === 3
                            ? "bg-green-600"
                            : "bg-primary"
                        } text-white flex items-center justify-center text-xs ml-2`}
                      >
                        ۳
                      </span>
                      <div
                        className="text-base"
                        dangerouslySetInnerHTML={renderHTML(
                          selectedQuestion.option3
                        )}
                      />
                    </div>
                    {selectedQuestion.option3image && (
                      <div className="mt-2">
                        <img
                          src={selectedQuestion.option3image}
                          alt="گزینه 3"
                          className="max-h-20 rounded"
                        />
                      </div>
                    )}
                  </div>
                )}

                {selectedQuestion.option4 && (
                  <div
                    className={`p-3 border rounded-md hover:bg-slate-100 ${
                      selectedQuestion.correctoption === 4
                        ? "bg-green-50 border-green-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 rounded-full ${
                          selectedQuestion.correctoption === 4
                            ? "bg-green-600"
                            : "bg-primary"
                        } text-white flex items-center justify-center text-xs ml-2`}
                      >
                        ۴
                      </span>
                      <div
                        className="text-base"
                        dangerouslySetInnerHTML={renderHTML(
                          selectedQuestion.option4
                        )}
                      />
                    </div>
                    {selectedQuestion.option4image && (
                      <div className="mt-2">
                        <img
                          src={selectedQuestion.option4image}
                          alt="گزینه 4"
                          className="max-h-20 rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedQuestion?.questionkey && (
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">پاسخ سوال:</div>
              <div className="p-4 border rounded-md bg-slate-50">
                <div
                  className="text-base"
                  dangerouslySetInnerHTML={renderHTML(
                    selectedQuestion.questionkey
                  )}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
