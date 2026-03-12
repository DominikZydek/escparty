"use client";

import { GripVertical, Trash2, Eye, EyeOff } from "lucide-react";

interface EntryData {
  id: string;
  country: string;
  artist: string;
  songTitle: string;
  videoUrl?: string;
  points?: number;
  isHidden?: boolean;
}

interface EntryRowProps {
  entry: EntryData;
  index: number;
  mode: "edit" | "display";
  onUpdate?: (field: keyof EntryData, value: any) => void;
  onDelete?: () => void;
  dragHandleProps?: any;
}

export default function EntryRow({
  entry,
  index,
  mode,
  onUpdate,
  onDelete,
  dragHandleProps,
}: EntryRowProps) {
  const isEdit = mode === "edit";
  const isHidden = entry.isHidden;

  return (
    <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/5 mb-2">
      {/* left side - index or grip */}
      <div className="w-8 flex justify-center text-white/50 font-bold shrink-0">
        {isEdit ? (
          <div {...dragHandleProps} className="cursor-grab hover:text-white">
            <GripVertical size={20} />
          </div>
        ) : (
          <span>{index + 1}.</span>
        )}
      </div>

      {/* middle - data or inputs */}
      <div
        className={`flex-1 grid grid-cols-3 gap-4 transition-all duration-300 ${isHidden ? "blur-md opacity-40 select-none pointer-events-none" : ""}`}
      >
        {/* country */}
        {isEdit ? (
          <input
            placeholder="Country"
            className="bg-transparent border-b border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white"
            value={entry.country}
            onChange={(e) => onUpdate?.("country", e.target.value)}
            tabIndex={isHidden ? -1 : 0}
          />
        ) : (
          <span className="font-bold text-white">{entry.country}</span>
        )}

        {/* artist */}
        {isEdit ? (
          <input
            placeholder="Artist"
            className="bg-transparent border-b border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white"
            value={entry.artist}
            onChange={(e) => onUpdate?.("artist", e.target.value)}
            tabIndex={isHidden ? -1 : 0}
          />
        ) : (
          <span className="text-white/80">{entry.artist}</span>
        )}

        {/* title */}
        {isEdit ? (
          <input
            placeholder="Song Title"
            className="bg-transparent border-b border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white"
            value={entry.songTitle}
            onChange={(e) => onUpdate?.("songTitle", e.target.value)}
            tabIndex={isHidden ? -1 : 0}
          />
        ) : (
          <span className="text-white/60 italic">"{entry.songTitle}"</span>
        )}

        {isEdit && (
          <input
            placeholder="YouTube URL"
            className="col-span-3 w-full bg-transparent border-b border-white/10 text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors py-1 text-sm"
            value={entry.videoUrl || ""}
            onChange={(e) => onUpdate?.("videoUrl", e.target.value)}
            tabIndex={isHidden ? -1 : 0}
          />
        )}
      </div>

      {/* right side - delete/hide or points */}
      <div className="flex justify-end items-center gap-3 shrink-0">
        {isEdit ? (
          <>
            <button
              onClick={() => onUpdate?.("isHidden", !isHidden)}
              className="text-white/50 hover:text-white transition-colors p-1"
              title={isHidden ? "Reveal entry" : "Hide entry"}
            >
              {isHidden ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Remove entry"
            >
              <Trash2 size={20} />
            </button>
          </>
        ) : (
          <span className="text-yellow-400 font-bold text-xl w-16 text-right">
            {entry.points || 0}
          </span>
        )}
      </div>
    </div>
  );
}
