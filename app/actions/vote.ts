'use server'

import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

type VoteItem = {
  entryId: string;
  points: number;
};

const ALLOWED_POINTS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 12]);

export async function submitVotes(playerId: string, votes: VoteItem[]) {
  if (!playerId || votes.length === 0) {
    throw new Error("Missing voting data.");
  }
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      room: true,
      votes: { select: { id: true } }
    }
  });

  if (!player) {
    throw new Error("Player not found.");
  }
  
  if (player.room.status !== 'VOTING') {
    throw new Error("Voting is not active.");
  }

  if (player.votes.length > 0) {
    throw new Error("You have already voted in this game!");
  }

  if (votes.length !== ALLOWED_POINTS.size) {
    throw new Error(`You must assign exactly ${ALLOWED_POINTS.size} votes.`);
  }

  const pointValues = votes.map(v => v.points);
  const uniquePoints = new Set(pointValues);

  const isValidSet = pointValues.every(p => ALLOWED_POINTS.has(p)) && 
                     uniquePoints.size === ALLOWED_POINTS.size;

  if (!isValidSet) {
    throw new Error("Invalid points distribution. Use standard Eurovision scale (1-8, 10, 12).");
  }

  const entryIds = new Set(votes.map(v => v.entryId));
  if (entryIds.size !== votes.length) {
    throw new Error("You cannot vote for the same song multiple times.");
  }

  try {
    await prisma.vote.createMany({
      data: votes.map((v) => ({
        playerId: playerId,
        entryId: v.entryId,
        points: v.points,
      })),
    });
  } catch (error) {
    console.error("Error saving votes:", error);
    throw new Error("Failed to save votes.");
  }

  await pusherServer.trigger(
    `room-${player.roomCode}`,
    'vote-cast',
    {
      playerId: player.id,
      playerName: player.name 
    }
  );

  return { success: true };
}