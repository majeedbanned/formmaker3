import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  Settings,
  Lightbulb,
  Info,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export const accountingHelpSections: HelpSection[] = [
  {
    id: "overview",
    title: "نمای کلی سیستم حسابداری",
    icon: Info,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم حسابداری مدرسه ابزاری جامع برای مدیریت تراکنش‌های مالی
          دانش‌آموزان و معلمان است. این سیستم امکان ثبت، مشاهده، ویرایش و
          گزارش‌گیری از تمام تراکنش‌های مالی را فراهم می‌کند.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                سطوح دسترسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">مدیر مدرسه</Badge>
                  <span className="text-sm">دسترسی کامل</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">معلم</Badge>
                  <span className="text-sm">فقط مشاهده</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">دانش‌آموز</Badge>
                  <span className="text-sm">فقط مشاهده</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                قابلیت‌های کلیدی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• ثبت تراکنش‌های فردی</li>
                <li>• ثبت تراکنش‌های دسته‌جمعی</li>
                <li>• مدیریت اسناد و مدارک</li>
                <li>• گزارش‌گیری مالی</li>
                <li>• جستجو و فیلتر</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تمام تراکنش‌های مالی باید با مدارک مناسب همراه باشند. اطلاعات دقیق و
            کامل وارد کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "person-management",
    title: "مدیریت اشخاص و انتخاب",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          برای ثبت و مشاهده تراکنش‌ها، ابتدا باید شخص مورد نظر (دانش‌آموز یا
          معلم) را انتخاب کنید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">انتخاب شخص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">جستجو بر اساس نام</h4>
                  <p className="text-sm text-gray-600">
                    نام دانش‌آموز یا معلم را تایپ کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">جستجو بر اساس کد</h4>
                  <p className="text-sm text-gray-600">
                    کد دانش‌آموز یا معلم را وارد کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">فیلتر بر اساس نوع</h4>
                  <p className="text-sm text-gray-600">
                    دانش‌آموز یا معلم را انتخاب کنید
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">اطلاعات شخص</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">دانش‌آموز</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">معلم</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                پس از انتخاب، اطلاعات مالی شخص نمایش داده می‌شود.
              </p>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            دانش‌آموزان و معلمان فقط اطلاعات مالی خود را مشاهده می‌کنند. انتخاب
            شخص برای آن‌ها خودکار است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "transaction-management",
    title: "مدیریت تراکنش‌ها",
    icon: CreditCard,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          تراکنش‌های مالی شامل دو نوع بدهی (debit) و بستانکاری (credit) هستند.
          هر تراکنش شامل جزئیات کاملی از مبلغ، روش پرداخت، دسته‌بندی و اسناد
          است.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                تراکنش‌های بدهی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                مبالغی که باید پرداخت شوند:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">شهریه</Badge>
                  <span>پرداخت شهریه ماهانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">کتاب</Badge>
                  <span>خرید کتاب و لوازم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">امتحان</Badge>
                  <span>هزینه امتحان</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">غذا</Badge>
                  <span>هزینه غذا</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                تراکنش‌های بستانکاری
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                مبالغی که دریافت شده:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">حقوق</Badge>
                  <span>پرداخت حقوق معلم</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">پاداش</Badge>
                  <span>پاداش و جایزه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">بورسیه</Badge>
                  <span>کمک هزینه تحصیلی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">بازگشت</Badge>
                  <span>بازگشت وجه</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">روش‌های پرداخت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Badge variant="secondary">نقدی</Badge>
              <Badge variant="secondary">بانکی</Badge>
              <Badge variant="secondary">حواله</Badge>
              <Badge variant="secondary">چک</Badge>
              <Badge variant="secondary">کارتی</Badge>
              <Badge variant="secondary">بورسیه</Badge>
              <Badge variant="secondary">سایر</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">فیلدهای تراکنش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">مبلغ:</span>
                <span>مبلغ تراکنش به ریال</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">شرح:</span>
                <span>توضیحات تراکنش</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">شماره فیش:</span>
                <span>شماره رسید یا فیش</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">شماره مرجع:</span>
                <span>شماره مرجع بانکی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">تاریخ:</span>
                <span>تاریخ انجام تراکنش</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium">یادداشت:</span>
                <span>توضیحات اضافی</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  },
  {
    id: "document-management",
    title: "مدیریت اسناد و مدارک",
    icon: FileText,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          برای هر تراکنش می‌توانید اسناد و مدارک مربوطه را آپلود کنید. این اسناد
          به عنوان مدرک پشتیبان تراکنش نگهداری می‌شوند.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">آپلود اسناد</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">انتخاب فایل</h4>
                  <p className="text-sm text-gray-600">
                    روی دکمه "انتخاب فایل" کلیک کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">آپلود خودکار</h4>
                  <p className="text-sm text-gray-600">
                    فایل به صورت خودکار آپلود می‌شود
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">مدیریت اسناد</h4>
                  <p className="text-sm text-gray-600">
                    مشاهده، دانلود یا حذف اسناد
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">فرمت‌های پشتیبانی شده</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">PDF</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">تصاویر (JPG, PNG)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">فایل‌های متنی</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">نکات مهم</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• حداکثر اندازه فایل: 10MB</li>
                <li>• تعداد فایل‌ها محدود نیست</li>
                <li>• فایل‌ها به صورت امن ذخیره می‌شوند</li>
                <li>• امکان حذف فایل‌ها وجود دارد</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            برای تراکنش‌های مهم، حتماً مدارک مربوطه مانند فیش واریزی، چک یا قبض
            را آپلود کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "bulk-operations",
    title: "عملیات دسته‌جمعی",
    icon: Users,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          برای ثبت تراکنش یکسان برای تمام دانش‌آموزان یک کلاس (مثل شهریه
          ماهانه)، می‌توانید از قابلیت ثبت دسته‌جمعی استفاده کنید.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">مراحل ثبت دسته‌جمعی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium">انتخاب کلاس</h4>
                  <p className="text-sm text-gray-600">
                    کلاس مورد نظر را انتخاب کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium">تنظیم اطلاعات</h4>
                  <p className="text-sm text-gray-600">
                    نوع تراکنش، مبلغ و توضیحات را وارد کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium">بررسی و تأیید</h4>
                  <p className="text-sm text-gray-600">
                    لیست دانش‌آموزان را بررسی کنید
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium">ثبت نهایی</h4>
                  <p className="text-sm text-gray-600">
                    تراکنش برای همه دانش‌آموزان ثبت می‌شود
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">کاربردهای متداول</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">شهریه</Badge>
                  <span className="text-sm">ثبت شهریه ماهانه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">کتاب</Badge>
                  <span className="text-sm">هزینه کتاب کلاسی</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">فعالیت</Badge>
                  <span className="text-sm">هزینه اردو یا فعالیت</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">غذا</Badge>
                  <span className="text-sm">هزینه غذا برای یک ماه</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">مزایا</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                <li>• صرفه‌جویی در زمان</li>
                <li>• کاهش خطای انسانی</li>
                <li>• یکسان‌سازی اطلاعات</li>
                <li>• سرعت بالا در ثبت</li>
                <li>• امکان بازگشت عملیات</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            قبل از ثبت دسته‌جمعی، حتماً اطلاعات و لیست دانش‌آموزان را بررسی
            کنید. این عملیات قابل بازگشت است.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
  {
    id: "reports-summary",
    title: "گزارش‌ها و خلاصه مالی",
    icon: TrendingUp,
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          سیستم حسابداری گزارش‌های مالی جامعی ارائه می‌دهد که شامل خلاصه کل
          مدرسه و گزارش‌های فردی است.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">خلاصه کل مدرسه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">کل بدهی‌ها</h4>
                  <p className="text-sm text-gray-600">
                    مجموع تمام تراکنش‌های بدهی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">کل اعتبارات</h4>
                  <p className="text-sm text-gray-600">
                    مجموع تمام تراکنش‌های بستانکاری
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <div>
                  <h4 className="font-medium">موجودی کل</h4>
                  <p className="text-sm text-gray-600">
                    تفاوت اعتبارات و بدهی‌ها
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">گزارش‌های فردی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">موجودی شخصی</h4>
                  <p className="text-sm text-gray-600">محاسبه موجودی هر فرد</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">تاریخچه تراکنش‌ها</h4>
                  <p className="text-sm text-gray-600">
                    لیست کامل تراکنش‌های فردی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">تحلیل مالی</h4>
                  <p className="text-sm text-gray-600">
                    نمودار تراکنش‌ها در زمان
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                وضعیت مثبت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                اعتبارات بیشتر از بدهی‌ها - وضعیت مالی مطلوب
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                وضعیت منفی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                بدهی‌ها بیشتر از اعتبارات - نیاز به پیگیری
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                وضعیت متعادل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                بدهی‌ها و اعتبارات برابر - وضعیت متعادل
              </p>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            گزارش‌ها به صورت آنی محاسبه می‌شوند و همیشه به‌روز هستند. برای
            دریافت گزارش‌های تفصیلی، از دکمه تنظیمات استفاده کنید.
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
          برای استفاده بهینه از سیستم حسابداری، نکات زیر را رعایت کنید:
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
                <li>• همیشه توضیحات کامل وارد کنید</li>
                <li>• شماره فیش و مرجع را دقیق ثبت کنید</li>
                <li>• مدارک مربوطه را آپلود کنید</li>
                <li>• تاریخ تراکنش را صحیح وارد کنید</li>
                <li>• از دسته‌بندی‌های مناسب استفاده کنید</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                نکات امنیتی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• از صحت اطلاعات اطمینان حاصل کنید</li>
                <li>• تراکنش‌های مهم را دوبار چک کنید</li>
                <li>• مدارک حساس را امن نگهداری کنید</li>
                <li>• از پسوردهای قوی استفاده کنید</li>
                <li>• فایل‌های غیرضروری را حذف کنید</li>
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
                <Badge variant="outline">Ctrl+F</Badge>
                <span className="text-sm">جستجو در صفحه</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Ctrl+R</Badge>
                <span className="text-sm">بروزرسانی صفحه</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">Escape</Badge>
                <span className="text-sm">بستن فرم‌ها</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">رفع مشکلات متداول</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">تراکنش ثبت نمی‌شود</h4>
                <p className="text-sm text-gray-600">
                  بررسی کنید تمام فیلدهای اجباری پر شده باشند و شخص انتخاب شده
                  باشد.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">فایل آپلود نمی‌شود</h4>
                <p className="text-sm text-gray-600">
                  اندازه فایل نباید از 10MB بیشتر باشد و فرمت آن پشتیبانی شده
                  باشد.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">
                  گزارش نمایش داده نمی‌شود
                </h4>
                <p className="text-sm text-gray-600">
                  صفحه را بروزرسانی کنید و اطمینان حاصل کنید اتصال اینترنت
                  برقرار است.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            برای سؤالات تخصصی یا مشکلات فنی، با مدیر سیستم تماس بگیرید. همیشه
            نسخه پشتیبان از اطلاعات مهم تهیه کنید.
          </AlertDescription>
        </Alert>
      </div>
    ),
  },
];
