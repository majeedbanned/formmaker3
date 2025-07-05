import React from "react";
import {
  Users,
  Plus,
  Edit,
  Search,
  FileText,
  Settings,
  Calendar,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  Info,
  BookOpen,
  Target,
  TrendingUp,
  Save,
  BarChart3,
  Calculator,
  UserCheck,
  ChevronRight,
  Keyboard,
  Award,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const gradingSystemHelpSections = [
  {
    id: "overview",
    title: "نمای کلی سیستم نمره‌دهی",
    icon: Eye,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          سیستم نمره‌دهی ابزار جامع و بهینه‌ای برای ثبت، مدیریت و گزارش‌گیری
          نمرات دانش‌آموزان است. این سیستم با رابط کاربری ساده و جریان کاری
          چندمرحله‌ای طراحی شده تا فرآیند ثبت نمرات را سریع و دقیق انجام دهید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              ویژگی‌های کلیدی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>جریان کاری چندمرحله‌ای</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>ثبت سریع نمرات</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>آمار و گزارش‌گیری</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>کنترل دسترسی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>ویرایش و مدیریت</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>نمرات عددی و توصیفی</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            این سیستم فقط برای معلمان و مدیران مدرسه قابل دسترسی است. معلمان فقط
            کلاس‌ها و نمرات خود را مشاهده می‌کنند.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "wizard-steps",
    title: "مراحل ثبت نمره",
    icon: ChevronRight,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          فرآیند ثبت نمره در ۵ مرحله طراحی شده است تا به شما کمک کند نمرات را به
          صورت منظم و دقیق ثبت کنید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                انتخاب کلاس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  از میان کلاس‌هایی که در آن تدریس می‌کنید، کلاس مورد نظر را
                  انتخاب کنید
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                فقط کلاس‌های شما نمایش داده می‌شود
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                انتخاب درس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  درس مورد نظر را از میان دروسی که در آن کلاس تدریس می‌کنید
                  انتخاب کنید
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                بر اساس برنامه تدریس شما
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                عنوان نمره
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  عنوانی برای این ثبت نمره انتخاب کنید (مثل "آزمون میان‌ترم")
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <strong>تاریخ:</strong> تاریخ ثبت نمره را مشخص کنید
                <br />
                <strong>نوع نمره:</strong> عددی (۰-۲۰) یا توصیفی
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                ثبت نمرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  نمرات دانش‌آموزان را به صورت سریع وارد کنید
                </span>
              </div>
              <div className="text-xs text-gray-500">
                از کلیدهای میانبر برای سرعت بیشتر استفاده کنید
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">5</span>
                </div>
                بررسی و ذخیره
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Save className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  نمرات را مرور کرده و آمار کلی را مشاهده کنید
                </span>
              </div>
              <div className="text-xs text-gray-500">
                آمار میانگین، قبولی/مردودی و محدوده نمرات نمایش داده می‌شود
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "fast-grading",
    title: "ثبت سریع نمرات",
    icon: Keyboard,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای سرعت بیشتر در ثبت نمرات، از کلیدهای میانبر و ویژگی‌های بهینه‌سازی
          استفاده کنید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Keyboard className="w-4 h-4" />
              کلیدهای میانبر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Enter
                </Badge>
                <span className="text-gray-600">حرکت به دانش‌آموز بعدی</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Tab
                </Badge>
                <span className="text-gray-600">حرکت به فیلد بعدی</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ↑↓
                </Badge>
                <span className="text-gray-600">جابجایی بین دانش‌آموزان</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Esc
                </Badge>
                <span className="text-gray-600">لغو ویرایش</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4" />
              ویژگی‌های بهینه‌سازی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>فوکوس خودکار روی اولین فیلد خالی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>اعتبارسنجی لحظه‌ای (محدوده ۰-۲۰)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>پشتیبانی از نمرات اعشاری (مثل ۱۵.۵)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>نمایش پیشرفت ثبت نمرات</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            برای ثبت سریع‌تر، می‌توانید نمرات را پشت سر هم تایپ کرده و با Enter
            به دانش‌آموز بعدی بروید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "grading-types",
    title: "انواع نمره‌دهی",
    icon: Award,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          سیستم از دو نوع نمره‌دهی پشتیبانی می‌کند: عددی و توصیفی.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calculator className="w-4 h-4" />
                نمره‌دهی عددی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  نمرات عددی در محدوده ۰ تا ۲۰ با امکان استفاده از اعشار
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-700">
                    <strong>مثال‌های معتبر:</strong>
                    <br />
                    • ۱۵ (عدد صحیح)
                    <br />
                    • ۱۸.۵ (عدد اعشاری)
                    <br />
                    • ۰ (حداقل نمره)
                    <br />• ۲۰ (حداکثر نمره)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    خودکار
                  </Badge>
                  <span className="text-xs text-gray-600">
                    محاسبه میانگین و آمار
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                نمره‌دهی توصیفی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  نمرات توصیفی برای ارزیابی کیفی و شرح عملکرد
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-700">
                    <strong>مثال‌های پیشنهادی:</strong>
                    <br />
                    • عالی - بسیار خوب - خوب - قابل قبول - نیازمند تلاش
                    <br />
                    • دانش‌آموز در این درس عملکرد مناسبی داشته است
                    <br />• نیاز به تمرین بیشتر در این موضوع دارد
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    انعطاف‌پذیر
                  </Badge>
                  <span className="text-xs text-gray-600">
                    متن آزاد تا ۵۰۰ کاراکتر
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            نوع نمره‌دهی را در مرحله سوم انتخاب کنید. پس از شروع ثبت نمرات،
            امکان تغییر نوع وجود ندارد.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "statistics",
    title: "آمار و گزارش‌گیری",
    icon: BarChart3,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          سیستم آمار جامعی از نمرات ثبت شده ارائه می‌دهد که در مرحله بررسی و در
          فهرست نمرات قابل مشاهده است.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              آمار کلی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>میانگین کلاس</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>تعداد قبول شدگان</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>تعداد مردود شدگان</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>بالاترین نمره</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>پایین‌ترین نمره</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>کل دانش‌آموزان</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-sm mb-2">نحوه محاسبه آمار:</h5>
          <div className="space-y-2 text-xs text-gray-600">
            <div>
              <strong>میانگین:</strong> مجموع نمرات تقسیم بر تعداد دانش‌آموزان
              دارای نمره
            </div>
            <div>
              <strong>قبولی:</strong> نمرات ۱۰ و بالاتر
            </div>
            <div>
              <strong>مردودی:</strong> نمرات زیر ۱۰
            </div>
            <div>
              <strong>محدوده:</strong> کمترین و بیشترین نمره ثبت شده
            </div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            آمار فقط برای نمره‌دهی عددی محاسبه می‌شود. برای نمره‌دهی توصیفی، فقط
            تعداد کل نمایش داده می‌شود.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "edit-manage",
    title: "ویرایش و مدیریت",
    icon: Edit,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          پس از ثبت نمرات، می‌توانید آنها را ویرایش، جستجو و مدیریت کنید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Edit className="w-4 h-4" />
                ویرایش نمرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>از فهرست نمرات، روی دکمه "ویرایش" کلیک کنید</li>
                <li>مستقیماً به مرحله ثبت نمرات منتقل می‌شوید</li>
                <li>نمرات مورد نظر را تغییر دهید</li>
                <li>تغییرات را ذخیره کنید</li>
              </ol>
              <div className="mt-3 p-2 bg-orange-50 rounded text-xs text-orange-800">
                <strong>نکته:</strong> تاریخ آخرین ویرایش به‌روزرسانی می‌شود
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                جستجو در نمرات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  در فهرست نمرات می‌توانید جستجو کنید بر اساس:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      عنوان نمره
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      نام کلاس
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      نام درس
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      نام معلم
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" />
                فیلترهای دسترسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>معلمان:</strong> فقط نمرات کلاس‌ها و دروس خود
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-500" />
                  <span>
                    <strong>مدیر مدرسه:</strong> تمام نمرات مدرسه
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            تمام تغییرات در نمرات با تاریخ و زمان ثبت می‌شود و قابل ردیابی است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "tips-tricks",
    title: "نکات و ترفندها",
    icon: Info,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای استفاده بهینه از سیستم نمره‌دهی، این نکات و ترفندها را در نظر
          بگیرید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                نکات زمان‌بندی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>برای آزمون‌های مهم، عنوان واضح انتخاب کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>تاریخ ثبت نمره را دقیق وارد کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>بعد از آزمون، هر چه سریع‌تر نمرات را ثبت کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                نکات دقت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">!</span>
                  <span>قبل از ذخیره نهایی، حتماً نمرات را بررسی کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">!</span>
                  <span>
                    از آمار کلی برای تشخیص نمرات غیرمعمول استفاده کنید
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">!</span>
                  <span>در صورت شک، با مدیر مدرسه مشورت کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                پیشنهادات عملی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">💡</span>
                  <span>
                    برای کلاس‌های پرجمعیت، از کلیدهای میانبر استفاده کنید
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">💡</span>
                  <span>
                    عنوان‌های استاندارد انتخاب کنید (آزمون ۱، نوبت اول، ...)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">💡</span>
                  <span>
                    از نمره‌دهی توصیفی برای ارزیابی‌های کیفی استفاده کنید
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            برای دسترسی سریع به راهنما، کلید F1 را فشار دهید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
];
