"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { VideoIcon, ExternalLink, Loader2, Clock, Calendar, Users, PlayCircle, Radio, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface SkyroomClass {
  _id: string;
  className: string;
  classDescription?: string;
  maxUsers: number;
  classType?: "skyroom" | "googlemeet" | "adobeconnect" | "bigbluebutton";
  skyroomRoomId?: number;
  googleMeetLink?: string;
  adobeConnectUrl?: string;
  adobeConnectScoId?: string;
  bbbMeetingID?: string;
  bbbMeetingName?: string;
  scheduleSlots?: ScheduleSlot[];
  nextDate: string;      // ISO string of next occurrence
  nextWeekday: string;   // sat/sun/...
  nextStartTime: string; // HH:MM
  nextEndTime: string;   // HH:MM
  duration: number;      // minutes
}

interface ClassStats {
  classType: string;
  meetingName: string;
  isActive: boolean | null;
  currentUsers: number | null;
  moderatorCount?: number;
  totalRecordings?: number;
  dateBegin?: string;
  dateEnd?: string;
  dateCreated?: string;
  dateModified?: string;
  urlPath?: string;
  attendees: Array<{ name: string; login?: string; role?: string; dateJoined?: string }>;
  recordings: Array<{
    id: string;
    name: string;
    duration?: number;
    dateCreated?: string;
    playbackUrl: string;
    thumbnailUrl?: string;
  }>;
  error?: string;
}

