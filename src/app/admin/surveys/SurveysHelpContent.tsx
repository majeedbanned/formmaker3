import React from "react";
import {
  Plus,
  Edit,
  Eye,
  BarChart3,
  Users,
  Calendar,
  FileText,
  Search,
  Copy,
  Trash2,
  Settings,
  Target,
  MessageSquare,
  CheckSquare,
  Star,
  Type,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Activity,
  Filter,
  Info,
  Lightbulb,
  Zap,
  UserCheck,
  School,
  User,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const surveysHelpSections = [
  {
    id: "overview",
    title: "نمای کلی سیستم نظرسنجی",
    icon: Eye,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          سیستم نظرسنجی ابزار قدرتمندی برای جمع‌آوری نظرات و بازخوردهای معلمان و
          دانش‌آموزان است. با این سیستم می‌توانید نظرسنجی‌های هدفمند ایجاد کرده
          و نتایج را تحلیل کنید.
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
                <span>۴ نوع سوال متنوع</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>هدف‌گذاری دقیق</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>زمان‌بندی قابل تنظیم</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>نظرسنجی ناشناس</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>تحلیل و گزارش‌گیری</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>مدیریت دسترسی</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            نقش کاربری شما (دانش‌آموز، معلم، مدیر) تعیین می‌کند که چه
            نظرسنجی‌هایی را می‌بینید و چه عملیاتی می‌توانید انجام دهید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "survey-creation",
    title: "ایجاد نظرسنجی",
    icon: Plus,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          ایجاد نظرسنجی در ۵ مرحله انجام می‌شود تا بتوانید نظرسنجی کامل و
          هدفمندی بسازید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">1</span>
                </div>
                اطلاعات پایه
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  • <strong>عنوان:</strong> عنوان واضح و جذاب
                </div>
                <div>
                  • <strong>توضیحات:</strong> شرح هدف نظرسنجی (اختیاری)
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">2</span>
                </div>
                طراحی سوالات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-gray-500" />
                  <span>متنی</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-gray-500" />
                  <span>چندگزینه‌ای</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span>تک‌گزینه‌ای</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-500" />
                  <span>امتیازدهی</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
                تعیین مخاطبان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• انتخاب کلاس‌های هدف</div>
                <div>• انتخاب معلمان هدف</div>
                <div>• امکان انتخاب همه یا گروه خاص</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">4</span>
                </div>
                تنظیمات پیشرفته
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• تاریخ شروع و پایان</div>
                <div>• حالت ناشناس</div>
                <div>• نمایش نتایج به شرکت‌کنندگان</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="bg-blue-100 p-1 rounded w-6 h-6 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">5</span>
                </div>
                بررسی و انتشار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• بررسی نهایی تمام بخش‌ها</div>
                <div>• انتشار یا ذخیره به عنوان پیش‌نویس</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "question-types",
    title: "انواع سوالات",
    icon: MessageSquare,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          سیستم نظرسنجی از ۴ نوع سوال پشتیبانی می‌کند که نیازهای مختلف را پوشش
          می‌دهد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Type className="w-4 h-4" />
                سوال متنی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  برای دریافت پاسخ‌های باز و تشریحی
                </p>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <strong>مثال:</strong> نظر خود را در مورد کیفیت تدریس بیان
                  کنید
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                تک‌گزینه‌ای (رادیو)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">انتخاب یکی از چند گزینه</p>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <strong>مثال:</strong> سطح رضایت شما: عالی، خوب، متوسط، ضعیف
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="w-4 h-4" />
                چندگزینه‌ای (چک‌باکس)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">انتخاب چندین گزینه همزمان</p>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <strong>مثال:</strong> کدام موضوعات را ترجیح می‌دهید؟ ریاضی،
                  علوم، ادبیات
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4" />
                امتیازدهی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">ارزیابی با ستاره (۱ تا ۵)</p>
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <strong>مثال:</strong> کیفیت آموزش را از ۱ تا ۵ ستاره ارزیابی
                  کنید
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            می‌توانید سوالات را اجباری یا اختیاری تنظیم کنید. برای سوالات
            چندگزینه‌ای و تک‌گزینه‌ای، گزینه‌های دلخواه اضافه کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "targeting",
    title: "هدف‌گذاری و دسترسی",
    icon: Target,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          با سیستم هدف‌گذاری می‌توانید نظرسنجی را به گروه‌های خاصی از کاربران
          اختصاص دهید.
        </p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              انواع مخاطبان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-blue-500" />
                <span>
                  <strong>کلاس‌ها:</strong> انتخاب کلاس‌های خاص برای دانش‌آموزان
                </span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span>
                  <strong>معلمان:</strong> انتخاب معلمان خاص
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>
                  <strong>همه:</strong> در دسترس تمام کاربران مجاز
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              زمان‌بندی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <strong>تاریخ شروع:</strong> زمان فعال‌سازی نظرسنجی
                  <br />
                  <span className="text-gray-500 text-xs">
                    قبل از این تاریخ قابل دسترسی نیست
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-red-500 mt-0.5" />
                <div>
                  <strong>تاریخ پایان:</strong> زمان بسته شدن نظرسنجی
                  <br />
                  <span className="text-gray-500 text-xs">
                    بعد از این تاریخ غیرفعال می‌شود
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              تنظیمات حریم خصوصی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>
                  <strong>نظرسنجی ناشناس:</strong> هویت پاسخ‌دهندگان مخفی باشد
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500" />
                <span>
                  <strong>نمایش نتایج:</strong> شرکت‌کنندگان نتایج را ببینند
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  {
    id: "survey-status",
    title: "وضعیت‌های نظرسنجی",
    icon: Activity,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          هر نظرسنجی دارای وضعیت مشخصی است که نحوه دسترسی و استفاده از آن را
          تعیین می‌کند.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Edit className="w-4 h-4 text-yellow-600" />
                پیش‌نویس
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Badge
                  variant="secondary"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  پیش‌نویس
                </Badge>
                <p className="text-gray-600">
                  نظرسنجی هنوز منتشر نشده و فقط برای سازنده قابل مشاهده است
                </p>
                <div className="text-xs text-gray-500">
                  • قابل ویرایش کامل
                  <br />
                  • برای شرکت‌کنندگان قابل دسترسی نیست
                  <br />• می‌توان حذف کرد
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-600" />
                فعال
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  فعال
                </Badge>
                <p className="text-gray-600">
                  نظرسنجی منتشر شده و برای مخاطبان قابل دسترسی است
                </p>
                <div className="text-xs text-gray-500">
                  • شرکت‌کنندگان می‌توانند پاسخ دهند
                  <br />
                  • ویرایش محدود (فقط تنظیمات)
                  <br />• آمار پاسخ‌ها قابل مشاهده
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-600" />
                بسته شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <Badge
                  variant="destructive"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  بسته شده
                </Badge>
                <p className="text-gray-600">
                  نظرسنجی به پایان رسیده و پاسخ‌گیری متوقف شده
                </p>
                <div className="text-xs text-gray-500">
                  • امکان پاسخ جدید نیست
                  <br />
                  • نتایج نهایی قابل مشاهده
                  <br />• تحلیل و گزارش‌گیری کامل
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "responses",
    title: "مدیریت پاسخ‌ها",
    icon: BarChart3,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          پس از دریافت پاسخ‌ها، می‌توانید آنها را مشاهده، تحلیل و گزارش‌گیری
          کنید.
        </p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4" />
              مشاهده پاسخ‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>روی نظرسنجی مورد نظر کلیک کنید</li>
              <li>از منوی عملیات "مشاهده پاسخ‌ها" را انتخاب کنید</li>
              <li>جزئیات تمام پاسخ‌ها قابل مشاهده است</li>
              <li>نمودارها و آمار خودکار تولید می‌شود</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              آمار و تحلیل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>تعداد کل پاسخ‌ها</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>نمودار توزیع پاسخ‌ها</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>میانگین امتیازات</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>درصد مشارکت</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            در نظرسنجی‌های ناشناس، هویت پاسخ‌دهندگان نمایش داده نمی‌شود اما آمار
            کلی قابل مشاهده است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "management",
    title: "مدیریت نظرسنجی‌ها",
    icon: Settings,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          عملیات مختلفی برای مدیریت نظرسنجی‌ها در دسترس است.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Edit className="w-4 h-4" />
                ویرایش
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  تغییر محتوا، تنظیمات و زمان‌بندی
                </p>
                <div className="text-xs text-gray-500">
                  • در حالت پیش‌نویس: ویرایش کامل
                  <br />• در حالت فعال: فقط تنظیمات زمانی
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Copy className="w-4 h-4" />
                کپی کردن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">ایجاد نسخه جدید با همان محتوا</p>
                <div className="text-xs text-gray-500">
                  کپی شده به عنوان پیش‌نویس ذخیره می‌شود
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Search className="w-4 h-4" />
                جستجو و فیلتر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>• جستجو در عنوان و توضیحات</div>
                <div>• فیلتر بر اساس وضعیت</div>
                <div>• مرتب‌سازی بر اساس تاریخ</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4" />
                حذف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">حذف دائمی نظرسنجی</p>
                <div className="bg-red-50 p-2 rounded text-xs text-red-800">
                  <strong>هشدار:</strong> حذف نظرسنجی باعث از دست رفتن تمام
                  پاسخ‌ها می‌شود
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "tips-tricks",
    title: "نکات و ترفندها",
    icon: Lightbulb,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای بهره‌گیری بهینه از سیستم نظرسنجی، این نکات را در نظر بگیرید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                طراحی مؤثر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>سوالات کوتاه و واضح بنویسید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>از سوالات منفی خودداری کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>تعداد سوالات را محدود نگه دارید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>گزینه "نظری ندارم" اضافه کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                افزایش مشارکت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>هدف نظرسنجی را روشن کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>زمان مناسب برای انتشار انتخاب کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>بازخورد نتایج را ارائه دهید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>از قابلیت ناشناس بودن استفاده کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="w-4 h-4" />
                بهترین روش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>قبل از انتشار نظرسنجی را تست کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>پیش از حذف، از پاسخ‌ها بکاپ تهیه کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>نتایج را با مخاطبان به اشتراک بگذارید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>از نظرسنجی‌های دوره‌ای استفاده کنید</span>
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
