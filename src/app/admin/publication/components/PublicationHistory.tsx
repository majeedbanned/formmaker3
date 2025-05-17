"use client";

import { useState, useEffect } from "react";
import { PublicationHistoryItem } from "./types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  CalendarIcon,
  Download,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

interface PublicationHistoryProps {
  user: {
    id: string;
    userType: string;
    schoolCode: string;
    username?: string;
  };
}

export default function PublicationHistory({ user }: PublicationHistoryProps) {
  const [history, setHistory] = useState<PublicationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<
    PublicationHistoryItem[]
  >([]);

  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Filter history when search term changes
  useEffect(() => {
    if (history.length === 0) {
      setFilteredHistory([]);
      return;
    }

    const filtered = history.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredHistory(filtered);
  }, [history, searchTerm]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // Filter by creator ID if the user is a teacher
      const creatorParam =
        user.userType === "teacher" ? `&creatorId=${user.id}` : "";

      const response = await fetch(
        `/api/formbuilder/publication-history?schoolCode=${user.schoolCode}${creatorParam}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("خطا در دریافت تاریخچه");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجو در تاریخچه..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-right"
            dir="rtl"
          />
        </div>

        <Button variant="outline" onClick={fetchHistory} size="sm">
          <Loader2 className="h-4 w-4 mr-2" />
          بروزرسانی
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">
            تاریخچه‌ای یافت نشد
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            {searchTerm
              ? "موردی با معیارهای جستجوی شما یافت نشد. معیارهای جستجو را تغییر دهید."
              : "هنوز هیچ انتشاری ثبت نشده است. با استفاده از بخش «نامه جدید» می‌توانید نامه‌ها را ایجاد کنید."}
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[600px] w-full rounded-md border">
          <div className="p-4 space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3 text-right">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-right">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">تعداد دانش‌آموزان:</span>{" "}
                      <span className="font-medium">
                        {item.studentCount} نفر
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">تعداد کلاس‌ها:</span>{" "}
                      <span className="font-medium">
                        {item.classCount} کلاس
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // In a real implementation, you would fetch and download the PDFs again
                      // or retrieve them from storage
                      toast.info("این قابلیت در نسخه آزمایشی در دسترس نیست");
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    دانلود مجدد
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
