import { useState, useEffect, useCallback } from "react";

interface BirthdayMessage {
  _id: string;
  senderCode: string;
  senderName: string;
  senderType: "student" | "teacher" | "school";
  recipientCode: string;
  recipientName: string;
  recipientType: "student" | "teacher";
  message: string;
  messageType: string;
  schoolCode: string;
  isRead: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  readAt?: string;
}

export function useBirthdayMessages() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/birthday-messages/received", {
        headers: {
          "x-domain": window.location.host,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const unreadMessages = data.messages.filter((msg: BirthdayMessage) => !msg.isRead);
        setUnreadCount(unreadMessages.length);
      }
    } catch (error) {
      console.error("Error fetching birthday messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  };
} 