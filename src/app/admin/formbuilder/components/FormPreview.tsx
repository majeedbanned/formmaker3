"use client";

import { useState } from "react";
import { FormSchema, FormField as BaseFormField } from "./FormBuilderList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileJson,
  ChevronRight,
  ChevronLeft,
  X,
  PlusCircle,
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
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extend the FormField type to include description
interface FormField extends BaseFormField {
  description?: string;
}

interface FormPreviewProps {
  form: FormSchema;
  onBack: () => void;
}

export default function FormPreview({ form, onBack }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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
            const regex = new RegExp(field.validation.regex);
            fieldSchema = z.string().regex(regex, {
              message: field.validation.validationMessage || "فرمت نامعتبر",
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
        fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
          message: "لطفا یک تاریخ معتبر در فرمت YYYY-MM-DD وارد کنید",
        });
        break;

      case "select":
      case "radio":
        fieldSchema = z.string();
        break;

      case "checkbox":
      case "switch":
        fieldSchema = z.boolean().optional();
        break;

      case "file":
        fieldSchema = z.instanceof(File).optional();
        break;

      default:
        fieldSchema = z.unknown().optional();
    }

    // Add required validation
    if (field.required) {
      if (["checkbox", "switch"].includes(field.type)) {
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
        fieldSchema = z.instanceof(File, { message: "این فیلد الزامی است" });
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

  const onSubmit = async (data: Record<string, unknown>) => {
    // For multi-step forms, update the form data and move to the next step
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);

    if (isMultiStep && currentStep < steps.length - 1) {
      // Move to the next step
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      // Only make the API call if the form has an ID
      if (form._id) {
        const response = await fetch("/api/formbuilder/submissions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            formId: form._id,
            answers: updatedFormData,
          }),
        });

        if (!response.ok) {
          throw new Error("Error submitting form");
        }

        // Get the submission confirmation
        const result = await response.json();
        console.log("Form submission result:", result);
      }

      // Update UI state
      setSubmitted(true);
      console.log("Form submitted:", updatedFormData);
    } catch (error) {
      console.error("Error submitting form:", error);
      // Could add error handling UI here
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
                {field.fields?.map((nestedField) =>
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
                  <Input
                    type="date"
                    placeholder={field.placeholder}
                    {...formField}
                  />
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

      case "select":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <Select
                  onValueChange={formField.onChange}
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
                    {field.options?.map((option) => (
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

      case "checkbox":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none mr-3">
                  <FormLabel>{field.label}</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case "radio":
        return (
          <UIFormField
            key={field.name}
            control={methods.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem className="space-y-3">
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={formField.onChange}
                    defaultValue={formField.value}
                    className="flex flex-col space-y-1"
                  >
                    {field.options?.map((option) => (
                      <FormItem
                        key={option.value}
                        className="flex items-center space-x-3 space-x-reverse space-y-0"
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
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    onChange={(e) => {
                      formField.onChange(e.target.files?.[0] || null);
                    }}
                  />
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
              {field.fields?.map((nestedField) =>
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

  // Render step progress indicator
  const renderStepProgress = () => {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
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
                  className={`h-1 w-12 mx-2 ${
                    index < currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                ></div>
              )}
            </div>
          ))}
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

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 ml-2" /> بازگشت به ویرایشگر
        </Button>
        {submitted && (
          <Button variant="outline" onClick={() => setShowOutput(!showOutput)}>
            <FileJson className="h-4 w-4 ml-2" />
            {showOutput ? "پنهان کردن" : "نمایش"} خروجی JSON
          </Button>
        )}
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {submitted && !showOutput && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>موفقیت!</AlertTitle>
              <AlertDescription>فرم شما با موفقیت ارسال شد.</AlertDescription>
            </Alert>
          )}

          {showOutput && (
            <div className="mb-6 p-4 bg-gray-100 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(formData, null, 2)}</pre>
            </div>
          )}

          {!submitted && isMultiStep && renderStepProgress()}

          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {currentStepFields.map((field) => renderField(field))}

              <div className="flex justify-between mt-6">
                {isMultiStep && currentStep > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                  >
                    <ChevronRight className="h-4 w-4 ml-2" />
                    مرحله قبل
                  </Button>
                )}

                <Button
                  type="submit"
                  className={isMultiStep && currentStep > 0 ? "" : "w-full"}
                >
                  {isMultiStep && currentStep < steps.length - 1 ? (
                    <>
                      مرحله بعد
                      <ChevronLeft className="h-4 w-4 mr-2" />
                    </>
                  ) : (
                    "ارسال"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
