"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Users, GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface TargetingStepProps {
  targetType: "classes" | "teachers";
  targetIds: string[];
  onUpdate: (targetType: "classes" | "teachers", targetIds: string[]) => void;
}

interface ClassData {
  _id: string;
  data: {
    classCode: string;
    className: string;
    Grade: string;
    major: string;
  };
}

interface TeacherData {
  _id: string;
  data: {
    teacherCode: string;
    teacherName: string;
  };
}

export default function TargetingStep({
  targetType,
  targetIds,
  onUpdate,
}: TargetingStepProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [targetType, user?.schoolCode]);

  const fetchData = async () => {
    if (!user?.schoolCode) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/surveys/targets?schoolCode=${user.schoolCode}&type=${targetType}`,
        {
          headers: { "x-domain": window.location.host },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (targetType === "classes") {
          setClasses(data.classes || []);
        } else {
          setTeachers(data.teachers || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTargetTypeChange = (newType: "classes" | "teachers") => {
    onUpdate(newType, []);
  };

  const handleTargetToggle = (id: string, checked: boolean) => {
    if (checked) {
      onUpdate(targetType, [...targetIds, id]);
    } else {
      onUpdate(
        targetType,
        targetIds.filter((targetId) => targetId !== id)
      );
    }
  };

  const handleSelectAll = () => {
    if (targetType === "classes") {
      const allClassCodes = filteredClasses.map((c) => c.data.classCode);
      onUpdate(targetType, allClassCodes);
    } else {
      const allTeacherCodes = filteredTeachers.map((t) => t.data.teacherCode);
      onUpdate(targetType, allTeacherCodes);
    }
  };

  const handleDeselectAll = () => {
    onUpdate(targetType, []);
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.data.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.data.classCode.includes(searchTerm)
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.data.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.data.teacherCode.includes(searchTerm)
  );

  const isTeacherUser = user?.userType === "teacher";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">انتخاب مخاطبان نظرسنجی</h3>
        <p className="text-sm text-gray-500">
          {isTeacherUser
            ? "به عنوان معلم، می‌توانید نظرسنجی را برای کلاس‌های خود ارسال کنید"
            : "نظرسنجی را برای کدام گروه ارسال می‌کنید؟"}
        </p>
      </div>

      {!isTeacherUser && (
        <Card>
          <CardHeader>
            <CardTitle>نوع مخاطب</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={targetType}
              onValueChange={handleTargetTypeChange}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 space-x-reverse p-4 border rounded-lg">
                <RadioGroupItem value="classes" id="classes" />
                <Label
                  htmlFor="classes"
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                >
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">کلاس‌ها</div>
                    <div className="text-sm text-gray-500">
                      ارسال به دانش‌آموزان کلاس‌های انتخابی
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 space-x-reverse p-4 border rounded-lg">
                <RadioGroupItem value="teachers" id="teachers" />
                <Label
                  htmlFor="teachers"
                  className="flex items-center space-x-2 space-x-reverse cursor-pointer"
                >
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">معلمان</div>
                    <div className="text-sm text-gray-500">
                      ارسال به معلمان انتخابی
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {targetType === "classes" ? "انتخاب کلاس‌ها" : "انتخاب معلمان"}
            </CardTitle>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                انتخاب همه
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                حذف انتخاب
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={
                targetType === "classes"
                  ? "جستجو در کلاس‌ها..."
                  : "جستجو در معلمان..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
              dir="rtl"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">در حال بارگذاری...</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {targetType === "classes" ? (
                filteredClasses.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    کلاسی یافت نشد
                  </p>
                ) : (
                  filteredClasses.map((classItem) => (
                    <div
                      key={classItem.data.classCode}
                      className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={targetIds.includes(classItem.data.classCode)}
                        onCheckedChange={(checked) =>
                          handleTargetToggle(
                            classItem.data.classCode,
                            checked as boolean
                          )
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {classItem.data.className}
                        </div>
                        <div className="text-sm text-gray-500">
                          کد: {classItem.data.classCode} • پایه:{" "}
                          {classItem.data.Grade}
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : filteredTeachers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">معلمی یافت نشد</p>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.data.teacherCode}
                    className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={targetIds.includes(teacher.data.teacherCode)}
                      onCheckedChange={(checked) =>
                        handleTargetToggle(
                          teacher.data.teacherCode,
                          checked as boolean
                        )
                      }
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {teacher.data.teacherName}
                      </div>
                      <div className="text-sm text-gray-500">
                        کد: {teacher.data.teacherCode}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {targetIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ انتخاب شده</h4>
          <p className="text-sm text-green-700">
            {targetIds.length} {targetType === "classes" ? "کلاس" : "معلم"}{" "}
            انتخاب شده است.
          </p>
        </div>
      )}
    </div>
  );
}
