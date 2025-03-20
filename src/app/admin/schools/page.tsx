"use client";

import { Suspense } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings, Entity } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useAuth } from "@/hooks/useAuth";

const sampleFormStructure: FormField[] = [
  {
    name: "schoolName",
    title: "نام مدرسه",
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
      requiredMessage: "نام مدرسه الزامی است",
    },
  },

  {
    name: "schoolCode",
    title: "کد مدرسه",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    isUnique: true,
    required: true,

    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "کد مدرسه الزامی است",
      uniqueMessage: "این کد مدرسه قبلاً ثبت شده است",
    },
  },
  {
    name: "username",
    title: "نام کاربری",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    isUnique: true,
    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "نام کاربری الزامی است",
      uniqueMessage: "این نام کاربری قبلاً ثبت شده است",
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
    name: "domain",
    title: "دامنه",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    isUnique: true,
    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "دامنه الزامی است",
      uniqueMessage: "این دامنه قبلاً ثبت شده است",
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
    name: "maghta",
    title: "مقطع تحصیلی",
    type: "dropdown",
    isSearchable: true,
    required: true,
    isShowInList: true,
    enabled: true,
    visible: true,
    readonly: false,
    groupUniqueness: true,
    options: [
      { label: "ابتدایی", value: "1" },
      { label: "متوسطه اول", value: "2" },
      { label: "متوسطه دوم", value: "3" },
      { label: "پیش دبستانی", value: "4" },
      { label: "آموزشکاه زبان", value: "5" },
    ],
    validation: {
      requiredMessage: "لطفا یک مقطع تحصیلی را انتخاب کنید",
      groupUniqueMessage: "این ترکیب مقطع و پایه تحصیلی قبلاً ثبت شده است",
    },
  },

  // {
  //   name: "Grade",
  //   title: "پایه تحصیلی",
  //   type: "dropdown",
  //   isSearchable: true,
  //   required: true,
  //   isShowInList: true,
  //   enabled: true,
  //   visible: true,
  //   readonly: false,
  //   groupUniqueness: true,
  //   options: [
  //     { label: "اول ابتدایی", value: "1" },
  //     { label: "دوم ابتدایی", value: "2" },
  //     { label: "سوم ابتدایی", value: "3" },
  //     { label: "چهارم ابتدایی", value: "4" },
  //     { label: "پنجم ابتدایی", value: "5" },
  //     { label: "ششم ابتدایی", value: "6" },
  //     { label: "هفتم متوسطه", value: "7" },
  //     { label: "هشتم متوسطه", value: "8" },
  //     { label: "نهم متوسطه", value: "9" },
  //     { label: "دهم متوسطه", value: "10" },
  //     { label: "یازدهم متوسطه", value: "11" },
  //     { label: "دوازدهم متوسطه", value: "12" },
  //   ],
  //   validation: {
  //     requiredMessage: "لطفا یک پایه تحصیلی را انتخاب کنید",
  //     groupUniqueMessage: "این ترکیب مقطع و پایه تحصیلی قبلاً ثبت شده است",
  //   },
  // },

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

          { label: "تعریف کلاس ها", value: "classes" },
          { label: "تعریف دروس", value: "courses" },
          { label: "ثبت دانش آموزان", value: "importstudents" },
          { label: "برنامه هفتگی", value: "weeklyschedule" },
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

function SchoolsPageContent() {
  const { initialFilter } = useInitialFilter();
  const { hasPermission, isLoading } = useAuth();

  // Get user permissions for the schools system
  const permissions = {
    canView: hasPermission("school", "show"),
    canList: hasPermission("school", "list"),
    canCreate: hasPermission("school", "create"),
    canEdit: hasPermission("school", "edit"),
    canDelete: hasPermission("school", "delete"),
    canGroupDelete: hasPermission("school", "groupDelete"),
    canSearch: hasPermission("school", "search"),
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

  // If user doesn't have view permission, show access denied
  if (!permissions.canView) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            دسترسی محدود شده
          </h1>
          <p className="text-gray-600">شما مجوز دسترسی به این بخش را ندارید</p>
        </div>
      </div>
    );
  }

  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/schools?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };

  const handleAfterAdd = (entity: Entity) => {
    console.log("Entity added:", entity);
  };

  const handleAfterEdit = (entity: Entity) => {
    console.log("Entity updated:", entity);
  };

  const handleAfterDelete = (id: string) => {
    console.log("Entity deleted:", id);
  };

  const handleAfterGroupDelete = (ids: string[]) => {
    console.log("Entities deleted:", ids);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">مدیریت مدارس</h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="schools"
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
          initialFilter={initialFilter as Record<string, unknown>}
          layout={layout}
          permissions={{
            canList: permissions.canList,
            canAdd: permissions.canCreate,
            canEdit: permissions.canEdit,
            canDelete: permissions.canDelete,
            canGroupDelete: permissions.canGroupDelete,
            canAdvancedSearch: permissions.canSearch,
            canSearchAllFields: permissions.canSearch,
          }}
          rowActions={[
            {
              label: "اشتراک",
              action: shareWithFilters,
              icon: ShareIcon,
            },
          ]}
          onAfterAdd={handleAfterAdd}
          onAfterEdit={handleAfterEdit}
          onAfterDelete={handleAfterDelete}
          onAfterGroupDelete={handleAfterGroupDelete}
        />
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolsPageContent />
    </Suspense>
  );
}
