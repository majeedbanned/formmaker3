"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Settings,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface Department {
  _id: string;
  data: {
    name: string;
    description: string;
    assignedTeachers: string[];
    createdAt: string;
    isActive: boolean;
  };
}

interface Teacher {
  id: string;
  name: string;
  teacherCode: string;
}

export default function DepartmentsManagement() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    assignedTeachers: [] as string[]
  });

  useEffect(() => {
    if (isAuthenticated && user?.userType === "school") {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const deptResponse = await fetch("/api/ticketing/departments");
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments || []);
      }

      // Fetch teachers
      const teacherResponse = await fetch("/api/ticketing/teachers");
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

  const openDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.data.name,
        description: department.data.description,
        assignedTeachers: department.data.assignedTeachers
      });
    } else {
      setEditingDepartment(null);
      setFormData({
        name: "",
        description: "",
        assignedTeachers: []
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingDepartment(null);
    setFormData({
      name: "",
      description: "",
      assignedTeachers: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("نام بخش الزامی است");
      return;
    }

    setSubmitting(true);
    
    try {
      const url = editingDepartment 
        ? `/api/ticketing/departments/${editingDepartment._id}`
        : "/api/ticketing/departments";
      
      const method = editingDepartment ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingDepartment ? "بخش با موفقیت بروزرسانی شد" : "بخش با موفقیت ایجاد شد");
        closeDialog();
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در انجام عملیات");
      }
    } catch (error) {
      console.error("Error submitting department:", error);
      toast.error("خطا در انجام عملیات");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/ticketing/departments/${deletingDepartment._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("بخش با موفقیت حذف شد");
        setIsDeleteDialogOpen(false);
        setDeletingDepartment(null);
        fetchData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در حذف بخش");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error("خطا در حذف بخش");
    } finally {
      setSubmitting(false);
    }
  };

  const getAssignedTeacherNames = (teacherIds: string[]) => {
    return teacherIds
      .map(id => teachers.find(t => t.id === id)?.name)
      .filter(Boolean)
      .join("، ");
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
        title="مدیریت بخش‌ها"
        subtitle="ایجاد و مدیریت بخش‌های تیکتینگ"
        icon={<Settings className="w-6 h-6" />}
        gradient={true}
      />

      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => openDialog()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          بخش جدید
        </Button>
      </div>

      {departments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              هیچ بخشی تعریف نشده است
            </h3>
            <p className="text-gray-500 mb-4">
              برای شروع، اولین بخش خود را ایجاد کنید
            </p>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 ml-2" />
              ایجاد بخش جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <Card key={department._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{department.data.name}</CardTitle>
                    {department.data.description && (
                      <CardDescription className="mt-2">
                        {department.data.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(department)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingDepartment(department);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {department.data.assignedTeachers.length} معلم تخصیص یافته
                    </span>
                  </div>
                  
                  {department.data.assignedTeachers.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">معلمان:</p>
                      <p className="text-sm text-gray-600">
                        {getAssignedTeacherNames(department.data.assignedTeachers)}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant={department.data.isActive ? "default" : "secondary"}>
                      {department.data.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(department.data.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "ویرایش بخش" : "ایجاد بخش جدید"}
            </DialogTitle>
            <DialogDescription>
              اطلاعات بخش را وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">نام بخش *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="نام بخش را وارد کنید"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">توضیحات</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات اختیاری در مورد بخش"
                rows={3}
              />
            </div>

            <div>
              <Label>معلمان تخصیص یافته</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`teacher-${teacher.id}`}
                      checked={formData.assignedTeachers.includes(teacher.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            assignedTeachers: [...formData.assignedTeachers, teacher.id]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            assignedTeachers: formData.assignedTeachers.filter(id => id !== teacher.id)
                          });
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`teacher-${teacher.id}`} className="text-sm cursor-pointer">
                      {teacher.name} ({teacher.teacherCode})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                انصراف
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "در حال انجام..." : editingDepartment ? "بروزرسانی" : "ایجاد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              تایید حذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف بخش "{deletingDepartment?.data.name}" اطمینان دارید؟
              این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? "در حال حذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
