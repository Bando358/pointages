"use server";

import { prisma } from "@/lib/prisma";
import type { TypePlanning } from "@/generated/prisma/client";

interface JourInput {
  jourSemaine: number;
  travaille: boolean;
  heureDebut: string;
  heureFin: string;
  pauseDebut?: string;
  pauseFin?: string;
  dureePauseMin?: number;
}

interface SemaineInput {
  numeroSemaine: number;
  label?: string;
  jours: JourInput[];
}

export async function createPlanning(data: {
  nom: string;
  description?: string;
  type: TypePlanning;
  nombreSemaines: number;
  antenneId?: string;
  semaines: SemaineInput[];
}) {
  return prisma.planning.create({
    data: {
      nom: data.nom,
      description: data.description,
      type: data.type,
      nombreSemaines: data.nombreSemaines,
      antenneId: data.antenneId,
      semaines: {
        create: data.semaines.map((sem) => ({
          numeroSemaine: sem.numeroSemaine,
          label: sem.label,
          jours: {
            create: sem.jours.map((j) => ({
              jourSemaine: j.jourSemaine,
              travaille: j.travaille,
              heureDebut: j.heureDebut,
              heureFin: j.heureFin,
              pauseDebut: j.pauseDebut,
              pauseFin: j.pauseFin,
              dureePauseMin: j.dureePauseMin,
            })),
          },
        })),
      },
    },
    include: { semaines: { include: { jours: true } } },
  });
}

export async function getPlannings(antenneId?: string) {
  return prisma.planning.findMany({
    where: {
      actif: true,
      ...(antenneId ? { OR: [{ antenneId }, { antenneId: null }] } : {}),
    },
    include: {
      antenne: { select: { nom: true } },
      _count: { select: { affectations: { where: { actif: true } } } },
      semaines: { include: { jours: { orderBy: { jourSemaine: "asc" } } }, orderBy: { numeroSemaine: "asc" } },
    },
    orderBy: { nom: "asc" },
  });
}

export async function getPlanningById(id: string) {
  return prisma.planning.findUnique({
    where: { id },
    include: {
      antenne: { select: { nom: true } },
      semaines: { include: { jours: { orderBy: { jourSemaine: "asc" } } }, orderBy: { numeroSemaine: "asc" } },
      affectations: {
        where: { actif: true },
        include: { user: { select: { id: true, nom: true, prenom: true } } },
        orderBy: { dateDebut: "desc" },
      },
    },
  });
}

export async function deletePlanning(id: string) {
  return prisma.planning.update({ where: { id }, data: { actif: false } });
}

export async function affecterPlanning(data: {
  userId: string;
  planningId: string;
  dateDebut: Date;
  dateFin?: Date;
  dateRefSemaine1: Date;
}) {
  // Desactiver les affectations precedentes
  await prisma.affectationPlanning.updateMany({
    where: { userId: data.userId, actif: true },
    data: { actif: false },
  });

  return prisma.affectationPlanning.create({
    data: {
      userId: data.userId,
      planningId: data.planningId,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      dateRefSemaine1: data.dateRefSemaine1,
    },
  });
}

export async function desaffecterPlanning(affectationId: string) {
  return prisma.affectationPlanning.update({
    where: { id: affectationId },
    data: { actif: false },
  });
}

export async function getAffectationActive(userId: string) {
  const now = new Date();
  return prisma.affectationPlanning.findFirst({
    where: {
      userId,
      actif: true,
      dateDebut: { lte: now },
      OR: [{ dateFin: null }, { dateFin: { gte: now } }],
    },
    include: { planning: { select: { nom: true, type: true } } },
    orderBy: { dateDebut: "desc" },
  });
}

export async function getEmployesSansPlanning(antenneId?: string) {
  return prisma.user.findMany({
    where: {
      actif: true,
      role: { not: "SUPER_ADMIN" },
      ...(antenneId ? { antenneId } : {}),
      affectations: { none: { actif: true } },
    },
    select: { id: true, nom: true, prenom: true },
    orderBy: { nom: "asc" },
  });
}
