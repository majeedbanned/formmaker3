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
  printStyle: "list" | "card";
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
  },
  tableHeaderRow: {
    flexDirection: "row-reverse", // RTL support
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#f0f0f0",
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 6,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
    textAlign: "right",
  },
  card: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 5,
  },
  cardHeader: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 5,
  },
  cardRow: {
    flexDirection: "row-reverse", // RTL support
    justifyContent: "space-between",
    marginBottom: 5,
  },
  cardLabel: {
    fontSize: 10,
    color: "#666",
  },
  cardValue: {
    fontSize: 10,
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
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>
        لیست دانش آموزان کلاس {classData.className} ({classData.classCode})
      </Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <View style={[styles.tableCol, { width: "10%" }]}>
            <Text style={styles.tableCellHeader}>#</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCellHeader}>کد دانش آموز</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCellHeader}>نام</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCellHeader}>نام خانوادگی</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCellHeader}>شماره تماس</Text>
          </View>
        </View>
        {classData.students.map((student, index) => (
          <View style={styles.tableRow} key={`student-${student.studentCode}`}>
            <View style={[styles.tableCol, { width: "10%" }]}>
              <Text style={styles.tableCell}>{index + 1}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{student.studentCode}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{student.studentName}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{student.studentlname}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{student.phone}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

// Component to render student cards
const StudentCardsPDF = ({
  classData,
}: {
  classData: PDFExportComponentProps["classData"];
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>
        کارت‌های دانش آموزان کلاس {classData.className} ({classData.classCode})
      </Text>
      <View style={styles.cardsContainer}>
        {classData.students.map((student) => (
          <View
            style={[styles.card, { width: "45%" }]}
            key={`card-${student.studentCode}`}
          >
            <Text style={styles.cardHeader}>{classData.className}</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>کد دانش آموز:</Text>
              <Text style={styles.cardValue}>{student.studentCode}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>نام:</Text>
              <Text style={styles.cardValue}>{student.studentName}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>نام خانوادگی:</Text>
              <Text style={styles.cardValue}>{student.studentlname}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>شماره تماس:</Text>
              <Text style={styles.cardValue}>{student.phone}</Text>
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

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

      const MyDocument =
        printStyle === "list" ? (
          <StudentListPDF classData={classData} />
        ) : (
          <StudentCardsPDF classData={classData} />
        );

      const filename = `${classData.className}-${
        printStyle === "list" ? "list" : "cards"
      }.pdf`;

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
