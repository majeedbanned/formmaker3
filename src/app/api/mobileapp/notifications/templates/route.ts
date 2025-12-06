import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

interface JWTPayload {
  userId: string;
  domain: string;
  schoolCode: string;
  role: string;
  userType: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Default notification templates
const DEFAULT_TEMPLATES = [
  { id: '1', title: 'یادآوری امتحان', content: 'یادآوری: فردا امتحان دارید. لطفاً آماده باشید.', isDefault: true },
  { id: '2', title: 'اطلاع‌رسانی کلاس', content: 'کلاس فردا ساعت ۸ صبح برگزار می‌شود.', isDefault: true },
  { id: '3', title: 'پیام مهم', content: 'یک پیام مهم برای شما: ', isDefault: true },
  { id: '4', title: 'تبریک', content: 'تبریک! عملکرد شما عالی بوده است.', isDefault: true },
  { id: '5', title: 'یادآوری تکلیف', content: 'یادآوری: تکلیف خود را فراموش نکنید.', isDefault: true },
];

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'توکن احراز هویت الزامی است' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر یا منقضی شده است' },
        { status: 401 }
      );
    }

    // Return default templates
    // Note: Custom templates could be added later from database if needed
    return NextResponse.json({
      success: true,
      data: {
        defaultTemplates: DEFAULT_TEMPLATES,
        customTemplates: [],
        allTemplates: DEFAULT_TEMPLATES,
      },
    });
  } catch (error) {
    console.error('Notification templates GET API error:', error);
    return NextResponse.json(
      { success: false, message: 'خطای سرور داخلی' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


