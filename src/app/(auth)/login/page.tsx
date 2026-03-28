"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fingerprint, Loader2, User, Monitor } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [kioskLogin, setKioskLogin] = useState("");
  const [kioskPassword, setKioskPassword] = useState("");

  async function handleUserLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("user-login", {
      username,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiant ou mot de passe incorrect");
    } else if (res?.url) {
      window.location.href = res.url;
    } else {
      window.location.href = "/dashboard";
    }
  }

  async function handleKioskLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("kiosk-login", {
      kioskLogin,
      kioskPassword,
      redirect: false,
      callbackUrl: "/pointages",
    });
    setLoading(false);
    if (res?.error) {
      setError("Login antenne ou mot de passe incorrect");
    } else if (res?.url) {
      window.location.href = res.url;
    } else {
      window.location.href = "/pointages";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <Card className="w-full max-w-md mx-4 shadow-xl border-border/60 animate-scale-in relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Fingerprint className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Pointage AIBEF</CardTitle>
          <CardDescription>Systeme de pointage biometrique</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="kiosk">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="user" className="gap-2">
                <User className="h-4 w-4" />
                Utilisateur
              </TabsTrigger>
              <TabsTrigger value="kiosk" className="gap-2">
                <Monitor className="h-4 w-4" />
                Antenne
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kiosk">
              <form onSubmit={handleKioskLogin} className="space-y-4">
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  Mode antenne : les employes pointent par empreinte digitale
                  sur ce poste.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="kiosk-login">Login antenne</Label>
                  <Input
                    id="kiosk-login"
                    value={kioskLogin}
                    onChange={(e) => setKioskLogin(e.target.value)}
                    placeholder="kiosk-abidjan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kiosk-password">Mot de passe</Label>
                  <Input
                    id="kiosk-password"
                    type="password"
                    value={kioskPassword}
                    onChange={(e) => setKioskPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2.5 rounded-lg animate-fade-in">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Ouvrir le kiosk
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="user">
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="votre.identifiant"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 p-2.5 rounded-lg animate-fade-in">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
