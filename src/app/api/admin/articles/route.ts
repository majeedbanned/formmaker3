import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  tags: string[];
}

interface ArticlesData {
  sectionTitle: string;
  sectionSubtitle: string;
  sectionDescription: string;
  viewAllButtonText: string;
  viewAllButtonLink: string;
  articles: Article[];
  // Visibility setting
  isVisible: boolean;
  // Style settings
  sectionTitleColor: string;
  sectionSubtitleColor: string;
  sectionDescriptionColor: string;
  backgroundGradientFrom: string;
  backgroundGradientTo: string;
  cardBackgroundColor: string;
  cardTextColor: string;
  cardHoverShadow: string;
  buttonColor: string;
  buttonTextColor: string;
  tagBackgroundColor: string;
  tagTextColor: string;
}

// GET - Fetch articles data
export async function GET() {
  try {
    await client.connect();
    const db = client.db("formmaker3");
    const collection = db.collection("articlesConfig");

    const articlesConfig = await collection.findOne({});

    if (!articlesConfig) {
      // Return default articles data if none exists
      const defaultData: ArticlesData = {
        sectionTitle: "آخرین مطالب آموزشی",
        sectionSubtitle: "مقالات",
        sectionDescription:
          "با مطالعه مقالات کارشناسان ما، در مسیر بهبود و توسعه آموزش قدم بردارید.",
        viewAllButtonText: "مشاهده همه مقالات",
        viewAllButtonLink: "/blog",
        articles: [
          {
            id: "1",
            title: "راهکارهای نوین آموزش در عصر دیجیتال",
            excerpt:
              "امروزه با رشد فناوری‌های دیجیتال، روش‌های سنتی آموزش نیازمند بازنگری هستند. در این مقاله، راهکارهای مدرن آموزشی را بررسی می‌کنیم.",
            date: "۱۲ شهریور ۱۴۰۳",
            author: "دکتر مریم احمدی",
            readTime: "۸ دقیقه",
            image:
              "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["آموزش دیجیتال", "فناوری آموزشی"],
          },
          {
            id: "2",
            title: "نقش هوش مصنوعی در ارتقاء کیفیت آموزش",
            excerpt:
              "هوش مصنوعی چگونه می‌تواند به بهبود کیفیت آموزش و شخصی‌سازی تجربه یادگیری دانش‌آموزان کمک کند؟ این مقاله به بررسی این موضوع می‌پردازد.",
            date: "۴ مرداد ۱۴۰۳",
            author: "مهندس علی محمدی",
            readTime: "۶ دقیقه",
            image:
              "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["هوش مصنوعی", "یادگیری شخصی‌سازی شده"],
          },
          {
            id: "3",
            title: "مدیریت کلاس‌های آنلاین: چالش‌ها و راه‌حل‌ها",
            excerpt:
              "مدیریت کلاس‌های آنلاین چالش‌های خاص خود را دارد. در این مقاله، راهکارهای عملی برای مدیریت مؤثر کلاس‌های آنلاین ارائه می‌شود.",
            date: "۲۸ تیر ۱۴۰۳",
            author: "زهرا کریمی",
            readTime: "۱۰ دقیقه",
            image:
              "https://images.unsplash.com/photo-1610484826967-09c5720778c7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["آموزش آنلاین", "مدیریت کلاس"],
          },
          {
            id: "4",
            title: "تحلیل داده‌های آموزشی و کاربرد آن در بهبود عملکرد دانش‌آموزان",
            excerpt:
              "چگونه می‌توان از تحلیل داده‌های آموزشی برای شناسایی نقاط ضعف و قوت دانش‌آموزان استفاده کرد و برنامه آموزشی را بهبود بخشید؟",
            date: "۱۰ تیر ۱۴۰۳",
            author: "دکتر امیر حسینی",
            readTime: "۷ دقیقه",
            image:
              "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
            tags: ["تحلیل داده", "عملکرد تحصیلی"],
          },
        ],
        // Default style settings
        sectionTitleColor: "#1F2937",
        sectionSubtitleColor: "#4F46E5",
        sectionDescriptionColor: "#6B7280",
        backgroundGradientFrom: "#F9FAFB",
        backgroundGradientTo: "#FFFFFF",
        cardBackgroundColor: "#FFFFFF",
        cardTextColor: "#1F2937",
        cardHoverShadow: "lg",
        buttonColor: "#4F46E5",
        buttonTextColor: "#FFFFFF",
        tagBackgroundColor: "#EEF2FF",
        tagTextColor: "#4F46E5",
        isVisible: true,
      };

      return NextResponse.json({
        success: true,
        articles: defaultData,
      });
    }

    // Remove MongoDB _id field from the response
    const { _id, ...articlesData } = articlesConfig;

    return NextResponse.json({
      success: true,
      articles: articlesData,
    });
  } catch (error) {
    console.error("Error fetching articles data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch articles data" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Save articles data
export async function POST(request: NextRequest) {
  try {
    const articlesData: ArticlesData = await request.json();

    // Validate required fields
    if (!articlesData.sectionTitle || !articlesData.articles) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await client.connect();
    const db = client.db("formmaker3");
    const collection = db.collection("articlesConfig");

    // Add or update timestamp
    const dataToSave = {
      ...articlesData,
      updatedAt: new Date(),
    };

    // Use upsert to create or update the articles configuration
    await collection.replaceOne({}, dataToSave, { upsert: true });

    return NextResponse.json({
      success: true,
      message: "Articles data saved successfully",
    });
  } catch (error) {
    console.error("Error saving articles data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save articles data" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
} 