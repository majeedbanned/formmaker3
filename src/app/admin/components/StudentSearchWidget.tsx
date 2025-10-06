"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, Clock, Edit, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Student {
  _id: string;
  studentName: string;
  studentFamily: string;
  studentCode: string;
  fullName: string;
  avatar: string | null;
  classCode: string | null;
  className: string | null;
}

interface Course {
  courseCode: string;
  courseName: string;
  vahed: number;
  major: string;
  grade: string;
}

interface PresenceRecord {
  _id: string;
  classCode: string;
  courseCode: string;
  date: string;
  schoolCode: string;
  studentCode: string;
  teacherCode: string;
  timeSlot: string;
  assessments: any[];
  createdAt: string;
  descriptiveStatus: string;
  grades: any[];
  note: string;
  absenceAcceptable?: string;
  persianDate: string;
  persianMonth: string;
  presenceStatus: string;
  updatedAt: string;
}

const presenceStatusOptions = [
  { value: "present", label: "حاضر", color: "bg-green-100 text-green-800" },
  { value: "absent", label: "غایب", color: "bg-red-100 text-red-800" },
  { value: "late", label: "تأخیر", color: "bg-yellow-100 text-yellow-800" },
  { value: "excused", label: "موجه", color: "bg-blue-100 text-blue-800" }
];

const timeSlots = [
  { value: "1", label: "زنگ اول" },
  { value: "2", label: "زنگ دوم" },
  { value: "3", label: "زنگ سوم" },
  { value: "4", label: "زنگ چهارم" },
  { value: "5", label: "زنگ پنجم" },
  { value: "6", label: "زنگ ششم" },
  { value: "7", label: "زنگ هفتم" },
  { value: "8", label: "زنگ هشتم" },
  { value: "9", label: "زنگ نهم" },
  { value: "10", label: "زنگ دهم" },
  { value: "11", label: "زنگ یازدهم" },
  { value: "12", label: "زنگ دوازدهم" }
];

// Course codes will be loaded dynamically from the student's class

