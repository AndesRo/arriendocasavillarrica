import { useEffect, useRef } from 'react';
import type { property } from '../data/property';

type WaterConfig = (typeof property)['images']['heroWater'];

interface Props {
    src: string;
    /** Mismo valor que `object-position` de la foto (ej: 'center', '30% 50%'). */
    position: string;
    water: WaterConfig;
}

const KEYWORDS: Record<string, number> = { left: 0, top: 0, center: 0.5, right: 1, bottom: 1 };

/** Convierte un `object-position` en fracciones [x, y] (0 a 1). */
function parsePosition(pos: string): [number, number] {
    const val = (t: string) => {
        if (t.endsWith('%')) {
            const n = parseFloat(t) / 100;
            return Number.isFinite(n) ? n : 0.5;
        }
        return t in KEYWORDS ? KEYWORDS[t] : 0.5;
    };
    const toks = pos.trim().split(/\s+/).filter(Boolean);
    if (toks.length === 0) return [0.5, 0.5];
    if (toks.length === 1) {
        const t = toks[0];
        return t === 'top' || t === 'bottom' ? [0.5, val(t)] : [val(t), 0.5];
    }
    let [a, b] = toks;
    if (a === 'top' || a === 'bottom' || b === 'left' || b === 'right') [a, b] = [b, a];
    return [val(a), val(b)];
}

const smooth = (edge0: number, edge1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};
const frac = (n: number) => n - Math.floor(n);

const STEP = 3; // alto de cada franja, en píxeles del canvas
const FRAME_MS = 1000 / 30; // ~30 fps

/**
 * Hace que el agua de la foto se mueva: franjas horizontales que ondulan suavemente + destellos de sol.
 * Dibuja la MISMA foto (mismo recorte que `object-cover`) sobre un canvas y solo redibuja la franja del agua.
 * Se pausa fuera de pantalla y con la pestaña oculta; no se activa con `prefers-reduced-motion`.
 */
