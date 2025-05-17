"use client";

import React from "react";
import { type PDFOptions } from "./types";

// Define the Student interface directly to avoid import issues
interface Student {
  studentCode: string;
  studentName: string;
  studentFamily: string;
  classCode?: string;
  className?: string;
}

// Default PDF options
export const defaultPDFOptions: PDFOptions = {
  showHeader: true,
  showFooter: true,
  showWatermark: true,
  headerColor: "#f0f0f0", // Light gray
  footerText: "این سند به صورت خودکار تولید شده است",
  columnsPerPage: 1,
  paperSize: "A4",
  orientation: "portrait",
  font: "Vazirmatn",
  margin: 20,
};

// Function to strip HTML tags from content for PDF
const stripHtml = (html: string) => {
  return html
    .replace(/<[^>]*>?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
};

// Extract simple formatting from HTML content
const parseContent = (html: string) => {
  // First, replace <br> with \n for line breaks
  let parsed = html.replace(/<br\s*\/?>/gi, "\n");

  // Replace paragraphs with line breaks
  parsed = parsed.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");

  // Handle lists (this is simplified)
  parsed = parsed.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");

  // Strip remaining HTML tags
  return stripHtml(parsed);
};

// Helper function to convert ArrayBuffer to Base64 string (browser-compatible)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface PublicationDocumentProps {
  title: string;
  content: string;
  student: Student;
  date: string;
  options?: Partial<PDFOptions>;
}

