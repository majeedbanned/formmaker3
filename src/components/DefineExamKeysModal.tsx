import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, TrashIcon, CheckCircleIcon, PencilIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

interface ExamKey {
  questionNumber: number;
  category: string;
  score: number;
  correctOption: number;
  responseTime: number;
}

interface DefineExamKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
}

export default function DefineExamKeysModal({
  isOpen,
  onClose,
  examId,
}: DefineExamKeysModalProps) {
  const { user } = useAuth();
  const [examKeys, setExamKeys] = useState<ExamKey[]>([]);
  const [newKey, setNewKey] = useState<ExamKey>({
    questionNumber: 1,
    category: "",
    score: 1,
    correctOption: 1,
    responseTime: 60,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [examCategories, setExamCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isLoadingExistingKeys, setIsLoadingExistingKeys] = useState(false);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<ExamKey | null>(null);

  // Fetch exam categories and existing keys
  useEffect(() => {
    if (isOpen && examId && user) {
      fetchExamCategories();
      fetchExistingKeys();
    } else if (!isOpen) {
      // Reset states when modal closes
      setEditingKey(null);
      setEditingValues(null);
    }
  }, [isOpen, examId, user]);

  const fetchExamCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await fetch(
        `/api/examcat?examId=${examId}&username=${user?.username || ""}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        
        // Parse the response - it's an array of category objects
        if (Array.isArray(data)) {
          const categories = data
            .filter(
              (item): item is { categoryName: string } =>
                typeof item === "object" &&
                item !== null &&
                "categoryName" in item &&
                typeof item.categoryName === "string"
            )
            .map((cat) => cat.categoryName);

          // Remove duplicates and sort alphabetically
          setExamCategories([...new Set(categories)].sort());
        } else {
          console.error("Invalid data format from examcat API");
          setExamCategories([]);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchExistingKeys = async () => {
    setIsLoadingExistingKeys(true);
    try {
      const response = await fetch(
        `/api/examquestions?examId=${examId}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Filter only answer-key-only questions and convert to ExamKey format
        if (Array.isArray(data)) {
          const existingKeys: ExamKey[] = data
            .filter((item: any) => item.isAnswerKeyOnly === true)
            .map((item: any) => ({
              questionNumber: item.question?.id || 0,
              category: item.category || "",
              score: item.score || 1,
              correctOption: item.question?.correctoption || 1,
              responseTime: item.responseTime || 60,
            }))
            .filter((key: ExamKey) => key.questionNumber > 0)
            .sort((a: ExamKey, b: ExamKey) => a.questionNumber - b.questionNumber);

          if (existingKeys.length > 0) {
            setExamKeys(existingKeys);
            // Set next question number
            const maxQuestionNumber = Math.max(...existingKeys.map(k => k.questionNumber));
            setNewKey(prev => ({
              ...prev,
              questionNumber: maxQuestionNumber + 1,
            }));
            toast.info(`${existingKeys.length} کلید پاسخ موجود بارگذاری شد`);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching existing keys:", error);
      toast.error("خطا در بارگذاری کلیدهای موجود");
    } finally {
      setIsLoadingExistingKeys(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("لطفا نام دسته‌بندی را وارد کنید");
      return;
    }

    if (!user?.username) {
      toast.error("خطا: اطلاعات کاربر موجود نیست");
      return;
    }

    if (examCategories.includes(newCategoryName.trim())) {
      toast.error("این دسته‌بندی قبلا اضافه شده است");
      return;
    }

    setIsAddingCategory(true);
    try {
      const response = await fetch("/api/examcat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId,
          username: user.username,
          categoryName: newCategoryName.trim(),
          schoolCode: user.schoolCode || "",
        }),
      });

      if (response.ok) {
        toast.success("دسته‌بندی با موفقیت اضافه شد");
        // Fetch updated categories instead of manually updating
        await fetchExamCategories();
        setNewKey({ ...newKey, category: newCategoryName.trim() });
        setNewCategoryName("");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در افزودن دسته‌بندی");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("خطا در افزودن دسته‌بندی");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const addKeyToList = () => {
    // Validation
    if (!newKey.category.trim()) {
      toast.error("لطفا دسته‌بندی را انتخاب کنید");
      return;
    }

    if (newKey.questionNumber < 1) {
      toast.error("شماره سوال باید بزرگتر از 0 باشد");
      return;
    }

    if (newKey.score <= 0) {
      toast.error("بارم باید بزرگتر از 0 باشد");
      return;
    }

    if (newKey.correctOption < 1 || newKey.correctOption > 4) {
      toast.error("گزینه صحیح باید بین 1 تا 4 باشد");
      return;
    }

    // Check if question number already exists
    if (examKeys.some((k) => k.questionNumber === newKey.questionNumber)) {
      toast.error(`سوال شماره ${newKey.questionNumber} قبلا اضافه شده است`);
      return;
    }

    // Add to list
    setExamKeys([...examKeys, { ...newKey }]);

    // Reset form with next question number
    setNewKey({
      ...newKey,
      questionNumber: newKey.questionNumber + 1,
    });

    toast.success(`سوال شماره ${newKey.questionNumber} به لیست اضافه شد`);
  };

  const removeKeyFromList = (questionNumber: number) => {
    setExamKeys(examKeys.filter((k) => k.questionNumber !== questionNumber));
    setEditingKey(null);
    setEditingValues(null);
    toast.info(`سوال شماره ${questionNumber} از لیست حذف شد`);
  };

  const startEditingKey = (key: ExamKey) => {
    setEditingKey(key.questionNumber);
    setEditingValues({ ...key });
  };

  const cancelEditingKey = () => {
    setEditingKey(null);
    setEditingValues(null);
  };

  const saveEditedKey = () => {
    if (!editingValues) return;

    // Validation
    if (!editingValues.category.trim()) {
      toast.error("لطفا دسته‌بندی را انتخاب کنید");
      return;
    }

    if (editingValues.score <= 0) {
      toast.error("بارم باید بزرگتر از 0 باشد");
      return;
    }

    if (editingValues.correctOption < 1 || editingValues.correctOption > 4) {
      toast.error("گزینه صحیح باید بین 1 تا 4 باشد");
      return;
    }

    // Update the key in the list
    setExamKeys(examKeys.map(k => 
      k.questionNumber === editingKey ? editingValues : k
    ));

    setEditingKey(null);
    setEditingValues(null);
    toast.success(`سوال شماره ${editingValues.questionNumber} ویرایش شد`);
  };

  const saveExamKeys = async () => {
    if (examKeys.length === 0) {
      toast.error("لطفا حداقل یک سوال به لیست اضافه کنید");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/examkeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          examId,
          keys: examKeys,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const message = result.deletedCount > 0 
          ? `${result.savedCount} کلید پاسخ ذخیره شد (${result.deletedCount} کلید قبلی به‌روزرسانی شد)`
          : `${result.savedCount} کلید پاسخ با موفقیت ذخیره شد`;
        
        toast.success(message);
        
        // Reset states
        setExamKeys([]);
        setNewKey({
          questionNumber: 1,
          category: "",
          score: 1,
          correctOption: 1,
          responseTime: 60,
        });
        setEditingKey(null);
        setEditingValues(null);
        
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ذخیره کلیدهای پاسخ");
      }
    } catch (error) {
      console.error("Error saving exam keys:", error);
      toast.error("خطا در ذخیره کلیدهای پاسخ");
    } finally {
      setIsSaving(false);
    }
  };

  const generateBulkKeys = () => {
    const count = parseInt(prompt("تعداد سوالات را وارد کنید:", "30") || "0");
    
    if (count <= 0 || isNaN(count)) {
      toast.error("تعداد سوالات نامعتبر است");
      return;
    }

    if (!newKey.category.trim()) {
      toast.error("لطفا ابتدا دسته‌بندی را انتخاب کنید");
      return;
    }

    const defaultScore = parseFloat(prompt("بارم پیش‌فرض برای همه سوالات:", "1") || "1");
    const defaultResponseTime = parseInt(prompt("زمان پاسخ پیش‌فرض (ثانیه):", "60") || "60");

    if (defaultScore <= 0 || isNaN(defaultScore)) {
      toast.error("بارم نامعتبر است");
      return;
    }

    const newKeys: ExamKey[] = [];
    for (let i = 1; i <= count; i++) {
      if (!examKeys.some((k) => k.questionNumber === i)) {
        newKeys.push({
          questionNumber: i,
          category: newKey.category,
          score: defaultScore,
          correctOption: 1, // Default to option 1
          responseTime: defaultResponseTime,
        });
      }
    }

    setExamKeys([...examKeys, ...newKeys].sort((a, b) => a.questionNumber - b.questionNumber));
    toast.success(`${newKeys.length} سوال به لیست اضافه شد`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-700">
            🔑 تعریف کلید پاسخنامه آزمون
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            برای آزمون‌هایی که سوالات روی کاغذ آماده شده‌اند، فقط کلید پاسخ را تعریف کنید
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Loading Existing Keys Indicator */}
          {isLoadingExistingKeys && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center">
              <Spinner className="w-5 h-5 ml-2" />
              <p>در حال بارگذاری کلیدهای موجود...</p>
            </div>
          )}

          {/* Add New Key Form */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-4">افزودن کلید پاسخ جدید</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Question Number */}
              <div>
                <Label htmlFor="questionNumber">شماره سوال</Label>
                <Input
                  id="questionNumber"
                  type="number"
                  min="1"
                  value={newKey.questionNumber}
                  onChange={(e) =>
                    setNewKey({ ...newKey, questionNumber: parseInt(e.target.value) || 1 })
                  }
                  className="text-right"
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">دسته‌بندی (Cat)</Label>
                <Select
                  value={newKey.category}
                  onValueChange={(value) => setNewKey({ ...newKey, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    {examCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Score */}
              <div>
                <Label htmlFor="score">بارم (Score)</Label>
                <Input
                  id="score"
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={newKey.score}
                  onChange={(e) =>
                    setNewKey({ ...newKey, score: parseFloat(e.target.value) || 1 })
                  }
                  className="text-right"
                />
              </div>

              {/* Correct Option */}
              <div>
                <Label htmlFor="correctOption">گزینه صحیح</Label>
                <Select
                  value={newKey.correctOption.toString()}
                  onValueChange={(value) =>
                    setNewKey({ ...newKey, correctOption: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب گزینه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">گزینه 1</SelectItem>
                    <SelectItem value="2">گزینه 2</SelectItem>
                    <SelectItem value="3">گزینه 3</SelectItem>
                    <SelectItem value="4">گزینه 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Response Time */}
              <div>
                <Label htmlFor="responseTime">زمان پاسخ (ثانیه)</Label>
                <Input
                  id="responseTime"
                  type="number"
                  min="10"
                  value={newKey.responseTime}
                  onChange={(e) =>
                    setNewKey({ ...newKey, responseTime: parseInt(e.target.value) || 60 })
                  }
                  className="text-right"
                />
              </div>

              {/* Add Button */}
              <div className="flex items-end">
                <Button
                  onClick={addKeyToList}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  type="button"
                >
                  <PlusIcon className="w-4 h-4 ml-2" />
                  افزودن به لیست
                </Button>
              </div>
            </div>

            {/* Add New Category Section */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <Label className="text-sm text-gray-700 mb-2 block">
                دسته‌بندی جدید نیاز دارید؟
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="نام دسته‌بندی جدید..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={isAddingCategory || !newCategoryName.trim()}
                  variant="outline"
                  type="button"
                >
                  {isAddingCategory ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <>
                      <PlusIcon className="w-4 h-4 ml-2" />
                      افزودن دسته‌بندی
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Bulk Generate Button */}
            <div className="mt-4">
              <Button
                onClick={generateBulkKeys}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                type="button"
              >
                ⚡ تولید دسته‌جمعی کلیدها
              </Button>
            </div>
          </div>

          {/* Keys List */}
          {examKeys.length > 0 && (
            <div className="bg-white border-2 border-green-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-green-800 flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  کلیدهای پاسخ تعریف شده ({examKeys.length} سوال)
                </h3>
                <Button
                  onClick={() => {
                    setExamKeys([]);
                    setEditingKey(null);
                    setEditingValues(null);
                    setNewKey(prev => ({ ...prev, questionNumber: 1 }));
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200"
                  type="button"
                >
                  پاک کردن همه
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شماره سوال</TableHead>
                      <TableHead className="text-right">دسته‌بندی</TableHead>
                      <TableHead className="text-right">بارم</TableHead>
                      <TableHead className="text-right">گزینه صحیح</TableHead>
                      <TableHead className="text-right">زمان پاسخ</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examKeys
                      .sort((a, b) => a.questionNumber - b.questionNumber)
                      .map((key) => (
                        <TableRow key={key.questionNumber}>
                          {editingKey === key.questionNumber && editingValues ? (
                            // Edit Mode
                            <>
                              <TableCell className="font-medium">
                                {key.questionNumber}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editingValues.category}
                                  onValueChange={(value) =>
                                    setEditingValues({ ...editingValues, category: value })
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {examCategories.map((cat) => (
                                      <SelectItem key={cat} value={cat}>
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0.25"
                                  step="0.25"
                                  value={editingValues.score}
                                  onChange={(e) =>
                                    setEditingValues({
                                      ...editingValues,
                                      score: parseFloat(e.target.value) || 1,
                                    })
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editingValues.correctOption.toString()}
                                  onValueChange={(value) =>
                                    setEditingValues({
                                      ...editingValues,
                                      correctOption: parseInt(value),
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">گزینه 1</SelectItem>
                                    <SelectItem value="2">گزینه 2</SelectItem>
                                    <SelectItem value="3">گزینه 3</SelectItem>
                                    <SelectItem value="4">گزینه 4</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="10"
                                  value={editingValues.responseTime}
                                  onChange={(e) =>
                                    setEditingValues({
                                      ...editingValues,
                                      responseTime: parseInt(e.target.value) || 60,
                                    })
                                  }
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={saveEditedKey}
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    type="button"
                                  >
                                    <CheckCircleIcon className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={cancelEditingKey}
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                    type="button"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            // View Mode
                            <>
                              <TableCell className="font-medium">
                                {key.questionNumber}
                              </TableCell>
                              <TableCell>{key.category}</TableCell>
                              <TableCell>{key.score}</TableCell>
                              <TableCell>
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  گزینه {key.correctOption}
                                </span>
                              </TableCell>
                              <TableCell>{key.responseTime}s</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    onClick={() => startEditingKey(key)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    type="button"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => removeKeyFromList(key.questionNumber)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    type="button"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isSaving}
            type="button"
          >
            انصراف
          </Button>
          <Button
            onClick={saveExamKeys}
            disabled={examKeys.length === 0 || isSaving}
            className="bg-green-600 hover:bg-green-700"
            type="button"
          >
            {isSaving ? (
              <>
                <Spinner className="w-4 h-4 ml-2" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-4 h-4 ml-2" />
                ذخیره {examKeys.length} کلید پاسخ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

