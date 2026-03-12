"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";

export default function PlayerDrawWaitingScreen({
  roomCode,
}: {
  roomCode: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("room-updated", (data: { status: string }) => {
      if (data.status === "WATCHING") {
        router.refresh();
      }
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
      pusher.disconnect();
    };
  }, [roomCode, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white p-6 relative bg-black">
      <div className="absolute inset-0 bg-linear-to-t from-pink-900/40 to-transparent pointer-events-none" />
      <div className="z-10 flex flex-col items-center text-center">
        <div className="animate-pulse mb-8">
          <div className="w-16 h-16 border-4 border-white/20 border-t-pink-500 rounded-full animate-spin mx-auto" />
        </div>
        <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-pink-500 to-purple-500">
          The Draw is Live!
        </h1>
        <p className="text-white/70 text-lg max-w-xs">
          Look at the big screen. The host is drawing the running order right
          now...
        </p>
      </div>
    </div>
  );
}
