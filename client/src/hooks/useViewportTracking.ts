import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Viewport Tracking Hooks
 * 
 * Provides hooks for tracking when elements enter/exit viewport,
 * how long they remain visible, and scroll depth calculations.
 */

export interface ViewportTrackingOptions<T extends HTMLElement = HTMLDivElement> {
  threshold?: number | number[]; // Intersection threshold (0-1)
  rootMargin?: string; // Margin around root element
  trackDwell?: boolean; // Track time in viewport
  dwellThreshold?: number; // Milliseconds before considering "dwelled"
  onView?: () => void; // Callback when element becomes visible
  onDwell?: (dwellTime: number) => void; // Callback after dwell threshold
  onExit?: (totalTime: number) => void; // Callback when element exits viewport
  ref?: React.RefObject<T>; // Optional external ref to observe
}

/**
 * Hook to track when an element enters viewport and optionally track dwell time
 * 
 * @example
 * ```tsx
 * const { ref, isVisible, dwellTime } = useViewportTracking({
 *   threshold: 0.5,
 *   trackDwell: true,
 *   dwellThreshold: 3000,
 *   onDwell: (time) => trackEngagement(time)
 * });
 * 
 * return <div ref={ref}>Content</div>
 * ```
 */
export function useViewportTracking<T extends HTMLElement = HTMLDivElement>(
  options: ViewportTrackingOptions<T> = {}
) {
  const {
    threshold = 0.5,
    rootMargin = "0px",
    trackDwell = false,
    dwellThreshold = 3000,
    onView,
    onDwell,
    onExit,
    ref: externalRef,
  } = options;

  const internalRef = useRef<T>(null);
  const elementRef = externalRef || internalRef;
  const [isVisible, setIsVisible] = useState(false);
  const [dwellTime, setDwellTime] = useState(0);
  
  const entryTimeRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<NodeJS.Timeout | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasFiredDwellCallback = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element entered viewport
            setIsVisible(true);
            onView?.();
            
            if (trackDwell) {
              entryTimeRef.current = Date.now();
              hasFiredDwellCallback.current = false;
              
              // Set up dwell timer
              dwellTimerRef.current = setTimeout(() => {
                if (entryTimeRef.current && !hasFiredDwellCallback.current) {
                  const currentDwell = Date.now() - entryTimeRef.current;
                  hasFiredDwellCallback.current = true;
                  onDwell?.(currentDwell);
                }
              }, dwellThreshold);
              
              // Update dwell time continuously while visible
              updateIntervalRef.current = setInterval(() => {
                if (entryTimeRef.current) {
                  setDwellTime(Date.now() - entryTimeRef.current);
                }
              }, 100);
            }
          } else {
            // Element exited viewport
            setIsVisible(false);
            
            if (trackDwell && entryTimeRef.current) {
              const totalTime = Date.now() - entryTimeRef.current;
              onExit?.(totalTime);
              
              // Cleanup
              if (dwellTimerRef.current) {
                clearTimeout(dwellTimerRef.current);
                dwellTimerRef.current = null;
              }
              if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current);
                updateIntervalRef.current = null;
              }
              
              entryTimeRef.current = null;
              setDwellTime(0);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, [threshold, rootMargin, trackDwell, dwellThreshold, onView, onDwell, onExit]);

  return {
    ref: elementRef,
    isVisible,
    dwellTime,
  };
}

/**
 * Hook to track scroll depth of the page
 * 
 * @example
 * ```tsx
 * const { scrollDepth, hasScrolledPast } = useScrollDepth({
 *   threshold: 50,
 *   onScrollPast: () => trackEngagement()
 * });
 * ```
 */
export interface ScrollDepthOptions {
  threshold?: number; // Percentage (0-100)
  onScrollPast?: (depth: number) => void;
}

