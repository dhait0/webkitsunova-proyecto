import type { SVGProps } from 'react';
import type { IconName } from './types';

export type { IconName };

const PATHS: Record<IconName, string> = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  brain: 'M12 4.5a2.5 2.5 0 0 0-5 0 2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 0 4.5 2.5 2.5 0 0 0 4 2 2.5 2.5 0 0 0 3 1.5V4.5ZM12 4.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1 0 4.5 2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-3 1.5',
  message: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 20.5l1.5-4.7A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z',
  workshop: 'M12 3 2 8l10 5 10-5-10-5ZM5 11v5c0 1.1 3.1 2.5 7 2.5s7-1.4 7-2.5v-5',
  book: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5v-18ZM4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  flag: 'M4 22V4M4 4h13l-2.5 4L17 12H4',
  settings:
    'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h10M18 18h2M16 4v4M10 10v4M16 16v4',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  close: 'M18 6 6 18M6 6l12 12',
  menu: 'M3 6h18M3 12h18M3 18h18',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  check: 'M20 6 9 17l-5-5',
  ban: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  shieldCheck: 'M12 3l8 3v6c0 5-3.4 8.3-8 9-4.6-.7-8-4-8-9V6l8-3ZM9 12l2 2 4-4',
  star: 'm12 3 2.7 5.6 6.3.9-4.5 4.3 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.5l6.3-.9L12 3Z',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5 4.5-4.5',
  alertCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v5M12 16.5v.5',
  pencil: 'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 4 21l.5-3.5L17 3Zm-1.4 1.8L6 17',
  lock: 'M16 11V7a4 4 0 0 0-8 0v4M5 11h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z',
  mail: 'M2 6l10 7 10-7M2 6v13a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
};

type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export default Icon;
