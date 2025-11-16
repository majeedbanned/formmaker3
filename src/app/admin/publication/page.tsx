"use client";

import { Suspense, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PublicationEditor from "./components/PublicationEditor";
import PublicationTemplates from "./components/PublicationTemplates";
import PublicationHistory from "./components/PublicationHistory";
import { Loader2 } from "lucide-react";
import { TemplateData } from "./components/types";

function PublicationPageContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(
    null
  );
  const [templatesKey, setTemplatesKey] = useState(Date.now());

  // Function to refresh templates list
  const refreshTemplates = useCallback(() => {
    // Update the key to force re-render of the templates component
    setTemplatesKey(Date.now());
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Check for user permissions
  // For now, only allow admins and teachers
  if (!user || (user.userType !== "school" && user.userType !== "teacher")) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block rounded-full h-12 w-12 bg-red-100 p-2 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            دسترسی محدود شده
          </h3>
          <p className="mt-2 text-gray-500">
            شما دسترسی لازم برای مشاهده این صفحه را ندارید
          </p>
        </div>
      </div>
    );
  }

  // Handle template selection
  const handleSelectTemplate = (template: TemplateData) => {
    // console.log("Selected template for editing:", template);
    // console.log("Template ID:", template.id);

    // Set the template with an artificial delay to ensure component re-renders properly
    setTimeout(() => {
      setSelectedTemplate(template);
      setActiveTab("editor");
    }, 50);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-right">
          سامانه انتشار و مکاتبات
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8 text-right">
          <Tabs
            defaultValue="editor"
            value={activeTab}
            onValueChange={(val) => {
              // Reset selected template if moving back to templates tab
              if (val === "templates") {
                setSelectedTemplate(null);
              }
              setActiveTab(val);
            }}
            className="w-full"
            dir="rtl"
          >
            <TabsList className="mb-6">
              <TabsTrigger value="editor">نامه جدید</TabsTrigger>
              <TabsTrigger value="templates">قالب‌ها</TabsTrigger>
              <TabsTrigger value="history">تاریخچه انتشارات</TabsTrigger>
            </TabsList>

            <TabsContent value="editor">
              <PublicationEditor
                user={user}
                initialTemplate={selectedTemplate}
                onTemplateUpdate={refreshTemplates}
                key={
                  selectedTemplate
                    ? `template-${selectedTemplate.id}`
                    : "new-publication"
                }
              />
            </TabsContent>

            <TabsContent value="templates">
              <PublicationTemplates
                user={user}
                onSelectTemplate={handleSelectTemplate}
                key={templatesKey}
              />
            </TabsContent>

            <TabsContent value="history">
              <PublicationHistory user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

export default function PublicationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin h-10 w-10" />
        </div>
      }
    >
      <PublicationPageContent />
    </Suspense>
  );
}
