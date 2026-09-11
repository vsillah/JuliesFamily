import TestimonialCard from '../TestimonialCard';

export default function TestimonialCardExample() {
  return (
    <div className="p-8">
      <TestimonialCard
        quote="Julie's always tries to provide us with the most important things we need. Always doing their best to try and take some weight off our shoulders."
        name="Maria Garcia"
        imageName="Testimonial portrait woman"
        rating={5}
      />
    </div>
  );
}
