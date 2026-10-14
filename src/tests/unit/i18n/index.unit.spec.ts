import { describe, expect, it } from 'vitest';
import { messages, setLocale, useI18n } from '@/i18n';

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'object' && item !== null
      ? keys(item, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('the texts of the application', () => {
  it('declares the same keys in Italian and in English, none of them empty', () => {
    expect(keys(messages.en)).toEqual(keys(messages.it));
    for (const catalogue of [messages.it, messages.en]) {
      expect(JSON.stringify(catalogue)).not.toContain('""');
    }
  });

  it('switches the language of the page and of the texts', () => {
    const { t } = useI18n();
    setLocale('en');
    expect(document.documentElement.lang).toBe('en');
    expect(t.value.sections.access).toBe('Access');
    setLocale('it');
    expect(t.value.sections.access).toBe('Accesso');
  });
});
