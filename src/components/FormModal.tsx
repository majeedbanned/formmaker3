import { useEffect, useState, useMemo, Fragment } from "react";

import {
  useForm,
  useFieldArray,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  Control,
  FieldValues,
  FieldErrors,
} from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  FormModalProps,
  FormField,
  ValidationRules,
  LayoutSettings,
  UploadedFile,
} from "../types/crud";
import {
  PlusIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { ReactTags } from "react-tag-autocomplete";
import { validateFile } from "@/utils/fileUpload";
import { Progress } from "./ui/progress";
import { MultiSelect } from "./ui/multi-select";
import { AutocompleteTags } from "@/components/ui/autocomplete-tags";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import RichTextEditor from "./ui/rich-text-editor";

// Add type definitions for window.__EDITING_ENTITY_DATA__
declare global {
  interface Window {
    __EDITING_ENTITY_DATA__?: Record<string, unknown>;
  }
}

type FormFieldProps = {
  field: FormField;
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  errors: FieldErrors<FieldValues>;
  control: Control<FieldValues>;
  layout: LayoutSettings;
  isDisabled: boolean;
};

const getValidationRules = (field: FormField): ValidationRules => {
  const rules: ValidationRules & {
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
  } = {};

  if (field.required) {
    rules.required =
      field.validation?.requiredMessage || "This field is required";
  }

  if (field.validation?.regex) {
    rules.pattern = {
      value: new RegExp(field.validation.regex),
      message: field.validation.validationMessage || "Invalid format",
    };
  }

  if (field.nestedType === "array") {
    if (field.arrayMinItems) {
      rules.minLength = {
        value: field.arrayMinItems,
        message: `Minimum ${field.arrayMinItems} items required`,
      };
    }
    if (field.arrayMaxItems) {
      rules.maxLength = {
        value: field.arrayMaxItems,
        message: `Maximum ${field.arrayMaxItems} items allowed`,
      };
    }
  }

  return rules;
};

const NestedFields = ({
  field,
  parentPath = "",
  register,
  setValue,
  watch,
  errors,
  control,
  layout,
  isDisabled,
}: FormFieldProps & { parentPath?: string }) => {
  const { fields, append, remove, prepend } = useFieldArray({
    control,
    name: field.nestedType === "array" ? `${parentPath}${field.name}` : "",
  });

  const isExpanded = watch(`${parentPath}${field.name}_expanded`);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  useEffect(() => {
    // Set initial expansion state based on isOpen property
    setValue(`${parentPath}${field.name}_expanded`, field.isOpen ?? false);
  }, [field.name, field.isOpen, parentPath, setValue]);

  const toggleExpand = () => {
    setValue(`${parentPath}${field.name}_expanded`, !isExpanded);
  };

  const handleDelete = (index: number) => {
    setDeleteIndex(index);
  };

  const handleConfirmDelete = () => {
    if (deleteIndex !== null) {
      remove(deleteIndex);
      setDeleteIndex(null);
    }
  };

  // Safe check for fields array
  const nestedFields = field.fields || [];
  if (nestedFields.length === 0) return null;

  const isHorizontal = field.orientation === "horizontal";

  return (
    <>
      <div className="space-y-4  p-4 rounded-2xl border-l-0 bg-gray-100 border-gray-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleExpand}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          <span className="font-medium">{field.title}</span>
          {field.nestedType === "array" && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Create an empty object with a property for each nested field
                  const emptyItem = nestedFields.reduce((acc, nestedField) => {
                    acc[nestedField.name] =
                      nestedField.defaultValue !== undefined
                        ? nestedField.defaultValue
                        : "";
                    return acc;
                  }, {} as Record<string, any>);

                  // Add the empty item at the top of the list
                  prepend(emptyItem);
                }}
                disabled={
                  field.arrayMaxItems
                    ? fields.length >= field.arrayMaxItems
                    : false
                }
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isExpanded && (
          <div
            className={`${
              !field.nestedType && isHorizontal
                ? "space-x-4 flex items-start"
                : "space-y-4"
            } ${layout.direction === "rtl" ? "space-x-reverse" : ""}`}
          >
            {field.nestedType === "array" ? (
              <>
                {fields.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative border-1 overflow-scroll rounded-md p-1 mb-1"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`absolute top-2 ${
                        layout.direction === "rtl" ? "left-2" : "right-2"
                      }`}
                      onClick={() => handleDelete(index)}
                      disabled={
                        field.arrayMinItems
                          ? fields.length <= field.arrayMinItems
                          : false
                      }
                    >
                      <MinusIcon className="h-4 w-4 text-destructive" />
                    </Button>
                    <div
                      className={
                        isHorizontal ? "flex gap-4 items-start" : "space-y-4"
                      }
                    >
                      {nestedFields.map((nestedField) => (
                        <FormField
                          key={nestedField.name}
                          field={{
                            ...nestedField,
                            name: `${field.name}.${index}.${nestedField.name}`,
                            path: `${parentPath}${field.name}.${index}.${nestedField.name}`,
                          }}
                          register={register}
                          setValue={setValue}
                          watch={watch}
                          errors={errors}
                          control={control}
                          layout={layout}
                          isDisabled={isDisabled}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {errors[field.name] && (
                  <p className="text-destructive text-sm">
                    {String(errors[field.name]?.message || "")}
                  </p>
                )}
              </>
            ) : (
              <div
                className={
                  isHorizontal ? "flex gap-4 items-start" : "space-y-4"
                }
              >
                {nestedFields.map((nestedField) => (
                  <FormField
                    key={nestedField.name}
                    field={{
                      ...nestedField,
                      name: `${field.name}.${nestedField.name}`,
                      path: `${parentPath}${field.name}.${nestedField.name}`,
                    }}
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    errors={errors}
                    control={control}
                    layout={layout}
                    isDisabled={isDisabled}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={deleteIndex !== null}
        onOpenChange={() => setDeleteIndex(null)}
      >
        <AlertDialogContent dir={layout.direction}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {layout.texts?.deleteModalTitle || "Delete Confirmation"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {layout.texts?.deleteConfirmationMessage ||
                "Are you sure you want to delete this item? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            className={layout.direction === "rtl" ? "sm:justify-start" : ""}
          >
            <div
              className={`flex gap-2 ${
                layout.direction === "rtl" ? "flex-row-reverse" : ""
              }`}
            >
              <AlertDialogCancel>
                {layout.texts?.cancelButton || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {layout.texts?.deleteButton || "Delete"}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const FormField = ({
  field,
  register,
  setValue,
  watch,
  errors,
  control,
  layout,
  isDisabled,
}: FormFieldProps) => {
  const validationRules = getValidationRules(field);
  const fieldValue = watch(field.name);
  const [dynamicOptions, setDynamicOptions] = useState<
    { label: string; value: unknown }[]
  >([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedTags, setSelectedTags] = useState<
    { label: string; value: unknown }[]
  >([]);

  useEffect(() => {
    const fetchOptions = async () => {
      if (
        field.dataSource &&
        (field.type === "dropdown" ||
          field.type === "checkbox" ||
          field.type === "autocomplete" ||
          field.type === "shadcnmultiselect") &&
        !field.dataSource?.dependsOn
      ) {
        setIsLoadingOptions(true);
        try {
          const params = new URLSearchParams({
            labelField: field.dataSource.labelField,
            valueField: field.dataSource.valueField,
            ...(field.dataSource.filterQuery && {
              filterQuery: JSON.stringify(field.dataSource.filterQuery),
            }),
            ...(field.dataSource.sortField && {
              sortField: field.dataSource.sortField,
              sortOrder: field.dataSource.sortOrder || "asc",
            }),
            ...(field.dataSource.limit && {
              limit: String(field.dataSource.limit),
            }),
            ...(field.dataSource.customLabel && {
              customLabel: field.dataSource.customLabel,
            }),
          });

          const response = await fetch(
            `/api/dropdown-options/${
              field.dataSource.collectionName
            }?${params.toString()}`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch options");
          }

          const options = await response.json();
          setDynamicOptions(options);
        } catch (error) {
          console.error("Error fetching options:", error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      }
    };

    fetchOptions();

    // Set up refresh interval if specified
    if (
      (field.type === "dropdown" ||
        field.type === "autocomplete" ||
        field.type === "checkbox" ||
        field.type === "shadcnmultiselect") &&
      field.dataSource?.refreshInterval
    ) {
      const interval = setInterval(
        fetchOptions,
        field.dataSource.refreshInterval * 1000
      );
      return () => clearInterval(interval);
    }
  }, [field]);

  // Initialize selected tags from field value
  useEffect(() => {
    if (field.type === "autocomplete" && fieldValue) {
      const tags = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
      const options = field.dataSource ? dynamicOptions : field.options || [];
      const selectedTags = tags.map((value) => {
        const option = options.find((opt) => opt.value === value);
        return option || { label: String(value), value };
      });
      setSelectedTags(selectedTags);
    }
  }, [field, fieldValue, dynamicOptions]);

  // Handle dependent dropdowns and checkboxes
  useEffect(() => {
    if (
      field.dataSource?.dependsOn &&
      (field.type === "dropdown" ||
        field.type === "checkbox" ||
        field.type === "autocomplete" ||
        field.type === "shadcnmultiselect")
    ) {
      // Handle both single string and array of strings for dependsOn
      const dependentFields = Array.isArray(field.dataSource.dependsOn)
        ? field.dataSource.dependsOn
        : [field.dataSource.dependsOn];

      // Watch all dependent fields
      const dependentValues = dependentFields.map((fieldName) =>
        watch(fieldName)
      );

      const fetchDependentOptions = async () => {
        setIsLoadingOptions(true);
        try {
          // Build filter query with all dependent fields
          const filterQuery: Record<string, unknown> = {
            ...(field.dataSource!.filterQuery || {}),
          };

          // Add each dependent field to the filter query
          let hasValidDependencies = true;
          dependentFields.forEach((fieldName, index) => {
            const value = dependentValues[index];
            // Only add non-empty values to the filter
            if (value !== undefined && value !== null && value !== "") {
              filterQuery[fieldName] = value;
            } else {
              hasValidDependencies = false;
            }
          });

          // Only proceed with the API call if we have valid dependencies
          if (hasValidDependencies) {
            const params = new URLSearchParams({
              labelField: field.dataSource!.labelField,
              valueField: field.dataSource!.valueField,
              filterQuery: JSON.stringify(filterQuery),
              ...(field.dataSource!.sortField && {
                sortField: field.dataSource!.sortField,
                sortOrder: field.dataSource!.sortOrder || "asc",
              }),
              ...(field.dataSource!.limit && {
                limit: String(field.dataSource!.limit),
              }),
              ...(field.dataSource!.customLabel && {
                customLabel: field.dataSource!.customLabel,
              }),
            });

            const url = `/api/dropdown-options/${
              field.dataSource!.collectionName
            }?${params.toString()}`;

            const response = await fetch(url, {
              headers: {
                "x-domain": window.location.host,
              },
            });

            if (!response.ok) {
              throw new Error(
                `Failed to fetch dependent options: ${response.status} ${response.statusText}`
              );
            }

            const options = await response.json();
            setDynamicOptions(options);

            // Clear options and value when dependencies are invalid
            setDynamicOptions([]);
            // Set appropriate empty value based on field type
            if (field.type === "shadcnmultiselect") {
              // For shadcnmultiselect, always use empty array (even when not isMultiple)
              setValue(field.name, [], { shouldValidate: true });
            } else if (field.type === "checkbox" && field.isMultiple) {
              // For multi checkboxes, use empty array
              setValue(field.name, [], { shouldValidate: true });
            } else {
              // For other field types, use empty string
              setValue(field.name, "", { shouldValidate: true });
            }
          } else {
            // Clear options and value when dependencies are invalid
            setDynamicOptions([]);
            setValue(
              field.name,
              (field.type === "checkbox" ||
                field.type === "shadcnmultiselect") &&
                field.isMultiple
                ? []
                : "",
              { shouldValidate: true }
            );
          }
        } catch (error) {
          console.error(`Error fetching options for ${field.name}:`, error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      };

      fetchDependentOptions();
    }
  }, [
    field,
    ...(Array.isArray(field.dataSource?.dependsOn)
      ? field.dataSource.dependsOn.map((fieldName) => watch(fieldName))
      : [watch(field.dataSource?.dependsOn || "")]),
  ]);

  if (field.fields) {
    return (
      <NestedFields
        field={field}
        register={register}
        setValue={setValue}
        watch={watch}
        errors={errors}
        control={control}
        layout={layout}
        isDisabled={isDisabled}
      />
    );
  }

  if (field.type === "checkbox") {
    // Get options from either datasource or static options
    const options = field.dataSource ? dynamicOptions : field.options || [];

    if (options.length > 0 && field.isMultiple) {
      // Multiple checkboxes
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            {field.title}
            {field.required && <span className="text-destructive">*</span>}
          </label>
          {isLoadingOptions ? (
            <div className="text-sm text-muted-foreground">
              {layout.texts?.loadingMessage || "Loading options..."}
            </div>
          ) : (
            <div className="space-y-2">
              {options.map((option) => (
                <div
                  key={String(option.value)}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${field.name}.${option.value}`}
                    checked={
                      Array.isArray(fieldValue) &&
                      fieldValue.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(fieldValue)
                        ? fieldValue
                        : [];
                      if (checked) {
                        setValue(field.name, [...currentValue, option.value], {
                          shouldValidate: true,
                        });
                      } else {
                        setValue(
                          field.name,
                          currentValue.filter((v) => v !== option.value),
                          { shouldValidate: true }
                        );
                      }
                    }}
                    disabled={isDisabled}
                  />
                  <label
                    htmlFor={`${field.name}.${option.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          )}
          {errors[field.name] && (
            <p className="text-destructive text-sm">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      );
    } else {
      // Single checkbox
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.name}
            checked={Boolean(fieldValue)}
            onCheckedChange={(checked) => {
              setValue(field.name, checked, { shouldValidate: true });
            }}
            disabled={isDisabled}
          />
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {field.title}
            {field.required && <span className="text-destructive">*</span>}
          </label>
          {errors[field.name] && (
            <p className="text-destructive text-sm">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      );
    }
  } else if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
          {isDisabled && (
            <span className="text-muted-foreground text-xs ml-1">
              (Read-only)
            </span>
          )}
        </label>
        <Textarea
          id={field.name}
          disabled={isDisabled}
          placeholder={field.placeholder}
          className={`w-full ${layout.direction === "rtl" && "text-right"}`}
          {...register(field.name, validationRules)}
        />
        {errors[field.name] && (
          <p className="text-sm text-destructive mt-1">
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else if (field.type === "shadcnmultiselect") {
    const options = field.dataSource ? dynamicOptions : field.options || [];

    // Always handle as multiple selection for shadcnmultiselect
    // Convert single values to arrays if needed
    const currentValue = Array.isArray(fieldValue)
      ? fieldValue
      : fieldValue
      ? [fieldValue]
      : [];

    // Extract just the values for the MultiSelect component
    const selectedValues = Array.isArray(currentValue)
      ? currentValue.map((item) =>
          typeof item === "object" && item !== null && "value" in item
            ? item.value
            : item
        )
      : [];

    return (
      <div className="space-y-2 border-0  ">
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
          {isDisabled && (
            <span className="text-muted-foreground text-xs ml-1">
              (Read-only)
            </span>
          )}
        </label>
        <div className="relative  ">
          <MultiSelect
            options={options}
            selected={selectedValues}
            onChange={(values) => {
              // Create an array of objects with both label and value
              const valuesWithLabels = values.map((value) => {
                const option = options.find((opt) => opt.value === value);
                return {
                  label: option ? option.label : String(value),
                  value: value,
                };
              });
              setValue(field.name, valuesWithLabels, { shouldValidate: true });
            }}
            placeholder={layout.texts?.selectPlaceholder || "Select options..."}
            disabled={isDisabled}
            emptyMessage={isLoadingOptions ? "" : "No options available"}
            loading={isLoadingOptions}
            loadingMessage={
              layout.texts?.loadingMessage || "Loading options..."
            }
            className={
              layout.direction === "rtl" ? "text-right " : "text-left "
            }
          />
        </div>
        <input type="hidden" {...register(field.name, validationRules)} />
        {errors[field.name] && (
          <p className="text-sm text-destructive mt-1">
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else if (field.type === "importTextBox") {
    // Parse import text to structured data
    const parseImportText = (text: string): object[] => {
      if (!text.trim()) return [];

      const rows = text.trim().split("\n");
      const nameBinding = field.importTextBoxStyle?.nameBinding || [];

      // Convert Persian/Arabic digits to English
      const convertToEnglishDigits = (str: string): string => {
        return str.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
      };

      // Process rows into objects according to binding schema
      const processedObjects = rows.map((row) => {
        const columns = row.split("\t");
        const obj: Record<string, string | number> = {};

        nameBinding.forEach((binding, index) => {
          if (index >= columns.length) return;

          // Get the column value and trim it
          let value = columns[index]?.trim() || "";

          // Handle field type
          if (binding.type === "number") {
            // Convert any non-English digits
            value = convertToEnglishDigits(value);
            // Convert to actual number
            obj[binding.name] = value ? Number(value) : 0;
          } else {
            // Default to text
            obj[binding.name] = value;
          }
        });

        return obj;
      });

      // Handle uniqueness constraints
      const uniqueFields = nameBinding
        .filter((binding) => binding.isUnique)
        .map((binding) => binding.name);

      if (uniqueFields.length > 0) {
        const uniqueMap: Record<string, Record<string, number>> = {};

        // Initialize maps for each unique field
        uniqueFields.forEach((field) => {
          uniqueMap[field] = {};
        });

        // Mark latest index for each unique value
        processedObjects.forEach((obj, index) => {
          uniqueFields.forEach((field) => {
            const value = String(obj[field]); // Convert to string for use as key
            if (value) {
              uniqueMap[field][value] = index;
            }
          });
        });

        // Keep only the latest entries for each unique field
        return processedObjects.filter((obj, index) => {
          return !uniqueFields.some((field) => {
            const value = String(obj[field]); // Convert to string for use as key
            return value && uniqueMap[field][value] !== index;
          });
        });
      }

      return processedObjects;
    };

    // Format structured data to display text
    const formatImportData = (data: object[]): string => {
      if (!Array.isArray(data) || data.length === 0) return "";

      const nameBinding = field.importTextBoxStyle?.nameBinding || [];

      return data
        .map((item) => {
          const row = nameBinding.map((binding) => {
            return (item as Record<string, any>)[binding.name] !== undefined
              ? String((item as Record<string, any>)[binding.name])
              : "";
          });
          return row.join("\t");
        })
        .join("\n");
    };

    // Event handler for textarea changes
    const handleImportTextChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const text = e.target.value;
      const parsedData = parseImportText(text);
      // Update the form data with the structured parsed data
      setValue(field.name, parsedData, { shouldValidate: true });
    };

    // Track expanded state
    const [isExpanded, setIsExpanded] = useState<boolean>(
      field.importTextBoxStyle?.isOpen ?? false
    );

    // Initialize textarea with formatted data if in edit mode
    const initialValue = useMemo(() => {
      const fieldValue = watch(field.name);
      return Array.isArray(fieldValue) ? formatImportData(fieldValue) : "";
    }, [field.name, watch, formatImportData]);

    return (
      <div className="form-field space-y-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          <div className="mb-1 text-sm font-medium text-gray-700 flex-1">
            {field.title}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </div>
        </div>

        {isExpanded && (
          <>
            <Textarea
              rows={field.importTextBoxStyle?.rows || 5}
              placeholder={
                field.importTextBoxStyle?.placeholder ||
                "Paste tabular data here..."
              }
              className={field.importTextBoxStyle?.className || "w-full"}
              onChange={handleImportTextChange}
              defaultValue={initialValue}
            />
            <div className="text-xs text-gray-500 mt-1">
              ستون‌ها باید از اکسل با Tab جداشده باشند. ترتیب ستون‌ها:
              {field.importTextBoxStyle?.nameBinding?.map((binding, i) => (
                <span key={binding.name} className="mx-1">
                  {binding.name}
                  {binding.isUnique && (
                    <small className="text-blue-500"> (منحصر به فرد)</small>
                  )}
                  {binding.type === "number" && (
                    <small className="text-green-500"> (عدد)</small>
                  )}
                  {i < (field.importTextBoxStyle?.nameBinding?.length || 0) - 1
                    ? " - "
                    : ""}
                </span>
              ))}
            </div>
            {!Array.isArray(fieldValue) || fieldValue.length === 0 ? null : (
              <div className="text-xs text-gray-500">
                {fieldValue.length} مورد داده وارد شده است
              </div>
            )}
          </>
        )}
      </div>
    );
  } else if (field.type === "switch") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={field.name}
            className={cn(
              field.required &&
                "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {field.title}
          </Label>
          <Switch
            id={field.name}
            checked={fieldValue}
            onCheckedChange={(checked) =>
              setValue(field.name, checked, { shouldValidate: true })
            }
            disabled={!field.enabled}
          />
        </div>
        {errors[field.name] && (
          <span className="text-sm text-red-500">
            {errors[field.name]?.message as string}
          </span>
        )}
      </div>
    );
  } else if (field.type === "togglegroup") {
    return (
      <div className="flex flex-col gap-2">
        <Label
          className={cn(
            field.required &&
              "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {field.title}
        </Label>
        <ToggleGroup
          type="multiple"
          value={Array.isArray(fieldValue) ? fieldValue : []}
          onValueChange={(value) =>
            setValue(field.name, value, { shouldValidate: true })
          }
          disabled={!field.enabled}
        >
          {field.options?.map((option) => (
            <ToggleGroupItem
              key={String(option.value)}
              value={String(option.value)}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {errors[field.name] && (
          <span className="text-sm text-red-500">
            {errors[field.name]?.message as string}
          </span>
        )}
      </div>
    );
  } else if (field.type === "radio" && field.options) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <RadioGroup
          value={String(fieldValue || field.defaultValue || "")}
          onValueChange={(value) => {
            setValue(field.name, value, { shouldValidate: true });
          }}
          className={field.layout === "inline" ? "flex gap-4" : "space-y-2"}
          disabled={isDisabled}
        >
          {field.options.map((option) => (
            <div
              key={String(option.value)}
              className={`flex items-center ${
                layout.direction === "rtl" ? "space-x-reverse" : ""
              } space-x-2`}
            >
              <RadioGroupItem
                value={String(option.value)}
                id={`${field.name}-${option.value}`}
              />
              <label
                htmlFor={`${field.name}-${option.value}`}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
        <input type="hidden" {...register(field.name, validationRules)} />
        {errors[field.name] && (
          <p
            className={`text-destructive text-sm ${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else if (field.type === "label") {
    return (
      <Label
        className={cn(
          field.labelStyle?.fontSize && `text-${field.labelStyle.fontSize}`,
          field.labelStyle?.fontWeight && `font-${field.labelStyle.fontWeight}`,
          field.labelStyle?.color && `text-${field.labelStyle.color}`,
          field.labelStyle?.textAlign && `text-${field.labelStyle.textAlign}`
        )}
      >
        {field.title}
      </Label>
    );
  } else if (field.type === "datepicker") {
    return (
      <div className="space-y-2">
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
        </label>
        <DatePicker
          calendar={persian}
          locale={persian_fa}
          value={fieldValue as Value}
          onChange={(date) => {
            setValue(field.name, date ? date.toString() : "", {
              shouldValidate: true,
            });
          }}
          style={{
            padding: "17px",
          }}
          disabled={isDisabled}
          multiple={field.isMultiple}
          format={field.datepickerStyle?.format || "YYYY-MM-DD"}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            field.datepickerStyle?.className
          )}
          plugins={[
            // Add TimePicker plugin if timePicker is enabled in the field config
            ...(field.datepickerStyle?.timePicker
              ? [<TimePicker position="bottom" />]
              : []),
            // Add any additional plugins from the field configuration
            ...(field.datepickerStyle?.plugins || []),
          ]}
          // Add other DatePicker props from the configuration
          onlyMonthPicker={field.datepickerStyle?.onlyMonthPicker}
          onlyYearPicker={field.datepickerStyle?.onlyYearPicker}
          minDate={field.datepickerStyle?.minDate}
          maxDate={field.datepickerStyle?.maxDate}
          weekStartDayIndex={field.datepickerStyle?.weekStartDayIndex}
          disableYearPicker={field.datepickerStyle?.disableYearPicker}
          disableMonthPicker={field.datepickerStyle?.disableMonthPicker}
          readOnly={field.datepickerStyle?.readOnly || isDisabled}
          hideWeekDays={field.datepickerStyle?.hideWeekDays}
          hideMonth={field.datepickerStyle?.hideMonth}
          hideYear={field.datepickerStyle?.hideYear}
        />
        <input type="hidden" {...register(field.name, validationRules)} />
        {errors[field.name] && (
          <p className="text-sm text-destructive mt-1">
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else if (field.type === "file") {
    return (
      <div key={field.name} className="mb-4">
        <label className="block text-sm font-medium mb-1">
          {field.title}
          {field.required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="file"
          onChange={(e) => handleFileChange(e, field)}
          multiple={field.isMultiple}
          accept={field.fileConfig?.allowedTypes?.join(",")}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary/90"
          disabled={!field.enabled || field.readonly}
        />
        {/* Show progress bars for this field */}
        {uploadProgress[field.name] &&
          Object.entries(uploadProgress[field.name]).map(
            ([fileId, { progress, fileName }]) => (
              <div key={fileId} className="mt-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span className="truncate">{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )
          )}
        {errors[field.name] && (
          <span className="text-red-500 text-sm">
            {field.validation?.requiredMessage || "This field is required"}
          </span>
        )}
        {renderCurrentFiles(field.name, Boolean(field.isMultiple))}
      </div>
    );
  } else if (field.type === "autoCompleteText") {
    // Ensure options are properly formatted with string values
    const options = field.dataSource
      ? dynamicOptions.map((opt) => ({
          label: String(opt.label || ""),
          value:
            typeof opt.value === "string" ? opt.value : String(opt.value || ""),
        }))
      : (field.options || []).map((opt) => ({
          label: String(opt.label || ""),
          value:
            typeof opt.value === "string" ? opt.value : String(opt.value || ""),
        }));

    // Prepare a map of values to labels for selected items
    const selectedLabelsMap: Record<string, string> = {};
    if (Array.isArray(fieldValue)) {
      fieldValue.forEach((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          "value" in item &&
          "label" in item
        ) {
          selectedLabelsMap[String(item.value)] = String(item.label);
        }
      });
    } else if (
      fieldValue &&
      typeof fieldValue === "object" &&
      "value" in fieldValue &&
      "label" in fieldValue
    ) {
      selectedLabelsMap[String(fieldValue.value)] = String(fieldValue.label);
    }

    // Log options to help debug
    // console.log(`autoCompleteText options for ${field.name}:`, options);
    // console.log(
    //   `autoCompleteText selected labels for ${field.name}:`,
    //   selectedLabelsMap
    // );

    // Local search handler for this specific field
    const handleAutoCompleteSearch = async (query: string) => {
      console.log(`Searching for ${query} in ${field.name}`);
      if (
        field.dataSource &&
        query.length >= (field.autoCompleteStyle?.minLength || 2)
      ) {
        setIsLoadingOptions(true);
        try {
          // Always use the dropdown-options endpoint for proper database collections
          const apiUrl = `/api/dropdown-options/${field.dataSource.collectionName}`;

          // Build query parameters
          const params = new URLSearchParams();
          params.append("query", query);

          // Add common parameters for dropdown options endpoint
          params.append("labelField", field.dataSource.labelField);
          params.append("valueField", field.dataSource.valueField);

          // Add dependent field values if any
          if (field.dataSource.dependsOn) {
            const dependsOnFields = Array.isArray(field.dataSource.dependsOn)
              ? field.dataSource.dependsOn
              : [field.dataSource.dependsOn];

            const filterQuery: Record<string, unknown> = {
              ...(field.dataSource.filterQuery || {}),
            };

            let hasValidDependencies = true;

            dependsOnFields.forEach((dependFieldName) => {
              const dependValue = watch(dependFieldName);
              if (dependValue) {
                // Include in the filterQuery
                filterQuery[dependFieldName] = dependValue;
              } else {
                hasValidDependencies = false;
              }
            });

            // Add filterQuery
            if (Object.keys(filterQuery).length > 0) {
              params.append("filterQuery", JSON.stringify(filterQuery));
            }

            // Only proceed if dependencies are valid
            if (!hasValidDependencies && field.dataSource.dependsOn) {
              setDynamicOptions([]);
              setIsLoadingOptions(false);
              return;
            }
          } else if (field.dataSource.filterQuery) {
            // Add filterQuery for non-dependent fields
            params.append(
              "filterQuery",
              JSON.stringify(field.dataSource.filterQuery)
            );
          }

          // Add sort parameters
          if (field.dataSource.sortField) {
            params.append("sortField", field.dataSource.sortField);
            params.append("sortOrder", field.dataSource.sortOrder || "asc");
          }

          console.log(`Fetching options from: ${apiUrl}?${params.toString()}`);

          // Make the API request
          const response = await fetch(`${apiUrl}?${params.toString()}`, {
            headers: {
              "x-domain": window.location.host,
            },
          });
          if (!response.ok) {
            throw new Error(
              `Failed to fetch options: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          console.log("Received API response:", data);

          // Format options - the dropdown API returns array directly, not in an "options" property
          let formattedOptions;
          if (Array.isArray(data)) {
            formattedOptions = data.map((opt) => ({
              label: String(opt.label || ""),
              value:
                typeof opt.value === "string"
                  ? opt.value
                  : String(opt.value || ""),
            }));
          } else if (data.options && Array.isArray(data.options)) {
            // Handle case where API returns {options: [...]}
            formattedOptions = data.options.map((opt) => ({
              label: String(opt.label || ""),
              value:
                typeof opt.value === "string"
                  ? opt.value
                  : String(opt.value || ""),
            }));
          } else {
            formattedOptions = [];
          }

          console.log("Formatted options:", formattedOptions);
          setDynamicOptions(formattedOptions);
        } catch (error) {
          console.error("Error fetching autocomplete options:", error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      } else if (query.length < (field.autoCompleteStyle?.minLength || 2)) {
        // Clear options when query is too short
        setDynamicOptions([]);
        setIsLoadingOptions(false);
      }
    };

    return (
      <div className="space-y-2">
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
          {isDisabled && (
            <span className="text-muted-foreground text-xs ml-1">
              (Read-only)
            </span>
          )}
        </label>
        <AutocompleteTags
          options={options}
          selected={
            Array.isArray(fieldValue)
              ? fieldValue.map((v) => {
                  if (typeof v === "object" && v !== null && "value" in v) {
                    return String(v.value);
                  }
                  return String(v);
                })
              : fieldValue && typeof fieldValue === "object" && fieldValue.value
              ? [String(fieldValue.value)]
              : fieldValue && typeof fieldValue === "string"
              ? [fieldValue]
              : []
          }
          selectedLabels={selectedLabelsMap}
          onChange={(values, newOptionLabel) => {
            // Convert string values to objects with both label and value
            const fullObjects = values.map((value) => {
              // First check if this is the newly added value and we have label info
              if (newOptionLabel && newOptionLabel.value === value) {
                return {
                  label: newOptionLabel.label,
                  value: newOptionLabel.value,
                };
              }

              // Then check if this value is in the existing field values (for preserving labels on unselect)
              if (Array.isArray(fieldValue)) {
                const existingItem = fieldValue.find(
                  (item) =>
                    typeof item === "object" &&
                    item !== null &&
                    "value" in item &&
                    String(item.value) === value
                );

                if (
                  existingItem &&
                  typeof existingItem === "object" &&
                  "label" in existingItem
                ) {
                  return {
                    label: String(existingItem.label),
                    value: value,
                  };
                }
              } else if (
                fieldValue &&
                typeof fieldValue === "object" &&
                "value" in fieldValue &&
                "label" in fieldValue &&
                String(fieldValue.value) === value
              ) {
                return {
                  label: String(fieldValue.label),
                  value: value,
                };
              }

              // Then check if it's a custom value (not in options)
              const existingOption = options.find((opt) => opt.value === value);
              if (existingOption) {
                // Use the option with both label and value
                return {
                  label: existingOption.label,
                  value: existingOption.value,
                };
              } else {
                // For custom values, use the value as the label too
                return {
                  label: value,
                  value: value,
                };
              }
            });

            // Save the full objects to the database
            setValue(
              field.name,
              field.isMultiple
                ? fullObjects
                : fullObjects.length > 0
                ? fullObjects[0]
                : "",
              { shouldValidate: true }
            );
          }}
          placeholder={layout.texts?.selectPlaceholder || "Select or type..."}
          inputPlaceholder={layout.texts?.searchPlaceholder || "Search..."}
          emptyMessage={layout.texts?.noResultsMessage || "No results found"}
          disabled={isDisabled}
          allowCustomValues={field.autoCompleteStyle?.allowNew || false}
          loading={isLoadingOptions}
          loadingMessage={layout.texts?.loadingMessage || "Loading options..."}
          className={layout.direction === "rtl" ? "text-right" : "text-left"}
          onSearch={handleAutoCompleteSearch}
          minSearchLength={field.autoCompleteStyle?.minLength || 2}
        />
        <input type="hidden" {...register(field.name, validationRules)} />
        {errors[field.name] && (
          <p className="text-sm text-destructive mt-1">
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else if (field.type === "compositefields" && field.compositeFieldsStyle) {
    // Get existing data for this field from the editing entity data
    const existingData = window.__EDITING_ENTITY_DATA__?.[field.name] as
      | Record<string, unknown>
      | undefined;

    // Determine the initial selected item value
    // First check if there's existing data with a type field
    // If not, use the defaultItem from the configuration
    const initialItemValue =
      (existingData?.type as string) ||
      field.compositeFieldsStyle.defaultItem ||
      "";

    // State to track the selected item (initialized with the correct value)
    const [selectedItemValue, setSelectedItemValue] =
      useState<string>(initialItemValue);

    // Find the selected item's configuration
    const selectedItem = field.compositeFieldsStyle.items.find(
      (item) => item.value === selectedItemValue
    );

    // Initialize field values from default or existing data
    useEffect(() => {
      if (selectedItem) {
        // Set the type field value
        setValue(`${field.name}.type`, selectedItemValue, {
          shouldValidate: true,
        });

        // For each field in the selected item, check if it already has a value
        selectedItem.fields.forEach((itemField) => {
          const fieldPath = `${field.name}.${selectedItemValue}.${itemField.name}`;

          // Check if we have existing data for this field
          if (
            existingData &&
            existingData[selectedItemValue] &&
            typeof existingData[selectedItemValue] === "object" &&
            (existingData[selectedItemValue] as Record<string, unknown>)?.[
              itemField.name
            ] !== undefined
          ) {
            // Use the value from existing data
            const fieldValue = (
              existingData[selectedItemValue] as Record<string, unknown>
            )[itemField.name];
            setValue(fieldPath, fieldValue, { shouldValidate: true });
          }
          // If no existing data but we have a default value, use that
          else if (itemField.defaultValue !== undefined) {
            setValue(fieldPath, itemField.defaultValue, {
              shouldValidate: true,
            });
          }
        });
      }
    }, [selectedItemValue, selectedItem, field.name, setValue, existingData]);

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor={`${field.name}-selector`}
            className={`block text-sm font-medium text-${
              layout.direction === "rtl" ? "right" : "left"
            }`}
          >
            {field.title}
            {field.required && <span className="text-destructive">*</span>}
          </label>

          <Select
            value={selectedItemValue}
            onValueChange={(value) => {
              setSelectedItemValue(value);
            }}
            disabled={isDisabled}
          >
            <SelectTrigger id={`${field.name}-selector`}>
              <SelectValue
                placeholder={
                  layout.texts?.selectPlaceholder || "Select an option"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {field.compositeFieldsStyle.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Hidden input to store the selected type */}
          <input
            type="hidden"
            {...register(`${field.name}.type`, {
              required: field.required
                ? field.validation?.requiredMessage || "This field is required"
                : false,
            })}
          />

          {errors[field.name]?.type && (
            <p className="text-sm text-destructive mt-1">
              {
                (errors[field.name] as Record<string, unknown>)?.type
                  ?.message as string
              }
            </p>
          )}
        </div>

        {/* Render fields for the selected item */}
        {selectedItem && (
          <div className="border-l-2 pl-4 mt-4 space-y-4">
            {selectedItem.fields.map((itemField) => {
              const fieldName = `${field.name}.${selectedItemValue}.${itemField.name}`;

              // Render different field types
              return (
                <Fragment key={fieldName}>
                  {itemField.type === "text" && (
                    <div className="space-y-2">
                      <label
                        htmlFor={fieldName}
                        className={`block text-sm font-medium text-${
                          layout.direction === "rtl" ? "right" : "left"
                        }`}
                      >
                        {itemField.title}
                        {itemField.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <Input
                        id={fieldName}
                        disabled={isDisabled}
                        placeholder={itemField.placeholder}
                        className={
                          layout.direction === "rtl"
                            ? "text-right"
                            : "text-left"
                        }
                        {...register(fieldName, {
                          required: itemField.required
                            ? "This field is required"
                            : false,
                        })}
                      />
                      {errors[field.name]?.[selectedItemValue]?.[
                        itemField.name
                      ] && (
                        <p className="text-sm text-destructive mt-1">
                          {
                            errors[field.name]?.[selectedItemValue]?.[
                              itemField.name
                            ]?.message as string
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {itemField.type === "number" && (
                    <div className="space-y-2">
                      <label
                        htmlFor={fieldName}
                        className={`block text-sm font-medium text-${
                          layout.direction === "rtl" ? "right" : "left"
                        }`}
                      >
                        {itemField.title}
                        {itemField.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <Input
                        id={fieldName}
                        type="number"
                        disabled={isDisabled}
                        placeholder={itemField.placeholder}
                        className={
                          layout.direction === "rtl"
                            ? "text-right"
                            : "text-left"
                        }
                        {...register(fieldName, {
                          required: itemField.required
                            ? "This field is required"
                            : false,
                          valueAsNumber: true,
                        })}
                      />
                      {errors[field.name]?.[selectedItemValue]?.[
                        itemField.name
                      ] && (
                        <p className="text-sm text-destructive mt-1">
                          {
                            errors[field.name]?.[selectedItemValue]?.[
                              itemField.name
                            ]?.message as string
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {itemField.type === "dropdown" && itemField.options && (
                    <div className="space-y-2">
                      <label
                        htmlFor={fieldName}
                        className={`block text-sm font-medium text-${
                          layout.direction === "rtl" ? "right" : "left"
                        }`}
                      >
                        {itemField.title}
                        {itemField.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <Select
                        value={watch(fieldName) || ""}
                        onValueChange={(value) => {
                          setValue(fieldName, value, { shouldValidate: true });
                        }}
                        disabled={isDisabled}
                      >
                        <SelectTrigger id={fieldName}>
                          <SelectValue
                            placeholder={
                              layout.texts?.selectPlaceholder ||
                              "Select an option"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {itemField.options.map((option) => (
                            <SelectItem
                              key={option.value.toString()}
                              value={option.value.toString()}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="hidden"
                        {...register(fieldName, {
                          required: itemField.required
                            ? "This field is required"
                            : false,
                        })}
                      />
                      {errors[field.name]?.[selectedItemValue]?.[
                        itemField.name
                      ] && (
                        <p className="text-sm text-destructive mt-1">
                          {
                            errors[field.name]?.[selectedItemValue]?.[
                              itemField.name
                            ]?.message as string
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {itemField.type === "checkbox" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={fieldName}
                        checked={watch(fieldName) || false}
                        onCheckedChange={(checked) => {
                          setValue(fieldName, checked, {
                            shouldValidate: true,
                          });
                        }}
                        disabled={isDisabled}
                      />
                      <label
                        htmlFor={fieldName}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {itemField.title}
                        {itemField.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <input
                        type="hidden"
                        {...register(fieldName, {
                          required: itemField.required
                            ? "This field is required"
                            : false,
                        })}
                      />
                      {errors[field.name]?.[selectedItemValue]?.[
                        itemField.name
                      ] && (
                        <p className="text-sm text-destructive mt-1">
                          {
                            errors[field.name]?.[selectedItemValue]?.[
                              itemField.name
                            ]?.message as string
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {itemField.type === "switch" && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={fieldName}
                        checked={watch(fieldName) || false}
                        onCheckedChange={(checked) => {
                          setValue(fieldName, checked, {
                            shouldValidate: true,
                          });
                        }}
                        disabled={isDisabled}
                      />
                      <label
                        htmlFor={fieldName}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {itemField.title}
                        {itemField.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <input
                        type="hidden"
                        {...register(fieldName, {
                          required: itemField.required
                            ? "This field is required"
                            : false,
                        })}
                      />
                      {errors[field.name]?.[selectedItemValue]?.[
                        itemField.name
                      ] && (
                        <p className="text-sm text-destructive mt-1">
                          {
                            errors[field.name]?.[selectedItemValue]?.[
                              itemField.name
                            ]?.message as string
                          }
                        </p>
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  } else if (field.type === "richtextbox") {
    const fieldValue = watch(field.name) || "";
    return (
      <div
        className="space-y-2"
        style={{ display: field.visible ? "block" : "none" }}
      >
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
          {isDisabled && (
            <span className="text-muted-foreground text-xs ml-1">
              (Read-only)
            </span>
          )}
        </label>
        <RichTextEditor
          value={fieldValue as string}
          onChange={(value) =>
            setValue(field.name, value, { shouldValidate: true })
          }
          readOnly={isDisabled || field.readonly}
          dir={layout.direction}
          placeholder={field.placeholder || "Start writing..."}
          className={field.className}
        />
        <input type="hidden" {...register(field.name, validationRules)} />
        {errors[field.name] && (
          <p
            className={`text-destructive text-sm ${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  } else {
    return (
      <div
        className="space-y-2"
        style={{ display: field.visible ? "block" : "none" }}
      >
        <label
          htmlFor={field.name}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
          {field.required && <span className="text-destructive">*</span>}
          {isDisabled && (
            <span className="text-muted-foreground text-xs ml-1">
              (Read-only)
            </span>
          )}
        </label>

        {field.type === "dropdown" ? (
          <>
            <Select
              value={String(fieldValue || "")}
              onValueChange={(value) =>
                setValue(field.name, value, { shouldValidate: true })
              }
              disabled={isDisabled || isLoadingOptions}
              dir={layout.direction}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingOptions
                      ? "Loading..."
                      : layout.texts?.selectPlaceholder
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(field.dataSource ? dynamicOptions : field.options)?.map(
                  (option) => (
                    <SelectItem
                      key={String(option.value)}
                      value={String(option.value)}
                    >
                      {option.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <input type="hidden" {...register(field.name, validationRules)} />
          </>
        ) : (
          <Input
            defaultValue={field.defaultValue}
            readOnly={field.readonly}
            type={field.type}
            {...register(field.name, validationRules)}
            disabled={isDisabled || field.readonly}
            className={`${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
            dir={layout.direction}
          />
        )}

        {errors[field.name] && (
          <p
            className={`text-destructive text-sm ${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
          >
            {errors[field.name]?.message as string}
          </p>
        )}
      </div>
    );
  }
};

// Add this type at the top of the file
type FileData = {
  [key: string]: UploadedFile | UploadedFile[];
};

// Update the UploadProgress type to better handle multiple fields
type UploadProgress = {
  [fieldName: string]: {
    [fileId: string]: {
      progress: number;
      fileName: string;
    };
  };
};

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  formStructure,
  editingId,
  loading,
  layout = {
    direction: "ltr",
    texts: {
      addModalTitle: "Add New Entry",
      editModalTitle: "Edit Entry",
      cancelButton: "Cancel",
      processingMessage: "Processing...",
      selectPlaceholder: "Select an option",
    },
  },
  collectionName,
}: FormModalProps & { collectionName: string }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();

  // Track uploaded files in state
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, UploadedFile | UploadedFile[]>
  >({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});

  useEffect(() => {
    if (isOpen && window.__EDITING_ENTITY_DATA__) {
      reset(window.__EDITING_ENTITY_DATA__ as Record<string, unknown>);
      // Initialize uploadedFiles state with existing file data
      const fileFields = formStructure.filter((field) => field.type === "file");
      const existingFiles: Record<string, UploadedFile | UploadedFile[]> = {};
      fileFields.forEach((field) => {
        if (window.__EDITING_ENTITY_DATA__?.[field.name]) {
          existingFiles[field.name] = window.__EDITING_ENTITY_DATA__[
            field.name
          ] as UploadedFile | UploadedFile[];
        }
      });
      setUploadedFiles(existingFiles);
    } else {
      reset({});
      setUploadedFiles({});
    }
  }, [isOpen, reset, formStructure]);

  // Update the file display section to handle types properly and add delete functionality
  const renderCurrentFiles = (fieldName: string, isMultiple: boolean) => {
    const fileData = window.__EDITING_ENTITY_DATA__?.[fieldName];
    if (!fileData) return null;

    const handleDeleteFile = (file: UploadedFile) => {
      // Get current files
      const currentFiles = window.__EDITING_ENTITY_DATA__?.[fieldName];

      // Remove the file from the list
      const updatedFiles = isMultiple
        ? (currentFiles as UploadedFile[]).filter(
            (f) => f.filename !== file.filename
          )
        : undefined; // Use undefined instead of null for single file deletion

      // Update the form data
      window.__EDITING_ENTITY_DATA__ = {
        ...window.__EDITING_ENTITY_DATA__,
        [fieldName]: updatedFiles,
      };

      // Update uploadedFiles state
      setUploadedFiles((prev) => {
        const newState = { ...prev };
        if (updatedFiles === undefined) {
          delete newState[fieldName]; // Remove the field entirely if no files
        } else {
          newState[fieldName] = updatedFiles;
        }
        return newState;
      });

      // Update form value
      setValue(fieldName, updatedFiles, { shouldValidate: true });
    };

    return (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Current file(s):</p>
        {isMultiple ? (
          <ul className="list-none space-y-2">
            {(fileData as UploadedFile[]).map((file: UploadedFile) => (
              <li
                key={file.filename}
                className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
              >
                <span className="truncate flex-1">{file.originalName}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteFile(file)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
            <span className="truncate flex-1">
              {(fileData as UploadedFile).originalName}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteFile(fileData as UploadedFile)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        )}
      </div>
    );
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: FormField
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploadedFilesArray: UploadedFile[] = [];
      const config = field.fileConfig || {};

      // Reset progress for this field only
      setUploadProgress((prev) => ({
        ...prev,
        [field.name]: {},
      }));

      // Get current file info
      const currentFileData = window.__EDITING_ENTITY_DATA__ as
        | FileData
        | undefined;
      const existingFiles =
        field.isMultiple && currentFileData?.[field.name]
          ? Array.isArray(currentFileData[field.name])
            ? (currentFileData[field.name] as UploadedFile[])
            : [currentFileData[field.name] as UploadedFile]
          : [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${Date.now()}-${i}`;

        // Initialize progress for this file
        setUploadProgress((prev) => ({
          ...prev,
          [field.name]: {
            ...(prev[field.name] || {}),
            [fileId]: {
              progress: 0,
              fileName: file.name,
            },
          },
        }));

        // Validate file
        const error = validateFile(file, config);
        if (error) {
          // Remove progress for failed validation
          setUploadProgress((prev) => {
            const fieldProgress = { ...prev[field.name] };
            delete fieldProgress[fileId];
            return { ...prev, [field.name]: fieldProgress };
          });
          alert(error);
          continue;
        }

        // Create form data with additional info
        const formData = new FormData();
        formData.append("file", file);
        if (config.directory) {
          formData.append("directory", config.directory);
        }
        if (editingId) {
          formData.append("documentId", editingId);
          formData.append("collectionName", collectionName);
          formData.append("fieldName", field.name);
        }

        try {
          // Upload file with progress tracking
          const xhr = new XMLHttpRequest();

          // Create a promise to handle the upload
          const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded * 100) / event.total);
                setUploadProgress((prev) => ({
                  ...prev,
                  [field.name]: {
                    ...(prev[field.name] || {}),
                    [fileId]: {
                      ...(prev[field.name]?.[fileId] || {}),
                      progress,
                    },
                  },
                }));
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } else {
                reject(new Error("Upload failed"));
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Upload failed"));
            });
          });

          // Start the upload
          xhr.open("POST", "/api/upload");

          // Add the domain header
          const domain = window.location.host;
          xhr.setRequestHeader("x-domain", domain);

          xhr.send(formData);

          // Wait for the upload to complete
          const uploadedFile = await uploadPromise;
          uploadedFilesArray.push(uploadedFile);

          // Set progress to 100% when complete
          setUploadProgress((prev) => ({
            ...prev,
            [field.name]: {
              ...(prev[field.name] || {}),
              [fileId]: {
                ...(prev[field.name]?.[fileId] || {}),
                progress: 100,
              },
            },
          }));

          // Remove progress bar after a delay
          setTimeout(() => {
            setUploadProgress((prev) => {
              const fieldProgress = { ...prev[field.name] };
              delete fieldProgress[fileId];
              return { ...prev, [field.name]: fieldProgress };
            });
          }, 1000);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          // Remove progress for failed upload
          setUploadProgress((prev) => {
            const fieldProgress = { ...prev[field.name] };
            delete fieldProgress[fileId];
            return { ...prev, [field.name]: fieldProgress };
          });
          alert(`Failed to upload ${file.name}`);
        }
      }

      // Combine new files with existing files if multiple is true
      const newFiles = field.isMultiple
        ? [...existingFiles, ...uploadedFilesArray]
        : uploadedFilesArray[0];

      // Update uploadedFiles state
      setUploadedFiles((prev) => ({
        ...prev,
        [field.name]: newFiles,
      }));

      // Update form value and window.__EDITING_ENTITY_DATA__
      setValue(field.name, newFiles, { shouldValidate: true });
      if (window.__EDITING_ENTITY_DATA__) {
        window.__EDITING_ENTITY_DATA__ = {
          ...window.__EDITING_ENTITY_DATA__,
          [field.name]: newFiles,
        };
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload files");
    }
  };

  const onSubmitWithFiles = async (data: Record<string, unknown>) => {
    // Merge form data with uploaded files data
    const formData = {
      ...data,
      ...uploadedFiles,
    };

    // Call the original onSubmit with the merged data
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        dir={layout.direction}
        className="max-h-[100vh]  h-[calc(100vh-64px)]   flex flex-col gap-4 p-6"
      >
        <DialogHeader>
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {editingId
              ? layout.texts?.editModalTitle
              : layout.texts?.addModalTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmitWithFiles)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto pr-6 -mr-6 pb-6 space-y-4">
            {formStructure.map((field) => {
              // if (!field.visible) return null;

              const isDisabled = Boolean(
                !field.enabled || (editingId && field.readonly)
              );

              if (field.type === "file") {
                return (
                  <div key={field.name} className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      {field.title}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, field)}
                      multiple={field.isMultiple}
                      accept={field.fileConfig?.allowedTypes?.join(",")}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary/90"
                      disabled={!field.enabled || field.readonly}
                    />
                    {/* Show progress bars for this field */}
                    {uploadProgress[field.name] &&
                      Object.entries(uploadProgress[field.name]).map(
                        ([fileId, { progress, fileName }]) => (
                          <div key={fileId} className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span className="truncate">{fileName}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )
                      )}
                    {errors[field.name] && (
                      <span className="text-red-500 text-sm">
                        {field.validation?.requiredMessage ||
                          "This field is required"}
                      </span>
                    )}
                    {renderCurrentFiles(field.name, Boolean(field.isMultiple))}
                  </div>
                );
              }

              return (
                <FormField
                  key={field.name}
                  field={field}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  control={control}
                  layout={layout}
                  isDisabled={isDisabled}
                />
              );
            })}
          </div>

          <DialogFooter
            className={
              layout.direction === "rtl"
                ? "sm:justify-start mt-4"
                : "sm:justify-end mt-4"
            }
          >
            <div
              className={`flex gap-2 ${
                layout.direction === "rtl" ? "flex-row-reverse" : ""
              }`}
            >
              <Button type="button" variant="outline" onClick={onClose}>
                {layout.texts?.cancelButton}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading
                  ? layout.texts?.processingMessage
                  : editingId
                  ? layout.texts?.editButton
                  : layout.texts?.addButton}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
