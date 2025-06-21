"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import FormBuilderList from "./components/FormBuilderList";
import FormBuilderEditor from "./components/FormBuilderEditor";
import FormPreview from "./components/FormPreview";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import "./rtl.css";

export default function FormBuilderPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingForm, setEditingForm] = useState<any>(null);
  const { user, isLoading } = useAuth();

  const handleCreateForm = () => {
    if (!user) {
      toast.error("لطفا ابتدا وارد حساب کاربری خود شوید");
      return;
    }

    setEditingForm({
      title: "فرم جدید",
      fields: [],
      metadata: {
        createdBy: user.username,
      },
    });
    setActiveTab("editor");
  };

  const handleEditForm = (form: any) => {
    // Only allow editing if this is the creator or a school admin
    if (
      user?.userType !== "school" &&
      form.metadata?.createdBy !== user?.username
    ) {
      toast.error("شما اجازه ویرایش این فرم را ندارید");
      return;
    }

    setEditingForm(form);
    setActiveTab("editor");
  };

  const handleSaveForm = async (form: any) => {
    try {
      if (!user) {
        toast.error("لطفا ابتدا وارد حساب کاربری خود شوید");
        return;
      }

      // Ensure createdBy is set to current user
      if (!form.metadata) {
        form.metadata = {};
      }

      // Only set creator if not already present (for new forms)
      if (!form.metadata.createdBy) {
        form.metadata.createdBy = user.username;
      }

      // API call handled in the editor component

      // Save successful
      setEditingForm(null);
      setActiveTab("list");
    } catch (error) {
      console.error("Error saving form:", error);
      toast.error("خطا در ذخیره فرم");
      // Stay on editor in case of error
    }
  };

  const handleCancelEdit = () => {
    setEditingForm(null);
    setActiveTab("list");
  };

  const handlePreviewForm = (form: any) => {
    setEditingForm(form);
    setActiveTab("preview");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>در حال بارگذاری اطلاعات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          دسترسی نامعتبر
        </h3>
        <p className="text-yellow-600">
          لطفا وارد حساب کاربری خود شوید تا بتوانید به این بخش دسترسی پیدا کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto  py-8 rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">فرم ساز</h1>
        <Button onClick={handleCreateForm} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 ml-2" />
          ایجاد فرم جدید
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full text-right"
      >
        <TabsList className="grid w-full grid-cols-3 ">
          <TabsTrigger value="preview" disabled={!editingForm}>
            پیش‌نمایش
          </TabsTrigger>
          <TabsTrigger value="editor" disabled={!editingForm}>
            ویرایشگر فرم
          </TabsTrigger>
          <TabsTrigger value="list">فرم‌های من</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <FormBuilderList
            onEdit={handleEditForm}
            onPreview={handlePreviewForm}
          />
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          {editingForm && (
            <FormBuilderEditor
              form={editingForm}
              onSave={handleSaveForm}
              onCancel={handleCancelEdit}
            />
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {editingForm && (
            <FormPreview
              form={editingForm}
              onBack={() => setActiveTab("editor")}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
