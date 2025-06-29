"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Phone,
  Bell,
  Calendar,
  User,
  Eye,
  EyeOff,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

interface CommunicationsTabProps {
  studentId: string;
  student: {
    _id: string;
    data: {
      studentName: string;
      studentFamily: string;
      studentCode: string;
    };
  };
}

interface Message {
  _id: string;
  data: {
    mailId: string;
    sendername: string;
    sendercode: string;
    title: string;
    persiandate: string;
    message: string;
    receivercode: string;
    files?: string[];
    isRead: boolean;
    readTime?: string;
    readPersianDate?: string;
    createdAt: string;
  };
}

interface SmsRecord {
  _id: string;
  data: {
    title: string;
    message: string;
    sender: string;
    senderCode: string;
    persiandate: string;
    recipients?: {
      students?: Array<{ label: string; value: string } | string>;
      classCode?: Array<{ label: string; value: string } | string>;
      groups?: Array<{ label: string; value: string } | string>;
    };
    createdAt: string;
  };
}

interface Notification {
  _id: string;
  data: {
    title: string;
    message: string;
    sender: string;
    senderCode: string;
    persiandate: string;
    recipients?: {
      students?: Array<{ label: string; value: string } | string>;
      classCode?: Array<{ label: string; value: string } | string>;
      groups?: Array<{ label: string; value: string } | string>;
    };
    createdAt: string;
  };
}

