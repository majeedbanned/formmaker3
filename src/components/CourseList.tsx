"use client";

import { useEffect, useState } from "react";
import { fetchCoursesBySchoolCode } from "@/app/actions/courseList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

type CourseOption = {
  label: string;
  value: string;
  code: string;
};

interface CourseListProps {
  schoolCode: string;
  onChange?: (value: string, course?: CourseOption) => void;
  value?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function CourseList({
  schoolCode,
  onChange,
  value,
  label = "Course",
  placeholder = "Select a course",
  required = false,
  className = "",
  disabled = false,
}: CourseListProps) {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      if (!schoolCode) {
        setCourses([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchCoursesBySchoolCode(schoolCode);

        if ("error" in result) {
          setError(result.error);
          setCourses([]);
        } else {
          setCourses(result);
        }
      } catch (err) {
        console.error("Error loading courses:", err);
        setError("Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [schoolCode]);

  const handleChange = (selectedValue: string) => {
    const selectedCourse = courses.find(
      (course) => course.value === selectedValue
    );
    if (onChange) {
      onChange(selectedValue, selectedCourse);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="course-select" className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <Select
        value={value || ""}
        onValueChange={handleChange}
        disabled={disabled || loading || courses.length === 0}
      >
        <SelectTrigger id="course-select">
          <SelectValue
            placeholder={loading ? "Loading courses..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          {courses.map((course) => (
            <SelectItem key={course.value} value={course.value}>
              {course.label} {course.code ? `(${course.code})` : ""}
            </SelectItem>
          ))}
          {courses.length === 0 && !loading && !error && (
            <SelectItem value="no-courses" disabled>
              No courses available
            </SelectItem>
          )}
          {error && (
            <SelectItem value="error" disabled>
              {error}
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
