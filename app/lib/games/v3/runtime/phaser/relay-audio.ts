/**
 * Relay Sprint — Web Audio sound synthesis
 * Zero external assets. All sounds generated procedurally.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.15,
  rampDown = true,
) {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  gain.gain.setValueAtTime(volume, ac.currentTime);
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  }
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration);
}

function playNoise(duration: number, volume = 0.06) {
  const ac = getCtx();
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const src = ac.createBufferSource();
  const gain = ac.createGain();
  src.buffer = buffer;
  gain.gain.setValueAtTime(volume, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
  src.connect(gain).connect(ac.destination);
  src.start(ac.currentTime);
}

/** Satisfying catch — bright ascending arpeggio */
export function sfxCorrect() {
  playTone(523, 0.12, "sine", 0.12);       // C5
  setTimeout(() => playTone(659, 0.12, "sine", 0.10), 60);  // E5
  setTimeout(() => playTone(784, 0.18, "sine", 0.08), 120);  // G5
}

/** Wrong answer — low buzzy thud */
export function sfxWrong() {
  playTone(120, 0.25, "sawtooth", 0.08);
  playNoise(0.15, 0.04);
}

/** Word starts falling — subtle whoosh */
export function sfxDrop() {
  const ac = getCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ac.currentTime + 0.3);
  gain.gain.setValueAtTime(0.04, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
  osc.connect(gain).connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + 0.3);
}

/** Combo milestone chime — escalating pitch based on streak */
export function sfxCombo(streak: number) {
  const baseFreq = 600 + streak * 40;
  playTone(baseFreq, 0.1, "sine", 0.10);
  setTimeout(() => playTone(baseFreq * 1.25, 0.1, "sine", 0.08), 80);
  setTimeout(() => playTone(baseFreq * 1.5, 0.2, "sine", 0.06), 160);
}

/** Countdown tick */
export function sfxTick() {
  playTone(880, 0.08, "square", 0.06);
}

/** Countdown GO */
export function sfxGo() {
  playTone(880, 0.12, "sine", 0.12);
  setTimeout(() => playTone(1175, 0.2, "sine", 0.10), 80);
}

/** Game over — descending tones */
export function sfxGameOver() {
  playTone(440, 0.2, "sine", 0.10);
  setTimeout(() => playTone(349, 0.2, "sine", 0.08), 200);
  setTimeout(() => playTone(262, 0.4, "sine", 0.06), 400);
}

/** Results score tick */
export function sfxScoreTick() {
  playTone(1200 + Math.random() * 200, 0.04, "sine", 0.05);
}

/** Star earned */
export function sfxStar() {
  playTone(1047, 0.08, "sine", 0.10);
  setTimeout(() => playTone(1319, 0.12, "sine", 0.08), 60);
  setTimeout(() => playTone(1568, 0.18, "triangle", 0.06), 120);
}

/** Timeout — word crashes through */
export function sfxTimeout() {
  playNoise(0.3, 0.06);
  playTone(200, 0.3, "sawtooth", 0.05);
}
