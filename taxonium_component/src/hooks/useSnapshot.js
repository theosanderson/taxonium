import { useCallback } from "react";

const useSnapshot = (deckRef) => {
  const snapshot = useCallback(() => {
    let canvas = deckRef.current.deck.canvas;
    deckRef.current.deck.redraw(true);
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
