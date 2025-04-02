"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Entity } from "@/types/crud";

// Components for rendering different field types
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Progress } from "@/components/ui/progress1";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface FormPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  formData?: Entity | null;
  layoutDirection?: "rtl" | "ltr";
  viewOnly?: boolean;
}

// Define types for form fields
interface FormFieldItem {
  fieldType: string;
  fieldTitle: string;
  required: boolean | string;
  items: string;
  fieldOrder: string | number;
  datepickerStyle?: Record<string, unknown>; // Corrected type from 'any' to 'unknown'
}

// Define type for form values
type FormValueType =
  | string
  | number
  | boolean
  | CheckedState
  | UploadedFile
  | null;

// Define type for uploaded file
interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Define type for submission data
interface SubmissionData {
  _id: string;
  formId: string;
  formName: string;
  schoolCode: string;
  username: string;
  answers: Record<string, FormValueType>;
  createdAt: string;
  updatedAt: string;
}

export default function FormPreview({
  isOpen,
  onClose,
  formData = null,
  layoutDirection = "rtl",
  viewOnly = false,
}: FormPreviewProps) {
  const { user } = useAuth();
  const [formValues, setFormValues] = useState<Record<string, FormValueType>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorFields, setErrorFields] = useState<string[]>([]);
  const [existingSubmission, setExistingSubmission] =
    useState<SubmissionData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formSchoolCode, setFormSchoolCode] = useState("");
  const [fileUploads, setFileUploads] = useState<
    Record<
      string,
      { progress: number; uploading: boolean; error: string | null }
    >
  >({});

  // Fetch existing submission data when dialog opens
  useEffect(() => {
    if (formData) {
      // Extract school code from form data
      setFormSchoolCode((formData.data.schoolCode as string) || "");

      // If we have existing answers from props and we're in view-only mode, use them directly
      if (viewOnly && formData.data._existingAnswers) {
        setFormValues(
          formData.data._existingAnswers as Record<string, FormValueType>
        );
        return;
      }
    }

    // Only fetch from API if not in view-only mode
    if (!viewOnly) {
      const fetchExistingSubmission = async () => {
        if (!isOpen || !formData || !user || !isFormEditable) return;

        try {
          setLoading(true);
          const response = await fetch(
            `/api/formsInput/getUserSubmission?formId=${formData._id}&username=${user.username}&schoolCode=${formSchoolCode}`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch submission data");
          }

          const result = await response.json();

          if (result.found) {
            setExistingSubmission(result.submission);
            setIsEditMode(true);

            // Populate form values from existing submission
            if (result.submission.answers) {
              setFormValues(
                result.submission.answers as Record<string, FormValueType>
              );
            }
          } else {
            setIsEditMode(false);
            setFormValues({});
          }
        } catch (error) {
          console.error("Error fetching existing submission:", error);
          toast.error("خطا در بازیابی اطلاعات", {
            description: "امکان بازیابی اطلاعات قبلی وجود ندارد.",
          });
        } finally {
          setLoading(false);
        }
      };

      // Only fetch if we have the necessary data and form is editable
      if (isOpen && formData && user) {
        // Check if form is editable (depends on formData being available)
        const isFormEditable = formData.data.formType === "0";
        if (isFormEditable) {
          fetchExistingSubmission();
        }
      }
    }
  }, [isOpen, formData, user, formSchoolCode, viewOnly]);

  if (!formData) return null;

  // Extract form fields from formData
  const formFields = (formData.data.formFields as FormFieldItem[]) || [];

  // Sort form fields by fieldOrder
  const sortedFields = [...formFields].sort((a, b) => {
    const orderA = Number(a.fieldOrder) || 0;
    const orderB = Number(b.fieldOrder) || 0;
    return orderA - orderB;
  });

  // Get basic form information
  const formName = (formData.data.formName as string) || "فرم";
  const formType =
    formData.data.formType === "0" ? "قابل ویرایش" : "غیرقابل ویرایش";
  const startDate = (formData.data.startDate as string) || "";
  const endDate = (formData.data.endDate as string) || "";
  const schoolCode = (formData.data.schoolCode as string) || "";

  // Check if form is editable
  const isFormEditable = formData.data.formType === "0";

  // Handle input change
  const handleInputChange = (fieldId: string, value: FormValueType) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Remove from error fields if it was previously marked as error
    if (errorFields.includes(fieldId)) {
      setErrorFields(errorFields.filter((id) => id !== fieldId));
    }
  };

  // Function to handle file upload
  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!formData || !formData._id) return;

    // Set initial upload state
    setFileUploads((prev) => ({
      ...prev,
      [fieldId]: { progress: 0, uploading: true, error: null },
    }));

    try {
      // Create form data for upload
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("filename", file.name);
      uploadData.append("formId", formData._id);
      uploadData.append(
        "schoolCode",
        formSchoolCode || (formData.data.schoolCode as string) || ""
      );

      // Create fetch request with progress tracking
      const xhr = new XMLHttpRequest();

      // Setup progress handler
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setFileUploads((prev) => ({
            ...prev,
            [fieldId]: { ...prev[fieldId], progress },
          }));
        }
      });

      // Wait for the upload to complete
      const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
        xhr.open("POST", "/api/formfiles/upload");

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.file) {
                resolve(response.file as UploadedFile);
              } else {
                reject(new Error(response.error || "Upload failed"));
              }
            } catch (err) {
              console.error("Error parsing response:", err);
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error(`HTTP error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(uploadData);
      });

      // Wait for upload to complete
      const uploadedFile = await uploadPromise;

      // Update form values with the uploaded file info
      handleInputChange(fieldId, uploadedFile);

      // Clear uploading state
      setFileUploads((prev) => ({
        ...prev,
        [fieldId]: { progress: 100, uploading: false, error: null },
      }));

      // Show success toast
      toast.success("فایل با موفقیت آپلود شد", {
        description: `${file.name} آپلود شد`,
      });
    } catch (error) {
      console.error("File upload error:", error);

      // Update error state
      setFileUploads((prev) => ({
        ...prev,
        [fieldId]: {
          progress: 0,
          uploading: false,
          error: error instanceof Error ? error.message : "خطا در آپلود فایل",
        },
      }));

      // Show error toast
      toast.error("خطا در آپلود فایل", {
        description:
          error instanceof Error ? error.message : "لطفا دوباره تلاش کنید",
      });
    }
  };

  // Function to handle file removal
  const handleFileRemove = (fieldId: string) => {
    handleInputChange(fieldId, null);

    // Reset the upload state for this field
    setFileUploads((prev) => {
      const newState = { ...prev };
      delete newState[fieldId];
      return newState;
    });
  };

  // Function to render form field items based on their type
  const renderFormField = (field: FormFieldItem, index: number) => {
    const fieldId = `field_${index}`;
    const isRequired = field.required === true || field.required === "true";
    const hasError = errorFields.includes(fieldId);

    const renderFieldContent = () => {
      switch (field.fieldType) {
        case "textbox":
          return (
            <Input
              placeholder={`${field.fieldTitle}...`}
              className={`${hasError ? "border-red-500" : "bg-white"}`}
              value={(formValues[fieldId] as string) || ""}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
            />
          );
        case "number":
          return (
            <Input
              type="number"
              placeholder="0"
              className={`${hasError ? "border-red-500" : "bg-white"}`}
              value={(formValues[fieldId] as string) || ""}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
            />
          );
        case "textarea":
          return (
            <Textarea
              placeholder={`${field.fieldTitle}...`}
              className={`min-h-[100px] ${
                hasError ? "border-red-500" : "bg-white"
              }`}
              value={(formValues[fieldId] as string) || ""}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
            />
          );
        case "dropdown":
          // Parse items string to get dropdown options
          const options = field.items
            .split(",")
            .filter(Boolean)
            .map((item) => item.trim());

          return (
            <Select
              value={(formValues[fieldId] as string) || ""}
              onValueChange={(value) => handleInputChange(fieldId, value)}
            >
              <SelectTrigger className={hasError ? "border-red-500" : ""}>
                <SelectValue placeholder="انتخاب کنید..." />
              </SelectTrigger>
              <SelectContent>
                {options.map((option, i) => (
                  <SelectItem key={i} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        case "checkbox":
          // Parse items string to get checkbox options
          const checkboxOptions = field.items
            .split(",")
            .filter(Boolean)
            .map((item) => item.trim());

          return (
            <div
              className={`flex flex-col gap-2 ${
                hasError ? "border border-red-500 rounded-md p-2" : ""
              }`}
            >
              {checkboxOptions.length > 0 ? (
                checkboxOptions.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      id={`checkbox-${index}-${i}`}
                      checked={
                        formValues[`${fieldId}-${option}`] === true ||
                        formValues[`${fieldId}-${option}`] === "true"
                      }
                      onCheckedChange={(checked) =>
                        handleInputChange(`${fieldId}-${option}`, checked)
                      }
                    />
                    <Label
                      htmlFor={`checkbox-${index}-${i}`}
                      className="text-sm font-normal"
                    >
                      {option}
                    </Label>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-${index}`}
                    checked={(formValues[fieldId] as CheckedState) || false}
                    onCheckedChange={(checked) =>
                      handleInputChange(fieldId, checked)
                    }
                    className={hasError ? "border-red-500" : ""}
                  />
                  <Label
                    htmlFor={`checkbox-${index}`}
                    className="text-sm font-normal"
                  >
                    {field.fieldTitle}
                  </Label>
                </div>
              )}
            </div>
          );
        case "radio":
          // Parse items string to get radio options
          const radioOptions = field.items
            .split(",")
            .filter(Boolean)
            .map((item) => item.trim());

          return (
            <RadioGroup
              value={(formValues[fieldId] as string) || ""}
              onValueChange={(value) => handleInputChange(fieldId, value)}
              className={hasError ? "border-red-500 border rounded-md p-1" : ""}
            >
              {radioOptions.length > 0 ? (
                radioOptions.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-2 space-x-reverse"
                  >
                    <RadioGroupItem value={option} id={`radio-${index}-${i}`} />
                    <Label htmlFor={`radio-${index}-${i}`}>{option}</Label>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem
                    value="option"
                    id={`radio-${index}-default`}
                  />
                  <Label htmlFor={`radio-${index}-default`}>
                    {field.fieldTitle}
                  </Label>
                </div>
              )}
            </RadioGroup>
          );
        case "file":
          // Handle file upload field
          const uploadState = fileUploads[fieldId];
          const fileValue = formValues[fieldId] as UploadedFile | null;

          return (
            <div className="space-y-2">
              {!fileValue && !uploadState?.uploading && (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor={`file-upload-${fieldId}`}
                    className={`flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-lg cursor-pointer 
                    hover:bg-gray-50 ${
                      hasError ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">کلیک کنید</span> یا فایل
                        را به اینجا بکشید
                      </p>
                      <p className="text-xs text-gray-500">
                        SVG, PNG, JPG, PDF تا 10MB
                      </p>
                    </div>
                    <input
                      id={`file-upload-${fieldId}`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(fieldId, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              {uploadState?.uploading && (
                <div className="p-4 border border-gray-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                      <Loader2 className="animate-spin w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">
                        در حال آپلود...
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(fieldId)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">لغو</span>
                    </Button>
                  </div>
                  <Progress value={uploadState.progress} className="h-2" />
                </div>
              )}

              {fileValue && !uploadState?.uploading && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse rtl:space-x-reverse">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <a
                        href={fileValue.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        {fileValue.originalName}
                      </a>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <span className="text-xs text-gray-500">
                        {Math.round(fileValue.size / 1024)} KB
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemove(fieldId)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">حذف</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {uploadState?.error && (
                <div className="text-sm text-red-500 mt-1">
                  خطا: {uploadState.error}
                </div>
              )}
            </div>
          );
        case "date":
          const datePickerProps = {
            calendar: persian,
            locale: persian_fa,
            format: "YYYY/MM/DD", // Standard format for date picker
            ...(field.datepickerStyle || {}), // Apply custom styles
          };

          return (
            <div dir="ltr" className="relative">
              <DatePicker
                value={formValues[fieldId] as string | Date | null}
                onChange={(date) => {
                  // Format the date to a string before saving
                  const formattedDate = date
                    ? date.format(datePickerProps.format)
                    : null;
                  handleInputChange(fieldId, formattedDate);
                }}
                calendar={datePickerProps.calendar}
                locale={datePickerProps.locale}
                format={datePickerProps.format}
                containerClassName="w-full"
                inputClass={`w-full p-2 border rounded-md text-right ${
                  hasError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="YYYY/MM/DD"
                calendarPosition="bottom-right"
              />
            </div>
          );
        default:
          return (
            <div className="text-sm text-gray-500 italic">
              نوع فیلد پشتیبانی نشده
            </div>
          );
      }
    };

    return (
      <div
        key={index}
        className={`space-y-2 mb-6 p-4 bg-white rounded-lg shadow-sm border ${
          hasError ? "border-red-500" : "border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <Label
            className={`text-sm font-medium ${
              isRequired
                ? "after:content-['*'] after:ml-0.5 after:text-red-500"
                : ""
            }`}
          >
            {field.fieldTitle}
          </Label>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
            {field.fieldType === "textbox"
              ? "متن"
              : field.fieldType === "number"
              ? "عدد"
              : field.fieldType === "textarea"
              ? "متن بلند"
              : field.fieldType === "dropdown"
              ? "چند انتخابی"
              : field.fieldType === "checkbox"
              ? "چک باکس"
              : field.fieldType === "radio"
              ? "رادیو"
              : field.fieldType === "file"
              ? "فایل"
              : field.fieldType === "date"
              ? "تاریخ"
              : field.fieldType}
          </div>
        </div>
        {renderFieldContent()}
      </div>
    );
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: string[] = [];

    // Check each required field
    sortedFields.forEach((field, index) => {
      const fieldId = `field_${index}`;
      const isRequired = field.required === true || field.required === "true";

      if (isRequired) {
        // Special handling for date fields
        if (field.fieldType === "date") {
          const dateValue = formValues[fieldId] as string | null;
          if (!dateValue) {
            errors.push(fieldId);
          }
          return;
        }

        // Special handling for file fields
        if (field.fieldType === "file") {
          const fileValue = formValues[fieldId] as UploadedFile | null;
          if (!fileValue) {
            errors.push(fieldId);
          }
          return;
        }

        // Special handling for checkbox fields with multiple items
        if (field.fieldType === "checkbox" && field.items) {
          const checkboxOptions = field.items
            .split(",")
            .filter(Boolean)
            .map((item) => item.trim());

          if (checkboxOptions.length > 0) {
            // For multi-checkbox, check if at least one option is selected
            const hasSelection = checkboxOptions.some(
              (option) =>
                formValues[`${fieldId}-${option}`] === true ||
                formValues[`${fieldId}-${option}`] === "true"
            );

            if (!hasSelection) {
              errors.push(fieldId);
            }
            return;
          }
        }

        // Standard validation for other fields
        const value = formValues[fieldId];
        const isEmpty =
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          errors.push(fieldId);
        }
      }
    });

    setErrorFields(errors);
    return errors.length === 0;
  };

  // Submit form function
  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      toast.error("لطفا فیلدهای الزامی را پر کنید", {
        description: "فیلدهای مشخص شده با رنگ قرمز را تکمیل کنید",
      });
      return;
    }

    // Start submission
    setSubmitting(true);

    try {
      // Create form submission data
      const submissionData = {
        formId: formData._id,
        formName: formName,
        schoolCode: schoolCode,
        username: user?.username || "anonymous",
        answers: formValues,
        // If we're in edit mode, pass the existing submission ID for update
        ...(isEditMode && existingSubmission
          ? { existingId: existingSubmission._id }
          : {}),
      };

      // Send to API
      const response = await fetch("/api/formsInput", {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          isEditMode ? "فرم با موفقیت بروزرسانی شد" : "فرم با موفقیت ثبت شد",
          {
            description: isEditMode
              ? "پاسخ‌های شما با موفقیت بروزرسانی شدند"
              : "پاسخ‌های شما با موفقیت ذخیره شدند",
          }
        );
        // Reset form values
        setFormValues({});
        // Close modal after successful submission
        onClose();
      } else {
        throw new Error(result.error || "خطا در ثبت فرم");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("خطا در ثبت فرم", {
        description:
          error instanceof Error ? error.message : "لطفا دوباره تلاش کنید",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If loading, show a spinner
  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          dir={layoutDirection}
        >
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="mt-4 text-gray-600">در حال بارگذاری اطلاعات...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        dir={layoutDirection}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{formName}</DialogTitle>
          {isEditMode && !viewOnly && (
            <div className="text-sm text-blue-600 mt-1">
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                در حال ویرایش پاسخ‌های قبلی
              </span>
            </div>
          )}
          {viewOnly && (
            <div className="text-sm text-blue-600 mt-1">
              <span className="inline-flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                حالت نمایش
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-bold">نوع فرم:</span> {formType}
            </div>
            <div>
              <span className="font-bold">تعداد فیلدها:</span>{" "}
              {formFields.length}
            </div>
            <div>
              <span className="font-bold">تاریخ شروع:</span> {startDate}
            </div>
            <div>
              <span className="font-bold">تاریخ پایان:</span> {endDate}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="mb-2 font-medium">
          {viewOnly
            ? "مشاهده پاسخ‌ها"
            : isEditMode
            ? "ویرایش پاسخ‌ها"
            : "تکمیل فرم"}
        </div>

        {sortedFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            هیچ فیلدی برای این فرم تعریف نشده است
          </div>
        ) : (
          <div className="space-y-2">{sortedFields.map(renderFormField)}</div>
        )}

        <DialogFooter className="mt-6 flex items-center gap-2 rtl:flex-row-reverse ltr:flex-row">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {viewOnly ? "بستن" : "انصراف"}
          </Button>
          {!viewOnly && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-primary text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "در حال بروزرسانی..." : "در حال ثبت..."}
                </>
              ) : isEditMode ? (
                "بروزرسانی فرم"
              ) : (
                "ثبت فرم"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
