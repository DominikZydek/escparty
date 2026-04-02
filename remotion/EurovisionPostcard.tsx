import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Sequence,
  delayRender,
  continueRender,
  spring,
  Easing,
} from "remotion";

import { getFlagColors } from "@/lib/countries";

const FullscreenImage: React.FC<{
  src: string;
  isVertical: boolean;
  sideImg1: string;
  sideImg2: string;
}> = ({ src, isVertical, sideImg1, sideImg2 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.05]);

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {isVertical ? (
        <>
          <AbsoluteFill style={{ width: "30%", overflow: "hidden" }}>
            <Img
              src={sideImg1}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.35) grayscale(30%)",
                transform: `scale(${scale})`,
              }}
            />
          </AbsoluteFill>

          <AbsoluteFill
            style={{ left: "70%", width: "30%", overflow: "hidden" }}
          >
            <Img
              src={sideImg2}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "brightness(0.35) grayscale(30%)",
                transform: `scale(${scale})`,
              }}
            />
          </AbsoluteFill>

          <AbsoluteFill
            style={{
              left: "30%",
              width: "40%",
              overflow: "hidden",
              boxShadow: "0 0 60px rgba(0,0,0,0.9)",
            }}
          >
            <Img
              src={src}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                transform: `scale(${scale})`,
              }}
            />
          </AbsoluteFill>
        </>
      ) : (
        <AbsoluteFill>
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
              transform: `scale(${scale})`,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export interface PostcardProps {
  artistName: string;
  songTitle: string;
  country: string;
  images: string[];
}

export const EurovisionPostcard: React.FC<PostcardProps> = ({
  artistName,
  songTitle,
  country,
  images,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const [handle] = useState(() => delayRender("Pobieranie i mierzenie zdjęć"));
  const [orientations, setOrientations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!images || images.length === 0) {
      continueRender(handle);
      return;
    }

    const preloadImages = async () => {
      const newOrientations: Record<string, boolean> = {};

      const promises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            newOrientations[src] = img.naturalHeight > img.naturalWidth;
            resolve(true);
          };
          img.onerror = resolve;
          img.src = src;
        });
      });

      await Promise.all(promises);
      setOrientations(newOrientations);
      continueRender(handle);
    };

    preloadImages();
  }, [images, handle]);

  const [flagColor1, flagColor2] = getFlagColors(country);

  const colors = {
    primary: flagColor1,
    secondary: flagColor2,
    purple: "#010a40",
    red: "#f20c59",
    pink: "#eb0273",
    cyan: "#21d9c9",
  };

  const totalImages = 14;
  const introDuration = fps * 4;
  const outroDuration = fps * 7;

  const remainingFrames = durationInFrames - introDuration;
  const fastImageDuration = Math.floor(remainingFrames / (totalImages - 1));

  const flashStart = Math.floor(fps * 1.0);
  const slamFrame = Math.floor(fps * 1.6);

  const isPreFlash = frame < flashStart;
  const isFlashing = frame >= flashStart && frame < slamFrame;
  const isSlammed = frame >= slamFrame;

  const preFlashOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const preFlashY = interpolate(frame, [0, 30], [20, 0], {
    extrapolateRight: "clamp",
  });

  const flashStyles = [
    { font: "Courier New, monospace", color: colors.primary, scale: 1.2 },
    { font: "Times New Roman, serif", color: colors.red, scale: 0.8 },
    { font: "Arial, sans-serif", color: colors.secondary, scale: 1.5 },
    { font: "Georgia, serif", color: "#ffffff", scale: 0.9 },
    { font: "Verdana, sans-serif", color: colors.primary, scale: 1.1 },
  ];
  const currentFlash = flashStyles[Math.floor(frame / 3) % flashStyles.length];

  const slamScale = spring({
    frame: Math.max(0, frame - slamFrame),
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const countryScale = interpolate(slamScale, [0, 1], [3, 1]);

  const outroStartFrame = durationInFrames - outroDuration;
  const isOutro = frame >= outroStartFrame;
  const outroLocalFrame = Math.max(0, frame - outroStartFrame);

  const overlayOpacity = interpolate(outroLocalFrame, [0, 30], [0, 0.85], {
    extrapolateRight: "clamp",
  });
  const countryOpacity = interpolate(outroLocalFrame, [15, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineScale = spring({
    frame: Math.max(0, outroLocalFrame - 40),
    fps,
    config: { damping: 14 },
  });

  const textOpacity = interpolate(outroLocalFrame, [60, 90], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(outroLocalFrame, [60, 90], [40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const songOpacity = interpolate(outroLocalFrame, [75, 105], [0, 1], {
    extrapolateRight: "clamp",
  });
  const songY = interpolate(outroLocalFrame, [75, 105], [30, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  const getCircularIndex = (i: number, length: number) => {
    return ((i % length) + length) % length;
  };

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.purple, overflow: "hidden" }}
    >
      <AbsoluteFill style={{ opacity: 0.01, pointerEvents: "none" }}>
        {images?.map((src, i) => (
          <Img
            key={`cache-${i}`}
            src={src}
            style={{ width: "100%", height: "100%" }}
          />
        ))}
      </AbsoluteFill>

      {Array.from({ length: totalImages }).map((_, index) => {
        const len = images && images.length > 0 ? images.length : 1;

        const src =
          images && images.length > 0
            ? images[index % len]
            : "https://picsum.photos/1920/1080";
        const sideImg1 =
          images && images.length > 0
            ? images[getCircularIndex(index - 1, len)]
            : src;
        const sideImg2 =
          images && images.length > 0
            ? images[getCircularIndex(index - 2, len)]
            : src;

        const startFrame =
          index === 0 ? 0 : introDuration + (index - 1) * fastImageDuration;
        const duration = durationInFrames - startFrame;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={duration}>
            <FullscreenImage
              src={src}
              isVertical={orientations[src] || false}
              sideImg1={sideImg1}
              sideImg2={sideImg2}
            />
          </Sequence>
        );
      })}

      <Sequence from={0} durationInFrames={introDuration}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: isPreFlash
              ? "rgba(1, 10, 64, 0.4)"
              : isFlashing
                ? "rgba(1, 10, 64, 0.2)"
                : "rgba(1, 10, 64, 0.1)",
            transition: "background-color 0.1s",
          }}
        >
          {isPreFlash && (
            <h2
              style={{
                fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive",
                fontSize: "90px",
                color: "white",
                opacity: preFlashOpacity,
                transform: `translateY(${preFlashY}px) rotate(-5deg)`,
                margin: 0,
                textShadow: "0px 5px 15px rgba(0,0,0,0.5)",
              }}
            >
              Representing...
            </h2>
          )}
          {isFlashing && (
            <h1
              style={{
                fontFamily: currentFlash.font,
                fontSize: "150px",
                color: currentFlash.color,
                margin: 0,
                textTransform: "uppercase",
                transform: `scale(${currentFlash.scale}) rotate(${Math.random() * 4 - 2}deg)`,
                textShadow: `10px 10px 0px ${colors.purple}`,
              }}
            >
              {country}
            </h1>
          )}
          {isSlammed && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontSize: "30px",
                  color: "white",
                  margin: "0 0 -20px 0",
                  textTransform: "uppercase",
                  letterSpacing: "10px",
                  opacity: slamScale,
                }}
              >
                Representing
              </p>
              <h1
                style={{
                  fontFamily: "Impact, sans-serif",
                  fontSize: "220px",
                  color: colors.primary,
                  margin: 0,
                  textTransform: "uppercase",
                  lineHeight: 1,
                  textShadow: `15px 15px 0px ${colors.secondary}`,
                  transform: `scale(${countryScale})`,
                  opacity: slamScale,
                }}
              >
                {country}
              </h1>
            </div>
          )}
        </AbsoluteFill>
      </Sequence>

      {isOutro && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(1, 10, 64, ${overlayOpacity})`,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "80%",
            }}
          >
            <h3
              style={{
                color: colors.primary,
                fontFamily: "Montserrat, sans-serif",
                fontSize: "50px",
                letterSpacing: "20px",
                margin: 0,
                textTransform: "uppercase",
                fontWeight: 600,
                opacity: countryOpacity,
                transform: `translateY(${50 - countryOpacity * 50}px)`,
              }}
            >
              {country}
            </h3>

            <div
              style={{
                width: `${lineScale * 100}%`,
                height: "8px",
                backgroundColor: colors.secondary,
                margin: "30px 0",
                borderRadius: "4px",
                boxShadow: `0 0 20px ${colors.secondary}`,
              }}
            />

            <h1
              style={{
                color: "white",
                fontFamily: "Impact, sans-serif",
                fontSize: "140px",
                margin: 0,
                textTransform: "uppercase",
                textShadow: `0px 10px 30px ${colors.primary}`,
                textAlign: "center",
                lineHeight: 1.1,
                opacity: textOpacity,
                transform: `translateY(${textY}px)`,
              }}
            >
              {artistName}
            </h1>

            <h2
              style={{
                color: colors.secondary,
                fontFamily: "Montserrat, sans-serif",
                fontSize: "50px",
                letterSpacing: "8px",
                margin: "15px 0 0 0",
                textTransform: "uppercase",
                fontWeight: 500,
                textAlign: "center",
                opacity: songOpacity,
                transform: `translateY(${songY}px)`,
                textShadow: `0px 5px 15px rgba(0,0,0,0.5)`,
              }}
            >
              "{songTitle}"
            </h2>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
