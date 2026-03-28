"use server";

import { prisma } from "@/lib/prisma";

export async function getAuditLogs(options: {
  page?: number;
  pageSize?: number;
  action?: string;
  userId?: string;
}) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 50;

  const where: any = {};
  if (options.action) where.action = options.action;
  if (options.userId) where.userId = options.userId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { nom: true, prenom: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: data.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details ? JSON.parse(log.details) : null,
      user: log.user,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getAuditStats() {
  const [totalLogs, saisiesManuelles, marquagesAbsent] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { action: "SAISIE_MANUELLE" } }),
    prisma.auditLog.count({ where: { action: "MARQUAGE_ABSENT" } }),
  ]);

  return { totalLogs, saisiesManuelles, marquagesAbsent };
}
