"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { VideoIcon, ArrowRight, ArrowLeft, Check, Loader2, Users, Clock, Calendar, BookOpen, User, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Student {
  _id: string;
  data: {
    studentCode: string;
    studentName: string;
    studentFamily: string;
    classCode?: string[];
  };
}

interface Teacher {
  _id: string;
  data: {
    teacherCode: string;
    teacherName: string;
    teacherFamily?: string;
  };
}

interface Class {
  _id: string;
  data: {
    classCode: string;
    className: string;
  };
}

type WeekdayCode = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

interface ScheduleSlot {
  id: string;
  day: WeekdayCode;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export default function SkyroomAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [debugRequest, setDebugRequest] = useState<any | null>(null);
  const [debugResponse, setDebugResponse] = useState<any | null>(null);
  const [debugStatus, setDebugStatus] = useState<number | null>(null);
  const [skyroomClasses, setSkyroomClasses] = useState<any[]>([]);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(new Set());
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [classSearchQuery, setClassSearchQuery] = useState("");

  // Form data (keeps a representative concrete date/time for the first slot)
  const [formData, setFormData] = useState({
    skyroomApiKey: "",
    className: "",
    classDescription: "",
    classDate: "",
    classTime: "",
    duration: "60",
    maxUsers: "50",
    classType: "skyroom" as "skyroom" | "googlemeet" | "adobeconnect" | "bigbluebutton", // New field for class type
    googleMeetLink: "", // Google Meet link (manually entered or generated)
    adobeConnectMeetingName: "", // Adobe Connect meeting name (optional, defaults to className)
    bbbWelcomeMessage: "", // BigBlueButton welcome message (optional)
    selectedStudents: [] as string[],
    selectedTeachers: [] as string[],
    selectedClasses: [] as string[],
  });

  const totalSteps = 4;

  useEffect(() => {
    if (user && user.userType === "school") {
      fetchStudents();
      fetchTeachers();
      fetchClasses();
      fetchSkyroomClasses();

      // Initialize with one default weekly slot
      setScheduleSlots([
        {
          id: Math.random().toString(36).slice(2),
          day: "sat",
          startTime: "12:30",
          endTime: "13:40",
        },
      ]);
    }
  }, [user]);

