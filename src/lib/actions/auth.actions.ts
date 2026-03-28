"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Role } from "@/generated/prisma/client";

export async function createUser(data: {
  nom: string;
  prenom: string;
  email: string;
  username: string;
  password: string;
  role?: Role;
  antenneId?: string;
  accesGlobal?: boolean;
  heureDebutFixe?: string;
  heureFinFixe?: string;
  heureDebutSamedi?: string;
  heureFinSamedi?: string;
  pauseDebutFixe?: string;
  pauseFinFixe?: string;
  travailleSamedi?: boolean;
}) {
  // Securite : seul un user avec accesGlobal peut donner l'accesGlobal
  if (data.accesGlobal) {
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/lib/auth-options");
    const session = await getServerSession(authOptions);
    if (!session || (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role) && !session.user.accesGlobal)) {
      throw new Error("Vous n'avez pas le droit d'accorder l'acces global");
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
}

export async function updateUser(
  userId: string,
  data: {
    nom?: string;
    prenom?: string;
    email?: string;
    role?: Role;
    accesGlobal?: boolean;
    antenneId?: string | null;
    actif?: boolean;
    heureDebutFixe?: string;
    heureFinFixe?: string;
  }
) {
  return prisma.user.update({ where: { id: userId }, data });
}

export async function changePassword(userId: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, 12);
  return prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

export async function getUsers(antenneId?: string) {
  return prisma.user.findMany({
    where: {
      role: { not: "SUPER_ADMIN" },
      ...(antenneId ? { antenneId } : {}),
    },
    include: { antenne: true },
    orderBy: { nom: "asc" },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { antenne: true },
  });
}

// ==================== ANTENNES ====================

export async function getAntennes() {
  return prisma.antenne.findMany({ orderBy: { nom: "asc" } });
}

export async function getAntenneById(id: string) {
  return prisma.antenne.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
}

export async function createAntenne(data: {
  nom: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  loginKiosk: string;
  passwordKiosk: string;
}) {
  const hashedPassword = await bcrypt.hash(data.passwordKiosk, 12);
  return prisma.antenne.create({
    data: { ...data, passwordKiosk: hashedPassword },
  });
}

export async function updateAntenne(
  id: string,
  data: {
    nom?: string;
    ville?: string;
    adresse?: string;
    telephone?: string;
    actif?: boolean;
  }
) {
  return prisma.antenne.update({ where: { id }, data });
}

export async function changeAntennePassword(id: string, newPassword: string) {
  const hashed = await bcrypt.hash(newPassword, 12);
  return prisma.antenne.update({ where: { id }, data: { passwordKiosk: hashed } });
}

export async function deleteAntenne(id: string) {
  return prisma.antenne.delete({ where: { id } });
}
