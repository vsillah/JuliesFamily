import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

interface ModernHeroProps {
  organizationName: string;
  onDonateClick?: () => void;
}

export function ModernHero({ organizationName, onDonateClick }: ModernHeroProps) {
  return (
    <div className="relative min-h-[600px] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 text-white">
      {/* Geometric background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 border-4 border-cyan-400 rotate-45" />
          <div className="absolute bottom-40 right-40 w-48 h-48 border-4 border-violet-400 rotate-12" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-fuchsia-400 -rotate-12" />
        </div>
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-cyan-500/20 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-gradient-to-r from-cyan-500 to-blue-500 mb-8">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">
              {organizationName}
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-none">
            Transform
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Communities
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Leveraging innovation and technology to create lasting impact. Join us in building a better future through data-driven solutions and community partnerships.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-xl shadow-cyan-500/30 font-bold"
              onClick={onDonateClick}
              data-testid="button-hero-donate"
            >
              Get Involved
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 font-bold"
              data-testid="button-hero-learn-more"
            >
              View Impact
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-slate-700">
            <div>
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                50K+
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Lives Impacted</div>
            </div>
            <div>
              <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                100+
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Programs</div>
            </div>
            <div>
              <div className="text-3xl font-black bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                15
              </div>
              <div className="text-sm text-slate-400 uppercase tracking-wide">Years Active</div>
            </div>
          </div>
        </div>

        {/* Right side - decorative element */}
        <div className="hidden md:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-violet-500/20 rounded-2xl rotate-3" />
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-2xl -rotate-3" />
          <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
            <div className="aspect-square bg-gradient-to-br from-cyan-500 via-blue-500 to-violet-500 rounded-xl opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
}
