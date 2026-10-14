import { locale, type Locale } from '@/i18n';

/** A moment in the language of the page, date and time. */
export function formatMoment(at: number | string, current: Locale = locale.value) {
  return new Intl.DateTimeFormat(current === 'it' ? 'it-IT' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(at));
}
