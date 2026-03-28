import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getTemplatesPourIdentification } from "@/lib/actions/empreinte.actions";
import crypto from "crypto";

function verifyApiKey(provided: string | null): boolean {
  const expected = process.env.FINGERPRINT_API_KEY;
  if (!provided || !expected) return false;
  if (provided.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  // Auth: session (utilisateur connecte) OU API key (kiosk)
  const session = await getServerSession(authOptions);
  const apiKey = req.headers.get("x-fingerprint-api-key");

  if (!session && !verifyApiKey(apiKey)) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const templates = await getTemplatesPourIdentification(body.antenneId);
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
