import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, startOfToday, isBefore } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Clock, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export default function AppointmentScheduling() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Fetch available time slots for selected date
  // Send plain YYYY-MM-DD date to avoid timezone issues
  const dateString = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const { data: availableSlots = [], isLoading: slotsLoading } = useQuery<TimeSlot[]>({
    queryKey: ["/api/calendar/availability", { date: dateString }],
    enabled: !!selectedDate,
  });

  // Book appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (data: {
      summary: string;
      description: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      attendees: Array<{ email: string; displayName: string }>;
    }) => {
      return await apiRequest("POST", "/api/calendar/events", data);
    },
    onSuccess: () => {
      setBookingComplete(true);
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/availability"] });
      toast({
        title: "Appointment Booked!",
        description: "You'll receive a calendar invite via email shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    setSelectedTimeSlot(slot);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTimeSlot || !formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const appointmentData = {
      summary: `Consultation: ${formData.firstName} ${formData.lastName}`,
      description: `Phone: ${formData.phone}\n\nNotes: ${formData.notes}`,
      start: {
        dateTime: selectedTimeSlot.start,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: selectedTimeSlot.end,
        timeZone: "America/New_York",
      },
      attendees: [
        {
          email: formData.email,
          displayName: `${formData.firstName} ${formData.lastName}`,
        },
      ],
    };

    bookAppointmentMutation.mutate(appointmentData);
  };

  // Use slots from backend API directly
  const timeSlots = availableSlots;

  if (bookingComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto py-12 px-4 max-w-2xl">
          <Card>
            <CardContent className="pt-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" data-testid="icon-success" />
              <h2 className="text-2xl font-bold mb-2" data-testid="text-success-title">
                Appointment Confirmed!
              </h2>
              <p className="text-muted-foreground mb-6" data-testid="text-success-message">
                Your appointment has been scheduled. You'll receive a calendar invite at {formData.email} shortly.
              </p>
              <Button
                onClick={() => {
                  setBookingComplete(false);
                  setShowForm(false);
                  setSelectedTimeSlot(null);
                  setFormData({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
                }}
                data-testid="button-book-another"
              >
                Book Another Appointment
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto py-12 px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">
            Schedule an Appointment
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Book a consultation with our team to discuss your educational goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Calendar Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select a Date
              </CardTitle>
              <CardDescription>
                Choose a date for your appointment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfToday()) || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border"
                data-testid="calendar-date-picker"
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Select a Time
              </CardTitle>
              <CardDescription>
                {selectedDate
                  ? `Available slots for ${format(selectedDate, "MMMM d, yyyy")} (Eastern Time)`
                  : "Select a date to see available times"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slotsLoading ? (
                <div className="text-center py-8" data-testid="loading-slots">
                  <p className="text-muted-foreground">Loading available times...</p>
                </div>
              ) : !selectedDate ? (
                <div className="text-center py-8" data-testid="text-select-date">
                  <p className="text-muted-foreground">Please select a date first</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot, index) => {
                    // Format time explicitly as Eastern Time
                    // slot.start is "2025-11-08T09:00:00" - extract time portion and format
                    const [, timePart] = slot.start.split('T');
                    const [hour, minute] = timePart.split(':').map(Number);
                    const isPM = hour >= 12;
                    const displayHour = hour % 12 || 12;
                    const startTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
                    
                    return (
                      <Button
                        key={index}
                        variant={selectedTimeSlot === slot ? "default" : "outline"}
                        disabled={!slot.available}
                        onClick={() => handleTimeSlotSelect(slot)}
                        className="justify-center"
                        data-testid={`button-timeslot-${index}`}
                      >
                        {startTime}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        {showForm && selectedTimeSlot && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                Please provide your contact details to complete the booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      data-testid="input-last-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Tell us what you'd like to discuss..."
                    data-testid="textarea-notes"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setSelectedTimeSlot(null);
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={bookAppointmentMutation.isPending}
                    data-testid="button-submit-booking"
                  >
                    {bookAppointmentMutation.isPending ? "Booking..." : "Confirm Appointment"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
