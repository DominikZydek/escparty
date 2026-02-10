"use client";

import { useParams } from "next/navigation";

export default function Home() {
    const params = useParams();
    console.log(params);
    const { roomCode } =  params;
    return (
        <h1>{roomCode}</h1>
    );
}