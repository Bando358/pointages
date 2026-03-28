"use server";

import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/date-utils";

function getMonthRange(year: number, month: number) {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0),
  };
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: toDateOnly(start), end: toDateOnly(end) };
}

export async function fetchDashboardData(options: {
  role: string;
  antenneId?: string | null;
  userId?: string;
  month?: number;
  year?: number;
}) {
  const now = new Date();
  const year = options.year ?? now.getFullYear();
  const month = options.month ?? (now.getMonth() + 1);
  const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
  const today = toDateOnly(now);
  const week = getWeekRange();

  const antenneFilter = options.antenneId
    ? { antenneId: options.antenneId }
    : {};

  const userFilter = options.role === "EMPLOYE" && options.userId
    ? { userId: options.userId }
    : {};

  // Exclure le SUPER_ADMIN des stats visibles
  const excludeSuperAdmin = { role: { not: "SUPER_ADMIN" as const } };

  // KPIs du mois
  const [
    totalEmployes,
    pointagesMois,
    absencesTempMois,
    congesEnAttente,
    pointagesAujourdhui,
    pointagesSemaine,
  ] = await Promise.all([
    prisma.user.count({ where: { actif: true, ...excludeSuperAdmin, ...antenneFilter } }),

    prisma.pointage.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        user: { ...excludeSuperAdmin, ...antenneFilter },
        ...userFilter,
      },
    }),

    prisma.absenceTemp.count({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        user: { ...excludeSuperAdmin, ...antenneFilter },
        ...userFilter,
      },
    }),

    prisma.conge.count({
      where: { statut: "SOUMIS", user: { ...excludeSuperAdmin, ...antenneFilter }, ...userFilter },
    }),

    prisma.pointage.findMany({
      where: {
        date: today,
        user: { ...excludeSuperAdmin, ...antenneFilter },
        ...userFilter,
      },
      include: { user: { select: { nom: true, prenom: true } } },
    }),

    prisma.pointage.findMany({
      where: {
        date: { gte: week.start, lte: week.end },
        user: { ...excludeSuperAdmin, ...antenneFilter },
        ...userFilter,
      },
    }),
  ]);

  // Listings detailles du mois
  const [retardataires, absentsList, congesList, absencesTempList] = await Promise.all([
    // Top retardataires du mois
    prisma.pointage.groupBy({
      by: ["userId"],
      where: {
        date: { gte: monthStart, lte: monthEnd },
        statut: "RETARD",
        user: { ...excludeSuperAdmin, ...antenneFilter },
      },
      _count: true,
      _sum: { retardMinutes: true },
      orderBy: { _count: { userId: "desc" } },
      take: 20,
    }),

    // Absents du mois
    prisma.pointage.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        statut: { in: ["ABSENT", "ABSENCE_NON_AUTORISEE"] },
        user: { ...excludeSuperAdmin, ...antenneFilter },
      },
      include: { user: { select: { nom: true, prenom: true, antenne: { select: { nom: true } } } } },
      orderBy: { date: "desc" },
      take: 30,
    }),

    // Conges du mois
    prisma.conge.findMany({
      where: {
        OR: [
          { dateDebut: { gte: monthStart, lte: monthEnd } },
          { dateFin: { gte: monthStart, lte: monthEnd } },
        ],
        user: { ...excludeSuperAdmin, ...antenneFilter },
      },
      include: { user: { select: { nom: true, prenom: true, antenne: { select: { nom: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    // Absences temporaires du mois
    prisma.absenceTemp.findMany({
      where: {
        date: { gte: monthStart, lte: monthEnd },
        user: { ...excludeSuperAdmin, ...antenneFilter },
      },
      include: { user: { select: { nom: true, prenom: true } }, validePar: { select: { nom: true, prenom: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  // Enrichir retardataires avec noms
  const retardataireUserIds = retardataires.map((r) => r.userId);
  const retardataireUsers = await prisma.user.findMany({
    where: { id: { in: retardataireUserIds } },
    select: { id: true, nom: true, prenom: true, antenne: { select: { nom: true } } },
  });
  const retardataireMap = Object.fromEntries(retardataireUsers.map((u) => [u.id, u]));

  // Stats mois
  const presents = pointagesMois.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length;
  const ponctuels = pointagesMois.filter((p) => p.statut === "PRESENT").length;
  const retards = pointagesMois.filter((p) => p.statut === "RETARD").length;
  const absents = pointagesMois.filter((p) => p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE").length;
  const totalRetardMin = pointagesMois.reduce((s, p) => s + p.retardMinutes, 0);
  const totalHeures = pointagesMois.reduce((s, p) => s + p.totalHeures, 0);
  const tauxPonctualite = presents > 0 ? Math.round((ponctuels / presents) * 100) : 0;

  // Stats aujourd'hui
  const presentAujourdhui = pointagesAujourdhui.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length;
  const retardAujourdhui = pointagesAujourdhui.filter((p) => p.statut === "RETARD").length;

  // Stats semaine
  const presentsSemaine = pointagesSemaine.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length;
  const retardsSemaine = pointagesSemaine.filter((p) => p.statut === "RETARD").length;
  const absentsSemaine = pointagesSemaine.filter((p) => p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE").length;

  // Retards par jour de la semaine (pour graphique)
  const retardsParJour = [0, 0, 0, 0, 0, 0, 0]; // dim-sam
  const joursLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  pointagesMois.forEach((p) => {
    if (p.statut === "RETARD") {
      const d = new Date(p.date).getDay();
      retardsParJour[d]++;
    }
  });
  const chartRetardsParJour = joursLabels.map((label, i) => ({
    jour: label,
    retards: retardsParJour[i],
  })).filter((_, i) => i >= 1 && i <= 6); // lun-sam

  // Pointages par statut (pour graphique donut)
  const statutCounts: Record<string, number> = {};
  pointagesMois.forEach((p) => {
    statutCounts[p.statut] = (statutCounts[p.statut] || 0) + 1;
  });
  const chartStatuts = Object.entries(statutCounts).map(([statut, count]) => ({
    statut,
    count,
  }));

  // Heures par semaine du mois (pour graphique area)
  const heuresParSemaine: Record<number, number> = {};
  pointagesMois.forEach((p) => {
    const weekNum = Math.ceil(new Date(p.date).getDate() / 7);
    heuresParSemaine[weekNum] = (heuresParSemaine[weekNum] || 0) + p.totalHeures;
  });
  const chartHeuresParSemaine = Object.entries(heuresParSemaine).map(([sem, heures]) => ({
    semaine: `S${sem}`,
    heures: Math.round(heures as number),
  }));

  // Derniers pointages aujourd'hui
  const derniersPointages = pointagesAujourdhui
    .sort((a, b) => {
      const ta = a.heureArrivee?.getTime() ?? 0;
      const tb = b.heureArrivee?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 8)
    .map((p: any) => ({
      nom: p.user.nom,
      prenom: p.user.prenom,
      statut: p.statut,
      heureArrivee: p.heureArrivee?.toISOString() ?? null,
      heureDepart: p.heureDepart?.toISOString() ?? null,
      retardMinutes: p.retardMinutes,
    }));

  return {
    kpis: {
      totalEmployes,
      tauxPonctualite,
      retardsMois: retards,
      absentsMois: absents,
      presentsMois: presents,
      totalRetardMin,
      totalHeures: Math.round(totalHeures),
      absencesTempMois,
      congesEnAttente,
    },
    aujourdhui: {
      total: pointagesAujourdhui.length,
      presents: presentAujourdhui,
      retards: retardAujourdhui,
      derniersPointages,
    },
    semaine: {
      presents: presentsSemaine,
      retards: retardsSemaine,
      absents: absentsSemaine,
    },
    charts: {
      retardsParJour: chartRetardsParJour,
      statuts: chartStatuts,
      heuresParSemaine: chartHeuresParSemaine,
    },
    listings: {
      retardataires: retardataires.map((r) => {
        const u = retardataireMap[r.userId];
        return {
          nom: u?.nom ?? "?",
          prenom: u?.prenom ?? "?",
          antenne: u?.antenne?.nom ?? "-",
          count: r._count,
          totalMinutes: r._sum.retardMinutes ?? 0,
        };
      }),
      absents: absentsList.map((p: any) => ({
        nom: p.user.nom,
        prenom: p.user.prenom,
        antenne: p.user.antenne?.nom ?? "-",
        date: p.date.toISOString(),
        statut: p.statut,
        observations: p.observations,
      })),
      conges: congesList.map((c: any) => ({
        nom: c.user.nom,
        prenom: c.user.prenom,
        antenne: c.user.antenne?.nom ?? "-",
        dateDebut: c.dateDebut.toISOString(),
        dateFin: c.dateFin.toISOString(),
        type: c.type,
        statut: c.statut,
        motif: c.motif,
      })),
      absencesTemp: absencesTempList.map((a: any) => ({
        nom: a.user.nom,
        prenom: a.user.prenom,
        heureSortie: a.heureSortie.toISOString(),
        heureRetour: a.heureRetour?.toISOString() ?? null,
        type: a.type,
        motif: a.motif,
        statut: a.statut,
        validePar: a.validePar ? `${a.validePar.prenom} ${a.validePar.nom}` : null,
      })),
    },
  };
}
