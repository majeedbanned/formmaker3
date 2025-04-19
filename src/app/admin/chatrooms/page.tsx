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
      name: "chatroomCode",
      title: "کد گفتگو",
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
        requiredMessage: "کد گفتگو الزامی است",
      },
    },
    {
      name: "chatroomName",
      title: "نام گفتگو",
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
      title: "دسترسی",
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
          collectionName="chatrooms"
          initialFilter={initialFilter as Record<string, unknown>}
          layout={layout}
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
