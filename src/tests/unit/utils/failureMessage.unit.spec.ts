import { expect, it } from 'vitest';
import { messages } from '@/i18n';
import { failureMessage } from '@/utils/failureMessage';

it('translates the reasons it knows and passes the others through', () => {
  const t = messages.it;

  expect(failureMessage(new Error('wrong password'), t)).toBe('Password errata');
  expect(
    failureMessage(new Error('this is the device in use: act on it from another one'), t),
  ).toBe(t.ownDevice);
  expect(failureMessage(new Error('Launcher unavailable'), messages.en)).toBe(
    messages.en.launcherUnavailable,
  );
  expect(failureMessage(new Error('disk full'), t)).toBe('disk full');
  expect(failureMessage('plain', t)).toBe('plain');
});
