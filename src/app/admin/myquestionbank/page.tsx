"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import {
  RefreshCw,
  Filter,
  X,
  Plus,
  Edit,
  Trash2,
  ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MathJax } from "better-react-mathjax";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/rich-text-editor";

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

interface ExamQuestion {
  _id: string;
  examId: string;
  question: Question;
  category: string;
  score: number;
  responseTime: number;
  addedBy: string;
  schoolCode: string;
  createdAt: string;
  updatedAt?: string;
}

// Add a utility function to convert numbers to Persian
const toPersianNumber = (num: number): string => {
  if (!num) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

// Add a utility function to handle image paths
const getImagePath = (path: string) => {
  // For debugging
  console.log("Original image path:", path);

  // If already contains the prefix, return as is
  if (path.startsWith("https://file.farsamooz.ir/q/")) {
    return path;
  }

  // Remove any leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // Add the prefix
  const result = `https://file.farsamooz.ir/q/${cleanPath}`;

  return result;
};

// Function to safely render HTML with image path prefixing
const renderHTML = (html: string | undefined) => {
  if (!html) return { __html: "" };

  // Logging original content for debugging
  console.log("Processing HTML content");

  // First pattern: Match img tags with src attribute in single quotes
  let processed = html.replace(
    /<img([^>]*)\ssrc='([^']+)'([^>]*)>/g,
    (match, before, src, after) => {
      console.log(`Found image with src='${src}'`);

      // Don't add prefix if it already has the prefix or is a data URL
      if (
        src.startsWith("https://file.farsamooz.ir/q/") ||
        src.startsWith("data:image")
      ) {
        return match;
      }

      return `<img${before} src='https://file.farsamooz.ir/q/${src}'${after}>`;
    }
  );

  // Second pattern: Match img tags with src attribute in double quotes
  processed = processed.replace(
    /<img([^>]*)\ssrc="([^"]+)"([^>]*)>/g,
    (match, before, src, after) => {
      console.log(`Found image with src="${src}"`);

      // Don't add prefix if it already has the prefix or is a data URL
      if (
        src.startsWith("https://file.farsamooz.ir/q/") ||
        src.startsWith("data:image")
      ) {
        return match;
      }

      return `<img${before} src="https://file.farsamooz.ir/q/${src}"${after}>`;
    }
  );

  return { __html: processed };
};

export default function QuestionBankPage() {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="container mx-auto p-6">
          <div className="flex justify-center items-center py-32">
            <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <QuestionBankContent />
    </Suspense>
  );
}

