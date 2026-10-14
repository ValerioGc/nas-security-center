import { afterEach, expect, it } from 'vitest';
import { setLocale } from '@/i18n';
import { formatMoment } from '@/utils/formatMoment';

afterEach(() => setLocale('it'));

it('writes a moment in the language asked for, or in the one of the page', () => {
  const at = Date.UTC(2026, 9, 2, 9, 30);

  expect(formatMoment(at, 'it')).toMatch(/02\/10\/26/);
  expect(formatMoment(at, 'en')).toMatch(/02\/10\/2026/);
  expect(formatMoment('2026-10-02T09:30:00Z')).toMatch(/02\/10\/26/);
  setLocale('en');
  expect(formatMoment(at)).toMatch(/02\/10\/2026/);
});
