// Reference: blueprint:javascript_stripe
import { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Heart, CreditCard, Loader2, Home, LogIn } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { SavedPaymentMethods } from '@/components/SavedPaymentMethods';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

const PASSION_OPTIONS = [
  { id: 'literacy', label: 'Literacy & Reading', description: 'Support reading programs and library resources' },
  { id: 'stem', label: 'STEM & Technology', description: 'Enable science, technology, engineering & math education' },
  { id: 'arts', label: 'Arts & Creativity', description: 'Fund art supplies and creative expression programs' },
  { id: 'nutrition', label: 'Nutrition & Health', description: 'Provide healthy meals and wellness education' },
  { id: 'community', label: 'Community Building', description: 'Support family events and community connections' },
];

function DonationForm({ amount, donationType, frequency, donorInfo, savePaymentMethod, onAmountChange, onTypeChange, onFrequencyChange, onDonorInfoChange, onSavePaymentMethodChange }: {
  amount: number;
  donationType: 'one-time' | 'recurring';
  frequency: 'monthly' | 'quarterly' | 'annual';
  donorInfo: { email: string; name: string; phone: string; isAnonymous: boolean; passions: string[] };
  savePaymentMethod: boolean;
  onAmountChange: (amount: number) => void;
  onTypeChange: (type: 'one-time' | 'recurring') => void;
  onFrequencyChange: (freq: 'monthly' | 'quarterly' | 'annual') => void;
  onDonorInfoChange: (info: any) => void;
  onSavePaymentMethodChange: (checked: boolean) => void;
}) {
  const [customAmount, setCustomAmount] = useState('');

  const handlePresetClick = (preset: number) => {
    setCustomAmount('');
    onAmountChange(preset);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      onAmountChange(parsed);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Donation Amount</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {PRESET_AMOUNTS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={amount === preset && !customAmount ? 'default' : 'outline'}
              onClick={() => handlePresetClick(preset)}
              data-testid={`button-preset-${preset}`}
              className="h-14 text-lg font-semibold"
            >
              ${preset}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="custom-amount" className="text-sm">Custom Amount:</Label>
          <Input
            id="custom-amount"
            type="number"
            min="1"
            step="1"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            data-testid="input-custom-amount"
            className="max-w-xs"
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Donation Type</Label>
        <RadioGroup value={donationType} onValueChange={(value) => onTypeChange(value as 'one-time' | 'recurring')}>
          <div className="flex items-center space-x-2 mb-2">
            <RadioGroupItem value="one-time" id="one-time" data-testid="radio-one-time" />
            <Label htmlFor="one-time" className="font-normal cursor-pointer">One-time donation</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recurring" id="recurring" data-testid="radio-recurring" />
            <Label htmlFor="recurring" className="font-normal cursor-pointer">Recurring donation</Label>
          </div>
        </RadioGroup>

        {donationType === 'recurring' && (
          <div className="mt-3 ml-6">
            <Label className="text-sm mb-2 block">Frequency</Label>
            <RadioGroup value={frequency} onValueChange={(value) => onFrequencyChange(value as 'monthly' | 'quarterly' | 'annual')}>
              <div className="flex items-center space-x-2 mb-1">
                <RadioGroupItem value="monthly" id="monthly" data-testid="radio-monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2 mb-1">
                <RadioGroupItem value="quarterly" id="quarterly" data-testid="radio-quarterly" />
                <Label htmlFor="quarterly" className="font-normal cursor-pointer">Quarterly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="annual" id="annual" data-testid="radio-annual" />
                <Label htmlFor="annual" className="font-normal cursor-pointer">Annual</Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold block">Donor Information</Label>
        <div>
          <Label htmlFor="donor-name" className="text-sm">Name</Label>
          <Input
            id="donor-name"
            type="text"
            placeholder="Your name"
            value={donorInfo.name}
            onChange={(e) => onDonorInfoChange({ ...donorInfo, name: e.target.value })}
            data-testid="input-donor-name"
          />
        </div>
        <div>
          <Label htmlFor="donor-email" className="text-sm">Email</Label>
          <Input
            id="donor-email"
            type="email"
            placeholder="your@email.com"
            value={donorInfo.email}
            onChange={(e) => onDonorInfoChange({ ...donorInfo, email: e.target.value })}
            data-testid="input-donor-email"
            required
          />
        </div>
        <div>
          <Label htmlFor="donor-phone" className="text-sm">Phone (optional)</Label>
          <Input
            id="donor-phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={donorInfo.phone}
            onChange={(e) => onDonorInfoChange({ ...donorInfo, phone: e.target.value })}
            data-testid="input-donor-phone"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="anonymous"
            checked={donorInfo.isAnonymous}
            onCheckedChange={(checked) => onDonorInfoChange({ ...donorInfo, isAnonymous: checked as boolean })}
            data-testid="checkbox-anonymous"
          />
          <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
            Make this an anonymous donation
          </Label>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox
          id="save-payment"
          checked={savePaymentMethod}
          onCheckedChange={onSavePaymentMethodChange}
          disabled={donationType === 'recurring'}
          data-testid="checkbox-save-payment"
        />
        <div className="grid gap-1.5 leading-none">
          <Label
            htmlFor="save-payment"
            className={`text-sm font-medium leading-none ${
              donationType === 'recurring' ? 'text-muted-foreground' : 'cursor-pointer'
            }`}
          >
            Save payment details for future donations
          </Label>
          {donationType === 'recurring' && (
            <p className="text-xs text-muted-foreground">
              Payment details are automatically saved for recurring donations
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold block">What Are You Passionate About?</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Help us send you updates about programs that matter most to you (optional)
          </p>
        </div>
        <div className="space-y-3">
          {PASSION_OPTIONS.map((passion) => {
            const isChecked = donorInfo.passions?.includes(passion.id) || false;
            return (
              <div key={passion.id} className="flex items-start space-x-3 p-3 rounded-md border hover-elevate">
                <Checkbox
                  id={`passion-${passion.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const currentPassions = donorInfo.passions || [];
                    const newPassions = checked
                      ? [...currentPassions, passion.id]
                      : currentPassions.filter(p => p !== passion.id);
                    onDonorInfoChange({ ...donorInfo, passions: newPassions });
                  }}
                  data-testid={`checkbox-passion-${passion.id}`}
                />
                <div className="flex-1">
                  <Label htmlFor={`passion-${passion.id}`} className="text-sm font-medium cursor-pointer">
                    {passion.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {passion.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ clientSecret, amount }: { clientSecret: string; amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donate/success`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full h-12 text-base"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            Donate ${amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  );
}

export default function Donate() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [campaignSlug, setCampaignSlug] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const [hasPrefilledProfile, setHasPrefilledProfile] = useState(false);
  
  // Initialize state from URL params
  const [amount, setAmount] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAmount = params.get('amount');
    // Amount in URL is in cents, convert to dollars
    return urlAmount ? parseInt(urlAmount) / 100 : 50;
  });
  
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFrequency = params.get('frequency');
    // Any valid recurring frequency should set type to recurring
    return (urlFrequency === 'monthly' || urlFrequency === 'quarterly' || urlFrequency === 'annual') 
      ? 'recurring' 
      : 'one-time';
  });
  
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual'>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFrequency = params.get('frequency');
    return (urlFrequency === 'monthly' || urlFrequency === 'quarterly' || urlFrequency === 'annual') 
      ? urlFrequency 
      : 'monthly';
  });
  
  const [donorInfo, setDonorInfo] = useState({
    email: '',
    name: '',
    phone: '',
    isAnonymous: false,
    passions: [] as string[],
  });
  const [savePaymentMethod, setSavePaymentMethod] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFrequency = params.get('frequency');
    // Auto-true for recurring
    return (urlFrequency === 'monthly' || urlFrequency === 'quarterly' || urlFrequency === 'annual');
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Prefill donor info from user profile (only once when user data first loads)
  useEffect(() => {
    if (user && !hasPrefilledProfile) {
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
      setDonorInfo(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: fullName || prev.name,
      }));
      setHasPrefilledProfile(true);
    }
  }, [user, hasPrefilledProfile]);

  // Auto-check savePaymentMethod for recurring donations
  useEffect(() => {
    if (donationType === 'recurring') {
      setSavePaymentMethod(true);
    }
  }, [donationType]);

  // Read campaign from URL params and fetch campaign details
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('campaign');
    if (slug) {
      setCampaignSlug(slug);
      // Fetch campaign details to get the name
      fetch(`/api/donation-campaigns/by-slug/${slug}`)
        .then(res => res.json())
        .then(campaign => {
          if (campaign && campaign.name) {
            setCampaignName(campaign.name);
          }
        })
        .catch(err => {
          console.error('Failed to fetch campaign details:', err);
        });
    }
  }, []);

  const handleProceedToPayment = async () => {
    if (!donorInfo.email) {
      toast({
        title: "Email Required",
        description: "Please provide your email address to receive a donation receipt.",
        variant: "destructive",
      });
      return;
    }

    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Donation amount must be at least $1.00",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/donations/create-checkout', {
        amount: Math.round(amount * 100), // Convert dollars to cents for Stripe
        donationType,
        frequency: donationType === 'recurring' ? frequency : null,
        donorEmail: donorInfo.email,
        donorName: donorInfo.name,
        donorPhone: donorInfo.phone,
        isAnonymous: donorInfo.isAnonymous,
        passions: donorInfo.passions,
        campaignSlug: campaignSlug, // Pass campaign context
        savePaymentMethod: savePaymentMethod,
      });

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Require authentication to donate
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home-donate">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <Card className="text-center p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Login Required</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Please log in to make a donation. This helps us provide you with receipts and manage your giving history.
            </p>
            <a href={`/api/login?returnUrl=${returnUrl}`}>
              <Button size="lg" className="gap-2" data-testid="button-login-to-donate">
                <LogIn className="w-5 h-5" />
                Log In to Donate
              </Button>
            </a>
            <p className="text-sm text-muted-foreground mt-4">
              Don't have an account? Creating one is quick and easy during the login process.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home-donate">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold mb-3" data-testid="heading-donate">Support Julie's Family Learning Program</h1>
          <p className="text-lg text-muted-foreground">
            Your generosity helps provide education and opportunities to families in our community.
          </p>
          {campaignName && (
            <div className="mt-4" data-testid="campaign-indicator">
              <Badge variant="secondary" className="text-sm px-4 py-2">
                Supporting: {campaignName}
              </Badge>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 'form' ? 'Make a Donation' : 'Payment Details'}</CardTitle>
            <CardDescription>
              {step === 'form'
                ? 'Choose your donation amount and provide your information'
                : 'Complete your secure payment below'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'form' ? (
              <div className="space-y-6">
                <DonationForm
                  amount={amount}
                  donationType={donationType}
                  frequency={frequency}
                  donorInfo={donorInfo}
                  savePaymentMethod={savePaymentMethod}
                  onAmountChange={setAmount}
                  onTypeChange={setDonationType}
                  onFrequencyChange={setFrequency}
                  onDonorInfoChange={setDonorInfo}
                  onSavePaymentMethodChange={(checked) => setSavePaymentMethod(!!checked)}
                />
                
                {isAuthenticated && (
                  <SavedPaymentMethods
                    value={selectedPaymentMethod}
                    onChange={setSelectedPaymentMethod}
                  />
                )}

                <Button
                  onClick={handleProceedToPayment}
                  disabled={isLoading}
                  className="w-full h-12 text-base"
                  data-testid="button-proceed-payment"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm clientSecret={clientSecret} amount={amount} />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Your donation is tax-deductible. You will receive a receipt via email.</p>
          <p className="mt-1">Julie's Family Learning Program is a 501(c)(3) nonprofit organization.</p>
        </div>
      </div>
    </div>
  );
}
