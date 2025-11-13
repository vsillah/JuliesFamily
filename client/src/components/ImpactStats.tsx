import { GraduationCap, Users, Calendar, Award } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Animated counter component with easing
function AnimatedCounter({ targetValue }: { targetValue: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Parse the target number and suffix from the string
  const parseTarget = (value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, ""));
    const suffix = value.match(/[+%]/)?.[0] || "";
    return { number: numericValue, suffix };
  };

  const { number: target, suffix } = parseTarget(targetValue);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Intersection Observer to trigger animation when visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          
          const duration = 2000; // 2 seconds
          const startTime = Date.now();

          // Easing function: ease-in-out (slow start, fast middle, slow end)
          const easeInOutCubic = (t: number): number => {
            return t < 0.5
              ? 4 * t * t * t
              : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };

          const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply easing to progress
            const easedProgress = easeInOutCubic(progress);
            const currentValue = easedProgress * target;

            setCount(currentValue);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasAnimated, target]);

  // Format the number with commas for thousands
  const formatNumber = (num: number) => {
    return Math.floor(num).toLocaleString();
  };

  return (
    <div ref={elementRef} className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-2">
      {formatNumber(count)}{suffix}
    </div>
  );
}

export default function ImpactStats() {
  const stats = [
    {
      icon: Users,
      number: "299",
      label: "Students Served in 2024",
    },
    {
      icon: GraduationCap,
      number: "+31%",
      label: "Growth in Enrollment",
    },
    {
      icon: Award,
      number: "+155%",
      label: "Increase in HSE Testing",
    },
    {
      icon: Calendar,
      number: "95",
      label: "Monthly Average Enrollment",
    },
  ];

  return (
    <section id="impact" className="py-12 sm:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Impact –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            2024: A Year of <span className="italic">Incredible</span>{" "}
            <span className="font-bold">Growth</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            JFLP grew in FY24, serving more students and families than ever before with our programs in Adult Basic Education, Family Development, and Children's Services.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="text-center"
                data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-primary/10">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <AnimatedCounter targetValue={stat.number} />
                <div className="text-base text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
