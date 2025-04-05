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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Send, ChevronDown, ChevronUp } from "lucide-react";

type AIModel = "llama" | "gpt";
type QueryStatus =
  | "idle"
  | "generating"
  | "executing"
  | "formatting"
  | "complete"
  | "error";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface MongoDBSchema {
  name: string;
  fields: {
    name: string;
    type: string;
    description?: string;
  }[];
}

export default function ChatbotPage() {
  const [query, setQuery] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<AIModel>("gpt");
  const [status, setStatus] = useState<QueryStatus>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "system",
      content:
        "سلام! من دستیار هوش مصنوعی پارسا موز هستم. چگونه می‌توانم به شما کمک کنم؟",
      timestamp: new Date(),
    },
  ]);
  const [schema, setSchema] = useState<MongoDBSchema[]>([]);
  const [mongoQuery, setMongoQuery] = useState<string>("");
  const [queryResult, setQueryResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Add states for new debug information
  const [debugInfo, setDebugInfo] = useState({
    aiPrompt: "",
    userPrompt: "",
    rawAiResponse: "",
    readableQuery: "",
    exactQuery: "",
    executionTime: 0,
    formattingTime: 0,
  });

  // Add state for expanding/collapsing system prompt
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch schema information on component mount
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch("/api/chatbot/schema", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-domain": "parsamooz", // Using the default domain
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch database schema");
        }

        const data = await response.json();
        setSchema(data.schema);
      } catch (err) {
        console.error("Error fetching schema:", err);
        setError("خطا در دریافت اطلاعات ساختار پایگاه داده");
      }
    };

    fetchSchema();
  }, []);

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("generating");
    setError(null);
    setQuery("");

    try {
      // Step 1: Generate MongoDB Query
      const generateResponse = await fetch("/api/chatbot/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": "parsamooz", // Using the default domain
        },
        body: JSON.stringify({
          query,
          model: selectedModel,
          schema,
        }),
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate query");
      }

      const generateData = await generateResponse.json();
      const generatedMongoQuery = generateData.mongoQuery;
      setMongoQuery(generatedMongoQuery);

      // Save debug info from query generation
      if (generateData.debug) {
        setDebugInfo((prev) => ({
          ...prev,
          aiPrompt: generateData.debug.prompt.system,
          userPrompt: generateData.debug.prompt.user,
          rawAiResponse: generateData.debug.rawAiResponse,
          readableQuery: generateData.debug.readableQuery,
        }));
      }

      // Step 2: Execute MongoDB Query
      setStatus("executing");
      const executeResponse = await fetch("/api/chatbot/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": "parsamooz", // Using the default domain
        },
        body: JSON.stringify({
          mongoQuery: generatedMongoQuery,
        }),
      });

      if (!executeResponse.ok) {
        throw new Error("Failed to execute query");
      }

      const executeData = await executeResponse.json();
      const queryResults = executeData.results;
      setQueryResult(JSON.stringify(queryResults, null, 2));

      // Save debug info from query execution
      if (executeData.debug) {
        setDebugInfo((prev) => ({
          ...prev,
          exactQuery: executeData.debug.mongoCommand,
          executionTime: executeData.debug.executionTime,
        }));
      }

      // Step 3: Format Response
      setStatus("formatting");
      const formatResponse = await fetch("/api/chatbot/format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": "parsamooz", // Using the default domain
        },
        body: JSON.stringify({
          originalQuery: query,
          results: queryResults,
          model: selectedModel,
        }),
      });

      if (!formatResponse.ok) {
        throw new Error("Failed to format response");
      }

      const formatData = await formatResponse.json();

      // Save debug info from formatting
      if (formatData.debug) {
        setDebugInfo((prev) => ({
          ...prev,
          formattingTime: formatData.debug.responseTime,
        }));
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: formatData.formattedResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStatus("complete");
    } catch (err) {
      console.error("Error processing query:", err);
      setError("خطا در پردازش درخواست. لطفا دوباره تلاش کنید.");
      setStatus("error");

      // Add error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "متأسفانه در پردازش درخواست شما خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">چت‌بات هوش مصنوعی پارسا موز</h1>
          <p className="text-muted-foreground mt-2">
            از هوش مصنوعی برای پرسش درباره اطلاعات پایگاه داده استفاده کنید
          </p>
        </div>

        {/* Display error message if present */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <strong className="font-bold ml-1">خطا:</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
                        <div className="whitespace-pre-wrap">
                          {message.content}
                        </div>
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
                      disabled={
                        status !== "idle" &&
                        status !== "complete" &&
                        status !== "error"
                      }
                      className="flex-grow"
                    />
                    <Button
                      type="submit"
                      disabled={
                        status !== "idle" &&
                        status !== "complete" &&
                        status !== "error"
                      }
                    >
                      {status === "idle" ||
                      status === "complete" ||
                      status === "error" ? (
                        <>
                          <Send className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
                          ارسال
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0 animate-spin" />
                          {status === "generating" && "در حال تولید پرسش..."}
                          {status === "executing" && "در حال اجرای پرسش..."}
                          {status === "formatting" &&
                            "در حال فرمت‌بندی پاسخ..."}
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
            <div className="space-y-6">
              {/* Model Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>انتخاب مدل</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedModel}
                    onValueChange={(value) =>
                      setSelectedModel(value as AIModel)
                    }
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="gpt" id="gpt" />
                      <Label htmlFor="gpt">GPT-4 Turbo (OpenAI)</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="llama" id="llama" />
                      <Label htmlFor="llama">Llama 3 (Groq)</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Debug Information */}
              <Tabs defaultValue="query">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="query">پرسش</TabsTrigger>
                  <TabsTrigger value="execution">اجرا</TabsTrigger>
                  <TabsTrigger value="result">نتیجه</TabsTrigger>
                  <TabsTrigger value="ai">هوش مصنوعی</TabsTrigger>
                </TabsList>

                {/* Generated MongoDB Query */}
                <TabsContent value="query">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        پرسش MongoDB تولید شده
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-2 rounded-md overflow-auto max-h-[200px] text-xs font-mono">
                        {mongoQuery ? mongoQuery : "پرسشی هنوز تولید نشده است."}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Exact MongoDB Query Execution */}
                <TabsContent value="execution">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        دستور MongoDB دقیق
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-2 rounded-md overflow-auto max-h-[200px] text-xs font-mono">
                        {debugInfo.exactQuery ? (
                          <>
                            <div className="mb-2 text-green-600">
                              زمان اجرا: {debugInfo.executionTime}ms
                            </div>
                            {debugInfo.exactQuery}
                          </>
                        ) : (
                          "دستوری هنوز اجرا نشده است."
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Query Results */}
                <TabsContent value="result">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">نتیجه خام پرسش</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-2 rounded-md overflow-auto max-h-[200px] text-xs font-mono">
                        {queryResult
                          ? queryResult
                          : "نتیجه‌ای هنوز موجود نیست."}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* AI Prompts & Responses */}
                <TabsContent value="ai">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        پرامپت‌های ارسالی به هوش مصنوعی
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-semibold mb-1">
                            زمان فرمت‌بندی پاسخ
                          </h4>
                          <div className="bg-muted p-2 rounded-md text-xs">
                            {debugInfo.formattingTime > 0
                              ? `${debugInfo.formattingTime}ms`
                              : "نامشخص"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold mb-1">
                            پاسخ خام هوش مصنوعی
                          </h4>
                          <div className="bg-muted p-2 rounded-md overflow-auto max-h-[100px] text-xs font-mono">
                            {debugInfo.rawAiResponse || "موجود نیست"}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold mb-1">
                            پرامپت سیستم (System Prompt)
                          </h4>
                          <div className="bg-muted p-2 rounded-md overflow-auto max-h-[200px] text-xs font-mono whitespace-pre-wrap">
                            {debugInfo.aiPrompt ? (
                              <>
                                <div className="text-green-600">
                                  {isSystemPromptExpanded
                                    ? debugInfo.aiPrompt
                                    : `${debugInfo.aiPrompt.slice(0, 100)}${
                                        debugInfo.aiPrompt.length > 100
                                          ? "..."
                                          : ""
                                      }`}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setIsSystemPromptExpanded(
                                      !isSystemPromptExpanded
                                    )
                                  }
                                  className="mt-2 text-xs flex items-center"
                                >
                                  {isSystemPromptExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 ml-1" />
                                      کوچک کردن
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 ml-1" />
                                      نمایش کامل
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              "موجود نیست"
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-semibold mb-1">
                            پرامپت کاربر (User Prompt)
                          </h4>
                          <div className="bg-muted p-2 rounded-md overflow-auto max-h-[50px] text-xs font-mono">
                            {debugInfo.userPrompt || "موجود نیست"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Status Indicator */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>وضعیت</span>
                    {status !== "idle" &&
                      status !== "complete" &&
                      status !== "error" && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2 rounded-md ${
                        status === "generating"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      تولید پرسش
                    </div>
                    <div
                      className={`p-2 rounded-md ${
                        status === "executing"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      اجرای پرسش
                    </div>
                    <div
                      className={`p-2 rounded-md ${
                        status === "formatting"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      فرمت‌بندی پاسخ
                    </div>
                    <div
                      className={`p-2 rounded-md ${
                        status === "complete"
                          ? "bg-green-500 text-white"
                          : status === "error"
                          ? "bg-red-500 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {status === "complete"
                        ? "تکمیل شده"
                        : status === "error"
                        ? "خطا"
                        : "تکمیل"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
