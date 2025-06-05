"use client";

import React, { useState } from "react";
import { SurveyQuestion } from "../../types/survey";
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
} from "lucide-react";

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
    updateQuestion(questionIndex, {
      options: [...options, ""],
    });
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const question = questions[questionIndex];
    const options = [...(question.options || [])];
    options[optionIndex] = value;
    updateQuestion(questionIndex, { options });
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const options = (question.options || []).filter(
      (_, i) => i !== optionIndex
    );
    updateQuestion(questionIndex, { options });
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
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2 space-x-reverse"
                      >
                        <Input
                          value={option}
                          onChange={(e) =>
                            updateOption(index, optionIndex, e.target.value)
                          }
                          placeholder={`گزینه ${optionIndex + 1}`}
                          dir="rtl"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteOption(index, optionIndex)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
