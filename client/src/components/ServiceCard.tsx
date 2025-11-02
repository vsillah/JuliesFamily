import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  number: string;
  title: string;
  description: string;
  image: string;
  onLearnMore?: () => void;
}

export default function ServiceCard({
  number,
  title,
  description,
  image,
  onLearnMore,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-transform duration-300 hover:scale-105">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-serif font-semibold">
          {number}
        </div>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-serif font-semibold mb-4 text-card-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>
        <button
          onClick={onLearnMore}
          className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all font-medium"
          data-testid={`link-learn-more-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          Learn More <ArrowRight size={16} />
        </button>
      </div>
    </Card>
  );
}