  const fetchStudents = async () => {
    if (!user?.schoolCode) return;
    setLoadingData(true);
    try {
      const response = await fetch(
        `/api/crud/students?schoolCode=${user.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // CRUD API returns data in a specific format
        setStudents(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTeachers = async () => {
    if (!user?.schoolCode) return;
    try {
      const response = await fetch(
        `/api/admin/teachers/teachers?schoolCode=${user.schoolCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTeachers(data || []);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchClasses = async () => {
    if (!user?.schoolCode) return;
    try {
      const response = await fetch("/api/crud/classes", {
        headers: {
          "x-domain": window.location.host,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Filter classes for current school
        const allClasses: Class[] = data || [];
        const filtered = allClasses.filter(
          (cls) => cls.data?.classCode && cls.data?.className
        );
        setClasses(filtered);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSkyroomClasses = async () => {
    try {
      const response = await fetch("/api/admin/skyroom/classes", {
        headers: {
          "x-domain": window.location.host,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSkyroomClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Error fetching Skyroom classes:", error);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Validate current step
      if (currentStep === 1) {
        if (!formData.className) {
          toast.error("لطفاً نام کلاس را وارد کنید");
          return;
        }
        if (formData.classType === "googlemeet" && !formData.googleMeetLink) {
          toast.error("لطفاً لینک گوگل میت را وارد کنید");
          return;
        }
        if (formData.classType === "googlemeet" && !formData.googleMeetLink.includes("meet.google.com")) {
          toast.error("لطفاً یک لینک معتبر گوگل میت وارد کنید (باید شامل meet.google.com باشد)");
          return;
        }
        if (!scheduleSlots.length) {
          toast.error("لطفاً حداقل یک روز و ساعت برگزاری کلاس را مشخص کنید");
          return;
        }
        const first = scheduleSlots[0];
        if (!first.startTime || !first.endTime) {
          toast.error("برای اولین روز، ساعت شروع و پایان را وارد کنید");
          return;
        }

        // Derive a concrete date/time for the first slot (used for sorting and gating)
        const weekdayToJs: Record<WeekdayCode, number> = {
          sun: 0,
          mon: 1,
          tue: 2,
          wed: 3,
          thu: 4,
          fri: 5,
          sat: 6,
        };
        const now = new Date();
        const targetDay = weekdayToJs[first.day];
        const todayIdx = now.getDay();
        let diff = (targetDay - todayIdx + 7) % 7;
        const firstDate = new Date(now);
        const [sh, sm] = first.startTime.split(":").map(Number);
        firstDate.setHours(sh || 0, sm || 0, 0, 0);
        if (diff === 0 && firstDate <= now) {
          diff = 7;
        }
        firstDate.setDate(firstDate.getDate() + diff);
        const iso = firstDate.toISOString().slice(0, 10);
        const [eh, em] = first.endTime.split(":").map(Number);
        const durationMinutes = (eh - sh) * 60 + (em - sm);

        setFormData((prev) => ({
          ...prev,
          classDate: iso,
          classTime: first.startTime,
          duration: String(durationMinutes > 0 ? durationMinutes : 60),
        }));
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (
      formData.selectedStudents.length === 0 &&
      formData.selectedTeachers.length === 0 &&
      formData.selectedClasses.length === 0
    ) {
      toast.error("لطفاً حداقل یک دانش‌آموز، معلم یا کلاس را انتخاب کنید");
      return;
    }

    const isEdit = !!editingClassId;

    // Build payload (include weekly schedule and participants)
    // In edit mode, we also allow updating selected students/teachers/classes.
    const payload = isEdit
      ? {
          classId: editingClassId,
          className: formData.className,
          classDescription: formData.classDescription,
          classDate: formData.classDate,
          classTime: formData.classTime,
          duration: Number(formData.duration) || 60,
          maxUsers: Number(formData.maxUsers) || 50,
          classType: formData.classType,
          googleMeetLink: formData.googleMeetLink,
          selectedStudents: formData.selectedStudents,
          selectedTeachers: formData.selectedTeachers,
          selectedClasses: formData.selectedClasses,
          scheduleSlots,
        }
      : {
          ...formData,
          scheduleSlots,
        };

    setDebugRequest(payload);
    setLoading(true);
    try {
      const response = await fetch("/api/admin/skyroom/classes", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setDebugStatus(response.status);
      setDebugResponse(data);

      if (response.ok && data.success) {
        toast.success(
          isEdit
            ? "کلاس آنلاین با موفقیت ویرایش شد"
            : "کلاس آنلاین با موفقیت ایجاد شد"
        );
        // Refresh list of Skyroom classes
        fetchSkyroomClasses();

        // Reset form after create; for edit we keep API key but clear current editing state
        setFormData({
          skyroomApiKey: formData.skyroomApiKey, // Keep API key
          className: "",
          classDescription: "",
          classDate: "",
          classTime: "",
          duration: "60",
          maxUsers: "50",
          classType: "skyroom",
          googleMeetLink: "",
          adobeConnectMeetingName: "",
          bbbWelcomeMessage: "",
          selectedStudents: [],
          selectedTeachers: [],
          selectedClasses: [],
        });
        setScheduleSlots([]);
        setEditingClassId(null);
        setCurrentStep(1);
        setTeacherSearchQuery("");
        setClassSearchQuery("");
      } else {
        toast.error(data.error || "خطا در ذخیره کلاس");
      }
    } catch (error: any) {
      console.error("Error creating class:", error);
      setDebugStatus(null);
      setDebugResponse({ error: error.message || "unknown error" });
      toast.error("خطا در ایجاد کلاس: " + (error.message || "خطای ناشناخته"));
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter((id) => id !== studentId)
        : [...prev.selectedStudents, studentId],
    }));
  };

  const toggleTeacher = (teacherId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTeachers: prev.selectedTeachers.includes(teacherId)
        ? prev.selectedTeachers.filter((id) => id !== teacherId)
        : [...prev.selectedTeachers, teacherId],
    }));
  };

  const toggleClass = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter((id) => id !== classId)
        : [...prev.selectedClasses, classId],
    }));
  };

  if (authLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.userType !== "school") {
    return (
      <div dir="rtl" className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              فقط مدیران مدرسه می‌توانند به این صفحه دسترسی داشته باشند.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div dir="rtl" className="container mx-auto px-4 py-8">
      <PageHeader
        title="مدیریت کلاس‌های آنلاین"
        subtitle="ایجاد و مدیریت کلاس‌های آنلاین (اسکای‌روم، گوگل میت، ادوبی کانکت و بیگ بلو باتن)"
        icon={<VideoIcon className="w-6 h-6" />}
        gradient={true}
      />

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {editingClassId ? "ویرایش کلاس آنلاین" : "ایجاد کلاس جدید"}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>مرحله {currentStep} از {totalSteps}</span>
            </div>
          </div>
          <CardDescription>
            از طریق این فرم می‌توانید کلاس‌های آنلاین (اسکای‌روم یا گوگل میت) را ایجاد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      step <= currentStep
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-gray-100 text-gray-400 border-gray-300"
                    }`}
                  >
                    {step < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < totalSteps && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step < currentStep ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>اطلاعات کلاس</span>
              <span>انتخاب شرکت‌کنندگان</span>
              <span>تنظیمات</span>
              <span>تایید و ایجاد</span>
            </div>
          </div>

          {/* Step 1: Class Details & Weekly Schedule */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="classType">نوع کلاس آنلاین *</Label>
                <Select
                  value={formData.classType}
                  onValueChange={(value: "skyroom" | "googlemeet" | "adobeconnect" | "bigbluebutton") =>
                    setFormData({ ...formData, classType: value, googleMeetLink: "", adobeConnectMeetingName: "", bbbWelcomeMessage: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب نوع کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skyroom">اسکای‌روم (Skyroom)</SelectItem>
                    <SelectItem value="googlemeet">گوگل میت (Google Meet)</SelectItem>
                    <SelectItem value="adobeconnect">ادوبی کانکت (Adobe Connect)</SelectItem>
                    <SelectItem value="bigbluebutton">بیگ بلو باتن (BigBlueButton)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.classType === "skyroom"
                    ? "برای استفاده از اسکای‌روم، کلید API باید در تنظیمات مدرسه فعال باشد"
                    : formData.classType === "googlemeet"
                    ? "لطفاً لینک گوگل میت را وارد کنید یا از گوگل میت یک لینک ایجاد کنید"
                    : formData.classType === "adobeconnect"
                    ? "جلسه ادوبی کانکت به صورت خودکار ایجاد می‌شود"
                    : "جلسه بیگ بلو باتن به صورت خودکار ایجاد می‌شود. نیاز به تنظیم BBB_URL و BBB_SECRET در تنظیمات مدرسه"}
                </p>
              </div>

              {formData.classType === "googlemeet" && (
                <div>
                  <Label htmlFor="googleMeetLink">لینک گوگل میت *</Label>
                  <Input
                    id="googleMeetLink"
                    type="text"
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    value={formData.googleMeetLink}
                    onChange={(e) =>
                      setFormData({ ...formData, googleMeetLink: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    برای ایجاد لینک:{" "}
                    <a
                      href="https://meet.google.com/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      اینجا کلیک کنید
                    </a>{" "}
                    و لینک ایجاد شده را اینجا وارد کنید
                  </p>
                </div>
              )}

              {formData.classType === "bigbluebutton" && (
                <div>
                  <Label htmlFor="bbbWelcomeMessage">پیام خوش‌آمدگویی (اختیاری)</Label>
                  <Input
                    id="bbbWelcomeMessage"
                    type="text"
                    placeholder="مثال: به کلاس ریاضی خوش آمدید!"
                    value={formData.bbbWelcomeMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, bbbWelcomeMessage: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    این پیام هنگام ورود به کلاس به کاربران نمایش داده می‌شود
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="className">نام کلاس *</Label>
                <Input
                  id="className"
                  type="text"
                  placeholder="مثال: کلاس ریاضی پایه دهم"
                  value={formData.className}
                  onChange={(e) =>
                    setFormData({ ...formData, className: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="classDescription">توضیحات</Label>
                <Textarea
                  id="classDescription"
                  placeholder="توضیحات کلاس (اختیاری)"
                  value={formData.classDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classDescription: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              {/* Weekly schedule (weekdays & time ranges) */}
              <div className="space-y-2">
                <Label>روزها و ساعت‌های برگزاری کلاس *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  برای هر روز، ساعت شروع و پایان کلاس را مشخص کنید. مثال: شنبه ۱۲:۳۰ تا ۱۳:۴۰، یکشنبه ۱۵:۲۰ تا ۱۶:۴۰
                </p>

                <div className="space-y-2">
                  {scheduleSlots.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded"
                    >
                      <div className="col-span-4">
                        <Select
                          value={item.day}
                          onValueChange={(value: WeekdayCode) => {
                            const updated = [...scheduleSlots];
                            updated[index] = { ...updated[index], day: value };
                            setScheduleSlots(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب روز" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sat">شنبه</SelectItem>
                            <SelectItem value="sun">یکشنبه</SelectItem>
                            <SelectItem value="mon">دوشنبه</SelectItem>
                            <SelectItem value="tue">سه‌شنبه</SelectItem>
                            <SelectItem value="wed">چهارشنبه</SelectItem>
                            <SelectItem value="thu">پنج‌شنبه</SelectItem>
                            <SelectItem value="fri">جمعه</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => {
                            const updated = [...scheduleSlots];
                            updated[index] = {
                              ...updated[index],
                              startTime: e.target.value,
                            };
                            setScheduleSlots(updated);
                          }}
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => {
                            const updated = [...scheduleSlots];
                            updated[index] = {
                              ...updated[index],
                              endTime: e.target.value,
                            };
                            setScheduleSlots(updated);
                          }}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = scheduleSlots.filter(
                              (s) => s.id !== item.id
                            );
                            setScheduleSlots(updated);
                          }}
                        >
                          حذف
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newItem: ScheduleSlot = {
                        id: Math.random().toString(36).slice(2),
                        day: "sat",
                        startTime: "12:30",
                        endTime: "13:40",
                      };
                      setScheduleSlots([...scheduleSlots, newItem]);
                    }}
                  >
                    افزودن روز جدید
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Participants */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label>انتخاب دانش‌آموزان</Label>
                <div className="mt-2 border rounded-lg p-4 max-h-64 overflow-y-auto">
                  {loadingData ? (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      دانش‌آموزی یافت نشد
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {students.map((student) => {
                        const studentId = student._id?.toString() || student._id;
                        const studentData = student.data || student;
                        return (
                          <label
                            key={studentId}
                            className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedStudents.includes(
                                studentId
                              )}
                              onChange={() => toggleStudent(studentId)}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {studentData.studentName}{" "}
                              {studentData.studentFamily} -{" "}
                              {studentData.studentCode}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.selectedStudents.length} دانش‌آموز انتخاب شده
                </p>
              </div>

              <div>
                <Label>انتخاب معلمان</Label>
                <div className="mt-2 relative">
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="جستجوی معلم (نام، نام خانوادگی یا کد معلم)..."
                      value={teacherSearchQuery}
                      onChange={(e) => setTeacherSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {teachers.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        معلمی یافت نشد
                      </p>
                    ) : (() => {
                      const filteredTeachers = teachers.filter((teacher) => {
                        if (!teacherSearchQuery.trim()) return true;
                        const teacherData = teacher.data || teacher;
                        const searchLower = teacherSearchQuery.toLowerCase();
                        return (
                          teacherData.teacherName?.toLowerCase().includes(searchLower) ||
                          teacherData.teacherFamily?.toLowerCase().includes(searchLower) ||
                          teacherData.teacherCode?.toLowerCase().includes(searchLower)
                        );
                      });

                      if (filteredTeachers.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 text-center py-4">
                            معلمی با این جستجو یافت نشد
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {filteredTeachers.map((teacher) => {
                            const teacherId = teacher._id?.toString() || teacher._id;
                            const teacherData = teacher.data || teacher;
                            return (
                              <label
                                key={teacherId}
                                className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.selectedTeachers.includes(
                                    teacherId
                                  )}
                                  onChange={() => toggleTeacher(teacherId)}
                                  className="rounded"
                                />
                                <span className="text-sm">
                                  {teacherData.teacherName}{" "}
                                  {teacherData.teacherFamily || ""} -{" "}
                                  {teacherData.teacherCode}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.selectedTeachers.length} معلم انتخاب شده
                </p>
              </div>

              <div>
                <Label>انتخاب کلاس‌ها (همه دانش‌آموزان کلاس)</Label>
                <div className="mt-2 relative">
                  <div className="relative mb-2">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="جستجوی کلاس (نام کلاس یا کد کلاس)..."
                      value={classSearchQuery}
                      onChange={(e) => setClassSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    {classes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        کلاسی یافت نشد
                      </p>
                    ) : (() => {
                      const filteredClasses = classes.filter((cls) => {
                        if (!classSearchQuery.trim()) return true;
                        const classData = cls.data || cls;
                        const searchLower = classSearchQuery.toLowerCase();
                        return (
                          classData.className?.toLowerCase().includes(searchLower) ||
                          classData.classCode?.toLowerCase().includes(searchLower)
                        );
                      });

                      if (filteredClasses.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 text-center py-4">
                            کلاسی با این جستجو یافت نشد
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {filteredClasses.map((cls) => {
                            const classId = cls._id?.toString() || cls._id;
                            const classData = cls.data || cls;
                            return (
                              <label
                                key={classId}
                                className="flex items-center space-x-2 space-x-reverse cursor-pointer hover:bg-gray-50 p-2 rounded"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.selectedClasses.includes(classId)}
                                  onChange={() => toggleClass(classId)}
                                  className="rounded"
                                />
                                <span className="text-sm">
                                  {classData.className} - {classData.classCode}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.selectedClasses.length} کلاس انتخاب شده
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">مدت زمان کلاس (دقیقه)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  max="240"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="maxUsers">حداکثر تعداد کاربران</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxUsers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsers: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 4: Review and Confirm */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <span className="font-semibold">نام کلاس:</span>{" "}
                  {formData.className}
                </div>
                <div>
                  <span className="font-semibold">تاریخ:</span>{" "}
                  {formData.classDate}
                </div>
                <div>
                  <span className="font-semibold">زمان:</span>{" "}
                  {formData.classTime}
                </div>
                <div>
                  <span className="font-semibold">مدت زمان:</span>{" "}
                  {formData.duration} دقیقه
                </div>
                <div>
                  <span className="font-semibold">حداکثر کاربران:</span>{" "}
                  {formData.maxUsers}
                </div>
                <div>
                  <span className="font-semibold">دانش‌آموزان:</span>{" "}
                  {formData.selectedStudents.length} نفر
                </div>
                <div>
                  <span className="font-semibold">معلمان:</span>{" "}
                  {formData.selectedTeachers.length} نفر
                </div>
                <div>
                  <span className="font-semibold">کلاس‌ها:</span>{" "}
                  {formData.selectedClasses.length} کلاس
                </div>
              </div>

              {/* Debug panel for request/response */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    پنل دیباگ (فقط برای مدیر / Debug Panel)
                  </span>
                  {debugStatus !== null && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      HTTP {debugStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div>
                    <div className="mb-1 text-slate-300">Request body (ارسال‌شده به API)</div>
                    <pre className="bg-slate-950/60 border border-slate-700 rounded p-2 overflow-x-auto max-h-60">
{JSON.stringify(debugRequest, null, 2) || "// هنوز درخواستی ارسال نشده است"}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-1 text-slate-300">Response body (پاسخ API)</div>
                    <pre className="bg-slate-950/60 border border-slate-700 rounded p-2 overflow-x-auto max-h-60">
{JSON.stringify(debugResponse, null, 2) || "// هنوز پاسخی دریافت نشده است"}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              قبلی
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={loading}>
                بعدی
                <ArrowLeft className="w-4 h-4 mr-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال ایجاد...
                  </>
                ) : (
                  <>
                    ایجاد کلاس
                    <Check className="w-4 h-4 mr-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

        {/* Existing Skyroom classes list */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>کلاس‌های آنلاین ایجاد شده</CardTitle>
          <CardDescription>
            در این بخش می‌توانید کلاس‌های آنلاین موجود را مشاهده و ویرایش یا حذف کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {skyroomClasses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              تاکنون کلاسی ایجاد نشده است.
            </p>
          ) : (
            <div className="space-y-4">
              {skyroomClasses.map((cls) => {
                // Helper functions to get names
                const getTeacherNames = (teacherIds: string[] = []) => {
                  return teacherIds
                    .map((id) => {
                      const teacher = teachers.find((t) => (t._id?.toString() || t._id) === id);
                      if (teacher) {
                        return `${teacher.data.teacherName} ${teacher.data.teacherFamily || ""}`.trim();
                      }
                      return null;
                    })
                    .filter((name): name is string => !!name);
                };

                const getClassNames = (classCodesOrIds: string[] = []) => {
                  return classCodesOrIds
                    .map((codeOrId) => {
                      // Try to find by _id first
                      const byId = classes.find((c) => (c._id?.toString() || c._id) === codeOrId);
                      if (byId) return byId.data.className;
                      
                      // Try to find by classCode
                      const byCode = classes.find((c) => c.data.classCode === codeOrId);
                      if (byCode) return byCode.data.className;
                      
                      return null;
                    })
                    .filter((name): name is string => !!name);
                };

                const getClassTypeBadge = (type?: string) => {
                  switch (type) {
                    case "googlemeet":
                      return <Badge className="bg-green-50 text-green-700 border-green-200">Google Meet</Badge>;
                    case "adobeconnect":
                      return <Badge className="bg-red-50 text-red-700 border-red-200">Adobe Connect</Badge>;
                    case "bigbluebutton":
                      return <Badge className="bg-purple-50 text-purple-700 border-purple-200">BigBlueButton</Badge>;
                    default:
                      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Skyroom</Badge>;
                  }
                };

                const weekdayNames: Record<string, string> = {
                  sat: "شنبه",
                  sun: "یکشنبه",
                  mon: "دوشنبه",
                  tue: "سه‌شنبه",
                  wed: "چهارشنبه",
                  thu: "پنج‌شنبه",
                  fri: "جمعه",
                };

                const teacherNames = getTeacherNames(cls.selectedTeachers || []);
                const classNames = getClassNames(cls.selectedClasses || []);
                const scheduleSlots = cls.scheduleSlots || [];

                const isOpen = openCollapsibles.has(cls._id);
                
                return (
                  <Collapsible 
                    key={cls._id} 
                    className="border rounded-lg"
                    open={isOpen}
                    onOpenChange={(open) => {
                      const newSet = new Set(openCollapsibles);
                      if (open) {
                        newSet.add(cls._id);
                      } else {
                        newSet.delete(cls._id);
                      }
                      setOpenCollapsibles(newSet);
                    }}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        <div className="flex-1 space-y-2 text-right mr-2">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="font-semibold text-base">{cls.className}</div>
                            {getClassTypeBadge(cls.classType)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap justify-end">
                            {cls.maxUsers && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                حداکثر {cls.maxUsers} نفر
                              </span>
                            )}
                            {cls.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {cls.duration} دقیقه
                              </span>
                            )}
                            {scheduleSlots.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {scheduleSlots.length} زمان‌بندی
                              </span>
                            )}
                            {teacherNames.length > 0 && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {teacherNames.length} معلم
                              </span>
                            )}
                            {classNames.length > 0 && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {classNames.length} کلاس
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                        // Normalize selectedClasses so that checkbox values in Step 2
                        // (which use class document _id) appear checked correctly.
                        const normalizedSelectedClasses: string[] = Array.isArray(
                          cls.selectedClasses
                        )
                          ? cls.selectedClasses
                              .map((value: string) => {
                                // If value already matches a class _id, keep it
                                const byId = classes.find(
                                  (c) => (c._id?.toString() || c._id) === value
                                );
                                if (byId) return byId._id?.toString() || byId._id;

                                // Otherwise, treat value as classCode and find matching class
                                const byCode = classes.find(
                                  (c) =>
                                    (c.data?.classCode ||
                                      (c as any).classCode) === value
                                );
                                if (byCode)
                                  return byCode._id?.toString() || byCode._id;

                                // Fallback: keep original value
                                return value;
                              })
                              // Ensure uniqueness
                              .filter(
                                (v: string, idx: number, arr: string[]) =>
                                  arr.indexOf(v) === idx
                              )
                          : [];

                        setEditingClassId(cls._id);
                        setFormData((prev) => ({
                          ...prev,
                          className: cls.className || "",
                          classDescription: cls.classDescription || "",
                          classDate: cls.classDate || "",
                          classTime: cls.classTime || "",
                          duration: String(cls.duration || 60),
                          maxUsers: String(cls.maxUsers || 50),
                          classType: cls.classType || "skyroom",
                          googleMeetLink: cls.googleMeetLink || "",
                          adobeConnectMeetingName: cls.adobeConnectMeetingName || "",
                          bbbWelcomeMessage: cls.bbbWelcomeMessage || "",
                          selectedStudents: cls.selectedStudents || [],
                          selectedTeachers: cls.selectedTeachers || [],
                          selectedClasses: normalizedSelectedClasses,
                        }));

                        // Load schedule slots from saved data if available
                        if (Array.isArray(cls.scheduleSlots) && cls.scheduleSlots.length > 0) {
                          setScheduleSlots(
                            cls.scheduleSlots.map((s: any, index: number) => ({
                              id: s.id || `${cls._id}-${index}`,
                              day: (s.day || "sat") as WeekdayCode,
                              startTime: s.startTime,
                              endTime: s.endTime,
                            }))
                          );
                        }

                        setCurrentStep(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = window.confirm(
                          `آیا از حذف کلاس "${cls.className}" اطمینان دارید؟`
                        );
                        if (!confirmed) return;

                        try {
                          setLoading(true);
                          const res = await fetch(
                            `/api/admin/skyroom/classes?classId=${cls._id}`,
                            {
                              method: "DELETE",
                              headers: {
                                "x-domain": window.location.host,
                              },
                            }
                          );
                          const data = await res.json();
                          if (res.ok && data.success) {
                            toast.success("کلاس با موفقیت حذف شد");
                            fetchSkyroomClasses();
                          } else {
                            toast.error(data.error || "خطا در حذف کلاس");
                          }
                        } catch (error: any) {
                          console.error("Error deleting class:", error);
                          toast.error(
                            "خطا در حذف کلاس: " +
                              (error.message || "خطای ناشناخته")
                          );
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t bg-gray-50 space-y-4">
                        {/* Description */}
                        {cls.classDescription && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">توضیحات:</p>
                            <p className="text-sm text-gray-600">{cls.classDescription}</p>
                          </div>
                        )}

                        {/* Schedule Slots */}
                        {scheduleSlots.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">زمان‌بندی هفتگی:</p>
                            <div className="space-y-1">
                              {scheduleSlots.map((slot: any, idx: number) => (
                                <div key={idx} className="text-sm text-gray-600 bg-white px-3 py-2 rounded border">
                                  <span className="font-medium">{weekdayNames[slot.day] || slot.day}</span>
                                  {" "}از {slot.startTime} تا {slot.endTime}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Teachers */}
                        {teacherNames.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">معلمان ({teacherNames.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {teacherNames.map((name, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Classes */}
                        {classNames.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-2">کلاس‌ها ({classNames.length}):</p>
                            <div className="flex flex-wrap gap-2">
                              {classNames.map((name, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Class Type Specific Info */}
                        {cls.classType === "googlemeet" && cls.googleMeetLink && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">لینک Google Meet:</p>
                            <a 
                              href={cls.googleMeetLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {cls.googleMeetLink}
                            </a>
                          </div>
                        )}

                        {cls.classType === "adobeconnect" && (
                          <div className="space-y-1">
                            {cls.adobeConnectMeetingName && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">نام جلسه Adobe Connect:</p>
                                <p className="text-sm text-gray-600">{cls.adobeConnectMeetingName}</p>
                              </div>
                            )}
                            {cls.adobeConnectScoId && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">شناسه SCO:</p>
                                <p className="text-sm text-gray-600 font-mono">{cls.adobeConnectScoId}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {cls.classType === "bigbluebutton" && (
                          <div className="space-y-1">
                            {cls.bbbWelcomeMessage && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">پیام خوش‌آمدگویی:</p>
                                <p className="text-sm text-gray-600">{cls.bbbWelcomeMessage}</p>
                              </div>
                            )}
                            {cls.bbbMeetingID && (
                              <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">شناسه جلسه:</p>
                                <p className="text-sm text-gray-600 font-mono">{cls.bbbMeetingID}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {cls.classType === "skyroom" && cls.skyroomRoomId && (
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">شناسه اتاق Skyroom:</p>
                            <p className="text-sm text-gray-600 font-mono">{cls.skyroomRoomId}</p>
                          </div>
                        )}

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          {cls.classDate && cls.classTime && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">اولین تاریخ:</p>
                              <p className="text-sm text-gray-600">{cls.classDate} ساعت {cls.classTime}</p>
                            </div>
                          )}
                          {cls.maxUsers && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">حداکثر کاربران:</p>
                              <p className="text-sm text-gray-600">{cls.maxUsers} نفر</p>
                            </div>
                          )}
                          {cls.duration && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">مدت زمان:</p>
                              <p className="text-sm text-gray-600">{cls.duration} دقیقه</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

