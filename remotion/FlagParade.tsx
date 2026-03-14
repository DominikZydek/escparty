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
  Audio,
  staticFile,
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
              objectPosition: "center",
              transform: `scale(${scale})`,
            }}
          />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const CountryParadeScreen: React.FC<{
  country: string;
  countryCode: string;
  images: string[];
}> = ({ country, countryCode, images }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const [handle] = useState(() => delayRender(`Ładowanie zdjęć: ${country}`));
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

  const [color1, color2] = getFlagColors(country);

  const flagHoldFrames = Math.floor(fps * 1.5);
  const fadeStartFrame = durationInFrames - flagHoldFrames;
  const fadeEndFrame = fadeStartFrame + Math.floor(fps * 0.3);

  const contentOpacity = interpolate(
    frame,
    [fadeStartFrame, fadeEndFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const fullFlagOpacity = interpolate(
    frame,
    [fadeStartFrame, fadeEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const fullFlagScale = interpolate(
    frame,
    [fadeStartFrame, durationInFrames],
    [1.1, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const textScale = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
  const textOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  const len = images && images.length > 0 ? images.length : 1;
  const imageDuration = Math.floor(durationInFrames / len);
  const getCircularIndex = (i: number, length: number) =>
    ((i % length) + length) % length;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.01, pointerEvents: "none" }}>
        {images?.map((src, i) => (
          <Img
            key={`cache-${i}`}
            src={src}
            style={{ width: "100%", height: "100%" }}
          />
        ))}
      </AbsoluteFill>

      <Audio
        src={staticFile(`sounds/country_announcements/${countryCode}.mp3`)}
      />

      <AbsoluteFill
        style={{ backgroundColor: "#000", zIndex: 1, opacity: fullFlagOpacity }}
      >
        <div
          className={`fi fi-${countryCode.toLowerCase()}`}
          style={{
            width: "100%",
            height: "100%",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transform: `scale(${fullFlagScale})`,
            margin: 0,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill style={{ zIndex: 2, opacity: contentOpacity }}>
        {Array.from({ length: len }).map((_, index) => {
          const src =
            images && images.length > 0
              ? images[index]
              : "https://picsum.photos/1920/1080";
          const sideImg1 =
            images && images.length > 0
              ? images[getCircularIndex(index - 1, len)]
              : src;
          const sideImg2 =
            images && images.length > 0
              ? images[getCircularIndex(index - 2, len)]
              : src;

          const startFrame = index * imageDuration;
          const duration =
            index === len - 1 ? durationInFrames - startFrame : imageDuration;

          return (
            <Sequence
              key={`img-${index}`}
              from={startFrame}
              durationInFrames={duration}
            >
              <FullscreenImage
                src={src}
                isVertical={orientations[src] || false}
                sideImg1={sideImg1}
                sideImg2={sideImg2}
              />
            </Sequence>
          );
        })}

        <AbsoluteFill
          style={{
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: "100px",
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontFamily: "Impact, sans-serif",
              fontSize: "180px",
              color: color1,
              textShadow: `15px 15px 0px ${color2}`,
              margin: 0,
              textTransform: "uppercase",
              transform: `scale(${textScale})`,
              opacity: textOpacity,
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            {country}
          </h1>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export interface FlagParadeProps {
  contestName: string;
  entries: {
    country: string;
    countryCode: string;
    images: string[];
  }[];
}

export const FlagParade: React.FC<FlagParadeProps> = ({
  contestName,
  entries,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  const colors = {
    purple: "#010a40",
    pink: "#eb0273",
    cyan: "#21d9c9",
  };

  const introDuration = fps * 5;
  const outroDuration = fps * 5;
  const paradeDuration = durationInFrames - introDuration - outroDuration;

  const sortedEntries = [...entries].sort((a, b) =>
    a.country.localeCompare(b.country),
  );

  const framesPerCountry = Math.floor(paradeDuration / sortedEntries.length);

  const TitleScreen = () => (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: `radial-gradient(circle, ${colors.pink} 0%, ${colors.purple} 100%)`,
      }}
    >
      <h1
        style={{
          color: "white",
          fontFamily: "Montserrat",
          fontSize: "100px",
          margin: 0,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "15px",
          textAlign: "center",
          textShadow: `0 15px 40px rgba(0,0,0,0.5)`,
        }}
      >
        {contestName}
      </h1>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: colors.purple }}>
      <Audio src={staticFile("sounds/esc_flag_parade.mp3")} />

      <Sequence from={0} durationInFrames={introDuration}>
        <TitleScreen />
      </Sequence>

      {sortedEntries.map((entry, index) => {
        const startFrame = introDuration + index * framesPerCountry;
        const duration =
          index === sortedEntries.length - 1
            ? paradeDuration - index * framesPerCountry
            : framesPerCountry;

        return (
          <Sequence
            key={`parade-${entry.countryCode}`}
            from={startFrame}
            durationInFrames={duration}
          >
            <CountryParadeScreen
              country={entry.country}
              countryCode={entry.countryCode}
              images={entry.images}
            />
          </Sequence>
        );
      })}

      <Sequence
        from={durationInFrames - outroDuration}
        durationInFrames={outroDuration}
      >
        <TitleScreen />
      </Sequence>
    </AbsoluteFill>
  );
};
