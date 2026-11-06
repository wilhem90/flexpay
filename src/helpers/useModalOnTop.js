import { useEffect, useRef } from "react";
import { Platform } from "react-native";

let topZ = 20_000;

// On web every Modal is a fixed layer with the same z-index (9999), so the
// DOM order decides which one wins. Raise the layer each time it opens so it
// always shows above anything else already on screen.
export function useModalOnTop(visible) {
  const ref = useRef(null);

  useEffect(() => {
    if (Platform.OS !== "web" || !visible) return;
    let node = ref.current;
    while (node && node !== document.body) {
      if (node.style && getComputedStyle(node).position === "fixed") {
        node.style.zIndex = String(++topZ);
        return;
      }
      node = node.parentElement;
    }
  }, [visible]);

  return ref;
}
