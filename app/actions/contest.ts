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

// Zaktualizowany typ - teraz przyjmuje też gotową tablicę imageUrls
type EntryInput = {
  id: string;
  country: string;
  artist: string;
  songTitle: string;
  videoUrl?: string;
  imageUrls?: string[]; // <--- DODANE
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

export async function createCustomContest(
  contestName: string,
  entries: EntryInput[],
) {
  if (!contestName || entries.length === 0) {
    throw new Error("Missing contest name or entries");
  }

  // Po prostu formatujemy dane pod Prismę (zero fetchowania po API!)
  const formattedEntries = entries.map((entry, index) => {
    return {
      id: entry.id,
      country: getEnglishName(entry.country),
      artist: entry.artist,
      songTitle: entry.songTitle,
      videoUrl: formatYoutubeUrl(entry.videoUrl) || null,
      order: index + 1,
      // Używamy tego co przyszło z frontendu (z wtyczki), a jak nie ma, dajemy fallback:
      imageUrls: entry.imageUrls && entry.imageUrls.length > 0 
        ? entry.imageUrls 
        : Array(15).fill("/fallback-postcard.png"),
    };
  });

  const newContest = await prisma.contest.create({
    data: {
      name: contestName,
      year: new Date().getFullYear(),
      isOfficial: false,
      entries: {
        create: formattedEntries,
      },
    },
  });

  return newContest;
}