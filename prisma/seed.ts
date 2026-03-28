import dotenv from "dotenv";
dotenv.config({ quiet: true } as any);

import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! } as any);
const prisma = new PrismaClient({ adapter } as any);

const pwd = (p: string) => bcrypt.hashSync(p, 12);

function username(nom: string, prenom: string): string {
  const n = nom.toLowerCase().replace(/[^a-z]/g, "").substring(0, 10);
  const p = prenom.toLowerCase().replace(/[^a-z]/g, "").substring(0, 10);
  return `${p}.${n}`;
}

function email(uname: string): string {
  return `${uname}@aibef.ci`;
}

async function main() {
  console.log("Seeding database...\n");

  // ==================== ANTENNES ====================
  const antennes: Record<string, any> = {};
  const antenneData = [
    { nom: "Siege - Abidjan", ville: "Abidjan", loginKiosk: "kiosk-abidjan" },
    { nom: "Antenne Bondoukou", ville: "Bondoukou", loginKiosk: "kiosk-bondoukou" },
    { nom: "Antenne Bouake", ville: "Bouake", loginKiosk: "kiosk-bouake" },
    { nom: "Antenne Daloa", ville: "Daloa", loginKiosk: "kiosk-daloa" },
    { nom: "Antenne Korhogo", ville: "Korhogo", loginKiosk: "kiosk-korhogo" },
    { nom: "Antenne Man", ville: "Man", loginKiosk: "kiosk-man" },
    { nom: "Antenne San Pedro", ville: "San Pedro", loginKiosk: "kiosk-sanpedro" },
    { nom: "Antenne Yamoussoukro", ville: "Yamoussoukro", loginKiosk: "kiosk-yakro" },
  ];

  for (const a of antenneData) {
    antennes[a.loginKiosk] = await prisma.antenne.upsert({
      where: { loginKiosk: a.loginKiosk },
      update: {},
      create: { nom: a.nom, ville: a.ville, loginKiosk: a.loginKiosk, passwordKiosk: pwd("kiosk123") },
    });
    console.log(`  Antenne: ${a.nom}`);
  }

  // ==================== SUPER ADMIN ====================
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nom: "ADMIN", prenom: "Super", email: "admin@aibef.ci",
      username: "admin", password: pwd("admin123"), role: "SUPER_ADMIN",
      antenneId: antennes["kiosk-abidjan"].id,
      accesGlobal: true,
    },
  });

  // ==================== EMPLOYES ====================
  type Emp = { nom: string; prenom: string; antenne: string; role?: string };

  const employes: Emp[] = [
    // === SIEGE ABIDJAN (1-57) ===
    { nom: "OUATTARA", prenom: "Kipedja Pascal", antenne: "kiosk-abidjan", role: "RESPONSABLE" },
    { nom: "KONE", prenom: "Nanourou Genevieve", antenne: "kiosk-abidjan" },
    { nom: "OKOU", prenom: "Dakouri Denis", antenne: "kiosk-abidjan" },
    { nom: "KOFFI", prenom: "Adjoua Hortense", antenne: "kiosk-abidjan" },
    { nom: "ALLECHI", prenom: "Emmanuel", antenne: "kiosk-abidjan" },
    { nom: "N'GUESSAN", prenom: "Gely Hyacinthe", antenne: "kiosk-abidjan", role: "RESPONSABLE" },
    { nom: "WAYOU", prenom: "Gnako Blanche Mary", antenne: "kiosk-abidjan" },
    { nom: "ALIMAN", prenom: "Claudine", antenne: "kiosk-abidjan" },
    { nom: "AKA", prenom: "Kacou Maxime", antenne: "kiosk-abidjan" },
    { nom: "ACHI", prenom: "Claude Jacqueline", antenne: "kiosk-abidjan" },
    { nom: "TETCHI", prenom: "Moise", antenne: "kiosk-abidjan" },
    { nom: "N'DRI", prenom: "Innocent", antenne: "kiosk-abidjan" },
    { nom: "KAMBOU", prenom: "Mir Rodrigue", antenne: "kiosk-abidjan" },
    { nom: "IRITIE", prenom: "Olivier Jonas", antenne: "kiosk-abidjan" },
    { nom: "SEDJI", prenom: "Barthelemy", antenne: "kiosk-abidjan" },
    { nom: "KOFFI", prenom: "Yves Joel", antenne: "kiosk-abidjan" },
    { nom: "GBANE", prenom: "Abdoulaye", antenne: "kiosk-abidjan" },
    { nom: "MANZAN", prenom: "Simonne", antenne: "kiosk-abidjan" },
    { nom: "KOUASSI", prenom: "Bah Ernest", antenne: "kiosk-abidjan" },
    { nom: "KOUAKOU", prenom: "Delphine", antenne: "kiosk-abidjan" },
    { nom: "KANZIE", prenom: "Clementine", antenne: "kiosk-abidjan" },
    { nom: "AKE", prenom: "Yolande Naomie", antenne: "kiosk-abidjan" },
    { nom: "ADAMA", prenom: "Cherif", antenne: "kiosk-abidjan" },
    { nom: "KOUAME", prenom: "Yaha Conforte", antenne: "kiosk-abidjan" },
    { nom: "KOUADIO", prenom: "Aya Germaine", antenne: "kiosk-abidjan" },
    { nom: "ADOH", prenom: "Odette", antenne: "kiosk-abidjan" },
    { nom: "KOUMOUIN", prenom: "Sainte Legere", antenne: "kiosk-abidjan" },
    { nom: "N'GUESSAN", prenom: "Emma Viviane", antenne: "kiosk-abidjan" },
    { nom: "ALESSA", prenom: "Josephine", antenne: "kiosk-abidjan" },
    { nom: "ZION", prenom: "Constant", antenne: "kiosk-abidjan" },
    { nom: "OUATTARA", prenom: "Marie Louise", antenne: "kiosk-abidjan" },
    { nom: "SEKI", prenom: "Evaldie Ghislaine", antenne: "kiosk-abidjan" },
    { nom: "KONE", prenom: "Helene Roseline", antenne: "kiosk-abidjan" },
    { nom: "AFFI BEDAH", prenom: "Cecil Laurent", antenne: "kiosk-abidjan" },
    { nom: "KOUADIO", prenom: "Amoin Therese", antenne: "kiosk-abidjan" },
    { nom: "N'ZI", prenom: "Adjoua Celine", antenne: "kiosk-abidjan" },
    { nom: "NOMEL", prenom: "Leontine", antenne: "kiosk-abidjan" },
    { nom: "KOUAKOU", prenom: "Amoin Monique", antenne: "kiosk-abidjan" },
    { nom: "VANIE LOU SEHI", prenom: "Alida Flora", antenne: "kiosk-abidjan" },
    { nom: "SOUNAN", prenom: "Marie Therese", antenne: "kiosk-abidjan" },
    { nom: "AKA", prenom: "Anasthasie Josiane", antenne: "kiosk-abidjan" },
    { nom: "GBAMELE", prenom: "Marie Joelle", antenne: "kiosk-abidjan" },
    { nom: "ALLEMIN", prenom: "Mariette-Laure", antenne: "kiosk-abidjan" },
    { nom: "DIBI", prenom: "Amoin Sonia", antenne: "kiosk-abidjan" },
    { nom: "TIZIE", prenom: "Boko Joelle", antenne: "kiosk-abidjan" },
    { nom: "N'GUERE", prenom: "Adja Alice", antenne: "kiosk-abidjan" },
    { nom: "LAVIA", prenom: "Kouassi Marius", antenne: "kiosk-abidjan" },
    { nom: "YEO", prenom: "Kolo", antenne: "kiosk-abidjan" },
    { nom: "SIGNO", prenom: "Kouame Gervais", antenne: "kiosk-abidjan" },
    { nom: "TANOH", prenom: "Yao Hyppolite", antenne: "kiosk-abidjan" },
    { nom: "DIANE", prenom: "Abdoulaye", antenne: "kiosk-abidjan" },
    { nom: "DADIE", prenom: "Ingrid Danielle", antenne: "kiosk-abidjan" },
    { nom: "KOUASSI", prenom: "Yah Chantal", antenne: "kiosk-abidjan" },
    { nom: "N'GUESSAN", prenom: "Josianne", antenne: "kiosk-abidjan" },
    { nom: "N'ZI", prenom: "Kassi Hypolyte", antenne: "kiosk-abidjan" },
    { nom: "KOUAKOU", prenom: "Affoue Marianne", antenne: "kiosk-abidjan" },
    { nom: "KOULIBALI", prenom: "Yoh Laetitia", antenne: "kiosk-abidjan" },

    // === BONDOUKOU (58-61) ===
    { nom: "DJAKO", prenom: "Geoffroy Raoul", antenne: "kiosk-bondoukou", role: "RESPONSABLE" },
    { nom: "KOFFI", prenom: "Guy Ernest", antenne: "kiosk-bondoukou", role: "RESPONSABLE" },
    { nom: "OUATTARA", prenom: "Mariam Ruth", antenne: "kiosk-bondoukou" },
    { nom: "OUATTARA", prenom: "Abdoulaye", antenne: "kiosk-bondoukou" },

    // === BOUAKE (62-73) ===
    { nom: "ZAOULI", prenom: "Ernest", antenne: "kiosk-bouake" },
    { nom: "ABLE", prenom: "Ambroise Eric", antenne: "kiosk-bouake" },
    { nom: "BAI", prenom: "Arnaud Thierry", antenne: "kiosk-bouake", role: "RESPONSABLE" },
    { nom: "YEO", prenom: "Karidja", antenne: "kiosk-bouake" },
    { nom: "N'CHO", prenom: "Constant Darius", antenne: "kiosk-bouake" },
    { nom: "COULIBALY", prenom: "Marceline", antenne: "kiosk-bouake" },
    { nom: "KOUASSI", prenom: "Adjo Sylvie", antenne: "kiosk-bouake" },
    { nom: "OUATTARA", prenom: "Mamou", antenne: "kiosk-bouake" },
    { nom: "COULIBALY", prenom: "Karidja", antenne: "kiosk-bouake" },
    { nom: "YOBOUET", prenom: "Aya Florence", antenne: "kiosk-bouake" },
    { nom: "KOMOIN", prenom: "Ahou Clarisse", antenne: "kiosk-bouake" },
    { nom: "COULIBALY", prenom: "Yeklouhie", antenne: "kiosk-bouake" },

    // === DALOA (74-88) ===
    { nom: "COULIBALY", prenom: "Issiaka", antenne: "kiosk-daloa", role: "RESPONSABLE" },
    { nom: "SERY", prenom: "Tra Maxime", antenne: "kiosk-daloa" },
    { nom: "KONE", prenom: "Maman", antenne: "kiosk-daloa" },
    { nom: "DIARRASSOUBA", prenom: "Fatoumata", antenne: "kiosk-daloa" },
    { nom: "BANDO", prenom: "Oumar", antenne: "kiosk-daloa", role: "RESPONSABLE" },
    { nom: "ATTOH", prenom: "Eugene Gildas", antenne: "kiosk-daloa" },
    { nom: "DJORO", prenom: "Solange", antenne: "kiosk-daloa" },
    { nom: "KABORE", prenom: "Mathe", antenne: "kiosk-daloa" },
    { nom: "KRA", prenom: "Christine", antenne: "kiosk-daloa" },
    { nom: "YAO", prenom: "Paul", antenne: "kiosk-daloa" },
    { nom: "LIGUE", prenom: "Glawdys Constance", antenne: "kiosk-daloa" },
    { nom: "ZEHE", prenom: "Larissa", antenne: "kiosk-daloa" },
    { nom: "KOFFI", prenom: "Aya Juliette", antenne: "kiosk-daloa" },
    { nom: "FIRMIN", prenom: "Boguhe", antenne: "kiosk-daloa" },
    { nom: "GUEHI", prenom: "Gedeon Alain", antenne: "kiosk-daloa" },

    // === KORHOGO (89-125) ===
    { nom: "TOURE", prenom: "Fanhonan", antenne: "kiosk-korhogo", role: "RESPONSABLE" },
    { nom: "COULIBALY", prenom: "Mamadou", antenne: "kiosk-korhogo" },
    { nom: "TIA", prenom: "Yake Stephane", antenne: "kiosk-korhogo" },
    { nom: "NANAN", prenom: "Joseph Pascal", antenne: "kiosk-korhogo" },
    { nom: "KRAMO", prenom: "Koffi Leon", antenne: "kiosk-korhogo", role: "RESPONSABLE" },
    { nom: "TANOH", prenom: "Honore", antenne: "kiosk-korhogo" },
    { nom: "CAMARA", prenom: "Fanta", antenne: "kiosk-korhogo" },
    { nom: "DOUMBIA", prenom: "Salimata", antenne: "kiosk-korhogo" },
    { nom: "BAGNE", prenom: "Erika Danielle", antenne: "kiosk-korhogo" },
    { nom: "KOUASSI", prenom: "Konan Brice", antenne: "kiosk-korhogo" },
    { nom: "N'DOUA", prenom: "Amenan Marina", antenne: "kiosk-korhogo" },
    { nom: "GOHIBA", prenom: "Keziah", antenne: "kiosk-korhogo" },
    { nom: "DIARRA", prenom: "Khady Fatim", antenne: "kiosk-korhogo" },
    { nom: "KAMAGATE", prenom: "Konede", antenne: "kiosk-korhogo" },
    { nom: "OUATTARA", prenom: "Nigangnely Sali", antenne: "kiosk-korhogo" },
    { nom: "COULIBALY", prenom: "Mariam", antenne: "kiosk-korhogo" },
    { nom: "CAMARA", prenom: "Fadjiguiba", antenne: "kiosk-korhogo" },
    { nom: "SEKONOGO", prenom: "Genevieve", antenne: "kiosk-korhogo" },
    { nom: "OUATTARA", prenom: "Issouf", antenne: "kiosk-korhogo" },
    { nom: "SORO", prenom: "Fanda", antenne: "kiosk-korhogo" },
    { nom: "COULIBALY", prenom: "Fierlaha", antenne: "kiosk-korhogo" },
    { nom: "YEO", prenom: "Abou", antenne: "kiosk-korhogo" },
    { nom: "COULIBALY", prenom: "Djeneba", antenne: "kiosk-korhogo" },
    { nom: "KONE", prenom: "Korona Helene", antenne: "kiosk-korhogo" },
    { nom: "SEKONGO", prenom: "Nafoungo Irene", antenne: "kiosk-korhogo" },
    { nom: "DIALLO", prenom: "Ahoua", antenne: "kiosk-korhogo" },
    { nom: "SISSE", prenom: "Azeta", antenne: "kiosk-korhogo" },
    { nom: "COULIBALY", prenom: "Tchewa Linda", antenne: "kiosk-korhogo" },
    { nom: "KONAN", prenom: "Kouakou Quenum", antenne: "kiosk-korhogo" },

    // === MAN (118-122) ===
    { nom: "BLEU", prenom: "Monne Prisca", antenne: "kiosk-man" },
    { nom: "ELLO", prenom: "Yaba Micheline", antenne: "kiosk-man", role: "RESPONSABLE" },
    { nom: "TOURE", prenom: "Matenin", antenne: "kiosk-man" },
    { nom: "GONLA", prenom: "Ounseu Adeline", antenne: "kiosk-man" },
    { nom: "KALLO", prenom: "Falikou", antenne: "kiosk-man" },

    // === SAN PEDRO (123-138) ===
    { nom: "SERI", prenom: "Odile", antenne: "kiosk-sanpedro" },
    { nom: "DAGRY", prenom: "Yvette Suzanne", antenne: "kiosk-sanpedro" },
    { nom: "DIABATE", prenom: "Raissa", antenne: "kiosk-sanpedro" },
    { nom: "LOKPO", prenom: "Dieke", antenne: "kiosk-sanpedro", role: "RESPONSABLE" },
    { nom: "BAHINCHI", prenom: "Marie-Yolande", antenne: "kiosk-sanpedro" },
    { nom: "KROUBA", prenom: "Jean Yves", antenne: "kiosk-sanpedro", role: "RESPONSABLE" },
    { nom: "LATH", prenom: "Yediou Danielle", antenne: "kiosk-sanpedro" },
    { nom: "KOUA", prenom: "Eric Sebastien", antenne: "kiosk-sanpedro" },
    { nom: "ASSAMOI", prenom: "Jean Paul", antenne: "kiosk-sanpedro" },
    { nom: "DIEBODE", prenom: "Genevieve", antenne: "kiosk-sanpedro" },
    { nom: "ACHIEPI", prenom: "Sandrine Flora", antenne: "kiosk-sanpedro" },
    { nom: "N'GUESSAN", prenom: "Ahou Jeannette", antenne: "kiosk-sanpedro" },
    { nom: "N'GUESSAN", prenom: "Akissi Chantal", antenne: "kiosk-sanpedro" },
    { nom: "BAMBA", prenom: "Yaya", antenne: "kiosk-sanpedro" },
    { nom: "TIE", prenom: "Mekapeu Lidwine", antenne: "kiosk-sanpedro" },
    { nom: "TOURE", prenom: "Edouard", antenne: "kiosk-sanpedro" },

    // === YAMOUSSOUKRO (139-144) ===
    { nom: "ANOUMAN", prenom: "Danielle Carmen", antenne: "kiosk-yakro", role: "RESPONSABLE" },
    { nom: "MANLAMIN", prenom: "France Arlette", antenne: "kiosk-yakro" },
    { nom: "N'DRI", prenom: "Lina Rosine", antenne: "kiosk-yakro" },
    { nom: "KOUAKOU", prenom: "Marie Emmanuelle", antenne: "kiosk-yakro" },
    { nom: "KADJO", prenom: "Kpoma Martine", antenne: "kiosk-yakro" },
    { nom: "POPORE", prenom: "Tehia Nadege", antenne: "kiosk-yakro", role: "RESPONSABLE" },
  ];

  // Track usernames to handle duplicates
  const usedUsernames = new Set<string>();
  let created = 0;

  for (const emp of employes) {
    let uname = username(emp.nom, emp.prenom);
    // Deduplicate
    if (usedUsernames.has(uname)) {
      let suffix = 2;
      while (usedUsernames.has(`${uname}${suffix}`)) suffix++;
      uname = `${uname}${suffix}`;
    }
    usedUsernames.add(uname);

    const antenneId = antennes[emp.antenne]?.id;
    if (!antenneId) { console.warn(`  Antenne inconnue: ${emp.antenne}`); continue; }

    try {
      await prisma.user.upsert({
        where: { username: uname },
        update: {},
        create: {
          nom: emp.nom,
          prenom: emp.prenom,
          email: email(uname),
          username: uname,
          password: pwd("aibef2025"),
          role: (emp.role as any) ?? "EMPLOYE",
          antenneId,
        },
      });
      created++;
    } catch (err: any) {
      console.warn(`  Erreur pour ${emp.nom} ${emp.prenom}: ${err.message}`);
    }
  }

  console.log(`\n${created} employes crees sur ${employes.length}`);
  console.log("\n=== COMPTES ===");
  console.log("  admin / admin123 (Super Admin)");
  console.log("  Tous les employes: [prenom].[nom] / aibef2025");
  console.log("  Exemple: kipedja.ouattara / aibef2025");
  console.log("\n=== KIOSK (Antennes) ===");
  for (const a of antenneData) {
    console.log(`  ${a.loginKiosk} / kiosk123 (${a.nom})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
