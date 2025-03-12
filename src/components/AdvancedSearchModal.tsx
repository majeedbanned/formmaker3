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
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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
import { AdvancedSearchModalProps, FormField } from "../types/crud";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  formStructure,
  initialValues,
  layout = {
    direction: "ltr",
    texts: {
      advancedSearchModalTitle: "Advanced Search",
      clearButton: "Clear",
      applyFiltersButton: "Apply Filters",
      selectPlaceholder: "All",
    },
  },
}: AdvancedSearchModalProps) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: initialValues,
  });

  // Reset form with initial values when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, reset, initialValues]);

  const renderField = (field: FormField, parentPath = "") => {
    const fieldValue = watch(`${parentPath}${field.name}`);
    const isExpanded = watch(`${parentPath}${field.name}_expanded`);
    const fullPath = `${parentPath}${field.name}`;

    // Handle nested fields
    if (field.fields) {
      return (
        <div
          key={field.name}
          className="space-y-4 pl-4 border-l-2 border-gray-200"
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setValue(`${parentPath}${field.name}_expanded`, !isExpanded)
              }
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            <span className="font-medium">{field.title}</span>
          </div>

          {isExpanded && (
            <div className="space-y-4">
              {field.fields.map((nestedField) =>
                renderField(nestedField, `${fullPath}.`)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <label
          htmlFor={fullPath}
          className={`block text-sm font-medium text-${
            layout.direction === "rtl" ? "right" : "left"
          }`}
        >
          {field.title}
        </label>

        {field.type === "dropdown" ? (
          <Select {...register(fullPath)} dir={layout.direction}>
            <SelectTrigger>
              <SelectValue placeholder={layout.texts?.selectPlaceholder} />
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
        ) : field.type === "checkbox" ? (
          field.isMultiple ? (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div
                  key={String(option.value)}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`${fullPath}.${option.value}`}
                    checked={
                      Array.isArray(fieldValue) &&
                      fieldValue.includes(option.value)
                    }
                    onCheckedChange={(checked) => {
                      const currentValue = Array.isArray(fieldValue)
                        ? fieldValue
                        : [];
                      if (checked) {
                        setValue(fullPath, [...currentValue, option.value]);
                      } else {
                        setValue(
                          fullPath,
                          currentValue.filter((v) => v !== option.value)
                        );
                      }
                    }}
                  />
                  <label
                    htmlFor={`${fullPath}.${option.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={fullPath}
                checked={Boolean(fieldValue)}
                onCheckedChange={(checked) => setValue(fullPath, checked)}
              />
              <label
                htmlFor={fullPath}
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {field.title}
              </label>
            </div>
          )
        ) : field.type === "radio" ? (
          <RadioGroup
            value={String(fieldValue || "")}
            onValueChange={(value) => setValue(fullPath, value)}
            className={field.layout === "inline" ? "flex gap-4" : "space-y-2"}
          >
            {field.options?.map((option) => (
              <div
                key={String(option.value)}
                className={`flex items-center ${
                  layout.direction === "rtl" ? "space-x-reverse" : ""
                } space-x-2`}
              >
                <RadioGroupItem
                  value={String(option.value)}
                  id={`${fullPath}-${option.value}`}
                />
                <label
                  htmlFor={`${fullPath}-${option.value}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </RadioGroup>
        ) : field.type === "switch" ? (
          <div className="flex items-center justify-between">
            <Label htmlFor={fullPath}>{field.title}</Label>
            <Switch
              id={fullPath}
              checked={Boolean(fieldValue)}
              onCheckedChange={(checked) => setValue(fullPath, checked)}
            />
          </div>
        ) : field.type === "togglegroup" ? (
          <ToggleGroup
            type="multiple"
            value={Array.isArray(fieldValue) ? fieldValue : []}
            onValueChange={(value) => setValue(fullPath, value)}
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
        ) : field.type === "datepicker" ? (
          <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={fieldValue as Value}
            onChange={(date) => setValue(fullPath, date?.toString())}
            multiple={field.isMultiple}
            format={field.datepickerStyle?.format || "YYYY-MM-DD"}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              field.datepickerStyle?.className
            )}
          />
        ) : field.type === "autocomplete" ? (
          <ReactTags
            selected={
              fieldValue
                ? (Array.isArray(fieldValue) ? fieldValue : [fieldValue]).map(
                    (value) => ({
                      label: String(value),
                      value,
                    })
                  )
                : []
            }
            suggestions={
              field.options?.map((option) => ({
                label: option.label,
                value: option.value,
              })) || []
            }
            onAdd={(newTag) => {
              const newTags = fieldValue
                ? Array.isArray(fieldValue)
                  ? fieldValue
                  : [fieldValue]
                : [];
              setValue(
                fullPath,
                field.isMultiple ? [...newTags, newTag.value] : newTag.value
              );
            }}
            onDelete={(tagIndex) => {
              const currentTags = fieldValue
                ? Array.isArray(fieldValue)
                  ? fieldValue
                  : [fieldValue]
                : [];
              const newTags = currentTags.filter((_, i) => i !== tagIndex);
              setValue(fullPath, field.isMultiple ? newTags : newTags[0]);
            }}
            allowNew={field.autocompleteStyle?.allowNew}
            allowBackspace={field.autocompleteStyle?.allowBackspace}
            classNames={{
              root: cn(
                "react-tags border-input rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
                "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                field.autocompleteStyle?.className
              ),
              rootIsActive: "is-active",
              rootIsDisabled: "opacity-50 pointer-events-none",
              rootIsInvalid: "border-destructive",
              label: "hidden",
              tagList: "flex flex-wrap gap-1 p-1",
              tag: cn(
                "bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1",
                field.autocompleteStyle?.tagClassName
              ),
              tagName: "truncate",
              comboBox: "p-1",
              input: "outline-none bg-transparent text-sm min-w-[120px]",
              listBox: cn(
                "bg-popover text-popover-foreground absolute z-50 mt-1 max-h-[200px] min-w-[200px] overflow-auto rounded-md border p-1 shadow-md",
                field.autocompleteStyle?.suggestionsClassName
              ),
              option:
                "text-sm px-2 py-1.5 rounded hover:bg-accent hover:text-accent-foreground cursor-pointer",
              optionIsActive: "bg-accent text-accent-foreground",
              tagListItem: "inline-flex items-center gap-1",
              highlight: "bg-accent text-accent-foreground",
            }}
          />
        ) : field.type === "textarea" ? (
          <Textarea
            {...register(fullPath)}
            className={`${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
            dir={layout.direction}
            rows={4}
          />
        ) : (
          <Input
            type={field.type}
            {...register(fullPath)}
            className={`${
              layout.direction === "rtl" ? "text-right" : "text-left"
            }`}
            dir={layout.direction}
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-[100vh] h-[calc(100vh-64px)] flex flex-col gap-0 p-6"
        dir={layout.direction}
      >
        <DialogHeader className="flex-none">
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {layout.texts?.advancedSearchModalTitle}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {formStructure
              .filter(
                (field) =>
                  field.visible && field.isSearchable && field.type !== "file"
              )
              .map((field) => renderField(field))}
          </div>

          <DialogFooter
            className={`flex-none mt-4 ${
              layout.direction === "rtl" ? "sm:justify-start" : "sm:justify-end"
            }`}
          >
            <div
              className={`flex gap-2 ${
                layout.direction === "rtl" ? "flex-row-reverse" : ""
              }`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClear();
                  onClose();
                }}
              >
                {layout.texts?.clearButton}
              </Button>
              <Button type="submit">{layout.texts?.applyFiltersButton}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
