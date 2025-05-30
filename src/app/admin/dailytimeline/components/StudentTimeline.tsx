"use client";

import { useState, useEffect } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import {
  Clock,
  AlertTriangle,
  Check,
  X,
  Calendar,
  User,
  BookOpen,
  PenTool,
  Award,
  FileText,
  MessageCircle,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Type definitions
interface User {
  id: string;
  userType: string;
  schoolCode: string;
  username: string;
  name?: string;
}

interface EnrichedData {
  courseName: string;
  className: string;
  teacherName: string;
}

interface ClasssheetEntry {
  _id: string;
  schoolCode: string;
  studentCode: string;
  courseCode: string;
  classCode: string;
  teacherCode: string;
  timeSlot: string;
  presenceStatus: "present" | "absent" | "late" | null;
  note: string;
  date: string;
  persianDate: string;
  persianMonth: string;
  grades: {
    value: string;
    description: string;
    totalPoints: string;
  }[];
  assessments: {
    title: string;
    value: string;
    weight: number;
  }[];
  descriptiveStatus?: string;
  _enriched?: EnrichedData;
}

interface PaginationInfo {
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}

interface ApiResponse {
  entries: ClasssheetEntry[];
  pagination: PaginationInfo;
}

interface TimelineProps {
  user: User;
}

// Determine event type based on classsheet entry content
const getEventType = (
  entry: ClasssheetEntry
): "presence" | "grade" | "assessment" | "note" => {
  if (entry.grades && entry.grades.length > 0) {
    return "grade";
  } else if (entry.assessments && entry.assessments.length > 0) {
    return "assessment";
  } else if (entry.note && entry.note.trim().length > 0) {
    return "note";
  } else {
    return "presence";
  }
};

// Generate a title for the event based on its type and content
const getEventTitle = (entry: ClasssheetEntry, eventType: string): string => {
  const courseName = entry._enriched?.courseName || `درس ${entry.courseCode}`;

  switch (eventType) {
    case "grade":
      return `نمره در ${courseName}`;
    case "assessment":
      return `ارزیابی در ${courseName}`;
    case "note":
      return `یادداشت در ${courseName}`;
    case "presence":
      return entry.presenceStatus === "present"
        ? `حضور در کلاس ${courseName}`
        : entry.presenceStatus === "absent"
        ? `غیبت در کلاس ${courseName}`
        : `تأخیر در کلاس ${courseName}`;
    default:
      return `رویداد در ${courseName}`;
  }
};

export default function StudentTimeline({ user }: TimelineProps) {
  const [classheetEntries, setClasssheetEntries] = useState<ClasssheetEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false,
  });

  const fetchTimelineData = async (skip = 0, append = false) => {
    try {
      setLoadingMore(append);
      if (!append) setLoading(true);

      // Determine if we're fetching for a specific student or all students
      const studentCode =
        user.userType === "student" ? user.username : undefined;

      // Build the API endpoint with pagination parameters
      let endpoint = `/api/dailytimeline?schoolCode=${user.schoolCode}&limit=${pagination.limit}&skip=${skip}`;
      if (studentCode) {
        endpoint += `&studentCode=${studentCode}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = (await response.json()) as ApiResponse;

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error("Invalid data format received from server");
      }

      // Update the entries and pagination info
      if (append) {
        setClasssheetEntries((prev) => [...prev, ...data.entries]);
      } else {
        setClasssheetEntries(data.entries);
      }

      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching timeline data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load timeline data"
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial data load
  useEffect(() => {
    // Only proceed if user is of type 'student', 'teacher', or 'school'
    if (
      user.userType !== "student" &&
      user.userType !== "teacher" &&
      user.userType !== "school"
    ) {
      setError(
        "این صفحه فقط برای دانش آموزان، معلمان و مدیران مدرسه قابل دسترسی است."
      );
      setLoading(false);
      return;
    }

    fetchTimelineData(0, false);
  }, [user]);

  // Handle loading more entries
  const handleLoadMore = () => {
    if (!loadingMore && pagination.hasMore) {
      const newSkip = pagination.skip + pagination.limit;
      fetchTimelineData(newSkip, true);
    }
  };

  // Helper to get icon based on event type and presence status
  const getEventIcon = (entry: ClasssheetEntry, eventType: string) => {
    if (eventType === "grade") {
      return <Award className="w-6 h-6" />;
    } else if (eventType === "assessment") {
      return <PenTool className="w-6 h-6" />;
    } else if (eventType === "note") {
      return <MessageCircle className="w-6 h-6" />;
    } else {
      switch (entry.presenceStatus) {
        case "present":
          return <Check className="w-6 h-6" />;
        case "absent":
          return <X className="w-6 h-6" />;
        case "late":
          return <Clock className="w-6 h-6" />;
        default:
          return <Calendar className="w-6 h-6" />;
      }
    }
  };

  // Helper to get color based on event type and presence status
  const getEventColor = (entry: ClasssheetEntry, eventType: string) => {
    if (eventType === "grade") {
      return "#8e44ad"; // Purple
    } else if (eventType === "assessment") {
      return "#3498db"; // Blue
    } else if (eventType === "note") {
      return "#2980b9"; // Dark Blue
    } else {
      switch (entry.presenceStatus) {
        case "present":
          return "#4caf50"; // Green
        case "absent":
          return "#f44336"; // Red
        case "late":
          return "#ff9800"; // Orange
        default:
          return "#2196f3"; // Blue
      }
    }
  };

  // Helper to get style based on event type
  const getEventStyle = (entry: ClasssheetEntry, eventType: string) => {
    const baseStyle = {
      background: "#f9f9f9",
      color: "#333",
    };

    if (eventType === "grade") {
      return {
        ...baseStyle,
        borderTop: `3px solid ${getEventColor(entry, eventType)}`,
        borderRight: `1px solid ${getEventColor(entry, eventType)}`,
        borderLeft: `1px solid ${getEventColor(entry, eventType)}`,
        borderRadius: "8px",
      };
    } else if (eventType === "assessment") {
      return {
        ...baseStyle,
        borderTop: `3px solid ${getEventColor(entry, eventType)}`,
        borderBottom: `3px solid ${getEventColor(entry, eventType)}`,
        borderRadius: "8px",
      };
    } else if (eventType === "note") {
      return {
        ...baseStyle,
        borderRight: `3px solid ${getEventColor(entry, eventType)}`,
        borderRadius: "8px",
      };
    } else {
      return {
        ...baseStyle,
        borderTop: `3px solid ${getEventColor(entry, eventType)}`,
        borderRadius: "8px",
      };
    }
  };

  // Helper to get text based on presence status
  const getStatusText = (status: string | null) => {
    switch (status) {
      case "present":
        return "حاضر";
      case "absent":
        return "غایب";
      case "late":
        return "تأخیر";
      default:
        return "نامشخص";
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <AlertTriangle className="inline-block mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (classheetEntries.length === 0) {
    return (
      <div className="bg-blue-50 p-4 rounded-md text-blue-800">
        <p>هیچ اطلاعاتی برای نمایش وجود ندارد.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Custom CSS to enhance the timeline layout */}
      <style jsx global>{`
        .vertical-timeline-element-content {
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.24);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .vertical-timeline-element-content:hover {
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16),
            0 3px 6px rgba(0, 0, 0, 0.23);
        }
        .vertical-timeline.vertical-timeline--two-columns::before {
          background: #e0e0e0;
        }
        .vertical-timeline-element-date {
          font-weight: 600;
          color: #555;
        }
        .event-title {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .grade-event {
          background-color: rgba(142, 68, 173, 0.1);
          color: #8e44ad;
        }
        .assessment-event {
          background-color: rgba(52, 152, 219, 0.1);
          color: #3498db;
        }
        .note-event {
          background-color: rgba(41, 128, 185, 0.1);
          color: #2980b9;
        }
        .presence-event.present {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4caf50;
        }
        .presence-event.absent {
          background-color: rgba(244, 67, 54, 0.1);
          color: #f44336;
        }
        .presence-event.late {
          background-color: rgba(255, 152, 0, 0.1);
          color: #ff9800;
        }
      `}</style>

      {/* Timeline pagination summary */}
      <div className="mb-6 text-sm text-gray-600 flex items-center justify-between">
        <span>
          نمایش {Math.min(pagination.skip + 1, pagination.total)} تا{" "}
          {Math.min(
            pagination.skip + classheetEntries.length,
            pagination.total
          )}{" "}
          از {pagination.total} مورد
        </span>
        {pagination.total > 0 && (
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            دوره زمانی:{" "}
            {classheetEntries[classheetEntries.length - 1]?.persianDate} تا{" "}
            {classheetEntries[0]?.persianDate}
          </span>
        )}
      </div>

      <VerticalTimeline layout="2-columns">
        {classheetEntries.map((entry, index) => {
          // Calculate position based on entry index for alternating sides
          const position = index % 2 === 0 ? "left" : "right";

          // Determine event type for styling
          const eventType = getEventType(entry);

          // Generate event title
          const eventTitle = getEventTitle(entry, eventType);

          // Determine event classes for styling
          let eventClass = "event-title ";
          if (eventType === "presence") {
            eventClass += `presence-event ${entry.presenceStatus || "unknown"}`;
          } else {
            eventClass += `${eventType}-event`;
          }

          // Get enriched data
          const courseName =
            entry._enriched?.courseName || `درس ${entry.courseCode}`;
          const className =
            entry._enriched?.className || `کلاس ${entry.classCode}`;
          const teacherName =
            entry._enriched?.teacherName || `استاد ${entry.teacherCode}`;

          return (
            <VerticalTimelineElement
              key={entry._id}
              className="vertical-timeline-element"
              position={position}
              contentStyle={getEventStyle(entry, eventType)}
              contentArrowStyle={{
                borderRight: position === "left" ? `7px solid #f9f9f9` : "none",
                borderLeft: position === "right" ? `7px solid #f9f9f9` : "none",
              }}
              date={entry.persianDate + ` - زنگ ${entry.timeSlot}`}
              iconStyle={{
                background: getEventColor(entry, eventType),
                color: "#fff",
              }}
              icon={getEventIcon(entry, eventType)}
            >
              <div className="flex flex-col">
                <div className={eventClass}>{eventTitle}</div>

                <div className="mb-4 pb-2 border-b">
                  <div className="flex items-center mb-2">
                    <BookOpen className="w-5 h-5 ml-2 text-indigo-600" />
                    <h3 className="text-xl font-bold">{courseName}</h3>
                  </div>

                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 ml-2 text-indigo-600" />
                    <h4 className="text-md font-medium text-gray-700">
                      {teacherName}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{className}</span>
                    {eventType === "presence" && (
                      <span
                        className="px-2 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${getEventColor(
                            entry,
                            eventType
                          )}25`,
                          color: getEventColor(entry, eventType),
                        }}
                      >
                        {getStatusText(entry.presenceStatus)}
                      </span>
                    )}
                  </div>
                </div>

                {entry.note && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md">
                    <p className="font-semibold flex items-center">
                      <MessageCircle className="w-4 h-4 ml-1" />
                      یادداشت:
                    </p>
                    <p className="text-gray-700">{entry.note}</p>
                  </div>
                )}

                {entry.grades && entry.grades.length > 0 && (
                  <div className="mb-3 p-3 bg-purple-50 rounded-md">
                    <p className="font-semibold flex items-center">
                      <Award className="w-4 h-4 ml-1" />
                      نمرات:
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      {entry.grades.map((grade, idx) => (
                        <li key={idx} className="text-gray-700">
                          {grade.description}:
                          <span className="font-bold text-purple-700 mx-1">
                            {grade.value}
                          </span>
                          از {grade.totalPoints}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.assessments && entry.assessments.length > 0 && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-md">
                    <p className="font-semibold flex items-center">
                      <PenTool className="w-4 h-4 ml-1" />
                      ارزیابی‌ها:
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      {entry.assessments.map((assessment, idx) => (
                        <li key={idx} className="text-gray-700">
                          {assessment.title}:
                          <span className="font-bold text-blue-700 mx-1">
                            {assessment.value}
                          </span>
                          {assessment.weight !== 0 && (
                            <span
                              className={
                                assessment.weight > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {" "}
                              ({assessment.weight > 0 ? "+" : ""}
                              {assessment.weight})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.descriptiveStatus && (
                  <div className="p-3 bg-green-50 rounded-md">
                    <p className="font-semibold flex items-center">
                      <FileText className="w-4 h-4 ml-1" />
                      وضعیت توصیفی:
                    </p>
                    <p className="text-gray-700 mt-1">
                      {entry.descriptiveStatus}
                    </p>
                  </div>
                )}
              </div>
            </VerticalTimelineElement>
          );
        })}
      </VerticalTimeline>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            variant="outline"
            className="px-6 py-2 text-indigo-600 border-indigo-300 hover:bg-indigo-50 transition"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                در حال بارگذاری...
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                نمایش موارد بیشتر
              </>
            )}
          </Button>
        </div>
      )}

      {/* Total count indicator */}
      {pagination.skip + classheetEntries.length === pagination.total &&
        pagination.total > pagination.limit && (
          <div className="text-center text-gray-500 mt-4 text-sm">
            تمام {pagination.total} مورد نمایش داده شده است
          </div>
        )}
    </div>
  );
}
