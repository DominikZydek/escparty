"use client";

import { useState, useEffect } from "react";
import { Entry } from "@prisma/client";
import { submitVotes } from "@/app/actions/vote";
import Button from "@/components/Button";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";

const POINTS_AVAILABLE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

interface VotingScreenProps {
  roomCode: string;
  playerId: string;
  entries: Entry[];
}

export default function VotingScreen({ roomCode, playerId, entries }: VotingScreenProps) {
  const router = useRouter();
  
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`room-${roomCode}`);
    channel.bind("show-results", () => router.refresh());
    return () => { pusher.unsubscribe(`room-${roomCode}`); };
  }, [roomCode, router]);

  const handleAllocation = (points: number, entryId: string) => {
    setAllocations(prev => {
        const newAlloc = { ...prev };
        
        if (!entryId) {
            delete newAlloc[points];
            return newAlloc;
        }

        const existingPointValueForEntry = Object.keys(newAlloc).find(
            key => newAlloc[Number(key)] === entryId
        );

        if (existingPointValueForEntry) {
            delete newAlloc[Number(existingPointValueForEntry)];
        }

        newAlloc[points] = entryId;
        
        return newAlloc;
    });
  };

  const handleSubmit = async () => {
    const requiredVotes = Math.min(POINTS_AVAILABLE.length, entries.length);
    const usedPoints = Object.keys(allocations).length;
    
    if (usedPoints < requiredVotes) {
        alert(`You must assign all available points! (${usedPoints}/${requiredVotes})`);
        return;
    }

    setIsSubmitting(true);
    try {
      const votesArray = Object.entries(allocations).map(([points, entryId]) => ({
        entryId,
        points: Number(points),
      }));

      await submitVotes(playerId, votesArray);
      setHasVoted(true);
    } catch (error) {
      alert("Error submitting votes");
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white p-5 text-center">
        <h1 className="text-4xl font-bold mb-4">Votes Sent! 🗳️</h1>
        <p className="text-xl opacity-70">Get ready for the results ceremony.</p>
        <div className="mt-8 animate-pulse">
           <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"/>
        </div>
      </div>
    );
  }

  const usedEntryIds = Object.values(allocations);

  return (
    <div className="min-h-screen flex flex-col p-5 text-white max-w-2xl mx-auto pb-32">
      <h1 className="text-3xl font-bold text-center mb-8">Jury Vote</h1>
      
      <div className="space-y-3">
        {POINTS_AVAILABLE.map((points) => (
          <div key={points} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
            <div className={`
                w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl shrink-0
                ${points === 12 ? 'bg-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.5)]' : 
                  points === 10 ? 'bg-purple-600' : 
                  points === 8 ? 'bg-blue-600' : 'bg-gray-700'}
            `}>
                {points}
            </div>

            <select
                className="flex-1 bg-transparent border-b border-white/30 py-2 outline-none text-lg text-white cursor-pointer"
                value={allocations[points] || ""}
                onChange={(e) => handleAllocation(points, e.target.value)}
            >
                <option value="" className="text-gray-900">Select country...</option>
                {entries.map(entry => {
                    const isUsedElsewhere = usedEntryIds.includes(entry.id) && allocations[points] !== entry.id;
                    
                    return (
                        <option 
                            key={entry.id} 
                            value={entry.id}
                            className={`text-gray-900 font-medium ${isUsedElsewhere ? 'bg-gray-200 text-gray-400' : ''}`}
                        >
                            {entry.country} ({entry.artist})
                        </option>
                    )
                })}
            </select>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-linear-to-t from-black via-black/90 to-transparent p-6 pt-12 flex justify-center">
        <div className="w-full max-w-md">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || Object.keys(allocations).length < Math.min(POINTS_AVAILABLE.length, entries.length)}
          >
            {isSubmitting ? "Sending..." : "Submit Votes"}
          </Button>
        </div>
      </div>
    </div>
  );
}