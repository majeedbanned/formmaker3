"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, GraduationCap, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface TargetingStepProps {
  classTargets: string[];
  teacherTargets: string[];
  onUpdate: (classTargets: string[], teacherTargets: string[]) => void;
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
  classTargets,
  teacherTargets,
  onUpdate,
}: TargetingStepProps) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Use the passed props directly as state
  const [classSelections, setClassSelections] =
    useState<string[]>(classTargets);
  const [teacherSelections, setTeacherSelections] =
    useState<string[]>(teacherTargets);

  // Update local state when props change
  useEffect(() => {
    setClassSelections(classTargets);
    setTeacherSelections(teacherTargets);
  }, [classTargets, teacherTargets]);

  useEffect(() => {
    fetchData();
  }, [user?.schoolCode]);

  const fetchData = async () => {
    console.log(user);
    if (!user?.schoolCode) return;

    setLoading(true);
    try {
      // Fetch classes - API already handles teacher filtering
      const classesResponse = await fetch(
        `/api/surveys/targets?schoolCode=${user.schoolCode}&type=classes`,
        {
          headers: { "x-domain": window.location.host },
        }
      );

      if (classesResponse && classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      // Only fetch teachers if user is school admin
      if (user.userType === "school") {
        const teachersResponse = await fetch(
          `/api/surveys/targets?schoolCode=${user.schoolCode}&type=teachers`,
          {
            headers: { "x-domain": window.location.host },
          }
        );

        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          setTeachers(teachersData.teachers || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classCode: string, checked: boolean) => {
    const newSelections = checked
      ? [...classSelections, classCode]
      : classSelections.filter((id) => id !== classCode);

    setClassSelections(newSelections);
    onUpdate(newSelections, teacherSelections);
  };

  const handleTeacherToggle = (teacherCode: string, checked: boolean) => {
    const newSelections = checked
      ? [...teacherSelections, teacherCode]
      : teacherSelections.filter((id) => id !== teacherCode);

    setTeacherSelections(newSelections);
    onUpdate(classSelections, newSelections);
  };

  const handleSelectAllClasses = () => {
    const allClassCodes = filteredClasses.map((c) => c.data.classCode);
    setClassSelections(allClassCodes);
    onUpdate(allClassCodes, teacherSelections);
  };

  const handleDeselectAllClasses = () => {
    setClassSelections([]);
    onUpdate([], teacherSelections);
  };

  const handleSelectAllTeachers = () => {
    const allTeacherCodes = filteredTeachers.map((t) => t.data.teacherCode);
    setTeacherSelections(allTeacherCodes);
    onUpdate(classSelections, allTeacherCodes);
  };

  const handleDeselectAllTeachers = () => {
    setTeacherSelections([]);
    onUpdate(classSelections, []);
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
  const totalSelected = classSelections.length + teacherSelections.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">انتخاب مخاطبان نظرسنجی</h3>
        <p className="text-sm text-gray-500">
          می‌توانید نظرسنجی را برای کلاس‌ها، معلمان یا هر دو ارسال کنید
        </p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="جستجو در کلاس‌ها و معلمان..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
          dir="rtl"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">در حال بارگذاری...</p>
        </div>
      )}

      {/* Classes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span>کلاس‌ها ({classSelections.length} انتخاب شده)</span>
            </CardTitle>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllClasses}
              >
                انتخاب همه کلاس‌ها
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAllClasses}
              >
                حذف انتخاب کلاس‌ها
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredClasses.length === 0 ? (
              <p className="text-center text-gray-500 py-4">کلاسی یافت نشد</p>
            ) : (
              filteredClasses.map((classItem) => (
                <div
                  key={classItem.data.classCode}
                  className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Checkbox
                    checked={classSelections.includes(classItem.data.classCode)}
                    onCheckedChange={(checked) =>
                      handleClassToggle(
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Teachers Section - Only for school admins */}
      {!isTeacherUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Users className="h-5 w-5 text-green-600" />
                <span>معلمان ({teacherSelections.length} انتخاب شده)</span>
              </CardTitle>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllTeachers}
                >
                  انتخاب همه معلمان
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAllTeachers}
                >
                  حذف انتخاب معلمان
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredTeachers.length === 0 ? (
                <p className="text-center text-gray-500 py-4">معلمی یافت نشد</p>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.data.teacherCode}
                    className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={teacherSelections.includes(
                        teacher.data.teacherCode
                      )}
                      onCheckedChange={(checked) =>
                        handleTeacherToggle(
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
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {totalSelected > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">✅ انتخاب شده</h4>
          <div className="text-sm text-green-700 space-y-1">
            {classSelections.length > 0 && (
              <div>{classSelections.length} کلاس انتخاب شده</div>
            )}
            {teacherSelections.length > 0 && (
              <div>{teacherSelections.length} معلم انتخاب شده</div>
            )}
            <div className="font-medium">
              مجموع: {totalSelected} مخاطب انتخاب شده
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
