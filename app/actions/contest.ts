"use server";

import prisma from "@/lib/prisma";
import { fetchArtistImages } from "./image";

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

  // 1. Pobieramy zdjęcia dla wszystkich uczestników równolegle
  // Używamy Promise.all, aby nie czekać na każdego artystę po kolei.
  // 10 artystów pobierze się w czasie niemal identycznym co 1 artysta.
  const entriesWithImages = await Promise.all(
    entries.map(async (entry, index) => {
      // Wywołujemy nasz "Szperacz" dla każdego wpisu
      const fetchedImages = await fetchArtistImages(entry.artist, entry.country, false);
      
      return {
        id: entry.id,
        country: entry.country,
        artist: entry.artist,
        songTitle: entry.songTitle,
        videoUrl: formatYoutubeUrl(entry.videoUrl) || null,
        order: index + 1,
        imageUrls: fetchedImages, // <--- Dodajemy znalezione linki do obiektu
      };
    })
  );

  // 2. Zapisujemy konkurs do bazy danych
  const newContest = await prisma.contest.create({
    data: {
      name: contestName,
      year: new Date().getFullYear(),
      isOfficial: false,
      entries: {
        create: entriesWithImages, // Przekazujemy gotową tablicę ze zdjęciami
      },
    },
  });

  return newContest;
}
