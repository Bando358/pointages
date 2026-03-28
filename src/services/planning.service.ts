"use server";

import { prisma } from "@/lib/prisma";
import { DEFAULT_PAUSE_MINUTES } from "@/lib/constants";
import { isJourFerie } from "@/lib/date-utils";

export interface HorairesJour {
  travaille: boolean;
  heureDebut: string;
  heureFin: string;
  pauseDebut: string;
  pauseFin: string;
  dureePauseMin: number;
  planningNom?: string;
}

/**
 * Resoudre les horaires d'un employe pour une date donnee.
 * 1) Cherche une affectation de planning active
 * 2) Si trouvee, calcule la semaine de rotation et retourne les horaires du jour
 * 3) Sinon, fallback sur les champs User (heureDebutFixe, etc.)
 */
async function isJourFerieDb(date: Date): Promise<boolean> {
  const count = await prisma.jourFerie.count({
    where: { date: new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())) },
  });
  return count > 0;
}

export async function getHorairesForDate(userId: string, date: Date): Promise<HorairesJour> {
  // D'abord chercher le planning pour savoir si c'est une GARDE
  // Les gardes travaillent meme les jours feries (cliniques)
  const affectation = await prisma.affectationPlanning.findFirst({
    where: {
      userId,
      actif: true,
      dateDebut: { lte: date },
      OR: [
        { dateFin: null },
        { dateFin: { gte: date } },
      ],
    },
    include: {
      planning: {
        include: {
          semaines: {
            include: { jours: true },
          },
        },
      },
    },
    orderBy: { dateDebut: "desc" },
  });

  if (affectation) {
    const planning = affectation.planning;
    const isGarde = planning.type === "GARDE";

    // Jours feries : les GARDE travaillent, les autres non
    if (!isGarde && (isJourFerie(date) || await isJourFerieDb(date))) {
      return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0, planningNom: "Jour ferie" };
    }

    const refDate = new Date(affectation.dateRefSemaine1);
    const targetDate = new Date(date);

    // Calculer le numero de semaine dans la rotation
    const diffMs = targetDate.getTime() - refDate.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const weekNum = (((diffWeeks % planning.nombreSemaines) + planning.nombreSemaines) % planning.nombreSemaines) + 1;

    // Trouver la semaine correspondante
    const semaine = planning.semaines.find((s) => s.numeroSemaine === weekNum);
    if (!semaine) {
      return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0 };
    }

    // Jour ISO : 1=Lundi ... 7=Dimanche
    const jsDay = targetDate.getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    const jour = semaine.jours.find((j) => j.jourSemaine === isoDay);
    if (!jour || !jour.travaille) {
      return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0, planningNom: planning.nom };
    }

    return {
      travaille: true,
      heureDebut: jour.heureDebut,
      heureFin: jour.heureFin,
      pauseDebut: jour.pauseDebut ?? "12:00",
      pauseFin: jour.pauseFin ?? "13:00",
      dureePauseMin: jour.dureePauseMin ?? DEFAULT_PAUSE_MINUTES,
      planningNom: planning.nom,
    };
  }

  // Pas de planning : jours feries = pas de travail
  if (isJourFerie(date) || await isJourFerieDb(date)) {
    return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0, planningNom: "Jour ferie" };
  }

  // Fallback : utiliser les champs du User
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0 };
  }

  const isSamedi = date.getDay() === 6;
  const isDimanche = date.getDay() === 0;

  if (isDimanche) {
    return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0 };
  }

  if (isSamedi && !user.travailleSamedi) {
    return { travaille: false, heureDebut: "", heureFin: "", pauseDebut: "", pauseFin: "", dureePauseMin: 0 };
  }

  return {
    travaille: true,
    heureDebut: isSamedi && user.heureDebutSamedi ? user.heureDebutSamedi : user.heureDebutFixe,
    heureFin: isSamedi && user.heureFinSamedi ? user.heureFinSamedi : user.heureFinFixe,
    pauseDebut: user.pauseDebutFixe,
    pauseFin: user.pauseFinFixe,
    dureePauseMin: user.dureePauseMinutes,
  };
}
