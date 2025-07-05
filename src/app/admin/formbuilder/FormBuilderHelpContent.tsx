import React from "react";
import {
  Plus,
  Edit,
  Eye,
  Settings,
  FileText,
  Users,
  Calendar,
  Upload,
  Star,
  CheckSquare,
  FormInput,
  Hash,
  Mail,
  MoreHorizontal,
  Check,
  SwitchCamera,
  AlignJustify,
  Pen,
  SquareStack,
  Save,
  Trash,
  Search,
  Filter,
  Info,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Layers,
  BookOpen,
  Download,
  FileJson,
  FileSpreadsheet,
  Zap,
  Shield,
  Copy,
  Move,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const formBuilderHelpSections = [
  {
    id: "overview",
    title: "نمای کلی فرم ساز",
    icon: Eye,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          فرم ساز ابزار قدرتمندی برای ایجاد فرم‌های تعاملی و هوشمند است. با این
          ابزار می‌توانید فرم‌های ساده تا پیچیده، چندمرحله‌ای و شرطی بسازید و
          آنها را به کلاس‌ها و معلمان اختصاص دهید.
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
                <span>۱۴ نوع فیلد متنوع</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>فرم‌های چندمرحله‌ای</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>منطق شرطی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>اختصاص به کلاس‌ها</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>تنظیمات زمان‌بندی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>گزارش‌گیری و صادرات</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            فرم‌های ساخته شده در سه تب قابل مدیریت هستند: فهرست فرم‌ها، ویرایشگر
            و پیش‌نمایش.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "form-management",
    title: "مدیریت فرم‌ها",
    icon: BookOpen,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          در تب "فرم‌های من" تمام فرم‌های ساخته شده را مشاهده و مدیریت کنید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                ایجاد فرم جدید
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>روی دکمه "ایجاد فرم جدید" کلیک کنید</li>
                <li>عنوان فرم را وارد کنید</li>
                <li>فیلدهای مورد نیاز را اضافه کنید</li>
                <li>تنظیمات فرم را انجام دهید</li>
                <li>فرم را ذخیره کنید</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4" />
                وضعیت فرم‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    فعال
                  </Badge>
                  <span>فرم در دسترس کاربران است</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    پیش‌نویس
                  </Badge>
                  <span>فرم هنوز منتشر نشده است</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    منقضی
                  </Badge>
                  <span>زمان پاسخ‌دهی به پایان رسیده</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="text-xs">زمان‌بندی شده</Badge>
                  <span>فرم در زمان تعیین شده فعال می‌شود</span>
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
              <div className="space-y-2 text-sm text-gray-600">
                <div>• جستجو در عنوان فرم‌ها</div>
                <div>• فیلتر بر اساس وضعیت (فعال، منقضی، پیش‌نویس)</div>
                <div>• مرتب‌سازی بر اساس تاریخ ایجاد</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "field-types",
    title: "انواع فیلدهای فرم",
    icon: SquareStack,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          فرم ساز از ۱۴ نوع فیلد مختلف پشتیبانی می‌کند تا تمام نیازهای شما را
          پوشش دهد.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FormInput className="w-4 h-4" />
                فیلدهای متنی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    متن کوتاه
                  </Badge>
                  <span>برای ورود متن یک خطی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    متن بلند
                  </Badge>
                  <span>برای ورود متن چند خطی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    ایمیل
                  </Badge>
                  <span>با اعتبارسنجی ایمیل</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4" />
                فیلدهای عددی و زمانی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    عدد
                  </Badge>
                  <span>برای ورود اعداد</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    تاریخ
                  </Badge>
                  <span>انتخاب تاریخ شمسی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    امتیازدهی
                  </Badge>
                  <span>ستاره‌ای ۱ تا ۵</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckSquare className="w-4 h-4" />
                فیلدهای انتخابی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    منوی کشویی
                  </Badge>
                  <span>انتخاب از فهرست</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    رادیو
                  </Badge>
                  <span>انتخاب یکی از چند گزینه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    چک باکس
                  </Badge>
                  <span>انتخاب چندگانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    کلید
                  </Badge>
                  <span>روشن/خاموش</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Upload className="w-4 h-4" />
                فیلدهای پیشرفته
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    آپلود فایل
                  </Badge>
                  <span>بارگذاری فایل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    امضاء
                  </Badge>
                  <span>امضاء دیجیتال</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    گروه
                  </Badge>
                  <span>گروه‌بندی فیلدها</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    شرطی
                  </Badge>
                  <span>نمایش بر اساس شرط</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "field-configuration",
    title: "تنظیمات فیلدها",
    icon: Settings,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          هر فیلد دارای تنظیمات جامعی است که می‌توانید آن را شخصی‌سازی کنید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FormInput className="w-4 h-4" />
                تنظیمات اصلی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    <strong>برچسب:</strong> عنوان نمایش داده شده به کاربر
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    <strong>نام فیلد:</strong> شناسه یکتا (خودکار تولید می‌شود)
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    <strong>توضیحات:</strong> راهنمای اضافی برای کاربر
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    <strong>مقدار پیش‌فرض:</strong> مقدار اولیه فیلد
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>
                    <strong>اجباری:</strong> آیا پر کردن فیلد ضروری است؟
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                اعتبارسنجی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong>Regex:</strong> الگوی اعتبارسنجی سفارشی
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong>پیام خطا:</strong> پیام نمایش داده شده در صورت خطا
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong>حداقل/حداکثر:</strong> محدودیت طول متن یا مقدار عدد
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                منطق شرطی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p className="text-gray-600">
                  فیلد فقط زمانی نمایش داده می‌شود که شرط مشخص شده برقرار باشد:
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs">
                    <strong>مثال:</strong> اگر "دانش‌آموز" انتخاب شود، فیلد
                    "کلاس" نمایش داده شود
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "multistep-forms",
    title: "فرم‌های چندمرحله‌ای",
    icon: Layers,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای فرم‌های پیچیده، می‌توانید آنها را به چندین مرحله تقسیم کنید.
        </p>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4" />
              فعال‌سازی حالت چندمرحله‌ای
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
              <li>در ویرایشگر فرم، کلید "فرم چندمرحله‌ای" را فعال کنید</li>
              <li>به طور خودکار یک مرحله اولیه ایجاد می‌شود</li>
              <li>فیلدهای موجود به مرحله اول منتقل می‌شوند</li>
              <li>می‌توانید مراحل جدید اضافه کنید</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              مدیریت مراحل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>افزودن مرحله:</strong> عنوان و توضیحات مرحله را وارد
                  کنید
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>حذف مرحله:</strong> حداقل یک مرحله باید باقی بماند
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>انتقال فیلد:</strong> فیلدها را بین مراحل جابجا کنید
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            در حالت چندمرحله‌ای، کاربران می‌توانند بین مراحل جابجا شده و پیشرفت
            خود را ذخیره کنند.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "form-settings",
    title: "تنظیمات فرم",
    icon: Settings,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          هر فرم دارای تنظیمات پیشرفته‌ای است که کنترل دقیق‌تری بر نحوه استفاده
          از آن می‌دهد.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                زمان‌بندی فرم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <strong>تاریخ شروع:</strong> زمان شروع دسترسی به فرم
                    <br />
                    <span className="text-gray-500 text-xs">
                      قبل از این تاریخ، فرم قابل دسترسی نیست
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-red-500 mt-0.5" />
                  <div>
                    <strong>تاریخ پایان:</strong> زمان پایان دسترسی به فرم
                    <br />
                    <span className="text-gray-500 text-xs">
                      بعد از این تاریخ، فرم غیرفعال می‌شود
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4" />
                اختصاص کاربران
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong>کلاس‌ها:</strong> کلاس‌های مجاز برای دسترسی
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>
                    <strong>معلمان:</strong> معلمان مجاز برای دسترسی
                  </span>
                </div>
                <div className="bg-yellow-50 p-3 rounded text-xs">
                  <strong>نکته:</strong> اگر هیچ کلاس یا معلمی انتخاب نشود، فرم
                  برای همه قابل دسترسی است
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                تنظیمات دسترسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>
                    <strong>قابل ویرایش:</strong> امکان ویرایش پاسخ‌های ثبت شده
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span>
                    <strong>یکبار پر کردن:</strong> هر کاربر فقط یکبار می‌تواند
                    پاسخ دهد
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span>
                    <strong>نسخه‌های متعدد:</strong> امکان ایجاد چندین پاسخ توسط
                    یک کاربر
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "submissions",
    title: "مدیریت پاسخ‌ها",
    icon: FileText,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          پاسخ‌های دریافت شده از فرم‌ها را مشاهده، تجزیه و تحلیل و صادر کنید.
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
              <li>در فهرست فرم‌ها، روی آیکن "مشاهده پاسخ‌ها" کلیک کنید</li>
              <li>تعداد پاسخ‌ها در کارت فرم نمایش داده می‌شود</li>
              <li>جزئیات کامل هر پاسخ قابل مشاهده است</li>
              <li>امکان فیلتر و جستجو در پاسخ‌ها</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" />
              صادرات پاسخ‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-500" />
                <span>
                  <strong>فرمت JSON:</strong> برای پردازش برنامه‌نویسی
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                <span>
                  <strong>فرمت CSV:</strong> برای استفاده در اکسل
                </span>
              </div>
              <div className="bg-blue-50 p-3 rounded text-xs">
                <strong>نکته:</strong> صادرات شامل تمام فیلدها، زمان ثبت و
                اطلاعات کاربر می‌شود
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            آمار پاسخ‌ها به صورت لحظه‌ای به‌روزرسانی می‌شود و در کارت هر فرم
            نمایش داده می‌شود.
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
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای استفاده بهینه از فرم ساز، این نکات و ترفندها را در نظر بگیرید.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4" />
                طراحی فرم‌های مؤثر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>عنوان‌های واضح و مفهوم انتخاب کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>از توضیحات کمکی برای فیلدهای پیچیده استفاده کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>فیلدهای مرتبط را در گروه‌های منطقی قرار دهید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>فرم‌های طولانی را به چندین مرحله تقسیم کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4" />
                بهینه‌سازی عملکرد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>از منطق شرطی برای کاهش پیچیدگی استفاده کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>فیلدهای اجباری را به حداقل برسانید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>از پیش‌نمایش برای آزمایش فرم استفاده کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">💡</span>
                  <span>زمان‌بندی مناسب برای فرم‌های حساس تعیین کنید</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Copy className="w-4 h-4" />
                میانبرهای مفید
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>از کپی فیلدها برای فیلدهای مشابه استفاده کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>فیلدها را با درگ اند دراپ مرتب کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>از تب‌های مختلف برای جابجایی سریع استفاده کنید</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600">⚡</span>
                  <span>تنظیمات را قبل از انتشار نهایی کنید</span>
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
