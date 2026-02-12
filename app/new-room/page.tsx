import { getContests } from "../actions/contest";
import GameSetup from "@/components/GameSetup";

export default async function NewRoomPage() {
  const escEditions = await getContests();

  return <GameSetup escEditions={escEditions} />;
}