export default function MySkyroomClassPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [classes, setClasses] = useState<SkyroomClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [classStats, setClassStats] = useState<Record<string, ClassStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [statsDialogOpen, setStatsDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    if (user && (user.userType === "student" || user.userType === "teacher" || user.userType === "school")) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/skyroom/myclasses", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      } else {
        const error = await response.json();
        toast.error(error.error || "خطا در دریافت کلاس‌ها");
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast.error("خطا در دریافت کلاس‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async (classId: string) => {
    setGeneratingLink(classId);
    try {
      const response = await fetch("/api/admin/skyroom/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          classId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // School users and teachers: open in new tab
        // Students: open in same window
        if (user?.userType === "school" || user?.userType === "teacher") {
          window.open(data.joinUrl, "_blank");
          toast.success("در حال انتقال به کلاس...");
        } else {
          // Student: redirect in same window
          window.location.href = data.joinUrl;
        }
      } else {
        toast.error(data.error || "خطا در ایجاد لینک ورود");
      }
    } catch (error: any) {
      console.error("Error joining class:", error);
      toast.error("خطا در ایجاد لینک ورود: " + (error.message || "خطای ناشناخته"));
    } finally {
      setGeneratingLink(null);
    }
  };

  const fetchClassStats = useCallback(async (classId: string) => {
    setLoadingStats((prev) => ({ ...prev, [classId]: true }));
    try {
      const response = await fetch(`/api/admin/skyroom/stats?classId=${classId}`, {
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setClassStats((prev) => ({ ...prev, [classId]: data.stats }));
        }
      }
    } catch (error) {
      console.error("Error fetching class stats:", error);
    } finally {
      setLoadingStats((prev) => ({ ...prev, [classId]: false }));
    }
  }, []);

  // Fetch stats for Adobe Connect and BigBlueButton classes on mount
  useEffect(() => {
    if (classes.length > 0) {
      classes.forEach((cls) => {
        if (cls.classType === "adobeconnect" || cls.classType === "bigbluebutton") {
          fetchClassStats(cls._id);
        }
      });
    }
  }, [classes, fetchClassStats]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":");
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const getClassStatusForSlot = (
    classItem: SkyroomClass,
    slotDay: string,
    slotStartTime: string,
    slotEndTime: string
  ) => {
    const now = new Date();
    const classDate = new Date(); // today, we'll use today's date with slot time
    const [hours, minutes] = slotStartTime.split(":").map(Number);
    const classDateTime = new Date(classDate);
    classDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    const endTime = new Date(classDateTime);
    const [eh, em] = slotEndTime.split(":").map(Number);
    if (!Number.isNaN(eh) && !Number.isNaN(em)) {
      endTime.setHours(eh || 0, em || 0, 0, 0);
    } else {
      endTime.setMinutes(endTime.getMinutes() + (classItem.duration || 60));
    }

    if (now < classDateTime) {
      // Class hasn't started yet
      const minutesUntilStart = Math.floor(
        (classDateTime.getTime() - now.getTime()) / 1000 / 60
      );
      if (minutesUntilStart <= 15) {
        return { status: "starting", text: "شروع به زودی", color: "bg-yellow-100 text-yellow-800" };
      }
      return { status: "upcoming", text: "آینده", color: "bg-blue-100 text-blue-800" };
    } else if (now >= classDateTime && now <= endTime) {
      // Class is in progress
      return { status: "active", text: "در حال برگزاری", color: "bg-green-100 text-green-800" };
    } else {
      // Class has ended
      return { status: "ended", text: "پایان یافته", color: "bg-gray-100 text-gray-800" };
    }
  };

  const canJoinClassForSlot = (
    classItem: SkyroomClass,
    slotDay: string,
    slotStartTime: string,
    slotEndTime: string
  ) => {
    // School admin can always enter classes
    if (user?.userType === "school") return true;

    const now = new Date();
    const classDate = new Date(); // today
    const [hours, minutes] = slotStartTime.split(":").map(Number);
    const classDateTime = new Date(classDate);
    classDateTime.setHours(hours || 0, minutes || 0, 0, 0);

    const endTime = new Date(classDateTime);
    const [eh, em] = slotEndTime.split(":").map(Number);
    if (!Number.isNaN(eh) && !Number.isNaN(em)) {
      endTime.setHours(eh || 0, em || 0, 0, 0);
    } else {
      endTime.setMinutes(endTime.getMinutes() + (classItem.duration || 60));
    }

    // Only allow join on the correct weekday
    const todayIdx = now.getDay(); // 0-6
    const codeMap: Record<number, string> = {
      0: "sun",
      1: "mon",
      2: "tue",
      3: "wed",
      4: "thu",
      5: "fri",
      6: "sat",
    };
    const todayCode = codeMap[todayIdx];
    if (slotDay.toLowerCase() !== todayCode) return false;

    // Can join 15 minutes before start time or during the class
    const joinStartTime = new Date(classDateTime);
    joinStartTime.setMinutes(joinStartTime.getMinutes() - 15);

    return now >= joinStartTime && now <= endTime;
  };

  if (authLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div dir="rtl" className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">لطفاً وارد شوید.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group class slots by weekday for weekly schedule view
  const weekdayOrder: { code: string; label: string }[] = [
    { code: "sat", label: "شنبه" },
    { code: "sun", label: "یکشنبه" },
    { code: "mon", label: "دوشنبه" },
    { code: "tue", label: "سه‌شنبه" },
    { code: "wed", label: "چهارشنبه" },
    { code: "thu", label: "پنج‌شنبه" },
    { code: "fri", label: "جمعه" },
  ];

  type DaySlot = {
    classItem: SkyroomClass;
    day: string;
    startTime: string;
    endTime: string;
  };

  const slotsByDay: Record<string, DaySlot[]> = classes.reduce(
    (acc, cls) => {
      const slots = Array.isArray(cls.scheduleSlots) && cls.scheduleSlots.length
        ? cls.scheduleSlots
        : [
            {
              day: cls.nextWeekday || "",
              startTime: cls.nextStartTime,
              endTime: cls.nextEndTime,
            },
          ];

      for (const s of slots) {
        const code = (s.day || "").toLowerCase();
        if (!code) continue;
        if (!acc[code]) acc[code] = [];
        acc[code].push({
          classItem: cls,
          day: code,
          startTime: s.startTime,
          endTime: s.endTime,
        });
      }

      return acc;
    },
    {} as Record<string, DaySlot[]>
  );

  return (
    <div dir="rtl" className="container mx-auto px-4 py-8">
      <PageHeader
        title={
          user.userType === "school"
            ? "کلاس‌های آنلاین مدرسه"
            : "کلاس‌های آنلاین من"
        }
        subtitle={
          user.userType === "school"
            ? "مشاهده و ورود به تمام کلاس‌های آنلاین این مدرسه (اسکای‌روم، گوگل میت، ادوبی کانکت و بیگ بلو باتن)"
            : "مشاهده و ورود به کلاس‌های آنلاین (اسکای‌روم، گوگل میت، ادوبی کانکت و بیگ بلو باتن)"
        }
        icon={<VideoIcon className="w-6 h-6" />}
        gradient={true}
      />

      {/* Weekly schedule */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>برنامه هفتگی کلاس‌ها</CardTitle>
          <CardDescription>
            نمایش کلاس‌های اسکای‌روم بر اساس روزهای هفته
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12">
              <VideoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">کلاسی برای نمایش وجود ندارد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {weekdayOrder.map(({ code, label }) => {
                const daySlots = (slotsByDay[code] || []).sort((a, b) => {
                  // sort by start time within the day
                  return a.startTime.localeCompare(b.startTime);
                });

                return (
                  <div key={code} className="space-y-2">
                    <div className="flex items-center justify-between border-b pb-1 mb-1">
                      <span className="font-semibold text-sm">{label}</span>
                      <span className="text-[11px] text-gray-400">
                        {daySlots.length} کلاس
                      </span>
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-xs text-gray-400 mt-2">
                        کلاسی در این روز ندارید
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map(({ classItem, day, startTime, endTime }) => {
                          const status = getClassStatusForSlot(
                            classItem,
                            day,
                            startTime,
                            endTime
                          );
                          const canJoin = canJoinClassForSlot(
                            classItem,
                            day,
                            startTime,
                            endTime
                          );

                          return (
                            <div
                              key={classItem._id}
                              className="border rounded-md p-2 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-[13px]">
                                    {classItem.className}
                                  </span>
                                  {classItem.classType === "googlemeet" && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-50 text-green-700 border-green-200">
                                      Google Meet
                                    </Badge>
                                  )}
                                  {classItem.classType === "adobeconnect" && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-50 text-red-700 border-red-200">
                                      Adobe Connect
                                    </Badge>
                                  )}
                                  {classItem.classType === "bigbluebutton" && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-50 text-purple-700 border-purple-200">
                                      BigBlueButton
                                    </Badge>
                                  )}
                                  {(!classItem.classType || classItem.classType === "skyroom") && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                      Skyroom
                                    </Badge>
                                  )}
                                </div>
                                <Badge className={status.color}>
                                  {status.text}
                                </Badge>
                              </div>

                              {classItem.classDescription && (
                                <p className="text-[11px] text-gray-600 line-clamp-2">
                                  {classItem.classDescription}
                                </p>
                              )}

                              <div className="mt-1 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-[11px] text-gray-600">
                                    {formatDate(classItem.nextDate)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-[11px] text-gray-600">
                                    {formatTime(startTime)} تا{" "}
                                    {formatTime(endTime)} -{" "}
                                    {classItem.duration} دقیقه
                                  </span>
                                </div>
                              </div>

                              {/* Stats for Adobe Connect and BigBlueButton */}
                              {(classItem.classType === "adobeconnect" || classItem.classType === "bigbluebutton") && (
                                <div className="mt-1 pt-1 border-t border-gray-100">
                                  {loadingStats[classItem._id] ? (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      در حال دریافت وضعیت...
                                    </div>
                                  ) : classStats[classItem._id] ? (
                                    <div className="space-y-1">
                                      {/* Live status and controls */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {classStats[classItem._id].isActive ? (
                                          <Badge className="text-[9px] px-1 py-0 bg-green-500 text-white animate-pulse">
                                            <Radio className="w-2 h-2 mr-1" />
                                            آنلاین
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[9px] px-1 py-0 text-gray-500">
                                            آفلاین
                                          </Badge>
                                        )}
                                        {classStats[classItem._id].currentUsers !== null && classStats[classItem._id].currentUsers! > 0 && (
                                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {classStats[classItem._id].currentUsers} نفر آنلاین
                                          </span>
                                        )}
                                        {classStats[classItem._id].totalRecordings !== undefined && classStats[classItem._id].totalRecordings! > 0 && (
                                          <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                            <PlayCircle className="w-3 h-3" />
                                            {classStats[classItem._id].totalRecordings} ضبط
                                          </span>
                                        )}
                                        <button
                                          onClick={() => fetchClassStats(classItem._id)}
                                          className="text-gray-400 hover:text-gray-600"
                                          title="بروزرسانی"
                                        >
                                          <RefreshCw className="w-3 h-3" />
                                        </button>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button
                                              className="text-gray-400 hover:text-gray-600"
                                              title="اطلاعات تفصیلی"
                                            >
                                              <Info className="w-3 h-3" />
                                            </button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-lg" dir="rtl">
                                            <DialogHeader>
                                              <DialogTitle>اطلاعات کلاس {classStats[classItem._id].meetingName || classItem.className}</DialogTitle>
                                              <DialogDescription>
                                                جزئیات و آمار کلاس
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                              {/* Status */}
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <p className="text-xs text-gray-500 mb-1">وضعیت</p>
                                                  <Badge className={classStats[classItem._id].isActive ? "bg-green-500" : "bg-gray-500"}>
                                                    {classStats[classItem._id].isActive ? "آنلاین" : "آفلاین"}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <p className="text-xs text-gray-500 mb-1">کاربران آنلاین</p>
                                                  <p className="text-sm font-medium">{classStats[classItem._id].currentUsers || 0} نفر</p>
                                                </div>
                                              </div>

                                              {/* Dates */}
                                              {(classStats[classItem._id].dateBegin || classStats[classItem._id].dateEnd || classStats[classItem._id].dateCreated) && (
                                                <div className="space-y-2">
                                                  <p className="text-xs font-semibold text-gray-700">تاریخ‌ها</p>
                                                  {classStats[classItem._id].dateBegin && (
                                                    <div className="flex justify-between text-xs">
                                                      <span className="text-gray-500">شروع:</span>
                                                      <span>{new Date(classStats[classItem._id].dateBegin!).toLocaleString("fa-IR")}</span>
                                                    </div>
                                                  )}
                                                  {classStats[classItem._id].dateEnd && (
                                                    <div className="flex justify-between text-xs">
                                                      <span className="text-gray-500">پایان:</span>
                                                      <span>{new Date(classStats[classItem._id].dateEnd!).toLocaleString("fa-IR")}</span>
                                                    </div>
                                                  )}
                                                  {classStats[classItem._id].dateCreated && (
                                                    <div className="flex justify-between text-xs">
                                                      <span className="text-gray-500">ایجاد شده:</span>
                                                      <span>{new Date(classStats[classItem._id].dateCreated!).toLocaleDateString("fa-IR")}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              )}

                                              {/* Attendees */}
                                              {classStats[classItem._id].attendees.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                                    شرکت‌کنندگان ({classStats[classItem._id].attendees.length})
                                                  </p>
                                                  <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {classStats[classItem._id].attendees.map((attendee, idx) => (
                                                      <div key={idx} className="flex justify-between items-center text-xs p-1 bg-gray-50 rounded">
                                                        <span>{attendee.name}</span>
                                                        {attendee.role && (
                                                          <Badge variant="outline" className="text-[9px]">
                                                            {attendee.role === "MODERATOR" ? "مدیر" : "مشاهده‌گر"}
                                                          </Badge>
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Recordings */}
                                              {classStats[classItem._id].recordings.length > 0 && (
                                                <div>
                                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                                    ضبط‌ها ({classStats[classItem._id].recordings.length})
                                                  </p>
                                                  <div className="space-y-2">
                                                    {classStats[classItem._id].recordings.map((rec) => (
                                                      <div
                                                        key={rec.id}
                                                        className="flex items-center justify-between p-2 border rounded-md"
                                                      >
                                                        <div className="flex-1">
                                                          <p className="text-sm font-medium">{rec.name}</p>
                                                          <div className="flex gap-3 mt-1">
                                                            {rec.duration && (
                                                              <p className="text-xs text-gray-500">
                                                                مدت: {rec.duration} دقیقه
                                                              </p>
                                                            )}
                                                            {rec.dateCreated && (
                                                              <p className="text-xs text-gray-500">
                                                                {new Date(rec.dateCreated).toLocaleDateString("fa-IR")}
                                                              </p>
                                                            )}
                                                          </div>
                                                        </div>
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => window.open(rec.playbackUrl, "_blank")}
                                                        >
                                                          <PlayCircle className="w-4 h-4 mr-1" />
                                                          پخش
                                                        </Button>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}

                                              {classStats[classItem._id].recordings.length === 0 && (
                                                <p className="text-xs text-gray-500 text-center py-4">
                                                  ضبطی موجود نیست
                                                </p>
                                              )}
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      </div>

                                      {/* Recordings quick link */}
                                      {classStats[classItem._id].recordings.length > 0 && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                              <PlayCircle className="w-3 h-3" />
                                              {classStats[classItem._id].recordings.length} ضبط موجود
                                            </button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-md" dir="rtl">
                                            <DialogHeader>
                                              <DialogTitle>ضبط‌های کلاس {classItem.className}</DialogTitle>
                                              <DialogDescription>
                                                لیست ضبط‌های موجود برای این کلاس
                                              </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                              {classStats[classItem._id].recordings.map((rec) => (
                                                <div
                                                  key={rec.id}
                                                  className="flex items-center justify-between p-2 border rounded-md"
                                                >
                                                  <div className="flex-1">
                                                    <p className="text-sm font-medium">{rec.name}</p>
                                                    <div className="flex gap-3 mt-1">
                                                      {rec.duration && (
                                                        <p className="text-xs text-gray-500">
                                                          مدت: {rec.duration} دقیقه
                                                        </p>
                                                      )}
                                                      {rec.dateCreated && (
                                                        <p className="text-xs text-gray-500">
                                                          {new Date(rec.dateCreated).toLocaleDateString("fa-IR")}
                                                        </p>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => window.open(rec.playbackUrl, "_blank")}
                                                  >
                                                    <PlayCircle className="w-4 h-4 mr-1" />
                                                    پخش
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              <div className="mt-2 flex justify-between items-center">
                                <Button
                                  onClick={() => handleJoinClass(classItem._id)}
                                  disabled={
                                    !canJoin ||
                                    generatingLink === classItem._id
                                  }
                                  className="whitespace-nowrap h-7 px-2 text-[11px]"
                                >
                                  {generatingLink === classItem._id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      در حال ایجاد لینک...
                                    </>
                                  ) : canJoin ? (
                                    <>
                                      ورود
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                    </>
                                  ) : (
                                    "خارج از زمان کلاس"
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

