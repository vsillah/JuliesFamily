import EventCard from "./EventCard";
import { usePersona } from "@/contexts/PersonaContext";
import { useQuery } from "@tanstack/react-query";
import type { ContentItem } from "@shared/schema";

const headlineContent: Record<string, { title: string; description: string }> = {
  student: {
    title: "Be Part of Our Community",
    description: "Connect with fellow students, celebrate achievements, and discover resources at our upcoming events."
  },
  provider: {
    title: "Professional Events & Outcomes",
    description: "Join us for networking opportunities, outcome celebrations, and community partnership events."
  },
  parent: {
    title: "Family-Friendly Events",
    description: "Bring your family to our open houses, learning fairs, and community celebrations."
  },
  donor: {
    title: "Join Us in Celebrating Success",
    description: "Be part of our community events and witness the transformative power of education."
  },
  volunteer: {
    title: "Get Involved at Our Events",
    description: "Meet our team, learn about volunteer opportunities, and celebrate with our community."
  }
};

export default function Events() {
  const { persona } = usePersona();
  const headline = headlineContent[persona || "donor"];
  
  const { data: allEvents = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/type/event"],
  });

  const events = allEvents.filter(e => e.isActive);

  if (isLoading) {
    return (
      <section id="events" className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 text-muted-foreground">Loading events...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="events" className="py-12 sm:py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Upcoming Events –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            {headline.title.split(" ").map((word, i) => {
              const isEmphasized = ["Success", "Community", "Celebrating", "Professional", "Involved"].includes(word);
              const isItalic = ["Celebrating", "Part", "Our"].includes(word);
              
              return (
                <span
                  key={i}
                  className={`${isEmphasized ? "font-bold" : ""} ${isItalic ? "italic" : ""}`}
                >
                  {word}{" "}
                </span>
              );
            })}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {headline.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <EventCard 
              key={event.id}
              eventId={event.id}
              title={event.title}
              date={(event.metadata as any)?.date || ""}
              location={(event.metadata as any)?.location}
              description={event.description || ""}
              imageName={event.imageName || ""}
              startTime={(event.metadata as any)?.startTime}
              endTime={(event.metadata as any)?.endTime}
              allowRegistration={(event.metadata as any)?.allowRegistration || false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
