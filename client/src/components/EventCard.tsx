import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import ParallaxImage from "./ParallaxImage";

interface EventCardProps {
  title: string;
  date: string;
  location?: string;
  description: string;
  image: string;
}

export default function EventCard({ title, date, location, description, image }: EventCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-transform duration-300 hover:scale-105">
      <div className="relative aspect-[16/9] overflow-hidden">
        <ParallaxImage src={image} alt={title} className="w-full h-full object-cover" intensity={0.8} />
        <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md">
          <div className="text-sm font-semibold">{date}</div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-serif font-semibold mb-3 text-card-foreground">{title}</h3>
        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin size={16} />
            {location}
          </div>
        )}
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}
