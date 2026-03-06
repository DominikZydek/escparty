"use client";

import { useState, useEffect, useMemo } from "react";
import Pusher from "pusher-js";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Player, Vote, Entry as PrismaEntry } from "@prisma/client";
import Button from "@/components/Button";
import {
  setNextVoter,
  revealTwelve,
  finishGame,
  tapEmoji,
} from "@/app/actions/room";
import { pauseBackgroundMusic } from "@/lib/audio";

type Entry = PrismaEntry & { songTitle?: string; title?: string };
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

const AVAILABLE_EMOJIS = ["❤️", "🔥", "🎉", "👏", "🤯", "💩"];

function getYouTubeId(url: string) {
  const match = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|.*embed\/))([^&?]*)/,
  );
  return match ? match[1] : "";
}

type FloatingEmoji = {
  id: string;
  playerId: string;
  emoji: string;
  randomX: number;
};

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
  const [showWinner, setShowWinner] = useState(false);
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);

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

    channel.bind("game-finished", () => {
      setShowWinner(true);
      pauseBackgroundMusic();
    });

    channel.bind(
      "emoji-tapped",
      (data: { playerId: string; emoji: string }) => {
        const newEmoji: FloatingEmoji = {
          id: Math.random().toString(36).substr(2, 9),
          playerId: data.playerId,
          emoji: data.emoji,
          randomX: Math.floor(Math.random() * 80) - 40,
        };

        setEmojis((prev) => [...prev, newEmoji]);

        setTimeout(() => {
          setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
        }, 2000);
      },
    );

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode]);

  const renderHostControls = () => {
    if (!isHost || showWinner) return null;

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
                  if (isFinished) {
                    finishGame(roomCode);
                  } else {
                    setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                  }
                }}
                disabled={!twelveRevealed}
              >
                {isFinished
                  ? "Reveal Winner! 🏆"
                  : `Next Voter: ${sortedPlayers[nextIndex]?.name}`}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPlayerReveal = () => {
    if (currentPlayerId !== currentVoterId || twelveRevealed || showWinner)
      return null;

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

  const renderPlayerWinnerScreen = () => {
    if (isHost || !showWinner) return null;

    const winner = calculatedEntries[0];

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black p-6">
        <div className="absolute inset-0 bg-linear-to-t from-pink-900/40 to-transparent pointer-events-none" />

        <div className="z-10 flex flex-col items-center text-center mb-12 animate-in slide-in-from-bottom-10 duration-700">
          <span className="text-yellow-500 font-bold tracking-widest uppercase mb-2">
            The Winner Is
          </span>
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
            {winner.country}
          </h1>
          <p className="text-xl text-white/70">{winner.artist}</p>
        </div>

        <div className="z-10 w-full max-w-sm animate-in zoom-in duration-500 delay-300 fill-mode-both">
          <p className="text-center text-white/50 mb-6 font-mono text-sm uppercase tracking-widest">
            Tap to react on TV
          </p>
          <div className="grid grid-cols-3 gap-4">
            {AVAILABLE_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  if (currentPlayerId) {
                    if (navigator.vibrate) navigator.vibrate(50);
                    tapEmoji(roomCode, currentPlayerId, emoji);
                  }
                }}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-90 text-5xl py-6 rounded-2xl border border-white/10 transition-all shadow-lg flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (showWinner && isHost) {
    const winner = calculatedEntries[0];
    const videoId = getYouTubeId(winner.videoUrl || "");

    const iframeSrc = videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=0&modestbranding=1&rel=0&start=45`
      : null;

    return (
      <div className="relative min-h-screen w-full text-white overflow-hidden bg-black animate-in fade-in duration-1000 z-50">
        {iframeSrc && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <iframe
              key={videoId}
              src={iframeSrc}
              className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
              allow="autoplay; encrypted-media"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent" />
          </div>
        )}
        <div className="absolute bottom-40 left-8 md:left-12 z-20 flex flex-col items-start animate-in slide-in-from-left-10 duration-1000">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-start max-w-sm md:max-w-md">
            <h2 className="text-yellow-500 text-sm md:text-base font-bold tracking-[0.2em] uppercase mb-1 animate-pulse">
              The Winner Is
            </h2>
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-lg leading-tight mb-2">
              {winner.country}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 font-bold truncate w-full">
              {winner.artist}
            </p>
            <p className="text-sm md:text-base text-pink-400 font-medium mb-6 truncate w-full">
              {winner.songTitle || winner.title}
            </p>

            <div className="inline-flex items-center gap-2 bg-linear-to-r from-yellow-500 to-yellow-600 text-black px-6 py-2 rounded-full font-black text-xl shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              <span>🏆</span> {winner.points} POINTS
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20 h-32 flex justify-center items-end pb-8 gap-6 md:gap-10">
          {sortedPlayers.map((player) => {
            const playerEmojis = emojis.filter((e) => e.playerId === player.id);

            return (
              <div
                key={player.id}
                className="relative flex flex-col items-center"
              >
                <AnimatePresence>
                  {playerEmojis.map((e) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 0, scale: 0.2, x: "-50%" }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: -250 - Math.random() * 80,
                        scale: [0.5, 1.2, 1.5, 1.5],
                        x: `calc(-50% + ${e.randomX}px)`,
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute left-1/2 bottom-16 text-4xl md:text-5xl pointer-events-none drop-shadow-lg z-50"
                    >
                      {e.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="relative group">
                  <img
                    src={player.avatar?.url || "/placeholder.png"}
                    className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/30 shadow-xl object-cover z-10 relative"
                    alt={player.name}
                  />
                </div>
                <span className="text-xs font-bold mt-2 text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                  {player.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
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
      {renderPlayerWinnerScreen()}
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
