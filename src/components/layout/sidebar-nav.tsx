
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
  Users, 
  BookMarked, 
  UserCog, // Pour settings/users
  UserCircle, // Pour settings/profile
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
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  subItems?: NavItem[];
  roles?: UserRole[]; // Roles that can see this item. If undefined, all authenticated users.
}

const navItemsConfig: NavItem[] = [
  { href: '/', label: 'Tableau de Bord', icon: LayoutDashboard, roles: ['chef_gerant', 'cuisinier', 'soignant'] },
  { href: '/residents', label: 'Résidents (Infos)', icon: UsersRound, roles: ['chef_gerant', 'soignant'] },
  { href: '/manage-residents', label: 'Gérer Résidents', icon: Users, roles: ['chef_gerant', 'soignant'] },
  { href: '/menus', label: 'Menus', icon: CalendarDays, roles: ['chef_gerant', 'cuisinier'] },
  { href: '/reservations', label: 'Réservations', icon: BookMarked, roles: ['chef_gerant', 'soignant', 'famille_invite', 'cuisinier'] },
  { href: '/attendance', label: 'Présences', icon: ClipboardList, roles: ['chef_gerant', 'soignant'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['chef_gerant', 'cuisinier', 'soignant'] },
  // { href: '/ai-menu-suggestion', label: 'Suggestion IA Menu', icon: Brain, roles: ['chef_gerant', 'cuisinier'] }, // Removed
  { 
    href: '/settings', 
    label: 'Paramètres', 
    icon: Settings, 
    roles: ['chef_gerant', 'cuisinier', 'soignant', 'famille_invite'], // All roles can see settings root
    subItems: [
        { href: '/settings/profile', label: 'Mon Profil', icon: UserCircle, roles: ['chef_gerant', 'cuisinier', 'soignant', 'famille_invite'] }, // All can see their profile
        { href: '/settings/users', label: 'Utilisateurs', icon: UserCog, roles: ['chef_gerant'] }, // Only chef_gerant
    ]
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { open } = useSidebar();
  const { currentUser } = useAuth();

  const userRole = currentUser?.role;

  const filterNavItemsByRole = (items: NavItem[], role: UserRole | undefined): NavItem[] => {
    if (!role) return []; // No role, no items (except public ones if any)
    
    return items.filter(item => {
      // If item has no specific roles, it's visible to all authenticated users with a role.
      // Or if roles array is defined and includes the current user's role.
      return !item.roles || item.roles.includes(role);
    }).map(item => {
      if (item.subItems) {
        return { ...item, subItems: filterNavItemsByRole(item.subItems, role) };
      }
      return item;
    }).filter(item => !(item.subItems && item.subItems.length === 0 && item.href === '/settings')); // Remove settings parent if no sub-items for role
  };
  
  const visibleNavItems = filterNavItemsByRole(navItemsConfig, userRole);


  if (!currentUser) {
    return null; // Don't render sidebar if no user (or handle as per app logic)
  }

  return (
    <SidebarMenu>
      {visibleNavItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href || (item.subItems && item.subItems.length > 0 && pathname.startsWith(item.href))}
            tooltip={item.label}
            className="font-body"
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
          {item.subItems && item.subItems.length > 0 && open && (pathname.startsWith(item.href)) && (
            <SidebarMenuSub>
              {item.subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={pathname === subItem.href}
                    className="font-body"
                  >
                    <Link href={subItem.href}>
                       {/* <subItem.icon /> // Sub-item icons can be displayed if desired */}
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
