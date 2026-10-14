import desktop from '@/assets/icons/desktop.svg?url';
import laptop from '@/assets/icons/laptop.svg?url';
import phone from '@/assets/icons/phone.svg?url';
import projector from '@/assets/icons/projector.svg?url';
import tv from '@/assets/icons/tv.svg?url';
import type { DeviceIcon } from '@/types';

/** The symbol of each kind of device, as the device was given one. */
export const deviceIcons: Record<DeviceIcon, string> = { desktop, laptop, phone, projector, tv };
