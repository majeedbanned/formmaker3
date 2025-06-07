"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Users, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClassSelectionStepProps {
  selectedClass: any | null;
  onClassSelect: (classData: any) => void;
  userCode: string;
  schoolCode: string;
}

export function ClassSelectionStep({
  selectedClass,
  onClassSelect,
  userCode,
  schoolCode,
}: ClassSelectionStepProps) {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTeacherClasses();
  }, [userCode, schoolCode]);

  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gradingsystem/teacher-classes?teacherCode=${userCode}&schoolCode=${schoolCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setError("خطا در دریافت کلاس‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.data.className
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      classItem.data.classCode.includes(searchTerm)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">در حال بارگذاری کلاس‌ها...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchTeacherClasses} className="mt-4">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">انتخاب کلاس</h3>
        <p className="text-muted-foreground">
          یکی از کلاس‌هایی که در آن تدریس می‌کنید را انتخاب کنید
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو در کلاس‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "کلاسی با این مشخصات یافت نشد"
                  : "هیچ کلاسی یافت نشد"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredClasses.map((classItem) => {
            const isSelected =
              selectedClass?.data.classCode === classItem.data.classCode;

            return (
              <Card
                key={classItem.data.classCode}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => onClassSelect(classItem)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {classItem.data.className}
                    </CardTitle>
                    <Badge variant="outline">
                      کد: {classItem.data.classCode}
                    </Badge>
                  </div>
                  <CardDescription>
                    پایه {classItem.data.Grade} - رشته {classItem.data.major}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {classItem.data.students?.length || 0} دانش‌آموز
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {classItem.data.teachers?.length || 0} درس
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge className="text-xs">انتخاب شده</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedClass && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary">
              کلاس انتخاب شده: {selectedClass.data.className}
            </CardTitle>
            <CardDescription>
              {selectedClass.data.students?.length || 0} دانش‌آموز در این کلاس
              ثبت‌نام کرده‌اند
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
