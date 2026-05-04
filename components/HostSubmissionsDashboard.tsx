"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { openLobby } from "@/app/actions/room";
import {
  getRoomEntries,
  updateEntryImages,
  deleteEntry,
} from "@/app/actions/submissions";
import {
  Copy,
  Check,
  Lock,
  Users,
  Image as ImageIcon,
  RefreshCw,
  Music,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Entry } from "@prisma/client";
import { getCountryCode } from "@/lib/countries";

interface Props {
  roomCode: string;
  hostPin: string;
  contestName: string;
}

function interleaveArrays(arrays: string[][]): string[] {
  const result: string[] = [];
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

function fillToTarget(images: string[], target: number): string[] {
  if (images.length === 0) return [];
  const result: string[] = [];
  while (result.length < target) {
    result.push(...images);
  }
  return result.slice(0, target);
}

export default function HostSubmissionsDashboard({
  roomCode,
  hostPin,
  contestName,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [submitLink, setSubmitLink] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setSubmitLink(`${window.location.origin}/submit/${roomCode}`);
    fetchEntries();

    const interval = setInterval(fetchEntries, 10000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const fetchEntries = async () => {
    const data = await getRoomEntries(roomCode);
    setEntries(data);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(submitLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLobby = async () => {
    if (
      confirm(
        "Are you sure? This will close submissions and open the room for players to join the party!",
      )
    ) {
      await openLobby(roomCode);
      window.location.reload();
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      const result = await deleteEntry(entryId);
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      } else {
        alert("Failed to delete entry.");
      }
    }
  };

  const fetchImagesFromExtension = (artist: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const listener = (event: MessageEvent) => {
        if (event.source !== window || !event.data) return;

        if (
          event.data.type === "FETCH_LASTFM_IMAGES_RESULT" &&
          event.data.artist === artist
        ) {
          window.removeEventListener("message", listener);
          resolve(
            event.data.images && event.data.images.length > 0
              ? event.data.images
              : ["/fallback-postcard.png"],
          );
        }
      };

      window.addEventListener("message", listener);
      window.postMessage({ type: "FETCH_LASTFM_IMAGES", artist }, "*");

      setTimeout(() => {
        window.removeEventListener("message", listener);
        resolve(["/fallback-postcard.png"]);
      }, 10000);
    });
  };

  const processArtistImages = async (artist: string): Promise<string[]> => {
    const TARGET_COUNT = 15;
    const uniqueImages: string[] = [];

    const addUniqueImages = (newImages: string[]) => {
      for (const img of newImages) {
        if (
          !img.includes("fallback-postcard.png") &&
          !uniqueImages.includes(img)
        ) {
          uniqueImages.push(img);
          if (uniqueImages.length >= TARGET_COUNT) break;
        }
      }
    };

    const initialImages = await fetchImagesFromExtension(artist);
    addUniqueImages(initialImages);

    if (uniqueImages.length >= TARGET_COUNT) {
      return uniqueImages.slice(0, TARGET_COUNT);
    }

    const splitRegex = /\s+(?:ft\.|feat\.|feat|&|x|and)\s+|,\s*/i;

    if (splitRegex.test(artist)) {
      const individualArtists = artist
        .split(splitRegex)
        .map((a) => a.trim())
        .filter(Boolean);

      if (individualArtists.length > 1) {
        const results = await Promise.all(
          individualArtists.map((a) => fetchImagesFromExtension(a)),
        );
        const validResults = results.map((arr) =>
          arr.filter((img) => !img.includes("fallback-postcard.png")),
        );
        const interleaved = interleaveArrays(validResults);

        addUniqueImages(interleaved);
      }
    }

    if (uniqueImages.length === 0) {
      return Array(TARGET_COUNT).fill("/fallback-postcard.png");
    }

    return fillToTarget(uniqueImages, TARGET_COUNT);
  };

  const handleSyncImages = async () => {
    setIsSyncing(true);
    const pendingEntries = entries.filter(
      (e) =>
        !e.imagesFetched || e.imageUrls?.includes("/fallback-postcard.png"),
    );

    for (const entry of pendingEntries) {
      console.log(`Fetching imgs for: ${entry.artist}...`);

      const finalImages = await processArtistImages(entry.artist);

      await updateEntryImages(entry.id, finalImages);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entry.id
            ? { ...e, imagesFetched: true, imageUrls: finalImages }
            : e,
        ),
      );

      await new Promise((res) => setTimeout(res, 1000));
    }

    setIsSyncing(false);
  };

  const syncCount = entries.filter(
    (e) => !e.imagesFetched || e.imageUrls?.includes("/fallback-postcard.png"),
  ).length;

  return (
    <div className="min-h-screen w-full flex flex-col p-6 text-white overflow-hidden bg-black/50">
      <h1 className="text-3xl lg:text-4xl font-bold text-center mb-8 drop-shadow-lg shrink-0">
        Dashboard: <span className="text-pink-500">{contestName}</span>
      </h1>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-black/80 border border-white/20 p-8 rounded-3xl backdrop-blur-md flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent pointer-events-none" />

          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
            <Users className="text-cyan-400" /> Invite Friends
          </h2>

          <p className="text-white/60 mb-2 text-sm relative z-10">
            Send this link to your friends so they can submit their songs:
          </p>
          <div className="flex items-center gap-2 mb-8 bg-white/5 p-2 rounded-xl border border-white/10 relative z-10">
            <input
              type="text"
              readOnly
              value={submitLink}
              className="bg-transparent text-white/90 font-mono text-sm w-full outline-none px-2 selection:bg-pink-500/50"
            />
            <button
              onClick={copyToClipboard}
              className="bg-white/10 hover:bg-white/20 p-3 rounded-lg transition-colors text-white"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check size={20} className="text-cyan-400" />
              ) : (
                <Copy size={20} />
              )}
            </button>
          </div>

          <h2 className="text-xl font-bold mb-4 mt-auto flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
            <Lock className="text-pink-500" /> Host Credentials
          </h2>
          <p className="text-white/60 mb-4 text-sm leading-relaxed relative z-10">
            Save these details! You will need them to return to this dashboard
            later.
          </p>

          <div className="flex gap-4 relative z-10">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-white/50 text-xs uppercase tracking-widest mb-1">
                Room Code
              </span>
              <span className="font-mono text-2xl font-black text-cyan-400">
                {roomCode}
              </span>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
              <span className="text-white/50 text-xs uppercase tracking-widest mb-1">
                Host PIN
              </span>
              <span className="font-mono text-2xl font-black text-pink-500">
                {hostPin}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/80 border border-white/20 p-8 rounded-3xl backdrop-blur-md flex flex-col shadow-2xl relative overflow-hidden h-150 lg:h-auto">
          <div className="absolute inset-0 bg-linear-to-br from-pink-500/5 to-transparent pointer-events-none" />

          <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2">
              Submissions ({entries.length})
            </h2>

            <button
              onClick={handleSyncImages}
              disabled={isSyncing || syncCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
                syncCount > 0
                  ? "bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_15px_rgba(235,2,115,0.4)]"
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
            >
              <RefreshCw
                size={16}
                className={isSyncing ? "animate-spin" : ""}
              />
              {isSyncing
                ? "Syncing..."
                : syncCount > 0
                  ? `Sync Missing (${syncCount})`
                  : "All Synced"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative z-10 custom-scrollbar mb-6">
            {entries.length === 0 ? (
              <div className="h-full flex items-center justify-center flex-col text-center opacity-50">
                <Music size={40} className="mb-4" />
                <p className="italic font-light mb-2">Waiting for entries...</p>
                <p className="text-xs">
                  Once your friends submit their songs, they will appear here.
                </p>
              </div>
            ) : (
              entries.map((entry) => {
                const hasRealImages =
                  entry.imagesFetched &&
                  !entry.imageUrls?.includes("/fallback-postcard.png");

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span
                        className={`fi fi-${getCountryCode(entry.country).toLowerCase()} text-2xl shrink-0 rounded-sm shadow-sm`}
                      ></span>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-white truncate">
                          {entry.country}
                        </span>
                        <span className="text-xs text-white/60 truncate">
                          {entry.artist} - {entry.songTitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4 bg-black/50 px-3 py-2 rounded-lg border border-white/5">
                      <div
                        className="flex flex-col items-center justify-center"
                        title="YouTube Link"
                      >
                        <span className="text-[10px] text-white/40 font-mono uppercase mb-0.5">
                          Video
                        </span>
                        <Check size={16} className="text-cyan-400" />
                      </div>

                      <div className="w-px h-6 bg-white/10"></div>

                      <div
                        className="flex flex-col items-center justify-center"
                        title={
                          hasRealImages ? "Images Found" : "No Images Found"
                        }
                      >
                        <span className="text-[10px] text-white/40 font-mono uppercase mb-0.5">
                          Images
                        </span>
                        {entry.imagesFetched ? (
                          hasRealImages ? (
                            <Check size={16} className="text-pink-500" />
                          ) : (
                            <AlertTriangle
                              size={16}
                              className="text-yellow-500"
                            />
                          )
                        ) : (
                          <ImageIcon size={16} className="text-white/30" />
                        )}
                      </div>

                      <div className="w-px h-6 bg-white/10 mx-1"></div>

                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-white/30 hover:text-red-500 transition-colors p-1"
                        title="Delete Entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-white/10 relative z-10 shrink-0">
            <Button
              onClick={handleOpenLobby}
              disabled={isSyncing}
              className="w-full"
            >
              Close Submissions & Open Lobby
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
