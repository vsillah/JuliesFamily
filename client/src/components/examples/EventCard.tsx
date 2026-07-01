import EventCard from '../EventCard';

export default function EventCardExample() {
  return (
    <div className="p-8">
      <EventCard
        title="50th Anniversary Celebration"
        date="April 4, 2024"
        location="UMass Club, Boston"
        description="Join us as we celebrate five decades of empowering families through education and support."
        imageName="Graduation celebration ceremony"
      />
    </div>
  );
}
