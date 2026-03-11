"use client";

import { getCountryCode } from "@/lib/countries";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Pusher from "pusher-js";
import clsx from "clsx";
import { Player, Vote, Entry as PrismaEntry } from "@prisma/client";
import Button from "@/components/Button";
import { setNextVoter, revealTwelve, finishGame } from "@/app/actions/room";
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

const AVAILABLE_EMOJIS = ["flag", "❤️", "🔥", "👏", "🤯", "💩"];

export default function ResultsScreen({
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
  const [twelveRevealed, setTwelveRevealed] = useState(false);

  const privateChannelRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(true);
  const lastEmojiTimeRef = useRef<Record<string, number>>({});
  const flagImgRef = useRef<HTMLImageElement | null>(null);

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

  useEffect(() => {
    if (winner) {
      const img = new Image();
      const code = getCountryCode(winner.country).toLowerCase();
      // Pobieramy obrazek z tego samego źródła, którego używa Twój <span>
      img.src = `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/${code}.svg`;
      img.onload = () => {
        flagImgRef.current = img;
      };
    }
  }, [winner]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  );
  const currentVoterIndex = useMemo(() => {
    if (!currentVoterId) return -1;
    return sortedPlayers.findIndex((p) => p.id === currentVoterId);
  }, [sortedPlayers, currentVoterId]);

  const calculatedEntries = useMemo(() => {
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
        setTwelveRevealed(false);
        setCurrentVoterId(data.currentVoterId);
      },
    );
    publicChannel.bind("twelve-revealed", () => setTwelveRevealed(true));
    publicChannel.bind("game-finished", () => {
      setShowWinner(true);
      pauseBackgroundMusic();
    });

    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
      pusher.disconnect();
    };
  }, [roomCode]);

  useEffect(() => {
    if (!showWinner || videoEnded) return;

    isActiveRef.current = true;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });

    const privateChannelName = `private-emojis-${roomCode}`;
    const privateChannel = pusher.subscribe(privateChannelName);
    privateChannelRef.current = privateChannel;

    const startCanvasLoop = () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;

      const canvas = canvasRef.current;
      if (!canvas) {
        isAnimatingRef.current = false;
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        isAnimatingRef.current = false;
        return;
      }

      let lastTime = performance.now();

      const animate = (time: number) => {
        if (!isActiveRef.current) return;

        const dt = time - lastTime;
        lastTime = time;

        if (particlesRef.current.length === 0) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          isAnimatingRef.current = false;
          return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const activeParticles = [];

        for (const p of particlesRef.current) {
          p.timeAlive += dt;
          if (p.timeAlive >= p.lifeSpan) continue;

          const progress = p.timeAlive / p.lifeSpan;
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const opacity = progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1;
          const scale = 1 + progress * 0.5;

          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.translate(p.x, p.y);
          ctx.scale(scale, scale);

          if (p.emoji === "WINNER_FLAG" && flagImgRef.current) {
            ctx.drawImage(flagImgRef.current, -20, -15, 40, 30);
          } else {
            ctx.font = "40px Arial";
            ctx.textAlign = "center";
            ctx.fillText(p.emoji, 0, 0);
          }

          ctx.restore();
          activeParticles.push(p);
        }

        particlesRef.current = activeParticles;
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (isHost) {
      privateChannel.bind(
        "client-emoji-tapped",
        (data: { playerId: string; emoji: string }) => {
          const now = Date.now();
          const lastTap = lastEmojiTimeRef.current[data.playerId] || 0;
          if (now - lastTap < 150) return;
          lastEmojiTimeRef.current[data.playerId] = now;

          const container = document.getElementById(
            `avatar-container-${data.playerId}`,
          );
          const rect = container?.getBoundingClientRect();
          const startX = rect
            ? rect.left + rect.width / 2
            : window.innerWidth / 2;
          const startY = rect ? rect.top : window.innerHeight - 100;

          const burstCount = Math.floor(Math.random() * 3) + 2;

          for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
              particlesRef.current.push({
                emoji: data.emoji,
                x: startX + (Math.random() * 40 - 20),
                y: startY,
                vx: (Math.random() - 0.5) * 0.1,
                vy: -0.3 - Math.random() * 0.2,
                timeAlive: 0,
                lifeSpan: 1200 + Math.random() * 600,
              });
              if (!isAnimatingRef.current) startCanvasLoop();
            }, i * 100);
          }
        },
      );
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    if (isHost) {
      window.addEventListener("resize", handleResize);
      handleResize();
    }

    return () => {
      isActiveRef.current = false;
      if (isHost) window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      pusher.unsubscribe(privateChannelName);
      pusher.disconnect();
    };
  }, [showWinner, videoEnded, roomCode, isHost]);

  // video
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

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-40 pointer-events-none"
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

  // scoreboard
  const rowsPerColumn = Math.ceil(calculatedEntries.length / 2);

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

      <div
        className={`flex-1 min-h-0 w-full max-w-7xl mx-auto ${showWinner && videoEnded ? "mb-36" : ""}`}
      >
        <div className="results-grid">
          {calculatedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={clsx(
                "flex items-center px-3 py-1 rounded border relative overflow-hidden min-h-9 transition-all duration-700 ease-in-out",
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
                  <span
                    className={`mr-2 fi fi-${getCountryCode(entry.country)}`}
                  ></span>
                  {entry.country}
                </div>
                <div className="text-xs opacity-60 truncate mt-0.5">
                  {entry.artist}
                </div>
              </div>

              <div
                className="absolute left-0 top-0 bottom-0 bg-white/5 z-0 origin-left transition-all duration-1000 ease-out"
                style={{
                  width: `${calculatedEntries[0]?.points > 0 ? (entry.points / calculatedEntries[0].points) * 100 : 0}%`,
                }}
              />

              {entry.currentPointsToAdd && (
                <div
                  className={clsx(
                    "z-10 mr-4 font-black text-lg px-2 py-0.5 rounded animate-in zoom-in duration-300",
                    entry.currentPointsToAdd === 12
                      ? "bg-yellow-500 text-black animate-pulse"
                      : "bg-purple-600 text-white",
                  )}
                >
                  +{entry.currentPointsToAdd}
                </div>
              )}

              <div
                key={entry.points}
                className="text-2xl md:text-3xl font-mono font-bold w-16 text-right z-10 shrink-0 animate-in fade-in zoom-in-90 duration-300"
              >
                {entry.points}
              </div>
            </div>
          ))}
        </div>
      </div>

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
                <button
                  onClick={() => revealTwelve(roomCode)}
                  className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-500 hover:text-white border border-yellow-600 rounded font-bold text-xs uppercase transition-colors"
                  disabled={twelveRevealed}
                >
                  Force Reveal 12
                </button>
                <Button
                  onClick={() => {
                    const nextIndex = currentVoterIndex + 1;
                    const isFinished = nextIndex >= sortedPlayers.length;
                    if (isFinished) finishGame(roomCode);
                    else setNextVoter(roomCode, sortedPlayers[nextIndex].id);
                  }}
                  disabled={!twelveRevealed}
                >
                  {currentVoterIndex + 1 >= sortedPlayers.length
                    ? "Reveal Winner"
                    : `Next Voter: ${sortedPlayers[currentVoterIndex + 1]?.name}`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {currentPlayerId &&
        currentPlayerId === currentVoterId &&
        !twelveRevealed &&
        !showWinner && (
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
        )}
    </div>
  );
}
