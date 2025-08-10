"use client";

import CRUDComponent from "@/components/CRUDComponent";
import PageHeader from "@/components/PageHeader";
import {
  DocumentIcon,
  ShareIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { filterExamples } from "@/utils/filterHelpers";
import { useAuth } from "@/hooks/useAuth";
import PageHeaderDemo from "@/components/PageHeaderDemo";

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

export default function Home({
  postedFilter,
}: {
  postedFilter?: Record<string, unknown>;
}) {
  const router = useRouter();
  const { hasPermission, isLoading, user } = useAuth();

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
    console.log("Share clicked for row:", rowId);
  };

  // Function to apply filter and navigate
  const applyFilter = (filterUrl: string) => {
    router.push(filterUrl);
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
      name: "teacherName",
      title: "نام معلم",
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
        requiredMessage: "نام معلم الزامی است",
      },
    },

    {
      name: "teacherCode",
      title: "کد معلم",
      type: "text",
      isShowInList: true,
      groupUniqueness: true,

      isSearchable: true,
      // isUnique: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد معلم الزامی است",
        groupUniqueMessage: "این کد معلم قبلاً ثبت شده است",
      },
    },

    {
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: false,
      isSearchable: true,
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
            { label: "معلم", value: "معلم" },
            { label: "شماره مجازی", value: "شماره مجازی" },
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
      title: "تصویر",
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
        requiredMessage: "لطفا یک تصویر آپلود کنید",
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
            filterQuery: { teacher: true },
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

    {
      name: "marrageStatus",
      title: "وضعیت تاهل",
      type: "dropdown",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "single", label: "مجرد" },
        { value: "married", label: "متاهل" },
      ],
    },
    {
      name: "jobStatus",
      title: " وضعیت استخدامی",
      type: "dropdown",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "official", label: "رسمی" },
        { value: "unofficial", label: "غیررسمی" },
        { value: "retired", label: "بازنشسته" },
      ],
    },
    {
      name: "paye",
      title: "پایه",
      type: "checkbox",
      isShowInList: true,
      isMultiple: true,

      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
      options: [
        { value: "1", label: "ابتدایی" },
        { value: "2", label: "اول متوسطه" },
        { value: "3", label: "دوم متوسطه" },
      ],
    },
    // {
    //   name: "major",
    //   title: "  رشته تحصیلی ",
    //   type: "textbox",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    // },
    // {
    //   name: "major2",
    //   title: "  رشته تدریس ",
    //   type: "textbox",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    // },
    {
      name: "personelID",
      title: "شماره پرسنلی",
      type: "textbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
    },
    {
      name: "nationalCode",
      title: "کد ملی",
      type: "textbox",
      isShowInList: true,
      isSearchable: true,
      required: false,
      enabled: true,
      visible: true,
    },


    {
      name: "originalService",
      title: "  منطق اصلى خدمت",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "originalServiceUnit",
      title: " واحد سارمانى اصلى",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "employmentStatus",
      title: "وضعيت اشتغال (شاغل - بارشته) ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationDegree",
      title: " مدرک تحصیلی",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationMajor",
      title: " رشته تحصيلي",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "teachingMajor",
      title: " رشته اصلى تدريس",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "teachingTitle",
      title: " عنوان تدريس برای اين آموزشگاه",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "workingHours",
      title: "ساعت موظف ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "nonWorkingHours",
      title: "ساعت غير موظف ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "bankAccount",
      title: " شماره حساب بانك  ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "bankName",
      title: " نام  بانك  ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "maritalStatus",
      title: "وضعیت تاهل ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "pot",
      title: "پست ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "educationStatus",
      title: "وضعيت تحصیلی",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "resignationStatus",
      title: " وضعيت ايثار كرى",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "workHistory",
      title: " سابقه کار",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "managementHistory",
      title: " سابقه معاونت و مدیریت",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },

    {
      name: "exactAddress",
      title: " ادرس دقیق",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
    {
      name: "IDserial",
      title: "شما ه شناسنامه ",
      type: "text",
      isShowInList: false,
      isSearchable: false,
      required: false,
      enabled: true,
      visible: true,
    
    },
   


  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader
          title="تعریف معلمان مدرسه"
          subtitle="مدیریت اطلاعات معلمان مدرسه"
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {/* Filter Examples Section */}
        {/* <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Filter Examples</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => applyFilter(filterExamples.adminUsers())}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Show Admins
            </button>
            <button
              onClick={() => applyFilter(filterExamples.activeUsers())}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Show Active Users
            </button>
            <button
              onClick={() => applyFilter(filterExamples.activeAdmins())}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Show Active Admins
            </button>
            <button
              onClick={() =>
                applyFilter(filterExamples.usersInCity("New York"))
              }
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Users in New York
            </button>
            <button
              onClick={() =>
                applyFilter(
                  filterExamples.usersWithSkills(["react", "typescript"])
                )
              }
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              React/TS Developers
            </button>
            <button
              onClick={() => applyFilter(filterExamples.advancedFilter())}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Advanced Filter
            </button>
          </div>
        </div> */}

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="teachers"
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
          // rowActions={[
          //   {
          //     label: "View Document",
          //     link: "/document",
          //     icon: DocumentIcon,
          //   },
          //   {
          //     label: "Share",
          //     action: shareWithFilters,
          //     icon: ShareIcon,
          //   },
          // ]}
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
