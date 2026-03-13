chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchImages") {
    const formattedArtist = encodeURIComponent(request.artist.trim()).replace(/%20/g, "+");
    const url = `https://www.last.fm/music/${formattedArtist}/+images`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.text();
      })
      .then(html => {
        const images = [];
        const listMatch = html.match(/class="image-list"[^>]*>([\s\S]*?)<\/ul>/);

        if (listMatch && listMatch[1]) {
          const imgRegex = /<img[^>]+src="([^">]+)"/g;
          let match;
          
          while ((match = imgRegex.exec(listMatch[1])) !== null) {
            if (images.length >= 15) break;
            let src = match[1];
            let highResUrl = src.replace(/\/i\/u\/[a-zA-Z0-9]+\//, "/i/u/ar0/");
            images.push(highResUrl);
          }
        }
        
        sendResponse({ success: true, images: images });
      })
      .catch(error => {
        console.error("Last.fm fetch error:", error);
        sendResponse({ success: false, images: ["/fallback-postcard.png"] });
      });

    return true; 
  }
});