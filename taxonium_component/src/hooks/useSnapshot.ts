import { useCallback } from "react";
import type { DeckGLRef } from "@deck.gl/react";

const useSnapshot = (
  deckRef: React.MutableRefObject<DeckGLRef | null>
): (() => void) => {
  const snapshot = useCallback(() => {
    if (!deckRef.current) {
      return;
    }
    const canvas = (deckRef.current as any).deck.canvas as HTMLCanvasElement;
    (deckRef.current as any).deck.redraw(true as any);
    let a = document.createElement("a");

    a.href = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    a.download = "taxonium.png";
    a.click();
  }, [deckRef]);

  return snapshot;
};

export default useSnapshot;
