"use client";

import React, { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/Button";
import { parseSubmission, submitFinalEntry } from "@/app/actions/submissions";
import {
  CheckCircle2,
  Music,
  Youtube,
  Search,
  AlertCircle,
} from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

export default function SubmitPage() {
  const { roomCode } = useParams() as { roomCode: string };

  const [step, setStep] = useState<"INPUT" | "VERIFY" | "SUCCESS">("INPUT");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [country, setCountry] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [parsedArtist, setParsedArtist] = useState("");
  const [parsedSong, setParsedSong] = useState("");
  const [isItunesMatch, setIsItunesMatch] = useState(false);

  const handleParse = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!country || !youtubeUrl) return;
    setError("");

    startTransition(async () => {
      const result = await parseSubmission(youtubeUrl);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setParsedArtist(result.data.artist);
        setParsedSong(result.data.songTitle);
        setIsItunesMatch(result.data.isItunesMatch);
        setStep("VERIFY");
      }
    });
  };

  const handleSubmitFinal = () => {
    if (!parsedArtist || !parsedSong) return;
    setError("");

    startTransition(async () => {
      const result = await submitFinalEntry(
        roomCode.toUpperCase(),
        country,
        parsedArtist,
        parsedSong,
        youtubeUrl,
      );

      if (result.error) {
        setError(result.error);
      } else {
        setStep("SUCCESS");
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-black/50 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-pink-900/20 to-black pointer-events-none" />

      <div className="z-10 w-full max-w-md bg-black/80 border border-white/20 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_50px_rgba(235,2,115,0.1)]">
        {/* NAGŁÓWEK */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white drop-shadow-md mb-2">
            Submit Entry
          </h1>
          <p className="text-white/50 text-sm font-mono uppercase tracking-widest">
            Room: <span className="text-cyan-400 font-bold">{roomCode}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 text-sm">
            <AlertCircle className="shrink-0" size={20} />
            <p>{error}</p>
          </div>
        )}

        {step === "INPUT" && (
          <form
            onSubmit={handleParse}
            className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 ml-1">
                Representing Country
              </label>
              <div className="relative">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 appearance-none focus:outline-none focus:bg-white/10 focus:border-cyan-400 transition-all font-bold text-lg [&>option]:text-black"
                  required
                >
                  <option value="" disabled>
                    Select a country...
                  </option>
                  {COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(
                    (c) => (
                      <option key={c.countryCode} value={c.name}>
                        {c.name}
                      </option>
                    ),
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
                  ▼
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 ml-1">
                YouTube Link
              </label>
              <div className="relative">
                <Youtube
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  size={20}
                />
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:bg-white/10 focus:border-pink-500 transition-all"
                  required
                />
              </div>
            </div>

            <Button
              onClick={handleParse}
              disabled={isPending || !country || !youtubeUrl}
              className="mt-4 w-full flex items-center justify-center gap-2"
            >
              {isPending ? (
                "Searching..."
              ) : (
                <>
                  <Search size={18} /> Find Song
                </>
              )}
            </Button>
          </form>
        )}

        {step === "VERIFY" && (
          <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center mb-2">
              <span className="inline-block bg-cyan-400/20 text-cyan-400 border border-cyan-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                {isItunesMatch ? "✅ Verified" : "⚠️ Please check and edit"}
              </span>
              <p className="text-sm text-white/70">
                We extracted the details from your link. Please correct them if
                our algorithm made a mistake.
              </p>
            </div>

            <div className="space-y-4 bg-white/5 p-5 rounded-2xl border border-white/10">
              <div>
                <label className="block text-xs uppercase tracking-widest text-pink-500 mb-1 ml-1 font-bold">
                  Artist
                </label>
                <input
                  type="text"
                  value={parsedArtist}
                  onChange={(e) => setParsedArtist(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors font-bold text-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-cyan-400 mb-1 ml-1 font-bold">
                  Song Title
                </label>
                <input
                  type="text"
                  value={parsedSong}
                  onChange={(e) => setParsedSong(e.target.value)}
                  className="w-full bg-transparent border-b border-white/20 text-white px-2 py-2 focus:outline-none focus:border-cyan-400 transition-colors text-lg"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setStep("INPUT")}
                variant="secondary"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmitFinal}
                disabled={isPending || !parsedArtist || !parsedSong}
                className="flex-2"
              >
                {isPending ? "Saving..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        )}

        {step === "SUCCESS" && (
          <div className="text-center flex flex-col items-center py-6 animate-in zoom-in-90 duration-500">
            <div className="w-20 h-20 bg-cyan-400/20 rounded-full flex items-center justify-center mb-6 border border-cyan-400/50">
              <CheckCircle2 size={40} className="text-cyan-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              Entry Submitted!
            </h2>
            <p className="text-white/60 mb-8 px-4">
              Your song has been successfully added to the contest. The host
              will review the details shortly.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                + Add Another Entry
              </Button>
              <Button href="/" variant="secondary" className="w-full">
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
