"use client";

import { Suspense } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import {
  AcademicCapIcon,
  DocumentIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
// import useInitialFilter from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";

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

// Define the interface for class code entries
interface ClassCodeEntry {
  label: string;
  value: string;
}

// Define the interface for a student entity
interface StudentEntity {
  recordId: string;

  studentCode: string;
  studentName?: string;
  studentFamily?: string;
  phone?: string;
  classCode?: ClassCodeEntry[];
  [key: string]: unknown;
}

// Helper function to update a class document with student information
async function updateClassWithStudentInfo(
  student: StudentEntity,
  classEntry: ClassCodeEntry
) {
  try {
    // Create the student data object for the class
    const studentForClass = {
      studentCode: student.studentCode,
      studentName: student.studentName || "",
      studentlname: student.studentFamily || "",
      phone: student.phone || "",
      _id: student.recordId, // Include the MongoDB ID for reference
    };

    // Update the class document to include this student
    const response = await fetch("/api/classes/addStudent", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        classCode: classEntry.value,
        student: studentForClass,
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to update class ${classEntry.value} with student ${student.studentCode}:`,
        await response.text()
      );
    } else {
      console.log(
        `Successfully updated class ${classEntry.value} with student ${student.studentCode}`
      );
    }
  } catch (error) {
    console.error(`Error updating class ${classEntry.value}:`, error);
  }
}

// Helper function to remove a student from a class
async function removeStudentFromClass(
  student: StudentEntity,
  classCode: string
) {
  try {
    // Remove the student from the class document
    const response = await fetch("/api/classes/removeStudent", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-domain": window.location.host,
      },
      body: JSON.stringify({
        classCode: classCode,
        studentId: student.recordId,
      }),
    });

    if (!response.ok) {
      console.error(
        `Failed to remove student ${student.studentCode} from class ${classCode}:`,
        await response.text()
      );
    } else {
      console.log(
        `Successfully removed student ${student.studentCode} from class ${classCode}`
      );
    }
  } catch (error) {
    console.error(`Error removing student from class ${classCode}:`, error);
  }
}

// Add window interface for global typing
declare global {
  interface Window {
    __EDITING_ENTITY_DATA__?: {
      classCode?: ClassCodeEntry[];
      [key: string]: unknown;
    };
  }
}

function StudentsPageContent() {
  //const { initialFilter } = useInitialFilter();
  const { user } = useAuth();
  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/students?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };
  const sampleFormStructure: FormField[] = [
    {
      name: "studentName",
      title: "نام دانش آموز",
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
        requiredMessage: "نام دانش آموز الزامی است",
      },
    },
    {
      name: "studentFamily",
      title: "نام خانوادگی  ",
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
        requiredMessage: "نام خانوادگی دانش آموز الزامی است",
      },
    },

    {
      name: "studentCode",
      title: "کد دانش آموز",
      type: "text",
      isShowInList: true,
      isSearchable: true,

      groupUniqueness: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد دانش آموز الزامی است",
        groupUniqueMessage: "این کد کلاس قبلاً ثبت شده است",
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
      // options: [
      //   { label: "علی محمدی", value: "student1" },
      //   { label: "رضا احمدی", value: "student2" },
      //   { label: "فاطمه حسینی", value: "student3" },
      //   { label: "زهرا کریمی", value: "student4" },
      //   { label: "محمد رضایی", value: "student5" },
      // ],
      dataSource: {
        collectionName: "classes",
        labelField: "className",
        valueField: "classCode",
        sortField: "classCode",
        sortOrder: "asc",
        filterQuery: { schoolCode: user?.schoolCode },
        // dependsOn: ["Grade", "major"],
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
        filterQuery: { schoolCode: user?.schoolCode },
        // dependsOn: ["Grade", "major"],
      },
    },

    {
      name: "birthDate",
      title: "تاریخ تولد",
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
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      defaultValue: user?.schoolCode,
      readonly: true,
      required: true,
      groupUniqueness: true,
      enabled: true,
      visible: true,

      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },

    {
      name: "password",
      title: "رمز عبور",
      type: "text",
      isShowInList: false,
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
            { label: "پدر", value: "پدر" },
            { label: "مادر", value: "مادر" },
            { label: "دانش آموز", value: "دانش آموز" },
            { label: "دانش آموز شماره مجازی", value: "دانش آموز شماره مجازی" },

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
      title: "تصویر 3*4",
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
        requiredMessage: "لطفا یک تصویر 3*4 آپلود کنید",
      },
    },



    {
      name: "codemelli",
      title: "کد ملی",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد ملی الزامی نیست",
      },
    },
    {
      name: "birthplace ",
      title: "محل تولد",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "محل تولد الزامی نیست",
      },
    },
    {
      name: "IDserial",
      title: "شماره شناسنامه",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "شماره شناسنامه الزامی نیست",
      },
    },
    {
      name: "fatherEducation",
      title: "تحصیلات پدر",
      type: "dropdown",
      isShowInList: false,
      isSearchable: true,
      options: [
        { label: "دیپلم", value: "دیپلم" },
        { label: "کاردانی", value: "کاردانی" },
        { label: "کارشناسی", value: "کارشناسی" },
        { label: "کارشناسی ارشد", value: "کارشناسی ارشد" },
        { label: "دکترا", value: "دکترا" },
      ],

      required: false,
      enabled: true,
      visible: true,
      validation: {
          requiredMessage: "تحصیلات پدر الزامی نیست",
      },
    },

    {
      name: "motherEducation",
      title: "تحصیلات مادر",
      type: "dropdown",
      isShowInList: false,
      isSearchable: true,
      options: [
        { label: "دیپلم", value: "دیپلم" },
        { label: "کاردانی", value: "کاردانی" },
        { label: "کارشناسی", value: "کارشناسی" },
        { label: "کارشناسی ارشد", value: "کارشناسی ارشد" },
        { label: "دکترا", value: "دکترا" },
      ],

      required: false,
      enabled: true,
      visible: true,
      validation: {
          requiredMessage: "تحصیلات مادر الزامی نیست",
      },
    },

    {
      name: "fatherJob",
      title: "شغل پدر",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "شغل پدر الزامی نیست",
      },
    },

    {
      name: "fatherWorkPlace",
      title: "محل کار پدر",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "محل کار پدر الزامی نیست",
      },
    },

    {
      name: "motherJob",
      title: "شغل مادر",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "شغل مادر الزامی نیست",
      },
    },

    {
      name: "infos",
      title: "اطلاعات جمعی",
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
        { value: "shahid", label: "شهدا و جانبازان" },
        { value: "anjoman", label: "انجمن مدرسه" },
        { value: "schoolbus", label: "متقاضی سرویس مدرسه" },
        { value: "farhangison", label: " فرزند فرهنگی" },
        { value: "komite", label: "کمیته" },
        { value: "atba", label: "اتباع" },
       
      ],
      validation: {
        requiredMessage: "Please select at least one interest",
      },
    },

    {
      name: "address",
      title: "آدرس",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "آدرس الزامی نیست",
      },
    },
    {
      name: "postalcode",
      title: "کد پستی",
      type: "text",
      isShowInList: false,
      isSearchable: true,

      required: false,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد پستی الزامی نیست",
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
            filterQuery: { student: true },
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
  ] as const;
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">
          مدیریت دانش آموزان
        </h1> */}
        <PageHeader
          title="تعریف دانش آموزان مدرسه"
          subtitle="مدیریت اطلاعات دانش آموزان مدرسه"
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="students"
          // initialFilter={initialFilter as Record<string, unknown>}
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
          //       defaultValue: user?.schoolCode,
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
          onAfterAdd={async (entity: StudentEntity) => {
            console.log("Entity added:", entity);

            // Check if the entity has classCode field
            const classCodeEntries = entity?.classCode;
            if (
              classCodeEntries &&
              Array.isArray(classCodeEntries) &&
              classCodeEntries.length > 0
            ) {
              // For each class code, update the corresponding class document
              for (const classEntry of classCodeEntries) {
                console.log("classEntry", classEntry);
                await updateClassWithStudentInfo(entity, classEntry);
              }
            }
          }}
          onAfterEdit={async (entity: StudentEntity) => {
            console.log("Entity updated:", entity);

            // Check if the entity has classCode field
            const classCodeEntries = entity?.classCode;

            // Get previous data if available
            const previousData = window.__EDITING_ENTITY_DATA__;
            const previousClassCodes = previousData?.classCode || [];

            if (classCodeEntries && Array.isArray(classCodeEntries)) {
              // For each class code, update the corresponding class document
              for (const classEntry of classCodeEntries) {
                await updateClassWithStudentInfo(entity, classEntry);
              }

              // Check if any classes were removed
              if (
                previousClassCodes &&
                Array.isArray(previousClassCodes) &&
                previousClassCodes.length > 0
              ) {
                const currentClassValues = classCodeEntries.map(
                  (entry) => entry.value
                );
                const removedClasses = previousClassCodes.filter(
                  (prevClass: ClassCodeEntry) =>
                    !currentClassValues.includes(prevClass.value)
                );

                // Remove student from classes that were removed
                for (const removedClass of removedClasses) {
                  await removeStudentFromClass(entity, removedClass.value);
                }
              }
            } else if (
              previousClassCodes &&
              Array.isArray(previousClassCodes) &&
              previousClassCodes.length > 0
            ) {
              // All classes were removed, remove student from all previous classes
              for (const prevClass of previousClassCodes) {
                await removeStudentFromClass(entity, prevClass.value);
              }
            }
          }}
          onAfterDelete={async (entity) => {
            console.log("Entity deleted:", entity);

            // Check if the entity has classCode field
            const classCodeEntries = entity?.data?.classCode;

            if (
              classCodeEntries &&
              Array.isArray(classCodeEntries) &&
              classCodeEntries.length > 0
            ) {
              // For each class, remove the student
              for (const classEntry of classCodeEntries) {
                try {
                  // Remove student from class
                  const response = await fetch("/api/classes/removeStudent", {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "x-domain": window.location.host,
                    },
                    body: JSON.stringify({
                      classCode: classEntry.value,
                      studentId: entity._id,
                    }),
                  });

                  if (response.ok) {
                    console.log(
                      `Removed student ${entity.data.studentCode} from class ${classEntry.label}`
                    );
                  } else {
                    console.error(
                      `Failed to remove student from class ${classEntry.value}:`,
                      await response.text()
                    );
                  }
                } catch (error) {
                  console.error(
                    `Error removing student from class ${classEntry.value}:`,
                    error
                  );
                }
              }
            }
          }}
          onAfterGroupDelete={async (entities) => {
            console.log("Entities deleted:", entities);

            // Process each deleted entity
            for (const entity of entities) {
              // Check if the entity has classCode field
              const classCodeEntries = entity?.data?.classCode;

              if (
                classCodeEntries &&
                Array.isArray(classCodeEntries) &&
                classCodeEntries.length > 0
              ) {
                // For each class, remove the student
                for (const classEntry of classCodeEntries) {
                  try {
                    // Remove student from class
                    const response = await fetch("/api/classes/removeStudent", {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        "x-domain": window.location.host,
                      },
                      body: JSON.stringify({
                        classCode: classEntry.value,
                        studentId: entity._id,
                      }),
                    });

                    if (response.ok) {
                      console.log(
                        `Removed student ${entity.data.studentCode} from class ${classEntry.label}`
                      );
                    } else {
                      console.error(
                        `Failed to remove student from class ${classEntry.value}:`,
                        await response.text()
                      );
                    }
                  } catch (error) {
                    console.error(
                      `Error removing student from class ${classEntry.value}:`,
                      error
                    );
                  }
                }
              }
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
