import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Users } from "lucide-react";

interface CommunityHeroProps {
  organizationName: string;
  onDonateClick?: () => void;
}

export function CommunityHero({ organizationName, onDonateClick }: CommunityHeroProps) {
  return (
    <div className="relative min-h-[600px] flex items-center overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950">
      {/* Warm background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-200/40 dark:bg-orange-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-200/40 dark:bg-amber-800/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-200/30 dark:bg-yellow-800/15 rounded-full blur-2xl" />
      </div>

      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(251,146,60,0.4) 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-sm border border-orange-200/50 dark:border-orange-800/50 mb-6">
            <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
              {organizationName}
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-orange-900 dark:text-orange-100 leading-tight">
            Together We're <span className="text-amber-600 dark:text-amber-400">Stronger</span>
          </h1>

          <p className="text-xl md:text-2xl text-orange-800/80 dark:text-orange-200/80 mb-4 font-normal">
            Building connections and empowering our neighbors to thrive.
          </p>

          <p className="text-lg text-orange-700/70 dark:text-orange-300/70 mb-10 max-w-2xl mx-auto">
            Every person has a story, and every story matters. Join us in creating a community where everyone belongs and has the opportunity to succeed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-lg shadow-orange-600/30 min-w-[200px]"
              onClick={onDonateClick}
              data-testid="button-hero-donate"
            >
              <Heart className="mr-2 h-5 w-5 fill-current" />
              Support Neighbors
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/60 dark:bg-black/40 backdrop-blur-sm border-orange-300 dark:border-orange-700 hover:bg-white/80 dark:hover:bg-black/60 text-orange-900 dark:text-orange-100 min-w-[200px]"
              data-testid="button-hero-learn-more"
            >
              Our Stories
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Community impact cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/30">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">2,500+</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Families Served</div>
          </div>

          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/30">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">500+</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Active Volunteers</div>
          </div>

          <div className="bg-white/60 dark:bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-orange-200/50 dark:border-orange-800/30">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">25+</div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Local Partners</div>
          </div>
        </div>
      </div>
    </div>
  );
}
