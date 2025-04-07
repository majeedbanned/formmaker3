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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Send, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

type QueryStatus = "idle" | "processing" | "complete" | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface SchemaFile {
  id: string;
  name: string;
  fileId: string;
  uploadedAt: Date;
}

export default function ChatbotV2Page() {
  // Toast for notifications
  const { toast } = useToast();

  // Basic state
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "system",
      content:
        "سلام! من دستیار هوش مصنوعی پارسا موز V2 هستم. چگونه می‌توانم به شما کمک کنم؟",
      timestamp: new Date(),
    },
  ]);

  // Schema management
  const [schemaFile, setSchemaFile] = useState<SchemaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useHardcodedSchema, setUseHardcodedSchema] = useState(true);

  // Assistant management
  const [, setAssistantId] = useState<string>("");
  const [threadId, setThreadId] = useState<string>("");
  const [isAssistantReady, setIsAssistantReady] = useState(false);

  // Debug options
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    mongoQuery: "",
    queryResults: [],
    executionTime: 0,
    tokenUsage: {
      prompt: 0,
      completion: 0,
      total: 0,
    },
    aiRequests: {
      queryGeneration: "",
      formatting: "",
    },
    aiResponses: {
      queryGeneration: "",
      formatting: "",
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load assistant data on component mount
  useEffect(() => {
    const loadAssistantData = async () => {
      try {
        const response = await fetch("/api/chatbot2/assistant", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-domain": "parsamooz",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load assistant data");
        }

        const data = await response.json();

        if (data.assistantId) {
          setAssistantId(data.assistantId);
          setThreadId(data.threadId || "");
          setSchemaFile(data.schemaFile || null);
          setIsAssistantReady(true);
        }
      } catch (err) {
        console.error("Error loading assistant data:", err);
        toast({
          title: "خطا در بارگذاری اطلاعات دستیار",
          description: "لطفاً صفحه را رفرش کرده و دوباره تلاش کنید.",
          variant: "destructive",
        });
      }
    };

    loadAssistantData();
  }, [toast]);

  // Load hardcoded schema when selected
  useEffect(() => {
    if (useHardcodedSchema) {
      const loadHardcodedSchema = async () => {
        try {
          const response = await fetch("/api/chatbot2/mongodb-schema", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-domain": "parsamooz",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to load hardcoded schema");
          }

          // No need to set schema file as we're using the hardcoded one
          setIsAssistantReady(true);
          toast({
            title: "اسکیمای داخلی",
            description: "از اسکیمای داخلی مانگو استفاده می‌شود.",
          });
        } catch (err) {
          console.error("Error loading hardcoded schema:", err);
          toast({
            title: "خطا در بارگذاری اسکیمای داخلی",
            description: "لطفاً از آپلود فایل استفاده کنید.",
            variant: "destructive",
          });
          setUseHardcodedSchema(false);
        }
      };

      loadHardcodedSchema();
    }
  }, [useHardcodedSchema, toast]);

  // Handle schema file upload
  const handleSchemaUpload = async () => {
    if (fileInputRef.current?.files?.length) {
      const file = fileInputRef.current.files[0];

      if (file.type !== "application/json") {
        toast({
          title: "فرمت فایل نامعتبر",
          description: "لطفاً یک فایل JSON انتخاب کنید.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsUploading(true);

        const formData = new FormData();
        formData.append("schemaFile", file);

        const response = await fetch("/api/chatbot2/schema", {
          method: "POST",
          headers: {
            "x-domain": "parsamooz",
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload schema file");
        }

        const data = await response.json();

        setSchemaFile({
          id: data.id,
          name: file.name,
          fileId: data.fileId,
          uploadedAt: new Date(),
        });

        toast({
          title: "آپلود موفق",
          description: "فایل اسکیما با موفقیت آپلود شد.",
        });
      } catch (err) {
        console.error("Error uploading schema file:", err);
        toast({
          title: "خطا در آپلود فایل",
          description: "لطفاً دوباره تلاش کنید.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle form submission (sending a query)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || !isAssistantReady) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("processing");
    setQuery("");

    try {
      // Process the query using the assistant
      const response = await fetch("/api/chatbot2/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": "parsamooz",
        },
        body: JSON.stringify({
          query,
          threadId,
          debugMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const data = await response.json();

      // Save thread ID if it's newly created
      if (data.threadId && threadId !== data.threadId) {
        setThreadId(data.threadId);
      }

      // Save debug info if debug mode is enabled
      if (debugMode && data.debug) {
        setDebugInfo({
          mongoQuery: data.debug.mongoQuery || "",
          queryResults: data.debug.queryResults || [],
          executionTime: data.debug.executionTime || 0,
          tokenUsage: data.debug.tokenUsage || {
            prompt: 0,
            completion: 0,
            total: 0,
          },
          aiRequests: {
            queryGeneration: data.debug.aiRequests?.queryGeneration || "",
            formatting: data.debug.aiRequests?.formatting || "",
          },
          aiResponses: {
            queryGeneration: data.debug.aiResponses?.queryGeneration || "",
            formatting: data.debug.aiResponses?.formatting || "",
          },
        });
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("complete");
    } catch (err) {
      console.error("Error processing query:", err);

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "متأسفانه در پردازش درخواست شما خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setStatus("error");
    }
  };

  // Handle creating a new thread
  const handleNewThread = async () => {
    try {
      const response = await fetch("/api/chatbot2/thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": "parsamooz",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create new thread");
      }

      const data = await response.json();
      setThreadId(data.threadId);

      // Clear messages except for the welcome message
      setMessages([
        {
          id: "1",
          role: "system",
          content:
            "سلام! من دستیار هوش مصنوعی پارسا موز V2 هستم. چگونه می‌توانم به شما کمک کنم؟",
          timestamp: new Date(),
        },
      ]);

      toast({
        title: "گفتگوی جدید",
        description: "یک گفتگوی جدید ایجاد شد.",
      });
    } catch (err) {
      console.error("Error creating new thread:", err);
      toast({
        title: "خطا در ایجاد گفتگوی جدید",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">چت‌بات هوش مصنوعی پارسا موز V2</h1>
          <p className="text-muted-foreground mt-2">
            از هوش مصنوعی پیشرفته برای پرسش درباره اطلاعات پایگاه داده استفاده
            کنید
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>گفتگو با هوش مصنوعی</CardTitle>
                <CardDescription>
                  سوالات خود را به زبان فارسی مطرح کنید
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-grow overflow-auto max-h-[60vh]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "system"
                            ? "bg-muted text-muted-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <div
                          className="whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                        <div className="text-xs mt-1 opacity-70">
                          {message.timestamp.toLocaleTimeString("fa-IR")}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="سوال خود را به فارسی بنویسید..."
                      disabled={status === "processing" || !isAssistantReady}
                      className="flex-grow"
                    />
                    <Button
                      type="submit"
                      disabled={status === "processing" || !isAssistantReady}
                    >
                      {status === "processing" ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 animate-spin" />
                          در حال پردازش...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
                          ارسال
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardFooter>
            </Card>
          </div>

          {/* Settings and Debug */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">حالت دیباگ</span>
                  <Switch
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                    aria-label="Toggle debug mode"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      استفاده از اسکیمای داخلی
                    </span>
                    <Switch
                      checked={useHardcodedSchema}
                      onCheckedChange={setUseHardcodedSchema}
                      aria-label="Toggle hardcoded schema"
                    />
                  </div>

                  {!useHardcodedSchema && (
                    <>
                      <h3 className="text-sm font-medium">آپلود فایل اسکیما</h3>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Input
                          type="file"
                          ref={fileInputRef}
                          accept="application/json"
                          disabled={isUploading}
                          className="flex-grow"
                        />
                        <Button
                          size="sm"
                          disabled={isUploading}
                          onClick={handleSchemaUpload}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 animate-spin" />
                              در حال آپلود...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
                              آپلود
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {schemaFile && !useHardcodedSchema && (
                    <div className="text-xs text-muted-foreground">
                      <span>فایل: {schemaFile.name}</span>
                      <br />
                      <span>
                        آپلود در:{" "}
                        {new Date(schemaFile.uploadedAt).toLocaleDateString(
                          "fa-IR"
                        )}
                      </span>
                    </div>
                  )}

                  {useHardcodedSchema && (
                    <div className="text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        اسکیمای مانگو داخلی فعال است
                      </Badge>
                      <div className="mt-1">
                        <span>
                          اسکیمای داخلی شامل روابط بین کالکشن‌ها و توضیحات دقیق
                          می‌باشد
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleNewThread}
                  disabled={!isAssistantReady}
                >
                  شروع گفتگوی جدید
                </Button>
              </CardContent>
            </Card>

            {debugMode && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>اطلاعات دیباگ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="query">
                    <TabsList className="w-full">
                      <TabsTrigger value="query" className="flex-1">
                        کوئری
                      </TabsTrigger>
                      <TabsTrigger value="execution" className="flex-1">
                        اجرا
                      </TabsTrigger>
                      <TabsTrigger value="results" className="flex-1">
                        نتایج
                      </TabsTrigger>
                      <TabsTrigger value="ai-chat" className="flex-1">
                        هوش مصنوعی
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="query" className="mt-2">
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                        {debugInfo.mongoQuery || "هنوز کوئری‌ای اجرا نشده است"}
                      </pre>
                    </TabsContent>
                    <TabsContent value="execution" className="mt-2">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium">زمان اجرا:</span>{" "}
                          {debugInfo.executionTime
                            ? `${debugInfo.executionTime.toFixed(2)} ms`
                            : "موجود نیست"}
                        </div>
                        <div>
                          <span className="font-medium">توکن ورودی:</span>{" "}
                          {debugInfo.tokenUsage?.prompt || 0}
                        </div>
                        <div>
                          <span className="font-medium">توکن خروجی:</span>{" "}
                          {debugInfo.tokenUsage?.completion || 0}
                        </div>
                        <div>
                          <span className="font-medium">مجموع توکن:</span>{" "}
                          {debugInfo.tokenUsage?.total || 0}
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="results" className="mt-2">
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[200px] whitespace-pre-wrap">
                        {debugInfo.queryResults?.length
                          ? JSON.stringify(debugInfo.queryResults, null, 2)
                          : "نتیجه‌ای موجود نیست"}
                      </pre>
                    </TabsContent>
                    <TabsContent value="ai-chat" className="mt-2">
                      <div className="space-y-4">
                        {/* Query Generation Request */}
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            درخواست ساخت کوئری:
                          </h3>
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">
                            {debugInfo.aiRequests?.queryGeneration ||
                              "موجود نیست"}
                          </pre>
                        </div>

                        {/* Query Generation Response */}
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            پاسخ هوش مصنوعی (کوئری):
                          </h3>
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">
                            {debugInfo.aiResponses?.queryGeneration ||
                              "موجود نیست"}
                          </pre>
                        </div>

                        {/* Formatting Request */}
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            درخواست فرمت‌بندی نتایج:
                          </h3>
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">
                            {debugInfo.aiRequests?.formatting || "موجود نیست"}
                          </pre>
                        </div>

                        {/* Formatting Response */}
                        <div>
                          <h3 className="text-sm font-medium mb-1">
                            پاسخ هوش مصنوعی (فرمت‌بندی):
                          </h3>
                          <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-[100px] whitespace-pre-wrap">
                            {debugInfo.aiResponses?.formatting || "موجود نیست"}
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
