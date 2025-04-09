import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { OpenAI } from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import { Document } from "mongodb";
import { getAssistantModel, getThreadModel, IAssistant } from "../models/assistant";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { query, threadId: existingThreadId, userId = "anonymous", debugMode } = body;
    
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
    
    // Connect to database and get models
    const connection = await connectToDatabase(domain);
    const AssistantModel = getAssistantModel(connection);
    const ThreadModel = getThreadModel(connection);
    
    // Get the active assistant for this domain
    const assistant = await AssistantModel.findOne({
      domain,
      isActive: true,
    }).lean() as IAssistant | null;
    
    if (!assistant) {
      throw new Error("No active assistant found for this domain");
    }
    
    const assistantId = assistant.assistantId;
    
    // Get or create thread
    let threadId = existingThreadId;
    let threadDoc;
    
    if (!threadId) {
      // Create a new thread
      const thread = await openai.beta.threads.create();
      threadId = thread.id;
      
      // Store thread in database
      threadDoc = new ThreadModel({
        threadId,
        userId,
        assistantId,
        domain,
        isActive: true,
        lastUsed: new Date(),
        createdAt: new Date(),
      });
      
      await threadDoc.save();
    } else {
      // Verify thread exists and belongs to this user and assistant
      threadDoc = await ThreadModel.findOne({
        threadId,
        userId,
        assistantId,
        domain,
      });
      
      if (!threadDoc) {
        throw new Error("Thread not found or not accessible by this user");
      }
      
      // Update lastUsed timestamp
      await ThreadModel.updateOne(
        { _id: threadDoc._id },
        { $set: { lastUsed: new Date() } }
      );
    }
    
    logger.info(`Processing query on thread ${threadId}: "${query.substring(0, 50)}..."`);
    
    // Step 1: Add user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: query
    });
    
    // Step 2: Run the assistant
    // Note: No need to pass schema separately as it's already in the assistant's instructions
    const runOptions: OpenAI.Beta.Threads.Runs.RunCreateParams = {
      assistant_id: assistantId,
    };
    
    // For the first message in a thread, we need to include the schema
    // This ensures the assistant has context but we only send it once per thread
    const messages = await openai.beta.threads.messages.list(threadId);
    
    // If this is the first or second message (first from user + first from assistant)
    if (messages.data.length <= 2 && assistant.dbSchema) {
      runOptions.instructions = `Use the following MongoDB schema information to help understand the database structure:\n\n${JSON.stringify(assistant.dbSchema, null, 2)}\n\nRemember to generate valid MongoDB queries based on the user's question.`;
      
      // In debug mode, save the schema instructions
      if (debugMode) {
        debugInfo.aiRequests.queryGeneration = runOptions.instructions;
      }
    }
    
    const run = await openai.beta.threads.runs.create(threadId, runOptions);
    
    // Wait for the assistant to generate a response
    await waitForRunCompletion(threadId, run.id);
    
    // Step 3: Retrieve the assistant's response (MongoDB query)
    const updatedMessages = await openai.beta.threads.messages.list(threadId);
    const lastAssistantMessage = updatedMessages.data
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
    
    // Get the dynamic model for the collection
    const model = connection.collection(mongoQuery.collection);
    
    // Execute the query
    let results: Document[] = [];
    if (mongoQuery.operation === "find") {
      results = await model.find(mongoQuery.query as Record<string, unknown>).limit(100).toArray();
    } else if (mongoQuery.operation === "aggregate") {
      results = await model.aggregate(mongoQuery.query as Array<Record<string, unknown>>).limit(100).toArray();
    }
    
    // Calculate query execution time
    debugInfo.executionTime = Date.now() - queryStartTime;
    
    // Store results for debugging
    if (debugMode) {
      debugInfo.queryResults = results;
    }
    
    // Step 5: Send the results back to the assistant for formatting
    const resultsMessage = `Query results (${results.length} documents):\n\n${JSON.stringify(results, null, 2)}`;
    
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: resultsMessage
    });
    
    // Run the assistant again to format the results
    const formattingRun = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: "Format these MongoDB query results into a clear, human-friendly response in Farsi. Use HTML formatting for tables when appropriate. For empty results, provide helpful suggestions."
    });
    
    // Wait for formatting completion
    await waitForRunCompletion(threadId, formattingRun.id);
    
    // Get the formatted response
    const formattedMessages = await openai.beta.threads.messages.list(threadId);
    const formattedResponse = formattedMessages.data
      .filter(msg => msg.role === "assistant")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    
    if (!formattedResponse?.content || formattedResponse.content.length === 0) {
      throw new Error("No formatted response generated by the assistant");
    }
    
    // Extract the formatted text
    const formattedContent = formattedResponse.content[0];
    
    if (formattedContent.type !== "text") {
      throw new Error("Expected text content from assistant");
    }
    
    const formattedText = formattedContent.text.value;
    
    // Calculate total time
    const totalTime = Date.now() - startTime;
    
    // Build the response
    const response = {
      success: true,
      content: formattedText,
      executionTime: totalTime,
      threadId,
      debug: debugMode ? debugInfo : undefined
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error("Error processing query:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process query", 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 