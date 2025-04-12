import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { bookId, numbers } = await request.json();
    
    // Validate required fields
    if (!bookId || !numbers || !Array.isArray(numbers)) {
      return NextResponse.json(
        { error: "Missing required fields or invalid format" },
        { status: 400 }
      );
    }
    
    // Delete numbers from phonebook
    const result = await smsApi.deleteNumbersFromPhonebook(bookId, numbers);
    
    return NextResponse.json({ 
      success: true,
      result
    });
  } catch (error) {
    console.error("Error deleting numbers from phonebook:", error);
    return NextResponse.json(
      { error: "Failed to delete numbers from phonebook" },
      { status: 500 }
    );
  }
} 