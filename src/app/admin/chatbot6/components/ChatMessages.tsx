import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns-jalali";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex items-start gap-3 px-2 py-2 rounded-lg",
            message.role === "user" ? "flex-row-reverse bg-muted/50" : "bg-card"
          )}
        >
          <Avatar
            className={cn(
              "h-8 w-8 shrink-0",
              message.role === "user" ? "bg-primary" : "bg-secondary"
            )}
          >
            <AvatarFallback>
              {message.role === "user" ? "کا" : "ای"}
            </AvatarFallback>
            {message.role === "assistant" && (
              <AvatarImage src="/ai-avatar.png" alt="AI" />
            )}
          </Avatar>
          <div
            className={cn(
              "flex flex-col",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className="text-sm font-medium">
              {message.role === "user" ? "کاربر" : "دستیار هوشمند"}
            </div>
            <div className="mt-1 break-words text-right">{message.content}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {format(new Date(message.timestamp), "HH:mm - yyyy/MM/dd")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
