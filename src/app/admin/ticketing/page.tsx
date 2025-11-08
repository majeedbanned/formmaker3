"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  Plus, 
  Settings, 
  MessageSquare, 
  Users, 
  BarChart3,
  Filter,
  Search,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";

interface Department {
  _id: string;
  data: {
    name: string;
    description: string;
    assignedTeachers: string[];
    createdAt: string;
    isActive: boolean;
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
    departmentId: string;
  };
  departmentName: string;
  creatorName: string;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
}

export default function TicketingDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch departments
      const deptResponse = await fetch("/api/ticketing/departments");
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments || []);
      }

      // Fetch tickets
      const ticketResponse = await fetch("/api/ticketing/tickets?limit=20");
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        setTickets(ticketData.tickets || []);
        
        // Calculate stats
        const ticketStats = (ticketData.tickets || []).reduce(
          (acc: TicketStats, ticket: Ticket) => {
            acc.total++;
            switch (ticket.data.status) {
              case "Open":
                acc.open++;
                break;
              case "In Progress":
                acc.inProgress++;
                break;
              case "Resolved":
                acc.resolved++;
                break;
              case "Closed":
                acc.closed++;
                break;
            }
            return acc;
          },
          { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }
        );
        setStats(ticketStats);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchQuery || 
      ticket.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.data.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || ticket.data.status === statusFilter;
    const matchesDepartment = !departmentFilter || ticket.data.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

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
        title="سیستم تیکتینگ"
        subtitle="مدیریت تیکت‌ها و درخواست‌های پشتیبانی"
        icon={<MessageSquare className="w-6 h-6" />}
        gradient={true}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 mb-8">
        {user.userType === "teacher" && (
          <Link href="/admin/ticketing/tickets/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              تیکت جدید
            </Button>
          </Link>
        )}
        
        {user.userType === "school" && (
          <>
            <Link href="/admin/ticketing/departments">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                مدیریت بخش‌ها
              </Button>
            </Link>
            
            <Link href="/admin/ticketing/departments/assignments">
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                تخصیص معلمان
              </Button>
            </Link>

            <Link href="/admin/ticketing/templates">
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                الگوهای تیکت
              </Button>
            </Link>
          </>
        )}

        <Link href="/admin/ticketing/tickets">
          <Button variant="outline" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            همه تیکت‌ها
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل تیکت‌ها</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">باز</CardTitle>
            <div className="h-4 w-4 rounded-full bg-red-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">در حال پیگیری</CardTitle>
            <div className="h-4 w-4 rounded-full bg-yellow-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حل شده</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بسته</CardTitle>
            <div className="h-4 w-4 rounded-full bg-gray-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            فیلترها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو در تیکت‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
          </div>
        </CardContent>
      </Card>

      {/* Recent Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>تیکت‌های اخیر</CardTitle>
          <CardDescription>
            {filteredTickets.length} تیکت از {tickets.length} تیکت
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ تیکتی یافت نشد
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.slice(0, 10).map((ticket) => (
                <div key={ticket._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                          {ticket.data.status === "Open" && "باز"}
                          {ticket.data.status === "In Progress" && "در حال پیگیری"}
                          {ticket.data.status === "Resolved" && "حل شده"}
                          {ticket.data.status === "Closed" && "بسته"}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.data.priority)}>
                          {ticket.data.priority === "High" && "بالا"}
                          {ticket.data.priority === "Medium" && "متوسط"}
                          {ticket.data.priority === "Low" && "پایین"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2 line-clamp-2">
                        {ticket.data.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>بخش: {ticket.departmentName}</span>
                        <span>ایجاد شده توسط: {ticket.creatorName}</span>
                        <span>
                          {new Date(ticket.data.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
