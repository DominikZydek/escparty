"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@prisma/client";
import { joinGame, removePlayer, reconnectPlayer } from "@/app/actions/player";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { LogOut } from "lucide-react";

interface PlayerJoinScreenProps {
  roomCode: string;
  avatars: Avatar[];
}

export default function PlayerJoinScreen({
  roomCode,
  avatars,
}: PlayerJoinScreenProps) {
  const [name, setName] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);

  const [hasJoined, setHasJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCookie, setIsLoadingCookie] = useState(true);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const player = await reconnectPlayer(roomCode);
        if (player) {
          setMyPlayerId(player.id);
          setSelectedAvatarId(player.avatarId);
          setHasJoined(true);
          console.log("Auto-reconnected!");
        }
      } catch (error) {
        console.error("Auto-reconnect failed:", error);
      } finally {
        setIsLoadingCookie(false);
      }
    };

    checkSession();
  }, [roomCode]);

  useEffect(() => {
    if (!hasJoined) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("room-updated", (data: { status: string }) => {
      if (
        data.status === "RUNNING_ORDER" ||
        data.status === "WATCHING" ||
        data.status === "LOBBY"
      ) {
        router.refresh();
      }
    });

    channel.bind("show-started", (data: { redirectUrl: string }) => {
      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        router.refresh();
      }
    });

    channel.bind("player-left", (data: { playerId: string }) => {
      if (data.playerId === myPlayerId) {
        setHasJoined(false);
        setMyPlayerId(null);
        alert("You have been removed from the lobby.");
      }
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
      pusher.disconnect();
    };
  }, [hasJoined, roomCode, router, myPlayerId]);

  const handleJoin = async () => {
    if (!name || !selectedAvatarId) return;

    setIsSubmitting(true);
    try {
      const newPlayer = await joinGame(roomCode, name, selectedAvatarId);
      if (newPlayer && newPlayer.id) {
        setMyPlayerId(newPlayer.id);
      }
      setHasJoined(true);
    } catch (error) {
      alert("Error joining game");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!myPlayerId) return;
    setIsSubmitting(true);
    try {
      await removePlayer(myPlayerId, roomCode);
    } catch (error) {
      alert("Error leaving game");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingCookie) {
    return (
      <div className="flex items-center justify-center h-screen text-white/50">
        <p className="animate-pulse text-xl">Loading lobby...</p>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white gap-6 p-5">
        <div className="animate-pulse relative">
          <img
            src={
              avatars.find((a) => a.id === selectedAvatarId)?.url ||
              "/placeholder.png"
            }
            alt="My Avatar"
            className="w-32 h-32 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] object-cover"
          />
        </div>
        <h1 className="text-3xl font-bold">You are in!</h1>
        <p className="text-white/50 text-center mb-8 max-w-xs leading-relaxed">
          Waiting for host to start... Keep this page open. You can safely close
          your screen and return later.
        </p>

        <button
          onClick={handleLeave}
          disabled={isSubmitting}
          className="flex items-center gap-2 text-white/50 hover:text-red-400 transition-colors mt-8"
        >
          <LogOut size={20} />
          <span>{isSubmitting ? "Leaving..." : "Leave Lobby"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-5 text-white max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">
        Join Room {roomCode}
      </h1>
      <p className="text-center text-white/50 mb-8">Choose your avatar</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => setSelectedAvatarId(avatar.id)}
            className={`
              relative rounded-full overflow-hidden aspect-square transition-all duration-200
              ${selectedAvatarId === avatar.id ? "ring-4 ring-white scale-110 shadow-lg z-10" : "opacity-70 hover:opacity-100 hover:scale-105"}
            `}
          >
            <img
              src={avatar.url}
              alt={avatar.name}
              className="w-full h-full object-cover"
            />
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

      <Button
        onClick={handleJoin}
        disabled={!name || !selectedAvatarId || isSubmitting}
      >
        {isSubmitting ? "Joining..." : "Join Game"}
      </Button>
    </div>
  );
}
