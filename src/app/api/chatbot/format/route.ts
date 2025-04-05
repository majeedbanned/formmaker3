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
      temperature: 0.7,
      max_tokens: 2000,
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
      temperature: 0.7,
      max_tokens: 2000,
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
    const { originalQuery, results, model } = body;
    
    // Validate inputs
    if (!originalQuery) {
      return NextResponse.json(
        { success: false, message: "Original query is required" },
        { status: 400 }
      );
    }
    
    if (!results) {
      return NextResponse.json(
        { success: false, message: "Query results are required" },
        { status: 400 }
      );
    }
    
    if (!model || (model !== "gpt" && model !== "llama")) {
      return NextResponse.json(
        { success: false, message: "Valid model selection is required" },
        { status: 400 }
      );
    }
    
    // Limit results to prevent token limit issues
    const limitedResults = Array.isArray(results) && results.length > 10 
      ? results.slice(0, 10) 
      : results;
    
    // Create a prompt for formatting the results
    const systemPrompt = `
You are a helpful assistant who formats MongoDB query results into readable, user-friendly responses in Farsi (Persian language).

The user asked the following question:
"${originalQuery}"

Below are the raw results from the database:
${JSON.stringify(limitedResults, null, 2)}

Your task is to:
1. Provide a clear, concise summary of the results in Farsi
2. Format the relevant data in a readable way
3. If the results are empty, explain that no matching data was found
4. If there are more than 10 results, mention that only the first 10 are shown
5. Include relevant statistics if appropriate (total count, averages, etc.)

Your response should be entirely in Farsi and should focus on answering the user's original question directly.
`;

    const userMessage = "لطفاً نتایج پرس و جو را به شکل خوانا و کاربرپسند به فارسی فرمت‌بندی کنید.";
    let formattedResponse = "";
    const startTime = Date.now();
    
    // Call the appropriate AI model
    if (model === "gpt") {
      // Call OpenAI API (GPT-4 Turbo)
      formattedResponse = await callOpenAI(systemPrompt, userMessage);
    } else {
      // Call Groq API (Llama 3)
      formattedResponse = await callGroq(systemPrompt, userMessage);
    }
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log the response time
    logger.info(`AI formatting response time: ${responseTime}ms`);
    
    // Fallback if no response is generated
    if (!formattedResponse) {
      formattedResponse = "متأسفانه در فرمت‌بندی پاسخ خطایی رخ داد. لطفاً دوباره تلاش کنید.";
    }
    
    // Prepare debug information
    const debug = {
      prompt: {
        system: systemPrompt,
        user: userMessage
      },
      model,
      resultsCount: Array.isArray(results) ? results.length : (results ? 1 : 0),
      limitedResultsCount: Array.isArray(limitedResults) ? limitedResults.length : (limitedResults ? 1 : 0),
      responseTime,
      responseLength: formattedResponse.length
    };
    
    return NextResponse.json(
      { 
        success: true, 
        formattedResponse,
        debug
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error formatting response:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to format response",
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
} 