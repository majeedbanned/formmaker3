/**
 * Returns the current date in Persian (Jalali) calendar format
 * Format: YYYY/MM/DD
 */
export function getPersianDate(): string {
  const now = new Date();
  
  // Get Persian date using Intl.DateTimeFormat
  const persianDate = new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  
  return persianDate;
} 