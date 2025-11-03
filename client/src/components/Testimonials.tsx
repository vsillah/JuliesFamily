import TestimonialCard from "./TestimonialCard";

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        "Julie's always tries to provide us with the most important things we need. Always doing their best to try and take some weight off our shoulders. Julie's makes me feel that I am not alone. When we need help, Julie's is always there.",
      name: "Maria Garcia",
      imageName: "testimonial-1",
    },
    {
      quote:
        "Julie's helps me with budgeting, building my credit, and managing my daughter. This is the place you need to be if you want to better yourself for your family. You can work at your own pace. They don't judge. They have your back!",
      name: "Tasha Williams",
      imageName: "testimonial-2",
    },
    {
      quote:
        "I just want to say Thank You Julie's Family, you definitely are the best. I am so blessed to have come across the program. You teachers are angels, I love you all. We will get through this together.",
      name: "Sarah Johnson",
      imageName: "testimonial-3",
    },
  ];

  return (
    <section id="testimonials" className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-wider text-muted-foreground mb-4">
            – Participant Stories –
          </p>
          <h2 className="text-4xl sm:text-5xl font-serif font-semibold mb-6">
            What <span className="italic">Our Families</span> Say
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hear from the families whose lives have been transformed through our programs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
