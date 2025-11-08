"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  ArrowRight,
  MessageSquare,
  User,
  Calendar,
  Building2,
  Flag,
  Send,
  Paperclip,
  Download,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";

interface TicketData {
  _id: string;
  data: {
    title: string;
    description: string;
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    priority: "Low" | "Medium" | "High";
    createdAt: string;
    updatedAt: string;
    departmentId: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      data: string;
    }>;
  };
  departmentName: string;
  creatorName: string;
  replies: Reply[];
}

interface Reply {
  _id: string;
  data: {
    message: string;
    createdAt: string;
    attachments?: Array<{
      name: string;
      size: number;
      type: string;
      data: string;
    }>;
  };
  authorName: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && id) {
      fetchTicket();
    }
  }, [isAuthenticated, user, id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ticketing/tickets/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data.ticket);
      } else if (response.status === 403) {
        toast.error("شما مجاز به مشاهده این تیکت نیستید");
        router.push("/admin/ticketing");
      } else if (response.status === 404) {
        toast.error("تیکت یافت نشد");
        router.push("/admin/ticketing");
      } else {
        toast.error("خطا در دریافت اطلاعات تیکت");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast.error("خطا در دریافت اطلاعات تیکت");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyMessage.trim()) {
      toast.error("لطفاً پیام خود را وارد کنید");
      return;
    }

    setSubmittingReply(true);

    try {
      const response = await fetch("/api/ticketing/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: id,
          message: replyMessage.trim(),
          attachments: []
        }),
      });

      if (response.ok) {
        toast.success("پاسخ با موفقیت ارسال شد");
        setReplyMessage("");
        fetchTicket(); // Refresh to show new reply
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در ارسال پاسخ");
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("خطا در ارسال پاسخ");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);

    try {
      const response = await fetch(`/api/ticketing/tickets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        toast.success("وضعیت تیکت بروزرسانی شد");
        fetchTicket(); // Refresh to show updated status
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "خطا در بروزرسانی وضعیت");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("خطا در بروزرسانی وضعیت");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Resolved":
        return "bg-green-100 text-green-800";
      case "Closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Open": return "باز";
      case "In Progress": return "در حال پیگیری";
      case "Resolved": return "حل شده";
      case "Closed": return "بسته";
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "High": return "بالا";
      case "Medium": return "متوسط";
      case "Low": return "پایین";
      default: return priority;
    }
  };

  const downloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.data;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canReply = user?.userType === "teacher" || user?.userType === "school";
  const canUpdateStatus = user?.userType === "school";

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">دسترسی غیر مجاز یا تیکت یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl" dir="rtl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          بازگشت
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{ticket.data.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getStatusColor(ticket.data.status)}>
                      {getStatusText(ticket.data.status)}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.data.priority)}>
                      {getPriorityText(ticket.data.priority)}
                    </Badge>
                  </div>
                </div>
                {canUpdateStatus && (
                  <Select
                    value={ticket.data.status}
                    onValueChange={handleStatusChange}
                    disabled={updatingStatus}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">باز</SelectItem>
                      <SelectItem value="In Progress">در حال پیگیری</SelectItem>
                      <SelectItem value="Resolved">حل شده</SelectItem>
                      <SelectItem value="Closed">بسته</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.data.description}</p>
              </div>

              {/* Attachments */}
              {ticket.data.attachments && ticket.data.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    فایل‌های پیوست
                  </h4>
                  <div className="space-y-2">
                    {ticket.data.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{attachment.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAttachment(attachment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                پاسخ‌ها ({ticket.replies.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ticket.replies.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    هنوز هیچ پاسخی ثبت نشده است
                  </p>
                ) : (
                  ticket.replies.map((reply, index) => (
                    <div key={reply._id}>
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {reply.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{reply.authorName}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(reply.data.createdAt).toLocaleDateString('fa-IR')} - 
                              {new Date(reply.data.createdAt).toLocaleTimeString('fa-IR')}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-700 whitespace-pre-wrap">
                              {reply.data.message}
                            </p>
                            
                            {/* Reply Attachments */}
                            {reply.data.attachments && reply.data.attachments.length > 0 && (
                              <div className="mt-3">
                                <div className="space-y-1">
                                  {reply.data.attachments.map((attachment, attachIndex) => (
                                    <div key={attachIndex} className="flex items-center justify-between text-sm">
                                      <span>{attachment.name}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => downloadAttachment(attachment)}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {index < ticket.replies.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reply Form */}
          {canReply && ticket.data.status !== "Closed" && (
            <Card>
              <CardHeader>
                <CardTitle>پاسخ جدید</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    rows={4}
                    disabled={submittingReply}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={submittingReply || !replyMessage.trim()}>
                      {submittingReply ? "در حال ارسال..." : (
                        <>
                          <Send className="w-4 h-4 ml-2" />
                          ارسال پاسخ
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>اطلاعات تیکت</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">بخش</p>
                  <p className="font-medium">{ticket.departmentName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">ایجاد شده توسط</p>
                  <p className="font-medium">{ticket.creatorName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">تاریخ ایجاد</p>
                  <p className="font-medium">
                    {new Date(ticket.data.createdAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              </div>

              {ticket.data.updatedAt !== ticket.data.createdAt && (
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">آخرین بروزرسانی</p>
                    <p className="font-medium">
                      {new Date(ticket.data.updatedAt).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">اولویت</p>
                  <Badge className={getPriorityColor(ticket.data.priority)}>
                    {getPriorityText(ticket.data.priority)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
