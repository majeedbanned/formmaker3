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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { AdvancedSearchModalProps } from "../types/crud";

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
  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialValues,
  });

  // Reset form with initial values when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, reset, initialValues]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={layout.direction}>
        <DialogHeader>
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {layout.texts?.advancedSearchModalTitle}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formStructure
            .filter((field) => field.visible && field.isSearchable)
            .map((field) => (
              <div key={field.name} className="space-y-2">
                <label
                  htmlFor={field.name}
                  className={`block text-sm font-medium text-${
                    layout.direction === "rtl" ? "right" : "left"
                  }`}
                >
                  {field.title}
                </label>

                {field.type === "dropdown" ? (
                  <Select {...register(field.name)} dir={layout.direction}>
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
                ) : field.type === "checkbox" ? (
                  <div
                    className={`flex items-center ${
                      layout.direction === "rtl"
                        ? "flex-row-reverse justify-end"
                        : ""
                    }`}
                  >
                    <Checkbox {...register(field.name)} id={field.name} />
                  </div>
                ) : (
                  <Input
                    type={field.type}
                    {...register(field.name)}
                    className={`${
                      layout.direction === "rtl" ? "text-right" : "text-left"
                    }`}
                    dir={layout.direction}
                  />
                )}
              </div>
            ))}

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
