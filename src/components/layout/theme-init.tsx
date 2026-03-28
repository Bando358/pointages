"use client";

import { useLayoutEffect } from "react";

export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const theme = localStorage.getItem("pointage-theme") || "ocean";
      document.documentElement.setAttribute("data-theme", theme);
    } catch {}
  }, []);

  return null;
}
