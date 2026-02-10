"use client";

import { useRouter } from "next/navigation";
import BackArrow from "@/components/BackArrow";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";

export default function Home() {
  const router = useRouter();
  
  const escEditions = ["Malmö 2024", "Liverpool 2023", "Turin 2022"];

  const generateRoomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleStartGame = (edition: string | null) => {
    const roomCode = generateRoomCode();
    
    // backend integration

    router.push(`/room/${roomCode}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col p-5 relative z-0">
      <div className="flex items-center gap-2">
        <BackArrow />
        <p className="text-2xl text-white font-bold">Go back</p>
      </div>

      <div className="flex-1 flex justify-center items-center gap-16">
        
        <div className="flex flex-col gap-4 w-96 text-center">
            <p className="text-3xl font-bold text-white drop-shadow-lg">
              Choose ESC Edition
            </p>
            <Dropdown 
              options={escEditions} 
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