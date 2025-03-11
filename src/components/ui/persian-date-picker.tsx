"use client";

import * as React from "react";
import { Calendar } from "@hassanmojab/react-modern-calendar-datepicker";
import "@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css";
import { cn } from "@/lib/utils";

export interface PersianDateValue {
  year: number;
  month: number;
  day: number;
}

interface PersianDatePickerProps {
  value?: PersianDateValue | null;
  onChange: (date: PersianDateValue | null) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  colorPrimary?: string;
  colorPrimaryLight?: string;
}

const PersianDatePicker = React.forwardRef<
  HTMLDivElement,
  PersianDatePickerProps
>(
  (
    {
      value,
      onChange,
      className,
      disabled,
      placeholder = "انتخاب تاریخ",
      colorPrimary = "#2563eb",
      colorPrimaryLight = "rgba(37, 99, 235, 0.2)",
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn("w-full", className)}>
        <Calendar
          value={value}
          onChange={onChange}
          shouldHighlightWeekends
          locale="fa"
          colorPrimary={colorPrimary}
          colorPrimaryLight={colorPrimaryLight}
          inputPlaceholder={placeholder}
          disabled={disabled}
        />
      </div>
    );
  }
);

PersianDatePicker.displayName = "PersianDatePicker";

export { PersianDatePicker };
