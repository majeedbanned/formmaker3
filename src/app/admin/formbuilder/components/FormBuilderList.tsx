"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Trash, FileText } from "lucide-react";
import { FormSubmissionViewer } from "./FormSubmissionViewer";
import { Badge } from "@/components/ui/badge";
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

// Define the Form type based on our requirements
export interface FormSchema {
  _id?: string;
  title: string;
  fields: FormField[];
  steps?: FormStep[];
  isMultiStep?: boolean;
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

  useEffect(() => {
    fetchForms();
    fetchSubmissionCounts();
  }, []);

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
