let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext | null {
  if (ctx && ctx.state !== 'closed') return ctx;
  try {
    ctx = new AudioContext();
  } catch {
    return null;
  }
  return ctx;
}

function ensureResumed(ac: AudioContext): void {
  if (ac.state === 'suspended') {
    void ac.resume();
  }
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  const len = ac.sampleRate * 0.1;
  noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function pop(ac: AudioContext, volume: number, freq: number, decay: number): void {
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = getNoise(ac);
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 14;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = freq * 0.6;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + decay);
  src.connect(bp).connect(hp).connect(gain).connect(ac.destination);
  src.start(now);
  src.stop(now + decay + 0.005);
}

export function soundLight(): void {
  const ac = getCtx();
  if (!ac) return;
  ensureResumed(ac);
  pop(ac, 0.12, 4200, 0.008);
}

export function soundMedium(): void {
  const ac = getCtx();
  if (!ac) return;
  ensureResumed(ac);
  pop(ac, 0.2, 3200, 0.012);
}

export function soundHeavy(): void {
  const ac = getCtx();
  if (!ac) return;
  ensureResumed(ac);
  pop(ac, 0.35, 2000, 0.018);
}

export function soundConfirm(): void {
  const ac = getCtx();
  if (!ac) return;
  ensureResumed(ac);
  const now = ac.currentTime;
  [3600, 4500].forEach((freq, i) => {
    const t = now + i * 0.04;
    const src = ac.createBufferSource();
    src.buffer = getNoise(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 14;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = freq * 0.6;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.012);
    src.connect(bp).connect(hp).connect(gain).connect(ac.destination);
    src.start(t);
    src.stop(t + 0.02);
  });
}

export function soundError(): void {
  const ac = getCtx();
  if (!ac) return;
  ensureResumed(ac);
  const now = ac.currentTime;
  [2600, 2000, 2600].forEach((freq, i) => {
    const t = now + i * 0.045;
    const src = ac.createBufferSource();
    src.buffer = getNoise(ac);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 10;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = freq * 0.6;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    src.connect(bp).connect(gain).connect(ac.destination);
    src.start(t);
    src.stop(t + 0.025);
  });
}
