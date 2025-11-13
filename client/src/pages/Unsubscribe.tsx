import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function Unsubscribe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  // State
  const [step, setStep] = useState<'verifying' | 'confirm' | 'processing' | 'success' | 'error'>('verifying');
  const [email, setEmail] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setStep('error');
      setErrorMessage('No unsubscribe token provided. Please use the link from your email.');
      return;
    }
    
    // Fetch email from token (verify it)
    fetch('/api/unsubscribe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.email) {
          setEmail(data.email);
          setStep('confirm'); // Only show confirm UI after successful verification
        } else {
          setStep('error');
          setErrorMessage(data.message || 'Invalid or expired unsubscribe link. Links are valid for 60 days.');
        }
      })
      .catch(error => {
        console.error('Token verification error:', error);
        setStep('error');
        setErrorMessage('Failed to verify unsubscribe link. Please try again later.');
      });
  }, [token]);
  
  const handleUnsubscribe = async () => {
    if (!token) {
      return;
    }
    
    setStep('processing');
    
    try {
      const response = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          reason: reason || undefined,
          feedback: feedback.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStep('success');
      } else {
        setStep('error');
        setErrorMessage(data.message || 'Failed to unsubscribe. Please try again.');
        toast({
          variant: "destructive",
          title: "Unsubscribe failed",
          description: data.message || "Please try again later.",
        });
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStep('error');
      setErrorMessage('Network error. Please check your connection and try again.');
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Failed to process your request. Please try again.",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {step === 'verifying' && (
          <>
            <CardHeader>
              <CardTitle>Verifying unsubscribe link...</CardTitle>
              <CardDescription>Please wait while we verify your request.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="spinner-verifying" />
            </CardContent>
          </>
        )}
        
        {step === 'confirm' && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Unsubscribe from Emails</CardTitle>
              </div>
              <CardDescription>
                We're sorry to see you go! You can unsubscribe from all Julie's Family Learning Program emails below.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {email && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Email address:</p>
                  <p className="font-medium" data-testid="text-unsubscribe-email">{email}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Label htmlFor="reason" className="text-base">
                  Why are you unsubscribing? <span className="text-muted-foreground text-sm">(optional)</span>
                </Label>
                <RadioGroup
                  id="reason"
                  value={reason}
                  onValueChange={setReason}
                  data-testid="radiogroup-unsubscribe-reason"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="too_frequent" id="too_frequent" data-testid="radio-reason-too-frequent" />
                    <Label htmlFor="too_frequent" className="font-normal cursor-pointer">
                      Emails are too frequent
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_interested" id="not_interested" data-testid="radio-reason-not-interested" />
                    <Label htmlFor="not_interested" className="font-normal cursor-pointer">
                      No longer interested in this topic
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="irrelevant" id="irrelevant" data-testid="radio-reason-irrelevant" />
                    <Label htmlFor="irrelevant" className="font-normal cursor-pointer">
                      Content is not relevant to me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" data-testid="radio-reason-other" />
                    <Label htmlFor="other" className="font-normal cursor-pointer">
                      Other reason
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feedback" className="text-sm text-muted-foreground">
                  Additional feedback (optional)
                </Label>
                <Textarea
                  id="feedback"
                  placeholder="Help us improve by sharing more details..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  data-testid="textarea-unsubscribe-feedback"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex-1"
                data-testid="button-cancel-unsubscribe"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnsubscribe}
                disabled={!email}
                className="flex-1"
                data-testid="button-confirm-unsubscribe"
              >
                Unsubscribe
              </Button>
            </CardFooter>
          </>
        )}
        
        {step === 'processing' && (
          <>
            <CardHeader>
              <CardTitle>Processing...</CardTitle>
              <CardDescription>Please wait while we process your request.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="spinner-processing" />
            </CardContent>
          </>
        )}
        
        {step === 'success' && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-6 w-6" />
                <CardTitle>You've been unsubscribed</CardTitle>
              </div>
              <CardDescription>
                You will no longer receive emails from Julie's Family Learning Program at {email}.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="p-4 bg-muted rounded-md space-y-2">
                <p className="text-sm text-muted-foreground">
                  Changed your mind? You can always subscribe again by visiting our website.
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button
                onClick={() => setLocation('/')}
                className="w-full"
                data-testid="button-return-home"
              >
                Return to Homepage
              </Button>
            </CardFooter>
          </>
        )}
        
        {step === 'error' && (
          <>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>Unable to unsubscribe</CardTitle>
              </div>
              <CardDescription>
                {errorMessage}
              </CardDescription>
            </CardHeader>
            
            <CardFooter>
              <Button
                onClick={() => setLocation('/')}
                variant="outline"
                className="w-full"
                data-testid="button-error-return-home"
              >
                Return to Homepage
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
