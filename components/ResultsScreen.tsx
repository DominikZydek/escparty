"use client";

import { useState, useEffect, useMemo } from "react";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Player, Vote, Entry } from "@prisma/client";
import Button from "@/components/Button";
import { setNextVoter, revealTwelve } from "@/app/actions/room";

type VoteWithEntry = Vote & { entry: Entry };
type PlayerWithVotes = Player & { votes: VoteWithEntry[], avatar: { url: string } | null };
type EntryWithTotal = Entry & { totalPoints: number };

interface ResultsScreenProps {
  roomCode: string;
  isHost: boolean;
  currentPlayerId: string | undefined;
  players: PlayerWithVotes[];
  entries: Entry[];
  initialCurrentVoterId: string | null;
}

export default function ResultsScreen({
  roomCode,
  isHost,
  currentPlayerId,
  players,
  entries,
  initialCurrentVoterId
}: ResultsScreenProps) {
  
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(initialCurrentVoterId);
  const [twelveRevealed, setTwelveRevealed] = useState(false);

  const leaderboard = useMemo(() => {
    const scores: Record<string, number> = {};
    entries.forEach(e => scores[e.id] = 0);

    players.forEach(p => {
      
      const isCurrentVoter = p.id === currentVoterId;
      
      
      p.votes.forEach(vote => {
        if (isCurrentVoter) {
            if (vote.points < 12) {
                scores[vote.entryId] += vote.points;
            }
            else if (vote.points === 12 && twelveRevealed) {
                scores[vote.entryId] += vote.points;
            }
        } else {

        }
      });
    });

    return []; 
  }, [players, entries, currentVoterId, twelveRevealed]);

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.name.localeCompare(b.name)), [players]);
  
  const currentVoterIndex = sortedPlayers.findIndex(p => p.id === currentVoterId);

  const calculatedEntries = useMemo(() => {
    const scores: Record<string, number> = {};
    entries.forEach(e => scores[e.id] = 0);

    sortedPlayers.forEach((player, index) => {
        if (currentVoterId === null || (currentVoterIndex !== -1 && index < currentVoterIndex)) {
            player.votes.forEach(v => scores[v.entryId] += v.points);
        }
        else if (player.id === currentVoterId) {
            player.votes.forEach(v => {
                if (v.points < 12) scores[v.entryId] += v.points;
                if (v.points === 12 && twelveRevealed) scores[v.entryId] += v.points;
            });
        }
    });

    return Object.entries(scores)
        .map(([id, points]) => ({ ...entries.find(e => e.id === id)!, points }))
        .sort((a, b) => b.points - a.points); // Sort malejący
  }, [entries, sortedPlayers, currentVoterId, currentVoterIndex, twelveRevealed]);


  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("voter-changed", (data: { currentVoterId: string | null }) => {
        setTwelveRevealed(false);
        setCurrentVoterId(data.currentVoterId);
    });

    channel.bind("twelve-revealed", () => {
        setTwelveRevealed(true);
    });

    return () => { pusher.unsubscribe(`room-${roomCode}`); };
  }, [roomCode]);


  const renderHostControls = () => {
    if (!isHost) return null;

    const nextIndex = currentVoterIndex + 1;
    const isFinished = nextIndex >= sortedPlayers.length;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/80 p-4 border-t border-white/20 flex justify-between items-center z-50">
            <div className="text-white font-mono">
                Current: {currentVoterId ? sortedPlayers[currentVoterIndex]?.name : "None"} 
                | 12pts Revealed: {twelveRevealed ? "YES" : "NO"}
            </div>
            <div className="flex gap-4">
                {!currentVoterId && !isFinished && (
                     <Button onClick={() => setNextVoter(roomCode, sortedPlayers[0].id)}>Start Presentation</Button>
                )}
                {currentVoterId && (
                    <>
                        <button 
                            onClick={() => revealTwelve(roomCode)}
                            className="px-4 py-2 bg-yellow-600/50 hover:bg-yellow-600 text-white rounded font-bold text-xs uppercase"
                            disabled={twelveRevealed}
                        >
                            Force Reveal 12
                        </button>

                        <Button 
                            onClick={() => {
                                if (isFinished) setNextVoter(roomCode, null);
                                else setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                            }}
                            disabled={!twelveRevealed}
                        >
                            {nextIndex >= sortedPlayers.length ? "Finish Voting" : `Next: ${sortedPlayers[nextIndex]?.name}`}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
  };

  const renderPlayerReveal = () => {
    if (currentPlayerId !== currentVoterId || twelveRevealed) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-gradient-to-br from-pink-600 to-purple-700 p-1 rounded-2xl shadow-2xl">
                <button 
                    onClick={() => revealTwelve(roomCode)}
                    className="bg-black text-white text-3xl font-black uppercase py-12 px-16 rounded-xl hover:bg-white/10 transition-all active:scale-95 border-2 border-white/20"
                >
                    Reveal 12 Points!
                </button>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen p-5 pb-32 text-white max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">Grand Final Results</h1>

      <div className="flex justify-center mb-8 h-16">
        <AnimatePresence mode="wait">
            {currentVoterId && (
                <motion.div 
                    key={currentVoterId}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="flex items-center gap-4 bg-white/10 px-8 py-2 rounded-full border border-white/20"
                >
                    <img 
                        src={sortedPlayers[currentVoterIndex]?.avatar?.url} 
                        className="w-10 h-10 rounded-full border-2 border-white" 
                    />
                    <span className="text-xl font-bold">
                        {sortedPlayers[currentVoterIndex]?.name} is voting...
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 relative">
        <AnimatePresence>
            {calculatedEntries.map((entry, index) => (
                <motion.div
                    key={entry.id}
                    layout
                    initial={false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                        "flex items-center p-3 rounded-xl border transition-colors relative overflow-hidden",
                        index === 0 ? "bg-gradient-to-r from-yellow-600/40 to-yellow-900/40 border-yellow-500/50" : "bg-white/5 border-white/10"
                    )}
                >
                    <div className="w-12 text-2xl font-black text-white/30 text-right mr-4">
                        {index + 1}
                    </div>

                    <div className="flex-1">
                        <div className="font-bold text-lg leading-tight">{entry.country}</div>
                        <div className="text-sm opacity-60">{entry.artist}</div>
                    </div>

                    <motion.div 
                        className="absolute left-0 top-0 bottom-0 bg-white/5 -z-10"
                        initial={{ width: 0 }}
                        animate={{ width: `${(entry.points / (calculatedEntries[0].points || 1)) * 100}%` }}
                    />

                    <div className="text-3xl font-mono font-bold w-20 text-right">
                        <Counter value={entry.points} />
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {renderHostControls()}
      {renderPlayerReveal()}
    </div>
  );
}

function Counter({ value }: { value: number }) {
  return (
    <motion.span
        key={value}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-block"
    >
        {value}
    </motion.span>
  );
}