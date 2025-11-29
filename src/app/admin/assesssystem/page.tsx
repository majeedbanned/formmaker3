"use client";

import { useState, useEffect } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import PageHeader from "@/components/PageHeader";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
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
    addModalTitle: "افزودن شاخص ارزیابی",
    editModalTitle: "ویرایش شاخص ارزیابی",
    deleteModalTitle: "تایید حذف",
    advancedSearchModalTitle: "جستجوی پیشرفته",
    deleteConfirmationMessage:
      "آیا از حذف این شاخص اطمینان دارید؟ این عملیات قابل بازگشت نیست.",
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

export default function AssessmentSystemPage() {
  const { user, isLoading } = useAuth();

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

  // Only allow admin users
  if (user?.userType !== "school") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">
            شما دسترسی به این صفحه را ندارید
          </div>
        </div>
      </div>
    );
  }

  const hardcodedFilter = {
    schoolCode: user?.schoolCode,
  } as const;

  const sampleFormStructure: FormField[] = [
    {
      name: "indicatorName",
      title: "نام شاخص",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: true,
      readonly: false,
      validation: {
        requiredMessage: "نام شاخص الزامی است",
      },
    },
    {
      name: "category",
      title: "دسته‌بندی",
      type: "dropdown",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      options: [
        { label: "توانمندی و تسلط علمی", value: "توانمندی و تسلط علمی" },
        { label: "مهارت¬های آموزشی", value: "مهارت¬های آموزشی" },
        { label: "مدیریت و روابط انسانی", value: "مدیریت و روابط انسانی" },
        { label: "سنجش و ارزشیابی", value: "سنجش و ارزشیابی" },
        { label: "تعهد و توسعه حرفه¬ای", value: "تعهد و توسعه حرفه¬ای" }]
       
    },
    {
      name: "description",
      title: "توضیحات",
      type: "textarea",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
    },
    {
      name: "maxScore",
      title: "حداکثر نمره",
      type: "number",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      visible: true,
      readonly: false,
      defaultValue: 100,
      validation: {
        requiredMessage: "حداکثر نمره الزامی است",
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
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: false,
      isSearchable: true,
      defaultValue: user?.schoolCode,
      readonly: true,
      required: true,
      enabled: true,
      visible: false,
      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },
    {
      name: "order",
      title: "ترتیب نمایش",
      type: "number",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      readonly: false,
      defaultValue: 0,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title="مدیریت شاخص‌های ارزیابی معلمان"
          subtitle="تعریف و مدیریت شاخص‌های ارزیابی عملکرد معلمان"
          icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
          gradient={true}
        />

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="evaluationIndicators"
          initialFilter={hardcodedFilter}
          permissions={{
            canList: true,
            canAdd: true,
            canEdit: true,
            canDelete: true,
            canGroupDelete: true,
            canAdvancedSearch: true,
            canSearchAllFields: true,
          }}
          layout={layout}
          onAfterAdd={(entity) => {
            console.log("Indicator added:", entity);
          }}
          onAfterEdit={(entity) => {
            console.log("Indicator updated:", entity);
          }}
          onAfterDelete={(id) => {
            console.log("Indicator deleted:", id);
          }}
          onAfterGroupDelete={(ids) => {
            console.log("Indicators deleted:", ids);
          }}
        />
      </div>
    </main>
  );
}

