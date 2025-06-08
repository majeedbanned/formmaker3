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
import { Loader2, Search, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubjectSelectionStepProps {
  selectedClass: any | null;
  selectedSubject: any | null;
  onSubjectSelect: (subjectData: any) => void;
  userCode: string;
  schoolCode: string;
}

export function SubjectSelectionStep({
  selectedClass,
  selectedSubject,
  onSubjectSelect,
  userCode,
  schoolCode,
}: SubjectSelectionStepProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects();
    }
  }, [selectedClass, userCode, schoolCode]);

  const fetchClassSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gradingsystem/class-subjects?classCode=${selectedClass.data.classCode}&teacherCode=${userCode}&schoolCode=${schoolCode}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch subjects");
      }

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setError("خطا در دریافت دروس");
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.courseCode.includes(searchTerm)
  );

  if (!selectedClass) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">ابتدا کلاس را انتخاب کنید</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="mr-2">در حال بارگذاری دروس...</span>
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
            <Button onClick={fetchClassSubjects} className="mt-4">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h3 className="text-lg font-semibold mb-2">انتخاب درس</h3>
        <p className="text-muted-foreground">
          درسی که می‌خواهید برای آن نمره ثبت کنید را انتخاب کنید
        </p>
        <div className="mt-2">
          <Badge variant="outline">کلاس: {selectedClass.data.className}</Badge>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="جستجو در دروس..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-right"
        />
      </div>

      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? "درسی با این مشخصات یافت نشد"
                  : "هیچ درسی یافت نشد"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSubjects.map((subject) => {
            const isSelected =
              selectedSubject?.courseCode === subject.courseCode;

            return (
              <Card
                key={subject.courseCode}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => onSubjectSelect(subject)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {subject.courseName}
                    </CardTitle>
                    <Badge variant="outline">کد: {subject.courseCode}</Badge>
                  </div>
                  <CardDescription>{subject.vahed} واحد درسی</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        پایه {subject.Grade}
                      </span>
                    </div>
                    {subject.weeklySchedule && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {subject.weeklySchedule.length} جلسه
                        </span>
                      </div>
                    )}
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

      {selectedSubject && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg text-primary">
              درس انتخاب شده: {selectedSubject.courseName}
            </CardTitle>
            <CardDescription>
              برای کلاس {selectedClass.data.className} - {selectedSubject.vahed}{" "}
              واحد
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
