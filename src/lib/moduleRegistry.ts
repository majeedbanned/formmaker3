import { ModuleDefinition, ModuleType, ModuleCategory } from '@/types/modules';

// Import all landing components
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import AboutSection from '@/components/landing/AboutSection';
import TeachersSection from '@/components/landing/TeachersSection';
import GallerySection from '@/components/landing/GallerySection';
import NewsSection from '@/components/landing/NewsSection';
import ArticlesSection from '@/components/landing/ArticlesSection';
import AppDownloadSection from '@/components/landing/AppDownloadSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import ContactSection from '@/components/landing/ContactSection';
import FooterSection from '@/components/landing/FooterSection';
import HtmlContentSection from '@/components/landing/HtmlContentSection';

// Import all edit modals
import HeroEditModal from '@/components/landing/HeroEditModal';
import FeaturesEditModal from '@/components/landing/FeaturesEditModal';
import AboutEditModal from '@/components/landing/AboutEditModal';
import GalleryEditModal from '@/components/landing/GalleryEditModal';
import ArticlesEditModal from '@/components/landing/ArticlesEditModal';
import AppDownloadEditModal from '@/components/landing/AppDownloadEditModal';
import TestimonialsEditModal from '@/components/landing/TestimonialsEditModal';
import ContactEditModal from '@/components/landing/ContactEditModal';
import FooterEditModal from '@/components/landing/FooterEditModal';
import HtmlContentEditModal from '@/components/landing/HtmlContentEditModal';

// Import placeholder modal for modules without edit functionality
import NoEditModal from '@/components/NoEditModal';

