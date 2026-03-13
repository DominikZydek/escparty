"use client";

import BackArrow from "@/components/BackArrow";
import { useState, useRef, useEffect } from "react";
import EntryRow from "./EntryRow";
import { v4 as uuidv4 } from "uuid";
import Button from "./Button";
import { createCustomContest } from "@/app/actions/contest";
import { createRoom } from "@/app/actions/room";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, GripVertical, Pencil } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

interface CustomContestSetupProps {
  onBack: () => void;
}

// img helper functions
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

// extension
const fetchImagesViaExtension = (artist: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.data?.type === "FETCH_LASTFM_IMAGES_RESULT" &&
        event.data?.artist === artist
      ) {
        window.removeEventListener("message", handleMessage);
        resolve(event.data.images || []);
      }
    };

    window.addEventListener("message", handleMessage);
    window.postMessage({ type: "FETCH_LASTFM_IMAGES", artist }, "*");

    setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      resolve([]);
    }, 4000);
  });
};

async function processArtistImages(artist: string): Promise<string[]> {
  const TARGET_COUNT = 15;
  let images = await fetchImagesViaExtension(artist);

  if (images.length >= 3) {
    return fillToTarget(images, TARGET_COUNT);
  }

  const splitRegex = /\s+(?:ft\.|feat\.|feat|&|x|,|and)\s+/i;
  if (splitRegex.test(artist)) {
    const individualArtists = artist
      .split(splitRegex)
      .map((a) => a.trim())
      .filter(Boolean);

    if (individualArtists.length > 1) {
      const results = await Promise.all(
        individualArtists.map((a) => fetchImagesViaExtension(a)),
      );
      const combinedImages = interleaveArrays(results);

      if (combinedImages.length > 0) {
        return fillToTarget(combinedImages, TARGET_COUNT);
      }
    }
  }

  if (images.length === 0) {
    return Array(TARGET_COUNT).fill("/fallback-postcard.png");
  }
  return fillToTarget(images, TARGET_COUNT);
}
// -----------------------------------------------------------

