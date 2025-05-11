"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlignJustify,
  Calendar,
  Check,
  CheckSquare,
  FileText,
  FormInput,
  Hash,
  Mail,
  MoreHorizontal,
  SquareStack,
  SwitchCamera,
  Upload,
  MessageSquare,
  RadioIcon,
  ListFilter,
  FileUp,
  Pen,
} from "lucide-react";

interface FieldTypeSelectorProps {
  onSelectType: (type: string) => void;
}

const fieldTypes = [
  { type: "text", icon: FormInput, label: "متن کوتاه" },
  { type: "email", icon: Mail, label: "ایمیل" },
  { type: "number", icon: Hash, label: "عدد" },
  { type: "date", icon: Calendar, label: "تاریخ" },
  { type: "file", icon: Upload, label: "آپلود فایل" },
  { type: "select", icon: MoreHorizontal, label: "منوی کشویی" },
  { type: "checkbox", icon: CheckSquare, label: "چک باکس" },
  { type: "radio", icon: Check, label: "گزینه‌های رادیویی" },
  { type: "switch", icon: SwitchCamera, label: "کلید" },
  { type: "textarea", icon: AlignJustify, label: "متن بلند" },
  { type: "signature", icon: Pen, label: "امضاء دیجیتال" },
  { type: "group", icon: SquareStack, label: "گروه فیلد" },
  { type: "conditional", icon: FileText, label: "فیلد شرطی" },
];

export function FieldTypeSelector({ onSelectType }: FieldTypeSelectorProps) {
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle>افزودن فیلد فرم</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {fieldTypes.map((fieldType) => (
            <Button
              key={fieldType.type}
              variant="outline"
              className="h-auto flex flex-col items-center justify-center py-4 px-2 gap-2 hover:bg-gray-50"
              onClick={() => onSelectType(fieldType.type)}
            >
              <fieldType.icon className="h-6 w-6 text-gray-600" />
              <span className="text-sm font-normal">{fieldType.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
