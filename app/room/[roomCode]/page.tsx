"use client";

import { useParams, useSearchParams } from "next/navigation";

export default function Home() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const { roomCode } = params;
  return (
    <div>
      <h1>{roomCode}</h1>
      <h1>{mode}</h1>
    </div>
  );
}
