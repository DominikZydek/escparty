"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Button from "@/components/Button";
import { Player, Avatar } from "@prisma/client";
import { startGame } from "@/app/actions/room";
import { useRouter } from "next/navigation";

type PlayerWithAvatar = Player & { avatar: Avatar | null };

interface LobbyScreenProps {
  roomCode: string;
  initialPlayers: PlayerWithAvatar[];
}

export default function LobbyScreen({
  roomCode,
  initialPlayers,
}: LobbyScreenProps) {
  const [players, setPlayers] = useState<PlayerWithAvatar[]>(initialPlayers);
  const [isStarting, setIsStarting] = useState(false); 

  const router = useRouter();

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("player-joined", (newPlayer: PlayerWithAvatar) => {
      console.log("New player arrived:", newPlayer);

      setPlayers((prev) => {
        if (prev.find((p) => p.id === newPlayer.id)) return prev;
        return [...prev, newPlayer];
      });
    });

    channel.bind("game-started", (data: { redirectUrl: string }) => {
      router.push(data.redirectUrl);
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  const handleStartGame = async () => {
    if (isStarting) return; 
    
    setIsStarting(true);

    try {
      await startGame(roomCode);
    } catch (error) {
      console.error("Failed to start", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-5 text-white max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold drop-shadow-lg">Lobby</h1>
          <p className="text-white/50 text-xl">
            Join at <span className="text-white font-mono">escparty.vercel.app</span>{" "}
            using code:
          </p>
        </div>
        <div className="bg-white/10 px-6 py-3 rounded-xl border border-white/20">
          <span className="text-6xl font-black tracking-widest font-mono select-all">
            {roomCode}
          </span>
        </div>
      </div>

      {/* players grid */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 content-start">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex flex-col items-center animate-in zoom-in duration-300"
          >
            <div className="relative mb-3 group">
              <img
                src={player.avatar?.url || "/placeholder.png"}
                alt={player.name}
                className="w-24 h-24 rounded-full border-4 border-white/20 group-hover:border-white transition-colors shadow-lg object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-gray-900" />
            </div>
            <span className="font-bold text-lg text-center truncate w-full">
              {player.name}
            </span>
          </div>
        ))}

        {players.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
            <p className="text-2xl animate-pulse">Waiting for players...</p>
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t border-white/10 pt-8 flex justify-center">
        <div className="w-full max-w-md">
          <Button 
            disabled={players.length < 1 || isStarting} 
            onClick={handleStartGame}
          >
            {isStarting ? "Starting..." : "Start Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}