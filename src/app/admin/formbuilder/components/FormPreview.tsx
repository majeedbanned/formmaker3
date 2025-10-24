"use client";

import { useState, useEffect, useRef } from "react";
import { FormSchema, FormField as BaseFormField } from "./FormBuilderList";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileJson,
  ChevronRight,
  ChevronLeft,
  X,
  PlusCircle,
  CheckCircle2,
  Eye,
  Edit,
  Pen,
  RefreshCw,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SignaturePad from "react-signature-canvas";
import { Rating } from "react-simple-star-rating";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { Value } from "react-multi-date-picker";
import "../rtl.css"; // Import RTL styles

// Extend the FormField type to include description
interface FormField extends BaseFormField {
  description?: string;
}

// Define the proper types for existingEntry
interface FormEntry {
  _id: string;
  formId: string;
  formTitle: string;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
}

interface FormPreviewProps {
  form: FormSchema;
  onBack: () => void;
  isEditable?: boolean;
  existingEntry?: FormEntry;
  loadingEntry?: boolean;
}

// Fix the type definitions
interface UploadResult {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Add types for file upload state
interface FileUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

// Add a type for signature data
interface SignatureData {
  signatureDataUrl: string;
  timestamp: string;
}

// SignatureField component to handle the signature pad rendering and state
const SignatureField = ({
  field,
  formField,
}: {
  field: FormField;
  formField: {
    value: SignatureData | null | undefined;
    onChange: (value: SignatureData | null) => void;
  };
}) => {
  const sigPadRef = useRef<SignaturePad>(null);
  const [signatureExists, setSignatureExists] = useState(false);

  // Default signature options
  const defaultWidth = 500;
  const defaultHeight = 200;
  const sigOptions = field.signatureOptions || {};
  const width = sigOptions.width || defaultWidth;
  const height = sigOptions.height || defaultHeight;
  const backgroundColor = sigOptions.backgroundColor || "rgb(248, 250, 252)";
  const penColor = sigOptions.penColor || "rgb(0, 0, 0)";

  // Check if there's an existing signature (in edit mode)
  useEffect(() => {
    const hasExistingSignature =
      formField.value &&
      typeof formField.value === "object" &&
      "signatureDataUrl" in formField.value;

    if (hasExistingSignature && sigPadRef.current) {
      // Set existing signature from the data URL
      const dataUrl = (formField.value as SignatureData).signatureDataUrl;
      if (dataUrl) {
        setSignatureExists(true);
        // Load the image onto the canvas
        const img = new Image();
        img.onload = () => {
          const ctx = sigPadRef.current?.getCanvas().getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = dataUrl;
      }
    }
  }, [formField.value]);

  // Handle signature change
  const handleSignatureEnd = () => {
    if (sigPadRef.current) {
      const isEmpty = sigPadRef.current.isEmpty();
      setSignatureExists(!isEmpty);

      if (!isEmpty) {
        // Save signature data
        const signatureData: SignatureData = {
          signatureDataUrl: sigPadRef.current.toDataURL(),
          timestamp: new Date().toISOString(),
        };
        formField.onChange(signatureData);
      } else {
        formField.onChange(null);
      }
    }
  };

  // Clear signature
  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
      setSignatureExists(false);
      formField.onChange(null);
    }
  };

  return (
    <div className="space-y-3 text-right">
      <div
        className="border rounded-md overflow-hidden"
        style={{ width: width, maxWidth: "100%" }}
      >
        <SignaturePad
          ref={sigPadRef}
          canvasProps={{
            className: "signature-canvas",
            width: width,
            height: height,
            style: {
              width: "100%",
              height: height,
              backgroundColor: backgroundColor,
            },
          }}
          onEnd={handleSignatureEnd}
          penColor={penColor}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Pen className="h-4 w-4 ml-2" />
        {signatureExists
          ? "امضا ثبت شد."
          : "در کادر بالا با موس یا انگشت خود امضا کنید."}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={!signatureExists}
        >
          <RefreshCw className="h-4 w-4 ml-2" /> پاک کردن
        </Button>

        {/* Show timestamp if signature exists and in edit mode */}
        {signatureExists &&
          formField.value &&
          "timestamp" in formField.value && (
            <div className="text-xs text-gray-500 flex items-center">
              آخرین بروزرسانی:{" "}
              {new Date(
                (formField.value as SignatureData).timestamp
              ).toLocaleString("fa-IR")}
            </div>
          )}
      </div>
    </div>
  );
};

