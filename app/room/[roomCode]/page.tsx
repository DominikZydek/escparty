import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

import LobbyScreen from "@/components/LobbyScreen";
import PlayerJoinScreen from "@/components/PlayerJoinScreen";
import HostVotingDashboard from "@/components/HostVotingDashboard";
import VotingScreen from "@/components/VotingScreen";
import ResultsScreen from "@/components/ResultsScreen";
import { getAvatars } from "@/app/actions/player";
import PlayerWatchingScreen from "@/components/PlayerWatchingScreen";
import HostWatchingScreen from "@/components/HostWatchingScreen";

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function RoomPage({ params }: PageProps) {
  const { roomCode } = await params;
  const cookieStore = await cookies();

  const isHost = cookieStore.get("host_access")?.value === roomCode;
  const playerId = cookieStore.get("playerId")?.value;

  const room = await prisma.gameRoom.findUnique({
    where: { code: roomCode },
    include: {
      players: { include: { avatar: true } },
    },
  });

  if (!room) {
    return <div className="text-white text-center mt-20">Room not found</div>;
  }

  switch (room.status) {
    case "LOBBY":
      if (isHost) {
        return (
          <LobbyScreen roomCode={roomCode} initialPlayers={room.players} />
        );
      }

      const avatars = await getAvatars();
      return <PlayerJoinScreen roomCode={roomCode} avatars={avatars} />;

    case 'WATCHING':
      const contestEntries = await prisma.entry.findMany({
        where: { contestId: room.contestId },
        orderBy: { order: 'asc' }
      });

      if (isHost) {
        return (
          <HostWatchingScreen 
            roomCode={roomCode} 
            entries={contestEntries} 
            initialEntryId={room.currentEntryId}
          />
        );
      }

      if (playerId) {
        return (
          <PlayerWatchingScreen 
            roomCode={roomCode} 
            entries={contestEntries} 
            initialEntryId={room.currentEntryId}
          />
        );
      }
      
      return redirect(`/join-room?code=${roomCode}`);

    case "VOTING":
      if (isHost) {
        const votedPlayersCount = await prisma.player.count({
          where: {
            roomCode: roomCode,
            votes: { some: {} },
          },
        });

        return (
          <HostVotingDashboard
            roomCode={roomCode}
            totalPlayers={room.players.length}
            initialVotesCount={votedPlayersCount}
          />
        );
      }

      if (playerId) {
        const entries = await prisma.entry.findMany({
          where: { contestId: room.contestId },
          orderBy: { order: "asc" },
        });

        const player = await prisma.player.findUnique({
          where: { id: playerId },
          include: { votes: true },
        });

        return (
          <VotingScreen
            roomCode={roomCode}
            playerId={playerId}
            entries={entries}
          />
        );
      }

      return redirect(`/join-room?code=${roomCode}`);

    case "RESULTS":
      const roomData = await prisma.gameRoom.findUnique({
        where: { code: roomCode },
        include: {
          players: {
            include: {
              avatar: true,
              votes: {
                include: { entry: true },
              },
            },
          },
        },
      });

      const allEntries = await prisma.entry.findMany({
        where: { contestId: room.contestId },
      });

      if (!roomData) return <div>Error loading data</div>;

      return (
        <ResultsScreen
          roomCode={roomCode}
          isHost={isHost}
          currentPlayerId={playerId}
          players={roomData.players}
          entries={allEntries}
          initialCurrentVoterId={roomData.currentVoterId}
        />
      );

    default:
      return <div>Unknown Status</div>;
  }
}
