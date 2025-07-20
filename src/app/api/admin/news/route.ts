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
        title: "آخرین اخبار مدرسه",
        subtitle: "جدیدترین رویدادها و اطلاعیه‌ها",
        description: "با پیگیری اخبار و اطلاعیه‌های مدرسه، از آخرین رویدادها، برنامه‌ها و دستاوردهای دانش‌آموزان مطلع شوید.",
        news: [
          {
            id: 1,
            title: "برگزاری جشن آغاز سال تحصیلی",
            excerpt: "مراسم باشکوهی با حضور دانش‌آموزان و والدین به مناسبت شروع سال تحصیلی جدید برگزار شد.",
            date: "۱ مهر ۱۴۰۴",
            category: "رویدادها",
            image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/1"
          },
          {
            id: 2,
            title: "کسب رتبه برتر در مسابقات علمی",
            excerpt: "دانش‌آموزان مدرسه ما موفق به کسب مقام‌های برتر در مسابقات علمی استانی شدند و افتخار آفریدند.",
            date: "۲۰ شهریور ۱۴۰۴",
            category: "دستاوردها",
            image: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/2"
          },
          {
            id: 3,
            title: "بازدید مسئولین آموزش و پرورش از مدرسه",
            excerpt: "هیئتی از مسئولان آموزش و پرورش با حضور در مدرسه از امکانات و فعالیت‌های آموزشی بازدید کردند.",
            date: "۵ شهریور ۱۴۰۴",
            category: "بازدیدها",
            image: "https://images.unsplash.com/photo-1609859590888-31b8ed6dfa25?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            link: "/news/3"
          }
        ],
        viewAllText: "مشاهده همه اخبار مدرسه",
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

    // Update or create news configuration using updateOne with $set to avoid _id conflicts  
    await collection.updateOne(
      {},
      {
        $set: {
          ...newsData,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
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