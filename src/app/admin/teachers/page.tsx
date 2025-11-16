"use client";

import { useMemo, useState } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import PageHeader from "@/components/PageHeader";
import {
  AcademicCapIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { filterExamples } from "@/utils/filterHelpers";
import { useAuth } from "@/hooks/useAuth";
import PageHeaderDemo from "@/components/PageHeaderDemo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const layout: LayoutSettings = {
  direction: "rtl",
  width: "100%",

  texts: {
    addButton: "افزودن",
    editButton: "ویرایش",
    deleteButton: "حذف",
    cancelButton: "انصراف",
    clearButton: "پاک کردن",
    searchButton: "جستجو",
    advancedSearchButton: "جستجوی پیشرفته",
    applyFiltersButton: "اعمال فیلترها",
    addModalTitle: "افزودن مورد جدید",
    editModalTitle: "ویرایش مورد",
    deleteModalTitle: "تایید حذف",
    advancedSearchModalTitle: "جستجوی پیشرفته",
    deleteConfirmationMessage:
      "آیا از حذف این مورد اطمینان دارید؟ این عملیات قابل بازگشت نیست.",
    noResultsMessage: "نتیجه‌ای یافت نشد",
    loadingMessage: "در حال بارگذاری...",
    processingMessage: "در حال پردازش...",
    actionsColumnTitle: "عملیات",
    showEntriesText: "نمایش",
    pageText: "صفحه",
    ofText: "از",
    searchPlaceholder: "جستجو در تمام فیلدها...",
    selectPlaceholder: "انتخاب کنید",
    filtersAppliedText: "فیلترهای جستجوی پیشرفته اعمال شده",
    clearFiltersText: "پاک کردن فیلترها",
  },
};

type TeacherImportRow = {
  line: number;
  teacherCode: string;
  teacherName: string;
};

