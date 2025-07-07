import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/jwt';
import { ModuleConfig, PageModuleConfiguration } from '@/types/modules';
import { getRequiredModules } from '@/lib/moduleRegistry';
import fs from 'fs';
import path from 'path';

// Verify and get current user from auth token
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyJWT(token) as {
      userId: string;
      userType: string;
      schoolCode: string;
      username: string;
      name: string;
      role: string;
    };

    return {
      id: payload.userId,
      userType: payload.userType,
      schoolCode: payload.schoolCode,
      username: payload.username,
      name: payload.name,
      role: payload.role,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}

// Get schoolCode from domain using database.json
function getSchoolCodeFromDomain(domain: string): string | null {
  try {
    const configPath = path.join(process.cwd(), 'src/config/database.json');
    const configData = fs.readFileSync(configPath, 'utf8');
    const databaseConfig = JSON.parse(configData);
    
    const config = databaseConfig[domain];
    return config?.schoolCode || null;
  } catch (error) {
    console.error("Error reading database config:", error);
    return null;
  }
}

// GET: Fetch module configuration for a page
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || 'home';

    const domain = request.headers.get("x-domain") || "localhost:3000";
    
    // Determine schoolCode from domain (for all users, including guests)
    const schoolCodeFromDomain = getSchoolCodeFromDomain(domain);
    
    // Use schoolCode from domain if available, fallback to user's schoolCode
    const schoolId = schoolCodeFromDomain || user?.schoolCode;

    const connection = await connectToDatabase(domain);
    const collection = connection.collection('pageModules');

    // Find existing configuration for this school/domain
    let moduleConfig: any = await collection.findOne({
      schoolId: schoolId,
      pageId: pageId
    });
    
    // If no school-specific config found, try global config
    if (!moduleConfig) {
      moduleConfig = await collection.findOne({
        schoolId: null,
        pageId: pageId
      });
    }

    // If no configuration exists, create default with required modules
    if (!moduleConfig) {
      const requiredModules = getRequiredModules();
      const defaultModules: ModuleConfig[] = requiredModules.map((module, index) => ({
        id: `${module.type}_${Date.now()}_${index}`,
        type: module.type,
        order: index,
        isVisible: true,
        isEnabled: true,
        config: module.defaultConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const newModuleConfig = {
        schoolId: schoolId || null, // Use null for guest users
        pageId,
        pageName: pageId === 'home' ? 'صفحه اصلی' : pageId,
        modules: defaultModules,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Only create default configuration if user is authenticated and we have a schoolId
      // For guest users, just return the default without saving
      if (user && schoolId) {
        const result = await collection.insertOne(newModuleConfig);
        moduleConfig = { ...newModuleConfig, _id: result.insertedId };
              } else {
          // For guests, return the configuration without _id
          moduleConfig = newModuleConfig;
        }
    }

    return NextResponse.json({ 
      success: true, 
      data: moduleConfig 
    });

  } catch (error) {
    console.error('Error fetching module configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update module configuration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId = 'home', modules } = body;
    const schoolId = user.schoolCode;

    if (!modules || !Array.isArray(modules)) {
      return NextResponse.json(
        { error: 'Invalid modules data' },
        { status: 400 }
      );
    }

    // Validate modules
    const validatedModules: ModuleConfig[] = modules.map((module, index) => ({
      ...module,
      order: index, // Ensure order is correct
      updatedAt: new Date(),
      createdAt: module.createdAt || new Date(),
    }));

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('pageModules');

    const updateData: PageModuleConfiguration = {
      schoolId,
      pageId,
      pageName: pageId === 'home' ? 'صفحه اصلی' : pageId,
      modules: validatedModules,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Upsert the configuration
    await collection.updateOne(
      { schoolId, pageId },
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Module configuration updated successfully',
      data: updateData,
    });

  } catch (error) {
    console.error('Error updating module configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Reset module configuration to default
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || 'home';
    const schoolId = user.schoolCode;

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('pageModules');

    // Delete existing configuration
    await collection.deleteOne({ schoolId, pageId });

    return NextResponse.json({
      success: true,
      message: 'Module configuration reset to default',
    });

  } catch (error) {
    console.error('Error resetting module configuration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 