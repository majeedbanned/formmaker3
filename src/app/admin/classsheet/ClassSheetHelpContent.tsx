import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export const classSheetHelpSections: HelpSection[] = [
  {
    id: "overview",
    title: "نمای کلی سیستم کلاس‌برگ",
    icon: Info,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم کلاس‌برگ ابزاری جامع برای مدیریت اطلاعات کلاس‌ها، دانش‌آموزان،
          نمرات، حضور و غیاب، ارزیابی‌ها و رویدادهای کلاسی است. این سیستم امکان
          ثبت و پیگیری کامل فعالیت‌های آموزشی را فراهم می‌کند.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                نقش‌های کاربری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">مدیر مدرسه</Badge>
                  <span className="text-sm">مشاهده همه کلاس‌ها</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">معلم</Badge>
                  <span className="text-sm">فقط کلاس‌های خود</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-500" />
                قابلیت‌های کلیدی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• ثبت حضور و غیاب</li>
                <li>• ثبت نمرات و ارزیابی</li>
                <li>• مدیریت رویدادها</li>
                <li>• گزارش‌گیری ماهانه</li>
                <li>• پروفایل دانش‌آموزان</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تمام اطلاعات وارد شده در کلاس‌برگ در پایگاه داده ذخیره شده و قابل
            بازیابی است. دقت در ثبت اطلاعات ضروری است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "class-navigation",
    title: "ناوبری و انتخاب کلاس",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          در صفحه کلاس‌برگ، ابتدا باید کلاس و درس مورد نظر خود را انتخاب کنید.
          سپس می‌توانید بازه زمانی و جدول کلاس را مشاهده کنید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">انتخاب کلاس و درس</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">انتخاب کلاس</h4>
                  <p className="text-sm text-gray-600">
                    از لیست کشویی کلاس مورد نظر را انتخاب کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">انتخاب درس</h4>
                  <p className="text-sm text-gray-600">
                    درس و معلم مربوطه را از لیست انتخاب کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">مشاهده جدول</h4>
                  <p className="text-sm text-gray-600">
                    جدول کلاس با تاریخ‌ها و ساعات نمایش داده می‌شود
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">ناوبری زمانی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">← →</Badge>
                  <span className="text-sm">جابجایی بین هفته‌ها</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">امروز</Badge>
                  <span className="text-sm">بازگشت به تاریخ امروز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">انتخاب تاریخ</Badge>
                  <span className="text-sm">رفتن به تاریخ خاص</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">نمای‌های مختلف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">هفتگی</Badge>
                  <span className="text-sm">نمای دو هفته‌ای</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">ماهانه</Badge>
                  <span className="text-sm">خلاصه نمرات ماهانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">دانش‌آموز</Badge>
                  <span className="text-sm">پروفایل فردی</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            معلمان فقط کلاس‌هایی را مشاهده می‌کنند که به آن‌ها تخصیص داده شده
            است. مدیران مدرسه تمام کلاس‌ها را مشاهده می‌کنند.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "grades-assessments",
    title: "نمرات و ارزیابی‌ها",
    icon: GraduationCap,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم نمرات و ارزیابی‌ها امکان ثبت نمرات عددی، ارزیابی‌های توصیفی و
          محاسبه نمرات ماهانه را فراهم می‌کند.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ثبت نمره</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">کلیک روی خانه</h4>
                  <p className="text-sm text-gray-600">
                    روی خانه تقاطع دانش‌آموز و تاریخ کلیک کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">وارد کردن نمره</h4>
                  <p className="text-sm text-gray-600">
                    نمره، امتیاز کل و توضیحات را وارد کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">ذخیره نمره</h4>
                  <p className="text-sm text-gray-600">
                    دکمه ذخیره را برای ثبت نهایی فشار دهید
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">انواع ارزیابی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">عالی</Badge>
                  <span className="text-sm">+2 امتیاز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">خوب</Badge>
                  <span className="text-sm">+1 امتیاز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gray-100 text-gray-800">متوسط</Badge>
                  <span className="text-sm">0 امتیاز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800">ضعیف</Badge>
                  <span className="text-sm">-1 امتیاز</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">بسیار ضعیف</Badge>
                  <span className="text-sm">-2 امتیاز</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">عناوین ارزیابی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">مهارت تفکر</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">مهارت همکاری</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">مشارکت در کلاس</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">انجام تکالیف</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">خلاقیت</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            نمرات ماهانه بر اساس میانگین نمرات عددی و تعدیل ارزیابی‌ها محاسبه
            می‌شوند. ارزیابی‌های مثبت نمره را افزایش و ارزیابی‌های منفی آن را
            کاهش می‌دهند.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "attendance-management",
    title: "مدیریت حضور و غیاب",
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم حضور و غیاب امکان ثبت وضعیت حضور هر دانش‌آموز را برای هر جلسه
          کلاس فراهم می‌کند.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">وضعیت‌های حضور</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800 border border-green-200">
                  حاضر
                </Badge>
                <div>
                  <h4 className="font-medium">حضور کامل</h4>
                  <p className="text-sm text-gray-600">
                    دانش‌آموز در کلاس حضور داشته است
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-red-100 text-red-800 border border-red-200">
                  غایب
                </Badge>
                <div>
                  <h4 className="font-medium">غیبت کامل</h4>
                  <p className="text-sm text-gray-600">
                    دانش‌آموز در کلاس حضور نداشته است
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
                  تاخیر
                </Badge>
                <div>
                  <h4 className="font-medium">حضور با تاخیر</h4>
                  <p className="text-sm text-gray-600">
                    دانش‌آموز با تاخیر وارد کلاس شده است
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ثبت حضور و غیاب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">کلیک ساده:</span>
                <span className="text-sm">
                  برای تغییر وضعیت روی خانه کلیک کنید
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">عملیات دسته‌ای:</span>
                <span className="text-sm">
                  برای ثبت وضعیت یکسان همه دانش‌آموزان
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">تغییر سریع:</span>
                <span className="text-sm">چرخش بین وضعیت‌های مختلف</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            وضعیت حضور و غیاب به صورت خودکار ذخیره می‌شود و در گزارش‌های ماهانه
            و آماری لحاظ می‌گردد.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "events-comments",
    title: "رویدادها و یادداشت‌ها",
    icon: Calendar,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          برای هر روز کلاسی می‌توانید رویدادها و یادداشت‌های معلم را ثبت کنید.
          این اطلاعات برای پیگیری فعالیت‌های کلاسی مفید است.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">یادداشت‌های معلم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">کلیک روی تاریخ:</span>
                <span className="text-sm">
                  برای افزودن یادداشت روی ستون تاریخ کلیک کنید
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">یادداشت روزانه:</span>
                <span className="text-sm">فعالیت‌های کلاسی را ثبت کنید</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">ذخیره خودکار:</span>
                <span className="text-sm">
                  یادداشت‌ها به صورت خودکار ذخیره می‌شوند
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">مدیریت رویدادها</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">افزودن رویداد</h4>
                  <p className="text-sm text-gray-600">
                    عنوان و توضیحات رویداد را وارد کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">مشاهده رویدادها</h4>
                  <p className="text-sm text-gray-600">
                    لیست رویدادهای ثبت شده را مشاهده کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">حذف رویداد</h4>
                  <p className="text-sm text-gray-600">
                    رویدادهای غیرضروری را حذف کنید
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            یادداشت‌ها و رویدادها برای تمام کاربران قابل مشاهده است و در
            گزارش‌های کلاسی نمایش داده می‌شود.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "reports-statistics",
    title: "گزارش‌ها و آمار",
    icon: BarChart3,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم گزارش‌های جامعی از عملکرد دانش‌آموزان، نمرات ماهانه، حضور و غیاب
          و ارزیابی‌ها ارائه می‌دهد.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">نمای ماهانه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800">
                  نمره ماهانه
                </Badge>
                <span className="text-sm">محاسبه خودکار نمره ماه</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800">
                  تعدیل ارزیابی
                </Badge>
                <span className="text-sm">اثر ارزیابی‌ها روی نمره</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  تعداد نمرات
                </Badge>
                <span className="text-sm">آمار نمرات در ماه</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">پروفایل دانش‌آموز</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">نمودار پیشرفت:</span>
                <span className="text-sm">نمایش روند نمرات در زمان</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">آمار حضور:</span>
                <span className="text-sm">درصد حضور و غیاب</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">میانگین نمرات:</span>
                <span className="text-sm">محاسبه میانگین کلی</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            برای مشاهده پروفایل هر دانش‌آموز، روی نام آن‌ها کلیک کنید. گزارش‌های
            تفصیلی در پنجره جدید نمایش داده می‌شود.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "settings-customization",
    title: "تنظیمات و سفارشی‌سازی",
    icon: Settings,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          امکان سفارشی‌سازی عناوین و مقادیر ارزیابی، تنظیمات عملیات دسته‌ای و
          سایر تنظیمات سیستم.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">سفارشی‌سازی ارزیابی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">عناوین ارزیابی</Badge>
                <span className="text-sm">افزودن عناوین جدید</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">مقادیر ارزیابی</Badge>
                <span className="text-sm">تعریف مقادیر با وزن</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">تنظیمات سراسری</Badge>
                <span className="text-sm">اعمال برای کل مدرسه</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">عملیات دسته‌ای</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">نمره‌دهی دسته‌ای:</span>
                <span className="text-sm">
                  ثبت نمره یکسان برای همه دانش‌آموزان
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">ارزیابی دسته‌ای:</span>
                <span className="text-sm">
                  ثبت ارزیابی یکسان برای همه دانش‌آموزان
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">یادداشت دسته‌ای:</span>
                <span className="text-sm">
                  ثبت یادداشت برای همه دانش‌آموزان
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تغییرات در تنظیمات ارزیابی بر تمام کلاس‌ها اثر می‌گذارد. قبل از
            تغییر، از صحت تنظیمات اطمینان حاصل کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "tips-tricks",
    title: "نکات و ترفندها",
    icon: Lightbulb,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          برای استفاده بهینه از سیستم کلاس‌برگ، نکات و ترفندهای زیر را رعایت
          کنید:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                بهترین تمرین‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• ابتدا حضور و غیاب را ثبت کنید</li>
                <li>• نمرات را با توضیحات کامل وارد کنید</li>
                <li>• از ارزیابی‌های توصیفی استفاده کنید</li>
                <li>• یادداشت‌های روزانه را ثبت کنید</li>
                <li>• از عملیات دسته‌ای استفاده کنید</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                نکات مهم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• اطلاعات به صورت خودکار ذخیره می‌شوند</li>
                <li>• نمرات ماهانه خودکار محاسبه می‌شوند</li>
                <li>• ارزیابی‌ها بر نمره نهایی تأثیر دارند</li>
                <li>• از منوی راست کلیک استفاده کنید</li>
                <li>• پروفایل دانش‌آموزان را بررسی کنید</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">میانبرهای کلیدی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline">F1</Badge>
                <span className="text-sm">نمایش راهنما</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">راست کلیک</Badge>
                <span className="text-sm">منوی عملیات</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">کلیک روی نام</Badge>
                <span className="text-sm">پروفایل دانش‌آموز</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">کلیک روی تاریخ</Badge>
                <span className="text-sm">یادداشت و رویداد</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            برای دریافت نتایج بهتر، از تمام قابلیت‌های سیستم استفاده کنید و
            اطلاعات را به صورت منظم به‌روزرسانی کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
];
