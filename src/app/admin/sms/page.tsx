"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SendHorizonal,
  Plus,
  Trash,
  RefreshCw,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toPersianDateTime, toRelativeTime } from "@/lib/dateUtils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Form schemas
const sendSMSSchema = z.object({
  fromNumber: z.string().min(1, { message: "شماره فرستنده الزامی است" }),
  toNumbers: z.string().min(1, { message: "حداقل یک شماره گیرنده وارد کنید" }),
  message: z.string().min(1, { message: "متن پیام الزامی است" }),
});

const phonebookSchema = z.object({
  name: z.string().min(1, { message: "نام دفترچه تلفن الزامی است" }),
  numbers: z.string().min(1, { message: "حداقل یک شماره تلفن وارد کنید" }),
});

// SMS Record Interface
interface SMSRecord {
  _id: string;
  messageId: string;
  fromNumber: string;
  toNumber: string;
  message: string;
  status: string;
  statusCheckedAt?: string;
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

// Pagination Interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function SMSAdminPage() {
  const { toast } = useToast();
  const [credit, setCredit] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [phonebooks, setPhonebooks] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedPhonebook, setSelectedPhonebook] = useState<string | null>(
    null
  );
  const [phonebookNumbers, setPhonebookNumbers] = useState<string[]>([]);

  // SMS records state
  const [smsRecords, setSmsRecords] = useState<SMSRecord[]>([]);
  const [recordsPagination, setRecordsPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<SMSRecord | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState<boolean>(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);

  // Forms
  const sendSMSForm = useForm<z.infer<typeof sendSMSSchema>>({
    resolver: zodResolver(sendSMSSchema),
    defaultValues: {
      fromNumber: "",
      toNumbers: "",
      message: "",
    },
  });

  const phonebookForm = useForm<z.infer<typeof phonebookSchema>>({
    resolver: zodResolver(phonebookSchema),
    defaultValues: {
      name: "",
      numbers: "",
    },
  });

  // Load credit, phonebooks, and SMS records on component mount
  useEffect(() => {
    getCredit();
    getPhonebooks();
    getSmsRecords(1);
  }, []);

  // Get account credit
  const getCredit = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/sms/credit", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to get credit");
      }

      const data = await response.json();
      setCredit(data.credit);
    } catch (err: unknown) {
      console.error("Error fetching credit:", err);
      toast({
        title: "خطا",
        description: "خطا در دریافت اعتبار حساب",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get phonebooks
  const getPhonebooks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/sms/phonebook/list", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to get phonebooks");
      }

      const data = await response.json();
      setPhonebooks(data.phonebooks);
    } catch (err: unknown) {
      console.error("Error fetching phonebooks:", err);
      toast({
        title: "خطا",
        description: "خطا در دریافت دفترچه تلفن‌ها",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get SMS records
  const getSmsRecords = async (page: number) => {
    try {
      setIsLoadingRecords(true);
      const response = await fetch(
        `/api/sms/records?page=${page}&limit=${recordsPagination.limit}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get SMS records");
      }

      const data = await response.json();
      setSmsRecords(data.records);
      setRecordsPagination(data.pagination);
    } catch (err: unknown) {
      console.error("Error fetching SMS records:", err);
      toast({
        title: "خطا",
        description: "خطا در دریافت لیست پیامک‌ها",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Check SMS status
  const checkSmsStatus = async (record: SMSRecord) => {
    try {
      setSelectedRecord(record);
      setIsStatusDialogOpen(true);
      setIsCheckingStatus(true);

      const response = await fetch("/api/sms/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: record.messageId,
          recordId: record._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check SMS status");
      }

      const data = await response.json();

      // Update the record in the list
      setSmsRecords((prevRecords) =>
        prevRecords.map((r) =>
          r._id === record._id
            ? { ...r, status: data.status, statusCheckedAt: data.updatedAt }
            : r
        )
      );

      // Update the selected record
      setSelectedRecord((prev) =>
        prev
          ? { ...prev, status: data.status, statusCheckedAt: data.updatedAt }
          : null
      );

      toast({
        title: "موفقیت",
        description: "وضعیت پیامک با موفقیت بروزرسانی شد",
      });
    } catch (err: unknown) {
      console.error("Error checking SMS status:", err);
      toast({
        title: "خطا",
        description: "خطا در بررسی وضعیت پیامک",
        variant: "destructive",
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Get phonebook numbers
  const getPhonebookNumbers = async (bookId: string) => {
    try {
      setIsLoading(true);
      setSelectedPhonebook(bookId);

      const response = await fetch(
        `/api/sms/phonebook/numbers?bookId=${bookId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get phonebook numbers");
      }

      const data = await response.json();
      setPhonebookNumbers(data.numbers);
    } catch (err: unknown) {
      console.error("Error fetching phonebook numbers:", err);
      toast({
        title: "خطا",
        description: "خطا در دریافت شماره‌های دفترچه تلفن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send SMS
  const onSendSMS = async (values: z.infer<typeof sendSMSSchema>) => {
    try {
      setIsLoading(true);
      const toNumbersArray = values.toNumbers
        .split(",")
        .map((num) => num.trim());

      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromNumber: values.fromNumber,
          toNumbers: toNumbersArray,
          message: values.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send SMS");
      }

      await response.json();

      toast({
        title: "موفقیت",
        description: "پیام با موفقیت ارسال شد",
      });

      // Update credit after sending
      getCredit();

      // Refresh SMS records
      getSmsRecords(1);

      // Reset form
      sendSMSForm.reset();
    } catch (err: unknown) {
      console.error("Error sending SMS:", err);
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create phonebook
  const onCreatePhonebook = async (values: z.infer<typeof phonebookSchema>) => {
    try {
      setIsLoading(true);
      const numbersArray = values.numbers.split(",").map((num) => num.trim());

      const response = await fetch("/api/sms/phonebook/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          numbers: numbersArray,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create phonebook");
      }

      toast({
        title: "موفقیت",
        description: "دفترچه تلفن با موفقیت ایجاد شد",
      });

      // Refresh phonebooks
      getPhonebooks();

      // Reset form
      phonebookForm.reset();
    } catch (err: unknown) {
      console.error("Error creating phonebook:", err);
      toast({
        title: "خطا",
        description: "خطا در ایجاد دفترچه تلفن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete phonebook
  const deletePhonebook = async (bookId: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/sms/phonebook/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete phonebook");
      }

      toast({
        title: "موفقیت",
        description: "دفترچه تلفن با موفقیت حذف شد",
      });

      // Refresh phonebooks
      getPhonebooks();

      // Clear selected phonebook if it was deleted
      if (selectedPhonebook === bookId) {
        setSelectedPhonebook(null);
        setPhonebookNumbers([]);
      }
    } catch (err: unknown) {
      console.error("Error deleting phonebook:", err);
      toast({
        title: "خطا",
        description: "خطا در حذف دفترچه تلفن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete number from phonebook
  const deleteNumberFromPhonebook = async (number: string) => {
    if (!selectedPhonebook) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/sms/phonebook/numbers/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookId: selectedPhonebook,
          numbers: [number],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete number");
      }

      toast({
        title: "موفقیت",
        description: "شماره با موفقیت حذف شد",
      });

      // Refresh phonebook numbers
      getPhonebookNumbers(selectedPhonebook);
    } catch (err: unknown) {
      console.error("Error deleting number:", err);
      toast({
        title: "خطا",
        description: "خطا در حذف شماره",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Send to phonebook
  const sendToPhonebook = async (bookId: string) => {
    const fromNumber = sendSMSForm.getValues("fromNumber");
    const message = sendSMSForm.getValues("message");

    if (!fromNumber || !message) {
      toast({
        title: "خطا",
        description: "شماره فرستنده و متن پیام را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/sms/phonebook/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromNumber,
          phonebookId: bookId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send to phonebook");
      }

      toast({
        title: "موفقیت",
        description: "پیام با موفقیت به دفترچه تلفن ارسال شد",
      });

      // Update credit after sending
      getCredit();

      // Refresh SMS records
      getSmsRecords(1);
    } catch (err: unknown) {
      console.error("Error sending to phonebook:", err);
      toast({
        title: "خطا",
        description: "خطا در ارسال پیام به دفترچه تلفن",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render status badge based on SMS status
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge variant="outline" className="bg-blue-50">
            ارسال شده
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="bg-green-50">
            تحویل داده شده
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50">
            ناموفق
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50">
            در انتظار
          </Badge>
        );
      default:
        return <Badge variant="outline">نامشخص</Badge>;
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page < 1 || page > recordsPagination.pages) return;
    getSmsRecords(page);
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const { page, pages } = recordsPagination;
    const items = [];

    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious
          onClick={() => handlePageChange(page - 1)}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    // First page
    if (pages > 0) {
      items.push(
        <PaginationItem key="1">
          <PaginationLink
            isActive={page === 1}
            onClick={() => handlePageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis after first page
    if (page > 3) {
      items.push(<PaginationEllipsis key="ellipsis-1" />);
    }

    // Pages around current
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(pages - 1, page + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={page === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Ellipsis before last page
    if (page < pages - 2) {
      items.push(<PaginationEllipsis key="ellipsis-2" />);
    }

    // Last page
    if (pages > 1) {
      items.push(
        <PaginationItem key={pages}>
          <PaginationLink
            isActive={page === pages}
            onClick={() => handlePageChange(pages)}
          >
            {pages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext
          onClick={() => handlePageChange(page + 1)}
          className={page >= pages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );

    return items;
  };

  return (
    <div dir="rtl" className="container mx-auto p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">مدیریت پیامک</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">اعتبار:</span>
          <span className="font-bold">{credit} ریال</span>
          <Button
            variant="outline"
            size="sm"
            onClick={getCredit}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            بروزرسانی
          </Button>
        </div>
      </div>

      <Tabs defaultValue="send" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="send">ارسال پیامک</TabsTrigger>
          <TabsTrigger value="records">تاریخچه پیامک‌های ارسال شده</TabsTrigger>
          <TabsTrigger value="phonebook">مدیریت دفترچه تلفن</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>ارسال پیامک</CardTitle>
              <CardDescription>
                فرم زیر را پر کرده و پیامک خود را ارسال کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sendSMSForm}>
                <form
                  onSubmit={sendSMSForm.handleSubmit(onSendSMS)}
                  className="space-y-4"
                >
                  <FormField
                    control={sendSMSForm.control}
                    name="fromNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره فرستنده</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: 10000123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sendSMSForm.control}
                    name="toNumbers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره گیرندگان (با کاما جدا کنید)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="مثال: 09123456789, 09123456788"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={sendSMSForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>متن پیام</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="متن پیام خود را وارد کنید..."
                            {...field}
                            rows={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <SendHorizonal className="h-4 w-4 mr-2" />
                    )}
                    ارسال پیامک
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {phonebooks.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>ارسال به دفترچه تلفن</CardTitle>
                <CardDescription>
                  یکی از دفترچه‌های تلفن را برای ارسال پیامک انتخاب کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {phonebooks.map((book) => (
                    <Card key={book.id} className="border border-gray-200">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">
                          {book.name}
                        </CardTitle>
                      </CardHeader>
                      <CardFooter className="pb-3 pt-0 flex justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => sendToPhonebook(book.id)}
                          disabled={isLoading}
                        >
                          ارسال
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>تاریخچه پیامک‌های ارسال شده</CardTitle>
              <CardDescription>
                تمام پیامک‌های ارسال شده و وضعیت آن‌ها
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRecords ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : smsRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هیچ پیامکی یافت نشد
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>گیرنده</TableHead>
                          <TableHead>متن پیام</TableHead>
                          <TableHead className="w-32">تاریخ ارسال</TableHead>
                          <TableHead className="w-32">وضعیت</TableHead>
                          <TableHead className="w-20">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {smsRecords.map((record) => (
                          <TableRow key={record._id}>
                            <TableCell className="font-medium">
                              {record.toNumber}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {record.message.length > 60
                                ? `${record.message.substring(0, 60)}...`
                                : record.message}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {toPersianDateTime(record.sentAt)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {toRelativeTime(record.sentAt)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {renderStatusBadge(record.status)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => checkSmsStatus(record)}
                                title="بررسی وضعیت"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {recordsPagination.pages > 1 && (
                    <div className="mt-4 flex justify-center">
                      <Pagination>
                        <PaginationContent>
                          {getPaginationItems()}
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phonebook">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ایجاد دفترچه تلفن جدید</CardTitle>
                <CardDescription>
                  اطلاعات دفترچه تلفن جدید را وارد کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...phonebookForm}>
                  <form
                    onSubmit={phonebookForm.handleSubmit(onCreatePhonebook)}
                    className="space-y-4"
                  >
                    <FormField
                      control={phonebookForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام دفترچه تلفن</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: مشتریان" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={phonebookForm.control}
                      name="numbers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>شماره‌ها (با کاما جدا کنید)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="مثال: 09123456789, 09123456788"
                              {...field}
                              rows={5}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      ایجاد دفترچه تلفن
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>دفترچه‌های تلفن</CardTitle>
                <CardDescription>
                  دفترچه‌های تلفن و شماره‌های موجود در آن‌ها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {phonebooks.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-gray-500">هیچ دفترچه تلفنی یافت نشد</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {phonebooks.map((book) => (
                        <Card
                          key={book.id}
                          className={`border cursor-pointer ${
                            selectedPhonebook === book.id
                              ? "border-primary"
                              : "border-gray-200"
                          }`}
                          onClick={() => getPhonebookNumbers(book.id)}
                        >
                          <CardHeader className="py-2 px-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {book.name}
                            </CardTitle>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                deletePhonebook(book.id);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>

                    {selectedPhonebook && (
                      <Card>
                        <CardHeader className="py-2">
                          <CardTitle className="text-sm">
                            لیست شماره‌ها
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[200px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>شماره تلفن</TableHead>
                                  <TableHead className="w-16">حذف</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {phonebookNumbers.length === 0 ? (
                                  <TableRow>
                                    <TableCell
                                      colSpan={2}
                                      className="text-center"
                                    >
                                      شماره‌ای یافت نشد
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  phonebookNumbers.map((number, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{number}</TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500"
                                          onClick={() =>
                                            deleteNumberFromPhonebook(number)
                                          }
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* SMS Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>جزئیات پیامک</DialogTitle>
            <DialogDescription>اطلاعات و وضعیت ارسال پیامک</DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">گیرنده</p>
                  <p className="text-sm">{selectedRecord.toNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">فرستنده</p>
                  <p className="text-sm">{selectedRecord.fromNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">وضعیت</p>
                  <div>{renderStatusBadge(selectedRecord.status)}</div>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">تاریخ ارسال</p>
                <p className="text-sm">
                  {toPersianDateTime(selectedRecord.sentAt)}
                </p>
              </div>

              {selectedRecord.statusCheckedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    آخرین بررسی وضعیت
                  </p>
                  <p className="text-sm">
                    {toPersianDateTime(selectedRecord.statusCheckedAt)}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">متن پیام</p>
                <p className="text-sm border p-2 rounded-md bg-gray-50">
                  {selectedRecord.message}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="default"
              onClick={() => selectedRecord && checkSmsStatus(selectedRecord)}
              disabled={isCheckingStatus}
            >
              {isCheckingStatus ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              بررسی مجدد وضعیت
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
