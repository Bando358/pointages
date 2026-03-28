"use client";

import { useLayoutEffect } from "react";

export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const theme = localStorage.getItem("pointage-theme") || "emeraude";
      document.documentElement.setAttribute("data-theme", theme);
    } catch {}
  }, []);

  return null;
}
