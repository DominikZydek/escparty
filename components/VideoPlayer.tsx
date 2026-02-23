"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Player } from "@remotion/player";
import { EurovisionPostcard } from "../remotion/EurovisionPostcard";
import { Entry } from "@prisma/client"; 
import { Maximize2, Minimize2 } from "lucide-react";

interface VideoPlayerProps {
  entry: Entry;
}

const VideoPlayer = React.memo(({ entry }: VideoPlayerProps) => {
  const [showPostcard, setShowPostcard] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const FPS = 30;
  const DURATION_IN_FRAMES = 900;
  const DURATION_MS = (DURATION_IN_FRAMES / FPS) * 1000;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    setShowPostcard(true);
    const timer = setTimeout(() => {
      setShowPostcard(false);
    }, DURATION_MS);
    return () => clearTimeout(timer);
  }, [entry.id]);

  const toggleFullScreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Błąd podczas przełączania trybu pełnoekranowego:", err);
    }
  }, []);

  // fallback
  const finalImages = entry.imageUrls && entry.imageUrls.length > 0 
    ? entry.imageUrls 
    : ["/fallback-postcard.jpg"];

  return (
    <div 
      ref={containerRef}
      className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group" 
    >
      <button
        onClick={toggleFullScreen}
        className="absolute top-4 right-4 z-110 bg-black/50 hover:bg-black/80 p-3 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100"
      >
        {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      <div className="w-full h-full flex items-center justify-center">
        {showPostcard ? (
          <>
            <Player
              component={EurovisionPostcard}
              inputProps={{
                artistName: entry.artist,
                country: entry.country,
                images: finalImages,
              }}
              durationInFrames={DURATION_IN_FRAMES}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={FPS}
              autoPlay={true}
              style={{ width: "100%", height: "100%" }}
            />
            
            <button 
              onClick={() => setShowPostcard(false)}
              className="absolute bottom-6 right-6 z-110 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100"
            >
              Skip Postcard
            </button>
          </>
        ) : (
          <iframe
            key={entry.id}
            style={{ width: '100%', height: '100%', border: 'none' }}
            src={`${entry.videoUrl}?autoplay=1&rel=0&modestbranding=1`}
            title="Live Performance"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          ></iframe>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => prevProps.entry.id === nextProps.entry.id);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;