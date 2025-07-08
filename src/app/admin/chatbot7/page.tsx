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
  mongoQuery?: unknown;
  queryResults?: unknown;
  rawAssistantResponse?: string;
  timings?: Record<string, number>;
  tokenUsage?: {
    userMessageTokens?: number;
    assistantResponseTokens?: number;
    totalTokens?: number;
  };
}

interface Thread {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
}

// Inline ChatMessages component for RTL support
function ChatMessages({
  messages,
  showDebug,
}: {
  messages: Message[];
  showDebug: boolean;
}) {
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
          <div className="text-xs text-gray-500 mt-2 text-right" dir="rtl">
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
                          <h4 className="text-xs font-medium">
                            دستورالعمل‌ها:
                          </h4>
                          <pre
                            className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap dir-ltr"
                            dir="ltr"
                          >
                            {message.debug.assistantInstructions}
                          </pre>
                        </div>
                      )}
                      {message.debug.mongoQuery && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">
                            کوئری MongoDB تولید شده:
                          </h4>
                          <pre
                            className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap dir-ltr"
                            dir="ltr"
                          >
                            {JSON.stringify(message.debug.mongoQuery, null, 2)}
                          </pre>
                        </div>
                      )}
                      {message.debug.queryResults && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">نتیجه کوئری:</h4>
                          <pre
                            className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap dir-ltr"
                            dir="ltr"
                          >
                            {JSON.stringify(
                              message.debug.queryResults,
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                      {message.debug.rawAssistantResponse && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">
                            پاسخ خام دستیار:
                          </h4>
                          <pre
                            className="text-xs bg-slate-100 p-2 rounded overflow-auto whitespace-pre-wrap dir-ltr"
                            dir="ltr"
                          >
                            {message.debug.rawAssistantResponse}
                          </pre>
                        </div>
                      )}
                      {message.debug.timings && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">
                            معیارهای عملکرد:
                          </h4>
                          <pre
                            className="text-xs bg-slate-100 p-2 rounded overflow-auto dir-ltr"
                            dir="ltr"
                          >
                            {JSON.stringify(message.debug.timings, null, 2)}
                          </pre>
                        </div>
                      )}
                      {message.debug.tokenUsage && (
                        <div className="mt-2">
                          <h4 className="text-xs font-medium">مصرف توکن:</h4>
                          <div
                            className="text-xs p-2 rounded overflow-auto space-y-1 dir-ltr"
                            dir="ltr"
                          >
                            <p>
                              پیام کاربر:{" "}
                              {message.debug.tokenUsage.userMessageTokens} توکن
                            </p>
                            <p>
                              پاسخ دستیار:{" "}
                              {message.debug.tokenUsage.assistantResponseTokens}{" "}
                              توکن
                            </p>
                            <p className="font-semibold">
                              مجموع: {message.debug.tokenUsage.totalTokens} توکن
                            </p>
                          </div>
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

export default function Chatbot7Page() {
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
      const response = await fetch("/api/chatbot7/assistant", {
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
      const response = await fetch("/api/chatbot7/config", {
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
      const response = await fetch("/api/chatbot7/threads", {
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
        // Transform the thread data to match our expected format
        const formattedThreads = data.threads.map((thread: any) => ({
          id: thread.id,
          name:
            thread.name ||
            `گفتگو ${new Date(thread.createdAt).toLocaleDateString("fa-IR")}`,
          messages: thread.messages || [],
          createdAt: new Date(thread.createdAt),
        }));

        setThreads(formattedThreads);

        // Set the active thread to the most recent one if none is selected
        if (!activeThreadId && formattedThreads.length > 0) {
          setActiveThreadId(formattedThreads[0].id);
        }
      }
    } catch (err) {
      console.error("Error loading user threads:", err);
      setError("خطا در بارگذاری تاریخچه گفتگوها");
    }
  };

  // Create a new thread
  const createNewThread = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/chatbot7/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create new thread");
      }

      const data = await response.json();

      // Create a new thread object
      const newThread: Thread = {
        id: data.threadId,
        name: `گفتگو ${new Date().toLocaleDateString("fa-IR")}`,
        messages: [],
        createdAt: new Date(),
      };

      // Add the new thread to the state
      setThreads((prevThreads) => [newThread, ...prevThreads]);

      // Set the new thread as active
      setActiveThreadId(newThread.id);
      setStatus("idle");
    } catch (err) {
      console.error("Error creating new thread:", err);
      setError("خطا در ایجاد گفتگوی جدید");
      setStatus("error");
    }
  };

  // Get the active thread
  const getActiveThread = () => {
    return threads.find((thread) => thread.id === activeThreadId) || null;
  };

  // Get the messages from the active thread
  const getThreadMessages = () => {
    const activeThread = getActiveThread();
    return activeThread ? activeThread.messages : [];
  };

  // Send a message to the assistant
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || status === "loading" || !activeThreadId) return;

    // Create a new message object
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    // Add the user message to the active thread
    const updatedThreads = threads.map((thread) => {
      if (thread.id === activeThreadId) {
        return {
          ...thread,
          messages: [...thread.messages, userMessage],
        };
      }
      return thread;
    });

    setThreads(updatedThreads);
    setInput("");
    setStatus("loading");

    try {
      // This creates a "thinking" message that will be replaced with the actual response
      const thinkingMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: "در حال پردازش...",
        timestamp: new Date(),
      };

      // Add the thinking message
      const withThinkingMessage = updatedThreads.map((thread) => {
        if (thread.id === activeThreadId) {
          return {
            ...thread,
            messages: [...thread.messages, thinkingMessage],
          };
        }
        return thread;
      });

      setThreads(withThinkingMessage);

      // Send the message to the API
      const response = await fetch("/api/chatbot7/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadId: activeThreadId,
          message: input,
          assistantId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Replace the thinking message with the actual response
      const finalThreads = withThinkingMessage.map((thread) => {
        if (thread.id === activeThreadId) {
          const messages = thread.messages.slice(0, -1); // Remove the thinking message

          // Add the actual response
          const assistantMessage: Message = {
            id: uuidv4(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
            debug: debugMode
              ? {
                  mongoQuery: data.mongoQuery,
                  queryResults: data.queryResults,
                  rawAssistantResponse: data.rawResponse,
                  timings: data.timings,
                  tokenUsage: data.tokenUsage,
                }
              : null,
          };

          return {
            ...thread,
            messages: [...messages, assistantMessage],
          };
        }
        return thread;
      });

      setThreads(finalThreads);
      setStatus("idle");
    } catch (err) {
      console.error("Error sending message:", err);

      // Replace the thinking message with an error message
      const finalThreads = threads.map((thread) => {
        if (thread.id === activeThreadId) {
          const messages = thread.messages.slice(0, -1); // Remove the thinking message

          // Add the error message
          const errorMessage: Message = {
            id: uuidv4(),
            role: "assistant",
            content: "متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.",
            timestamp: new Date(),
          };

          return {
            ...thread,
            messages: [...messages, errorMessage],
          };
        }
        return thread;
      });

      setThreads(finalThreads);
      setStatus("error");
    }
  };

  // Handle thread selection
  const selectThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  // Render the component
  return (
    <div dir="rtl" className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-100 p-4 flex flex-col border-l">
        <div className="mb-4 flex flex-col space-y-2">
          <Button
            onClick={createNewThread}
            className="flex items-center justify-center gap-2"
            disabled={status === "loading"}
          >
            <PlusCircle className="h-4 w-4" />
            گفتگوی جدید
          </Button>
          <Button
            onClick={updateAssistantConfig}
            variant="outline"
            className="flex items-center justify-center gap-2"
            disabled={isConfigUpdating}
          >
            {isConfigUpdating ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            به‌روزرسانی پیکربندی
          </Button>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2 justify-end">
            <Label htmlFor="debug-mode" className="text-sm">
              حالت دیباگ
            </Label>
            <Switch
              id="debug-mode"
              checked={debugMode}
              onCheckedChange={setDebugMode}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <h3 className="font-medium mb-2">تاریخچه گفتگوها</h3>
          <div className="space-y-1">
            {threads.map((thread) => (
              <Button
                key={thread.id}
                variant={thread.id === activeThreadId ? "default" : "ghost"}
                className="w-full justify-start text-right"
                onClick={() => selectThread(thread.id)}
              >
                {thread.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white shadow">
          <h1 className="text-xl font-bold">دستیار هوش مصنوعی</h1>
          <p className="text-sm text-gray-500">از من سؤالات خود را بپرسید</p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {activeThreadId ? (
            <ChatMessages
              messages={getThreadMessages()}
              showDebug={debugMode}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>به دستیار هوش مصنوعی خوش آمدید</CardTitle>
                  <CardDescription>
                    برای شروع یک گفتگوی جدید ایجاد کنید یا از تاریخچه گفتگوها
                    انتخاب نمایید
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button onClick={createNewThread}>شروع گفتگوی جدید</Button>
                </CardFooter>
              </Card>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {activeThreadId && (
          <div className="p-4 bg-white border-t">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                placeholder="سؤال خود را به فارسی بپرسید..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={status === "loading"}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!input.trim() || status === "loading"}
              >
                {status === "loading" ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
