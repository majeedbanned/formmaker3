"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "lucide-react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

// Register Farsi font
Font.register({
  family: "Vazir",
  src: "/fonts/Vazirmatn-Regular.ttf",
  fontStyle: "normal",
  fontWeight: "normal",
});

// Interface for the component props
interface PDFExportComponentProps {
  classData: {
    classCode: string;
    className: string;
    schoolCode: string;
    students: Array<{
      studentCode: number;
      studentName: string;
      studentlname: string;
      phone: string;
    }>;
  };
  printStyle: "list" | "card1" | "card2";
}

// Styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Vazir",
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row-reverse", // RTL support
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 18, // Ensure rows have minimum height
  },
  tableHeaderRow: {
    flexDirection: "row-reverse", // RTL support
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#e6e6e6", // Lighter gray for better print
    minHeight: 20, // Slightly taller header
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 4, // Slightly less padding for compact view
  },
  tableCellHeader: {
    margin: 3,
    fontSize: 9, // Smaller header fonts
    fontWeight: "bold",
    textAlign: "center", // Center header text
  },
  tableCell: {
    margin: 3,
    fontSize: 9,
    textAlign: "right",
  },
  // Card Style 1 - Modern style with border
  card1: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
  },
  card1Header: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 5,
  },
  card1Row: {
    flexDirection: "row-reverse", // RTL support
    justifyContent: "space-between",
    marginBottom: 5,
  },
  card1Label: {
    fontSize: 10,
    color: "#666",
  },
  card1Value: {
    fontSize: 10,
    fontWeight: "bold",
  },
  // Card Style 2 - Colorful card with background
  card2: {
    margin: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f0f7ff",
    borderWidth: 1,
    borderColor: "#3b82f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  card2Header: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "bold",
    color: "#1e40af",
    backgroundColor: "#dbeafe",
    padding: 5,
    borderRadius: 4,
  },
  card2Row: {
    flexDirection: "row-reverse", // RTL support
    alignItems: "center",
    marginBottom: 8,
  },
  card2Label: {
    fontSize: 10,
    color: "#4b5563",
    marginLeft: 5,
    width: "40%",
    textAlign: "right",
  },
  card2Value: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1f2937",
    width: "60%",
    textAlign: "right",
    backgroundColor: "#f9fafb",
    padding: 3,
    borderRadius: 3,
  },
  cardsContainer: {
    flexDirection: "row-reverse", // RTL support
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
});

