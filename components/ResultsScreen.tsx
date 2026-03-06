"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  const [videoEnded, setVideoEnded] = useState(false);

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
      // JEŚLI GRA ZAKOŃCZONA: Po prostu sumujemy wszystko do kupy, bez "aktywnych" pigułek
      if (showWinner) {
        player.votes.forEach((v) => {
          scores[v.entryId].total += v.points;
        });
      }
      // W TRAKCIE GRY: Standardowa logika wyświetlania dodawanych punktów
      else {
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
    showWinner,
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

    channel.bind("twelve-revealed", () => setTwelveRevealed(true));

    channel.bind("game-finished", () => {
      setShowWinner(true);
      pauseBackgroundMusic();
    });

    channel.bind(
      "emoji-tapped",
      (data: { playerId: string; emoji: string }) => {
        const container = document.getElementById(
          `avatar-container-${data.playerId}`,
        );
        if (!container) return;

        const el = document.createElement("div");
        el.innerText = data.emoji;
        el.className =
          "absolute left-1/2 bottom-16 text-5xl md:text-6xl z-50 pointer-events-none";
        el.style.textShadow = "0px 4px 10px rgba(0,0,0,0.5)";

        const rx = Math.floor(Math.random() * 80) - 40;

        el.animate(
          [
            { opacity: 0, transform: `translate(-50%, 0) scale(0.5)` },
            {
              opacity: 1,
              transform: `translate(calc(-50% + ${rx}px), -50px) scale(1.5)`,
              offset: 0.2,
            },
            {
              opacity: 1,
              transform: `translate(calc(-50% + ${rx}px), -250px) scale(1.5)`,
              offset: 0.8,
            },
            {
              opacity: 0,
              transform: `translate(calc(-50% + ${rx}px), -300px) scale(1.5)`,
            },
          ],
          { duration: 1500, easing: "ease-out" },
        );

        container.appendChild(el);
        setTimeout(() => {
          if (container.contains(el)) el.remove();
        }, 1500);
      },
    );

    return () => pusher.unsubscribe(`room-${roomCode}`);
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
                  if (isFinished) finishGame(roomCode);
                  else setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                }}
                disabled={!twelveRevealed}
              >
                {isFinished
                  ? "Reveal Winner"
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

  const renderAvatarsFooter = () => (
    <div className="absolute bottom-0 left-0 right-0 z-20 h-32 flex justify-center items-end pb-8 gap-6 md:gap-10 pointer-events-none">
      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          id={`avatar-container-${player.id}`}
          className="relative flex flex-col items-center"
        >
          <img
            src={player.avatar?.url || "/placeholder.png"}
            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/30 shadow-xl object-cover z-10 relative"
            alt={player.name}
          />
          <span className="text-xs font-bold mt-2 text-white/90 bg-black/80 px-3 py-1 rounded-full border border-white/10 shadow-md">
            {player.name}
          </span>
        </div>
      ))}
    </div>
  );

  // winner screen
  if (showWinner && isHost && !videoEnded) {
    const winner = calculatedEntries[0];
    const videoUrl = winner?.videoUrl;

    const iframeSrc = videoUrl
      ? `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&mute=0&controls=0&modestbranding=1&rel=0`
      : null;

    return (
      <div className="relative min-h-screen w-full flex items-center justify-center text-white overflow-hidden bg-black z-50">
        {/* WIDEO TŁO */}
        {iframeSrc && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <iframe
              key={videoUrl}
              src={iframeSrc}
              className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
              allow="autoplay"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/80" />
          </div>
        )}

        <div className="absolute top-6 right-6 z-30 bg-black/80 border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col w-64 animate-fade-in">
          <div className="flex justify-between items-start mb-2 gap-2">
            <div className="overflow-hidden">
              <h2 className="text-yellow-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                The Winner
              </h2>
              <h1 className="text-xl font-black text-white leading-tight truncate">
                {winner.country}
              </h1>
            </div>
            <div className="shrink-0 bg-linear-to-r from-yellow-500 to-yellow-600 text-black px-2 py-1 rounded text-xs font-black shadow-sm">
              {winner.points} pts
            </div>
          </div>

          <p className="text-sm text-white/90 font-bold truncate w-full">
            {winner.artist}
          </p>
          <p className="text-xs text-pink-400 font-medium mb-4 truncate w-full">
            {winner.songTitle || winner.title}
          </p>
          <button
            onClick={() => setVideoEnded(true)}
            className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Scoreboard
          </button>
        </div>

        {renderAvatarsFooter()}
      </div>
    );
  }

  // scoreboard
  return (
    <div className="h-screen w-full flex flex-col p-4 text-white overflow-hidden bg-black/40">
      <style>{`
        .results-grid { display: grid; gap: 0.5rem 2rem; height: 100%; align-content: start; }
        @media (min-width: 768px) { .results-grid { grid-auto-flow: column; grid-template-rows: repeat(${rowsPerColumn}, minmax(0, 1fr)); } }
        @media (max-width: 767px) { .results-grid { grid-template-columns: 1fr; grid-template-rows: auto; } }
      `}</style>

      <h1
        className="text-3xl lg:text-4xl font-bold text-center mb-4 shrink-0"
        style={{ textShadow: "0px 4px 10px rgba(0,0,0,0.5)" }}
      >
        {showWinner && videoEnded ? "Final Scoreboard" : "Grand Final Results"}
      </h1>

      {!showWinner && (
        <div className="flex justify-center mb-6 h-12 shrink-0">
          <AnimatePresence mode="wait">
            {currentVoterId && (
              <motion.div
                key={currentVoterId}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="flex items-center gap-4 bg-black/50 px-6 py-2 rounded-full border border-white/20"
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
      )}

      <div
        className={`flex-1 min-h-0 w-full max-w-7xl mx-auto ${showWinner && videoEnded ? "mb-36" : ""}`}
      >
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
                    : "bg-black/40 border-white/10",
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
                        "z-10 mr-4 font-black text-lg px-2 py-0.5 rounded",
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
      {showWinner && videoEnded && renderAvatarsFooter()}
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
