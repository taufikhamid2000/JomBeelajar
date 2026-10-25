import {
  FiBookOpen,
  FiAward,
  FiGift,
  FiUser,
  FiCompass,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';

export interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Learn', icon: FiBookOpen },
  { href: '/leaderboard', label: 'Leaderboard', icon: FiAward },
  { href: '/rewards', label: 'Rewards', icon: FiGift },
  { href: '/profile', label: 'Profile', icon: FiUser },
];

export const MOBILE_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  { href: '/career-guidance', label: 'Explore', icon: FiCompass },
  PRIMARY_NAV[2],
  PRIMARY_NAV[3],
];

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + '/');
}
