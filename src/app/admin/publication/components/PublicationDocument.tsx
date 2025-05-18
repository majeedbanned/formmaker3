"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { type PDFOptions } from "./types";

// Define the Student interface directly to avoid import issues
interface Student {
  studentCode: string;
  studentName: string;
  studentFamily: string;
  classCode?: string;
  className?: string;
}

// Define a type for PDF with autoTable extensions
type AutoTableReturnValue = {
  finalY: number;
  [key: string]: unknown;
};

// Default PDF options
export const defaultPDFOptions: PDFOptions = {
  showHeader: true,
  showFooter: true,
  showWatermark: true,
  showStudentInfo: true,
  showTitle: true, // Show title by default
  headerColor: "#f0f0f0", // Light gray
  footerText: "این سند به صورت خودکار تولید شده است",
  columnsPerPage: 1,
  templatesPerPage: 1,
  paperSize: "A4",
  orientation: "portrait",
  font: "Vazirmatn",
  margin: 20,
  outputFormat: "html", // Default to HTML for better compatibility
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
  // Check if content has tables
  if (html.includes("<table")) {
    return parseHtmlWithTables(html);
  }

  // First, replace <br> with \n for line breaks
  let parsed = html.replace(/<br\s*\/?>/gi, "\n");

  // Replace paragraphs with line breaks
  parsed = parsed.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");

  // Handle lists (this is simplified)
  parsed = parsed.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");

  // Strip remaining HTML tags
  return stripHtml(parsed);
};

