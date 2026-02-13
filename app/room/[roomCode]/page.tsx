import { getAvatars } from "@/app/actions/player";
import PlayerJoinScreen from "@/components/PlayerJoinScreen";
import LobbyScreen from "@/components/LobbyScreen"; // <-- Importuj nowy komponent
import prisma from "@/lib/prisma";

interface PageProps {
  params: Promise<{ roomCode: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RoomPage({ params, searchParams }: PageProps) {
  const { roomCode } = await params; 
  const { mode } = await searchParams;

  const isPlayerMode = mode === 'player';

  // player
  if (isPlayerMode) {
    const avatars = await getAvatars();
    return <PlayerJoinScreen roomCode={roomCode} avatars={avatars} />;
  }

  // host
  
  // get players
  const room = await prisma.gameRoom.findUnique({
    where: { code: roomCode },
    include: {
      players: {
        include: { avatar: true }
      }
    }
  });

  if (!room) {
    return <div className="text-white">Room not found</div>;
  }

  return (
    <LobbyScreen 
      roomCode={roomCode} 
      initialPlayers={room.players} 
    />
  );
}