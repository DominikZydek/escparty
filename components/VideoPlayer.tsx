"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Player } from "@remotion/player";
import YouTube from "react-youtube";
import { EurovisionPostcard } from "../remotion/EurovisionPostcard";
import { FlagParade } from "../remotion/FlagParade";
import { VoteScreen } from "../remotion/VoteScreen";
import { Entry } from "@prisma/client";
import { Maximize2, Minimize2, ChevronLeft, ChevronRight } from "lucide-react";
import { playTheme, stopTheme } from "@/lib/audio";
import { getCountryCode } from "@/lib/countries";

interface VideoPlayerProps {
  entry?: Entry;
  isFlagParade?: boolean;
  entries?: Entry[];
  contestName?: string;
  onNext?: () => void;
  onPrev?: () => void;
}

type PlayerPhase = "parade" | "postcard" | "video" | "vote";

const extractYouTubeId = (url: string) => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
  );
  return match ? match[1] : null;
};

const VideoPlayer = React.memo(
  ({
    entry,
    isFlagParade = false,
    entries = [],
    contestName = "Grand Final",
    onNext,
    onPrev,
  }: VideoPlayerProps) => {
    const [phase, setPhase] = useState<PlayerPhase>(
      isFlagParade ? "parade" : "postcard",
    );
    const [isFullScreen, setIsFullScreen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const FPS = 30;
    const POSTCARD_FRAMES = 900;
    const VOTE_FRAMES = 300;
    const PARADE_FRAMES = 30 * 180;

    useEffect(() => {
      const handleFullscreenChange = () =>
        setIsFullScreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () =>
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
    }, []);

    useEffect(() => {
      setPhase(isFlagParade ? "parade" : "postcard");
    }, [entry?.id, isFlagParade]);

    useEffect(() => {
      if (phase === "postcard") {
        const timer = setTimeout(
          () => {
            setPhase("video");
          },
          (POSTCARD_FRAMES / FPS) * 1000,
        );
        return () => clearTimeout(timer);
      }
    }, [phase]);

    useEffect(() => {
      if (phase === "postcard") {
        playTheme("/sounds/esc_postcard.mp3", false, 0.6);
      } else {
        stopTheme(false);
      }
      return () => stopTheme(false);
    }, [phase]);

    const toggleFullScreen = useCallback(async () => {
      try {
        if (!document.fullscreenElement && containerRef.current) {
          await containerRef.current.requestFullscreen();
        } else if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.error("Full screen error:", err);
      }
    }, []);

    const finalImages = useMemo(() => {
      if (!entry) return ["/fallback-postcard.jpg"];
      return entry.imageUrls && entry.imageUrls.length > 0
        ? entry.imageUrls
        : ["/fallback-postcard.jpg"];
    }, [entry]);

    const paradeEntries = useMemo(() => {
      if (!isFlagParade) return [];
      return entries.map((e) => ({
        country: e.country,
        countryCode: getCountryCode(e.country) || "pl",
        images:
          e.imageUrls && e.imageUrls.length > 0
            ? e.imageUrls
            : ["/fallback-postcard.jpg"],
      }));
    }, [isFlagParade, entries]);

    const videoId = entry?.videoUrl ? extractYouTubeId(entry.videoUrl) : null;
    const controlButtonClass =
      "bg-black/50 hover:bg-black/80 p-3 rounded-full text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10 flex items-center justify-center";

    return (
      <div
        ref={containerRef}
        className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group"
      >
        <div className="absolute top-4 right-4 z-110 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onPrev && (
            <button
              onClick={onPrev}
              className={controlButtonClass}
              title="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className={controlButtonClass}
              title="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}
          <div className="w-px h-8 bg-white/20 mx-1"></div>
          <button
            onClick={toggleFullScreen}
            className={controlButtonClass}
            title="Full screen"
          >
            {isFullScreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
          </button>
        </div>

        <div className="w-full h-full flex items-center justify-center">
          {phase === "parade" && (
            <Player
              component={FlagParade}
              inputProps={{ contestName, entries: paradeEntries }}
              durationInFrames={PARADE_FRAMES}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={FPS}
              autoPlay
              style={{ width: "100%", height: "100%" }}
            />
          )}

          {phase === "postcard" && entry && (
            <>
              <Player
                component={EurovisionPostcard}
                inputProps={{
                  artistName: entry.artist,
                  songTitle: entry.songTitle,
                  country: entry.country,
                  images: finalImages,
                }}
                durationInFrames={POSTCARD_FRAMES}
                compositionWidth={1920}
                compositionHeight={1080}
                fps={FPS}
                autoPlay
                style={{ width: "100%", height: "100%" }}
              />
              <button
                onClick={() => setPhase("video")}
                className="absolute bottom-6 right-6 z-110 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all backdrop-blur-md border border-white/20 opacity-0 group-hover:opacity-100"
              >
                Skip Postcard
              </button>
            </>
          )}

          {phase === "video" && videoId && (
            <YouTube
              videoId={videoId}
              opts={{
                width: "100%",
                height: "100%",
                playerVars: {
                  autoplay: 1,
                  rel: 0,
                  modestbranding: 1,
                },
              }}
              onEnd={() => setPhase("vote")}
              className="w-full h-full"
              iframeClassName="w-full h-full border-none"
            />
          )}

          {phase === "vote" && entry && (
            <Player
              component={VoteScreen}
              inputProps={{
                country: entry.country,
                image: finalImages[0],
              }}
              durationInFrames={VOTE_FRAMES}
              compositionWidth={1920}
              compositionHeight={1080}
              fps={FPS}
              autoPlay
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.isFlagParade !== nextProps.isFlagParade) return false;
    if (prevProps.isFlagParade && nextProps.isFlagParade) return true;
    return prevProps.entry?.id === nextProps.entry?.id;
  },
);

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
