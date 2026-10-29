import React from "react";
import UnicornScene, { type UnicornSceneProps } from "unicornstudio-react";

/**
 * Error boundary to gracefully catch any WebGL context loss or initialization issues
 */
class UnicornSceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("UnicornScene WebGL fallback activated:", error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

/**
 * Solana.com Production-Grade Optimized Unicorn Studio Scene:
 * 
 * 1. Kept mounted in the DOM to avoid synchronous GLSL re-compilation on scroll.
 * 2. scale={0.75}: Renders shaders at 75% resolution (reduces GPU fragment fill by 44%).
 * 3. dpi={1}: Enforces 1.0 pixel density so Retina/4K displays don't choke the GPU.
 * 4. fps={30}: 30 FPS cap cuts GPU power consumption in half while maintaining smooth motion.
 * 5. lazyLoad={true}: Native Unicorn Studio idle loader for non-blocking initialization.
 */
export const SafeUnicornScene: React.FC<UnicornSceneProps> = (props) => {
  return (
    <div className={props.className}>
      <UnicornSceneErrorBoundary>
        <UnicornScene
          {...props}
          scale={props.scale ?? 0.75}
          dpi={Math.min(props.dpi ?? 1, 1)}
          fps={30}
          lazyLoad={props.lazyLoad ?? true}
          production={true}
          className="w-full h-full pointer-events-none"
        />
      </UnicornSceneErrorBoundary>
    </div>
  );
};
