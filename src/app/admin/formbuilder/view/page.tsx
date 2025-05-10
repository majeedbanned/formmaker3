"use client";

import { useEffect, useState } from "react";
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

export default function ViewFormPage() {
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

        const response = await fetch(apiUrl, {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (!response.ok) {
          throw new Error(`خطا در دریافت اطلاعات فرم (${response.status})`);
        }

        // Log response headers for debugging
        console.log(
          "Response headers:",
          Object.fromEntries([...response.headers.entries()])
        );

        const data = await response.json();
        console.log("Received form data:", data);

        // Validate form data structure
        if (!data || !data.title || !Array.isArray(data.fields)) {
          throw new Error("فرم دریافت شده ساختار نامعتبری دارد");
        }

        setForm(data);
      } catch (err) {
        console.error("Error fetching form:", err);
        setError(
          err instanceof Error ? err.message : "خطا در دریافت اطلاعات فرم"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
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
