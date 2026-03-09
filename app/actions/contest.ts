"use server";

import prisma from "@/lib/prisma";
import { fetchArtistImages } from "./image";
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

  const entriesWithImages = await Promise.all(
    entries.map(async (entry, index) => {
      const fetchedImages = await fetchArtistImages(entry.artist);
      
      return {
        id: entry.id,
        country: getEnglishName(entry.country),
        artist: entry.artist,
        songTitle: entry.songTitle,
        videoUrl: formatYoutubeUrl(entry.videoUrl) || null,
        order: index + 1,
        imageUrls: fetchedImages,
      };
    })
  );

  const newContest = await prisma.contest.create({
    data: {
      name: contestName,
      year: new Date().getFullYear(),
      isOfficial: false,
      entries: {
        create: entriesWithImages,
      },
    },
  });

  return newContest;
}
