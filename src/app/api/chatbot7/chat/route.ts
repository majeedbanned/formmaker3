import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJWT } from "@/lib/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Constants for OpenAI API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1";

// Set runtime to nodejs
export const runtime = 'nodejs';

interface ChatRequestBody {
  threadId: string;
  message: string;
  assistantId: string;
}

interface MongoQuery {
  collection: string;
  operation: string;
  query: unknown;
}

interface AssistantMessage {
  content: Array<{
    text?: {
      value: string;
    };
  }>;
  role: string;
}

// Verify and get current user from auth token
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJWT(token) as {
      userId: string;
      userType: string;
      schoolCode: string;
      username: string;
    };

    return {
      id: payload.userId,
      userType: payload.userType,
      schoolCode: payload.schoolCode,
      username: payload.username,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Add a message to a thread
const addMessageToThread = async (threadId: string, message: string) => {
  try {
    const response = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add message to thread");
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error adding message to thread:", error);
    throw error;
  }
};

// Create and wait for a run to complete
// const runAssistant = async (threadId: string, assistantId: string): Promise<AssistantMessage> => {
//   // Create a run
//   const createRunResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//       "OpenAI-Beta": "assistants=v2",
//     },
//     body: JSON.stringify({
//       assistant_id: assistantId,
//     }),
//   });

//   if (!createRunResponse.ok) {
//     throw new Error("Failed to create run");
//   }

//   const runData = await createRunResponse.json();
//   const runId = runData.id;

//   // Poll the run status until it's completed or fails
//   let runStatus: string = "queued";
//   while (runStatus === "queued" || runStatus === "in_progress") {
//     // Wait for a short duration before checking status again
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     const runStatusResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs/${runId}`, {
//       method: "GET",
//       headers: {
//         Authorization: `Bearer ${OPENAI_API_KEY}`,
//         "OpenAI-Beta": "assistants=v2",
//       },
//     });

//     if (!runStatusResponse.ok) {
//       throw new Error("Failed to check run status");
//     }

//     const statusData = await runStatusResponse.json();
//     runStatus = statusData.status;

//     // Handle failed or cancelled runs
//     if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
//       throw new Error(`Run ${runStatus}: ${statusData.last_error?.message || "Unknown error"}`);
//     }
//   }

//   // Get the latest messages
//   const messagesResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//     },
//   });

//   if (!messagesResponse.ok) {
//     throw new Error("Failed to retrieve messages");
//   }

//   const messagesData = await messagesResponse.json();
//   // The first message should be the latest assistant's response
//   return messagesData.data.find((msg: AssistantMessage) => msg.role === "assistant");
// };

const runAssistant = async (threadId: string, assistantId: string): Promise<AssistantMessage> => {
    // console.log(`Starting runAssistant with threadId: ${threadId} and assistantId: ${assistantId}`);
  
    // Step 1: Create a run
    // console.log('Creating a new run for the thread...');
    const createRunResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({ assistant_id: assistantId }),
    });
  
    if (!createRunResponse.ok) {
      const errorText = await createRunResponse.text();
      console.error(`Failed to create run. Status: ${createRunResponse.status}, Response: ${errorText}`);
      throw new Error("Failed to create run");
    }
  
    const runData = await createRunResponse.json();
    const runId = runData.id;
    // console.log(`Run created successfully with runId: ${runId}`);
  
    // Step 2: Poll the run status until completion
    let runStatus = "queued";
    // console.log('Polling run status...');
    while (runStatus === "queued" || runStatus === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
  
      const runStatusResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/runs/${runId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      });
  
      if (!runStatusResponse.ok) {
        const errorText = await runStatusResponse.text();
        console.error(`Failed to retrieve run status. Status: ${runStatusResponse.status}, Response: ${errorText}`);
        throw new Error("Failed to check run status");
      }
  
      const statusData = await runStatusResponse.json();
      runStatus = statusData.status;
      // console.log(`Current run status: ${runStatus}`);
  
      if (runStatus === "failed" || runStatus === "cancelled" || runStatus === "expired") {
        console.error(`Run terminated with status: ${runStatus}. Error: ${statusData.last_error?.message || "Unknown error"}`);
        throw new Error(`Run ${runStatus}: ${statusData.last_error?.message || "Unknown error"}`);
      }
    }
  
    // Step 3: Retrieve the latest messages
    // console.log('Retrieving messages from the thread...');
    const messagesResponse = await fetch(`${OPENAI_API_URL}/threads/${threadId}/messages`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
    });
  
    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error(`Failed to retrieve messages. Status: ${messagesResponse.status}, Response: ${errorText}`);
      throw new Error("Failed to retrieve messages");
    }
  
    const messagesData = await messagesResponse.json();
    const assistantMessage = messagesData.data.find((msg: AssistantMessage) => msg.role === "assistant");
  
    if (!assistantMessage) {
      console.warn('No assistant message found in the thread.');
      throw new Error("No assistant message found");
    }
  
    // console.log('Assistant message retrieved successfully.');
    return assistantMessage;
  };
  
// Execute MongoDB query
const executeMongoQuery = async (query: MongoQuery, domain: string): Promise<unknown> => {
  try {
    const connection = await connectToDatabase(domain);
    const collection = connection.collection(query.collection);

    // Determine the operation type and execute
    if (query.operation === "find") {
      return await collection.find(query.query as Record<string, unknown>).toArray();
    } else if (query.operation === "aggregate") {
      // For aggregate, the query should be an array of pipeline stages
      return await collection.aggregate(query.query as unknown[]).toArray();
    } else if (query.operation === "count") {
      return await collection.countDocuments(query.query as Record<string, unknown>);
    } else {
      throw new Error(`Unsupported operation: ${query.operation}`);
    }
  } catch (error) {
    console.error("Error executing MongoDB query:", error);
    throw error;
  }
};

// Save message to database
const saveMessageToDatabase = async (
  threadId: string,
  role: "user" | "assistant",
  content: string,
  debug: Record<string, unknown> | null,
  domain: string
) => {
  try {
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_messages");

    const message = {
      _id: new ObjectId(),
      threadId,
      role,
      content,
      timestamp: new Date(),
      debug,
    };

    await collection.insertOne(message);
    return message;
  } catch (error) {
    console.error("Error saving message to database:", error);
    throw error;
  }
};

// Parse MongoDB query from assistant's message
const parseMongoQuery = (assistantMessage: AssistantMessage): MongoQuery | null => {
  try {
    // Find code blocks in the message content
    const content = assistantMessage.content[0]?.text?.value || "";
    
    // Try to find JSON blocks with MongoDB queries
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const jsonContent = jsonMatch[1].trim();
      const parsedQuery = JSON.parse(jsonContent);
      
      // Check if it's a valid MongoDB query with collection and operation
      if (parsedQuery && parsedQuery.collection && parsedQuery.operation) {
        return parsedQuery as MongoQuery;
      }
    }
    
    // Fallback: try to find any JSON in the content
    const matches = content.match(/({[\s\S]*})/);
    if (matches && matches[1]) {
      try {
        const parsedJson = JSON.parse(matches[1].trim());
        if (parsedJson && parsedJson.collection && parsedJson.operation) {
          return parsedJson as MongoQuery;
        }
      } catch {
        // Parsing failed, continue to return null
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing MongoDB query:", error);
    return null;
  }
};

// POST - Process a chat message
export async function POST(request: Request) {
  const timings: Record<string, number> = {
    start: Date.now(),
  };

  try {
    // Get domain from headers
    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as ChatRequestBody;
    const { threadId, message, assistantId } = body;

    if (!threadId || !message || !assistantId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Save user message to database
    await saveMessageToDatabase(threadId, "user", message, null, domain);

    // Step 1: Add the user message to the thread
    timings.addMessage = Date.now();
    await addMessageToThread(threadId, message);
    timings.addMessageComplete = Date.now();

    // Step 2: Run the assistant
    timings.runAssistant = Date.now();
    const assistantMessage = await runAssistant(threadId, assistantId);
    timings.runAssistantComplete = Date.now();

    // Step 3: Parse MongoDB query from the assistant's response
    timings.parseQuery = Date.now();
    const mongoQuery = parseMongoQuery(assistantMessage);
    timings.parseQueryComplete = Date.now();

    // Debug information
    const debug: Record<string, unknown> = {
      rawResponse: assistantMessage.content[0]?.text?.value || "",
      mongoQuery: mongoQuery,
      timings: {},
      queryResults: null,
    };

    let finalResponse = "";

    // Step 4: If query exists, execute it
    if (mongoQuery) {
      timings.executeQuery = Date.now();
      try {
        const queryResults = await executeMongoQuery(mongoQuery, domain);
        timings.executeQueryComplete = Date.now();
        debug.queryResults = queryResults;

        // Step 5: Send the query results back to the assistant for formatting
        timings.formatResults = Date.now();
        await addMessageToThread(
          threadId,
          `نتیجه کوئری MongoDB به این شکل است:\n\`\`\`json\n${JSON.stringify(
            queryResults
          )}\n\`\`\`\nلطفا این نتیجه را به فارسی و به شکل انسان‌پسند و زیبا فرمت‌بندی کنید.`
        );

        // Run the assistant again to format the results
        const formattedResponse = await runAssistant(threadId, assistantId);
        timings.formatResultsComplete = Date.now();

        finalResponse = formattedResponse.content[0]?.text?.value || "";
      } catch (error) {
        console.error("Error executing MongoDB query:", error);
        
        // Send the error back to the assistant for handling
        timings.handleError = Date.now();
        await addMessageToThread(
          threadId,
          `خطایی در اجرای کوئری MongoDB رخ داد:\n\`\`\`\n${error}\n\`\`\`\nلطفا پاسخ مناسبی به کاربر بدهید.`
        );

        // Run the assistant again to handle the error
        const errorResponse = await runAssistant(threadId, assistantId);
        timings.handleErrorComplete = Date.now();

        finalResponse = errorResponse.content[0]?.text?.value || "";
      }
    } else {
      // No MongoDB query found in the response, just use the assistant's response directly
      finalResponse = assistantMessage.content[0]?.text?.value || "";
    }

    // Calculate and add timings to debug info
    timings.end = Date.now();
    const timingsRecord: Record<string, number> = {
      total: timings.end - timings.start,
      addMessage: timings.addMessageComplete - timings.addMessage,
      runAssistant: timings.runAssistantComplete - timings.runAssistant,
      parseQuery: timings.parseQueryComplete - timings.parseQuery,
    };

    if (timings.executeQuery) {
      timingsRecord.executeQuery = timings.executeQueryComplete - timings.executeQuery;
    }

    if (timings.formatResults) {
      timingsRecord.formatResults = timings.formatResultsComplete - timings.formatResults;
    }

    if (timings.handleError) {
      timingsRecord.handleError = timings.handleErrorComplete - timings.handleError;
    }

    debug.timings = timingsRecord;

    // Save the assistant's final response to the database
    await saveMessageToDatabase(threadId, "assistant", finalResponse, debug, domain);

    return NextResponse.json({
      message: finalResponse,
      mongoQuery: mongoQuery,
      queryResults: debug.queryResults,
      rawResponse: debug.rawResponse,
      timings: timingsRecord,
    });
  } catch (error) {
    console.error("Error in POST /api/chatbot7/chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
} 