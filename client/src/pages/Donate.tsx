// Reference: blueprint:javascript_stripe
import { useState } from 'react';
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
import { Heart, CreditCard, Loader2 } from 'lucide-react';

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PRESET_AMOUNTS = [25, 50, 100, 250];

function DonationForm({ amount, donationType, frequency, donorInfo, onAmountChange, onTypeChange, onFrequencyChange, onDonorInfoChange }: {
  amount: number;
  donationType: 'one-time' | 'recurring';
  frequency: 'monthly' | 'quarterly' | 'annual';
  donorInfo: { email: string; name: string; phone: string; isAnonymous: boolean };
  onAmountChange: (amount: number) => void;
  onTypeChange: (type: 'one-time' | 'recurring') => void;
  onFrequencyChange: (freq: 'monthly' | 'quarterly' | 'annual') => void;
  onDonorInfoChange: (info: any) => void;
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
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
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [amount, setAmount] = useState(50);
  const [donationType, setDonationType] = useState<'one-time' | 'recurring'>('one-time');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [donorInfo, setDonorInfo] = useState({
    email: '',
    name: '',
    phone: '',
    isAnonymous: false,
  });
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        amount,
        donationType,
        frequency: donationType === 'recurring' ? frequency : null,
        donorEmail: donorInfo.email,
        donorName: donorInfo.name,
        donorPhone: donorInfo.phone,
        isAnonymous: donorInfo.isAnonymous,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="w-8 h-8 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-4xl font-bold mb-3" data-testid="heading-donate">Support Julie's Family Learning Program</h1>
          <p className="text-lg text-muted-foreground">
            Your generosity helps provide education and opportunities to families in our community.
          </p>
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
                  onAmountChange={setAmount}
                  onTypeChange={setDonationType}
                  onFrequencyChange={setFrequency}
                  onDonorInfoChange={setDonorInfo}
                />
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