// Component to render student list
const StudentListPDF = ({
  classData,
}: {
  classData: PDFExportComponentProps["classData"];
}) => {
  // Sort students by family name (studentlname)
  const sortedStudents = [...classData.students].sort((a, b) =>
    a.studentlname.localeCompare(b.studentlname)
  );

  // Generate 10 Persian dates starting from today
  const generatePersianDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Format date to Persian format
      const persianDate = date.toLocaleDateString("fa-IR", {
        month: "numeric",
        day: "numeric",
      });
      dates.push(persianDate);
    }

    return dates;
  };

  const persianDates = generatePersianDates();

  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={{
          ...styles.page,
          padding: 15, // Smaller padding to use more screen space
        }}
      >
        <Text
          style={{
            ...styles.header,
            fontSize: 14, // Smaller font for header
            marginBottom: 10, // Less margin to save space
          }}
        >
          لیست دانش آموزان کلاس {classData.className} ({classData.classCode})
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <View style={[styles.tableCol, { width: "4%" }]}>
              <Text style={styles.tableCellHeader}>#</Text>
            </View>
            <View style={[styles.tableCol, { width: "8%" }]}>
              <Text style={styles.tableCellHeader}>کد</Text>
            </View>
            <View style={[styles.tableCol, { width: "12%" }]}>
              <Text style={styles.tableCellHeader}>نام</Text>
            </View>
            <View style={[styles.tableCol, { width: "15%" }]}>
              <Text style={styles.tableCellHeader}>نام خانوادگی</Text>
            </View>

            {/* 10 free columns with Persian dates */}
            {persianDates.map((date, i) => (
              <View
                key={`freeCol-${i}`}
                style={[styles.tableCol, { width: "6.1%" }]}
              >
                <Text style={styles.tableCellHeader}>{date}</Text>
              </View>
            ))}
          </View>

          {sortedStudents.map((student, index) => (
            <View
              style={styles.tableRow}
              key={`student-${student.studentCode}`}
            >
              <View style={[styles.tableCol, { width: "4%" }]}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={[styles.tableCol, { width: "8%" }]}>
                <Text style={styles.tableCell}>{student.studentCode}</Text>
              </View>
              <View style={[styles.tableCol, { width: "12%" }]}>
                <Text style={styles.tableCell}>{student.studentName}</Text>
              </View>
              <View style={[styles.tableCol, { width: "15%" }]}>
                <Text style={styles.tableCell}>{student.studentlname}</Text>
              </View>

              {/* 10 free columns for user to write */}
              {Array.from({ length: 10 }).map((_, i) => (
                <View
                  key={`freeCol-${i}-${student.studentCode}`}
                  style={[styles.tableCol, { width: "6.1%" }]}
                >
                  <Text style={styles.tableCell}></Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Page footer with date and info */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            fontSize: 8,
            paddingHorizontal: 15,
          }}
        >
          <Text>تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}</Text>
          <Text>
            کلاس {classData.className} - تعداد دانش آموزان:{" "}
            {classData.students.length}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// Component to render student cards - Style 1
const StudentCards1PDF = ({
  classData,
}: {
  classData: PDFExportComponentProps["classData"];
}) => {
  // Sort students by family name
  const sortedStudents = [...classData.students].sort((a, b) =>
    a.studentlname.localeCompare(b.studentlname)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          کارت‌های دانش آموزان کلاس {classData.className} ({classData.classCode}
          )
        </Text>
        <View style={styles.cardsContainer}>
          {sortedStudents.map((student) => (
            <View
              style={[styles.card1, { width: "45%" }]}
              key={`card-${student.studentCode}`}
            >
              <Text style={styles.card1Header}>کلاس {classData.className}</Text>
              <View style={styles.card1Row}>
                <Text style={styles.card1Label}>کد دانش آموز:</Text>
                <Text style={styles.card1Value}>{student.studentCode}</Text>
              </View>
              <View style={styles.card1Row}>
                <Text style={styles.card1Label}>نام:</Text>
                <Text style={styles.card1Value}>{student.studentName}</Text>
              </View>
              <View style={styles.card1Row}>
                <Text style={styles.card1Label}>نام خانوادگی:</Text>
                <Text style={styles.card1Value}>{student.studentlname}</Text>
              </View>
              <View style={styles.card1Row}>
                <Text style={styles.card1Label}>شماره تماس:</Text>
                <Text style={styles.card1Value}>{student.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Page footer with date */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            flexDirection: "row-reverse",
            justifyContent: "center",
            fontSize: 8,
          }}
        >
          <Text>تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}</Text>
        </View>
      </Page>
    </Document>
  );
};

// Component to render student cards - Style 2
const StudentCards2PDF = ({
  classData,
}: {
  classData: PDFExportComponentProps["classData"];
}) => {
  // Sort students by family name
  const sortedStudents = [...classData.students].sort((a, b) =>
    a.studentlname.localeCompare(b.studentlname)
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>
          کارت‌های دانش آموزان کلاس {classData.className} ({classData.classCode}
          )
        </Text>
        <View style={styles.cardsContainer}>
          {sortedStudents.map((student) => (
            <View
              style={[styles.card2, { width: "46%" }]}
              key={`card-${student.studentCode}`}
            >
              <Text style={styles.card2Header}>
                دانش آموز کلاس {classData.className}
              </Text>
              <View style={styles.card2Row}>
                <Text style={styles.card2Label}>کد دانش آموز:</Text>
                <Text style={styles.card2Value}>{student.studentCode}</Text>
              </View>
              <View style={styles.card2Row}>
                <Text style={styles.card2Label}>نام:</Text>
                <Text style={styles.card2Value}>{student.studentName}</Text>
              </View>
              <View style={styles.card2Row}>
                <Text style={styles.card2Label}>نام خانوادگی:</Text>
                <Text style={styles.card2Value}>{student.studentlname}</Text>
              </View>
              <View style={styles.card2Row}>
                <Text style={styles.card2Label}>شماره تماس:</Text>
                <Text style={styles.card2Value}>{student.phone}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Page footer with date */}
        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 0,
            right: 0,
            flexDirection: "row-reverse",
            justifyContent: "center",
            fontSize: 8,
          }}
        >
          <Text>تاریخ چاپ: {new Date().toLocaleDateString("fa-IR")}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default function PDFExportComponent({
  classData,
  printStyle,
}: PDFExportComponentProps) {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to generate and download PDF
  const handleDownload = async () => {
    try {
      if (!isClient) return;

      setIsLoading(true);

      let MyDocument;
      if (printStyle === "list") {
        MyDocument = <StudentListPDF classData={classData} />;
      } else if (printStyle === "card1") {
        MyDocument = <StudentCards1PDF classData={classData} />;
      } else {
        MyDocument = <StudentCards2PDF classData={classData} />;
      }

      const printStyleName =
        printStyle === "list"
          ? "list"
          : printStyle === "card1"
          ? "card-style1"
          : "card-style2";

      const filename = `${classData.className}-${printStyleName}.pdf`;

      // Create the PDF blob
      const blob = await pdf(MyDocument).toBlob();

      // Create URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsLoading(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      disabled={isLoading || !isClient}
      className="flex items-center gap-2"
      variant="default"
      onClick={handleDownload}
    >
      <FileIcon className="h-4 w-4" />
      {isLoading ? "در حال آماده‌سازی..." : "دانلود PDF"}
    </Button>
  );
}
