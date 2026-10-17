// Hook: cover URL of a track; if the image does not load (onError), src is null until another cover arrives.
import { useEffect, useState } from "react";

export function useCover(url: string | null) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return { src: url && !broken ? url : null, onError: () => setBroken(true) };
}
