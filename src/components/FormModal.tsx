import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { FormModalProps, FormField, ValidationRules } from "../types/crud";

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
    formState: { errors },
  } = useForm();

  // Reset form when modal opens/closes or when editingId changes
  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (!editingId) {
      // When adding new entry, set default values
      const defaultValues = formStructure.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.defaultValue,
        }),
        {}
      );
      reset(defaultValues);
    }
  }, [isOpen, reset, editingId, formStructure]);

  // Set initial values when editing
  useEffect(() => {
    if (editingId && isOpen && window.__EDITING_ENTITY_DATA__) {
      reset(window.__EDITING_ENTITY_DATA__);
    }
  }, [editingId, isOpen, reset]);

  const getValidationRules = (field: FormField): ValidationRules => {
    const rules: ValidationRules = {};

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

    return rules;
  };

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
            const validationRules = getValidationRules(field);
            const fieldValue = watch(field.name);

            return (
              <div key={field.name} className="space-y-2">
                <label
                  htmlFor={field.name}
                  className={`block text-sm font-medium text-${
                    layout.direction === "rtl" ? "right" : "left"
                  }`}
                >
                  {field.title}
                  {field.required && (
                    <span className="text-destructive">*</span>
                  )}
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
                      disabled={isDisabled}
                      dir={layout.direction}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={layout.texts?.selectPlaceholder}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem
                            key={String(option.value)}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      {...register(field.name, validationRules)}
                    />
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
                      layout.direction === "rtl"
                        ? "flex-row-reverse justify-end"
                        : ""
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
