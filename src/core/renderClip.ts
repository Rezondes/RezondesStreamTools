// Ein renderbarer Clip eines Themes (Stinger, Profil- oder Offline-Banner) für den Render-Bereich im Dashboard.
// draw ist eine reine Funktion der Zeit; group nennt die Einstellungsgruppe des Schemas, die den Clip steuert.
export type ClipName = "stinger" | "profile" | "offline";

export type RenderClip = {
  name: ClipName;
  feature: "stinger" | "banners";
  width: number;
  height: number;
  fps: number;
  duration: number; // Sekunden
  cut: number | null; // Übergangspunkt in Sekunden, nur beim Stinger
  group: string;
  font: string; // CSS-Schrift zum Vorladen, z.B. '24px "Inter"'
  draw: (context: CanvasRenderingContext2D, time: number) => void;
};
