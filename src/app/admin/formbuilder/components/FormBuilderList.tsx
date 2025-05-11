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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.map((form) => (
          <Card key={form._id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg">{form.title}</h3>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(form)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(form)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSettingsClick(form)}
                    title="تنظیمات فرم"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Link
                    target="_blank"
                    href={`/admin/formbuilder/view?id=${form._id}`}
                  >
                    <Button variant="ghost" size="sm" title="مشاهده مستقل فرم">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <FormSubmissionViewer
                    formId={form._id!}
                    formTitle={form.title}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(form._id!)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Fields: {form.fields?.length || 0}</p>
                <div className="flex justify-between items-center mt-1">
                  <p>
                    Last updated:{" "}
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
