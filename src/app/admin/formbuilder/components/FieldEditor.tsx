"use client";

import { useState, useEffect } from "react";
import { FormField as BaseFormField } from "./FormBuilderList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, PlusCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X as XIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Check, ChevronsUpDown } from "lucide-react";

// Extended FormField interface to add description
interface FormField extends BaseFormField {
  description?: string;
}

interface FieldEditorProps {
  field: FormField;
  allFields: FormField[];
  onSave: (field: FormField) => void;
  onCancel: () => void;
}

export function FieldEditor({
  field,
  allFields,
  onSave,
  onCancel,
}: FieldEditorProps) {
  const [editedField, setEditedField] = useState<FormField>({ ...field });
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [validationSchema, setValidationSchema] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Update the field name based on label
  useEffect(() => {
    if (
      !editedField.name ||
      (editedField.name && editedField.name.startsWith("field_"))
    ) {
      // Only auto-generate name if it's not set or it's using the default pattern
      const generatedName = editedField.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      if (generatedName) {
        setEditedField({
          ...editedField,
          name: generatedName,
        });
      }
    }
  }, [editedField.label]);

  // Helper function to update field values
  const updateField = (key: keyof FormField, value: unknown) => {
    setEditedField({
      ...editedField,
      [key]: value,
    });
  };

  // Helper function to generate validation schema
  const generateValidationSchema = () => {
    let schema = "z.";

    // Base type validation
    switch (editedField.type) {
      case "text":
      case "textarea":
      case "select":
      case "radio":
      case "checkbox":
        schema += "string()";
        break;
      case "email":
        schema += "string().email()";
        break;
      case "number":
        schema += "number()";
        break;
      case "date":
        schema += "date()";
        break;
      case "file":
        schema += "any()";
        break;
      default:
        schema += "any()";
    }

    // Required validation
    if (editedField.required) {
      schema += ".required()";
    } else {
      schema += ".optional()";
    }

    // Custom regex validation if applicable
    if (editedField.validation?.regex) {
      schema += `.regex(new RegExp("${editedField.validation.regex}"), "${
        editedField.validation.validationMessage || "Invalid format"
      }")`;
    }

    return schema;
  };

  useEffect(() => {
    setValidationSchema(generateValidationSchema());
  }, [editedField]);

  // Handle options for select, radio, and checkbox
  const handleAddOption = () => {
    const newOptions = [
      ...(editedField.options || []),
      { label: "", value: "" },
    ];
    updateField("options", newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...(editedField.options || [])];
    newOptions.splice(index, 1);
    updateField("options", newOptions);
  };

  const handleOptionChange = (
    index: number,
    key: "label" | "value",
    newValue: string
  ) => {
    const newOptions = [...(editedField.options || [])];
    newOptions[index] = {
      ...newOptions[index],
      [key]: newValue,
    };
    updateField("options", newOptions);
  };

  // Handle conditional logic
  const handleConditionFieldChange = (fieldName: string) => {
    const condition = editedField.condition || { field: "", equals: "" };
    updateField("condition", {
      ...condition,
      field: fieldName,
    });
  };

  const handleConditionValueChange = (value: string) => {
    const condition = editedField.condition || { field: "", equals: "" };
    updateField("condition", {
      ...condition,
      equals: value,
    });
  };

  // Handle nested fields
  const handleNestedFieldChange = (repeatable: boolean) => {
    updateField("repeatable", repeatable);
    if (!editedField.fields?.length) {
      updateField("fields", []);
    }
  };

  const handleRemoveNestedField = (index: number) => {
    if (!editedField.fields) return;

    const newFields = [...editedField.fields];
    newFields.splice(index, 1);
    updateField("fields", newFields);
  };

  // Validate and save
  const handleSave = () => {
    // Basic validation
    if (!editedField.label.trim()) {
      setValidationError("Field label is required");
      return;
    }

    if (!editedField.name.trim()) {
      setValidationError("Field name is required");
      return;
    }

    // Check for duplicate names
    const hasDuplicateName = allFields.some(
      (f) => f.name === editedField.name && f !== field
    );

    if (hasDuplicateName) {
      setValidationError("Field name must be unique");
      return;
    }

    // Options validation for select, checkbox, radio
    if (
      ["select", "checkbox", "radio"].includes(editedField.type) &&
      (!editedField.options || editedField.options.length === 0)
    ) {
      setValidationError("You must add at least one option");
      return;
    }

    // Conditional validation
    if (
      editedField.condition &&
      (!editedField.condition.field ||
        editedField.condition.equals === undefined)
    ) {
      setValidationError(
        "Conditional fields must have both field and value specified"
      );
      return;
    }

    // All valid, save the field
    onSave(editedField);
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle>ویرایش فیلد</CardTitle>
      </CardHeader>
      <CardContent>
        {validationError && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {validationError}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
            <TabsTrigger value="validation">اعتبارسنجی</TabsTrigger>
            <TabsTrigger value="advanced">پیشرفته</TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="label">برچسب</Label>
              <Input
                id="label"
                value={editedField.label}
                onChange={(e) => updateField("label", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">نام فیلد (برای استفاده در کد)</Label>
              <Input
                id="name"
                value={editedField.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                فقط حروف، اعداد و زیرخط مجاز است
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">مقدار پیش فرض</Label>
              <Input
                id="placeholder"
                value={editedField.placeholder || ""}
                onChange={(e) => updateField("placeholder", e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                id="required"
                checked={editedField.required || false}
                onCheckedChange={(checked) => updateField("required", checked)}
              />
              <Label htmlFor="required">فیلد اجباری</Label>
            </div>

            {/* Field specific options */}
            {["select", "radio", "checkbox"].includes(editedField.type) && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <Label>گزینه‌ها</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    افزودن گزینه
                  </Button>
                </div>

                {(editedField.options || []).map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="برچسب"
                      value={option.label}
                      onChange={(e) =>
                        handleOptionChange(index, "label", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="مقدار"
                      value={option.value}
                      onChange={(e) =>
                        handleOptionChange(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <XIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Validation Schema</Label>
              <div className="bg-gray-100 p-2 rounded-md text-sm font-mono">
                {validationSchema}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-regex">Custom Regex Pattern</Label>
              <Input
                id="field-regex"
                value={editedField.validation?.regex || ""}
                onChange={(e) =>
                  updateField("validation", {
                    ...editedField.validation,
                    regex: e.target.value,
                  })
                }
                placeholder="e.g. ^[A-Za-z0-9]+$"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validation-message">Validation Message</Label>
              <Input
                id="validation-message"
                value={editedField.validation?.validationMessage || ""}
                onChange={(e) =>
                  updateField("validation", {
                    ...editedField.validation,
                    validationMessage: e.target.value,
                  })
                }
                placeholder="e.g. Please enter a valid input"
              />
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 py-4">
            {/* Conditional rendering */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="conditional-logic">
                <AccordionTrigger>Conditional Logic</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="conditional-field">
                        Show this field when
                      </Label>
                      <Select
                        value={editedField.condition?.field || ""}
                        onValueChange={handleConditionFieldChange}
                      >
                        <SelectTrigger id="conditional-field">
                          <SelectValue placeholder="Select a field" />
                        </SelectTrigger>
                        <SelectContent>
                          {allFields
                            .filter((f) => f.name !== editedField.name)
                            .map((f) => (
                              <SelectItem key={f.name} value={f.name}>
                                {f.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editedField.condition?.field && (
                      <div className="space-y-2">
                        <Label htmlFor="conditional-value">Equals</Label>
                        <Input
                          id="conditional-value"
                          value={String(editedField.condition?.equals || "")}
                          onChange={(e) =>
                            handleConditionValueChange(e.target.value)
                          }
                          placeholder="Value"
                        />
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Field groups */}
            {editedField.type === "group" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="nested-fields">
                  <AccordionTrigger>Nested Fields</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-description">توضیحات گروه</Label>
                        <Textarea
                          id="group-description"
                          value={editedField.description || ""}
                          onChange={(e) =>
                            updateField("description", e.target.value)
                          }
                          placeholder="توضیحات اختیاری برای این گروه فیلد"
                          className="h-20"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="repeatable-field">Repeatable</Label>
                        <Switch
                          id="repeatable-field"
                          checked={editedField.repeatable || false}
                          onCheckedChange={handleNestedFieldChange}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {editedField.repeatable
                          ? "Users can add multiple instances of this field group"
                          : "Field group appears once in the form"}
                      </p>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <Label>فیلدهای داخلی</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateField("fields", [
                                  ...(editedField.fields || []),
                                  {
                                    type: "text",
                                    label: "متن",
                                    name: `text_${Date.now()}`,
                                  },
                                ]);
                              }}
                            >
                              متن
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateField("fields", [
                                  ...(editedField.fields || []),
                                  {
                                    type: "number",
                                    label: "عدد",
                                    name: `number_${Date.now()}`,
                                  },
                                ]);
                              }}
                            >
                              عدد
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateField("fields", [
                                  ...(editedField.fields || []),
                                  {
                                    type: "select",
                                    label: "منوی کشویی",
                                    name: `select_${Date.now()}`,
                                    options: [
                                      { label: "گزینه 1", value: "option1" },
                                      { label: "گزینه 2", value: "option2" },
                                    ],
                                  },
                                ]);
                              }}
                            >
                              منوی کشویی
                            </Button>
                          </div>
                        </div>

                        {editedField.fields && editedField.fields.length > 0 ? (
                          <div className="space-y-2">
                            {editedField.fields.map((nestedField, index) => (
                              <div
                                key={index}
                                className="border p-3 rounded space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="font-medium">
                                      {nestedField.label}
                                    </span>
                                    <span className="text-xs text-gray-500 mr-2">
                                      (
                                      {nestedField.type === "text"
                                        ? "متن"
                                        : nestedField.type === "number"
                                        ? "عدد"
                                        : nestedField.type === "select"
                                        ? "منوی کشویی"
                                        : nestedField.type}
                                      )
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveNestedField(index)
                                    }
                                  >
                                    <X className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>

                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`nested-label-${index}`}
                                      className="text-xs"
                                    >
                                      عنوان
                                    </Label>
                                    <Input
                                      id={`nested-label-${index}`}
                                      value={nestedField.label}
                                      onChange={(e) => {
                                        const newFields = [
                                          ...(editedField.fields || []),
                                        ];
                                        newFields[index] = {
                                          ...newFields[index],
                                          label: e.target.value,
                                        };
                                        updateField("fields", newFields);
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`nested-name-${index}`}
                                      className="text-xs"
                                    >
                                      نام فیلد
                                    </Label>
                                    <Input
                                      id={`nested-name-${index}`}
                                      value={nestedField.name}
                                      onChange={(e) => {
                                        const newFields = [
                                          ...(editedField.fields || []),
                                        ];
                                        newFields[index] = {
                                          ...newFields[index],
                                          name: e.target.value,
                                        };
                                        updateField("fields", newFields);
                                      }}
                                    />
                                  </div>
                                </div>

                                {nestedField.type === "select" && (
                                  <div className="mt-2 pt-2 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                      <Label className="text-xs">
                                        گزینه‌ها
                                      </Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newFields = [
                                            ...(editedField.fields || []),
                                          ];
                                          newFields[index] = {
                                            ...newFields[index],
                                            options: [
                                              ...(nestedField.options || []),
                                              { label: "", value: "" },
                                            ],
                                          };
                                          updateField("fields", newFields);
                                        }}
                                      >
                                        <PlusCircle className="h-3 w-3 ml-1" />
                                        افزودن
                                      </Button>
                                    </div>

                                    {(nestedField.options || []).map(
                                      (option, optionIndex) => (
                                        <div
                                          key={optionIndex}
                                          className="flex gap-2 items-center mb-1"
                                        >
                                          <Input
                                            placeholder="برچسب"
                                            value={option.label}
                                            className="flex-1 h-7 text-xs"
                                            onChange={(e) => {
                                              const newFields = [
                                                ...(editedField.fields || []),
                                              ];
                                              const newOptions = [
                                                ...(nestedField.options || []),
                                              ];
                                              newOptions[optionIndex] = {
                                                ...newOptions[optionIndex],
                                                label: e.target.value,
                                              };
                                              newFields[index] = {
                                                ...newFields[index],
                                                options: newOptions,
                                              };
                                              updateField("fields", newFields);
                                            }}
                                          />
                                          <Input
                                            placeholder="مقدار"
                                            value={option.value}
                                            className="flex-1 h-7 text-xs"
                                            onChange={(e) => {
                                              const newFields = [
                                                ...(editedField.fields || []),
                                              ];
                                              const newOptions = [
                                                ...(nestedField.options || []),
                                              ];
                                              newOptions[optionIndex] = {
                                                ...newOptions[optionIndex],
                                                value: e.target.value,
                                              };
                                              newFields[index] = {
                                                ...newFields[index],
                                                options: newOptions,
                                              };
                                              updateField("fields", newFields);
                                            }}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newFields = [
                                                ...(editedField.fields || []),
                                              ];
                                              const newOptions = [
                                                ...(nestedField.options || []),
                                              ];
                                              newOptions.splice(optionIndex, 1);
                                              newFields[index] = {
                                                ...newFields[index],
                                                options: newOptions,
                                              };
                                              updateField("fields", newFields);
                                            }}
                                          >
                                            <XIcon className="h-3 w-3 text-red-500" />
                                          </Button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            هنوز فیلدی اضافه نشده است
                          </p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Layout options */}
            <div className="space-y-2">
              <Label htmlFor="field-layout">Layout</Label>
              <Select
                value={editedField.layout || "default"}
                onValueChange={(value) => updateField("layout", value)}
              >
                <SelectTrigger id="field-layout">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="row">Row</SelectItem>
                  <SelectItem value="column">Column</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 ml-2" />
            انصراف
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 ml-2" />
            ذخیره
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
