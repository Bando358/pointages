import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "user-login",
      name: "Compte utilisateur",
      credentials: {
        username: { label: "Nom d'utilisateur", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { antenne: true },
        });

        if (!user || !user.actif) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          username: user.username,
          role: user.role,
          antenneId: user.antenneId,
          antenneNom: user.antenne?.nom ?? null,
          accesGlobal: user.accesGlobal,
          loginType: "user",
        };
      },
    }),
    CredentialsProvider({
      id: "kiosk-login",
      name: "Compte antenne (kiosk)",
      credentials: {
        kioskLogin: { label: "Login antenne", type: "text" },
        kioskPassword: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.kioskLogin || !credentials?.kioskPassword) return null;

        const antenne = await prisma.antenne.findUnique({
          where: { loginKiosk: credentials.kioskLogin },
        });

        if (!antenne || !antenne.actif) return null;
        const isValid = await bcrypt.compare(credentials.kioskPassword, antenne.passwordKiosk);
        if (!isValid) return null;

        return {
          id: `kiosk-${antenne.id}`,
          nom: antenne.nom,
          prenom: "Kiosk",
          email: `kiosk-${antenne.loginKiosk}@pointage.local`,
          username: antenne.loginKiosk,
          role: "KIOSK",
          antenneId: antenne.id,
          antenneNom: antenne.nom,
          loginType: "kiosk",
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  pages: { signIn: "/login" },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nom = (user as any).nom;
        token.prenom = (user as any).prenom;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.antenneId = (user as any).antenneId;
        token.antenneNom = (user as any).antenneNom;
        token.accesGlobal = (user as any).accesGlobal;
        token.loginType = (user as any).loginType;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).nom = token.nom;
        (session.user as any).prenom = token.prenom;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
        (session.user as any).antenneId = token.antenneId;
        (session.user as any).antenneNom = token.antenneNom;
        (session.user as any).accesGlobal = token.accesGlobal;
        (session.user as any).loginType = token.loginType;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Vercel: trust the host header for proper URL detection
  ...(process.env.VERCEL ? { trustHost: true } : {}),
} as NextAuthOptions;
