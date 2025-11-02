import TestimonialCard from '../TestimonialCard';
import testimonialImage from "@assets/generated_images/Testimonial_portrait_woman_22b27ef2.png";

export default function TestimonialCardExample() {
  return (
    <div className="p-8">
      <TestimonialCard
        quote="Julie's always tries to provide us with the most important things we need. Always doing their best to try and take some weight off our shoulders."
        name="Maria Garcia"
        image={testimonialImage}
        rating={5}
      />
    </div>
  );
}
