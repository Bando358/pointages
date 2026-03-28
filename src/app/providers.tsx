"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeInit } from "@/components/layout/theme-init";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeInit />
      <TooltipProvider>
        {children}
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </SessionProvider>
  );
}
