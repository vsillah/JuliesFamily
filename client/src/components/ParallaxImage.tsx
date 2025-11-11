import { useState, useEffect, useRef, ImgHTMLAttributes } from "react";

interface ParallaxImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  intensity?: number; // How strong the parallax effect is (0-1)
}

export default function ParallaxImage({ 
  intensity = 0.5, 
  className = "",
  ...props 
}: ParallaxImageProps) {
  const [scale, setScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const updateParallax = () => {
      const rect = image.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the element is visible in viewport
      // When element enters from bottom: position goes from 1 to 0
      // When element exits from top: position goes from 0 to -1
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const distanceFromCenter = (elementCenter - viewportCenter) / viewportCenter;
      
      // Scale from 1.0 to 1.1 based on scroll position
      // Closer to center = more zoomed in
      const parallaxScale = 1 + (Math.abs(distanceFromCenter) * 0.05 * intensity);
      const clampedScale = Math.min(Math.max(parallaxScale, 1), 1.1);
      
      setScale(clampedScale);
    };

    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateParallax);
    };

    // Initial calculation
    updateParallax();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateParallax, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateParallax);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity]);

  return (
    <img
      ref={imageRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform: `scale(${scale})` }}
      loading="lazy"
      {...props}
    />
  );
}
