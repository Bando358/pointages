import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ROLES_GESTION = ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/employes": ROLES_GESTION,
  "/antennes": ["SUPER_ADMIN", "ADMIN"],
  "/audit": ["SUPER_ADMIN", "ADMIN"],
  "/rapports": ROLES_GESTION,
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Kiosk accounts can only access /pointages (fingerprint scanning)
    if (token?.loginType === "kiosk") {
      if (!path.startsWith("/pointages") && !path.startsWith("/api")) {
        return NextResponse.redirect(new URL("/pointages", req.url));
      }
      return NextResponse.next();
    }

    for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
      if (path.startsWith(route) && !roles.includes(token?.role as string)) {
        return NextResponse.redirect(new URL("/pointages?forbidden=1", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api/auth|api/fingerprint|login|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
