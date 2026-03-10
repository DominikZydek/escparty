"use client";

import { useState, useEffect } from "react";
import { Entry } from "@prisma/client";
import { submitVotes } from "@/app/actions/vote";
import Button from "@/components/Button";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

const POINTS_AVAILABLE = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

interface VotingScreenProps {
  roomCode: string;
  playerId: string;
  entries: Entry[];
}

export default function VotingScreen({
  roomCode,
  playerId,
  entries,
}: VotingScreenProps) {
  const router = useRouter();

  const [orderedEntries, setOrderedEntries] = useState<Entry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setOrderedEntries(entries);
  }, [entries]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`room-${roomCode}`);
    channel.bind("show-results", () => router.refresh());
    return () => {
      pusher.unsubscribe(`room-${roomCode}`);
    };
  }, [roomCode, router]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedEntries);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedEntries(items);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const maxVotes = Math.min(POINTS_AVAILABLE.length, orderedEntries.length);
      const topEntries = orderedEntries.slice(0, maxVotes);

      const votesArray = topEntries.map((entry, index) => ({
        entryId: entry.id,
        points: POINTS_AVAILABLE[index],
      }));

      await submitVotes(playerId, votesArray);
      setHasVoted(true);
    } catch (error) {
      alert("Error submitting votes");
      setIsSubmitting(false);
    }
  };

  if (!isMounted) return null;

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white p-5 text-center">
        <h1 className="text-4xl font-bold mb-4">Votes Sent!</h1>
        <p className="text-xl opacity-70">
          Get ready for the results ceremony.
        </p>
        <div className="mt-8 animate-pulse">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-5 text-white max-w-2xl mx-auto pb-32">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Jury Vote</h1>
        <p className="text-white/60 text-sm">Drag & drop to assign points!</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="voting-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {orderedEntries.map((entry, index) => {
                const points =
                  index < POINTS_AVAILABLE.length ? POINTS_AVAILABLE[index] : 0;
                const isTop10 = points > 0;

                return (
                  <Draggable
                    key={entry.id}
                    draggableId={entry.id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                          snapshot.isDragging
                            ? "bg-purple-900/80 border-purple-500 shadow-2xl scale-[1.02] z-50"
                            : isTop10
                              ? "bg-white/10 border-white/20"
                              : "bg-black/40 border-white/5 opacity-60"
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-white/30 hover:text-white transition-colors p-2"
                        >
                          <GripVertical size={24} />
                        </div>

                        <div
                          className={`
                          w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl shrink-0 transition-colors
                          ${
                            points === 12
                              ? "bg-pink-600 shadow-[0_0_15px_rgba(219,39,119,0.5)] text-white"
                              : points === 10
                                ? "bg-purple-600 text-white"
                                : points >= 8
                                  ? "bg-blue-600 text-white"
                                  : points > 0
                                    ? "bg-gray-700 text-white"
                                    : "bg-transparent text-transparent"
                          }
                        `}
                        >
                          {points > 0 ? points : "-"}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-lg truncate">
                            {entry.country}
                          </div>
                          <div className="text-sm opacity-70 truncate">
                            {entry.artist}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="fixed bottom-0 left-0 w-full bg-linear-to-t from-black via-black/90 to-transparent p-6 pt-12 flex justify-center pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Submit Votes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
