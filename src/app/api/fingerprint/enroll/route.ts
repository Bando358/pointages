import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { enrollerEmpreinte } from "@/lib/actions/empreinte.actions";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const role = session.user.role;
  if (!["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE"].includes(role)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, doigt, templateBase64, qualite } = body;

    if (!userId || !doigt || !templateBase64 || qualite === undefined) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }

    await enrollerEmpreinte({
      userId,
      doigt,
      templateBase64,
      qualite,
      enrolledById: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
