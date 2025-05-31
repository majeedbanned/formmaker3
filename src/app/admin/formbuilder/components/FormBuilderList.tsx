"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Edit,
  Eye,
  Trash,
  FileText,
  ExternalLink,
  Settings,
  Calendar,
  BookOpen,
  Users,
  MoreVertical,
  Search,
  FileJson,
  ArrowDownUp,
  Hash,
  Layers,
  Edit2,
  Activity,
  CalendarDays,
  CalendarOff,
  Clock,
  Info,
} from "lucide-react";
import { FormSubmissionViewer } from "./FormSubmissionViewer";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Define types for classes and teachers
interface ClassData {
  _id: string;
  data: {
    className: string;
    classCode: string;
    Grade?: string;
    major?: string;
    teachers?: Array<{
      teacherCode: string;
      courseCode?: string;
    }>;
  };
}

interface TeacherData {
  _id: string;
  data: {
    teacherName: string;
    teacherCode: string;
  };
}

// Define the Form type based on our requirements
export interface FormSchema {
  _id?: string;
  title: string;
  fields: FormField[];
  steps?: FormStep[];
  isMultiStep?: boolean;
  formStartEntryDatetime?: string | null;
  formEndEntryDateTime?: string | null;
  assignedClassCodes?: string[];
  assignedTeacherCodes?: string[];
  isEditable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fieldIds: string[];
}

export interface FormField {
  type: string;
  label: string;
  name: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  nestedOptions?: {
    parentField: string;
    mapping: Record<string, { label: string; value: string }[]>;
  };
  placeholder?: string;
  validation?: Record<string, unknown>;
  condition?: {
    field: string;
    equals: string | boolean | number;
  };
  fields?: FormField[];
  layout?: string;
  repeatable?: boolean;
  stepId?: string; // Reference to the step this field belongs to
  signatureOptions?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    penColor?: string;
  };
  ratingOptions?: {
    maxRating?: number;
    defaultRating?: number;
    size?: "sm" | "md" | "lg";
    allowHalf?: boolean;
    showCount?: boolean;
    color?: string;
  };
}

interface FormBuilderListProps {
  onEdit: (form: FormSchema) => void;
  onPreview: (form: FormSchema) => void;
}

