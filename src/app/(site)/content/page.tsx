"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LandingNavbar from "@/components/landing/LandingNavbar";
import ModuleRenderer from "@/components/modules/ModuleRenderer";
import { DynamicPage, ModuleConfig } from "@/types/modules";

interface PageContent extends DynamicPage {
  content?: string; // For backward compatibility
}

function ContentPageInner() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageId, setPageId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setError("شناسه صفحه مشخص نشده است");
      setLoading(false);
      return;
    }

    setPageId(id);
    fetchPage(id);
  }, [searchParams]);

  const fetchPage = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/pages/${id}`);
      const data = await response.json();

      if (data.success) {
        if (!data.page.isActive) {
          setError("این صفحه در دسترس نیست");
        } else {
          setPage(data.page);
        }
      } else {
        setError("صفحه یافت نشد");
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setError("خطا در بارگذاری صفحه");
    } finally {
      setLoading(false);
    }
  };

  const handleModulesUpdate = (updatedModules: ModuleConfig[]) => {
    if (page) {
      setPage({ ...page, modules: updatedModules });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingNavbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="mt-4 text-lg font-medium text-gray-700">
              در حال بارگذاری...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingNavbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">خطا</h1>
            <p className="text-lg text-gray-600 mb-8">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LandingNavbar />
        <div className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              صفحه یافت نشد
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              صفحه مورد نظر شما وجود ندارد
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <LandingNavbar /> */}

      {/* Main Content */}
      <main className="pt-20" dir="rtl">
        {/* Check if page has modules (new format) or use legacy content */}
        {page.modules && page.modules.length > 0 ? (
          // New module-based rendering
          <div className="overflow-hidden">
            <ModuleRenderer
              modules={page.modules}
              pageId={pageId || undefined}
              onModulesUpdate={handleModulesUpdate}
            />
          </div>
        ) : (
          // Legacy content rendering for backward compatibility
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <article className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-12 text-white">
                <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                {page.metaDescription && (
                  <p className="text-lg opacity-90">{page.metaDescription}</p>
                )}
                <div className="text-sm opacity-75 mt-4">
                  آخرین به‌روزرسانی:{" "}
                  {page.updatedAt
                    ? new Date(page.updatedAt).toLocaleDateString("fa-IR")
                    : "نامشخص"}
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-12">
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: page.content || "" }}
                  style={{
                    lineHeight: "1.8",
                    fontSize: "16px",
                    color: "#374151",
                  }}
                />
              </div>
            </article>

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ← بازگشت
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {/* <footer className="bg-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">
            © ۱۴۰۳ پارسا‌موز. تمامی حقوق محفوظ است.
          </p>
        </div>
      </footer> */}
    </div>
  );
}

export default function ContentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <LandingNavbar />
          <div className="pt-20 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-4 text-lg font-medium text-gray-700">
                در حال بارگذاری...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <ContentPageInner />
    </Suspense>
  );
}
