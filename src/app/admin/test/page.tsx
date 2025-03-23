"use client";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { filterExamples } from "@/utils/filterHelpers";
import { Suspense } from "react";

// Font Variants Demo Component
const FontVariantsDemo = () => (
  <div className="p-8 bg-white rounded-lg shadow-lg mb-8">
    <h2 className="text-2xl font-bold mb-6">نمونه‌های فونت وزیرمتن</h2>

    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">وزن معمولی (400)</h3>
        <p className="text-base">
          این یک متن نمونه با وزن معمولی است. لورم ایپسوم متن ساختگی با تولید
          سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">وزن متوسط (500)</h3>
        <p className="text-base font-medium">
          این یک متن نمونه با وزن متوسط است. لورم ایپسوم متن ساختگی با تولید
          سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">وزن ضخیم (700)</h3>
        <p className="text-base font-bold">
          این یک متن نمونه با وزن ضخیم است. لورم ایپسوم متن ساختگی با تولید
          سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">نمونه‌های سایزهای مختلف</h3>
        <div className="space-y-2">
          <p className="text-xs">سایز خیلی کوچک (xs)</p>
          <p className="text-sm">سایز کوچک (sm)</p>
          <p className="text-base">سایز معمولی (base)</p>
          <p className="text-lg">سایز بزرگ (lg)</p>
          <p className="text-xl">سایز خیلی بزرگ (xl)</p>
          <p className="text-2xl">سایز فوق بزرگ (2xl)</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">نمونه‌های ترکیبی</h3>
        <div className="space-y-2">
          <p className="text-lg font-medium">عنوان با وزن متوسط</p>
          <p className="text-base">متن معمولی با توضیحات بیشتر</p>
          <p className="text-sm font-bold">نکته مهم با وزن ضخیم</p>
        </div>
      </div>
    </div>
  </div>
);

