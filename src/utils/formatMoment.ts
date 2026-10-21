import { locale, type Locale } from '@/i18n';

/** Formats a timestamp as short date and time in the page language. */
export function formatMoment(at: number | string, current: Locale = locale.value) {
  return new Intl.DateTimeFormat(current === 'it' ? 'it-IT' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(at));
}
