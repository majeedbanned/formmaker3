"use client";

import { Suspense, useState, useEffect } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { FormField, LayoutSettings } from "@/types/crud";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

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

  // Add state for teacher's classes
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  // Add state for student's teachers
  const [studentTeachers, setStudentTeachers] = useState<string[]>([]);

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

  // Create base form structure with role-based filtering
  const baseFormStructure: FormField[] = [
    {
      name: "onlineClassCode",
      title: "کد کلاس",
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
        requiredMessage: "کد کلاس الزامی است",
      },
    },
    {
      name: "onlineClassName",
      title: "نام کلاس",
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
        requiredMessage: "عنوان کلاس الزامی است",
      },
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "recipients",
      title: "دسترسی",
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
                  sortOrder: "asc" as const,
                  // For teachers, filter students who are in their classes
                  filterQuery:
                    user?.userType === "teacher" && teacherClasses.length > 0
                      ? {
                          // Filter students where the classcode is in the teacher's classes
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
                  sortOrder: "asc" as const,
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
            sortOrder: "asc" as const,
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
      enabled: true,
      visible: true,
      isShowInList: true,
      isSearchable: true,
      name: "weeklySchedule",
      title: "برنامه هفتگی",
      type: "dropdown",
      required: false,
      nestedType: "array",
      orientation: "horizontal",
      isOpen: true,
      fields: [
        {
          name: "platform",
          title: "پلتفرم",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "bigbluebutton", value: "bigbluebutton" },
            { label: "adobeConnect", value: "adobeConnect" },
            { label: "Skyroom", value: "Skyroom" },
          ],
          validation: {
            requiredMessage: "پلتفرم الزامی است",
          },
        },

        {
          name: "weekDay",
          title: "روز هفته",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "شنبه", value: "شنبه" },
            { label: "یکشنبه", value: "یکشنبه" },
            { label: "دوشنبه", value: "دوشنبه" },
            { label: "سه شنبه", value: "سه شنبه" },
            { label: "چهارشنبه", value: "چهارشنبه" },
            { label: "پنج شنبه", value: "پنج شنبه" },
            { label: "جمعه", value: "جمعه" },
          ],
          validation: {
            requiredMessage: "لطفا یکی از انواع کلاس را انتخاب کنید",
          },
        },

        {
          name: "startTime",
          title: "زمان شروع کلاس مثلا 10:00",
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
            regex: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
            requiredMessage: "زمان شروع الزامی است",
            validationMessage: "فرمت زمان شروع صحیح نیست",
          },
        },
        {
          name: "endTime",
          title: "زمان پایان کلاس مثلا 11:00",
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
            regex: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
            requiredMessage: "زمان پایان الزامی است",
            validationMessage: "فرمت زمان پایان صحیح نیست",
          },
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

  // Use the updated form structure with filtered classes for teachers
  const sampleFormStructure = baseFormStructure;

  // Define a title based on user type
  const pageTitle = () => {
    if (user?.userType === "student") {
      return "کلاس های آنلاین با معلمان";
    } else if (user?.userType === "teacher") {
      return "کلاس های آنلاین با کلاس ها";
    } else {
      return "کلاس های آنلاین";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title={pageTitle()}
          subtitle={pageTitle()}
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {user?.userType === "teacher" && (
          <div className="bg-blue-50 text-right border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-700">
              <span className="font-bold ml-1">توجه:</span>
              شما فقط می‌توانید برای کلاس‌هایی که به عنوان معلم به آنها اختصاص
              داده شده‌اید کلاس آنلاین ایجاد کنید.
            </p>
          </div>
        )}

        {user?.userType === "student" && (
          <div className="bg-green-50 border text-right border-green-200 rounded-md p-3 mb-4">
            <p className="text-sm text-green-700">
              <span className="font-bold ml-1">توجه:</span>
              به عنوان دانش‌آموز، شما فقط می‌توانید با معلم‌هایی که با آنها کلاس
              دارید کلاس آنلاین داشته باشید.
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
              امکان ایجاد کلاس آنلاین وجود ندارد
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
            collectionName="onlineclasses"
            initialFilter={{
              schoolCode: user?.schoolCode || "",
            }}
            layout={layout}
          />
        )}
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
