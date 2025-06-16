
'use client';

import Link from 'next/link';
import { Bell, ChevronDown, LogOut, Settings, UserCircle, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';

const roleDisplayNames: Record<Exclude<UserRole, null>, string> = {
  chef_gerant: 'Chef Gérant',
  cuisinier: 'Cuisinier',
  soignant: 'Soignant',
  famille_invite: 'Invité/Famille',
};

export function Header() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    // Potentially render a minimal header or null if redirecting to login
    return (
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
         <div className="md:hidden">
           <SidebarTrigger />
         </div>
         <div className="flex flex-1 items-center">
           <Link href="/" className="mr-auto">
             <h1 className="text-2xl font-headline font-semibold text-primary">SODISEN</h1>
           </Link>
         </div>
         {/* Optionally, a login button if needed here, but typically handled by redirect */}
       </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="flex flex-1 items-center">
        <Link href="/" className="mr-auto">
          <h1 className="text-2xl font-headline font-semibold text-primary">SODISEN</h1>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/notifications">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-1 rounded-full h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatarUrl || "https://placehold.co/40x40.png"} alt={currentUser.name} data-ai-hint="user avatar" />
                <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-body">{currentUser.name}</span>
              <ChevronDown className="h-4 w-4 hidden sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 font-body">
            <DropdownMenuLabel className="font-medium">
              <div className="font-headline">{currentUser.name}</div>
              <div className="text-xs text-muted-foreground">
                Rôle: {currentUser.role ? roleDisplayNames[currentUser.role] : 'Non défini'}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres Généraux</span>
              </Link>
            </DropdownMenuItem>
            {currentUser.role === 'chef_gerant' && (
              <DropdownMenuItem asChild>
                <Link href="/settings/users">
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>Gérer Utilisateurs</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Déconnexion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
