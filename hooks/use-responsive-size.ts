"use client";

import { useEffect, useState } from "react";

type ScreenSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export function useResponsiveSize() {
  const [screenSize, setScreenSize] = useState<ScreenSize | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 475) {
        setScreenSize("xs");
      } else if (width < 640) {
        setScreenSize("sm");
      } else if (width < 768) {
        setScreenSize("md");
      } else if (width < 1024) {
        setScreenSize("lg");
      } else if (width < 1280) {
        setScreenSize("xl");
      } else {
        setScreenSize("2xl");
      }
    };

    // Initialize on mount
    handleResize();
    
    // Add resize listener
    window.addEventListener("resize", handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Return isXs, isSm, etc. based on current screen size
  return {
    screenSize,
    isMounted,
    isXs: isMounted && screenSize === "xs",
    isSm: isMounted && (screenSize === "xs" || screenSize === "sm"),
    isMd: isMounted && (screenSize === "xs" || screenSize === "sm" || screenSize === "md"),
    isLg: isMounted && (screenSize === "xs" || screenSize === "sm" || screenSize === "md" || screenSize === "lg"),
    isXl: isMounted && (screenSize === "xs" || screenSize === "sm" || screenSize === "md" || screenSize === "lg" || screenSize === "xl"),
    is2xl: isMounted && screenSize === "2xl",
  };
}