// RatingField component to handle the star rating
const RatingField = ({
  field,
  formField,
}: {
  field: FormField;
  formField: {
    value: number | null | undefined;
    onChange: (value: number) => void;
  };
}) => {
  const ratingOptions = field.ratingOptions || {};
  const maxRating = ratingOptions.maxRating || 5;
  const size = ratingOptions.size || "md";
  const color = ratingOptions.color || "#facc15";
  const allowHalf = ratingOptions.allowHalf || false;
  const showCount = ratingOptions.showCount || false;

  // Convert size string to pixel values
  const getSizeInPixels = (size: string) => {
    switch (size) {
      case "sm":
        return 20;
      case "lg":
        return 40;
      default:
        return 30; // md
    }
  };

  // Handle initial value
  const defaultValue =
    typeof formField.value === "number"
      ? formField.value
      : ratingOptions.defaultRating || 0;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="dir-ltr w-full flex justify-end">
        <Rating
          onClick={(rating) => {
            formField.onChange(rating);
          }}
          initialValue={defaultValue}
          size={getSizeInPixels(size)}
          transition
          fillColor={color}
          allowFraction={allowHalf}
          SVGstyle={{ display: "inline-block" }}
          className="rtl:flex-row-reverse"
        />
      </div>
      {showCount &&
        formField.value !== null &&
        formField.value !== undefined &&
        formField.value > 0 && (
          <div className="text-sm text-gray-500">
            امتیاز انتخاب شده: {formField.value} از {maxRating}
          </div>
        )}
    </div>
  );
};

