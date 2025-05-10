"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import FormPreview from "../components/FormPreview";
import { FormSchema } from "../components/FormBuilderList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import "./rtl.css";

// Create a wrapper component that uses searchParams
function FormViewWrapper() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const formId = searchParams.get("id");

  const [form, setForm] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Form ID from URL:", formId);

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
        console.log("Fetching from API URL:", apiUrl);

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
        console.log(
          "Response headers:",
          Object.fromEntries([...response.headers.entries()])
        );

        // Parse response carefully
        let data;
        try {
          data = await response.json();
          console.log("Received form data:", data);
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

  return (
    <div className="container mx-auto py-8 rtl" dir="rtl">
      <FormPreview form={form} onBack={handleBack} />
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
