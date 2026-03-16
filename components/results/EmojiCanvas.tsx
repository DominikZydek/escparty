"use client";

import React, { useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { getCountryCode } from "@/lib/countries";

interface EmojiCanvasProps {
  roomCode: string;
  isHost: boolean;
  isActive: boolean;
  winnerCountry?: string | null;
}

export const EmojiCanvas: React.FC<EmojiCanvasProps> = ({
  roomCode,
  isHost,
  isActive,
  winnerCountry,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const isAnimatingRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>(0);
  const lastEmojiTimeRef = useRef<Record<string, number>>({});
  const flagImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (winnerCountry) {
      const img = new Image();
      const code = getCountryCode(winnerCountry).toLowerCase();
      img.src = `https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.0.0/flags/4x3/${code}.svg`;
      img.onload = () => {
        flagImgRef.current = img;
      };
    }
  }, [winnerCountry]);

  useEffect(() => {
    if (!isActive) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });

    const privateChannelName = `private-emojis-${roomCode}`;
    const privateChannel = pusher.subscribe(privateChannelName);

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
      if (isHost) window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      pusher.unsubscribe(privateChannelName);
    };
  }, [isActive, roomCode, isHost]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-40 pointer-events-none"
    />
  );
};
