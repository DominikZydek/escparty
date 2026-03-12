"use client";

import { useState } from "react";
import { getCountryCode } from "@/lib/countries";
import Button from "@/components/Button";
import { saveRunningOrderAndStart } from "@/app/actions/room";
import { useRouter } from "next/navigation";
import { Shuffle, Sparkles } from "lucide-react";
import clsx from "clsx";

interface Entry {
  id: string;
  country: string;
  artist: string;
}

interface HostRunningOrderScreenProps {
  roomCode: string;
  entries: Entry[];
}

export default function HostRunningOrderScreen({ roomCode, entries }: HostRunningOrderScreenProps) {
  const router = useRouter();
  
  const [drawnEntries, setDrawnEntries] = useState<Entry[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const unassignedEntries = entries.filter((e) => !drawnEntries.find((d) => d.id === e.id));
  const isComplete = drawnEntries.length === entries.length;

  const handleDrawNext = () => {
    if (unassignedEntries.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * unassignedEntries.length);
    const selectedEntry = unassignedEntries[randomIndex];
    
    setDrawnEntries((prev) => [...prev, selectedEntry]);
  };

  const handleDrawAllRemaining = () => {
    const remaining = [...unassignedEntries];
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    setDrawnEntries((prev) => [...prev, ...remaining]);
  };

  const handleConfirmAndStart = async () => {
    if (!isComplete) return;
    setIsSaving(true);
    try {
      const orderedIds = drawnEntries.map((e) => e.id);
      await saveRunningOrderAndStart(roomCode, orderedIds);
      router.refresh(); 
    } catch (error) {
      console.error("Failed to save order", error);
      setIsSaving(false);
    }
  };

  const totalSlots = Array.from({ length: entries.length }, (_, i) => i);

  return (
    <div className="min-h-screen flex flex-col p-8 pb-32 bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-pink-900/30 via-black to-purple-900/20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-10 flex-1 z-10">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center border-b border-white/10 pb-6">
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-purple-500 mb-2 drop-shadow-lg">
              Running Order Draw
            </h1>
            <p className="text-white/60 font-mono text-lg">
              {drawnEntries.length} of {entries.length} slots filled
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleDrawAllRemaining}
              disabled={unassignedEntries.length === 0}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-30"
            >
              <Shuffle size={20} /> Draw All Remaining
            </button>
            <button
              onClick={handleDrawNext}
              disabled={isComplete}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl font-black shadow-[0_0_20px_rgba(219,39,119,0.4)] transition-all disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95"
            >
              <Sparkles size={20} />
              DRAW SLOT #{drawnEntries.length + 1}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {totalSlots.map((index) => {
            const entry = drawnEntries[index];
            const isNextToDraw = index === drawnEntries.length;

            return (
              <div
                key={index}
                className={clsx(
                  "relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all h-32",
                  entry 
                    ? "bg-white/10 border-white/20 shadow-xl backdrop-blur-md animate-in zoom-in-50 duration-500"
                    : isNextToDraw
                      ? "bg-pink-500/10 border-pink-500/50 border-dashed animate-pulse"
                      : "bg-black/40 border-white/5 border-dashed"
                )}
              >
                <div className="absolute top-2 left-3 text-xs font-black text-white/30 font-mono">
                  {index + 1}
                </div>
                
                {entry ? (
                  <>
                    <span className={`fi fi-${getCountryCode(entry.country).toLowerCase()} text-4xl mb-2 drop-shadow-md`}></span>
                    <span className="font-bold text-lg truncate w-full text-center drop-shadow">
                      {entry.country}
                    </span>
                  </>
                ) : (
                  <span className={clsx("font-bold", isNextToDraw ? "text-pink-400" : "text-white/10")}>
                    {isNextToDraw ? "Up Next..." : "?"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-linear-to-t from-black via-black/90 to-transparent p-6 pt-12 flex justify-center pointer-events-none z-50">
        <div className="w-full max-w-md pointer-events-auto">
          <Button onClick={handleConfirmAndStart} disabled={!isComplete || isSaving}>
            {isSaving ? "Starting Show..." : isComplete ? "Lock Order & Continue" : "Draw all countries first"}
          </Button>
        </div>
      </div>
    </div>
  );
}