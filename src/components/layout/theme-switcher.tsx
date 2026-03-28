"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Leaf, Waves, Sun, Moon } from "lucide-react";

const THEMES = [
  { value: "emeraude", label: "Emeraude", icon: Leaf },
  { value: "ocean", label: "Ocean", icon: Waves },
  { value: "ambre", label: "Ambre", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
] as const;

type ThemeId = (typeof THEMES)[number]["value"];

export function ThemeSwitcher() {
  const [current, setCurrent] = useState<ThemeId>("emeraude");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem("pointage-theme") as ThemeId) || "emeraude";
    setCurrent(stored);
    document.documentElement.setAttribute("data-theme", stored);
  }, []);

  function handleChange(theme: ThemeId) {
    setCurrent(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pointage-theme", theme);
  }

  const currentTheme = (mounted ? THEMES.find((t) => t.value === current) : null) ?? THEMES[0];
  const Icon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
        {mounted ? <Icon className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
        <span className="sr-only">Changer le theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => handleChange(t.value)}
            className={current === t.value ? "bg-accent" : ""}
          >
            <t.icon className="mr-2 h-4 w-4" />
            {t.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
