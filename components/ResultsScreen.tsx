"use client";

import { getCountryCode } from "@/lib/countries";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Pusher from "pusher-js";
import { Player, Vote, Entry as PrismaEntry, Contest } from "@prisma/client";
import Button from "@/components/Button";
import {
  setNextVoter,
  revealNextPoint,
  revealAllPoints,
  finishGame,
} from "@/app/actions/room";
import { pauseBackgroundMusic } from "@/lib/audio";

import { EmojiCanvas } from "./results/EmojiCanvas";
import { ScoreboardGrid, CalculatedEntry } from "./results/ScoreboardGrid";

type Entry = PrismaEntry & { songTitle?: string; title?: string };
type VoteWithEntry = Vote & { entry: Entry };
type PlayerWithVotes = Player & {
  votes: VoteWithEntry[];
  avatar: { url: string } | null;
};

interface ResultsScreenProps {
  contest: Contest;
  roomCode: string;
  isHost: boolean;
  currentPlayerId: string | undefined;
  players: PlayerWithVotes[];
  entries: Entry[];
  initialCurrentVoterId: string | null;
}

const AVAILABLE_EMOJIS = ["flag", "❤️", "🔥", "👏", "🤯", "💩"];

const EUROVISION_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12];

export default function ResultsScreen({
  contest,
  roomCode,
  isHost,
  currentPlayerId,
  players,
  entries,
  initialCurrentVoterId,
}: ResultsScreenProps) {
  const [showWinner, setShowWinner] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [currentVoterId, setCurrentVoterId] = useState<string | null>(
    initialCurrentVoterId,
  );

  const [revealedIndex, setRevealedIndex] = useState<number>(-1);

  const privateChannelRef = useRef<any>(null);

  const winner = useMemo(() => {
    if (!entries || entries.length === 0) return null;
    const scores: Record<string, number> = {};
    entries.forEach((e) => (scores[e.id] = 0));

    players.forEach((player) => {
      player.votes.forEach((vote) => {
        if (scores[vote.entryId] !== undefined)
          scores[vote.entryId] += vote.points;
      });
    });

    return entries
      .map((e) => ({ ...e, points: scores[e.id] }))
      .sort((a, b) => b.points - a.points)[0];
  }, [entries, players]);

  const sortedPlayers = useMemo(() => {
    if (!entries || entries.length === 0 || !players || players.length === 0)
      return [];

    const finalScores: Record<string, number> = {};
    entries.forEach((e) => (finalScores[e.id] = 0));

    players.forEach((player) => {
      player.votes.forEach((vote) => {
        if (finalScores[vote.entryId] !== undefined) {
          finalScores[vote.entryId] += vote.points;
        }
      });
    });

    const ultimateWinnerId = Object.entries(finalScores).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    return [...players].sort((a, b) => {
      const pointsGivenToWinnerA =
        a.votes.find((v) => v.entryId === ultimateWinnerId)?.points || 0;
      const pointsGivenToWinnerB =
        b.votes.find((v) => v.entryId === ultimateWinnerId)?.points || 0;

      if (pointsGivenToWinnerA !== pointsGivenToWinnerB) {
        return pointsGivenToWinnerA - pointsGivenToWinnerB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [players, entries]);

  const currentVoterIndex = useMemo(() => {
    if (!currentVoterId) return -1;
    return sortedPlayers.findIndex((p) => p.id === currentVoterId);
  }, [sortedPlayers, currentVoterId]);

  const calculatedEntries: CalculatedEntry[] = useMemo(() => {
    if (showWinner && !videoEnded) return [];

    const scores: Record<
      string,
      { total: number; currentPointsToAdd: number | null }
    > = {};
    entries.forEach(
      (e) => (scores[e.id] = { total: 0, currentPointsToAdd: null }),
    );

    if (currentVoterId === null && !showWinner) {
      return entries
        .map((e) => ({ ...e, points: 0, currentPointsToAdd: null }))
        .sort((a, b) => a.country.localeCompare(b.country));
    }

    sortedPlayers.forEach((player, index) => {
      if (showWinner) {
        player.votes.forEach((v) => {
          scores[v.entryId].total += v.points;
        });
      } else {
        if (index < currentVoterIndex) {
          player.votes.forEach((v) => {
            scores[v.entryId].total += v.points;
          });
        } else if (index === currentVoterIndex) {
          player.votes.forEach((v) => {
            const pointIdx = EUROVISION_POINTS.indexOf(v.points);
            if (pointIdx !== -1 && pointIdx <= revealedIndex) {
              scores[v.entryId].total += v.points;
              if (pointIdx === revealedIndex) {
                scores[v.entryId].currentPointsToAdd = v.points;
              }
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
    revealedIndex,
    showWinner,
    videoEnded,
  ]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const publicChannel = pusher.subscribe(`room-${roomCode}`);

    publicChannel.bind(
      "voter-changed",
      (data: { currentVoterId: string | null }) => {
        setRevealedIndex(-1);
        setCurrentVoterId(data.currentVoterId);
      },
    );

    publicChannel.bind("point-revealed", (data: { newIndex: number }) => {
      setRevealedIndex(data.newIndex);
    });

    publicChannel.bind("all-points-revealed", () => {
      setRevealedIndex(EUROVISION_POINTS.length - 1);
    });

    publicChannel.bind("game-finished", () => {
      setShowWinner(true);
      pauseBackgroundMusic();
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
      pusher.disconnect();
    };
  }, [roomCode]);

  // AUDIO
  useEffect(() => {
    if (!isHost) return;

    if (revealedIndex >= 0 && currentVoterIndex >= 0 && !showWinner) {
      const currentPoints = EUROVISION_POINTS[revealedIndex];
      const activePlayer = sortedPlayers[currentVoterIndex];
      const vote = activePlayer?.votes.find((v) => v.points === currentPoints);

      if (vote) {
        const targetEntry = entries.find((e) => e.id === vote.entryId);
        if (targetEntry) {
          const code = getCountryCode(targetEntry.country).toLowerCase();
          const audio = new Audio(`/sounds/country_announcements/${code}.mp3`);
          audio.volume = 0.8;
          audio.play().catch((e) => console.error("Audio play failed:", e));
        }
      }
    }
  }, [
    revealedIndex,
    currentVoterIndex,
    sortedPlayers,
    entries,
    showWinner,
    isHost,
  ]);

  useEffect(() => {
    if (!showWinner || videoEnded || isHost) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
    const privateChannelName = `private-emojis-${roomCode}`;
    privateChannelRef.current = pusher.subscribe(privateChannelName);
    return () => {
      pusher.unsubscribe(privateChannelName);
      pusher.disconnect();
    };
  }, [showWinner, videoEnded, isHost, roomCode]);

  const isFinishedRevealing = revealedIndex >= EUROVISION_POINTS.length - 1;
  const nextPointToReveal = !isFinishedRevealing
    ? EUROVISION_POINTS[revealedIndex + 1]
    : null;

  const currentVoterVotes =
    currentVoterIndex >= 0 ? sortedPlayers[currentVoterIndex].votes : [];
  const nextVote = currentVoterVotes.find(
    (v) => v.points === nextPointToReveal,
  );
  const nextTargetEntry = nextVote
    ? entries.find((e) => e.id === nextVote.entryId)
    : null;

  // WINNER SCREEN
  if (showWinner && !videoEnded) {
    if (!isHost) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 relative">
          <div className="absolute inset-0 bg-linear-to-t from-pink-900/40 to-transparent pointer-events-none" />
          <div className="z-10 flex flex-col items-center text-center mb-12 animate-in slide-in-from-bottom-10 duration-700">
            <span className="text-yellow-500 font-bold tracking-widest uppercase mb-2">
              The Winner Is
            </span>
            <h1 className="text-5xl font-black mb-2 text-center drop-shadow-lg">
              {winner?.country}
            </h1>
            <p className="text-xl text-white/70">{winner?.artist}</p>
          </div>

          <div className="z-10 w-full max-w-sm animate-in zoom-in duration-500 delay-300">
            <p className="text-center text-white/50 mb-6 font-mono text-sm uppercase tracking-widest">
              Tap to react on TV
            </p>
            <div className="grid grid-cols-3 gap-4">
              {AVAILABLE_EMOJIS.map((emoji, index) => {
                const isFirst = index === 0 && winner;
                const countryCode = winner
                  ? getCountryCode(winner.country).toLowerCase()
                  : "";

                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (currentPlayerId && privateChannelRef.current) {
                        if (navigator.vibrate) navigator.vibrate(50);
                        const payload = isFirst ? "WINNER_FLAG" : emoji;
                        privateChannelRef.current.trigger(
                          "client-emoji-tapped",
                          {
                            playerId: currentPlayerId,
                            emoji: payload,
                          },
                        );
                      }
                    }}
                    className="bg-white/10 hover:bg-white/20 active:bg-white/30 active:scale-90 text-5xl py-6 rounded-2xl border border-white/10 transition-all shadow-lg flex items-center justify-center"
                  >
                    {isFirst ? (
                      <span
                        className={`fi fi-${countryCode} text-4xl shadow-sm`}
                      ></span>
                    ) : (
                      emoji
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    const videoUrl = winner?.videoUrl;
    const iframeSrc = videoUrl
      ? `${videoUrl}${videoUrl.includes("?") ? "&" : "?"}autoplay=1&mute=0&controls=0&modestbranding=1&rel=0`
      : null;

    return (
      <div className="relative min-h-screen w-full flex items-center justify-center text-white overflow-hidden bg-black">
        {iframeSrc ? (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <iframe
              key={videoUrl}
              src={iframeSrc}
              className="absolute top-1/2 left-1/2 w-[110vw] h-[110vh] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
              allow="autoplay"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
            Brak wideo
          </div>
        )}

        <EmojiCanvas
          roomCode={roomCode}
          isHost={isHost}
          isActive={true}
          winnerCountry={winner?.country}
        />

        {winner && (
          <div className="absolute top-6 right-6 z-30 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex flex-col w-64 animate-in fade-in duration-700">
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
        )}

        <div className="absolute bottom-0 left-0 right-0 z-20 h-32 flex justify-center items-end pb-8 gap-6 md:gap-10 pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          {players.map((player) => (
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
      </div>
    );
  }

  // SCOREBOARD
  return (
    <div className="h-screen w-full flex flex-col p-4 text-white overflow-hidden bg-black/40">
      <h1
        className="text-3xl lg:text-4xl font-bold text-center mb-4 shrink-0"
        style={{ textShadow: "0px 4px 10px rgba(0,0,0,0.5)" }}
      >
        {contest.name}
      </h1>

      {!showWinner && (
        <div className="flex justify-center mb-6 h-12 shrink-0">
          {currentVoterId ? (
            <div
              key={currentVoterId}
              className="flex items-center gap-4 bg-black/50 px-6 py-2 rounded-full border border-white/20 animate-in fade-in slide-in-from-top-4 duration-500"
            >
              <img
                src={
                  sortedPlayers[currentVoterIndex]?.avatar?.url ||
                  "/placeholder.png"
                }
                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                alt="Avatar"
              />
              <span className="text-lg font-bold">
                {sortedPlayers[currentVoterIndex]?.name} is voting...
              </span>
            </div>
          ) : (
            <div className="text-white/50 italic flex items-center h-full">
              Waiting for host to start the ceremony...
            </div>
          )}
        </div>
      )}

      <ScoreboardGrid
        calculatedEntries={calculatedEntries}
        showWinner={showWinner}
        videoEnded={videoEnded}
      />

      {isHost && !showWinner && (
        <div className="shrink-0 bg-black/80 p-4 rounded-2xl border border-white/20 flex justify-between items-center z-10 w-full max-w-7xl mx-auto mt-4">
          <div className="text-white font-mono flex flex-col">
            <span className="text-xs text-white/50 uppercase">
              Current Stage
            </span>
            <span className="font-bold">
              {currentVoterId
                ? `Voting: ${sortedPlayers[currentVoterIndex]?.name}`
                : "Waiting to start..."}
            </span>
          </div>
          <div className="flex gap-4">
            {!currentVoterId && (
              <Button
                onClick={() => setNextVoter(roomCode, sortedPlayers[0].id)}
              >
                Start Presentation
              </Button>
            )}

            {currentVoterId && (
              <>
                {!isFinishedRevealing ? (
                  <>
                    <button
                      onClick={() => revealAllPoints(roomCode)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600 rounded font-bold text-xs uppercase transition-colors"
                    >
                      Force Reveal All
                    </button>
                    <button
                      onClick={() =>
                        revealNextPoint(roomCode, revealedIndex + 1)
                      }
                      className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-600 rounded font-bold text-xs uppercase transition-colors"
                    >
                      Force Reveal {nextPointToReveal} pts
                    </button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      const nextIndex = currentVoterIndex + 1;
                      if (nextIndex >= sortedPlayers.length)
                        finishGame(roomCode);
                      else setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                    }}
                  >
                    {currentVoterIndex + 1 >= sortedPlayers.length
                      ? "Reveal Winner"
                      : `Next Voter: ${sortedPlayers[currentVoterIndex + 1]?.name}`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {currentPlayerId &&
        currentPlayerId === currentVoterId &&
        !isFinishedRevealing &&
        !showWinner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-linear-to-br from-pink-600 to-purple-700 p-1 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
              <div className="bg-black rounded-xl p-8 text-center flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-2 text-white">
                  It's your turn!
                </h2>

                {nextTargetEntry && (
                  <div className="mb-6 bg-white/10 px-6 py-3 rounded-xl border border-white/20">
                    <span className="text-sm text-white/70 block mb-1 uppercase tracking-widest">
                      You are giving
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-yellow-500">
                        {nextPointToReveal} pts
                      </span>
                      <span className="text-white/50">to</span>
                      <span
                        className={`fi fi-${getCountryCode(nextTargetEntry.country).toLowerCase()} text-2xl`}
                      ></span>
                      <span className="text-2xl font-bold text-white">
                        {nextTargetEntry.country}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => revealNextPoint(roomCode, revealedIndex + 1)}
                  className="bg-white text-black text-2xl font-black uppercase py-4 px-12 rounded-lg hover:scale-105 transition-transform active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  Reveal {nextPointToReveal} Points
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
