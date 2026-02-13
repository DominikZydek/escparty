"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@prisma/client";
import { joinGame } from "@/app/actions/player";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";

interface PlayerJoinScreenProps {
  roomCode: string;
  avatars: Avatar[];
}

export default function PlayerJoinScreen({ roomCode, avatars }: PlayerJoinScreenProps) {
  const [name, setName] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!hasJoined) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("game-started", (data: { redirectUrl: string }) => {
      console.log("Game started! Redirecting...");
      router.push(data.redirectUrl);
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [hasJoined, roomCode, router]);

  const handleJoin = async () => {
    if (!name || !selectedAvatarId) return;
    
    setIsSubmitting(true);
    try {
      await joinGame(roomCode, name, selectedAvatarId);
      setHasJoined(true);
    } catch (error) {
      alert("Error joining game");
      setIsSubmitting(false);
    }
  };

  // lobby
  if (hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white gap-6 p-5">
        <div className="animate-pulse">
          <img 
            src={avatars.find(a => a.id === selectedAvatarId)?.url} 
            alt="My Avatar" 
            className="w-32 h-32 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          />
        </div>
        <h1 className="text-3xl font-bold">You are in!</h1>
        <p className="text-white/50 text-center">
          Waiting for host to start the game...
        </p>
      </div>
    );
  }

  // join form
  return (
    <div className="min-h-screen flex flex-col p-5 text-white max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">Join Room {roomCode}</h1>
      <p className="text-center text-white/50 mb-8">Choose your persona</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => setSelectedAvatarId(avatar.id)}
            className={`
              relative rounded-full overflow-hidden aspect-square transition-all duration-200
              ${selectedAvatarId === avatar.id 
                ? "ring-4 ring-white scale-110 shadow-lg z-10" 
                : "opacity-70 hover:opacity-100 hover:scale-105"
              }
            `}
          >
            <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold uppercase tracking-wider text-white/40 mb-2">
          Your Nickname
        </label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name..."
          className="w-full bg-white/10 border-b-2 border-white/20 focus:border-white p-3 text-xl text-white outline-none transition-colors rounded-t-lg"
        />
      </div>

      {/* 3. Przycisk */}
      <Button 
        onClick={handleJoin} 
        disabled={!name || !selectedAvatarId || isSubmitting}
      >
        {isSubmitting ? "Joining..." : "Join Game"}
      </Button>
    </div>
  );
}