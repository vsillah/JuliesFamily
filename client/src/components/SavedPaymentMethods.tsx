import { useQuery } from '@tanstack/react-query';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Plus } from 'lucide-react';

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

interface SavedPaymentMethodsProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function getCardBrandIcon(brand: string) {
  const brandLower = brand.toLowerCase();
  
  switch (brandLower) {
    case 'visa':
    case 'mastercard':
    case 'amex':
    case 'discover':
    case 'diners':
    case 'jcb':
    case 'unionpay':
      return <CreditCard className="w-5 h-5" />;
    default:
      return <CreditCard className="w-5 h-5" />;
  }
}

function getCardBrandName(brand: string) {
  const brandLower = brand.toLowerCase();
  
  const brandNames: Record<string, string> = {
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'amex': 'American Express',
    'discover': 'Discover',
    'diners': 'Diners Club',
    'jcb': 'JCB',
    'unionpay': 'UnionPay'
  };
  
  return brandNames[brandLower] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function SavedPaymentMethods({ value, onChange, disabled }: SavedPaymentMethodsProps) {
  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/stripe/payment-methods'],
    enabled: !disabled,
  });

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="loading-payment-methods">
        <Label className="text-base font-semibold">Saved Payment Methods</Label>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  const hasSavedMethods = paymentMethods && paymentMethods.length > 0;

  if (!hasSavedMethods) {
    return (
      <div className="space-y-3" data-testid="empty-payment-methods">
        <Label className="text-base font-semibold">Payment Method</Label>
        <Card className="p-4 flex items-center gap-3">
          <Plus className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Add a new payment method</p>
            <p className="text-xs text-muted-foreground">You'll enter your payment details on the next step</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="saved-payment-methods">
      <Label className="text-base font-semibold">Select Payment Method</Label>
      <RadioGroup value={value || 'new'} onValueChange={onChange} disabled={disabled}>
        {paymentMethods.map((method) => (
          <div key={method.id} className="flex items-center space-x-3">
            <RadioGroupItem
              value={method.id}
              id={`payment-${method.id}`}
              data-testid={`radio-payment-${method.id}`}
            />
            <Label
              htmlFor={`payment-${method.id}`}
              className="flex-1 cursor-pointer"
            >
              <Card className="p-4 flex items-center gap-3 hover-elevate">
                {getCardBrandIcon(method.brand)}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {getCardBrandName(method.brand)} ending in {method.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                  </p>
                </div>
              </Card>
            </Label>
          </div>
        ))}
        
        <div className="flex items-center space-x-3">
          <RadioGroupItem
            value="new"
            id="payment-new"
            data-testid="radio-payment-new"
          />
          <Label htmlFor="payment-new" className="flex-1 cursor-pointer">
            <Card className="p-4 flex items-center gap-3 hover-elevate">
              <Plus className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Add new payment method</p>
                <p className="text-xs text-muted-foreground">
                  Use a different card for this donation
                </p>
              </div>
            </Card>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