// Separate client component
function QuestionBankContent(): React.ReactElement {
  // Get current user
  const { user, isLoading } = useAuth();

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

  // New state for exam functionality
  const [examId, setExamId] = useState<string | null>(null);
  const [showAddToExamDialog, setShowAddToExamDialog] =
    useState<boolean>(false);
  const [addToExamLoading, setAddToExamLoading] = useState<boolean>(false);
  const [examCategories, setExamCategories] = useState<string[]>([]);
  const [addToExamData, setAddToExamData] = useState({
    category: "",
    score: "1", // Default value
    responseTime: "60", // Default 60 seconds
  });

  // New state for added questions view
  const [showAddedQuestionsDialog, setShowAddedQuestionsDialog] =
    useState<boolean>(false);
  const [addedQuestions, setAddedQuestions] = useState<ExamQuestion[]>([]);
  const [addedQuestionsLoading, setAddedQuestionsLoading] =
    useState<boolean>(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [editQuestionData, setEditQuestionData] = useState({
    category: "",
    score: "",
    responseTime: "",
  });
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // State for deleting questions from the questions collection
  const [deleteQuestionConfirmOpen, setDeleteQuestionConfirmOpen] =
    useState<boolean>(false);
  const [deletingMainQuestionId, setDeletingMainQuestionId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // New Question Dialog state
  const [showNewQuestionDialog, setShowNewQuestionDialog] =
    useState<boolean>(false);
  const [newQuestionData, setNewQuestionData] = useState({
    grade: "",
    cat1: "",
    cat2: "",
    cat3: "",
    cat4: "",
    difficulty: " متوسط ",
    type: " تستی ",
    question: "",
    questionkey: "",
    option1: "",
    option2: "",
    option3: "",
    option4: "",
    correctoption: "1",
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Add new state for custom category inputs
  const [newCategoryInputs, setNewCategoryInputs] = useState({
    cat1: "",
    cat2: "",
    cat3: "",
    cat4: "",
  });

  // Router and search params
  const router = useRouter();
  const searchParams = useSearchParams();

  // Apply URL parameters to filters on component mount
  useEffect(() => {
    // Don't fetch questions until user is loaded
    if (isLoading) return;

    const page = searchParams.get("page") || "1";
    const grade = searchParams.get("grade") || "";
    const cat1 = searchParams.get("cat1") || "";
    const cat2 = searchParams.get("cat2") || "";
    const cat3 = searchParams.get("cat3") || "";
    const cat4 = searchParams.get("cat4") || "";
    const difficulty = searchParams.get("difficulty") || "";
    const type = searchParams.get("type") || "";
    const examIdParam = searchParams.get("examID");

    if (examIdParam) {
      setExamId(examIdParam);
      // Fetch categories for this exam/school
      fetchExamCategories(examIdParam);
      // Also fetch added questions on initial load
      fetchAddedQuestions(examIdParam);
    }

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
  }, [searchParams, isLoading, user]); // Add isLoading and user as dependencies

  // Fetch questions with pagination and filters
  const fetchQuestions = async (page: number, filterParams = filters) => {
    // Don't fetch if user isn't loaded yet
    if (isLoading || !user) {
      console.log("User not loaded yet, skipping fetch");
      return;
    }

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

      // Add username parameter to filter by current user
      if (user?.username) {
        queryParams.append("username", user.username);
      }

      const response = await fetch(
        `/api/myquestionbank?${queryParams.toString()}`
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
    // Don't fetch if user isn't loaded yet
    if (isLoading || !user) {
      console.log("User not loaded yet, skipping categories fetch");
      return;
    }

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

      // Add username parameter to filter categories by current user
      //  if (user?.username) {
      //   queryParams.append("username", user.username);
      // }

      const response = await fetch(
        `/api/myquestionbank/categories?${queryParams.toString()}`
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

  // Fetch categories for the exam
  const fetchExamCategories = async (examId: string) => {
    // Don't fetch if user isn't loaded yet
    if (isLoading || !user) {
      console.log("User not loaded yet, skipping exam categories fetch");
      return;
    }

    try {
      const response = await fetch(
        `/api/myexamcat?examId=${examId}&username=${user?.username || ""}`
      );
      if (response.ok) {
        const data = await response.json();

        // Ensure data is an array and contains objects with categoryName property
        if (Array.isArray(data)) {
          const categories = data
            .filter(
              (item): item is { categoryName: string } =>
                typeof item === "object" &&
                item !== null &&
                "categoryName" in item &&
                typeof item.categoryName === "string"
            )
            .map((cat) => cat.categoryName);

          // Remove duplicates and sort alphabetically
          setExamCategories([...new Set(categories)].sort());
        } else {
          console.error("Invalid data format from examcat API");
        }
      }
    } catch (error) {
      console.error("Error fetching exam categories:", error);
    }
  };

  // Function to save new category to database
  const saveNewCategory = async (categoryData: {
    grade: number;
    cat1: string;
    cat2?: string;
    cat3?: string;
    cat4?: string;
    schoolCode?: string;
    createdBy?: string;
  }) => {
    try {
      const domain = window.location.host;

      const response = await fetch("/api/myquestionbank/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": domain,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        console.error("Failed to save new category");
      }

      return response.ok;
    } catch (error) {
      console.error("Error saving new category:", error);
      return false;
    }
  };

  // Handle adding a new category
  const handleAddCategory = async (categoryName: string) => {
    if (!categoryName.trim() || !examId || !user?.username) return false;

    try {
      const response = await fetch("/api/myexamcat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          username: user.username,
          categoryName: categoryName.trim(),
          schoolCode: user.schoolCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Fetch updated categories instead of manually updating
        await fetchExamCategories(examId);
        return true;
      } else {
        toast.error(data.error || "خطا در ذخیره دسته بندی جدید");
        return false;
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
      return false;
    }
  };

  // Handle saving question to exam
  const handleSaveToExam = async () => {
    if (!selectedQuestion || !examId || !user?.username) return;
    if (!addToExamData.category.trim()) {
      toast.error("لطفا یک دسته بندی انتخاب کنید");
      return;
    }

    setAddToExamLoading(true);

    try {
      // Check if this question is already added to this exam
      const checkResponse = await fetch(
        `/api/examquestions/check?examId=${examId}&questionId=${selectedQuestion._id}`
      );
      if (!checkResponse.ok) {
        throw new Error("خطا در بررسی وجود سوال در آزمون");
      }

      const { exists } = await checkResponse.json();

      if (exists) {
        toast.error("این سوال قبلا به این آزمون اضافه شده است.");
        setAddToExamLoading(false);
        return;
      }

      // Add category if it's a new one
      const categoryName = addToExamData.category.trim();
      if (!examCategories.includes(categoryName) && categoryName) {
        const success = await handleAddCategory(categoryName);
        if (!success) {
          // Error is already displayed in handleAddCategory
          setAddToExamLoading(false);
          return;
        }
      }

      // Save to examquestions collection
      const saveResponse = await fetch("/api/examquestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          question: selectedQuestion,
          category: categoryName,
          score: parseFloat(addToExamData.score),
          responseTime: parseInt(addToExamData.responseTime),
          addedBy: user.username,
          schoolCode: user.schoolCode,
        }),
      });

      if (saveResponse.ok) {
        toast.success("سوال با موفقیت به آزمون اضافه شد.");
        await fetchAddedQuestions();
        // Close dialogs
        setShowAddToExamDialog(false);
        // Reset data
        setAddToExamData({
          category: "",
          score: "1",
          responseTime: "60",
        });
      } else {
        const errorData = await saveResponse.json();
        toast.error(errorData.error || "خطا در ذخیره سوال.");
      }
    } catch (error) {
      console.error("Error saving question to exam:", error);
      toast.error("خطایی رخ داد. لطفا دوباره تلاش کنید.");
    } finally {
      setAddToExamLoading(false);
    }
  };

  // Open add to exam dialog
  const handleAddToExam = () => {
    // Refresh categories each time the dialog is opened
    if (examId) {
      fetchExamCategories(examId);
    }
    setShowAddToExamDialog(true);
  };

  // Handle change in add to exam form
  const handleAddToExamChange = (field: string, value: string) => {
    setAddToExamData({
      ...addToExamData,
      [field]: value,
    });
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

  // Add a function to handle row click to show question details
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    setShowQuestionDetail(true);
  };

  // Fetch questions added to the current exam
  const fetchAddedQuestions = async (examIdToUse = examId) => {
    if (!examIdToUse) return;

    setAddedQuestionsLoading(true);
    try {
      const response = await fetch(`/api/examquestions?examId=${examIdToUse}`);
      if (response.ok) {
        const data = await response.json();
        setAddedQuestions(data);
      } else {
        toast.error("خطا در دریافت سوالات افزوده شده");
      }
    } catch (error) {
      console.error("Error fetching added questions:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setAddedQuestionsLoading(false);
    }
  };

  // Open added questions dialog
  const handleViewAddedQuestions = () => {
    // No need to fetch questions again since we're doing it on page load
    // and after any modifications
    // Refresh categories before showing the dialog
    if (examId) {
      fetchExamCategories(examId);
    }
    setShowAddedQuestionsDialog(true);
  };

  // Handle edit question button click
  const handleEditQuestion = (question: ExamQuestion) => {
    // Refresh categories before editing
    if (examId) {
      fetchExamCategories(examId);
    }
    setEditQuestionId(question._id);
    setEditQuestionData({
      category: question.category,
      score: question.score.toString(),
      responseTime: question.responseTime.toString(),
    });
  };

  // Handle edit question data change
  const handleEditQuestionChange = (field: string, value: string) => {
    if (!editingQuestion) return;

    setEditingQuestion({
      ...editingQuestion,
      [field]: value,
    });
  };

  // Save edited question
  const handleSaveEditedQuestion = async () => {
    // Check if we have an editing question and user
    if (!editingQuestion || !user) {
      toast.error("اطلاعات سوال یا کاربر ناقص است");
      return;
    }

    try {
      setIsEditing(true);

      const response = await fetch("/api/questions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingQuestion,
          updatedBy: user.id,
        }),
      });

      if (response.ok) {
        toast.success("سوال با موفقیت ویرایش شد");
        setShowEditQuestionDialog(false);
        setEditingQuestion(null);
        fetchQuestions(pagination.page);
      } else {
        toast.error("خطا در ویرایش سوال");
      }
    } catch (error) {
      console.error("Error editing question:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setIsEditing(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = (questionId: string) => {
    setDeletingQuestionId(questionId);
    setDeleteConfirmOpen(true);
  };

  // Confirm delete question
  const confirmDeleteQuestion = async () => {
    if (!deletingQuestionId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/examquestions/${deletingQuestionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("سوال با موفقیت حذف شد");
        // Refresh the list
        fetchAddedQuestions();
      } else {
        const errorData = await response.json();
        // Refresh the list and update statistics
        await fetchAddedQuestions();
        toast.error(errorData.error || "خطا در حذف سوال");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setIsUpdating(false);
      setDeleteConfirmOpen(false);
      setDeletingQuestionId(null);
    }
  };

  // Cancel delete question
  const cancelDeleteQuestion = () => {
    setDeleteConfirmOpen(false);
    setDeletingQuestionId(null);
  };

  // Handle new question data change
  const handleNewQuestionChange = (field: string, value: string) => {
    // Create new data object with the updated field
    const updatedData = {
      ...newQuestionData,
      [field]: value,
    };

    // For category fields with "_new_" value, don't update the main state
    // Instead, update the newCategoryInputs state
    if (
      (field === "cat1" ||
        field === "cat2" ||
        field === "cat3" ||
        field === "cat4") &&
      newQuestionData[field] === "_new_" &&
      value !== "_new_"
    ) {
      setNewCategoryInputs((prev) => ({
        ...prev,
        [field]: value,
      }));
      return;
    }

    // Update the state
    setNewQuestionData(updatedData);

    // For category fields, fetch dependent categories
    if (
      field === "grade" ||
      field === "cat1" ||
      field === "cat2" ||
      field === "cat3"
    ) {
      // Build filter params based on the updated data
      const filterParams = {
        grade: field === "grade" ? value : updatedData.grade,
        cat1: field === "cat1" ? value : updatedData.cat1,
        cat2: field === "cat2" ? value : updatedData.cat2,
        cat3: field === "cat3" ? value : updatedData.cat3,
        cat4: "",
        difficulty: "",
        type: "",
      };

      // Clear dependent fields when parent changes
      if (field === "grade") {
        updatedData.cat1 = "";
        updatedData.cat2 = "";
        updatedData.cat3 = "";
        updatedData.cat4 = "";
        setNewQuestionData(updatedData);
        setNewCategoryInputs({
          cat1: "",
          cat2: "",
          cat3: "",
          cat4: "",
        });
      } else if (field === "cat1") {
        updatedData.cat2 = "";
        updatedData.cat3 = "";
        updatedData.cat4 = "";
        setNewQuestionData(updatedData);
        setNewCategoryInputs((prev) => ({
          ...prev,
          cat2: "",
          cat3: "",
          cat4: "",
        }));
      } else if (field === "cat2") {
        updatedData.cat3 = "";
        updatedData.cat4 = "";
        setNewQuestionData(updatedData);
        setNewCategoryInputs((prev) => ({
          ...prev,
          cat3: "",
          cat4: "",
        }));
      } else if (field === "cat3") {
        updatedData.cat4 = "";
        setNewQuestionData(updatedData);
        setNewCategoryInputs((prev) => ({
          ...prev,
          cat4: "",
        }));
      }

      // Fetch categories with the updated filters
      fetchCategories(filterParams);
    }
  };

  // Add function to apply custom category values when saving
  const applyCustomCategories = () => {
    const updatedData = { ...newQuestionData };

    // Replace "_new_" values with the corresponding custom inputs
    if (updatedData.cat1 === "_new_" && newCategoryInputs.cat1.trim()) {
      updatedData.cat1 = newCategoryInputs.cat1.trim();
    }

    if (updatedData.cat2 === "_new_" && newCategoryInputs.cat2.trim()) {
      updatedData.cat2 = newCategoryInputs.cat2.trim();
    }

    if (updatedData.cat3 === "_new_" && newCategoryInputs.cat3.trim()) {
      updatedData.cat3 = newCategoryInputs.cat3.trim();
    }

    if (updatedData.cat4 === "_new_" && newCategoryInputs.cat4.trim()) {
      updatedData.cat4 = newCategoryInputs.cat4.trim();
    }

    return updatedData;
  };

  // Submit new question
  const handleSubmitNewQuestion = async () => {
    if (!user) return;

    // Check if all required fields are filled
    if (
      !newQuestionData.grade ||
      !newQuestionData.cat1 ||
      !newQuestionData.question
    ) {
      toast.error("لطفا پایه، درس و متن سوال را وارد کنید");
      return;
    }

    // Apply any custom category inputs
    const questionDataToSubmit = applyCustomCategories();

    // Check if any "_new_" values remain without input
    if (
      questionDataToSubmit.cat1 === "_new_" ||
      questionDataToSubmit.cat2 === "_new_" ||
      questionDataToSubmit.cat3 === "_new_" ||
      questionDataToSubmit.cat4 === "_new_"
    ) {
      toast.error("لطفا برای دسته بندی های جدید، یک مقدار وارد کنید");
      return;
    }

    setIsCreating(true);
    try {
      // Save new category combinations if custom values were provided
      const hasCustomCategories =
        newQuestionData.cat1 === "_new_" ||
        newQuestionData.cat2 === "_new_" ||
        newQuestionData.cat3 === "_new_" ||
        newQuestionData.cat4 === "_new_";

      if (
        hasCustomCategories &&
        questionDataToSubmit.grade &&
        questionDataToSubmit.cat1
      ) {
        try {
          // Create base category data object
          const baseCategoryData = {
            grade: parseInt(questionDataToSubmit.grade),
            cat1: questionDataToSubmit.cat1,
            schoolCode: user.schoolCode,
            createdBy: user.username,
          };

          // Only add fields that have values
          if (questionDataToSubmit.cat2) {
            await saveNewCategory({
              ...baseCategoryData,
              cat2: questionDataToSubmit.cat2,
              cat3: questionDataToSubmit.cat3 || "",
              cat4: questionDataToSubmit.cat4 || "",
            });
          } else {
            await saveNewCategory(baseCategoryData);
          }
        } catch (error) {
          console.error("Error saving categories:", error);
        }
      }

      // Get the current domain for the API request
      const domain = window.location.host;

      const response = await fetch("/api/myquestionbank", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": domain,
        },
        body: JSON.stringify({
          ...questionDataToSubmit,
          schoolCode: user.schoolCode,
          createdBy: user.username,
          correctoption: parseInt(questionDataToSubmit.correctoption),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`سوال با موفقیت ذخیره شد - شناسه: ${result.id}`);
        setShowNewQuestionDialog(false);

        // Reset form
        setNewQuestionData({
          grade: "",
          cat1: "",
          cat2: "",
          cat3: "",
          cat4: "",
          difficulty: " متوسط ",
          type: " تستی ",
          question: "",
          questionkey: "",
          option1: "",
          option2: "",
          option3: "",
          option4: "",
          correctoption: "1",
        });

        // Reset custom category inputs
        setNewCategoryInputs({
          cat1: "",
          cat2: "",
          cat3: "",
          cat4: "",
        });

        // Refresh questions list
        fetchQuestions(pagination.page);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ذخیره سوال");
      }
    } catch (error) {
      console.error("Error creating new question:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setIsCreating(false);
    }
  };

  // New useEffect to load categories when New Question Dialog opens
  useEffect(() => {
    if (showNewQuestionDialog) {
      // Only fetch categories if the dialog is open
      fetchCategories();
    } else {
      // Reset the inputs when dialog closes
      setNewCategoryInputs({
        cat1: "",
        cat2: "",
        cat3: "",
        cat4: "",
      });
    }
  }, [showNewQuestionDialog]);

  // State
  const [showEditQuestionDialog, setShowEditQuestionDialog] =
    useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Handle edit question click
  const handleEditQuestionClick = (
    question: Question,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent row click from showing detail dialog
    setEditingQuestion(question);
    setShowEditQuestionDialog(true);
  };

  // Submit edited question
  const handleSubmitEditedQuestion = async () => {
    // Check if we have an editing question and user
    if (!editingQuestion || !user) {
      toast.error("اطلاعات سوال یا کاربر ناقص است");
      return;
    }

    try {
      setIsEditing(true);

      const response = await fetch("/api/questions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingQuestion,
          updatedBy: user.id,
        }),
      });

      if (response.ok) {
        toast.success("سوال با موفقیت ویرایش شد");
        setShowEditQuestionDialog(false);
        setEditingQuestion(null);
        fetchQuestions(pagination.page);
      } else {
        toast.error("خطا در ویرایش سوال");
      }
    } catch (error) {
      console.error("Error editing question:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setIsEditing(false);
    }
  };

  // Handle delete main question button click
  const handleDeleteMainQuestion = (
    question: Question,
    event: React.MouseEvent
  ) => {
    // Stop event propagation to prevent opening the question detail
    event.stopPropagation();
    setDeletingMainQuestionId(question._id);
    setDeleteQuestionConfirmOpen(true);
  };

  // Confirm delete main question
  const confirmDeleteMainQuestion = async () => {
    if (!deletingMainQuestionId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/questions/delete?id=${deletingMainQuestionId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "سوال با موفقیت حذف شد");
        // Refresh the questions list
        fetchQuestions(pagination.page);
      } else {
        toast.error(data.error || "خطا در حذف سوال");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("خطایی در ارتباط با سرور رخ داد");
    } finally {
      setIsDeleting(false);
      setDeleteQuestionConfirmOpen(false);
      setDeletingMainQuestionId(null);
    }
  };

  // Cancel delete main question
  const cancelDeleteMainQuestion = () => {
    setDeleteQuestionConfirmOpen(false);
    setDeletingMainQuestionId(null);
  };

  // Return loading indicator when user auth is still loading
  if (isLoading) {
    return (
      <div dir="rtl" className="container mx-auto p-6">
        <div className="flex justify-center items-center py-32">
          <RefreshCw className="h-12 w-12 animate-spin text-primary" />
          <span className="text-primary font-semibold mr-2">
            در حال بارگذاری...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto p-6">
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">بانک سوالات من</h1>
          <p className="text-gray-500 text-sm mt-1">
            این صفحه تنها سوالاتی که توسط شما ایجاد شده‌اند را نمایش می‌دهد
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowNewQuestionDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4 ml-1" />
            افزودن سوال جدید
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm">تعداد کل:</span>
            <span className="font-bold">
              {toPersianNumber(pagination.total)}
            </span>
          </div>
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
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">سوالات</CardTitle>
            {examId && (
              <div className="flex items-center gap-3">
                {addedQuestions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="flex gap-1">
                      <span>تعداد سوالات:</span>
                      <span>{toPersianNumber(addedQuestions.length)}</span>
                    </Badge>
                    <Badge variant="outline" className="flex gap-1">
                      <span>مجموع نمره:</span>
                      <span>
                        {toPersianNumber(
                          Number(
                            addedQuestions
                              .reduce((sum, q) => sum + q.score, 0)
                              .toFixed(2)
                          )
                        )}
                      </span>
                    </Badge>
                    <Badge variant="outline" className="flex gap-1">
                      <span>زمان کل:</span>
                      <span>
                        {toPersianNumber(
                          addedQuestions.reduce(
                            (sum, q) => sum + q.responseTime,
                            0
                          )
                        )}
                        <span className="mr-1">ثانیه</span>
                      </span>
                    </Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAddedQuestions}
                  className="flex items-center gap-1"
                >
                  <ClipboardList className="h-4 w-4 ml-1" />
                  مشاهده سوالات افزوده شده
                </Button>
              </div>
            )}
          </div>
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
                      <TableHead className="w-16">عملیات</TableHead>
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
                          <MathJax>
                            <div
                              className="line-clamp-2 text-sm"
                              dangerouslySetInnerHTML={renderHTML(
                                question.question
                              )}
                            />
                          </MathJax>

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
                                  <MathJax>
                                    <div
                                      className="truncate max-w-[90%] text-xs"
                                      dangerouslySetInnerHTML={renderHTML(
                                        question.option1
                                      )}
                                    />
                                  </MathJax>
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
                                  <MathJax>
                                    <div
                                      className="truncate max-w-[90%] text-xs"
                                      dangerouslySetInnerHTML={renderHTML(
                                        question.option2
                                      )}
                                    />
                                  </MathJax>
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
                                  <MathJax>
                                    <div
                                      className="truncate max-w-[90%] text-xs"
                                      dangerouslySetInnerHTML={renderHTML(
                                        question.option3
                                      )}
                                    />
                                  </MathJax>
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
                                  <MathJax>
                                    <div
                                      className="truncate max-w-[90%] text-xs"
                                      dangerouslySetInnerHTML={renderHTML(
                                        question.option4
                                      )}
                                    />
                                  </MathJax>
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
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) =>
                                handleEditQuestionClick(question, e)
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) =>
                                handleDeleteMainQuestion(question, e)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              <div className="flex items-center gap-2">
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

                {/* Add to Exam button */}
                {examId && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddToExam}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>افزودن به آزمون</span>
                  </Button>
                )}
              </div>
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
                <MathJax>
                  <div
                    className="text-base"
                    dangerouslySetInnerHTML={renderHTML(
                      selectedQuestion.question
                    )}
                  />
                </MathJax>
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
                      <MathJax>
                        <div
                          className="text-base"
                          dangerouslySetInnerHTML={renderHTML(
                            selectedQuestion.option1
                          )}
                        />
                      </MathJax>
                    </div>
                    {selectedQuestion.option1image && (
                      <div className="mt-2">
                        <img
                          src={getImagePath(selectedQuestion.option1image)}
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
                      <MathJax>
                        <div
                          className="text-base"
                          dangerouslySetInnerHTML={renderHTML(
                            selectedQuestion.option2
                          )}
                        />
                      </MathJax>
                    </div>
                    {selectedQuestion.option2image && (
                      <div className="mt-2">
                        <img
                          src={getImagePath(selectedQuestion.option2image)}
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
                      <MathJax>
                        <div
                          className="text-base"
                          dangerouslySetInnerHTML={renderHTML(
                            selectedQuestion.option3
                          )}
                        />
                      </MathJax>
                    </div>
                    {selectedQuestion.option3image && (
                      <div className="mt-2">
                        <img
                          src={getImagePath(selectedQuestion.option3image)}
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
                      <MathJax>
                        <div
                          className="text-base"
                          dangerouslySetInnerHTML={renderHTML(
                            selectedQuestion.option4
                          )}
                        />
                      </MathJax>
                    </div>
                    {selectedQuestion.option4image && (
                      <div className="mt-2">
                        <img
                          src={getImagePath(selectedQuestion.option4image)}
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
                <MathJax>
                  <div
                    className="text-base"
                    dangerouslySetInnerHTML={renderHTML(
                      selectedQuestion.questionkey
                    )}
                  />
                </MathJax>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add to Exam Dialog */}
      <Dialog open={showAddToExamDialog} onOpenChange={setShowAddToExamDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن سوال به آزمون</DialogTitle>
            <DialogDescription>
              لطفا اطلاعات مورد نیاز را برای افزودن این سوال به آزمون وارد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">دسته بندی</Label>
              <Select
                value={
                  examCategories.includes(addToExamData.category)
                    ? addToExamData.category
                    : ""
                }
                onValueChange={(value) =>
                  handleAddToExamChange("category", value)
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="انتخاب یا افزودن دسته بندی جدید" />
                </SelectTrigger>
                <SelectContent>
                  {examCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value=" ">+ افزودن دسته بندی جدید</SelectItem>
                </SelectContent>
              </Select>

              {/* Show input if "add new category" is selected */}
              {addToExamData.category === "" ||
              !examCategories.includes(addToExamData.category) ? (
                <div className="mt-2">
                  <Label htmlFor="newCategory">دسته بندی جدید</Label>
                  <Input
                    id="newCategory"
                    placeholder="نام دسته بندی جدید را وارد کنید"
                    value={
                      !examCategories.includes(addToExamData.category)
                        ? addToExamData.category
                        : ""
                    }
                    onChange={(e) =>
                      handleAddToExamChange("category", e.target.value)
                    }
                    className="mt-1"
                  />
                  {addToExamData.category.trim() === "" && (
                    <p className="text-xs text-destructive mt-1">
                      دسته بندی الزامی است
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">نمره</Label>
              <Select
                value={addToExamData.score}
                onValueChange={(value) => handleAddToExamChange("score", value)}
              >
                <SelectTrigger id="score">
                  <SelectValue placeholder="انتخاب نمره" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.25">۰.۲۵</SelectItem>
                  <SelectItem value="0.5">۰.۵</SelectItem>
                  <SelectItem value="0.75">۰.۷۵</SelectItem>
                  <SelectItem value="1">۱</SelectItem>
                  <SelectItem value="1.25">۱.۲۵</SelectItem>
                  <SelectItem value="1.5">۱.۵</SelectItem>
                  <SelectItem value="1.75">۱.۷۵</SelectItem>
                  <SelectItem value="2">۲</SelectItem>
                  <SelectItem value="2.5">۲.۵</SelectItem>
                  <SelectItem value="3">۳</SelectItem>
                  <SelectItem value="3.5">۳.۵</SelectItem>
                  <SelectItem value="4">۴</SelectItem>
                  <SelectItem value="4.5">۴.۵</SelectItem>
                  <SelectItem value="5">۵</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responseTime">زمان پاسخگویی (ثانیه)</Label>
              <Input
                id="responseTime"
                type="number"
                min="10"
                value={addToExamData.responseTime}
                onChange={(e) =>
                  handleAddToExamChange("responseTime", e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddToExamDialog(false)}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveToExam}
              disabled={
                addToExamLoading ||
                !addToExamData.category.trim() ||
                !addToExamData.score ||
                !addToExamData.responseTime ||
                parseInt(addToExamData.responseTime) < 10
              }
            >
              {addToExamLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Added Questions Dialog */}
      <Dialog
        open={showAddedQuestionsDialog}
        onOpenChange={setShowAddedQuestionsDialog}
      >
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>سوالات افزوده شده به آزمون</DialogTitle>
            <DialogDescription>
              لیست سوالاتی که به این آزمون افزوده شده‌اند. شما می‌توانید
              دسته‌بندی، نمره و زمان پاسخ را ویرایش کنید یا سوال را حذف کنید.
            </DialogDescription>
          </DialogHeader>

          {addedQuestionsLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : addedQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ سوالی به این آزمون افزوده نشده است
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px]">
              {addedQuestions.map((questionData) => (
                <div
                  key={questionData._id}
                  className="border rounded-lg p-4 mb-4 bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-sm">
                        دسته بندی:{" "}
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {questionData.category}
                        </span>
                      </h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-gray-600">
                          نمره: {questionData.score}
                        </span>
                        <span className="text-xs text-gray-600">
                          زمان پاسخ: {questionData.responseTime} ثانیه
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(questionData)}
                        className="h-8 px-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteQuestion(questionData._id)}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Question preview */}
                  <div className="mt-2 border-t pt-2">
                    <MathJax>
                      <div
                        className="text-sm line-clamp-2"
                        dangerouslySetInnerHTML={renderHTML(
                          questionData.question.question
                        )}
                      />
                    </MathJax>
                  </div>

                  {/* Edit form */}
                  {editQuestionId === questionData._id && (
                    <div className="mt-4 border-t pt-4 grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`category-${questionData._id}`}>
                          دسته بندی
                        </Label>
                        <Select
                          value={
                            examCategories.includes(editQuestionData.category)
                              ? editQuestionData.category
                              : ""
                          }
                          onValueChange={(value) =>
                            handleEditQuestionChange("category", value)
                          }
                        >
                          <SelectTrigger id={`category-${questionData._id}`}>
                            <SelectValue placeholder="انتخاب یا افزودن دسته بندی جدید" />
                          </SelectTrigger>
                          <SelectContent>
                            {examCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                            <SelectItem value=" ">
                              + افزودن دسته بندی جدید
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Show input if "add new category" is selected */}
                        {editQuestionData.category === "" ||
                        !examCategories.includes(editQuestionData.category) ? (
                          <div className="mt-2">
                            <Label htmlFor={`newCategory-${questionData._id}`}>
                              دسته بندی جدید
                            </Label>
                            <Input
                              id={`newCategory-${questionData._id}`}
                              placeholder="نام دسته بندی جدید را وارد کنید"
                              value={
                                !examCategories.includes(
                                  editQuestionData.category
                                )
                                  ? editQuestionData.category
                                  : ""
                              }
                              onChange={(e) =>
                                handleEditQuestionChange(
                                  "category",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                            {editQuestionData.category.trim() === "" && (
                              <p className="text-xs text-destructive mt-1">
                                دسته بندی الزامی است
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`score-${questionData._id}`}>
                            نمره
                          </Label>
                          <Select
                            value={editQuestionData.score}
                            onValueChange={(value) =>
                              handleEditQuestionChange("score", value)
                            }
                          >
                            <SelectTrigger id={`score-${questionData._id}`}>
                              <SelectValue placeholder="انتخاب نمره" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.25">۰.۲۵</SelectItem>
                              <SelectItem value="0.5">۰.۵</SelectItem>
                              <SelectItem value="0.75">۰.۷۵</SelectItem>
                              <SelectItem value="1">۱</SelectItem>
                              <SelectItem value="1.25">۱.۲۵</SelectItem>
                              <SelectItem value="1.5">۱.۵</SelectItem>
                              <SelectItem value="1.75">۱.۷۵</SelectItem>
                              <SelectItem value="2">۲</SelectItem>
                              <SelectItem value="2.5">۲.۵</SelectItem>
                              <SelectItem value="3">۳</SelectItem>
                              <SelectItem value="3.5">۳.۵</SelectItem>
                              <SelectItem value="4">۴</SelectItem>
                              <SelectItem value="4.5">۴.۵</SelectItem>
                              <SelectItem value="5">۵</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`responseTime-${questionData._id}`}>
                            زمان پاسخگویی (ثانیه)
                          </Label>
                          <Input
                            id={`responseTime-${questionData._id}`}
                            type="number"
                            min="10"
                            value={editQuestionData.responseTime}
                            onChange={(e) =>
                              handleEditQuestionChange(
                                "responseTime",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditQuestionId(null)}
                        >
                          انصراف
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEditedQuestion}
                          disabled={
                            isUpdating ||
                            !editQuestionData.category.trim() ||
                            !editQuestionData.score ||
                            !editQuestionData.responseTime ||
                            parseInt(editQuestionData.responseTime) < 10
                          }
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                              در حال ذخیره...
                            </>
                          ) : (
                            "ذخیره تغییرات"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف سوال از آزمون</DialogTitle>
            <DialogDescription>
              آیا از حذف این سوال از آزمون اطمینان دارید؟ این عمل قابل بازگشت
              نیست.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={cancelDeleteQuestion}
              disabled={isUpdating}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteQuestion}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                "حذف سوال"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Question Dialog */}
      <Dialog
        open={showNewQuestionDialog}
        onOpenChange={setShowNewQuestionDialog}
      >
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن سوال جدید</DialogTitle>
            <DialogDescription>
              لطفا اطلاعات سوال جدید را وارد کنید. سوال در بانک سوالات مدرسه شما
              ذخیره خواهد شد.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Grade - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="grade">پایه تحصیلی</Label>
                <Select
                  value={newQuestionData.grade}
                  onValueChange={(value) =>
                    handleNewQuestionChange("grade", value)
                  }
                >
                  <SelectTrigger id="grade">
                    <SelectValue placeholder="انتخاب پایه" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.grades.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        پایه {toPersianNumber(grade)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cat1 - Subject - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="cat1">درس</Label>
                <Select
                  value={newQuestionData.cat1}
                  onValueChange={(value) =>
                    handleNewQuestionChange("cat1", value)
                  }
                  disabled={!newQuestionData.grade}
                >
                  <SelectTrigger id="cat1">
                    <SelectValue placeholder="انتخاب درس" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.cat1.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="_new_">+ افزودن جدید</SelectItem>
                  </SelectContent>
                </Select>

                {/* Show input field when "_new_" is selected */}
                {newQuestionData.cat1 === "_new_" && (
                  <div className="mt-2">
                    <Input
                      id="newCat1"
                      placeholder="نام درس جدید را وارد کنید"
                      value={newCategoryInputs.cat1}
                      onChange={(e) =>
                        setNewCategoryInputs((prev) => ({
                          ...prev,
                          cat1: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Cat2 - Chapter - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="cat2">فصل</Label>
                <Select
                  value={newQuestionData.cat2}
                  onValueChange={(value) =>
                    handleNewQuestionChange("cat2", value)
                  }
                  disabled={
                    !newQuestionData.cat1 || newQuestionData.cat1 === "_new_"
                  }
                >
                  <SelectTrigger id="cat2">
                    <SelectValue placeholder="انتخاب فصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.cat2.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="_new_">+ افزودن جدید</SelectItem>
                  </SelectContent>
                </Select>

                {/* Show input field when "_new_" is selected */}
                {newQuestionData.cat2 === "_new_" && (
                  <div className="mt-2">
                    <Input
                      id="newCat2"
                      placeholder="نام فصل جدید را وارد کنید"
                      value={newCategoryInputs.cat2}
                      onChange={(e) =>
                        setNewCategoryInputs((prev) => ({
                          ...prev,
                          cat2: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Cat3 - Section - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="cat3">بخش</Label>
                <Select
                  value={newQuestionData.cat3}
                  onValueChange={(value) =>
                    handleNewQuestionChange("cat3", value)
                  }
                  disabled={
                    !newQuestionData.cat2 || newQuestionData.cat2 === "_new_"
                  }
                >
                  <SelectTrigger id="cat3">
                    <SelectValue placeholder="انتخاب بخش" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.cat3.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="_new_">+ افزودن جدید</SelectItem>
                  </SelectContent>
                </Select>

                {/* Show input field when "_new_" is selected */}
                {newQuestionData.cat3 === "_new_" && (
                  <div className="mt-2">
                    <Input
                      id="newCat3"
                      placeholder="نام بخش جدید را وارد کنید"
                      value={newCategoryInputs.cat3}
                      onChange={(e) =>
                        setNewCategoryInputs((prev) => ({
                          ...prev,
                          cat3: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Cat4 - Topic - Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="cat4">موضوع</Label>
                <Select
                  value={newQuestionData.cat4}
                  onValueChange={(value) =>
                    handleNewQuestionChange("cat4", value)
                  }
                  disabled={
                    !newQuestionData.cat3 || newQuestionData.cat3 === "_new_"
                  }
                >
                  <SelectTrigger id="cat4">
                    <SelectValue placeholder="انتخاب موضوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.cat4.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="_new_">+ افزودن جدید</SelectItem>
                  </SelectContent>
                </Select>

                {/* Show input field when "_new_" is selected */}
                {newQuestionData.cat4 === "_new_" && (
                  <div className="mt-2">
                    <Input
                      id="newCat4"
                      placeholder="نام موضوع جدید را وارد کنید"
                      value={newCategoryInputs.cat4}
                      onChange={(e) =>
                        setNewCategoryInputs((prev) => ({
                          ...prev,
                          cat4: e.target.value,
                        }))
                      }
                    />
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">سطح سختی</Label>
                <Select
                  value={newQuestionData.difficulty}
                  onValueChange={(value) =>
                    handleNewQuestionChange("difficulty", value)
                  }
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue placeholder="انتخاب سختی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" آسان ">آسان</SelectItem>
                    <SelectItem value=" متوسط ">متوسط</SelectItem>
                    <SelectItem value=" سخت ">سخت</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">نوع سوال</Label>
                <Select
                  value={newQuestionData.type}
                  onValueChange={(value) =>
                    handleNewQuestionChange("type", value)
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="انتخاب نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" تستی ">تستی</SelectItem>
                    <SelectItem value=" تشریحی ">تشریحی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="question">متن سوال</Label>
              <RichTextEditor
                value={newQuestionData.question}
                onChange={(value) => handleNewQuestionChange("question", value)}
                placeholder="متن سوال را وارد کنید"
                dir="rtl"
              />
            </div>

            {/* Show options for multiple choice questions */}
            {newQuestionData.type === " تستی " && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="option1">گزینه ۱</Label>
                      <input
                        type="radio"
                        id="correctOption1"
                        name="correctOption"
                        value="1"
                        checked={newQuestionData.correctoption === "1"}
                        onChange={() =>
                          handleNewQuestionChange("correctoption", "1")
                        }
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="correctOption1" className="text-xs">
                        گزینه صحیح
                      </Label>
                    </div>
                    <RichTextEditor
                      value={newQuestionData.option1}
                      onChange={(value) =>
                        handleNewQuestionChange("option1", value)
                      }
                      placeholder="گزینه اول"
                      dir="rtl"
                      className="min-h-16"
                    />
                  </div>

                  {/* Option 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="option2">گزینه ۲</Label>
                      <input
                        type="radio"
                        id="correctOption2"
                        name="correctOption"
                        value="2"
                        checked={newQuestionData.correctoption === "2"}
                        onChange={() =>
                          handleNewQuestionChange("correctoption", "2")
                        }
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="correctOption2" className="text-xs">
                        گزینه صحیح
                      </Label>
                    </div>
                    <RichTextEditor
                      value={newQuestionData.option2}
                      onChange={(value) =>
                        handleNewQuestionChange("option2", value)
                      }
                      placeholder="گزینه دوم"
                      dir="rtl"
                      className="min-h-16"
                    />
                  </div>

                  {/* Option 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="option3">گزینه ۳</Label>
                      <input
                        type="radio"
                        id="correctOption3"
                        name="correctOption"
                        value="3"
                        checked={newQuestionData.correctoption === "3"}
                        onChange={() =>
                          handleNewQuestionChange("correctoption", "3")
                        }
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="correctOption3" className="text-xs">
                        گزینه صحیح
                      </Label>
                    </div>
                    <RichTextEditor
                      value={newQuestionData.option3}
                      onChange={(value) =>
                        handleNewQuestionChange("option3", value)
                      }
                      placeholder="گزینه سوم"
                      dir="rtl"
                      className="min-h-16"
                    />
                  </div>

                  {/* Option 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="option4">گزینه ۴</Label>
                      <input
                        type="radio"
                        id="correctOption4"
                        name="correctOption"
                        value="4"
                        checked={newQuestionData.correctoption === "4"}
                        onChange={() =>
                          handleNewQuestionChange("correctoption", "4")
                        }
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <Label htmlFor="correctOption4" className="text-xs">
                        گزینه صحیح
                      </Label>
                    </div>
                    <RichTextEditor
                      value={newQuestionData.option4}
                      onChange={(value) =>
                        handleNewQuestionChange("option4", value)
                      }
                      placeholder="گزینه چهارم"
                      dir="rtl"
                      className="min-h-16"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Question Answer/Key */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="questionkey">پاسخ تشریحی</Label>
              <RichTextEditor
                value={newQuestionData.questionkey}
                onChange={(value) =>
                  handleNewQuestionChange("questionkey", value)
                }
                placeholder="پاسخ تشریحی سوال را وارد کنید"
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowNewQuestionDialog(false)}
              disabled={isCreating}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmitNewQuestion}
              disabled={
                isCreating ||
                !newQuestionData.grade ||
                !newQuestionData.cat1 ||
                !newQuestionData.question
              }
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره سوال"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog
        open={showEditQuestionDialog}
        onOpenChange={setShowEditQuestionDialog}
      >
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش سوال</DialogTitle>
            <DialogDescription>اطلاعات سوال را ویرایش کنید</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh] pr-2">
            {editingQuestion && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {/* Grade */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-grade">پایه تحصیلی</Label>
                    <Select
                      value={editingQuestion.grade?.toString() || ""}
                      onValueChange={(value) =>
                        handleEditQuestionChange("grade", value)
                      }
                    >
                      <SelectTrigger id="edit-grade">
                        <SelectValue placeholder="انتخاب پایه" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.grades.map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            پایه {toPersianNumber(grade)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cat1 - Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-cat1">درس</Label>
                    <Input
                      id="edit-cat1"
                      placeholder="نام درس"
                      value={editingQuestion.cat1 || ""}
                      onChange={(e) =>
                        handleEditQuestionChange("cat1", e.target.value)
                      }
                    />
                  </div>

                  {/* Cat2 - Chapter */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-cat2">فصل</Label>
                    <Input
                      id="edit-cat2"
                      placeholder="عنوان فصل"
                      value={editingQuestion.cat2 || ""}
                      onChange={(e) =>
                        handleEditQuestionChange("cat2", e.target.value)
                      }
                    />
                  </div>

                  {/* Cat3 - Section */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-cat3">بخش</Label>
                    <Input
                      id="edit-cat3"
                      placeholder="عنوان بخش"
                      value={editingQuestion.cat3 || ""}
                      onChange={(e) =>
                        handleEditQuestionChange("cat3", e.target.value)
                      }
                    />
                  </div>

                  {/* Cat4 - Topic */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-cat4">موضوع</Label>
                    <Input
                      id="edit-cat4"
                      placeholder="موضوع دقیق"
                      value={editingQuestion.cat4 || ""}
                      onChange={(e) =>
                        handleEditQuestionChange("cat4", e.target.value)
                      }
                    />
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-difficulty">سطح سختی</Label>
                    <Select
                      value={editingQuestion.difficulty || " متوسط "}
                      onValueChange={(value) =>
                        handleEditQuestionChange("difficulty", value)
                      }
                    >
                      <SelectTrigger id="edit-difficulty">
                        <SelectValue placeholder="انتخاب سختی" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" آسان ">آسان</SelectItem>
                        <SelectItem value=" متوسط ">متوسط</SelectItem>
                        <SelectItem value=" سخت ">سخت</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">نوع سوال</Label>
                    <Select
                      value={editingQuestion.type || " تستی "}
                      onValueChange={(value) =>
                        handleEditQuestionChange("type", value)
                      }
                    >
                      <SelectTrigger id="edit-type">
                        <SelectValue placeholder="انتخاب نوع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" تستی ">تستی</SelectItem>
                        <SelectItem value=" تشریحی ">تشریحی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Question Text */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-question">متن سوال</Label>
                  <RichTextEditor
                    value={editingQuestion.question || ""}
                    onChange={(value) =>
                      handleEditQuestionChange("question", value)
                    }
                    placeholder="متن سوال را وارد کنید"
                    dir="rtl"
                  />
                </div>

                {/* Show options for multiple choice questions */}
                {editingQuestion.type === " تستی " && (
                  <div className="space-y-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Option 1 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="edit-option1">گزینه ۱</Label>
                          <input
                            type="radio"
                            id="edit-correctOption1"
                            name="edit-correctOption"
                            value="1"
                            checked={editingQuestion.correctoption === 1}
                            onChange={() =>
                              handleEditQuestionChange("correctoption", "1")
                            }
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label
                            htmlFor="edit-correctOption1"
                            className="text-xs"
                          >
                            گزینه صحیح
                          </Label>
                        </div>
                        <RichTextEditor
                          value={editingQuestion.option1 || ""}
                          onChange={(value) =>
                            handleEditQuestionChange("option1", value)
                          }
                          placeholder="گزینه اول"
                          dir="rtl"
                          className="min-h-16"
                        />
                      </div>

                      {/* Option 2 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="edit-option2">گزینه ۲</Label>
                          <input
                            type="radio"
                            id="edit-correctOption2"
                            name="edit-correctOption"
                            value="2"
                            checked={editingQuestion.correctoption === 2}
                            onChange={() =>
                              handleEditQuestionChange("correctoption", "2")
                            }
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label
                            htmlFor="edit-correctOption2"
                            className="text-xs"
                          >
                            گزینه صحیح
                          </Label>
                        </div>
                        <RichTextEditor
                          value={editingQuestion.option2 || ""}
                          onChange={(value) =>
                            handleEditQuestionChange("option2", value)
                          }
                          placeholder="گزینه دوم"
                          dir="rtl"
                          className="min-h-16"
                        />
                      </div>

                      {/* Option 3 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="edit-option3">گزینه ۳</Label>
                          <input
                            type="radio"
                            id="edit-correctOption3"
                            name="edit-correctOption"
                            value="3"
                            checked={editingQuestion.correctoption === 3}
                            onChange={() =>
                              handleEditQuestionChange("correctoption", "3")
                            }
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label
                            htmlFor="edit-correctOption3"
                            className="text-xs"
                          >
                            گزینه صحیح
                          </Label>
                        </div>
                        <RichTextEditor
                          value={editingQuestion.option3 || ""}
                          onChange={(value) =>
                            handleEditQuestionChange("option3", value)
                          }
                          placeholder="گزینه سوم"
                          dir="rtl"
                          className="min-h-16"
                        />
                      </div>

                      {/* Option 4 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="edit-option4">گزینه ۴</Label>
                          <input
                            type="radio"
                            id="edit-correctOption4"
                            name="edit-correctOption"
                            value="4"
                            checked={editingQuestion.correctoption === 4}
                            onChange={() =>
                              handleEditQuestionChange("correctoption", "4")
                            }
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <Label
                            htmlFor="edit-correctOption4"
                            className="text-xs"
                          >
                            گزینه صحیح
                          </Label>
                        </div>
                        <RichTextEditor
                          value={editingQuestion.option4 || ""}
                          onChange={(value) =>
                            handleEditQuestionChange("option4", value)
                          }
                          placeholder="گزینه چهارم"
                          dir="rtl"
                          className="min-h-16"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Question Answer/Key */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="edit-questionkey">پاسخ تشریحی</Label>
                  <RichTextEditor
                    value={editingQuestion.questionkey || ""}
                    onChange={(value) =>
                      handleEditQuestionChange("questionkey", value)
                    }
                    placeholder="پاسخ تشریحی سوال را وارد کنید"
                    dir="rtl"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowEditQuestionDialog(false)}
              disabled={isEditing}
            >
              انصراف
            </Button>
            <Button
              onClick={handleSubmitEditedQuestion}
              disabled={
                isEditing ||
                !editingQuestion?.grade ||
                !editingQuestion?.cat1 ||
                !editingQuestion?.question
              }
            >
              {isEditing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                "ذخیره تغییرات"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Confirmation Dialog */}
      <Dialog
        open={deleteQuestionConfirmOpen}
        onOpenChange={setDeleteQuestionConfirmOpen}
      >
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>حذف سوال</DialogTitle>
            <DialogDescription>
              آیا از حذف این سوال اطمینان دارید؟ این عمل قابل بازگشت نیست و سوال
              به طور کامل از بانک سوالات حذف می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={cancelDeleteMainQuestion}
              disabled={isDeleting}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMainQuestion}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  در حال حذف...
                </>
              ) : (
                "حذف سوال"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
