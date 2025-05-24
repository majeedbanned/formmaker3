"use client";

import { Suspense, useState, useEffect } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Import to get Persian date
import { getPersianDate } from "@/utils/dateUtils";

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
  const { initialFilter } = useInitialFilter();
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
    // {
    //   name: "title",
    //   title: "عنوان پیام",
    //   type: "text",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: true,
    //   enabled: true,
    //   visible: true,
    //   readonly: false,
    //   listLabelColor: "#2563eb",
    //   defaultValue: "",
    //   validation: {
    //     requiredMessage: "عنوان پیام الزامی است",
    //   },
    // },

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
                  sortOrder: "asc" as const,
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
      name: "title",
      title: "عنوان نوتیفیکیشن",
      type: "textbox",

      isShowInList: true,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "عنوان نوتیفیکیشن الزامی است",
      },
      placeholder:
        "عنوان نوتیفیکیشن را وارد کنید... (این پیام به صورت پیامک نیز به شماره‌های دریافت کنندگان ارسال می‌شود)",
      className: "min-h-[200px]",
    },
    {
      name: "message",
      title: "متن نوتیفیکیشن",
      type: "textbox",

      isShowInList: true,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "متن نوتیفیکیشن الزامی است",
      },
      placeholder:
        "متن نوتیفیکیشن را وارد کنید... (این پیام به صورت پیامک نیز به شماره‌های دریافت کنندگان ارسال می‌شود)",
      className: "min-h-[200px]",
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
      return "ارسال پیام به معلمان";
    } else if (user?.userType === "teacher") {
      return "ارسال پیام به کلاس ها";
    } else {
      return "ارسال پیام";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{pageTitle()}</h1>

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
            collectionName="notificationsend"
            //  initialFilter={initialFilter as Record<string, unknown>}
            initialFilter={{
              // schoolCode: user?.schoolCode || "",
              senderCode: user?.username || "",
            }}
            layout={layout}
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
                //send notification to allRecipients
                console.log("allRecipients", allRecipients);

                // Send push notifications to recipients
                try {
                  // First insert all recipients to messagelist collection
                  const messagesResponse = await fetch(
                    "/api/messages/insert-batch",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: allRecipients,
                        schoolCode: entity.schoolCode,
                      }),
                    }
                  );

                  if (!messagesResponse.ok) {
                    throw new Error(
                      "Failed to insert messages to messagelist collection"
                    );
                  }

                  // Now send push notifications to all recipients
                  // Extract all recipient codes
                  const recipientCodes = allRecipients.map(
                    (r) => r.receivercode
                  );

                  // Send notifications to all tokens associated with these recipients
                  const notificationResponse = await fetch(
                    "/api/notifications/send",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        recipientCodes,
                        schoolCode: entity.schoolCode,
                        title: entity.title,
                        body: entity.message,
                        data: {
                          screen: "/messages",
                          messageId: entity.recordId,
                        },
                      }),
                    }
                  );

                  if (notificationResponse.ok) {
                    const result = await notificationResponse.json();
                    console.log("Notification sending result:", result);
                    toast.success(
                      "پیام با موفقیت ارسال شد و اعلان‌ها ارسال شدند"
                    );
                  } else {
                    console.error("Failed to send notifications");
                    toast.warning("پیام ارسال شد اما اعلان‌ها ارسال نشدند");
                  }
                } catch (error) {
                  console.error("Error sending notifications:", error);
                  toast.error("خطا در ارسال اعلان‌ها");
                }

                // 5. Insert all recipients to messagelist collection
              } catch (error) {
                console.error("Error processing message recipients:", error);
                toast.error("خطا در ارسال پیام");
              }
            }}
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
