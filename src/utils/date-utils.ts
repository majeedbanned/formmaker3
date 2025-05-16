/**
 * Date utility functions for conversion between Gregorian and Persian calendars
 */

/**
 * Convert Gregorian date to Jalali (Persian) date
 * @param gy Gregorian year
 * @param gm Gregorian month (1-12)
 * @param gd Gregorian day
 * @returns [year, month, day] in Jalali calendar
 */
export function gregorian_to_jalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy = gy <= 1600 ? gy - 621 : gy - 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  const jm =
    days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? (days % 31) + 1 : ((days - 186) % 30) + 1;
  return [jy, jm, jd];
}

/**
 * Convert Jalali (Persian) date to Gregorian date
 * @param jy Jalali year
 * @param jm Jalali month (1-12)
 * @param jd Jalali day
 * @returns [year, month, day] in Gregorian calendar
 */
export function jalali_to_gregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy = jy <= 979 ? jy + 0 : jy - 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return [gy, gm, gd];
}

/**
 * Format a date in Persian format
 * @param date JavaScript Date object
 * @returns Persian formatted date string
 */
export function formatPersianDate(date: Date): string {
  const [jYear, jMonth, jDay] = gregorian_to_jalali(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  );
  
  // Convert numbers to Persian digits
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const toPersianDigit = (num: number): string => {
    return String(num)
      .split("")
      .map((digit) => persianDigits[parseInt(digit, 10)] || digit)
      .join("");
  };
  
  return `${toPersianDigit(jYear)}/${toPersianDigit(jMonth)}/${toPersianDigit(jDay)}`;
}

/**
 * Get current Persian (Jalali) date
 * @returns [year, month, day] in Jalali calendar for current date
 */
export function getCurrentPersianDate(): [number, number, number] {
  const now = new Date();
  return gregorian_to_jalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
} 