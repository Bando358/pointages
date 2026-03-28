"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FingerprintProvider } from "@/components/fingerprint/fingerprint-context";
import { PointageFingerprint } from "@/components/pointages/pointage-fingerprint";
import { PointageList } from "@/components/pointages/pointage-list";
import { PointageManager } from "@/components/pointages/pointage-manager";
import { Fingerprint, ClipboardList, Clock, LogOut } from "lucide-react";

interface Props {
  userId: string;
  role: string;
  antenneId: string | null;
  antenneNom: string | null;
  todayPointage: any;
  isManager: boolean;
  isKiosk: boolean;
}

export function PointagePageClient({
  userId, role, antenneId, antenneNom, todayPointage, isManager, isKiosk,
}: Props) {
  const [key, setKey] = useState(0);

  // Kiosk mode: fullscreen fingerprint scanning only
  if (isKiosk) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{antenneNom}</h1>
          <p className="text-muted-foreground">Pointage par empreinte digitale</p>
        </div>
        <FingerprintProvider>
          <PointageFingerprint
            key={key}

            antenneId={antenneId}
            onPointageComplete={() => setKey((k) => k + 1)}
          />
        </FingerprintProvider>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Fermer le kiosk
        </Button>
      </div>
    );
  }

  // Regular user/manager mode
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pointage</h2>
        <p className="text-muted-foreground">
          {antenneNom ? `Antenne : ${antenneNom}` : "Gerez vos presences"}
        </p>
      </div>

      <Tabs defaultValue="biometrique" className="space-y-4">
        <TabsList>
          <TabsTrigger value="biometrique" className="gap-2">
            <Fingerprint className="h-4 w-4" />
            Biometrique
          </TabsTrigger>
          <TabsTrigger value="historique" className="gap-2">
            <Clock className="h-4 w-4" />
            Mon historique
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="cahier" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Cahier de pointage
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="biometrique">
          <FingerprintProvider>
            <PointageFingerprint
              key={key}
  
              antenneId={antenneId}
              onPointageComplete={() => setKey((k) => k + 1)}
            />
          </FingerprintProvider>
        </TabsContent>

        <TabsContent value="historique">
          <PointageList userId={userId} />
        </TabsContent>

        {isManager && (
          <TabsContent value="cahier">
            <PointageManager antenneId={antenneId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
