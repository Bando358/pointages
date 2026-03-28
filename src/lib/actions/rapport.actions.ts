"use server";

import { prisma } from "@/lib/prisma";
import { formatTimeFr } from "@/lib/date-utils";

export async function fetchRapportMensuel(options: {
  month: number;
  year: number;
  antenneId?: string;
}) {
  const { month, year, antenneId } = options;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const antenneFilter = antenneId ? { antenneId } : {};

  // 1 seule requete : tous les pointages du mois avec user
  const pointages = await prisma.pointage.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      user: { actif: true, role: { not: "SUPER_ADMIN" }, ...antenneFilter },
    },
    include: {
      user: { select: { id: true, nom: true, prenom: true, antenneId: true, antenne: { select: { nom: true } } } },
      antenne: { select: { nom: true } },
    },
    orderBy: { date: "asc" },
  });

  // Regrouper par employe
  const parEmploye: Record<string, {
    nom: string; prenom: string; antenne: string;
    presents: number; absents: number; retards: number; ponctuels: number;
    totalHeures: number; totalHeuresSupp: number; totalRetardMin: number;
    arrivees: number[]; departs: number[];
    arriveesSemaine: number[]; departsSemaine: number[];
    arriveesSamedi: number[]; departsSamedi: number[];
  }> = {};

  // Stats globales
  let gPresents = 0, gAbsents = 0, gRetards = 0, gPonctuels = 0;
  let gHeures = 0, gHeuresSupp = 0, gRetardMin = 0;
  const retardsParJour = [0, 0, 0, 0, 0, 0, 0]; // dim-sam
  const presentsParJour = [0, 0, 0, 0, 0, 0, 0];

  // Stats par antenne
  const parAntenne: Record<string, { nom: string; presents: number; retards: number; ponctuels: number; absents: number; heures: number }> = {};

  for (const p of pointages) {
    const uid = p.user.id;
    if (!parEmploye[uid]) {
      parEmploye[uid] = {
        nom: p.user.nom, prenom: p.user.prenom,
        antenne: p.user.antenne?.nom ?? "-",
        presents: 0, absents: 0, retards: 0, ponctuels: 0,
        totalHeures: 0, totalHeuresSupp: 0, totalRetardMin: 0,
        arrivees: [], departs: [],
        arriveesSemaine: [], departsSemaine: [],
        arriveesSamedi: [], departsSamedi: [],
      };
    }
    const e = parEmploye[uid];
    const day = new Date(p.date).getDay();
    const isSamedi = day === 6;

    if (p.statut === "PRESENT" || p.statut === "RETARD") {
      e.presents++;
      gPresents++;
      presentsParJour[day]++;
    }
    if (p.statut === "PRESENT") { e.ponctuels++; gPonctuels++; }
    if (p.statut === "RETARD") { e.retards++; gRetards++; retardsParJour[day]++; }
    if (p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE") { e.absents++; gAbsents++; }

    e.totalHeures += p.totalHeures;
    e.totalHeuresSupp += p.heuresSupp;
    e.totalRetardMin += p.retardMinutes;
    gHeures += p.totalHeures;
    gHeuresSupp += p.heuresSupp;
    gRetardMin += p.retardMinutes;

    // Moyennes arrivee/depart
    if (p.heureArrivee) {
      const minArrivee = new Date(p.heureArrivee).getHours() * 60 + new Date(p.heureArrivee).getMinutes();
      e.arrivees.push(minArrivee);
      if (isSamedi) e.arriveesSamedi.push(minArrivee); else e.arriveesSemaine.push(minArrivee);
    }
    if (p.heureDepart) {
      const minDepart = new Date(p.heureDepart).getHours() * 60 + new Date(p.heureDepart).getMinutes();
      e.departs.push(minDepart);
      if (isSamedi) e.departsSamedi.push(minDepart); else e.departsSemaine.push(minDepart);
    }

    // Par antenne
    const antNom = p.user.antenne?.nom ?? "Sans antenne";
    const antId = p.user.antenneId ?? "none";
    if (!parAntenne[antId]) parAntenne[antId] = { nom: antNom, presents: 0, retards: 0, ponctuels: 0, absents: 0, heures: 0 };
    if (p.statut === "PRESENT" || p.statut === "RETARD") parAntenne[antId].presents++;
    if (p.statut === "PRESENT") parAntenne[antId].ponctuels++;
    if (p.statut === "RETARD") parAntenne[antId].retards++;
    if (p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE") parAntenne[antId].absents++;
    parAntenne[antId].heures += p.totalHeures;
  }

  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const minToTime = (m: number | null) => m !== null ? `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}` : "-";

  // Formater employes
  const employes = Object.entries(parEmploye).map(([id, e]) => ({
    id,
    nom: e.nom,
    prenom: e.prenom,
    antenne: e.antenne,
    presents: e.presents,
    absents: e.absents,
    retards: e.retards,
    ponctuels: e.ponctuels,
    tauxPonctualite: e.presents > 0 ? Math.round((e.ponctuels / e.presents) * 100) : 0,
    totalHeures: Math.round(e.totalHeures * 10) / 10,
    totalHeuresSupp: Math.round(e.totalHeuresSupp * 10) / 10,
    totalRetardMin: e.totalRetardMin,
    moyArrivee: minToTime(avg(e.arrivees)),
    moyDepart: minToTime(avg(e.departs)),
    moyArriveeSemaine: minToTime(avg(e.arriveesSemaine)),
    moyDepartSemaine: minToTime(avg(e.departsSemaine)),
    moyArriveeSamedi: minToTime(avg(e.arriveesSamedi)),
    moyDepartSamedi: minToTime(avg(e.departsSamedi)),
  })).sort((a, b) => a.nom.localeCompare(b.nom));

  const tauxPonctualiteGlobal = gPresents > 0 ? Math.round((gPonctuels / gPresents) * 100) : 0;

  const joursLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const chartRetardsParJour = joursLabels.map((jour, i) => ({ jour, retards: retardsParJour[i], presents: presentsParJour[i] })).filter((_, i) => i >= 1 && i <= 6);

  const chartAntennes = Object.values(parAntenne).map((a) => ({
    antenne: a.nom,
    presents: a.presents,
    retards: a.retards,
    absents: a.absents,
    tauxPonctualite: a.presents > 0 ? Math.round((a.ponctuels / a.presents) * 100) : 0,
  }));

  return {
    global: {
      presents: gPresents,
      absents: gAbsents,
      retards: gRetards,
      ponctuels: gPonctuels,
      tauxPonctualite: tauxPonctualiteGlobal,
      totalHeures: Math.round(gHeures),
      totalHeuresSupp: Math.round(gHeuresSupp * 10) / 10,
      totalRetardMin: gRetardMin,
      nbEmployes: Object.keys(parEmploye).length,
    },
    employes,
    charts: {
      retardsParJour: chartRetardsParJour,
      antennes: chartAntennes,
    },
  };
}
