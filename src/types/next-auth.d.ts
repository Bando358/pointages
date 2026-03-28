import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
      username: string;
      role: string;
      antenneId: string | null;
      antenneNom: string | null;
      accesGlobal: boolean;
      loginType: "user" | "kiosk";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    nom: string;
    prenom: string;
    username: string;
    role: string;
    antenneId: string | null;
    antenneNom: string | null;
    accesGlobal: boolean;
    loginType: "user" | "kiosk";
  }
}
