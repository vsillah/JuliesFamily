import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import CloudinaryImage from "./CloudinaryImage";

interface TestimonialCardProps {
  quote: string;
  name: string;
  imageName: string;
  rating?: number;
}

export default function TestimonialCard({ quote, name, imageName, rating = 5 }: TestimonialCardProps) {
  return (
    <Card className="p-8 h-full flex flex-col">
      <div className="text-6xl font-serif text-primary mb-4">"</div>

      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>

      <blockquote className="text-base text-card-foreground leading-relaxed mb-6 flex-grow">
        {quote}
      </blockquote>

      <div className="flex items-center gap-4">
        <CloudinaryImage
          name={imageName}
          alt={name}
          className="w-16 h-16 rounded-full object-cover"
          width={64}
          height={64}
          quality="auto:good"
        />
        <div>
          <div className="font-semibold text-card-foreground" data-testid={`text-name-${name.toLowerCase().replace(/\s+/g, '-')}`}>
            {name}
          </div>
          <div className="text-sm text-muted-foreground">Program Participant</div>
        </div>
      </div>
    </Card>
  );
}
