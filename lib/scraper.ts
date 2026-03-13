import * as cheerio from "cheerio";

async function fetchFromLastFm(artistQuery: string): Promise<string[]> {
  try {
    const formattedArtist = encodeURIComponent(artistQuery.trim()).replace(/%20/g, "+");
    const url = `https://www.last.fm/music/${formattedArtist}/+images`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[Scraper] Błąd HTTP od Last.fm! Kod: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const imageUrls: string[] = [];

    $(".image-list img").each((index, element) => {
      if (imageUrls.length >= 15) return false;
      const src = $(element).attr("src");
      if (src) {
        const highResUrl = src.replace(/\/i\/u\/[a-zA-Z0-9]+\//, "/i/u/ar0/");
        imageUrls.push(highResUrl);
      }
    });

    return imageUrls;
  } catch (error) {
    console.error(`[Scraper] Błąd dla ${artistQuery}:`, error);
    return [];
  }
}

function interleaveArrays(arrays: string[][]): string[] {
  const result: string[] = [];
  const maxLength = Math.max(...arrays.map((arr) => arr.length));

  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

function fillToTarget(images: string[], target: number): string[] {
  if (images.length === 0) return [];
  const result: string[] = [];
  while (result.length < target) {
    result.push(...images);
  }
  return result.slice(0, target);
}

export async function fetchArtistImages(artist: string): Promise<string[]> {
  const TARGET_COUNT = 15;

  let images = await fetchFromLastFm(artist);

  if (images.length >= 3) {
    return fillToTarget(images, TARGET_COUNT);
  }

  const splitRegex = /\s+(?:ft\.|feat\.|feat|&|x|,|and)\s+/i;

  if (splitRegex.test(artist)) {
    const individualArtists = artist
      .split(splitRegex)
      .map((a) => a.trim())
      .filter(Boolean);

    if (individualArtists.length > 1) {
      const results = await Promise.all(
        individualArtists.map((a) => fetchFromLastFm(a)),
      );
      const combinedImages = interleaveArrays(results);

      if (combinedImages.length > 0) {
        return fillToTarget(combinedImages, TARGET_COUNT);
      }
    }
  }

  if (images.length === 0) {
    return Array(TARGET_COUNT).fill("/fallback-postcard.png");
  }
  return fillToTarget(images, TARGET_COUNT);
}