"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { Entry } from "@prisma/client";
import Button from "@/components/Button";
import { playEntry, startVoting } from "@/app/actions/room";

interface HostWatchingScreenProps {
  roomCode: string;
  entries: Entry[];
  initialEntryId: string | null;
}

export default function HostWatchingScreen({
  roomCode,
  entries,
  initialEntryId,
}: HostWatchingScreenProps) {
  const router = useRouter();
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(initialEntryId);
  const [isStartingVoting, setIsStartingVoting] = useState(false);

  const currentEntry = entries.find((e) => e.id === currentEntryId);

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

  const handlePlay = async (entryId: string) => {
    try {
      await playEntry(roomCode, entryId);
    } catch (error) {
      console.error("Failed to play video:", error);
    }
  };

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
          <h1 className="text-4xl font-bold">Live Show</h1>
          <div className="text-white/50 bg-white/10 px-4 py-2 rounded-lg font-mono text-sm">
            Room: {roomCode}
          </div>
        </div>

        <div className="w-full aspect-video bg-black/80 rounded-2xl border border-white/20 overflow-hidden shadow-2xl relative flex items-center justify-center">
          {currentEntry && currentEntry.videoUrl ? (
            <iframe
              className="w-full h-full"
              src={`${currentEntry.videoUrl}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="text-center animate-pulse">
              <p className="text-2xl font-bold text-white/50 mb-2">Eurovision Stage is Ready</p>
              <p className="text-white/30">Select a performance from the list to begin...</p>
            </div>
          )}
        </div>

        {currentEntry && (
          <div className="bg-white/10 p-6 rounded-2xl border border-white/10 mt-2">
            <h2 className="text-3xl font-black">{currentEntry.country}</h2>
            <p className="text-xl opacity-80 mt-1">{currentEntry.artist} - "{currentEntry.songTitle}"</p>
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 flex flex-col gap-4">
        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 flex-1 flex flex-col max-h-[75vh]">
          <h3 className="text-xl font-bold mb-4 uppercase tracking-wider text-white/50">
            Setlist
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {entries.map((entry) => {
              const isPlaying = currentEntryId === entry.id;
              return (
                <div 
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isPlaying 
                      ? 'bg-purple-600/30 border-purple-500' 
                      : 'bg-black/40 border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col truncate pr-4">
                    <span className="font-bold truncate">{entry.country}</span>
                    <span className="text-xs opacity-60 truncate">{entry.artist}</span>
                  </div>
                  
                  <button
                    onClick={() => handlePlay(entry.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      isPlaying 
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {isPlaying ? 'PLAYING' : 'PLAY'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto">
          <Button 
            onClick={handleStartVoting} 
            disabled={isStartingVoting}
          >
            {isStartingVoting ? "Preparing Ballots..." : "Start Voting Phase"}
          </Button>
        </div>
      </div>

    </div>
  );
}