import EventCard from "./EventCard";
import anniversaryImage from "@assets/April-6-Graduation-pzi49dxx55hv6neo81vxc4gp1ypmkznm7wn3q8iscg_1762057083004.jpg";
import graduationImage from "@assets/Bobby-and-Zea-scaled-pzi3sypfqd0ibx9h4gbl9rnrelnr3dggamaov6vf28_1762057083010.jpg";
import familyFairImage from "@assets/dinoeggs-scaled-qdm9d9cv1dd2no2htq0bzup92scsbyxw11jmwb3g8w_1762057083014.jpg";

export default function Events() {
  const events = [
    {
      title: "50th Anniversary Celebration",
      date: "April 4, 2024",
      location: "UMass Club, Downtown Boston",
      description:
        "Join us as we celebrate five decades of empowering families through education and support. A special evening honoring our graduates, staff, and community partners.",
      image: anniversaryImage,
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
      image: familyFairImage,
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
