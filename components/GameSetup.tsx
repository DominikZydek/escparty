"use client";

import BackArrow from "@/components/BackArrow";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";
import { Contest } from "@prisma/client";
import { createRoom } from "@/app/actions/room";
import CustomContestSetup from "./CustomContestSetup";
import { useState, useTransition } from "react";

export default function GameSetup({ escEditions }: { escEditions: Contest[] }) {

    const [isBuildingCustom, setIsBuildingCustom] = useState(false);
    const [isPending, startTransition] = useTransition();

  const handleStartGame = async (selectedName: string | null) => {
    if (!selectedName) return;

    if (selectedName === 'Custom') {
        setIsBuildingCustom(true);
        return;
    }

    const selectedContest = escEditions.find(e => e.name === selectedName);

    if (!selectedContest) {
        console.error("Contest not found")
        return;
    }

    startTransition(async () => {
        await createRoom(selectedContest.id);
    });
  };

  if (isBuildingCustom) {
    return(
        <CustomContestSetup onBack={() => setIsBuildingCustom(false)}/>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col p-5 relative z-0">
      <BackArrow />
      <div className="flex-1 flex justify-center items-center gap-16">
        
        <div className="flex flex-col gap-4 w-96 text-center">
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              Choose ESC Edition
            </p>
            <Dropdown 
              options={escEditions.map(e => e.name)} 
              placeholder="Select year" 
              onSelect={(selectedEdition) => handleStartGame(selectedEdition)}
            />
        </div>

        <p className="text-2xl text-white/50 font-light italic">or...</p>

        <div className="flex flex-col gap-4 w-96 text-center">
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              Create custom contest
            </p>
            <Button 
              variant="secondary" 
              onClick={() => handleStartGame("Custom")}
            >
              Start building
            </Button>
        </div>
      </div>
    </div>
  );
}