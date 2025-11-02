import ServiceCard from "./ServiceCard";
import { usePersona } from "@/contexts/PersonaContext";
import childrenImage from "@assets/PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp";
import familyImage from "@assets/kathleen-pzi74mjrs2s885yl9an9ansqxknnds5w1uoabkgi68_1762057083009.jpg";
import adultImage from "@assets/Full-ABE-Classroom-scaled-qdm9b73m1gjf6h2cvbwt0vfu5cisfvr3eu09zg5jwg_1762057083015.jpg";

export default function Services() {
  const { persona } = usePersona();
  
  const allServices = [
    {
      number: "1",
      title: "Children's Services",
      description:
        "Offering high-quality early education and care to the infant, toddler, and pre-school children of our adult learners, with curriculum tailored to the needs and abilities of each child.",
      image: childrenImage,
      priority: {
        parent: 1,
        student: 3,
        provider: 2,
        donor: 2,
        volunteer: 2
      }
    },
    {
      number: "2",
      title: "Family Development",
      description:
        "Offering family development, life skills, and education services to mothers. Services include adult education, high school equivalency preparation, career services, life skills, and supportive services.",
      image: familyImage,
      priority: {
        parent: 3,
        student: 2,
        provider: 1,
        donor: 1,
        volunteer: 3
      }
    },
    {
      number: "3",
      title: "Adult Basic Education",
      description:
        "Offering adult education, high school equivalency preparation, career services, and advising to any learner aged 16 or older.",
      image: adultImage,
      priority: {
        parent: 2,
        student: 1,
        provider: 3,
        donor: 3,
        volunteer: 1
      }
    },
  ];
  
  const services = persona 
    ? [...allServices].sort((a, b) => 
        (a.priority[persona] || 99) - (b.priority[persona] || 99)
      )
    : allServices;

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
          {services.map((service) => (
            <ServiceCard
              key={service.number}
              {...service}
              onLearnMore={() => console.log(`Learn more about ${service.title}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
