"use client";

import { Suspense } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useAuth } from "@/hooks/useAuth";

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
  const { user } = useAuth();
  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/students?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };
  const sampleFormStructure: FormField[] = [
    {
      name: "menuID",
      title: "کد منو",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      populateID: {
        collection: "adminsystemmenues",
        field: "data.menuID",
      },
      enabled: false,
      groupUniqueness: true,
      required: true,
      readonly: true,
      visible: true,
      validation: {
        requiredMessage: "کد منو الزامی است",
      },
    },
    {
      name: "menuName",
      title: "نام منو",
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
        requiredMessage: "نام مدیریتی الزامی است",
      },
    },

    {
      name: "order",
      title: "ترتیب منو",
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
        requiredMessage: "ترتیب منو الزامی است",
      },
    },

    // {
    //   name: "mainUrl",
    //   title: "آدرس اصلی",
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
    //     requiredMessage: "آدرس اصلی الزامی است",
    //   },
    // },
  ] as const;
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          مدیریت دانش آموزان
        </h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="adminsystemmenues"
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
