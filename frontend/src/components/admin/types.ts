export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';

export type StatTone = 'cyan' | 'yellow' | 'orange' | 'purple' | 'green';

export type ToastTone = 'success' | 'error';

export type FilterOption = { value: string; label: string };

export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type IconName =
  | 'home'
  | 'user'
  | 'users'
  | 'brain'
  | 'message'
  | 'workshop'
  | 'book'
  | 'flag'
  | 'settings'
  | 'compass'
  | 'search'
  | 'close'
  | 'menu'
  | 'arrowRight'
  | 'chevronLeft'
  | 'chevronRight'
  | 'check'
  | 'ban'
  | 'trash'
  | 'eye'
  | 'shieldCheck'
  | 'star'
  | 'checkCircle'
  | 'alertCircle'
  | 'logout';
