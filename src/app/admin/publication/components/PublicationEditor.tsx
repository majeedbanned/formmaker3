"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TinyMCEEditor from "@/components/ui/tinymce-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  Download,
  Info,
  Loader2,
  Save,
  UserPlus,
  Users,
  Variable,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  generatePDF,
  generateCombinedPDF,
  generateHTML,
  generateCombinedHTML,
  defaultPDFOptions,
} from "./PublicationDocument";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClassInfo, Student, Teacher, TemplateData, PDFOptions } from "./types";
import RichTextEditor from "@/components/ui/rich-text-editor";

interface PublicationEditorProps {
  user: {
    id: string;
    userType: string;
    schoolCode: string;
    schoolName?: string;
    username?: string;
  };
  initialTemplate?: TemplateData;
  onTemplateUpdate?: () => void;
}

interface ClassData {
  data?: {
    classCode?: string;
    className?: string;
  };
}

interface TeacherData {
  data?: {
    teacherCode?: string;
    teacherName?: string;
    teacherFamily?: string;
  };
}

interface StudentData {
  data?: {
    studentCode?: string;
    studentName?: string;
    studentFamily?: string;
  };
}

export default function PublicationEditor({
  user,
  initialTemplate,
  onTemplateUpdate,
}: PublicationEditorProps) {
  const [title, setTitle] = useState(initialTemplate?.title || "");
  const [content, setContent] = useState(initialTemplate?.content || "");
  const [selectedClasses, setSelectedClasses] = useState<ClassInfo[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isGeneratingPdfs, setIsGeneratingPdfs] = useState(false);
  const [pdfOutputType, setPdfOutputType] = useState("individual");
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(defaultPDFOptions);
  const [isPdfSettingsOpen, setIsPdfSettingsOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"html" | "pdf">(
    defaultPDFOptions.outputFormat
  );
  const [isEditMode, setIsEditMode] = useState(false);

  // Regenerate preview when options change
  useEffect(() => {
    // Only regenerate if the preview is already open
    if (isPdfPreviewOpen && selectedStudents.length > 0) {
      // Force a complete regeneration to ensure proper template layout
      setPdfUrl(null);
      setHtmlContent(null);
      setTimeout(() => {
        generatePreview();
      }, 50);
    }
  }, [pdfOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update editor content when initialTemplate changes
  useEffect(() => {
    console.log("initialTemplate changed:", initialTemplate);
    console.log("initialTemplate id:", initialTemplate?.id);
    console.log(
      "initialTemplate type:",
      initialTemplate ? typeof initialTemplate.id : "no template"
    );

    if (initialTemplate) {
      setTitle(initialTemplate.title || "");
      setContent(initialTemplate.content || "");

      // Load saved print options if they exist
      if (initialTemplate.printOptions) {
        console.log(
          "Loading saved print options:",
          initialTemplate.printOptions
        );
        setPdfOptions(initialTemplate.printOptions);
      }

      // Determine if this is an edit operation
      const isEditModeActive = !!initialTemplate.id;
      setIsEditMode(isEditModeActive);
      console.log("Edit mode:", isEditModeActive);

      // Set template title and description for quick save
      if (initialTemplate.originalTitle) {
        setTemplateTitle(initialTemplate.title || "");
        setTemplateDescription(initialTemplate.description || "");
      }

      // Show a success message
      toast.success(`قالب "${initialTemplate.title}" بارگذاری شد`);

      // If preview is already open, regenerate it with new template settings
      if (isPdfPreviewOpen && selectedStudents.length > 0) {
        setHtmlContent(null);
        setPdfUrl(null);
        setTimeout(() => {
          generatePreview();
        }, 100);
      }
    } else {
      setIsEditMode(false);
    }
  }, [initialTemplate, isPdfPreviewOpen, selectedStudents.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch classes and students on component mount
  useEffect(() => {
    const fetchClassesAndStudents = async () => {
      setIsClassesLoading(true);
      try {
        const response = await fetch("/api/formbuilder/classes", {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch classes");
        }

        const data = await response.json();

        // Filter classes based on user type
        let filteredClasses = data.classes;
        if (user.userType === "teacher") {
          // For teachers, filter classes they are assigned to
          const teacherClassesResponse = await fetch(
            `/api/formbuilder/teacher-classes?teacherCode=${user.username}`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (teacherClassesResponse.ok) {
            const teacherClassesData = await teacherClassesResponse.json();
            const teacherClassCodes = teacherClassesData.classes
              .map((c: ClassData) => c.data?.classCode || "")
              .filter((code: string) => code.trim() !== "");

            filteredClasses = data.classes.filter((c: ClassData) =>
              teacherClassCodes.includes(c.data?.classCode)
            );
          }
        }

        // Map classes to our format
        const mappedClasses = filteredClasses.map((classData: ClassData) => ({
          classCode: classData.data?.classCode || "",
          className: classData.data?.className || "",
          students: [], // Will be populated when class is selected
        }));

        setClasses(mappedClasses);

        // Also fetch teachers
        const teachersResponse = await fetch("/api/formbuilder/teachers", {
          headers: {
            "x-domain": window.location.host,
          },
        });

        if (teachersResponse.ok) {
          const teachersData = await teachersResponse.json();
          const mappedTeachers = teachersData.teachers.map(
            (teacher: TeacherData) => ({
              teacherCode: teacher.data?.teacherCode || "",
              teacherName: teacher.data?.teacherName || "",
              teacherFamily: teacher.data?.teacherFamily || "",
            })
          );
          setTeachers(mappedTeachers);
        }
      } catch (error: unknown) {
        console.error("Error fetching classes:", error);
        toast.error("خطا در دریافت اطلاعات کلاس‌ها");
      } finally {
        setIsClassesLoading(false);
      }
    };

    fetchClassesAndStudents();
  }, [user]);

  // Function to fetch students for a class
  const fetchStudentsForClass = async (classCode: string) => {
    try {
      const response = await fetch(
        `/api/formbuilder/class-students?classCode=${classCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch students for class ${classCode}`);
      }

      const data = await response.json();

      // Map students to our format
      return data.students.map((student: StudentData) => ({
        studentCode: student.data?.studentCode || "",
        studentName: student.data?.studentName || "",
        studentFamily: student.data?.studentFamily || "",
        classCode,
        className:
          classes.find((c) => c.classCode === classCode)?.className || "",
      }));
    } catch (error: unknown) {
      console.error(`Error fetching students for class ${classCode}:`, error);
      toast.error(`خطا در دریافت دانش‌آموزان کلاس ${classCode}`);
      return [];
    }
  };

  // Handle class selection
  const handleClassSelect = async (classInfo: ClassInfo) => {
    setIsLoading(true);

    // Check if class is already selected
    if (selectedClasses.some((c) => c.classCode === classInfo.classCode)) {
      // If already selected, remove it and its students
      setSelectedClasses((prev) =>
        prev.filter((c) => c.classCode !== classInfo.classCode)
      );
      setSelectedStudents((prev) =>
        prev.filter((s) => s.classCode !== classInfo.classCode)
      );
    } else {
      // If not selected, add it and fetch its students
      const students = await fetchStudentsForClass(classInfo.classCode);

      // Update the class with students
      const updatedClassInfo = {
        ...classInfo,
        students,
      };

      setSelectedClasses((prev) => [...prev, updatedClassInfo]);

      // Also add all students from this class to selected students
      setSelectedStudents((prev) => [...prev, ...students]);
    }

    setIsLoading(false);
  };

  // Filter classes based on search term
  const filteredClasses = classes.filter(
    (c) =>
      c.className.includes(classSearchTerm) ||
      c.classCode.includes(classSearchTerm)
  );

  // Get all students from selected classes
  const allStudentsFromSelectedClasses = selectedClasses.flatMap(
    (c) => c.students
  );

  // Filter students based on search term
  const filteredStudents = allStudentsFromSelectedClasses.filter(
    (s) =>
      s.studentName.includes(studentSearchTerm) ||
      s.studentFamily.includes(studentSearchTerm) ||
      s.studentCode.includes(studentSearchTerm)
  );

  // Handle Save Template
  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      toast.error("لطفاً عنوان نامه را وارد کنید");
      return;
    }

    if (!content.trim()) {
      toast.error("لطفاً محتوای نامه را وارد کنید");
      return;
    }

    if (!templateTitle.trim()) {
      toast.error("لطفاً عنوان قالب را وارد کنید");
      return;
    }

    try {
      setIsLoading(true);

      const templateData = {
        title: templateTitle,
        description: templateDescription,
        content: content,
        originalTitle: title,
        schoolCode: user.schoolCode,
        creatorId: user.id,
        creatorType: user.userType,
        printOptions: pdfOptions,
      };

      // Check if we're updating an existing template
      const isUpdating = isEditMode && initialTemplate && initialTemplate.id;

      let url = "/api/formbuilder/publication-templates";
      let method = "POST";

      // If updating, modify the URL and method
      if (isUpdating) {
        url = `/api/formbuilder/publication-templates/${initialTemplate.id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error(
          isUpdating ? "خطا در به‌روزرسانی قالب" : "خطا در ذخیره قالب"
        );
      }

      toast.success(
        isUpdating ? "قالب با موفقیت به‌روزرسانی شد" : "قالب با موفقیت ذخیره شد"
      );
      setIsTemplateDialogOpen(false);
      setTemplateTitle("");
      setTemplateDescription("");

      // Call the callback to refresh the templates list
      if (onTemplateUpdate) {
        onTemplateUpdate();
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("خطا در ذخیره قالب");
    } finally {
      setIsLoading(false);
    }
  };

  // Variables available for insertion
  const availableVariables = [
    {
      label: "نام کامل دانش‌آموز",
      value: "{{student.fullName}}",
      description: "نام و نام خانوادگی دانش‌آموز",
    },
    {
      label: "نام دانش‌آموز",
      value: "{{student.name}}",
      description: "فقط نام دانش‌آموز",
    },
    {
      label: "نام خانوادگی دانش‌آموز",
      value: "{{student.family}}",
      description: "فقط نام خانوادگی دانش‌آموز",
    },
    {
      label: "کد دانش‌آموز",
      value: "{{student.code}}",
      description: "کد دانش‌آموزی",
    },
    {
      label: "نام کلاس",
      value: "{{class.name}}",
      description: "نام کلاس دانش‌آموز",
    },
    {
      label: "کد کلاس",
      value: "{{class.code}}",
      description: "کد کلاس دانش‌آموز",
    },
    {
      label: "نام معلم",
      value: "{{teacher.fullName}}",
      description: "نام و نام خانوادگی معلم",
    },
    {
      label: "تاریخ فعلی",
      value: "{{currentDate}}",
      description: "تاریخ فعلی به شمسی",
    },
    { label: "نام مدرسه", value: "{{school.name}}", description: "نام مدرسه" },
    {
      label: "شماره ترتیبی",
      value: "{{seq}}",
      description: "شماره ترتیبی (برای هر دانش‌آموز افزایش می‌یابد)",
    },
    {
      label: "شماره تصادفی",
      value: "{{random}}",
      description: "یک شماره تصادفی بین 1000 تا 9999",
    },
  ];

  // Function to replace variables in content for a specific student
  const replaceVariables = (
    originalContent: string,
    student: Student,
    index: number = 0
  ) => {
    const currentDate = new Date().toLocaleDateString("fa-IR");
    const studentClass = classes.find((c) => c.classCode === student.classCode);
    const teachersStr = teachers
      .map((t) => `${t.teacherName} ${t.teacherFamily}`)
      .join(", ");

    // Calculate a random number within the paper count range (or 1-100 if very few students)
    const minRandomValue = 1;
    const maxRandomValue = Math.max(100, selectedStudents.length);
    const randomNumber = Math.floor(
      minRandomValue + Math.random() * (maxRandomValue - minRandomValue)
    );

    // Create a mapping of variable patterns to their values
    const variableMap: Record<string, string> = {
      "{{student.fullName}}": `${student.studentName} ${student.studentFamily}`,
      "{{student.name}}": student.studentName,
      "{{student.family}}": student.studentFamily,
      "{{student.code}}": student.studentCode,
      "{{class.name}}": studentClass?.className || "",
      "{{class.code}}": student.classCode || "",
      "{{teacher.fullName}}": teachersStr,
      "{{currentDate}}": currentDate,
      "{{school.name}}": user.schoolName || "",
      "{{seq}}": (index + 1).toString(),
      "{{random}}": randomNumber.toString(),
    };

    // Replace each variable pattern with its corresponding value
    let result = originalContent;
    for (const [pattern, value] of Object.entries(variableMap)) {
      result = result.replace(new RegExp(pattern, "g"), value);
    }

    return result;
  };

  // Generate preview content (PDF or HTML)
  const generatePreview = async () => {
    if (!title.trim()) {
      toast.error("لطفاً عنوان نامه را وارد کنید");
      return;
    }

    if (!content.trim()) {
      toast.error("لطفاً محتوای نامه را وارد کنید");
      return;
    }

    if (selectedStudents.length === 0) {
      toast.error("لطفاً حداقل یک دانش‌آموز را انتخاب کنید");
      return;
    }

    try {
      setIsGeneratingPdfs(true);

      // Clean up old URLs if they exist
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }

      // Clear previous HTML content
      setHtmlContent(null);

      // Use the current output format preference
      const outputOptions = {
        ...pdfOptions,
        outputFormat: previewMode,
      };

      // Generate preview based on selected output type and format
      if (previewMode === "pdf") {
        let pdfBlob;

        if (pdfOutputType === "combined" && selectedStudents.length > 1) {
          // Show a combined preview with the first 3 students (or fewer if there are fewer selected)
          const previewStudents = selectedStudents.slice(0, 3);
          const processedTitle = replaceVariables(title, previewStudents[0], 0);

          pdfBlob = await generateCombinedPDF({
            title: processedTitle,
            content,
            students: previewStudents,
            date: new Date().toLocaleDateString("fa-IR"),
            replaceVariables,
            options: outputOptions,
          });
        } else {
          // For individual mode or single student, just show the first student
          const firstStudent = selectedStudents[0];
          const personalizedContent = replaceVariables(
            content,
            firstStudent,
            0
          );
          const processedTitle = replaceVariables(title, firstStudent, 0);

          pdfBlob = await generatePDF({
            title: processedTitle,
            content: personalizedContent,
            student: firstStudent,
            date: new Date().toLocaleDateString("fa-IR"),
            options: outputOptions,
          });
        }

        // Create new URL for PDF
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      } else {
        // Generate HTML preview
        let html;

        if (pdfOutputType === "combined" && selectedStudents.length > 1) {
          // Show a combined preview with the first 3 students (or fewer if there are fewer selected)
          const previewStudents = selectedStudents.slice(0, 3);
          const processedTitle = replaceVariables(title, previewStudents[0], 0);

          html = await generateCombinedHTML({
            title: processedTitle,
            content,
            students: previewStudents,
            date: new Date().toLocaleDateString("fa-IR"),
            replaceVariables,
            options: outputOptions,
          });
        } else {
          // For individual mode or single student, just show the first student
          const firstStudent = selectedStudents[0];
          const personalizedContent = replaceVariables(
            content,
            firstStudent,
            0
          );
          const processedTitle = replaceVariables(title, firstStudent, 0);

          html = await generateHTML({
            title: processedTitle,
            content: personalizedContent,
            student: firstStudent,
            date: new Date().toLocaleDateString("fa-IR"),
            options: outputOptions,
          });
        }

        setHtmlContent(html);
      }

      setIsPdfPreviewOpen(true);
    } catch (error: unknown) {
      console.error("Error generating preview:", error);
      toast.error("خطا در ایجاد پیش‌نمایش");
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Handle download based on output format
  const handleDownload = async () => {
    if (pdfOptions.outputFormat === "pdf") {
      if (pdfOutputType === "individual") {
        await handleDownloadIndividualPDFs();
      } else {
        await handleDownloadCombinedPDF();
      }
    } else {
      if (pdfOutputType === "individual") {
        await handleDownloadIndividualHTML();
      } else {
        await handleDownloadCombinedHTML();
      }
    }
  };

  // Handle download all PDFs as separate files in a ZIP
  const handleDownloadIndividualPDFs = async () => {
    try {
      setIsGeneratingPdfs(true);
      toast.info("در حال آماده سازی فایل‌های جداگانه، لطفاً منتظر بمانید...");

      // Dynamic import of JSZip
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;

      // Create a new instance of JSZip
      const zip = new JSZip();

      // Generate a PDF for each selected student
      for (let i = 0; i < selectedStudents.length; i++) {
        try {
          const student = selectedStudents[i];
          const personalizedContent = replaceVariables(content, student, i);
          const processedTitle = replaceVariables(title, student, i);

          // Generate PDF using our new function
          const pdfBlob = await generatePDF({
            title: processedTitle,
            content: personalizedContent,
            student,
            date: new Date().toLocaleDateString("fa-IR"),
            options: pdfOptions,
          });

          // Add PDF to zip with a unique name
          const fileName = `${student.studentName}_${student.studentFamily}_${student.studentCode}.pdf`;
          zip.file(fileName, pdfBlob);
        } catch (err) {
          console.error(
            `Error generating PDF for student ${selectedStudents[i].studentCode}:`,
            err
          );
          // Continue with other students
        }
      }

      // Generate zip file as blob
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);

      // Set download filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadLink.download = `publications_${timestamp}.zip`;

      // Simulate click to trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
      }, 100);

      toast.success("فایل‌های PDF با موفقیت دانلود شدند");
      setIsPdfPreviewOpen(false);

      // Also save to history
      await saveToHistory();
    } catch (error) {
      console.error("Error downloading PDFs:", error);
      toast.error("خطا در دانلود فایل‌های PDF");
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Handle download all PDFs as a single combined file
  const handleDownloadCombinedPDF = async () => {
    try {
      setIsGeneratingPdfs(true);
      toast.info("در حال ترکیب همه نامه‌ها در یک فایل، لطفاً منتظر بمانید...");

      // Process the title with variables from the first student
      const processedTitle = replaceVariables(title, selectedStudents[0], 0);

      // Generate a combined PDF for all selected students
      const pdfBlob = await generateCombinedPDF({
        title: processedTitle,
        content,
        students: selectedStudents,
        date: new Date().toLocaleDateString("fa-IR"),
        replaceVariables,
        options: pdfOptions,
      });

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(pdfBlob);

      // Set download filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadLink.download = `combined_publications_${timestamp}.pdf`;

      // Simulate click to trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
      }, 100);

      toast.success("فایل PDF ترکیبی با موفقیت دانلود شد");
      setIsPdfPreviewOpen(false);

      // Also save to history
      await saveToHistory();
    } catch (error) {
      console.error("Error downloading combined PDF:", error);
      toast.error("خطا در دانلود فایل PDF ترکیبی");
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Handle download all as separate HTML files in a ZIP
  const handleDownloadIndividualHTML = async () => {
    try {
      setIsGeneratingPdfs(true);
      toast.info(
        "در حال آماده سازی فایل‌های HTML جداگانه، لطفاً منتظر بمانید..."
      );

      // Dynamic import of JSZip
      const JSZipModule = await import("jszip");
      const JSZip = JSZipModule.default;

      // Create a new instance of JSZip
      const zip = new JSZip();

      // Generate HTML for each selected student
      for (let i = 0; i < selectedStudents.length; i++) {
        try {
          const student = selectedStudents[i];
          const personalizedContent = replaceVariables(content, student, i);
          const processedTitle = replaceVariables(title, student, i);

          // Generate HTML
          const html = await generateHTML({
            title: processedTitle,
            content: personalizedContent,
            student,
            date: new Date().toLocaleDateString("fa-IR"),
            options: pdfOptions,
          });

          // Add HTML to zip with a unique name
          const fileName = `${student.studentName}_${student.studentFamily}_${student.studentCode}.html`;
          zip.file(fileName, html);
        } catch (err) {
          console.error(
            `Error generating HTML for student ${selectedStudents[i].studentCode}:`,
            err
          );
          // Continue with other students
        }
      }

      // Generate zip file as blob
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create download link
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(zipBlob);

      // Set download filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadLink.download = `publications_html_${timestamp}.zip`;

      // Simulate click to trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
      }, 100);

      toast.success("فایل‌های HTML با موفقیت دانلود شدند");
      setIsPdfPreviewOpen(false);

      // Also save to history
      await saveToHistory();
    } catch (error) {
      console.error("Error downloading HTML files:", error);
      toast.error("خطا در دانلود فایل‌های HTML");
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Handle download combined HTML file
  const handleDownloadCombinedHTML = async () => {
    try {
      setIsGeneratingPdfs(true);
      toast.info(
        "در حال ترکیب همه نامه‌ها در یک فایل HTML، لطفاً منتظر بمانید..."
      );

      // Process the title with variables from the first student
      const processedTitle = replaceVariables(title, selectedStudents[0], 0);

      // Generate a combined HTML for all selected students
      const html = await generateCombinedHTML({
        title: processedTitle,
        content,
        students: selectedStudents,
        date: new Date().toLocaleDateString("fa-IR"),
        replaceVariables,
        options: pdfOptions,
      });

      // Create download link
      const downloadLink = document.createElement("a");
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      downloadLink.href = URL.createObjectURL(blob);

      // Set download filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      downloadLink.download = `combined_publications_${timestamp}.html`;

      // Simulate click to trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(downloadLink.href);
        document.body.removeChild(downloadLink);
      }, 100);

      toast.success("فایل HTML ترکیبی با موفقیت دانلود شد");
      setIsPdfPreviewOpen(false);

      // Also save to history
      await saveToHistory();
    } catch (error) {
      console.error("Error downloading combined HTML:", error);
      toast.error("خطا در دانلود فایل HTML ترکیبی");
    } finally {
      setIsGeneratingPdfs(false);
    }
  };

  // Helper function to save publication history
  const saveToHistory = async () => {
    const historyData = {
      title,
      content,
      studentCount: selectedStudents.length,
      classCount: selectedClasses.length,
      schoolCode: user.schoolCode,
      creatorId: user.id,
      creatorType: user.userType,
    };

    await fetch("/api/formbuilder/publication-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify(historyData),
    });
  };

  // Clean up URL when component unmounts or preview closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Clean up PDF URL when dialog closes
  useEffect(() => {
    if (!isPdfPreviewOpen && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [isPdfPreviewOpen, pdfUrl]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left side - Editor */}
      <div className="w-full lg:w-2/3 space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <Label htmlFor="title" className="text-right block mb-2">
              عنوان نامه
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-right"
              placeholder="عنوان نامه را وارد کنید"
              dir="rtl"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Variable className="h-3.5 w-3.5 mr-2" />
                    درج متغیر
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2 text-right">
                    <h4 className="font-medium">متغیرهای قابل استفاده</h4>
                    <p className="text-sm text-gray-500">
                      با کلیک روی هر متغیر، آن را به متن اضافه کنید. این متغیرها
                      با اطلاعات واقعی جایگزین خواهند شد.
                    </p>
                    <ScrollArea className="h-60 rounded-md border p-2">
                      <div className="space-y-2">
                        {availableVariables.map((variable) => (
                          <div
                            key={variable.value}
                            className="p-2 rounded-md hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                            onClick={() => {
                              navigator.clipboard.writeText(variable.value);
                              toast.success(`متغیر "${variable.label}" کپی شد`);
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-gray-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{variable.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="text-right">
                              <div className="font-medium">
                                {variable.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {variable.value}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>

              <Label htmlFor="content-editor" className="text-right block">
                محتوای نامه
              </Label>
            </div>

            {/* <TinyMCEEditor
              value={content}
              onChange={setContent}
              placeholder="محتوای نامه را وارد کنید..."
              dir="rtl"
              height={400}
            /> */}

            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="محتوای نامه را وارد کنید..."
              dir="rtl"
            />
          </div>

          <div className="flex justify-between mt-6">
            <div className="flex gap-3">
              <Dialog
                open={isTemplateDialogOpen}
                onOpenChange={setIsTemplateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log("Template ID:", initialTemplate?.id);
                      console.log("Initial Template:", initialTemplate);
                      console.log("Is Edit Mode:", isEditMode);

                      // Pre-populate fields if we're editing an existing template
                      if (initialTemplate && initialTemplate.id) {
                        setTemplateTitle(initialTemplate.title || "");
                        setTemplateDescription(
                          initialTemplate.description || ""
                        );
                      } else {
                        // New template - set to current title as default
                        setTemplateTitle(title || "");
                      }
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? "به‌روزرسانی قالب" : "ذخیره به عنوان قالب"}
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl" className="text-right">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditMode ? "به‌روزرسانی قالب" : "ذخیره به عنوان قالب"}
                    </DialogTitle>
                    <DialogDescription>
                      {isEditMode
                        ? "تغییرات خود را در این قالب و تنظیمات چاپ ذخیره کنید."
                        : "این قالب و تنظیمات چاپ آن را می‌توانید در آینده برای نامه‌های مشابه استفاده کنید."}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-title">عنوان قالب</Label>
                      <Input
                        id="template-title"
                        placeholder="عنوان قالب را وارد کنید"
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-description">
                        توضیحات (اختیاری)
                      </Label>
                      <Input
                        id="template-description"
                        placeholder="توضیحات مختصر در مورد این قالب"
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsTemplateDialogOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          در حال ذخیره...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {isEditMode ? "به‌روزرسانی" : "ذخیره قالب"}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={generatePreview}
                  disabled={
                    isGeneratingPdfs ||
                    !title ||
                    !content ||
                    selectedStudents.length === 0
                  }
                  variant="default"
                  className="flex gap-1 min-w-[100px]"
                >
                  {isGeneratingPdfs ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال پردازش...
                    </>
                  ) : (
                    <>
                      <Variable className="h-4 w-4" />
                      پیش‌نمایش
                    </>
                  )}
                </Button>
              </DialogTrigger>

              <DialogContent
                className="max-w-6xl h-[90vh] flex flex-col overflow-hidden p-6"
                dir="rtl"
              >
                <DialogHeader className="flex-shrink-0 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <DialogTitle className="text-xl">پیش‌نمایش سند</DialogTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center">
                        <Label className="ml-2 whitespace-nowrap">
                          نوع پیش‌نمایش:
                        </Label>
                        <RadioGroup
                          value={previewMode}
                          onValueChange={(value) => {
                            const newMode = value as "html" | "pdf";
                            setPreviewMode(newMode);

                            // Force regenerate the preview when switching modes
                            if (newMode === "html") {
                              setHtmlContent(null);
                            } else {
                              setPdfUrl(null);
                            }

                            // Let state update, then regenerate
                            setTimeout(() => generatePreview(), 50);
                          }}
                          className="flex"
                        >
                          <div className="flex items-center ml-4">
                            <RadioGroupItem value="html" id="preview-html" />
                            <Label htmlFor="preview-html" className="mr-1.5">
                              HTML
                            </Label>
                          </div>
                          <div className="flex items-center">
                            <RadioGroupItem value="pdf" id="preview-pdf" />
                            <Label htmlFor="preview-pdf" className="mr-1.5">
                              PDF
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <Button
                        onClick={generatePreview}
                        variant="outline"
                        size="sm"
                      >
                        بارگذاری مجدد
                      </Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-grow overflow-hidden flex flex-col my-2">
                  <div className="flex-grow h-[55vh] overflow-hidden border rounded-md bg-background">
                    {isGeneratingPdfs ? (
                      <div className="flex flex-col items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>در حال ایجاد پیش‌نمایش...</p>
                      </div>
                    ) : previewMode === "pdf" && pdfUrl ? (
                      <iframe
                        src={pdfUrl}
                        className="w-full h-full"
                        title="PDF Preview"
                        style={{ border: "none" }}
                      />
                    ) : previewMode === "html" && htmlContent ? (
                      <iframe
                        srcDoc={htmlContent}
                        className="w-full h-full"
                        title="HTML Preview"
                        style={{ border: "none" }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p>پیش‌نمایش در دسترس نیست</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 flex-shrink-0 flex flex-col space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">نحوه دانلود:</p>
                      <RadioGroup
                        value={pdfOutputType}
                        onValueChange={setPdfOutputType}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="mr-2">
                            فایل‌های جداگانه (ZIP)
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem value="combined" id="combined" />
                          <Label htmlFor="combined" className="mr-2">
                            یک فایل ترکیبی با چندین صفحه
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="flex flex-col justify-between">
                      <Button
                        variant="outline"
                        className="mb-2 self-start"
                        onClick={() => setIsPdfSettingsOpen(true)}
                      >
                        <Settings className="h-4 w-4 ml-2" />
                        تنظیمات چاپ
                      </Button>

                      <div className="text-sm text-gray-500 flex items-start">
                        <Info className="h-4 w-4 ml-1 mt-0.5 flex-shrink-0" />
                        <span>
                          {pdfOutputType === "combined" &&
                          selectedStudents.length > 1
                            ? "این پیش‌نمایش حداکثر 3 صفحه اول از فایل نهایی را نمایش می‌دهد."
                            : "این پیش‌نمایش برای اولین دانش‌آموز انتخاب شده است."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-end pt-2">
                    <Button
                      onClick={handleDownload}
                      disabled={isGeneratingPdfs}
                      className="gap-1"
                    >
                      {isGeneratingPdfs ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="ml-1">
                        {pdfOutputType === "individual"
                          ? `دانلود ${selectedStudents.length} فایل مجزا`
                          : `دانلود یک فایل ترکیبی (${selectedStudents.length} صفحه)`}
                      </span>
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>

            {/* Separate Dialog for PDF Settings */}
            <Dialog
              open={isPdfSettingsOpen}
              onOpenChange={setIsPdfSettingsOpen}
            >
              <DialogContent className="w-[500px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>تنظیمات سند</DialogTitle>
                  <DialogDescription>
                    تنظیمات مربوط به نمایش و چاپ سند را تغییر دهید
                  </DialogDescription>
                </DialogHeader>

                {/* Info alert about settings being saved with template */}
                <Alert className="text-right mb-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    این تنظیمات به همراه قالب شما ذخیره خواهند شد و هنگام
                    استفاده مجدد از این قالب به صورت خودکار بارگذاری می‌شوند.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 py-4">
                  {/* Format Selection */}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="outputFormat">نوع خروجی</Label>
                    <RadioGroup
                      value={pdfOptions.outputFormat}
                      onValueChange={(value) =>
                        setPdfOptions({
                          ...pdfOptions,
                          outputFormat: value as "html" | "pdf",
                        })
                      }
                      className="flex space-x-2"
                    >
                      <div className="flex items-center space-x-2 ml-4">
                        <RadioGroupItem value="html" id="format-html" />
                        <Label htmlFor="format-html">
                          HTML (سازگاری بیشتر)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="format-pdf" />
                        <Label htmlFor="format-pdf">PDF</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="paperSize">اندازه کاغذ</Label>
                      <Select
                        value={pdfOptions.paperSize}
                        onValueChange={(value: "A4" | "A5" | "Letter") =>
                          setPdfOptions({ ...pdfOptions, paperSize: value })
                        }
                      >
                        <SelectTrigger id="paperSize">
                          <SelectValue placeholder="انتخاب اندازه کاغذ" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="A5">A5</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="orientation">جهت کاغذ</Label>
                      <Select
                        value={pdfOptions.orientation}
                        onValueChange={(value: "portrait" | "landscape") =>
                          setPdfOptions({ ...pdfOptions, orientation: value })
                        }
                      >
                        <SelectTrigger id="orientation">
                          <SelectValue placeholder="انتخاب جهت کاغذ" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="portrait">عمودی</SelectItem>
                          <SelectItem value="landscape">افقی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="font">نوع فونت</Label>
                      <Select
                        value={pdfOptions.font}
                        onValueChange={(value: string) =>
                          setPdfOptions({ ...pdfOptions, font: value })
                        }
                      >
                        <SelectTrigger id="font">
                          <SelectValue placeholder="انتخاب فونت" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="Vazirmatn">وزیر متن</SelectItem>
                          <SelectItem value="IRANSans">ایران سنس</SelectItem>
                          <SelectItem value="Tahoma">تاهما</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="margin">حاشیه (mm)</Label>
                      <Input
                        id="margin"
                        type="number"
                        value={pdfOptions.margin}
                        onChange={(e) =>
                          setPdfOptions({
                            ...pdfOptions,
                            margin: parseInt(e.target.value) || 20,
                          })
                        }
                        min="5"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="templates-per-page">
                        قالب در هر صفحه
                      </Label>
                      <Select
                        value={pdfOptions.templatesPerPage.toString()}
                        onValueChange={(value: string) => {
                          // Update the templates per page setting
                          setPdfOptions({
                            ...pdfOptions,
                            templatesPerPage: parseInt(value),
                          });

                          // If preview is open, ensure it refreshes completely
                          if (isPdfPreviewOpen && selectedStudents.length > 0) {
                            if (previewMode === "html") {
                              setHtmlContent(null);
                              setTimeout(() => generatePreview(), 50);
                            }
                          }
                        }}
                      >
                        <SelectTrigger id="templates-per-page">
                          <SelectValue placeholder="انتخاب تعداد قالب" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="1">۱ قالب</SelectItem>
                          <SelectItem value="2">۲ قالب</SelectItem>
                          <SelectItem value="4">۴ قالب</SelectItem>
                          <SelectItem value="6">۶ قالب</SelectItem>
                          <SelectItem value="8">۸ قالب</SelectItem>
                          <SelectItem value="10">۱۰ قالب</SelectItem>
                          <SelectItem value="12">۱۲ قالب</SelectItem>
                          <SelectItem value="14">۱۴ قالب</SelectItem>
                          <SelectItem value="16">۱۶ قالب</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="headerColor">رنگ هدر</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="headerColor"
                          type="color"
                          value={pdfOptions.headerColor}
                          onChange={(e) =>
                            setPdfOptions({
                              ...pdfOptions,
                              headerColor: e.target.value,
                            })
                          }
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={pdfOptions.headerColor}
                          onChange={(e) =>
                            setPdfOptions({
                              ...pdfOptions,
                              headerColor: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showHeader"
                        checked={pdfOptions.showHeader}
                        onCheckedChange={(checked) =>
                          setPdfOptions({
                            ...pdfOptions,
                            showHeader: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="showHeader">نمایش هدر</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showFooter"
                        checked={pdfOptions.showFooter}
                        onCheckedChange={(checked) =>
                          setPdfOptions({
                            ...pdfOptions,
                            showFooter: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="showFooter">نمایش فوتر</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showTitle"
                        checked={pdfOptions.showTitle}
                        onCheckedChange={(checked) =>
                          setPdfOptions({
                            ...pdfOptions,
                            showTitle: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="showTitle">نمایش عنوان</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showWatermark"
                        checked={pdfOptions.showWatermark}
                        onCheckedChange={(checked) =>
                          setPdfOptions({
                            ...pdfOptions,
                            showWatermark: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="showWatermark">نمایش واترمارک</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showStudentInfo"
                        checked={pdfOptions.showStudentInfo}
                        onCheckedChange={(checked) =>
                          setPdfOptions({
                            ...pdfOptions,
                            showStudentInfo: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="showStudentInfo">
                        نمایش اطلاعات دانش‌آموز
                      </Label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="footerText">متن فوتر</Label>
                    <Input
                      id="footerText"
                      value={pdfOptions.footerText}
                      onChange={(e) =>
                        setPdfOptions({
                          ...pdfOptions,
                          footerText: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsPdfSettingsOpen(false)}>
                    تایید
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Alert className="text-right">
          <Info className="h-4 w-4" />
          <AlertTitle>نکته مهم</AlertTitle>
          <AlertDescription>
            از متغیرهایی مانند {"{{student.fullName}}"} در متن استفاده کنید.
            هنگام تولید PDF، این متغیرها با اطلاعات واقعی دانش‌آموزان جایگزین
            می‌شوند.
          </AlertDescription>
        </Alert>
      </div>

      {/* Right side - Selections */}
      <div className="w-full lg:w-1/3 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-between">
              <span>انتخاب گیرندگان</span>
              <Badge variant="outline" className="text-xs">
                {selectedStudents.length} دانش‌آموز انتخاب شده
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="classes" dir="rtl">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="classes">انتخاب کلاس</TabsTrigger>
                <TabsTrigger value="students">انتخاب دانش‌آموز</TabsTrigger>
              </TabsList>

              <TabsContent value="classes">
                <div className="space-y-4">
                  <Input
                    placeholder="جستجوی کلاس..."
                    value={classSearchTerm}
                    onChange={(e) => setClassSearchTerm(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />

                  {isClassesLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <ScrollArea className="h-64 rounded-md border">
                      {filteredClasses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                          <Users className="h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            کلاسی یافت نشد
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 space-y-2">
                          {filteredClasses.map((classInfo) => (
                            <div
                              key={classInfo.classCode}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                                selectedClasses.some(
                                  (c) => c.classCode === classInfo.classCode
                                )
                                  ? "bg-blue-50 border border-blue-200"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                              onClick={() => handleClassSelect(classInfo)}
                            >
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {selectedClasses.some(
                                  (c) => c.classCode === classInfo.classCode
                                ) ? (
                                  <Check className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <div className="h-4 w-4" />
                                )}
                                <span className="text-sm font-medium">
                                  {classInfo.className}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                کد: {classInfo.classCode}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  )}

                  {selectedClasses.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2 text-right">
                        کلاس‌های انتخاب شده:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedClasses.map((classInfo) => (
                          <Badge
                            key={classInfo.classCode}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {classInfo.className}
                            <button
                              className="ml-1 h-3.5 w-3.5 rounded-full text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClassSelect(classInfo);
                              }}
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="students">
                <div className="space-y-4">
                  <Input
                    placeholder="جستجوی دانش‌آموز..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="text-right"
                    dir="rtl"
                  />

                  {selectedClasses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 p-4 text-center border rounded-md">
                      <UserPlus className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        ابتدا یک کلاس را انتخاب کنید
                      </p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 p-4 text-center border rounded-md">
                      <Users className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        دانش‌آموزی یافت نشد
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <Checkbox
                            id="select-all"
                            checked={
                              filteredStudents.length > 0 &&
                              filteredStudents.every((s) =>
                                selectedStudents.some(
                                  (selected) =>
                                    selected.studentCode === s.studentCode
                                )
                              )
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                // Add all filtered students that aren't already selected
                                const newStudents = filteredStudents.filter(
                                  (s) =>
                                    !selectedStudents.some(
                                      (selected) =>
                                        selected.studentCode === s.studentCode
                                    )
                                );
                                setSelectedStudents([
                                  ...selectedStudents,
                                  ...newStudents,
                                ]);
                              } else {
                                // Remove all filtered students
                                setSelectedStudents(
                                  selectedStudents.filter(
                                    (s) =>
                                      !filteredStudents.some(
                                        (filtered) =>
                                          filtered.studentCode === s.studentCode
                                      )
                                  )
                                );
                              }
                            }}
                          />
                          <Label htmlFor="select-all" className="text-xs mr-2">
                            انتخاب همه
                          </Label>
                        </div>

                        {filteredStudents.map((student) => (
                          <div
                            key={student.studentCode}
                            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                            onClick={() => {
                              // Add or remove student from selection
                              if (
                                selectedStudents.some(
                                  (s) => s.studentCode === student.studentCode
                                )
                              ) {
                                setSelectedStudents((prev) =>
                                  prev.filter(
                                    (s) => s.studentCode !== student.studentCode
                                  )
                                );
                              } else {
                                setSelectedStudents((prev) => [
                                  ...prev,
                                  student,
                                ]);
                              }
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {student.studentName} {student.studentFamily}
                              </span>
                              <span className="text-sm text-gray-500">
                                {student.studentCode}
                              </span>
                            </div>
                            <Checkbox
                              checked={selectedStudents.some(
                                (s) => s.studentCode === student.studentCode
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Add student if not already selected
                                  if (
                                    !selectedStudents.some(
                                      (s) =>
                                        s.studentCode === student.studentCode
                                    )
                                  ) {
                                    setSelectedStudents((prev) => [
                                      ...prev,
                                      student,
                                    ]);
                                  }
                                } else {
                                  // Remove student
                                  setSelectedStudents((prev) =>
                                    prev.filter(
                                      (s) =>
                                        s.studentCode !== student.studentCode
                                    )
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {selectedStudents.length > 0 && (
                    <div>
                      <p className="text-sm text-right">
                        {selectedStudents.length} دانش‌آموز انتخاب شده است
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
