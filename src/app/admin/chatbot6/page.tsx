"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, RefreshCw, RotateCw, SendHorizonal } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  debug?: DebugInfo | null;
}

interface DebugInfo {
  assistantInstructions?: string;
  mongoQuery?: unknown[];
  queryResults?: unknown[];
  rawAssistantResponse?: string;
  timings?: Record<string, number>;
}

interface ChatMessagesProps {
  messages: Message[];
  showDebug: boolean;
}

// Inline ChatMessages component
function ChatMessages({ messages, showDebug }: ChatMessagesProps) {
  return (
    <div className="flex flex-col space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex flex-col rounded-lg p-4",
            message.role === "user"
              ? "bg-blue-100 self-end ml-12 rounded-tr-none"
              : message.role === "assistant"
              ? "bg-slate-100 self-start mr-12 rounded-tl-none"
              : "bg-gray-50 self-start text-gray-500 text-sm italic"
          )}
        >
          <div
            className={cn(
              "whitespace-pre-wrap",
              message.role === "user" ? "text-right" : "text-right"
            )}
            dir="rtl"
          >
            {message.content}
          </div>
          <div className="text-xs text-gray-500 mt-2 text-left">
            {new Date(message.timestamp).toLocaleString("fa-IR")}
          </div>

          {showDebug && message.debug && message.role === "assistant" && (
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xs">
                  اطلاعات دیباگ
                </AccordionTrigger>
                <AccordionContent>
                  <ScrollArea className="h-[300px]">
                    <div className="p-2">
                      {message.debug.assistantInstructions && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">Instructions:</h4>
                          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                            {message.debug.assistantInstructions}
                          </pre>
                        </div>
                      )}
                      {message.debug.mongoQuery && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">
                            Generated MongoDB Query:
                          </h4>
                          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(message.debug.mongoQuery, null, 2)}
                          </pre>
                        </div>
                      )}

                      {message.debug.timings && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">
                            Performance Metrics:
                          </h4>
                          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto">
                            {JSON.stringify(message.debug.timings, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      ))}
    </div>
  );
}

interface Thread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

