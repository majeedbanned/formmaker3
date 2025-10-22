import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';

// Helper function for Persian date conversion (same as used in other parts of the codebase)
function gregorian_to_jalali(gy: number, gm: number, gd: number): [number, number, number] {
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

// Fix the comment too:
// Convert Latin digits to Persian digits
function toPersianDigits(str: string): string {
  const persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return str.replace(/[0-9]/g, d => persianDigits[+d]);
}

export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const gy = now.getFullYear();
    const gm = now.getMonth() + 1;
    const gd = now.getDate();
    const [jy, jm, jd] = gregorian_to_jalali(gy, gm, gd);

    const persianDate = `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
    const persianTime = dayjs(now).format('HH:mm'); // <-- 24h format

    const persianDateWithDigits = toPersianDigits(persianDate);
    const persianTimeWithDigits = toPersianDigits(persianTime);

    return NextResponse.json({
      success: true,
      serverTime: {
        iso: now.toISOString(),
        persian: `${persianDateWithDigits} ${persianTimeWithDigits}`,
        persianDate: persianDateWithDigits,
        persianTime: persianTimeWithDigits,
        timestamp: now.getTime()
      }
    });
  } catch (e) {
    return NextResponse.json({ success:false, message:'خطا در دریافت زمان سرور' }, { status:500 });
  }
}
