import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Use fetch instead of client libraries
const callOpenAI = async (systemPrompt: string, userMessage: string) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

const callGroq = async (systemPrompt: string, userMessage: string) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
};

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { query, model, schema } = body;
    
    // Validate inputs
    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 }
      );
    }
    
    if (!model || (model !== "gpt" && model !== "llama")) {
      return NextResponse.json(
        { success: false, message: "Valid model selection is required" },
        { status: 400 }
      );
    }
    
    // Create prompt for AI model
    const systemPrompt = `
You are a MongoDB query generator for a database with the following schema:
${JSON.stringify(schema, null, 2)}

Your task is to:
1. Understand the user's query in Farsi (Persian language)
2. Generate an appropriate MongoDB query that would answer their question
3. Return only valid MongoDB query code in JSON format, without any explanations or markdown

The query should be in the format:
{
  "collection": "collectionName",
  "operation": "find" | "aggregate",
  "query": <MongoDB query object>
}

For example:
{
  "collection": "students",
  "operation": "find",
  "query": { "grade": { "$gte": 90 } }
}

Or for aggregation:
{
  "collection": "students",
  "operation": "aggregate",
  "query": [
    { "$match": { "grade": { "$gte": 90 } } },
    { "$group": { "_id": "$class", "count": { "$sum": 1 } } }
  ]
}

Focus on precision and correctness of the MongoDB syntax.
`;

    const userMessage = query;
    let mongoQuery = "";
    
    // Call the appropriate AI model
    if (model === "gpt") {
      // Call OpenAI API (GPT-4 Turbo)
      mongoQuery = await callOpenAI(systemPrompt, userMessage);
    } else {
      // Call Groq API (Llama 3)
      mongoQuery = await callGroq(systemPrompt, userMessage);
    }
    
    // Log the raw AI response for debugging
    logger.info(`Raw AI response for query "${query.substring(0, 50)}...": ${mongoQuery.substring(0, 200)}...`);
    
    // Extract JSON from response if needed
    let parsedQuery;
    const rawAiResponse = mongoQuery;
    
    try {
      // Check if the response is already JSON or contains JSON
      if (mongoQuery.trim().startsWith("{")) {
        parsedQuery = JSON.parse(mongoQuery);
      } else {
        // Extract JSON block if it's formatted in markdown or has additional text
        // Using a more compatible regex without the 's' flag
        const jsonMatch = mongoQuery.match(/```(?:json)?([\s\S]*?)```/);
        if (jsonMatch && jsonMatch[1]) {
          parsedQuery = JSON.parse(jsonMatch[1].trim());
        } else {
          throw new Error("No valid JSON found in response");
        }
      }
    } catch (err) {
      logger.error("Error parsing AI-generated query:", err);
      throw new Error("Failed to parse MongoDB query from AI response");
    }
    
    // Validate the generated query
    if (!parsedQuery || !parsedQuery.collection || !parsedQuery.operation || !parsedQuery.query) {
      throw new Error("AI did not generate a valid MongoDB query");
    }
    
    // Create a readable version of the query for debugging
    let readableQuery = "";
    if (parsedQuery.operation === "find") {
      readableQuery = `db.${parsedQuery.collection}.find(${JSON.stringify(parsedQuery.query, null, 2)})`;
    } else {
      readableQuery = `db.${parsedQuery.collection}.aggregate(${JSON.stringify(parsedQuery.query, null, 2)})`;
    }
    
    return NextResponse.json(
      { 
        success: true, 
        mongoQuery: JSON.stringify(parsedQuery, null, 2),
        rawQuery: parsedQuery,
        debug: {
          prompt: {
            system: systemPrompt,
            user: userMessage
          },
          rawAiResponse,
          readableQuery
        }
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating MongoDB query:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to generate MongoDB query",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 