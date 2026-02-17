"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Button from "@/components/Button";
import { endVoting } from "@/app/actions/room";
import { useRouter } from "next/navigation";

interface HostVotingDashboardProps {
  roomCode: string;
  totalPlayers: number;
  initialVotesCount: number;
}

export default function HostVotingDashboard({ 
  roomCode, 
  totalPlayers, 
  initialVotesCount 
}: HostVotingDashboardProps) {
  const router = useRouter();
  const [votesCount, setVotesCount] = useState(initialVotesCount);
  const [isEnding, setIsEnding] = useState(false);

  const progress = totalPlayers > 0 ? (votesCount / totalPlayers) * 100 : 0;

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("vote-cast", (data: { playerName: string }) => {
      console.log(`${data.playerName} voted!`);
      setVotesCount((prev) => prev + 1);
    });

    channel.bind("show-results", () => {
       router.refresh();
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  const handleEndVoting = async () => {
    setIsEnding(true);
    try {
      await endVoting(roomCode);
    } catch (error) {
      console.error("Failed to end voting", error);
      setIsEnding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 text-white max-w-4xl mx-auto">
      <h1 className="text-5xl font-bold mb-12 drop-shadow-lg">Voting in Progress...</h1>

      <div className="text-9xl font-black mb-4">
        {votesCount} <span className="text-4xl text-white/50 font-medium">/ {totalPlayers}</span>
      </div>
      <p className="text-xl opacity-70 mb-12 uppercase tracking-widest">Votes Cast</p>

      <div className="w-full h-8 bg-white/10 rounded-full overflow-hidden border border-white/20 mb-16 relative">
        <div 
          className="h-full bg-green-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,197,94,0.6)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="w-full max-w-md">
        <Button 
          onClick={handleEndVoting} 
          disabled={isEnding}
        >
          {isEnding ? "Calculating..." : "Reveal Results 🏆"}
        </Button>
        
        {votesCount < totalPlayers && (
          <p className="text-center mt-4 text-sm opacity-50">
            Note: You can end voting even if not everyone has voted.
          </p>
        )}
      </div>
    </div>
  );
}