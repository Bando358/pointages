import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Database
  try {
    await prisma.user.count();
    checks.database = { status: "ok" };
  } catch (err: any) {
    checks.database = { status: "error", message: err.message };
  }

  // Environment
  checks.env = {
    status: process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET && process.env.FINGERPRINT_ENCRYPTION_KEY
      ? "ok"
      : "error",
    message: !process.env.DATABASE_URL ? "DATABASE_URL manquant" :
             !process.env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET manquant" :
             !process.env.FINGERPRINT_ENCRYPTION_KEY ? "FINGERPRINT_ENCRYPTION_KEY manquant" : undefined,
  };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json({ status: allOk ? "healthy" : "degraded", checks }, { status: allOk ? 200 : 503 });
}
