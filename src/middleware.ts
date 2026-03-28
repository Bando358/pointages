import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLES_GESTION = ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/employes": ROLES_GESTION,
  "/antennes": ["SUPER_ADMIN", "ADMIN"],
  "/audit": ["SUPER_ADMIN", "ADMIN"],
  "/rapports": ROLES_GESTION,
};

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Pas de token = pas connecte → rediriger vers login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const path = req.nextUrl.pathname;

  // Kiosk : restreindre a /pointages uniquement
  if (token.loginType === "kiosk") {
    if (!path.startsWith("/pointages") && !path.startsWith("/api")) {
      return NextResponse.redirect(new URL("/pointages", req.url));
    }
    return NextResponse.next();
  }

  // Verifier les roles par route
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route) && !roles.includes(token.role as string)) {
      return NextResponse.redirect(new URL("/dashboard?forbidden=1", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|api/fingerprint|api/health|login|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
