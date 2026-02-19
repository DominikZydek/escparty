"use client";

import { GripVertical, Trash2 } from "lucide-react";

interface EntryData {
  id: string;
  country: string;
  artist: string;
  songTitle: string;
  videoUrl?: string;
  points?: number;
}

interface EntryRowProps {
  entry: EntryData;
  index: number;
  mode: "edit" | "display";
  onUpdate?: (field: keyof EntryData, value: string) => void;
  onDelete?: () => void;
  dragHandleProps?: any;
}

export default function EntryRow({
  entry,
  index,
  mode,
  onUpdate,
  onDelete,
  dragHandleProps
}: EntryRowProps) {

  const isEdit = mode === "edit";

  return (
    <div className="flex items-center gap-4 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/5 mb-2">
      
      {/* left side - index or grip */}
      <div className="w-8 flex justify-center text-white/50 font-bold">
        {isEdit ? (
          <div {...dragHandleProps} className="cursor-grab hover:text-white">
            <GripVertical size={20} />
          </div>
        ) : (
          <span>{index + 1}.</span>
        )}
      </div>

      {/* middle - data or inputs */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* country */}
        {isEdit ? (
          <input 
            placeholder="Country"
            className="bg-transparent border-b border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white"
            value={entry.country}
            onChange={(e) => onUpdate?.('country', e.target.value)}
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
            onChange={(e) => onUpdate?.('artist', e.target.value)}
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
            onChange={(e) => onUpdate?.('songTitle', e.target.value)}
          />
        ) : (
           <span className="text-white/60 italic">"{entry.songTitle}"</span>
        )}

        {isEdit && (
          <input 
            placeholder="YouTube Embed URL (np. https://www.youtube.com/embed/...)"
            className="col-span-3 w-full bg-transparent border-b border-white/10 text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors py-1 text-sm"
            value={entry.videoUrl || ''}
            onChange={(e) => onUpdate?.('videoUrl', e.target.value)}
          />
        )}
      </div>

      {/* right side - delete or points */}
      <div className="w-16 flex justify-end">
        {isEdit ? (
          <button 
            onClick={onDelete} 
            className="text-red-400 hover:text-red-300 transition-colors"
            title="Remove entry"
          >
            <Trash2 size={20} />
          </button>
        ) : (
          <span className="text-yellow-400 font-bold text-xl">
            {entry.points || 0}
          </span>
        )}
      </div>
    </div>
  );
}