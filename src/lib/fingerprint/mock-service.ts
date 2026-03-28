import type {
  IFingerprintService,
  FingerprintServiceStatus,
  FingerprintCaptureResult,
  FingerprintMatchResult,
} from "./types";

/**
 * Mock service pour tester sans lecteur physique.
 * Utilise un template fixe par "session" pour que l'enrolement
 * et le pointage utilisent le meme template.
 */
export class MockFingerprintService implements IFingerprintService {
  private currentTemplate: string = btoa("mock-fingerprint-default-template");

  async verifierDisponibilite(): Promise<FingerprintServiceStatus> {
    return { available: true, deviceConnected: true };
  }

  async capturer(): Promise<FingerprintCaptureResult> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      success: true,
      templateBase64: this.currentTemplate,
      quality: 85,
      imageDataUrl:
        "data:image/svg+xml;base64," +
        btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#e8f5e9"/><text x="50%" y="45%" text-anchor="middle" font-size="14" fill="#2e7d32">Empreinte</text><text x="50%" y="60%" text-anchor="middle" font-size="11" fill="#666">Mock OK</text></svg>`
        ),
    };
  }

  async comparer(template1: string, template2: string): Promise<FingerprintMatchResult> {
    await new Promise((r) => setTimeout(r, 200));
    // En mode mock, toujours matcher pour permettre le test du flux complet
    return { isMatch: true, score: 200 };
  }
}