// Function to generate PDF using jspdf
export const generatePDF = async (
  props: PublicationDocumentProps
): Promise<Blob> => {
  const { title, content, student, date, options = {} } = props;

  // Merge default options with provided options
  const pdfOptions: PDFOptions = { ...defaultPDFOptions, ...options };

  // Parse and format the HTML content
  const parsedContent = parseContent(content);

  try {
    // Dynamically import jspdf
    const jspdfModule = await import("jspdf");

    // Create PDF document with orientation from options
    const pdf = new jspdfModule.default({
      orientation: pdfOptions.orientation,
      unit: "mm",
      format: pdfOptions.paperSize,
      compress: true, // Enable compression
    });

    // Add Farsi font
    let fontLoaded = false;
    try {
      // Add Vazirmatn font for Farsi text support
      const fontPath = `/fonts/${pdfOptions.font}-Regular.ttf`;

      // Get the font data
      const fontResponse = await fetch(fontPath, {
        cache: "force-cache", // Use cache when available
      });

      if (!fontResponse.ok) {
        console.warn("Could not load preferred font, falling back to default");
        throw new Error("Could not load font");
      }

      const fontArrayBuffer = await fontResponse.arrayBuffer();

      // Convert ArrayBuffer to Base64 string for jsPDF
      const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

      // Add the font to PDF with subset embedding to reduce size
      pdf.addFileToVFS(`${pdfOptions.font}-Regular.ttf`, fontBase64);
      pdf.addFont(
        `${pdfOptions.font}-Regular.ttf`,
        pdfOptions.font,
        "normal",
        "Identity-H"
      );

      // Also add bold font if available
      try {
        const boldFontPath = `/fonts/${pdfOptions.font}-Bold.ttf`;
        const boldFontResponse = await fetch(boldFontPath, {
          cache: "force-cache", // Use cache when available
        });

        if (boldFontResponse.ok) {
          const boldFontArrayBuffer = await boldFontResponse.arrayBuffer();
          const boldFontBase64 = arrayBufferToBase64(boldFontArrayBuffer);

          pdf.addFileToVFS(`${pdfOptions.font}-Bold.ttf`, boldFontBase64);
          pdf.addFont(
            `${pdfOptions.font}-Bold.ttf`,
            pdfOptions.font,
            "bold",
            "Identity-H"
          );
        }
      } catch (boldFontError) {
        console.error("Failed to load bold Farsi font:", boldFontError);
        // Continue with normal font for bold
      }

      // Set the font
      pdf.setFont(pdfOptions.font);
      fontLoaded = true;
    } catch (fontError) {
      console.error("Failed to load Farsi font:", fontError);
      // Continue with default font if can't load Vazirmatn
      fontLoaded = false;
    }

    // Page dimensions
    let pageWidth, pageHeight;

    if (pdfOptions.orientation === "portrait") {
      if (pdfOptions.paperSize === "A4") {
        pageWidth = 210;
        pageHeight = 297;
      } else if (pdfOptions.paperSize === "A5") {
        pageWidth = 148;
        pageHeight = 210;
      } else {
        // Letter
        pageWidth = 215.9;
        pageHeight = 279.4;
      }
    } else {
      // landscape
      if (pdfOptions.paperSize === "A4") {
        pageWidth = 297;
        pageHeight = 210;
      } else if (pdfOptions.paperSize === "A5") {
        pageWidth = 210;
        pageHeight = 148;
      } else {
        // Letter
        pageWidth = 279.4;
        pageHeight = 215.9;
      }
    }

    // Define margins
    const margin = pdfOptions.margin;
    const contentWidth = pageWidth - margin * 2;

    // Set header if enabled
    if (pdfOptions.showHeader) {
      pdf.setFillColor(
        parseInt(pdfOptions.headerColor.substring(1, 3), 16),
        parseInt(pdfOptions.headerColor.substring(3, 5), 16),
        parseInt(pdfOptions.headerColor.substring(5, 7), 16)
      );
      pdf.rect(0, 0, pageWidth, 40, "F");
    }

    // Add watermark if enabled
    if (pdfOptions.showWatermark) {
      pdf.setTextColor(220, 220, 220); // Light gray for watermark
      pdf.setFontSize(60);
      pdf.text("رسمی", pageWidth / 2, pageHeight / 2, {
        align: "center",
        angle: 45,
      });
    }

    // Reset text color for content
    pdf.setTextColor(0, 0, 0);

    // Add title
    if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
    pdf.setFontSize(16);
    pdf.text(title, pageWidth - margin, margin + 5, { align: "right" });

    // Add student information
    if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
    pdf.setFontSize(12);
    pdf.text(
      `نام و نام خانوادگی: ${student.studentName} ${student.studentFamily}`,
      pageWidth - margin,
      margin + 20,
      { align: "right" }
    );
    pdf.text(
      `کد دانش‌آموزی: ${student.studentCode}`,
      pageWidth - margin,
      margin + 30,
      { align: "right" }
    );
    pdf.text(`کلاس: ${student.className || ""}`, margin, margin + 30, {
      align: "left",
    });
    pdf.text(`تاریخ: ${date}`, margin, margin + 20, { align: "left" });

    // Add horizontal line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, margin + 40, pageWidth - margin, margin + 40);

    // Calculate columns if more than 1 column is specified
    const columnWidth = contentWidth / pdfOptions.columnsPerPage;
    const columnGap = 10; // Gap between columns

    // Handle multi-column layout
    if (pdfOptions.columnsPerPage > 1) {
      const textLines = pdf.splitTextToSize(
        parsedContent,
        columnWidth - columnGap
      );

      // Calculate lines per column (approximate)
      const lineHeight = 6; // approximate line height in mm
      const contentHeight = pageHeight - margin * 2 - 50; // account for header and student info
      const maxLinesPerColumn = Math.floor(contentHeight / lineHeight);

      // Distribute text across columns
      let currentLine = 0;
      let columnIndex = 0;

      while (currentLine < textLines.length) {
        const columnX = pageWidth - margin - columnIndex * columnWidth;
        const columnLines = textLines.slice(
          currentLine,
          currentLine + maxLinesPerColumn
        );

        // Add content with line wrapping for this column
        if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
        pdf.setFontSize(12);
        pdf.text(columnLines, columnX, margin + 50, { align: "right" });

        // Move to next column
        currentLine += maxLinesPerColumn;
        columnIndex++;

        // If we've filled all columns on this page, add a new page and reset column index
        if (
          columnIndex >= pdfOptions.columnsPerPage &&
          currentLine < textLines.length
        ) {
          pdf.addPage();

          // Reset column index for the new page
          columnIndex = 0;

          // Add header to new page if enabled
          if (pdfOptions.showHeader) {
            pdf.setFillColor(
              parseInt(pdfOptions.headerColor.substring(1, 3), 16),
              parseInt(pdfOptions.headerColor.substring(3, 5), 16),
              parseInt(pdfOptions.headerColor.substring(5, 7), 16)
            );
            pdf.rect(0, 0, pageWidth, 40, "F");
          }

          // Add title to new page
          if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
          pdf.setFontSize(16);
          pdf.text(title, pageWidth - margin, margin + 5, { align: "right" });

          // Add footer to new page if enabled
          if (pdfOptions.showFooter) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(
              margin,
              pageHeight - 30,
              pageWidth - margin,
              pageHeight - 30
            );
            pdf.setFontSize(10);
            pdf.text(
              `${pdfOptions.footerText} - ${date}`,
              pageWidth / 2,
              pageHeight - 20,
              { align: "center" }
            );
          }
        }
      }
    } else {
      // Single column layout (original approach)
      // Add content with line wrapping
      if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
      pdf.setFontSize(12);

      // Split text into lines and add them with proper RTL support
      const textLines = pdf.splitTextToSize(parsedContent, contentWidth);
      pdf.text(textLines, pageWidth - margin, margin + 50, { align: "right" });
    }

    // Add footer if enabled
    if (pdfOptions.showFooter) {
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
      pdf.setFontSize(10);
      pdf.text(
        `${pdfOptions.footerText} - ${date}`,
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );
    }

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF. Please try again later.");
  }
};

