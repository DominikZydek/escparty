import React, { useMemo, useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Img, interpolate, spring, Sequence, random, delayRender, continueRender } from "remotion";

const EuroImage: React.FC<{ src: string; style?: React.CSSProperties; delayFrames?: number; zIndex?: number }> = ({ src, style, delayFrames = 0, zIndex = 1 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delayFrames, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(frame - delayFrames, [0, 60], [1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const customTransform = style?.transform || "";
  const customStyle = { ...style };
  delete customStyle.transform; 
  return (
    <div style={{ position: "absolute", ...customStyle, zIndex, opacity, transform: `scale(${scale}) ${customTransform}`, borderRadius: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};

type SceneProps = { getImg: (offset: number) => string };

const Layouts = {
  Opening: ({ getImg }: SceneProps) => (
    <EuroImage src={getImg(0)} style={{ left: "15%", top: "10%", width: "70%", height: "80%" }} />
  ),
  Split: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "5%", top: "10%", width: "42%", height: "80%" }} delayFrames={0} /><EuroImage src={getImg(1)} style={{ right: "5%", top: "10%", width: "42%", height: "80%" }} delayFrames={10} /></>
  ),
  Triptych: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: '5%', top: '10%', width: '45%', height: '55%' }} delayFrames={0} zIndex={10} /><EuroImage src={getImg(1)} style={{ right: '5%', top: '35%', width: '45%', height: '55%' }} delayFrames={10} zIndex={11} /><EuroImage src={getImg(2)} style={{ left: '27.5%', top: '22.5%', width: '45%', height: '55%' }} delayFrames={20} zIndex={12} /></>
  ),
  Mosaic: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "10%", top: "10%", width: "38%", height: "38%" }} delayFrames={0} /><EuroImage src={getImg(1)} style={{ right: "10%", top: "10%", width: "38%", height: "38%" }} delayFrames={5} /><EuroImage src={getImg(2)} style={{ left: "10%", bottom: "10%", width: "38%", height: "38%" }} delayFrames={10} /><EuroImage src={getImg(3)} style={{ right: "10%", bottom: "10%", width: "38%", height: "38%" }} delayFrames={15} /></>
  ),
  Polaroids: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "10%", top: "20%", width: "40%", height: "60%", transform: "rotate(-12deg)" }} delayFrames={0} zIndex={10} /><EuroImage src={getImg(1)} style={{ right: "10%", top: "15%", width: "40%", height: "60%", transform: "rotate(15deg)" }} delayFrames={8} zIndex={11} /><EuroImage src={getImg(2)} style={{ left: "30%", top: "15%", width: "40%", height: "70%" }} delayFrames={16} zIndex={12} /></>
  ),
  Filmstrip: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "5%", top: "25%", width: "20%", height: "50%" }} delayFrames={0} /><EuroImage src={getImg(1)} style={{ left: "28%", top: "25%", width: "20%", height: "50%" }} delayFrames={5} /><EuroImage src={getImg(2)} style={{ left: "51%", top: "25%", width: "20%", height: "50%" }} delayFrames={10} /><EuroImage src={getImg(3)} style={{ left: "74%", top: "25%", width: "20%", height: "50%" }} delayFrames={15} /></>
  ),
  Diagonal: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "10%", top: "5%", width: "45%", height: "45%" }} delayFrames={0} /><EuroImage src={getImg(1)} style={{ right: "10%", bottom: "5%", width: "45%", height: "45%" }} delayFrames={10} /></>
  ),
  Focus: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "5%", top: "25%", width: "25%", height: "50%" }} delayFrames={0} /><EuroImage src={getImg(1)} style={{ right: "5%", top: "25%", width: "25%", height: "50%" }} delayFrames={5} /><EuroImage src={getImg(2)} style={{ left: "25%", top: "10%", width: "50%", height: "80%" }} delayFrames={15} zIndex={10} /></>
  ),
  Cascading: ({ getImg }: SceneProps) => (
    <><EuroImage src={getImg(0)} style={{ left: "10%", top: "10%", width: "35%", height: "45%", transform: "rotate(-5deg)" }} delayFrames={0} zIndex={10} /><EuroImage src={getImg(1)} style={{ left: "32%", top: "25%", width: "35%", height: "45%", transform: "rotate(5deg)" }} delayFrames={10} zIndex={11} /><EuroImage src={getImg(2)} style={{ right: "10%", bottom: "10%", width: "35%", height: "45%", transform: "rotate(-2deg)" }} delayFrames={20} zIndex={12} /></>
  ),
  Closing: ({ getImg }: SceneProps) => (
    <EuroImage src={getImg(0)} style={{ right: "5%", top: "10%", width: "60%", height: "80%" }} />
  )
};

