import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  spring,
} from "remotion";
import { getFlagColors } from "@/lib/countries";

export const VoteScreen: React.FC<{ country: string; image: string }> = ({
  country,
  image,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const [color1, color2] = getFlagColors(country);

  const textFrame = Math.min(frame, fps);

  const opacity = interpolate(textFrame, [0, 15], [0, 1]);
  const yOffset = spring({
    frame: textFrame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const translateY = interpolate(yOffset, [0, 1], [50, 0]);

  const scale = interpolate(frame, [0, durationInFrames], [1, 1.1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#010a40", overflow: "hidden" }}>
      <AbsoluteFill>
        <Img
          src={image}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
            filter: "brightness(0.3) grayscale(20%)",
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", zIndex: 10 }}
      >
        <h2
          style={{
            color: "white",
            fontFamily: "Montserrat, sans-serif",
            fontSize: "60px",
            margin: "0 0 -20px 0",
            opacity: opacity,
            transform: `translateY(${translateY}px)`,
            letterSpacing: "15px",
            fontWeight: 300,
          }}
        >
          VOTE FOR
        </h2>
        <h1
          style={{
            fontFamily: "Impact, sans-serif",
            fontSize: "220px",
            color: color1,
            textShadow: `15px 15px 0px ${color2}`,
            margin: 0,
            opacity: opacity,
            transform: `translateY(${translateY}px)`,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {country}
        </h1>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
