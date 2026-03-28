export interface FingerprintServiceStatus {
  available: boolean;
  deviceConnected: boolean;
  errorMessage?: string;
}

export interface FingerprintCaptureResult {
  success: boolean;
  templateBase64?: string;
  imageDataUrl?: string;
  quality?: number;
  errorCode?: number;
  errorMessage?: string;
}

export interface FingerprintMatchResult {
  isMatch: boolean;
  score: number;
  errorMessage?: string;
}

export interface IFingerprintService {
  verifierDisponibilite(): Promise<FingerprintServiceStatus>;
  capturer(): Promise<FingerprintCaptureResult>;
  comparer(template1: string, template2: string): Promise<FingerprintMatchResult>;
}

export interface IdentificationCandidate {
  userId: string;
  nom: string;
  prenom: string;
  doigt: number;
  templateBase64: string;
}
