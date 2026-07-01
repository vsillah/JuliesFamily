import ServiceCard from '../ServiceCard';

export default function ServiceCardExample() {
  return (
    <div className="p-8">
      <ServiceCard
        number="1"
        title="Children's Services"
        description="Offering high-quality early education and care to the infant, toddler, and pre-school children of our adult learners."
        imageName="Children's services classroom"
        onLearnMore={() => console.log('Learn more clicked')}
      />
    </div>
  );
}
