import React, { useEffect, useRef, useState } from "react";
import UnicornScene, { type UnicornSceneProps } from "unicornstudio-react";

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
    console.warn("UnicornScene failed to initialize:", error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export const SafeUnicornScene: React.FC<UnicornSceneProps> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setVisible(entry.isIntersecting);
        });
      },
      { rootMargin: "60px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Cap DPI strictly at 1.0 to prevent GPU shader lag on integrated graphics
  const effectiveDpi = Math.min(props.dpi ?? 1, 1);
  const effectiveFps = props.fps && props.fps <= 30 ? props.fps : 30;

  return (
    <div ref={ref} className={props.className}>
      {visible && (
        <UnicornSceneErrorBoundary>
          <UnicornScene
            {...props}
            dpi={effectiveDpi}
            fps={effectiveFps}
            className="w-full h-full pointer-events-none"
          />
        </UnicornSceneErrorBoundary>
      )}
    </div>
  );
};
