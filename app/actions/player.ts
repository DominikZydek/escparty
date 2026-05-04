"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { cookies } from "next/headers";

export async function getAvatars() {
  return await prisma.avatar.findMany();
}

export async function reconnectPlayer(roomCode: string) {
  const cookieStore = await cookies();
  const playerId = cookieStore.get("playerId")?.value;

  if (!playerId) return null;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      avatar: true,
      room: true,
    },
  });

  if (!player || player.room?.code !== roomCode) {
    cookieStore.delete("playerId");
    return null;
  }

  return player;
}

export async function joinGame(
  roomCode: string,
  playerName: string,
  avatarId: string,
) {
  if (!roomCode || !playerName || !avatarId) {
    throw new Error("Missing data");
  }

  const cookieStore = await cookies();
  const existingPlayerId = cookieStore.get("playerId")?.value;

  if (existingPlayerId) {
    const existingPlayer = await prisma.player.findUnique({
      where: { id: existingPlayerId },
      include: {
        avatar: true,
        room: true,
      },
    });

    if (existingPlayer && existingPlayer.room?.code === roomCode) {
      return existingPlayer;
    }
  }

  const newPlayer = await prisma.player.create({
    data: {
      name: playerName,
      room: {
        connect: { code: roomCode },
      },
      avatar: {
        connect: { id: avatarId },
      },
      isReady: false,
    },
    include: {
      avatar: true,
    },
  });

  cookieStore.set("playerId", newPlayer.id, {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  await pusherServer.trigger(`room-${roomCode}`, "player-joined", newPlayer);

  return newPlayer;
}

export async function removePlayer(playerId: string, roomCode: string) {
  try {
    await prisma.player.delete({
      where: { id: playerId },
    });

    await pusherServer.trigger(`room-${roomCode}`, "player-left", { playerId });

    const cookieStore = await cookies();
    cookieStore.delete("playerId");

    return { success: true };
  } catch (error) {
    console.error("Failed to remove player:", error);
    return { error: "Failed to remove player" };
  }
}
