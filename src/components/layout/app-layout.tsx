
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
import { Package2, Loader2 } from 'lucide-react'; 
import { useAuth } from '@/hooks/useAuth';
import { GlobalNotificationListener } from './GlobalNotificationListener'; // Import the listener

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
    return null; 
  }
  
  return (
    <SidebarProvider defaultOpen>
      <GlobalNotificationListener /> {/* Add the listener here */}
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 flex items-center gap-2 justify-between">
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
              <Package2 className="h-6 w-6" />
            </Button>
            <span className="font-headline text-lg font-semibold text-primary">SODISEN</span>
           </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4">
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
