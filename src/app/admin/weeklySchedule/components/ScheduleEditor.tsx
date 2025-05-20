"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Define types
type WeeklyScheduleItem = {
  day: string;
  timeSlot: string;
};

type TeacherData = {
  teacherCode: string;
  teacherName: string;
};

type CourseData = {
  courseCode: string;
  courseName: string;
};

type ScheduleEditorProps = {
  open: boolean;
  onClose: () => void;
  teacherData: TeacherData;
  courseData: CourseData;
  currentSchedule: WeeklyScheduleItem[];
  onSave: (schedule: WeeklyScheduleItem[]) => Promise<void>;
};

const DAYS_OF_WEEK = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
];

const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => String(i + 1));

export const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  open,
  onClose,
  teacherData,
  courseData,
  currentSchedule,
  onSave,
}) => {
  const [schedule, setSchedule] = useState<WeeklyScheduleItem[]>(
    currentSchedule || []
  );
  const [saving, setSaving] = useState(false);

  // Check if a specific day and time slot is selected
  const isSelected = (day: string, timeSlot: string): boolean => {
    return schedule.some(
      (item) => item.day === day && item.timeSlot === timeSlot
    );
  };

  // Toggle selection of a day and time slot
  const toggleSelection = (day: string, timeSlot: string) => {
    if (isSelected(day, timeSlot)) {
      // Remove if already selected
      setSchedule(
        schedule.filter(
          (item) => !(item.day === day && item.timeSlot === timeSlot)
        )
      );
    } else {
      // Add if not selected
      setSchedule([...schedule, { day, timeSlot }]);
    }
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(schedule);
      toast.success("برنامه هفتگی با موفقیت به‌روزرسانی شد");
      onClose();
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("خطا در ذخیره‌سازی برنامه هفتگی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            ویرایش برنامه هفتگی - {courseData.courseName} (معلم:{" "}
            {teacherData.teacherName})
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-8 gap-2 mt-4">
          {/* Header row with days */}
          <div className="col-span-1"></div>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-bold">
              {day}
            </div>
          ))}

          {/* Time slots grid */}
          {TIME_SLOTS.map((timeSlot) => (
            <React.Fragment key={timeSlot}>
              {/* Time slot label */}
              <div className="text-center font-bold py-2 bg-gray-100 rounded">
                {timeSlot}
              </div>

              {/* Checkboxes for each day */}
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={`${timeSlot}-${day}`}
                  className="flex justify-center items-center border rounded p-2"
                >
                  <Checkbox
                    id={`${timeSlot}-${day}`}
                    checked={isSelected(day, timeSlot)}
                    onCheckedChange={() => toggleSelection(day, timeSlot)}
                  />
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره برنامه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
