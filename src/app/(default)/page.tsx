import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AboutSection from "@/components/landing/AboutSection";
import NewsSection from "@/components/landing/NewsSection";
import ArticlesSection from "@/components/landing/ArticlesSection";
import GallerySection from "@/components/landing/GallerySection";
import TeachersSection from "@/components/landing/TeachersSection";
import AppDownloadSection from "@/components/landing/AppDownloadSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import ContactSection from "@/components/landing/ContactSection";
import FooterSection from "@/components/landing/FooterSection";
import LandingNavbar from "@/components/landing/LandingNavbar";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <TeachersSection />
      <GallerySection />
      <NewsSection />
      <ArticlesSection />
      <AppDownloadSection />
      <TestimonialsSection />
      <PricingSection />
      <ContactSection />
      <FooterSection />

      {/* Admin links */}
      <div className="fixed bottom-4 left-4 bg-white p-2 rounded-md shadow-md text-sm z-50">
        <div className="space-x-4 rtl:space-x-reverse">
          <a href="/login" className="text-indigo-600 hover:text-indigo-800">
            ورود
          </a>
          <a
            href="/admin/schools"
            className="text-indigo-600 hover:text-indigo-800"
          >
            پنل مدیریت
          </a>
        </div>
      </div>
    </main>
  );
}
