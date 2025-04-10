import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { logger } from "@/lib/logger";

// Collections
const THREADS_COLLECTION = "ai_threads";

// Define types for MongoDB queries
interface MongoDBQuery {
  collection: string;
  operation: "find" | "aggregate";
  query: Record<string, unknown> | Array<Record<string, unknown>>;
}

// Define debug info interface
interface DebugInfo {
  assistantInstructions?: string;
  mongoQuery: Array<Record<string, unknown>>;
  queryResults: Array<unknown>;
  rawAssistantResponse?: string;
  timings?: Record<string, number>;
  tokenUsage?: {
    userMessageTokens?: number;
    assistantResponseTokens?: number;
    totalTokens?: number;
  };
  [key: string]: unknown;
}

// Define message interfaces
interface UserMessage {
  role: "user";
  content: string;
  createdAt: Date;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
  createdAt: Date;
  debug: DebugInfo | null;
}

// Define ThreadDocument interface for MongoDB
interface ThreadDocument {
  threadId: string;
  messages: Array<UserMessage | AssistantMessage>;
  updatedAt: Date;
  [key: string]: unknown;
}

// Execute a MongoDB query
const executeMongoDBQuery = async (domain: string, queryData: MongoDBQuery) => {
  try {
    const { collection, operation, query } = queryData;
    
    if (!collection || !operation || !query) {
      throw new Error("Invalid MongoDB query structure");
    }
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Get the collection
    const coll = connection.db.collection(collection);
    
    // Execute the query
    let results = [];
    
    if (operation === "find") {
      // For find operations
      const cursor = coll.find(query as Record<string, unknown>);
      
      // Apply limit to prevent excessive data retrieval
      const limitedCursor = cursor.limit(100);
      
      // Convert cursor to array
      results = await limitedCursor.toArray();
    } else if (operation === "aggregate") {
      // For aggregate operations
      // Apply limit to prevent excessive data retrieval if not already present
      let hasLimit = false;
      const aggregateQuery = query as Array<Record<string, unknown>>;
      let queryToExecute = [...aggregateQuery];
      
      for (const stage of aggregateQuery) {
        if (stage.$limit !== undefined) {
          hasLimit = true;
          break;
        }
      }
      
      if (!hasLimit) {
        // Add a $limit stage at the end
        queryToExecute = [...aggregateQuery, { $limit: 100 }];
      }
      
      // Execute the aggregation
      const cursor = coll.aggregate(queryToExecute);
      results = await cursor.toArray();
    } else {
      throw new Error("Operation must be 'find' or 'aggregate'");
    }
    
    return results;
  } catch (error) {
    logger.error("Error executing MongoDB query:", error);
    throw error;
  }
};

// Define the OpenAI message interface
interface OpenAIMessage {
  role: string;
  content: Array<{
    type: string;
    text?: {
      value: string;
    };
  }>;
}

