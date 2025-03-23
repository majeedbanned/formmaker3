// components/ClassSheet.jsx

"use client";
// components/ClassSheet.jsx
import React, { useState, useEffect } from "react";
import DatePicker from "react-multi-date-picker";
import type { Value } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Helper function: Convert Gregorian to Jalali
function gregorian_to_jalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

// Helper function: Convert numbers to Persian digits.
function toPersianDigits(num: number | string) {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num)
    .split("")
    .map((digit) => persianDigits[parseInt(digit, 10)])
    .join("");
}

// Helper function: Convert a Date object to a formatted Jalali date string.
function formatJalaliDate(date: Date) {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();
  const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);
  const jYear = toPersianDigits(jy);
  const jMonth = toPersianDigits(jm.toString().padStart(2, "0"));
  const jDay = toPersianDigits(jd.toString().padStart(2, "0"));
  return `${jYear}/${jMonth}/${jDay}`;
}

type WeeklySchedule = {
  day: string;
  timeSlot: string;
};

type TeacherCourse = {
  teacherCode: string;
  courseCode: string;
  weeklySchedule: WeeklySchedule[];
  weeklySchedule_expanded?: boolean;
};

type Student = {
  studentCode: number;
  studentName: string;
  studentlname: string;
  phone: string;
};

type ClassData = {
  classCode: string;
  className: string;
  major: string;
  Grade: string;
  schoolCode: string;
  teachers: TeacherCourse[];
  teachers_expanded?: boolean;
  students: Student[];
};

type ClassDocument = {
  data: ClassData;
};

type CourseOption = {
  value: string;
  teacherCode: string;
  courseCode: string;
  label: string;
  weeklySchedule: WeeklySchedule[];
};

type Column = {
  date: Date;
  day: string;
  timeSlot: string;
  formattedDate: string;
};

type CellData = {
  classCode: string;
  studentCode: number;
  teacherCode: string;
  courseCode: string;
  schoolCode: string;
  date: string;
  timeSlot: string;
  note: string;
};

