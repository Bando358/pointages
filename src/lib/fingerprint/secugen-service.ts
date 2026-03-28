import type {
  IFingerprintService,
  FingerprintServiceStatus,
  FingerprintCaptureResult,
  FingerprintMatchResult,
} from "./types";

const SECUGEN_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_SECUGEN_URL ?? "https://localhost:8443")
    : "https://localhost:8443";

const FETCH_TIMEOUT = 5000; // 5 secondes max par requete

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export class SecuGenService implements IFingerprintService {
  private baseUrl: string;

  constructor(url?: string) {
    this.baseUrl = url ?? SECUGEN_URL;
  }

  async verifierDisponibilite(): Promise<FingerprintServiceStatus> {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/SGIFPCapture`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "Timeout=1000&Quality=0&licstr=&templateFormat=ISO&imageWSQRate=0.75",
      });

      if (!res.ok) {
        return { available: true, deviceConnected: false, errorMessage: "Service actif mais lecteur non connecte" };
      }

      const data = await res.json();
      if (data.ErrorCode === 0) {
        return { available: true, deviceConnected: true };
      }

      return {
        available: true,
        deviceConnected: false,
        errorMessage: `Code erreur: ${data.ErrorCode}`,
      };
    } catch {
      return {
        available: false,
        deviceConnected: false,
        errorMessage: "Service SecuGen WebAPI non accessible. Verifiez que le service est demarre.",
      };
    }
  }

  async capturer(): Promise<FingerprintCaptureResult> {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/SGIFPCapture`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75",
      }, 15000); // 15s pour laisser le temps de poser le doigt

      const data = await res.json();

      if (data.ErrorCode !== 0) {
        return {
          success: false,
          errorCode: data.ErrorCode,
          errorMessage: this.getErrorMessage(data.ErrorCode),
        };
      }

      return {
        success: true,
        templateBase64: data.TemplateBase64,
        imageDataUrl: `data:image/bmp;base64,${data.BMPBase64}`,
        quality: data.ImageQuality,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: err?.name === "AbortError"
          ? "Timeout - le lecteur n'a pas repondu"
          : "Erreur lors de la capture. Verifiez le lecteur.",
      };
    }
  }

  async comparer(template1: string, template2: string): Promise<FingerprintMatchResult> {
    try {
      console.log("[SecuGen] Comparaison via /SGIMatchScore...");

      const res = await fetchWithTimeout(`${this.baseUrl}/SGIMatchScore`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `template1=${encodeURIComponent(template1)}&template2=${encodeURIComponent(template2)}&licstr=&templateFormat=ISO`,
      });

      const data = await res.json();
      console.log("[SecuGen] Resultat match:", JSON.stringify(data));

      if (data.ErrorCode !== undefined && data.ErrorCode !== 0) {
        return { isMatch: false, score: 0, errorMessage: this.getErrorMessage(data.ErrorCode) };
      }

      const score = data.MatchingScore ?? 0;
      return { isMatch: score >= 100, score };
    } catch (err: any) {
      const msg = err?.name === "AbortError"
        ? "Timeout comparaison SecuGen (5s)"
        : `Erreur comparaison: ${err?.message ?? "inconnue"}`;
      console.error("[SecuGen]", msg);
      return { isMatch: false, score: 0, errorMessage: msg };
    }
  }

  private getErrorMessage(code: number): string {
    const messages: Record<number, string> = {
      51: "Timeout - Placez votre doigt sur le lecteur",
      52: "Lecteur non connecte ou occupe",
      53: "Capture annulee",
      54: "Aucun lecteur detecte",
      55: "Erreur de pilote",
      57: "Qualite insuffisante",
    };
    return messages[code] ?? `Erreur inconnue (code: ${code})`;
  }
}
