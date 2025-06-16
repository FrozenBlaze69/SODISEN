
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UsersRound,
  CalendarDays,
  ClipboardList,
  Bell,
  Settings,
  LucideIcon,
  Package,
  Users, // Nouvelle icône pour Manage Residents
  BookMarked, // Nouvelle icône pour Réservations
  Brain, // Nouvelle icône pour Suggestion IA Menu
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
  { href: '/residents', label: 'Résidents (Infos)', icon: UsersRound },
  { href: '/manage-residents', label: 'Gérer Résidents', icon: Users },
  { href: '/menus', label: 'Menus', icon: CalendarDays },
  { href: '/reservations', label: 'Réservations', icon: BookMarked },
  { href: '/attendance', label: 'Présences', icon: ClipboardList },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/ai-menu-suggestion', label: 'Suggestion IA Menu', icon: Brain },
  { href: '/settings', label: 'Paramètres', icon: Settings, 
    subItems: [
        { href: '/settings/profile', label: 'Profil', icon: Package },
        { href: '/settings/users', label: 'Utilisateurs', icon: Package },
    ]
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.subItems && pathname.startsWith(item.href))}
            tooltip={item.label}
            className="font-body"
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.subItems && open && (pathname.startsWith(item.href)) && (
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.href}
                    className="font-body"
                  >
                    <Link href={subItem.href}>
                       {/* <subItem.icon /> // Sub-item icons can be added if needed */}
                      <span>{subItem.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