// Module registry with all available modules
export const moduleRegistry: Record<ModuleType, ModuleDefinition> = {
  [ModuleType.NAVBAR]: {
    type: ModuleType.NAVBAR,
    name: 'نوار ناوبری',
    description: 'نوار ناوبری اصلی سایت',
    icon: '🧭',
    component: LandingNavbar,
    editModal: NoEditModal,
    category: ModuleCategory.HEADER,
    isRequired: true,
    defaultConfig: {
      isVisible: true,
      logo: '/images/logo.png',
      menuItems: [
        { name: 'خانه', href: '#home' },
        { name: 'ویژگی‌ها', href: '#features' },
        { name: 'درباره ما', href: '#about' },
        { name: 'تماس', href: '#contact' },
      ],
    },
  },
  [ModuleType.HERO]: {
    type: ModuleType.HERO,
    name: 'بخش هیرو',
    description: 'بخش اصلی و جذاب صفحه اول',
    icon: '🚀',
    component: HeroSection,
    editModal: HeroEditModal,
    category: ModuleCategory.HERO,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'عنوان اصلی',
      subtitle: 'زیرعنوان',
      description: 'توضیحات کامل',
      primaryButtonText: 'شروع کنید',
      primaryButtonLink: '#',
      secondaryButtonText: 'بیشتر بدانید',
      secondaryButtonLink: '#',
      images: [],
    },
  },
  [ModuleType.FEATURES]: {
    type: ModuleType.FEATURES,
    name: 'ویژگی‌ها',
    description: 'نمایش ویژگی‌های اصلی محصول',
    icon: '⭐',
    component: FeaturesSection,
    editModal: FeaturesEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'ویژگی‌ها',
      subtitle: 'امکانات کلیدی',
      description: 'توضیحات ویژگی‌ها',
      features: [],
    },
  },
  [ModuleType.ABOUT]: {
    type: ModuleType.ABOUT,
    name: 'درباره ما',
    description: 'معرفی شرکت یا سازمان',
    icon: '👥',
    component: AboutSection,
    editModal: AboutEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'درباره ما',
      description: 'توضیحات درباره شرکت',
      benefits: [],
      stats: [],
    },
  },
  [ModuleType.TEACHERS]: {
    type: ModuleType.TEACHERS,
    name: 'اساتید',
    description: 'نمایش اساتید و مدرسین',
    icon: '👨‍🏫',
    component: TeachersSection,
    editModal: NoEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'اساتید ما',
      description: 'آشنایی با اساتید مجرب',
      teachers: [],
    },
  },
  [ModuleType.GALLERY]: {
    type: ModuleType.GALLERY,
    name: 'گالری',
    description: 'نمایش تصاویر و گالری',
    icon: '🖼️',
    component: GallerySection,
    editModal: GalleryEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'گالری تصاویر',
      description: 'مجموعه تصاویر',
      images: [],
    },
  },
  [ModuleType.NEWS]: {
    type: ModuleType.NEWS,
    name: 'اخبار',
    description: 'نمایش آخرین اخبار',
    icon: '📰',
    component: NewsSection,
    editModal: NoEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'آخرین اخبار',
      description: 'اخبار و اطلاعیه‌ها',
      news: [],
    },
  },
  [ModuleType.ARTICLES]: {
    type: ModuleType.ARTICLES,
    name: 'مقالات',
    description: 'نمایش مقالات و محتوا',
    icon: '📝',
    component: ArticlesSection,
    editModal: ArticlesEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'مقالات',
      description: 'مقالات آموزشی',
      articles: [],
    },
  },
  [ModuleType.APP_DOWNLOAD]: {
    type: ModuleType.APP_DOWNLOAD,
    name: 'دانلود اپلیکیشن',
    description: 'معرفی و دانلود اپلیکیشن موبایل',
    icon: '📱',
    component: AppDownloadSection,
    editModal: AppDownloadEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'دانلود اپلیکیشن',
      description: 'اپلیکیشن موبایل ما را دانلود کنید',
      downloadButtons: [],
      features: [],
    },
  },
  [ModuleType.TESTIMONIALS]: {
    type: ModuleType.TESTIMONIALS,
    name: 'نظرات کاربران',
    description: 'نمایش نظرات و تجربه کاربران',
    icon: '💬',
    component: TestimonialsSection,
    editModal: TestimonialsEditModal,
    category: ModuleCategory.SOCIAL_PROOF,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'نظرات کاربران',
      description: 'تجربه کاربران از محصول',
      testimonials: [],
    },
  },
  [ModuleType.PRICING]: {
    type: ModuleType.PRICING,
    name: 'قیمت‌گذاری',
    description: 'نمایش پلان‌ها و قیمت‌ها',
    icon: '💰',
    component: PricingSection,
    editModal: NoEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'پلان‌های قیمتی',
      description: 'بهترین پلان را انتخاب کنید',
      plans: [],
    },
  },
  [ModuleType.CONTACT]: {
    type: ModuleType.CONTACT,
    name: 'تماس با ما',
    description: 'فرم تماس و اطلاعات ارتباطی',
    icon: '📞',
    component: ContactSection,
    editModal: ContactEditModal,
    category: ModuleCategory.CONTACT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      title: 'تماس با ما',
      description: 'راه‌های ارتباط با ما',
      contactInfo: {},
      socialLinks: [],
    },
  },
  [ModuleType.FOOTER]: {
    type: ModuleType.FOOTER,
    name: 'فوتر',
    description: 'فوتر سایت',
    icon: '🦶',
    component: FooterSection,
    editModal: FooterEditModal,
    category: ModuleCategory.FOOTER,
    isRequired: true,
    defaultConfig: {
      isVisible: true,
      companyInfo: {},
      links: [],
      socialLinks: [],
    },
  },
  [ModuleType.HTML_CONTENT]: {
    type: ModuleType.HTML_CONTENT,
    name: 'محتوای HTML',
    description: 'افزودن محتوای سفارشی HTML، CSS و JavaScript',
    icon: '📄',
    component: HtmlContentSection,
    editModal: HtmlContentEditModal,
    category: ModuleCategory.CONTENT,
    isRequired: false,
    defaultConfig: {
      isVisible: true,
      html: '',
      css: '',
      javascript: '',
      title: '',
      description: '',
    },
  },
};

// Helper functions
export const getModuleDefinition = (type: ModuleType): ModuleDefinition => {
  return moduleRegistry[type];
};

export const getAvailableModules = (): ModuleDefinition[] => {
  return Object.values(moduleRegistry);
};

export const getModulesByCategory = (category: ModuleCategory): ModuleDefinition[] => {
  return Object.values(moduleRegistry).filter(module => module.category === category);
};

export const getRequiredModules = (): ModuleDefinition[] => {
  return Object.values(moduleRegistry).filter(module => module.isRequired);
};

export const getOptionalModules = (): ModuleDefinition[] => {
  return Object.values(moduleRegistry).filter(module => !module.isRequired);
}; 