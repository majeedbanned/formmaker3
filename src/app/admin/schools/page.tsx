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
    name: "SMS_USERNAME",
    title: "نام کاربری پیامک",
    type: "text",
    isShowInList: false,
    isSearchable: true,

    required: false,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "نام کاربری الزامی است",
      uniqueMessage: "این نام کاربری قبلاً ثبت شده است",
    },
  },

  {
    name: "SMS_PASSWORD",
    title: "رمز عبور پیامک",
    type: "text",
    isShowInList: false,
    isSearchable: true,
    
    required: false,
    enabled: true,
    visible: true,
    validation: {
          requiredMessage: "رمز عبور پیامک الزامی است",
      uniqueMessage: "این نام کاربری قبلاً ثبت شده است",
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
    // groupUniqueness: true,
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

        dataSource: {
          collectionName: "adminsystems",
          labelField: "systemName",
          valueField: "systemID",
          sortField: "systemName",
          sortOrder: "asc",
          filterQuery: { school: true },
        },

        // dataSource: {
        //   collectionName: "adminsystems",
        //   labelField: "data.systemName",
        //   valueField: "data.systemID",
        //   // filter: {
        //   //   school: true,
        //   // },
        // },
        // options: [
        //   { label: "اطلاعات مدرسه", value: "schools" },
        //   { label: "اطلاعات دانش آموزان", value: "students" },
        //   { label: "اطلاعات استادان", value: "teachers" },
        //   { label: "تعریف کلاس ها", value: "classes" },
        //   { label: "تعریف دروس", value: "courses" },
        //   { label: "سیستم نمره گذاری", value: "gradingsystem" },
        //   { label: "ثبت دانش آموزان", value: "importstudents" },
        //   { label: "برنامه هفتگی", value: "weeklyschedule" },
        // ],
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
  const initialFilter = useInitialFilter();
  const { user ,isLoading} = useAuth();
  const shareWithFilters = (rowId: string) => {
    const encryptedFilter = encryptFilter({ id: rowId });
    const url = `/admin/schools?filter=${encryptedFilter}`;
    window.open(url, "_blank");
  };

  const handleAfterAdd = (entity: Entity) => {
    // console.log("Added:", entity);
  };

  const handleAfterEdit = (entity: Entity) => {
    // console.log("Edited:", entity);
  };

  const handleAfterDelete = (id: string) => {
    // console.log("Deleted:", id);
  };

  const handleAfterGroupDelete = (ids: string[]) => {
    // console.log("Group deleted:", ids);
  };

  if (isLoading ) {
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

  return (
    <div className="container mx-auto p-4">
      <CRUDComponent
        collectionName="schools"
        formStructure={sampleFormStructure}
        layout={layout}
        initialFilter={initialFilter}
        permissions={{
          canList: true,
          canAdd: false,
          canEdit: false,
          canDelete: false,
          canGroupDelete: false,
          canAdvancedSearch: false,
          canSearchAllFields: false,
        }}
        rowActions={[
          {
            icon: ShareIcon,
            label: "اشتراک‌گذاری",
            action: shareWithFilters,
          },
        ]}
        onAfterAdd={handleAfterAdd}
        onAfterEdit={handleAfterEdit}
        onAfterDelete={handleAfterDelete}
        onAfterGroupDelete={handleAfterGroupDelete}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchoolsPageContent />
    </Suspense>
  );
}
