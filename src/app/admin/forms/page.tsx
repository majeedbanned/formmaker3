"use client";
import TimePicker from "react-multi-date-picker/plugins/analog_time_picker";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
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

export default function Home() {
  const router = useRouter();
  const { isLoading, user } = useAuth();

  // Function to update URL with encrypted filter
  const updateFilterInURL = (filter: Record<string, unknown>) => {
    const encryptedFilter = encryptFilter(filter);
    const newURL = new URL(window.location.href);
    newURL.searchParams.set("filter", encryptedFilter);
    router.push(newURL.toString());
  };

  // Function to share with combined filters
  const shareWithFilters = (rowId: string) => {
    // Create a filter combining hardcoded filters with the specific row
    const combinedFilter = {
      ...hardcodedFilter,
      _id: rowId,
    };
    updateFilterInURL(combinedFilter);
    // console.log("Share clicked for row:", rowId);
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

  const hardcodedFilter = {
    schoolCode: user?.schoolCode,
  } as const;
  const sampleFormStructure: FormField[] = [
    {
      name: "formCode",
      title: "کد فرم",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      groupUniqueness: true,
      visible: true,
      validation: {
        requiredMessage: "کد فرم الزامی است",
        groupUniqueMessage: "این کد فرم قبلاً ثبت شده است",
      },
    },
    {
      name: "formName",
      title: "نام فرم",
      type: "text",
      isShowInList: true,

      isSearchable: true,
      // isUnique: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "نام فرم الزامی است",
      },
    },
    {
      name: "formType",
      title: "نوع فرم",
      type: "dropdown",
      isSearchable: true,
      required: true,
      isShowInList: true,
      enabled: true,
      visible: true,
      readonly: false,
      options: [
        { label: "قابل ویرایش", value: "0" },
        { label: "غیرقابل ویرایش", value: "1" },
      ],
      validation: {
        requiredMessage: "لطفا یک نوع فرم را انتخاب کنید",
      },
    },
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

    {
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      groupUniqueness: true,

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
      enabled: true,
      visible: true,
      isSearchable: true,
      isShowInList: true,
      name: "Access",
      title: "دسترسی به فرم",
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

    // Example of shadcnmultiselect field with datasource

    {
      enabled: true,
      visible: true,
      isShowInList: true,
      isSearchable: true,
      name: "formFields",
      title: "فیلدها",
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
          name: "fieldType",
          title: "نوع فیلد",
          type: "dropdown",

          options: [
            { label: "متن", value: "textbox" },
            { label: "عدد", value: "number" },
            { label: "تاریخ", value: "date" },
            { label: "چند انتخابی", value: "dropdown" },
            { label: "چک باکس", value: "checkbox" },
            { label: "رادیو", value: "radio" },
            { label: "متن", value: "textarea" },
          ],
        },
        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "fieldTitle",
          title: "عنوان فیلد",
          type: "text",
        },

        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "required",
          title: "اجباری",
          type: "switch",
        },

        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "items",
          title: "آیتم ها",
          type: "text",
        },
        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "fieldOrder",
          title: "ترتیب فیلد",
          type: "number",
        },
      ],
      orientation: "horizontal",
      isOpen: true,
    },

    // Example of importTextBox field for importing student data
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">تعریف دروس</h1>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="forms"
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
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
          rowActions={[
            {
              label: "View Document",
              link: "/document",
              icon: DocumentIcon,
            },
            {
              label: "Share",
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
