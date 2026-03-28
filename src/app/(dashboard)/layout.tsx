import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  // Kiosk mode: fullscreen without sidebar
  if (session?.user?.loginType === "kiosk") {
    return (
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">Pointage AIBEF</h1>
          <div className="flex-1" />
          <ThemeSwitcher />
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
