import { PrismaClient, GameStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const eurovision2024Entries = [
  { country: 'Switzerland', artist: 'Nemo', songTitle: 'The Code', order: 21 },
  { country: 'Croatia', artist: 'Baby Lasagna', songTitle: 'Rim Tim Tagi Dim', order: 23 },
  { country: 'Ukraine', artist: 'alyona alyona & Jerry Heil', songTitle: 'Teresa & Maria', order: 2 },
  { country: 'France', artist: 'Slimane', songTitle: 'Mon amour', order: 25 },
  { country: 'Israel', artist: 'Eden Golan', songTitle: 'Hurricane', order: 6 },
  { country: 'Ireland', artist: 'Bambie Thug', songTitle: 'Doomsday Blue', order: 10 },
  { country: 'Italy', artist: 'Angelina Mango', songTitle: 'La noia', order: 15 },
  { country: 'Armenia', artist: 'Ladaniva', songTitle: 'Jako', order: 19 },
  { country: 'Sweden', artist: 'Marcus & Martinus', songTitle: 'Unforgettable', order: 1 },
  { country: 'Portugal', artist: 'iolanda', songTitle: 'Grito', order: 18 },
  { country: 'Poland', artist: 'Luna', songTitle: 'The Tower', order: 30 },
  { country: 'United Kingdom', artist: 'Olly Alexander', songTitle: 'Dizzy', order: 13 },
];

const avatarsData = [
  { name: 'Disco Ball', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=disco' },
  { name: 'Microphone', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mic' },
  { name: 'Star', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=star' },
  { name: 'Heart', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=heart' },
  { name: 'Music Note', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=note' },
];

async function main() {
  console.log('🌱 Start seeding...');

  await prisma.vote.deleteMany();
  await prisma.player.deleteMany();
  await prisma.gameRoom.deleteMany();
  await prisma.entry.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.avatar.deleteMany();

  console.log('🧹 Database cleaned.');

  console.log('Creating avatars...');
  const createdAvatars = [];
  for (const av of avatarsData) {
    const created = await prisma.avatar.create({ data: av });
    createdAvatars.push(created);
  }

  console.log('Creating contest...');
  const contest = await prisma.contest.create({
    data: {
      name: 'Eurovision Song Contest 2024',
      year: 2024,
      isOfficial: true,
      entries: {
        create: eurovision2024Entries.map((e) => ({
          country: e.country,
          artist: e.artist,
          songTitle: e.songTitle,
          order: e.order,
        })),
      },
    },
    include: { entries: true },
  });

  const allEntries = contest.entries;

  console.log('Creating test room...');
  const room = await prisma.gameRoom.create({
    data: {
      code: 'TEST', 
      status: GameStatus.VOTING,
      contestId: contest.id,
    },
  });

  console.log('Creating players...');
  const playerNames = ['Kasia', 'Tomek', 'Marek', 'Ania'];
  const players = [];

  for (let i = 0; i < playerNames.length; i++) {
    const player = await prisma.player.create({
      data: {
        name: playerNames[i],
        roomCode: room.code,
        avatarId: createdAvatars[i % createdAvatars.length].id,
        isReady: true,
      },
    });
    players.push(player);
  }

  console.log('Casting votes...');
  const pointsSystem = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];

  for (const player of players) {
    const shuffledEntries = [...allEntries].sort(() => 0.5 - Math.random());
    
    const votesToCast = Math.min(shuffledEntries.length, pointsSystem.length);

    for (let i = 0; i < votesToCast; i++) {
      await prisma.vote.create({
        data: {
          points: pointsSystem[i],
          playerId: player.id,
          entryId: shuffledEntries[i].id,
        },
      });
    }
  }

  console.log('✅ Seeding finished.');
  console.log(`Created Room: ${room.code} with ${players.length} players and full votes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });