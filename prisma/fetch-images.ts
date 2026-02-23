import { PrismaClient } from "@prisma/client";
import { fetchArtistImages } from "@/app/actions/image";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { loadEnvConfig } from '@next/env';
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Searching for photos...');

  const entriesWithoutImages = await prisma.entry.findMany({
    where: {
      imageUrls: {
        isEmpty: true,
      }
    }
  });

  if (entriesWithoutImages.length === 0) {
    console.log('All entries already have postcard images :)');
    return;
  }

  console.log(`Found ${entriesWithoutImages.length} entries. Beginning downloading...`);

  for (let i = 0; i < entriesWithoutImages.length; i++) {
    const entry = entriesWithoutImages[i];
    
    process.stdout.write(`📸 [${i + 1}/${entriesWithoutImages.length}] ${entry.artist} (${entry.country})... `);
    
    const images = await fetchArtistImages(entry.artist, entry.country);

    if (images.length > 0) {
      await prisma.entry.update({
        where: { id: entry.id },
        data: { imageUrls: images }
      });
      console.log(`Saved ${images.length}`);
    } else {
      console.log(`No results`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('Successfully fetched images');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });