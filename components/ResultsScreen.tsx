"use client";

import { useState, useEffect, useMemo } from "react";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Player, Vote, Entry } from "@prisma/client";
import Button from "@/components/Button";
import { setNextVoter, revealTwelve } from "@/app/actions/room";

type VoteWithEntry = Vote & { entry: Entry };
type PlayerWithVotes = Player & {
  votes: VoteWithEntry[];
  avatar: { url: string } | null;
};

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
  initialCurrentVoterId,
}: ResultsScreenProps) {
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(
    initialCurrentVoterId,
  );
  const [twelveRevealed, setTwelveRevealed] = useState(false);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => a.name.localeCompare(b.name));
  }, [players]);

  const currentVoterIndex = useMemo(() => {
    if (!currentVoterId) return -1;
    return sortedPlayers.findIndex((p) => p.id === currentVoterId);
  }, [sortedPlayers, currentVoterId]);

  const calculatedEntries = useMemo(() => {
    const scores: Record<
      string,
      { total: number; currentPointsToAdd: number | null }
    > = {};
    entries.forEach(
      (e) => (scores[e.id] = { total: 0, currentPointsToAdd: null }),
    );

    if (currentVoterId === null) {
      return entries
        .map((e) => ({ ...e, points: 0, currentPointsToAdd: null }))
        .sort((a, b) => a.country.localeCompare(b.country));
    }

    sortedPlayers.forEach((player, index) => {
      if (index < currentVoterIndex) {
        player.votes.forEach((v) => {
          scores[v.entryId].total += v.points;
        });
      } else if (index === currentVoterIndex) {
        player.votes.forEach((v) => {
          if (v.points < 12) {
            scores[v.entryId].total += v.points;
            scores[v.entryId].currentPointsToAdd = v.points;
          }
          if (v.points === 12 && twelveRevealed) {
            scores[v.entryId].total += v.points;
            scores[v.entryId].currentPointsToAdd = 12;
          }
        });
      }
    });

    return Object.entries(scores)
      .map(([id, data]) => ({
        ...entries.find((e) => e.id === id)!,
        points: data.total,
        currentPointsToAdd: data.currentPointsToAdd,
      }))
      .sort((a, b) => b.points - a.points);
  }, [
    entries,
    sortedPlayers,
    currentVoterId,
    currentVoterIndex,
    twelveRevealed,
  ]);

  const rowsPerColumn = Math.ceil(calculatedEntries.length / 2);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`room-${roomCode}`);

    channel.bind("voter-changed", (data: { currentVoterId: string | null }) => {
      setTwelveRevealed(false);
      setCurrentVoterId(data.currentVoterId);
    });

    channel.bind("twelve-revealed", () => {
      setTwelveRevealed(true);
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode]);

  // HOST CONTROLS
  const renderHostControls = () => {
    if (!isHost) return null;

    const nextIndex = currentVoterIndex + 1;
    const isFinished = nextIndex >= sortedPlayers.length;

    return (
      <div className="shrink-0 bg-black/80 p-4 rounded-2xl border border-white/20 flex justify-between items-center z-10 w-full max-w-7xl mx-auto mt-4">
        <div className="text-white font-mono flex flex-col">
          <span className="text-xs text-white/50 uppercase">Current Stage</span>
          <span className="font-bold">
            {currentVoterId
              ? `Voting: ${sortedPlayers[currentVoterIndex]?.name}`
              : "Waiting to start..."}
          </span>
        </div>

        <div className="flex gap-4">
          {!currentVoterId && (
            <Button onClick={() => setNextVoter(roomCode, sortedPlayers[0].id)}>
              Start Presentation
            </Button>
          )}

          {currentVoterId && (
            <>
              <button
                onClick={() => revealTwelve(roomCode)}
                className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-600 rounded font-bold text-xs uppercase transition-colors"
                disabled={twelveRevealed}
              >
                Force Reveal 12
              </button>

              <Button
                onClick={() => {
                  if (!isFinished) {
                    setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                  }
                }}
                disabled={!twelveRevealed}
              >
                {isFinished
                  ? "Presentation Done"
                  : `Next Voter: ${sortedPlayers[nextIndex]?.name}`}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  // PLAYER BUTTON
  const renderPlayerReveal = () => {
    if (currentPlayerId !== currentVoterId || twelveRevealed) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-linear-to-br from-pink-600 to-purple-700 p-1 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
          <div className="bg-black rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-white">
              It's your turn!
            </h2>
            <button
              onClick={() => revealTwelve(roomCode)}
              className="bg-white text-black text-2xl font-black uppercase py-4 px-12 rounded-lg hover:scale-105 transition-transform active:scale-95"
            >
              Reveal 12 Points
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col p-4 text-white overflow-hidden bg-black/40">
      <style>{`
        .results-grid {
          display: grid;
          gap: 0.5rem 2rem;
          height: 100%;
          align-content: start;
        }
        @media (min-width: 768px) {
          .results-grid {
            grid-auto-flow: column;
            grid-template-rows: repeat(${rowsPerColumn}, minmax(0, 1fr));
          }
        }
        @media (max-width: 767px) {
          .results-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
          }
        }
      `}</style>

      <h1 className="text-3xl lg:text-4xl font-bold text-center mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] shrink-0">
        Grand Final Results
      </h1>

      <div className="flex justify-center mb-6 h-12 shrink-0">
        <AnimatePresence mode="wait">
          {currentVoterId && (
            <motion.div
              key={currentVoterId}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="flex items-center gap-4 bg-white/10 px-6 py-2 rounded-full border border-white/20 shadow-lg"
            >
              <img
                src={sortedPlayers[currentVoterIndex]?.avatar?.url}
                className="w-8 h-8 rounded-full border-2 border-white"
                alt="Avatar"
              />
              <span className="text-lg font-bold">
                {sortedPlayers[currentVoterIndex]?.name} is voting...
              </span>
            </motion.div>
          )}
          {!currentVoterId && (
            <div className="text-white/50 italic flex items-center h-full">
              Waiting for host to start the ceremony...
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 min-h-0 w-full max-w-7xl mx-auto">
        <div className="results-grid">
          <AnimatePresence>
            {calculatedEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                layout
                initial={false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={clsx(
                  "flex items-center px-3 py-1 rounded border relative overflow-hidden min-h-9",
                  index === 0
                    ? "bg-linear-to-r from-yellow-600/40 to-yellow-900/40 border-yellow-500/50"
                    : "bg-white/5 border-white/10",
                )}
              >
                <div className="w-8 text-xl font-black text-white/30 text-right mr-3 font-mono">
                  {index + 1}
                </div>

                <div className="flex-1 z-10 flex flex-col justify-center overflow-hidden">
                  <div className="font-bold text-base md:text-lg leading-none truncate">
                    {entry.country}
                  </div>
                  <div className="text-xs opacity-60 truncate mt-0.5">
                    {entry.artist}
                  </div>
                </div>

                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-white/5 z-0"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      calculatedEntries[0].points > 0
                        ? `${(entry.points / calculatedEntries[0].points) * 100}%`
                        : "0%",
                  }}
                  transition={{ duration: 1 }}
                />

                <AnimatePresence>
                  {entry.currentPointsToAdd && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className={clsx(
                        "z-10 mr-4 font-black text-lg px-2 py-0.5 rounded shadow-lg",
                        entry.currentPointsToAdd === 12
                          ? "bg-yellow-500 text-black animate-pulse"
                          : "bg-purple-600 text-white",
                      )}
                    >
                      +{entry.currentPointsToAdd}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-2xl md:text-3xl font-mono font-bold w-16 text-right z-10 shrink-0">
                  <Counter value={entry.points} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
      initial={{ opacity: 0.5, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-block"
    >
      {value}
    </motion.span>
  );
}
