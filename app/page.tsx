"use client";

import Button from "@/components/Button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginHost } from "@/app/actions/room";

export default function Home() {
  const router = useRouter();
  const [isHostLogin, setIsHostLogin] = useState(false);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleHostLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code || !pin) return;

    setError("");
    startTransition(async () => {
      const result = await loginHost(code, pin);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/room/${result.roomCode}?mode=host`);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center gap-4 md:gap-6 px-6 relative">
      <div className="relative w-64 md:w-80 lg:w-96">
        <img
          src="./escparty_logo.png"
          alt="ESC Party Logo"
          className="relative z-10 w-full h-auto drop-shadow-2xl"
        />
      </div>

      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-tight drop-shadow-lg z-10 flex flex-col items-center">
        <span>Gather your friends.</span>
        <span className="opacity-70 mt-1 md:mt-2">Choose your own winner.</span>
      </h1>

      <div className="z-10 mt-4 md:mt-6 w-full flex flex-col items-center">
        {isHostLogin ? (
          <form
            onSubmit={handleHostLogin}
            className="flex flex-col gap-4 w-full max-w-sm animate-in zoom-in duration-300"
          >
            <input
              type="text"
              placeholder="Room Code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-4 text-center text-lg font-mono uppercase tracking-widest focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-md shadow-lg"
              required
              maxLength={4}
            />
            <input
              type="text"
              placeholder="Host PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-4 text-center text-lg font-mono tracking-widest focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all backdrop-blur-md shadow-lg"
              required
            />

            {error && (
              <p className="text-red-200 text-sm text-center font-bold bg-red-900/50 border border-red-500/30 py-2 rounded-lg backdrop-blur-sm">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <div className="flex-1 flex justify-center">
                <Button
                  onClick={() => setIsHostLogin(false)}
                  variant="secondary"
                >
                  Back
                </Button>
              </div>
              <div className="flex-1 flex justify-center">
                <Button
                  onClick={handleHostLogin}
                  disabled={isPending || !code || !pin}
                >
                  {isPending ? "Loading..." : "Enter"}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <>
            <div className="md:hidden w-full flex justify-center">
              <Button href="/join-room">Join a room</Button>
            </div>

            <div className="hidden md:flex flex-row gap-4">
              <Button href="/new-room">Create a room</Button>
              <Button href="/join-room" variant="secondary">
                Join a room
              </Button>
            </div>

            <button
              onClick={() => setIsHostLogin(true)}
              className="hidden md:flex mt-8 text-white/50 hover:text-white text-sm uppercase tracking-widest transition-colors border-b border-transparent hover:border-white pb-1"
            >
              Resume as Host
            </button>
          </>
        )}
      </div>
    </div>
  );
}
