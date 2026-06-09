import { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
}

const DURATION = 1400;
const COUNT_PER_SOURCE = 40;
const TOTAL = COUNT_PER_SOURCE * 2;
const FADE_START = (DURATION - 300) / 1000;

const COLORS = [
  '#22c55e',
  '#4ade80',
  '#16a34a',
  '#f5f5f5',
  '#86efac',
  '#a3e635',
  '#bbf7d0',
];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const completionTimerRef = useRef<number>(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const px = new Float32Array(TOTAL);
    const py = new Float32Array(TOTAL);
    const pvx = new Float32Array(TOTAL);
    const pvy = new Float32Array(TOTAL);
    const pgrav = new Float32Array(TOTAL);
    const phw = new Float32Array(TOTAL);
    const phh = new Float32Array(TOTAL);
    const prot = new Float32Array(TOTAL);
    const protspd = new Float32Array(TOTAL);
    const popacity = new Float32Array(TOTAL);
    const pdrag = new Float32Array(TOTAL);
    const pcolor: string[] = new Array(TOTAL);

    const targetX = width / 2;
    const targetY = height * 0.35;
    const sources = [{ x: -10, y: -10 }, { x: width + 10, y: -10 }];

    let idx = 0;
    for (const source of sources) {
      for (let i = 0; i < COUNT_PER_SOURCE; i += 1) {
        const startX = source.x + (Math.random() - 0.5) * 60;
        const startY = source.y + Math.random() * 25;
        const aimX = targetX + (Math.random() - 0.5) * width * 0.8;
        const aimY = targetY + (Math.random() - 0.5) * height * 0.35;
        const dx = aimX - startX;
        const dy = aimY - startY;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const speed = 550 + Math.random() * 450;
        const size = 3.5 + Math.random() * 5.5;
        const aspectRatio = 0.4 + Math.random() * 0.6;

        px[idx] = startX;
        py[idx] = startY;
        pvx[idx] = (dx / dist) * speed;
        pvy[idx] = (dy / dist) * speed * 0.45;
        pgrav[idx] = 380 + Math.random() * 250;
        phw[idx] = size / 2;
        phh[idx] = (size * aspectRatio) / 2;
        prot[idx] = Math.random() * Math.PI * 2;
        protspd[idx] = (Math.random() - 0.5) * 16;
        popacity[idx] = 0.8 + Math.random() * 0.2;
        pdrag[idx] = 0.965 + Math.random() * 0.025;
        pcolor[idx] = COLORS[Math.floor(Math.random() * COLORS.length)];
        idx += 1;
      }
    }

    const startTime = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed > DURATION) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      const t = elapsed / 1000;

      for (let i = 0; i < TOTAL; i += 1) {
        const df = Math.pow(pdrag[i], t * 60);
        const x = px[i] + pvx[i] * t * df;
        const y = py[i] + pvy[i] * t * df + 0.5 * pgrav[i] * t * t;
        if (y > height + 30) continue;

        let alpha = popacity[i];
        if (t > FADE_START) {
          alpha *= Math.max(0, 1 - (t - FADE_START) / 0.3);
        }
        if (alpha <= 0) continue;

        const rotation = prot[i] + protspd[i] * t;
        const scaleX = Math.abs(Math.cos(rotation * 1.5));
        const halfWidth = phw[i] * Math.max(0.2, scaleX);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = pcolor[i];
        ctx.fillRect(-halfWidth, -phh[i], halfWidth * 2, phh[i] * 2);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      rafRef.current = window.requestAnimationFrame(frame);
    };

    rafRef.current = window.requestAnimationFrame(frame);
    completionTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current?.();
    }, DURATION);

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      window.clearTimeout(completionTimerRef.current);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
