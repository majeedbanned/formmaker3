import { NextResponse } from "next/server";
import { smsApi } from "@/lib/smsService";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get phonebooks
    const phonebooksData = await smsApi.listPhonebooks();
    
    // Format phonebooks data
    // Phonebooks come as an array where even indices are IDs and odd indices are names
    const phonebooks = [];
    if (Array.isArray(phonebooksData)) {
      for (let i = 0; i < phonebooksData.length; i += 2) {
        if (phonebooksData[i] && phonebooksData[i+1]) {
          phonebooks.push({
            id: phonebooksData[i],
            name: phonebooksData[i+1]
          });
        }
      }
    }
    
    return NextResponse.json({ phonebooks });
  } catch (error) {
    console.error("Error listing phonebooks:", error);
    return NextResponse.json(
      { error: "Failed to list phonebooks" },
      { status: 500 }
    );
  }
} 