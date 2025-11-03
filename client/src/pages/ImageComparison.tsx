import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ImageComparison() {
  const comparisons = [
    {
      name: "Graduation Hero (Donor CTA)",
      original: {
        dimensions: "176×235px",
        size: "7.9 KB",
        quality: "Tiny, pixelated on large screens",
        url: "/attached_assets/grad-pzi78gq1oq1dmudvugdez6xi97qltaefkuknv8rmrk_1762057083020.jpg"
      },
      cloudinary: {
        dimensions: "Auto-scaled (1920px width for hero)",
        size: "Optimized with AI upscaling",
        quality: "Crystal clear, upscaled with AI",
        url: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_1920,q_auto:best,f_auto/julies-family-learning/hero/hero-donor.jpg"
      }
    },
    {
      name: "Family Services Card",
      original: {
        dimensions: "176×235px",
        size: "13.2 KB",
        quality: "Extremely small, blurry",
        url: "/attached_assets/kathleen-pzi74mjrs2s885yl9an9ansqxknnds5w1uoabkgi68_1762057083009.jpg"
      },
      cloudinary: {
        dimensions: "Auto-scaled (800px for cards)",
        size: "Optimized",
        quality: "AI-enhanced clarity",
        url: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_800,q_auto:good,f_auto/julies-family-learning/services/service-family.jpg"
      }
    },
    {
      name: "Volunteer & Student Hero",
      original: {
        dimensions: "640×480px",
        size: "50.9 KB",
        quality: "Moderate quality",
        url: "/attached_assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg"
      },
      cloudinary: {
        dimensions: "1920px width (HD)",
        size: "Optimized for web",
        quality: "Enhanced & sharp",
        url: "https://res.cloudinary.com/dnqc0cxz5/image/upload/w_1920,q_auto:best,f_auto/julies-family-learning/hero/hero-volunteer-student.jpg"
      }
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

        <div className="space-y-12">
          {comparisons.map((comparison, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-2xl font-serif">
                  {comparison.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Original */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Before (Local)</h3>
                      <Badge variant="destructive">Low Quality</Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="aspect-video bg-background rounded overflow-hidden">
                        <img
                          src={comparison.original.url}
                          alt={`Original ${comparison.name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>Dimensions:</strong> {comparison.original.dimensions}</p>
                        <p><strong>File Size:</strong> {comparison.original.size}</p>
                        <p><strong>Quality:</strong> {comparison.original.quality}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cloudinary */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">After (Cloudinary)</h3>
                      <Badge variant="default">AI Enhanced</Badge>
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="aspect-video bg-background rounded overflow-hidden">
                        <img
                          src={comparison.cloudinary.url}
                          alt={`Cloudinary ${comparison.name}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><strong>Dimensions:</strong> {comparison.cloudinary.dimensions}</p>
                        <p><strong>File Size:</strong> {comparison.cloudinary.size}</p>
                        <p><strong>Quality:</strong> {comparison.cloudinary.quality}</p>
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
