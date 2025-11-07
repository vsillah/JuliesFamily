import { useState } from "react";
import ServiceCard from "./ServiceCard";
import ProgramDetailDialog from "./ProgramDetailDialog";
import { usePersona } from "@/contexts/PersonaContext";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem } from "@shared/schema";
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

// Map service titles to program detail IDs
const SERVICE_TO_PROGRAM_MAP: Record<string, string> = {
  'Adult Basic Education': 'adult-education',
  'Children\'s Services': 'childrens-services',
  'Family Development': 'adult-education', // Family literacy + adult education
  'Workforce Development': 'workforce-development',
  'Career & College Readiness': 'workforce-development',
  'Early Childhood Education': 'childrens-services',
};

export default function Services() {
  const { persona } = usePersona();
  const [selectedProgram, setSelectedProgram] = useState<ProgramDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: allServices = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/service"],
  });

  const { data: programDetails = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/program_detail"],
  });

  const activeServices = allServices.filter(s => s.isActive);
  
  const services = persona && activeServices.length > 0
    ? [...activeServices].sort((a, b) => {
        const aPriority = (a.metadata as any)?.priority?.[persona] || 99;
        const bPriority = (b.metadata as any)?.priority?.[persona] || 99;
        return aPriority - bPriority;
      })
    : activeServices;

  const handleLearnMore = (serviceTitle: string) => {
    // Find the matching program detail
    const programId = SERVICE_TO_PROGRAM_MAP[serviceTitle] || Object.values(SERVICE_TO_PROGRAM_MAP).find(id => 
      serviceTitle.toLowerCase().includes(id.replace('-', ' '))
    );

    const program = programDetails.find(p => {
      const meta = p.metadata as any;
      return meta?.programId === programId;
    });

    if (program) {
      const meta = program.metadata as any;
      setSelectedProgram({
        id: meta.programId,
        title: program.title,
        description: program.description || '',
        imageName: program.imageName || undefined,
        overview: meta.overview || '',
        ageRange: meta.ageRange || undefined,
        schedule: meta.schedule || undefined,
        location: meta.location || undefined,
        cost: meta.cost || undefined,
        features: meta.features || [],
        enrollmentSteps: meta.enrollmentSteps || [],
        faqs: meta.faqs || [],
        defaultPersona: meta.defaultPersona,
      });
      setDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <section id="services" className="py-20 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-muted-foreground">Loading services...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Our Programs –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            <span className="font-bold">Transforming</span>{" "}
            <span className="italic">Lives</span> Through{" "}
            <span className="font-bold">Education</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We provide comprehensive support services that empower families to achieve their
            educational and personal goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              number={String(index + 1)}
              title={service.title}
              description={service.description || ""}
              imageName={service.imageName || ""}
              onLearnMore={() => handleLearnMore(service.title)}
            />
          ))}
        </div>
      </div>

      <ProgramDetailDialog
        program={selectedProgram}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </section>
  );
}
