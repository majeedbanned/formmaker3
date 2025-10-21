'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Bug, 
  Lightbulb,
  MessageSquare,
  Filter,
  Search,
  Eye,
  Loader2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

const SUPERADMIN_PASSWORD = 'parsamooz2025admin';

interface Feedback {
  _id: string;
  type: 'bug' | 'suggestion';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  phone?: string;
  submittedBy: {
    userId: string;
    username: string;
    name: string;
    userType: string;
    schoolCode: string;
    domain: string;
  };
  images?: Array<{
    name: string;
    data: string;
    contentType: string;
  }>;
  comments?: Array<{
    text: string;
    adminName: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  bugs: number;
  suggestions: number;
}

export default function SuperAdminFeedbackPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    bugs: 0,
    suggestions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Comment form
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [adminName, setAdminName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if password is saved in sessionStorage
  useEffect(() => {
    const savedPassword = sessionStorage.getItem('superadmin_password');
    if (savedPassword === SUPERADMIN_PASSWORD) {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch feedbacks when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedbacks();
    }
  }, [isAuthenticated, filterStatus, filterType, filterPriority, currentPage]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPERADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('superadmin_password', password);
      setPasswordError('');
    } else {
      setPasswordError('رمز عبور اشتباه است');
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterPriority !== 'all') params.append('priority', filterPriority);

        const response = await fetch(`/api/superadmin/feedbacks?${params}`, {
          headers: {
            'x-superadmin-password': SUPERADMIN_PASSWORD,
          },
        });

      const data = await response.json();
      
      if (data.success) {
        setFeedbacks(data.data.feedbacks);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    if (!newComment && !newStatus) {
      alert('لطفاً نظر یا وضعیت جدید را وارد کنید');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/superadmin/feedbacks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-superadmin-password': SUPERADMIN_PASSWORD,
        },
        body: JSON.stringify({
          feedbackId: selectedFeedback._id,
          status: newStatus || selectedFeedback.status,
          comment: newComment,
          adminName: adminName || 'مدیر سیستم',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the feedback in the list
        setFeedbacks(feedbacks.map(f => 
          f._id === selectedFeedback._id ? data.data : f
        ));
        setSelectedFeedback(data.data);
        setNewComment('');
        setNewStatus('');
        alert('بازخورد با موفقیت به‌روزرسانی شد');
        fetchFeedbacks(); // Refresh to update stats
      } else {
        alert('خطا در به‌روزرسانی بازخورد');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('خطا در به‌روزرسانی بازخورد');
    } finally {
      setSubmitting(false);
    }
  };

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">دسترسی مدیر ارشد</CardTitle>
            <CardDescription>
              برای دسترسی به پنل مدیریت بازخوردها رمز عبور را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="رمز عبور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    {passwordError}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                ورود
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Helper functions for badges and icons
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in-progress': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'باز';
      case 'in-progress': return 'در حال بررسی';
      case 'resolved': return 'حل شده';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'بحرانی';
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'کم';
      default: return priority;
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'bug' ? 'مشکل' : 'پیشنهاد';
  };

  // Filter feedbacks by search query
  const filteredFeedbacks = feedbacks.filter(f => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(query) ||
      f.description.toLowerCase().includes(query) ||
      f.submittedBy.name.toLowerCase().includes(query) ||
      f.submittedBy.domain.toLowerCase().includes(query)
    );
  });

  // Main UI
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                مدیریت بازخوردها
              </h1>
              <p className="text-gray-600 mt-1">
                مدیریت و پیگیری تمام بازخوردهای دریافتی از اپلیکیشن موبایل
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                sessionStorage.removeItem('superadmin_password');
                setIsAuthenticated(false);
              }}
            >
              خروج
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">کل</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                <div className="text-sm text-gray-600">باز</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
                <div className="text-sm text-gray-600">در حال بررسی</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <div className="text-sm text-gray-600">حل شده</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.bugs}</div>
                <div className="text-sm text-gray-600">مشکل</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-600">{stats.suggestions}</div>
                <div className="text-sm text-gray-600">پیشنهاد</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="جستجو..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="open">باز</SelectItem>
                    <SelectItem value="in-progress">در حال بررسی</SelectItem>
                    <SelectItem value="resolved">حل شده</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    <SelectItem value="bug">مشکل</SelectItem>
                    <SelectItem value="suggestion">پیشنهاد</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="اولویت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه اولویت‌ها</SelectItem>
                    <SelectItem value="critical">بحرانی</SelectItem>
                    <SelectItem value="high">بالا</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="low">کم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedbacks List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {filteredFeedbacks.map((feedback) => (
                <Card key={feedback._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {feedback.type === 'bug' ? (
                            <Bug className="w-5 h-5 text-red-600" />
                          ) : (
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                          )}
                          <h3 className="text-lg font-bold text-gray-900">
                            {feedback.title}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(feedback.status)}>
                            {getStatusLabel(feedback.status)}
                          </Badge>
                          <Badge className={getPriorityColor(feedback.priority)}>
                            {getPriorityLabel(feedback.priority)}
                          </Badge>
                          <Badge variant="outline">
                            {getTypeLabel(feedback.type)}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {feedback.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-semibold">ارسال‌کننده: </span>
                            {feedback.submittedBy?.name}
                          </div>
                          <div>
                            <span className="font-semibold">نوع کاربر: </span>
                            {feedback.submittedBy?.userType === 'school' ? 'مدیر' : 'معلم'}
                          </div>
                          <div>
                            <span className="font-semibold">دامنه: </span>
                            {feedback.submittedBy?.domain}
                          </div>
                          <div>
                            <span className="font-semibold">تاریخ: </span>
                            {new Date(feedback.createdAt).toLocaleDateString('fa-IR')}
                          </div>
                        </div>

                        {feedback.phone && (
                          <div className="text-sm text-gray-600 mt-2">
                            <span className="font-semibold">شماره تماس: </span>
                            {feedback.phone}
                          </div>
                        )}

                        {feedback.comments && feedback.comments.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-900">
                                {feedback.comments.length} نظر
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFeedback(feedback)}
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            مشاهده و پاسخ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {feedback.type === 'bug' ? (
                                <Bug className="w-5 h-5 text-red-600" />
                              ) : (
                                <Lightbulb className="w-5 h-5 text-yellow-600" />
                              )}
                              {feedback.title}
                            </DialogTitle>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge className={getStatusColor(feedback.status)}>
                                {getStatusLabel(feedback.status)}
                              </Badge>
                              <Badge className={getPriorityColor(feedback.priority)}>
                                {getPriorityLabel(feedback.priority)}
                              </Badge>
                              <Badge variant="outline">
                                {getTypeLabel(feedback.type)}
                              </Badge>
                            </div>

                            {/* Description */}
                            <div>
                              <h4 className="font-semibold mb-2">توضیحات:</h4>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {feedback.description}
                              </p>
                            </div>

                            {/* Submitter Info */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-semibold mb-2">اطلاعات ارسال‌کننده:</h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="font-semibold">نام:</span> {feedback.submittedBy?.name}</div>
                                <div><span className="font-semibold">نوع کاربر:</span> {feedback.submittedBy?.userType === 'school' ? 'مدیر مدرسه' : 'معلم'}</div>
                                <div><span className="font-semibold">کد مدرسه:</span> {feedback.submittedBy?.schoolCode}</div>
                                <div><span className="font-semibold">دامنه:</span> {feedback.submittedBy?.domain}</div>
                                <div><span className="font-semibold">شناسه کاربر:</span> {feedback.submittedBy?.userId}</div>
                                {feedback.phone && (
                                  <div><span className="font-semibold">تلفن:</span> {feedback.phone}</div>
                                )}
                              </div>
                            </div>

                            {/* Images */}
                            {feedback.images && feedback.images.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">تصاویر ضمیمه:</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {feedback.images.map((image, idx) => (
                                    <img
                                      key={idx}
                                      src={`data:${image.contentType};base64,${image.data}`}
                                      alt={image.name}
                                      className="w-full h-32 object-cover rounded-lg"
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Comments (Admin and User) */}
                            {feedback.comments && feedback.comments.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">گفتگو:</h4>
                                <div className="space-y-2">
                                  {/* Sort comments by createdAt to show in chronological order */}
                                  {[...feedback.comments]
                                    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                    .map((comment: any, idx) => (
                                      <div 
                                        key={idx} 
                                        className={
                                          comment.isAdminComment 
                                            ? "bg-blue-50 border border-blue-200 p-3 rounded-lg" 
                                            : "bg-green-50 border border-green-200 p-3 rounded-lg"
                                        }
                                      >
                                        <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center gap-2">
                                            <span className={
                                              comment.isAdminComment 
                                                ? "font-semibold text-blue-900"
                                                : "font-semibold text-green-900"
                                            }>
                                              {comment.authorName || comment.adminName || 'ناشناس'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                              ({comment.authorType || (comment.isAdminComment ? 'پشتیبانی' : 'کاربر')})
                                            </span>
                                          </div>
                                          <span className="text-xs text-gray-600">
                                            {new Date(comment.createdAt).toLocaleDateString('fa-IR')} {new Date(comment.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        <p className="text-gray-700">{comment.text}</p>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                            {/* Add Comment Form */}
                            <div className="border-t pt-4">
                              <h4 className="font-semibold mb-3">افزودن نظر یا تغییر وضعیت:</h4>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    نام شما:
                                  </label>
                                  <Input
                                    value={adminName}
                                    onChange={(e) => setAdminName(e.target.value)}
                                    placeholder="مدیر سیستم"
                                  />
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    وضعیت جدید:
                                  </label>
                                  <Select 
                                    value={newStatus || feedback.status} 
                                    onValueChange={setNewStatus}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="open">باز</SelectItem>
                                      <SelectItem value="in-progress">در حال بررسی</SelectItem>
                                      <SelectItem value="resolved">حل شده</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-1 block">
                                    نظر:
                                  </label>
                                  <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="نظر خود را وارد کنید..."
                                    rows={4}
                                  />
                                </div>

                                <Button
                                  onClick={handleUpdateFeedback}
                                  disabled={submitting || (!newComment && !newStatus)}
                                  className="w-full"
                                >
                                  {submitting ? (
                                    <>
                                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                      در حال ارسال...
                                    </>
                                  ) : (
                                    'ثبت تغییرات'
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Metadata */}
                            <div className="text-xs text-gray-500 pt-4 border-t">
                              <div>شناسه: {feedback._id}</div>
                              <div>تاریخ ایجاد: {new Date(feedback.createdAt).toLocaleString('fa-IR')}</div>
                              <div>آخرین به‌روزرسانی: {new Date(feedback.updatedAt).toLocaleString('fa-IR')}</div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  قبلی
                </Button>
                <span className="text-sm text-gray-600">
                  صفحه {currentPage} از {totalPages} ({totalCount} مورد)
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  بعدی
                </Button>
              </div>
            )}

            {filteredFeedbacks.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">بازخوردی یافت نشد</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

