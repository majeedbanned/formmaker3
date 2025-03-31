"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrinterIcon } from "lucide-react";
import dynamic from "next/dynamic";

// Class data interface
interface ClassData {
  classCode: string;
  className: string;
  schoolCode: string;
  students: Array<{
    studentCode: number;
    studentName: string;
    studentlname: string;
    phone: string;
  }>;
}

interface ClassDocument {
  data: ClassData;
}

// Define PDF component props type
interface PDFExportComponentProps {
  classData: ClassData;
  printStyle: "list" | "card";
}

// Import the PDF component with dynamic import to prevent SSR issues
const PDFExportComponent = dynamic<PDFExportComponentProps>(
  () => import("./components/PDFExportComponent"),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="flex items-center gap-2 bg-gray-400">
        <span>در حال بارگذاری...</span>
      </Button>
    ),
  }
);

export default function PrintsPage() {
  const { user, isLoading } = useAuth();
  const [classes, setClasses] = useState<ClassDocument[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [printStyle, setPrintStyle] = useState<"list" | "card">("list");

  useEffect(() => {
    if (user?.schoolCode) {
      fetchClasses(user.schoolCode);
    }
  }, [user]);

  // Fetch classes for the school
  const fetchClasses = async (schoolCode: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/classes?schoolCode=${schoolCode}`);

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data);

      // Set the first class as default if available
      if (data.length > 0) {
        setSelectedClass(data[0].data.classCode);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get selected class data
  const getSelectedClassData = () => {
    return classes.find((cls) => cls.data.classCode === selectedClass)?.data;
  };

  // Get the selected class's students
  const getSelectedClassStudents = () => {
    const classData = getSelectedClassData();
    return classData?.students || [];
  };

  // Handle printing directly from browser
  const handlePrint = () => {
    window.print();
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">چاپ اطلاعات دانش آموزان</h1>

      {/* Controls Card */}
      <Card className="mb-6 p-4 print:hidden">
        <div className="flex flex-col space-y-4">
          {/* Class selection and print options */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-4 rtl:space-x-reverse md:space-y-0 space-y-4">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium mb-1">کلاس</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="انتخاب کلاس" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem
                      key={cls.data.classCode}
                      value={cls.data.classCode}
                    >
                      {cls.data.className} ({cls.data.classCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button
                onClick={handlePrint}
                className="flex items-center gap-2"
                variant="outline"
              >
                <PrinterIcon className="h-4 w-4" />
                چاپ
              </Button>

              {selectedClass && getSelectedClassData() && (
                <PDFExportComponent
                  classData={getSelectedClassData() as ClassData}
                  printStyle={printStyle}
                />
              )}
            </div>
          </div>

          {/* Print style selection */}
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium mb-2">انتخاب نوع نمایش</h3>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button
                variant={printStyle === "list" ? "default" : "outline"}
                onClick={() => setPrintStyle("list")}
                className="min-w-24"
              >
                لیست
              </Button>
              <Button
                variant={printStyle === "card" ? "default" : "outline"}
                onClick={() => setPrintStyle("card")}
                className="min-w-24"
              >
                کارت دانش آموزی
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Content display based on selected style */}
      {selectedClass && (
        <div className="print-content">
          {printStyle === "list" ? (
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">
                {getSelectedClassData()?.className} - دانش آموزان
              </h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">کد دانش آموز</TableHead>
                      <TableHead className="text-right">نام</TableHead>
                      <TableHead className="text-right">نام خانوادگی</TableHead>
                      <TableHead className="text-right">شماره تماس</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getSelectedClassStudents().map((student, index) => (
                      <TableRow key={student.studentCode}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{student.studentCode}</TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell>{student.studentlname}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                      </TableRow>
                    ))}
                    {getSelectedClassStudents().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          هیچ دانش آموزی برای این کلاس ثبت نشده است
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {getSelectedClassStudents().map((student) => (
                <Card key={student.studentCode} className="p-4 flex flex-col">
                  <div className="border-b pb-2 mb-2">
                    <h3 className="text-lg font-bold">
                      {getSelectedClassData()?.className}
                    </h3>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">کد دانش آموز:</span>
                      <span>{student.studentCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">نام:</span>
                      <span>{student.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">نام خانوادگی:</span>
                      <span>{student.studentlname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">شماره تماس:</span>
                      <span>{student.phone}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