export default function Home({
  postedFilter,
}: {
  postedFilter?: Record<string, unknown>;
}) {
  const router = useRouter();
  const { hasPermission, isLoading, user } = useAuth();
  const [isImportWizardOpen, setImportWizardOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [rawImportData, setRawImportData] = useState("");
  const [parsedTeachers, setParsedTeachers] = useState<TeacherImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [inputDuplicates, setInputDuplicates] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const wizardSteps = [
    {
      id: 1,
      title: "چسباندن داده‌ها",
      description: "اطلاعات معلمان را از اکسل کپی کنید",
    },
    {
      id: 2,
      title: "بازبینی و تایید",
      description: "اطلاعات استخراج شده را بررسی و تکمیل کنید",
    },
  ] as const;

  const resetImportWizard = () => {
    setImportStep(1);
    setRawImportData("");
    setParsedTeachers([]);
    setParseErrors([]);
    setInputDuplicates([]);
    setIsImporting(false);
  };

  const handleImportWizardOpenChange = (open: boolean) => {
    setImportWizardOpen(open);
    if (!open) {
      resetImportWizard();
    }
  };

  const handleParseImport = () => {
    const lines = rawImportData
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const errors: string[] = [];
    const rows: TeacherImportRow[] = [];
    const seenCodes = new Set<string>();
    const duplicateCodes: string[] = [];

    lines.forEach((line, index) => {
      let columns = line.split("\t");
      if (columns.length < 2) {
        columns = line.split(",");
      }
      const teacherCode = (columns[0] ?? "").trim();
      const teacherName = columns.slice(1).join(" ").replace(/\s+/g, " ").trim();

      if (!teacherCode) {
        errors.push(`ردیف ${index + 1}: کد معلم خالی است`);
        return;
      }

      if (!teacherName) {
        errors.push(`ردیف ${index + 1}: نام معلم خالی است`);
        return;
      }

      if (seenCodes.has(teacherCode)) {
        duplicateCodes.push(teacherCode);
        return;
      }

      seenCodes.add(teacherCode);
      rows.push({
        line: index + 1,
        teacherCode,
        teacherName,
      });
    });

    if (rows.length === 0) {
      errors.push("هیچ ردیف معتبری شناسایی نشد");
    }

    setParsedTeachers(rows);
    setParseErrors(errors);
    setInputDuplicates([...new Set(duplicateCodes)]);

    if (errors.length === 0 && rows.length > 0) {
      setImportStep(2);
    }
  };

  const handleRowChange = (
    index: number,
    field: keyof Omit<TeacherImportRow, "line">,
    value: string
  ) => {
    setParsedTeachers((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const handleRemoveRow = (index: number) => {
    setParsedTeachers((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const duplicateCodesInPreview = useMemo(() => {
    const counts = parsedTeachers.reduce<Record<string, number>>((acc, row) => {
      const code = row.teacherCode.trim();
      if (!code) {
        return acc;
      }
      acc[code] = (acc[code] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .filter(([, count]) => count > 1)
      .map(([code]) => code);
  }, [parsedTeachers]);

  const hasIncompleteRows = useMemo(
    () =>
      parsedTeachers.some(
        (row) => !row.teacherCode.trim() || !row.teacherName.trim()
      ),
    [parsedTeachers]
  );

  const handleSubmitImport = async () => {
    if (
      parsedTeachers.length === 0 ||
      hasIncompleteRows ||
      duplicateCodesInPreview.length > 0
    ) {
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch("/api/teachers/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teachers: parsedTeachers.map(({ teacherCode, teacherName }) => ({
            teacherCode: teacherCode.trim(),
            teacherName: teacherName.trim(),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "خطا در وارد کردن معلمان");
        return;
      }

      if (data.insertedCount) {
        toast.success(`${data.insertedCount} معلم با موفقیت ثبت شد`);
      } else {
        toast.success("درخواست با موفقیت پردازش شد");
      }

      if (data.skippedExisting?.length) {
        toast.warning(
          `کدهای تکراری و موجود: ${data.skippedExisting.join("، ")}`
        );
      }

      if (data.duplicateInPayload?.length) {
        toast.warning(
          `کدهای تکراری در ورودی: ${data.duplicateInPayload.join("، ")}`
        );
      }

      if (data.invalidRows?.length) {
        const invalidSummary = data.invalidRows
          .map(
            (item: { line: number; reason: string }) =>
              `ردیف ${item.line}: ${item.reason}`
          )
          .join("، ");
        if (invalidSummary) {
          toast.warning(`برخی ردیف‌ها وارد نشدند: ${invalidSummary}`);
        }
      }

      resetImportWizard();
      setImportWizardOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error importing teachers:", error);
      toast.error("بروز خطا در ارتباط با سرور");
    } finally {
      setIsImporting(false);
    }
  };

  // Function to update URL with encrypted filter
  const updateFilterInURL = (filter: Record<string, unknown>) => {
    const encryptedFilter = encryptFilter(filter);
    const newURL = new URL(window.location.href);
    newURL.searchParams.set("filter", encryptedFilter);
    router.push(newURL.toString());
  };

  // Function to share with combined filters
  const shareWithFilters = (rowId: string) => {
    // Create a filter combining hardcoded filters with the specific row
    const combinedFilter = {
      ...hardcodedFilter,
      _id: rowId,
    };
    updateFilterInURL(combinedFilter);
    // console.log("Share clicked for row:", rowId);
  };

  // Function to apply filter and navigate
  const applyFilter = (filterUrl: string) => {
    router.push(filterUrl);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }


  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
        </div>
      </div>
    );
  }

  const hardcodedFilter = {
    schoolCode: user?.schoolCode,
  } as const;
  const sampleFormStructure: FormField[] = [
    {
      name: "teacherName",
      title: "نام معلم",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: true,
      readonly: false,
      listLabelColor: "#2563eb",
      defaultValue: "",
      validation: {
        requiredMessage: "نام معلم الزامی است",
      },
    },

    {
      name: "teacherCode",
      title: "کد معلم",
      type: "text",
      isShowInList: true,
      groupUniqueness: true,

      isSearchable: true,
      // isUnique: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد معلم الزامی است",
        groupUniqueMessage: "این کد معلم قبلاً ثبت شده است",
      },
    },

    {
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: false,
      isSearchable: true,
      groupUniqueness: true,

      defaultValue: user?.schoolCode,
      readonly: true,

      required: true,
      enabled: true,
      visible: false,
      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },

    {
      name: "password",
      title: "رمز عبور",
      type: "text",
      isShowInList: true,
      isSearchable: true,

      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "رمز عبور الزامی است",
      },
    },

    {
      name: "isActive",
      title: "فعال/غیرفعال",
      type: "checkbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      defaultValue: true,
    },

    {
      name: "adminAccess",
      title: "دسترسی مدیریتی",
      type: "checkbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      defaultValue: true,
    },

    {
      name: "birthDate",
      title: "تاریخ تولد",
      type: "datepicker",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      displayFormat: (value: string | number | Date) => {
        if (!value) return "";
        const date = new Date(value);
        const formatter = new Intl.DateTimeFormat("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return formatter.format(date);
      },
      datepickerStyle: {
        format: "YYYY/MM/DD",
        className: "custom-datepicker",
        calendar: "persian",
        locale: "fa",
        calendarPosition: "bottom",
        weekStartDayIndex: 6,
        timePicker: false, // Enable time picker plugin
        hideWeekDays: false,
        hideMonth: false,
        hideYear: false,
      },
      validation: {
        requiredMessage: "لطفا تاریخ تولد را وارد کنید",
      },
    },

    {
      enabled: true,
      visible: true,
      isShowInList: true,
      isSearchable: true,
      name: "phones",
      title: "شماره تلفن",
      type: "text",
      required: false,
      nestedType: "array",
      fields: [
        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "owner",
          title: "صاحب شماره",
          type: "dropdown",
          options: [
            { label: "معلم", value: "معلم" },
            { label: "شماره مجازی", value: "شماره مجازی" },
          ],
           

          
        },
        {
          name: "number",
          title: "شماره تلفن",
          type: "text",
          enabled: true,
          visible: true,
          isSearchable: true,
          isShowInList: true,
          required: false,
        },
      ],
      orientation: "horizontal",
      isOpen: true,
    },
    {
      name: "avatar",
      title: "تصویر",
      type: "file",
      isShowInList: true,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      fileConfig: {
        allowedTypes: ["image/*"],
        maxSize: 5 * 1024 * 1024, // 5MB
        directory: "avatars",
        multiple: false,
      },
      validation: {
        requiredMessage: "لطفا یک تصویر آپلود کنید",
      },
    },
    {
      enabled: true,
      visible: true,
      isShowInList: true,
      isSearchable: true,
      name: "premisions",
      title: "مجوزها",
      type: "text",
      required: false,
      nestedType: "array",
      fields: [
        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "systems",
          title: "سیستم",
          type: "dropdown",
          dataSource: {
            collectionName: "adminsystems",
            labelField: "systemName",
            valueField: "systemID",
            sortField: "systemName",
            sortOrder: "asc",
            filterQuery: { teacher: true },
          },
        },
        {
          name: "access",
          title: "دسترسی",
          type: "checkbox",
          isShowInList: true,
          isSearchable: true,
          required: false,
          enabled: true,
          visible: true,
          readonly: false,
          defaultValue: [],
          isMultiple: true,
          options: [
            { value: "show", label: "نمایش" },
            { value: "list", label: "لیست" },
            { value: "create", label: "ایجاد" },
            { value: "edit", label: "ویرایش" },
            { value: "delete", label: "حذف" },
            { value: "groupDelete", label: "حذف گروهی" },
            { value: "search", label: "جستجو" },
          ],
          validation: {
            requiredMessage: "Please select at least one interest",
          },
        },
      ],
      orientation: "horizontal",
      isOpen: false,
    },

    {
      name: "marrageStatus",
      title: "وضعیت تاهل",
      type: "dropdown",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "single", label: "مجرد" },
        { value: "married", label: "متاهل" },
      ],
    },
    {
      name: "jobStatus",
      title: " وضعیت استخدامی",
      type: "dropdown",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "official", label: "رسمی" },
        { value: "unofficial", label: "غیررسمی" },
        { value: "retired", label: "بازنشسته" },
      ],
    },
    {
      name: "paye",
      title: "پایه",
      type: "checkbox",
      isShowInList: true,
      isMultiple: true,

      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "1", label: "ابتدایی" },
        { value: "2", label: "اول متوسطه" },
        { value: "3", label: "دوم متوسطه" },
      ],
    },
    // {
    //   name: "major",
    //   title: "  رشته تحصیلی ",
    //   type: "textbox",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    // },
    // {
    //   name: "major2",
    //   title: "  رشته تدریس ",
    //   type: "textbox",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    // },
    {
      name: "personelID",
      title: "شماره پرسنلی",
      type: "textbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
    },
    {
      name: "nationalCode",
      title: "کد ملی",
      type: "textbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
    },


    {
      name: "originalService",
      title: "  منطق اصلى خدمت",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "originalServiceUnit",
      title: " واحد سارمانى اصلى",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "employmentStatus",
      title: "وضعيت اشتغال (شاغل - بارشته) ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationDegree",
      title: " مدرک تحصیلی",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationMajor",
      title: " رشته تحصيلي",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "teachingMajor",
      title: " رشته اصلى تدريس",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "teachingTitle",
      title: " عنوان تدريس برای اين آموزشگاه",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "workingHours",
      title: "ساعت موظف ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "nonWorkingHours",
      title: "ساعت غير موظف ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "bankAccount",
      title: " شماره حساب بانك  ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "bankName",
      title: " نام  بانك  ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "maritalStatus",
      title: "وضعیت تاهل ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "pot",
      title: "پست ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationStatus",
      title: "وضعيت تحصیلی",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "resignationStatus",
      title: " وضعيت ايثار كرى",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "workHistory",
      title: " سابقه کار",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "managementHistory",
      title: " سابقه معاونت و مدیریت",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "exactAddress",
      title: " ادرس دقیق",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "IDserial",
      title: "شما ه شناسنامه ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
   


  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title="تعریف معلمان مدرسه"
          subtitle="مدیریت اطلاعات معلمان مدرسه"
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {user?.userType === "school" && (
          <>
            <div className="mt-6 mb-8 flex justify-end">
              <Button
                onClick={() => setImportWizardOpen(true)}
                className="flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="h-5 w-5" />
                <span>وارد کردن گروهی معلمان</span>
              </Button>
            </div>

            <Dialog
              open={isImportWizardOpen}
              onOpenChange={handleImportWizardOpenChange}
            >
              <DialogContent className="max-w-4xl" dir="rtl">
                <DialogHeader className="text-right">
                  <DialogTitle>وارد کردن گروهی معلمان</DialogTitle>
                  <DialogDescription>
                    اطلاعات معلمان را از فایل اکسل در قالب دو ستون «کد معلم» و
                    «نام معلم» کپی و در کادر زیر جایگذاری کنید. 
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                  <div>
                    <ol className="space-y-3">
                      {wizardSteps.map((step) => (
                        <li key={step.id} className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                              importStep >= step.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {step.id}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-800">
                              {step.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {importStep === 1 ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                        <p>
                          برای بهترین نتیجه، ابتدا در اکسل ستون‌های «کد معلم» و
                          «نام معلم» را انتخاب کرده و سپس آن‌ها را کپی کنید.
                          هنگام چسباندن، ستون‌ها به صورت خودکار با تب از هم
                          جدا می‌شوند.
                        </p>
                        <div className="mt-3 rounded-md bg-white p-3 font-mono text-xs text-gray-700 shadow-inner">
                          <div>123456{`\t`}حسین احمدی</div>
                          <div>123457{`\t`}زهرا محمدی</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teacher-import-textarea">
                          لیست معلمان
                        </Label>
                        <Textarea
                          id="teacher-import-textarea"
                          value={rawImportData}
                          onChange={(event) =>
                            setRawImportData(event.target.value)
                          }
                          rows={10}
                          placeholder="کد معلم[TAB]نام معلم"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500">
                          هر ردیف باید شامل کد معلم و نام معلم باشد. بین ستون‌ها
                          از کلید tab استفاده کنید.
                        </p>
                      </div>

                      {parseErrors.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <ul className="list-disc space-y-1 pr-5">
                            {parseErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {inputDuplicates.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                          کدهای تکراری در ورودی شناسایی و نادیده گرفته شدند:
                          {" "}
                          {inputDuplicates.join("، ")}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>
                          تعداد ردیف‌های آماده ثبت: {parsedTeachers.length}
                        </span>
                        <button
                          type="button"
                          className="text-blue-600 underline-offset-4 hover:underline"
                          onClick={() => setImportStep(1)}
                          disabled={isImporting}
                        >
                          بازگشت به مرحله قبل
                        </button>
                      </div>

                      {inputDuplicates.length > 0 && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                          ردیف‌هایی با کد تکراری در ورودی اولیه حذف شدند:
                          {" "}
                          {inputDuplicates.join("، ")}
                        </div>
                      )}

                      {duplicateCodesInPreview.length > 0 && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          برای ثبت نهایی، کد معلم باید یکتا باشد. کدهای تکراری
                          فعلی: {duplicateCodesInPreview.join("، ")}
                        </div>
                      )}

                      {hasIncompleteRows && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          برخی ردیف‌ها ناقص هستند. لطفاً تمام کدها و نام‌ها را
                          تکمیل کنید.
                        </div>
                      )}

                      <div className="overflow-x-auto rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16 text-center">
                                #
                              </TableHead>
                              <TableHead className="min-w-[150px] text-right">
                                کد معلم
                              </TableHead>
                              <TableHead className="min-w-[200px] text-right">
                                نام معلم
                              </TableHead>
                              <TableHead className="w-16 text-center">
                                حذف
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedTeachers.map((row, index) => (
                              <TableRow key={`${row.line}-${index}`}>
                                <TableCell className="text-center text-sm text-gray-500">
                                  {index + 1}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={row.teacherCode}
                                    onChange={(event) =>
                                      handleRowChange(
                                        index,
                                        "teacherCode",
                                        event.target.value
                                      )
                                    }
                                    className="text-sm"
                                  />
                                  <p className="mt-1 text-xs text-gray-400">
                                    ردیف منبع: {row.line}
                                  </p>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={row.teacherName}
                                    onChange={(event) =>
                                      handleRowChange(
                                        index,
                                        "teacherName",
                                        event.target.value
                                      )
                                    }
                                    className="text-sm"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveRow(index)}
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="flex flex-row-reverse gap-3 sm:justify-start">
                  {importStep === 1 ? (
                    <>
                      <Button
                        onClick={handleParseImport}
                        disabled={!rawImportData.trim()}
                      >
                        مرحله بعد
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleImportWizardOpenChange(false)}
                      >
                        انصراف
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleSubmitImport}
                        disabled={
                          isImporting ||
                          parsedTeachers.length === 0 ||
                          hasIncompleteRows ||
                          duplicateCodesInPreview.length > 0
                        }
                      >
                        {isImporting ? "در حال ثبت..." : "ثبت معلمان"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setImportStep(1)}
                        disabled={isImporting}
                      >
                        ویرایش ورودی‌ها
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleImportWizardOpenChange(false)}
                        disabled={isImporting}
                      >
                        انصراف
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        {/* Filter Examples Section */}
        {/* <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Filter Examples</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => applyFilter(filterExamples.adminUsers())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Admins
            </button>
            <button
              onClick={() => applyFilter(filterExamples.activeUsers())}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Show Active Users
            </button>
            <button
              onClick={() => applyFilter(filterExamples.activeAdmins())}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Show Active Admins
            </button>
            <button
              onClick={() =>
                applyFilter(filterExamples.usersInCity("New York"))
              }
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Users in New York
            </button>
            <button
              onClick={() =>
                applyFilter(
                  filterExamples.usersWithSkills(["react", "typescript"])
                )
              }
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              React/TS Developers
            </button>
            <button
              onClick={() => applyFilter(filterExamples.advancedFilter())}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Advanced Filter
            </button>
          </div>
        </div> */}

        <CRUDComponent

excelExport={{
  enabled: true,
  filename: "my_data.xlsx", // Optional
  sheetName: "Data Sheet", // Optional
  buttonText: "صدور اکسل", // Optional
}}
          formStructure={sampleFormStructure}
          collectionName="teachers"
          initialFilter={hardcodedFilter}
          permissions={{
            canList: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canGroupDelete: true,
            canAdvancedSearch: true,
            canSearchAllFields: true,
          }}
          layout={layout}
          // rowActions={[
          //   {
          //     label: "View Document",
          //     link: "/document",
          //     icon: DocumentIcon,
          //   },
          //   {
          //     label: "Share",
          //     action: shareWithFilters,
          //     icon: ShareIcon,
          //   },
          // ]}
          onAfterAdd={(entity) => {
            // console.log("Entity added:", entity);
          }}
          onAfterEdit={(entity) => {
            // console.log("Entity updated:", entity);
          }}
          onAfterDelete={(id) => {
            // console.log("Entity deleted:", id);
          }}
          onAfterGroupDelete={(ids) => {
            // console.log("Entities deleted:", ids);
          }}
        />
      </div>
    </main>
  );
}