const ClassSheet = ({
  schoolCode = "2295566177",
  teacherCode = "102",
  courseCode = "11131",
}: {
  schoolCode?: string;
  teacherCode?: string;
  courseCode?: string;
}) => {
  // Dummy class document data.
  const classDocument: ClassDocument = {
    data: {
      classCode: "232",
      className: "دوم سیب",
      major: "16000",
      Grade: "11",
      schoolCode: "2295566177",
      teachers: [
        {
          teacherCode: "102",
          courseCode: "11131",
          weeklySchedule: [
            { day: "سه‌شنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "9" },
            { day: "دوشنبه", timeSlot: "10" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "we",
          courseCode: "11111",
          weeklySchedule: [
            { day: "شنبه", timeSlot: "8" },
            { day: "پنج‌شنبه", timeSlot: "7" },
          ],
          weeklySchedule_expanded: true,
        },
        {
          teacherCode: "102",
          courseCode: "22222",
          weeklySchedule: [
            { day: "چهارشنبه", timeSlot: "11" },
            { day: "پنج‌شنبه", timeSlot: "12" },
          ],
          weeklySchedule_expanded: true,
        },
      ],
      teachers_expanded: true,
      students: [
        {
          studentCode: 2295845241,
          studentName: "رضا",
          studentlname: "شیری",
          phone: "9175231560",
        },
        {
          studentCode: 2286655145,
          studentName: "محمود",
          studentlname: "قادری",
          phone: "9120011451",
        },
        {
          studentCode: 2295566177,
          studentName: "نیما",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
        {
          studentCode: 2295566173,
          studentName: "قاسم",
          studentlname: "قاسمی",
          phone: "9177204118",
        },
      ],
    },
  };

  // Compute default start and end dates in Gregorian.
  const today = new Date();
  const defaultStart = new Date(today);
  defaultStart.setDate(today.getDate() - 7); // one week before today
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setDate(defaultStart.getDate() + 14); // two weeks after default start

  // Initialize useState hooks outside of conditionals
  const [selectedOption, setSelectedOption] = useState<
    CourseOption | undefined
  >(undefined);
  const [startDate, setStartDate] = useState<Value>(defaultStart);
  const [endDate, setEndDate] = useState<Value>(defaultEnd);

  // Build teacher–course options (filter by teacherCode if provided).
  const teacherCourses = teacherCode
    ? classDocument.data.teachers.filter((t) => t.teacherCode === teacherCode)
    : classDocument.data.teachers;

  const courseOptions: CourseOption[] = teacherCourses.map((t) => ({
    value: `${t.teacherCode}-${t.courseCode}`,
    teacherCode: t.teacherCode,
    courseCode: t.courseCode,
    label: `معلم ${t.teacherCode} - درس ${t.courseCode}`,
    weeklySchedule: t.weeklySchedule,
  }));

  // Determine the initial selection.
  const initialSelected =
    courseCode &&
    courseOptions.find((option) => option.courseCode === courseCode)
      ? courseOptions.find((option) => option.courseCode === courseCode)
      : courseOptions[0];

  // Set selectedOption if it's still undefined (first render)
  useEffect(() => {
    if (!selectedOption && initialSelected) {
      setSelectedOption(initialSelected);
    }
  }, [initialSelected, selectedOption]);

  // State for the modal and cell data
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    studentCode: number;
    columnIndex: number;
  } | null>(null);
  const [noteText, setNoteText] = useState("");
  const [cellsData, setCellsData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Create a unique key for each cell
  const getCellKey = (studentCode: number, column: Column) => {
    return `${classDocument.data.classCode}_${studentCode}_${
      selectedOption?.teacherCode
    }_${
      selectedOption?.courseCode
    }_${schoolCode}_${column.date.toISOString()}_${column.timeSlot}`;
  };

  // Format a cell key from database record
  const formatCellKeyFromDB = (cell: CellData) => {
    // Convert the date string to match the same format as getCellKey
    const dateObj = new Date(cell.date);
    return `${cell.classCode}_${cell.studentCode}_${cell.teacherCode}_${
      cell.courseCode
    }_${cell.schoolCode}_${dateObj.toISOString()}_${cell.timeSlot}`;
  };

  // Load saved cell data when component mounts or when selected option changes
  useEffect(() => {
    const loadCellData = async () => {
      if (!selectedOption) return;

      setIsLoading(true);
      try {
        const response = await fetch("/api/classsheet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classCode: classDocument.data.classCode,
            teacherCode: selectedOption.teacherCode,
            courseCode: selectedOption.courseCode,
            schoolCode: schoolCode,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch cell data");
        }

        const data = await response.json();
        console.log("Loaded data:", data);

        // Convert array of cell data to a dictionary for easier access
        const cellsDataMap: Record<string, string> = {};
        data.forEach((cell: CellData) => {
          const key = formatCellKeyFromDB(cell);
          cellsDataMap[key] = cell.note;
        });

        console.log("Cell data map:", cellsDataMap);
        setCellsData(cellsDataMap);
      } catch (error) {
        console.error("Error loading cell data:", error);
        toast.error("Failed to load saved data");
      } finally {
        setIsLoading(false);
      }
    };

    loadCellData();
  }, [selectedOption, classDocument.data.classCode, schoolCode]);

  // Handle cell click and display
  const getCellContent = (studentCode: number, column: Column): string => {
    const cellKey = getCellKey(studentCode, column);

    // Debug: Log the cell key we're trying to find
    if (process.env.NODE_ENV === "development") {
      const simpleDateStr = column.date.toISOString().split("T")[0];
      console.log(
        `Looking for cell: ${studentCode}-${simpleDateStr}-${column.timeSlot}`,
        `Key: ${cellKey}`,
        `Has data: ${cellsData[cellKey] ? "Yes" : "No"}`
      );
    }

    // Try to find the note in our cellsData
    if (cellsData[cellKey]) {
      return cellsData[cellKey];
    }

    // Try alternative key formats in case of date format issues
    // Create a simpler key without time part
    const dateStr = column.date.toISOString();
    const simpleDateKey = `${classDocument.data.classCode}_${studentCode}_${
      selectedOption?.teacherCode
    }_${selectedOption?.courseCode}_${schoolCode}_${
      dateStr.split("T")[0]
    }T00:00:00.000Z_${column.timeSlot}`;

    if (cellsData[simpleDateKey]) {
      return cellsData[simpleDateKey];
    }

    // If still not found, try to find by iterating through all keys
    const prefix = `${classDocument.data.classCode}_${studentCode}_${selectedOption?.teacherCode}_${selectedOption?.courseCode}_${schoolCode}_`;
    const datePart = column.date.toISOString().split("T")[0]; // Just the YYYY-MM-DD part

    for (const key of Object.keys(cellsData)) {
      if (
        key.startsWith(prefix) &&
        key.includes(datePart) &&
        key.endsWith(`_${column.timeSlot}`)
      ) {
        return cellsData[key];
      }
    }

    return "*";
  };

  // Handle cell click
  const handleCellClick = (
    studentCode: number,
    columnIndex: number,
    column: Column
  ) => {
    setSelectedCell({ studentCode, columnIndex });

    // Get the existing note for this cell, if any
    const cellContent = getCellContent(studentCode, column);
    setNoteText(cellContent === "*" ? "" : cellContent);

    setIsModalOpen(true);
  };

  // Save the note
  const handleSaveNote = async () => {
    if (!selectedCell || !selectedOption) return;

    const column = columns[selectedCell.columnIndex];
    const cellKey = getCellKey(selectedCell.studentCode, column);

    setIsLoading(true);
    try {
      const response = await fetch("/api/classsheet/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classCode: classDocument.data.classCode,
          studentCode: selectedCell.studentCode,
          teacherCode: selectedOption.teacherCode,
          courseCode: selectedOption.courseCode,
          schoolCode: schoolCode,
          date: column.date.toISOString(),
          timeSlot: column.timeSlot,
          note: noteText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      // Update local state
      setCellsData((prev) => ({
        ...prev,
        [cellKey]: noteText,
      }));

      toast.success("Note saved successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  // Return early if no matching school code
  if (classDocument.data.schoolCode !== schoolCode) {
    return (
      <div className="p-4 text-center text-red-500">
        No class data available for the provided school code.
      </div>
    );
  }

  // Return early if no course options
  if (courseOptions.length === 0) {
    return (
      <div className="p-4 text-center text-red-500">
        No teacher courses available.
      </div>
    );
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const option = courseOptions.find((opt) => opt.value === selectedValue);
    setSelectedOption(option);
  };

  // Function to navigate dates forward or backward by two weeks
  const navigateTwoWeeks = (direction: "forward" | "backward") => {
    const startDt =
      startDate instanceof Date ? startDate : new Date(startDate as string);
    const endDt =
      endDate instanceof Date ? endDate : new Date(endDate as string);

    const daysToAdjust = direction === "forward" ? 14 : -14;

    startDt.setDate(startDt.getDate() + daysToAdjust);
    endDt.setDate(endDt.getDate() + daysToAdjust);

    setStartDate(startDt);
    setEndDate(endDt);
  };

  // Helper: Map JavaScript's getDay() to Persian day names (week starting from "شنبه").
  const getPersianDayName = (date: Date) => {
    // In JavaScript: 0 = Sunday, 1 = Monday, …, 6 = Saturday.
    // Mapping for a Persian week starting with "شنبه":
    const mapping: Record<number, string> = {
      6: "شنبه",
      0: "یکشنبه",
      1: "دوشنبه",
      2: "سه‌شنبه",
      3: "چهارشنبه",
      4: "پنج‌شنبه",
      5: "جمعه",
    };
    return mapping[date.getDay()];
  };

  // Compute dynamic columns based on the date range.
  const columns: Column[] = [];
  if (startDate && endDate) {
    const start =
      startDate instanceof Date ? startDate : new Date(startDate as string);
    const end = endDate instanceof Date ? endDate : new Date(endDate as string);
    // Iterate through each day in the range (inclusive).
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const currentDate = new Date(d);
      const persianDay = getPersianDayName(currentDate);
      // For each schedule slot, if its day matches the current date's Persian day name, add a column.
      if (selectedOption && selectedOption.weeklySchedule) {
        selectedOption.weeklySchedule.forEach((slot) => {
          if (slot.day === persianDay) {
            columns.push({
              date: new Date(currentDate),
              day: slot.day,
              timeSlot: slot.timeSlot,
              formattedDate: formatJalaliDate(currentDate),
            });
          }
        });
      }
    }
  }

  const { students } = classDocument.data;

  return (
    <div className="p-6 bg-gray-100" dir="rtl">
      {/* Teacher-Course Selection */}
      <div className="mb-6">
        <label
          htmlFor="course-select"
          className="block mb-2 text-lg font-medium text-gray-700"
        >
          انتخاب معلم-درس:
        </label>
        <select
          id="course-select"
          value={selectedOption?.value}
          onChange={handleSelectChange}
          className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {courseOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range and Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateTwoWeeks("backward")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            دو هفته قبل
          </button>

          <div className="text-center text-lg font-medium">
            {formatJalaliDate(
              startDate instanceof Date
                ? startDate
                : new Date(startDate as string)
            )}{" "}
            تا{" "}
            {formatJalaliDate(
              endDate instanceof Date ? endDate : new Date(endDate as string)
            )}
          </div>

          <button
            onClick={() => navigateTwoWeeks("forward")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
          >
            دو هفته بعد
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start-date"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              تاریخ شروع:
            </label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
              }}
              format="YYYY/MM/DD"
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              calendarPosition="bottom-right"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block mb-2 text-lg font-medium text-gray-700"
            >
              تاریخ پایان:
            </label>
            <DatePicker
              calendar={persian}
              locale={persian_fa}
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
              }}
              format="YYYY/MM/DD"
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              calendarPosition="bottom-right"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Schedule Sheet */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow rounded-lg table-fixed">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="sticky right-0 z-10 px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 bg-blue-600">
                نام دانش‌آموز
              </th>
              {columns.length > 0 ? (
                columns.map((col, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 text-sm whitespace-normal"
                  >
                    {`${col.day}-زنگ ${col.timeSlot} (${col.formattedDate})`}
                  </th>
                ))
              ) : (
                <th className="px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300">
                  لطفاً تاریخ شروع و پایان را وارد کنید
                </th>
              )}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {students.map((student) => {
              const fullName = `${student.studentName} ${student.studentlname}`;
              return (
                <tr key={student.studentCode} className="hover:bg-gray-50">
                  <td className="sticky right-0 z-10 px-4 py-3 w-[150px] min-w-[150px] h-14 border border-gray-300 bg-white">
                    {fullName}
                  </td>
                  {columns.map((col, index) => {
                    const cellContent = getCellContent(
                      student.studentCode,
                      col
                    );

                    return (
                      <td
                        key={`cell-${student.studentCode}-${index}`}
                        className="px-4 py-3 w-[150px] min-w-[150px] h-14 text-center border border-gray-300 cursor-pointer hover:bg-gray-200 overflow-hidden text-ellipsis"
                        onClick={() =>
                          handleCellClick(student.studentCode, index, col)
                        }
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Note Input Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              یادداشت برای{" "}
              {selectedCell &&
                students.find((s) => s.studentCode === selectedCell.studentCode)
                  ?.studentName}{" "}
              {selectedCell &&
                students.find((s) => s.studentCode === selectedCell.studentCode)
                  ?.studentlname}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="یادداشت خود را وارد کنید..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              انصراف
            </Button>
            <Button type="button" onClick={handleSaveNote} disabled={isLoading}>
              {isLoading ? "در حال ذخیره..." : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassSheet;
