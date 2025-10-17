import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Configuration for app versions and download URLs
const LATEST_APP_VERSION = '2.0.0';
const LATEST_VERSION_CODE = 7;
const APP_DOWNLOAD_URL = 'https://parsamooz.ir/uploads/parsamooz-latest.apk'; // Update this to your actual URL

interface VersionCheckRequest {
  currentVersion: string;
  versionCode: number;
  platform: 'android' | 'ios';
}

interface VersionCheckResponse {
  success: boolean;
  updateAvailable: boolean;
  latestVersion?: string;
  latestVersionCode?: number;
  downloadUrl?: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VersionCheckRequest = await request.json();
    const { currentVersion, versionCode, platform } = body;

    // Validate required fields
    if (!currentVersion || !versionCode || !platform) {
      return NextResponse.json(
        { 
          success: false, 
          updateAvailable: false,
          message: 'اطلاعات نسخه الزامی است' 
        },
        { status: 400 }
      );
    }

    console.log('Version check request:', {
      currentVersion,
      versionCode,
      platform
    });

    // Check if update is available by comparing version codes
    const updateAvailable = versionCode < LATEST_VERSION_CODE;

    // Determine download URL based on platform
    let downloadUrl = APP_DOWNLOAD_URL;
    
    // For Android, use APK download URL
    // For iOS, you might want to use App Store link
    if (platform === 'ios') {
      // Replace with your App Store link when available
      downloadUrl = 'https://apps.apple.com/app/your-app-id';
    }

    const response: VersionCheckResponse = {
      success: true,
      updateAvailable,
      latestVersion: LATEST_APP_VERSION,
      latestVersionCode: LATEST_VERSION_CODE,
      downloadUrl: updateAvailable ? downloadUrl : undefined,
      releaseNotes: updateAvailable ? getReleaseNotes() : undefined,
      forceUpdate: false, // Set to true if this is a critical update
      message: updateAvailable 
        ? 'نسخه جدید در دسترس است' 
        : 'شما از آخرین نسخه استفاده می‌کنید'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Version check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        updateAvailable: false,
        message: 'خطا در بررسی نسخه' 
      },
      { status: 500 }
    );
  }
}

// Get release notes for the latest version
function getReleaseNotes(): string {
  return `نسخه ${LATEST_APP_VERSION}:
• بهبود عملکرد برنامه
• رفع مشکلات گزارش شده
• افزودن قابلیت‌های جدید
• بهینه‌سازی رابط کاربری`;
}

// Handle GET request for simple version check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    latestVersion: LATEST_APP_VERSION,
    latestVersionCode: LATEST_VERSION_CODE,
    message: 'آخرین نسخه موجود'
  });
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

