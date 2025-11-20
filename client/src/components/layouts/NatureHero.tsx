import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";

interface NatureHeroProps {
  organizationName: string;
  onDonateClick?: () => void;
}

export function NatureHero({ organizationName, onDonateClick }: NatureHeroProps) {
  return (
    <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      {/* Organic shape decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-800/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-teal-200/30 dark:bg-teal-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-green-200/20 dark:bg-green-800/10 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-800/50 mb-8">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {organizationName}
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-br from-emerald-800 via-green-700 to-teal-700 dark:from-emerald-200 dark:via-green-300 dark:to-teal-300 bg-clip-text text-transparent leading-tight">
          Be the <span className="italic">Change</span>
        </h1>

        <p className="text-xl md:text-2xl text-emerald-900/80 dark:text-emerald-100/80 mb-4 max-w-2xl mx-auto font-light">
          You can make a difference in your community and help those in need.
        </p>

        <p className="text-lg text-emerald-800/70 dark:text-emerald-200/70 mb-10 max-w-xl mx-auto">
          If you are dedicated to your cause, you can make a difference in the world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg shadow-emerald-600/30 min-w-[200px]"
            onClick={onDonateClick}
            data-testid="button-hero-donate"
          >
            <Heart className="mr-2 h-5 w-5" />
            Support Our Cause
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="bg-white/60 dark:bg-black/40 backdrop-blur-sm border-emerald-300 dark:border-emerald-700 hover:bg-white/80 dark:hover:bg-black/60 min-w-[200px]"
            data-testid="button-hero-learn-more"
          >
            Learn More
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Decorative wave element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
            <path 
              d="M0,0 C300,60 600,60 900,30 L1200,0 L1200,120 L0,120 Z" 
              fill="currentColor" 
              className="text-emerald-600 dark:text-emerald-400"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
