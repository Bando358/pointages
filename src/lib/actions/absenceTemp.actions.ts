"use server";

import { prisma } from "@/lib/prisma";
import { toDateOnly } from "@/lib/date-utils";
import type { TypeAbsenceTemp } from "@/generated/prisma/client";

/**
 * Declarer une absence temporaire (sortie en cours de journee) - Q8
 */
export async function declarerAbsenceTemp(data: {
  userId: string;
  type: TypeAbsenceTemp;
  motif: string;
}) {
  const now = new Date();
  const today = toDateOnly(now);

  return prisma.absenceTemp.create({
    data: {
      userId: data.userId,
      date: today,
      heureSortie: now,
      type: data.type,
      motif: data.motif,
      // Mission AIBEF = temps de travail (Q10)
      compteCommeTravail: data.type === "MISSION_AIBEF",
      statut: "EN_ATTENTE",
    },
  });
}

/**
 * Enregistrer le retour d'une absence temporaire
 */
export async function retourAbsenceTemp(absenceId: string) {
  return prisma.absenceTemp.update({
    where: { id: absenceId },
    data: { heureRetour: new Date() },
  });
}

/**
 * Valider/refuser une absence temporaire (superieur hierarchique - Q9)
 */
export async function validerAbsenceTemp(absenceId: string, valideParId: string, approuve: boolean) {
  // Verifier que le validateur est RESPONSABLE ou SUPER_ADMIN
  const validateur = await prisma.user.findUnique({ where: { id: valideParId } });
  if (!validateur || !["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE"].includes(validateur.role)) {
    throw new Error("Seul un responsable peut valider les absences");
  }

  const absence = await prisma.absenceTemp.findUnique({ where: { id: absenceId }, include: { user: true } });
  if (!absence) throw new Error("Absence introuvable");

  // Non-global roles can only validate absences from their own antenne
  if (!["SUPER_ADMIN", "ADMIN"].includes(validateur.role) && !(validateur as any).accesGlobal && validateur.antenneId !== absence.user.antenneId) {
    throw new Error("Vous ne pouvez valider que les absences de votre antenne");
  }

  return prisma.absenceTemp.update({
    where: { id: absenceId },
    data: {
      statut: approuve ? "APPROUVE" : "REFUSE",
      valideParId,
    },
  });
}

export async function getAbsencesTemp(options: {
  userId?: string;
  antenneId?: string;
  date?: Date;
  statut?: string;
}) {
  return prisma.absenceTemp.findMany({
    where: {
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.antenneId ? { user: { antenneId: options.antenneId } } : {}),
      ...(options.date ? { date: toDateOnly(options.date) } : {}),
      ...(options.statut ? { statut: options.statut as any } : {}),
    },
    include: {
      user: { select: { nom: true, prenom: true, antenne: { select: { nom: true } } } },
      validePar: { select: { nom: true, prenom: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAbsencesTempEnCours(userId: string) {
  const today = toDateOnly(new Date());
  return prisma.absenceTemp.findFirst({
    where: { userId, date: today, heureRetour: null },
  });
}
