"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// Define types for classes and teachers
interface ClassData {
  _id: string;
  data: {
    className: string;
    classCode: string;
    Grade?: string;
    major?: string;
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

  useEffect(() => {
    fetchForms();
    fetchSubmissionCounts();
  }, []);

  useEffect(() => {
    if (settingsOpen) {
      fetchClassesAndTeachers();
    }
  }, [settingsOpen]);

  const fetchForms = async () => {
    try {
      setLoading(true);
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
      setClasses(data.classes || []);
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
    return <div className="text-center py-8">Loading forms...</div>;
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-500 mb-4">No forms found</p>
        <p className="text-gray-400">Create a new form to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در فرم‌ها..."
              className="w-full p-2 pr-8 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="h-4 w-4 absolute top-3 right-2 text-gray-400" />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="وضعیت فرم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه فرم‌ها</SelectItem>
              <SelectItem value="active">فرم‌های فعال</SelectItem>
              <SelectItem value="upcoming">فرم‌های آینده</SelectItem>
              <SelectItem value="expired">فرم‌های منقضی شده</SelectItem>
              <SelectItem value="open">فرم‌های باز</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {filteredForms.length} فرم یافت شد
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredForms.map((form) => (
          <Card key={form._id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{form.title}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>گزینه‌های فرم</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(form)}>
                      <Edit className="h-4 w-4 ml-2" />
                      <span>ویرایش فرم</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPreview(form)}>
                      <Eye className="h-4 w-4 ml-2" />
                      <span>پیش‌نمایش فرم</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSettingsClick(form)}>
                      <Settings className="h-4 w-4 ml-2" />
                      <span>تنظیمات فرم</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        className="flex items-center cursor-pointer"
                        target="_blank"
                        href={`/admin/formbuilder/view?id=${form._id}`}
                      >
                        <ExternalLink className="h-4 w-4 ml-2" />
                        <span>مشاهده مستقل فرم</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FormSubmissionViewer
                        formId={form._id!}
                        formTitle={form.title}
                        trigger={
                          <div className="flex items-center w-full">
                            <FileText className="h-4 w-4 ml-2" />
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
                      onClick={() => handleExportSubmissions(form._id!, "json")}
                    >
                      <FileJson className="h-4 w-4 ml-2" />
                      <span>دریافت با فرمت JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportSubmissions(form._id!, "csv")}
                    >
                      <FileText className="h-4 w-4 ml-2" />
                      <span>دریافت با فرمت CSV</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(form._id!)}
                      className="text-red-600 focus:text-red-700"
                    >
                      <Trash className="h-4 w-4 ml-2" />
                      <span>حذف فرم</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm text-gray-500">
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="outline" className="bg-gray-100">
                    {form.fields?.length || 0} فیلد
                  </Badge>

                  {form.isMultiStep && (
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800"
                    >
                      چند مرحله‌ای
                    </Badge>
                  )}

                  {form.isEditable && (
                    <Badge
                      variant="outline"
                      className="bg-indigo-100 text-indigo-800"
                    >
                      قابل ویرایش
                    </Badge>
                  )}

                  {/* Show form status */}
                  <Badge
                    variant="outline"
                    className={getFormStatus(form).color}
                  >
                    {getFormStatus(form).label}
                  </Badge>
                </div>

                <div className="mt-2 text-xs space-y-1">
                  {form.formStartEntryDatetime && (
                    <p className="flex items-center gap-1">
                      <span>از:</span>{" "}
                      {showFormattedDate(form.formStartEntryDatetime)}
                    </p>
                  )}
                  {form.formEndEntryDateTime && (
                    <p className="flex items-center gap-1">
                      <span>تا:</span>{" "}
                      {showFormattedDate(form.formEndEntryDateTime)}
                    </p>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                  <p className="text-xs">
                    بروزرسانی:{" "}
                    {new Date(form.updatedAt || "").toLocaleDateString("fa-IR")}
                  </p>
                  {form._id && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600"
                    >
                      {submissionCounts[form._id] || 0} پاسخ
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>تنظیمات فرم</DialogTitle>
            <DialogDescription>
              تنظیم زمان ثبت نام و تخصیص به کلاس‌ها و معلم‌ها
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="start-date" className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 ml-2" />
                  تاریخ شروع ثبت نام
                </Label>
                <DatePicker
                  value={selectedForm?.formStartEntryDatetime}
                  onChange={handleStartDateChange}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  className="w-full p-2 border rounded-md custom-datepicker"
                  inputClass="w-full p-2 border rounded-md"
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
              <div>
                <Label htmlFor="end-date" className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 ml-2" />
                  تاریخ پایان ثبت نام
                </Label>
                <DatePicker
                  value={selectedForm?.formEndEntryDateTime}
                  onChange={handleEndDateChange}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  className="w-full p-2 border rounded-md custom-datepicker"
                  inputClass="w-full p-2 border rounded-md"
                  format="YYYY/MM/DD  HH:mm"
                  plugins={[
                    <TimePicker key="end-time" hideSeconds position="bottom" />,
                  ]}
                />
              </div>

              {/* Classes Section */}
              <div className="mt-6">
                <Label className="flex items-center mb-2">
                  <BookOpen className="h-4 w-4 ml-2" />
                  کلاس‌ها
                </Label>

                {loadingData ? (
                  <p className="text-sm text-gray-500">
                    در حال بارگذاری کلاس‌ها...
                  </p>
                ) : classes.length === 0 ? (
                  <p className="text-sm text-gray-500">هیچ کلاسی یافت نشد</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {classes.map((cls) => (
                      <div
                        key={cls._id}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Checkbox
                          id={`class-${cls._id}`}
                          checked={selectedForm?.assignedClassCodes?.includes(
                            cls.data.classCode
                          )}
                          onCheckedChange={() =>
                            handleClassToggle(cls._id, cls.data.classCode)
                          }
                        />
                        <label
                          htmlFor={`class-${cls._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {cls.data.className} ({cls.data.classCode})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Teachers Section */}
              <div className="mt-4">
                <Label className="flex items-center mb-2">
                  <Users className="h-4 w-4 ml-2" />
                  معلم‌ها
                </Label>

                {loadingData ? (
                  <p className="text-sm text-gray-500">
                    در حال بارگذاری معلم‌ها...
                  </p>
                ) : teachers.length === 0 ? (
                  <p className="text-sm text-gray-500">هیچ معلمی یافت نشد</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher._id}
                        className="flex items-center space-x-2 space-x-reverse"
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
                        />
                        <label
                          htmlFor={`teacher-${teacher._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {teacher.data.teacherName} ({teacher.data.teacherCode}
                          )
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Editable Option */}
              <div className="mt-6">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="form-editable"
                    checked={selectedForm?.isEditable}
                    onCheckedChange={handleEditableChange}
                  />
                  <label
                    htmlFor="form-editable"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    امکان ویرایش فرم پس از ثبت (کاربران می‌توانند پاسخ‌های خود
                    را ویرایش کنند)
                  </label>
                </div>
              </div>

              {/* Show the dates in a readable format */}
              <div className="mt-4 text-sm text-gray-500">
                <div className="flex flex-col space-y-1">
                  <div>
                    شروع ثبت نام:{" "}
                    {showFormattedDate(selectedForm?.formStartEntryDatetime)}
                  </div>
                  <div>
                    پایان ثبت نام:{" "}
                    {showFormattedDate(selectedForm?.formEndEntryDateTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleSaveSettings}>ذخیره تنظیمات</Button>
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
