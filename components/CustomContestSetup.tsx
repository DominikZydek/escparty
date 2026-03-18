"use client";

import { useState, useTransition } from "react";
import Button from "./Button";
import { createCustomContest } from "@/app/actions/contest";
import { createRoom } from "@/app/actions/room";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";

interface CustomContestSetupProps {
  onBack: () => void;
}

export default function CustomContestSetup({
  onBack,
}: CustomContestSetupProps) {
  const router = useRouter();
  const [contestName, setContestName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestName.trim()) return;

    startTransition(async () => {
      try {
        const contest = await createCustomContest(contestName);
        const room = await createRoom(contest.id);
        router.push(`/room/${room.code}?mode=host`);
      } catch (error) {
        console.error("Failed to create contest", error);
        alert("Something went wrong");
      }
    });
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
      <div className="w-full max-w-md bg-black/80 border border-white/20 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-pink-500/20 text-pink-500 rounded-full flex items-center justify-center mb-4 border border-pink-500/50">
            <PartyPopper size={32} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">
            Name Your Party
          </h2>
          <p className="text-white/60 text-sm">
            Give your Eurovision party a name. You'll invite friends to submit
            their songs in the next step.
          </p>
        </div>

        <form onSubmit={handleCreateGame} className="flex flex-col gap-6">
          <input
            type="text"
            value={contestName}
            onChange={(e) => setContestName(e.target.value)}
            className="w-full text-center text-xl font-bold bg-white/5 border border-white/20 text-white rounded-xl px-4 py-4 focus:outline-none focus:bg-white/10 focus:border-pink-500 transition-all placeholder:text-white/20"
            required
            autoFocus
            maxLength={40}
          />

          <div className="flex gap-3 mt-2">
            <Button
              variant="secondary"
              onClick={onBack}
              disabled={isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isPending || !contestName.trim()}
              className="flex-2 bg-pink-500 text-white font-bold uppercase tracking-wider rounded-xl hover:bg-pink-400 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
