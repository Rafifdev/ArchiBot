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
      { rootMargin: "150px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={props.className}>
      {visible && (
        <UnicornSceneErrorBoundary>
          <UnicornScene {...props} className="w-full h-full" />
        </UnicornSceneErrorBoundary>
      )}
    </div>
  );
};
