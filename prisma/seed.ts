import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const CONTESTS_DATA = [
  {
    year: 2024,
    city: "Malmö",
    entries: [
      { country: "Sweden", artist: "Marcus & Martinus", songTitle: "Unforgettable" },
      { country: "Ukraine", artist: "alyona alyona & Jerry Heil", songTitle: "Teresa & Maria" },
      { country: "Germany", artist: "Isaak", songTitle: "Always on the Run" },
      { country: "Luxembourg", artist: "Tali", songTitle: "Fighter" },
      { country: "Netherlands", artist: "Joost Klein", songTitle: "Europapa" },
      { country: "Israel", artist: "Eden Golan", songTitle: "Hurricane" },
      { country: "Lithuania", artist: "Silvester Belt", songTitle: "Luktelk" },
      { country: "Spain", artist: "Nebulossa", songTitle: "Zorra" },
      { country: "Estonia", artist: "5MIINUST x Puuluup", songTitle: "(nendest) narkootikumidest ei tea me (küll) midagi" },
      { country: "Ireland", artist: "Bambie Thug", songTitle: "Doomsday Blue" },
      { country: "Latvia", artist: "Dons", songTitle: "Hollow" },
      { country: "Greece", artist: "Marina Satti", songTitle: "ZARI" },
      { country: "United Kingdom", artist: "Olly Alexander", songTitle: "Dizzy" },
      { country: "Norway", artist: "Gåte", songTitle: "Ulveham" },
      { country: "Italy", artist: "Angelina Mango", songTitle: "La noia" },
      { country: "Serbia", artist: "Teya Dora", songTitle: "Ramonda" },
      { country: "Finland", artist: "Windows95man", songTitle: "No Rules!" },
      { country: "Portugal", artist: "Iolanda", songTitle: "Grito" },
      { country: "Armenia", artist: "Ladaniva", songTitle: "Jako" },
      { country: "Cyprus", artist: "Silia Kapsis", songTitle: "Liar" },
      { country: "Switzerland", artist: "Nemo", songTitle: "The Code" },
      { country: "Slovenia", artist: "Raiven", songTitle: "Veronika" },
      { country: "Croatia", artist: "Baby Lasagna", songTitle: "Rim Tim Tagi Dim" },
      { country: "Georgia", artist: "Nutsa Buzaladze", songTitle: "Firefighter" },
      { country: "France", artist: "Slimane", songTitle: "Mon amour" },
      { country: "Austria", artist: "Kaleen", songTitle: "We Will Rave" },
    ]
  },
  // more contests
];

const AVATARS = [
  { name: 'Disco Ball', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=disco' },
  { name: 'Microphone', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=mic' },
  { name: 'Star', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=star' },
  { name: 'Heart', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=heart' },
  { name: 'Music Note', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=note' },
  { name: 'Bomb', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=bomb' },
];

async function main() {
  console.log('🗑️  Cleaning database...');

  await prisma.vote.deleteMany();    
  await prisma.player.deleteMany();  
  await prisma.gameRoom.deleteMany(); 
  await prisma.entry.deleteMany();    
  await prisma.contest.deleteMany();   
  await prisma.avatar.deleteMany();    

  console.log('🌱 Seeding Avatars...');
  await prisma.avatar.createMany({
    data: AVATARS
  });

  console.log('🌱 Seeding Contests & Entries...');
  
  for (const contestData of CONTESTS_DATA) {
    const contest = await prisma.contest.create({
      data: {
        year: contestData.year,
        name: `Eurovision Song Contest ${contestData.year}`,
        isOfficial: true,
        entries: {
          create: contestData.entries.map((entry, index) => ({
            country: entry.country,
            artist: entry.artist,
            songTitle: entry.songTitle,
            order: index + 1
          }))
        }
      }
    });
    console.log(`✅ Created: ESC ${contest.year} with ${contestData.entries.length} songs`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });