"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface SmsLog {
  _id: string;
  messageId: string;
  fromNumber: string;
  toNumbers: string[];
  message: string;
  recipientCount: number;
  senderCode: string;
  schoolCode: string;
  smsResult?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface PhoneStatus {
  phone: string;
  status: string;
  isChecking: boolean;
}

export default function SmsLogsPage() {
  const searchParams = useSearchParams();
  const messageId = searchParams.get("messageId");

  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusChecks, setStatusChecks] = useState<Record<string, string>>({});
  const [isCheckingStatus, setIsCheckingStatus] = useState<
    Record<string, boolean>
  >({});
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [phoneStatuses, setPhoneStatuses] = useState<
    Record<string, PhoneStatus[]>
  >({});

  useEffect(() => {
    if (messageId) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, [messageId]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/messages/log-sms/find?messageId=${messageId}`,
        {
          headers: {
            "x-domain": window.location.host,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        toast.error("خطا در دریافت لاگ‌های پیامک");
      }
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
      toast.error("خطا در دریافت لاگ‌های پیامک");
    } finally {
      setIsLoading(false);
    }
  };

  const checkSmsStatus = async (messageId: string, index: number) => {
    try {
      setIsCheckingStatus((prev) => ({ ...prev, [index]: true }));

      const response = await fetch("/api/sms/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          messageId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatusChecks((prev) => ({
          ...prev,
          [index]: data.status || "نامشخص",
        }));
      } else {
        toast.error("خطا در دریافت وضعیت پیامک");
      }
    } catch (error) {
      console.error("Error checking SMS status:", error);
      toast.error("خطا در دریافت وضعیت پیامک");
    } finally {
      setIsCheckingStatus((prev) => ({ ...prev, [index]: false }));
    }
  };

  const checkPhoneStatus = async (
    messageId: string,
    phone: string,
    logId: string,
    phoneIndex: number
  ) => {
    try {
      setPhoneStatuses((prev) => {
        const logPhones = [...(prev[logId] || [])];
        logPhones[phoneIndex] = {
          ...logPhones[phoneIndex],
          isChecking: true,
        };
        return {
          ...prev,
          [logId]: logPhones,
        };
      });

      const response = await fetch("/api/sms/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          messageId,
          phone,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setPhoneStatuses((prev) => {
          const logPhones = [...(prev[logId] || [])];
          logPhones[phoneIndex] = {
            ...logPhones[phoneIndex],
            status: data.status || "نامشخص",
            isChecking: false,
          };
          return {
            ...prev,
            [logId]: logPhones,
          };
        });
      } else {
        toast.error(`خطا در دریافت وضعیت پیامک برای شماره ${phone}`);
      }
    } catch (error) {
      console.error("Error checking phone SMS status:", error);
      toast.error(`خطا در دریافت وضعیت پیامک برای شماره ${phone}`);

      setPhoneStatuses((prev) => {
        const logPhones = [...(prev[logId] || [])];
        logPhones[phoneIndex] = {
          ...logPhones[phoneIndex],
          isChecking: false,
        };
        return {
          ...prev,
          [logId]: logPhones,
        };
      });
    }
  };

  useEffect(() => {
    if (logs.length > 0) {
      const initialPhoneStatuses: Record<string, PhoneStatus[]> = {};

      logs.forEach((log) => {
        if (
          log._id === expandedLogId &&
          log.toNumbers &&
          log.toNumbers.length > 0
        ) {
          initialPhoneStatuses[log._id] = log.toNumbers.map((phone) => ({
            phone,
            status: "pending",
            isChecking: false,
          }));
        }
      });

      if (Object.keys(initialPhoneStatuses).length > 0) {
        setPhoneStatuses(initialPhoneStatuses);
      }
    }
  }, [logs, expandedLogId]);

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      "0": { color: "bg-green-500", label: "ارسال شده" },
      "1": { color: "bg-green-500", label: "ارسال شده به گیرنده" },
      "2": { color: "bg-red-500", label: "خطا در ارسال" },
      "3": { color: "bg-red-500", label: "نرسیده به گیرنده" },
      "4": { color: "bg-blue-500", label: "رسیده به مخابرات" },
      "5": { color: "bg-orange-500", label: "نرسیده به مخابرات" },
      "6": { color: "bg-purple-500", label: "وضعیت نامشخص" },
      sent: { color: "bg-green-500", label: "ارسال شده" },
      delivered: { color: "bg-green-500", label: "تحویل داده شده" },
      failed: { color: "bg-red-500", label: "ناموفق" },
      pending: { color: "bg-yellow-500", label: "در انتظار" },
      unknown: { color: "bg-gray-500", label: "نامشخص" },
    };

    const defaultStatus = { color: "bg-gray-500", label: "نامشخص" };
    const statusInfo = statusMap[status] || defaultStatus;

    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!messageId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>خطا در بارگذاری لاگ‌های پیامک</CardTitle>
            <CardDescription>شناسه پیام مشخص نشده است</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/admin/smssend">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  بازگشت به لیست پیام‌ها
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>لاگ‌های پیامک</CardTitle>
                <CardDescription>شناسه پیام: {messageId}</CardDescription>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <Button variant="outline" onClick={fetchLogs}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  بارگذاری مجدد
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/smssend">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    بازگشت
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                هیچ لاگی یافت نشد
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                برای این پیام هیچ لاگ پیامکی ثبت نشده است
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>لاگ‌های پیامک</CardTitle>
              <CardDescription>شناسه پیام: {messageId}</CardDescription>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" onClick={fetchLogs}>
                <RefreshCw className="mr-2 h-4 w-4" />
                بارگذاری مجدد
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/smssend">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  بازگشت
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">شماره ردیف</TableHead>
                  <TableHead className="text-right">تاریخ ارسال</TableHead>
                  <TableHead className="text-right">شماره فرستنده</TableHead>
                  <TableHead className="text-right">تعداد گیرندگان</TableHead>
                  <TableHead className="text-right">متن پیام</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, index) => (
                  <>
                    <TableRow key={log._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString("fa-IR")}
                        <div className="text-gray-500 text-xs">
                          {new Date(log.createdAt).toLocaleTimeString("fa-IR")}
                        </div>
                      </TableCell>
                      <TableCell>{log.fromNumber}</TableCell>
                      <TableCell>{log.recipientCount}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.message}
                      </TableCell>
                      <TableCell>
                        {statusChecks[index] ? (
                          renderStatusBadge(statusChecks[index])
                        ) : (
                          <Badge variant="outline">نامشخص</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkSmsStatus(log.messageId, index)}
                            disabled={isCheckingStatus[index]}
                          >
                            {isCheckingStatus[index] ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            بررسی وضعیت
                          </Button>
                          <Button
                            variant={
                              expandedLogId === log._id ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setExpandedLogId(
                                expandedLogId === log._id ? null : log._id
                              )
                            }
                          >
                            {expandedLogId === log._id
                              ? "بستن جزئیات"
                              : "نمایش جزئیات"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedLogId === log._id &&
                      log.toNumbers &&
                      log.toNumbers.length > 0 && (
                        <TableRow key={`${log._id}-expanded`}>
                          <TableCell colSpan={7} className="bg-gray-50 p-0">
                            <div className="p-4">
                              <h3 className="text-md font-medium mb-3">
                                شماره‌های گیرنده:
                              </h3>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-right">
                                      ردیف
                                    </TableHead>
                                    <TableHead className="text-right">
                                      شماره تلفن
                                    </TableHead>
                                    <TableHead className="text-right">
                                      وضعیت
                                    </TableHead>
                                    <TableHead className="text-right">
                                      عملیات
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {log.toNumbers.map((phone, phoneIndex) => (
                                    <TableRow
                                      key={`${log._id}-phone-${phoneIndex}`}
                                    >
                                      <TableCell>{phoneIndex + 1}</TableCell>
                                      <TableCell
                                        dir="ltr"
                                        className="text-left"
                                      >
                                        {phone}
                                      </TableCell>
                                      <TableCell>
                                        {phoneStatuses[log._id] &&
                                        phoneStatuses[log._id][phoneIndex]
                                          ?.status ? (
                                          renderStatusBadge(
                                            phoneStatuses[log._id][phoneIndex]
                                              .status
                                          )
                                        ) : (
                                          <Badge variant="outline">
                                            نامشخص
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            checkPhoneStatus(
                                              log.messageId,
                                              phone,
                                              log._id,
                                              phoneIndex
                                            )
                                          }
                                          disabled={
                                            phoneStatuses[log._id] &&
                                            phoneStatuses[log._id][phoneIndex]
                                              ?.isChecking
                                          }
                                        >
                                          {phoneStatuses[log._id] &&
                                          phoneStatuses[log._id][phoneIndex]
                                            ?.isChecking ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                          )}
                                          بررسی وضعیت
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
