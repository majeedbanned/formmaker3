"use client";

import CRUDComponent from "@/components/CRUDComponent";
import {
  UserPlusIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { FormField, LayoutSettings } from "@/types/crud";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import ImportStudentsModal from "./ImportStudentsModal";
import HelpPanel from "@/components/ui/HelpPanel";
import { classesHelpSections } from "./ClassesHelpContent";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { BookOpenIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const layout: LayoutSettings = {
  direction: "rtl",
  width: "100%",

  texts: {
    addButton: " افزودن کلاس",
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
  const { isLoading, user } = useAuth();
  const hardcodedFilter = user?.schoolCode
    ? { schoolCode: user.schoolCode }
    : {};
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);
  const [studentsData, setStudentsData] = useState<Array<{
    _id: string;
    data: {
      studentCode: string;
      studentName?: string;
      studentFamily?: string;
      phone?: string;
      [key: string]: unknown;
    };
  }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<{
    code: string;
    name: string;
  } | null>(null);

  // Keyboard shortcut for help panel (F1)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setHelpPanelOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Function to handle importing students from Excel
  const handleImportStudents = (
    rowId: string,
    rowData?: Record<string, unknown>
  ) => {
    console.log("Import students for row:", rowId, rowData);

    if (!rowData) return;

    // Set the selected class for the import modal
    setSelectedClass({
      code: rowData.classCode as string,
      name: rowData.className as string,
    });

    // Open the import modal
    setImportModalOpen(true);
  };

  // Function to handle showing students in class
  const handleShowStudents = async (
    rowId: string,
    rowData?: Record<string, unknown>
  ) => {
    if (!rowData) return;

    // Set the selected class for the students modal
    setSelectedClassForStudents({
      code: rowData.classCode as string,
      name: rowData.className as string,
    });

    // Open the students modal and start loading
    setStudentsModalOpen(true);
    setLoadingStudents(true);

    try {
      const response = await fetch(
        `/api/students/findByClass?classCode=${rowData.classCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${await response.text()}`);
      }

      const result = await response.json();
      setStudentsData(result.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudentsData([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Function to process imported students
  const processImportedStudents = async (
    students: Array<{
      studentCode: string;
      studentName: string;
      studentFamily: string;
      phone: string;
      schoolCode: string;
    }>
  ) => {
    if (!selectedClass) {
      console.error("No class selected for import");
      return;
    }

    try {
      const response = await fetch("/api/students/bulkImport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          students: students,
          classCode: selectedClass.code,
          className: selectedClass.name,
          schoolCode: user?.schoolCode,
        }),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${await response.text()}`);
      }

      const result = await response.json();
      console.log("Import result:", result);

      // Close the modal and refresh the data
      setImportModalOpen(false);
      setSelectedClass(null);

      // Optionally refresh the page or data after import
      // You could add a refresh mechanism here
    } catch (error) {
      console.error("Error importing students:", error);
      throw error; // Let the modal handle the error
    }
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

  const sampleFormStructure: FormField[] = [
    {
      name: "classCode",
      title: "کد کلاس",
      type: "text",
      isShowInList: true,
      isSearchable: true,
      required: true,
      // defaultValue: "1234567890",
      enabled: false,
      groupUniqueness: true,
      readonly: true,
      visible: true,
      populateID: {
        collection: "classes",
        field: "data.classCode",
      },
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
        { label: "بدون رشته", value: "0" },
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
        { label: "پیش فرض", value: "0" },
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

    // {
    //   name: "description",
    //   title: "توضیحات کلاس",
    //   type: "richtextbox",
    //   isShowInList: true,
    //   isSearchable: false,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   validation: {
    //     requiredMessage: "توضیحات کلاس الزامی است",
    //   },
    //   placeholder: "توضیحات کلاس را وارد کنید...",
    //   className: "min-h-[200px]",
    // },

    // Example of shadcnmultiselect field with datasource

    // {
    //   name: "students",
    //   title: "لیست دانش آموزان (وارد کردن با کپی از اکسل)",
    //   type: "importTextBox",
    //   isShowInList: false,
    //   isSearchable: false,
    //   required: false,
    //   enabled: true,
    //   visible: true,
    //   importTextBoxStyle: {
    //     rows: 10,
    //     placeholder: "اطلاعات دانش آموزان را از اکسل کپی و اینجا پیست کنید...",
    //     isOpen: false,
    //     nameBinding: [
    //       { name: "studentCode", type: "number", isUnique: true },
    //       { name: "studentName", type: "text", isUnique: false },
    //       { name: "studentlname", type: "text", isUnique: false },
    //       { name: "phone", type: "text", isUnique: false },
    //     ],
    //   },
    // },

    {
      enabled: true,
      visible: true,
      isShowInList: false,
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

    // {
    //   name: "special_requirements",
    //   title: "نیازمندی‌های ویژه",
    //   type: "compositefields",
    //   isShowInList: true,
    //   isSearchable: false,
    //   required: true,
    //   enabled: true,
    //   visible: true,
    //   compositeFieldsStyle: {
    //     items: [
    //       {
    //         label: "نیازمندی فنی",
    //         value: "technical",
    //         fields: [
    //           {
    //             name: "equipment",
    //             title: "تجهیزات مورد نیاز",
    //             type: "dropdown",
    //             required: true,
    //             options: [
    //               { label: "کامپیوتر", value: "computer" },
    //               { label: "پروژکتور", value: "projector" },
    //               { label: "تخته هوشمند", value: "smart_board" },
    //             ],
    //           },
    //           {
    //             name: "quantity",
    //             title: "تعداد",
    //             type: "number",
    //             required: true,
    //             defaultValue: 1,
    //           },
    //         ],
    //       },
    //       {
    //         label: "نیازمندی اداری",
    //         value: "administrative",
    //         fields: [
    //           {
    //             name: "document_type",
    //             title: "نوع مستندات",
    //             type: "text",
    //             required: true,
    //           },
    //           {
    //             name: "is_urgent",
    //             title: "اولویت اضطراری",
    //             type: "switch",
    //             defaultValue: false,
    //           },
    //         ],
    //       },
    //       {
    //         label: "نیازمندی آموزشی",
    //         value: "educational",
    //         fields: [
    //           {
    //             name: "subject",
    //             title: "موضوع",
    //             type: "text",
    //             required: true,
    //           },
    //           {
    //             name: "materials_needed",
    //             title: "منابع آموزشی مورد نیاز",
    //             type: "checkbox",
    //             defaultValue: false,
    //           },
    //         ],
    //       },
    //     ],
    //     defaultItem: "technical",

    //     // In edit mode, the data for compositefields should be structured as follows:
    //     // {
    //     //   special_requirements: {
    //     //     type: "technical",          // Determines which item is selected
    //     //     technical: {                // Contains field values for the selected item
    //     //       equipment: "computer",    // Field values match the field names in the selected item
    //     //       quantity: 2
    //     //     }
    //     //   }
    //     // }
    //     //
    //     // When you switch between items, only the fields for the currently selected item are shown
    //     // and validated, making the form dynamic based on user selection.
    //   },
    // },

    // {
    //   name: "schedule_datetime",
    //   title: "زمان برگزاری کلاس",
    //   type: "datepicker",
    //   isShowInList: true,
    //   isSearchable: true,
    //   required: true,
    //   enabled: true,
    //   visible: true,
    //   datepickerStyle: {
    //     format: "YYYY/MM/DD HH:mm",
    //     calendar: "persian",
    //     locale: "fa",
    //     timePicker: true, // Enable time picker plugin
    //     calendarPosition: "bottom-right", // Now this is valid after updating the type
    //     className: "custom-datepicker",
    //     minDate: new Date(), // Cannot select dates before today
    //     weekStartDayIndex: 6, // Week starts on Saturday (for Persian calendar)
    //   },
    // },

    // Example of importTextBox field for importing student data
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* <div className="flex justify-between items-center mb-6"> */}
        <PageHeader
          title="تعریف کلاس ها"
          subtitle="مدیریت اطلاعات کلاس ها"
          icon={<BookOpenIcon className="w-6 h-6" />}
          gradient={true}
        />
        {/* </div> */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHelpPanelOpen(true)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
        >
          <QuestionMarkCircleIcon className="w-4 h-4" />
          راهنما
        </Button>

        <CRUDComponent
          formStructure={sampleFormStructure}
          collectionName="classes"
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
            // {
            //   label: "View Document",
            //   link: "/document",
            //   icon: DocumentIcon,
            // },
            // {
            //   label: "Share",
            //   action: shareWithFilters,
            //   icon: ShareIcon,
            // },
            {
              label: " ثبت گروهی دانش آموزان",
              action: handleImportStudents,
              icon: UserPlusIcon,
            },
            {
              label: "نمایش دانش آموزان این کلاس",
              action: handleShowStudents,
              icon: UsersIcon,
            },
          ]}
          onAfterAdd={async (entity) => {
            return;
            console.log("Entity added:", entity);

            // Update students' classCode field
            await updateStudentsClassCode(entity as unknown as ClassData);
          }}
          onAfterEdit={async (editedEntity) => {
            console.log("Entity updated:", editedEntity);

            const typedEntity = editedEntity as unknown as ClassData;

            // Get previous class data from the window global
            const previousData = window.__EDITING_ENTITY_DATA__;

            // Check if className was changed
            if (
              previousData &&
              previousData.className !== typedEntity.className
            ) {
              console.log(
                `Class name changed from "${previousData.className}" to "${typedEntity.className}"`
              );

              // Update the class name in all students' records
              try {
                const updateResponse = await fetch(
                  "/api/classes/updateClassName",
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "x-domain": window.location.host,
                    },
                    body: JSON.stringify({
                      classCode: typedEntity.classCode,
                      oldClassName: previousData.className,
                      newClassName: typedEntity.className,
                    }),
                  }
                );

                if (updateResponse.ok) {
                  const result = await updateResponse.json();
                  console.log(
                    `Updated class name for ${result.updated} students`
                  );
                } else {
                  console.error(
                    "Failed to update class name in student records:",
                    await updateResponse.text()
                  );
                }
              } catch (error) {
                console.error(
                  "Error updating class name in student records:",
                  error
                );
              }
            }

            // Update students' classCode field
            // await updateStudentsClassCode(typedEntity);
          }}
          onAfterDelete={async (deletedEntity) => {
            console.log("Entity deleted:", deletedEntity);

            // Extract the class code from the deleted entity
            const classData = deletedEntity.data as unknown as ClassData;

            if (classData && classData.classCode) {
              // Remove this class from all student records
              await removeClassFromAllStudents(classData.classCode);
            }
          }}
          onAfterGroupDelete={async (deletedEntities) => {
            console.log("Entities deleted:", deletedEntities);

            // Process each deleted class
            for (const deletedEntity of deletedEntities) {
              const classData = deletedEntity.data as unknown as ClassData;

              if (classData && classData.classCode) {
                // Remove this class from all student records
                await removeClassFromAllStudents(classData.classCode);
              }
            }
          }}
        />

        {/* Import Students Modal */}
        {selectedClass && (
          <ImportStudentsModal
            isOpen={importModalOpen}
            onClose={() => {
              setImportModalOpen(false);
              setSelectedClass(null);
            }}
            onImport={processImportedStudents}
            classCode={selectedClass.code}
            className={selectedClass.name}
            schoolCode={user?.schoolCode || ""}
          />
        )}

        {/* Students List Modal */}
        <Dialog
          open={studentsModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              setStudentsModalOpen(false);
              setSelectedClassForStudents(null);
              setStudentsData([]);
              setLoadingStudents(false);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-blue-600" />
                دانش آموزان کلاس{" "}
                {selectedClassForStudents?.name || ""}
                {selectedClassForStudents?.code && (
                  <Badge variant="secondary" className="text-sm">
                    کد: {selectedClassForStudents.code}
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="mr-2 text-gray-600">در حال بارگذاری...</span>
                </div>
              ) : studentsData.length === 0 ? (
                <div className="text-center py-8">
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    هیچ دانش آموزی در این کلاس یافت نشد
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">
                      تعداد دانش آموزان: {studentsData.length}
                    </h3>
                  </div>
                  
                  <div className="grid gap-3">
                    {studentsData.map((student, index) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                {student.data.studentName || "نام نامشخص"}{" "}
                                {student.data.studentFamily || ""}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                کد: {student.data.studentCode}
                              </Badge>
                            </div>
                            {student.data.phone && (
                              <p className="text-sm text-gray-600 mt-1">
                                تلفن: {student.data.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Help Panel */}
        <HelpPanel
          isOpen={helpPanelOpen}
          onClose={() => setHelpPanelOpen(false)}
          title="راهنمای مدیریت کلاس‌ها"
          sections={classesHelpSections}
        />

        {/* Floating Help Button */}
        <div className="fixed bottom-6 left-6 z-30">
          <Button
            onClick={() => setHelpPanelOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            size="sm"
          >
            <QuestionMarkCircleIcon className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          </Button>
          <div className="absolute -top-12 -right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            راهنمای استفاده
          </div>
        </div>
      </div>
    </main>
  );
}

// Define the interface for a student record from the database
interface StudentRecord {
  _id: string;
  data: {
    studentCode: string;
    studentName?: string;
    studentFamily?: string;
    classCode?: Array<{
      label: string;
      value: string;
    }>;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

// Define the interface for the class data structure
interface ClassData {
  classCode: string;
  className: string;
  schoolCode: string;
  students?: Array<{
    studentCode: string;
    studentName?: string;
    studentlname?: string;
    phone?: string;
  }>;
  [key: string]: unknown;
}

// Function to update students' classCode field in the students collection
async function updateStudentsClassCode(entity: ClassData) {
  // Check if entity has students array
  if (!entity.students || !Array.isArray(entity.students)) {
    console.log("No students to update");
    return;
  }

  // Make sure we have the required data (classCode and className)
  if (!entity.classCode || !entity.className) {
    console.log("Missing required class data (classCode or className)");
    return;
  }

  console.log("entity.students", entity.students);

  try {
    // Create class info object to be assigned to each student
    const classInfo = {
      label: entity.className,
      value: entity.classCode,
    };

    console.log(
      `Updating ${entity.students.length} students with class: ${entity.className} (${entity.classCode})`
    );

    // For checking which students were removed from the class
    // First, get all students who are currently assigned to this class
    console.log("Finding students assigned to class", entity.classCode);
    const findClassStudentsResponse = await fetch(
      `/api/students/findByClass?classCode=${entity.classCode}`,
      {
        headers: {
          "x-domain": window.location.host,
        },
      }
    );

    let currentStudentCodes: string[] = [];
    let studentsToRemove: StudentRecord[] = [];

    if (findClassStudentsResponse.ok) {
      const result = await findClassStudentsResponse.json();
      if (result.data && result.data.length > 0) {
        currentStudentCodes = result.data.map((student: StudentRecord) =>
          student.data.studentCode.toString()
        );

        // Get new student codes from the updated entity
        const newStudentCodes = entity.students.map((student) =>
          student.studentCode.toString()
        );

        // Find students who were removed (in current list but not in new list)
        const removedStudentCodes = currentStudentCodes.filter(
          (code) => !newStudentCodes.includes(code)
        );

        // Get the full student records for the removed students
        studentsToRemove = result.data.filter((student: StudentRecord) =>
          removedStudentCodes.includes(student.data.studentCode.toString())
        );

        console.log(
          `Found ${studentsToRemove.length} students to remove from class`
        );
      }
    } else {
      console.error("Failed to find current students in class");
    }

    // Update each student in the students collection
    for (const student of entity.students) {
      if (!student.studentCode) {
        console.log("Missing studentCode for a student, skipping", student);
        continue;
      }

      try {
        // Use the new API endpoint to find student by code
        const findResponse = await fetch(
          `/api/students/findByCode?code=${student.studentCode.toString()}`,
          {
            headers: {
              "x-domain": window.location.host,
            },
          }
        );

        if (!findResponse.ok) {
          console.error(`Failed to find student ${student.studentCode}`);
          continue;
        }

        const findResult = await findResponse.json();
        console.log("findResult", findResult);
        if (!findResult.data || findResult.data.length === 0) {
          console.log(
            `Student with code ${student.studentCode} not found, will create new record`
          );

          // Create new student record if not found
          const createResponse = await fetch("/api/crud/students", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-domain": window.location.host,
            },
            body: JSON.stringify({
              data: {
                studentCode: student.studentCode.toString(),
                studentName: student.studentName || "",
                studentFamily: student.studentlname || "",
                phone: student.phone || "",
                schoolCode: entity.schoolCode,
                // Put classCode in an array to match existing schema
                classCode: [classInfo],
                // Add default values for required fields
                password: student.studentCode.toString(), // Default password same as student code
                isActive: true,
                groups: [],
                phones: [],
                premisions: [],
                premisions_expanded: false,
              },
              formStructure: [
                { name: "studentCode", type: "text" },
                { name: "studentName", type: "text" },
                { name: "studentFamily", type: "text" },
                { name: "phone", type: "text" },
                { name: "schoolCode", type: "text" },
                {
                  name: "classCode",
                  type: "autoCompleteText",
                  isMultiple: true,
                },
                { name: "password", type: "text" },
                { name: "isActive", type: "checkbox" },
                { name: "groups", type: "autoCompleteText", isMultiple: true },
                { name: "phones", type: "text", nestedType: "array" },
                { name: "premisions", type: "text", nestedType: "array" },
                { name: "premisions_expanded", type: "checkbox" },
              ],
            }),
          });

          if (!createResponse.ok) {
            console.error(
              `Failed to create student ${student.studentCode}:`,
              await createResponse.text()
            );
          } else {
            console.log(
              `Created new student ${student.studentCode} with classCode`
            );
          }

          continue;
        }

        // Student found, update with class info
        const studentRecord = findResult.data[0];
        const updateResponse = await fetch("/api/students/updateClassCode", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            studentId: studentRecord._id,
            classCode: [classInfo],
          }),
        });

        if (!updateResponse.ok) {
          console.error(
            `Failed to update student ${student.studentCode}:`,
            await updateResponse.text()
          );
        } else {
          console.log(`Updated classCode for student ${student.studentCode}`);
        }
      } catch (error) {
        console.error(
          `Error processing student ${student.studentCode}:`,
          error
        );
      }
    }

    // Remove class code from students who are no longer in the class
    for (const student of studentsToRemove) {
      try {
        console.log(
          `Removing class ${entity.classCode} from student ${student.data.studentCode}`
        );
        const removeResponse = await fetch("/api/students/removeClassCode", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            studentId: student._id,
            classCodeValue: entity.classCode,
          }),
        });

        if (!removeResponse.ok) {
          console.error(
            `Failed to remove class code from student ${student.data.studentCode}:`,
            await removeResponse.text()
          );
        } else {
          console.log(
            `Removed class code from student ${student.data.studentCode}`
          );
        }
      } catch (error) {
        console.error(
          `Error removing class code from student ${student.data.studentCode}:`,
          error
        );
      }
    }

    console.log("Finished updating students");
  } catch (error) {
    console.error("Error updating students' class codes:", error);
  }
}

// Function to remove a class from all student records
async function removeClassFromAllStudents(classCode: string) {
  if (!classCode) {
    console.log("Missing required class code");
    return;
  }

  console.log(`Removing class ${classCode} from all student records`);

  try {
    // Call the API to remove this class from all student records
    const removeResponse = await fetch(
      "/api/students/removeClassFromAllStudents",
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          classCode: classCode,
        }),
      }
    );

    if (removeResponse.ok) {
      const result = await removeResponse.json();
      console.log(`Removed class from ${result.updated} student records`);
      return result;
    } else {
      console.error(
        "Failed to remove class from student records:",
        await removeResponse.text()
      );
      return null;
    }
  } catch (error) {
    console.error("Error removing class from student records:", error);
    return null;
  }
}
