import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch hero section content
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_hero');
    
    const heroContent = await collection.findOne({});

    // If no content exists, return default content
    if (!heroContent) {
      const defaultContent = {
        title: "پارسا موز",
        subtitle: "سیستم مدیریت آموزش",
        description: "سیستم مدیریت آموزش، راهکاری جامع برای مدارس و موسسات آموزشی. با پارسا موز، آسان‌تر تدریس کنید، عملکرد دانش آموزان را رصد کنید و ارتباط موثرتری با والدین داشته باشید.",
        primaryButtonText: "شروع رایگان",
        primaryButtonLink: "/signup",
        secondaryButtonText: "نمایش دمو",
        secondaryButtonLink: "/demo",
        images: [
          {
            url: "/images/hero-dashboard.png",
            alt: "Dashboard Preview",
            title: "پیشخوان مدیریت"
          }
        ],
        // Default style settings
        titleColor: "#4F46E5",
        subtitleColor: "#374151",
        descriptionColor: "#6B7280",
        backgroundGradientFrom: "#EEF2FF",
        backgroundGradientTo: "#FFFFFF",
        primaryButtonColor: "#4F46E5",
        primaryButtonTextColor: "#FFFFFF",
        secondaryButtonColor: "#FFFFFF",
        secondaryButtonTextColor: "#4F46E5",
        secondaryButtonBorderColor: "#4F46E5",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return NextResponse.json({ success: true, hero: defaultContent });
    }

    // Ensure backward compatibility by adding default style values if missing
    const heroWithDefaults = {
      ...heroContent,
      titleColor: heroContent.titleColor || "#4F46E5",
      subtitleColor: heroContent.subtitleColor || "#374151",
      descriptionColor: heroContent.descriptionColor || "#6B7280",
      backgroundGradientFrom: heroContent.backgroundGradientFrom || "#EEF2FF",
      backgroundGradientTo: heroContent.backgroundGradientTo || "#FFFFFF",
      primaryButtonColor: heroContent.primaryButtonColor || "#4F46E5",
      primaryButtonTextColor: heroContent.primaryButtonTextColor || "#FFFFFF",
      secondaryButtonColor: heroContent.secondaryButtonColor || "#FFFFFF",
      secondaryButtonTextColor: heroContent.secondaryButtonTextColor || "#4F46E5",
      secondaryButtonBorderColor: heroContent.secondaryButtonBorderColor || "#4F46E5",
    };

    return NextResponse.json({ success: true, hero: heroWithDefaults });
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update hero section content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      subtitle, 
      description, 
      primaryButtonText, 
      primaryButtonLink, 
      secondaryButtonText, 
      secondaryButtonLink, 
      images,
      titleColor,
      subtitleColor,
      descriptionColor,
      backgroundGradientFrom,
      backgroundGradientTo,
      primaryButtonColor,
      primaryButtonTextColor,
      secondaryButtonColor,
      secondaryButtonTextColor,
      secondaryButtonBorderColor
    } = body;

    if (!title || !subtitle || !description) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and description are required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_hero');

    const heroData = {
      title,
      subtitle,
      description,
      primaryButtonText: primaryButtonText || "شروع رایگان",
      primaryButtonLink: primaryButtonLink || "/signup",
      secondaryButtonText: secondaryButtonText || "نمایش دمو",
      secondaryButtonLink: secondaryButtonLink || "/demo",
      images: images || [],
      // Style settings with defaults
      titleColor: titleColor || "#4F46E5",
      subtitleColor: subtitleColor || "#374151",
      descriptionColor: descriptionColor || "#6B7280",
      backgroundGradientFrom: backgroundGradientFrom || "#EEF2FF",
      backgroundGradientTo: backgroundGradientTo || "#FFFFFF",
      primaryButtonColor: primaryButtonColor || "#4F46E5",
      primaryButtonTextColor: primaryButtonTextColor || "#FFFFFF",
      secondaryButtonColor: secondaryButtonColor || "#FFFFFF",
      secondaryButtonTextColor: secondaryButtonTextColor || "#4F46E5",
      secondaryButtonBorderColor: secondaryButtonBorderColor || "#4F46E5",
      isActive: true,
      updatedAt: new Date(),
    };

    // Upsert - update if exists, create if doesn't
    await collection.replaceOne(
      {},
      { ...heroData, createdAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Hero content updated successfully',
      hero: heroData
    });
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 