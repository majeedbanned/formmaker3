"use client";

import React, { useState } from "react";
import FormModal from "@/components/FormModal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/types/crud";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function AutocompleteDemoPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (data: Record<string, unknown>) => {
    setLoading(true);
    try {
      // console.log("Form data submitted:", data);
      toast.success("Form data submitted successfully");
      setIsFormOpen(false);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form data");
    } finally {
      setLoading(false);
    }
  };

  // Sample form structure with various autocomplete examples
  const formStructure: FormField[] = [
    {
      name: "title",
      title: "Demo Form Title",
      type: "label",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      labelStyle: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        color: "#1f2937",
        textAlign: "center",
      },
    },
    {
      name: "description",
      title:
        "This form demonstrates the enhanced autocomplete functionality with multiple label fields.",
      type: "label",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      labelStyle: {
        fontSize: "1rem",
        color: "#6b7280",
        textAlign: "center",
      },
    },
    // Basic autocomplete with single label field
    {
      name: "basicAutocomplete",
      title: "Basic Autocomplete (Single Label)",
      type: "autoCompleteText",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: true,
      isMultiple: false,
      dataSource: {
        collectionName: "students",
        labelField: "studentName",
        valueField: "studentCode",
        sortField: "studentName",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
      },
      autoCompleteStyle: {
        allowNew: false,
        minLength: 2,
      },
    },
    // Advanced autocomplete with two label fields
    {
      name: "twoLabelAutocomplete",
      title: "Two Label Fields (Name and Family)",
      type: "autoCompleteText",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      isMultiple: true,
      dataSource: {
        collectionName: "students",
        labelField: "studentName",
        labelField2: "studentFamily",
        valueField: "studentCode",
        sortField: "studentFamily",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
      },
      autoCompleteStyle: {
        allowNew: false,
        maxTags: 3,
        minLength: 2,
      },
    },
    // Advanced autocomplete with three label fields
    {
      name: "threeLabelAutocomplete",
      title: "Three Label Fields (Search works across all fields)",
      type: "autoCompleteText",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      isMultiple: true,
      dataSource: {
        collectionName: "students",
        labelField: "studentName",
        labelField2: "studentFamily",
        labelField3: "studentCode",
        valueField: "studentCode",
        sortField: "studentCode",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
      },
      autoCompleteStyle: {
        allowNew: false,
        maxTags: 5,
        minLength: 2,
      },
    },
    // Custom label format example
    {
      name: "customLabelFormat",
      title: "Custom Label Format",
      type: "autoCompleteText",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      isMultiple: true,
      dataSource: {
        collectionName: "students",
        labelField: "studentName",
        valueField: "studentCode",
        customLabel: "{studentName} {studentFamily} ({studentCode})",
        sortField: "studentName",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
      },
      autoCompleteStyle: {
        allowNew: false,
        maxTags: 5,
        minLength: 2,
      },
    },
    // Autocomplete with custom values allowed
    {
      name: "customValuesAutocomplete",
      title: "Allow Custom Values",
      type: "autoCompleteText",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      isMultiple: true,
      dataSource: {
        collectionName: "students",
        labelField: "studentName",
        labelField2: "studentFamily",
        valueField: "studentCode",
        sortField: "studentName",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
      },
      autoCompleteStyle: {
        allowNew: true, // Allow users to enter custom values
        maxTags: 5,
        minLength: 2,
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Enhanced AutocompleteText Demo
      </h1>
      <p className="text-center mb-4 text-gray-600">
        This demo showcases the new multi-label functionality for autocomplete
        fields.
      </p>
      <p className="text-center mb-8 text-gray-600">
        <strong>New Feature:</strong> Search now works across all label fields!
        Type any part of a name, family name, or ID to find matching results.
      </p>

      <div className="flex justify-center">
        <Button onClick={() => setIsFormOpen(true)} size="lg">
          Open Demo Form
        </Button>
      </div>

      {/* Form modal */}
      <FormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        formStructure={formStructure}
        editingId={null}
        loading={loading}
        collectionName="demo_form"
        layout={{
          direction: "rtl",
          texts: {
            cancelButton: "انصراف",
            selectPlaceholder: "انتخاب کنید...",
            searchPlaceholder: "جستجو...",
            noResultsMessage: "موردی یافت نشد",
            loadingMessage: "در حال بارگذاری...",
          },
        }}
      />
    </div>
  );
}
