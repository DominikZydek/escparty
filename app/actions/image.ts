"use server";

async function searchWikimedia(query: string): Promise<string[]> {
  const endpoint = `https://commons.wikimedia.org/w/api.php`;
  
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "imageinfo",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: "15",
    iiprop: "url",
    iiurlwidth: "800",
    origin: "*"
  });

  try {
    const res = await fetch(`${endpoint}?${params.toString()}`);
    const data = await res.json();

    if (!data.query || !data.query.pages) {
      return [];
    }

    const pages = Object.values(data.query.pages) as any[];
    
    const imageUrls = pages
      .map(page => page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url)
      .filter(url => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png');
      });

    return imageUrls;
  } catch (error) {
    console.error(`Error while querying: ${query}`, error);
    return [];
  }
}

export async function fetchArtistImages(
  artist: string, 
  country: string, 
  isEurovision: boolean = true
): Promise<string[]> {
  console.log(`Searching for pictures of: ${artist} (${country}) [Is it ESC: ${isEurovision}]`);
  
  try {
    let urls: string[] = [];

    if (isEurovision) {
      // EUROVISION
      urls = await searchWikimedia(`${artist} Eurovision ${country}`);

      if (urls.length < 3) {
        const fallbackUrls = await searchWikimedia(`${artist} Eurovision`);
        urls = [...new Set([...urls, ...fallbackUrls])]; 
      }
      if (urls.length < 3) {
        const fallbackUrls2 = await searchWikimedia(artist);
        urls = [...new Set([...urls, ...fallbackUrls2])];
      }
    } else {
      // CUSTOM CONTEST
      urls = await searchWikimedia(artist);

      // additional steps
      if (urls.length < 3) {
        const fallbackUrls = await searchWikimedia(`${artist} singer`);
        urls = [...new Set([...urls, ...fallbackUrls])];
      }
      if (urls.length < 3) {
        const fallbackUrls2 = await searchWikimedia(`${artist} performing`);
        urls = [...new Set([...urls, ...fallbackUrls2])];
      }
    }

    return urls.slice(0, 10);
  } catch (error) {
    console.error("Error while fetching pictures:", error);
    return [];
  }
}