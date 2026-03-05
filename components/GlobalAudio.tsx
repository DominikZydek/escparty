"use client";

import { useEffect } from "react";
import { initBackgroundMusic, unlockAudio } from "@/lib/audio";

export default function GlobalAudio() {
  useEffect(() => {
    initBackgroundMusic("/sounds/esc_theme.mp3");

    const handleFirstInteraction = () => {
      unlockAudio();
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };

    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);
    document.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []);

  return null;
}