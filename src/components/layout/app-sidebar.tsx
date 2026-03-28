"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Fingerprint,
  LayoutDashboard,
  Clock,
  Users,
  Building2,
  BarChart3,
  CalendarDays,
  CalendarRange,
  ScrollText,
  Settings,
  LogOut,
  ChevronUp,
  ChevronRight,
} from "lucide-react";
import { ROLES_GESTION } from "@/lib/constants";

const ALL_ROLES = ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE", "EMPLOYE"];

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/pointages", label: "Pointage", icon: Clock, roles: ALL_ROLES },
  { href: "/conges", label: "Conges", icon: CalendarDays, roles: ALL_ROLES },
  { href: "/rapports", label: "Rapports", icon: BarChart3, roles: ROLES_GESTION },
  { href: "/plannings", label: "Plannings", icon: CalendarRange, roles: ROLES_GESTION },
];

const PARAMETRES_SUB = [
  { href: "/employes", label: "Employes", icon: Users, roles: ROLES_GESTION },
  { href: "/antennes", label: "Antennes", icon: Building2, roles: ["SUPER_ADMIN", "ADMIN"] },
  { href: "/audit", label: "Audit", icon: ScrollText, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role ?? "EMPLOYE";

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const visibleSubItems = PARAMETRES_SUB.filter((item) => item.roles.includes(role));
  const hasParametres = visibleSubItems.length > 0;

  const parametresActive = visibleSubItems.some((item) => pathname.startsWith(item.href));
  const [parametresOpen, setParametresOpen] = useState(parametresActive);

  const initials = session?.user
    ? `${session.user.prenom?.[0] ?? ""}${session.user.nom?.[0] ?? ""}`
    : "?";

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/pointages" className="flex items-center gap-2">
          <Fingerprint className="h-7 w-7 text-primary" />
          <div>
            <span className="text-xl font-bold">Pointage</span>
            {session?.user?.antenneNom && (
              <p className="text-xs text-muted-foreground">{session.user.antenneNom}</p>
            )}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {hasParametres && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setParametresOpen((o) => !o)}
                    isActive={parametresActive}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Parametres</span>
                    <ChevronRight
                      className={`ml-auto h-4 w-4 transition-transform ${parametresOpen ? "rotate-90" : ""}`}
                    />
                  </SidebarMenuButton>
                  {parametresOpen && (
                    <SidebarMenuSub>
                      {visibleSubItems.map((sub) => (
                        <SidebarMenuSubItem key={sub.href}>
                          <SidebarMenuSubButton
                            render={<Link href={sub.href} />}
                            isActive={pathname.startsWith(sub.href)}
                          >
                            <sub.icon className="h-4 w-4" />
                            <span>{sub.label}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t">
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton className="w-full" />}>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">
                {session?.user?.prenom} {session?.user?.nom}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.loginType === "kiosk" ? "Kiosk" : session?.user?.role}
              </p>
            </div>
            <ChevronUp className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" className="w-56">
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4 mr-2" />
              Se deconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
