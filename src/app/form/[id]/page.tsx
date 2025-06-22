"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import FormPreview from "@/app/admin/formbuilder/components/FormPreview";
import { FormSchema } from "@/app/admin/formbuilder/components/FormBuilderList";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";

// Define the proper type for form entry
interface FormEntry {
  _id: string;
  formId: string;
  formTitle: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
}

// Create a wrapper component that uses params
function FormAccessWrapper() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const { user, isLoading: userLoading } = useAuth();

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingEntry, setExistingEntry] = useState<FormEntry | undefined>(
    undefined
  );
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [userAlreadySubmitted, setUserAlreadySubmitted] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessReason, setAccessReason] = useState<string>("");

  // Function to check form access permissions
  const checkFormAccess = (
    form: FormSchema,
    user: any
  ): { canAccess: boolean; reason?: string } => {
    if (!user) {
      return {
        canAccess: false,
        reason: "لطفا ابتدا وارد حساب کاربری خود شوید",
      };
    }

    // Check time-based restrictions
    const now = new Date();

    if (form.formStartEntryDatetime) {
      const startDate = new Date(form.formStartEntryDatetime);
      if (startDate > now) {
        return {
          canAccess: false,
          reason: `این فرم از تاریخ ${startDate.toLocaleDateString(
            "fa-IR"
          )} قابل دسترسی خواهد بود`,
        };
      }
    }

    if (form.formEndEntryDateTime) {
      const endDate = new Date(form.formEndEntryDateTime);
      if (endDate < now) {
        return {
          canAccess: false,
          reason: `مهلت تکمیل این فرم در تاریخ ${endDate.toLocaleDateString(
            "fa-IR"
          )} به پایان رسیده است`,
        };
      }
    }

    // Check class/teacher assignment restrictions
    if (user.userType === "student") {
      if (form.assignedClassCodes && form.assignedClassCodes.length > 0) {
        const userClassCodes = user.classCode?.map((c: any) => c.value) || [];
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

  // Function to get form status
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
        icon: CheckCircle2,
      };
    if (startDate && startDate > now)
      return {
        status: "upcoming",
        label: "آینده",
        color: "bg-blue-100 text-blue-800",
        icon: Clock,
      };
    if (endDate && endDate < now)
      return {
        status: "expired",
        label: "منقضی شده",
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
      };
    return {
      status: "active",
      label: "فعال",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle2,
    };
  };

  useEffect(() => {
    if (!formId) {
      setError("شناسه فرم مشخص نشده است");
      setLoading(false);
      return;
    }

    if (userLoading) return; // Wait for user authentication

    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/formbuilder/${formId}`, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError("فرم مورد نظر یافت نشد");
          } else {
            setError("خطا در دریافت اطلاعات فرم");
          }
          return;
        }

        const data = await response.json();
        setForm(data);

        // Check form access permissions
        if (user) {
          const accessCheck = checkFormAccess(data, user);
          if (!accessCheck.canAccess) {
            setAccessDenied(true);
            setAccessReason(accessCheck.reason || "دسترسی مجاز نیست");
            return;
          }

          // If form is editable, check for existing entries
          if (data.isEditable) {
            fetchExistingEntry(data._id);
          }

          // If form has oneTimeFillOnly enabled, check if user has already submitted
          if (data.oneTimeFillOnly) {
            checkUserSubmission(data._id);
          }
        }
      } catch (err) {
        console.error("Error fetching form:", err);
        setError("خطا در دریافت اطلاعات فرم");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, user, userLoading]);

  // Function to fetch existing entry for the current user
  const fetchExistingEntry = async (formId: string) => {
    try {
      setLoadingEntry(true);

      const response = await fetch(
        `/api/formbuilder/submissions?formId=${formId}&limit=1`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch existing entries");
        return;
      }

      const data = await response.json();

      if (data && data.submissions && data.submissions.length > 0) {
        setExistingEntry(data.submissions[0]);
      }
    } catch (error) {
      console.error("Error fetching existing entries:", error);
    } finally {
      setLoadingEntry(false);
    }
  };

  // Function to check if user has already submitted this form
  const checkUserSubmission = async (formId: string) => {
    try {
      setCheckingSubmission(true);

      const response = await fetch(
        `/api/formbuilder/submissions?formId=${formId}&limit=1`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to check user submission");
        return;
      }

      const data = await response.json();

      if (data && data.submissions && data.submissions.length > 0) {
        setUserAlreadySubmitted(true);
      } else {
        setUserAlreadySubmitted(false);
      }
    } catch (error) {
      console.error("Error checking user submission:", error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (userLoading || loading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">ورود به حساب کاربری</h3>
            <p className="text-gray-600 mb-4">
              برای دسترسی به این فرم، لطفا ابتدا وارد حساب کاربری خود شوید.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              ورود به حساب کاربری
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">خطا</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleBack} variant="outline">
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-orange-700">
              دسترسی محدود
            </h3>
            <p className="text-gray-600 mb-4">{accessReason}</p>
            <Button onClick={handleBack} variant="outline">
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return <LoadingState />;
  }

  // Check if user has already submitted and form is oneTimeFillOnly
  if (userAlreadySubmitted && form.oneTimeFillOnly && !form.isEditable) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        dir="rtl"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-green-700">
              فرم تکمیل شده
            </h3>
            <p className="text-gray-600 mb-4">
              شما قبلاً این فرم را تکمیل کرده‌اید. این فرم تنها یک بار قابل
              تکمیل است.
            </p>
            <Button onClick={handleBack} variant="outline">
              بازگشت
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formStatus = getFormStatus(form);
  const StatusIcon = formStatus.icon;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت
            </Button>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${formStatus.color} flex items-center gap-1`}
            >
              <StatusIcon className="h-4 w-4" />
              {formStatus.label}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <FormPreview
            form={form}
            onBack={handleBack}
            isEditable={form.isEditable && userAlreadySubmitted}
            existingEntry={existingEntry}
            loadingEntry={loadingEntry}
          />
        </div>
      </div>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>

          <div className="bg-white rounded-lg p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function FormAccessPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FormAccessWrapper />
    </Suspense>
  );
}
