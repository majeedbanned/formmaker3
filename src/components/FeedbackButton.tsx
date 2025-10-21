"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  List,
  Send,
  Clock,
  AlertCircle,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";

interface FeedbackButtonProps {
  variant?: "floating" | "inline";
}

interface Feedback {
  _id: string;
  type: 'bug' | 'suggestion';
  title: string;
  description: string;
  priority: string;
  status: string;
  phone?: string;
  submittedBy: {
    name: string;
    userType: string;
    schoolCode: string;
    domain: string;
  };
  comments?: Array<{
    text: string;
    authorName?: string;
    adminName?: string; // For backward compatibility
    authorType?: string;
    isAdminComment: boolean;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function FeedbackButton({ variant = "floating" }: FeedbackButtonProps) {
  const { user, isLoading: userLoading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  
  // View mode: 'create' or 'list' or 'detail'
  const [viewMode, setViewMode] = useState<'create' | 'list' | 'detail'>('create');
  
  // My Feedbacks
  const [myFeedbacks, setMyFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Form fields
  const [type, setType] = useState<"bug" | "suggestion">("suggestion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<File[]>([]);

  // Don't render anything until user data is loaded
  if (userLoading) {
    return null;
  }

  // Only show for school and teacher users
  if (!user || (user.userType !== "school" && user.userType !== "teacher")) {
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limit to 5 images
    if (images.length + files.length > 5) {
      toast.error("حداکثر 5 تصویر می‌توانید آپلود کنید");
      return;
    }

    // Limit each file to 5MB
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`فایل ${file.name} بیش از 5 مگابایت است`);
        return false;
      }
      return true;
    });

    setImages([...images, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error("لطفاً عنوان را وارد کنید");
      return;
    }

    if (!description.trim()) {
      toast.error("لطفاً توضیحات را وارد کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('phone', phone);

      // Append images
      images.forEach((image) => {
        formData.append('images', image);
      });

      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errorFa || error.error || 'خطا در ارسال بازخورد');
      }

      const data = await response.json();

      // Send SMS notifications using admin credentials
      try {
        // Send thank you SMS to user if phone number provided
        if (phone && phone.trim() && phone.length === 11) {
          await fetch('/api/sms/admin-send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromNumber: '9998762911',
              toNumbers: [phone],
              message: `سلام ${user?.name || ''}، بازخورد شما با موفقیت ثبت شد. از همکاری شما سپاسگزاریم. تیم پشتیبانی پارسا موز`,
            }),
          });
        }

        // Send notification SMS to admin
        await fetch('/api/sms/admin-send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fromNumber: '9998762911',
            toNumbers: ['09177204118'],
            message: `بازخورد جدید: ${type === 'bug' ? 'مشکل' : 'پیشنهاد'} - ${title.substring(0, 50)} - توسط: ${user?.name || ''} (${user?.schoolCode || ''})`,
          }),
        });
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
        // Don't show error to user, SMS is optional
      }

      // Show thank you message
      setShowThankYou(true);

      // Reset form after a delay
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setPhone("");
        setImages([]);
        setType("suggestion");
        setShowThankYou(false);
        setIsOpen(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error instanceof Error ? error.message : 'خطا در ارسال بازخورد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !submittingComment) {
      setIsOpen(false);
      setShowThankYou(false);
      setViewMode('create');
      setSelectedFeedback(null);
      setNewComment('');
    }
  };

  const fetchMyFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const response = await fetch('/api/feedback/my-feedbacks');
      const data = await response.json();
      
      if (data.success) {
        setMyFeedbacks(data.data);
      } else {
        toast.error(data.message || 'خطا در دریافت بازخوردها');
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      toast.error('خطا در دریافت بازخوردها');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleViewMyFeedbacks = () => {
    setViewMode('list');
    fetchMyFeedbacks();
  };

  const handleViewFeedbackDetail = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedFeedback(null);
    setNewComment('');
  };

  const handleBackToCreate = () => {
    setViewMode('create');
    setSelectedFeedback(null);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedFeedback) {
      toast.error('لطفاً متن نظر را وارد کنید');
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await fetch('/api/feedback/add-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: selectedFeedback._id,
          comment: newComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('نظر شما با موفقیت ثبت شد');
        setSelectedFeedback(data.data);
        setNewComment('');
        // Refresh the list
        fetchMyFeedbacks();
      } else {
        toast.error(data.message || 'خطا در ثبت نظر');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('خطا در ثبت نظر');
    } finally {
      setSubmittingComment(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Feedback Button - Floating or Inline */}
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant === "inline" ? "default" : "default"}
        size={variant === "inline" ? "sm" : "default"}
        className={
          variant === "floating"
            ? "fixed bottom-6 left-6 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 animate-pulse hover:animate-none"
            : "flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-1900 animate-pulse hover:animate-none"
        }
        title="گزارش مشکل یا پیشنهاد"
      >
        <MessageSquarePlus className={variant === "inline" ? "h-4 w-4" : "h-6 w-6"} />
        {variant === "inline" && <span>گزارش مشکل یا پیشنهاد</span>}
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir="rtl">
          {showThankYou ? (
            // Thank You Message
            <div className="text-center py-12">
              <div className="mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  از همکاری شما سپاسگزاریم!
                </h3>
                <p className="text-gray-600 text-lg">
                  بازخورد شما با موفقیت ثبت شد
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  نظرات شما برای ما بسیار ارزشمند است و به بهبود سیستم کمک می‌کند.
                </p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            // My Feedbacks List View
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <List className="h-6 w-6 text-blue-600" />
                    بازخوردهای من
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToCreate}
                  >
                    <MessageSquarePlus className="h-4 w-4 ml-2" />
                    ثبت بازخورد جدید
                  </Button>
                </div>
                <DialogDescription>
                  مشاهده و پیگیری بازخوردهای ارسالی شما
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {loadingFeedbacks ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : myFeedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">شما هنوز بازخوردی ثبت نکرده‌اید</p>
                    <Button onClick={handleBackToCreate}>
                      <MessageSquarePlus className="h-4 w-4 ml-2" />
                      ثبت اولین بازخورد
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myFeedbacks.map((feedback) => (
                      <div
                        key={feedback._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleViewFeedbackDetail(feedback)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {feedback.type === 'bug' ? (
                              <Bug className="h-5 w-5 text-red-600" />
                            ) : (
                              <Lightbulb className="h-5 w-5 text-yellow-600" />
                            )}
                            <h3 className="font-bold text-gray-900">{feedback.title}</h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge className={getStatusColor(feedback.status)}>
                            {getStatusLabel(feedback.status)}
                          </Badge>
                          <Badge className={getPriorityColor(feedback.priority)}>
                            {getPriorityLabel(feedback.priority)}
                          </Badge>
                        </div>

                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {feedback.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(feedback.createdAt).toLocaleDateString('fa-IR')}
                            </span>
                            {feedback.comments && feedback.comments.length > 0 && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <MessageCircle className="h-3 w-3" />
                                {feedback.comments.length} نظر
                              </span>
                            )}
                          </div>
                          <span className="text-blue-600 hover:text-blue-700">
                            مشاهده جزئیات ←
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : viewMode === 'detail' && selectedFeedback ? (
            // Feedback Detail View
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4 ml-2" />
                    بازگشت
                  </Button>
                </div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  {selectedFeedback.type === 'bug' ? (
                    <Bug className="h-6 w-6 text-red-600" />
                  ) : (
                    <Lightbulb className="h-6 w-6 text-yellow-600" />
                  )}
                  {selectedFeedback.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(selectedFeedback.status)}>
                    {getStatusLabel(selectedFeedback.status)}
                  </Badge>
                  <Badge className={getPriorityColor(selectedFeedback.priority)}>
                    {getPriorityLabel(selectedFeedback.priority)}
                  </Badge>
                  <Badge variant="outline">
                    {selectedFeedback.type === 'bug' ? 'مشکل' : 'پیشنهاد'}
                  </Badge>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">توضیحات:</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedFeedback.description}
                  </p>
                </div>

                {/* Submission Info */}
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      ارسال شده در {new Date(selectedFeedback.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                {/* All Comments (Admin and User) */}
                {selectedFeedback.comments && selectedFeedback.comments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-indigo-600" />
                      گفتگو
                    </h4>
                    <div className="space-y-3">
                      {/* Sort comments chronologically */}
                      {[...selectedFeedback.comments]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((comment, idx) => (
                          <div 
                            key={idx} 
                            className={
                              comment.isAdminComment
                                ? "bg-blue-50 border border-blue-200 rounded-lg p-4"
                                : "bg-green-50 border border-green-200 rounded-lg p-4"
                            }
                          >
                            <div className="flex justify-between items-start mb-2">
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
                                {new Date(comment.createdAt).toLocaleDateString('fa-IR')} 
                                {' '}
                                {new Date(comment.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add Comment Form */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">افزودن نظر</h4>
                  <div className="space-y-3">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="نظر یا سوال خود را بنویسید..."
                      rows={4}
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {newComment.length}/1000
                      </span>
                      <Button
                        onClick={handleAddComment}
                        disabled={submittingComment || !newComment.trim()}
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                            در حال ارسال...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 ml-2" />
                            ارسال نظر
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Create New Feedback View
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquarePlus className="h-6 w-6 text-blue-600" />
                    گزارش مشکل یا پیشنهاد
                  </DialogTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewMyFeedbacks}
                  >
                    <List className="h-4 w-4 ml-2" />
                    بازخوردهای من
                  </Button>
                </div>
                <DialogDescription>
                  نظرات و پیشنهادات شما به ما در بهبود سیستم کمک می‌کند
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Type Selection */}
                <div className="space-y-2">
                  <Label>نوع بازخورد</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType("bug")}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        type === "bug"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-red-300"
                      }`}
                    >
                      <Bug className={`h-8 w-8 mx-auto mb-2 ${
                        type === "bug" ? "text-red-600" : "text-gray-400"
                      }`} />
                      <div className="text-center">
                        <div className="font-bold">گزارش مشکل</div>
                        <div className="text-xs text-gray-500 mt-1">
                          باگ یا خطا در سیستم
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setType("suggestion")}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        type === "suggestion"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-green-300"
                      }`}
                    >
                      <Lightbulb className={`h-8 w-8 mx-auto mb-2 ${
                        type === "suggestion" ? "text-green-600" : "text-gray-400"
                      }`} />
                      <div className="text-center">
                        <div className="font-bold">پیشنهاد بهبود</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ایده برای بهتر شدن
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority">اولویت</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">کم - می‌تواند منتظر بماند</SelectItem>
                      <SelectItem value="medium">متوسط - در اولویت عادی</SelectItem>
                      <SelectItem value="high">بالا - نیاز به توجه فوری</SelectItem>
                      <SelectItem value="critical">بحرانی - مشکل جدی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    عنوان <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      type === "bug"
                        ? "مثال: خطا در ذخیره نمرات"
                        : "مثال: افزودن قابلیت صدور کارنامه"
                    }
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 text-left">
                    {title.length}/100
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    توضیحات کامل <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      type === "bug"
                        ? "لطفاً مشکل را با جزئیات شرح دهید:\n- چه کاری انجام دادید؟\n- چه اتفاقی افتاد؟\n- چه انتظاری داشتید؟"
                        : "پیشنهاد خود را با جزئیات توضیح دهید و بگویید چگونه می‌تواند به بهبود سیستم کمک کند"
                    }
                    rows={6}
                    maxLength={2000}
                  />
                  <div className="text-xs text-gray-500 text-left">
                    {description.length}/2000
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    شماره تماس (اختیاری)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    maxLength={11}
                    dir="ltr"
                    className="text-left"
                  />
                  <div className="text-xs text-gray-500">
                    در صورت نیاز به پیگیری، با شما تماس خواهیم گرفت
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="images">تصاویر (اختیاری)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <label
                        htmlFor="images"
                        className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                      >
                        انتخاب تصاویر
                      </label>
                      <input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        حداکثر 5 تصویر، هر کدام حداکثر 5 مگابایت
                      </p>
                    </div>
                  </div>

                  {/* Preview uploaded images */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group border rounded-lg overflow-hidden"
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity  "
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate">
                            {image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Info Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium mb-2">اطلاعات ارسال‌کننده:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">نام:</span>{" "}
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">نوع کاربر:</span>{" "}
                        <Badge variant="outline">
                          {user.userType === "school" ? "مدیر مدرسه" : "معلم"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">کد مدرسه:</span>{" "}
                        <span className="font-medium">{user.schoolCode}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">دامنه:</span>{" "}
                        <span className="font-medium text-xs">
                          {typeof window !== 'undefined' ? window.location.host : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      در حال ارسال...
                    </>
                  ) : (
                    <>
                      {type === "bug" ? (
                        <Bug className="h-4 w-4 ml-2" />
                      ) : (
                        <Lightbulb className="h-4 w-4 ml-2" />
                      )}
                      ارسال بازخورد
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

