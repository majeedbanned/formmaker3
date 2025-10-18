import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Path to version config file
const VERSION_CONFIG_PATH = path.join(process.cwd(), 'public', 'mobile-version.json');

// Interface for version config
interface PlatformVersion {
  version: string;
  versionCode: number;
  downloadUrl: string;
  forceUpdate: boolean;
  releaseNotes: string;
}

interface VersionConfig {
  android: PlatformVersion;
  ios: PlatformVersion;
  lastUpdated: string;
}

// Function to read version config from file
function getVersionConfig(): VersionConfig {
  try {
    const fileContent = fs.readFileSync(VERSION_CONFIG_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading version config:', error);
    // Fallback to default values
    return {
      android: {
        version: '2.0.0',
        versionCode: 7,
        downloadUrl: 'https://farsamooz.ir/uploads/parsamooz-latest.apk',
        forceUpdate: false,
        releaseNotes: 'نسخه جدید در دسترس است'
      },
      ios: {
        version: '2.0.0',
        versionCode: 7,
        downloadUrl: 'https://apps.apple.com/app/your-app-id',
        forceUpdate: false,
        releaseNotes: 'نسخه جدید در دسترس است'
      },
      lastUpdated: new Date().toISOString()
    };
  }
}

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

    // Read version config from file
    const versionConfig = getVersionConfig();
    const platformConfig = versionConfig[platform];

    // Check if update is available by comparing version codes
    const updateAvailable = versionCode < platformConfig.versionCode;
    console.log('Current versionCode:', versionCode);
    console.log('Latest versionCode:', platformConfig.versionCode);
    console.log('Update available:', updateAvailable);

    const response: VersionCheckResponse = {
      success: true,
      updateAvailable,
      latestVersion: platformConfig.version,
      latestVersionCode: platformConfig.versionCode,
      downloadUrl: updateAvailable ? platformConfig.downloadUrl : undefined,
      releaseNotes: updateAvailable ? platformConfig.releaseNotes : undefined,
      forceUpdate: updateAvailable ? platformConfig.forceUpdate : false,
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

// Handle GET request for simple version check
export async function GET(request: NextRequest) {
  try {
    const versionConfig = getVersionConfig();
    
    return NextResponse.json({
      success: true,
      android: {
        version: versionConfig.android.version,
        versionCode: versionConfig.android.versionCode,
        downloadUrl: versionConfig.android.downloadUrl
      },
      ios: {
        version: versionConfig.ios.version,
        versionCode: versionConfig.ios.versionCode,
        downloadUrl: versionConfig.ios.downloadUrl
      },
      lastUpdated: versionConfig.lastUpdated,
      message: 'آخرین نسخه موجود'
    });
  } catch (error) {
    console.error('Error getting version info:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت اطلاعات نسخه' },
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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

