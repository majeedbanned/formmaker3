"use client";

import CRUDComponent from "@/components/CRUDComponent";
import {
  AcademicCapIcon,
  DocumentIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { encryptFilter } from "@/utils/encryption";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addPredefinedCoursesAction } from "@/app/actions/courses";
import { useEffect } from "react";
import PageHeader from "@/components/PageHeader";

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

  // Load predefined courses when the page loads
  useEffect(() => {
    const loadPredefinedCourses = async () => {
      if (user?.schoolCode && user?.maghta) {
        try {
          // Get domain from window location (in client component)
          const domain =
            typeof window !== "undefined"
              ? window.location.host
              : "localhost:3000";

          const result = await addPredefinedCoursesAction(
            user.schoolCode,
            user.maghta,
            domain
          );
          if (!result.success) {
            console.error("Failed to load predefined courses:", result.error);
          }
        } catch (error) {
          console.error("Error loading predefined courses:", error);
        }
      }
    };

    loadPredefinedCourses();
  }, [user?.schoolCode, user?.maghta]);

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
  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
        </div>
      </div>
    );
  }

  const maghta = user?.maghta;
  // console.log("maghta", maghta);

  const gradeOptions =
    maghta === "1"
      ? [
          { label: "اول ابتدایی", value: "1" },
          { label: "دوم ابتدایی", value: "2" },
          { label: "سوم ابتدایی", value: "3" },
          { label: "چهارم ابتدایی", value: "4" },
          { label: "پنجم ابتدایی", value: "5" },
          { label: "ششم ابتدایی", value: "6" },
        ]
      : maghta === "2"
      ? [
          { label: "هفتم متوسطه", value: "7" },
          { label: "هشتم متوسطه", value: "8" },
          { label: "نهم متوسطه", value: "9" },
        ]
      : maghta === "3"
      ? [
          { label: "دهم متوسطه", value: "10" },
          { label: "یازدهم متوسطه", value: "11" },
          { label: "دوازدهم متوسطه", value: "12" },
        ]
      : [{ label: "پیش فرض", value: "0" }];

  const hardcodedFilter = {
    schoolCode: user?.schoolCode,
  } as const;

  const sampleFormStructure: FormField[] = [
    {
      name: "courseCode",
      title: "کد درس",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      enabled: true,
      groupUniqueness: true,
      visible: true,
      validation: {
        requiredMessage: "کد درس الزامی است",
        groupUniqueMessage: "این کد درس قبلاً ثبت شده است",
      },
    },
    {
      name: "courseName",
      title: "نام درس",
      type: "text",
      isShowInList: true,

      isSearchable: true,
      // isUnique: true,
      required: true,
      enabled: true,
      visible: true,
      validation: {
        requiredMessage: "نام درس الزامی است",
      },
    },

    ...(maghta === "3"
      ? [
          {
            name: "vahed",
            title: "واحد",
            type: "number",
            isShowInList: true,
            isSearchable: true,
            required: true,
            enabled: true,
            visible: true,
            validation: {
              requiredMessage: "واحد الزامی است",
            },
          },
          // {
          //   name: "major",
          //   title: "رشته",
          //   type: "dropdown",
          //   isSearchable: true,
          //   required: true,
          //   isShowInList: true,
          //   enabled: true,
          //   visible: true,
          //   readonly: false,
          //   groupUniqueness: true,
          //   options: [
          //     { label: "پیشفرض", value: "0" },
          //     { label: "ریاضی فیزیک", value: "15000" },
          //     { label: "علوم تجربی", value: "16000" },
          //     { label: "ادبيات و علوم انساني", value: "17000" },
          //     { label: "علوم و معارف اسلامي", value: "18000" },
          //   ],
          //   validation: {
          //     requiredMessage: "لطفا یک رشته را انتخاب کنید",
          //   },
          // },
        ]
      : []),

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
      groupUniqueness: true,
      options: gradeOptions,
      validation: {
        requiredMessage: "لطفا یک پایه تحصیلی را انتخاب کنید",
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
        { label: "بدون رشته", value: "0" },

        { label: "ادبيات و علوم انساني", value: "17000" },
        { label: "الكتروتكنيك", value: "71310" },
        { label: "تأسیسات مستقل ساختمان‌های مسکونی", value: "91244" },
        { label: "تاسیسات گرمایشی", value: "91246" },
        
        { label: "تصويرسازي و جلوه های ویژه رایانه ای", value: "62321" },
        { label: "حسابداری", value: "41110" },
        { label: "راهنماي كرد شكري", value: "62201" },
        { label: "راهنماي كرد شكري", value: "62291" },
        { label: "ریاضی فیزیک", value: "15000" },
        { label: "تربيت بدني", value: "11410" },
        { label: "ساختمان", value: "73210" },
        { label: "صنايع شيميايي", value: "71110" },
        { label: "صنايع چوب و مبلمان", value: "72220" },
        { label: "علوم تجربی", value: "16000" },
        { label: "علوم و معارف اسلامي", value: "18000" },
        { label: "فتو-گرافيك", value: "28820" },
        // { label: "كرافيك راياده اي (٣١٣)", value: "99011" },
        { label: "كرافيك رايانه اي (٣١٢)", value: "99011" },
        { label: "معمارى داخلى 10", value: "73110" },
        { label: "معماری داخلی", value: "21210" },
        { label: "عکاسی ديجيتال", value: "99211" },
        // { label: "مكانيك خودرو", value: "71610" },
        { label: "مکانیک ۰۷١٦١٠", value: "71610" },
        { label: "نقاشی", value: "21120" },
        { label: "نوازندكي ساز ايراني", value: "99411" },
        { label: "نوازندكي ساز جهاني", value: "99421" },
        // { label: "کابینت سازی چوبی", value: "91226" },
        { label: "کابینت سازی چوبی", value: "91226" },
        { label: "کامپیوتر ۰٦٨٨١٠", value: "68810" },
        { label: "گرافيك", value: "21140" }
//         { label: "ریاضی فیزیک", value: "15000" },
//         { label: "علوم تجربی", value: "16000" },
//         { label: "ادبيات و علوم انساني", value: "17000" },
//         { label: "علوم و معارف اسلامي", value: "18000" },
       



//         { label: "مکانیک ۰۷۱۶۱۰", value: "71610" },
//         { label: "کامپیوتر ۰۶۸۸۱۰", value: "68810" },
//         { label: "راهنماي كرد شكري", value: "62201" },
//         { label: "كرافيك راياده اي (٣١٣)", value: "99011" },
//         { label: "مكاسي ديجيتال", value: "99211" },
//         { label: "نوازندكي ساز ايراني", value: "99411" },
//         { label: "نوازندكي ساز جهاني", value: "99421" },
//         { label: "راهنماي كرد شكري", value: "62291" },
//         { label: "كرافيك رايانه اي (٣١٢)", value: "99011"
  
//          },
  
//          { label: "نقاشی", value: "21120" },
//          { label: "معماری داخلی", value: "21210" },
//          { label: "حسابداری", value: "41110" },

//          { label: "صنايع چوب و مبلمان", value: "72220" },
//          { label: "تصويرسازي و جلوه های ویژه رایانه ای", value: "62321" },
//          { label: "کابینت سازی چوبی", value: "91226" },
//          { label: "تأسیسات مستقل ساختمان‌های مسکونی", value: "91244" },
//          { label: "کابینت سازی چوبی", value: "91226" },
//          { label: "تاسیسات گرمایشی", value: "91246" },
//          { label: "الكتروتكنيك", value: "71310" },
//          { label: "مكانيك خودرو", value: "71610" },
//          { label: "ساختمان", value: "73210" },

//          { label: "گرافيك", value: "21140" },
// { label: "فتو-گرافيك", value: "28820" },


// { label: "صنايع شيميايي", value: "71110" },

// { label: "معمارى داخلى 10", value: "73110" },

       
      ],
      validation: {
        requiredMessage: "لطفا یک رشته را انتخاب کنید",
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
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* <h1 className="text-3xl font-bold text-gray-900 mb-8">تعریف دروس</h1> */}
        <PageHeader
          title="تعریف دروس مدرسه"
          subtitle="مدیریت اطلاعات دروس مدرسه"
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
          collectionName="courses"
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
            // console.log("Entity added:", entity);
          }}
          onAfterEdit={(entity) => {
            // console.log("Entity updated:", entity);
          }}
          onAfterDelete={(id) => {
            // console.log("Entity deleted:", id);
          }}
          onAfterGroupDelete={(ids) => {
            // console.log("Entities deleted:", ids);
          }}
        />
      </div>
    </main>
  );
}