export interface PostcardProps { artistName: string; country: string; images: string[]; }

export const EurovisionPostcard: React.FC<PostcardProps> = ({ artistName, country, images }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const sceneDuration = Math.floor(durationInFrames / 6);

  const [handle] = useState(() => delayRender("Pobieranie zdjęć przed startem"));

  useEffect(() => {
    if (!images || images.length === 0) {
      continueRender(handle);
      return;
    }

    const preloadImages = async () => {
      const promises = images.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; 
          img.src = src;
        });
      });

      await Promise.all(promises);
      continueRender(handle);
    };

    preloadImages();
  }, [images, handle]);

  const getImgForScene = (sceneIndex: number, imgOffset: number) => {
    if (!images || images.length === 0) return "https://picsum.photos/800/1000";
    const globalIndex = (sceneIndex * 3) + imgOffset; 
    return images[globalIndex % images.length];
  };

  const dynamicScenes = useMemo(() => {
    const middlePool = [
      Layouts.Split, 
      Layouts.Triptych, 
      Layouts.Mosaic, 
      Layouts.Polaroids, 
      Layouts.Filmstrip, 
      Layouts.Diagonal, 
      Layouts.Focus, 
      Layouts.Cascading
    ];
    
    const shuffled = [...middlePool];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const seed = `${artistName}-${i}`;
      const randomIndex = Math.floor(random(seed) * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }

    return [
      Layouts.Opening,
      shuffled[0],
      shuffled[1],
      shuffled[2],
      shuffled[3],
      Layouts.Closing
    ];
  }, [artistName]);

  const bgPosX = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 100, 0]);
  const bgPosY = interpolate(frame, [0, durationInFrames / 4, durationInFrames * 0.75, durationInFrames], [0, 0, 100, 0]);
  const textOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const textY = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#010a40", overflow: "hidden", fontFamily: "Montserrat, sans-serif" }}>
      
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle at 15% 50%, #eb0273, transparent 60%), radial-gradient(circle at 85% 30%, #21d9c9, transparent 60%), radial-gradient(circle at 50% 80%, #f20c59, transparent 60%)`, backgroundSize: "180% 180%", backgroundPosition: `${bgPosX}% ${bgPosY}%`, filter: "blur(120px)", opacity: 0.7, zIndex: 0 }} />
      <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`, opacity: 0.05, mixBlendMode: "overlay", pointerEvents: "none", zIndex: 1 }} />

      <AbsoluteFill style={{ zIndex: 2 }}>
        {dynamicScenes.map((SceneComponent, index) => (
          <Sequence key={index} from={sceneDuration * index} durationInFrames={index === 5 ? undefined : sceneDuration}>
            <SceneComponent getImg={(offset) => getImgForScene(index, offset)} />
          </Sequence>
        ))}
      </AbsoluteFill>

      <div style={{ position: "absolute", bottom: 80, left: 100, opacity: textOpacity, transform: `translateY(${100 - textY * 100}px)`, color: "#ffffff", textShadow: "0 4px 15px rgba(0,0,0,0.8)", zIndex: 100 }}>
        <h1 style={{ fontSize: "90px", margin: 0, fontWeight: 800 }}>{artistName}</h1>
        <h2 style={{ fontSize: "40px", margin: 0, fontWeight: 400, letterSpacing: "8px", color: "#21d9c9" }}>{country.toUpperCase()}</h2>
      </div>
    </AbsoluteFill>
  );
};