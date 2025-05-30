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
import { Label } from "@/components/ui/label";

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

interface MentionSuggestion {
  label: string;
  value: string;
  type: "student" | "teacher" | "month" | "weekday";
}

// Add global CSS classes for RTL input support
const rtlInputClasses = "text-right dir-rtl";

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

  // Mention system state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<
    MentionSuggestion[]
  >([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Schema management
  const [schemaFile] = useState<SchemaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [useHardcodedSchema, setUseHardcodedSchema] = useState(true);

  // Assistant management
  const [threadId, setThreadId] = useState<string>("");
  const [isAssistantReady, setIsAssistantReady] = useState(false);
  const [userId] = useState<string>(
    `user_${Math.random().toString(36).substring(2, 10)}`
  );

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
        const response = await fetch("/api/chatbot2/config", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-domain": "parsamooz",
            "x-user-id": userId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.assistant) {
            setIsAssistantReady(true);

            // Get current thread if user has one
            const threadResponse = await fetch(
              `/api/chatbot2/thread?userId=${userId}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "x-domain": "parsamooz",
                  "x-user-id": userId,
                },
              }
            );

            if (threadResponse.ok) {
              const threadData = await threadResponse.json();
              if (threadData.success && threadData.threads?.length > 0) {
                setThreadId(threadData.threads[0].threadId);
              }
            }
          }
        } else {
          console.log(
            "No assistant config found, system will create default one on first use"
          );
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
  }, [toast, userId]);

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

  // Handle schema file upload - Update to upload combined config file
  const handleConfigUpload = async () => {
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

        // Read the file content
        const fileContent = await file.text();
        let configData;

        try {
          configData = JSON.parse(fileContent);
        } catch {
          toast({
            title: "فایل JSON نامعتبر",
            description:
              "فایل انتخاب شده قابل پردازش نیست. لطفاً یک فایل JSON معتبر انتخاب کنید.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        // Validate the config structure
        if (
          !configData.name ||
          !configData.instructions ||
          !configData.dbSchema
        ) {
          toast({
            title: "ساختار فایل ناقص است",
            description:
              "فایل باید شامل فیلدهای name، instructions و dbSchema باشد.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }

        // Upload the configuration
        const response = await fetch("/api/chatbot2/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": "parsamooz",
          },
          body: JSON.stringify(configData),
        });

        if (!response.ok) {
          throw new Error("Failed to upload configuration");
        }

        await response.json();

        toast({
          title: "آپلود موفق",
          description: "تنظیمات دستیار با موفقیت بارگذاری شد.",
        });

        setIsAssistantReady(true);

        // Create a new thread with this assistant
        const threadResponse = await fetch("/api/chatbot2/thread", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": "parsamooz",
            "x-user-id": userId,
          },
          body: JSON.stringify({ userId }),
        });

        if (threadResponse.ok) {
          const threadData = await threadResponse.json();
          setThreadId(threadData.threadId);
        }
      } catch (err) {
        console.error("Error uploading configuration:", err);
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

  // Persian months and weekdays for quick suggestions
  const PERSIAN_MONTHS: MentionSuggestion[] = [
    { label: "فروردین", value: "فروردین", type: "month" },
    { label: "اردیبهشت", value: "اردیبهشت", type: "month" },
    { label: "خرداد", value: "خرداد", type: "month" },
    { label: "تیر", value: "تیر", type: "month" },
    { label: "مرداد", value: "مرداد", type: "month" },
    { label: "شهریور", value: "شهریور", type: "month" },
    { label: "مهر", value: "مهر", type: "month" },
    { label: "آبان", value: "آبان", type: "month" },
    { label: "آذر", value: "آذر", type: "month" },
    { label: "دی", value: "دی", type: "month" },
    { label: "بهمن", value: "بهمن", type: "month" },
    { label: "اسفند", value: "اسفند", type: "month" },
  ];

  const PERSIAN_WEEKDAYS: MentionSuggestion[] = [
    { label: "شنبه", value: "شنبه", type: "weekday" },
    { label: "یکشنبه", value: "یکشنبه", type: "weekday" },
    { label: "دوشنبه", value: "دوشنبه", type: "weekday" },
    { label: "سه شنبه", value: "سه شنبه", type: "weekday" },
    { label: "چهارشنبه", value: "چهارشنبه", type: "weekday" },
    { label: "پنج شنبه", value: "پنج شنبه", type: "weekday" },
    { label: "جمعه", value: "جمعه", type: "weekday" },
  ];

  // Handle mention input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    const cursorPos = e.target.selectionStart || 0;
    setCursorPosition(cursorPos);

    // Find the '@' before cursor position
    const textUpToCursor = value.substring(0, cursorPos);
    const atSymbolIndex = textUpToCursor.lastIndexOf("@");

    if (atSymbolIndex !== -1 && atSymbolIndex < cursorPos) {
      // Get the text between '@' and cursor
      const searchText = textUpToCursor.substring(atSymbolIndex + 1).trim();

      if (searchText === "") {
        // Just show default suggestions (months and weekdays) when @ is typed
        setMentionSuggestions([...PERSIAN_MONTHS, ...PERSIAN_WEEKDAYS]);
        setShowMentions(true);
        setMentionLoading(false);
        return;
      }

      setShowMentions(true);
      fetchMentionSuggestions(searchText);
    } else {
      setShowMentions(false);
    }
  };

  // Fetch mention suggestions with debounce
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchMentionSuggestions = (query: string) => {
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set loading state
    setMentionLoading(true);

    // Add debounce to prevent too many requests
    debounceTimeout.current = setTimeout(async () => {
      try {
        // Filter local data (months and weekdays) first
        const filteredMonths = PERSIAN_MONTHS.filter(
          (month) => month.label.includes(query) || month.value.includes(query)
        );

        const filteredWeekdays = PERSIAN_WEEKDAYS.filter(
          (day) => day.label.includes(query) || day.value.includes(query)
        );

        // Fetch student suggestions
        const studentResponse = await fetch(
          `/api/dropdown-options/students?labelField=studentName&valueField=studentCode&query=${query}&customLabel={studentName} {studentFamily}`,
          {
            headers: { "x-domain": "parsamooz" },
          }
        );

        // Fetch teacher suggestions
        const teacherResponse = await fetch(
          `/api/dropdown-options/teachers?labelField=teacherName&valueField=teacherCode&query=${query}`,
          {
            headers: { "x-domain": "parsamooz" },
          }
        );

        const studentData = await studentResponse.json();
        const teacherData = await teacherResponse.json();

        // Format student data
        const studentSuggestions = studentData
          .map((student: { label: string; value: string }) => ({
            label: student.label,
            value: student.value,
            type: "student" as const,
          }))
          .slice(0, 5); // Limit to 5 student suggestions

        // Format teacher data
        const teacherSuggestions = teacherData
          .map((teacher: { label: string; value: string }) => ({
            label: teacher.label,
            value: teacher.value,
            type: "teacher" as const,
          }))
          .slice(0, 5); // Limit to 5 teacher suggestions

        // Combine all suggestions
        const allSuggestions: MentionSuggestion[] = [
          ...filteredMonths,
          ...filteredWeekdays,
          ...studentSuggestions,
          ...teacherSuggestions,
        ];

        setMentionSuggestions(allSuggestions);
      } catch (error) {
        console.error("Error fetching mention suggestions:", error);
        // If error, still show local data
        const filteredSuggestions = [
          ...PERSIAN_MONTHS,
          ...PERSIAN_WEEKDAYS,
        ].filter(
          (item) => item.label.includes(query) || item.value.includes(query)
        );
        setMentionSuggestions(filteredSuggestions);
      } finally {
        setMentionLoading(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle selecting a mention
  const handleSelectMention = (suggestion: MentionSuggestion) => {
    // Find the position of the '@' before cursor
    const textUpToCursor = query.substring(0, cursorPosition);
    const atSymbolIndex = textUpToCursor.lastIndexOf("@");

    if (atSymbolIndex !== -1) {
      // Replace the text between '@' and cursor with the selected suggestion
      const textBeforeMention = query.substring(0, atSymbolIndex);
      const textAfterCursor = query.substring(cursorPosition);

      // Create the new query - ensure proper spacing for RTL
      const newQuery = `${textBeforeMention}@${suggestion.label} ${textAfterCursor}`;

      setQuery(newQuery);
      setShowMentions(false);

      // Set focus back to input with proper cursor position
      // New cursor position should be after the inserted suggestion and space
      const newCursorPos = atSymbolIndex + suggestion.label.length + 2; // +2 for '@' and space

      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
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
          "x-user-id": userId,
        },
        body: JSON.stringify({
          query,
          threadId,
          userId,
          debugMode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const data = await response.json();

      // Update threadId if a new one was created
      if (data.threadId && !threadId) {
        setThreadId(data.threadId);
      }

      // Add assistant's response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("complete");

      // Update debug info if available
      if (debugMode && data.debug) {
        setDebugInfo(data.debug);
      }
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

      toast({
        title: "خطا در پردازش درخواست",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
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
                    <div className="relative flex-grow">
                      <Input
                        ref={inputRef}
                        value={query}
                        onChange={handleInputChange}
                        placeholder="سوال خود را به فارسی بنویسید... (از @ برای منشن استفاده کنید)"
                        disabled={status === "processing" || !isAssistantReady}
                        className={`flex-grow ${rtlInputClasses}`}
                        dir="rtl"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setShowMentions(false);
                          }
                        }}
                      />

                      {showMentions && (
                        <div className="absolute z-10 w-full bg-background shadow-lg border rounded-md mt-1 max-h-56 overflow-y-auto right-0">
                          <div className="p-1 text-xs text-muted-foreground border-b text-right">
                            {mentionLoading ? "در حال جستجو..." : "نتایج جستجو"}
                          </div>
                          {mentionSuggestions.length === 0 ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">
                              {mentionLoading ? (
                                <div className="flex justify-center items-center py-2">
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                  در حال بارگذاری...
                                </div>
                              ) : (
                                "نتیجه‌ای یافت نشد"
                              )}
                            </div>
                          ) : (
                            <div className="text-right">
                              {mentionSuggestions.map((suggestion, idx) => (
                                <div
                                  key={`${suggestion.type}-${suggestion.value}-${idx}`}
                                  className="flex items-center p-2 hover:bg-accent cursor-pointer justify-between"
                                  onClick={() =>
                                    handleSelectMention(suggestion)
                                  }
                                >
                                  <span>{suggestion.label}</span>
                                  <Badge
                                    variant="outline"
                                    className={`${
                                      suggestion.type === "student"
                                        ? "bg-blue-100"
                                        : suggestion.type === "teacher"
                                        ? "bg-green-100"
                                        : suggestion.type === "month"
                                        ? "bg-yellow-100"
                                        : "bg-purple-100"
                                    }`}
                                  >
                                    {suggestion.type === "student"
                                      ? "دانش‌آموز"
                                      : suggestion.type === "teacher"
                                      ? "معلم"
                                      : suggestion.type === "month"
                                      ? "ماه"
                                      : "روز هفته"}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch
                      id="useHardcodedSchema"
                      checked={useHardcodedSchema}
                      onCheckedChange={setUseHardcodedSchema}
                    />
                    <Label htmlFor="useHardcodedSchema">
                      استفاده از دستیار پیش‌فرض
                    </Label>
                  </div>

                  {!useHardcodedSchema && (
                    <div className="space-y-2">
                      <Label htmlFor="configFile">
                        آپلود فایل تنظیمات دستیار (JSON)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="configFile"
                          type="file"
                          ref={fileInputRef}
                          accept=".json"
                          disabled={isUploading}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleConfigUpload}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              در حال آپلود...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              آپلود
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <a
                          href="/admin/chatbot2/config-template.json"
                          download
                          className="underline hover:text-primary"
                        >
                          دانلود فایل قالب
                        </a>
                        {
                          " - این فایل را دانلود کرده، تغییرات مورد نظر را اعمال کرده و سپس آپلود کنید."
                        }
                      </div>
                    </div>
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
                      <Badge variant="secondary" className="ml-2">
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
