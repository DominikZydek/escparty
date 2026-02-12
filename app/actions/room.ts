"use server";

import prisma from "@/lib/prisma";
import { GameStatus } from "@prisma/client";

const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

export async function createRoom(contestId: string) {
    const roomCode = generateRoomCode();

    const room = await prisma.gameRoom.create({
        data: {
            code: roomCode,
            status: "LOBBY",
            contest: {
                connect: { id: contestId }
            }
        }
    });

    return room;
}

export async function validateRoom(code: string) {
  const room = await prisma.gameRoom.findUnique({
    where: { code },
    select: { status: true }
  });

  if (!room) {
    return { error: "Room not found." };
  }

  if (room.status === 'RESULTS') {
    return { error: "Game has finished." };
  }

  if (room.status === 'VOTING') {
    return { error: "Game in progress. Too late to join!" };
  }

  return { success: true };
}