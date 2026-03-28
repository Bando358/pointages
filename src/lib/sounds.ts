/**
 * Sons generes par Web Audio API - pas besoin de fichiers audio
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 1.0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors silently
  }
}

function playSequence(notes: Array<{ freq: number; delay: number; duration: number; type?: OscillatorType; volume?: number }>) {
  notes.forEach(({ freq, delay, duration, type, volume }) => {
    setTimeout(() => playTone(freq, duration, type ?? "sine", volume ?? 1.0), delay);
  });
}

/** Son de capture d'empreinte - petit bip court */
export function soundCapture() {
  playTone(880, 0.1, "sine", 1.0);
}

/** Son d'identification reussie - 2 notes montantes */
export function soundIdentified() {
  playSequence([
    { freq: 660, delay: 0, duration: 0.12 },
    { freq: 880, delay: 120, duration: 0.15 },
  ]);
}

/** Son arrivee - melodie joyeuse montante (3 notes) */
export function soundArrivee() {
  playSequence([
    { freq: 523, delay: 0, duration: 0.15 },     // Do
    { freq: 659, delay: 150, duration: 0.15 },    // Mi
    { freq: 784, delay: 300, duration: 0.25 },    // Sol
  ]);
}

/** Son depart - melodie douce descendante (3 notes) */
export function soundDepart() {
  playSequence([
    { freq: 784, delay: 0, duration: 0.15 },      // Sol
    { freq: 659, delay: 150, duration: 0.15 },     // Mi
    { freq: 523, delay: 300, duration: 0.25 },     // Do
  ]);
}

/** Son deja pointe - 2 bips info */
export function soundDejaComplet() {
  playSequence([
    { freq: 440, delay: 0, duration: 0.1, type: "triangle" },
    { freq: 440, delay: 200, duration: 0.1, type: "triangle" },
  ]);
}

/** Son erreur - bip grave */
export function soundError() {
  playSequence([
    { freq: 200, delay: 0, duration: 0.2, type: "sawtooth", volume: 1.0 },
    { freq: 150, delay: 200, duration: 0.3, type: "sawtooth", volume: 1.0 },
  ]);
}

/** Son empreinte non reconnue - bip descendant */
export function soundNotRecognized() {
  playSequence([
    { freq: 400, delay: 0, duration: 0.15, type: "triangle" },
    { freq: 300, delay: 150, duration: 0.2, type: "triangle" },
  ]);
}
