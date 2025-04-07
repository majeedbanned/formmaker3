import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "mongodb";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant data storage
interface StoredAssistant {
  assistantId: string;
  threadId?: string;
  schemaFile?: {
    id: string;
    name: string;
    fileId: string;
    uploadedAt: Date;
  };
  createdAt: Date;
}

// In a production environment, this should be stored in a database
let storedAssistant: StoredAssistant | null = null;

// MongoDB query interface
interface MongoQuery {
  collection: string;
  operation: "find" | "aggregate";
  query: Record<string, unknown> | Array<Record<string, unknown>>;
}

// Calculate token usage
interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

// Helper function to wait for run to complete
async function waitForRunCompletion(threadId: string, runId: string): Promise<OpenAI.Beta.Threads.Runs.Run> {
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);
  
  // Poll for status change
  while (run.status === "queued" || run.status === "in_progress") {
    // Wait for a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }
  
  if (run.status === "failed") {
    throw new Error(`Run failed: ${run.last_error?.message || "Unknown error"}`);
  }
  
  if (run.status === "requires_action") {
    // This means we need to execute a function (not used in this implementation)
    throw new Error("Run requires action, which is not supported in this implementation");
  }
  
  return run;
}

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get request body
    const body = await request.json();
    const { query, threadId: existingThreadId, debugMode } = body;
    
    // Validate inputs
    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 }
      );
    }
    
    // Track token usage and timing
    const tokenUsage: TokenUsage = { prompt: 0, completion: 0, total: 0 };
    const startTime = Date.now();
    
    // Initialize debug info
    const debugInfo = {
      mongoQuery: "",
      queryResults: [] as Document[],
      executionTime: 0,
      tokenUsage,
      aiRequests: {
        queryGeneration: "",
        formatting: ""
      },
      aiResponses: {
        queryGeneration: "",
        formatting: ""
      }
    };
    
    // Ensure we have an assistant
    if (!storedAssistant?.assistantId) {
      // Try to fetch the assistant info first
      const assistantResponse = await fetch("/api/chatbot2/assistant", {
        method: "GET",
        headers: {
          "x-domain": domain,
        },
      });
      
      if (!assistantResponse.ok) {
        throw new Error("No assistant available");
      }
      
      storedAssistant = await assistantResponse.json();
    }
    
    if (!storedAssistant) {
      throw new Error("Failed to initialize assistant");
    }
    
    const assistantId = storedAssistant.assistantId;
    
    // Get or create thread
    let threadId = existingThreadId;
    if (!threadId) {
      const threadResponse = await fetch("/api/chatbot2/thread", {
        method: "POST",
        headers: {
          "x-domain": domain,
        },
      });
      
      if (!threadResponse.ok) {
        throw new Error("Failed to create a new thread");
      }
      
      const threadData = await threadResponse.json();
      threadId = threadData.threadId;
    }
    
    logger.info(`Processing query on thread ${threadId}: "${query.substring(0, 50)}..."`);
    
    // Step 1: Add user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: query
    });
    
    // Step 2: Run the assistant to generate a MongoDB query
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: "Generate a MongoDB query based on the user's Farsi question. Use the MongoDB schema to understand the database structure. Return ONLY a valid JSON object with 'collection', 'operation', and 'query' fields. Do not include any explanations or markdown formatting."
    });
    
    // Get the MongoDB schema to include in the instructions
    try {
      // Fetch the MongoDB schema from our hardcoded endpoint
      const schemaResponse = await fetch(`${request.nextUrl.origin}/api/chatbot2/mongodb-schema`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-domain": domain,
        },
      });
      
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.json();
        if (schemaData.schema) {
          // Create the query generation request content
          const queryGenerationRequest = `MongoDB Schema Information: ${JSON.stringify(schemaData.schema, null, 2)}\n\nUser Query: ${query}\n\nPlease use this schema information when generating MongoDB queries. Pay special attention to the relationships between collections and field paths.`;
          
          // Save for debug mode
          if (debugMode) {
            debugInfo.aiRequests.queryGeneration = queryGenerationRequest;
          }
          
          // Create a user message with the schema information
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: queryGenerationRequest
          });
        }
      }
    } catch (error) {
      logger.warn("Could not fetch MongoDB schema:", error);
      // Continue without schema info
    }
    
    // Wait for the assistant to generate a response
    await waitForRunCompletion(threadId, run.id);
    
    // Step 3: Retrieve the assistant's response (MongoDB query)
    const messages = await openai.beta.threads.messages.list(threadId);
    const lastAssistantMessage = messages.data
      .filter(msg => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!lastAssistantMessage?.content || lastAssistantMessage.content.length === 0) {
      throw new Error("No query generated by the assistant");
    }
    
    // Extract the MongoDB query from the assistant's response
    const contentValue = lastAssistantMessage.content[0];
    
    if (contentValue.type !== "text") {
      throw new Error("Expected text content from assistant");
    }
    
    const assistantResponse = contentValue.text.value;
    let mongoQuery: MongoQuery;
    
    // Save the raw response for debug mode
    if (debugMode) {
      debugInfo.aiResponses.queryGeneration = assistantResponse;
    }
    
    try {
      // Extract JSON from the response
      let jsonString = assistantResponse;
      
      // If the response is wrapped in code blocks, extract the JSON
      const jsonMatch = assistantResponse.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }
      
      mongoQuery = JSON.parse(jsonString);
      
      // Validate the generated query
      if (!mongoQuery.collection || !mongoQuery.operation || !mongoQuery.query) {
        throw new Error("Invalid MongoDB query structure");
      }
      
      // Save the query for debugging
      debugInfo.mongoQuery = JSON.stringify(mongoQuery, null, 2);
    } catch (error) {
      logger.error("Error parsing MongoDB query:", error);
      throw new Error("Failed to parse MongoDB query from assistant response");
    }
    
    // Step 4: Execute the MongoDB query
    const queryStartTime = Date.now();
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get the collection
    const coll = connection.db.collection(mongoQuery.collection);
    
    // Execute the query
    let results: Document[] = [];
    
    if (mongoQuery.operation === "find") {
      // For find operations
      const findQuery = mongoQuery.query as Record<string, unknown>;
      const cursor = coll.find(findQuery);
      
      // Apply limit to prevent excessive data retrieval
      const limitedCursor = cursor.limit(50);
      
      // Convert cursor to array
      results = await limitedCursor.toArray();
    } else {
      // For aggregate operations
      const aggregateQuery = mongoQuery.query as Array<Record<string, unknown>>;
      
      // Apply limit to prevent excessive data retrieval if not already present
      let hasLimit = false;
      let queryToExecute = [...aggregateQuery];
      
      for (const stage of aggregateQuery) {
        if (stage.$limit !== undefined) {
          hasLimit = true;
          break;
        }
      }
      
      if (!hasLimit) {
        // Add a $limit stage at the end
        queryToExecute = [...aggregateQuery, { $limit: 50 }];
      }
      
      // Execute the aggregation
      const cursor = coll.aggregate(queryToExecute);
      results = await cursor.toArray();
    }
    
    // Calculate execution time
    const executionTime = Date.now() - queryStartTime;
    debugInfo.executionTime = executionTime;
    debugInfo.queryResults = results;
    
    logger.info(`Query executed in ${executionTime}ms. Results count: ${results.length}`);
    
    // Step 5: Format the results for the user using the assistant
    // Create a new message to add the results for formatting
    const formattingRequest = `Here are the results of executing your MongoDB query:\n\n${JSON.stringify(results, null, 2)}\n\nPlease format these results in a human-friendly way in Farsi. If there are many results, summarize them effectively.`;

    // Save for debug mode
    if (debugMode) {
      debugInfo.aiRequests.formatting = formattingRequest;
    }

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: formattingRequest,
    });

    // Run the assistant again to format the results
    const formattingRun = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Wait for the assistant to format the results
    await waitForRunCompletion(threadId, formattingRun.id);

    // Retrieve the assistant's formatted response
    const formattedMessages = await openai.beta.threads.messages.list(threadId);
    const lastFormattedMessage = formattedMessages.data
      .filter(msg => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!lastFormattedMessage?.content || lastFormattedMessage.content.length === 0) {
      throw new Error("No formatted response generated by the assistant");
    }

    const formattedContentValue = lastFormattedMessage.content[0];
    if (formattedContentValue.type !== "text") {
      throw new Error("Expected text content from assistant for formatting");
    }

    const formattedResponse = formattedContentValue.text.value;

    // Save the formatted response for debug mode
    if (debugMode) {
      debugInfo.aiResponses.formatting = formattedResponse;
    }

    // Calculate total time
    const totalTime = Date.now() - startTime;
    
    // Get token usage if available
    if (formattingRun.usage) {
      tokenUsage.prompt = (formattingRun.usage.prompt_tokens || 0) + (run.usage?.prompt_tokens || 0);
      tokenUsage.completion = (formattingRun.usage.completion_tokens || 0) + (run.usage?.completion_tokens || 0);
      tokenUsage.total = (formattingRun.usage.total_tokens || 0) + (run.usage?.total_tokens || 0);
      
      debugInfo.tokenUsage = tokenUsage;
    }
    
    logger.info(`Total processing time: ${totalTime}ms, Token usage: ${tokenUsage.total}`);
    
    // Prepare the final response
    return NextResponse.json({
      success: true,
      response: formattedResponse,
      threadId,
      debug: debugMode ? debugInfo : undefined,
    }, { status: 200 });
  } catch (error) {
    logger.error("Error processing chat request:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process chat request",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 