export default function StudentSearchWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isPresenceDialogOpen, setIsPresenceDialogOpen] = useState(false);
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studentCourses, setStudentCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PresenceRecord | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    classCode: "",
    courseCode: "",
    timeSlot: "",
    presenceStatus: "",
    note: "",
    absenceAcceptable: ""
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search students with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchStudents();
      }, 300);
    } else {
      setStudents([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchStudents = async () => {
    if (searchQuery.trim().length < 2) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: { "x-domain": window.location.host },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error("Failed to search students");
        toast.error("خطا در جستجوی دانش‌آموزان");
      }
    } catch (error) {
      console.error("Error searching students:", error);
      toast.error("خطا در جستجوی دانش‌آموزان");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setIsPresenceDialogOpen(true);
    setIsLoadingRecords(true);
    setIsLoadingCourses(true);
    
    // Reset form data
    setFormData({
      classCode: student.classCode || "",
      courseCode: "",
      timeSlot: "",
      presenceStatus: "",
      note: "",
      absenceAcceptable: ""
    });

    try {
      // Fetch presence records and courses in parallel
      const [presenceResponse, coursesResponse] = await Promise.all([
        fetch(`/api/students/presence?studentCode=${student.studentCode}`, {
          headers: { "x-domain": window.location.host },
        }),
        fetch(`/api/students/courses?studentCode=${student.studentCode}`, {
          headers: { "x-domain": window.location.host },
        })
      ]);

      if (presenceResponse.ok) {
        const data = await presenceResponse.json();
        setPresenceRecords(data.records || []);
      } else {
        console.error("Failed to fetch presence records");
        toast.error("خطا در دریافت سوابق حضور");
      }

      if (coursesResponse.ok) {
        const data = await coursesResponse.json();
        setStudentCourses(data.courses || []);
        
        // Auto-select the class code if available
        if (data.classCode) {
          setFormData(prev => ({ ...prev, classCode: data.classCode }));
        }
      } else {
        console.error("Failed to fetch student courses");
        toast.error("خطا در دریافت لیست دروس");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast.error("خطا در دریافت اطلاعات دانش‌آموز");
    } finally {
      setIsLoadingRecords(false);
      setIsLoadingCourses(false);
    }
  };

  const handleSavePresence = async () => {
    if (!selectedStudent || !formData.presenceStatus || !formData.courseCode || !formData.timeSlot) {
      toast.error("لطفاً تمام فیلدهای الزامی را پر کنید");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/students/presence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          studentCode: selectedStudent.studentCode,
          classCode: formData.classCode,
          courseCode: formData.courseCode,
          timeSlot: formData.timeSlot,
          presenceStatus: formData.presenceStatus,
          note: formData.note,
          absenceAcceptable: formData.absenceAcceptable
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // Refresh presence records
        const recordsResponse = await fetch(`/api/students/presence?studentCode=${selectedStudent.studentCode}`, {
          headers: { "x-domain": window.location.host },
        });
        
        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          setPresenceRecords(recordsData.records || []);
        }
        
        // Reset form and editing state
        setEditingRecord(null);
        setFormData({
          classCode: selectedStudent.classCode || "",
          courseCode: "",
          timeSlot: "",
          presenceStatus: "",
          note: "",
          absenceAcceptable: ""
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ثبت حضور");
      }
    } catch (error) {
      console.error("Error saving presence:", error);
      toast.error("خطا در ثبت حضور");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const option = presenceStatusOptions.find(opt => opt.value === status);
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : (
      <Badge variant="outline">{status}</Badge>
    );
  };

  const handleEditRecord = (record: PresenceRecord) => {
    setEditingRecord(record);
    setFormData({
      classCode: record.classCode,
      courseCode: record.courseCode,
      timeSlot: record.timeSlot,
      presenceStatus: record.presenceStatus,
      note: record.note || "",
      absenceAcceptable: record.absenceAcceptable || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setFormData({
      classCode: selectedStudent?.classCode || "",
      courseCode: "",
      timeSlot: "",
      presenceStatus: "",
      note: "",
      absenceAcceptable: ""
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Search className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">جستجوی دانش‌آموز</h3>
          <p className="text-sm text-gray-600">جستجو و مدیریت حضور دانش‌آموزان</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="نام، نام خانوادگی یا کد دانش‌آموز را وارد کنید..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10 text-right"
          dir="rtl"
        />
        {isLoading && (
          <div className="absolute left-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {students.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student._id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => handleStudentSelect(student)}
            >
              <div className="flex-shrink-0">
                {student.avatar ? (
                  <img
                    src={`${window.location.origin}${student.avatar}`}
                    alt={student.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName)}&background=3b82f6&color=ffffff&size=40`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{student.fullName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>کد: {student.studentCode}</span>
                  {student.className && (
                    <>
                      <span>•</span>
                      <span>{student.className}</span>
                    </>
                  )}
                </div>
              </div>
              <Edit className="h-4 w-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchQuery.length >= 2 && students.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>هیچ دانش‌آموزی یافت نشد</p>
        </div>
      )}

      {/* Presence Management Dialog */}
      <Dialog open={isPresenceDialogOpen} onOpenChange={setIsPresenceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                {selectedStudent?.avatar ? (
                  <img
                    src={`${window.location.origin}${selectedStudent.avatar}`}
                    alt={selectedStudent.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.fullName)}&background=3b82f6&color=ffffff&size=48`;
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">{selectedStudent?.fullName}</h2>
                  <div className="text-sm text-gray-600">
                    <p>کد: {selectedStudent?.studentCode}</p>
                    {selectedStudent?.className && (
                      <p>کلاس: {selectedStudent.className}</p>
                    )}
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Add New Presence Record */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-4">
                {editingRecord ? "ویرایش رکورد حضور" : "ثبت حضور جدید"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">کلاس</label>
                  <Input
                    value={formData.classCode}
                    readOnly
                    placeholder="کد کلاس"
                    className="text-right bg-gray-100"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">درس</label>
                  <Select value={formData.courseCode} onValueChange={(value) => setFormData({ ...formData, courseCode: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCourses ? "در حال بارگذاری..." : "انتخاب درس"} />
                    </SelectTrigger>
                    <SelectContent>
                      {studentCourses.map((course) => (
                        <SelectItem key={course.courseCode} value={course.courseCode}>
                          {course.courseName} ({course.courseCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isLoadingCourses && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                      در حال بارگذاری دروس...
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">زنگ</label>
                  <Select value={formData.timeSlot} onValueChange={(value) => setFormData({ ...formData, timeSlot: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب زنگ" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.value} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">وضعیت حضور</label>
                  <Select value={formData.presenceStatus} onValueChange={(value) => setFormData({ ...formData, presenceStatus: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      {presenceStatusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">قبول غیبت</label>
                  <Select value={formData.absenceAcceptable} onValueChange={(value) => setFormData({ ...formData, absenceAcceptable: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="قابل قبول">
                        <Badge className="bg-green-100 text-green-800">قابل قبول</Badge>
                      </SelectItem>
                      <SelectItem value="غیرقابل قبول">
                        <Badge className="bg-red-100 text-red-800">غیرقابل قبول</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-sm font-medium mb-2">یادداشت</label>
                  <Textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="یادداشت اختیاری..."
                    rows={2}
                    className="text-right"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                {editingRecord && (
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    لغو
                  </Button>
                )}
                <Button
                  onClick={handleSavePresence}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {editingRecord ? "به‌روزرسانی" : "ثبت حضور"}
                </Button>
              </div>
            </div>

            {/* Previous Presence Records */}
            <div>
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                سوابق حضور
              </h3>
              {isLoadingRecords ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
                  <p className="mt-2 text-gray-600">در حال بارگذاری...</p>
                </div>
              ) : presenceRecords.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {presenceRecords.map((record) => (
                    <div key={record._id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(record.presenceStatus)}
                          <span className="text-sm text-gray-600">
                            {record.persianDate} - زنگ {record.timeSlot}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{record.courseCode}</Badge>
                          <Button
                            onClick={() => handleEditRecord(record)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {record.note && (
                        <p className="text-sm text-gray-700 mt-2">{record.note}</p>
                      )}
                      {record.absenceAcceptable && (
                        <div className="mt-2">
                          <Badge className={record.absenceAcceptable === "قابل قبول" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            غیبت {record.absenceAcceptable}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>هیچ سابقه حضوری ثبت نشده است</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
