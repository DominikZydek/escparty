"use server";

import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

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

    await prisma.gameRoom.create({
        data: {
            code: roomCode,
            status: "LOBBY",
            contest: {
                connect: { id: contestId }
            }
        }
    });

    redirect(`/room/${roomCode}`);
}