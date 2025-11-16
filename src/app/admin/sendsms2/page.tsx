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
  MessageSquare,
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
  Filter,
  X,
  Plus,
  UserPlus,
  Eye,
  Trash2,
  Copy,
  FileText,
  Edit,
  Save,
  History,
  Calendar,
  Download,
  Cake,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

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
      phone: string;
      _id: string;
    }>;
  };
}

interface Student {
  _id: string;
  data: {
    studentCode: string;
    studentName: string;
    studentFamily: string;
    classCode: Array<{ label: string; value: string }>;
    phones?: Array<{ owner: string; number: string }>;
    phone?: string;
    groups?: string | Array<string>;
    schoolCode: string;
    birthDate?: string;
  };
}

interface Teacher {
  _id: string;
  data: {
    teacherCode: string;
    teacherName: string;
    phones?: Array<{ owner: string; number: string }>;
    schoolCode: string;
    birthDate?: string;
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

interface SmsHistory {
  _id: string;
  fromNumber: string;
  toNumbers: string[];
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt: string;
  recipientCount: number;
  recipients: Array<{
    phone: string;
    name?: string;
    type: string;
  }>;
}

interface SentMessage {
  _id: string;
  message: string;
  recipientCount: number;
  sentAt: string;
  status: "pending" | "sent" | "failed";
  senderName: string;
}

// SMS Registration form schema
const smsRegistrationSchema = z.object({
  register_personality: z.string().default("1"),
  company: z.string().optional(),
  first_name: z.string().min(1, { message: "نام الزامی است" }),
  last_name: z.string().min(1, { message: "نام خانوادگی الزامی است" }),
  father: z.string().optional(),
  gender: z.string().default("1"),
  uname: z.string().min(3, { message: "نام کاربری باید حداقل 3 کاراکتر باشد" }),
  upass: z.string().min(6, { message: "رمز عبور باید حداقل 6 کاراکتر باشد" }),
  upass_repeat: z.string().min(6, { message: "تکرار رمز عبور الزامی است" }),
  date: z.string().optional(),
  shenasname: z.string().optional(),
  melli_code: z.string().optional(),
  mob: z.string().optional(),
  tel: z.string().optional(),
  email: z.string().optional(),
  fax: z.string().optional(),
  post_code: z.string().optional(),
  addr: z.string().optional(),
  package: z.string().default("2"),
  referrer: z.string().optional(),
}).refine((data) => data.upass === data.upass_repeat, {
  message: "رمز عبور و تکرار آن باید یکسان باشند",
  path: ["upass_repeat"],
});

export default function SendSMS2Page() {
  const { user, isLoading } = useAuth();
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

  // State management
  const [activeTab, setActiveTab] = useState<string>("compose");
  const [recipientType, setRecipientType] = useState<
    "classes" | "students" | "teachers" | "groups" | "custom"
  >("classes");

  // Data states
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

  // Selection states
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [customPhones, setCustomPhones] = useState<string>("");
  
  // Phone number selection states
  const [selectedStudentPhones, setSelectedStudentPhones] = useState<Record<string, string[]>>({});
  const [selectedTeacherPhones, setSelectedTeacherPhones] = useState<Record<string, string[]>>({});
  const [selectedClassPhones, setSelectedClassPhones] = useState<Record<string, string[]>>({});
  const [selectedGroupPhones, setSelectedGroupPhones] = useState<Record<string, string[]>>({});

  // Message states
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
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState<boolean>(false);
  const [isEditTemplate, setIsEditTemplate] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  // Template creation states
  const [templateTitle, setTemplateTitle] = useState<string>("");
  const [templateContent, setTemplateContent] = useState<string>("");
  
  // SMS Registration states
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState<boolean>(false);
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [smsCredit, setSmsCredit] = useState<string>("0");
  const [isLoadingCredit, setIsLoadingCredit] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  // History states
  const [smsHistory, setSmsHistory] = useState<SmsHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearchTerm, setHistorySearchTerm] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<string>("all"); // all, sent, failed, pending
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SmsHistory | null>(null);
  const [isHistoryDetailOpen, setIsHistoryDetailOpen] = useState<boolean>(false);
  
  // Birthday states
  const [isBirthdayDialogOpen, setIsBirthdayDialogOpen] = useState<boolean>(false);
  const [birthdayPeople, setBirthdayPeople] = useState<Array<{type: 'student' | 'teacher', data: Student | Teacher}>>([]);
  const [isLoadingBirthdays, setIsLoadingBirthdays] = useState<boolean>(false);

  // Registration form
  const registrationForm = useForm<z.infer<typeof smsRegistrationSchema>>({
    resolver: zodResolver(smsRegistrationSchema),
    defaultValues: {
      register_personality: "1",
      gender: "1",
      package: "2",
      first_name: "",
      last_name: "",
      uname: "",
      upass: "",
      upass_repeat: "",
      melli_code: "",
      email: "",
      mob: "",
      tel: "",
      addr: "",
    },
  });

  // Fetch initial data
  // Load custom templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('sms-templates');
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
      localStorage.setItem('sms-templates', JSON.stringify(customTemplates));
    } else {
      localStorage.removeItem('sms-templates');
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
          console.log("Teacher has admin access");
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
      fetchSmsCredit();
      fetchSmsHistory();
    }
  }, [user, isAdminTeacher]);

  const fetchSmsCredit = async () => {
    try {
      setIsLoadingCredit(true);
      const response = await fetch("/api/sms/credit", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSmsCredit(data.credit);
      }
    } catch (error) {
      console.error("Error fetching SMS credit:", error);
    } finally {
      setIsLoadingCredit(false);
    }
  };

  const fetchAllData = async () => {
    setIsLoadingData(true);
    try {
      console.log("Fetching data for domain:", window.location.host);
      
      // Fetch classes
      const classesRes = await fetch("/api/crud/classes", {
        headers: { "x-domain": window.location.host },
      });
      console.log("Classes response status:", classesRes.status);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        console.log("Classes data:", classesData);
        setClasses(classesData || []);
      } else {
        console.error("Failed to fetch classes:", classesRes.statusText);
      }

      // Fetch students
      const studentsRes = await fetch("/api/crud/students", {
        headers: { "x-domain": window.location.host },
      });
      console.log("Students response status:", studentsRes.status);
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        console.log("Students data:", studentsData);
        setStudents(studentsData || []);
      } else {
        console.error("Failed to fetch students:", studentsRes.statusText);
      }

      // Fetch teachers
      const teachersRes = await fetch("/api/crud/teachers", {
        headers: { "x-domain": window.location.host },
      });
      console.log("Teachers response status:", teachersRes.status);
      if (teachersRes.ok) {
        const teachersData = await teachersRes.json();
        console.log("Teachers data:", teachersData);
        setTeachers(teachersData || []);
      } else {
        console.error("Failed to fetch teachers:", teachersRes.statusText);
      }

      // Fetch groups
      const groupsRes = await fetch("/api/crud/studentsgroups", {
        headers: { "x-domain": window.location.host },
      });
      console.log("Groups response status:", groupsRes.status);
      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        console.log("Groups data:", groupsData);
        setGroups(groupsData || []);
      } else {
        console.error("Failed to fetch groups:", groupsRes.statusText);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("خطا در بارگذاری اطلاعات");
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchSmsHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/crud/smsrecords", {
        headers: { "x-domain": window.location.host },
      });
      
      if (response.ok) {
        const historyData = await response.json();
        setSmsHistory(historyData || []);
      } else {
        console.error("Failed to fetch SMS history:", response.statusText);
        toast.error("خطا در بارگذاری تاریخچه پیامک‌ها");
      }
    } catch (error) {
      console.error("Error fetching SMS history:", error);
      toast.error("خطا در بارگذاری تاریخچه پیامک‌ها");
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
        
        // Auto-select all phone numbers for this student
        const allPhones = getAllPhoneNumbersForPerson(person.data as Student);
        setSelectedStudentPhones(prev => ({
          ...prev,
          [studentCode]: allPhones.map(p => p.number)
        }));
      } else {
        const teacherData = (person.data as Teacher).data;
        const teacherCode = teacherData.teacherCode;
        
        if (!selectedTeachers.includes(teacherCode)) {
          setSelectedTeachers(prev => [...prev, teacherCode]);
        }
        
        // Auto-select all phone numbers for this teacher
        const allPhones = getAllPhoneNumbersForPerson(person.data as Teacher);
        setSelectedTeacherPhones(prev => ({
          ...prev,
          [teacherCode]: allPhones.map(p => p.number)
        }));
      }
    });
    
    setIsBirthdayDialogOpen(false);
    toast.success(`${birthdayPeople.length} نفر به لیست گیرندگان اضافه شدند`);
  };

  // Get all phone numbers for a person
  const getAllPhoneNumbersForPerson = (person: Student | Teacher): Array<{owner: string, number: string}> => {
    const phones: Array<{owner: string, number: string}> = [];
    
    // Add main phone if exists (only for students)
    if ('phone' in person.data && person.data.phone) {
      phones.push({ owner: "دانش آموز", number: person.data.phone });
    }
    
    // Add phones array if exists
    if (person.data.phones && Array.isArray(person.data.phones)) {
      person.data.phones.forEach(phone => {
        if (phone.number) {
          phones.push({ owner: phone.owner, number: phone.number });
        }
      });
    }
    
    return phones;
  };

  // Handle phone number selection
  const handlePhoneSelection = (
    personCode: string,
    phoneNumber: string,
    type: 'student' | 'teacher' | 'class' | 'group'
  ) => {
    if (type === 'student') {
      setSelectedStudentPhones(prev => {
        const current = prev[personCode] || [];
        const updated = current.includes(phoneNumber)
          ? current.filter(p => p !== phoneNumber)
          : [...current, phoneNumber];
        
        return {
          ...prev,
          [personCode]: updated
        };
      });
    } else if (type === 'teacher') {
      setSelectedTeacherPhones(prev => {
        const current = prev[personCode] || [];
        const updated = current.includes(phoneNumber)
          ? current.filter(p => p !== phoneNumber)
          : [...current, phoneNumber];
        
        return {
          ...prev,
          [personCode]: updated
        };
      });
    } else if (type === 'class') {
      setSelectedClassPhones(prev => {
        const current = prev[personCode] || [];
        const updated = current.includes(phoneNumber)
          ? current.filter(p => p !== phoneNumber)
          : [...current, phoneNumber];
        
        return {
          ...prev,
          [personCode]: updated
        };
      });
    } else if (type === 'group') {
      setSelectedGroupPhones(prev => {
        const current = prev[personCode] || [];
        const updated = current.includes(phoneNumber)
          ? current.filter(p => p !== phoneNumber)
          : [...current, phoneNumber];
        
        return {
          ...prev,
          [personCode]: updated
        };
      });
    }
  };

  // Select all phones of a specific type for a person
  const selectAllPhonesOfType = (personCode: string, type: 'student' | 'teacher' | 'class' | 'group', phoneOwner: string) => {
    if (type === 'student') {
      const student = students.find(s => s.data.studentCode === personCode);
      if (student) {
        const phonesToSelect = getAllPhoneNumbersForPerson(student)
          .filter(phone => phone.owner === phoneOwner)
          .map(phone => phone.number);
        
        setSelectedStudentPhones(prev => ({
          ...prev,
          [personCode]: [...new Set([...(prev[personCode] || []), ...phonesToSelect])]
        }));
      }
    } else if (type === 'teacher') {
      const teacher = teachers.find(t => t.data.teacherCode === personCode);
      if (teacher) {
        const phonesToSelect = getAllPhoneNumbersForPerson(teacher)
          .filter(phone => phone.owner === phoneOwner)
          .map(phone => phone.number);
        
        setSelectedTeacherPhones(prev => ({
          ...prev,
          [personCode]: [...new Set([...(prev[personCode] || []), ...phonesToSelect])]
        }));
      }
    } else if (type === 'class') {
      const classItem = classes.find(c => c.data.classCode === personCode);
      if (classItem?.data.students) {
        const phonesToSelect: string[] = [];
        classItem.data.students.forEach(student => {
          if (student.phone && phoneOwner === "دانش آموز") {
            phonesToSelect.push(student.phone);
          }
          const fullStudent = students.find(s => s.data.studentCode === student.studentCode);
          if (fullStudent?.data.phones) {
            fullStudent.data.phones.forEach(phone => {
              if (phone.owner === phoneOwner) {
                phonesToSelect.push(phone.number);
              }
            });
          }
        });
        
        setSelectedClassPhones(prev => ({
          ...prev,
          [personCode]: [...new Set([...(prev[personCode] || []), ...phonesToSelect])]
        }));
      }
    } else if (type === 'group') {
      const groupStudents = students.filter((s) => {
        if (typeof s.data.groups === 'string') {
          return s.data.groups === personCode;
        } else if (Array.isArray(s.data.groups)) {
          return s.data.groups.includes(personCode);
        }
        return false;
      });
      
      const phonesToSelect: string[] = [];
      groupStudents.forEach(student => {
        if (student.data.phone && phoneOwner === "دانش آموز") {
          phonesToSelect.push(student.data.phone);
        }
        student.data.phones?.forEach(phone => {
          if (phone.owner === phoneOwner) {
            phonesToSelect.push(phone.number);
          }
        });
      });
      
      setSelectedGroupPhones(prev => ({
        ...prev,
        [personCode]: [...new Set([...(prev[personCode] || []), ...phonesToSelect])]
      }));
    }
  };

  // Clear phone selections when person is deselected
  const clearPhoneSelections = (personCode: string, type: 'student' | 'teacher' | 'class' | 'group') => {
    if (type === 'student') {
      setSelectedStudentPhones(prev => {
        const updated = { ...prev };
        delete updated[personCode];
        return updated;
      });
    } else if (type === 'teacher') {
      setSelectedTeacherPhones(prev => {
        const updated = { ...prev };
        delete updated[personCode];
        return updated;
      });
    } else if (type === 'class') {
      setSelectedClassPhones(prev => {
        const updated = { ...prev };
        delete updated[personCode];
        return updated;
      });
    } else if (type === 'group') {
      setSelectedGroupPhones(prev => {
        const updated = { ...prev };
        delete updated[personCode];
        return updated;
      });
    }
  };

  // Calculate recipient count
  const getRecipientCount = (): number => {
    let count = 0;

    selectedClasses.forEach((classCode) => {
      const selectedPhones = selectedClassPhones[classCode] || [];
      count += selectedPhones.length;
    });

    // Count selected student phone numbers
    selectedStudents.forEach(studentCode => {
      const selectedPhones = selectedStudentPhones[studentCode] || [];
      count += selectedPhones.length;
    });

    // Count selected teacher phone numbers
    selectedTeachers.forEach(teacherCode => {
      const selectedPhones = selectedTeacherPhones[teacherCode] || [];
      count += selectedPhones.length;
    });

    selectedGroups.forEach((groupCode) => {
      const selectedPhones = selectedGroupPhones[groupCode] || [];
      count += selectedPhones.length;
    });

    if (customPhones) {
      const phones = customPhones.split(",").filter((p) => p.trim());
      count += phones.length;
    }

    return count;
  };

  // Get all recipient phone numbers
  const getAllPhoneNumbers = (): string[] => {
    const phones: string[] = [];

    // From selected classes
    selectedClasses.forEach((classCode) => {
      const selectedPhones = selectedClassPhones[classCode] || [];
      phones.push(...selectedPhones);
    });

    // From selected students
    selectedStudents.forEach((studentCode) => {
      const selectedPhones = selectedStudentPhones[studentCode] || [];
      phones.push(...selectedPhones);
    });

    // From selected teachers
    selectedTeachers.forEach((teacherCode) => {
      const selectedPhones = selectedTeacherPhones[teacherCode] || [];
      phones.push(...selectedPhones);
    });

    // From selected groups
    selectedGroups.forEach((groupCode) => {
      const selectedPhones = selectedGroupPhones[groupCode] || [];
      phones.push(...selectedPhones);
    });

    // From custom phones
    if (customPhones) {
      const customPhoneList = customPhones
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);
      phones.push(...customPhoneList);
    }

    // Format and deduplicate
    const formatted = phones
      .map((phone) => {
        let formatted = phone.trim();
        if (formatted.startsWith("+98")) formatted = "0" + formatted.substring(3);
        else if (formatted.startsWith("98")) formatted = "0" + formatted.substring(2);
        else if (!formatted.startsWith("0")) formatted = "0" + formatted;
        return formatted;
      })
      .filter((p) => p.length >= 11);

    return [...new Set(formatted)];
  };

  // Get all selected phone numbers with details for confirmation
  const getAllSelectedPhoneDetails = (): Array<{owner: string, number: string, personName: string, personType: string}> => {
    const phoneDetails: Array<{owner: string, number: string, personName: string, personType: string}> = [];

    // From selected classes
    selectedClasses.forEach((classCode) => {
      const classItem = classes.find((c) => c.data.classCode === classCode);
      const selectedPhones = selectedClassPhones[classCode] || [];
      
      selectedPhones.forEach(phoneNumber => {
        // Find which student this phone belongs to
        const student = classItem?.data.students?.find(s => {
          if (s.phone === phoneNumber) return true;
          const fullStudent = students.find(st => st.data.studentCode === s.studentCode);
          return fullStudent?.data.phones?.some(p => p.number === phoneNumber);
        });
        
        const fullStudent = student ? students.find(s => s.data.studentCode === student.studentCode) : null;
        const phoneOwner = fullStudent?.data.phones?.find(p => p.number === phoneNumber)?.owner || "دانش آموز";
        
        phoneDetails.push({
          owner: phoneOwner,
          number: phoneNumber,
          personName: student ? `${student.studentName} ${student.studentlname}` : "نامشخص",
          personType: "کلاس"
        });
      });
    });

    // From selected students
    selectedStudents.forEach((studentCode) => {
      const student = students.find((s) => s.data.studentCode === studentCode);
      const selectedPhones = selectedStudentPhones[studentCode] || [];
      
      selectedPhones.forEach(phoneNumber => {
        const phoneOwner = student?.data.phones?.find(p => p.number === phoneNumber)?.owner || "دانش آموز";
        phoneDetails.push({
          owner: phoneOwner,
          number: phoneNumber,
          personName: student ? `${student.data.studentName} ${student.data.studentFamily}` : "نامشخص",
          personType: "دانش آموز"
        });
      });
    });

    // From selected teachers
    selectedTeachers.forEach((teacherCode) => {
      const teacher = teachers.find((t) => t.data.teacherCode === teacherCode);
      const selectedPhones = selectedTeacherPhones[teacherCode] || [];
      
      selectedPhones.forEach(phoneNumber => {
        const phoneOwner = teacher?.data.phones?.find(p => p.number === phoneNumber)?.owner || "معلم";
        phoneDetails.push({
          owner: phoneOwner,
          number: phoneNumber,
          personName: teacher ? teacher.data.teacherName : "نامشخص",
          personType: "معلم"
        });
      });
    });

    // From selected groups
    selectedGroups.forEach((groupCode) => {
      const group = groups.find((g) => g.data.groupCode === groupCode);
      const selectedPhones = selectedGroupPhones[groupCode] || [];
      
      selectedPhones.forEach(phoneNumber => {
        // Find which student this phone belongs to
        const groupStudents = students.filter((s) => {
          if (typeof s.data.groups === 'string') {
            return s.data.groups === groupCode;
          } else if (Array.isArray(s.data.groups)) {
            return s.data.groups.includes(groupCode);
          }
          return false;
        });
        
        const student = groupStudents.find(s => {
          if (s.data.phone === phoneNumber) return true;
          return s.data.phones?.some(p => p.number === phoneNumber);
        });
        
        const phoneOwner = student?.data.phones?.find(p => p.number === phoneNumber)?.owner || "دانش آموز";
        
        phoneDetails.push({
          owner: phoneOwner,
          number: phoneNumber,
          personName: student ? `${student.data.studentName} ${student.data.studentFamily}` : "نامشخص",
          personType: "گروه"
        });
      });
    });

    // From custom phones
    if (customPhones) {
      const customPhoneList = customPhones.split(",").map((p) => p.trim()).filter((p) => p);
      customPhoneList.forEach(phone => {
        phoneDetails.push({
          owner: "دلخواه",
          number: phone,
          personName: "شماره دلخواه",
          personType: "دلخواه"
        });
      });
    }

    return phoneDetails;
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

  // Filter history based on search and filter
  const filteredHistory = smsHistory.filter((item) => {
    const matchesSearch = item.message
      .toLowerCase()
      .includes(historySearchTerm.toLowerCase());
    const matchesFilter = 
      historyFilter === "all" || item.status === historyFilter;
    return matchesSearch && matchesFilter;
  });

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

  // Handle SMS registration submission
  const onSubmitRegistration = async (values: z.infer<typeof smsRegistrationSchema>) => {
    try {
      setIsSubmittingRegistration(true);

      const url = "/api/crud/smsregistrations";
      const method = isEditMode ? "PUT" : "POST";
      
      const requestBody = isEditMode 
        ? {
            id: currentRecordId,
            data: {
              ...values,
              schoolCode: user?.schoolCode,
              submittedBy: user?.username,
              updatedAt: new Date().toISOString()
            },
            formStructure: []
          }
        : {
            data: {
              ...values,
              schoolCode: user?.schoolCode,
              submittedBy: user?.username,
              submittedAt: new Date().toISOString(),
              status: "pending"
            },
            formStructure: []
          };

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const savedData = await response.json();
        const successMessage = isEditMode 
          ? "اطلاعات درخواست فعالسازی پیامک با موفقیت به‌روزرسانی شد"
          : "اطلاعات درخواست فعالسازی پیامک با موفقیت ذخیره شد";
        
        toast.success(successMessage);
        
        if (!isEditMode) {
          setIsEditMode(true);
          setCurrentRecordId(savedData._id);
        }
        
        registrationForm.reset({
          ...values,
          ...savedData.data
        });
        
      } else {
        const errorData = await response.json();
        toast.error(`خطا در ذخیره درخواست: ${errorData.error || "خطای نامشخص"}`);
      }
    } catch (error) {
      console.error("Error saving registration:", error);
      toast.error("خطا در ذخیره درخواست فعالسازی پیامک");
    } finally {
      setIsSubmittingRegistration(false);
    }
  };

  // Handle send SMS
  const handleSendSMS = async () => {
    if (!message.trim()) {
      toast.error("لطفاً متن پیام را وارد کنید");
      return;
    }

    const phoneNumbers = getAllPhoneNumbers();
    if (phoneNumbers.length === 0) {
      toast.error("لطفاً حداقل یک گیرنده انتخاب کنید");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          fromNumber: "9998762911",
          toNumbers: phoneNumbers,
          message: message,
        }),
      });

      if (response.ok) {
        toast.success(`پیامک به ${phoneNumbers.length} شماره ارسال شد`);
        
        // Reset form
        setMessage("");
        setSelectedClasses([]);
        setSelectedStudents([]);
        setSelectedTeachers([]);
          setSelectedGroups([]);
          setCustomPhones("");
          setSelectedStudentPhones({});
          setSelectedTeacherPhones({});
          setSelectedClassPhones({});
          setSelectedGroupPhones({});
          setIsPreviewOpen(false);
        
        // Refresh credit and history
        fetchSmsCredit();
        fetchSmsHistory();
      } else {
        toast.error("خطا در ارسال پیامک");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("خطا در ارسال پیامک");
    } finally {
      setIsSending(false);
    }
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
        title="ارسال پیامک گروهی"
        subtitle="ارسال پیامک به دانش آموزان، معلمان و اولیا"
        icon={<MessageSquare className="w-6 h-6" />}
        gradient={true}
      />

      {/* Credit Card */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">اعتبار پیامک</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoadingCredit ? (
                    <Loader2 className="h-6 w-6 animate-spin inline" />
                  ) : (
                    `${Number(smsCredit).toLocaleString()} پیامک`
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRegistrationDialogOpen(true)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-600"
              >
                <UserPlus className="h-4 w-4" />
                درخواست فعالسازی پیامک
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchSmsCredit}
                disabled={isLoadingCredit}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingCredit ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
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
            <span>ارسال پیامک</span>
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
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    انتخاب گیرندگان
                  </CardTitle>
                  <CardDescription>
                    دریافت کنندگان پیامک را انتخاب کنید
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
                      variant={recipientType === "custom" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRecipientType("custom")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      شماره دلخواه
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
                  {recipientType !== "custom" && (
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
                  )}

                  {/* Selection Actions */}
                  {recipientType !== "custom" && (
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
                            setSelectedClassPhones({});
                        } else if (recipientType === "students") {
                          setSelectedStudents([]);
                          setSelectedStudentPhones({});
                        } else if (recipientType === "teachers") {
                          setSelectedTeachers([]);
                          setSelectedTeacherPhones({});
                        } else if (recipientType === "groups") {
                          setSelectedGroups([]);
                          setSelectedGroupPhones({});
                          }
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        لغو همه
                      </Button>
                    </div>
                  )}

                  {/* Debug Info */}
                  <div className="bg-gray-100 p-2 rounded text-xs text-gray-600 mb-2">
                    Debug: Classes: {classes.length}, Students: {students.length}, Teachers: {teachers.length}, Groups: {groups.length}
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
                                    clearPhoneSelections(classItem.data.classCode, 'class');
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
                                  
                                  {/* Phone number selection */}
                                  {selectedClasses.includes(classItem.data.classCode) && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-gray-600">انتخاب شماره‌ها:</p>
                                      
                                      {/* Select All buttons */}
                                      <div className="flex gap-1 mb-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(classItem.data.classCode, 'class', 'مادر');
                                          }}
                                        >
                                          همه مادران
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(classItem.data.classCode, 'class', 'پدر');
                                          }}
                                        >
                                          همه پدران
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(classItem.data.classCode, 'class', 'دانش آموز');
                                          }}
                                        >
                                          همه دانش آموزان
                                        </Button>
                                      </div>
                                      
                                      {(() => {
                                        const allPhones: Array<{owner: string, number: string, studentName: string}> = [];
                                        classItem.data.students?.forEach(student => {
                                          if (student.phone) {
                                            allPhones.push({ owner: "دانش آموز", number: student.phone, studentName: `${student.studentName} ${student.studentlname}` });
                                          }
                                          const fullStudent = students.find(s => s.data.studentCode === student.studentCode);
                                          if (fullStudent?.data.phones) {
                                            fullStudent.data.phones.forEach(phone => {
                                              allPhones.push({ owner: phone.owner, number: phone.number, studentName: `${student.studentName} ${student.studentlname}` });
                                            });
                                          }
                                        });
                                        return allPhones.map((phone, index) => (
                                          <label key={index} className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                              checked={selectedClassPhones[classItem.data.classCode]?.includes(phone.number) || false}
                                              onCheckedChange={(checked) => {
                                                handlePhoneSelection(classItem.data.classCode, phone.number, 'class');
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-gray-600">{phone.owner}: {phone.number}</span>
                                            <span className="text-gray-400">({phone.studentName})</span>
                                          </label>
                                        ));
                                      })()}
                                    </div>
                                  )}
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
                                     clearPhoneSelections(student.data.studentCode, 'student');
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
                                  
                                  {/* Phone number selection */}
                                  {selectedStudents.includes(student.data.studentCode) && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-gray-600">انتخاب شماره‌ها:</p>
                                      {getAllPhoneNumbersForPerson(student).map((phone) => (
                                        <label key={phone.number} className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                          <Checkbox
                                            checked={selectedStudentPhones[student.data.studentCode]?.includes(phone.number) || false}
                                            onCheckedChange={(checked) => {
                                              handlePhoneSelection(student.data.studentCode, phone.number, 'student');
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-gray-600">{phone.owner}: {phone.number}</span>
                                        </label>
                                      ))}
                                    </div>
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
                                     clearPhoneSelections(teacher.data.teacherCode, 'teacher');
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
                                  
                                  {/* Phone number selection */}
                                  {selectedTeachers.includes(teacher.data.teacherCode) && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-gray-600">انتخاب شماره‌ها:</p>
                                      {getAllPhoneNumbersForPerson(teacher).map((phone) => (
                                        <label key={phone.number} className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                          <Checkbox
                                            checked={selectedTeacherPhones[teacher.data.teacherCode]?.includes(phone.number) || false}
                                            onCheckedChange={(checked) => {
                                              handlePhoneSelection(teacher.data.teacherCode, phone.number, 'teacher');
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <span className="text-gray-600">{phone.owner}: {phone.number}</span>
                                        </label>
                                      ))}
                                    </div>
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
                                .map((group) => (
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
                                    clearPhoneSelections(group.data.groupCode, 'group');
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
                                  
                                  {/* Phone number selection */}
                                  {selectedGroups.includes(group.data.groupCode) && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-xs text-gray-600">انتخاب شماره‌ها:</p>
                                      
                                      {/* Select All buttons */}
                                      <div className="flex gap-1 mb-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(group.data.groupCode, 'group', 'مادر');
                                          }}
                                        >
                                          همه مادران
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(group.data.groupCode, 'group', 'پدر');
                                          }}
                                        >
                                          همه پدران
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-xs h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            selectAllPhonesOfType(group.data.groupCode, 'group', 'دانش آموز');
                                          }}
                                        >
                                          همه دانش آموزان
                                        </Button>
                                      </div>
                                      
                                      {(() => {
                                        const groupStudents = students.filter((s) => {
                                          if (typeof s.data.groups === 'string') {
                                            return s.data.groups === group.data.groupCode;
                                          } else if (Array.isArray(s.data.groups)) {
                                            return s.data.groups.includes(group.data.groupCode);
                                          }
                                          return false;
                                        });
                                        
                                        const allPhones: Array<{owner: string, number: string, studentName: string}> = [];
                                        groupStudents.forEach(student => {
                                          if (student.data.phone) {
                                            allPhones.push({ owner: "دانش آموز", number: student.data.phone, studentName: `${student.data.studentName} ${student.data.studentFamily}` });
                                          }
                                          student.data.phones?.forEach(phone => {
                                            allPhones.push({ owner: phone.owner, number: phone.number, studentName: `${student.data.studentName} ${student.data.studentFamily}` });
                                          });
                                        });
                                        
                                        return allPhones.map((phone, index) => (
                                          <label key={index} className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                              checked={selectedGroupPhones[group.data.groupCode]?.includes(phone.number) || false}
                                              onCheckedChange={(checked) => {
                                                handlePhoneSelection(group.data.groupCode, phone.number, 'group');
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-gray-600">{phone.owner}: {phone.number}</span>
                                            <span className="text-gray-400">({phone.studentName})</span>
                                          </label>
                                        ));
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                                ))
                            )}
                          </>
                        )}

                        {recipientType === "custom" && (
                          <div className="space-y-2">
                            <Label>
                              شماره‌های موبایل (با کاما جدا کنید)
                            </Label>
                            <Textarea
                              placeholder="09123456789, 09123456788, ..."
                              value={customPhones}
                              onChange={(e) => setCustomPhones(e.target.value)}
                              className="min-h-[200px] text-right"
                              dir="rtl"
                            />
                            <p className="text-sm text-gray-500">
                              هر شماره را با کاما (,) از هم جدا کنید
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Recipients Summary */}
              {(selectedClasses.length > 0 || 
                selectedStudents.length > 0 || 
                selectedTeachers.length > 0 || 
                selectedGroups.length > 0 || 
                customPhones.trim()) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">گیرندگان انتخاب شده</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedClasses.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">کلاس‌ها ({selectedClasses.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedClasses.map((classCode) => {
                              const classItem = classes.find(c => c.data.classCode === classCode);
                              return (
                                <Badge key={classCode} variant="secondary" className="text-xs">
                                  {classItem?.data.className || classCode}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedStudents.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <UserCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-sm">دانش آموزان ({selectedStudents.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedStudents.slice(0, 5).map((studentCode) => {
                              const student = students.find(s => s.data.studentCode === studentCode);
                              return (
                                <Badge key={studentCode} variant="secondary" className="text-xs">
                                  {student ? `${student.data.studentName} ${student.data.studentFamily}` : studentCode}
                                </Badge>
                              );
                            })}
                            {selectedStudents.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{selectedStudents.length - 5} نفر دیگر
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedTeachers.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <UserCheck className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-sm">معلمان ({selectedTeachers.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedTeachers.map((teacherCode) => {
                              const teacher = teachers.find(t => t.data.teacherCode === teacherCode);
                              return (
                                <Badge key={teacherCode} variant="secondary" className="text-xs">
                                  {teacher?.data.teacherName || teacherCode}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedGroups.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-sm">گروه‌ها ({selectedGroups.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedGroups.map((groupCode) => {
                              const group = groups.find(g => g.data.groupCode === groupCode);
                              return (
                                <Badge key={groupCode} variant="secondary" className="text-xs">
                                  {group?.data.groupName || groupCode}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {customPhones.trim() && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Plus className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-sm">شماره‌های دلخواه ({customPhones.split(',').filter(p => p.trim()).length})</span>
                          </div>
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {customPhones}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Message Composer Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    متن پیام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Templates */}
                  <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">قالب‌های آماده</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsTemplateDialogOpen(true)}
                          className="text-xs h-8 px-3"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          قالب جدید
                        </Button>
                      </div>
                      
                      <Select
                        onValueChange={(value) => {
                          const template = allTemplates.find((t) => t.id === value);
                          if (template) {
                            handleUseTemplate(template);
                          }
                        }}
                      >
                        <SelectTrigger className="text-right h-10">
                          <SelectValue placeholder="انتخاب قالب..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {/* Default Templates */}
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                            قالب‌های پیش‌فرض
                          </div>
                          {messageTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id} className="text-right">
                              <div className="flex items-center justify-between w-full">
                                <span>{template.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                          
                          {/* Custom Templates */}
                          {customTemplates.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 mt-1">
                                قالب‌های شخصی
                              </div>
                              {customTemplates.map((template) => (
                                <SelectItem key={template.id} value={template.id} className="text-right">
                                  <div className="flex items-center justify-between w-full">
                                    <span>{template.title}</span>
                                    <Badge variant="secondary" className="text-xs mr-2">
                                      شخصی
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* Custom Templates Management */}
                      {customTemplates.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">مدیریت قالب‌های شخصی</Label>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {customTemplates.map((template) => (
                              <div key={template.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                                <div className="flex-1">
                                  <p className="font-medium">{template.title}</p>
                                  <p className="text-gray-500 truncate">{template.content.substring(0, 50)}...</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleEditTemplateStart(template)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <Label>پیام</Label>
                    <Textarea
                      placeholder="متن پیام خود را بنویسید..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[200px] resize-none text-right"
                      dir="rtl"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        {message.length} کاراکتر
                      </span>
                      <span className="text-gray-500">
                        تقریباً {Math.ceil(message.length / 70)} پیامک
                      </span>
                    </div>
                  </div>

                  {/* Recipients Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <p className="font-medium text-sm text-blue-900">
                      خلاصه ارسال
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">
                        تعداد گیرندگان:
                      </span>
                      <Badge variant="secondary" className="text-lg">
                        {getRecipientCount()} نفر
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-700">
                        تعداد شماره‌ها:
                      </span>
                      <Badge variant="secondary" className="text-lg">
                        {getAllPhoneNumbers().length} شماره
                      </Badge>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setIsPreviewOpen(true)}
                      disabled={!message || getAllPhoneNumbers().length === 0}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      پیش‌نمایش و ارسال
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMessage("");
                        setSelectedClasses([]);
                        setSelectedStudents([]);
                        setSelectedTeachers([]);
                          setSelectedGroups([]);
                          setCustomPhones("");
                          setSelectedStudentPhones({});
                          setSelectedTeacherPhones({});
                          setSelectedClassPhones({});
                          setSelectedGroupPhones({});
                        }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      پاک کردن همه
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                تاریخچه ارسال پیامک
              </CardTitle>
              <CardDescription>
                مشاهده و مدیریت تاریخچه پیامک‌های ارسال شده
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو در پیامک‌ها..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="pr-10 text-right"
                    dir="rtl"
                  />
                </div>
                <Select
                  value={historyFilter}
                  onValueChange={setHistoryFilter}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="فیلتر وضعیت" />
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
                  size="sm"
                  onClick={fetchSmsHistory}
                  disabled={isLoadingHistory}
                  className="w-full sm:w-auto"
                >
                  {isLoadingHistory ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  بروزرسانی
                </Button>
              </div>

              {/* History List */}
              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">در حال بارگذاری تاریخچه...</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>هیچ پیامکی یافت نشد</p>
                  </div>
                ) : (
                  filteredHistory.map((item) => (
                    <div
                      key={item._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedHistoryItem(item);
                        setIsHistoryDetailOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getStatusVariant(item.status)}>
                              {getStatusText(item.status)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {item.recipientCount} گیرنده
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {item.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.sentAt)}
                            </span>
                            <span>از: {item.fromNumber}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary Stats */}
              {smsHistory.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ارسال شده</p>
                    <p className="text-2xl font-bold text-green-600">
                      {smsHistory.filter(item => item.status === 'sent').length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ناموفق</p>
                    <p className="text-2xl font-bold text-red-600">
                      {smsHistory.filter(item => item.status === 'failed').length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">کل پیامک‌ها</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {smsHistory.length}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>پیش‌نمایش و تأیید ارسال</DialogTitle>
            <DialogDescription>
              لطفاً اطلاعات را بررسی کرده و ارسال را تأیید کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">متن پیام:</p>
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">تعداد گیرندگان</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getRecipientCount()}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">تعداد شماره‌ها</p>
                <p className="text-2xl font-bold text-green-600">
                  {getAllPhoneNumbers().length}
                </p>
                </div>
              </div>

              {/* Selected phone numbers list */}
              <div className="bg-white border rounded-lg p-4 max-h-64 overflow-y-auto">
                <p className="text-sm font-medium mb-3">لیست شماره‌های انتخابی:</p>
                <div className="space-y-2">
                  {getAllSelectedPhoneDetails().map((phoneDetail, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {phoneDetail.personType}
                        </Badge>
                        <span className="font-medium">{phoneDetail.personName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">({phoneDetail.owner})</span>
                        <span className="font-mono">{phoneDetail.number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>توجه:</strong> پس از تأیید، پیامک به تمامی شماره‌های
                انتخاب شده ارسال خواهد شد. این عملیات قابل بازگشت نیست.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              disabled={isSending}
            >
              انصراف
            </Button>
            <Button onClick={handleSendSMS} disabled={isSending}>
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
        
        {/* History Detail Dialog */}
        <Dialog open={isHistoryDetailOpen} onOpenChange={setIsHistoryDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-right">
                <History className="h-5 w-5" />
                جزئیات پیامک
              </DialogTitle>
            </DialogHeader>
            
            {selectedHistoryItem && (
              <div className="space-y-4">
                {/* Message Content */}
                <div className="space-y-2">
                  <Label className="text-right">متن پیام</Label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap text-right" dir="rtl">
                      {selectedHistoryItem.message}
                    </p>
                  </div>
                </div>

                {/* Message Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-right">وضعیت</Label>
                    <Badge variant={getStatusVariant(selectedHistoryItem.status)}>
                      {getStatusText(selectedHistoryItem.status)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">تعداد گیرندگان</Label>
                    <p className="text-sm">{selectedHistoryItem.recipientCount} نفر</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">شماره فرستنده</Label>
                    <p className="text-sm font-mono">{selectedHistoryItem.fromNumber}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-right">تاریخ ارسال</Label>
                    <p className="text-sm">{formatDate(selectedHistoryItem.sentAt)}</p>
                  </div>
                </div>

                {/* Recipients List */}
                <div className="space-y-2">
                  <Label className="text-right">لیست گیرندگان</Label>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {selectedHistoryItem.recipients?.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {recipient.type}
                          </Badge>
                          <span className="font-medium">{recipient.name || 'نامشخص'}</span>
                        </div>
                        <span className="font-mono">{recipient.phone}</span>
                      </div>
                    )) || selectedHistoryItem.toNumbers.map((phone, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span className="font-mono">{phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsHistoryDetailOpen(false)}>
                بستن
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Birthday Dialog */}
        <Dialog open={isBirthdayDialogOpen} onOpenChange={setIsBirthdayDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-right">
                <Cake className="h-5 w-5 text-pink-600" />
                تولدهای امروز 🎉
              </DialogTitle>
              <DialogDescription className="text-right">
                {birthdayPeople.length} نفر امروز تولد دارند
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {birthdayPeople.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Cake className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>امروز تولد کسی نیست</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {birthdayPeople.map((person, index) => {
                      const isStudent = person.type === 'student';
                      const data = person.data.data;
                      const name = isStudent 
                        ? `${(data as Student['data']).studentName} ${(data as Student['data']).studentFamily}`
                        : (data as Teacher['data']).teacherName;
                      const code = isStudent 
                        ? (data as Student['data']).studentCode
                        : (data as Teacher['data']).teacherCode;
                      const birthDate = (data as any).birthDate || 'نامشخص';
                      
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-pink-100 p-2 rounded-full">
                              <Cake className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Badge variant="outline" className="text-xs">
                                  {isStudent ? 'دانش آموز' : 'معلم'}
                                </Badge>
                                <span>کد: {code}</span>
                                <span>تاریخ تولد: {birthDate}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (isStudent) {
                                const studentCode = (data as Student['data']).studentCode;
                                if (!selectedStudents.includes(studentCode)) {
                                  setSelectedStudents(prev => [...prev, studentCode]);
                                  
                                  // Auto-select all phone numbers for this student
                                  const allPhones = getAllPhoneNumbersForPerson(person.data as Student);
                                  setSelectedStudentPhones(prev => ({
                                    ...prev,
                                    [studentCode]: allPhones.map(p => p.number)
                                  }));
                                  
                                  toast.success(`${name} به لیست گیرندگان اضافه شد`);
                                } else {
                                  toast.info(`${name} قبلاً انتخاب شده است`);
                                }
                              } else {
                                const teacherCode = (data as Teacher['data']).teacherCode;
                                if (!selectedTeachers.includes(teacherCode)) {
                                  setSelectedTeachers(prev => [...prev, teacherCode]);
                                  
                                  // Auto-select all phone numbers for this teacher
                                  const allPhones = getAllPhoneNumbersForPerson(person.data as Teacher);
                                  setSelectedTeacherPhones(prev => ({
                                    ...prev,
                                    [teacherCode]: allPhones.map(p => p.number)
                                  }));
                                  
                                  toast.success(`${name} به لیست گیرندگان اضافه شد`);
                                } else {
                                  toast.info(`${name} قبلاً انتخاب شده است`);
                                }
                              }
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            انتخاب
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 text-right">
                      💡 می‌توانید با کلیک روی دکمه "انتخاب همه" تمام افراد را به لیست گیرندگان اضافه کنید.
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsBirthdayDialogOpen(false)}>
                بستن
              </Button>
              {birthdayPeople.length > 0 && (
                <Button onClick={selectAllBirthdayPeople} className="bg-pink-600 hover:bg-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  انتخاب همه ({birthdayPeople.length} نفر)
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Template Creation Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-right">
                <FileText className="h-5 w-5" />
                {isEditTemplate ? "ویرایش قالب" : "ایجاد قالب جدید"}
              </DialogTitle>
              <DialogDescription className="text-right">
                {isEditTemplate 
                  ? "قالب موجود را ویرایش کنید" 
                  : "قالب جدید برای پیامک‌ها ایجاد کنید"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Template Title */}
              <div className="space-y-2">
                <Label className="text-right">عنوان قالب</Label>
                <Input
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="مثال: یادآوری تکلیف"
                  className="text-right"
                  dir="rtl"
                />
              </div>
              
              
              {/* Template Content */}
              <div className="space-y-3">
                <Label className="text-right">محتوای قالب</Label>
                <Textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="متن قالب خود را بنویسید..."
                  rows={8}
                  className="text-right resize-none"
                  dir="rtl"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>تعداد کاراکتر: {templateContent.length}</span>
                  <span>تعداد پیامک: {Math.ceil(templateContent.length / 70)}</span>
                </div>
              </div>
              
              {/* Preview */}
              {templateContent && (
                <div className="space-y-3">
                  <Label className="text-right">پیش‌نمایش</Label>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="bg-white p-4 rounded border shadow-sm">
                      <p className="text-sm whitespace-pre-wrap text-right" dir="rtl">
                        {templateContent}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleResetTemplateForm}>
                لغو
              </Button>
              <Button
                onClick={isEditTemplate ? handleEditTemplate : handleCreateTemplate}
                disabled={!templateTitle.trim() || !templateContent.trim()}
                className="flex items-center gap-2"
              >
                {isEditTemplate ? (
                  <>
                    <Edit className="h-4 w-4" />
                    ویرایش
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    ایجاد
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* SMS Registration Dialog */}
        <Dialog
          open={isRegistrationDialogOpen}
          onOpenChange={(open) => {
            setIsRegistrationDialogOpen(open);
            if (!open) {
              setIsEditMode(false);
              setCurrentRecordId(null);
              registrationForm.reset({
                register_personality: "1",
                gender: "1",
                package: "2",
                first_name: "",
                last_name: "",
                uname: "",
                upass: "",
                upass_repeat: "",
                melli_code: "",
                email: "",
                mob: "",
                tel: "",
                addr: "",
              });
            }
          }}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "ویرایش درخواست فعالسازی سرویس پیامک" : "درخواست فعالسازی سرویس پیامک"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "می‌توانید اطلاعات ذخیره شده را ویرایش کنید."
                  : "برای فعالسازی سرویس پیامک، لطفا فرم زیر را تکمیل کنید."
                }
              </DialogDescription>
            </DialogHeader>

            <Form {...registrationForm}>
              <form onSubmit={registrationForm.handleSubmit(onSubmitRegistration)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام</FormLabel>
                        <FormControl>
                          <Input placeholder="نام خود را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام خانوادگی</FormLabel>
                        <FormControl>
                          <Input placeholder="نام خانوادگی خود را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="father"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام پدر</FormLabel>
                        <FormControl>
                          <Input placeholder="نام پدر را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جنسیت</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="1">مرد</option>
                            <option value="2">زن</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="shenasname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره شناسنامه</FormLabel>
                        <FormControl>
                          <Input placeholder="شماره شناسنامه را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="melli_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد ملی</FormLabel>
                        <FormControl>
                          <Input placeholder="کد ملی را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="mob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موبایل</FormLabel>
                        <FormControl>
                          <Input placeholder="09xxxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="tel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تلفن ثابت</FormLabel>
                        <FormControl>
                          <Input placeholder="021xxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ایمیل</FormLabel>
                        <FormControl>
                          <Input placeholder="example@example.com" {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="fax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>فکس</FormLabel>
                        <FormControl>
                          <Input placeholder="شماره فکس" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UIFormField
                    control={registrationForm.control}
                    name="post_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد پستی</FormLabel>
                        <FormControl>
                          <Input placeholder="کد پستی را وارد کنید" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <UIFormField
                    control={registrationForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ تولد (شمسی)</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: 1370/06/31" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <UIFormField
                  control={registrationForm.control}
                  name="addr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>آدرس</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="آدرس دقیق را وارد کنید"
                          {...field}
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-2">اطلاعات کاربری</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UIFormField
                      control={registrationForm.control}
                      name="uname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام کاربری</FormLabel>
                          <FormControl>
                            <Input placeholder="نام کاربری" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <UIFormField
                      control={registrationForm.control}
                      name="package"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع پکیج</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="1">پکیج 1</option>
                              <option value="2">پکیج 2</option>
                              <option value="3">پکیج 3</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <UIFormField
                      control={registrationForm.control}
                      name="upass"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رمز عبور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="رمز عبور" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <UIFormField
                      control={registrationForm.control}
                      name="upass_repeat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تکرار رمز عبور</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="تکرار رمز عبور" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <UIFormField
                      control={registrationForm.control}
                      name="register_personality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع کاربری</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="1">شخصی</option>
                              <option value="2">شرکتی</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <UIFormField
                      control={registrationForm.control}
                      name="referrer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>معرف</FormLabel>
                          <FormControl>
                            <Input placeholder="معرف (اختیاری)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    type="submit"
                    disabled={isSubmittingRegistration}
                    className="w-full md:w-auto"
                  >
                    {isSubmittingRegistration && (
                      <span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    )}
                    {isEditMode ? "به‌روزرسانی درخواست" : "ثبت درخواست"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

