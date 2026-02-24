"use client";

import BackArrow from "@/components/BackArrow";
import { useState, useRef } from "react";
import EntryRow from "./EntryRow";
import { v4 as uuidv4 } from "uuid";
import Button from "./Button";
import { createCustomContest } from "@/app/actions/contest";
import { createRoom } from "@/app/actions/room";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload } from "lucide-react";

interface CustomContestSetupProps {
  onBack: () => void;
}

export default function CustomContestSetup({ onBack }: CustomContestSetupProps) {
  const router = useRouter();

  const [contestName, setContestName] = useState("Custom contest");
  const [entries, setEntries] = useState([
      { id: uuidv4(), country: "", artist: "", songTitle: "", videoUrl: "" }
  ]);
  
  const [isCreating, setIsCreating] = useState(false);
  
  // ref to hidden csv input
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // CSV IMPORT
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const importedEntries = results.data.map((row: any) => {
          // find column through a part of the name
          const getVal = (keywords: string[]) => {
            const key = Object.keys(row).find(k => 
              keywords.some(kw => k.toLowerCase().includes(kw))
            );
            return key ? row[key].trim() : '';
          };

          return {
            id: uuidv4(),
            country: getVal(['country']),
            artist: getVal(['artist']),
            songTitle: getVal(['song', 'title']),
            videoUrl: getVal(['youtube', 'link', 'video', 'url']),
          };
        });

        if (importedEntries.length > 0) {
          setEntries(importedEntries);
          alert(`Successfully imported ${importedEntries.length} entries!`);
        } else {
          alert("No valid data found in the CSV file.");
        }
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to read the file.");
      }
    });
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleCreateGame = async () => {
    if (!contestName.trim()) return alert("Enter contest name");
    
    setIsCreating(true);
    
    try {
        const contest = await createCustomContest(contestName, entries);
        const room = await createRoom(contest.id); 
        router.push(`/room/${room.code}?mode=host`);
        
    } catch (error) {
        console.error("Failed to create contest", error);
        alert("Something went wrong");
        setIsCreating(false);
    }
  };

  return (
    <div className="h-full w-full max-w-4xl flex flex-col gap-6 mx-auto">
      
      <div className="shrink-0 flex justify-between items-center text-white mb-4">
        <h2 className="text-2xl font-bold drop-shadow-md">Add Participants</h2>
        
        <div className="flex items-center gap-4">
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
          <span className="text-white/50 text-sm font-mono">{entries.length} entries</span>
        </div>
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
          disabled={isCreating}
          className="text-white/70 hover:text-white border-dashed border-2 border-white/20 hover:border-white/50 hover:bg-white/5 rounded-lg p-3 w-full transition-all duration-200 disabled:opacity-50"
        >
          + Add another entry
        </button>

        <div className="flex gap-4 w-full justify-center mt-2">
            <Button variant="secondary" onClick={onBack} disabled={isCreating}>Cancel</Button>
            <Button onClick={handleCreateGame} disabled={isCreating}>
              {isCreating ? "Creating Lobby..." : "Create & Start Game"}
            </Button>
        </div>
      </div>
    </div>
  );
}