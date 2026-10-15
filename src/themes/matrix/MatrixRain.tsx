// Matrix-Regen auf einem Canvas, füllt sein Elternelement (Vollbild-Szenen, Alerts).
// size = Zeichengrösse in px, opacity = Deckkraft; Farben, Schrift, Zeichensatz, Dichte, Tempo und Bildrate
// kommen aus den Einstellungen.
import { useEffect, useRef } from "react";
import { glyph } from "../../core/glyphs.ts";
import { useMatrix } from "./useMatrix.ts";

type Drop = { y: number; speed: number; length: number; cells: string[] };

export default function MatrixRain({ size, opacity }: { size: number; opacity: number }) {
  const { accent, dim, font, glyphs, rainDensity, rainSpeed, rainFps } = useMatrix();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const context = canvas.getContext("2d")!;
    let rows = 0;
    // null = Spalte ohne Regen (Dichte unter 100 %)
    let drops: (Drop | null)[] = [];

    // Startet oberhalb des Bildes, darum setzt der Regen nach und nach ein
    const newDrop = (spread = 1): Drop => ({
      y: -Math.random() * rows * spread,
      speed: (0.5 + Math.random() * 0.6) * rainSpeed,
      length: 8 + ((Math.random() * 22) | 0),
      cells: [],
    });

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      rows = Math.ceil(canvas.height / size);
      drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => (Math.random() * 100 < rainDensity ? newDrop() : null));
    };

    const frame = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.font = `${size}px "${font}", monospace`;
      drops.forEach((drop, column) => {
        if (!drop) return;
        const head = Math.floor(drop.y);
        drop.y += drop.speed;
        if (Math.floor(drop.y) !== head) drop.cells[Math.floor(drop.y)] = glyph(glyphs);
        if (Math.random() < 0.05 && head >= 0) drop.cells[head - ((Math.random() * drop.length) | 0)] = glyph(glyphs);
        for (let tail = 0; tail < drop.length; tail++) {
          const row = head - tail;
          if (row < 0 || row >= rows || !drop.cells[row]) continue;
          context.globalAlpha = 1 - tail / drop.length;
          context.fillStyle = tail === 0 ? accent : dim;
          context.fillText(drop.cells[row], column * size, (row + 1) * size);
        }
        if (head - drop.length > rows) drops[column] = newDrop(0.5);
      });
      context.globalAlpha = 1;
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const timer = setInterval(frame, 1000 / rainFps);
    return () => { observer.disconnect(); clearInterval(timer); };
  }, [size, accent, dim, font, glyphs, rainDensity, rainSpeed, rainFps]);

  return <canvas ref={ref} className="rain" style={{ opacity }} aria-hidden="true" />;
}
