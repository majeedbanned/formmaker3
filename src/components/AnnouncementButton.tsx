"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnnouncementModal from "./AnnouncementModal";

interface Announcement {
  id: string;
  version: number;
  title: string;
  body: string;
  imageUrl?: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

interface AnnouncementButtonProps {
  variant?: "inline" | "floating";
}

export default function AnnouncementButton({ variant = "inline" }: AnnouncementButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  React.useEffect(() => {
    // Fetch unread count on mount
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/announcements");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.announcements?.length || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleOpenAnnouncements = async () => {
    setIsLoading(true);
    try {
      console.log("📢 [AnnouncementButton] Fetching all announcements...");
      const response = await fetch("/api/announcements/all");
      
      if (response.ok) {
        const data = await response.json();
        console.log("📢 [AnnouncementButton] Received announcements:", data.announcements?.length);
        
        if (data.announcements && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
          setShowModal(true);
          // Reset unread count since user is viewing them
          setUnreadCount(0);
        } else {
          alert("هیچ اطلاعیه‌ای موجود نیست");
        }
      } else {
        console.error("Error fetching announcements:", response.status);
        alert("خطا در دریافت اطلاعیه‌ها");
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      alert("خطا در دریافت اطلاعیه‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (announcementIds: string[]) => {
    try {
      const response = await fetch("/api/announcements/dismiss", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ announcementIds }),
      });

      if (response.ok) {
        console.log("Announcements dismissed successfully");
        // Update unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error("Error dismissing announcements:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (variant === "floating") {
    return (
      <>
        <button
          onClick={handleOpenAnnouncements}
          disabled={isLoading}
          className="fixed bottom-24 left-6 z-40 bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50"
          title="مشاهده اطلاعیه‌ها"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        
        {showModal && announcements.length > 0 && (
          <AnnouncementModal
            announcements={announcements}
            onClose={handleClose}
            onDismiss={handleDismiss}
          />
        )}
      </>
    );
  }

  // Inline variant
  return (
    <>
      <Button
        onClick={handleOpenAnnouncements}
        disabled={isLoading}
        variant="ghost"
        size="sm"
        className="relative gap-2 hover:bg-purple-50 text-gray-700 hover:text-purple-600"
      >
        <Bell className="h-4 w-4" />
        <span>اطلاعیه‌ها</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
      
      {showModal && announcements.length > 0 && (
        <AnnouncementModal
          announcements={announcements}
          onClose={handleClose}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}

