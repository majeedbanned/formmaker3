"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bell,
  Send,
  Users,
  UserCheck,
  GraduationCap,
  UserCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  Plus,
  Eye,
  Trash2,
  Edit,
  History,
  Cake,
  Smartphone,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";

// Types
interface Class {
  _id: string;
  data: {
    classCode: string;
    className: string;
    Grade: string;
    major: string;
    schoolCode: string;
    students?: Array<{
      studentCode: string;
      studentName: string;
      studentlname: string;
      _id: string;
    }>;
  };
}

interface PushToken {
  token: string;
  deviceInfo?: {
    deviceName?: string;
    deviceType?: string;
    osName?: string;
    osVersion?: string;
    modelName?: string;
    brand?: string;
    platform?: string;
  };
  registeredAt?: Date;
  lastUpdated?: Date;
  active?: boolean;
}

interface Student {
  _id: string;
  data: {
    studentCode: string;
    studentName: string;
    studentFamily: string;
    classCode: Array<{ label: string; value: string }>;
    groups?: string | Array<string>;
    schoolCode: string;
    birthDate?: string;
    pushTokens?: PushToken[];
  };
}

interface Teacher {
  _id: string;
  data: {
    teacherCode: string;
    teacherName: string;
    schoolCode: string;
    birthDate?: string;
    pushTokens?: PushToken[];
  };
}

interface Group {
  _id: string;
  data: {
    groupCode: string;
    groupName: string;
    groupDescription?: string;
    schoolCode: string;
  };
}

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
}

interface NotificationHistory {
  _id: string;
  title: string;
  body: string;
  recipientCodes: string[];
  recipientDetails: Array<{
    code: string;
    name: string;
    type: 'student' | 'teacher';
  }>;
  tokenCount: number;
  schoolCode: string;
  userId: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  data?: any;
  createdAt: string;
  updatedAt: string;
}