const sampleFormStructure: FormField[] = [
  {
    name: "firstName",
    title: "First Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    listLabelColor: "#2563eb",
    defaultValue: "hasani",
    validation: {
      requiredMessage: "First name is required",
    },
  },
  {
    name: "students2",
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

    // Static options as fallback in case the datasource fails
    options: [
      { label: "زبان فارسی", value: "10110" },
      { label: "زبان عربی", value: "10150" },
      { label: "زبان انگلیسی", value: "10170" },
      { label: "ریاضی", value: "10210" },
      { label: "فیزیک", value: "10410" },
    ],
    autoCompleteStyle: {
      allowNew: false,
      maxTags: 2,
      minLength: 2, // Only start searching after 2 characters are typed
    },
  },

  {
    name: "fa",
    title: "fa Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "First name is required",
    },
  },

  {
    name: "maaa",
    title: "maa Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "First name is required",
    },
  },
  {
    name: "lastName",
    title: "Last Name",
    type: "text",
    isShowInList: true,
    isSearchable: true,

    required: true,
    enabled: true,
    visible: true,
    validation: {
      requiredMessage: "Last name is required",
    },
  },
  {
    name: "email",
    isShowInList: true,
    isSearchable: true,

    title: "Email",
    type: "email",
    required: true,
    enabled: true,
    visible: true,
    validation: {
      regex: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      requiredMessage: "Email is required",
      validationMessage: "Please enter a valid email address",
    },
  },
  {
    name: "isActive",
    title: "Active Status",
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
    name: "notifications",
    title: "Notification Settings",
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
      { label: "Email", value: "email" },
      { label: "SMS", value: "sms" },
      { label: "Push", value: "push" },
    ],
  },
  {
    name: "role",
    title: "Role",
    type: "dropdown",
    isSearchable: true,
    required: true,
    isShowInList: true,
    enabled: true,
    visible: true,
    readonly: false,
    options: [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
      { label: "Guest", value: "guest" },
    ],
    validation: {
      requiredMessage: "Please select a role",
    },
  },

  {
    name: "sex",
    title: "Sex",
    type: "dropdown",
    isSearchable: true,
    dataSource: {
      collectionName: "form_entries22",
      labelField: "email",
      valueField: "_id",
      sortField: "email",
      sortOrder: "asc",
    },
    required: true,
    isShowInList: true,
    enabled: true,
    visible: true,
    options: [
      { label: "Man", value: "man" },
      { label: "Woman", value: "woman" },
    ],
    validation: {
      requiredMessage: "Please select a sex",
    },
  },

  {
    name: "gender",
    title: "Gender",
    type: "radio",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    layout: "inline",
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Other", value: "other" },
    ],
    validation: {
      requiredMessage: "Please select your gender",
    },
  },

  {
    name: "notes",
    title: "Notes",
    type: "textarea",
    isShowInList: true,
    isSearchable: true,

    required: false,
    enabled: true,
    visible: true,
  },

  {
    enabled: true,
    visible: true,
    isSearchable: true,
    isShowInList: true,
    name: "address",
    title: "Address",
    type: "text",
    required: false,
    fields: [
      {
        name: "street",
        title: "Street",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: false,
      },
      {
        name: "city",
        title: "City",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: false,
      },
      {
        name: "country",
        title: "Country",
        type: "dropdown",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: true,
      },
    ],
    orientation: "horizontal",
    isOpen: false,
  },

  {
    enabled: true,
    visible: true,
    isShowInList: true,
    isSearchable: true,
    name: "phones",
    title: "Phone Numbers",
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
        name: "type",
        title: "Type",
        type: "dropdown",
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
          { label: "Guest", value: "guest" },
        ],
      },
      {
        name: "number",
        title: "Number",
        type: "text",
        enabled: true,
        visible: true,
        isSearchable: true,
        isShowInList: true,
        required: false,
      },
    ],
    orientation: "horizontal",
    isOpen: false,
  },

  {
    name: "section1",
    title: "Personal Information",
    type: "label",
    required: false,
    enabled: true,
    visible: true,
    isShowInList: false,
    isSearchable: false,
    labelStyle: {
      fontSize: "xl",
      fontWeight: "bold",
      color: "blue-600",
      textAlign: "left",
    },
  },
  {
    name: "darkMode",
    title: "Dark Mode",
    type: "switch",
    isShowInList: true,
    isSearchable: false,
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: false,
    switchStyle: {
      size: "md",
      color: "blue",
      thumbColor: "white",
    },
  },
  {
    name: "interests",
    title: "Interests",
    type: "togglegroup",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    defaultValue: [],
    layout: "stacked",
    options: [
      { value: "sports", label: "Sports" },
      { value: "music", label: "Music" },
      { value: "reading", label: "Reading" },
      { value: "travel", label: "Travel" },
    ],
    validation: {
      requiredMessage: "Please select at least one interest",
    },
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
      hideWeekDays: false,
      hideMonth: false,
      hideYear: false,
    },
    validation: {
      requiredMessage: "لطفا تاریخ تولد را وارد کنید",
    },
  },
  {
    name: "availableDates",
    title: "Available Dates",
    type: "datepicker",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    isMultiple: true,
    datepickerStyle: {
      format: "YYYY-MM-DD",
      className: "custom-datepicker",
    },
    validation: {
      requiredMessage: "Please select at least one available date",
    },
  },
  {
    name: "skills",
    title: "Skills",
    type: "autocomplete",
    isShowInList: true,
    isSearchable: true,
    required: true,
    enabled: true,
    visible: true,
    readonly: false,
    isMultiple: true,
    options: [
      { label: "JavaScript", value: "js" },
      { label: "TypeScript", value: "ts" },
      { label: "React", value: "react" },
      { label: "Node.js", value: "node" },
      { label: "Python", value: "python" },
      { label: "Java", value: "java" },
      { label: "C++", value: "cpp" },
      { label: "Ruby", value: "ruby" },
      { label: "Go", value: "go" },
      { label: "Rust", value: "rust" },
    ],
    validation: {
      requiredMessage: "Please select at least one skill",
    },
    autocompleteStyle: {
      allowNew: true,
      allowBackspace: true,
      maxTags: 10,
      minLength: 1,
      className: "min-h-[38px]",
      tagClassName: "bg-blue-500",
    },
  },
  {
    name: "avatar",
    title: "Profile Picture",
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
      requiredMessage: "Please upload a profile picture",
    },
  },
  {
    name: "documents",
    title: "Documents",
    type: "file",
    isShowInList: true,
    isSearchable: false,
    required: false,
    enabled: true,
    visible: true,
    readonly: false,
    isMultiple: true,
    fileConfig: {
      allowedTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
      directory: "documents",
      multiple: true,
    },
    validation: {
      requiredMessage: "Please upload at least one document",
    },
  },
] as const;

