import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Globe, Sparkles, Image as ImageIcon } from "lucide-react";

export default function ImageComparison() {
  const comparisons = [
    {
      name: "Graduation Hero (Donor CTA)",
      originalDimensions: "176×235px",
      originalSize: "7.9 KB",
      improvement: "11x larger resolution",
      cloudinaryUrl: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_1920,q_auto:best,f_auto/julies-family-learning/hero/hero-donor.jpg",
      newDimensions: "1920px width (HD)",
      usage: "Full-screen hero background"
    },
    {
      name: "Family Services Card",
      originalDimensions: "176×235px",
      originalSize: "13.2 KB",
      improvement: "4.5x larger resolution",
      cloudinaryUrl: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_800,q_auto:good,f_auto/julies-family-learning/services/service-family.jpg",
      newDimensions: "800px width",
      usage: "Service cards"
    },
    {
      name: "Volunteer & Student Hero",
      originalDimensions: "640×480px",
      originalSize: "50.9 KB",
      improvement: "3x larger resolution",
      cloudinaryUrl: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_1920,q_auto:best,f_auto/julies-family-learning/hero/hero-volunteer-student.jpg",
      newDimensions: "1920px width (HD)",
      usage: "Main hero section"
    },
    {
      name: "Event Photo (Family Fair)",
      originalDimensions: "640×480px",
      originalSize: "58.6 KB",
      improvement: "3x larger resolution",
      cloudinaryUrl: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_800,q_auto:good,f_auto/julies-family-learning/events/event-family-fair.jpg",
      newDimensions: "800px width",
      usage: "Event cards"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold mb-4">
            Image Quality Comparison
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Before and after Cloudinary AI upscaling integration. Notice the dramatic quality improvements, 
            especially on images that were originally small (176×235px).
          </p>
        </div>

        <div className="space-y-8">
          {comparisons.map((comparison, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-serif">
                    {comparison.name}
                  </CardTitle>
                  <Badge variant="default" className="text-sm">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {comparison.improvement}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-[1fr,auto,2fr] gap-6 items-center">
                  {/* Before Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <ImageIcon className="w-4 h-4" />
                      Before
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Original Size</p>
                        <p className="font-mono text-lg">{comparison.originalDimensions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">File Size</p>
                        <p className="font-mono">{comparison.originalSize}</p>
                      </div>
                      <Badge variant="outline" className="mt-2">Local Storage</Badge>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-primary" />
                  </div>

                  {/* After - with image */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                      <Zap className="w-4 h-4" />
                      After (AI-Enhanced)
                    </div>
                    
                    <div className="bg-muted rounded-lg p-4">
                      <div className="aspect-video bg-background rounded overflow-hidden mb-3">
                        <img
                          src={comparison.cloudinaryUrl}
                          alt={`Cloudinary optimized ${comparison.name}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-muted-foreground">Served At</p>
                            <p className="font-mono">{comparison.newDimensions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Usage</p>
                            <p>{comparison.usage}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-3">
                          <Badge variant="default">AI Upscaled</Badge>
                          <Badge variant="secondary">Auto WebP/AVIF</Badge>
                          <Badge variant="secondary">CDN Cached</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl">Key Improvements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-1">1</Badge>
              <div>
                <p className="font-semibold">AI-Powered Upscaling</p>
                <p className="text-sm text-muted-foreground">
                  Tiny 176×235px images are intelligently upscaled to full HD (1920px) without losing quality
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">2</Badge>
              <div>
                <p className="font-semibold">Automatic Format Optimization</p>
                <p className="text-sm text-muted-foreground">
                  Serves WebP or AVIF to modern browsers for 30-50% smaller file sizes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">3</Badge>
              <div>
                <p className="font-semibold">Responsive Sizing</p>
                <p className="text-sm text-muted-foreground">
                  Hero images get 1920px, cards get 800px, avatars get 64px - optimal for each use case
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge className="mt-1">4</Badge>
              <div>
                <p className="font-semibold">Global CDN Delivery</p>
                <p className="text-sm text-muted-foreground">
                  Images served from nearest edge location worldwide for faster load times
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
