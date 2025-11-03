import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Persona } from "@/contexts/PersonaContext";

interface LeadCaptureFormProps {
  defaultPersona?: Persona;
  defaultFunnelStage?: "awareness" | "consideration" | "decision" | "retention";
  leadMagnetId?: string;
  onSuccess?: () => void;
  compact?: boolean;
  interactionMetadata?: Record<string, any>;
}

export default function LeadCaptureForm({
  defaultPersona,
  defaultFunnelStage = "awareness",
  leadMagnetId,
  onSuccess,
  compact = false,
  interactionMetadata,
}: LeadCaptureFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    persona: defaultPersona || "",
  });

  const submitLeadMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        persona: formData.persona,
        funnelStage: defaultFunnelStage,
        leadSource: leadMagnetId || "website",
      };
      
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit lead");
      }
      
      const lead = await response.json();
      
      // Record interaction if metadata provided
      if (interactionMetadata && leadMagnetId) {
        try {
          await fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leadId: lead.id,
              interactionType: "quiz_completion",
              channel: "website",
              data: interactionMetadata,
            }),
          });
        } catch (error) {
          console.error("Failed to record interaction:", error);
        }
      }
      
      return lead;
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "We've received your information and will be in touch soon.",
      });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        persona: defaultPersona || "",
      });
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.persona) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitLeadMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      <div className={compact ? "grid grid-cols-2 gap-3" : "grid md:grid-cols-2 gap-4"}>
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            data-testid="input-first-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            data-testid="input-last-name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          data-testid="input-email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          data-testid="input-phone"
        />
      </div>

      {!defaultPersona && (
        <div className="space-y-2">
          <Label htmlFor="persona">I am a... *</Label>
          <Select value={formData.persona} onValueChange={(value) => setFormData({ ...formData, persona: value })}>
            <SelectTrigger id="persona" data-testid="select-persona">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Adult Education Student</SelectItem>
              <SelectItem value="provider">Service Provider</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="donor">Donor</SelectItem>
              <SelectItem value="volunteer">Volunteer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={submitLeadMutation.isPending}
        data-testid="button-submit-lead"
      >
        {submitLeadMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Get Started"
        )}
      </Button>
    </form>
  );
}
