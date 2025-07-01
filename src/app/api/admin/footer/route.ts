import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

interface FooterLink {
  name: string;
  href: string;
}

interface FooterLinkGroup {
  title: string;
  links: FooterLink[];
}

interface FooterData {
  companyName: string;
  companyDescription: string;
  logoText: string;
  linkGroups: FooterLinkGroup[];
  newsletterTitle: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  newsletterPlaceholder: string;
  socialLinks: SocialLink[];
  copyrightText: string;
  isVisible: boolean;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  linkHoverColor: string;
  logoBackgroundColor: string;
  logoTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  borderColor: string;
}

// GET - Fetch footer data
export async function GET(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain");
    
    if (!domain) {
      return NextResponse.json({ error: "Domain header is required" }, { status: 400 });
    }

    const db = await connectToDatabase(domain);
    const footerConfig = db.collection("footerConfig");
    
    let footer = await footerConfig.findOne({});
    
    if (!footer) {
      // Return default footer data
      const defaultFooter = {
        companyName: "مدرسه ما",
        logoText: "م",
        companyDescription: "با مدرسه ما، آموزش فرزندانتان را در محیطی امن، مدرن و با رویکردی نوین تجربه کنید. ما متعهد به پرورش نسلی آگاه و موفق هستیم.",
        linkGroups: [
          {
            title: "مدرسه",
            links: [
              { name: "برنامه‌های درسی", href: "#" },
              { name: "فعالیت‌های فوق‌برنامه", href: "#" },
              { name: "کادر آموزشی", href: "#" },
              { name: "محیط مدرسه", href: "#" },
            ],
          },
          {
            title: "درباره ما",
            links: [
              { name: "معرفی مدرسه", href: "#about" },
              { name: "تیم آموزشی", href: "#team" },
              { name: "جوایز و افتخارات", href: "#" },
              { name: "اخبار مدرسه", href: "#news" },
            ],
          },
          {
            title: "پشتیبانی",
            links: [
              { name: "سوالات متداول", href: "#" },
              { name: "تماس با ما", href: "#contact" },
              { name: "قوانین و مقررات", href: "#" },
              { name: "سیاست حفظ حریم خصوصی", href: "#" },
            ],
          },
        ],
        newsletterTitle: "عضویت در خبرنامه",
        newsletterDescription: "برای اطلاع از برنامه‌ها و رویدادهای مدرسه، در خبرنامه ما عضو شوید.",
        newsletterButtonText: "عضویت",
        newsletterPlaceholder: "ایمیل خود را وارد کنید",
        socialLinks: [
          {
            name: "Instagram",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="..."/></svg>`,
          },
          {
            name: "Twitter",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>`,
          },
          {
            name: "LinkedIn",
            url: "#",
            icon: `<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="..."/></svg>`,
          },
        ],
        copyrightText: `© ${new Date().getFullYear()} مدرسه ما. تمامی حقوق محفوظ است.`,
        isVisible: true,
        backgroundColor: "#111827",
        textColor: "#FFFFFF",
        linkColor: "#9CA3AF",
        linkHoverColor: "#6366F1",
        logoBackgroundColor: "#6366F1",
        logoTextColor: "#FFFFFF",
        buttonColor: "#6366F1",
        buttonTextColor: "#FFFFFF",
        inputBackgroundColor: "#1F2937",
        inputTextColor: "#FFFFFF",
        borderColor: "#374151",
      };
      
      
      footer = defaultFooter;
    }

    return NextResponse.json({ success: true, footer });
  } catch (error) {
    console.error("Error fetching footer data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Save footer data
export async function POST(request: NextRequest) {
  try {
    const domain = request.headers.get("x-domain");
    
    if (!domain) {
      return NextResponse.json({ error: "Domain header is required" }, { status: 400 });
    }

    const footerData: FooterData = await request.json();

    // Validate required fields
    if (!footerData.companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase(domain);
    const footerConfig = db.collection("footerConfig");

    // Update or create footer configuration
    const result = await footerConfig.replaceOne(
      {},
      {
        ...footerData,
        updatedAt: new Date(),
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Footer data saved successfully",
      result,
    });
  } catch (error) {
    console.error("Error saving footer data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 