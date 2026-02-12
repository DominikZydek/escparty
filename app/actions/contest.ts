"use server";

import prisma from "@/lib/prisma";

export async function getContests() {
  const contests = prisma.contest.findMany({
    where: {
      isOfficial: true,
    },
  });
  return contests;
}

type EntryInput = {
  id: string;
  country: string;
  artist: string;
  songTitle: string;
};

export async function createCustomContest(
  contestName: string,
  entries: EntryInput[],
) {
  if (!contestName || entries.length === 0) {
    throw new Error("Missing contest name or entries");
  }

  const newContest = await prisma.contest.create({
    data: {
      name: contestName,
      year: new Date().getFullYear(),
      isOfficial: false,
      entries: {
        create: entries.map((entry, index) => ({
          id: entry.id,
          country: entry.country,
          artist: entry.artist,
          songTitle: entry.songTitle,
          order: index + 1, // this is to be changed ig
        })),
      },
    },
  });

  return newContest;
}
