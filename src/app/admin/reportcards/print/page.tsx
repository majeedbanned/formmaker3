"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReportCardsPrintView from "./components/ReportCardsPrintView";

export default function ReportCardsPrintPage() {
  const router = useRouter();
  const [printData, setPrintData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide all navigation and UI elements
    const hideElements = () => {
      // Hide header, sidebar, and other UI elements
      const elementsToHide = document.querySelectorAll(
        "header, nav, aside, .sidebar, .breadcrumb, button:not(.print-button)"
      );
      elementsToHide.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // Hide parent container padding/margins
      const containers = document.querySelectorAll(
        ".flex.flex-1.flex-col, .min-h-\\[100vh\\]"
      );
      containers.forEach((el) => {
        (el as HTMLElement).style.padding = "0";
        (el as HTMLElement).style.margin = "0";
      });
    };

    hideElements();

    // Get data from sessionStorage
    const storedData = sessionStorage.getItem("reportCardsPrintData");
    
    console.log("Print page - storedData exists:", !!storedData);
    
    if (!storedData) {
      console.error("No data found in sessionStorage");
      // If no data, redirect back
      setTimeout(() => {
        router.push("/admin/reportcards");
      }, 2000);
      return;
    }

    try {
      const data = JSON.parse(storedData);
      console.log("Print page - parsed data:", {
        studentCount: data.studentReportCards?.length || 0,
        selectedClass: data.selectedClass,
        selectedYear: data.selectedYear,
      });

      if (!data.studentReportCards || data.studentReportCards.length === 0) {
        console.error("No student report cards in data");
        setTimeout(() => {
          router.push("/admin/reportcards");
        }, 2000);
        return;
      }

      setPrintData(data);
      setLoading(false);

      // Clear the sessionStorage after reading
      sessionStorage.removeItem("reportCardsPrintData");

      // Re-hide elements after render
      setTimeout(() => {
        hideElements();
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          window.print();
        }, 500);
      }, 100);
    } catch (error) {
      console.error("Error parsing print data:", error);
      setTimeout(() => {
        router.push("/admin/reportcards");
      }, 2000);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!printData || !printData.studentReportCards || printData.studentReportCards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 text-gray-500">
          <p className="text-lg mb-4">خطا در بارگذاری داده‌ها</p>
          <p className="text-sm">لطفاً دوباره تلاش کنید</p>
          <button
            onClick={() => router.push("/admin/reportcards")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          header, nav, aside, .sidebar, .breadcrumb, button {
            display: none !important;
          }
        }
        
        @media screen {
          header, nav, aside, .sidebar, .breadcrumb, button:not(.print-button) {
            display: none !important;
          }
        }
      `}</style>
      <ReportCardsPrintView {...printData} />
    </>
  );
}

