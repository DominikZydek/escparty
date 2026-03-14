"use client";

import { useState, useEffect, useCallback } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { Entry } from "@prisma/client";
import Button from "@/components/Button";
import { playEntry, startVoting } from "@/app/actions/room";
import VideoPlayer from "./VideoPlayer";
import { pauseBackgroundMusic, playBackgroundMusic } from "@/lib/audio";

interface HostWatchingScreenProps {
  roomCode: string;
  entries: Entry[];
  initialEntryId: string | null;
  contestName: string;
}

export default function HostWatchingScreen({
  roomCode,
  entries,
  initialEntryId,
  contestName,
}: HostWatchingScreenProps) {
  const router = useRouter();
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(
    initialEntryId,
  );
  const [isStartingVoting, setIsStartingVoting] = useState(false);

  const isFlagParadeActive = currentEntryId === "flag-parade";

  const currentEntryIndex = entries.findIndex((e) => e.id === currentEntryId);
  const currentEntry = entries[currentEntryIndex];

  const hasNext =
    currentEntryIndex !== -1 && currentEntryIndex < entries.length - 1;
  const hasPrev = currentEntryIndex > 0;

  useEffect(() => {
    pauseBackgroundMusic();
    return () => {
      playBackgroundMusic();
    };
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("video-changed", (data: { entryId: string | null }) => {
      setCurrentEntryId(data.entryId);
    });

    channel.bind("voting-started", () => {
      router.refresh();
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  const handlePlay = useCallback(
    async (entryId: string) => {
      try {
        await playEntry(roomCode, entryId);
      } catch (error) {
        console.error("Failed to play video/parade:", error);
      }
    },
    [roomCode],
  );

  const handleNext = useCallback(() => {
    if (isFlagParadeActive && entries.length > 0) {
      handlePlay(entries[0].id);
    } else if (hasNext) {
      const nextEntryId = entries[currentEntryIndex + 1].id;
      handlePlay(nextEntryId);
    }
  }, [isFlagParadeActive, entries, hasNext, currentEntryIndex, handlePlay]);

  const handlePrev = useCallback(() => {
    if (hasPrev) {
      const prevEntryId = entries[currentEntryIndex - 1].id;
      handlePlay(prevEntryId);
    }
  }, [hasPrev, entries, currentEntryIndex, handlePlay]);

  const handleStartVoting = async () => {
    setIsStartingVoting(true);
    try {
      await startVoting(roomCode);
    } catch (error) {
      console.error("Failed to start voting:", error);
      setIsStartingVoting(false);
    }
  };

  return (
    <div className="min-h-screen p-5 flex flex-col lg:flex-row gap-6 text-white max-w-7xl mx-auto">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-bold">{contestName}</h1>
          <div className="text-white/50 bg-white/10 px-4 py-2 rounded-lg font-mono text-sm">
            Room: {roomCode}
          </div>
        </div>

        {isFlagParadeActive ? (
          <VideoPlayer
            contestName={contestName}
            isFlagParade={true}
            entries={entries}
            onNext={() => handlePlay(entries[0]?.id)}
          />
        ) : currentEntry && currentEntry.videoUrl ? (
          <VideoPlayer
            entry={currentEntry}
            onNext={hasNext ? handleNext : undefined}
            onPrev={hasPrev ? handlePrev : undefined}
          />
        ) : (
          <div className="w-full aspect-video bg-black/80 flex items-center justify-center rounded-2xl border border-white/10">
            <p className="text-white/50">Select a sequence to play...</p>
          </div>
        )}

        {isFlagParadeActive ? (
          <div className="bg-linear-to-r from-pink-600/20 to-cyan-600/20 p-6 rounded-2xl border border-white/20 mt-2">
            <h2 className="text-3xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-linear-to-r from-pink-400 to-cyan-400">
              Opening Ceremony
            </h2>
            <p className="text-xl opacity-80 mt-1">Flag Parade</p>
          </div>
        ) : (
          currentEntry && (
            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 mt-2">
              <h2 className="text-3xl font-black">{currentEntry.country}</h2>
              <p className="text-xl opacity-80 mt-1">
                {currentEntry.artist} - "{currentEntry.songTitle}"
              </p>
            </div>
          )
        )}
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 flex-1 flex flex-col max-h-[75vh]">
          <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white/50">
            Show Timeline
          </h3>

          <div
            className={`mb-4 flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              isFlagParadeActive
                ? "bg-linear-to-r from-pink-500/20 to-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(33,217,201,0.3)]"
                : "bg-black/40 border-white/20 hover:border-white/40"
            }`}
          >
            <div className="flex flex-col">
              <span className="font-black tracking-widest uppercase text-transparent bg-clip-text bg-linear-to-r from-pink-400 to-cyan-400">
                Flag Parade
              </span>
            </div>
            <button
              onClick={() => handlePlay("flag-parade")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isFlagParadeActive
                  ? "bg-cyan-500 text-white shadow-[0_0_15px_rgba(33,217,201,0.5)]"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {isFlagParadeActive ? "PLAYING" : "PLAY"}
            </button>
          </div>

          <div className="w-full h-px bg-white/10 mb-4" />

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {entries.map((entry) => {
              const isPlaying = currentEntryId === entry.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isPlaying
                      ? "bg-purple-600/30 border-purple-500"
                      : "bg-black/40 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col truncate pr-4">
                    <span className="font-bold truncate">{entry.country}</span>
                    <span className="text-xs opacity-60 truncate">
                      {entry.artist}
                    </span>
                  </div>

                  <button
                    onClick={() => handlePlay(entry.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      isPlaying
                        ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {isPlaying ? "PLAYING" : "PLAY"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto">
          <Button onClick={handleStartVoting} disabled={isStartingVoting}>
            {isStartingVoting ? "Preparing Ballots..." : "Start Voting Phase"}
          </Button>
        </div>
      </div>
    </div>
  );
}
