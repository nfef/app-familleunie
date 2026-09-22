import {
  LayoutDashboard,
  Users,
  Wallet,
  PiggyBank,
  ShieldAlert,
  Landmark,
  Gift,
  PartyPopper,
  CalendarDays,
  FileBarChart,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/membres', label: 'Membres', icon: Users },
  { to: '/cotisations', label: 'Cotisations', icon: Wallet },
  { to: '/caisses', label: 'Caisses', icon: PiggyBank },
  { to: '/sanctions', label: 'Sanctions', icon: ShieldAlert },
  { to: '/prets', label: 'Prêts', icon: Landmark },
  { to: '/tirages', label: 'Tirages', icon: Gift },
  { to: '/evenements', label: 'Événements', icon: PartyPopper },
  { to: '/reunions', label: 'Réunions & cycles', icon: CalendarDays },
  { to: '/rapports', label: 'Rapports', icon: FileBarChart },
  { to: '/parametres', label: 'Paramètres', icon: Settings, roles: ['ADMIN'] },
];