// Function to generate a combined PDF with multiple students' content
export const generateCombinedPDF = async (props: {
  title: string;
  content: string;
  students: Student[];
  date: string;
  replaceVariables: (content: string, student: Student) => string;
  options?: Partial<PDFOptions>;
}): Promise<Blob> => {
  const {
    title,
    content,
    students,
    date,
    replaceVariables,
    options = {},
  } = props;

  // Merge default options with provided options
  const pdfOptions: PDFOptions = { ...defaultPDFOptions, ...options };

  try {
    // Dynamically import jspdf
    const jspdfModule = await import("jspdf");

    // Create PDF document with orientation from options
    const pdf = new jspdfModule.default({
      orientation: pdfOptions.orientation,
      unit: "mm",
      format: pdfOptions.paperSize,
      compress: true, // Enable compression
    });

    // Add Farsi font
    let fontLoaded = false;
    try {
      // Add Vazirmatn font for Farsi text support
      const fontPath = `/fonts/${pdfOptions.font}-Regular.ttf`;

      // Get the font data
      const fontResponse = await fetch(fontPath, {
        cache: "force-cache", // Use cache when available
      });

      if (!fontResponse.ok) {
        console.warn("Could not load preferred font, falling back to default");
        throw new Error("Could not load font");
      }

      const fontArrayBuffer = await fontResponse.arrayBuffer();

      // Convert ArrayBuffer to Base64 string for jsPDF
      const fontBase64 = arrayBufferToBase64(fontArrayBuffer);

      // Add the font to PDF with subset embedding to reduce size
      pdf.addFileToVFS(`${pdfOptions.font}-Regular.ttf`, fontBase64);
      pdf.addFont(
        `${pdfOptions.font}-Regular.ttf`,
        pdfOptions.font,
        "normal",
        "Identity-H"
      );

      // Also add bold font if available
      try {
        const boldFontPath = `/fonts/${pdfOptions.font}-Bold.ttf`;
        const boldFontResponse = await fetch(boldFontPath, {
          cache: "force-cache", // Use cache when available
        });

        if (boldFontResponse.ok) {
          const boldFontArrayBuffer = await boldFontResponse.arrayBuffer();
          const boldFontBase64 = arrayBufferToBase64(boldFontArrayBuffer);

          pdf.addFileToVFS(`${pdfOptions.font}-Bold.ttf`, boldFontBase64);
          pdf.addFont(
            `${pdfOptions.font}-Bold.ttf`,
            pdfOptions.font,
            "bold",
            "Identity-H"
          );
        }
      } catch (boldFontError) {
        console.error("Failed to load bold Farsi font:", boldFontError);
      }

      // Set the font
      pdf.setFont(pdfOptions.font);
      fontLoaded = true;
    } catch (fontError) {
      console.error("Failed to load Farsi font:", fontError);
      // Continue with default font if can't load Vazirmatn
    }

    // Page dimensions
    let pageWidth, pageHeight;

    if (pdfOptions.orientation === "portrait") {
      if (pdfOptions.paperSize === "A4") {
        pageWidth = 210;
        pageHeight = 297;
      } else if (pdfOptions.paperSize === "A5") {
        pageWidth = 148;
        pageHeight = 210;
      } else {
        // Letter
        pageWidth = 215.9;
        pageHeight = 279.4;
      }
    } else {
      // landscape
      if (pdfOptions.paperSize === "A4") {
        pageWidth = 297;
        pageHeight = 210;
      } else if (pdfOptions.paperSize === "A5") {
        pageWidth = 210;
        pageHeight = 148;
      } else {
        // Letter
        pageWidth = 279.4;
        pageHeight = 215.9;
      }
    }

    // Define margins
    const margin = pdfOptions.margin;
    const contentWidth = pageWidth - margin * 2;

    // For each student, add content to PDF
    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Add a new page for each student after the first
      if (i > 0) {
        pdf.addPage();
      }

      // Personalize content for this student
      const personalizedContent = replaceVariables(content, student);
      const parsedContent = parseContent(personalizedContent);

      // Set header if enabled
      if (pdfOptions.showHeader) {
        pdf.setFillColor(
          parseInt(pdfOptions.headerColor.substring(1, 3), 16),
          parseInt(pdfOptions.headerColor.substring(3, 5), 16),
          parseInt(pdfOptions.headerColor.substring(5, 7), 16)
        );
        pdf.rect(0, 0, pageWidth, 40, "F");
      }

      // Add watermark if enabled
      if (pdfOptions.showWatermark) {
        pdf.setTextColor(220, 220, 220); // Light gray for watermark
        pdf.setFontSize(60);
        pdf.text("رسمی", pageWidth / 2, pageHeight / 2, {
          align: "center",
          angle: 45,
        });
      }

      // Reset text color for content
      pdf.setTextColor(0, 0, 0);

      // Add title
      if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
      pdf.setFontSize(16);
      pdf.text(title, pageWidth - margin, margin + 5, { align: "right" });

      // Add student information
      if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
      pdf.setFontSize(12);
      pdf.text(
        `نام و نام خانوادگی: ${student.studentName} ${student.studentFamily}`,
        pageWidth - margin,
        margin + 20,
        { align: "right" }
      );
      pdf.text(
        `کد دانش‌آموزی: ${student.studentCode}`,
        pageWidth - margin,
        margin + 30,
        { align: "right" }
      );
      pdf.text(`کلاس: ${student.className || ""}`, margin, margin + 30, {
        align: "left",
      });
      pdf.text(`تاریخ: ${date}`, margin, margin + 20, { align: "left" });

      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, margin + 40, pageWidth - margin, margin + 40);

      // Calculate columns if more than 1 column is specified
      const columnWidth = contentWidth / pdfOptions.columnsPerPage;
      const columnGap = 10; // Gap between columns

      // Handle multi-column layout
      if (pdfOptions.columnsPerPage > 1) {
        const textLines = pdf.splitTextToSize(
          parsedContent,
          columnWidth - columnGap
        );

        // Calculate lines per column (approximate)
        const lineHeight = 6; // approximate line height in mm
        const contentHeight = pageHeight - margin * 2 - 50; // account for header and student info
        const maxLinesPerColumn = Math.floor(contentHeight / lineHeight);

        // Distribute text across columns
        let currentLine = 0;
        let columnIndex = 0;

        while (currentLine < textLines.length) {
          const columnX = pageWidth - margin - columnIndex * columnWidth;
          const columnLines = textLines.slice(
            currentLine,
            currentLine + maxLinesPerColumn
          );

          // Add content with line wrapping for this column
          if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
          pdf.setFontSize(12);
          pdf.text(columnLines, columnX, margin + 50, { align: "right" });

          // Move to next column
          currentLine += maxLinesPerColumn;
          columnIndex++;

          // If we've filled all columns on this page, add a new page and reset column index
          if (
            columnIndex >= pdfOptions.columnsPerPage &&
            currentLine < textLines.length
          ) {
            pdf.addPage();

            // Reset column index for the new page
            columnIndex = 0;

            // Add header to new page if enabled
            if (pdfOptions.showHeader) {
              pdf.setFillColor(
                parseInt(pdfOptions.headerColor.substring(1, 3), 16),
                parseInt(pdfOptions.headerColor.substring(3, 5), 16),
                parseInt(pdfOptions.headerColor.substring(5, 7), 16)
              );
              pdf.rect(0, 0, pageWidth, 40, "F");
            }

            // Add watermark if enabled
            if (pdfOptions.showWatermark) {
              pdf.setTextColor(220, 220, 220); // Light gray for watermark
              pdf.setFontSize(60);
              pdf.text("رسمی", pageWidth / 2, pageHeight / 2, {
                align: "center",
                angle: 45,
              });

              // Reset text color for content
              pdf.setTextColor(0, 0, 0);
            }

            // Add note about continued text
            if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
            pdf.setFontSize(14);
            pdf.text(`${title} (ادامه)`, pageWidth - margin, margin + 15, {
              align: "right",
            });

            // Add student info summary
            if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
            pdf.setFontSize(10);
            pdf.text(
              `دانش‌آموز: ${student.studentName} ${student.studentFamily}`,
              pageWidth - margin,
              margin + 25,
              { align: "right" }
            );

            // Add horizontal line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, margin + 30, pageWidth - margin, margin + 30);

            // Add footer to new page if enabled
            if (pdfOptions.showFooter) {
              pdf.setDrawColor(200, 200, 200);
              pdf.line(
                margin,
                pageHeight - 30,
                pageWidth - margin,
                pageHeight - 30
              );
              pdf.setFontSize(10);
              pdf.text(
                `${pdfOptions.footerText} - ${date}`,
                pageWidth / 2,
                pageHeight - 20,
                { align: "center" }
              );
            }
          }
        }
      } else {
        // Single column layout (original approach)
        // Add content with line wrapping
        if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
        pdf.setFontSize(12);

        // Split text into lines and add them with proper RTL support
        const textLines = pdf.splitTextToSize(parsedContent, contentWidth);
        pdf.text(textLines, pageWidth - margin, margin + 50, {
          align: "right",
        });
      }

      // Add footer if enabled
      if (pdfOptions.showFooter) {
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);
        pdf.setFontSize(10);
        pdf.text(
          `${pdfOptions.footerText} - ${date}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: "center" }
        );
      }
    }

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating combined PDF:", error);
    throw new Error("Failed to generate combined PDF. Please try again later.");
  }
};

// React component that serves as the API
export const PublicationDocument: React.FC<PublicationDocumentProps> = () => {
  // This component doesn't render anything directly, it's used for the API
  return null;
};
