import { NextResponse } from "next/server";

// Set runtime to nodejs
export const runtime = 'nodejs';

export async function PATCH() {
  return new NextResponse(
    JSON.stringify({ 
      message: "File renaming is not allowed. Only folders can be renamed.",
      error: "OPERATION_NOT_SUPPORTED" 
    }),
    { status: 403 }
  );
} 