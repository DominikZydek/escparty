let currentTheme: HTMLAudioElement | null = null;
let bgMusic: HTMLAudioElement | null = null;
let hasInteracted = false;

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  // check if mobile
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const playTheme = (
  src: string,
  loop: boolean = true,
  volume: number = 0.5,
) => {
  if (typeof window === "undefined" || isMobileDevice()) return;

  pauseBackgroundMusic();

  if (currentTheme) {
    currentTheme.pause();
    currentTheme.currentTime = 0;
  }
  currentTheme = new Audio(src);
  currentTheme.loop = loop;
  currentTheme.volume = volume;

  currentTheme
    .play()
    .then(() => {
      console.log("Theme playing successfully:", src);
    })
    .catch((e) => {
      console.warn("Theme autoplay blocked by browser:", e);
    });
};

export const stopTheme = (resumeBackground: boolean = true) => {
  if (currentTheme) {
    currentTheme.pause();
    currentTheme.currentTime = 0;
    currentTheme = null;
  }

  if (resumeBackground && !isMobileDevice()) {
    playBackgroundMusic();
  }
};

export const initBackgroundMusic = (src: string, volume: number = 0.5) => {
  if (typeof window === "undefined" || isMobileDevice()) return;

  if (!bgMusic) {
    console.log("Initializing background music...");
    bgMusic = new Audio(src);
    bgMusic.loop = true;
    bgMusic.volume = volume;
  }

  if (hasInteracted) {
    playBackgroundMusic();
  }
};

export const playBackgroundMusic = () => {
  // don't play on mobile
  if (isMobileDevice()) return;

  if (bgMusic && hasInteracted && !currentTheme) {
    console.log("Attempting to play background music...");
    bgMusic
      .play()
      .then(() => {
        console.log("Background music is playing!");
      })
      .catch((e) => {
        console.warn(
          "Background music blocked by browser. Interaction needed.",
          e,
        );
      });
  }
};

export const pauseBackgroundMusic = () => {
  if (bgMusic) {
    console.log("⏸️ Pausing background music.");
    bgMusic.pause();
  }
};

export const unlockAudio = () => {
  if (!hasInteracted) {
    console.log("Audio unlocked via user interaction!");
    hasInteracted = true;

    if (!isMobileDevice()) {
      playBackgroundMusic();
    }
  }
};
