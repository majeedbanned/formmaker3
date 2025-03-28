import { getDynamicModel } from "@/lib/mongodb";
import { connectToDatabase } from "@/lib/mongodb";

interface PredefinedCourse {
  courseCode: string;
  courseName: string;
  Grade: string;
  vahed?: number;
  major?: string;
}







const predefinedCourses: Record<string, PredefinedCourse[]> = {
  "1": [ // ابتدایی
    { courseCode: "101", courseName: "آموزش قرآن", Grade: "1" },
    { courseCode: "103", courseName: "فارسی", Grade: "1" },
    { courseCode: "104", courseName: "نگارش فارسی", Grade: "1" },
    { courseCode: "105", courseName: "ریاضی", Grade: "1" },
    { courseCode: "106", courseName: "علوم تجربی", Grade: "1" },
    { courseCode: "219", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - دوم", Grade: "2" },
    { courseCode: "220", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - دوم", Grade: "2" },
    { courseCode: "201", courseName: "آموزش قرآن", Grade: "2" },
    { courseCode: "202", courseName: "هدیه های آسمان", Grade: "2" },
    { courseCode: "203", courseName: "فارسی", Grade: "2" },
    { courseCode: "204", courseName: "نگارش فارسی", Grade: "2" },
    { courseCode: "205", courseName: "ریاضی", Grade: "2" },
    { courseCode: "206", courseName: "علوم تجربی", Grade: "2" },
    { courseCode: "301", courseName: "آموزش قرآن", Grade: "3" },
    { courseCode: "302", courseName: "هدیه های آسمان", Grade: "3" },
    { courseCode: "303", courseName: "فارسی", Grade: "3" },
    { courseCode: "304", courseName: "نگارش فارسی", Grade: "3" },
    { courseCode: "305", courseName: "ریاضی", Grade: "3" },
    { courseCode: "306", courseName: "علوم تجربی", Grade: "3" },
    { courseCode: "307", courseName: "مطالعات اجتماعی", Grade: "3" },
    { courseCode: "319", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - سوم", Grade: "3" },
    { courseCode: "320", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - سوم", Grade: "3" },
    { courseCode: "401", courseName: "آموزش قرآن", Grade: "4" },
    { courseCode: "402", courseName: "هدیه های آسمان", Grade: "4" },
    { courseCode: "403", courseName: "فارسی", Grade: "4" },
    { courseCode: "404", courseName: "نگارش فارسی", Grade: "4" },
    { courseCode: "405", courseName: "ریاضی", Grade: "4" },
    { courseCode: "406", courseName: "علوم تجربی", Grade: "4" },
    { courseCode: "407", courseName: "مطالعات اجتماعی", Grade: "4" },
    { courseCode: "408", courseName: "کتاب کار آموزش خط تحریری چهارم دبستان", Grade: "4" },
    { courseCode: "419", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - چهارم", Grade: "4" },
    { courseCode: "420", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - چهارم", Grade: "4" },
    { courseCode: "501", courseName: "آموزش قرآن", Grade: "5" },
    { courseCode: "502", courseName: "هدیه های آسمان", Grade: "5" },
    { courseCode: "503", courseName: "فارسی", Grade: "5" },
    { courseCode: "504", courseName: "نگارش فارسی", Grade: "5" },
    { courseCode: "505", courseName: "ریاضی", Grade: "5" },
    { courseCode: "506", courseName: "علوم تجربی", Grade: "5" },
    { courseCode: "507", courseName: "مطالعات اجتماعی", Grade: "5" },
    { courseCode: "508", courseName: "کتاب کار آموزش خط تحریری پنجم دبستان", Grade: "5" },
    { courseCode: "519", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - پنجم", Grade: "5" },
    { courseCode: "520", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - پنجم", Grade: "5" },
    { courseCode: "601", courseName: "آموزش قرآن", Grade: "6" },
    { courseCode: "602", courseName: "هدیه های آسمان", Grade: "6" },
    { courseCode: "603", courseName: "فارسی", Grade: "6" },
    { courseCode: "604", courseName: "نگارش فارسی", Grade: "6" },
    { courseCode: "605", courseName: "ریاضی", Grade: "6" },
    { courseCode: "606", courseName: "علوم تجربی", Grade: "6" },
    { courseCode: "607", courseName: "مطالعات اجتماعی", Grade: "6" },
    { courseCode: "612", courseName: "تفکر و پژوهش", Grade: "6" },
    { courseCode: "617", courseName: "کار و فناوری", Grade: "6" },
    { courseCode: "6171", courseName: "کار و فناوری (اجرای آزمایشی)", Grade: "6" },
    { courseCode: "619", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - ششم", Grade: "6" },
    { courseCode: "620", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - ششم", Grade: "6" },
    

    
   

    // Add more courses for other grades...
  ],
  "2": [ // متوسطه اول
    { courseCode: "701", courseName: "آموزش قرآن", Grade: "7" },
    { courseCode: "702", courseName: "پیام های آسمان", Grade: "7" },
    { courseCode: "703", courseName: "فارسی", Grade: "7" },
    { courseCode: "704", courseName: "نگارش فارسی", Grade: "7" },
    { courseCode: "705", courseName: "ریاضی", Grade: "7" },
    { courseCode: "706", courseName: "علوم تجربی", Grade: "7" },
    { courseCode: "707", courseName: "مطالعات اجتماعی", Grade: "7" },
    { courseCode: "708", courseName: "فرهنگ و هنر", Grade: "7" },
    { courseCode: "709", courseName: "عربی", Grade: "7" },
    { courseCode: "710", courseName: "انگلیسی", Grade: "7" },
    { courseCode: "711", courseName: "کتاب کار انگلیسی", Grade: "7" },
    { courseCode: "712", courseName: "تفکر و سبک زندگی (پسران)", Grade: "7" },
    { courseCode: "713", courseName: "تفکر و سبک زندگی (دختران)", Grade: "7" },
    { courseCode: "717", courseName: "کار و فناوری", Grade: "7" },
    { courseCode: "7171", courseName: "کار و فناوری (اجرای آزمایشی)", Grade: "7" },
    { courseCode: "719", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - هفتم", Grade: "7" },
    { courseCode: "720", courseName: "هدیه های آسمان (ویژه اقلیت های دینی) - هفتم", Grade: "7" },
    { courseCode: "722", courseName: "فارسی و نگارش (ویژه مدارس استعداد درخشان) - هفتم", Grade: "7" },
    { courseCode: "723", courseName: "ریاضیات (محتوای تکمیلی ویژه مدارس استعدادهای درخشان) - هفتم", Grade: "7" },
    { courseCode: "724", courseName: "علوم تجربی (محتوای تکمیلی ویژه مدارس استعدادهای درخشان) - هفتم", Grade: "7" },
    { courseCode: "741", courseName: "تربیت دینی", Grade: "7" },
    { courseCode: "742", courseName: "ضمیمه از من تا خدا (تربیت دینی) (اهل سنت) - هفتم", Grade: "7" },
    { courseCode: "801", courseName: "آموزش قرآن", Grade: "8" },
    { courseCode: "802", courseName: "پیام های آسمان", Grade: "8" },
    { courseCode: "803", courseName: "فارسی", Grade: "8" },
    { courseCode: "804", courseName: "نگارش فارسی", Grade: "8" },
    { courseCode: "805", courseName: "ریاضی", Grade: "8" },
    { courseCode: "806", courseName: "علوم تجربی", Grade: "8" },
    { courseCode: "807", courseName: "مطالعات اجتماعی", Grade: "8" },
    { courseCode: "808", courseName: "فرهنگ و هنر", Grade: "8" },
    { courseCode: "809", courseName: "عربی", Grade: "8" },
    { courseCode: "810", courseName: "انگلیسی", Grade: "8" },
    { courseCode: "811", courseName: "کتاب کار انگلیسی", Grade: "8" },
    { courseCode: "812", courseName: "تفکر و سبک زندگی", Grade: "8" },
    { courseCode: "814", courseName: "تفکر و سبک زندگی (پسران)", Grade: "8" },
    { courseCode: "817", courseName: "کار و فناوری", Grade: "8" },
    { courseCode: "8171", courseName: "کار و فناوری (اجرای آزمایشی)", Grade: "8" },
    { courseCode: "819", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - هشتم", Grade: "8" },
    { courseCode: "820", courseName: "تعلیمات ادیان الهی و اخلاق (ویژه اقلیت های دینی) - هشتم", Grade: "8" },
    { courseCode: "822", courseName: "فارسی و نگارش (ویژه مدارس استعداد درخشان) - هشتم", Grade: "8" },
    { courseCode: "823", courseName: "ریاضیات (محتوای تکمیلی ویژه مدارس استعداد درخشان) - هشتم", Grade: "8" },
    { courseCode: "824", courseName: "علوم تجربی (محتوای تکمیلی ویژه مدارس استعداد درخشان) - هشتم", Grade: "8" },
    { courseCode: "901", courseName: "آموزش قرآن", Grade: "9" },
    { courseCode: "902", courseName: "پیام های آسمان", Grade: "9" },
    { courseCode: "903", courseName: "فارسی", Grade: "9" },
    { courseCode: "904", courseName: "نگارش فارسی", Grade: "9" },
    { courseCode: "905", courseName: "ریاضی", Grade: "9" },
    { courseCode: "906", courseName: "علوم تجربی", Grade: "9" },
    { courseCode: "907", courseName: "مطالعات اجتماعی", Grade: "9" },
    { courseCode: "908", courseName: "فرهنگ و هنر", Grade: "9" },
    { courseCode: "909", courseName: "عربی", Grade: "9" },
    { courseCode: "910", courseName: "انگلیسی", Grade: "9" },
    { courseCode: "911", courseName: "کتاب کار انگلیسی", Grade: "9" },
    { courseCode: "915", courseName: "آمادگی دفاعی", Grade: "9" },
    { courseCode: "917", courseName: "کار و فناوری", Grade: "9" },
    { courseCode: "919", courseName: "ضمیمه کتاب هدیه های آسمان (ویژه اهل سنت) - نهم", Grade: "9" },
    { courseCode: "920", courseName: "تعلیمات ادیان الهی و اخلاق (ویژه اقلیت های دینی) - نهم", Grade: "9" },
    { courseCode: "922", courseName: "فارسی و نگارش (ویژه مدارس استعداد درخشان) - نهم", Grade: "9" },
    { courseCode: "923", courseName: "ریاضیات (محتوای تکمیلی ویژه مدارس استعداد درخشان) - نهم", Grade: "9" },
    { courseCode: "924", courseName: "علوم تجربی (محتوای تکمیلی ویژه مدارس استعداد درخشان) - نهم", Grade: "9" },

    
    
    
    
    


    
    
    

    // Add more courses for other grades...
  ],
  "3": [ // متوسطه دوم



    {courseCode: "12331", courseName: "فيزيك3", Grade: "12", vahed: 3, major: "16000"},
    {courseCode: "12161", courseName: "رياضي3", Grade: "12", vahed: 4, major: "16000"},
    {courseCode: "12151", courseName: "زيست شناسي 3", Grade: "12", vahed: 4, major: "16000"},
    {courseCode: "12141", courseName: "علوم اجتماعي", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12131", courseName: "مديريت خانواده و سبك زندگي", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12121", courseName: "سلامت و بهداشت", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12111", courseName: "شيمي 3", Grade: "12", vahed: 4, major: "16000"},
    {courseCode: "12091", courseName: "تربيت بدني 3", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12081", courseName: "زبان خارجي3", Grade: "12", vahed: 4, major: "16000"},
    {courseCode: "12041", courseName: "نگارش 3", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12031", courseName: "فارسي 3", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12021", courseName: "عربي، زبان قرآن3", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "12011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 3", Grade: "12", vahed: 2, major: "16000"},
    {courseCode: "11331", courseName: "فيزيك2", Grade: "11", vahed: 3, major: "16000"},
    {courseCode: "11171", courseName: "زيست شناسي 2", Grade: "11", vahed: 4, major: "16000"},
    {courseCode: "11161", courseName: "رياضي2", Grade: "11", vahed: 4, major: "16000"},
    {courseCode: "11151", courseName: "زمين شناسي", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11141", courseName: "تاريخ معاصر", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11131", courseName: "انسان و محيط زيست", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11121", courseName: "آزمايشگاه علوم تجربي 2", Grade: "11", vahed: 1, major: "16000"},
    {courseCode: "11111", courseName: "شيمي 2", Grade: "11", vahed: 3, major: "16000"},
    {courseCode: "11092", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11091", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11081", courseName: "زبان خارجي2", Grade: "11", vahed: 3, major: "16000"},
    {courseCode: "11041", courseName: "نگارش 2", Grade: "11", vahed: 1, major: "16000"},
    {courseCode: "11031", courseName: "فارسي 2", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11021", courseName: "عربي، زبان قرآن2", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "11011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 2", Grade: "11", vahed: 2, major: "16000"},
    {courseCode: "10291", courseName: "فيزيك1", Grade: "10", vahed: 3, major: "16000"},
    {courseCode: "10141", courseName: "زيست شناسي 1", Grade: "10", vahed: 3, major: "16000"},
    {courseCode: "10131", courseName: "جغرافياي عمومي و استان شناسي", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10121", courseName: "آزمايشگاه علوم تجربي 1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10111", courseName: "شيمي 1", Grade: "10", vahed: 3, major: "16000"},
    {courseCode: "10092", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10091", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10081", courseName: "زبان خارجي1", Grade: "10", vahed: 3, major: "16000"},
    {courseCode: "10071", courseName: "آمادگي دفاعي", Grade: "10", vahed: 3, major: "16000"},
    {courseCode: "10051", courseName: "رياضي1", Grade: "10", vahed: 4, major: "16000"},
    {courseCode: "10041", courseName: "نگارش 1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10031", courseName: "فارسي 1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10021", courseName: "عربي، زبان قرآن1", Grade: "10", vahed: 2, major: "16000"},
    {courseCode: "10011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 1", Grade: "10", vahed: 2, major: "16000"},



    {courseCode: "12141", courseName: "علوم اجتماعي", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12131", courseName: "مديريت خانواده و سبك زندگي", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12121", courseName: "سلامت و بهداشت", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12111", courseName: "شيمي 3", Grade: "12", vahed: 4, major: "15000"},
{courseCode: "12101", courseName: "فيزيك 3", Grade: "12", vahed: 4, major: "15000"},
{courseCode: "12091", courseName: "تربيت بدني 3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12081", courseName: "زبان خارجي3", Grade: "12", vahed: 4, major: "15000"},
{courseCode: "12071", courseName: "رياضيات گسسته", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12061", courseName: "حسابان 2", Grade: "12", vahed: 3, major: "15000"},
{courseCode: "12051", courseName: "هندسه 3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12041", courseName: "نگارش 3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12031", courseName: "فارسي 3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12021", courseName: "عربي، زبان قرآن3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "12011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 3", Grade: "12", vahed: 2, major: "15000"},
{courseCode: "11151", courseName: "زمين شناسي", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11141", courseName: "تاريخ معاصر", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11131", courseName: "انسان و محيط زيست", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11121", courseName: "آزمايشگاه علوم تجربي 2", Grade: "11", vahed: 1, major: "15000"},
{courseCode: "11111", courseName: "شيمي 2", Grade: "11", vahed: 3, major: "15000"},
{courseCode: "11101", courseName: "فيزيك 2", Grade: "11", vahed: 4, major: "15000"},
{courseCode: "11092", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11091", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11081", courseName: "زبان خارجي2", Grade: "11", vahed: 3, major: "15000"},
{courseCode: "11071", courseName: "آمار و احتمال", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11061", courseName: "حسابان 1", Grade: "11", vahed: 3, major: "15000"},
{courseCode: "11051", courseName: "هندسه 2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11041", courseName: "نگارش 2", Grade: "11", vahed: 1, major: "15000"},
{courseCode: "11031", courseName: "فارسي 2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11021", courseName: "عربي، زبان قرآن2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "11011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 2", Grade: "11", vahed: 2, major: "15000"},
{courseCode: "10131", courseName: "جغرافياي عمومي و استان شناسي", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10121", courseName: "آزمايشگاه علوم تجربي 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10111", courseName: "شيمي 1", Grade: "10", vahed: 3, major: "15000"},
{courseCode: "10101", courseName: "فيزيك 1", Grade: "10", vahed: 4, major: "15000"},
{courseCode: "10092", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10091", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10081", courseName: "زبان خارجي1", Grade: "10", vahed: 3, major: "15000"},
{courseCode: "10071", courseName: "آمادگي دفاعي", Grade: "10", vahed: 3, major: "15000"},
{courseCode: "10061", courseName: "هندسه 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10051", courseName: "رياضي1", Grade: "10", vahed: 4, major: "15000"},
{courseCode: "10041", courseName: "نگارش 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10031", courseName: "فارسي 1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10021", courseName: "عربي، زبان قرآن1", Grade: "10", vahed: 2, major: "15000"},
{courseCode: "10011", courseName: "تعليمات ديني (ديني، اخلاق و قرآن) 1", Grade: "10", vahed: 2, major: "15000"},



{courseCode: "12251", courseName: "فلسفه 2", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12241", courseName: "مطالعات فرهنگي", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12231", courseName: "جامعه شناسي 3", Grade: "12", vahed: 3, major: "17000"},
{courseCode: "12221", courseName: "تاريخ 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12211", courseName: "جغرافيا 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12201", courseName: "رياضي و آمار 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12191", courseName: "علوم و فنون ادبي 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12181", courseName: "عربي (ادبيات و علوم انساني) 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12171", courseName: "تعليمات ديني (ديني، اخلاق و قرآن)3", Grade: "12", vahed: 4, major: "17000"},
{courseCode: "12131", courseName: "مديريت خانواده و سبك زندگي", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12121", courseName: "سلامت و بهداشت", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12091", courseName: "تربيت بدني 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12081", courseName: "زبان خارجي3", Grade: "12", vahed: 4, major: "17000"},
{courseCode: "12041", courseName: "نگارش 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "12031", courseName: "فارسي 3", Grade: "12", vahed: 2, major: "17000"},
{courseCode: "11261", courseName: "فلسفه 1", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11251", courseName: "روان شناسي", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11241", courseName: "جامعه شناسي 2", Grade: "11", vahed: 3, major: "17000"},
{courseCode: "11231", courseName: "تاريخ 2", Grade: "11", vahed: 3, major: "17000"},
{courseCode: "11221", courseName: "جغرافيا 2", Grade: "11", vahed: 3, major: "17000"},
{courseCode: "11211", courseName: "رياضي و آمار 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11201", courseName: "علوم و فنون ادبي 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11191", courseName: "عربي (ادبيات و علوم انساني) 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11181", courseName: "تعليمات ديني (ديني، اخلاق و قرآن)2", Grade: "11", vahed: 4, major: "17000"},
{courseCode: "11131", courseName: "انسان و محيط زيست", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11092", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11091", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "11081", courseName: "زبان خارجي2", Grade: "11", vahed: 3, major: "17000"},
{courseCode: "11041", courseName: "نگارش 2", Grade: "11", vahed: 1, major: "17000"},
{courseCode: "11031", courseName: "فارسي 2", Grade: "11", vahed: 2, major: "17000"},
{courseCode: "10221", courseName: "منطق", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10211", courseName: "اقتصاد", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10201", courseName: "جامعه شناسي 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10191", courseName: "تاريخ 1", Grade: "10", vahed: 3, major: "17000"},
{courseCode: "10181", courseName: "رياضي و آمار 1", Grade: "10", vahed: 3, major: "17000"},
{courseCode: "10171", courseName: "علوم و فنون ادبي 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10161", courseName: "عربي (ادبيات و علوم انساني) 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10151", courseName: "تعليمات ديني (ديني، اخلاق و قرآن)1", Grade: "10", vahed: 3, major: "17000"},
{courseCode: "10131", courseName: "جغرافياي عمومي و استان شناسي", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10092", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10091", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10081", courseName: "زبان خارجي1", Grade: "10", vahed: 3, major: "17000"},
{courseCode: "10071", courseName: "آمادگي دفاعي", Grade: "10", vahed: 3, major: "17000"},
{courseCode: "10041", courseName: "نگارش 1", Grade: "10", vahed: 2, major: "17000"},
{courseCode: "10031", courseName: "فارسي 1", Grade: "10", vahed: 2, major: "17000"},



{courseCode: "12321", courseName: "تاريخ 3 (علوم و معارف اسلامي)", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12311", courseName: "جريان شناسي انديشه‌هاي معاصر", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12301", courseName: "عربي (علوم و معارف اسلامي) 3", Grade: "12", vahed: 4, major: "18000"},
{courseCode: "12291", courseName: "اخلاق 3", Grade: "12", vahed: 1, major: "18000"},
{courseCode: "12281", courseName: "احكام 3", Grade: "12", vahed: 1, major: "18000"},
{courseCode: "12271", courseName: "اصول عقايد 3", Grade: "12", vahed: 3, major: "18000"},
{courseCode: "12261", courseName: "علوم و معارف قرآني 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12251", courseName: "فلسفه 2", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12201", courseName: "رياضي و آمار 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12191", courseName: "علوم و فنون ادبي 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12131", courseName: "مديريت خانواده و سبك زندگي", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12121", courseName: "سلامت و بهداشت", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12091", courseName: "تربيت بدني 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12081", courseName: "زبان خارجي3", Grade: "12", vahed: 4, major: "18000"},
{courseCode: "12041", courseName: "نگارش 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12031", courseName: "فارسي 3", Grade: "12", vahed: 2, major: "18000"},
{courseCode: "12241", courseName: "مطالعات فرهنگي", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11321", courseName: "تاريخ 2 (علوم و معارف اسلامي)", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11311", courseName: "عربي (علوم و معارف اسلامي) 2", Grade: "11", vahed: 3, major: "18000"},
{courseCode: "11301", courseName: "اخلاق 2", Grade: "11", vahed: 1, major: "18000"},
{courseCode: "11291", courseName: "احكام 2", Grade: "11", vahed: 1, major: "18000"},
{courseCode: "11281", courseName: "اصول عقايد 2", Grade: "11", vahed: 3, major: "18000"},
{courseCode: "11271", courseName: "علوم و معارف قرآني 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11261", courseName: "فلسفه 1", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11251", courseName: "روان شناسي", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11211", courseName: "رياضي و آمار 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11201", courseName: "علوم و فنون ادبي 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11131", courseName: "انسان و محيط زيست", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11092", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11091", courseName: "تربيت بدني 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "11081", courseName: "زبان خارجي2", Grade: "11", vahed: 3, major: "18000"},
{courseCode: "11041", courseName: "نگارش 2", Grade: "11", vahed: 1, major: "18000"},
{courseCode: "11031", courseName: "فارسي 2", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "10211", courseName: "اقتصاد", Grade: "11", vahed: 2, major: "18000"},
{courseCode: "10281", courseName: "تاريخ 1 (علوم و معارف اسلامي)", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10271", courseName: "عربي (علوم و معارف اسلامي) 1", Grade: "10", vahed: 3, major: "18000"},
{courseCode: "10261", courseName: "اخلاق 1", Grade: "10", vahed: 1, major: "18000"},
{courseCode: "10251", courseName: "احكام 1", Grade: "10", vahed: 1, major: "18000"},
{courseCode: "10241", courseName: "اصول عقايد 1", Grade: "10", vahed: 3, major: "18000"},
{courseCode: "10231", courseName: "علوم و معارف قرآني 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10221", courseName: "منطق", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10201", courseName: "جامعه شناسي 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10181", courseName: "رياضي و آمار 1", Grade: "10", vahed: 3, major: "18000"},
{courseCode: "10171", courseName: "علوم و فنون ادبي 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10131", courseName: "جغرافياي عمومي و استان شناسي", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10092", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10091", courseName: "تربيت بدني 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10081", courseName: "زبان خارجي1", Grade: "10", vahed: 3, major: "18000"},
{courseCode: "10071", courseName: "آمادگي دفاعي", Grade: "10", vahed: 3, major: "18000"},
{courseCode: "10041", courseName: "نگارش 1", Grade: "10", vahed: 2, major: "18000"},
{courseCode: "10031", courseName: "فارسي 1", Grade: "10", vahed: 2, major: "18000"}

    
    
    
    
    
   
    
    
    
    
    
    


    

    

    

    
    
    
   
    // Add more courses for other grades and majors...
  ]
};

export async function addPredefinedCourses(schoolCode: string, maghta: string) {
  try {
    // Ensure MongoDB connection is established
    const connectionString = process.env.NEXT_PUBLIC_MONGODB_URI;
    if (!connectionString) {
      throw new Error("MongoDB connection string is not configured");
    }
    
    await connectToDatabase(connectionString);

    // Get the courses model
    const model = getDynamicModel("courses");

    // Check if there are any existing courses for this school
    const existingCourses = await model.find({ 'data.schoolCode': schoolCode });
    
    if (existingCourses.length > 0) {
      // console.log(`Courses already exist for school ${schoolCode}`);
      return;
    }

    // Get predefined courses for the maghta
    const courses = predefinedCourses[maghta];
    if (!courses) {
      // console.log(`No predefined courses found for maghta ${maghta}`);
      return;
    }

    // Add schoolCode to each course
    const coursesWithSchoolCode = courses.map(course => ({
      ...course,
      schoolCode
    }));

    // Insert all courses
    const result = await model.insertMany(
      coursesWithSchoolCode.map(course => ({
        data: new Map(Object.entries(course))
      }))
    );

    // console.log(`Added ${result.length} predefined courses for school ${schoolCode}`);
    return result;
  } catch (error) {
    console.error('Error adding predefined courses:', error);
    throw error;
  }
} 