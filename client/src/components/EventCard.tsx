import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, UserPlus } from "lucide-react";
import ParallaxImage from "./ParallaxImage";
import { useCloudinaryImage, getOptimizedUrl } from "@/hooks/useCloudinaryImage";
import EventRegistrationForm from "./EventRegistrationForm";
import "add-to-calendar-button";

interface EventCardProps {
  eventId?: string;
  title: string;
  date: string;
  location?: string;
  description: string;
  imageName: string;
  startTime?: string;
  endTime?: string;
  allowRegistration?: boolean;
}

export default function EventCard({ 
  eventId, 
  title, 
  date, 
  location, 
  description, 
  imageName, 
  startTime, 
  endTime,
  allowRegistration = false,
}: EventCardProps) {
  const { data: imageAsset, isLoading } = useCloudinaryImage(imageName);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const imageUrl = imageAsset 
    ? getOptimizedUrl(imageAsset.cloudinarySecureUrl, {
        width: 800,
        quality: "auto:good",
      })
    : "";

  // Validate and format date for calendar button (YYYY-MM-DD)
  const parseEventDate = (): string | null => {
    if (!date || date.trim() === '') return null;
    
    try {
      const dateObj = new Date(date);
      // Check if date is valid and in the future (or within last 7 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (!isNaN(dateObj.getTime()) && dateObj >= sevenDaysAgo) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch {
      return null;
    }
    return null;
  };

  // Only show calendar button if we have valid date and times
  const hasValidCalendarData = () => {
    const validDate = parseEventDate();
    return validDate !== null && startTime && endTime;
  };

  return (
    <Card className="overflow-hidden hover-elevate transition-transform duration-300 hover:scale-105">
      <div className="relative aspect-[16/9] overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : imageUrl ? (
          <ParallaxImage src={imageUrl} alt={title} className="w-full h-full object-cover" intensity={0.8} />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
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
        <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
        
        <div className="space-y-3">
          {allowRegistration && hasValidCalendarData() && eventId && (
            <Button
              className="w-full"
              onClick={() => setShowRegistrationForm(true)}
              data-testid="button-register-event"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Register for Event
            </Button>
          )}
          
          {hasValidCalendarData() ? (
            <add-to-calendar-button
              name={title}
              description={description}
              startDate={parseEventDate()!}
              startTime={startTime}
              endTime={endTime}
              location={location || ""}
              options={JSON.stringify(['Apple','Google','Microsoft365','Outlook.com','Yahoo','iCal'])}
              timeZone="America/New_York"
              buttonStyle="default"
              listStyle="modal"
              size="3"
              lightMode="bodyScheme"
              data-testid="add-to-calendar-button"
            />
          ) : (
            <div className="text-sm text-muted-foreground italic">
              Calendar details pending - check back soon!
            </div>
          )}
        </div>
      </div>
      
      {allowRegistration && hasValidCalendarData() && eventId && (
        <EventRegistrationForm
          eventId={eventId}
          eventTitle={title}
          eventDate={parseEventDate()!}
          eventLocation={location}
          startTime={startTime!}
          endTime={endTime!}
          open={showRegistrationForm}
          onClose={() => setShowRegistrationForm(false)}
        />
      )}
    </Card>
  );
}
