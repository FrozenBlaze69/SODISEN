
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Header } from './header';
import { SidebarNav } from './sidebar-nav';
import { Button } from '@/components/ui/button';
import { Package2, Loader2 } from 'lucide-react'; // Placeholder for App Logo/Icon
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !currentUser && pathname !== '/login') {
      router.replace('/login');
    }
  }, [currentUser, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser && pathname !== '/login') {
    // This case should ideally be caught by the useEffect,
    // but as a fallback or for initial render before effect runs.
    return null; // Or a minimal loading/redirecting screen
  }
  
  // If we are on the login page, and the user is somehow already loaded, redirect to dashboard
  // This is less likely due to the top-level check but good for robustness
  // However, AppLayout should not be used for the login page itself.
  // The login page will have its own simple layout.

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
              <Package2 className="h-6 w-6" />
            </Button>
            <span className="font-headline text-lg font-semibold text-primary">SODISEN</span>
           </div>
          {/* SidebarTrigger is often placed in the header for mobile, but can be here for desktop expand/collapse if needed or used by SidebarRail */}
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4">
          {/* Footer content if any, e.g., version number */}
          <p className="text-xs text-sidebar-foreground/70 font-body">&copy; {new Date().getFullYear()} Sodexo</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 overflow-auto font-body">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
