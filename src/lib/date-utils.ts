import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, parse } from "date-fns";
import { fr } from "date-fns/locale";

export function toDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function getMonthRange(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getDayRange(dateStr: string) {
  const date = new Date(dateStr);
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function formatDateFr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: fr });
}

export function formatDateTimeFr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatTimeFr(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "HH:mm", { locale: fr });
}

export function parseTime(timeStr: string, referenceDate: Date): Date {
  return parse(timeStr, "HH:mm", referenceDate);
}

export function getJoursFeries(year: number): { date: Date; nom: string }[] {
  const feries = [
    { date: new Date(year, 0, 1), nom: "Jour de l'An" },
    { date: new Date(year, 4, 1), nom: "Fete du Travail" },
    { date: new Date(year, 7, 7), nom: "Fete de l'Independance" },
    { date: new Date(year, 7, 15), nom: "Assomption" },
    { date: new Date(year, 10, 1), nom: "Toussaint" },
    { date: new Date(year, 10, 15), nom: "Journee de la Paix" },
    { date: new Date(year, 11, 25), nom: "Noel" },
  ];

  // Easter and derived holidays
  const easter = computeEaster(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 39);
  const whitMonday = new Date(easter);
  whitMonday.setDate(easter.getDate() + 50);

  feries.push(
    { date: easterMonday, nom: "Lundi de Paques" },
    { date: ascension, nom: "Ascension" },
    { date: whitMonday, nom: "Lundi de Pentecote" }
  );

  return feries;
}

function computeEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function isJourFerie(date: Date): boolean {
  const feries = getJoursFeries(date.getFullYear());
  return feries.some(
    (f) =>
      f.date.getDate() === date.getDate() &&
      f.date.getMonth() === date.getMonth()
  );
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}
