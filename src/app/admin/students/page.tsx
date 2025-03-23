"use client";

import { Suspense } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";

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
    title: "نام خانوادگی دانش آموز",
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

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "کد دانش آموز الزامی است",
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
      filterQuery: { schoolCode: "2295566177" },
      // dependsOn: ["Grade", "major"],
    },
  },

  {
    name: "schoolCode",
    title: "کد مدرسه",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
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
        options: [
          { label: "اطلاعات دانش آموزان", value: "student" },
          { label: "اطلاعات استادان", value: "teacher" },
          { label: "اطلاعات مدرسه", value: "school" },
        ],
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

  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/students?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          مدیریت دانش آموزان
        </h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="students"
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
          initialFilter={initialFilter as Record<string, unknown>}
          layout={layout}
          importFunction={{
            active: true,
            title: "وارد کردن اطلاعات دانش‌آموزان",
            nameBinding: [
              {
                label: "کد دانش آموز",
                name: "studentCode",
                type: "number",
                isUnique: true,
              },
              {
                label: "نام دانش آموز",
                name: "studentName",
                type: "text",
                isUnique: false,
              },
              {
                label: "نام خانوادگی",
                name: "studentFamily",
                type: "text",
                isUnique: false,
              },
              {
                label: "شماره تلفن",
                name: "phone",
                type: "text",
                isUnique: false,
              },
              {
                label: "کد مدرسه",
                name: "schoolCode",
                type: "number",
                defaultValue: "2295566177",
              },
            ],
          }}
          rowActions={[
            {
              label: "مشاهده سند",
              link: "/document",
              icon: DocumentIcon,
            },
            {
              label: "اشتراک",
              action: shareWithFilters,
              icon: ShareIcon,
            },
          ]}
          onAfterAdd={(entity) => {
            console.log("Entity added:", entity);
          }}
          onAfterEdit={(entity) => {
            console.log("Entity updated:", entity);
          }}
          onAfterDelete={(id) => {
            console.log("Entity deleted:", id);
          }}
          onAfterGroupDelete={(ids) => {
            console.log("Entities deleted:", ids);
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
