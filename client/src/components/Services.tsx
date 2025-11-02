import ServiceCard from "./ServiceCard";
import childrenImage from "@assets/PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp";
import familyImage from "@assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg";
import adultImage from "@assets/Volunteer-and-student-3-scaled-qdm9920uh1lwqg6bdelecew1fr2owp93s8igmrbu2o_1762056863739.jpg";

export default function Services() {
  const services = [
    {
      number: "1",
      title: "Children's Services",
      description:
        "Offering high-quality early education and care to the infant, toddler, and pre-school children of our adult learners, with curriculum tailored to the needs and abilities of each child.",
      image: childrenImage,
    },
    {
      number: "2",
      title: "Family Development",
      description:
        "Offering family development, life skills, and education services to mothers. Services include adult education, high school equivalency preparation, career services, life skills, and supportive services.",
      image: familyImage,
    },
    {
      number: "3",
      title: "Adult Basic Education",
      description:
        "Offering adult education, high school equivalency preparation, career services, and advising to any learner aged 16 or older.",
      image: adultImage,
    },
  ];

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