export default function CustomContestSetup({
  onBack,
}: CustomContestSetupProps) {
  const router = useRouter();

  const [contestName, setContestName] = useState("Custom contest");
  const [entries, setEntries] = useState([
    {
      id: uuidv4(),
      country: "",
      artist: "",
      songTitle: "",
      videoUrl: "",
      isHidden: false,
    },
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loadingText, setLoadingText] = useState("Creating Lobby...");
  const [hasExtension, setHasExtension] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkExtension = () => {
      const handlePong = (event: MessageEvent) => {
        if (
          event.source === window &&
          event.data?.type === "CHECK_EXTENSION_PONG"
        ) {
          setHasExtension(true);
          window.removeEventListener("message", handlePong);
        }
      };

      window.addEventListener("message", handlePong);

      // PING extension
      window.postMessage({ type: "CHECK_EXTENSION_PING" }, "*");

      // no PONG, no extension
      setTimeout(() => {
        setHasExtension((prev) => (prev === null ? false : prev));
        window.removeEventListener("message", handlePong);
      }, 1000);
    };

    if (isMounted) {
      checkExtension();
    }
  }, [isMounted]);

  const handleUpdate = (id: string, field: string, value: any) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddRow = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: uuidv4(),
        country: "",
        artist: "",
        songTitle: "",
        videoUrl: "",
        isHidden: false,
      },
    ]);
  };

  const handleDelete = (id: string) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(entries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setEntries(items);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const hideData = window.confirm(
      "Do you want to hide the imported entries from viewers?",
    );

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedEntries = results.data.map((row: any) => {
          const getVal = (keywords: string[]) => {
            const key = Object.keys(row).find((k) =>
              keywords.some((kw) => k.toLowerCase().includes(kw)),
            );
            return key ? row[key].trim() : "";
          };

          return {
            id: uuidv4(),
            country: getVal(["country"]),
            artist: getVal(["artist"]),
            songTitle: getVal(["song", "title"]),
            videoUrl: getVal(["youtube", "link", "video", "url"]),
            isHidden: hideData,
          };
        });

        if (importedEntries.length > 0) {
          setEntries(importedEntries);
        } else {
          alert("No valid data found in the CSV file.");
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to read the file.");
      },
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleCreateGame = async () => {
    if (!contestName.trim()) return alert("Enter contest name");

    setIsCreating(true);
    setLoadingText("Fetching images via extension...");

    try {
      // use extension to get pics
      const entriesWithImages = await Promise.all(
        entries.map(async (entry) => {
          const fetchedImages = await processArtistImages(entry.artist);
          return {
            id: entry.id,
            country: entry.country,
            artist: entry.artist,
            songTitle: entry.songTitle,
            videoUrl: entry.videoUrl,
            imageUrls: fetchedImages,
          };
        }),
      );

      setLoadingText("Saving contest...");

      const contest = await createCustomContest(contestName, entriesWithImages);
      const room = await createRoom(contest.id);
      router.push(`/room/${room.code}?mode=host`);
    } catch (error) {
      console.error("Failed to create contest", error);
      alert("Something went wrong");
      setIsCreating(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="h-full w-full max-w-4xl flex flex-col gap-6 mx-auto">
      {hasExtension === false && (
        <div className="shrink-0 bg-red-500/20 border border-red-500/50 rounded-xl p-5 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-white text-lg">
            <strong>Extension needed!</strong> To get automatically generated
            postcards, please visit:
          </p>
          <a
            href="https://chromewebstore.google.com/detail/PLACEHOLDER"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg"
          >
            Download Extension
          </a>
        </div>
      )}

      <div className="shrink-0 flex justify-between items-center text-white mb-4 gap-6">
        <div className="relative flex items-center flex-1 group">
          <input
            type="text"
            value={contestName}
            onChange={(e) => setContestName(e.target.value)}
            placeholder="Name your contest..."
            disabled={isCreating}
            className="text-2xl font-bold bg-white/10 border border-white/20 hover:border-white/40 hover:bg-white/15 focus:border-pink-500 focus:bg-black/50 rounded-xl outline-none transition-all w-full py-2 pl-4 pr-12 shadow-inner placeholder:text-white/30 disabled:opacity-50 truncate"
          />
          <Pencil
            size={20}
            className="absolute right-4 text-white/30 group-hover:text-white/70 pointer-events-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={triggerFileInput}
            disabled={isCreating}
            className="flex items-center gap-2 text-sm font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/20 disabled:opacity-50"
          >
            <Upload size={16} />
            Import CSV
          </button>
          <span className="text-white/50 text-sm font-mono bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
            {entries.length} entries
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="entries-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col"
              >
                {entries.map((entry, index) => (
                  <Draggable
                    key={entry.id}
                    draggableId={entry.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging
                            ? "shadow-2xl scale-[1.02] z-50 rounded-lg ring-2 ring-purple-500"
                            : ""
                        }`}
                      >
                        <EntryRow
                          index={index}
                          entry={entry}
                          mode="edit"
                          onUpdate={(field, val) =>
                            handleUpdate(entry.id, field, val)
                          }
                          onDelete={() => handleDelete(entry.id)}
                          dragHandleProps={provided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="shrink-0 flex flex-col gap-4 mt-auto items-center pt-4 border-t border-white/10 pb-1">
        <button
          onClick={handleAddRow}
          disabled={isCreating}
          className="text-white/70 hover:text-white border-dashed border-2 border-white/20 hover:border-white/50 hover:bg-white/5 rounded-lg p-3 w-full transition-all duration-200 disabled:opacity-50"
        >
          + Add another entry
        </button>

        <div className="flex gap-4 w-full justify-center mt-2">
          <Button variant="secondary" onClick={onBack} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateGame} disabled={isCreating}>
            {isCreating ? loadingText : "Create & Start Game"}
          </Button>
        </div>
      </div>
    </div>
  );
}