export function useScrollDepth(options: ScrollDepthOptions = {}) {
  const { threshold = 50, onScrollPast } = options;
  const [scrollDepth, setScrollDepth] = useState(0);
  const [hasScrolledPast, setHasScrolledPast] = useState(false);
  const hasFireCallback = useRef(false);

  const updateScrollDepth = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Calculate scroll depth as percentage
    const maxScroll = documentHeight - windowHeight;
    const currentDepth = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 100;
    
    setScrollDepth(Math.min(Math.round(currentDepth), 100));
    
    // Check if threshold crossed
    if (currentDepth >= threshold && !hasFireCallback.current) {
      setHasScrolledPast(true);
      hasFireCallback.current = true;
      onScrollPast?.(currentDepth);
    }
  }, [threshold, onScrollPast]);

  useEffect(() => {
    // Initial check
    updateScrollDepth();
    
    // Throttled scroll listener
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollDepth();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateScrollDepth);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateScrollDepth);
    };
  }, [updateScrollDepth]);

  return {
    scrollDepth,
    hasScrolledPast,
  };
}

/**
 * Hook to detect when user scrolls past a specific element
 * 
 * @example
 * ```tsx
 * const { ref, hasScrolledPast } = useScrolledPast({
 *   onScrollPast: () => trackHeroEngagement()
 * });
 * 
 * return <div ref={ref}>Hero Section</div>
 * ```
 */
export interface ScrolledPastOptions<T extends HTMLElement = HTMLDivElement> {
  onScrollPast?: () => void;
  once?: boolean; // Fire callback only once
  ref?: React.RefObject<T>; // Optional external ref to observe
}

export function useScrolledPast<T extends HTMLElement = HTMLDivElement>(
  options: ScrolledPastOptions<T> = {}
) {
  const { onScrollPast, once = true, ref: externalRef } = options;
  const internalRef = useRef<T>(null);
  const elementRef = externalRef || internalRef;
  const [hasScrolledPast, setHasScrolledPast] = useState(false);
  const hasFireCallback = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const checkScrollPosition = () => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Element is considered "scrolled past" when its bottom edge is above viewport
      const isPast = rect.bottom < 0;
      
      if (isPast && (!once || !hasFireCallback.current)) {
        setHasScrolledPast(true);
        if (!hasFireCallback.current) {
          hasFireCallback.current = true;
          onScrollPast?.();
        }
      } else if (!isPast && !once) {
        setHasScrolledPast(false);
        hasFireCallback.current = false;
      }
    };

    // Initial check
    checkScrollPosition();
    
    // Throttled scroll listener
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", checkScrollPosition);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [onScrollPast, once]);

  return {
    ref: elementRef,
    hasScrolledPast,
  };
}

/**
 * Hook to combine viewport visibility + dwell time + scroll past detection
 * Perfect for hero sections that want comprehensive engagement tracking
 * 
 * @example
 * ```tsx
 * const { ref, metrics } = useHeroEngagement({
 *   dwellThreshold: 3000,
 *   onEngage: (type, value) => {
 *     if (type === 'dwell') trackEngagement('dwell', value);
 *     if (type === 'scroll') trackEngagement('scroll');
 *   }
 * });
 * ```
 */
export interface HeroEngagementOptions {
  dwellThreshold?: number;
  onEngage?: (engagementType: "dwell" | "scroll", value?: number) => void;
}

export function useHeroEngagement<T extends HTMLElement = HTMLDivElement>(
  options: HeroEngagementOptions = {}
) {
  const { dwellThreshold = 3000, onEngage } = options;
  const hasFiredDwell = useRef(false);
  const hasFiredScroll = useRef(false);

  // Create shared element ref
  const elementRef = useRef<T>(null);

  // Track viewport dwell - pass the shared ref
  const { isVisible, dwellTime } = useViewportTracking<T>({
    ref: elementRef,
    threshold: 0.5,
    trackDwell: true,
    dwellThreshold,
    onDwell: (time) => {
      if (!hasFiredDwell.current) {
        hasFiredDwell.current = true;
        onEngage?.("dwell", time);
      }
    },
  });

  // Track scroll past - pass the shared ref
  const { hasScrolledPast } = useScrolledPast<T>({
    ref: elementRef,
    once: true,
    onScrollPast: () => {
      if (!hasFiredScroll.current) {
        hasFiredScroll.current = true;
        onEngage?.("scroll");
      }
    },
  });

  return {
    ref: elementRef,
    metrics: {
      isVisible,
      dwellTime,
      hasScrolledPast,
      hasEngaged: hasFiredDwell.current || hasFiredScroll.current,
    },
  };
}
