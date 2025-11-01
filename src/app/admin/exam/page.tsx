"use client";

import { Suspense, useState, useEffect } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import {
  DocumentIcon,
  UsersIcon,
  PrinterIcon,
  QrCodeIcon,
  CalculatorIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useAuth } from "@/hooks/useAuth";
import { usePagePermission } from "@/hooks/usePagePermission";
import { ExamParticipantsModal } from "@/components/ExamParticipantsModal";
import ScanAnswerSheetModal from "@/components/ScanAnswerSheetModal";
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

function StudentsPageContent() {
  const { user, isLoading } = useAuth();
  // const {
  //   isLoading: permissionLoading,
  //   hasAccess,
  //   error: permissionError,
  // } = usePagePermission("show");
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState("");

  // Add state for teacher's classes
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  // Add state for student's teachers
  const [studentTeachers, setStudentTeachers] = useState<string[]>([]);
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

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

  // Fetch teacher's classes when component mounts
  useEffect(() => {
    async function fetchTeacherClasses() {
      if (user && user.userType === "teacher" && !isAdminTeacher && user.username) {
        try {
          const response = await fetch(
            `/api/formbuilder/teacher-classes?teacherCode=${user.username}`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch teacher classes");
          }

          const data = await response.json();
          // Update to correctly extract classCode from the data structure
          const classCodesList = data.classes.map(
            (classItem: { data?: { classCode?: string } }) =>
              classItem.data?.classCode || ""
          );
          // Filter out empty class codes
          const validClassCodes = classCodesList.filter(
            (code: string) => code.trim() !== ""
          );
          setTeacherClasses(validClassCodes);

          if (validClassCodes.length === 0) {
            toast.warning("شما به هیچ کلاسی اختصاص داده نشده‌اید");
          }

          console.log("Teacher classes:", validClassCodes);
        } catch (error) {
          console.error("Error fetching teacher classes:", error);
          toast.error("خطا در دریافت کلاس‌های مدرس");
        }
      }
    }

    if (!isLoading && user) {
      fetchTeacherClasses();
    }
  }, [user, isLoading, isAdminTeacher]);

  // Update the student teachers useEffect to directly use the teacherCodes from the API response
  useEffect(() => {
    async function fetchStudentTeachers() {
      if (user && user.userType === "student" && user.username) {
        try {
          const response = await fetch(
            `/api/formbuilder/student-teachers?studentCode=${user.username}`,
            {
              headers: {
                "x-domain": window.location.host,
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch student's teachers");
          }

          const data = await response.json();

          // Use the teacherCodes directly from the API response
          const validTeacherCodes = data.teacherCodes || [];
          setStudentTeachers(validTeacherCodes);

          if (validTeacherCodes.length === 0) {
            toast.warning("شما با هیچ معلمی کلاس ندارید");
          } else {
            console.log(
              `دریافت ${validTeacherCodes.length} معلم برای دانش‌آموز`
            );
          }
        } catch (error) {
          console.error("Error fetching student's teachers:", error);
          toast.error("خطا در دریافت معلم‌های دانش‌آموز");
        }
      }
    }

    if (!isLoading && user) {
      fetchStudentTeachers();
    }
  }, [user, isLoading]);

  console.log("user", user);

  // //Show loading while auth or permission is being checked || permissionLoading
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
  // //Show error if permission check failed asdasda
  // if (permissionError) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-red-600 text-lg mb-4">خطا در بررسی دسترسی</div>
  //         <p className="text-gray-600">{permissionError}</p>
  //       </div>
  //     </div>
  //   );
  // }

  // //If permission check completed but user doesn't have access,
  // //the hook will redirect to /noaccess, but we can show a message while redirecting
  // if (!hasAccess) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="text-center">
  //         <div className="text-orange-600 text-lg mb-4">در حال انتقال...</div>
  //         <p className="text-gray-600">شما به این صفحه دسترسی ندارید</p>
  //       </div>
  //     </div>
  //   );
  // }

  const sampleFormStructure: FormField[] = [
    {
      name: "examCode",
      title: "کد امتحان",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: false,
      visible: true,
      populateID: {
        collection: "exam",
        field: "data.examCode",
      },
      readonly: true,
      listLabelColor: "#2563eb",
      //  defaultValue: "",
      validation: {
        requiredMessage: "کد امتحان الزامی است",
      },
    },

    {
      name: "examcreator",
      title: "معلم سازنده",
      type: "text",
      isShowInList: false,
      isSearchable: true,
      required: true,
      enabled: true,
      readonly: true,
      visible: true,
      defaultValue: user?.username || "",
      listLabelColor: "#2563eb",
    //  dataSource: {
    //   collectionName: "teachers",
    //   labelField: "teacherName",
    //   valueField: "teacherCode",
    //   sortField: "teacherCode",
    //   sortOrder: "asc" as "asc" | "desc",
    //   filterQuery: { "data.teacherCode": user?.username },
    //  },
      validation: {
        requiredMessage: "عنوان گفتگو الزامی است",
      },
    },

    {
      name: "examName",
      title: "نام امتحان",
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
        requiredMessage: "عنوان گفتگو الزامی است",
      },
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "recipients",
      title: "شرکت کنندگان",
      type: "text",
      required: false,
      fields: [
        ...(user?.userType !== "student"
          ? [
              {
                name: "students",
                title: "دانش آموزان",
                type: "autoCompleteText",
                isShowInList: true,
                isSearchable: true,
                required: false,
                enabled: true,
                visible: true,
                isMultiple: true,

                dataSource: {
                  collectionName: "students",
                  labelField: "studentName",
                  labelField2: "studentFamily",
                  valueField: "studentCode",
                  sortField: "studentCode",
                  sortOrder: "asc" as "asc" | "desc",
                  filterQuery:
                    user?.userType === "teacher" && !isAdminTeacher && teacherClasses.length > 0
                      ? {
                          //  schoolCode: "2295566177"
                          // Filter students where the classcode is in the teacher's classes
                          "classCode.value": { $in: teacherClasses },
                        }
                      : {},
                  // dependsOn: ["Grade", "major"],
                },

                autoCompleteStyle: {
                  allowNew: false,
                  maxTags: 2,
                  minLength: 2, // Only start searching after 2 characters are typed
                },
              },
            ]
          : []),
        ...(user?.userType !== "student" && (user?.userType !== "teacher" || isAdminTeacher)
          ? [
              {
                name: "groups",
                title: "گروه ها",
                type: "shadcnmultiselect",
                isShowInList: true,
                isSearchable: true,
                required: false,
                enabled: true,
                visible: true,
                isMultiple: true,

                dataSource: {
                  collectionName: "studentsgroups",
                  labelField: "groupName",
                  valueField: "groupCode",
                  sortField: "groupCode",
                  sortOrder: "asc" as "asc" | "desc",
                  filterQuery: { schoolCode: user?.schoolCode || "" },
                  // dependsOn: ["Grade", "major"],
                },
              },
            ]
          : []),
        ...(user?.userType !== "student"
          ? [
              {
                name: "classCode",
                title: "کلاس",
                type: "shadcnmultiselect",
                isShowInList: true,
                isSearchable: true,
                required: false,
                enabled: true,
                visible: true,
                isMultiple: true,

                dataSource: {
                  collectionName: "classes",
                  labelField: "className",
                  valueField: "classCode",
                  sortField: "classCode",
                  sortOrder: "asc" as "asc" | "desc",
                  filterQuery:
                    user?.userType === "teacher" && !isAdminTeacher && teacherClasses.length > 0
                      ? {
                          schoolCode: user?.schoolCode || "",
                          classCode: { $in: teacherClasses },
                        }
                      : { schoolCode: user?.schoolCode || "" },
                  // dependsOn: ["Grade", "major"],
                },
              },
            ]
          : []),

        {
          name: "teachers",
          title: "اساتید",
          type: "shadcnmultiselect",
          isShowInList: true,
          isSearchable: true,
          required: user?.userType === "student",
          enabled: true,
          visible: true,
          isMultiple: true,
          validation:
            user?.userType === "student"
              ? {
                  requiredMessage: "انتخاب حداقل یک معلم الزامی است",
                }
              : undefined,

          dataSource: {
            collectionName: "teachers",
            labelField: "teacherName",
            valueField: "teacherCode",
            sortField: "teacherCode",
            sortOrder: "asc" as "asc" | "desc",
            filterQuery:
              user?.userType === "student" && studentTeachers.length > 0
                ? {
                    schoolCode: user?.schoolCode || "",
                    teacherCode: { $in: studentTeachers },
                  }
                : { schoolCode: user?.schoolCode || "" },
            // dependsOn: ["Grade", "major"],
          },
        },
      ],
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: false,
      name: "allQuestionsInOnePage",
      title: "همه سوالات در یک صفحه",
      type: "text",
      required: false,
      fields: [
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
          name: "examTime",
          title: "زمان امتحان",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان امتحان الزامی است",
          },
        },
        {
          name: "questionsOrder",
          title: "ترتیب سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "اول تستی", value: "firstTest" },
            { label: "اول تشریحی", value: "firstEssay" },
            { label: "درهم تستی و تشریحی", value: "mixed" },
            { label: "به ترتیب افزودن", value: "byAdding" },
            { label: "به ترتیب تصادفی", value: "randomly" },
          ],
          validation: {
            requiredMessage: "لطفا یک ترتیب سوالات را انتخاب کنید",
          },
        },
      ],
      orientation: "vertical",
      isOpen: false,
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: false,
      name: "separatePages",
      title: "نمایش سوالات در صفحات مجزا",
      type: "text",
      required: false,
      fields: [
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
          name: "questionTime",
          title: "زمان هر سوال",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان هر سوال الزامی است",
          },
        },
        {
          name: "questionsOrder",
          title: "ترتیب سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "اول تستی", value: "firstTest" },
            { label: "اول تشریحی", value: "firstEssay" },
            { label: "درهم تستی و تشریحی", value: "mixed" },
            { label: "به ترتیب افزودن", value: "byAdding" },
            { label: "به ترتیب تصادفی", value: "randomly" },
          ],
          validation: {
            requiredMessage: "لطفا یک ترتیب سوالات را انتخاب کنید",
          },
        },
      ],
      orientation: "vertical",
      isOpen: false,
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: false,
      name: "imageFile",
      title: "آزمون با فایل عکس",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
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
          name: "imageFile",
          title: "فایل عکس",
          type: "file",
          isShowInList: true,
          isSearchable: false,
          required: false,
          enabled: true,
          visible: true,
          readonly: false,
          isMultiple: true,
          fileConfig: {
            allowedTypes: ["image/*"],
            maxSize: 5 * 1024 * 1024, // 5MB
            directory: "documents",
            multiple: true,
          },
          validation: {
            requiredMessage: "Please upload at least one document",
          },
        },
        {
          name: "examTime",
          title: "زمان امتحان",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان امتحان الزامی است",
          },
        },
      ],
    },

    // {
    //   name: "examType",
    //   title: "نوع امتحان",
    //   type: "dropdown",
    //   isSearchable: true,
    //   required: true,
    //   isShowInList: true,
    //   enabled: true,
    //   visible: true,
    //   readonly: false,
    //   options: [
    //     { label: "قابل ویرایش", value: "0" },
    //     { label: "غیرقابل ویرایش", value: "1" },
    //   ],
    //   validation: {
    //     requiredMessage: "لطفا یک نوع امتحان را انتخاب کنید",
    //   },
    // },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "dateTime",
      title: "تاریخ و زمان امتحان",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
        {
          name: "startDate",
          title: "تاریخ و زمان شروع",
          type: "datepicker",
          isShowInList: true,
          isSearchable: true,
          required: true,
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
            format: "YYYY/MM/DD HH:mm",
            className: "custom-datepicker",
            calendar: "persian",
            locale: "fa",
            timePicker: true, // Enable time picker plugin
            calendarPosition: "bottom",
            weekStartDayIndex: 6,
            hideWeekDays: false,
            hideMonth: false,
            hideYear: false,
          },
          validation: {
            requiredMessage: "لطفا تاریخ شروع را وارد کنید",
          },
        },

        {
          name: "endDate",
          title: "تاریخ و زمان پایان",
          type: "datepicker",
          isShowInList: true,
          isSearchable: true,
          required: true,
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
            format: "YYYY/MM/DD HH:mm",
            className: "custom-datepicker",
            calendar: "persian",
            locale: "fa",
            calendarPosition: "bottom",
            weekStartDayIndex: 6,
            timePicker: true, // Enable time picker plugin
            hideWeekDays: false,
            hideMonth: false,
            hideYear: false,
          },
          validation: {
            requiredMessage: "لطفا تاریخ پایان را وارد کنید",
          },
        },
      ],
    },
    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: false,
      name: "settings",
      title: "تنظیمات",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
        {
          name: "questionsDirection",
          title: "جهت سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          // groupUniqueness: true,
          options: [
            { label: "راست به چپ", value: "rightToLeft" },
            { label: "چپ به راست", value: "leftToRight" },
          ],
          validation: {
            requiredMessage: "لطفا یک جهت سوالات را انتخاب کنید",
          },
        },
        {
          name: "preexammessage",
          title: "پیام قبل از امتحان",
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
            requiredMessage: "پیام قبل از امتحان الزامی است",
          },
        },
        {
          name: "postexammessage",
          title: "پیام پس از امتحان",
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
            requiredMessage: "پیام قبل از امتحان الزامی است",
          },
        },

        {
          name: "userCanAttachImage",
          title: "دانش آموزان میتوانند عکس بپیونداند",
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
          name: "showScoreAfterExam",
          title: "نمایش نمره بعد از امتحان",
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
          name: "showanswersafterexam",
          title: "نمایش پاسخ بعد از امتحان",
          type: "checkbox",
          isShowInList: true,
          isSearchable: true,
          required: false,
          enabled: true,
          visible: true,
          readonly: false,
          defaultValue: true,
        },
      ],
    },

    {
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: false,
      isSearchable: true,
      defaultValue: user?.schoolCode,
      readonly: true,
      required: true,
      // groupUniqueness: true,
      enabled: true,
      visible: false,

      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },
  ] as const;

  // Define a title based on user type
  const pageTitle = () => {
    if (user?.userType === "student") {
      return "آزمون‌های دریافتی از معلمان";
    } else if (user?.userType === "teacher" && !isAdminTeacher) {
      return "آزمون‌های کلاس ها";
    } else {
      return "آزمون‌ها";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{pageTitle()}</h1>

        {user?.userType === "teacher" && !isAdminTeacher && (
          <div className="bg-blue-50 text-right border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              <span className="font-bold ml-1">توجه:</span>
              شما فقط می‌توانید برای کلاس‌هایی که به عنوان معلم به آنها اختصاص
              داده شده‌اید آزمون تعریف کنید.
            </p>
          </div>
        )}

        {user?.userType === "student" && (
          <div className="bg-green-50 border text-right border-green-200 rounded-md p-3 mb-4">
            <p className="text-sm text-green-700">
              <span className="font-bold ml-1">توجه:</span>
              به عنوان دانش‌آموز، شما فقط می‌توانید از معلم‌هایی که با آنها کلاس
              دارید آزمون دریافت کنید.
            </p>
          </div>
        )}

        {user?.userType === "student" && studentTeachers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="flex justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              امکان دریافت آزمون وجود ندارد
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              شما در حال حاضر با هیچ معلمی کلاس ندارید. لطفاً با مدیر مدرسه تماس
              بگیرید.
            </p>
          </div>
        )}

        {(user?.userType !== "student" || studentTeachers.length > 0) && (
          <CRUDComponent
            formStructure={sampleFormStructure}
            collectionName="exam"
            rowActions={[
              {
                label: "مشاهده شرکت‌کنندگان",
                action: (examId) => {
                  setSelectedExamId(examId);
                  setShowParticipantsModal(true);
                },
                icon: UsersIcon,
              },
              {
                label: "افزودن سوالات ازبانک سوالات",
                action: (examId) => {
                  window.location.href = `/admin/questionbank?examID=${examId}`;
                },
                icon: DocumentIcon,
              },
              {
                label: "افزودن سوالات ازبانک شخصی",
                action: (examId) => {
                  window.location.href = `/admin/myquestionbank?examID=${examId}`;
                },
                icon: DocumentIcon,
              },
              {
                label: "چاپ سوالات",
                action: (examId) => {
                  window.location.href = `/admin/exam/print?examID=${examId}`;
                },
                icon: (props) => (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    {...props}
                  >
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                ),
              },
              {
                label: "چاپ نتایج آزمون",
                action: (examId) => {
                  window.location.href = `/admin/exam/printresults/${examId}`;
                },
                icon: PrinterIcon,
              },
              {
                label: "اسکن پاسخ‌برگ",
                action: (examId) => {
                  setSelectedExamId(examId);
                  setShowScanModal(true);
                },
                icon: QrCodeIcon,
              },
              {
                label: "محاسبه مجدد نمرات",
                action: async (examId) => {
                  // Show confirmation dialog
                  if (window.confirm("آیا از محاسبه مجدد نمرات این آزمون اطمینان دارید؟ تمام رکوردهای قبلی در جدول examstudentsinfo حذف شده و داده‌های تازه بر اساس examparticipants ایجاد خواهند شد.")) {
                    try {
                      toast.loading("در حال محاسبه مجدد نمرات...");
                      
                      const response = await fetch(`/api/exams/${examId}/recalculate-grades`, {
                        method: "POST",
                        headers: {
                          "x-domain": window.location.host,
                        },
                      });

                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.error || "خطا در محاسبه مجدد نمرات");
                      }

                      toast.dismiss();
                      toast.success(data.message || `نمرات ${data.updatedCount} شرکت‌کننده با موفقیت محاسبه شد`);
                      
                      // Refresh the page or participants modal if open
                      if (showParticipantsModal && selectedExamId === examId) {
                        setShowParticipantsModal(false);
                        setTimeout(() => setShowParticipantsModal(true), 100);
                      }
                    } catch (error) {
                      toast.dismiss();
                      toast.error(error instanceof Error ? error.message : "خطا در محاسبه مجدد نمرات");
                    }
                  }
                },
                icon: CalculatorIcon,
              },
              {
                label: "آمار پیشرفته",
                action: (examId) => {
                  window.location.href = `/admin/exam/statistics/${examId}`;
                },
                icon: ChartBarIcon,
              },
            ]}
            initialFilter={{
              schoolCode: user?.schoolCode || "",
              ...(user?.userType === "teacher" && !isAdminTeacher
                ? {
                    "examcreator": user.username,
                  }
                : 
                {}),

                ...(user?.userType === "student"
                ? {
                    "rexamcreator": "0"
                  }
                : {}),
            }}
            // initialFilter={{
            //   schoolCode: user?.schoolCode || "",
            //   ...(user?.userType === "student" && studentTeachers.length > 0
            //     ? {
            //         "recipients.teachers": { $in: studentTeachers },
            //       }
            //     : {}),
            //   ...(user?.userType === "teacher" && teacherClasses.length > 0
            //     ? {
            //         $or: [
            //           { "recipients.classCode": { $in: teacherClasses } },
            //           { "data.teacherCode": user.username },
            //         ],
            //       }
            //     : {}),
            // }}
            layout={layout}
          />
        )}
        {/* Exam Participants Modal */}
        <ExamParticipantsModal
          isOpen={showParticipantsModal}
          onClose={() => setShowParticipantsModal(false)}
          examId={selectedExamId}
        />

        {/* Scan Answer Sheet Modal */}
        <ScanAnswerSheetModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          examId={selectedExamId}
        />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentsPageContent />
    </Suspense>
  );
}
