window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data || event.data.type !== "FETCH_LASTFM_IMAGES") {
    return;
  }

  chrome.runtime.sendMessage(
    { action: "fetchImages", artist: event.data.artist },
    (response) => {
      window.postMessage({
        type: "FETCH_LASTFM_IMAGES_RESULT",
        artist: event.data.artist,
        images: response.images,
        success: response.success
      }, "*");
    }
  );
});