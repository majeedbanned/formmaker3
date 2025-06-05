"use client";

import React from "react";
import { Survey } from "../../types/survey";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoStepProps {
  data: Partial<Survey>;
  onUpdate: (updates: Partial<Survey>) => void;
}

export default function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          عنوان نظرسنجی *
        </Label>
        <Input
          id="title"
          value={data.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="عنوان نظرسنجی را وارد کنید"
          className="w-full"
          dir="rtl"
        />
        <p className="text-xs text-gray-500">
          عنوانی واضح و مفهوم برای نظرسنجی خود انتخاب کنید
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          توضیحات (اختیاری)
        </Label>
        <Textarea
          id="description"
          value={data.description || ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="توضیحات اضافی در مورد نظرسنجی..."
          className="w-full min-h-[100px]"
          dir="rtl"
        />
        <p className="text-xs text-gray-500">
          توضیحات اضافی که به شرکت‌کنندگان کمک می‌کند تا هدف نظرسنجی را بهتر درک
          کنند
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 نکته مفید</h4>
        <p className="text-sm text-blue-700">
          عنوان و توضیحات خوب باعث افزایش مشارکت در نظرسنجی می‌شود. سعی کنید
          واضح و جذاب باشند.
        </p>
      </div>
    </div>
  );
}
