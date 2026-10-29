import React from "react";
import { type UnicornSceneProps } from "unicornstudio-react";

/**
 * High-Performance Ambient Scene (Option A - Zero-Lag Solution)
 *
 * Instead of spinning up heavy WebGL fragment shaders and compiling Direct3D
 * pipeline state synchronously during scroll (which causes the 300ms browser freeze),
 * this component renders silky-smooth, GPU-accelerated ambient overlays using native
 * CSS compositor animations and pre-rendered WebP artwork.
 */
export const SafeUnicornScene: React.FC<UnicornSceneProps> = ({
  projectId,
  className,
}) => {
  if (projectId === "community") {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className || ""}`}>
        {/* Crisp high-resolution ambient nebula backdrop for community section */}
        <img
          src="/src/img/index/decor-bg.webp"
          alt=""
          decoding="async"
          loading="lazy"
          className="w-full h-full object-cover opacity-70 transform-gpu"
        />
        {/* Subtle hardware-accelerated ambient purple/green pulse */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-[#9945FF]/15 via-transparent to-[#14F195]/10 mix-blend-screen animate-pulse"
          style={{ animationDuration: "6s" }}
        />
      </div>
    );
  }

  if (projectId === "performance") {
    return (
      <div className={`pointer-events-none select-none overflow-hidden ${className || ""}`}>
        {/* Ambient glow accent for performance section */}
        <div
          className="absolute inset-0 bg-radial from-[#9945FF]/10 via-transparent to-transparent mix-blend-screen transform-gpu"
        />
      </div>
    );
  }

  // Hero section ambient accent
  return (
    <div className={`pointer-events-none select-none overflow-hidden ${className || ""}`}>
      {/* Hardware-accelerated ambient illumination */}
      <div
        className="absolute inset-0 bg-radial from-[#14F195]/10 via-transparent to-transparent mix-blend-screen transform-gpu animate-pulse"
        style={{ animationDuration: "8s" }}
      />
    </div>
  );
};
