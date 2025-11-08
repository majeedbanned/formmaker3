"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Filter, 
  Search, 
  MessageSquare,
  Calendar,
  User,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { toast } from "sonner";

interface Department {
  _id: string;
  data: {
    name: string;
    description: string;
  };
}

interface Ticket {
  _id: string;
  data: {
    title: string;
    description: string;
    status: "Open" | "In Progress" | "Resolved" | "Closed";
    priority: "Low" | "Medium" | "High";
    createdAt: string;
    updatedAt: string;
    departmentId: string;
  };
  departmentName: string;
  creatorName: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function TicketsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDepartments();
      fetchTickets();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTickets();
    }
  }, [pagination.page, statusFilter, priorityFilter, departmentFilter, createdByFilter]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/ticketing/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (departmentFilter) params.append("departmentId", departmentFilter);
      if (createdByFilter) params.append("createdBy", createdByFilter);

      const response = await fetch(`/api/ticketing/tickets?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
        setPagination(data.pagination);
      } else {
        toast.error("خطا در دریافت تیکت‌ها");
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("خطا در دریافت تیکت‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Reset to first page and fetch with search
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchTickets();
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
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

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">لطفاً وارد شوید</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <PageHeader
        title="تیکت‌ها"
        subtitle="مدیریت و پیگیری تیکت‌های پشتیبانی"
        icon={<MessageSquare className="w-6 h-6" />}
        gradient={true}
      />

      <div className="flex justify-between items-center mb-6">
        {user.userType === "teacher" && (
          <Link href="/admin/ticketing/tickets/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              تیکت جدید
            </Button>
          </Link>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>کل: {pagination.total} تیکت</span>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">همه وضعیت‌ها</SelectItem>
                <SelectItem value="Open">باز</SelectItem>
                <SelectItem value="In Progress">در حال پیگیری</SelectItem>
                <SelectItem value="Resolved">حل شده</SelectItem>
                <SelectItem value="Closed">بسته</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">همه اولویت‌ها</SelectItem>
                <SelectItem value="High">بالا</SelectItem>
                <SelectItem value="Medium">متوسط</SelectItem>
                <SelectItem value="Low">پایین</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="بخش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">همه بخش‌ها</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.data.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={handleSearch} variant="outline" size="sm">
                <Search className="w-4 h-4 ml-2" />
                جستجو
              </Button>
              <Button 
                onClick={() => {
                  setStatusFilter("");
                  setPriorityFilter("");
                  setDepartmentFilter("");
                  setCreatedByFilter("");
                  setSearchQuery("");
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                variant="outline" 
                size="sm"
              >
                پاک کردن
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              هیچ تیکتی یافت نشد
            </h3>
            <p className="text-gray-500 mb-4">
              {user.userType === "teacher" 
                ? "برای شروع، اولین تیکت خود را ایجاد کنید" 
                : "هنوز هیچ تیکتی ثبت نشده است"
              }
            </p>
            {user.userType === "teacher" && (
              <Link href="/admin/ticketing/tickets/new">
                <Button>
                  <Plus className="w-4 h-4 ml-2" />
                  ایجاد تیکت جدید
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {tickets.map((ticket) => (
              <Card key={ticket._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          <Link 
                            href={`/admin/ticketing/tickets/${ticket._id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {ticket.data.title}
                          </Link>
                        </h3>
                        <Badge className={getStatusColor(ticket.data.status)}>
                          {getStatusText(ticket.data.status)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.data.priority)}>
                          {getPriorityText(ticket.data.priority)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {ticket.data.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>بخش: {ticket.departmentName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>ایجاد شده توسط: {ticket.creatorName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(ticket.data.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>
                        {ticket.data.updatedAt !== ticket.data.createdAt && (
                          <div className="flex items-center gap-1">
                            <span>آخرین بروزرسانی:</span>
                            <span>
                              {new Date(ticket.data.updatedAt).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(pagination.pages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === pagination.pages ||
                    (page >= pagination.page - 2 && page <= pagination.page + 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === pagination.page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (page === pagination.page - 3 || page === pagination.page + 3) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    className={pagination.page === pagination.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
