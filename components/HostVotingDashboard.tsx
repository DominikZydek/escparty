"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Button from "@/components/Button";
import { endVoting } from "@/app/actions/room";
import { useRouter } from "next/navigation";

interface Entry {
  id: string;
  artist: string;
  songTitle: string;
  country: string;
  videoUrl: string | null;
}

interface HostVotingDashboardProps {
  roomCode: string;
  totalPlayers: number;
  initialVotesCount: number;
  entries: Entry[];
}

export default function HostVotingDashboard({
  roomCode,
  totalPlayers,
  initialVotesCount,
  entries,
}: HostVotingDashboardProps) {
  const router = useRouter();
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [isEnding, setIsEnding] = useState(false);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);

  const progress = totalPlayers > 0 ? (votesCount / totalPlayers) * 100 : 0;

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("vote-cast", () => {
      setVotesCount((prev) => prev + 1);
    });

    channel.bind("show-results", () => {
      router.refresh();
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  useEffect(() => {
    if (!entries || entries.length === 0) return;

    const intervalId = setInterval(() => {
      setCurrentEntryIndex((prev) => (prev + 1) % entries.length);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [entries]);

  const handleEndVoting = async () => {
    setIsEnding(true);
    try {
      await endVoting(roomCode);
    } catch (error) {
      console.error("Failed to end voting", error);
      setIsEnding(false);
    }
  };

  const currentEntry = entries?.[currentEntryIndex];
  const videoUrl = currentEntry?.videoUrl;

  const iframeSrc = videoUrl
    ? `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&mute=0&controls=0&start=45&end=75&modestbranding=1`
    : null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center text-white overflow-hidden bg-black">
      {iframeSrc && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <iframe
            key={videoUrl}
            src={iframeSrc}
            className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
            allow="autoplay"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/40" />
        </div>
      )}

      {currentEntry && (
        <div className="absolute bottom-10 left-10 z-20 bg-black/70 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in w-80">
          <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center animate-pulse shrink-0">
            🎵
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1 flex items-center gap-2">
              <span>
                Recap ({currentEntryIndex + 1}/{entries.length})
              </span>
              <span className="w-1 h-1 bg-white/30 rounded-full"></span>
              <span className="text-white/90 font-bold">
                {currentEntry.country}
              </span>
            </p>
            <p className="text-lg font-bold leading-tight truncate">
              {currentEntry.artist}
            </p>
            <p className="text-sm text-pink-400 font-medium truncate">
              {currentEntry.songTitle}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-20 bg-black/70 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl flex flex-col items-center w-80 animate-fade-in">
        <h2 className="text-lg font-bold mb-3 text-white/90 uppercase tracking-widest text-center">
          Voting Progress
        </h2>

        <div className="text-5xl font-black mb-1 drop-shadow-md">
          {votesCount}{" "}
          <span className="text-2xl text-white/50 font-medium">
            / {totalPlayers}
          </span>
        </div>
        <p className="text-xs opacity-60 mb-6 uppercase tracking-widest">
          Votes Cast
        </p>

        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-6 relative">
          <div
            className="h-full bg-linear-to-r from-pink-500 to-purple-600 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Button
          onClick={handleEndVoting}
          disabled={isEnding}
          className="w-full py-3 text-sm"
        >
          {isEnding ? "Calculating..." : "Reveal Results 🏆"}
        </Button>
      </div>
    </div>
  );
}
