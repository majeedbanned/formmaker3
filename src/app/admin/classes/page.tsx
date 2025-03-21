"use client";

import CRUDComponent from "@/components/CRUDComponent";
import { DocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useInitialFilter } from "@/hooks/useInitialFilter";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { filterExamples } from "@/utils/filterHelpers";
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
    // Create a filter combining hardcoded    filters with the specific row
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
      name: "classCode",
      title: "کد کلاس",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      groupUniqueness: true,
      visible: true,
      validation: {
        requiredMessage: "کد کلاس الزامی است",
        groupUniqueMessage: "این کد کلاس قبلاً ثبت شده است",
      },
    },
    {
      name: "className",
      title: "نام کلاس",
      type: "text",
      isShowInList: true,

      isSearchable: true,
      // isUnique: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "نام کلاس الزامی است",
      },
    },
    {
      name: "major",
      title: "رشته",
      type: "dropdown",
      isSearchable: true,
      required: true,
      isShowInList: true,
      enabled: true,
      visible: true,
      readonly: false,
      options: [
        { label: "پیشفرض", value: "0" },
        { label: "ریاضی فیزیک", value: "15000" },
        { label: "علوم تجربی", value: "16000" },
        { label: "ادبيات و علوم انساني", value: "17000" },
        { label: "علوم و معارف اسلامي", value: "18000" },
      ],
      validation: {
        requiredMessage: "لطفا یک رشته را انتخاب کنید",
      },
    },
    {
      name: "Grade",
      title: "پایه تحصیلی",
      type: "dropdown",
      isSearchable: true,
      required: true,
      isShowInList: true,
      enabled: true,
      visible: true,
      readonly: false,

      options: [
        { label: "اول ابتدایی", value: "1" },
        { label: "دوم ابتدایی", value: "2" },
        { label: "سوم ابتدایی", value: "3" },
        { label: "چهارم ابتدایی", value: "4" },
        { label: "پنجم ابتدایی", value: "5" },
        { label: "ششم ابتدایی", value: "6" },
        { label: "هفتم متوسطه", value: "7" },
        { label: "هشتم متوسطه", value: "8" },
        { label: "نهم متوسطه", value: "9" },
        { label: "دهم متوسطه", value: "10" },
        { label: "یازدهم متوسطه", value: "11" },
        { label: "دوازدهم متوسطه", value: "12" },
      ],
      validation: {
        requiredMessage: "لطفا یک پایه تحصیلی را انتخاب کنید",
      },
    },

    {
      name: "schoolCode",
      title: "کد مدرسه",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      groupUniqueness: true,

      defaultValue: user?.schoolCode,
      readonly: true,

      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "کد مدرسه الزامی است",
      },
    },

    {
      name: "classCode",
      title: "کلاس",
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
      enabled: true,
      visible: true,
      isShowInList: true,
      isSearchable: true,
      name: "teachers",
      title: "معلمان",
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
          name: "teacherCode",
          title: "کد معلم",
          type: "dropdown",
          dataSource: {
            collectionName: "teachers",
            labelField: "teacherName",
            valueField: "teacherCode",
            sortField: "teacherCode",
            sortOrder: "asc",
            filterQuery: { schoolCode: user?.schoolCode },
          },
          options: [
            { label: "محمد حسین حسینی", value: "admin" },
            { label: "علی حسینی", value: "user" },
            { label: "علی حسینی", value: "guest" },
          ],
        },
        {
          enabled: true,
          visible: true,
          isSearchable: true,
          required: true,
          isShowInList: true,
          name: "courseCode",
          title: "کد درس",
          type: "dropdown",
          dataSource: {
            collectionName: "courses",
            labelField: "courseName",
            valueField: "courseCode",
            sortField: "courseCode",
            sortOrder: "asc",
            filterQuery: { schoolCode: user?.schoolCode },
            dependsOn: ["Grade", "major"],
          },
          options: [
            { label: "درس 1", value: "1" },
            { label: "درس 2", value: "2" },
            { label: "درس 3", value: "3" },
          ],
        },

        {
          enabled: true,
          visible: true,
          isShowInList: true,
          isSearchable: true,
          name: "weeklySchedule",
          title: "برنامه هفتگی",
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
              name: "day",
              title: "روز",
              type: "dropdown",

              options: [
                { label: "شنبه", value: "شنبه" },
                { label: "یکشنبه", value: "یکشنبه" },
                { label: "دوشنبه", value: "دوشنبه" },
                { label: "سه شنبه", value: "سه شنبه" },
                { label: "چهارشنبه", value: "چهارشنبه" },
                { label: "پنج شنبه", value: "پنج شنبه" },
                { label: "جمعه", value: "جمعه" },
              ],
            },
            {
              enabled: true,
              visible: true,
              isSearchable: true,
              required: true,
              isShowInList: true,
              name: "timeSlot",
              title: "ساعت",
              type: "dropdown",
              // dataSource: {
              //   collectionName: "courses",
              //   labelField: "courseName",
              //   valueField: "courseCode",
              //   sortField: "courseCode",
              //   sortOrder: "asc",
              // },
              options: [
                { label: "زنگ اول", value: "1" },
                { label: "زنگ دوم", value: "2" },
                { label: "زنگ سوم", value: "3" },
                { label: "زنگ چهارم", value: "4" },
                { label: "زنگ پنجم", value: "5" },
                { label: "زنگ ششم", value: "6" },
                { label: "زنگ هفتم", value: "7" },
                { label: "زنگ هشتم", value: "8" },
                { label: "زنگ نهم", value: "9" },
                { label: "زنگ دهم", value: "10" },
                { label: "زنگ یازدهم", value: "11" },
                { label: "زنگ دوازدهم", value: "12" },
              ],
            },
          ],
          orientation: "horizontal",
          isOpen: true,
        },
      ],
      orientation: "horizontal",
      isOpen: true,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">تعریف دروس</h1>

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
          collectionName="classes"
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
