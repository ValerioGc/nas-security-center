import { afterEach, expect, it, vi } from 'vitest';
import { fromBase64, saveFile } from '@/utils/saveFile';

afterEach(() => vi.restoreAllMocks());

it('hands the content to the browser as a named file and lets the address go', () => {
  URL.createObjectURL = vi.fn(() => 'blob:file');
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  saveFile('text', 'name.txt', 'text/plain');

  const link = click.mock.contexts[0] as HTMLAnchorElement;
  expect(link.download).toBe('name.txt');
  expect(link.href).toBe('blob:file');
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:file');
});

it('reads base64 into bytes', () => {
  expect([...fromBase64(btoa('\u0000ÿA'))]).toEqual([0, 255, 65]);
});
