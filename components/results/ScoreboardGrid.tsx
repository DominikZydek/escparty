"use client";

import React from "react";
import clsx from "clsx";
import { getCountryCode } from "@/lib/countries";
import { Entry } from "@prisma/client";

export type CalculatedEntry = Entry & {
  songTitle?: string;
  title?: string;
  points: number;
  currentPointsToAdd: number | null;
};

interface ScoreboardGridProps {
  calculatedEntries: CalculatedEntry[];
  showWinner: boolean;
  videoEnded: boolean;
}

export const ScoreboardGrid = React.memo(
  ({ calculatedEntries, showWinner, videoEnded }: ScoreboardGridProps) => {
    if (calculatedEntries.length === 0) return null;

    const rowsPerColumn = Math.ceil(calculatedEntries.length / 2);
    const maxPoints = calculatedEntries[0]?.points || 1;

    return (
      <div
        className={`flex-1 min-h-0 w-full max-w-7xl mx-auto ${showWinner && videoEnded ? "mb-36" : ""}`}
      >
        <style>{`
        .results-grid { display: grid; gap: 0.5rem 2rem; height: 100%; align-content: start; }
        @media (min-width: 768px) { .results-grid { grid-auto-flow: column; grid-template-rows: repeat(${rowsPerColumn}, minmax(0, 1fr)); } }
        @media (max-width: 767px) { .results-grid { grid-template-columns: 1fr; grid-template-rows: auto; } }
      `}</style>

        <div className="results-grid">
          {calculatedEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={clsx(
                "flex items-center px-3 py-1 rounded border relative overflow-hidden min-h-9 transition-all duration-700 ease-in-out",
                index === 0
                  ? "bg-linear-to-r from-yellow-600/40 to-yellow-900/40 border-yellow-500/50"
                  : "bg-black/40 border-white/10",
              )}
            >
              <div className="w-8 text-xl font-black text-white/30 text-right mr-3 font-mono">
                {index + 1}
              </div>

              <div className="flex-1 z-10 flex flex-col justify-center overflow-hidden">
                <div className="font-bold text-base md:text-lg leading-none truncate">
                  <span
                    className={`mr-2 fi fi-${getCountryCode(entry.country).toLowerCase()}`}
                  ></span>
                  {entry.country}
                </div>
                <div className="text-xs opacity-60 truncate mt-0.5">
                  {entry.artist}
                </div>
              </div>

              <div
                className="absolute left-0 top-0 bottom-0 bg-white/5 z-0 origin-left transition-all duration-1000 ease-out"
                style={{ width: `${(entry.points / maxPoints) * 100}%` }}
              />

              {entry.currentPointsToAdd && (
                <div
                  className={clsx(
                    "z-10 mr-4 font-black text-lg px-2 py-0.5 rounded animate-in zoom-in duration-300",
                    entry.currentPointsToAdd === 12
                      ? "bg-yellow-500 text-black animate-pulse"
                      : "bg-purple-600 text-white",
                  )}
                >
                  +{entry.currentPointsToAdd}
                </div>
              )}

              <div
                key={entry.points}
                className="text-2xl md:text-3xl font-mono font-bold w-16 text-right z-10 shrink-0 animate-in fade-in zoom-in-90 duration-300"
              >
                {entry.points}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.showWinner === nextProps.showWinner &&
      prevProps.videoEnded === nextProps.videoEnded &&
      JSON.stringify(prevProps.calculatedEntries) ===
        JSON.stringify(nextProps.calculatedEntries)
    );
  },
);

ScoreboardGrid.displayName = "ScoreboardGrid";