export default function HeroWater({ src, position, water }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas?.parentElement;
        if (!canvas || !parent || !water.enabled) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.decoding = 'async';
        let alive = true;
        let ready = false;
        let inView = true;
        let raf = 0;
        let last = 0;

        // Geometría en píxeles del canvas (se recalcula al cambiar el tamaño)
        let dpr = 1;
        let scale = 1;
        let ox = 0;
        let oy = 0;
        let bx0 = 0;
        let by0 = 0;
        let bx1 = 0;
        let by1 = 0;
        let blocked: [number, number, number, number][] = [];

        const layout = () => {
            const w = parent.clientWidth;
            const h = parent.clientHeight;
            if (!w || !h || !img.naturalWidth) return false;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            const W = canvas.width;
            const H = canvas.height;
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;
            scale = Math.max(W / iw, H / ih); // object-fit: cover
            const dw = iw * scale;
            const dh = ih * scale;
            const [px, py] = parsePosition(position);
            ox = (W - dw) * px;
            oy = (H - dh) * py;

            const [a0, a1, a2, a3] = water.area;
            bx0 = Math.max(0, Math.round(ox + a0 * dw));
            by0 = Math.max(0, Math.round(oy + a1 * dh));
            bx1 = Math.min(W, Math.round(ox + a2 * dw));
            by1 = Math.min(H, Math.round(oy + a3 * dh));
            blocked = water.exclude.map(([x0, y0, x1, y1]) => [
                ox + x0 * dw,
                oy + y0 * dh,
                ox + x1 * dw,
                oy + y1 * dh,
            ]);

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, ox, oy, dw, dh); // foto base (igual que object-cover)
            return true;
        };

        /** Dibuja un rectángulo de la foto (coords. del canvas) sobre sí mismo, con desplazamiento horizontal dx. */
        const blit = (x: number, y: number, w: number, h: number, dx: number) => {
            ctx.drawImage(img, (x + dx - ox) / scale, (y - oy) / scale, w / scale, h / scale, x, y, w, h);
        };

        const draw = (t: number) => {
            const bw = bx1 - bx0;
            const bh = by1 - by0;
            if (bw < 8 || bh < 8) return;

            blit(bx0, by0, bw, bh, 0); // restaura la franja (borra destellos y cuadros anteriores)

            const amp = water.strength * 2.1 * dpr; // desplazamiento máx. ≈ 2 px
            const margin = Math.ceil(amp) + 1; // evita tomar píxeles de postes/borde al desplazar

            for (let y = by0; y < by1; y += STEP) {
                const h = Math.min(STEP, by1 - y);
                const u = (y - by0) / bh; // 0 arriba (lejos) → 1 abajo (cerca)
                const env = smooth(0, 0.2, u) * smooth(0, 0.14, 1 - u);
                if (env < 0.02) continue;
                const yc = y / dpr;
                const wave = Math.sin(yc * 0.46 + t * 1.5) * 0.6 + Math.sin(yc * 0.17 - t * 0.9 + 1.7) * 0.4;
                const dx = wave * amp * env * (0.45 + 0.55 * u);

                // Tramos libres de la fila (sin postes ni objetos)
                const cuts = blocked
                    .filter(([, ey0, , ey1]) => ey1 > y && ey0 < y + h)
                    .map(([ex0, , ex1]) => [ex0, ex1] as [number, number])
                    .sort((a, b) => a[0] - b[0]);
                let cursor = bx0;
                const spans: [number, number][] = [];
                for (const [c0, c1] of cuts) {
                    if (c0 > cursor) spans.push([cursor, Math.min(c0, bx1)]);
                    cursor = Math.max(cursor, c1);
                }
                if (cursor < bx1) spans.push([cursor, bx1]);

                for (const [s0, s1] of spans) {
                    const a = Math.round(s0 + margin);
                    const b = Math.round(s1 - margin);
                    if (b - a > 6) blit(a, y, b - a, h, dx);
                }
            }

            // Destellos de sol
            const glints = Math.round(14 + (bw * bh) / (160 * 160 * dpr * dpr));
            for (let i = 0; i < Math.min(glints, 60); i++) {
                const r1 = frac(Math.sin(i * 12.9898) * 43758.5453);
                const r2 = frac(Math.sin(i * 78.233) * 12345.6789);
                const r3 = frac(Math.sin(i * 39.346) * 9871.123);
                const gx = bx0 + r1 * bw;
                const u = 0.12 + 0.8 * r2;
                const gy = by0 + u * bh;
                if (blocked.some(([ex0, ey0, ex1, ey1]) => gx > ex0 - 12 && gx < ex1 + 12 && gy > ey0 && gy < ey1)) continue;
                const tw = Math.max(0, Math.sin(t * (0.7 + r3 * 0.9) + i * 3.1));
                const alpha = Math.pow(tw, 6) * 0.5 * water.strength;
                if (alpha < 0.03) continue;
                const gw = (5 + r3 * 12) * dpr * (0.5 + 0.5 * u);
                ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.ellipse(gx, gy, gw, 0.8 * dpr, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const loop = (now: number) => {
            raf = 0;
            if (!alive || !ready || !inView || document.hidden) return;
            if (now - last >= FRAME_MS) {
                last = now;
                draw(now / 1000);
            }
            raf = requestAnimationFrame(loop);
        };
        const start = () => {
            if (!raf && ready && inView && !document.hidden) raf = requestAnimationFrame(loop);
        };

        img.onload = () => {
            if (!alive || !layout()) return;
            ready = true;
            draw(0);
            canvas.style.opacity = '1';
            start();
        };
        img.onerror = () => {
            ready = false; // si la foto no existe, no se hace nada (queda el placeholder)
        };
        img.src = src;

        const ro = new ResizeObserver(() => {
            if (!ready) return;
            layout();
            draw(performance.now() / 1000);
        });
        ro.observe(parent);

        const io = new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            if (inView) start();
        });
        io.observe(parent);

        const onVisibility = () => start();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            alive = false;
            if (raf) cancelAnimationFrame(raf);
            img.onload = null;
            img.onerror = null;
            ro.disconnect();
            io.disconnect();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [src, position, water]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
        />
    );
}