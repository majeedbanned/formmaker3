import moment from 'jalali-moment';

/**
 * Converts a Date object to a Persian (Jalali) date string
 * @param date The date to convert
 * @param format The output format (optional)
 * @returns Formatted Persian date string
 */
export const toPersianDate = (date: Date | string | number, format = 'YYYY/MM/DD'): string => {
  if (!date) return '';
  return moment(date).locale('fa').format(format);
};

/**
 * Converts a Date object to a Persian (Jalali) date and time string
 * @param date The date to convert
 * @returns Formatted Persian date and time string
 */
export const toPersianDateTime = (date: Date | string | number): string => {
  if (!date) return '';
  return moment(date).locale('fa').format('YYYY/MM/DD HH:mm:ss');
};

/**
 * Formats a date as a relative time (e.g., "3 hours ago")
 * @param date The date to format
 * @returns Relative time string in Persian
 */
export const toRelativeTime = (date: Date | string | number): string => {
  if (!date) return '';
  return moment(date).locale('fa').fromNow();
};

/**
 * Gets only the time portion of a date in HH:MM format
 * @param date The date to format
 * @returns Time string in HH:MM format
 */
export const getTimeFromDate = (date: Date | string | number): string => {
  if (!date) return '';
  return moment(date).format('HH:mm');
};
