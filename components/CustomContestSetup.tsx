"use client";

import BackArrow from "@/components/BackArrow";
import { useState } from "react";
import EntryRow from "./EntryRow";
import { v4 as uuidv4 } from "uuid";
import Button from "./Button";
import { createCustomContest } from "@/app/actions/contest";
import { createRoom } from "@/app/actions/room";
import { useRouter } from "next/navigation";

interface CustomContestSetupProps {
  onBack: () => void;
}

export default function CustomContestSetup({ onBack }: CustomContestSetupProps) {
    const router = useRouter();

    const [contestName, setContestName] = useState("Custom contest");
    const [entries, setEntries] = useState([
        { id: uuidv4(), country: "", artist: "", songTitle: "", videoUrl: "" }
    ]);

    const handleUpdate = (id: string, field: string, value: string) => {
        setEntries(prev => prev.map(item => 
            item.id === id ? { ...item, [field]: value } : item
        ));
    }

    const handleAddRow = () => {
        setEntries(prev => [
            ...prev,
            { id: uuidv4(), country: "", artist: "", songTitle: "", videoUrl: "" }
        ]);
    }

    const handleDelete = (id: string) => {
        if (entries.length === 1) return;
        setEntries(prev => prev.filter(item => item.id !== id));
    }

    const handleCreateGame = async () => {
    if (!contestName.trim()) return alert("Enter contest name");
    
    try {
        const contest = await createCustomContest(contestName, entries);
        const room = await createRoom(contest.id); 
        router.push(`/room/${room.code}?mode=host`);
        
    } catch (error) {
        console.error("Failed to create contest", error);
        alert("Something went wrong");
    }
  };

  return (
    <div className="h-full w-full max-w-4xl flex flex-col gap-6 mx-auto">
      
      <div className="shrink-0 flex justify-between items-center text-white mb-4">
        <h2 className="text-2xl font-bold drop-shadow-md">Add Participants</h2>
        <span className="text-white/50 text-sm font-mono">{entries.length} entries</span>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {entries.map((entry, index) => (
          <EntryRow 
            key={entry.id}
            index={index}
            entry={entry}
            mode="edit"
            onUpdate={(field, val) => handleUpdate(entry.id, field, val)}
            onDelete={() => handleDelete(entry.id)}
          />
        ))}
      </div>

      <div className="shrink-0 flex flex-col gap-4 mt-auto items-center pt-4 border-t border-white/10 pb-1">
        <button 
          onClick={handleAddRow}
          className="text-white/70 hover:text-white border-dashed border-2 border-white/20 hover:border-white/50 hover:bg-white/5 rounded-lg p-3 w-full transition-all duration-200"
        >
          + Add another entry
        </button>

        <div className="flex gap-4 w-full justify-center mt-2">
            <Button variant="secondary" onClick={onBack}>Cancel</Button>
            <Button onClick={handleCreateGame}>Create & Start Game</Button>
        </div>
      </div>
    </div>
  );
}