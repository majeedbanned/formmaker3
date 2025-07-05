"use client";

import { Suspense, useState, useEffect } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import {
  DocumentIcon,
  ShareIcon,
  ChartBarIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings, RowAction } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Import to get Persian date
import { getPersianDate } from "@/utils/dateUtils";
import PageHeader from "@/components/PageHeader";

// Statistics Modal Component
function StatisticsModal({
  isOpen,
  onClose,
  mailId,
}: {
  isOpen: boolean;
  onClose: () => void;
  mailId: string | null;
}) {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "read" | "unread">(
    "overview"
  );

  useEffect(() => {
    if (isOpen && mailId) {
      fetchStatistics();
    }
  }, [isOpen, mailId]);

  const fetchStatistics = async () => {
    if (!mailId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messages/statistics?mailId=${mailId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      toast.error("خطا در دریافت آمار پیام");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">آمار پیام</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : statistics ? (
          <div className="p-6">
            {/* Message Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-lg mb-2">
                {statistics.messageInfo.title}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">فرستنده:</span>{" "}
                  {statistics.messageInfo.sendername}
                </div>
                <div>
                  <span className="font-medium">تاریخ ارسال:</span>{" "}
                  {statistics.messageInfo.persiandate}
                </div>
              </div>
            </div>

            {/* Statistics Overview */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {statistics.totalRecipients}
                </div>
                <div className="text-sm text-blue-800">کل گیرندگان</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statistics.readCount}
                </div>
                <div className="text-sm text-green-800">خوانده شده</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {statistics.unreadCount}
                </div>
                <div className="text-sm text-orange-800">خوانده نشده</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  میزان خوانده شدن
                </span>
                <span className="text-sm text-gray-500">
                  {statistics.readPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${statistics.readPercentage}%` }}
                ></div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "overview"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ChartBarIcon className="h-5 w-5 inline ml-2" />
                  خلاصه
                </button>
                <button
                  onClick={() => setActiveTab("read")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "read"
                      ? "border-green-500 text-green-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <EyeIcon className="h-5 w-5 inline ml-2" />
                  خوانده شده ({statistics.readCount})
                </button>
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "unread"
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <ClockIcon className="h-5 w-5 inline ml-2" />
                  خوانده نشده ({statistics.unreadCount})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="text-center text-gray-600">
                    آمار کلی پیام در بالا نمایش داده شده است. برای مشاهده جزئیات
                    بیشتر، تب‌های "خوانده شده" یا "خوانده نشده" را انتخاب کنید.
                  </div>
                </div>
              )}

              {activeTab === "read" && (
                <div className="space-y-3">
                  {statistics.readRecipients.map(
                    (recipient: any, index: number) => (
                      <div
                        key={index}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <UserIcon className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="font-medium text-green-800">
                                {recipient.name}
                              </div>
                              <div className="text-sm text-green-600">
                                {recipient.type === "student"
                                  ? "دانش‌آموز"
                                  : "معلم"}{" "}
                                - کلاس: {recipient.classCode}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="text-sm text-green-600">
                              {recipient.readPersianDate}
                            </div>
                            <div className="text-xs text-green-500">
                              {new Date(recipient.readTime).toLocaleTimeString(
                                "fa-IR"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {statistics.readRecipients.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      هیچ گیرنده‌ای هنوز پیام را نخوانده است
                    </div>
                  )}
                </div>
              )}

              {activeTab === "unread" && (
                <div className="space-y-3">
                  {statistics.unreadRecipients.map(
                    (recipient: any, index: number) => (
                      <div
                        key={index}
                        className="bg-orange-50 border border-orange-200 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <UserIcon className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="font-medium text-orange-800">
                              {recipient.name}
                            </div>
                            <div className="text-sm text-orange-600">
                              {recipient.type === "student"
                                ? "دانش‌آموز"
                                : "معلم"}{" "}
                              - کلاس: {recipient.classCode}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                  {statistics.unreadRecipients.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      همه گیرندگان پیام را خوانده‌اند
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">خطا در بارگذاری آمار</div>
          </div>
        )}
      </div>
    </div>
  );
}

const layout: LayoutSettings = {
  direction: "rtl",
  width: "100%",

  texts: {
    addButton: "ارسال پیام جدید",
    editButton: "ویرایش",
    deleteButton: "حذف",
    cancelButton: "انصراف",
    clearButton: "پاک کردن",
    searchButton: "جستجو",
    advancedSearchButton: "جستجوی پیشرفته",
    applyFiltersButton: "اعمال فیلترها",
    addModalTitle: "",
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
  const { initialFilter } = useInitialFilter();
  const { user, isLoading } = useAuth();
  // Add state for teacher's classes
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  // Add state for student's teachers
  const [studentTeachers, setStudentTeachers] = useState<string[]>([]);
  // Statistics modal state
  const [showStatistics, setShowStatistics] = useState(false);
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);

  // Fetch teacher's classes when component mounts
  useEffect(() => {
    async function fetchTeacherClasses() {
      if (user && user.userType === "teacher" && user.username) {
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
            (classItem: any) => classItem.data?.classCode || ""
          );
          // Filter out empty class codes
          const validClassCodes = classCodesList.filter(
            (code: string) => code.trim() !== ""
          );
          console.log("validClassCodes", validClassCodes);
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
  }, [user, isLoading]);

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

  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/students?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };

  // Create base form structure
  const baseFormStructure: FormField[] = [
    {
      name: "sender",
      title: "ارسال کننده",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: true,
      readonly: true,
      listLabelColor: "#2563eb",
      defaultValue: user?.name,
      validation: {
        requiredMessage: "ارسال کننده الزامی است",
      },
    },
    {
      name: "senderCode",
      title: "کد ارسال کننده",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: false,
      readonly: true,
      listLabelColor: "#2563eb",
      defaultValue: user?.username,
      validation: {
        requiredMessage: "ارسال کننده الزامی   است",
      },
    },
    {
      name: "title",
      title: "عنوان پیام",
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
        requiredMessage: "عنوان پیام الزامی است",
      },
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "recipients",
      title: "گیرندگان",
      type: "text",
      required: false,
      fields: [
        // @ts-ignore
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
                  sortOrder: "asc",
                  // For teachers, filter students who are in their classes
                  filterQuery:
                    user?.userType === "teacher" && teacherClasses.length > 0
                      ? {
                          "classCode.value": { $in: teacherClasses },
                        }
                      : {},
                },

                autoCompleteStyle: {
                  allowNew: false,
                  maxTags: 2,
                  minLength: 2,
                },
              },
            ]
          : []),
        // @ts-ignore
        ...(user?.userType !== "student" && user?.userType !== "teacher"
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
                  sortOrder: "asc" as const,
                  filterQuery: { schoolCode: user?.schoolCode || "" },
                },
              },
            ]
          : []),

        // @ts-ignore
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
                  sortOrder: "asc",
                  filterQuery:
                    user?.userType === "teacher" && teacherClasses.length > 0
                      ? {
                          schoolCode: user?.schoolCode || "",
                          classCode: { $in: teacherClasses },
                        }
                      : { schoolCode: user?.schoolCode || "" },
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
            sortOrder: "asc",
            filterQuery:
              user?.userType === "student" && studentTeachers.length > 0
                ? {
                    schoolCode: user?.schoolCode || "",
                    teacherCode: { $in: studentTeachers },
                  }
                : { schoolCode: user?.schoolCode || "" },
          },
        },
      ],
    },

    {
      name: "message",
      title: "متن پیام",
      type: "richtextbox",
      isShowInList: true,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "متن پیام الزامی است",
      },
      placeholder: "متن پیام را وارد کنید...",
      className: "min-h-[200px]",
    },
    {
      name: "attachments",
      title: "فایل ها",
      type: "file",
      isShowInList: true,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      isMultiple: true,
      fileConfig: {
        allowedTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        maxSize: 10 * 1024 * 1024, // 10MB
        directory: "documents",
        multiple: true,
      },
      validation: {
        requiredMessage: "Please upload at least one document",
      },
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

  // Use the updated form structure with filtered classes for teachers
  const sampleFormStructure = baseFormStructure;

  // Define row actions
  const rowActions: RowAction[] = [
    {
      label: "مشاهده آمار پیام",
      icon: ChartBarIcon,
      action: (rowId: string, rowData?: Record<string, unknown>) => {
        setSelectedMailId(rowId);
        setShowStatistics(true);
      },
    },
  ];

  // Define a title based on user type
  const pageTitle = () => {
    if (user?.userType === "student") {
      return "ارسال پیام به معلمان";
    } else if (user?.userType === "teacher") {
      return "ارسال پیام به کلاس ها";
    } else {
      return "ارسال پیام";
    }
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title={pageTitle()}
          subtitle="مدیریت اطلاعات پیام ها"
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {user?.userType === "teacher" && (
          <div className="bg-blue-50 text-right border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              <span className="font-bold ml-1">توجه:</span>
              شما فقط می‌توانید به کلاس‌هایی که به عنوان معلم به آنها اختصاص
              داده شده‌اید پیام ارسال کنید.
            </p>
          </div>
        )}

        {user?.userType === "student" && (
          <div className="bg-green-50 border text-right border-green-200 rounded-md p-3 mb-4">
            <p className="text-sm text-green-700">
              <span className="font-bold ml-1">توجه:</span>
              به عنوان دانش‌آموز، شما فقط می‌توانید به معلم‌هایی که با آنها کلاس
              دارید پیام ارسال کنید.
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
              امکان ارسال پیام وجود ندارد
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
            collectionName="emessages"
            //  initialFilter={initialFilter as Record<string, unknown>}
            initialFilter={{
              // schoolCode: user?.schoolCode || "",
              senderCode: user?.username || "",
            }}
            layout={layout}
            rowActions={rowActions}
            onAfterAdd={async (entity: any) => {
              console.log("Entity added:", entity);

              try {
                // Get the current Persian date
                const persianDate = getPersianDate();

                // Create a base message object with common fields
                const baseMessage = {
                  mailId: entity.recordId,
                  sendername: entity.sender,
                  sendercode: entity.senderCode,
                  title: entity.title,
                  persiandate: persianDate,
                  message: entity.message,
                  role: user?.role === "teacher" ? "teacher" : "student",
                  files: entity.attachments || [],
                };

                // Array to collect all recipient codes
                let allRecipients: Array<
                  typeof baseMessage & { receivercode: string }
                > = [];

                // 1. Add direct student recipients
                if (entity.recipients?.students?.length > 0) {
                  const studentRecipients = entity.recipients.students.map(
                    (student: any) => ({
                      ...baseMessage,
                      receivercode: student.value,
                    })
                  );
                  allRecipients = [...allRecipients, ...studentRecipients];
                }

                // 2. Add teacher recipients
                if (entity.recipients?.teachers?.length > 0) {
                  const teacherRecipients = entity.recipients.teachers.map(
                    (teacher: any) => ({
                      ...baseMessage,
                      receivercode: teacher.value,
                    })
                  );
                  allRecipients = [...allRecipients, ...teacherRecipients];
                }

                // 3. Process group recipients - fetch student codes for each group
                if (entity.recipients?.groups?.length > 0) {
                  // Call an API endpoint to get students in these groups
                  const groupCodes = entity.recipients.groups.map(
                    (group: any) => group.value
                  );
                  const groupResponse = await fetch(
                    "/api/messages/student-groups",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        groupCodes,
                        schoolCode: entity.schoolCode,
                      }),
                    }
                  );

                  if (groupResponse.ok) {
                    const { students } = await groupResponse.json();
                    const groupStudentRecipients = students.map(
                      (studentCode: string) => ({
                        ...baseMessage,
                        receivercode: studentCode,
                      })
                    );
                    allRecipients = [
                      ...allRecipients,
                      ...groupStudentRecipients,
                    ];
                  }
                }

                // 4. Process class recipients - fetch student codes for each class
                if (entity.recipients?.classCode?.length > 0) {
                  // Call an API endpoint to get students in these classes
                  const classCodes = entity.recipients.classCode.map(
                    (classItem: any) => classItem.value
                  );
                  const classResponse = await fetch(
                    "/api/messages/class-students",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        classCodes,
                        schoolCode: entity.schoolCode,
                      }),
                    }
                  );

                  if (classResponse.ok) {
                    const { students } = await classResponse.json();
                    const classStudentRecipients = students.map(
                      (studentCode: string) => ({
                        ...baseMessage,
                        receivercode: studentCode,
                      })
                    );
                    allRecipients = [
                      ...allRecipients,
                      ...classStudentRecipients,
                    ];

                    allRecipients = Array.from(
                      new Map(
                        allRecipients.map((item) => [item.receivercode, item])
                      ).values()
                    );

                    console.log(
                      `Removed duplicates. Final recipient count: ${allRecipients.length}`
                    );
                  }
                }

                // 5. Insert all recipients to messagelist collection
                if (allRecipients.length > 0) {
                  const insertResponse = await fetch(
                    "/api/messages/insert-message-list",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ messages: allRecipients }),
                    }
                  );

                  if (insertResponse.ok) {
                    const result = await insertResponse.json();
                    toast.success(
                      `پیام با موفقیت برای ${result.count} گیرنده ارسال شد`
                    );
                  } else {
                    throw new Error("خطا در ارسال پیام");
                  }
                } else {
                  toast.error("هیچ گیرنده‌ای برای پیام انتخاب نشده است");
                }
              } catch (error) {
                console.error("Error processing message recipients:", error);
                toast.error("خطا در ارسال پیام");
              }
            }}
            onAfterEdit={async (entity: any) => {
              console.log("Entity updated:", entity);

              try {
                // Delete all associated messages from messagelist collection
                const deleteResponse = await fetch(
                  "/api/messages/delete-by-mail-id",
                  {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mailId: entity.recordId }),
                  }
                );

                if (deleteResponse.ok) {
                  const result = await deleteResponse.json();
                  console.log(
                    `Deleted ${result.deletedCount} messages from messagelist`
                  );
                } else {
                  console.error(
                    "Failed to delete associated messages from messagelist"
                  );
                }
              } catch (error) {
                console.error("Error deleting associated messages:", error);
              }

              ///
              try {
                // Get the current Persian date
                const persianDate = getPersianDate();

                // Create a base message object with common fields
                const baseMessage = {
                  mailId: entity.recordId,
                  sendername: entity.sender,
                  sendercode: entity.senderCode,
                  title: entity.title,
                  persiandate: persianDate,
                  message: entity.message,
                  role: user?.role === "teacher" ? "teacher" : "student",
                  files: entity.attachments || [],
                };

                // Array to collect all recipient codes
                let allRecipients: Array<
                  typeof baseMessage & { receivercode: string }
                > = [];

                // 1. Add direct student recipients
                if (entity.recipients?.students?.length > 0) {
                  const studentRecipients = entity.recipients.students.map(
                    (student: any) => ({
                      ...baseMessage,
                      receivercode: student.value,
                    })
                  );
                  allRecipients = [...allRecipients, ...studentRecipients];
                }

                // 2. Add teacher recipients
                if (entity.recipients?.teachers?.length > 0) {
                  const teacherRecipients = entity.recipients.teachers.map(
                    (teacher: any) => ({
                      ...baseMessage,
                      receivercode: teacher.value,
                    })
                  );
                  allRecipients = [...allRecipients, ...teacherRecipients];
                }

                // 3. Process group recipients - fetch student codes for each group
                if (entity.recipients?.groups?.length > 0) {
                  // Call an API endpoint to get students in these groups
                  const groupCodes = entity.recipients.groups.map(
                    (group: any) => group.value
                  );
                  const groupResponse = await fetch(
                    "/api/messages/student-groups",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        groupCodes,
                        schoolCode: entity.schoolCode,
                      }),
                    }
                  );

                  if (groupResponse.ok) {
                    const { students } = await groupResponse.json();
                    const groupStudentRecipients = students.map(
                      (studentCode: string) => ({
                        ...baseMessage,
                        receivercode: studentCode,
                      })
                    );
                    allRecipients = [
                      ...allRecipients,
                      ...groupStudentRecipients,
                    ];
                  }
                }

                // 4. Process class recipients - fetch student codes for each class
                if (entity.recipients?.classCode?.length > 0) {
                  // Call an API endpoint to get students in these classes
                  const classCodes = entity.recipients.classCode.map(
                    (classItem: any) => classItem.value
                  );
                  const classResponse = await fetch(
                    "/api/messages/class-students",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        classCodes,
                        schoolCode: entity.schoolCode,
                      }),
                    }
                  );

                  if (classResponse.ok) {
                    const { students } = await classResponse.json();
                    const classStudentRecipients = students.map(
                      (studentCode: string) => ({
                        ...baseMessage,
                        receivercode: studentCode,
                      })
                    );
                    allRecipients = [
                      ...allRecipients,
                      ...classStudentRecipients,
                    ];

                    allRecipients = Array.from(
                      new Map(
                        allRecipients.map((item) => [item.receivercode, item])
                      ).values()
                    );

                    console.log(
                      `Removed duplicates. Final recipient count: ${allRecipients.length}`
                    );
                  }
                }

                // 5. Insert all recipients to messagelist collection
                if (allRecipients.length > 0) {
                  const insertResponse = await fetch(
                    "/api/messages/insert-message-list",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ messages: allRecipients }),
                    }
                  );

                  if (insertResponse.ok) {
                    const result = await insertResponse.json();
                    toast.success(
                      `پیام با موفقیت برای ${result.count} گیرنده ارسال شد`
                    );
                  } else {
                    throw new Error("خطا در ارسال پیام");
                  }
                } else {
                  toast.error("هیچ گیرنده‌ای برای پیام انتخاب نشده است");
                }
              } catch (error) {
                console.error("Error processing message recipients:", error);
                toast.error("خطا در ارسال پیام");
              }
            }}
            onAfterDelete={async (id) => {
              console.log("Entity deleted:", id);
              try {
                // Delete all associated messages from messagelist collection
                const deleteResponse = await fetch(
                  "/api/messages/delete-by-mail-id",
                  {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mailId: id }),
                  }
                );

                if (deleteResponse.ok) {
                  const result = await deleteResponse.json();
                  console.log(
                    `Deleted ${result.deletedCount} messages from messagelist`
                  );
                } else {
                  console.error(
                    "Failed to delete associated messages from messagelist"
                  );
                }
              } catch (error) {
                console.error("Error deleting associated messages:", error);
              }
            }}
            onAfterGroupDelete={async (ids) => {
              console.log("Entities deleted:", ids);
              try {
                // Delete all associated messages from messagelist collection for each id in the array
                const deleteResponse = await fetch(
                  "/api/messages/delete-by-mail-ids",
                  {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mailIds: ids }),
                  }
                );

                if (deleteResponse.ok) {
                  const result = await deleteResponse.json();
                  console.log(
                    `Deleted ${result.deletedCount} messages from messagelist`
                  );
                } else {
                  console.error(
                    "Failed to delete associated messages from messagelist"
                  );
                }
              } catch (error) {
                console.error("Error deleting associated messages:", error);
              }
            }}
          />
        )}
      </div>

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={showStatistics}
        onClose={() => setShowStatistics(false)}
        mailId={selectedMailId}
      />
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
