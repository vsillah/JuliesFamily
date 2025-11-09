import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, DollarSign, Users, CheckCircle2 } from "lucide-react";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import LeadCaptureForm from "./LeadCaptureForm";
import type { Persona } from "@/contexts/PersonaContext";

interface ProgramDetail {
  id: string;
  title: string;
  description: string;
  imageName?: string;
  overview: string;
  ageRange?: string;
  schedule?: string;
  location?: string;
  cost?: string;
  features: string[];
  enrollmentSteps: string[];
  faqs: { question: string; answer: string; }[];
  defaultPersona?: Persona;
}

interface ProgramDetailDialogProps {
  program: ProgramDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProgramDetailDialog({
  program,
  open,
  onOpenChange,
}: ProgramDetailDialogProps) {
  const { data: imageAsset } = useCloudinaryImage(program?.imageName || "");

  if (!program) return null;

  const imageUrl = imageAsset
    ? getOptimizedUrl(imageAsset.cloudinarySecureUrl, {
        width: 1200,
        quality: "auto:good",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:bg-white/90 [&>button]:text-black [&>button]:hover:bg-white [&>button]:rounded-full [&>button]:h-8 [&>button]:w-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:shadow-lg [&>button]:z-50"
        data-testid={`dialog-program-detail-${program.id}`}
      >
        <ScrollArea className="flex-1 overflow-y-auto">
          {/* Hero Image */}
          {imageUrl && (
            <div className="relative h-48 sm:h-64 w-full overflow-hidden">
              <img 
                src={imageUrl} 
                alt={program.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl sm:text-4xl font-serif font-bold text-white">
                    {program.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {program.description}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          )}

          {!imageUrl && (
            <div className="px-6 pt-6">
              <DialogHeader>
                <DialogTitle className="text-3xl sm:text-4xl font-serif font-bold">
                  {program.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {program.description}
                </DialogDescription>
              </DialogHeader>
            </div>
          )}

          {/* Quick Stats */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {program.ageRange && (
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Age Range</p>
                      <p className="font-medium text-sm">{program.ageRange}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {program.schedule && (
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Schedule</p>
                      <p className="font-medium text-sm">{program.schedule}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {program.location && (
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium text-sm">{program.location}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {program.cost && (
                <Card>
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cost</p>
                      <p className="font-medium text-sm">{program.cost}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Tabbed Content */}
          <div className="px-6 pb-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full inline-flex h-auto flex-nowrap overflow-x-auto sm:grid sm:grid-cols-4">
                <TabsTrigger value="overview" data-testid="tab-overview" className="flex-shrink-0">Overview</TabsTrigger>
                <TabsTrigger value="features" data-testid="tab-features" className="flex-shrink-0">What's Included</TabsTrigger>
                <TabsTrigger value="enroll" data-testid="tab-enroll" className="flex-shrink-0">How to Enroll</TabsTrigger>
                <TabsTrigger value="faq" data-testid="tab-faq" className="flex-shrink-0">FAQ</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Program</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {program.overview}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features Tab */}
              <TabsContent value="features" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                    <CardDescription>
                      Services and support provided through this program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {program.features.map((feature, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm leading-relaxed">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* How to Enroll Tab */}
              <TabsContent value="enroll" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment Process</CardTitle>
                    <CardDescription>
                      Follow these steps to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {program.enrollmentSteps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm leading-relaxed">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Get Started Today</CardTitle>
                    <CardDescription>
                      Fill out the form below and we'll contact you with next steps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeadCaptureForm
                      defaultPersona={program.defaultPersona}
                      defaultFunnelStage="consideration"
                      leadMagnetId={`program_interest_${program.id}`}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQ Tab */}
              <TabsContent value="faq" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Common questions about this program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {program.faqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`}>
                          <AccordionTrigger data-testid={`faq-question-${index}`}>
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent data-testid={`faq-answer-${index}`}>
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
