export const FIXED_HOURS = {
  start: "07:30",
  end: "16:30",
  startSamedi: "08:00",
  endSamedi: "16:00",
  pauseDebut: "12:00",
  pauseFin: "13:00",
} as const;

/// Tolerance de retard en minutes (Q2 : 30 minutes)
export const LATE_THRESHOLD_MINUTES = 30;

/// Duree pause par defaut en minutes (Q7 : 1 heure)
export const DEFAULT_PAUSE_MINUTES = 60;

export const STATUT_POINTAGE_LABELS: Record<string, string> = {
  PRESENT: "Present",
  RETARD: "Retard",
  ABSENT: "Absent",
  CONGE: "Conge",
  MISSION: "Mission",
  ARRET_MALADIE: "Arret maladie",
  ABSENCE_AUTORISEE: "Absence autorisee",
  ABSENCE_NON_AUTORISEE: "Absence non autorisee",
  FERIE: "Ferie",
  DEMI_JOURNEE: "Demi-journee",
};

export const STATUT_POINTAGE_COLORS: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-800",
  RETARD: "bg-yellow-100 text-yellow-800",
  ABSENT: "bg-red-100 text-red-800",
  CONGE: "bg-blue-100 text-blue-800",
  MISSION: "bg-purple-100 text-purple-800",
  ARRET_MALADIE: "bg-orange-100 text-orange-800",
  ABSENCE_AUTORISEE: "bg-cyan-100 text-cyan-800",
  ABSENCE_NON_AUTORISEE: "bg-red-200 text-red-900",
  FERIE: "bg-indigo-100 text-indigo-800",
  DEMI_JOURNEE: "bg-amber-100 text-amber-800",
};

export const ROLES_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  GESTIONNAIRE: "Gestionnaire",
  RESPONSABLE: "Responsable d'antenne",
  EMPLOYE: "Employe",
};

/// Roles avec acces global par defaut (toutes les antennes)
export const ROLES_GLOBAL = ["SUPER_ADMIN", "ADMIN"];
/// Roles avec acces gestion (employes, rapports, plannings, empreintes)
export const ROLES_GESTION = ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE"];
/// Roles avec acces a toutes les pages sauf parametres
export const ROLES_ALL_PAGES = ["SUPER_ADMIN", "ADMIN", "GESTIONNAIRE", "RESPONSABLE", "EMPLOYE"];

export function isGlobalRole(role: string): boolean {
  return ROLES_GLOBAL.includes(role);
}
export function isGestionRole(role: string): boolean {
  return ROLES_GESTION.includes(role);
}
export function hasGlobalAccess(role: string, accesGlobal: boolean): boolean {
  return ROLES_GLOBAL.includes(role) || accesGlobal;
};

export const TYPE_ABSENCE_TEMP_LABELS: Record<string, string> = {
  MISSION_AIBEF: "Mission AIBEF",
  RAISON_PERSONNELLE: "Raison personnelle",
  URGENCE: "Urgence",
  AUTRE: "Autre",
};

export const DOIGT_LABELS: Record<number, string> = {
  1: "Pouce droit",
  2: "Index droit",
  3: "Majeur droit",
  4: "Annulaire droit",
  5: "Auriculaire droit",
  6: "Pouce gauche",
  7: "Index gauche",
  8: "Majeur gauche",
  9: "Annulaire gauche",
  10: "Auriculaire gauche",
};

export const MATCH_THRESHOLD = 100;
export const MIN_QUALITY = 40;
export const ENROLLMENT_CAPTURES = 3;
