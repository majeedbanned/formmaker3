import React from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  FileSpreadsheet,
  Settings,
  Calendar,
  UserPlus,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  Lightbulb,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const classesHelpSections = [
  {
    id: "overview",
    title: "نمای کلی صفحه کلاس‌ها",
    icon: Eye,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          صفحه مدیریت کلاس‌ها به شما امکان ایجاد، ویرایش و مدیریت کامل کلاس‌های
          درسی مدرسه را می‌دهد. در این صفحه می‌توانید اطلاعات هر کلاس شامل نام،
          کد، پایه تحصیلی، رشته و برنامه‌ریزی هفتگی را مدیریت کنید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4" />
              ویژگی‌های کلیدی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>مدیریت کامل کلاس‌ها</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>وارد کردن گروهی دانش‌آموزان</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>تعریف برنامه هفتگی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>تعیین معلمان و دروس</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            تمام تغییرات انجام شده در کلاس‌ها به طور خودکار در پروفایل
            دانش‌آموزان نیز اعمال می‌شود.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "add-class",
    title: "افزودن کلاس جدید",
    icon: Plus,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای ایجاد کلاس جدید، از دکمه "افزودن کلاس" در بالای صفحه استفاده
          کنید. فرم زیر باز شده و باید اطلاعات مطلوب را تکمیل کنید.
        </p>

        <div className="space-y-4" dir="rtl">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-right">
            <Settings className="w-4 h-4" />
            فیلدهای اجباری
          </h4>

          <div className="grid gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">کد کلاس</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  کد یکتا برای هر کلاس که به طور خودکار تولید می‌شود. این کد
                  قابل ویرایش نیست.
                </p>
                <Badge variant="outline" className="mt-2">
                  خودکار
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">نام کلاس</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  نام کلاس را وارد کنید (مثال: هفتم الف، دهم ریاضی)
                </p>
                <Badge variant="secondary" className="mt-2">
                  اجباری
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">پایه تحصیلی</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  انتخاب پایه تحصیلی از اول ابتدایی تا دوازدهم متوسطه
                </p>
                <Badge variant="secondary" className="mt-2">
                  اجباری
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">رشته</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  انتخاب رشته تحصیلی (ریاضی فیزیک، علوم تجربی، ادبیات و...)
                </p>
                <Badge variant="secondary" className="mt-2">
                  اجباری
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            پس از ذخیره کلاس، می‌توانید معلمان و برنامه هفتگی را نیز تعریف کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "import-students",
    title: "وارد کردن دانش‌آموزان",
    icon: UserPlus,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          یکی از قابلیت‌های مهم این صفحه، امکان وارد کردن گروهی دانش‌آموزان به
          کلاس است. این کار از دو روش قابل انجام است: از طریق اکسل یا از سیستم
          سیدا.
        </p>

        <div className="space-y-4" dir="rtl">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-right">
            <FileSpreadsheet className="w-4 h-4" />
            روش اول: وارد کردن از اکسل
          </h4>

          <Card>
            <CardContent className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>
                  در جدول کلاس‌ها، روی دکمه "ثبت گروهی دانش آموزان" کلیک کنید
                </li>
                <li>تب "از اکسل" را انتخاب کنید</li>
                <li>اطلاعات دانش‌آموزان را از اکسل کپی کنید</li>
                <li>در کادر متنی پیست کنید</li>
                <li>روی "وارد کردن دانش آموزان" کلیک کنید</li>
              </ol>
            </CardContent>
          </Card>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-sm mb-2">
              فرمت مورد انتظار از اکسل:
            </h5>
            <div className="bg-white p-3 rounded border text-xs font-mono">
              <div className="grid grid-cols-4 gap-4 font-bold border-b pb-1">
                <span>کد دانش آموز</span>
                <span>نام</span>
                <span>نام خانوادگی</span>
                <span>موبایل</span>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-1">
                <span>12345</span>
                <span>علی</span>
                <span>محمدی</span>
                <span>09121234567</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            روش دوم: وارد کردن از سیدا
          </h4>

          <Card>
            <CardContent className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>از سیستم سیدا، لیست دانش‌آموزان کلاس را کپی کنید</li>
                <li>تب "از سیدا" را انتخاب کنید</li>
                <li>متن کپی شده را در کادر پیست کنید</li>
                <li>سیستم به طور خودکار اطلاعات را استخراج می‌کند</li>
              </ol>
            </CardContent>
          </Card>

          <Alert className="bg-orange-50 border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>هشدار مهم:</strong> با وارد کردن دانش‌آموزان جدید، تمام
              دانش‌آموزان قبلی کلاس حذف شده و جایگزین می‌شوند.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    ),
  },
  {
    id: "teachers-schedule",
    title: "تعیین معلمان و برنامه",
    icon: Calendar,
    content: (
      <div className="space-y-6" dir="rtl">
        <p className="text-gray-700 text-base leading-relaxed text-right">
          برای هر کلاس می‌توانید معلمان مختلف را برای دروس گوناگون تعیین کرده و
          برنامه‌ی هفتگی تنظیم کنید.
        </p>

        <div className="space-y-4" dir="rtl">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-right">
            <GraduationCap className="w-4 h-4" />
            تعیین معلمان
          </h4>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-1 rounded">
                    <span className="text-blue-600 text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    از بخش "معلمان" در فرم ویرایش کلاس، روی "افزودن" کلیک کنید
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-1 rounded">
                    <span className="text-blue-600 text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    معلم مورد نظر را از لیست انتخاب کنید
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-1 rounded">
                    <span className="text-blue-600 text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    درس مربوطه را تعیین کنید (بر اساس پایه و رشته)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            برنامه‌ریزی هفتگی
          </h4>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  برای هر معلم و درس می‌توانید برنامه هفتگی تعریف کنید:
                </p>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>روز هفته:</strong>
                      <br />
                      شنبه تا جمعه
                    </div>
                    <div>
                      <strong>زنگ درسی:</strong>
                      <br />
                      زنگ اول تا دوازدهم
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            برنامه هفتگی تعریف شده در سایر بخش‌های سیستم نیز قابل استفاده است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "search-filter",
    title: "جستجو و فیلتر",
    icon: Search,
    content: (
      <div className="space-y-6">
        <p className="text-gray-700 text-base leading-relaxed">
          برای یافتن سریع کلاس‌ها، از امکانات جستجو و فیلتر پیشرفته استفاده
          کنید.
        </p>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4" />
            جستجوی ساده
          </h4>

          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 mb-3">
                در کادر جستجو می‌توانید موارد زیر را جستجو کنید:
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    کد کلاس
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    نام کلاس
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    پایه تحصیلی
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    رشته
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            جستجوی پیشرفته
          </h4>

          <Card>
            <CardContent className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>روی دکمه "جستجوی پیشرفته" کلیک کنید</li>
                <li>فیلدهای مورد نظر را تعیین کنید</li>
                <li>مقادیر مطلوب را وارد کنید</li>
                <li>روی "اعمال فیلترها" کلیک کنید</li>
              </ol>

              <div className="mt-4 p-3 bg-blue-50 rounded">
                <p className="text-xs text-blue-800">
                  💡 می‌توانید چندین فیلتر را همزمان اعمال کنید تا نتایج
                  دقیق‌تری دریافت کنید.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "edit-delete",
    title: "ویرایش و حذف",
    icon: Edit,
    content: (
      <div className="space-y-6">
        <p className="text-gray-700 text-base leading-relaxed">
          برای مدیریت کلاس‌های موجود، از گزینه‌های ویرایش و حذف استفاده کنید.
        </p>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Edit className="w-4 h-4" />
            ویرایش کلاس
          </h4>

          <Card>
            <CardContent className="pt-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>در جدول کلاس‌ها، روی دکمه "ویرایش" کلیک کنید</li>
                <li>اطلاعات مورد نظر را تغییر دهید</li>
                <li>معلمان و برنامه هفتگی را به‌روزرسانی کنید</li>
                <li>روی "ذخیره" کلیک کنید</li>
              </ol>

              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  تغییرات در نام کلاس به طور خودکار در پروفایل دانش‌آموزان نیز
                  اعمال می‌شود.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            حذف کلاس
          </h4>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  برای حذف کلاس، دو روش وجود دارد:
                </p>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">
                      تکی
                    </Badge>
                    <span className="text-sm text-gray-600">
                      روی دکمه "حذف" در هر ردیف کلیک کنید
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">
                      گروهی
                    </Badge>
                    <span className="text-sm text-gray-600">
                      کلاس‌ها را انتخاب کرده و "حذف گروهی" را بزنید
                    </span>
                  </div>
                </div>
              </div>

              <Alert className="mt-4 bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>هشدار:</strong> با حذف کلاس، این کلاس از پروفایل تمام
                  دانش‌آموزان نیز حذف می‌شود.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
  },
  {
    id: "tips",
    title: "نکات و راهنمایی‌ها",
    icon: Lightbulb,
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            نکات مهم
          </h4>

          <div className="space-y-3">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-green-900 text-sm">
                      کد کلاس یکتا
                    </h5>
                    <p className="text-green-800 text-xs mt-1">
                      کد هر کلاس در سطح مدرسه یکتا است و دو کلاس نمی‌توانند کد
                      یکسانی داشته باشند.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-blue-900 text-sm">
                      مدیریت دانش‌آموزان
                    </h5>
                    <p className="text-blue-800 text-xs mt-1">
                      دانش‌آموزان می‌توانند عضو چندین کلاس باشند، اما وارد کردن
                      گروهی آن‌ها را تنها در یک کلاس قرار می‌دهد.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-900 text-sm">
                      برنامه‌ریزی هفتگی
                    </h5>
                    <p className="text-amber-800 text-xs mt-1">
                      برنامه هفتگی تعریف شده برای گزارش‌گیری حضور و غیاب استفاده
                      می‌شود.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            مشکلات رایج
          </h4>

          <div className="space-y-3">
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-1 rounded">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">
                        وارد کردن از اکسل کار نمی‌کند
                      </h5>
                      <p className="text-gray-600 text-xs mt-1">
                        مطمئن شوید فرمت داده‌ها دقیقاً مطابق نمونه ارائه شده
                        باشد و از جداکننده تب استفاده کنید.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-1 rounded">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">معلم در لیست نیست</h5>
                      <p className="text-gray-600 text-xs mt-1">
                        ابتدا باید معلم در بخش "معلمان" تعریف شود تا در لیست
                        انتخاب کلاس‌ها نمایش داده شود.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-red-100 p-1 rounded">
                      <span className="text-red-600 text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm">
                        درس مناسب نمایش داده نمی‌شود
                      </h5>
                      <p className="text-gray-600 text-xs mt-1">
                        دروس بر اساس پایه تحصیلی و رشته فیلتر می‌شوند. ابتدا این
                        دو مورد را انتخاب کنید.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    ),
  },
];