// Function to handle tables in HTML
const parseHtmlWithTables = (html: string) => {
  // Extract tables and their positions in the content
  const tableRegex = /<table[\s\S]*?<\/table>/gi;
  let tableMatch;
  let lastIndex = 0;
  const contentParts = [];

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    // Get the text before this table
    if (tableMatch.index > lastIndex) {
      const beforeText = html.substring(lastIndex, tableMatch.index);
      if (beforeText.trim()) {
        // Process normal text
        let parsed = beforeText.replace(/<br\s*\/?>/gi, "\n");
        parsed = parsed.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");
        parsed = parsed.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");
        contentParts.push({
          type: "text",
          content: stripHtml(parsed),
        });
      }
    }

    // Save the table HTML for later processing with AutoTable
    contentParts.push({
      type: "table",
      content: tableMatch[0],
    });

    lastIndex = tableMatch.index + tableMatch[0].length;
  }

  // Get any text after the last table
  if (lastIndex < html.length) {
    const afterText = html.substring(lastIndex);
    if (afterText.trim()) {
      let parsed = afterText.replace(/<br\s*\/?>/gi, "\n");
      parsed = parsed.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n");
      parsed = parsed.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");
      contentParts.push({
        type: "text",
        content: stripHtml(parsed),
      });
    }
  }

  return contentParts;
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
    // Dynamically import jspdf and autotable
    const { jsPDF } = await import("jspdf");
    const { autoTable } = await import("jspdf-autotable");

    // Create PDF document with orientation from options
    const pdf = new jsPDF({
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

    // Add title if enabled
    if (pdfOptions.showTitle) {
      if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
      pdf.setFontSize(16);
      pdf.text(title, pageWidth - margin, margin + 5, { align: "right" });
    }

    // Add student information if enabled
    let contentStartY = margin + 40; // Default starting position

    if (pdfOptions.showStudentInfo) {
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
    } else {
      contentStartY = margin + 15; // Adjust start position when student info is hidden
    }

    // Check if we're dealing with a content object that contains tables
    if (Array.isArray(parsedContent)) {
      // Mixed content with tables
      let currentY = contentStartY + 10;

      for (const part of parsedContent) {
        if (part.type === "text") {
          // Regular text content
          if (part.content.trim()) {
            const textLines = pdf.splitTextToSize(part.content, contentWidth);
            pdf.text(textLines, pageWidth - margin, currentY, {
              align: "right",
            });
            currentY += textLines.length * 7 + 5;
          }
        } else if (part.type === "table") {
          // Table content - use AutoTable
          const tempElement = document.createElement("div");
          tempElement.innerHTML = part.content;

          // Extract header and body from the table HTML
          const tableElement = tempElement.querySelector("table");
          const head = Array.from(
            tableElement?.querySelectorAll("thead tr") || []
          ).map((row) =>
            Array.from(row.querySelectorAll("th")).map(
              (cell) => cell.textContent?.trim() || ""
            )
          );

          const body = Array.from(
            tableElement?.querySelectorAll("tbody tr") ||
              Array.from(tableElement?.querySelectorAll("tr") || []).filter(
                (row) =>
                  !row.parentElement?.tagName.toLowerCase().includes("thead")
              )
          ).map((row) =>
            Array.from(row.querySelectorAll("td")).map(
              (cell) => cell.textContent?.trim() || ""
            )
          );

          // Use AutoTable to render the table
          autoTable(pdf, {
            startY: currentY,
            head: head.length > 0 ? head : undefined,
            body: body,
            theme: "grid",
            styles: {
              font: fontLoaded ? pdfOptions.font : undefined,
              fontSize: 10,
              cellPadding: 4,
              textColor: [0, 0, 0],
              halign: "right", // Right align for RTL
              overflow: "linebreak",
            },
            headStyles: {
              fillColor: [240, 240, 240],
              textColor: [0, 0, 0],
              fontStyle: "bold",
            },
            margin: { left: margin, right: margin },
          });

          // Get the final Y position after drawing the table
          const pdfWithTable = pdf as jsPDF & {
            lastAutoTable?: AutoTableReturnValue;
          };
          const tableDetails = pdfWithTable.lastAutoTable;
          if (tableDetails && typeof tableDetails.finalY === "number") {
            currentY = tableDetails.finalY + 10;
          } else {
            // If for some reason we can't get finalY, just increment Y position
            currentY += 50;
          }
        }
      }
    } else {
      // Standard content without tables
      // Split text into lines and add them with proper RTL support
      const textLines = pdf.splitTextToSize(parsedContent, contentWidth);
      pdf.text(textLines, pageWidth - margin, contentStartY + 10, {
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
  replaceVariables: (
    content: string,
    student: Student,
    index: number
  ) => string;
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
    // Dynamically import jspdf and autotable
    const { jsPDF } = await import("jspdf");
    const { autoTable } = await import("jspdf-autotable");

    // Create PDF document with orientation from options
    const pdf = new jsPDF({
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

    // Calculate templates per page layout
    const templatesPerPage = Math.min(pdfOptions.templatesPerPage, 4); // Limit to max 4 templates per page
    let templatesPerRow = 1;
    let templatesPerColumn = 1;

    if (templatesPerPage > 1) {
      // Determine layout based on number of templates per page
      if (templatesPerPage === 2) {
        templatesPerRow = pdfOptions.orientation === "landscape" ? 2 : 1;
        templatesPerColumn = pdfOptions.orientation === "landscape" ? 1 : 2;
      } else if (templatesPerPage === 3) {
        templatesPerRow = pdfOptions.orientation === "landscape" ? 3 : 1;
        templatesPerColumn = pdfOptions.orientation === "landscape" ? 1 : 3;
      } else if (templatesPerPage === 4) {
        templatesPerRow = 2;
        templatesPerColumn = 2;
      }
    }

    // Calculate template dimensions
    const templateWidth = (pageWidth - margin * 2) / templatesPerRow;
    const templateHeight = (pageHeight - margin * 2) / templatesPerColumn;
    const templateMargin = 5; // Small margin between templates

    // For each student, add content to PDF
    let studentIndex = 0;
    while (studentIndex < students.length) {
      // Calculate which students go on this page
      const studentsOnPage = Math.min(
        templatesPerPage,
        students.length - studentIndex
      );

      // Create a new page (except for first page)
      if (studentIndex > 0) {
        pdf.addPage();
      }

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

        // Reset text color for content
        pdf.setTextColor(0, 0, 0);
      }

      // Process students for this page
      for (let i = 0; i < studentsOnPage; i++) {
        const student = students[studentIndex + i];
        const personalizedContent = replaceVariables(
          content,
          student,
          studentIndex + i
        );
        const parsedContent = parseContent(personalizedContent);

        // Calculate position for this template
        const col = i % templatesPerRow;
        const row = Math.floor(i / templatesPerRow);
        const x = margin + col * templateWidth;
        const y = margin + row * templateHeight;
        const templateRight = x + templateWidth - templateMargin;

        // Save current state to restore after this template
        pdf.saveGraphicsState();

        // Generate title with student variables
        const studentTitle = replaceVariables(title, student, studentIndex + i);

        // Add title if enabled
        if (pdfOptions.showTitle) {
          // Add title
          if (fontLoaded) pdf.setFont(pdfOptions.font, "bold");
          pdf.setFontSize(templatesPerPage > 1 ? 12 : 16);
          pdf.text(studentTitle, templateRight, y + 5, { align: "right" });
        }

        let contentStartY = y + 10;

        // Add student information if enabled
        if (pdfOptions.showStudentInfo) {
          if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
          pdf.setFontSize(templatesPerPage > 1 ? 8 : 12);

          if (templatesPerPage > 1) {
            // Compact layout for multiple templates per page
            const studentInfo = `نام: ${student.studentName} ${
              student.studentFamily
            } | کلاس: ${student.className || ""} | کد: ${student.studentCode}`;
            pdf.text(studentInfo, templateRight, y + 15, { align: "right" });
            contentStartY = y + 20;
          } else {
            // Full layout for single template
            pdf.text(
              `نام و نام خانوادگی: ${student.studentName} ${student.studentFamily}`,
              templateRight,
              y + 20,
              { align: "right" }
            );
            pdf.text(
              `کد دانش‌آموزی: ${student.studentCode}`,
              templateRight,
              y + 30,
              { align: "right" }
            );
            pdf.text(
              `کلاس: ${student.className || ""}`,
              x + templateMargin,
              y + 30,
              {
                align: "left",
              }
            );
            pdf.text(`تاریخ: ${date}`, x + templateMargin, y + 20, {
              align: "left",
            });

            // Add horizontal line
            pdf.setDrawColor(200, 200, 200);
            pdf.line(x + templateMargin, y + 40, templateRight, y + 40);
            contentStartY = y + 50;
          }
        }

        // Add content
        if (fontLoaded) pdf.setFont(pdfOptions.font, "normal");
        pdf.setFontSize(templatesPerPage > 1 ? 8 : 12);

        // Adjust content width based on templates per page
        const effectiveWidth = templateWidth - 2 * templateMargin;

        // Handle content based on whether it has tables
        if (Array.isArray(parsedContent)) {
          // Mixed content with tables
          let currentY = contentStartY;

          for (const part of parsedContent) {
            if (part.type === "text") {
              // Regular text content
              if (part.content.trim()) {
                const textLines = pdf.splitTextToSize(
                  part.content,
                  effectiveWidth
                );
                pdf.text(textLines, templateRight - templateMargin, currentY, {
                  align: "right",
                });
                currentY +=
                  textLines.length * (templatesPerPage > 1 ? 4 : 7) + 5;
              }
            } else if (part.type === "table" && templatesPerPage === 1) {
              // Only add tables in single template mode to avoid layout issues
              const tempElement = document.createElement("div");
              tempElement.innerHTML = part.content;

              // Extract header and body from the table HTML
              const tableElement = tempElement.querySelector("table");
              const head = Array.from(
                tableElement?.querySelectorAll("thead tr") || []
              ).map((row) =>
                Array.from(row.querySelectorAll("th")).map(
                  (cell) => cell.textContent?.trim() || ""
                )
              );

              const body = Array.from(
                tableElement?.querySelectorAll("tbody tr") ||
                  Array.from(tableElement?.querySelectorAll("tr") || []).filter(
                    (row) =>
                      !row.parentElement?.tagName
                        .toLowerCase()
                        .includes("thead")
                  )
              ).map((row) =>
                Array.from(row.querySelectorAll("td")).map(
                  (cell) => cell.textContent?.trim() || ""
                )
              );

              // Use AutoTable to render the table
              autoTable(pdf, {
                startY: currentY,
                head: head.length > 0 ? head : undefined,
                body: body,
                theme: "grid",
                styles: {
                  font: fontLoaded ? pdfOptions.font : undefined,
                  fontSize: 9,
                  cellPadding: 3,
                  textColor: [0, 0, 0],
                  halign: "right", // Right align for RTL
                  overflow: "linebreak",
                },
                headStyles: {
                  fillColor: [240, 240, 240],
                  textColor: [0, 0, 0],
                  fontStyle: "bold",
                },
                margin: {
                  left: x + templateMargin,
                  right: pageWidth - templateRight + templateMargin,
                },
              });

              // Get the final Y position after drawing the table
              const pdfWithTable = pdf as jsPDF & {
                lastAutoTable?: AutoTableReturnValue;
              };
              const tableDetails = pdfWithTable.lastAutoTable;
              if (tableDetails && typeof tableDetails.finalY === "number") {
                currentY = tableDetails.finalY + 10;
              } else {
                // If for some reason we can't get finalY, just increment Y position
                currentY += 50;
              }
            }
          }
        } else {
          // Split text into lines with proper width
          const textLines = pdf.splitTextToSize(parsedContent, effectiveWidth);

          // Add content with proper RTL support
          pdf.text(textLines, templateRight - templateMargin, contentStartY, {
            align: "right",
          });
        }

        // Restore state for next template
        pdf.restoreGraphicsState();
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

      // Move to next batch of students
      studentIndex += studentsOnPage;
    }

    // Convert the PDF to a Blob
    const pdfBlob = pdf.output("blob");
    return pdfBlob;
  } catch (error) {
    console.error("Error generating combined PDF:", error);
    throw new Error("Failed to generate combined PDF. Please try again later.");
  }
};

// Function to generate HTML document for preview and printing
export const generateHTML = async (
  props: PublicationDocumentProps
): Promise<string> => {
  const { title, content, student, date, options = {} } = props;

  // Merge default options with provided options
  const pdfOptions: PDFOptions = { ...defaultPDFOptions, ...options };

  // Create HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @font-face {
          font-family: "${pdfOptions.font}";
          src: url("/fonts/${pdfOptions.font}-Regular.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: "${pdfOptions.font}";
          src: url("/fonts/${pdfOptions.font}-Bold.ttf") format("truetype");
          font-weight: bold;
          font-style: normal;
        }
        
        body {
          font-family: "${pdfOptions.font}", Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8f8f8;
          direction: rtl;
        }
        
        .page {
          width: ${
            pdfOptions.paperSize === "A4"
              ? "210mm"
              : pdfOptions.paperSize === "A5"
              ? "148mm"
              : "215.9mm"
          };
          height: ${
            pdfOptions.paperSize === "A4"
              ? "297mm"
              : pdfOptions.paperSize === "A5"
              ? "210mm"
              : "279.4mm"
          };
          margin: 0 auto;
          padding: ${pdfOptions.margin}px;
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          ${
            pdfOptions.orientation === "landscape"
              ? "transform: rotate(90deg); transform-origin: top left; margin-top: 100%;"
              : ""
          }
        }
        
        .header {
          background-color: ${pdfOptions.headerColor};
          padding: 10px;
          margin-left: -${pdfOptions.margin}px;
          margin-right: -${pdfOptions.margin}px;
          margin-top: -${pdfOptions.margin}px;
          height: 40px;
          display: ${pdfOptions.showHeader ? "block" : "none"};
        }
        
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: right;
        }
        
        .student-info {
          display: ${pdfOptions.showStudentInfo ? "flex" : "none"};
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .student-details {
          text-align: right;
        }
        
        .date-info {
          text-align: left;
        }
        
        .divider {
          border-bottom: 1px solid #ddd;
          margin: 10px 0 20px 0;
          display: ${pdfOptions.showStudentInfo ? "block" : "none"};
        }
        
        .content {
          font-size: 14px;
          text-align: right;
          line-height: 1.5;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 60px;
          color: rgba(220,220,220,0.5);
          pointer-events: none;
          z-index: 10;
          display: ${pdfOptions.showWatermark ? "block" : "none"};
        }
        
        .footer {
          position: absolute;
          bottom: ${pdfOptions.margin}px;
          left: ${pdfOptions.margin}px;
          right: ${pdfOptions.margin}px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          display: ${pdfOptions.showFooter ? "block" : "none"};
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        table, th, td {
          border: 1px solid #ddd;
        }
        
        th, td {
          padding: 8px;
          text-align: right;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        @media print {
          body {
            background: none;
          }
          
          .page {
            box-shadow: none;
            width: 100%;
            height: auto;
            ${
              pdfOptions.orientation === "landscape"
                ? "transform: none; margin-top: 0;"
                : ""
            }
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        ${
          pdfOptions.showWatermark
            ? '<div class="watermark">نسخه الکترونیکی</div>'
            : ""
        }
        ${pdfOptions.showHeader ? '<div class="header"></div>' : ""}
        
        ${pdfOptions.showTitle ? `<div class="title">${title}</div>` : ""}
        
        ${
          pdfOptions.showStudentInfo
            ? `
        <div class="student-info">
          <div class="student-details">
            <div>نام و نام خانوادگی: ${student.studentName} ${
                student.studentFamily
              }</div>
            <div>کد دانش‌آموزی: ${student.studentCode}</div>
          </div>
          <div class="date-info">
            <div>کلاس: ${student.className || ""}</div>
            <div>تاریخ: ${date}</div>
          </div>
        </div>
        <div class="divider"></div>
        `
            : ""
        }
        
        <div class="content">
          ${content}
        </div>
        
        ${
          pdfOptions.showFooter
            ? `
        <div class="footer">
          ${pdfOptions.footerText} - ${date}
        </div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

// Function to generate a combined HTML document with multiple students' content
export const generateCombinedHTML = async (props: {
  title: string;
  content: string;
  students: Student[];
  date: string;
  replaceVariables: (
    content: string,
    student: Student,
    index: number
  ) => string;
  options?: Partial<PDFOptions>;
}): Promise<string> => {
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

  // Create HTML document
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @font-face {
          font-family: "${pdfOptions.font}";
          src: url("/fonts/${pdfOptions.font}-Regular.ttf") format("truetype");
          font-weight: normal;
          font-style: normal;
        }
        
        @font-face {
          font-family: "${pdfOptions.font}";
          src: url("/fonts/${pdfOptions.font}-Bold.ttf") format("truetype");
          font-weight: bold;
          font-style: normal;
        }
        
        body {
          font-family: "${pdfOptions.font}", Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f8f8f8;
          direction: rtl;
        }
        
        .page {
          width: ${
            pdfOptions.paperSize === "A4"
              ? "210mm"
              : pdfOptions.paperSize === "A5"
              ? "148mm"
              : "215.9mm"
          };
          height: auto;
          min-height: ${
            pdfOptions.paperSize === "A4"
              ? "297mm"
              : pdfOptions.paperSize === "A5"
              ? "210mm"
              : "279.4mm"
          };
          margin: 0 auto 20px auto;
          padding: ${pdfOptions.margin}px;
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          page-break-after: always;
          ${
            pdfOptions.orientation === "landscape"
              ? "transform: rotate(90deg); transform-origin: top left; margin-top: 100%;"
              : ""
          }
        }
        
        .header {
          background-color: ${pdfOptions.headerColor};
          padding: 10px;
          margin-left: -${pdfOptions.margin}px;
          margin-right: -${pdfOptions.margin}px;
          margin-top: -${pdfOptions.margin}px;
          height: 40px;
          display: ${pdfOptions.showHeader ? "block" : "none"};
        }
        
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          text-align: right;
        }
        
        .student-info {
          display: ${pdfOptions.showStudentInfo ? "flex" : "none"};
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .student-details {
          text-align: right;
        }
        
        .date-info {
          text-align: left;
        }
        
        .divider {
          border-bottom: 1px solid #ddd;
          margin: 10px 0 20px 0;
          display: ${pdfOptions.showStudentInfo ? "block" : "none"};
        }
        
        .content {
          font-size: 14px;
          text-align: right;
          line-height: 1.5;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
          font-size: 60px;
          color: rgba(220,220,220,0.5);
          pointer-events: none;
          z-index: 10;
          display: ${pdfOptions.showWatermark ? "block" : "none"};
        }
        
        .footer {
          position: absolute;
          bottom: ${pdfOptions.margin}px;
          left: ${pdfOptions.margin}px;
          right: ${pdfOptions.margin}px;
          text-align: center;
          font-size: 10px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          display: ${pdfOptions.showFooter ? "block" : "none"};
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        
        table, th, td {
          border: 1px solid #ddd;
        }
        
        th, td {
          padding: 8px;
          text-align: right;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }

        .template-grid {
          display: grid;
          /* Define default grid layout that will be overridden by inline styles */
          grid-template-columns: repeat(${
            pdfOptions.templatesPerPage <= 2 ? pdfOptions.templatesPerPage : 2
          }, 1fr);
          grid-template-rows: repeat(${
            pdfOptions.templatesPerPage <= 2
              ? 1
              : Math.ceil(pdfOptions.templatesPerPage / 2)
          }, auto);
          gap: 20px;
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .template {
          border: 1px solid #eee;
          padding: 10px;
          border-radius: 5px;
        }
        
        @media print {
          body {
            background: none;
          }
          
          .page {
            box-shadow: none;
            width: 100%;
            margin-bottom: 0;
            ${
              pdfOptions.orientation === "landscape"
                ? "transform: none; margin-top: 0;"
                : ""
            }
          }
        }
      </style>
    </head>
    <body>
  `;

  // Handle templates per page
  if (pdfOptions.templatesPerPage > 1) {
    // Group students by page
    const studentsPerPage = pdfOptions.templatesPerPage;
    const pages = [];

    for (let i = 0; i < students.length; i += studentsPerPage) {
      pages.push(students.slice(i, i + studentsPerPage));
    }

    // Create a page for each group of students
    for (let page = 0; page < pages.length; page++) {
      const pageStudents = pages[page];

      htmlContent += `
        <div class="page">
          ${pdfOptions.showHeader ? '<div class="header"></div>' : ""}
          ${
            pdfOptions.showWatermark
              ? '<div class="watermark">نسخه الکترونیکی</div>'
              : ""
          }
          
          <div class="template-grid" style="display: grid !important; grid-template-columns: repeat(${
            pdfOptions.templatesPerPage <= 2 ? pdfOptions.templatesPerPage : 2
          }, 1fr) !important; grid-template-rows: repeat(${
        pdfOptions.templatesPerPage <= 2
          ? 1
          : Math.ceil(pdfOptions.templatesPerPage / 2)
      }, auto) !important; gap: 2px !important; width: 100% !important; box-sizing: border-box !important;">
      `;

      // Add each student's content to the grid
      for (let i = 0; i < pageStudents.length; i++) {
        const student = pageStudents[i];
        const studentIndex = page * studentsPerPage + i;
        const personalizedContent = replaceVariables(
          content,
          student,
          studentIndex
        );
        const processedTitle = replaceVariables(title, student, studentIndex);

        htmlContent += `
          <div class="template">
            ${
              pdfOptions.showTitle
                ? `<div class="title">${processedTitle}</div>`
                : ""
            }
            
            ${
              pdfOptions.showStudentInfo
                ? `
            <div style="font-size: 12px; margin-bottom: 10px;">
              نام: ${student.studentName} ${student.studentFamily} | کلاس: ${
                    student.className || ""
                  } | کد: ${student.studentCode}
            </div>
            <div class="divider"></div>
            `
                : ""
            }
            
            <div class="content">
              ${personalizedContent}
            </div>
          </div>
        `;
      }

      htmlContent += `
          </div>
          
          ${
            pdfOptions.showFooter
              ? `
          <div class="footer">
            ${pdfOptions.footerText} - ${date}
          </div>
          `
              : ""
          }
        </div>
      `;
    }
  } else {
    // Create a separate page for each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const personalizedContent = replaceVariables(content, student, i);
      const processedTitle = replaceVariables(title, student, i);

      htmlContent += `
        <div class="page">
          ${pdfOptions.showHeader ? '<div class="header"></div>' : ""}
          ${
            pdfOptions.showWatermark
              ? '<div class="watermark">نسخه الکترونیکی</div>'
              : ""
          }
          
          ${
            pdfOptions.showTitle
              ? `<div class="title">${processedTitle}</div>`
              : ""
          }
          
          ${
            pdfOptions.showStudentInfo
              ? `
          <div class="student-info">
            <div class="student-details">
              <div>نام و نام خانوادگی: ${student.studentName} ${
                  student.studentFamily
                }</div>
              <div>کد دانش‌آموزی: ${student.studentCode}</div>
            </div>
            <div class="date-info">
              <div>کلاس: ${student.className || ""}</div>
              <div>تاریخ: ${date}</div>
            </div>
          </div>
          <div class="divider"></div>
          `
              : ""
          }
          
          <div class="content">
            ${personalizedContent}
          </div>
          
          ${
            pdfOptions.showFooter
              ? `
          <div class="footer">
            ${pdfOptions.footerText} - ${date}
          </div>
          `
              : ""
          }
        </div>
      `;
    }
  }

  htmlContent += `
    </body>
    </html>
  `;

  return htmlContent;
};

// React component that serves as the API
export const PublicationDocument: React.FC<PublicationDocumentProps> = () => {
  // This component doesn't render anything directly, it's used for the API
  return null;
};
