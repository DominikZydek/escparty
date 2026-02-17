"use server";

import prisma from "@/lib/prisma";
import { GameStatus } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";
import { cookies } from "next/headers";
import { revalidatePath } from 'next/cache';

const generateRoomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function createRoom(contestId: string) {
  let roomCode = "";
  let isUnique = false;

  while (!isUnique) {
    roomCode = generateRoomCode();
    const existing = await prisma.gameRoom.findUnique({
      where: { code: roomCode },
    });
    if (!existing) isUnique = true;
  }

  const room = await prisma.gameRoom.create({
    data: {
      code: roomCode,
      contestId: contestId,
      status: "LOBBY",
    },
  });

  const cookieStore = await cookies();

  cookieStore.set("host_access", room.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return room;
}

export async function validateRoom(code: string) {
  const room = await prisma.gameRoom.findUnique({
    where: { code },
    select: { status: true },
  });

  if (!room) {
    return { error: "Room not found." };
  }

  if (room.status === "RESULTS") {
    return { error: "Game has finished." };
  }

  if (room.status === "VOTING") {
    return { error: "Game in progress. Too late to join!" };
  }

  return { success: true };
}

export async function startGame(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: "VOTING" },
  });

  await pusherServer.trigger(`room-${roomCode}`, "game-started", {
    redirectUrl: `/room/${roomCode}`,
  });
}

export async function endVoting(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: 'RESULTS' }
  });

  await pusherServer.trigger(
    `room-${roomCode}`,
    'show-results',
    { redirectUrl: `/room/${roomCode}` }
  );
}

export async function setNextVoter(roomCode: string, voterId: string | null) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { currentVoterId: voterId }
  });

  await pusherServer.trigger(`room-${roomCode}`, 'voter-changed', { 
    currentVoterId: voterId 
  });
}

export async function revealTwelve(roomCode: string) {
  await pusherServer.trigger(`room-${roomCode}`, 'twelve-revealed', {});
}
