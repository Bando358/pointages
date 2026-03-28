"use server";

import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/date-utils";
import {
  computePointageStatus,
  computeOvertime,
  computeTotalHeures,
} from "@/services/pointage.service";
import { getHorairesForDate } from "@/services/planning.service";

export async function checkIn(userId: string, antenneId?: string) {
  const now = new Date();
  const today = toDateOnly(now);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  // Resoudre les horaires via le planning (ou fallback User)
  const horaires = await getHorairesForDate(userId, now);

  // Si pas planifie, on accepte quand meme avec les horaires par defaut
  const heureRef = horaires.travaille ? horaires.heureDebut : user.heureDebutFixe;
  const { statut, retardMinutes } = computePointageStatus(now, heureRef);

  return prisma.pointage.upsert({
    where: { userId_date: { userId, date: today } },
    update: { heureArrivee: now, statut, retardMinutes },
    create: {
      userId,
      date: today,
      heureArrivee: now,
      statut,
      retardMinutes,
      antenneId: antenneId ?? user.antenneId ?? undefined,
    },
  });
}

export async function checkOut(userId: string) {
  const now = new Date();
  const today = toDateOnly(now);

  const pointage = await prisma.pointage.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (!pointage) throw new Error("Aucun pointage d'arrivee trouve");
  if (!pointage.heureArrivee) throw new Error("Impossible de pointer la sortie sans arrivee");
  if (pointage.heureDepart) throw new Error("Depart deja enregistre");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Utilisateur introuvable");

  const horaires = await getHorairesForDate(userId, now);
  const finRef = horaires.travaille ? horaires.heureFin : user.heureFinFixe;
  const pauseRef = horaires.travaille ? horaires.dureePauseMin : user.dureePauseMinutes;
  const heuresSupp = computeOvertime(now, finRef);
  const totalHeures = pointage.heureArrivee
    ? computeTotalHeures(pointage.heureArrivee, now, pauseRef)
    : 0;

  return prisma.pointage.update({
    where: { id: pointage.id },
    data: { heureDepart: now, heuresSupp, totalHeures },
  });
}

export async function getTodayPointage(userId: string) {
  const today = toDateOnly(new Date());
  return prisma.pointage.findUnique({
    where: { userId_date: { userId, date: today } },
  });
}

export async function getPointagesByUser(
  userId: string,
  month: number,
  year: number,
  page: number = 1,
  pageSize: number = 31
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const [data, total] = await Promise.all([
    prisma.pointage.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      include: { antenne: { select: { nom: true } } },
      orderBy: { date: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.pointage.count({
      where: { userId, date: { gte: startDate, lte: endDate } },
    }),
  ]);

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getPointagesByAntenne(antenneId: string, date: Date) {
  const dateOnly = toDateOnly(date);

  const users = await prisma.user.findMany({
    where: { actif: true, role: { not: "SUPER_ADMIN" }, antenneId },
    include: {
      pointages: { where: { date: dateOnly } },
      antenne: true,
    },
    orderBy: { nom: "asc" },
  });

  return users.map((u: any) => ({
    userId: u.id,
    nom: u.nom,
    prenom: u.prenom,
    antenne: u.antenne?.nom ?? "-",
    pointage: u.pointages[0] ?? null,
  }));
}

export async function getPointageSummary(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const pointages = await prisma.pointage.findMany({
    where: { userId, date: { gte: startDate, lte: endDate } },
  });

  return pointages.reduce(
    (acc: any, p: any) => {
      if (p.statut === "PRESENT" || p.statut === "RETARD") acc.presents++;
      if (p.statut === "ABSENT" || p.statut === "ABSENCE_NON_AUTORISEE") acc.absents++;
      if (p.statut === "RETARD") acc.retards++;
      if (p.statut === "PRESENT") acc.ponctuels++;
      acc.totalRetardMinutes += p.retardMinutes;
      acc.totalHeuresSupp += p.heuresSupp;
      acc.totalHeures += p.totalHeures;
      return acc;
    },
    { presents: 0, absents: 0, retards: 0, ponctuels: 0, totalRetardMinutes: 0, totalHeuresSupp: 0, totalHeures: 0 }
  );
}

/**
 * Taux de ponctualite : % d'employes a l'heure parmi ceux presents
 */
export async function getPonctualiteAntenne(antenneId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const pointages = await prisma.pointage.findMany({
    where: {
      user: { antenneId },
      date: { gte: startDate, lte: endDate },
    },
  });

  const presents = pointages.filter((p) => p.statut === "PRESENT" || p.statut === "RETARD").length;
  const ponctuels = pointages.filter((p) => p.statut === "PRESENT").length;

  return {
    total: pointages.length,
    presents,
    ponctuels,
    tauxPonctualite: presents > 0 ? Math.round((ponctuels / presents) * 100) : 0,
  };
}

export async function markAbsent(userId: string, date: Date, observations?: string) {
  const dateOnly = toDateOnly(date);
  const pointage = await prisma.pointage.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    update: { statut: "ABSENT", observations, saisieManuelle: true },
    create: { userId, date: dateOnly, statut: "ABSENT", observations, saisieManuelle: true },
  });

  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth-options");
  const session = await getServerSession(authOptions);
  if (session) {
    await prisma.auditLog.create({
      data: {
        action: "MARQUAGE_ABSENT",
        entityType: "Pointage",
        entityId: pointage.id,
        userId: session.user.id,
        details: JSON.stringify({
          employeId: userId,
          date: dateOnly.toISOString().split("T")[0],
          observations: observations ?? null,
        }),
      },
    });
  }

  return pointage;
}

