import EventCard from '../EventCard';
import graduationImage from "@assets/generated_images/Graduation_celebration_ceremony_99c15e90.png";

export default function EventCardExample() {
  return (
    <div className="p-8">
      <EventCard
        title="50th Anniversary Celebration"
        date="April 4, 2024"
        location="UMass Club, Boston"
        description="Join us as we celebrate five decades of empowering families through education and support."
        image={graduationImage}
      />
    </div>
  );
}
