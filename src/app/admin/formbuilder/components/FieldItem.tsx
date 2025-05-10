"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormField } from "./FormBuilderList";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Grip, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FieldItemProps {
  id: string;
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function FieldItem({
  id,
  field,
  onEdit,
  onDelete,
  onDuplicate,
}: FieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get a nice display for the field type
  const getFieldTypeDisplay = (type: string) => {
    switch (type) {
      case "text":
        return "متن";
      case "email":
        return "ایمیل";
      case "number":
        return "عدد";
      case "date":
        return "تاریخ";
      case "file":
        return "آپلود فایل";
      case "select":
        return "منوی کشویی";
      case "checkbox":
        return "چک باکس";
      case "radio":
        return "رادیو";
      case "switch":
        return "کلید";
      case "textarea":
        return "متن بلند";
      case "group":
        return "گروه";
      case "conditional":
        return "شرطی";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center border rounded-md p-3 bg-white",
        isDragging ? "opacity-50 border-dashed" : ""
      )}
      dir="rtl"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-move p-1 ml-2 text-gray-400 hover:text-gray-600"
      >
        <Grip className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <div className="font-medium">{field.label}</div>
        <div className="text-sm text-gray-500 flex gap-2 items-center">
          <Badge variant="outline" className="capitalize">
            {getFieldTypeDisplay(field.type)}
          </Badge>
          {field.required && (
            <Badge variant="secondary" className="text-xs">
              ضروری
            </Badge>
          )}
          {field.condition && (
            <Badge variant="secondary" className="text-xs">
              شرطی
            </Badge>
          )}
          <span className="text-xs text-gray-400">{field.name}</span>
        </div>
      </div>

      <div className="flex items-center space-x-reverse space-x-0 rtl:space-x-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
