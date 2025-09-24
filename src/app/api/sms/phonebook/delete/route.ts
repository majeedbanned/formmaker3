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
    const { bookId } = await request.json();
    
    // Validate required fields
    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }
    
    // Get domain from request headers
    const domain = request.headers.get('x-domain') || 'localhost:3000';
    
    // Delete phonebook
    const result = await smsApi.deletePhonebook(domain, bookId, user.schoolCode);
    
    return NextResponse.json({ 
      success: true,
      result
    });
  } catch (error) {
    console.error("Error deleting phonebook:", error);
    return NextResponse.json(
      { error: "Failed to delete phonebook" },
      { status: 500 }
    );
  }
} 