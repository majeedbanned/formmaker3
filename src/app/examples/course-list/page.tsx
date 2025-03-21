"use client";

import { useState } from "react";
import CourseList from "@/components/CourseList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function CourseListExample() {
  const [schoolCode, setSchoolCode] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [tempSchoolCode, setTempSchoolCode] = useState<string>("");

  const handleSchoolCodeSubmit = () => {
    setSchoolCode(tempSchoolCode);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Course List Example</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Code Input</CardTitle>
            <CardDescription>
              Enter a school code to load courses for that school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="school-code" className="mb-2 block">
                  School Code
                </Label>
                <Input
                  id="school-code"
                  value={tempSchoolCode}
                  onChange={(e) => setTempSchoolCode(e.target.value)}
                  placeholder="Enter school code"
                />
              </div>
              <div className="mt-auto">
                <Button onClick={handleSchoolCodeSubmit}>Load Courses</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Selection</CardTitle>
            <CardDescription>Select a course from the dropdown</CardDescription>
          </CardHeader>
          <CardContent>
            <CourseList
              schoolCode={"2295566177"}
              teacherCode="102"
              value={selectedCourse}
              onChange={(value) => setSelectedCourse(value)}
              label="Select Course"
              required
            />

            {selectedCourse && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">Selected Course:</p>
                <code className="block mt-1">{selectedCourse}</code>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
