import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get the bookId from the query parameters
    const url = new URL(request.url);
    const bookId = url.searchParams.get("bookId");
    
    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }
    
    // Get phonebook numbers
    const numbers = await smsApi.getPhonebookNumbers(bookId);
    
    return NextResponse.json({ 
      numbers: numbers || []
    });
  } catch (error) {
    console.error("Error fetching phonebook numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phonebook numbers" },
      { status: 500 }
    );
  }
} 