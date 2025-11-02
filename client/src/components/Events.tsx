import EventCard from "./EventCard";
import graduationImage from "@assets/PreK-Class-Photo-2025-600x451.jpg_1762056779821.webp";

export default function Events() {
  const events = [
    {
      title: "50th Anniversary Celebration",
      date: "April 4, 2024",
      location: "UMass Club, Downtown Boston",
      description:
        "Join us as we celebrate five decades of empowering families through education and support. A special evening honoring our graduates, staff, and community partners.",
      image: graduationImage,
    },
    {
      title: "Spring Graduation Ceremony",
      date: "June 2024",
      location: "Julie's Family Learning Program",
      description:
        "Celebrating our graduates who have completed their HiSET and are moving forward to college and career success.",
      image: graduationImage,
    },
    {
      title: "Fall Family Learning Fair",
      date: "September 2024",
      location: "Julie's Family Learning Program",
      description:
        "An open house event featuring program information, family activities, and opportunities to meet our dedicated staff and volunteers.",
      image: graduationImage,
    },
  ];

  return (
    <section id="events" className="py-20 sm:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Upcoming Events –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            Join Us in <span className="italic">Celebrating</span>{" "}
            <span className="font-bold">Success</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Be part of our community events and witness the transformative power of education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <EventCard key={index} {...event} />
          ))}
        </div>
      </div>
    </section>
  );
}
