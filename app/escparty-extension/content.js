window.addEventListener("message", (event) => {
  if (event.source !== window || !event.data) return;

  if (event.data.type === "CHECK_EXTENSION_PING") {
    window.postMessage({ type: "CHECK_EXTENSION_PONG" }, "*");
    return;
  }

  if (event.data.type === "FETCH_LASTFM_IMAGES") {
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
  }
});