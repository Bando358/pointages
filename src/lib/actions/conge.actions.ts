"use server";

import { prisma } from "@/lib/prisma";
import type { TypeConge } from "@/generated/prisma/client";

export async function demanderConge(data: {
  userId: string;
  dateDebut: Date;
  dateFin: Date;
  type: TypeConge;
  motif?: string;
}) {
  if (new Date(data.dateFin) < new Date(data.dateDebut)) {
    throw new Error("La date de fin doit etre apres la date de debut");
  }
  return prisma.conge.create({
    data: {
      userId: data.userId,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      type: data.type,
      motif: data.motif,
      statut: "SOUMIS",
    },
  });
}

export async function approuverConge(congeId: string, approuveParId: string) {
  return prisma.conge.update({
    where: { id: congeId },
    data: { statut: "APPROUVE", approuveParId },
  });
}

export async function refuserConge(congeId: string) {
  return prisma.conge.update({
    where: { id: congeId },
    data: { statut: "REFUSE" },
  });
}

export async function getConges(userId?: string, statut?: string) {
  return prisma.conge.findMany({
    where: {
      ...(userId ? { userId } : { user: { role: { not: "SUPER_ADMIN" } } }),
      ...(statut ? { statut: statut as any } : {}),
    },
    include: {
      user: { select: { nom: true, prenom: true, antenne: { select: { nom: true } } } },
      approuvePar: { select: { nom: true, prenom: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
