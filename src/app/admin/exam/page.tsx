"use client";

import { Suspense } from "react";
import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
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

  const sampleFormStructure: FormField[] = [
    {
      name: "examCode",
      title: "کد امتحان",
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
        requiredMessage: "کد امتحان الزامی است",
      },
    },
    {
      name: "examName",
      title: "نام امتحان",
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
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "allQuestionsInOnePage",
      title: "همه سوالات در یک صفحه",
      type: "text",
      required: false,
      fields: [
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
          name: "examTime",
          title: "زمان امتحان",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان امتحان الزامی است",
          },
        },
        {
          name: "questionsOrder",
          title: "ترتیب سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "اول تستی", value: "firstTest" },
            { label: "اول تشریحی", value: "firstEssay" },
            { label: "درهم تستی و تشریحی", value: "mixed" },
            { label: "به ترتیب افزودن", value: "byAdding" },
            { label: "به ترتیب تصادفی", value: "randomly" },
          ],
          validation: {
            requiredMessage: "لطفا یک ترتیب سوالات را انتخاب کنید",
          },
        },
      ],
      orientation: "vertical",
      isOpen: false,
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "separatePages",
      title: "نمایش سوالات در صفحات مجزا",
      type: "text",
      required: false,
      fields: [
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
          name: "questionTime",
          title: "زمان هر سوال",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان هر سوال الزامی است",
          },
        },
        {
          name: "questionsOrder",
          title: "ترتیب سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          options: [
            { label: "اول تستی", value: "firstTest" },
            { label: "اول تشریحی", value: "firstEssay" },
            { label: "درهم تستی و تشریحی", value: "mixed" },
            { label: "به ترتیب افزودن", value: "byAdding" },
            { label: "به ترتیب تصادفی", value: "randomly" },
          ],
          validation: {
            requiredMessage: "لطفا یک ترتیب سوالات را انتخاب کنید",
          },
        },
      ],
      orientation: "vertical",
      isOpen: false,
    },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "imageFile",
      title: "آزمون با فایل عکس",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
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
          name: "examTime",
          title: "زمان امتحان",
          type: "number",
          isShowInList: true,
          isSearchable: true,
          required: true,
          enabled: true,
          visible: true,
          readonly: false,
          listLabelColor: "#2563eb",
          defaultValue: "",
          validation: {
            requiredMessage: "زمان امتحان الزامی است",
          },
        },
      ],
    },

    // {
    //   name: "examType",
    //   title: "نوع امتحان",
    //   type: "dropdown",
    //   isSearchable: true,
    //   required: true,
    //   isShowInList: true,
    //   enabled: true,
    //   visible: true,
    //   readonly: false,
    //   options: [
    //     { label: "قابل ویرایش", value: "0" },
    //     { label: "غیرقابل ویرایش", value: "1" },
    //   ],
    //   validation: {
    //     requiredMessage: "لطفا یک نوع امتحان را انتخاب کنید",
    //   },
    // },

    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "dateTime",
      title: "تاریخ و زمان امتحان",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
        {
          name: "startDate",
          title: "تاریخ و زمان شروع",
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
            format: "YYYY/MM/DD HH:mm",
            className: "custom-datepicker",
            calendar: "persian",
            locale: "fa",
            timePicker: true, // Enable time picker plugin
            calendarPosition: "bottom",
            weekStartDayIndex: 6,
            hideWeekDays: false,
            hideMonth: false,
            hideYear: false,
          },
          validation: {
            requiredMessage: "لطفا تاریخ شروع را وارد کنید",
          },
        },

        {
          name: "endDate",
          title: "تاریخ و زمان پایان",
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
            format: "YYYY/MM/DD HH:mm",
            className: "custom-datepicker",
            calendar: "persian",
            locale: "fa",
            calendarPosition: "bottom",
            weekStartDayIndex: 6,
            timePicker: true, // Enable time picker plugin
            hideWeekDays: false,
            hideMonth: false,
            hideYear: false,
          },
          validation: {
            requiredMessage: "لطفا تاریخ پایان را وارد کنید",
          },
        },
      ],
    },
    {
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "settings",
      title: "تنظیمات",
      type: "text",
      required: false,
      orientation: "vertical",
      isOpen: false,
      fields: [
        {
          name: "questionsDirection",
          title: "جهت سوالات",
          type: "dropdown",
          isSearchable: true,
          required: true,
          isShowInList: true,
          enabled: true,
          visible: true,
          readonly: false,
          // groupUniqueness: true,
          options: [
            { label: "راست به چپ", value: "rightToLeft" },
            { label: "چپ به راست", value: "leftToRight" },
          ],
          validation: {
            requiredMessage: "لطفا یک جهت سوالات را انتخاب کنید",
          },
        },
        {
          name: "preexammessage",
          title: "پیام قبل از امتحان",
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
            requiredMessage: "پیام قبل از امتحان الزامی است",
          },
        },
        {
          name: "postexammessage",
          title: "پیام پس از امتحان",
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
            requiredMessage: "پیام قبل از امتحان الزامی است",
          },
        },

        {
          name: "userCanAttachImage",
          title: "دانش آموزان میتوانند عکس بپیونداند",
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
          name: "showScoreAfterExam",
          title: "نمایش نمره بعد از امتحان",
          type: "checkbox",
          isShowInList: true,
          isSearchable: true,
          required: false,
          enabled: true,
          visible: true,
          readonly: false,
          defaultValue: true,
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
          collectionName="exam"
          rowActions={[
            {
              label: "افزودن سوالات ازبانک سوالات",
              action: (examId) => {
                window.location.href = `/admin/questionbank?examID=${examId}`;
              },
              icon: DocumentIcon,
            },
            {
              label: "افزودن سوالات ازبانک شخصی",
              action: (examId) => {
                window.location.href = `/admin/myquestionbank?examID=${examId}`;
              },
              icon: DocumentIcon,
            },
          ]}
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
