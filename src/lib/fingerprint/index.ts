import type { IFingerprintService } from "./types";
import { SecuGenService } from "./secugen-service";
import { MockFingerprintService } from "./mock-service";

export type { IFingerprintService } from "./types";
export type {
  FingerprintServiceStatus,
  FingerprintCaptureResult,
  FingerprintMatchResult,
  IdentificationCandidate,
} from "./types";

let serviceInstance: IFingerprintService | null = null;

export function getFingerprintService(): IFingerprintService {
  if (!serviceInstance) {
    const useMock = process.env.NEXT_PUBLIC_FINGERPRINT_MOCK === "true";
    serviceInstance = useMock ? new MockFingerprintService() : new SecuGenService();
  }
  return serviceInstance;
}
