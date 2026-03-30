import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { checkIn, checkOut, getTodayPointage } from "@/lib/actions/pointage.actions";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyApiKey(provided: string | null): boolean {
  const expected = process.env.FINGERPRINT_API_KEY;
  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("x-fingerprint-api-key");

  if (!session && !verifyApiKey(apiKey)) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    const { userId, score, antenneId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const todayPointage = await getTodayPointage(userId);

    // Delai minimum entre arrivee et depart (30 minutes)
    const DELAI_MIN_MINUTES = 30;

    let action: "arrivee" | "depart";
    let pointage;

    if (!todayPointage || !todayPointage.heureArrivee) {
      action = "arrivee";
      pointage = await checkIn(userId, antenneId);
    } else if (!todayPointage.heureDepart) {
      // Verifier le delai minimum depuis l'arrivee
      const arrivee = new Date(todayPointage.heureArrivee);
      const maintenant = new Date();
      const diffMinutes = (maintenant.getTime() - arrivee.getTime()) / 60000;

      if (diffMinutes < DELAI_MIN_MINUTES) {
        // Trop tot pour pointer le depart - ignorer silencieusement
        return NextResponse.json({
          success: true,
          pointage: todayPointage,
          action: "arrivee_recente",
          message: `Arrivee deja enregistree a ${arrivee.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        });
      }

      action = "depart";
      pointage = await checkOut(userId);
    } else {
      return NextResponse.json({
        success: true,
        pointage: todayPointage,
        action: "deja_complet",
        message: "Pointage deja complet pour aujourd'hui",
      });
    }

    await prisma.empreinteLog.create({
      data: {
        event: action === "arrivee" ? "POINTAGE_ARRIVEE" : "POINTAGE_DEPART",
        userId,
        details: `Score: ${score ?? "N/A"} | Antenne: ${antenneId ?? "N/A"}`,
      },
    });

    return NextResponse.json({ success: true, pointage, action });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
