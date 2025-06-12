import type { ReactNode } from 'react';
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
import { Package2 } from 'lucide-react'; // Placeholder for App Logo/Icon

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
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
          <p className="text-xs text-sidebar-foreground/70 font-body">&copy; 2024 Sodexo</p>
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