export default function Chatbot6Page() {
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setError] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isConfigUpdating, setIsConfigUpdating] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);

  // Initialize the assistant on component mount
  useEffect(() => {
    initializeAssistant();
  }, []);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [threads, activeThreadId]);

  // Initialize the OpenAI Assistant
  const initializeAssistant = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/chatbot6/assistant", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to initialize assistant");
      }

      const data = await response.json();
      setAssistantId(data.assistantId);

      // Load user threads
      loadUserThreads();

      setStatus("idle");
    } catch (err) {
      console.error("Error initializing assistant:", err);
      setError("خطا در راه اندازی دستیار هوشمند");
      setStatus("error");
    }
  };

  // Update the assistant configuration
  const updateAssistantConfig = async () => {
    try {
      setIsConfigUpdating(true);
      const response = await fetch("/api/chatbot6/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update assistant configuration");
      }

      const data = await response.json();
      setAssistantId(data.assistantId);
      setIsConfigUpdating(false);
    } catch (err) {
      console.error("Error updating assistant configuration:", err);
      setError("خطا در به روزرسانی پیکربندی دستیار");
      setIsConfigUpdating(false);
    }
  };

  // Load user threads
  const loadUserThreads = async () => {
    try {
      const response = await fetch("/api/chatbot6/threads", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user threads");
      }

      const data = await response.json();
      if (data.threads && data.threads.length > 0) {
        setThreads(data.threads);
        setActiveThreadId(data.threads[0].id);
      }
    } catch (err) {
      console.error("Error loading user threads:", err);
      setError("خطا در بارگذاری مکالمات قبلی");
    }
  };

  // Create a new thread
  const createNewThread = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/chatbot6/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `گفتگوی ${new Date().toLocaleDateString("fa-IR")}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create new thread");
      }

      const data = await response.json();

      // Create a new local thread
      const newThread: Thread = {
        id: data.threadId,
        name: data.name,
        messages: [
          {
            id: uuidv4(),
            role: "system",
            content:
              "سلام! من دستیار هوش مصنوعی پارسا موز هستم. چگونه می‌توانم به شما کمک کنم؟",
            timestamp: new Date(),
          },
        ],
        createdAt: new Date(),
      };

      setThreads((prev) => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      setStatus("idle");
    } catch (err) {
      console.error("Error creating new thread:", err);
      setError("خطا در ایجاد گفتگوی جدید");
      setStatus("error");
    }
  };

  // Handle sending a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !activeThreadId || !assistantId) return;

    // Add user message to the current thread
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Update the local state first
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThreadId
          ? { ...thread, messages: [...thread.messages, userMessage] }
          : thread
      )
    );

    setInput("");
    setStatus("loading");

    try {
      // Send message to the API
      const response = await fetch("/api/chatbot6/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: activeThreadId,
          assistantId,
          message: input,
          debug: debugMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add assistant response to the current thread
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        debug: data.debug || null,
      };

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThreadId
            ? { ...thread, messages: [...thread.messages, assistantMessage] }
            : thread
        )
      );

      setStatus("idle");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("خطا در ارسال پیام");
      setStatus("error");
    }
  };

  // Get the active thread
  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  return (
    <div
      className="container mx-auto py-8 dir-rtl"
      style={{ direction: "rtl" }}
    >
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">چت‌بات هوشمند v6</h1>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={createNewThread}
            disabled={status === "loading"}
          >
            <PlusCircle className="ml-2 h-4 w-4" />
            گفتگوی جدید
          </Button>
          <Button
            variant="outline"
            onClick={updateAssistantConfig}
            disabled={isConfigUpdating}
          >
            <RefreshCw
              className={`ml-2 h-4 w-4 ${
                isConfigUpdating ? "animate-spin" : ""
              }`}
            />
            به‌روزرسانی پیکربندی
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Thread list */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>گفتگوها</CardTitle>
            </CardHeader>
            <CardContent>
              {threads.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  هنوز گفتگویی شروع نشده است
                </p>
              ) : (
                <div className="space-y-2">
                  {threads.map((thread) => (
                    <Button
                      key={thread.id}
                      variant={
                        activeThreadId === thread.id ? "default" : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => setActiveThreadId(thread.id)}
                    >
                      {thread.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat area */}
        <div className="col-span-9">
          <Card className="h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle>
                {activeThread ? activeThread.name : "دستیار هوشمند پارسا موز"}
              </CardTitle>
              <CardDescription>
                از من دستورات MongoDB را بپرس. من به فارسی پاسخ می‌دهم.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-8rem)] overflow-y-auto pb-0">
              {activeThread ? (
                <ChatMessages
                  messages={activeThread.messages}
                  showDebug={debugMode}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-center text-muted-foreground">
                    لطفا یک گفتگو را انتخاب کنید یا گفتگوی جدیدی شروع کنید
                  </p>
                </div>
              )}
              <div ref={messageEndRef} />
            </CardContent>
            <CardFooter className="pt-4">
              <form onSubmit={sendMessage} className="w-full flex gap-2">
                <Input
                  placeholder="پیام خود را اینجا بنویسید..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={status === "loading" || !activeThreadId}
                  className="flex-1"
                />
                <div className="flex space-x-2 items-center justify-end">
                  <Button
                    type="submit"
                    className="bg-primary text-white hover:bg-primary/90"
                    disabled={!input.trim() || status === "loading"}
                  >
                    {status === "loading" ? (
                      <RotateCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <SendHorizonal className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-4 flex items-center space-x-2 justify-between border p-2 rounded">
          <Label htmlFor="debug-mode" className="text-sm">
            حالت دیباگ (ادمین)
          </Label>
          <Switch
            id="debug-mode"
            checked={debugMode}
            onCheckedChange={setDebugMode}
          />
        </div>
      </div>
    </div>
  );
}