/**
 * Saisie manuelle (procedure de secours - Q20)
 */
export async function upsertPointageManuel(
  userId: string,
  data: {
    date: Date;
    heureArrivee?: string;
    heureDepart?: string;
    statut: string;
    observations?: string;
    justificatif?: string;
  }
) {
  const dateOnly = toDateOnly(data.date);
  const ref = dateOnly;

  const parseOpt = (t?: string) => {
    if (!t) return undefined;
    const [h, m] = t.split(":").map(Number);
    const d = new Date(ref);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const heureArrivee = parseOpt(data.heureArrivee);
  const heureDepart = parseOpt(data.heureDepart);

  let totalHeures = 0;
  let heuresSupp = 0;
  let retardMinutes = 0;
  let statut = data.statut as any;

  if (heureArrivee && heureDepart) {
    const horaires = await getHorairesForDate(userId, dateOnly);
    if (horaires.travaille) {
      totalHeures = computeTotalHeures(heureArrivee, heureDepart, horaires.dureePauseMin);
      const result = computePointageStatus(heureArrivee, horaires.heureDebut);
      if (statut === "PRESENT" || statut === "RETARD") {
        statut = result.statut;
        retardMinutes = result.retardMinutes;
      }
      heuresSupp = computeOvertime(heureDepart, horaires.heureFin);
    }
  }

  const pointage = await prisma.pointage.upsert({
    where: { userId_date: { userId, date: dateOnly } },
    update: {
      heureArrivee, heureDepart,
      statut, retardMinutes, heuresSupp, totalHeures,
      observations: data.observations,
      justificatif: data.justificatif,
      saisieManuelle: true,
    },
    create: {
      userId, date: dateOnly,
      heureArrivee, heureDepart,
      statut, retardMinutes, heuresSupp, totalHeures,
      observations: data.observations,
      justificatif: data.justificatif,
      saisieManuelle: true,
    },
  });

  // Tracer dans l'audit log
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth-options");
  const session = await getServerSession(authOptions);
  if (session) {
    await prisma.auditLog.create({
      data: {
        action: "SAISIE_MANUELLE",
        entityType: "Pointage",
        entityId: pointage.id,
        userId: session.user.id,
        details: JSON.stringify({
          employeId: userId,
          date: dateOnly.toISOString().split("T")[0],
          heureArrivee: data.heureArrivee ?? null,
          heureDepart: data.heureDepart ?? null,
          statut,
          justificatif: data.justificatif ?? null,
          observations: data.observations ?? null,
        }),
      },
    });
  }

  return pointage;
}
