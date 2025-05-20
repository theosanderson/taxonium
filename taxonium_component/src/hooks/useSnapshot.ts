import { useCallback } from "react";

const useSnapshot = (deckRef) => {
  const snapshot = useCallback(() => {
    const deck = deckRef.current?.deck;
    if (!deck) return;
    const canvas = deck.canvas;
    deck.redraw(true);
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
