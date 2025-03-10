import { useEffect, useState } from "react";
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
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type {
  FormModalProps,
  FormField,
  ValidationRules,
  LayoutSettings,
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
  const { fields, append, remove } = useFieldArray({
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
      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
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
                onClick={() => append({})}
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
                    className="relative border rounded-md p-4 mb-4"
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

  useEffect(() => {
    const fetchOptions = async () => {
      if (field.type === "dropdown" && field.dataSource) {
        setIsLoadingOptions(true);
        try {
          const params = new URLSearchParams({
            connectionString: process.env.NEXT_PUBLIC_MONGODB_URI || "",
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
            }?${params.toString()}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch options");
          }

          const options = await response.json();
          setDynamicOptions(options);
        } catch (error) {
          console.error("Error fetching dropdown options:", error);
          setDynamicOptions([]);
        } finally {
          setIsLoadingOptions(false);
        }
      }
    };

    fetchOptions();

    // Set up refresh interval if specified
    if (field.type === "dropdown" && field.dataSource?.refreshInterval) {
      const interval = setInterval(
        fetchOptions,
        field.dataSource.refreshInterval * 1000
      );
      return () => clearInterval(interval);
    }
  }, [field]);

  // Handle dependent dropdowns
  useEffect(() => {
    if (field.type === "dropdown" && field.dataSource?.dependsOn) {
      const dependentValue = watch(field.dataSource.dependsOn);
      if (dependentValue) {
        const fetchDependentOptions = async () => {
          setIsLoadingOptions(true);
          try {
            const params = new URLSearchParams({
              connectionString: process.env.NEXT_PUBLIC_MONGODB_URI || "",
              labelField: field.dataSource!.labelField,
              valueField: field.dataSource!.valueField,
              filterQuery: JSON.stringify({
                ...(field.dataSource!.filterQuery || {}),
                [field.dataSource!.dependsOn!]: dependentValue,
              }),
            });

            const response = await fetch(
              `/api/dropdown-options/${
                field.dataSource!.collectionName
              }?${params.toString()}`
            );

            if (!response.ok) {
              throw new Error("Failed to fetch dependent options");
            }

            const options = await response.json();
            setDynamicOptions(options);

            // Clear the field value if it's not in the new options
            const isValueValid = options.some(
              (opt: { value: unknown }) => opt.value === fieldValue
            );
            if (!isValueValid) {
              setValue(field.name, "", { shouldValidate: true });
            }
          } catch (error) {
            console.error("Error fetching dependent options:", error);
            setDynamicOptions([]);
          } finally {
            setIsLoadingOptions(false);
          }
        };

        fetchDependentOptions();
      } else {
        setDynamicOptions([]);
        setValue(field.name, "", { shouldValidate: true });
      }
    }
  }, [field, watch(field.dataSource?.dependsOn || "")]);

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
      ) : field.type === "textarea" ? (
        <Textarea
          {...register(field.name, validationRules)}
          disabled={isDisabled}
          className={`${
            layout.direction === "rtl" ? "text-right" : "text-left"
          }`}
          dir={layout.direction}
          rows={4}
        />
      ) : field.type === "checkbox" ? (
        <div
          className={`flex items-center ${
            layout.direction === "rtl" ? "flex-row-reverse justify-end" : ""
          }`}
        >
          <Checkbox
            {...register(field.name, validationRules)}
            disabled={isDisabled}
            id={field.name}
          />
        </div>
      ) : (
        <Input
          type={field.type}
          {...register(field.name, validationRules)}
          disabled={isDisabled}
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
}: FormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm();

  // Reset form when modal opens/closes or when editingId changes
  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (!editingId) {
      // When adding new entry, set default values
      const defaultValues = formStructure.reduce((acc, field) => {
        if (field.fields) {
          if (field.nestedType === "array") {
            acc[field.name] = field.defaultValue || [];
          } else {
            acc[field.name] = field.defaultValue || {};
          }
          acc[`${field.name}_expanded`] = field.isOpen ?? false;
        } else {
          acc[field.name] = field.defaultValue;
        }
        return acc;
      }, {} as Record<string, unknown>);
      reset(defaultValues);
    }
  }, [isOpen, reset, editingId, formStructure]);

  // Set initial values when editing
  useEffect(() => {
    if (editingId && isOpen && window.__EDITING_ENTITY_DATA__) {
      const formData = { ...window.__EDITING_ENTITY_DATA__ };
      // Set expansion state for nested fields
      formStructure.forEach((field) => {
        if (field.fields) {
          formData[`${field.name}_expanded`] = field.isOpen ?? false;
        }
      });
      reset(formData);
    }
  }, [editingId, isOpen, reset, formStructure]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={layout.direction}>
        <DialogHeader>
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {editingId
              ? layout.texts?.editModalTitle
              : layout.texts?.addModalTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formStructure.map((field) => {
            if (!field.visible) return null;

            const isDisabled = Boolean(
              !field.enabled || (editingId && field.readonly)
            );

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

          <DialogFooter
            className={
              layout.direction === "rtl" ? "sm:justify-start" : "sm:justify-end"
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