export default function CommunicationsTab({
  studentId,
  student,
}: CommunicationsTabProps) {
  const [activeTab, setActiveTab] = useState<
    "messages" | "sms" | "notifications"
  >("messages");
  const [messages, setMessages] = useState<Message[]>([]);
  const [smsRecords, setSmsRecords] = useState<SmsRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesPage, setMessagesPage] = useState(1);
  const [smsPage, setSmsPage] = useState(1);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [messagesPagination, setMessagesPagination] = useState({
    total: 0,
    pages: 0,
  });
  const [smsPagination, setSmsPagination] = useState({ total: 0, pages: 0 });
  const [notificationsPagination, setNotificationsPagination] = useState({
    total: 0,
    pages: 0,
  });

  const studentCode = student.data.studentCode;

  // Fetch sent messages by the student
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/messages/sent?page=${messagesPage}&limit=10&sendercode=${studentCode}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setMessagesPagination(data.pagination || { total: 0, pages: 0 });
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SMS records received by the student
  const fetchSmsRecords = async () => {
    setLoading(true);
    try {
      // Since SMS is stored in smssend collection, we need to find records where the student was a recipient
      const response = await fetch(
        `/api/crud/smssend?page=${smsPage}&limit=50`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            action: "read",
            filter: {},
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter SMS records where the student was a recipient
        const filteredSms = (data.data || []).filter((sms: SmsRecord) => {
          const recipients = sms.data.recipients;
          if (!recipients) return false;

          // Check if student is in direct recipients
          if (
            recipients.students?.some(
              (s: any) => (typeof s === "string" ? s : s.value) === studentCode
            )
          )
            return true;

          // Check if student's class is in class recipients
          if (
            recipients.classCode?.some((c: any) => {
              const classValue = typeof c === "string" ? c : c.value;
              // We'd need student's class info to check this properly
              return false; // For now, skip class-based filtering
            })
          )
            return true;

          // Check if student's group is in group recipients
          if (
            recipients.groups?.some((g: any) => {
              const groupValue = typeof g === "string" ? g : g.value;
              // We'd need student's group info to check this properly
              return false; // For now, skip group-based filtering
            })
          )
            return true;

          return false;
        });

        setSmsRecords(filteredSms);
        setSmsPagination({
          total: filteredSms.length,
          pages: Math.ceil(filteredSms.length / 10),
        });
      }
    } catch (error) {
      console.error("Error fetching SMS records:", error);
      setSmsRecords([]);
      setSmsPagination({ total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch push notifications received by the student
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Notifications are stored in notificationsend collection, similar to SMS
      const response = await fetch(
        `/api/crud/notificationsend?page=${notificationsPage}&limit=50`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            action: "read",
            filter: {},
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter notifications where the student was a recipient
        const filteredNotifications = (data.data || []).filter(
          (notification: Notification) => {
            const recipients = notification.data.recipients;
            if (!recipients) return false;

            // Check if student is in direct recipients
            if (
              recipients.students?.some(
                (s: any) =>
                  (typeof s === "string" ? s : s.value) === studentCode
              )
            )
              return true;

            // Check if student's class is in class recipients
            if (
              recipients.classCode?.some((c: any) => {
                const classValue = typeof c === "string" ? c : c.value;
                // We'd need student's class info to check this properly
                return false; // For now, skip class-based filtering
              })
            )
              return true;

            // Check if student's group is in group recipients
            if (
              recipients.groups?.some((g: any) => {
                const groupValue = typeof g === "string" ? g : g.value;
                // We'd need student's group info to check this properly
                return false; // For now, skip group-based filtering
              })
            )
              return true;

            return false;
          }
        );

        setNotifications(filteredNotifications);
        setNotificationsPagination({
          total: filteredNotifications.length,
          pages: Math.ceil(filteredNotifications.length / 10),
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
      setNotificationsPagination({ total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "messages":
        fetchMessages();
        break;
      case "sms":
        fetchSmsRecords();
        break;
      case "notifications":
        fetchNotifications();
        break;
    }
  }, [activeTab, messagesPage, smsPage, notificationsPage, studentCode]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR");
  };

  // Format Persian date
  const formatPersianDate = (persianDate: string) => {
    return persianDate || "نامشخص";
  };

  // Render message content with proper HTML handling
  const renderMessageContent = (content: string) => {
    return (
      <div
        className="text-gray-700"
        dangerouslySetInnerHTML={{
          __html: content?.replace(/\n/g, "<br>") || "",
        }}
      />
    );
  };

  // Messages Tab Content
  const renderMessagesTab = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">در حال بارگذاری...</span>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">هیچ پیام ارسالی یافت نشد</p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <Card key={message._id} className="border-r-4 border-r-blue-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {message.data.title}
                    </h4>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 mb-2">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        گیرنده: {message.data.receivercode}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatPersianDate(message.data.persiandate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {message.data.isRead ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        خوانده شده
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-orange-50 text-orange-700 border-orange-200"
                      >
                        <EyeOff className="h-3 w-3 mr-1" />
                        خوانده نشده
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  {renderMessageContent(message.data.message)}
                </div>

                {message.data.files && message.data.files.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      فایل‌های پیوست:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {message.data.files.map((file, index) => (
                        <a
                          key={index}
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100 transition-colors"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          فایل {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Pagination for Messages */}
          {messagesPagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagesPage(messagesPage - 1)}
                disabled={messagesPage === 1}
              >
                قبلی
              </Button>
              <span className="text-sm text-gray-600">
                صفحه {messagesPage} از {messagesPagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessagesPage(messagesPage + 1)}
                disabled={messagesPage === messagesPagination.pages}
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // SMS Tab Content
  const renderSmsTab = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-green-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">در حال بارگذاری...</span>
        </div>
      ) : smsRecords.length === 0 ? (
        <div className="text-center py-8">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">هیچ پیامک دریافتی یافت نشد</p>
        </div>
      ) : (
        <>
          {smsRecords.map((sms) => (
            <Card key={sms._id} className="border-r-4 border-r-green-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {sms.data.title}
                    </h4>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 mb-2">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        فرستنده: {sms.data.sender}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatPersianDate(sms.data.persiandate)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    پیامک
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  {renderMessageContent(sms.data.message)}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination for SMS */}
          {smsPagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSmsPage(smsPage - 1)}
                disabled={smsPage === 1}
              >
                قبلی
              </Button>
              <span className="text-sm text-gray-600">
                صفحه {smsPage} از {smsPagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSmsPage(smsPage + 1)}
                disabled={smsPage === smsPagination.pages}
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Notifications Tab Content
  const renderNotificationsTab = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-4 border-purple-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">در حال بارگذاری...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">هیچ اعلان دریافتی یافت نشد</p>
        </div>
      ) : (
        <>
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className="border-r-4 border-r-purple-500"
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {notification.data.title}
                    </h4>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500 mb-2">
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        فرستنده: {notification.data.sender}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatPersianDate(notification.data.persiandate)}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    اعلان
                  </Badge>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  {renderMessageContent(notification.data.message)}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination for Notifications */}
          {notificationsPagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 space-x-reverse mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsPage(notificationsPage - 1)}
                disabled={notificationsPage === 1}
              >
                قبلی
              </Button>
              <span className="text-sm text-gray-600">
                صفحه {notificationsPage} از {notificationsPagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsPage(notificationsPage + 1)}
                disabled={notificationsPage === notificationsPagination.pages}
              >
                بعدی
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
            ارتباطات دانش‌آموز
          </CardTitle>
          <p className="text-sm text-gray-600">
            مشاهده تمامی ارتباطات مربوط به {student.data.studentName}{" "}
            {student.data.studentFamily}
          </p>
        </CardHeader>
      </Card>

      {/* Communications Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="messages"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <MessageSquare className="h-4 w-4" />
                <span>پیام‌های ارسالی</span>
              </TabsTrigger>
              <TabsTrigger
                value="sms"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Phone className="h-4 w-4" />
                <span>پیامک‌های دریافتی</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Bell className="h-4 w-4" />
                <span>اعلان‌های دریافتی</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="mt-6">
              {renderMessagesTab()}
            </TabsContent>

            <TabsContent value="sms" className="mt-6">
              {renderSmsTab()}
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              {renderNotificationsTab()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
