"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Bug,
  Lightbulb,
  Search,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MessageSquarePlus,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";

interface Feedback {
  _id: string;
  type: "bug" | "suggestion";
  title: string;
  description: string;
  priority: string;
  status: string;
  phone?: string | null;
  submittedBy: {
    userId: string;
    username: string;
    name: string;
    userType: string;
    schoolCode: string;
    domain: string;
  };
  images: Array<{
    name: string;
    data: string;
    contentType: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackPage() {
  const { user, isLoading: userLoading } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Only allow school users to view this page
  if (!userLoading && user && user.userType !== "school") {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center m-4">
        <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-yellow-700 font-medium text-lg mb-2">
          دسترسی محدود
        </h3>
        <p className="text-yellow-600">
          فقط مدیران مدرسه می‌توانند لیست بازخوردها را مشاهده کنند.
        </p>
      </div>
    );
  }

  useEffect(() => {
    if (user && user.userType === "school") {
      fetchFeedbacks();
    }
  }, [user, statusFilter, typeFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch feedbacks");
      }

      const data = await response.json();
      setFeedbacks(data.feedback || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگذاری بازخوردها");
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) =>
    feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "باز" },
      "in-progress": { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "در حال بررسی" },
      resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "حل شده" },
      closed: { color: "bg-gray-100 text-gray-800", icon: AlertCircle, label: "بسته شده" },
    };

    const variant = variants[status as keyof typeof variants] || variants.open;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 ml-1" />
        {variant.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };

    const labels = {
      low: "کم",
      medium: "متوسط",
      high: "بالا",
      critical: "بحرانی",
    };

    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>در حال بارگذاری بازخوردها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center m-4">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-red-700 font-medium text-lg mb-2">خطا</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <PageHeader
        title="بازخوردها و پیشنهادات"
        subtitle="مدیریت گزارشات مشکلات و پیشنهادات کاربران"
        icon={<MessageSquarePlus className="w-6 h-6" />}
        gradient={true}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="جستجو در بازخوردها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="نوع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="bug">مشکلات</SelectItem>
            <SelectItem value="suggestion">پیشنهادات</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه</SelectItem>
            <SelectItem value="open">باز</SelectItem>
            <SelectItem value="in-progress">در حال بررسی</SelectItem>
            <SelectItem value="resolved">حل شده</SelectItem>
            <SelectItem value="closed">بسته شده</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sdfgdfgdftats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{feedbacks.length}</div>
            <div className="text-blue-100 text-sm">کل بازخوردها</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {feedbacks.filter((f) => f.type === "bug").length}
            </div>
            <div className="text-red-100 text-sm">گزارش مشکل</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {feedbacks.filter((f) => f.type === "suggestion").length}
            </div>
            <div className="text-green-100 text-sm">پیشنهاد</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {feedbacks.filter((f) => f.status === "open").length}
            </div>
            <div className="text-purple-100 text-sm">باز</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedbacks List */}
      {filteredFeedbacks.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="text-center py-12">
            <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              بازخوردی یافت نشد
            </h3>
            <p className="text-gray-600">
              فیلترها را تغییر دهید یا منتظر بازخوردهای جدید باشید
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredFeedbacks.map((feedback) => (
            <Card key={feedback._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.type === "bug" ? (
                        <Bug className="h-5 w-5 text-red-600" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-green-600" />
                      )}
                      <CardTitle className="text-xl">{feedback.title}</CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(feedback.status)}
                      {getPriorityBadge(feedback.priority)}
                      <Badge variant="outline">
                        {feedback.type === "bug" ? "مشکل" : "پیشنهاد"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {feedback.description}
                </p>

                {/* Images */}
                {feedback.images && feedback.images.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">تصاویر پیوست:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {feedback.images.map((image, index) => (
                        <img
                          key={index}
                          src={`data:${image.contentType};base64,${image.data}`}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitter Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">ارسال‌کننده</div>
                      <div className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {feedback.submittedBy?.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">نوع کاربر</div>
                      <div className="font-medium">
                        {feedback.submittedBy?.userType === "school" ? "مدیر" : "معلم"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">کد مدرسه</div>
                      <div className="font-medium">{feedback.submittedBy.schoolCode}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">تاریخ ثبت</div>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(feedback.createdAt).toLocaleDateString("fa-IR")}
                      </div>
                    </div>
                    {feedback.phone && (
                      <div>
                        <div className="text-gray-500 text-xs mb-1">شماره تماس</div>
                        <div className="font-medium flex items-center gap-1" dir="ltr">
                          <Phone className="h-3 w-3" />
                          {feedback.phone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