export default function SendNotif2Page() {
  const { user, isLoading } = useAuth();
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

  // State management
  const [activeTab, setActiveTab] = useState<string>("compose");
  const [recipientType, setRecipientType] = useState<
    "classes" | "students" | "teachers" | "groups"
  >("classes");

  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  // Selection states
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Message states
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [messageTemplates] = useState<MessageTemplate[]>([
    { id: "1", title: "یادآوری جلسه", content: "یادآوری: جلسه کلاسی فردا ساعت " },
    {
      id: "2",
      title: "اعلان مهم",
      content: "اعلان مهم برای ولی محترم: ",
    },
    { id: "3", title: "تبریک", content: "تبریک! دانش آموز گرامی در " },
    {
      id: "4",
      title: "غیبت",
      content: "سلام. فرزند شما امروز در کلاس حضور نداشته است. ",
    },
  ]);

  // UI states
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState<boolean>(false);
  const [isEditTemplate, setIsEditTemplate] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Template creation states
  const [templateTitle, setTemplateTitle] = useState<string>("");
  const [templateContent, setTemplateContent] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [isLoadingTokenCount, setIsLoadingTokenCount] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  // History states
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearchTerm, setHistorySearchTerm] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<string>("all");
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<NotificationHistory | null>(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState<boolean>(false);

  // Birthday states
  const [isBirthdayDialogOpen, setIsBirthdayDialogOpen] = useState<boolean>(false);
  const [birthdayPeople, setBirthdayPeople] = useState<Array<{type: 'student' | 'teacher', data: Student | Teacher}>>([]);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState<boolean>(false);

  // Device registration details states
  const [isDeviceDetailsDialogOpen, setIsDeviceDetailsDialogOpen] = useState<boolean>(false);
  const [deviceDetailsFilter, setDeviceDetailsFilter] = useState<'all' | 'installed' | 'not-installed'>('all');

  // Load custom templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('notification-templates');
    if (savedTemplates) {
      try {
        const templates = JSON.parse(savedTemplates);
        setCustomTemplates(templates);
      } catch (error) {
        console.error('Error loading templates from localStorage:', error);
      }
    }
  }, []);

  // Save custom templates to localStorage whenever they change
  useEffect(() => {
    if (customTemplates.length > 0) {
      localStorage.setItem('notification-templates', JSON.stringify(customTemplates));
    } else {
      localStorage.removeItem('notification-templates');
    }
  }, [customTemplates]);

  // Check if teacher has adminAccess
  useEffect(() => {
    const checkTeacherAdminAccess = async () => {
      if (isLoading) return;
      if (!user || user.userType !== "teacher" || !user.username) {
        setIsAdminTeacher(false);
        return;
      }

      try {
        const response = await fetch(`/api/teachers?schoolCode=${user.schoolCode}`);
        if (!response.ok) {
          console.error("Failed to fetch teacher data");
          setIsAdminTeacher(false);
          return;
        }

        const teachers = await response.json();
        const currentTeacher = teachers.find(
          (t: any) => t.data?.teacherCode === user.username
        );

        if (currentTeacher?.data?.adminAccess === true) {
          setIsAdminTeacher(true);
        } else {
          setIsAdminTeacher(false);
        }
      } catch (err) {
        console.error("Error checking teacher admin access:", err);
        setIsAdminTeacher(false);
      }
    };

    checkTeacherAdminAccess();
  }, [user, isLoading]);

  useEffect(() => {
    if (user && (user.userType === "school" || (user.userType === "teacher" && isAdminTeacher))) {
      fetchAllData();
      fetchTokenCount();
      fetchNotificationHistory();
    }
  }, [user, isAdminTeacher]);

  const fetchTokenCount = async () => {
    try {
      setIsLoadingTokenCount(true);
      const response = await fetch("/api/notifications/token-count", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTokenCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching token count:", error);
    } finally {
      setIsLoadingTokenCount(false);
    }
  };

  // Get device registration statistics
  const getDeviceStats = () => {
    const stats = {
      teachers: {
        total: teachers.length,
        installed: 0,
        notInstalled: 0,
        totalDevices: 0,
      },
      students: {
        total: students.length,
        installed: 0,
        notInstalled: 0,
        totalDevices: 0,
      },
    };

    teachers.forEach(teacher => {
      if (teacher.data.pushTokens && teacher.data.pushTokens.length > 0) {
        stats.teachers.installed++;
        stats.teachers.totalDevices += teacher.data.pushTokens.filter(t => t.active !== false).length;
      } else {
        stats.teachers.notInstalled++;
      }
    });

    students.forEach(student => {
      if (student.data.pushTokens && student.data.pushTokens.length > 0) {
        stats.students.installed++;
        stats.students.totalDevices += student.data.pushTokens.filter(t => t.active !== false).length;
      } else {
        stats.students.notInstalled++;
      }
    });

    return stats;
  };

  // Get filtered list for device details dialog
  const getDeviceDetailsList = () => {
    const list: Array<{
      type: 'teacher' | 'student';
      code: string;
      name: string;
      hasToken: boolean;
      tokenCount: number;
      devices: Array<{
        platform?: string;
        deviceName?: string;
        modelName?: string;
      }>;
    }> = [];

    teachers.forEach(teacher => {
      const hasToken = !!(teacher.data.pushTokens && teacher.data.pushTokens.length > 0);
      const tokenCount = teacher.data.pushTokens?.filter(t => t.active !== false).length || 0;
      
      if (deviceDetailsFilter === 'all' || 
          (deviceDetailsFilter === 'installed' && hasToken) ||
          (deviceDetailsFilter === 'not-installed' && !hasToken)) {
        list.push({
          type: 'teacher',
          code: teacher.data.teacherCode,
          name: teacher.data.teacherName,
          hasToken,
          tokenCount,
          devices: teacher.data.pushTokens?.filter(t => t.active !== false).map(t => ({
            platform: t.deviceInfo?.platform,
            deviceName: t.deviceInfo?.deviceName,
            modelName: t.deviceInfo?.modelName,
          })) || [],
        });
      }
    });

    students.forEach(student => {
      const hasToken = !!(student.data.pushTokens && student.data.pushTokens.length > 0);
      const tokenCount = student.data.pushTokens?.filter(t => t.active !== false).length || 0;
      
      if (deviceDetailsFilter === 'all' || 
          (deviceDetailsFilter === 'installed' && hasToken) ||
          (deviceDetailsFilter === 'not-installed' && !hasToken)) {
        list.push({
          type: 'student',
          code: student.data.studentCode,
          name: `${student.data.studentName} ${student.data.studentFamily}`,
          hasToken,
          tokenCount,
          devices: student.data.pushTokens?.filter(t => t.active !== false).map(t => ({
            platform: t.deviceInfo?.platform,
            deviceName: t.deviceInfo?.deviceName,
            modelName: t.deviceInfo?.modelName,
          })) || [],
        });
      }
    });

    return list;
  };

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch classes
      const classesRes = await fetch("/api/crud/classes", {
        headers: { "x-domain": window.location.host },
      });
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData || []);
      }

      // Fetch students
      const studentsRes = await fetch("/api/crud/students", {
        headers: { "x-domain": window.location.host },
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData || []);
      }

      // Fetch teachers
      const teachersRes = await fetch("/api/crud/teachers", {
        headers: { "x-domain": window.location.host },
      });
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        setTeachers(teachersData || []);
      }

      // Fetch groups
      const groupsRes = await fetch("/api/crud/studentsgroups", {
        headers: { "x-domain": window.location.host },
      });
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در بارگذاری اطلاعات");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchNotificationHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const url = new URL("/api/notifications/history", window.location.origin);
      if (historyFilter !== "all") {
        url.searchParams.set("status", historyFilter);
      }
      
      const response = await fetch(url.toString(), {
        headers: { "x-domain": window.location.host },
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationHistory(data.records || []);
      } else {
        console.error("Failed to fetch notification history:", response.statusText);
        toast.error("خطا در بارگذاری تاریخچه اعلان‌ها");
      }
    } catch (error) {
      console.error("Error fetching notification history:", error);
      toast.error("خطا در بارگذاری تاریخچه اعلان‌ها");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch people with birthdays today
  const fetchBirthdayPeople = async () => {
    setIsLoadingBirthdays(true);
    try {
      const response = await fetch("/api/birthday", {
        headers: { "x-domain": window.location.host },
      });

      if (response.ok) {
        const data = await response.json();
        const birthdayList = data.people || [];

        setBirthdayPeople(birthdayList);

        if (birthdayList.length === 0) {
          toast.info("امروز تولد کسی نیست");
        } else {
          toast.success(`${birthdayList.length} نفر امروز تولد دارند`);
          setIsBirthdayDialogOpen(true);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در بارگذاری لیست تولدها");
      }
    } catch (error) {
      console.error("Error fetching birthday people:", error);
      toast.error("خطا در بارگذاری لیست تولدها");
    } finally {
      setIsLoadingBirthdays(false);
    }
  };

  // Select all birthday people
  const selectAllBirthdayPeople = () => {
    birthdayPeople.forEach(person => {
      if (person.type === 'student') {
        const studentData = (person.data as Student).data;
        const studentCode = studentData.studentCode;

        if (!selectedStudents.includes(studentCode)) {
          setSelectedStudents(prev => [...prev, studentCode]);
        }
      } else {
        const teacherData = (person.data as Teacher).data;
        const teacherCode = teacherData.teacherCode;

        if (!selectedTeachers.includes(teacherCode)) {
          setSelectedTeachers(prev => [...prev, teacherCode]);
        }
      }
    });

    setIsBirthdayDialogOpen(false);
    toast.success(`${birthdayPeople.length} نفر به لیست گیرندگان اضافه شدند`);
  };

  // Get all recipient codes
  const getAllRecipientCodes = (): string[] => {
    const codes: string[] = [];

    // From selected classes - get all students in those classes
    selectedClasses.forEach((classCode) => {
      const classItem = classes.find((c) => c.data.classCode === classCode);
      classItem?.data.students?.forEach(student => {
        codes.push(student.studentCode);
      });
    });

    // From selected students
    codes.push(...selectedStudents);

    // From selected teachers
    codes.push(...selectedTeachers);

    // From selected groups
    selectedGroups.forEach((groupCode) => {
      const groupStudents = students.filter((s) => {
        if (typeof s.data.groups === 'string') {
          return s.data.groups === groupCode;
        } else if (Array.isArray(s.data.groups)) {
          return s.data.groups.includes(groupCode);
        }
        return false;
      });
      groupStudents.forEach(s => codes.push(s.data.studentCode));
    });

    return [...new Set(codes)];
  };

  // Template management functions
  const handleCreateTemplate = () => {
    if (!templateTitle.trim() || !templateContent.trim()) {
      toast.error("لطفاً عنوان و محتوای قالب را وارد کنید");
      return;
    }

    const newTemplate: MessageTemplate = {
      id: Date.now().toString(),
      title: templateTitle.trim(),
      content: templateContent.trim(),
    };

    setCustomTemplates(prev => [...prev, newTemplate]);
    setTemplateTitle("");
    setTemplateContent("");
    setIsTemplateDialogOpen(false);
    toast.success("قالب جدید با موفقیت ایجاد شد");
  };

  const handleEditTemplate = () => {
    if (!templateTitle.trim() || !templateContent.trim() || !editingTemplate) {
      toast.error("لطفاً عنوان و محتوای قالب را وارد کنید");
      return;
    }

    setCustomTemplates(prev =>
      prev.map(template =>
        template.id === editingTemplate.id
          ? { ...template, title: templateTitle.trim(), content: templateContent.trim() }
          : template
      )
    );

    setTemplateTitle("");
    setTemplateContent("");
    setEditingTemplate(null);
    setIsEditTemplate(false);
    setIsTemplateDialogOpen(false);
    toast.success("قالب با موفقیت ویرایش شد");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setCustomTemplates(prev => prev.filter(template => template.id !== templateId));
    toast.success("قالب حذف شد");
  };

  const handleUseTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    toast.success("قالب انتخاب شد");
  };

  const handleEditTemplateStart = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateTitle(template.title);
    setTemplateContent(template.content);
    setIsEditTemplate(true);
    setIsTemplateDialogOpen(true);
  };

  const handleResetTemplateForm = () => {
    setTemplateTitle("");
    setTemplateContent("");
    setEditingTemplate(null);
    setIsEditTemplate(false);
    setIsTemplateDialogOpen(false);
  };

  // Combine default and custom templates
  const allTemplates = [...messageTemplates, ...customTemplates];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "failed":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get status text in Persian
  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "ارسال شده";
      case "failed":
        return "ناموفق";
      case "pending":
        return "در انتظار";
      default:
        return "نامشخص";
    }
  };

  // Handle send notification button click - open confirmation
  const handleSendNotificationClick = () => {
    if (!title.trim()) {
      toast.error("لطفاً عنوان اعلان را وارد کنید");
      return;
    }

    if (!message.trim()) {
      toast.error("لطفاً متن پیام را وارد کنید");
      return;
    }

    const recipientCodes = getAllRecipientCodes();
    if (recipientCodes.length === 0) {
      toast.error("لطفاً حداقل یک گیرنده انتخاب کنید");
      return;
    }

    // Open confirmation dialog
    setIsConfirmDialogOpen(true);
  };

  // Actually send notification after confirmation
  const handleConfirmSend = async () => {
    const recipientCodes = getAllRecipientCodes();

    setIsSending(true);
    try {
      const response = await fetch("/api/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          recipientCodes,
          schoolCode: user?.schoolCode,
          title: title,
          body: message,
          data: {},
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`اعلان به ${result.tokenCount || 0} دستگاه ارسال شد`);

        // Reset form
        setTitle("");
        setMessage("");
        setSelectedClasses([]);
        setSelectedStudents([]);
        setSelectedTeachers([]);
        setSelectedGroups([]);
        setIsPreviewOpen(false);
        setIsConfirmDialogOpen(false);

        // Refresh token count and history
        fetchTokenCount();
        fetchNotificationHistory();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "خطا در ارسال اعلان");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("خطا در ارسال اعلان");
    } finally {
      setIsSending(false);
    }
  };

  // Get recipient details for confirmation
  const getRecipientDetailsForConfirmation = () => {
    const details: Array<{code: string, name: string, type: 'student' | 'teacher', tokenCount: number}> = [];
    const codes = getAllRecipientCodes();

    codes.forEach(code => {
      const student = students.find(s => s.data.studentCode === code);
      if (student) {
        const tokenCount = student.data.pushTokens?.filter(t => t.active !== false).length || 0;
        details.push({
          code,
          name: `${student.data.studentName} ${student.data.studentFamily}`,
          type: 'student',
          tokenCount
        });
      }

      const teacher = teachers.find(t => t.data.teacherCode === code);
      if (teacher) {
        const tokenCount = teacher.data.pushTokens?.filter(t => t.active !== false).length || 0;
        details.push({
          code,
          name: teacher.data.teacherName,
          type: 'teacher',
          tokenCount
        });
      }
    });

    return details;
  };

  // Get token count for selected recipients
  const getSelectedTokenCount = (): number => {
    const codes = getAllRecipientCodes();
    let count = 0;

    codes.forEach(code => {
      const student = students.find(s => s.data.studentCode === code);
      if (student?.data.pushTokens) {
        count += student.data.pushTokens.filter(t => t.active !== false).length;
      }

      const teacher = teachers.find(t => t.data.teacherCode === code);
      if (teacher?.data.pushTokens) {
        count += teacher.data.pushTokens.filter(t => t.active !== false).length;
      }
    });

    return count;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user?.userType !== "school" && !(user?.userType === "teacher" && isAdminTeacher)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            دسترسی محدود
          </h2>
          <p className="text-gray-600">
            فقط مدیران مدرسه به این بخش دسترسی دارند
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <PageHeader
        title="ارسال اعلان گروهی - Notification"
        subtitle="ارسال اعلان به دانش آموزان و معلمان"
        icon={<Bell className="w-6 h-6" />}
        gradient={true}
      />

      {/* Token Count Card */}
      <Card className="mb-6">
        <CardContent className="py-4">
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Smartphone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">دستگاه‌های ثبت شده</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoadingTokenCount ? (
                        <Loader2 className="h-6 w-6 animate-spin inline" />
                      ) : (
                        `${getDeviceStats().teachers.totalDevices + getDeviceStats().students.totalDevices} دستگاه`
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeviceDetailsFilter('all');
                      setIsDeviceDetailsDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    جزئیات
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      fetchTokenCount();
                      fetchAllData();
                    }}
                    disabled={isLoadingTokenCount}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingTokenCount ? "animate-spin" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Teachers Stats */}
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">معلمان</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">نصب شده:</span>
                        <span className="font-bold text-green-700">
                          {getDeviceStats().teachers.installed} / {getDeviceStats().teachers.total}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">نصب نشده:</span>
                        <span className="font-medium text-red-600">
                          {getDeviceStats().teachers.notInstalled}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-green-200">
                        <span className="text-gray-600">دستگاه‌ها:</span>
                        <span className="font-bold text-green-800">
                          {getDeviceStats().teachers.totalDevices}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Students Stats */}
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">دانش آموزان</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">نصب شده:</span>
                        <span className="font-bold text-blue-700">
                          {getDeviceStats().students.installed} / {getDeviceStats().students.total}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">نصب نشده:</span>
                        <span className="font-medium text-red-600">
                          {getDeviceStats().students.notInstalled}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-blue-200">
                        <span className="text-gray-600">دستگاه‌ها:</span>
                        <span className="font-bold text-blue-800">
                          {getDeviceStats().students.totalDevices}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="compose"
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            <span>ارسال اعلان</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>تاریخچه ارسال</span>
          </TabsTrigger>
        </TabsList>

        {/* Compose Tab */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recipients Section */}
            <div className="lg:col-span-2 space-y-4" style={{ direction: 'rtl' }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    انتخاب گیرندگان
                  </CardTitle>
                  <CardDescription>
                    دریافت کنندگان اعلان را انتخاب کنید
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Recipient Type Selector */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={recipientType === "classes" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecipientType("classes")}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      کلاس‌ها
                    </Button>
                    <Button
                      variant={recipientType === "students" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecipientType("students")}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      دانش آموزان
                    </Button>
                    <Button
                      variant={recipientType === "teachers" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecipientType("teachers")}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      معلمان
                    </Button>
                    <Button
                      variant={recipientType === "groups" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecipientType("groups")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      گروه‌ها
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchBirthdayPeople}
                      disabled={isLoadingBirthdays}
                      className="bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-300"
                      title="مشاهده کسانی که امروز تولد دارند"
                    >
                      {isLoadingBirthdays ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Cake className="h-4 w-4 mr-2" />
                      )}
                      تولد امروز
                    </Button>
                  </div>

                  <Separator />

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="جستجو..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 text-right"
                      dir="rtl"
                    />
                  </div>

                  {/* Selection Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (recipientType === "classes") {
                          const allClassCodes = classes
                            .filter((c) =>
                              c.data.className
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            )
                            .map((c) => c.data.classCode);
                          setSelectedClasses(allClassCodes);
                        } else if (recipientType === "students") {
                          const allStudentCodes = students
                            .filter(
                              (s) =>
                                s.data.studentName
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase()) ||
                                s.data.studentFamily
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                            )
                            .map((s) => s.data.studentCode);
                          setSelectedStudents(allStudentCodes);
                        } else if (recipientType === "teachers") {
                          const allTeacherCodes = teachers
                            .filter((t) =>
                              t.data.teacherName
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            )
                            .map((t) => t.data.teacherCode);
                          setSelectedTeachers(allTeacherCodes);
                        } else if (recipientType === "groups") {
                          const allGroupCodes = groups
                            .filter((g) =>
                              g.data.groupName
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase())
                            )
                            .map((g) => g.data.groupCode);
                          setSelectedGroups(allGroupCodes);
                        }
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      انتخاب همه
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (recipientType === "classes") {
                          setSelectedClasses([]);
                        } else if (recipientType === "students") {
                          setSelectedStudents([]);
                        } else if (recipientType === "teachers") {
                          setSelectedTeachers([]);
                        } else if (recipientType === "groups") {
                          setSelectedGroups([]);
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      لغو همه
                    </Button>
                  </div>

                  {/* Recipient Lists */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {isLoadingData ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <>
                        {recipientType === "classes" && (
                          <>
                            {classes.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>هیچ کلاسی یافت نشد</p>
                              </div>
                            ) : (
                              classes
                                .filter((c) =>
                                  c.data.className
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map((classItem) => (
                                  <div
                                    key={classItem._id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                                      selectedClasses.includes(classItem.data.classCode)
                                        ? "bg-blue-50 border-blue-300"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                      if (selectedClasses.includes(classItem.data.classCode)) {
                                        setSelectedClasses(
                                          selectedClasses.filter(
                                            (c) => c !== classItem.data.classCode
                                          )
                                        );
                                      } else {
                                        setSelectedClasses([
                                          ...selectedClasses,
                                          classItem.data.classCode,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedClasses.includes(
                                        classItem.data.classCode
                                      )}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {classItem.data.className}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        پایه {classItem.data.Grade}
                                      </p>
                                    </div>
                                    <Badge variant="secondary">
                                      {classItem.data.students?.length || 0} نفر
                                    </Badge>
                                  </div>
                                ))
                            )}
                          </>
                        )}

                        {recipientType === "students" && (
                          <>
                            {students.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <UserCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>هیچ دانش آموزی یافت نشد</p>
                              </div>
                            ) : (
                              students
                                .filter(
                                  (s) =>
                                    s.data.studentName
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase()) ||
                                    s.data.studentFamily
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                )
                                .map((student) => (
                                  <div
                                    key={student._id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                                      selectedStudents.includes(student.data.studentCode)
                                        ? "bg-blue-50 border-blue-300"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                      if (selectedStudents.includes(student.data.studentCode)) {
                                        setSelectedStudents(
                                          selectedStudents.filter(
                                            (s) => s !== student.data.studentCode
                                          )
                                        );
                                      } else {
                                        setSelectedStudents([
                                          ...selectedStudents,
                                          student.data.studentCode,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedStudents.includes(
                                        student.data.studentCode
                                      )}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {student.data.studentName}{" "}
                                        {student.data.studentFamily}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        کد: {student.data.studentCode}
                                      </p>
                                      {student.data.pushTokens && student.data.pushTokens.length > 0 && (
                                        <p className="text-xs text-blue-600">
                                          <Smartphone className="h-3 w-3 inline mr-1" />
                                          {student.data.pushTokens.filter(t => t.active !== false).length} دستگاه
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                            )}
                          </>
                        )}

                        {recipientType === "teachers" && (
                          <>
                            {teachers.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>هیچ معلمی یافت نشد</p>
                              </div>
                            ) : (
                              teachers
                                .filter((t) =>
                                  t.data.teacherName
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map((teacher) => (
                                  <div
                                    key={teacher._id}
                                    className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                                      selectedTeachers.includes(teacher.data.teacherCode)
                                        ? "bg-blue-50 border-blue-300"
                                        : "hover:bg-gray-50"
                                    }`}
                                    onClick={() => {
                                      if (selectedTeachers.includes(teacher.data.teacherCode)) {
                                        setSelectedTeachers(
                                          selectedTeachers.filter(
                                            (t) => t !== teacher.data.teacherCode
                                          )
                                        );
                                      } else {
                                        setSelectedTeachers([
                                          ...selectedTeachers,
                                          teacher.data.teacherCode,
                                        ]);
                                      }
                                    }}
                                  >
                                    <Checkbox
                                      checked={selectedTeachers.includes(
                                        teacher.data.teacherCode
                                      )}
                                    />
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {teacher.data.teacherName}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        کد: {teacher.data.teacherCode}
                                      </p>
                                      {teacher.data.pushTokens && teacher.data.pushTokens.length > 0 && (
                                        <p className="text-xs text-blue-600">
                                          <Smartphone className="h-3 w-3 inline mr-1" />
                                          {teacher.data.pushTokens.filter(t => t.active !== false).length} دستگاه
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))
                            )}
                          </>
                        )}

                        {recipientType === "groups" && (
                          <>
                            {groups.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p>هیچ گروهی یافت نشد</p>
                              </div>
                            ) : (
                              groups
                                .filter((g) =>
                                  g.data.groupName
                                    .toLowerCase()
                                    .includes(searchTerm.toLowerCase())
                                )
                                .map((group) => {
                                  const groupStudents = students.filter((s) => {
                                    if (typeof s.data.groups === 'string') {
                                      return s.data.groups === group.data.groupCode;
                                    } else if (Array.isArray(s.data.groups)) {
                                      return s.data.groups.includes(group.data.groupCode);
                                    }
                                    return false;
                                  });
                                  
                                  return (
                                    <div
                                      key={group._id}
                                      className={`flex items-center gap-3 p-3 border rounded-lg transition-all cursor-pointer ${
                                        selectedGroups.includes(group.data.groupCode)
                                          ? "bg-blue-50 border-blue-300"
                                          : "hover:bg-gray-50"
                                      }`}
                                      onClick={() => {
                                        if (selectedGroups.includes(group.data.groupCode)) {
                                          setSelectedGroups(
                                            selectedGroups.filter(
                                              (g) => g !== group.data.groupCode
                                            )
                                          );
                                        } else {
                                          setSelectedGroups([
                                            ...selectedGroups,
                                            group.data.groupCode,
                                          ]);
                                        }
                                      }}
                                    >
                                      <Checkbox
                                        checked={selectedGroups.includes(
                                          group.data.groupCode
                                        )}
                                      />
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {group.data.groupName}
                                        </p>
                                        {group.data.groupDescription && (
                                          <p className="text-sm text-gray-500">
                                            {group.data.groupDescription}
                                          </p>
                                        )}
                                      </div>
                                      <Badge variant="secondary">
                                        {groupStudents.length} نفر
                                      </Badge>
                                    </div>
                                  );
                                })
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Message Composition Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-right flex flex-row-reverse items-end">
                    <Bell className="h-5 w-5"  />
                    متن اعلان
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title Input */}
                  <div className="space-y-2 text-right flex flex-col items-end">
                    <Label htmlFor="title" className="text-right">عنوان اعلان</Label>
                    <Input
                      id="title"
                      placeholder="عنوان اعلان را وارد کنید..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      dir="rtl"
                      className="text-right"
                    />
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2 text-right flex flex-col items-end">
                    <Label htmlFor="message">متن پیام</Label>
                    <Textarea
                      id="message"
                      placeholder="متن پیام را اینجا بنویسید..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      dir="rtl"
                      className="text-right resize-none"
                    />
                    <p className="text-xs text-gray-500 text-left">
                      {message.length} کاراکتر
                    </p>
                  </div>

                  {/* Templates */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-right flex flex-col items-end">
                      <Label>قالب‌های پیام</Label>
                      <Button
                      className="text-right justify-end"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditTemplate(false);
                          setEditingTemplate(null);
                          setTemplateTitle("");
                          setTemplateContent("");
                          setIsTemplateDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        قالب جدید
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {allTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-start"
                            onClick={() => handleUseTemplate(template)}
                          >
                            {template.title}
                          </Button>
                          {customTemplates.find(t => t.id === template.id) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTemplateStart(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Send Button */}
                  <div className="space-y-3 " style={{ direction: 'rtl' }}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">گیرندگان انتخاب شده:</span>
                      <span className="font-medium">{getAllRecipientCodes().length} نفر</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">دستگاه‌های هدف:</span>
                      <span className="font-medium text-blue-600">
                        <Smartphone className="h-4 w-4 inline mr-1" />
                        {getSelectedTokenCount()} دستگاه
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSendNotificationClick}
                      disabled={isSending || !title || !message || getAllRecipientCodes().length === 0}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      ارسال اعلان
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" style={{ direction: 'rtl' }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                تاریخچه اعلان‌ها
              </CardTitle>
              <CardDescription>
                لیست اعلان‌های ارسال شده
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو در تاریخچه..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pr-10 text-right"
                    dir="rtl"
                  />
                </div>
                <Select value={historyFilter} onValueChange={(value) => {
                  setHistoryFilter(value);
                  // Refetch with new filter
                  setTimeout(() => fetchNotificationHistory(), 100);
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="sent">ارسال شده</SelectItem>
                    <SelectItem value="failed">ناموفق</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchNotificationHistory}
                  disabled={isLoadingHistory}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoadingHistory ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {/* History List */}
              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : notificationHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>هیچ اعلانی ارسال نشده است</p>
                  </div>
                ) : (
                  notificationHistory
                    .filter((item) => {
                      if (!historySearchTerm) return true;
                      return (
                        item.title.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                        item.body.toLowerCase().includes(historySearchTerm.toLowerCase())
                      );
                    })
                    .map((item) => (
                      <Card
                        key={item._id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedHistoryItem(item);
                          setIsHistoryDetailOpen(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-lg">{item.title}</h3>
                                <Badge variant={getStatusVariant(item.status)}>
                                  {getStatusText(item.status)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {item.body}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {item.recipientDetails?.length || item.recipientCodes.length} گیرنده
                                </span>
                                <span className="flex items-center gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  {item.tokenCount} دستگاه
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(item.sentAt)}
                                </span>
                              </div>
                            </div>
                            <Eye className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Send className="h-6 w-6 text-blue-600" />
              تأیید ارسال اعلان
            </DialogTitle>
            <DialogDescription>
              لطفاً قبل از ارسال، جزئیات اعلان را بررسی کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 rounded-full p-2">
                  <Bell className="h-5 w-5 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900 mb-1">توجه</h4>
                  <p className="text-sm text-yellow-800">
                    این اعلان به {getRecipientDetailsForConfirmation().length} نفر و {getSelectedTokenCount()} دستگاه ارسال خواهد شد.
                    لطفاً محتوا را بررسی کنید.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Preview */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-500">پیش‌نمایش نحوه نمایش اعلان</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-900">{getRecipientDetailsForConfirmation().length}</p>
                  <p className="text-sm text-blue-700">گیرنده</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-900">{getSelectedTokenCount()}</p>
                  <p className="text-sm text-green-700">دستگاه</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-900">فوری</p>
                  <p className="text-sm text-purple-700">ارسال</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Recipients List */}
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                لیست دریافت کنندگان ({getRecipientDetailsForConfirmation().length} نفر)
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3 bg-gray-50">
                {getRecipientDetailsForConfirmation().map((recipient, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200">
                    {recipient.type === 'student' ? (
                      <div className="bg-blue-100 rounded-full p-2">
                        <UserCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    ) : (
                      <div className="bg-green-100 rounded-full p-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{recipient.name}</p>
                      <p className="text-xs text-gray-500">کد: {recipient.code}</p>
                    </div>
                    <div className="text-left">
                      {recipient.tokenCount > 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Smartphone className="h-3 w-3" />
                          <span className="text-xs font-medium">{recipient.tokenCount} دستگاه</span>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500">بدون دستگاه</span>
                      )}
                    </div>
                    <Badge variant={recipient.type === 'student' ? 'default' : 'secondary'} className="text-xs">
                      {recipient.type === 'student' ? 'دانش آموز' : 'معلم'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning for recipients without devices */}
            {getRecipientDetailsForConfirmation().some(r => r.tokenCount === 0) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">
                    <strong>توجه:</strong> برخی از گیرندگان دستگاه ثبت شده ندارند و اعلان را دریافت نخواهند کرد.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSending}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              انصراف
            </Button>
            <Button 
              onClick={handleConfirmSend}
              disabled={isSending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  در حال ارسال...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  تأیید و ارسال
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Birthday Dialog */}
      <Dialog open={isBirthdayDialogOpen} onOpenChange={setIsBirthdayDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cake className="h-5 w-5 text-pink-600" />
              افراد متولد امروز
            </DialogTitle>
            <DialogDescription>
              {birthdayPeople.length} نفر امروز تولد دارند
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {birthdayPeople.map((person, index) => {
              const data = person.data.data;
              const name = person.type === 'student'
                ? `${(data as any).studentName} ${(data as any).studentFamily}`
                : (data as any).teacherName;
              const code = person.type === 'student'
                ? (data as any).studentCode
                : (data as any).teacherCode;

              return (
                <div key={index} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-gray-500">
                      {person.type === 'student' ? 'دانش آموز' : 'معلم'} - کد: {code}
                    </p>
                  </div>
                  <Cake className="h-5 w-5 text-pink-500" />
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBirthdayDialogOpen(false)}
            >
              انصراف
            </Button>
            <Button onClick={selectAllBirthdayPeople}>
              <UserCheck className="h-4 w-4 mr-2" />
              انتخاب همه
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {isEditTemplate ? "ویرایش قالب" : "قالب جدید"}
            </DialogTitle>
            <DialogDescription>
              {isEditTemplate ? "قالب را ویرایش کنید" : "یک قالب جدید ایجاد کنید"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-title">عنوان قالب</Label>
              <Input
                id="template-title"
                placeholder="عنوان قالب"
                value={templateTitle}
                onChange={(e) => setTemplateTitle(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">محتوای قالب</Label>
              <Textarea
                id="template-content"
                placeholder="محتوای قالب"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                rows={4}
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleResetTemplateForm}>
              انصراف
            </Button>
            <Button onClick={isEditTemplate ? handleEditTemplate : handleCreateTemplate}>
              {isEditTemplate ? "ویرایش" : "ایجاد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device Details Dialog */}
      <Dialog open={isDeviceDetailsDialogOpen} onOpenChange={setIsDeviceDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="h-6 w-6 text-blue-600" />
              جزئیات دستگاه‌های ثبت شده
            </DialogTitle>
            <DialogDescription>
              لیست کامل معلمان و دانش آموزان و وضعیت نصب اپلیکیشن
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">نصب شده</p>
                      <p className="text-2xl font-bold text-green-900">
                        {getDeviceStats().teachers.installed + getDeviceStats().students.installed}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getDeviceStats().teachers.totalDevices + getDeviceStats().students.totalDevices} دستگاه فعال
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 rounded-full p-3">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">نصب نشده</p>
                      <p className="text-2xl font-bold text-red-900">
                        {getDeviceStats().teachers.notInstalled + getDeviceStats().students.notInstalled}
                      </p>
                      <p className="text-xs text-gray-500">
                        از {teachers.length + students.length} نفر کل
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b pb-2">
              <Button
                variant={deviceDetailsFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceDetailsFilter('all')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                همه ({teachers.length + students.length})
              </Button>
              <Button
                variant={deviceDetailsFilter === 'installed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceDetailsFilter('installed')}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-600"
              >
                <CheckCircle2 className="h-4 w-4" />
                نصب شده ({getDeviceStats().teachers.installed + getDeviceStats().students.installed})
              </Button>
              <Button
                variant={deviceDetailsFilter === 'not-installed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceDetailsFilter('not-installed')}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 border-red-600"
              >
                <XCircle className="h-4 w-4" />
                نصب نشده ({getDeviceStats().teachers.notInstalled + getDeviceStats().students.notInstalled})
              </Button>
            </div>

            {/* Users List */}
            <div className="space-y-2">
              <div className="max-h-96 overflow-y-auto space-y-2">
                {getDeviceDetailsList().map((item, index) => (
                  <Card key={index} className={`${
                    item.hasToken 
                      ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                      : 'bg-red-50 border-red-200 hover:bg-red-100'
                  } transition-colors`}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {/* Icon and Status */}
                        <div className={`rounded-full p-2 ${
                          item.hasToken 
                            ? item.type === 'teacher' ? 'bg-green-100' : 'bg-blue-100'
                            : 'bg-red-100'
                        }`}>
                          {item.type === 'teacher' ? (
                            <UserCheck className={`h-5 w-5 ${
                              item.hasToken ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <UserCircle className={`h-5 w-5 ${
                              item.hasToken ? 'text-blue-600' : 'text-red-600'
                            }`} />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <Badge variant={item.type === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                              {item.type === 'teacher' ? 'معلم' : 'دانش آموز'}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">کد: {item.code}</p>

                          {/* Device Details */}
                          {item.hasToken ? (
                            <div className="space-y-1">
                              {item.devices.map((device, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs bg-white/50 rounded px-2 py-1">
                                  <Smartphone className="h-3 w-3 text-gray-600" />
                                  <span className="text-gray-700">
                                    {device.deviceName || device.modelName || 'دستگاه نامشخص'}
                                  </span>
                                  {device.platform && (
                                    <Badge variant="outline" className="text-xs">
                                      {device.platform === 'android' ? 'اندروید' : 
                                       device.platform === 'ios' ? 'iOS' : device.platform}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-red-700 bg-white/50 rounded px-2 py-1">
                              <XCircle className="h-3 w-3" />
                              <span>اپلیکیشن نصب نشده</span>
                            </div>
                          )}
                        </div>

                        {/* Device Count Badge */}
                        {item.hasToken && (
                          <div className="text-center">
                            <div className="bg-white rounded-full px-3 py-1">
                              <p className="text-lg font-bold text-green-700">{item.tokenCount}</p>
                              <p className="text-xs text-gray-600">دستگاه</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {getDeviceDetailsList().length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>موردی یافت نشد</p>
                  </div>
                )}
              </div>
            </div>

            {/* Export Hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>نکته:</strong> از این لیست می‌توانید افرادی که اپلیکیشن نصب نکرده‌اند را شناسایی کرده و به آن‌ها اطلاع دهید.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeviceDetailsDialogOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Detail Dialog */}
      <Dialog open={isHistoryDetailOpen} onOpenChange={setIsHistoryDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              جزئیات اعلان
            </DialogTitle>
          </DialogHeader>

          {selectedHistoryItem && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(selectedHistoryItem.status)} className="text-base px-3 py-1">
                  {getStatusText(selectedHistoryItem.status)}
                </Badge>
              </div>

              {/* Title and Body */}
              <div className="space-y-2">
                <h3 className="font-bold text-xl">{selectedHistoryItem.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedHistoryItem.body}</p>
              </div>

              <Separator />

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{selectedHistoryItem.recipientDetails?.length || selectedHistoryItem.recipientCodes.length}</p>
                    <p className="text-sm text-gray-600">گیرنده</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <Smartphone className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{selectedHistoryItem.tokenCount}</p>
                    <p className="text-sm text-gray-600">دستگاه</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-sm font-medium">{formatDate(selectedHistoryItem.sentAt)}</p>
                    <p className="text-sm text-gray-600">زمان ارسال</p>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Recipients List */}
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  لیست گیرندگان
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                  {selectedHistoryItem.recipientDetails && selectedHistoryItem.recipientDetails.length > 0 ? (
                    selectedHistoryItem.recipientDetails.map((recipient, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {recipient.type === 'student' ? (
                          <UserCircle className="h-4 w-4 text-blue-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                        <span className="flex-1">{recipient.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {recipient.type === 'student' ? 'دانش آموز' : 'معلم'}
                        </Badge>
                        <span className="text-xs text-gray-500">{recipient.code}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      اطلاعات گیرندگان موجود نیست
                    </p>
                  )}
                </div>
              </div>

              {/* Note about tokens */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>نکته:</strong> توکن‌های push از نظر امنیتی نمایش داده نمی‌شوند، اما در پایگاه داده ذخیره شده‌اند.
                </p>
              </div> */}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryDetailOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

