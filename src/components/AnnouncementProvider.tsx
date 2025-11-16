"use client";

import React, { useEffect, useState } from "react";
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

export default function AnnouncementProvider() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // console.log("📢 [AnnouncementProvider] Fetching announcements...");
      const response = await fetch("/api/announcements");
      // console.log("📢 [AnnouncementProvider] Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        // console.log("📢 [AnnouncementProvider] Data received:", data);
        
        if (data.announcements && data.announcements.length > 0) {
          // console.log("📢 [AnnouncementProvider] Found", data.announcements.length, "announcements. Showing modal...");
          setAnnouncements(data.announcements);
          setShowModal(true);
        } else {
          // console.log("📢 [AnnouncementProvider] No announcements to show");
        }
      } else {
        const errorData = await response.json();
        console.error("📢 [AnnouncementProvider] API error:", response.status, errorData);
      }
    } catch (error) {
      console.error("📢 [AnnouncementProvider] Error fetching announcements:", error);
    } finally {
      setIsLoading(false);
      // console.log("📢 [AnnouncementProvider] Loading finished");
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
        // console.log("Announcements dismissed successfully");
      }
    } catch (error) {
      console.error("Error dismissing announcements:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
  };

  if (isLoading || announcements.length === 0 || !showModal) {
    return null;
  }

  return (
    <AnnouncementModal
      announcements={announcements}
      onClose={handleClose}
      onDismiss={handleDismiss}
    />
  );
}

