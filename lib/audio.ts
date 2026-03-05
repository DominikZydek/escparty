let currentTheme: HTMLAudioElement | null = null;
let bgMusic: HTMLAudioElement | null = null;
let isMutedByUser = true;

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export const initBackgroundMusic = (src: string, volume: number = 0.5) => {
  if (typeof window === "undefined" || isMobileDevice() || bgMusic) return;

  bgMusic = new Audio(src);
  bgMusic.loop = true;
  bgMusic.volume = volume;
};

export const playBackgroundMusic = () => {
  if (isMobileDevice() || isMutedByUser) return;

  if (bgMusic && !currentTheme) {
    bgMusic.play().catch(() => console.warn("Audio play blocked"));
  }
};

export const pauseBackgroundMusic = () => {
  if (bgMusic) {
    bgMusic.pause();
  }
};

export const toggleBackgroundMusic = (): boolean => {
  if (isMobileDevice()) return false;

  isMutedByUser = !isMutedByUser;

  if (isMutedByUser) {
    pauseBackgroundMusic();
  } else {
    playBackgroundMusic();
  }

  return !isMutedByUser;
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
  currentTheme.play().catch(() => {});
};

export const stopTheme = (resumeBackground: boolean = true) => {
  if (currentTheme) {
    currentTheme.pause();
    currentTheme.currentTime = 0;
    currentTheme = null;
  }

  if (resumeBackground && !isMobileDevice() && !isMutedByUser) {
    playBackgroundMusic();
  }
};