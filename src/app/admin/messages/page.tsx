"use client";

import { Suspense } from "react";
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
  const sampleFormStructure: FormField[] = [
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
            filterQuery: { schoolCode: "2295566177" },
            // dependsOn: ["Grade", "major"],
          },

          autoCompleteStyle: {
            allowNew: false,
            maxTags: 2,
            minLength: 2, // Only start searching after 2 characters are typed
          },
        },
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
          // options: [
          //   { label: "علی محمدی", value: "student1" },
          //   { label: "رضا احمدی", value: "student2" },
          //   { label: "فاطمه حسینی", value: "student3" },
          //   { label: "زهرا کریمی", value: "student4" },
          //   { label: "محمد رضایی", value: "student5" },
          // ],
          dataSource: {
            collectionName: "studentsgroups",
            labelField: "groupName",
            valueField: "groupCode",
            sortField: "groupCode",
            sortOrder: "asc",
            filterQuery: { schoolCode: "2295566177" },
            // dependsOn: ["Grade", "major"],
          },
        },
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
            filterQuery: { schoolCode: "2295566177" },
            // dependsOn: ["Grade", "major"],
          },
        },

        {
          name: "teachers",
          title: "اساتید",
          type: "shadcnmultiselect",
          isShowInList: true,
          isSearchable: true,
          required: false,
          enabled: true,
          visible: true,
          isMultiple: true,

          dataSource: {
            collectionName: "teachers",
            labelField: "teacherName",
            valueField: "teacherCode",
            sortField: "teacherCode",
            sortOrder: "asc",
            filterQuery: { schoolCode: "2295566177" },
            // dependsOn: ["Grade", "major"],
          },
        },
      ],
    },

    // {
    //   name: "classCode",
    //   title: "کلاس",
    //   type: "shadcnmultiselect",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   isMultiple: true,
    //   // options: [
    //   //   { label: "علی محمدی", value: "student1" },
    //   //   { label: "رضا احمدی", value: "student2" },
    //   //   { label: "فاطمه حسینی", value: "student3" },
    //   //   { label: "زهرا کریمی", value: "student4" },
    //   //   { label: "محمد رضایی", value: "student5" },
    //   // ],
    //   dataSource: {
    //     collectionName: "classes",
    //     labelField: "className",
    //     valueField: "classCode",
    //     sortField: "classCode",
    //     sortOrder: "asc",
    //     filterQuery: { schoolCode: "2295566177" },
    //     // dependsOn: ["Grade", "major"],
    //   },
    // },
    // {
    //   name: "groups",
    //   title: "گروه ها",
    //   type: "shadcnmultiselect",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   isMultiple: true,
    //   // options: [
    //   //   { label: "علی محمدی", value: "student1" },
    //   //   { label: "رضا احمدی", value: "student2" },
    //   //   { label: "فاطمه حسینی", value: "student3" },
    //   //   { label: "زهرا کریمی", value: "student4" },
    //   //   { label: "محمد رضایی", value: "student5" },
    //   // ],
    //   dataSource: {
    //     collectionName: "studentsgroups",
    //     labelField: "groupName",
    //     valueField: "groupCode",
    //     sortField: "groupCode",
    //     sortOrder: "asc",
    //     filterQuery: { schoolCode: "2295566177" },
    //     // dependsOn: ["Grade", "major"],
    //   },
    // },
    // {
    //   name: "students",
    //   title: "دانش آموزان",
    //   type: "autoCompleteText",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   isMultiple: true,

    //   dataSource: {
    //     collectionName: "students",
    //     labelField: "studentName",
    //     labelField2: "studentFamily",
    //     // labelField3: "studentCode",
    //     valueField: "studentCode",
    //     sortField: "studentCode",
    //     sortOrder: "asc",
    //     filterQuery: { schoolCode: "2295566177" },
    //     // dependsOn: ["Grade", "major"],
    //   },
    // },

    // {
    //   name: "teachers",
    //   title: "مدرسان",
    //   type: "autoCompleteText",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   isMultiple: true,

    //   dataSource: {
    //     collectionName: "teachers",
    //     labelField: "teacherName",
    //     valueField: "teacherCode",
    //     sortField: "teacherCode",
    //     sortOrder: "asc",
    //     filterQuery: { schoolCode: "2295566177" },
    //     // dependsOn: ["Grade", "major"],
    //   },
    // },

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
      groupUniqueness: true,
      enabled: true,
      visible: false,

      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },
  ] as const;
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">ارسال پیام</h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="messages"
          initialFilter={initialFilter as Record<string, unknown>}
          layout={layout}
          // importFunction={{
          //   active: true,
          //   title: "وارد کردن اطلاعات دانش‌آموزان",
          //   nameBinding: [
          //     {
          //       label: "کد دانش آموز",
          //       name: "studentCode",
          //       type: "number",
          //       isUnique: true,
          //     },
          //     {
          //       label: "نام دانش آموز",
          //       name: "studentName",
          //       type: "text",
          //       isUnique: false,
          //     },
          //     {
          //       label: "نام خانوادگی",
          //       name: "studentFamily",
          //       type: "text",
          //       isUnique: false,
          //     },
          //     {
          //       label: "شماره تلفن",
          //       name: "phone",
          //       type: "text",
          //       isUnique: false,
          //     },
          //     {
          //       label: "کد مدرسه",
          //       name: "schoolCode",
          //       type: "number",
          //       defaultValue: "2295566177",
          //     },
          //   ],
          // }}
          // rowActions={[
          //   {
          //     label: "مشاهده سند",
          //     link: "/document",
          //     icon: DocumentIcon,
          //   },
          //   {
          //     label: "اشتراک",
          //     action: shareWithFilters,
          //     icon: ShareIcon,
          //   },
          // ]}
          onAfterAdd={async (entity) => {
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
              let allRecipients = [];

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
                  allRecipients = [...allRecipients, ...groupStudentRecipients];
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
                  allRecipients = [...allRecipients, ...classStudentRecipients];

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
          onAfterEdit={(entity) => {
            console.log("Entity updated:", entity);
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
