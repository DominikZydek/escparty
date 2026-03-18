chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchImages") {
    const formattedArtist = encodeURIComponent(request.artist.trim()).replace(/%20/g, "+");
    const url = `https://www.last.fm/music/${formattedArtist}/+images`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.text();
      })
      .then(async (html) => {
        const listMatch = html.match(/class="image-list"[^>]*>([\s\S]*?)<\/ul>/);
        
        if (!listMatch || !listMatch[1]) {
          return sendResponse({ success: true, images: [] });
        }

        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        const checkPromises = [];

        while ((match = imgRegex.exec(listMatch[1])) !== null) {
          if (checkPromises.length >= 15) break;
          
          let originalSrc = match[1];
          let highResUrl = originalSrc.replace(/\/i\/u\/[a-zA-Z0-9]+\//, "/i/u/ar0/");

          const checkImage = fetch(highResUrl, { method: 'HEAD' })
            .then(res => {
              return res.ok ? highResUrl : originalSrc;
            })
            .catch(() => originalSrc);

          checkPromises.push(checkImage);
        }

        const validImages = await Promise.all(checkPromises);
        
        sendResponse({ success: true, images: validImages });
      })
      .catch(error => {
        console.error("Last.fm fetch error:", error);
        sendResponse({ success: false, images: ["/fallback-postcard.png"] });
      });

    return true; 
  }
});