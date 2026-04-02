"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";
import Button from "@/components/Button";
import { Player, Avatar } from "@prisma/client";
import { startRunningOrderDraw } from "@/app/actions/room"; // <-- ZMIENIONY IMPORT
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

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
  const [joinUrl, setJoinUrl] = useState("");

  const router = useRouter();

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/room/${roomCode}?mode=player`);

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

    channel.bind("room-updated", (data: { status: string }) => {
      if (data.status === "RUNNING_ORDER") {
        router.refresh();
      }
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  const handleStartGame = async () => {
    if (isStarting) return;

    setIsStarting(true);

    try {
      await startRunningOrderDraw(roomCode);
    } catch (error) {
      console.error("Failed to start", error);
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 text-white max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-12 md:gap-16 bg-white/5 p-10 rounded-3xl border border-white/10 mt-10 shadow-[0_0_60px_-10px_rgba(255,255,255,0.1)] backdrop-blur-sm">
        <div className="text-center md:text-left flex-1">
          <h1 className="text-5xl font-extrabold drop-shadow-xl mb-4">Lobby</h1>
          <p className="text-white/70 text-xl md:text-2xl font-light leading-relaxed max-w-lg">
            Scan to join instantly, or go to{" "}
            <span className="text-white font-mono bg-white/10 px-3 py-1.5 rounded-lg text-lg border border-white/10">
              escparty.vercel.app
            </span>
          </p>
        </div>

        <div className="flex items-center gap-8 bg-black/30 p-8 rounded-3xl border-2 border-white/20 shadow-inner shrink-0">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-white/50 mb-3 font-bold">
              Room Code
            </span>
            <span className="text-7xl font-black tracking-widest font-mono select-all text-transparent bg-clip-text bg-linear-to-r from-pink-500 to-cyan-400 drop-shadow-[0_0_15px_rgba(219,39,119,0.5)]">
              {roomCode}
            </span>
          </div>

          {joinUrl && (
            <div className="bg-white p-3 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform duration-300">
              <QRCode value={joinUrl} size={120} level="M" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 content-start px-4">
        {players.map((player) => (
          <div
            key={player.id}
            // Dodajemy 'group' tutaj, żeby hover działał na całość (i zdjęcie i tekst) spójnie
            className="flex flex-col items-center animate-in zoom-in duration-300 gap-3 group"
          >
            <div className="relative">
              <img
                src={player.avatar?.url || "/placeholder.png"}
                alt={player.name}
                className="w-28 h-28 rounded-full border-4 border-white/20 group-hover:border-white group-hover:scale-105 transition-all shadow-xl object-cover"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-7 h-7 rounded-full border-4 border-gray-900 shadow-md" />
            </div>

            <span className="font-bold text-lg text-center wrap-break-word leading-tight px-2 w-full group-hover:text-pink-400 transition-colors">
              {player.name}
            </span>
          </div>
        ))}

        {players.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30 mt-10">
            <p className="text-2xl animate-pulse">Waiting for players...</p>
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-white/10 pt-10 flex justify-center pb-6">
        <div className="w-full max-w-md">
          <Button
            disabled={players.length < 1 || isStarting}
            onClick={handleStartGame}
            className="w-full py-4 text-lg"
          >
            {isStarting ? "Starting..." : "Draw Running Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
