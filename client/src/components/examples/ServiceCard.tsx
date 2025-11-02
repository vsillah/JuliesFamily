import ServiceCard from '../ServiceCard';
import childrenImage from "@assets/generated_images/Children's_services_classroom_0675fa23.png";

export default function ServiceCardExample() {
  return (
    <div className="p-8">
      <ServiceCard
        number="1"
        title="Children's Services"
        description="Offering high-quality early education and care to the infant, toddler, and pre-school children of our adult learners."
        image={childrenImage}
        onLearnMore={() => console.log('Learn more clicked')}
      />
    </div>
  );
}
