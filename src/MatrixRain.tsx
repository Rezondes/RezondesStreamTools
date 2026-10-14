import { useEffect, useRef } from "react";
import { glyph } from "./util.ts";

// Matrix-Regen aus dem Portfolio, füllt sein Elternelement. size = Zeichengrösse in px.
export default function MatrixRain({ size = 18, className = "rain" }: { size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let rows = 0;
    type Drop = { y: number; speed: number; length: number; cells: string[] };
    let drops: Drop[] = [];

    // Startet oberhalb des Bildes, darum setzt der Regen nach und nach ein
    const newDrop = (spread = 1): Drop => ({
      y: -Math.random() * rows * spread,
      speed: 0.5 + Math.random() * 0.6,
      length: 8 + ((Math.random() * 22) | 0),
      cells: [],
    });

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      rows = Math.ceil(canvas.height / size);
      drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => newDrop());
    };

    const frame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px "Share Tech Mono", monospace`;
      drops.forEach((d, col) => {
        const head = Math.floor(d.y);
        d.y += d.speed;
        if (Math.floor(d.y) !== head) d.cells[Math.floor(d.y)] = glyph();
        if (Math.random() < 0.05 && head >= 0) d.cells[head - ((Math.random() * d.length) | 0)] = glyph();
        for (let k = 0; k < d.length; k++) {
          const row = head - k;
          if (row < 0 || row >= rows || !d.cells[row]) continue;
          ctx.globalAlpha = 1 - k / d.length;
          ctx.fillStyle = k === 0 ? "#39FF14" : "#1E9E0F";
          ctx.fillText(d.cells[row], col * size, (row + 1) * size);
        }
        if (head - d.length > rows) drops[col] = newDrop(0.5);
      });
      ctx.globalAlpha = 1;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const timer = setInterval(frame, 50);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, [size]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
