"use server";

import prisma from "@/lib/prisma";
import { getEnglishName } from "@/lib/countries";

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
  imageUrls?: string[];
};

const formatYoutubeUrl = (url: string | undefined) => {
  const videoIdMatch = url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  );

  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }
  return url;
};

export async function createCustomContest(contestName: string) {
  if (!contestName.trim()) {
    throw new Error("Missing contest name");
  }

  const newContest = await prisma.contest.create({
    data: {
      name: contestName.trim(),
      year: new Date().getFullYear(),
      isOfficial: false,
    },
  });

  return newContest;
}