"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Building2,
  UserPlus,
  UserMinus,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface Department {
  _id: string;
  data: {
    name: string;
    description: string;
    assignedTeachers: string[];
  };
}

interface Teacher {
  id: string;
  name: string;
  teacherCode: string;
}

interface Assignment {
  [departmentId: string]: string[];
}

export default function DepartmentAssignmentsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment>({});
  const [originalAssignments, setOriginalAssignments] = useState<Assignment>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.userType === "school") {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments and teachers in parallel
      const [deptResponse, teacherResponse] = await Promise.all([
        fetch("/api/ticketing/departments"),
        fetch("/api/ticketing/teachers")
      ]);

      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        const depts = deptData.departments || [];
        setDepartments(depts);
        
        // Initialize assignments
        const initialAssignments: Assignment = {};
        depts.forEach((dept: Department) => {
          initialAssignments[dept._id] = dept.data.assignedTeachers || [];
        });
        setAssignments(initialAssignments);
        setOriginalAssignments(JSON.parse(JSON.stringify(initialAssignments)));
      }

      if (teacherResponse.ok) {
        const teacherData = await teacherResponse.json();
        setTeachers(teacherData.teachers || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const toggleTeacherAssignment = (departmentId: string, teacherId: string) => {
    setAssignments(prev => {
      const currentAssignments = prev[departmentId] || [];
      const isAssigned = currentAssignments.includes(teacherId);
      
      return {
        ...prev,
        [departmentId]: isAssigned
          ? currentAssignments.filter(id => id !== teacherId)
          : [...currentAssignments, teacherId]
      };
    });
  };

  const hasChanges = () => {
    return JSON.stringify(assignments) !== JSON.stringify(originalAssignments);
  };

  const saveChanges = async () => {
    setSaving(true);
    
    try {
      // Save each department's assignments
      const savePromises = departments.map(async (department) => {
        const currentAssignments = assignments[department._id] || [];
        const originalDeptAssignments = originalAssignments[department._id] || [];
        
        // Only update if there are changes for this department
        if (JSON.stringify(currentAssignments.sort()) !== JSON.stringify(originalDeptAssignments.sort())) {
          const response = await fetch(`/api/ticketing/departments/${department._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: department.data.name,
              description: department.data.description,
              assignedTeachers: currentAssignments
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to update ${department.data.name}`);
          }
        }
      });

      await Promise.all(savePromises);
      
      toast.success("تخصیص‌ها با موفقیت ذخیره شد");
      setOriginalAssignments(JSON.parse(JSON.stringify(assignments)));
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving assignments:", error);
      toast.error("خطا در ذخیره تخصیص‌ها");
    } finally {
      setSaving(false);
    }
  };

  const getTeacherDepartments = (teacherId: string) => {
    return departments.filter(dept => 
      (assignments[dept._id] || []).includes(teacherId)
    );
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.userType !== "school") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">دسترسی غیر مجاز</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <PageHeader
        title="تخصیص معلمان به بخش‌ها"
        subtitle="مدیریت دسترسی معلمان به بخش‌های مختلف تیکتینگ"
        icon={<Users className="w-6 h-6" />}
        gradient={true}
      />

      {hasChanges() && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-amber-800">
                شما تغییراتی اعمال کرده‌اید که ذخیره نشده است.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAssignments(JSON.parse(JSON.stringify(originalAssignments)));
                  }}
                >
                  انصراف
                </Button>
                <Button 
                  size="sm" 
                  onClick={saveChanges}
                  disabled={saving}
                >
                  {saving ? "در حال ذخیره..." : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments View */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                بخش‌ها و معلمان تخصیص یافته
              </CardTitle>
              <CardDescription>
                برای هر بخش، معلمانی که دسترسی به تیکت‌های آن بخش دارند را مشاهده کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((department) => (
                  <Card key={department._id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{department.data.name}</CardTitle>
                      {department.data.description && (
                        <CardDescription>{department.data.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {teachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`${department._id}-${teacher.id}`}
                              checked={(assignments[department._id] || []).includes(teacher.id)}
                              onCheckedChange={() => toggleTeacherAssignment(department._id, teacher.id)}
                            />
                            <label 
                              htmlFor={`${department._id}-${teacher.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {teacher.name} ({teacher.teacherCode})
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          {(assignments[department._id] || []).length} معلم تخصیص یافته
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers View */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                معلمان و بخش‌های تخصیص یافته
              </CardTitle>
              <CardDescription>
                برای هر معلم، بخش‌هایی که به آن‌ها دسترسی دارد را مشاهده کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => {
                  const teacherDepartments = getTeacherDepartments(teacher.id);
                  return (
                    <Card key={teacher.id} className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {teacher.name}
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({teacher.teacherCode})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {teacherDepartments.length === 0 ? (
                            <p className="text-sm text-gray-500">
                              هیچ بخشی تخصیص نیافته است
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {teacherDepartments.map((dept) => (
                                <Badge key={dept._id} variant="secondary">
                                  {dept.data.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            دسترسی به {teacherDepartments.length} بخش
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>خلاصه تخصیص‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{departments.length}</div>
              <div className="text-sm text-blue-600">بخش</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{teachers.length}</div>
              <div className="text-sm text-green-600">معلم</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(assignments).reduce((total, deptTeachers) => total + deptTeachers.length, 0)}
              </div>
              <div className="text-sm text-purple-600">کل تخصیص‌ها</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
