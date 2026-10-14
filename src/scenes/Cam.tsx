// Webcam-Rahmen, innen transparent. Quelle genau so gross wie die Kamera anlegen, z.B. 640x360.
// Parameter: ?label=REZONDES
import { params, useDecode, useNow } from "../util.ts";

export default function Cam() {
  const label = useDecode(params.get("label") ?? "CAM_01 // REZONDES", 600, 40);
  const now = useNow();
  return (
    <div className="cam">
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      <div className="cam-label">{label}</div>
      <div className="cam-rec"><span className="blink">●</span> REC {new Date(now).toLocaleTimeString("de-DE")}</div>
      <div className="cam-scan" aria-hidden="true" />
    </div>
  );
}
