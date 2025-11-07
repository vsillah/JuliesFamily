import { useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Heart, Home, Mail } from 'lucide-react';

export default function DonateSuccess() {
  useEffect(() => {
    // Track successful donation for analytics
    if (window.gtag) {
      window.gtag('event', 'donation_complete', {
        event_category: 'donations',
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center py-12 px-4">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-12 pb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3" data-testid="heading-success">Thank You for Your Donation!</h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Your generosity makes a real difference in the lives of families in our community.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-6 text-left">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Receipt on the way</h3>
                <p className="text-sm text-muted-foreground">
                  A donation receipt has been sent to your email address for your tax records.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Heart className="w-5 h-5 text-primary mt-0.5" fill="currentColor" />
              <div>
                <h3 className="font-semibold mb-1">Making an impact</h3>
                <p className="text-sm text-muted-foreground">
                  Your donation directly supports our education programs, helping families access the resources they need to thrive.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button variant="default" className="w-full sm:w-auto" data-testid="button-home">
                <Home className="mr-2 h-4 w-4" />
                Return Home
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-learn-more">
                Learn More About Our Programs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
