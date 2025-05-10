"use client";

import { useState } from "react";
import { FormSchema, FormField } from "./FormBuilderList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileJson } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FormPreviewProps {
  form: FormSchema;
  onBack: () => void;
}

export default function FormPreview({ form, onBack }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // Create Zod validation schema dynamically based on form fields
  const generateValidationSchema = () => {
    const schema: Record<string, any> = {};

    const processField = (field: FormField) => {
      let fieldSchema = z.any();

      switch (field.type) {
        case "text":
        case "textarea":
          fieldSchema = z.string();
          break;
        case "email":
          fieldSchema = z.string().email();
          break;
        case "number":
          fieldSchema = z.preprocess(
            (val) => (val === "" ? undefined : Number(val)),
            z.number().optional()
          );
          break;
        case "date":
          fieldSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
            message: "Please enter a valid date in YYYY-MM-DD format",
          });
          break;
        case "select":
        case "radio":
          fieldSchema = z.string();
          break;
        case "checkbox":
          fieldSchema = z.boolean().optional();
          break;
        case "switch":
          fieldSchema = z.boolean().optional();
          break;
        case "file":
          fieldSchema = z.any().optional();
          break;
        default:
          fieldSchema = z.any().optional();
      }

      // Add required validation if field is required
      if (field.required) {
        if (["checkbox", "switch"].includes(field.type)) {
          fieldSchema = z.boolean().refine((val) => val === true, {
            message: "This field is required",
          });
        } else {
          fieldSchema = fieldSchema.refine(
            (val) => val !== undefined && val !== "",
            {
              message: "This field is required",
            }
          );
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      // Add custom regex validation if specified
      if (field.validation?.regex) {
        fieldSchema = fieldSchema.regex(new RegExp(field.validation.regex), {
          message: field.validation.validationMessage || "Invalid format",
        });
      }

      return fieldSchema;
    };

    // Process fields and add to schema
    form.fields.forEach((field) => {
      // Skip fields with conditions for initial schema
      if (!field.condition) {
        schema[field.name] = processField(field);
      }
    });

    return z.object(schema);
  };

  const formSchema = generateValidationSchema();

  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
  });

  const onSubmit = async (data: any) => {
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
            answers: data,
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
      setFormData(data);
      setSubmitted(true);
      console.log("Form submitted:", data);
    } catch (error) {
      console.error("Error submitting form:", error);
      // Could add error handling UI here
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
                    placeholder={field.placeholder || "Email address"}
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
                        placeholder={field.placeholder || "Select an option"}
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
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
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={option.value} />
                        </FormControl>
                        <FormLabel className="font-normal">
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

          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {form.fields.map((field) => renderField(field))}

              <Button type="submit" className="w-full">
                ارسال
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
