"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { initBackgroundMusic, toggleBackgroundMusic } from "@/lib/audio";

export default function AudioToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );
    setIsMobile(checkMobile);

    if (!checkMobile) {
      initBackgroundMusic("/sounds/esc_theme.mp3", 0.15);
    }
  }, []);

  if (isMobile) return null;

  const handleToggle = () => {
    const currentlyPlaying = toggleBackgroundMusic();
    setIsPlaying(currentlyPlaying);
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-6 right-6 z-50 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white shadow-xl transition-all hover:scale-110 active:scale-95 group"
      title="Toggle Background Music"
    >
      {isPlaying ? (
        <Volume2 size={24} className="animate-pulse text-pink-400" />
      ) : (
        <VolumeX size={24} className="opacity-70 group-hover:opacity-100" />
      )}
    </button>
  );
}