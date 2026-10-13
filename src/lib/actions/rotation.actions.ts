"use server";

import { prisma } from "@/lib/prisma";
import { SHIFT_DEFAULTS, CYCLE_GARDE_DEFAULT } from "@/lib/constants";
import type { TypeShift } from "@/generated/prisma/client";

// ==================== EQUIPES ====================

export async function getEquipes(antenneId?: string) {
  return prisma.equipe.findMany({
    where: {
      actif: true,
      ...(antenneId ? { OR: [{ antenneId }, { antenneId: null }] } : {}),
    },
    include: {
      membres: {
        where: { actif: true },
        include: { user: { select: { id: true, nom: true, prenom: true } } },
      },
      antenne: { select: { nom: true } },
      _count: { select: { membres: { where: { actif: true } } } },
    },
    orderBy: { code: "asc" },
  });
}

export async function createEquipe(data: {
  nom: string;
  code: string;
  couleur: string;
  antenneId?: string;
}) {
  return prisma.equipe.create({ data });
}

export async function deleteEquipe(id: string) {
  return prisma.equipe.update({ where: { id }, data: { actif: false } });
}

export async function addMembreEquipe(equipeId: string, userId: string) {
  // Retirer des autres equipes actives
  await prisma.equipeMembre.updateMany({
    where: { userId, actif: true },
    data: { actif: false },
  });
  return prisma.equipeMembre.upsert({
    where: { equipeId_userId: { equipeId, userId } },
    update: { actif: true },
    create: { equipeId, userId },
  });
}

export async function removeMembreEquipe(equipeId: string, userId: string) {
  return prisma.equipeMembre.updateMany({
    where: { equipeId, userId },
    data: { actif: false },
  });
}

export async function getEmployesSansEquipe(antenneId?: string) {
  return prisma.user.findMany({
    where: {
      actif: true,
      role: { notIn: ["SUPER_ADMIN", "ADMIN"] },
      ...(antenneId ? { antenneId } : {}),
      equipeMembres: { none: { actif: true } },
    },
    select: { id: true, nom: true, prenom: true },
    orderBy: { nom: "asc" },
  });
}

// ==================== GENERATION ROTATION ====================

/**
 * Genere la rotation de garde pour les equipes d'une antenne.
 * Cycle par defaut : Permanence → Garde → Repos → Repos (4 jours)
 * Chaque equipe est decalee de 1 jour.
 *
 * @param dateDebut   Date de debut (la 1ere equipe commence en Permanence ce jour)
 * @param dateFin     Date de fin de generation
 * @param antenneId   Antenne optionnelle
 * @param cycle       Cycle personnalise (optionnel)
 */
export async function genererRotation(data: {
  dateDebut: string;
  dateFin: string;
  antenneId?: string;
  cycle?: TypeShift[];
}) {
  const equipes = await prisma.equipe.findMany({
    where: {
      actif: true,
      ...(data.antenneId ? { OR: [{ antenneId: data.antenneId }, { antenneId: null }] } : {}),
    },
    orderBy: { code: "asc" },
  });

  if (equipes.length === 0) throw new Error("Aucune equipe active trouvee");

  const cycle = data.cycle ?? CYCLE_GARDE_DEFAULT;
  const cycleLength = cycle.length;
  const start = new Date(data.dateDebut);
  const end = new Date(data.dateFin);

  // Supprimer les rotations existantes dans la plage
  await prisma.rotationGarde.deleteMany({
    where: {
      equipeId: { in: equipes.map((e) => e.id) },
      date: { gte: start, lte: end },
    },
  });

  // Generer les entrees
  const entries: Array<{
    equipeId: string;
    date: Date;
    typeShift: TypeShift;
    heureDebut: string | null;
    heureFin: string | null;
    finLendemain: boolean;
    antenneId: string | null;
  }> = [];

  const current = new Date(start);
  let dayIndex = 0;

  while (current <= end) {
    for (let eIdx = 0; eIdx < equipes.length; eIdx++) {
      // Chaque equipe est decalee de (eIdx) jours dans le cycle
      const shiftIndex = ((dayIndex - eIdx) % cycleLength + cycleLength) % cycleLength;
      const shiftType = cycle[shiftIndex];
      const defaults = SHIFT_DEFAULTS[shiftType];

      entries.push({
        equipeId: equipes[eIdx].id,
        date: new Date(Date.UTC(current.getFullYear(), current.getMonth(), current.getDate())),
        typeShift: shiftType,
        heureDebut: defaults.heureDebut,
        heureFin: defaults.heureFin,
        finLendemain: defaults.finLendemain,
        antenneId: data.antenneId ?? null,
      });
    }
    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  // Insertion en batch
  await prisma.rotationGarde.createMany({ data: entries });

  return { count: entries.length, equipes: equipes.length };
}

// ==================== LECTURE ROTATION ====================

export async function getRotation(data: {
  mois: number; // 0-11
  annee: number;
  antenneId?: string;
}) {
  const start = new Date(Date.UTC(data.annee, data.mois, 1));
  const end = new Date(Date.UTC(data.annee, data.mois + 1, 0));

  const rotations = await prisma.rotationGarde.findMany({
    where: {
      date: { gte: start, lte: end },
      ...(data.antenneId ? { antenneId: data.antenneId } : {}),
    },
    include: {
      equipe: { select: { id: true, nom: true, code: true, couleur: true } },
    },
    orderBy: [{ date: "asc" }, { equipe: { code: "asc" } }],
  });

  return rotations;
}

export async function updateRotationEntry(id: string, typeShift: TypeShift) {
  const defaults = SHIFT_DEFAULTS[typeShift];
  return prisma.rotationGarde.update({
    where: { id },
    data: {
      typeShift,
      heureDebut: defaults.heureDebut,
      heureFin: defaults.heureFin,
      finLendemain: defaults.finLendemain,
    },
  });
}

export async function supprimerRotation(data: {
  dateDebut: string;
  dateFin: string;
  antenneId?: string;
}) {
  const start = new Date(data.dateDebut);
  const end = new Date(data.dateFin);

  return prisma.rotationGarde.deleteMany({
    where: {
      date: { gte: start, lte: end },
      ...(data.antenneId ? { antenneId: data.antenneId } : {}),
    },
  });
}
