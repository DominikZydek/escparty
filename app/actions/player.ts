"use server";

import prisma from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";
import { cookies } from "next/headers";

export async function getAvatars() {
    return await prisma.avatar.findMany();
}

export async function joinGame(roomCode: string, playerName: string, avatarId: string) {
    if (!roomCode || !playerName || !avatarId) {
        throw new Error("Missing data");
    }

    // create a player
    const newPlayer = await prisma.player.create({
        data: {
            name: playerName,
            room: {
                connect: { code: roomCode }
            },
            avatar: {
                connect: { id: avatarId }
            },
            isReady: false
        },
        include: {
            avatar: true
        }
    });

    const cookieStore = await cookies();
    cookieStore.set('playerId', newPlayer.id, {
        secure: true,
        sameSite: 'lax',
        path: '/'
    });

    // dispatch event
    await pusherServer.trigger(
        `room-${roomCode}`,
        'player-joined',
        newPlayer
    );

    return newPlayer;
}