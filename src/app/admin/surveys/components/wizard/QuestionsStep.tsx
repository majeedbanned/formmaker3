"use client";

import React, { useState } from "react";
import { SurveyQuestion, SurveyOption } from "../../types/survey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Trash2,
  GripVertical,
  Type,
  Circle,
  CheckSquare,
  Star,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface QuestionsStepProps {
  questions: SurveyQuestion[];
  onUpdate: (questions: SurveyQuestion[]) => void;
}

const QUESTION_TYPES = [
  { value: "text", label: "متن آزاد", icon: Type, description: "پاسخ متنی" },
  {
    value: "radio",
    label: "انتخاب یکی",
    icon: Circle,
    description: "یک گزینه از چند گزینه",
  },
  {
    value: "checkbox",
    label: "انتخاب چندگانه",
    icon: CheckSquare,
    description: "چند گزینه از چند گزینه",
  },
  {
    value: "rating",
    label: "امتیازدهی",
    icon: Star,
    description: "امتیاز از 1 تا 5",
  },
];

export default function QuestionsStep({
  questions,
  onUpdate,
}: QuestionsStepProps) {
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(),
      text: "",
      type: "text",
      required: true,
    };
    onUpdate([...questions, newQuestion]);
    setEditingQuestion(questions.length);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const updatedQuestions = questions.map((q, i) =>
      i === index ? { ...q, ...updates } : q
    );
    onUpdate(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onUpdate(updatedQuestions);
    setEditingQuestion(null);
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    const options = question.options || [];
    const newOption: SurveyOption = {
      caption: "",
      image: "",
      description: "",
    };
    updateQuestion(questionIndex, {
      options: [...options, newOption],
    });
  };

  const normalizeOption = (option: string | SurveyOption): SurveyOption => {
    if (typeof option === "string") {
      return { caption: option, image: "", description: "" };
    }
    return option;
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: keyof SurveyOption,
    value: string
  ) => {
    const question = questions[questionIndex];
    const options = [...(question.options || [])];
    const currentOption = normalizeOption(options[optionIndex]);
    options[optionIndex] = { ...currentOption, [field]: value };
    updateQuestion(questionIndex, { options });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const options = (question.options || []).filter(
      (_, i) => i !== optionIndex
    );
    updateQuestion(questionIndex, { options });
    // Clean up expanded state
    const key = `${questionIndex}-${optionIndex}`;
    const newExpanded = { ...expandedOptions };
    delete newExpanded[key];
    setExpandedOptions(newExpanded);
  };

  const toggleOptionExpanded = (questionIndex: number, optionIndex: number) => {
    const key = `${questionIndex}-${optionIndex}`;
    setExpandedOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageUpload = async (
    questionIndex: number,
    optionIndex: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فقط فایل‌های تصویری مجاز هستند");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم فایل باید کمتر از 5 مگابایت باشد");
      return;
    }

    const key = `${questionIndex}-${optionIndex}`;
    setUploadingImages((prev) => ({ ...prev, [key]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/survey-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        updateOption(questionIndex, optionIndex, "image", data.url);
        toast.success("تصویر با موفقیت آپلود شد");
      } else {
        toast.error(data.error || "خطا در آپلود تصویر");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("خطا در آپلود تصویر");
    } finally {
      setUploadingImages((prev) => ({ ...prev, [key]: false }));
      // Reset input
      event.target.value = "";
    }
  };

  const renderQuestionEditor = (question: SurveyQuestion, index: number) => {
    const questionType = QUESTION_TYPES.find((t) => t.value === question.type);
    const Icon = questionType?.icon || Type;

    return (
      <Card key={question.id || index} className="border-2 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
              <Icon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">سوال {index + 1}</span>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setEditingQuestion(editingQuestion === index ? null : index)
                }
              >
                {editingQuestion === index ? "بستن" : "ویرایش"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteQuestion(index)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {editingQuestion === index ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>متن سوال *</Label>
                <Textarea
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(index, { text: e.target.value })
                  }
                  placeholder="سوال خود را بنویسید..."
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>نوع سوال</Label>
                <Select
                  value={question.type}
                  onValueChange={(
                    value: "text" | "radio" | "checkbox" | "rating"
                  ) => updateQuestion(index, { type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <type.icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(question.type === "radio" || question.type === "checkbox") && (
                <div className="space-y-2">
                  <Label>گزینه‌ها</Label>
                  <div className="space-y-3">
                    {(question.options || []).map((option, optionIndex) => {
                      const normalizedOption = normalizeOption(option);
                      const expandKey = `${index}-${optionIndex}`;
                      const isExpanded = expandedOptions[expandKey];

                      return (
                        <div key={optionIndex} className="border rounded-lg p-3 space-y-2">
                          {/* Caption and Actions Row */}
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Input
                              value={normalizedOption.caption}
                              onChange={(e) =>
                                updateOption(index, optionIndex, "caption", e.target.value)
                              }
                              placeholder={`گزینه ${optionIndex + 1}`}
                              dir="rtl"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleOptionExpanded(index, optionIndex)}
                              title={isExpanded ? "بستن تنظیمات پیشرفته" : "تنظیمات پیشرفته"}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteOption(index, optionIndex)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Advanced Settings (Collapsible) */}
                          {isExpanded && (
                            <div className="space-y-3 pt-2 border-t">
                              {/* Image Upload */}
                              <div className="space-y-2">
                                <Label className="text-xs text-gray-600 flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  تصویر (اختیاری)
                                </Label>
                                
                                {/* Upload Button */}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id={`image-upload-${index}-${optionIndex}`}
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    onChange={(e) => handleImageUpload(index, optionIndex, e)}
                                    className="hidden"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      document.getElementById(`image-upload-${index}-${optionIndex}`)?.click();
                                    }}
                                    disabled={uploadingImages[`${index}-${optionIndex}`]}
                                    className="flex-shrink-0"
                                  >
                                    {uploadingImages[`${index}-${optionIndex}`] ? (
                                      <>
                                        <Loader2 className="h-3 w-3 ml-2 animate-spin" />
                                        در حال آپلود...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-3 w-3 ml-2" />
                                        آپلود تصویر
                                      </>
                                    )}
                                  </Button>
                                  
                                  {/* URL Input (alternative to upload) */}
                                  <Input
                                    value={normalizedOption.image || ""}
                                    onChange={(e) =>
                                      updateOption(index, optionIndex, "image", e.target.value)
                                    }
                                    placeholder="یا آدرس تصویر را وارد کنید"
                                    dir="ltr"
                                    className="text-sm flex-1"
                                  />
                                </div>

                                {/* Image Preview */}
                                {normalizedOption.image && (
                                  <div className="relative inline-block mt-2">
                                    <img
                                      src={normalizedOption.image}
                                      alt="پیش‌نمایش"
                                      className="h-20 w-20 object-cover rounded border"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => updateOption(index, optionIndex, "image", "")}
                                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                                    >
                                      ×
                                    </Button>
                                  </div>
                                )}
                                
                                <p className="text-xs text-gray-500">
                                  فرمت‌های مجاز: JPG, PNG, GIF, WEBP (حداکثر 5MB)
                                </p>
                              </div>

                              {/* Description */}
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-600">
                                  توضیحات (اختیاری)
                                </Label>
                                <Textarea
                                  value={normalizedOption.description || ""}
                                  onChange={(e) =>
                                    updateOption(index, optionIndex, "description", e.target.value)
                                  }
                                  placeholder="توضیحات این گزینه..."
                                  dir="rtl"
                                  className="text-sm min-h-[60px]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(index)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 ml-2" />
                      افزودن گزینه
                    </Button>
                  </div>
                </div>
              )}

              {question.type === "checkbox" && (
                <div className="space-y-2">
                  <Label>محدودیت تعداد انتخاب</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">حداقل انتخاب</Label>
                      <Input
                        type="number"
                        min="0"
                        max={question.maxSelections || question.options?.length || 99}
                        value={question.minSelections?.toString() || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : undefined;
                          updateQuestion(index, { minSelections: val });
                        }}
                        placeholder="بدون محدودیت"
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">حداکثر انتخاب</Label>
                      <Input
                        type="number"
                        min={question.minSelections || 1}
                        max={question.options?.length || 99}
                        value={question.maxSelections?.toString() || ""}
                        onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value) : undefined;
                          updateQuestion(index, { maxSelections: val });
                        }}
                        placeholder="بدون محدودیت"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {question.minSelections && question.maxSelections
                      ? `کاربر باید بین ${question.minSelections} تا ${question.maxSelections} گزینه انتخاب کند`
                      : question.minSelections
                      ? `کاربر باید حداقل ${question.minSelections} گزینه انتخاب کند`
                      : question.maxSelections
                      ? `کاربر می‌تواند حداکثر ${question.maxSelections} گزینه انتخاب کند`
                      : "بدون محدودیت تعداد انتخاب"}
                  </p>
                </div>
              )}

              {question.type === "rating" && (
                <div className="space-y-2">
                  <Label>حداکثر امتیاز</Label>
                  <Select
                    value={question.maxRating?.toString() || "5"}
                    onValueChange={(value) =>
                      updateQuestion(index, { maxRating: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  checked={question.required}
                  onCheckedChange={(checked) =>
                    updateQuestion(index, { required: checked })
                  }
                />
                <Label>سوال اجباری</Label>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-medium">{question.text || "سوال بدون متن"}</p>
              <p className="text-sm text-gray-500 mt-1">
                نوع: {questionType?.label} {question.required && "• اجباری"}
                {question.type === "checkbox" && (question.minSelections || question.maxSelections) && (
                  <>
                    {" • "}
                    {question.minSelections && question.maxSelections
                      ? `${question.minSelections}-${question.maxSelections} انتخاب`
                      : question.minSelections
                      ? `حداقل ${question.minSelections} انتخاب`
                      : `حداکثر ${question.maxSelections} انتخاب`}
                  </>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">سوالات نظرسنجی</h3>
          <p className="text-sm text-gray-500">حداقل یک سوال اضافه کنید</p>
        </div>
        <Button
          onClick={addQuestion}
          className="flex items-center space-x-2 space-x-reverse"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن سوال</span>
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            هنوز سوالی اضافه نکرده‌اید
          </h3>
          <p className="text-gray-500 mb-4">
            برای شروع، اولین سوال خود را اضافه کنید
          </p>
          <Button onClick={addQuestion}>
            <Plus className="h-4 w-4 ml-2" />
            افزودن اولین سوال
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) =>
            renderQuestionEditor(question, index)
          )}
        </div>
      )}

      {questions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">
            ✅ آماده برای مرحله بعد
          </h4>
          <p className="text-sm text-green-700">
            {questions.length} سوال اضافه کرده‌اید. می‌توانید به مرحله هدف‌گذاری
            بروید.
          </p>
        </div>
      )}
    </div>
  );
}
