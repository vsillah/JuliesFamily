import ServiceCard from "./ServiceCard";
import { usePersona } from "@/contexts/PersonaContext";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem } from "@shared/schema";

export default function Services() {
  const { persona } = usePersona();
  
  const { data: allServices = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/service"],
  });

  const activeServices = allServices.filter(s => s.isActive);
  
  const services = persona && activeServices.length > 0
    ? [...activeServices].sort((a, b) => {
        const aPriority = (a.metadata as any)?.priority?.[persona] || 99;
        const bPriority = (b.metadata as any)?.priority?.[persona] || 99;
        return aPriority - bPriority;
      })
    : activeServices;

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
              onLearnMore={() => console.log(`Learn more about ${service.title}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
