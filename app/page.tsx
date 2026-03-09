import Button from "@/components/Button";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center gap-4 md:gap-6 px-6 relative">
      <div className="relative w-64 md:w-80 lg:w-96">
        <img
          src="./escparty_logo.png"
          alt="ESC Party Logo"
          className="relative z-10 w-full h-auto drop-shadow-2xl"
        />
      </div>

      <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-center tracking-tight drop-shadow-lg z-10 flex flex-col items-center">
        <span>Gather your friends.</span>
        <span className="opacity-70 mt-1 md:mt-2">Choose your own winner.</span>
      </h1>

      <div className="z-10 mt-4 md:mt-6 w-full flex justify-center">
        <div className="md:hidden w-full flex justify-center">
          <Button href="/join-room">Join a room</Button>
        </div>

        <div className="hidden md:flex flex-row gap-4">
          <Button href="/new-room">Create a room</Button>
          <Button href="/join-room" variant="secondary">
            Join a room
          </Button>
        </div>
      </div>
    </div>
  );
}
