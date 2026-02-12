"use client";

import BackArrow from "@/components/BackArrow";

interface CustomContestSetupProps {
  onBack: () => void;
}

export default function CustomContestSetup({ onBack }: CustomContestSetupProps) {
  return (
    <div className="min-h-screen w-full flex flex-col p-5 relative z-0 text-white">
      <BackArrow onClick={onBack}/>
      <div className="flex-1 flex flex-col justify-center items-center gap-8">
        <h1 className="text-3xl font-bold drop-shadow-lg">
          Custom Contest Setup
        </h1>
        <p className="text-white/50 italic">
          Tu będzie formularz budowania własnego konkursu.
        </p>
      </div>
    </div>
  );
}