export default function FormBuilderList({
  onEdit,
  onPreview,
}: FormBuilderListProps) {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [submissionCounts, setSubmissionCounts] = useState<
    Record<string, number>
  >({});
  const [selectedForm, setSelectedForm] = useState<FormSchema | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchForms();
      fetchSubmissionCounts();
    }
  }, [user]);

  useEffect(() => {
    if (settingsOpen) {
      fetchClassesAndTeachers();
    }
  }, [settingsOpen]);

  const fetchForms = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Remove client-side filtering since it's now handled server-side based on user type
      const response = await fetch("/api/formbuilder");
      if (!response.ok) throw new Error("Failed to fetch forms");

      const data = await response.json();
      setForms(data.forms || []);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionCounts = async () => {
    try {
      const response = await fetch("/api/formbuilder/submissions/count", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch submission counts");

      const data = await response.json();
      setSubmissionCounts(data.counts || {});
    } catch (error) {
      console.error("Error fetching submission counts:", error);
    }
  };

  const fetchClassesAndTeachers = async () => {
    try {
      setLoadingData(true);
      const response = await fetch("/api/formbuilder/classes-teachers", {
        headers: {
          "x-domain": window.location.host,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch classes and teachers");

      const data = await response.json();

      // For teacher users, filter classes to only show their classes
      if (user?.userType === "teacher" && user?.username) {
        const teacherClasses = data.classes.filter((cls: ClassData) =>
          cls.data.teachers?.some(
            (teacher) => teacher.teacherCode === user.username
          )
        );
        setClasses(teacherClasses || []);
      } else {
        // For admin/school users, show all classes
        setClasses(data.classes || []);
      }

      setTeachers(data.teachers || []);
    } catch (error) {
      console.error("Error fetching classes and teachers:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteClick = (formId: string) => {
    setDeleteFormId(formId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFormId) return;

    try {
      const response = await fetch(`/api/formbuilder/${deleteFormId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete form");

      // Remove from local state
      setForms(forms.filter((form) => form._id !== deleteFormId));
    } catch (error) {
      console.error("Error deleting form:", error);
    } finally {
      setDeleteFormId(null);
    }
  };

  const handleSettingsClick = (form: FormSchema) => {
    setSelectedForm({
      ...form,
      assignedClassCodes: form.assignedClassCodes || [],
      assignedTeacherCodes: form.assignedTeacherCodes || [],
      isEditable: form.isEditable || false,
    });
    setSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedForm || !selectedForm._id) return;

    try {
      const response = await fetch(`/api/formbuilder/${selectedForm._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedForm),
      });

      if (!response.ok) throw new Error("Failed to update form settings");

      // Update the form in the local state
      setForms(
        forms.map((form) =>
          form._id === selectedForm._id ? selectedForm : form
        )
      );

      setSettingsOpen(false);
    } catch (error) {
      console.error("Error updating form settings:", error);
    }
  };

  const handleClassToggle = (classId: string, classCode: string) => {
    if (!selectedForm) return;

    const assignedClassCodes = selectedForm.assignedClassCodes || [];
    const updatedClassCodes = assignedClassCodes.includes(classCode)
      ? assignedClassCodes.filter((code) => code !== classCode)
      : [...assignedClassCodes, classCode];

    setSelectedForm({
      ...selectedForm,
      assignedClassCodes: updatedClassCodes,
    });
  };

  const handleTeacherToggle = (teacherId: string, teacherCode: string) => {
    if (!selectedForm) return;

    const assignedTeacherCodes = selectedForm.assignedTeacherCodes || [];
    const updatedTeacherCodes = assignedTeacherCodes.includes(teacherCode)
      ? assignedTeacherCodes.filter((code) => code !== teacherCode)
      : [...assignedTeacherCodes, teacherCode];

    setSelectedForm({
      ...selectedForm,
      assignedTeacherCodes: updatedTeacherCodes,
    });
  };

  const handleStartDateChange = (value: Value) => {
    if (!selectedForm) return;
    setSelectedForm({
      ...selectedForm,
      formStartEntryDatetime: value ? value.toString() : null,
    });
  };

  const handleEndDateChange = (value: Value) => {
    if (!selectedForm) return;
    setSelectedForm({
      ...selectedForm,
      formEndEntryDateTime: value ? value.toString() : null,
    });
  };

  const handleEditableChange = (checked: boolean) => {
    if (!selectedForm) return;

    setSelectedForm({
      ...selectedForm,
      isEditable: checked,
    });
  };

  // Show date in readable format - directly used in the UI
  const showFormattedDate = (date: string | null | undefined) => {
    if (!date) return "تنظیم نشده";

    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "تنظیم نشده";
    }
  };

  // Add a function to determine form status
  const getFormStatus = (form: FormSchema) => {
    const now = new Date();
    const startDate = form.formStartEntryDatetime
      ? new Date(form.formStartEntryDatetime.toString())
      : null;
    const endDate = form.formEndEntryDateTime
      ? new Date(form.formEndEntryDateTime.toString())
      : null;

    if (!startDate && !endDate)
      return {
        status: "open",
        label: "باز",
        color: "bg-green-100 text-green-800",
      };
    if (startDate && startDate > now)
      return {
        status: "upcoming",
        label: "آینده",
        color: "bg-blue-100 text-blue-800",
      };
    if (endDate && endDate < now)
      return {
        status: "expired",
        label: "منقضی شده",
        color: "bg-red-100 text-red-800",
      };
    return {
      status: "active",
      label: "فعال",
      color: "bg-green-100 text-green-800",
    };
  };

  // Add a filteredForms computed value
  const filteredForms = forms.filter((form) => {
    // Filter by search term (case insensitive)
    const matchesSearch = form.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Filter by status
    let matchesStatus = true;
    if (statusFilter !== "all") {
      const formStatus = getFormStatus(form).status;
      matchesStatus = formStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Add an export function to download form submissions
  const handleExportSubmissions = async (
    formId: string,
    format: "json" | "csv"
  ) => {
    try {
      const response = await fetch(
        `/api/formbuilder/submissions?formId=${formId}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch submissions");

      const data = await response.json();

      if (!data.submissions || data.submissions.length === 0) {
        // Show alert if no submissions
        alert("این فرم هیچ پاسخی ندارد که بتوان دانلود کرد.");
        return;
      }

      let content: string;
      let fileName: string;
      let mimeType: string;

      if (format === "json") {
        // Prepare JSON data
        content = JSON.stringify(data.submissions, null, 2);
        fileName = `form-submissions-${formId}.json`;
        mimeType = "application/json";
      } else {
        // Prepare CSV data
        // Get all possible keys from all submissions
        const allKeys = new Set<string>();
        data.submissions.forEach(
          (submission: { answers?: Record<string, unknown> }) => {
            Object.keys(submission.answers || {}).forEach((key) =>
              allKeys.add(key)
            );
          }
        );

        // Create CSV header
        const keys = Array.from(allKeys);
        let csv = ["id", "submitted_date", ...keys].join(",") + "\n";

        // Add rows
        data.submissions.forEach(
          (submission: {
            _id: string;
            createdAt: string;
            answers?: Record<string, unknown>;
          }) => {
            const row = [
              submission._id,
              new Date(submission.createdAt).toLocaleString(),
              ...keys.map((key) => {
                const value = submission.answers?.[key];
                // Handle different value types for CSV
                if (value === null || value === undefined) return "";
                if (typeof value === "object")
                  return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                return `"${String(value).replace(/"/g, '""')}"`;
              }),
            ];
            csv += row.join(",") + "\n";
          }
        );

        content = csv;
        fileName = `form-submissions-${formId}.csv`;
        mimeType = "text/csv";
      }

      // Create a download link and trigger it
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting submissions:", error);
      alert("خطا در دریافت پاسخ‌ها. لطفاً مجدداً تلاش کنید.");
    }
  };

  if (loading) {
    return <div className="text-center py-8">در حال دریافت فرم ها...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-500 mb-4">هیچ فرمی یافت نشد</p>
        <p className="text-gray-400">یک فرم جدید بسازید تا شروع کنید</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در فرم‌ها..."
              className="w-full p-3 pr-10 border rounded-xl bg-white transition-all duration-200 focus:ring-2 focus:ring-blue-400 focus:border-blue-500 focus:outline-none shadow-sm group-hover:shadow-md"
            />
            <Search className="h-5 w-5 absolute top-1/2 -translate-y-1/2 right-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-52 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
              <SelectValue placeholder="وضعیت فرم" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">همه فرم‌ها</SelectItem>
              <SelectItem value="active">فرم‌های فعال</SelectItem>
              <SelectItem value="upcoming">فرم‌های آینده</SelectItem>
              <SelectItem value="expired">فرم‌های منقضی شده</SelectItem>
              <SelectItem value="open">فرم‌های باز</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            {filteredForms.length} فرم یافت شد
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-xs" size="sm">
              <ArrowDownUp className="h-3.5 w-3.5 mr-1" />
              مرتب‌سازی
            </Button>
          </div>
        </div>
      </div>

      {/* Updated grid with animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form, index) => (
          <motion.div
            key={form._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="overflow-hidden border-0 bg-white hover:shadow-xl transition-all duration-300 shadow-md rounded-xl">
              <CardContent className="p-0">
                {/* Header with gradient based on status */}
                <div
                  className={cn(
                    "h-2 w-full",
                    getFormStatus(form).status === "active" &&
                      "bg-gradient-to-r from-green-400 to-green-300",
                    getFormStatus(form).status === "upcoming" &&
                      "bg-gradient-to-r from-blue-400 to-blue-300",
                    getFormStatus(form).status === "expired" &&
                      "bg-gradient-to-r from-red-400 to-red-300",
                    getFormStatus(form).status === "open" &&
                      "bg-gradient-to-r from-emerald-400 to-emerald-300"
                  )}
                ></div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg hover:text-blue-600 transition-colors duration-200">
                      {form.title}
                    </h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-xl shadow-lg border-gray-200"
                      >
                        <DropdownMenuLabel className="text-sm">
                          گزینه‌های فرم
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onEdit(form)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 ml-2 text-indigo-500" />
                          <span>ویرایش فرم</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onPreview(form)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 ml-2 text-blue-500" />
                          <span>پیش‌نمایش فرم</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSettingsClick(form)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4 ml-2 text-gray-500" />
                          <span>تنظیمات فرم</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            className="flex items-center cursor-pointer hover:bg-gray-50"
                            target="_blank"
                            href={`/admin/formbuilder/view?id=${form._id}`}
                          >
                            <ExternalLink className="h-4 w-4 ml-2 text-green-500" />
                            <span>مشاهده مستقل فرم</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
                          <FormSubmissionViewer
                            formId={form._id!}
                            formTitle={form.title}
                            trigger={
                              <div className="flex items-center w-full">
                                <FileText className="h-4 w-4 ml-2 text-amber-500" />
                                <span>مشاهده پاسخ‌ها</span>
                              </div>
                            }
                          />
                        </DropdownMenuItem>

                        {/* Add export options */}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-gray-500">
                          دریافت پاسخ‌ها
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            handleExportSubmissions(form._id!, "json")
                          }
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <FileJson className="h-4 w-4 ml-2 text-violet-500" />
                          <span>دریافت با فرمت JSON</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleExportSubmissions(form._id!, "csv")
                          }
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <FileText className="h-4 w-4 ml-2 text-emerald-500" />
                          <span>دریافت با فرمت CSV</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(form._id!)}
                          className="text-red-600 hover:text-red-700 cursor-pointer hover:bg-red-50"
                        >
                          <Trash className="h-4 w-4 ml-2" />
                          <span>حذف فرم</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="bg-gray-50 border-0 text-gray-600 font-normal rounded-lg"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {form.fields?.length || 0} فیلد
                      </Badge>

                      {form.isMultiStep && (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 border-0 text-purple-700 font-normal rounded-lg"
                        >
                          <Layers className="h-3 w-3 mr-1" />
                          چند مرحله‌ای
                        </Badge>
                      )}

                      {form.isEditable && (
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 border-0 text-indigo-700 font-normal rounded-lg"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          قابل ویرایش
                        </Badge>
                      )}

                      {/* Show form status */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-0 font-normal rounded-lg",
                          getFormStatus(form).color
                        )}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        {getFormStatus(form).label}
                      </Badge>
                    </div>

                    <div className="mt-3 text-xs space-y-1 bg-gray-50 p-3 rounded-lg">
                      {form.formStartEntryDatetime && (
                        <p className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-blue-500" />
                          <span>از:</span>{" "}
                          {showFormattedDate(form.formStartEntryDatetime)}
                        </p>
                      )}
                      {form.formEndEntryDateTime && (
                        <p className="flex items-center gap-1">
                          <CalendarOff className="h-3 w-3 text-red-500" />
                          <span>تا:</span>{" "}
                          {showFormattedDate(form.formEndEntryDateTime)}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100">
                      <p className="text-xs flex items-center text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(form.updatedAt || "").toLocaleDateString(
                          "fa-IR"
                        )}
                      </p>
                      {form._id && (
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-600 border-0 rounded-lg font-normal"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {submissionCounts[form._id] || 0} پاسخ
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty state with better styling */}
      {filteredForms.length === 0 && !loading && (
        <div className="bg-gray-50 rounded-2xl p-10 text-center my-8">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            هیچ فرمی یافت نشد
          </h3>
          <p className="text-gray-500 mb-4">
            جستجو یا فیلترهای خود را تغییر دهید
          </p>
          {searchTerm || statusFilter !== "all" ? (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              پاک کردن فیلترها
            </Button>
          ) : null}
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto rounded-xl border-none shadow-xl bg-white/95 backdrop-blur-sm"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold flex items-center">
              <Settings className="h-5 w-5 mr-2 text-blue-500" />
              تنظیمات فرم
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              تنظیم زمان ثبت نام و تخصیص به کلاس‌ها و معلم‌ها
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <Label
                  htmlFor="start-date"
                  className="flex items-center mb-2 text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 ml-2 text-blue-500" />
                  تاریخ شروع ثبت نام
                </Label>
                <div className="relative">
                  <DatePicker
                    value={selectedForm?.formStartEntryDatetime}
                    onChange={handleStartDateChange}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="w-full p-2 border rounded-xl custom-datepicker shadow-sm bg-white transition-all focus-within:shadow-md"
                    inputClass="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none text-sm"
                    format="YYYY/MM/DD  HH:mm"
                    plugins={[
                      <TimePicker
                        key="start-time"
                        hideSeconds
                        position="bottom"
                      />,
                    ]}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="end-date"
                  className="flex items-center mb-2 text-sm font-medium"
                >
                  <Calendar className="h-4 w-4 ml-2 text-red-500" />
                  تاریخ پایان ثبت نام
                </Label>
                <div className="relative">
                  <DatePicker
                    value={selectedForm?.formEndEntryDateTime}
                    onChange={handleEndDateChange}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    className="w-full p-2 border rounded-xl custom-datepicker shadow-sm bg-white transition-all focus-within:shadow-md"
                    inputClass="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none text-sm"
                    format="YYYY/MM/DD  HH:mm"
                    plugins={[
                      <TimePicker
                        key="end-time"
                        hideSeconds
                        position="bottom"
                      />,
                    ]}
                  />
                </div>
              </div>

              {/* Classes Section */}
              <div className="mt-3 bg-gray-50 p-4 rounded-xl">
                <Label className="flex items-center mb-3 text-sm font-medium">
                  <BookOpen className="h-4 w-4 ml-2 text-indigo-500" />
                  کلاس‌ها
                </Label>

                {loadingData ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                    <p className="text-sm text-gray-500 pr-3">
                      در حال بارگذاری کلاس‌ها...
                    </p>
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">هیچ کلاسی یافت نشد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-xl bg-white shadow-inner">
                    {classes.map((cls) => (
                      <div
                        key={cls._id}
                        className="flex items-center space-x-2 space-x-reverse hover:bg-blue-50 p-2 rounded-lg transition-colors"
                      >
                        <Checkbox
                          id={`class-${cls._id}`}
                          checked={selectedForm?.assignedClassCodes?.includes(
                            cls.data.classCode
                          )}
                          onCheckedChange={() =>
                            handleClassToggle(cls._id, cls.data.classCode)
                          }
                          className="text-blue-500"
                        />
                        <label
                          htmlFor={`class-${cls._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {cls.data.className}
                          <span className="text-xs text-gray-500 mr-1">
                            ({cls.data.classCode})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teachers Section */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <Label className="flex items-center mb-3 text-sm font-medium">
                  <Users className="h-4 w-4 ml-2 text-green-500" />
                  معلم‌ها
                </Label>

                {loadingData ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                    <p className="text-sm text-gray-500 pr-3">
                      در حال بارگذاری معلم‌ها...
                    </p>
                  </div>
                ) : teachers.length === 0 ? (
                  <div className="text-center py-3 bg-gray-100 rounded-lg">
                    <p className="text-sm text-gray-500">هیچ معلمی یافت نشد</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 border rounded-xl bg-white shadow-inner">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        className="flex items-center space-x-2 space-x-reverse hover:bg-green-50 p-2 rounded-lg transition-colors"
                      >
                        <Checkbox
                          id={`teacher-${teacher._id}`}
                          checked={selectedForm?.assignedTeacherCodes?.includes(
                            teacher.data.teacherCode
                          )}
                          onCheckedChange={() =>
                            handleTeacherToggle(
                              teacher._id,
                              teacher.data.teacherCode
                            )
                          }
                          className="text-green-500"
                        />
                        <label
                          htmlFor={`teacher-${teacher._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {teacher.data.teacherName}
                          <span className="text-xs text-gray-500 mr-1">
                            ({teacher.data.teacherCode})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Editable Option */}
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="form-editable"
                      className="text-sm font-medium flex items-center"
                    >
                      <Edit2 className="h-4 w-4 ml-2 text-blue-500" />
                      امکان ویرایش فرم
                    </Label>
                    <p className="text-xs text-gray-500 mt-1 mr-6">
                      کاربران می‌توانند پاسخ‌های خود را ویرایش کنند
                    </p>
                  </div>
                  <Checkbox
                    id="form-editable"
                    checked={selectedForm?.isEditable}
                    onCheckedChange={handleEditableChange}
                    className="h-5 w-5 data-[state=checked]:bg-blue-500"
                  />
                </div>
              </div>

              {/* Show the dates in a readable format */}
              <div className="mt-2 text-sm text-gray-600 bg-blue-50/50 p-4 rounded-xl">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1" />
                  خلاصه وضعیت
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <CalendarDays className="h-4 w-4 text-blue-500 ml-2" />
                    <div>
                      <div className="text-xs text-gray-500">شروع ثبت نام</div>
                      <div className="font-medium">
                        {showFormattedDate(
                          selectedForm?.formStartEntryDatetime
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-white rounded-lg shadow-sm">
                    <CalendarOff className="h-4 w-4 text-red-500 ml-2" />
                    <div>
                      <div className="text-xs text-gray-500">پایان ثبت نام</div>
                      <div className="font-medium">
                        {showFormattedDate(selectedForm?.formEndEntryDateTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(false)}
              className="rounded-xl hover:bg-gray-100"
            >
              انصراف
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              ذخیره تنظیمات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteFormId}
        onOpenChange={() => setDeleteFormId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              form and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
