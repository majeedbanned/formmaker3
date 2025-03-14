"use client";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { filterExamples } from "@/utils/filterHelpers";

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
    name: "username",
    title: "نام کاربری",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "نام کاربری الزامی است",
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
          { label: "نمرات", value: "grades" },
          { label: "کارنامه", value: "reportCard" },
          { label: "حضور و غیاب", value: "attendance" },
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
// const layout: LayoutSettings = {
//   direction: "rtl",
//   width: "100%",
//   texts: {
//     addButton: "افزودن",
//     editButton: "Edit",
//     deleteButton: "Delete",
//     cancelButton: "Cancel",
//     clearButton: "Clear",
//     searchButton: "Search",
//     advancedSearchButton: "Advanced Search",
//     applyFiltersButton: "Apply Filters",
//     addModalTitle: "Add New Entry",
//     editModalTitle: "Edit Entry",
//     deleteModalTitle: "Delete Confirmation",
//     advancedSearchModalTitle: "Advanced Search",
//     deleteConfirmationMessage:
//       "Are you sure you want to delete this item? This action cannot be undone.",
//     noResultsMessage: "No results found",
//     loadingMessage: "Loading...",
//     processingMessage: "Processing...",
//     actionsColumnTitle: "Actions",
//     showEntriesText: "Show",
//     pageText: "Page",
//     ofText: "of",
//     searchPlaceholder: "Search all fields...",
//     selectPlaceholder: "Select an option",
//     filtersAppliedText: "Advanced search filters applied",
//     clearFiltersText: "Clear filters",
//   },
// };

// Define hardcoded filter
const hardcodedFilter = {
  // isActive: true, // Example: Only show active users by default
  //role: "admin", // Example: Only show regular users by default
} as const;

export default function Home({
  postedFilter,
}: {
  postedFilter?: Record<string, unknown>;
}) {
  const router = useRouter();
  const initialFilter = useInitialFilter({
    postedFilter,
    hardcodedFilter,
  });

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

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Dynamic Form CRUD Example
        </h1>

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
          collectionName="students"
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
          initialFilter={initialFilter}
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