export default function FormPreview({
  form,
  onBack,
  isEditable = false,
  existingEntry,
  loadingEntry = false,
}: FormPreviewProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  // Add state for file uploads
  const [fileUploads, setFileUploads] = useState<
    Record<string, FileUploadState>
  >({});

  // Process steps for multi-step form
  const isMultiStep = form.isMultiStep && form.steps && form.steps.length > 0;
  const steps = isMultiStep
    ? form.steps || []
    : [
        {
          id: "single-step",
          title: form.title,
          fieldIds: form.fields.map((f) => f.name),
        },
      ];

  // Load existing data when available
  useEffect(() => {
    if (existingEntry && isEditable) {
      setIsEditMode(true);
      setEntryId(existingEntry._id);

      // Convert answers to form data format
      const formattedData = formatExistingDataForForm(existingEntry.answers);
      setFormData(formattedData);

      // Wait for next render cycle to ensure methods are initialized
      setTimeout(() => {
        // Reset form with existing data
        methods.reset(formattedData);
        console.log("Form reset with data:", formattedData);
      }, 0);
    }
  }, [existingEntry, isEditable]);

  // Fix the formatExistingDataForForm function to handle data types correctly
  const formatExistingDataForForm = (
    answers: Record<string, unknown>
  ): Record<string, unknown> => {
    const formattedData: Record<string, unknown> = {};

    // Process each answer to match the form field format
    Object.entries(answers).forEach(([key, value]) => {
      // Handle special cases based on field type if needed
      formattedData[key] = value;
    });

    return formattedData;
  };

  // Create Zod validation schema dynamically based on form fields
  const generateValidationSchema = (currentStepFields: FormField[]) => {
    const schema: Record<string, z.ZodTypeAny> = {};

    // Process fields and add to schema
    currentStepFields.forEach((field) => {
      // Skip fields with conditions for initial schema
      if (field.condition) return;

      // Handle nested field groups
      if (field.type === "group") {
        if (field.repeatable) {
          // For repeatable groups, create an array schema
          schema[field.name] = z
            .array(z.object({}).catchall(z.unknown()))
            .optional();
        } else if (field.fields && field.fields.length > 0) {
          // For non-repeatable groups, create a nested object schema
          field.fields.forEach((nestedField) => {
            const fieldKey = `${field.name}.${nestedField.name}`;
            schema[fieldKey] = createFieldSchema(nestedField as FormField);
          });
        }

        return;
      }

      // Standard field schema
      schema[field.name] = createFieldSchema(field);
    });

    return z.object(schema);
  };

  // Helper function to create schema for a single field
  const createFieldSchema = (field: FormField): z.ZodTypeAny => {
    // Create base schema based on field type
    let fieldSchema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
        fieldSchema = z.string();

        // Add regex validation only for text fields
        if (field.validation?.regex) {
          try {
            // Check if regex is valid and convert it to a proper string if needed
            const regexPattern =
              typeof field.validation.regex === "string"
                ? field.validation.regex
                : String(field.validation.regex);

            const regex = new RegExp(regexPattern);
            const validationMessage =
              typeof field.validation.validationMessage === "string"
                ? field.validation.validationMessage
                : "فرمت نامعتبر";

            fieldSchema = z.string().regex(regex, {
              message: validationMessage,
            });
          } catch (e) {
            console.error("Invalid regex pattern", e);
          }
        }
        break;

      case "email":
        fieldSchema = z.string().email("ایمیل نامعتبر است");
        break;

      case "number":
        fieldSchema = z.preprocess(
          (val) => (val === "" ? undefined : Number(val)),
          z.number().optional()
        );
        break;

      case "date":
        // Accept Persian date format with slashes (YYYY/MM/DD) and both English and Persian numerals
        fieldSchema = z.string().regex(/^[\d۰-۹]{4}\/[\d۰-۹]{2}\/[\d۰-۹]{2}$/, {
          message: "لطفا یک تاریخ معتبر انتخاب کنید",
        });
        break;

      case "select":
      case "radio":
        fieldSchema = z.string();
        break;

      case "checkbox":
        // If checkbox has options, it's a multi-select (array), otherwise it's a boolean
        if (field.options && field.options.length > 0) {
          // Checkbox group - array of strings
          fieldSchema = z.preprocess(
            (val) => {
              // Convert to array if not already
              if (Array.isArray(val)) return val;
              if (val === null || val === undefined) return [];
              return [];
            },
            field.required
              ? z.array(z.string()).min(1, {
                  message: `${field.label} الزامی است`,
                })
              : z.array(z.string()).optional()
          );
          // Mark this as a checkbox group so we don't override it later
          (fieldSchema as any)._isCheckboxGroup = true;
        } else {
          // Single checkbox - boolean
          fieldSchema = z.preprocess(
            (val) => {
              // Convert to boolean if not already
              if (typeof val === 'boolean') return val;
              if (Array.isArray(val)) return val.length > 0;
              return false;
            },
            field.required
              ? z.boolean().refine((val) => val === true, {
                  message: "این فیلد الزامی است",
                })
              : z.boolean().optional()
          );
        }
        break;

      case "switch":
        fieldSchema = z.boolean().optional();
        break;

      case "file":
        // For file fields, accept either a File object or a metadata object (for already uploaded files)
        fieldSchema = z
          .union([
            z.instanceof(File),
            z
              .object({
                filename: z.string(),
                originalName: z.string(),
                path: z.string(),
              })
              .passthrough(),
            z.null(),
          ])
          .optional();
        break;

      case "signature":
        // For signature fields, accept either a signature data string or null
        fieldSchema = z
          .object({
            signatureDataUrl: z.string(),
            timestamp: z.string(),
          })
          .nullable()
          .optional();
        break;

      case "rating":
        fieldSchema = z.number().optional();
        break;

      default:
        fieldSchema = z.unknown().optional();
    }

    // Add required validation
    if (field.required) {
      // Skip checkbox groups as they already have required validation
      const isCheckboxGroup = (fieldSchema as any)._isCheckboxGroup;
      
      if (field.type === "checkbox" && !isCheckboxGroup) {
        // Only handle single checkbox here (checkbox groups are already handled)
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: "این فیلد الزامی است",
        });
      } else if (field.type === "switch") {
        fieldSchema = z.boolean().refine((val) => val === true, {
          message: "این فیلد الزامی است",
        });
      } else if (
        ["text", "textarea", "email", "select", "radio", "date"].includes(
          field.type
        )
      ) {
        fieldSchema = z.string().min(1, { message: "این فیلد الزامی است" });
      } else if (field.type === "number") {
        fieldSchema = z.number({ required_error: "این فیلد الزامی است" });
      } else if (field.type === "file") {
        // For required file fields, accept either File object or metadata object
        fieldSchema = z.union(
          [
            z.instanceof(File),
            z
              .object({
                filename: z.string(),
                originalName: z.string(),
                path: z.string(),
              })
              .passthrough(),
          ],
          {
            errorMap: () => ({ message: "این فیلد الزامی است" }),
          }
        );
      } else if (field.type === "signature") {
        fieldSchema = z
          .object({
            signatureDataUrl: z.string({ required_error: "امضا الزامی است" }),
            timestamp: z.string(),
          })
          .refine(
            (val) =>
              val && val.signatureDataUrl && val.signatureDataUrl.length > 0,
            {
              message: "امضا الزامی است",
            }
          );
      }
    }

    return fieldSchema;
  };

  // Get fields for the current step
  const getCurrentStepFields = () => {
    if (!isMultiStep) return form.fields;

    const currentStepData = steps[currentStep];
    return form.fields.filter((field) =>
      currentStepData.fieldIds.includes(field.name)
    );
  };

  const currentStepFields = getCurrentStepFields();
  const formSchema = generateValidationSchema(currentStepFields);

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  // Handle form initialization and reset when form changes or when in edit mode
  useEffect(() => {
    // Reset form with current data whenever form ID changes
    if (form._id) {
      methods.reset(formData);
    }
  }, [form._id, formData]);

  // Add debug logging for edit mode
  useEffect(() => {
    if (isEditMode && process.env.NODE_ENV !== "production") {
      console.log("Edit mode active");
      console.log("Current form values:", methods.getValues());

      // Log when radio and select fields are rendered
      const selectFields = form.fields.filter(
        (f) => f.type === "select" || f.type === "radio"
      );
      if (selectFields.length > 0) {
        console.log(
          "Select/Radio fields:",
          selectFields.map((f) => f.name)
        );
        selectFields.forEach((field) => {
          const value = methods.getValues(field.name);
          console.log(`Field ${field.name} value:`, value);
        });
      }
    }
  }, [isEditMode, methods]);

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      // Find all File objects in the data
      const fileFields: string[] = [];

      // Process files first
      for (const [key, value] of Object.entries(data)) {
        // Only process actual File objects, skip file metadata
        if (value instanceof File) {
          fileFields.push(key);
          try {
            // Upload each file
            const result = await uploadFile(key, value as File);
            // Store the file info directly in the data object
            data[key] = {
              filename: result.filename,
              originalName: result.originalName,
              path: result.path,
              size: result.size,
              type: result.type,
              uploadedAt: result.uploadedAt,
            };
          } catch (error) {
            console.error(`Error uploading file for field ${key}:`, error);
            // Remove failed file fields
            delete data[key];
          }
        }
        // For null values in file fields (when a file was removed), set to null explicitly
        else if (
          value === null &&
          currentStepFields.some((f) => f.name === key && f.type === "file")
        ) {
          data[key] = null;
        }
      }

      // If we're on the last step of a multi-step form, or it's a single-step form
      if (!isMultiStep || currentStep === steps.length - 1) {
        // Merge with previous steps' data for multi-step forms
        const completeFormData = { ...formData, ...data };
        setFormData(completeFormData);

        // Add debug log for file fields in edit mode
        if (isEditMode) {
          console.log("Form data before submission:", completeFormData);
          const fileFieldsInForm = currentStepFields
            .filter((f) => f.type === "file")
            .map((f) => f.name);
          if (fileFieldsInForm.length > 0) {
            console.log("File fields in form:", fileFieldsInForm);
            fileFieldsInForm.forEach((fieldName) => {
              console.log(
                `Field ${fieldName} value:`,
                completeFormData[fieldName]
              );
            });
          }
        }

        // Determine whether to create a new entry or update an existing one
        const apiEndpoint =
          isEditMode && entryId
            ? `/api/formbuilder/submissions/${entryId}`
            : "/api/formbuilder/submissions";

        const method = isEditMode && entryId ? "PUT" : "POST";

        // Prepare user information for submission
        const userInfo = user
          ? {
              username: user.username,
              userType: user.userType,
              // Extract name and family based on user type
              userName:
                user.userType === "student"
                  ? user.name.split(" ")[0] || user.name // First part of the name
                  : user.userType === "teacher"
                  ? user.name
                  : user.name,
              userFamily:
                user.userType === "student"
                  ? user.name.split(" ").slice(1).join(" ") || "" // Rest of the name
                  : "", // Teachers and schools don't have separate family names
            }
          : {
              username: "anonymous",
              userType: "unknown",
              userName: "",
              userFamily: "",
            };

        // Submit to API
        const response = await fetch(apiEndpoint, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            formId: form._id,
            answers: completeFormData,
            userInfo: userInfo,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error submitting form: ${response.statusText}`);
        }

        setSubmitted(true);
      } else {
        // For multi-step forms, store the current step data and move to next step
        setFormData((prev) => ({ ...prev, ...data }));
        setCurrentStep((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      // Handle error appropriately (show message, etc.)
    }
  };

  // Function to upload a file and update the form data
  const uploadFile = async (
    fieldName: string,
    file: File
  ): Promise<UploadResult> => {
    if (!form._id) {
      console.error("Form ID is missing, cannot upload file");
      throw new Error("Form ID is missing");
    }

    // Set initial upload state
    setFileUploads((prev) => ({
      ...prev,
      [fieldName]: {
        uploading: true,
        progress: 0,
        error: null,
      },
    }));

    try {
      // Create form data for upload
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("filename", file.name);
      uploadData.append("formId", form._id);

      // Create a directory path for the upload based on form ID
      const directory = `formfiles/forms/${form._id}`;
      uploadData.append("directory", directory);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFileUploads((prev) => ({
              ...prev,
              [fieldName]: { ...prev[fieldName], progress },
            }));
          }
        });

        // Handle response
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error(`HTTP error ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
      });

      // Start the upload
      xhr.open("POST", "/api/upload");

      // Add domain header
      const domain = window.location.host;
      xhr.setRequestHeader("x-domain", domain);

      xhr.send(uploadData);

      // Wait for upload to complete
      const result = await uploadPromise;

      // Update upload state
      setFileUploads((prev) => ({
        ...prev,
        [fieldName]: {
          uploading: false,
          progress: 100,
          error: null,
        },
      }));

      return result;
    } catch (error) {
      console.error(`Error uploading file for ${fieldName}:`, error);

      // Update upload state with error
      setFileUploads((prev) => ({
        ...prev,
        [fieldName]: {
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : "Upload failed",
        },
      }));

      throw error;
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Function to render the appropriate field type
  const renderField = (field: FormField) => {
    // Check conditional display
    if (field.condition) {
      const conditionField = field.condition.field;
      const conditionValue = field.condition.equals;
      const currentValue = methods.watch(conditionField);

      if (currentValue !== conditionValue) {
        return null;
      }
    }

    switch (field.type) {
      case "group":
        return (
          <div
            key={field.name}
            className="space-y-4 border rounded-md p-4 mb-4"
          >
            <h3 className="font-medium text-lg border-b pb-2">{field.label}</h3>
            {field.description && (
              <p className="text-sm text-gray-500 mb-2">{field.description}</p>
            )}

            {field.repeatable ? (
              <GroupFieldRepeatable
                field={field}
                methods={methods}
                renderField={renderField}
              />
            ) : (
              <div className="space-y-4">
                {/* Check if non-repeatable group has horizontal fields */}
                {field.fields && hasHorizontalFields(field.fields)
                  ? // Render fields by layout
                    renderNonRepeatableFieldsByLayout(
                      field.fields,
                      field.name,
                      renderField
                    )
                  : // Render all fields vertically as before
                    field.fields?.map((nestedField) =>
                      renderField({
                        ...nestedField,
                        name: `${field.name}.${nestedField.name}`,
                        // Update condition to include parent field name in path if needed
                        condition: nestedField.condition
                          ? {
                              ...nestedField.condition,
                              field: nestedField.condition.field.includes(".")
                                ? nestedField.condition.field
                                : `${field.name}.${nestedField.condition.field}`,
                            }
                          : undefined,
                      })
                    )}
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input placeholder={field.placeholder} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "email":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={field.placeholder || "ایمیل"}
                    {...formField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "number":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder={field.placeholder}
                    {...formField}
                    onChange={(e) => formField.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "date":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <div className="relative" dir="ltr">
                    <DatePicker
                      calendar={persian}
                      locale={persian_fa}
                      value={formField.value}
                      onChange={(date: Value) => {
                        if (date) {
                          const dateObj = date as unknown as { format: (format: string) => string };
                          if (dateObj.format) {
                            // Store Persian date in YYYY/MM/DD format
                            formField.onChange(dateObj.format("YYYY/MM/DD"));
                          }
                        } else {
                          formField.onChange("");
                        }
                      }}
                      format="YYYY/MM/DD"
                      className="w-full rounded-md border border-gray-300"
                      inputClass="w-full rounded-md border border-gray-300 p-2 text-right"
                      calendarPosition="bottom-right"
                      containerClassName="rmdp-container"
                      placeholder={field.placeholder || "YYYY/MM/DD"}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "textarea":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Textarea placeholder={field.placeholder} {...formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "select": {
        // For nested dropdowns, create a wrapper component to handle useEffect properly
        const SelectFieldWithNestedOptions = () => {
          // Get form context
          const formContext = useFormContext();
          const formValue = formContext.getValues(field.name);

          // Handle nested dropdown if this field has nestedOptions configured
          const hasNestedOptions =
            field.nestedOptions && field.nestedOptions.parentField;
          const parentField = hasNestedOptions
            ? field.nestedOptions?.parentField
            : null;

          // Get available options based on parent field value
          const parentValue = parentField
            ? formContext.watch(parentField)
            : null;

          // Determine the options to display
          let displayOptions = field.options || [];

          // If this is a nested dropdown and we have a parent value
          if (hasNestedOptions && parentValue && field.nestedOptions?.mapping) {
            // Get options for this parent value
            const nestedOptions =
              field.nestedOptions.mapping[parentValue] || [];

            // Use the nested options if available, otherwise fall back to default options
            if (nestedOptions.length > 0) {
              displayOptions = nestedOptions;
            }
          }

          // Reset value if parent changed and current value is not valid
          useEffect(() => {
            if (hasNestedOptions && parentValue && formValue) {
              const isCurrentValueValid = displayOptions.some(
                (option) => option.value === formValue
              );

              if (!isCurrentValueValid) {
                formContext.setValue(field.name, ""); // Reset to empty
              }
            }
          }, [
            parentValue,
            hasNestedOptions,
            formValue,
            field.name,
            formContext,
          ]);

          return (
            <UIFormField
              control={methods.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <Select
                    onValueChange={formField.onChange}
                    value={formField.value}
                    defaultValue={formField.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            field.placeholder || "یک گزینه انتخاب کنید"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {displayOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        };

        return <SelectFieldWithNestedOptions key={field.name} />;
      }

      case "checkbox":
        // Check if checkbox has options (checkbox group) or is single
        if (field.options && field.options.length > 0) {
          // Checkbox group - multiple selection
          return (
            <UIFormField
              key={field.name}
              control={methods.control}
              name={field.name}
              render={() => (
                <FormItem className="text-right" dir="rtl">
                  <div className="mb-4">
                    <FormLabel className="text-base">{field.label}</FormLabel>
                    {field.description && (
                      <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {field.options?.map((option) => (
                      <UIFormField
                        key={option.value}
                        control={methods.control}
                        name={field.name}
                        render={({ field: formField }) => {
                          return (
                            <FormItem
                              key={option.value}
                              className="flex flex-row-reverse items-start justify-end space-x-3 space-x-reverse space-y-0"
                            >
                              <FormLabel className="font-normal cursor-pointer mr-2">
                                {option.label}
                              </FormLabel>
                              <FormControl>
                                <Checkbox
                                  checked={
                                    Array.isArray(formField.value)
                                      ? formField.value.includes(option.value)
                                      : false
                                  }
                                  onCheckedChange={(checked) => {
                                    const currentValue = Array.isArray(formField.value)
                                      ? formField.value
                                      : [];
                                    
                                    if (checked) {
                                      formField.onChange([...currentValue, option.value]);
                                    } else {
                                      formField.onChange(
                                        currentValue.filter((value) => value !== option.value)
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        } else {
          // Single checkbox
          return (
            <UIFormField
              key={field.name}
              control={methods.control}
              name={field.name}
              render={({ field: formField }) => (
                <FormItem className="flex flex-row-reverse items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4 text-right" dir="rtl">
                  <div className="space-y-1 leading-none mr-3">
                    <FormLabel>{field.label}</FormLabel>
                    {field.description && (
                      <p className="text-sm text-gray-500">{field.description}</p>
                    )}
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={formField.value}
                      onCheckedChange={formField.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }

      case "radio":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="space-y-3 ">
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    value={formField.value}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <FormItem
                        key={option.value}
                        className="flex items-center space-x-3 space-x-reverse flex-start rtl space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={option.value} />
                        </FormControl>
                        <FormLabel className="font-normal mr-3">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "switch":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{field.label}</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "file":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => {
              // Get upload state for this field
              const uploadState = fileUploads[field.name];

              // Define an interface for the file metadata
              interface FileMetadata {
                filename: string;
                originalName: string;
                path: string;
                size?: number;
                type?: string;
                uploadedAt?: string;
              }

              // Check if there's an existing uploaded file (edit mode)
              const hasExistingFile =
                formField.value &&
                typeof formField.value === "object" &&
                "filename" in formField.value;

              // Use proper typing for the file metadata
              const fileMetadata = hasExistingFile
                ? (formField.value as FileMetadata)
                : null;

              return (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {/* Only show file input if no file is already uploaded or if we're uploading */}
                      {(!hasExistingFile || uploadState?.uploading) && (
                        <Input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Store file in form state
                              formField.onChange(file);

                              // Create a preview if it's an image
                              if (file.type.startsWith("image/")) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  // Display image preview if needed
                                  console.log("Image loaded:", reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                          }}
                          disabled={uploadState?.uploading}
                        />
                      )}

                      {/* Show upload progress */}
                      {uploadState?.uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${uploadState.progress}%` }}
                          ></div>
                          <p className="text-xs text-gray-500 mt-1">
                            آپلود در حال انجام... {uploadState.progress}%
                          </p>
                        </div>
                      )}

                      {/* Show error message */}
                      {uploadState?.error && (
                        <p className="text-sm text-red-500">
                          خطا: {uploadState.error}
                        </p>
                      )}

                      {/* Show selected file or existing file */}
                      {formField.value && !uploadState?.uploading && (
                        <div className="text-sm border rounded-md p-3 bg-gray-50 flex flex-col gap-2 text-right">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <FileJson className="h-4 w-4 text-blue-500 ml-2" />
                              <span>
                                {formField.value instanceof File
                                  ? formField.value.name
                                  : hasExistingFile
                                  ? fileMetadata?.originalName ||
                                    "فایل آپلود شده"
                                  : "فایل انتخاب شده"}
                              </span>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                formField.onChange(null);
                                // If in edit mode with existing file, show file input again
                                if (hasExistingFile) {
                                  // Force re-render to show file input
                                  setTimeout(() => {
                                    formField.onChange(null);
                                  }, 0);
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Add buttons for existing files */}
                          {hasExistingFile && fileMetadata && (
                            <div className="flex gap-2 mt-1">
                              {/* View file button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  // Determine file URL based on path
                                  let fileUrl;

                                  if (fileMetadata.path.startsWith("http")) {
                                    // If path is already a full URL
                                    fileUrl = fileMetadata.path;
                                  } else {
                                    // Construct URL from domain and path
                                    fileUrl = `${
                                      window.location.origin
                                    }/${fileMetadata.path.replace(/^\//, "")}`;
                                  }

                                  // Open in new tab
                                  window.open(fileUrl, "_blank");
                                }}
                              >
                                <Eye className="h-4 w-4 ml-2" /> مشاهده فایل
                              </Button>

                              {/* Change file button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  // Clear current file to show file input
                                  formField.onChange(null);
                                }}
                              >
                                <Edit className="h-4 w-4 ml-2" /> تغییر فایل
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        );

      case "signature":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <SignatureField field={field} formField={formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "rating":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <RatingField field={field} formField={formField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  // Component to handle repeatable field groups
  const GroupFieldRepeatable = ({
    field,
    methods,
    renderField,
  }: {
    field: FormField;
    methods: ReturnType<typeof useForm>;
    renderField: (field: FormField) => React.ReactNode;
  }) => {
    // Use React Hook Form's useFieldArray for properly managing array fields
    const {
      fields: fieldItems,
      append,
      remove,
    } = useFieldArray({
      control: methods.control,
      name: field.name,
    });

    // If field array is empty, initialize with one item
    if (fieldItems.length === 0) {
      append({});
    }

    return (
      <div className="space-y-4">
        {fieldItems.map((item, index) => (
          <div
            key={item.id} // Using the id from useFieldArray
            className="border rounded-md p-3 relative"
          >
            <button
              type="button"
              onClick={() => {
                // Don't remove the last item
                if (fieldItems.length > 1) {
                  remove(index);
                }
              }}
              className="absolute top-2 left-2 text-red-500 hover:text-red-700"
              aria-label="حذف"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-3 pt-2">
              {/* Check if there are fields with horizontal layout */}
              {field.fields && hasHorizontalFields(field.fields)
                ? // Render fields in subgroups based on layout
                  renderFieldsByLayout(
                    field.fields,
                    index,
                    field.name,
                    renderField
                  )
                : // Render all fields vertically as before
                  field.fields?.map((nestedField) =>
                    renderField({
                      ...nestedField,
                      name: `${field.name}.${index}.${nestedField.name}`,
                      // Update condition to include correct path for array items
                      condition: nestedField.condition
                        ? {
                            ...nestedField.condition,
                            field: nestedField.condition.field.includes(".")
                              ? `${
                                  field.name
                                }.${index}.${nestedField.condition.field
                                  .split(".")
                                  .pop()}`
                              : `${field.name}.${index}.${nestedField.condition.field}`,
                          }
                        : undefined,
                    })
                  )}
            </div>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({})}
          className="mt-2"
        >
          <PlusCircle className="h-4 w-4 ml-2" />
          افزودن {field.label}
        </Button>
      </div>
    );
  };

  // Helper functions for layout handling
  const hasHorizontalFields = (fields: FormField[]) => {
    return fields.some((field) => field.layout === "horizontal");
  };

  const renderFieldsByLayout = (
    fields: FormField[],
    index: number,
    parentName: string,
    renderField: (field: FormField) => React.ReactNode
  ) => {
    // Group fields by their layout type
    const horizontalFields: FormField[] = [];
    const verticalFields: FormField[] = [];

    // Separate fields based on layout
    fields.forEach((field) => {
      if (field.layout === "horizontal") {
        horizontalFields.push(field);
      } else {
        verticalFields.push(field);
      }
    });

    return (
      <>
        {/* Render horizontal fields in a flex row */}
        {horizontalFields.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {horizontalFields.map((nestedField) => (
              <div key={nestedField.name} className="flex-1 min-w-[200px]">
                {renderField({
                  ...nestedField,
                  name: `${parentName}.${index}.${nestedField.name}`,
                  condition: nestedField.condition
                    ? {
                        ...nestedField.condition,
                        field: nestedField.condition.field.includes(".")
                          ? `${parentName}.${index}.${nestedField.condition.field
                              .split(".")
                              .pop()}`
                          : `${parentName}.${index}.${nestedField.condition.field}`,
                      }
                    : undefined,
                })}
              </div>
            ))}
          </div>
        )}

        {/* Render vertical fields normally */}
        {verticalFields.map((nestedField) =>
          renderField({
            ...nestedField,
            name: `${parentName}.${index}.${nestedField.name}`,
            condition: nestedField.condition
              ? {
                  ...nestedField.condition,
                  field: nestedField.condition.field.includes(".")
                    ? `${parentName}.${index}.${nestedField.condition.field
                        .split(".")
                        .pop()}`
                    : `${parentName}.${index}.${nestedField.condition.field}`,
                }
              : undefined,
          })
        )}
      </>
    );
  };

  // Helper function to render non-repeatable fields by layout
  const renderNonRepeatableFieldsByLayout = (
    fields: FormField[],
    parentName: string,
    renderField: (field: FormField) => React.ReactNode
  ) => {
    // Group fields by their layout type
    const horizontalFields: FormField[] = [];
    const verticalFields: FormField[] = [];

    // Separate fields based on layout
    fields.forEach((field) => {
      if (field.layout === "horizontal") {
        horizontalFields.push(field);
      } else {
        verticalFields.push(field);
      }
    });

    return (
      <>
        {/* Render horizontal fields in a flex row */}
        {horizontalFields.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {horizontalFields.map((nestedField) => (
              <div key={nestedField.name} className="flex-1 min-w-[200px]">
                {renderField({
                  ...nestedField,
                  name: `${parentName}.${nestedField.name}`,
                  condition: nestedField.condition
                    ? {
                        ...nestedField.condition,
                        field: nestedField.condition.field.includes(".")
                          ? nestedField.condition.field
                          : `${parentName}.${nestedField.condition.field}`,
                      }
                    : undefined,
                })}
              </div>
            ))}
          </div>
        )}

        {/* Render vertical fields normally */}
        {verticalFields.map((nestedField) =>
          renderField({
            ...nestedField,
            name: `${parentName}.${nestedField.name}`,
            condition: nestedField.condition
              ? {
                  ...nestedField.condition,
                  field: nestedField.condition.field.includes(".")
                    ? nestedField.condition.field
                    : `${parentName}.${nestedField.condition.field}`,
                }
              : undefined,
          })
        )}
      </>
    );
  };

  // Render step progress indicator
  const renderStepProgress = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps
            .map((step, index) => (
              <div key={step.id} className="flex items-center w-full ">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : index < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-full mx-0 ${
                      index < currentStep ? "bg-primary" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))
            .reverse()}
        </div>
        <div className="mt-4 text-center">
          <h3 className="font-medium text-lg">{steps[currentStep].title}</h3>
          {steps[currentStep].description && (
            <p className="text-gray-500 text-sm mt-1">
              {steps[currentStep].description}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Add output toggling function
  const toggleOutput = () => {
    setShowOutput((prev) => !prev);
  };

  return (
    <Card className="bg-white shadow-md" dir="rtl">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          {(submitted || showOutput) && (
            <Button variant="outline" onClick={toggleOutput}>
              <FileJson className="h-4 w-4 ml-2" />
              {showOutput ? "پنهان کردن خروجی" : "نمایش خروجی"}
            </Button>
          )}
        </div>
        <CardTitle className="text-xl font-bold mt-2">{form.title}</CardTitle>
        {isEditable && existingEntry && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md mt-2">
            شما در حال ویرایش پاسخ‌های قبلی خود هستید. تغییرات را اعمال کرده و
            فرم را مجدداً ارسال کنید.
          </div>
        )}
        {isEditable && !existingEntry && !loadingEntry && (
          <div className="bg-gray-50 text-gray-700 p-3 rounded-md mt-2">
            این فرم قابل ویرایش است. پس از ارسال می‌توانید پاسخ‌های خود را
            ویرایش کنید.
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        {submitted ? (
          <div className="text-center py-8">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mt-2">
              {isEditMode
                ? "پاسخ‌های شما با موفقیت به‌روزرسانی شد"
                : "فرم با موفقیت ارسال شد"}
            </h3>
            {showOutput && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-[400px] text-left">
                <pre className="text-xs whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </div>
            )}
            <Button
              className="mt-4"
              onClick={() => {
                setSubmitted(false);
                methods.reset({});
                if (isEditMode) {
                  // Reload the page to show updated data
                  window.location.reload();
                }
              }}
            >
              {isEditMode ? "مشاهده فرم به‌روزرسانی شده" : "ارسال فرم جدید"}
            </Button>
          </div>
        ) : (
          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-8 rtl"
            >
              {isMultiStep && renderStepProgress()}

              {showOutput && (
                <div className="mb-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-[400px]">
                  <pre className="text-xs whitespace-pre-wrap overflow-auto">
                    {JSON.stringify(
                      { ...formData, ...methods.getValues() },
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Form fields */}
              {currentStepFields.map((field) => renderField(field))}

              <div className="flex justify-between">
                {isMultiStep && currentStep > 0 && (
                  <Button type="button" onClick={handlePrevStep}>
                    <ChevronRight className="h-4 w-4 ml-2" />
                    مرحله قبل
                  </Button>
                )}
                <Button
                  type="submit"
                  className={
                    isMultiStep && currentStep < steps.length - 1
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-green-500 hover:bg-green-600"
                  }
                >
                  {isMultiStep && currentStep < steps.length - 1 ? (
                    <>
                      مرحله بعد
                      <ChevronLeft className="h-4 w-4 mr-2" />
                    </>
                  ) : isEditMode ? (
                    "به‌روزرسانی پاسخ‌ها"
                  ) : (
                    "ارسال فرم"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
