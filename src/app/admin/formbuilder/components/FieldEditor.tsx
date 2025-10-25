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
import { Save, PlusCircle, Trash } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X as XIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Extended FormField interface to add description
interface FormField extends BaseFormField {
  description?: string;
}

// Define a proper type for the validation object
interface ValidationOptions {
  regex?: string;
  validationMessage?: string;
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
      case "signature":
        schema +=
          "object({ signatureDataUrl: z.string(), timestamp: z.string() })";
        break;
      case "rating":
        schema += "number()";
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
      setValidationError("نام فیلد باید منحصر به فرد باشد");
      return;
    }

    // Options validation for select, checkbox, radio
    if (
      ["select", "checkbox", "radio"].includes(editedField.type) &&
      (!editedField.options || editedField.options.length === 0)
    ) {
      setValidationError("حداقل یک گزینه باید اضافه شود");
      return;
    }

    // Validate that all options have both label and value filled
    if (
      ["select", "checkbox", "radio"].includes(editedField.type) &&
      editedField.options
    ) {
      const hasEmptyOptions = editedField.options.some(
        (option) => !option.label.trim() || !option.value.trim()
      );
      if (hasEmptyOptions) {
        setValidationError("تمام گزینه‌ها باید دارای برچسب و مقدار باشند");
        return;
      }
    }

    // Nested options validation for select
    if (
      editedField.type === "select" &&
      editedField.nestedOptions &&
      editedField.nestedOptions.parentField
    ) {
      // Ensure the parent field exists
      const parentFieldExists = allFields.some(
        (f) => f.name === editedField.nestedOptions?.parentField
      );

      if (!parentFieldExists) {
        setValidationError("فیلد والد برای گزینه‌های تو در تو وجود ندارد");
        return;
      }

      // Ensure there are mappings defined
      const hasNoMappings =
        !editedField.nestedOptions.mapping ||
        Object.keys(editedField.nestedOptions.mapping).length === 0;

      if (hasNoMappings) {
        setValidationError(
          "باید حداقل یک نگاشت برای گزینه‌های تو در تو تعریف شود"
        );
        return;
      }

      // Validate that all nested options have both label and value filled
      if (editedField.nestedOptions.mapping) {
        for (const parentValue in editedField.nestedOptions.mapping) {
          const childOptions = editedField.nestedOptions.mapping[parentValue];
          if (childOptions && childOptions.length > 0) {
            const hasEmptyNestedOptions = childOptions.some(
              (option) => !option.label.trim() || !option.value.trim()
            );
            if (hasEmptyNestedOptions) {
              setValidationError(
                "تمام گزینه‌های تو در تو باید دارای برچسب و مقدار باشند"
              );
              return;
            }
          }
        }
      }
    }

    // Conditional validation
    if (
      editedField.condition &&
      (!editedField.condition.field ||
        editedField.condition.equals === undefined)
    ) {
      setValidationError(
        "فیلدهای شرطی باید هم فیلد و هم مقدار مشخص شده باشند"
      );
      return;
    }

    // Validate nested fields within groups (for select fields with options)
    if (editedField.type === "group" && editedField.fields) {
      for (const nestedField of editedField.fields) {
        if (
          nestedField.type === "select" &&
          nestedField.options &&
          nestedField.options.length > 0
        ) {
          const hasEmptyNestedOptions = nestedField.options.some(
            (option) => !option.label.trim() || !option.value.trim()
          );
          if (hasEmptyNestedOptions) {
            setValidationError(
              `فیلد تو در تو "${nestedField.label}" دارای گزینه‌هایی با برچسب یا مقدار خالی است`
            );
            return;
          }
        }
      }
    }

    // All valid, save the field
    onSave(editedField);
  };

  // Add handlers for nested options
  const handleParentFieldChange = (parentField: string) => {
    const currentNestedOptions = editedField.nestedOptions || {
      parentField: "",
      mapping: {},
    };

    updateField("nestedOptions", {
      ...currentNestedOptions,
      parentField: parentField,
    });
  };

  const handleAddMapping = (parentValue: string) => {
    const currentNestedOptions = editedField.nestedOptions || {
      parentField: "",
      mapping: {},
    };

    const updatedMapping = { ...currentNestedOptions.mapping };

    // Initialize with empty array if no mapping exists for this value
    if (!updatedMapping[parentValue]) {
      updatedMapping[parentValue] = [];
    }

    updateField("nestedOptions", {
      ...currentNestedOptions,
      mapping: updatedMapping,
    });
  };

  const handleAddMappingOption = (parentValue: string) => {
    const currentNestedOptions = editedField.nestedOptions || {
      parentField: "",
      mapping: {},
    };

    const updatedMapping = { ...currentNestedOptions.mapping };

    // Add a new option to the mapping
    if (!updatedMapping[parentValue]) {
      updatedMapping[parentValue] = [];
    }

    updatedMapping[parentValue] = [
      ...updatedMapping[parentValue],
      { label: "", value: "" },
    ];

    updateField("nestedOptions", {
      ...currentNestedOptions,
      mapping: updatedMapping,
    });
  };

  const handleMappingOptionChange = (
    parentValue: string,
    index: number,
    key: "label" | "value",
    newValue: string
  ) => {
    const currentNestedOptions = editedField.nestedOptions || {
      parentField: "",
      mapping: {},
    };

    const updatedMapping = { ...currentNestedOptions.mapping };

    if (updatedMapping[parentValue] && updatedMapping[parentValue][index]) {
      updatedMapping[parentValue][index] = {
        ...updatedMapping[parentValue][index],
        [key]: newValue,
      };

      updateField("nestedOptions", {
        ...currentNestedOptions,
        mapping: updatedMapping,
      });
    }
  };

  const handleRemoveMappingOption = (parentValue: string, index: number) => {
    const currentNestedOptions = editedField.nestedOptions || {
      parentField: "",
      mapping: {},
    };

    const updatedMapping = { ...currentNestedOptions.mapping };

    if (updatedMapping[parentValue]) {
      updatedMapping[parentValue] = updatedMapping[parentValue].filter(
        (_option, i) => i !== index
      );

      // If there are no more options for this value, remove the parent value
      if (updatedMapping[parentValue].length === 0) {
        delete updatedMapping[parentValue];
      }

      updateField("nestedOptions", {
        ...currentNestedOptions,
        mapping: updatedMapping,
      });
    }
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
                  <div>
                    <Label>گزینه‌ها</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      هر گزینه باید دارای برچسب و مقدار باشد (*)
                    </p>
                  </div>
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
                      placeholder="برچسب *"
                      value={option.label}
                      onChange={(e) =>
                        handleOptionChange(index, "label", e.target.value)
                      }
                      className={`flex-1 ${!option.label.trim() ? 'border-red-300' : ''}`}
                      required
                    />
                    <Input
                      placeholder="مقدار *"
                      value={option.value}
                      onChange={(e) =>
                        handleOptionChange(index, "value", e.target.value)
                      }
                      className={`flex-1 ${!option.value.trim() ? 'border-red-300' : ''}`}
                      required
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
              <Label>شرح اعتبارسنجی</Label>
              <div className="bg-gray-100 p-2 rounded-md text-sm font-mono">
                {validationSchema}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-regex">الگوی اعتبارسنجی</Label>
              <Input
                id="field-regex"
                value={(editedField.validation?.regex as string) || ""}
                onChange={(e) =>
                  updateField("validation", {
                    ...editedField.validation,
                    regex: e.target.value,
                  } as ValidationOptions)
                }
                placeholder="e.g. ^[A-Za-z0-9]+$"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validation-message">پیام اعتبارسنجی</Label>
              <Input
                id="validation-message"
                value={
                  (editedField.validation?.validationMessage as string) || ""
                }
                onChange={(e) =>
                  updateField("validation", {
                    ...editedField.validation,
                    validationMessage: e.target.value,
                  } as ValidationOptions)
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
                <AccordionTrigger>منطق شرطی</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="conditional-field">
                        این فیلد را نمایش بده هنگامی که
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
                        <Label htmlFor="conditional-value">برابر باشد با</Label>
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

            {/* Rating field options */}
            {editedField.type === "rating" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rating-options">
                  <AccordionTrigger>تنظیمات امتیازدهی</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rating-max">حداکثر امتیاز</Label>
                        <Input
                          id="rating-max"
                          type="number"
                          value={editedField.ratingOptions?.maxRating || 5}
                          onChange={(e) => {
                            const maxRating = parseInt(e.target.value);
                            updateField("ratingOptions", {
                              ...editedField.ratingOptions,
                              maxRating: maxRating > 0 ? maxRating : 5,
                            } as FormField["ratingOptions"]);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rating-default">امتیاز پیش‌فرض</Label>
                        <Input
                          id="rating-default"
                          type="number"
                          value={editedField.ratingOptions?.defaultRating || 0}
                          onChange={(e) => {
                            const defaultRating = parseInt(e.target.value);
                            updateField("ratingOptions", {
                              ...editedField.ratingOptions,
                              defaultRating:
                                defaultRating >= 0 ? defaultRating : 0,
                            } as FormField["ratingOptions"]);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rating-size">اندازه ستاره‌ها</Label>
                        <Select
                          value={editedField.ratingOptions?.size || "md"}
                          onValueChange={(value) => {
                            updateField("ratingOptions", {
                              ...editedField.ratingOptions,
                              size: value as "sm" | "md" | "lg",
                            } as FormField["ratingOptions"]);
                          }}
                        >
                          <SelectTrigger id="rating-size">
                            <SelectValue placeholder="اندازه ستاره‌ها" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sm">کوچک</SelectItem>
                            <SelectItem value="md">متوسط</SelectItem>
                            <SelectItem value="lg">بزرگ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                          id="allow-half"
                          checked={
                            editedField.ratingOptions?.allowHalf || false
                          }
                          onCheckedChange={(checked) => {
                            updateField("ratingOptions", {
                              ...editedField.ratingOptions,
                              allowHalf: checked,
                            } as FormField["ratingOptions"]);
                          }}
                        />
                        <Label htmlFor="allow-half">
                          امکان انتخاب نیم ستاره
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Switch
                          id="show-count"
                          checked={
                            editedField.ratingOptions?.showCount || false
                          }
                          onCheckedChange={(checked) => {
                            updateField("ratingOptions", {
                              ...editedField.ratingOptions,
                              showCount: checked,
                            } as FormField["ratingOptions"]);
                          }}
                        />
                        <Label htmlFor="show-count">نمایش عدد امتیاز</Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rating-color">رنگ ستاره‌ها</Label>
                        <div className="flex gap-2">
                          <Input
                            id="rating-color"
                            value={
                              editedField.ratingOptions?.color || "#facc15"
                            }
                            onChange={(e) => {
                              updateField("ratingOptions", {
                                ...editedField.ratingOptions,
                                color: e.target.value,
                              } as FormField["ratingOptions"]);
                            }}
                          />
                          <div
                            className="w-10 h-10 border rounded"
                            style={{
                              backgroundColor:
                                editedField.ratingOptions?.color || "#facc15",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Signature field options */}
            {editedField.type === "signature" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="signature-options">
                  <AccordionTrigger>تنظیمات امضاء</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signature-width">عرض (پیکسل)</Label>
                        <Input
                          id="signature-width"
                          type="number"
                          value={editedField.signatureOptions?.width || 500}
                          onChange={(e) => {
                            const width = parseInt(e.target.value);
                            updateField("signatureOptions", {
                              ...editedField.signatureOptions,
                              width: width > 0 ? width : 500,
                            } as FormField["signatureOptions"]);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signature-height">ارتفاع (پیکسل)</Label>
                        <Input
                          id="signature-height"
                          type="number"
                          value={editedField.signatureOptions?.height || 200}
                          onChange={(e) => {
                            const height = parseInt(e.target.value);
                            updateField("signatureOptions", {
                              ...editedField.signatureOptions,
                              height: height > 0 ? height : 200,
                            } as FormField["signatureOptions"]);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signature-bg-color">رنگ پس‌زمینه</Label>
                        <div className="flex gap-2">
                          <Input
                            id="signature-bg-color"
                            value={
                              editedField.signatureOptions?.backgroundColor ||
                              "rgb(248, 250, 252)"
                            }
                            onChange={(e) => {
                              updateField("signatureOptions", {
                                ...editedField.signatureOptions,
                                backgroundColor: e.target.value,
                              } as FormField["signatureOptions"]);
                            }}
                          />
                          <div
                            className="w-10 h-10 border rounded"
                            style={{
                              backgroundColor:
                                editedField.signatureOptions?.backgroundColor ||
                                "rgb(248, 250, 252)",
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signature-pen-color">رنگ قلم</Label>
                        <div className="flex gap-2">
                          <Input
                            id="signature-pen-color"
                            value={
                              editedField.signatureOptions?.penColor ||
                              "rgb(0, 0, 0)"
                            }
                            onChange={(e) => {
                              updateField("signatureOptions", {
                                ...editedField.signatureOptions,
                                penColor: e.target.value,
                              } as FormField["signatureOptions"]);
                            }}
                          />
                          <div
                            className="w-10 h-10 border rounded"
                            style={{
                              backgroundColor:
                                editedField.signatureOptions?.penColor ||
                                "rgb(0, 0, 0)",
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {/* Field groups */}
            {editedField.type === "group" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="nested-fields">
                  <AccordionTrigger>فیلدهای تو در تو</AccordionTrigger>
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
                        <Label htmlFor="repeatable-field">تکراری</Label>
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
                                    <XIcon className="h-4 w-4 text-red-500" />
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

                                <div className="mt-2">
                                  <Label
                                    htmlFor={`nested-layout-${index}`}
                                    className="text-xs"
                                  >
                                    نحوه نمایش
                                  </Label>
                                  <Select
                                    value={nestedField.layout || "vertical"}
                                    onValueChange={(value) => {
                                      const newFields = [
                                        ...(editedField.fields || []),
                                      ];
                                      newFields[index] = {
                                        ...newFields[index],
                                        layout: value,
                                      };
                                      updateField("fields", newFields);
                                    }}
                                  >
                                    <SelectTrigger
                                      id={`nested-layout-${index}`}
                                      className="mt-1"
                                    >
                                      <SelectValue placeholder="انتخاب نحوه نمایش" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="vertical">
                                        عمودی
                                      </SelectItem>
                                      <SelectItem value="horizontal">
                                        افقی
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
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
                                            placeholder="برچسب *"
                                            value={option.label}
                                            className={`flex-1 h-7 text-xs ${!option.label.trim() ? 'border-red-300' : ''}`}
                                            required
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
                                            placeholder="مقدار *"
                                            value={option.value}
                                            className={`flex-1 h-7 text-xs ${!option.value.trim() ? 'border-red-300' : ''}`}
                                            required
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
              <Label htmlFor="field-layout">نحوه نمایش</Label>
              <Select
                value={editedField.layout || "default"}
                onValueChange={(value) => updateField("layout", value)}
              >
                <SelectTrigger id="field-layout">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">پیش فرض</SelectItem>
                  <SelectItem value="row">ردیف</SelectItem>
                  <SelectItem value="column">ستون</SelectItem>
                  <SelectItem value="grid">شبکه</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nested dropdown options */}
            {editedField.type === "select" && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="nested-dropdown">
                  <AccordionTrigger>
                    منوی کشویی وابسته (Nested Dropdown)
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="parent-field">فیلد والد</Label>
                        <Select
                          value={editedField.nestedOptions?.parentField || ""}
                          onValueChange={handleParentFieldChange}
                        >
                          <SelectTrigger id="parent-field">
                            <SelectValue placeholder="فیلدی را انتخاب کنید" />
                          </SelectTrigger>
                          <SelectContent>
                            {allFields
                              .filter(
                                (f) =>
                                  f.name !== editedField.name &&
                                  f.type === "select"
                              )
                              .map((f) => (
                                <SelectItem key={f.name} value={f.name}>
                                  {f.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                          مقادیر این منوی کشویی، بر اساس انتخاب کاربر در فیلد
                          والد تغییر خواهند کرد.
                        </p>
                      </div>

                      {editedField.nestedOptions?.parentField && (
                        <div className="space-y-4">
                          <Label>تعریف مقادیر وابسته</Label>

                          {/* Parent field options */}
                          <div className="space-y-4 pt-2">
                            {allFields
                              .find(
                                (f) =>
                                  f.name ===
                                  editedField.nestedOptions?.parentField
                              )
                              ?.options?.map((option) => (
                                <div
                                  key={option.value}
                                  className="border rounded-md p-4 space-y-3 bg-gray-50"
                                >
                                  <div className="flex justify-between items-center">
                                    <h4 className="font-medium text-sm">
                                      اگر{" "}
                                      {
                                        allFields.find(
                                          (f) =>
                                            f.name ===
                                            editedField.nestedOptions
                                              ?.parentField
                                        )?.label
                                      }{" "}
                                      = {option.label}
                                    </h4>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleAddMappingOption(option.value)
                                      }
                                    >
                                      <PlusCircle className="h-4 w-4 ml-2" />
                                      افزودن گزینه
                                    </Button>
                                  </div>

                                  {/* Child options */}
                                  {editedField.nestedOptions?.mapping[
                                    option.value
                                  ]?.map((childOption, index) => (
                                    <div
                                      key={index}
                                      className="flex gap-2 items-center"
                                    >
                                      <Input
                                        placeholder="برچسب *"
                                        value={childOption.label}
                                        onChange={(e) =>
                                          handleMappingOptionChange(
                                            option.value,
                                            index,
                                            "label",
                                            e.target.value
                                          )
                                        }
                                        className={`flex-1 ${!childOption.label.trim() ? 'border-red-300' : ''}`}
                                        required
                                      />
                                      <Input
                                        placeholder="مقدار *"
                                        value={childOption.value}
                                        onChange={(e) =>
                                          handleMappingOptionChange(
                                            option.value,
                                            index,
                                            "value",
                                            e.target.value
                                          )
                                        }
                                        className={`flex-1 ${!childOption.value.trim() ? 'border-red-300' : ''}`}
                                        required
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveMappingOption(
                                            option.value,
                                            index
                                          )
                                        }
                                      >
                                        <Trash className="h-4 w-4 text-red-500" />
                                      </Button>
                                    </div>
                                  ))}

                                  {!editedField.nestedOptions?.mapping[
                                    option.value
                                  ] && (
                                    <div className="text-center py-2 text-sm text-gray-500">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleAddMappingOption(option.value)
                                        }
                                      >
                                        <PlusCircle className="h-4 w-4 ml-2" />
                                        افزودن اولین گزینه
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={onCancel}>
            <XIcon className="h-4 w-4 ml-2" />
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
