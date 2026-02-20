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
  videoUrl?: string;
};

const formatYoutubeUrl = (url: string|undefined) => {
  const videoIdMatch = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );

  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }
  return url;
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
          videoUrl: formatYoutubeUrl(entry.videoUrl) || null,
          order: index + 1, // this is to be changed ig
        })),
      },
    },
  });

  return newContest;
}
