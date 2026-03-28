"use server";

import { prisma } from "@/lib/prisma";
import { encryptTemplate, decryptTemplate } from "@/lib/fingerprint/crypto";

export async function enrollerEmpreinte(data: {
  userId: string;
  doigt: number;
  templateBase64: string;
  qualite: number;
  enrolledById: string;
}) {
  if (data.doigt < 1 || data.doigt > 10) throw new Error("Doigt invalide (1-10)");
  if (data.qualite < 0 || data.qualite > 100) throw new Error("Qualite invalide (0-100)");

  const encrypted = await encryptTemplate(data.templateBase64);

  const empreinte = await prisma.empreinte.upsert({
    where: { userId_doigt: { userId: data.userId, doigt: data.doigt } },
    update: { templateData: encrypted, qualite: data.qualite, actif: true },
    create: {
      userId: data.userId,
      doigt: data.doigt,
      templateData: encrypted,
      qualite: data.qualite,
      enrolledById: data.enrolledById,
    },
  });

  await prisma.user.update({
    where: { id: data.userId },
    data: { empreinteEnrolee: true },
  });

  await prisma.empreinteLog.create({
    data: {
      event: "ENROLLMENT",
      userId: data.userId,
      details: `Doigt ${data.doigt} enrole (qualite: ${data.qualite})`,
    },
  });

  return empreinte;
}

export async function supprimerEmpreinte(empreinteId: string) {
  const empreinte = await prisma.empreinte.delete({ where: { id: empreinteId } });

  const remaining = await prisma.empreinte.count({
    where: { userId: empreinte.userId, actif: true },
  });

  if (remaining === 0) {
    await prisma.user.update({
      where: { id: empreinte.userId },
      data: { empreinteEnrolee: false },
    });
  }

  await prisma.empreinteLog.create({
    data: {
      event: "TEMPLATE_DELETED",
      userId: empreinte.userId,
      details: `Doigt ${empreinte.doigt} supprime`,
    },
  });

  return { success: true };
}

export async function getEmpreintesUtilisateur(userId: string) {
  return prisma.empreinte.findMany({
    where: { userId, actif: true },
    select: {
      id: true,
      doigt: true,
      qualite: true,
      createdAt: true,
      enrolledBy: { select: { nom: true, prenom: true } },
    },
    orderBy: { doigt: "asc" },
  });
}

export async function getUtilisateursAvecEmpreintes(antenneId?: string) {
  return prisma.user.findMany({
    where: {
      actif: true,
      role: { not: "SUPER_ADMIN" },
      ...(antenneId ? { antenneId } : {}),
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      empreinteEnrolee: true,
      antenne: { select: { nom: true } },
      _count: { select: { empreintes: { where: { actif: true } } } },
    },
    orderBy: { nom: "asc" },
  });
}

/**
 * Retourne les templates decryptes pour identification biometrique
 * Filtre par antenne du kiosk, mais inclut aussi les employes en mission
 */
export async function getTemplatesPourIdentification(antenneId?: string) {
  // On charge TOUTES les empreintes actives (un employe en mission doit pouvoir pointer)
  const empreintes = await prisma.empreinte.findMany({
    where: { actif: true },
    select: {
      userId: true,
      doigt: true,
      templateData: true,
      user: { select: { nom: true, prenom: true, antenneId: true } },
    },
  });

  const results = await Promise.all(
    empreintes.map(async (e: any) => ({
      userId: e.userId,
      nom: e.user.nom,
      prenom: e.user.prenom,
      doigt: e.doigt,
      antenneOrigine: e.user.antenneId,
      templateBase64: await decryptTemplate(e.templateData),
    }))
  );

  return results;
}
