"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Users,
  Edit,
  Eye,
  Activity,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FormSchema {
  _id?: string;
  title: string;
  fields: {
    type: string;
    label: string;
    name: string;
    required?: boolean;
  }[];
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    description?: string;
  };
  formStartEntryDatetime?: string | null;
  formEndEntryDateTime?: string | null;
  assignedClassCodes?: string[];
  assignedTeacherCodes?: string[];
  isEditable?: boolean;
  oneTimeFillOnly?: boolean;
  multipleInstances?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function FormsWidget() {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<
    Record<string, boolean>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchForms();
      fetchUserSubmissions();
    }
  }, [user]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/formbuilder", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user submissions for students
  const fetchUserSubmissions = async () => {
    if (user?.userType !== "student") return;

    try {
      const submissionPromises = forms.map(async (form) => {
        if (!form._id) return { formId: form._id, hasSubmitted: false };

        try {
          const response = await fetch(
            `/api/formbuilder/submissions?formId=${form._id}&limit=1`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return {
              formId: form._id,
              hasSubmitted: data.submissions && data.submissions.length > 0,
            };
          }
        } catch (error) {
          console.error(
            `Error checking submission for form ${form._id}:`,
            error
          );
        }

        return { formId: form._id, hasSubmitted: false };
      });

      const results = await Promise.all(submissionPromises);
      const submissionMap: Record<string, boolean> = {};
      results.forEach(({ formId, hasSubmitted }) => {
        if (formId) {
          submissionMap[formId] = hasSubmitted;
        }
      });

      setUserSubmissions(submissionMap);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
    }
  };

  // Function to get form status and access conditions
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
        canAccess: true,
      };
    if (startDate && startDate > now)
      return {
        status: "upcoming",
        label: "آینده",
        color: "bg-blue-100 text-blue-800",
        canAccess: false,
        message: `قابل دسترسی از ${startDate.toLocaleDateString("fa-IR")}`,
      };
    if (endDate && endDate < now)
      return {
        status: "expired",
        label: "منقضی شده",
        color: "bg-red-100 text-red-800",
        canAccess: false,
        message: `مهلت تکمیل در ${endDate.toLocaleDateString(
          "fa-IR"
        )} به پایان رسید`,
      };
    return {
      status: "active",
      label: "فعال",
      color: "bg-green-100 text-green-800",
      canAccess: true,
    };
  };

  // Function to check if user can access the form
  const canUserAccessForm = (
    form: FormSchema
  ): { canAccess: boolean; reason?: string } => {
    if (!user)
      return { canAccess: false, reason: "ورود به حساب کاربری الزامی است" };

    // Check form status first
    const formStatus = getFormStatus(form);
    if (!formStatus.canAccess) {
      return { canAccess: false, reason: formStatus.message };
    }

    // Check class/teacher assignment restrictions
    if (user.userType === "student") {
      if (form.assignedClassCodes && form.assignedClassCodes.length > 0) {
        // @ts-expect-error - User type doesn't have classCode property in the interface
        const userClassCodes =
          user.classCode?.map((c: { value: string }) => c.value) || [];
        const hasAccess = form.assignedClassCodes.some((code) =>
          userClassCodes.includes(code)
        );
        if (!hasAccess) {
          return {
            canAccess: false,
            reason: "این فرم برای کلاس شما در دسترس نیست",
          };
        }
      }
    } else if (user.userType === "teacher") {
      if (form.assignedTeacherCodes && form.assignedTeacherCodes.length > 0) {
        const hasAccess = form.assignedTeacherCodes.includes(user.username);
        if (!hasAccess) {
          return {
            canAccess: false,
            reason: "این فرم برای شما در دسترس نیست",
          };
        }
      }
    }

    return { canAccess: true };
  };

  // Filter forms based on user access
  const availableForms = forms.filter((form) => {
    if (!user) return false;

    if (user.userType === "school") {
      return true; // School admins see all forms
    }

    if (user.userType === "teacher") {
      return (
        form.metadata?.createdBy === user.username ||
        (form.assignedTeacherCodes &&
          form.assignedTeacherCodes.includes(user.username))
      );
    } else if (user.userType === "student") {
      // Students can see forms assigned to their classes
      if (!form.assignedClassCodes) return false;

      // @ts-ignore - User type doesn't have classCode property in the interface
      const userClassCodes =
        user.classCode?.map((c: { value: string }) => c.value) || [];
      return form.assignedClassCodes.some((code) =>
        userClassCodes.includes(code)
      );
    }

    return false;
  });

  const recentForms = availableForms.slice(0, 5);

  // Get action buttons based on user type and form conditions
  const getActionButtons = (form: FormSchema) => {
    if (!user) return null;

    const accessCheck = canUserAccessForm(form);

    if (user.userType === "student") {
      const hasSubmitted = userSubmissions[form._id || ""];
      const canEdit = form.isEditable && hasSubmitted;

      // Check if form can be accessed
      if (!accessCheck.canAccess) {
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button size="sm" variant="secondary" disabled className="text-xs">
              محدود شده
              <AlertCircle className="h-3 w-3 mr-1" />
            </Button>
          </div>
        );
      }

      // Check if already submitted and oneTimeFillOnly
      if (hasSubmitted && form.oneTimeFillOnly && !canEdit) {
        return (
          <div className="flex items-center space-x-2 space-x-reverse">
            <Button size="sm" variant="outline" disabled className="text-xs">
              تکمیل شده
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
            </Button>
          </div>
        );
      }

      return (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link href={`/admin/formbuilder/view?id=${form._id}`}>
            <Button
              size="sm"
              variant={hasSubmitted && !canEdit ? "outline" : "default"}
              className="text-xs"
            >
              {hasSubmitted ? (canEdit ? "ویرایش" : "مشاهده") : "تکمیل فرم"}
              <ExternalLink className="h-3 w-3 mr-1" />
            </Button>
          </Link>
        </div>
      );
    } else {
      // Teachers and school admins
      const canEdit =
        user.userType === "school" ||
        form.metadata?.createdBy === user.username;

      return (
        <div className="flex items-center space-x-2 space-x-reverse">
          <Link href={`/admin/formbuilder/view?id=${form._id}`}>
            <Button size="sm" variant="outline" className="text-xs">
              <Eye className="h-3 w-3 ml-1" />
              مشاهده
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/admin/formbuilder?edit=${form._id}`}>
              <Button size="sm" variant="outline" className="text-xs">
                <Edit className="h-3 w-3 ml-1" />
                ویرایش
              </Button>
            </Link>
          )}
        </div>
      );
    }
  };

  // Get form submission status message
  const getFormSubmissionStatus = (form: FormSchema) => {
    if (user?.userType === "student") {
      const hasSubmitted = userSubmissions[form._id || ""];
      const accessCheck = canUserAccessForm(form);

      if (!accessCheck.canAccess) {
        return {
          status: "restricted",
          message: "دسترسی محدود",
          color: "text-orange-600",
        };
      }

      if (hasSubmitted) {
        if (form.oneTimeFillOnly && !form.isEditable) {
          return {
            status: "completed",
            message: "تکمیل شده",
            color: "text-green-600",
          };
        } else if (form.isEditable) {
          return {
            status: "editable",
            message: "قابل ویرایش",
            color: "text-blue-600",
          };
        } else {
          return {
            status: "completed",
            message: "تکمیل شده",
            color: "text-green-600",
          };
        }
      } else {
        return {
          status: "pending",
          message: "در انتظار تکمیل",
          color: "text-gray-600",
        };
      }
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">فرم‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">در حال بارگذاری...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">فرم‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableForms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">فرم‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">هیچ فرمی در دسترس نیست</p>
            {user?.userType !== "student" && (
              <Link href="/admin/formbuilder">
                <Button variant="outline" size="sm">
                  رفتن به فرم ساز
                  <ArrowRight className="h-4 w-4 mr-1" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">فرم‌ها</CardTitle>
        <Link href="/admin/formbuilder">
          <Button variant="outline" size="sm" className="h-7 px-2">
            همه
            <ArrowRight className="h-3 w-3 mr-1" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {recentForms.map((form) => {
          const formStatus = getFormStatus(form);
          const submissionStatus = getFormSubmissionStatus(form);

          return (
            <div
              key={form._id}
              className="space-y-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm line-clamp-2 flex-1">
                  {form.title}
                </h3>
                <div className="flex items-center gap-1 mr-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${formStatus.color} border-0`}
                  >
                    {formStatus.label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                {form.metadata?.createdAt && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 ml-1" />
                    {new Date(form.metadata.createdAt).toLocaleDateString(
                      "fa-IR"
                    )}
                  </div>
                )}

                <div className="flex items-center text-xs text-gray-500">
                  <FileText className="h-3 w-3 ml-1" />
                  {form.fields?.length || 0} فیلد
                </div>

                {form.assignedClassCodes &&
                  form.assignedClassCodes.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3 w-3 ml-1" />
                      {form.assignedClassCodes.length} کلاس
                    </div>
                  )}

                {submissionStatus && (
                  <div
                    className={`flex items-center text-xs ${submissionStatus.color}`}
                  >
                    <Activity className="h-3 w-3 ml-1" />
                    {submissionStatus.message}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-1">
                {form.oneTimeFillOnly && (
                  <Badge variant="outline" className="text-xs">
                    یک بار تکمیل
                  </Badge>
                )}
                {form.isEditable && (
                  <Badge variant="outline" className="text-xs">
                    قابل ویرایش
                  </Badge>
                )}
              </div>

              {getActionButtons(form)}
            </div>
          );
        })}

        {availableForms.length > recentForms.length && (
          <div className="pt-2 border-t">
            <Link href="/admin/formbuilder">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                {user?.userType === "student"
                  ? "مشاهده همه فرم‌ها"
                  : "رفتن به فرم ساز"}
                <ArrowRight className="h-4 w-4 mr-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
