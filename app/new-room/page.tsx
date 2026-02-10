import BackArrow from "@/components/BackArrow";
import Button from "@/components/Button";
import Dropdown from "@/components/Dropdown";


export default function Home() {
  return (
    <div className="min-h-screen min-w-screen flex flex-col p-5">
      <div className="flex items-center gap-2">
        <BackArrow />
        <p className="text-2xl">Go back</p>
      </div>
      <div className="flex-1 flex justify-around items-center">
        <div className="flex flex-col gap-2">
            <p className="text-3xl">Choose ESC Edition</p>
            <Dropdown className="w-full" options={["one", "two"]}></Dropdown>
        </div>
        <p className="text-3xl">or...</p>
        <div className="flex flex-col gap-2">
            <p className="text-3xl">Create a custom contest</p>
            <Button className="w-full" variant="secondary">Start building</Button>
        </div>
      </div>
    </div>
  );
}
