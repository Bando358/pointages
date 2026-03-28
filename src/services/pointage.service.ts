import { LATE_THRESHOLD_MINUTES, DEFAULT_PAUSE_MINUTES } from "@/lib/constants";
import { parseTime } from "@/lib/date-utils";
import type { StatutPointage } from "@/generated/prisma/client";

export function computePointageStatus(
  heureArrivee: Date,
  heureDebutFixe: string,
  thresholdMinutes: number = LATE_THRESHOLD_MINUTES
): { statut: StatutPointage; retardMinutes: number } {
  const expected = parseTime(heureDebutFixe, heureArrivee);
  const diffMs = heureArrivee.getTime() - expected.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= thresholdMinutes) {
    return { statut: "PRESENT", retardMinutes: 0 };
  }
  return { statut: "RETARD", retardMinutes: diffMin };
}

export function computeOvertime(heureDepart: Date, heureFinFixe: string): number {
  const expected = parseTime(heureFinFixe, heureDepart);
  const diffMs = heureDepart.getTime() - expected.getTime();
  const diffHours = diffMs / 3600000;
  return diffHours > 0 ? Math.round(diffHours * 100) / 100 : 0;
}

/**
 * Calcule le total d'heures travaillees.
 * La pause est deduite automatiquement (non pointee) selon Q4-Q7 du questionnaire.
 */
export function computeTotalHeures(
  heureArrivee: Date,
  heureDepart: Date,
  dureePauseMinutes: number = DEFAULT_PAUSE_MINUTES
): number {
  const totalMs = heureDepart.getTime() - heureArrivee.getTime();
  const pauseMs = dureePauseMinutes * 60000;
  const hours = (totalMs - pauseMs) / 3600000;
  return Math.round(Math.max(0, hours) * 100) / 100;
}

/**
 * Determine les horaires de reference selon le jour (semaine vs samedi).
 */
export function getHorairesRef(user: {
  heureDebutFixe: string;
  heureFinFixe: string;
  heureDebutSamedi?: string | null;
  heureFinSamedi?: string | null;
  travailleSamedi?: boolean;
}, date: Date): { debut: string; fin: string; isSamedi: boolean } {
  const isSamedi = date.getDay() === 6;
  if (isSamedi && user.travailleSamedi && user.heureDebutSamedi && user.heureFinSamedi) {
    return { debut: user.heureDebutSamedi, fin: user.heureFinSamedi, isSamedi: true };
  }
  return { debut: user.heureDebutFixe, fin: user.heureFinFixe, isSamedi: false };
}

/**
 * Calcule les indicateurs de ponctualite (Q11-Q12).
 */
export function computePonctualite(
  pointages: Array<{ statut: string; retardMinutes: number; heuresSupp: number; totalHeures: number; date: Date | string }>
) {
  const weekdays = pointages.filter((p) => {
    const d = new Date(p.date);
    return d.getDay() !== 6;
  });
  const samedis = pointages.filter((p) => {
    const d = new Date(p.date);
    return d.getDay() === 6;
  });

  const calc = (list: typeof pointages) => {
    const total = list.length;
    if (total === 0) return { total: 0, presents: 0, retards: 0, absents: 0, tauxPonctualite: 0, totalHeures: 0, totalHeuresSupp: 0, totalRetardMinutes: 0 };

    const presents = list.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length;
    const retards = list.filter((p) => p.statut === "RETARD").length;
    const absents = list.filter((p) => p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE").length;
    const ponctuels = list.filter((p) => p.statut === "PRESENT").length;
    const tauxPonctualite = presents > 0 ? Math.round((ponctuels / presents) * 100) : 0;

    return {
      total,
      presents,
      retards,
      absents,
      tauxPonctualite,
      totalHeures: list.reduce((s, p) => s + p.totalHeures, 0),
      totalHeuresSupp: list.reduce((s, p) => s + p.heuresSupp, 0),
      totalRetardMinutes: list.reduce((s, p) => s + p.retardMinutes, 0),
    };
  };

  return {
    global: calc(pointages),
    semaine: calc(weekdays),
    samedi: calc(samedis),
  };
}
