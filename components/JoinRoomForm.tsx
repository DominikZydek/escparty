"use client";

import BackArrow from "@/components/BackArrow";
import Button from "@/components/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { validateRoom } from "@/app/actions/room";

export default function JoinRoomForm() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoin = async () => {
        if (roomCode.length !== 4) {
            setError("Code must be exactly 4 characters.");
            return;
        }
        
        setIsLoading(true);
        setError("");

        const result = await validateRoom(roomCode);
        if (result.error) {
            setError(result.error);
            setIsLoading(false);
            return;
        }

        router.push(`/room/${roomCode}?mode=player`);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setRoomCode(e.target.value.toUpperCase().slice(0, 4));
    }

    return (
        <div className="min-h-screen w-full flex flex-col p-5 relative z-0">
            <div className="w-full flex items-center justify-start">
                <BackArrow />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center gap-8 w-full">
                
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                        Join the Party
                    </h1>
                    <p className="text-xl text-white/50 font-light">
                        Enter the 4-character room code
                    </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                        <input 
                            type="text" 
                            value={roomCode}
                            onChange={handleInputChange}
                            placeholder="CODE"
                            className={`
                                bg-transparent 
                                text-6xl md:text-8xl font-black text-center text-white 
                                w-64 md:w-96 py-4
                                border-b-4 outline-none 
                                placeholder:text-white/10 placeholder:font-bold
                                tracking-widest
                                transition-all duration-300
                                uppercase
                                ${error 
                                    ? "border-red-500 text-red-100" 
                                    : "border-white/20 focus:border-white"
                                }
                            `}
                        />
                         <div className="absolute -inset-4 bg-white/5 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    </div>

                    <div className="h-6"> 
                        {error && (
                            <p className="text-red-400 font-bold animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-xs mt-4 mx-auto flex justify-center">
                    <div className="w-full flex justify-center">
                        <Button 
                            onClick={handleJoin} 
                            disabled={isLoading}
                        >
                            {isLoading ? "Checking..." : "Enter Room"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}