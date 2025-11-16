"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import FormPreview from "../../../admin/formbuilder/components/FormPreview";
import { FormSchema } from "../../../admin/formbuilder/components/FormBuilderList";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import "./rtl.css";

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

// Create a wrapper component that uses searchParams
function FormViewWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = searchParams.get("id");

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingEntry, setExistingEntry] = useState<FormEntry | undefined>(
    undefined
  );
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [userAlreadySubmitted, setUserAlreadySubmitted] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(false);

  useEffect(() => {
    // console.log("Form ID from URL:", formId);

    if (!formId) {
      setError("شناسه فرم مشخص نشده است");
      setLoading(false);
      return;
    }

    // Fetch the form data
    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiUrl = `/api/formbuilder/${formId}`;
        // console.log("Fetching from API URL:", apiUrl);

        // Use a more detailed fetch with error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

        const response = await fetch(apiUrl, {
          headers: {
            "x-domain": window.location.host,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check for HTTP errors
        if (!response.ok) {
          console.error(
            "API response not OK:",
            response.status,
            response.statusText
          );
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(
            `خطا در دریافت اطلاعات فرم (${response.status}: ${response.statusText})`
          );
        }

        // Log response headers for debugging
        // console.log(
        //  "Response headers:",
        //  Object.fromEntries([...response.headers.entries()])
       // );

        // Parse response carefully
        let data;
        try {
          data = await response.json();
          // console.log("Received form data:", data);
        } catch (jsonError) {
          console.error("JSON parse error:", jsonError);
          throw new Error("داده برگشتی از سرور قابل پردازش نیست");
        }

        // Validate form data structure
        if (!data || !data.title || !Array.isArray(data.fields)) {
          console.error("Invalid form data structure:", data);
          throw new Error("فرم دریافت شده ساختار نامعتبری دارد");
        }

        setForm(data);

        // If form is editable, check for existing entries
        if (data.isEditable) {
          fetchExistingEntry(data._id);
        }

        // If form has oneTimeFillOnly enabled, check if user has already submitted
        if (data.oneTimeFillOnly) {
          checkUserSubmission(data._id);
        }
      } catch (err) {
        // Handle AbortController timeout
        const error = err as Error;
        if (error && error.name === "AbortError") {
          setError("زمان دریافت اطلاعات به پایان رسید. لطفا دوباره تلاش کنید");
        } else {
          console.error("Error fetching form:", err);
          setError(
            err instanceof Error ? err.message : "خطا در دریافت اطلاعات فرم"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchForm();

    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [formId]);

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
        // console.log("Found existing entry:", data.submissions[0]);
        setExistingEntry(data.submissions[0]);
      } else {
        // console.log("No existing entries found");
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
        // console.log("User has already submitted this form");
        setUserAlreadySubmitted(true);
      } else {
        // console.log("User has not submitted this form yet");
        setUserAlreadySubmitted(false);
      }
    } catch (error) {
      console.error("Error checking user submission:", error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const handleBack = () => {
    router.push("/admin/formbuilder");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 rtl" dir="rtl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت به لیست فرم‌ها
            </Button>
          </div>

          <div className="border rounded-lg p-6">
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
    );
  }

  if (error || !form) {
    return (
      <div className="container mx-auto py-8 rtl" dir="rtl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت به لیست فرم‌ها
            </Button>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>خطا</AlertTitle>
            <AlertDescription>
              {error || "فرم مورد نظر یافت نشد"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show message if user has already submitted and form is oneTimeFillOnly
  if (form.oneTimeFillOnly && userAlreadySubmitted) {
    return (
      <div className="container mx-auto py-8 rtl" dir="rtl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت به لیست فرم‌ها
            </Button>
          </div>

          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">
              فرم قبلاً تکمیل شده
            </AlertTitle>
            <AlertDescription className="text-orange-700">
              شما قبلاً این فرم را تکمیل کرده‌اید. این فرم تنها یک بار قابل
              تکمیل است و امکان تکمیل مجدد آن وجود ندارد.
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {form.title}
            </h3>
            <p className="text-gray-500 mb-4">
              این فرم با موفقیت توسط شما ارسال شده است.
            </p>
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 rtl" dir="rtl">
      <FormPreview
        form={form}
        onBack={handleBack}
        isEditable={form.isEditable}
        existingEntry={existingEntry}
        loadingEntry={loadingEntry || checkingSubmission}
      />
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto py-8 rtl" dir="rtl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" disabled>
            <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت به لیست فرم‌ها
          </Button>
        </div>
        <div className="border rounded-lg p-6">
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
  );
}

// Main page component with Suspense boundary
export default function ViewFormPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FormViewWrapper />
    </Suspense>
  );
}
