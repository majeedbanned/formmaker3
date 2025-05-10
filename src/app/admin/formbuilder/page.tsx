"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from "lucide-react";
import FormBuilderList from "./components/FormBuilderList";
import FormBuilderEditor from "./components/FormBuilderEditor";
import FormPreview from "./components/FormPreview";
import "./rtl.css";

export default function FormBuilderPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingForm, setEditingForm] = useState<any>(null);

  const handleCreateForm = () => {
    setEditingForm({
      title: "فرم جدید",
      fields: [],
    });
    setActiveTab("editor");
  };

  const handleEditForm = (form: any) => {
    setEditingForm(form);
    setActiveTab("editor");
  };

  const handleSaveForm = async (form: any) => {
    try {
      // Save successful
      setEditingForm(null);
      setActiveTab("list");
    } catch (error) {
      console.error("Error saving form:", error);
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

  return (
    <div className="container mx-auto py-8 rtl" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">فرم ساز</h1>
        <Button onClick={handleCreateForm} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4 ml-2" />
          ایجاد فرم جدید
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">فرم‌های من</TabsTrigger>
          <TabsTrigger value="editor" disabled={!editingForm}>
            ویرایشگر فرم
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!editingForm}>
            پیش‌نمایش
          </TabsTrigger>
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
