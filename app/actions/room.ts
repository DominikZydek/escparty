"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { cookies } from "next/headers";

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

export async function startRunningOrderDraw(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: "RUNNING_ORDER" },
  });

  await pusherServer.trigger(`room-${roomCode}`, "room-updated", {
    status: "RUNNING_ORDER",
  });
}

export async function endVoting(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: "RESULTS" },
  });

  await pusherServer.trigger(`room-${roomCode}`, "show-results", {
    redirectUrl: `/room/${roomCode}`,
  });
}

export async function setNextVoter(roomCode: string, voterId: string | null) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { currentVoterId: voterId },
  });

  await pusherServer.trigger(`room-${roomCode}`, "voter-changed", {
    currentVoterId: voterId,
  });
}

export async function revealTwelve(roomCode: string) {
  await pusherServer.trigger(`room-${roomCode}`, "twelve-revealed", {});
}

export async function startShow(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: "WATCHING" },
  });

  // notify all clients to refresh and load the Watching screen
  await pusherServer.trigger(`room-${roomCode}`, "show-started", {
    redirectUrl: `/room/${roomCode}`,
  });
}

export async function playEntry(roomCode: string, entryId: string | null) {
  if (entryId === "flag-parade") {
    await pusherServer.trigger(`room-${roomCode}`, "video-changed", {
      entryId,
    });
    return;
  }
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { currentEntryId: entryId },
  });

  // notify clients that the video has changed so they can update their UI
  await pusherServer.trigger(`room-${roomCode}`, "video-changed", { entryId });
}

export async function startVoting(roomCode: string) {
  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: {
      status: "VOTING",
      currentEntryId: null, // clear the video screen
    },
  });

  // notify clients to move to the voting form
  await pusherServer.trigger(`room-${roomCode}`, "voting-started", {
    redirectUrl: `/room/${roomCode}`,
  });
}

export async function finishGame(roomCode: string) {
  try {
    await pusherServer.trigger(`room-${roomCode}`, "game-finished", {});
    return { success: true };
  } catch (error) {
    console.error("Failed to finish game:", error);
    return { error: "Failed to finish game" };
  }
}

export async function saveRunningOrderAndStart(
  roomCode: string,
  orderedEntryIds: string[],
) {
  const updatePromises = orderedEntryIds.map((id, index) =>
    prisma.entry.update({
      where: { id },
      data: { order: index + 1 },
    }),
  );
  await Promise.all(updatePromises);

  await prisma.gameRoom.update({
    where: { code: roomCode },
    data: { status: "WATCHING" },
  });

  await pusherServer.trigger(`room-${roomCode}`, "room-updated", {
    status: "WATCHING",
  });

  return { success: true };
}
