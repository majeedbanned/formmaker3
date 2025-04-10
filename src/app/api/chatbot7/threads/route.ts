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

// Create a new OpenAI thread
const createOpenAIThread = async () => {
  try {
    const response = await fetch(`${OPENAI_API_URL}/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2" // Include this header
      },
    });

    if (!response.ok) {
      const errorDetails = await response.json();
      console.error("OpenAI API error details:", errorDetails);
      throw new Error(`Failed to create OpenAI thread: ${errorDetails.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error("Error creating OpenAI thread:", error);
    throw error;
  }
};

// GET - Fetch user threads
export async function GET(request: Request) {
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

    // Connect to the database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_threads");

    // Fetch threads for the user
    const threads = await collection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Transform the threads to include message data
    const transformedThreads = await Promise.all(
      threads.map(async (thread) => {
        // Fetch messages for this thread
        const messagesCollection = connection.collection("openai_messages");
        const messages = await messagesCollection
          .find({ threadId: thread.threadId })
          .sort({ timestamp: 1 })
          .toArray();

        return {
          id: thread.threadId,
          name: thread.name,
          createdAt: thread.createdAt,
          messages: messages.map((msg) => ({
            id: msg._id.toString(),
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            debug: msg.debug || null,
          })),
        };
      })
    );

    return NextResponse.json({ threads: transformedThreads });
  } catch (error) {
    console.error("Error in GET /api/chatbot7/threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
}

// POST - Create a new thread
export async function POST(request: Request) {
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

    // Create a new thread in OpenAI
    const threadId = await createOpenAIThread();

    // Connect to the database
    const connection = await connectToDatabase(domain);
    const collection = connection.collection("openai_threads");

    // Create thread document
    const thread = {
      _id: new ObjectId(),
      threadId,
      userId: user.id,
      name: `گفتگو ${new Date().toLocaleDateString("fa-IR")}`,
      createdAt: new Date(),
    };

    // Save the thread to the database
    await collection.insertOne(thread);

    return NextResponse.json({ threadId });
  } catch (error) {
    console.error("Error in POST /api/chatbot7/threads:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
} 