// Get assistant instructions
const getAssistantInstructions = async (domain: string, assistantId: string) => {
  try {
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // First, try to get from OpenAI directly
    const response = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.instructions || "No instructions found.";
    }
    
    return "Could not retrieve assistant instructions.";
  } catch (error) {
    logger.error("Error getting assistant instructions:", error);
    return "Error retrieving assistant instructions.";
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const domain = request.headers.get("x-domain") || "parsamooz";
    
    // Get request body
    const body = await request.json();
    const { threadId, assistantId, message, debug = false } = body;
    
    if (!threadId || !assistantId || !message) {
      return NextResponse.json(
        { success: false, message: "Thread ID, Assistant ID, and message are required" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const connection = await connectToDatabase(domain);
    
    if (!connection.db) {
      throw new Error("Database connection failed");
    }
    
    // Start debug info
    const debugInfo: DebugInfo = {
      mongoQuery: [],
      queryResults: []
    };
    const timings: Record<string, number> = {};
    const startTime = Date.now();
    
    // Get assistant instructions if in debug mode
    if (debug) {
      debugInfo.assistantInstructions = await getAssistantInstructions(domain, assistantId);
    }
    
    // 1. Add the user message to the thread
    const messageStartTime = Date.now();
    
    // Estimate tokens for the user message (rough approximation - 1 token ~= 4 chars for English, might vary for Farsi)
    const estimatedUserTokens = Math.ceil(message.length / 4);
    if (debug) {
      debugInfo.tokenUsage = {
        userMessageTokens: estimatedUserTokens
      };
    }
    
    const addMessageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        role: "user",
        content: message
      })
    });
    
    if (!addMessageResponse.ok) {
      throw new Error(`Failed to add message to thread: ${addMessageResponse.statusText}`);
    }
    
    timings.addMessageTime = Date.now() - messageStartTime;
    
    // 2. Run the assistant on the thread
    const runStartTime = Date.now();
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        assistant_id: assistantId
      })
    });
    
    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.statusText}`);
    }
    
    const runData = await runResponse.json();
    const runId = runData.id;
    
    // 3. Wait for the run to complete or require action
    let run;
    let isRequiringAction = false;
    let waitLoops = 0;
    
    while (true) {
      // Wait a bit before checking status again
      await new Promise(resolve => setTimeout(resolve, 1000));
      waitLoops++;
      
      const checkStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2"
        }
      });
      
      if (!checkStatusResponse.ok) {
        throw new Error(`Failed to check run status: ${checkStatusResponse.statusText}`);
      }
      
      run = await checkStatusResponse.json();
      
      if (run.status === "completed") {
        break;
      } else if (run.status === "requires_action") {
        isRequiringAction = true;
        break;
      } else if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
        throw new Error(`Run ended with status: ${run.status}`);
      }
      
      // Continue waiting for other statuses (queued, in_progress)
    }
    
    timings.initialWaitTime = Date.now() - runStartTime;
    
    // 4. Handle function calls if required
    if (isRequiringAction && run.required_action?.type === "submit_tool_outputs") {
      const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
      const toolOutputs = [];
      
      // Track queries for debug mode
      if (debug) {
        debugInfo.mongoQuery = [];
        debugInfo.queryResults = [];
      }
      
      for (const toolCall of toolCalls) {
        if (toolCall.function.name === "executeMongoDBQuery") {
          try {
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            // Store query for debug mode
            if (debug) {
              debugInfo.mongoQuery.push(functionArgs);
            }
            
            const queryStartTime = Date.now();
            const queryResults = await executeMongoDBQuery(domain, functionArgs);
            timings.dbQueryTime = Date.now() - queryStartTime;
            
            // Store results for debug mode
            if (debug) {
              debugInfo.queryResults.push(queryResults);
            }
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(queryResults)
            });
          } catch (error) {
            logger.error("Error executing MongoDB query:", error);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: (error as Error).message })
            });
          }
        }
      }
      
      // Submit tool outputs back to OpenAI
      const submitToolsStartTime = Date.now();
      const submitToolsResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          tool_outputs: toolOutputs
        })
      });
      
      if (!submitToolsResponse.ok) {
        throw new Error(`Failed to submit tool outputs: ${submitToolsResponse.statusText}`);
      }
      
      // Wait for the run to complete after submitting tool outputs
      const finalWaitStartTime = Date.now();
      let finalWaitLoops = 0;
      
      while (true) {
        // Wait a bit before checking status again
        await new Promise(resolve => setTimeout(resolve, 1000));
        finalWaitLoops++;
        
        const checkStatusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2"
          }
        });
        
        if (!checkStatusResponse.ok) {
          throw new Error(`Failed to check run status: ${checkStatusResponse.statusText}`);
        }
        
        run = await checkStatusResponse.json();
        
        if (run.status === "completed") {
          break;
        } else if (run.status === "failed" || run.status === "cancelled" || run.status === "expired") {
          throw new Error(`Run ended with status: ${run.status}`);
        }
        
        // Continue waiting for other statuses (queued, in_progress)
      }
      
      timings.submitToolsTime = Date.now() - submitToolsStartTime;
      timings.finalWaitTime = Date.now() - finalWaitStartTime;
      timings.initialWaitLoops = waitLoops;
      timings.finalWaitLoops = finalWaitLoops;
    }
    
    // 5. Get the latest messages from the thread
    const messagesStartTime = Date.now();
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2"
      }
    });
    
    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
    }
    
    const messagesData = await messagesResponse.json();
    timings.getMessagesTime = Date.now() - messagesStartTime;
    
    // Get the latest assistant message
    const assistantMessages = messagesData.data.filter((msg: OpenAIMessage) => msg.role === "assistant");
    
    if (assistantMessages.length === 0) {
      throw new Error("No assistant messages found");
    }
    
    const latestMessage = assistantMessages[0];
    
    // Extract the text content
    let responseText = "";
    for (const content of latestMessage.content) {
      if (content.type === "text") {
        responseText += content.text?.value || "";
      }
    }
    
    // Estimate tokens for the assistant response
    if (debug && debugInfo.tokenUsage) {
      const estimatedResponseTokens = Math.ceil(responseText.length / 4);
      debugInfo.tokenUsage.assistantResponseTokens = estimatedResponseTokens;
      debugInfo.tokenUsage.totalTokens = (debugInfo.tokenUsage.userMessageTokens || 0) + estimatedResponseTokens;
    }
    
    // Store raw assistant response for debug mode
    if (debug) {
      debugInfo.rawAssistantResponse = JSON.stringify(latestMessage, null, 2);
    }
    
    // Update the thread in the database with the new messages
    const dbUpdateStartTime = Date.now();
    const threadsCollection = connection.db.collection<ThreadDocument>(THREADS_COLLECTION);
    
    // Create the message objects
    const userMsg: UserMessage = {
      role: "user",
      content: message,
      createdAt: new Date()
    };
    
    const assistantMsg: AssistantMessage = {
      role: "assistant",
      content: responseText,
      createdAt: new Date(),
      debug: debug ? debugInfo : null
    };
    
    // Update the document with the new messages
    // Use a type assertion to bypass MongoDB TypeScript limitations
    await threadsCollection.updateOne(
      { threadId },
      {
        $push: { 
          messages: { 
            $each: [userMsg, assistantMsg] 
          } 
        },
        $set: { updatedAt: new Date() }
      } as object
    );
    
    timings.dbUpdateTime = Date.now() - dbUpdateStartTime;
    timings.totalTime = Date.now() - startTime;
    
    if (debug) {
      debugInfo.timings = timings;
    }
    
    return NextResponse.json({ 
      success: true, 
      response: responseText,
      threadId,
      runId,
      debug: debug ? {
        assistantInstructions: debugInfo.assistantInstructions,
        timings: debugInfo.timings,
        // Include mongoQuery for admin debugging only
        mongoQuery: debugInfo.mongoQuery,
        // Include token usage information
        tokenUsage: debugInfo.tokenUsage,
        // Don't include raw results in response for regular users
        // queryResults: debugInfo.queryResults, 
        // Don't include raw assistant response in regular output
        // rawAssistantResponse: debugInfo.rawAssistantResponse
      } : null
    });
  } catch (error) {
    logger.error("Error in chat API:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process chat message",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 