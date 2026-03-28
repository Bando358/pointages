-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN_RH', 'CHEF_SERVICE', 'EMPLOYE');

-- CreateEnum
CREATE TYPE "StatutPointage" AS ENUM ('PRESENT', 'RETARD', 'ABSENT', 'CONGE', 'MISSION', 'ARRET_MALADIE', 'ABSENCE_AUTORISEE', 'ABSENCE_NON_AUTORISEE', 'FERIE');

-- CreateEnum
CREATE TYPE "TypeConge" AS ENUM ('ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'EXCEPTIONNEL', 'SANS_SOLDE');

-- CreateEnum
CREATE TYPE "StatutConge" AS ENUM ('BROUILLON', 'SOUMIS', 'APPROUVE', 'REFUSE', 'ANNULE');

-- CreateEnum
CREATE TYPE "EmpreinteEvent" AS ENUM ('ENROLLMENT', 'IDENTIFICATION_SUCCESS', 'IDENTIFICATION_FAIL', 'TEMPLATE_DELETED', 'POINTAGE_ARRIVEE', 'POINTAGE_DEPART');

-- CreateTable
CREATE TABLE "Departement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "telephone" TEXT,
    "poste" TEXT,
    "heureDebutFixe" TEXT NOT NULL DEFAULT '07:30',
    "heureFinFixe" TEXT NOT NULL DEFAULT '16:30',
    "empreinteEnrolee" BOOLEAN NOT NULL DEFAULT false,
    "departementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pointage" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "heureArrivee" TIMESTAMP(3),
    "pauseDebut" TIMESTAMP(3),
    "pauseFin" TIMESTAMP(3),
    "heureDepart" TIMESTAMP(3),
    "totalHeures" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "StatutPointage" NOT NULL DEFAULT 'PRESENT',
    "retardMinutes" INTEGER NOT NULL DEFAULT 0,
    "heuresSupp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observations" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pointage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empreinte" (
    "id" TEXT NOT NULL,
    "templateData" TEXT NOT NULL,
    "doigt" INTEGER NOT NULL,
    "qualite" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "enrolledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Empreinte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmpreinteLog" (
    "id" TEXT NOT NULL,
    "event" "EmpreinteEvent" NOT NULL,
    "userId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmpreinteLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conge" (
    "id" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "type" "TypeConge" NOT NULL,
    "statut" "StatutConge" NOT NULL DEFAULT 'BROUILLON',
    "motif" TEXT,
    "userId" TEXT NOT NULL,
    "approuveParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JourFerie" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "JourFerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Departement_nom_key" ON "Departement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Pointage_userId_date_key" ON "Pointage"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Empreinte_userId_doigt_key" ON "Empreinte"("userId", "doigt");

-- CreateIndex
CREATE UNIQUE INDEX "JourFerie_date_key" ON "JourFerie"("date");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pointage" ADD CONSTRAINT "Pointage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empreinte" ADD CONSTRAINT "Empreinte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Empreinte" ADD CONSTRAINT "Empreinte_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmpreinteLog" ADD CONSTRAINT "EmpreinteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conge" ADD CONSTRAINT "Conge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conge" ADD CONSTRAINT "Conge_approuveParId_fkey" FOREIGN KEY ("approuveParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
