import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

// GET - Fetch news section content
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_news');
    
    const newsContent = await collection.findOne({});

    // If no content exists, return default content
    if (!newsContent) {
      const defaultContent = {
        title: "آخرین اخبار",
        subtitle: "تازه‌ترین رویدادها و اخبار",
        description: "از آخرین تحولات، رویدادها و بروزرسانی‌های پارسا موز مطلع شوید.",
        news: [
          {
            id: 1,
            title: "برگزاری همایش فناوری آموزشی در تهران",
            excerpt: "همایش سالانه فناوری آموزشی با حضور مدیران مدارس برتر کشور در تهران برگزار شد.",
            date: "۲ مهر ۱۴۰۳",
            category: "رویدادها",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/1"
          },
          {
            id: 2,
            title: "انتشار نسخه جدید پارسا موز با قابلیت‌های هوش مصنوعی",
            excerpt: "نسخه جدید پارسا موز با بهره‌گیری از هوش مصنوعی، امکانات تازه‌ای برای ارزیابی پیشرفت دانش‌آموزان ارائه می‌دهد.",
            date: "۱۵ شهریور ۱۴۰۳",
            category: "محصولات",
            image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/2"
          },
          {
            id: 3,
            title: "همکاری پارسا موز با وزارت آموزش و پرورش",
            excerpt: "تفاهم‌نامه همکاری میان پارسا موز و وزارت آموزش و پرورش جهت توسعه سیستم‌های نوین آموزشی به امضا رسید.",
            date: "۵ مرداد ۱۴۰۳",
            category: "همکاری‌ها",
            image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/3"
          }
        ],
        viewAllText: "مشاهده همه اخبار",
        viewAllLink: "/news",
        // Style settings
        backgroundColor: "#FFFFFF",
        titleColor: "#4F46E5",
        subtitleColor: "#111827",
        descriptionColor: "#6B7280",
        cardBackgroundColor: "#FFFFFF",
        newsTitleColor: "#111827",
        newsExcerptColor: "#6B7280",
        newsDateColor: "#6B7280",
        categoryBackgroundColor: "#4F46E5",
        categoryTextColor: "#FFFFFF",
        readMoreColor: "#4F46E5",
        viewAllButtonBackgroundColor: "#4F46E5",
        viewAllButtonTextColor: "#FFFFFF",
        isVisible: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return NextResponse.json({ success: true, news: defaultContent });
    }

    // Ensure backward compatibility by adding default style values if missing
    const newsWithDefaults = {
      ...newsContent,
      backgroundColor: newsContent.backgroundColor || "#FFFFFF",
      titleColor: newsContent.titleColor || "#4F46E5",
      subtitleColor: newsContent.subtitleColor || "#111827",
      descriptionColor: newsContent.descriptionColor || "#6B7280",
      cardBackgroundColor: newsContent.cardBackgroundColor || "#FFFFFF",
      newsTitleColor: newsContent.newsTitleColor || "#111827",
      newsExcerptColor: newsContent.newsExcerptColor || "#6B7280",
      newsDateColor: newsContent.newsDateColor || "#6B7280",
      categoryBackgroundColor: newsContent.categoryBackgroundColor || "#4F46E5",
      categoryTextColor: newsContent.categoryTextColor || "#FFFFFF",
      readMoreColor: newsContent.readMoreColor || "#4F46E5",
      viewAllButtonBackgroundColor: newsContent.viewAllButtonBackgroundColor || "#4F46E5",
      viewAllButtonTextColor: newsContent.viewAllButtonTextColor || "#FFFFFF",
      isVisible: newsContent.isVisible !== undefined ? newsContent.isVisible : true,
    };

    return NextResponse.json({ success: true, news: newsWithDefaults });
  } catch (error) {
    console.error('Error fetching news content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update news section content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      subtitle, 
      description, 
      news,
      viewAllText,
      viewAllLink,
      isVisible,
      backgroundColor,
      titleColor,
      subtitleColor,
      descriptionColor,
      cardBackgroundColor,
      newsTitleColor,
      newsExcerptColor,
      newsDateColor,
      categoryBackgroundColor,
      categoryTextColor,
      readMoreColor,
      viewAllButtonBackgroundColor,
      viewAllButtonTextColor
    } = body;

    if (!title || !subtitle || !description) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and description are required' },
        { status: 400 }
      );
    }

    const domain = request.headers.get("x-domain") || "localhost:3000";
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('website_news');

    const newsData = {
      title,
      subtitle,
      description,
      news: news || [],
      viewAllText: viewAllText || "مشاهده همه اخبار",
      viewAllLink: viewAllLink || "/news",
      // Style settings with defaults
      backgroundColor: backgroundColor || "#FFFFFF",
      titleColor: titleColor || "#4F46E5",
      subtitleColor: subtitleColor || "#111827",
      descriptionColor: descriptionColor || "#6B7280",
      cardBackgroundColor: cardBackgroundColor || "#FFFFFF",
      newsTitleColor: newsTitleColor || "#111827",
      newsExcerptColor: newsExcerptColor || "#6B7280",
      newsDateColor: newsDateColor || "#6B7280",
      categoryBackgroundColor: categoryBackgroundColor || "#4F46E5",
      categoryTextColor: categoryTextColor || "#FFFFFF",
      readMoreColor: readMoreColor || "#4F46E5",
      viewAllButtonBackgroundColor: viewAllButtonBackgroundColor || "#4F46E5",
      viewAllButtonTextColor: viewAllButtonTextColor || "#FFFFFF",
      isVisible: isVisible !== undefined ? isVisible : true,
      isActive: true,
      updatedAt: new Date(),
    };

    // Upsert - update if exists, create if doesn't
    await collection.replaceOne(
      {},
      { ...newsData, createdAt: new Date() },
      { upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'News content updated successfully',
      news: newsData
    });
  } catch (error) {
    console.error('Error updating news content:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 