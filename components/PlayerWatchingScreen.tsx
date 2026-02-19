"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import { Entry } from "@prisma/client";

interface PlayerWatchingScreenProps {
  roomCode: string;
  entries: Entry[];
  initialEntryId: string | null;
}

export default function PlayerWatchingScreen({
  roomCode,
  entries,
  initialEntryId,
}: PlayerWatchingScreenProps) {
  const router = useRouter();
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(initialEntryId);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 text-white max-w-md mx-auto text-center">
      <div className="mb-12 animate-pulse">
        <svg className="w-16 h-16 mx-auto mb-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <h1 className="text-2xl font-bold text-white/80 uppercase tracking-widest">
          Look at the Big Screen!
        </h1>
      </div>

      <div className="w-full relative">
        {currentEntry ? (
          <div className="bg-linear-to-br from-purple-900/40 to-pink-900/40 border border-pink-500/30 p-8 rounded-3xl shadow-[0_0_30px_rgba(236,72,153,0.15)] transform transition-all duration-500 hover:scale-105">
            <p className="text-pink-400 text-sm font-bold uppercase tracking-widest mb-4">
              Now Performing
            </p>
            <h2 className="text-5xl font-black mb-2 drop-shadow-lg">
              {currentEntry.country}
            </h2>
            <p className="text-2xl text-white/90 font-medium">
              {currentEntry.artist}
            </p>
            <p className="text-lg text-white/60 italic mt-2">
              "{currentEntry.songTitle}"
            </p>
            
            <div className="flex justify-center items-end gap-1 h-8 mt-8 opacity-70">
              <div className="w-1 bg-pink-500 animate-[bounce_1s_infinite_0ms]"></div>
              <div className="w-1 bg-purple-500 animate-[bounce_1s_infinite_200ms]"></div>
              <div className="w-1 bg-pink-500 animate-[bounce_1s_infinite_400ms]"></div>
              <div className="w-1 bg-purple-500 animate-[bounce_1s_infinite_100ms]"></div>
              <div className="w-1 bg-pink-500 animate-[bounce_1s_infinite_500ms]"></div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-xl text-white/50">
              Waiting for the Host to start the music...
            </p>
          </div>
        )}
      </div>

      <div className="mt-16 text-sm text-white/30">
        Get ready! Voting will begin after all performances.
      </div>
    </div>
  );
}