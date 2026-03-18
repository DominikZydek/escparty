"use server";

import prisma from "@/lib/prisma";

export async function parseSubmission(youtubeUrl: string) {
  try {
    // get yt title
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const ytResponse = await fetch(oembedUrl);

    if (!ytResponse.ok) {
      return {
        error: "No info about the video. Make sure the link is public.",
      };
    }

    const ytData = await ytResponse.json();
    let rawTitle = ytData.title || "";

    // parse link
    let cleanTitle = rawTitle.split("|")[0];
    cleanTitle = cleanTitle.replace(/\s*[\(\[【].*?[\)\]】]\s*/g, " ");
    cleanTitle = cleanTitle.replace(
      /official video|music video|lyric video|official audio|live|eurovision(?: \d{4})?/gi,
      " ",
    );
    cleanTitle = cleanTitle.trim();

    let guessedArtist = "";
    let guessedSong = cleanTitle;

    const dashMatch = cleanTitle.match(/\s+[-–—~]\s+/);

    if (dashMatch) {
      const splitIndex = dashMatch.index;
      guessedArtist = cleanTitle.substring(0, splitIndex!).trim();
      guessedSong = cleanTitle
        .substring(splitIndex! + dashMatch[0].length)
        .trim();
    } else if (cleanTitle.includes("-")) {
      const parts = cleanTitle.split("-");
      guessedArtist = parts[0].trim();
      guessedSong = parts.slice(1).join("-").trim();
    }

    guessedSong = guessedSong.replace(/^["'„”]|["'„”]$/g, "").trim();

    // itunes api verification
    const searchQuery = encodeURIComponent(`${guessedArtist} ${guessedSong}`);
    const itunesUrl = `https://itunes.apple.com/search?term=${searchQuery}&entity=song&limit=1`;

    const itunesResponse = await fetch(itunesUrl);
    let isItunesMatch = false;

    if (itunesResponse.ok) {
      const itunesData = await itunesResponse.json();
      if (itunesData.results && itunesData.results.length > 0) {
        guessedArtist = itunesData.results[0].artistName;
        guessedSong = itunesData.results[0].trackName;
        isItunesMatch = true;
      }
    }

    return {
      success: true,
      data: {
        artist: guessedArtist,
        songTitle: guessedSong,
        videoUrl: youtubeUrl,
        isItunesMatch,
      },
    };
  } catch (error) {
    console.error("Parse error:", error);
    return { error: "Error" };
  }
}

function formatYoutubeUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\/shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  
  return url;
}

export async function submitFinalEntry(
  roomCode: string, 
  country: string, 
  artist: string, 
  songTitle: string, 
  videoUrl: string
) {
  try {
    const room = await prisma.gameRoom.findUnique({
      where: { code: roomCode },
      select: { contestId: true, status: true }
    });

    if (!room || room.status !== "SUBMISSIONS_OPEN") {
      return { error: "Room does not exist." };
    }

    const safeEmbedUrl = formatYoutubeUrl(videoUrl);

    await prisma.entry.create({
      data: {
        country,
        artist,
        songTitle,
        videoUrl: safeEmbedUrl,
        contestId: room.contestId,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Submit error:", error);
    return { error: "Could not save entry." };
  }
}

export async function getRoomEntries(roomCode: string) {
  const room = await prisma.gameRoom.findUnique({
    where: { code: roomCode },
    select: { contestId: true },
  });

  if (!room) return [];

  return await prisma.entry.findMany({
    where: { contestId: room.contestId },
  });
}

export async function updateEntryImages(entryId: string, imageUrls: string[]) {
  await prisma.entry.update({
    where: { id: entryId },
    data: {
      imageUrls: imageUrls,
      imagesFetched: true,
    },
  });
  return { success: true };
}

export async function deleteEntry(entryId: string) {
  try {
    await prisma.entry.delete({
      where: { id: entryId }
    });
    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { error: "Failed to delete entry" };
  }
}