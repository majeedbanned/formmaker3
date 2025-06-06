"use client";

import { useState } from "react";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const testOptions: Option[] = [
  { label: "گزینه اول", value: "option1" },
  { label: "گزینه دوم", value: "option2" },
  { label: "گزینه سوم", value: "option3" },
  { label: "گزینه چهارم", value: "option4" },
  { label: "گزینه پنجم", value: "option5" },
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
  { label: "Date", value: "date" },
  { label: "Elderberry", value: "elderberry" },
];

export default function MultiSelectTestPage() {
  const [selectedValues, setSelectedValues] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">تست Multi-Select Component</h1>
        <p className="text-gray-600">
          این صفحه برای تست عملکرد کامپوننت Multi-Select طراحی شده است
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Multi-Select */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Select پایه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MultiSelect
              options={testOptions}
              selected={selectedValues}
              onChange={setSelectedValues}
              placeholder="گزینه‌های مورد نظر را انتخاب کنید"
              searchPlaceholder="جستجو در گزینه‌ها..."
              emptyMessage="گزینه‌ای یافت نشد"
            />

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">گزینه‌های انتخاب شده:</h4>
              <div className="text-sm">
                {selectedValues.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {selectedValues.map((value, index) => {
                      const option = testOptions.find(
                        (opt) => opt.value === value
                      );
                      return (
                        <li key={index}>
                          {option?.label} ({String(value)})
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-gray-500">هیچ گزینه‌ای انتخاب نشده</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State Multi-Select */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Select با حالت Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleLoadingTest}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "در حال بارگذاری..." : "تست حالت Loading"}
              </button>
            </div>

            <MultiSelect
              options={testOptions}
              selected={[]}
              onChange={() => {}}
              placeholder="در حالت Loading"
              loading={loading}
              loadingMessage="در حال بارگذاری گزینه‌ها..."
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Disabled Multi-Select */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Select غیرفعال</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiSelect
              options={testOptions}
              selected={["option1", "option2"]}
              onChange={() => {}}
              placeholder="این فیلد غیرفعال است"
              disabled={true}
            />
          </CardContent>
        </Card>

        {/* Empty Options Multi-Select */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Select بدون گزینه</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiSelect
              options={[]}
              selected={[]}
              onChange={() => {}}
              placeholder="گزینه‌ای موجود نیست"
              emptyMessage="هیچ گزینه‌ای تعریف نشده است"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
