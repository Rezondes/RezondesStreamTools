// Hook: Cover-Adresse eines Titels; lädt das Bild nicht (onError), ist src null, bis ein anderes Cover kommt.
import { useEffect, useState } from "react";

export function useCover(url: string | null) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  return { src: url && !broken ? url : null, onError: () => setBroken(true) };
}