function TestPage() {
  const router = useRouter();
  const { initialFilter } = useInitialFilter();

  const updateFilterInURL = (filter: Record<string, unknown>) => {
    const encryptedFilter = encryptFilter(filter);
    router.push(`/admin/test?filter=${encryptedFilter}`);
  };

  const shareWithFilters = (rowId: string) => {
    const filter = { _id: rowId };
    const encryptedFilter = encryptFilter(filter);
    const url = `${window.location.origin}/admin/test?filter=${encryptedFilter}`;
    navigator.clipboard.writeText(url);
  };

  const applyFilter = (filterUrl: string) => {
    router.push(filterUrl);
  };

  const layoutSettings: LayoutSettings = {
    direction: "rtl",
    width: "100%",
    texts: {
      addButton: "Add New",
      editButton: "Edit",
      deleteButton: "Delete",
      cancelButton: "Cancel",
      clearButton: "Clear",
      searchButton: "Search",
      advancedSearchButton: "Advanced Search",
      applyFiltersButton: "Apply Filters",
      addModalTitle: "Add New Item",
      editModalTitle: "Edit Item",
      deleteModalTitle: "Confirm Delete",
      advancedSearchModalTitle: "Advanced Search",
      deleteConfirmationMessage: "Are you sure you want to delete this item?",
      noResultsMessage: "No results found",
      loadingMessage: "Loading...",
      processingMessage: "Processing...",
      actionsColumnTitle: "Actions",
      showEntriesText: "Show",
      pageText: "Page",
      ofText: "of",
      searchPlaceholder: "Search...",
      selectPlaceholder: "Select...",
      filtersAppliedText: "Advanced search filters applied",
      clearFiltersText: "Clear filters",
    },
  };

  return (
    <div className="container mx-auto p-4">
      <FontVariantsDemo />
      <div className="bg-white rounded-lg shadow-lg p-6">
        <CRUDComponent
          collectionName="form_entries22"
          formStructure={sampleFormStructure}
          layout={layoutSettings}
          initialFilter={initialFilter as Record<string, unknown>}
          connectionString={process.env.NEXT_PUBLIC_MONGODB_URI || ""}
          rowActions={[
            {
              label: "Share",
              icon: ShareIcon,
              action: shareWithFilters,
            },
            {
              label: "Apply Filter",
              icon: DocumentIcon,
              action: (rowId: string) => {
                const filter = { _id: rowId };
                const encryptedFilter = encryptFilter(filter);
                const filterUrl = `/admin/test?filter=${encryptedFilter}`;
                applyFilter(filterUrl);
              },
            },
          ]}
          onAfterAdd={(entity) => {
            console.log("Entity added:", entity);
            updateFilterInURL({});
          }}
          onAfterEdit={(entity) => {
            console.log("Entity updated:", entity);
            updateFilterInURL({});
          }}
          onAfterDelete={(id) => {
            console.log("Entity deleted:", id);
            updateFilterInURL({});
          }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TestPage />
    </Suspense>
  );
}
