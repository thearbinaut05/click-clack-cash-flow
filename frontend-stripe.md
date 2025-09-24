# PCI-Compliant Frontend Stripe Integration Guide

This guide provides step-by-step instructions for integrating Stripe Elements and Checkout with your frontend while maintaining PCI compliance. **Never handle raw card data directly - always use Stripe PaymentMethod IDs.**

## 🔒 Security Principles

### ✅ PCI-Compliant Practices
- ✅ Use Stripe Elements or Checkout for card data collection
- ✅ Only transmit Stripe PaymentMethod IDs to your backend
- ✅ Validate all PaymentMethod IDs server-side
- ✅ Use HTTPS for all communications
- ✅ Implement proper error handling without exposing sensitive data

### ❌ Never Do This (PCI Violations)
- ❌ Collect raw card numbers, CVV, or expiration dates
- ❌ Store card data in localStorage, cookies, or any client storage
- ❌ Log card data in console or error messages
- ❌ Transmit card data via URL parameters or GET requests
- ❌ Use non-HTTPS connections for payment data

## 🚀 Implementation Options

### Option 1: Stripe Elements (Recommended)

Stripe Elements provides secure, customizable payment forms that handle card data collection without your frontend ever touching sensitive information.

#### Installation

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

#### React Implementation

```jsx
// PaymentSetup.jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function PaymentSetup({ children }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
```

```jsx
// PaymentMethodForm.jsx
import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';

export function PaymentMethodForm({ onPaymentMethodCreated }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    setError(null);
    
    const cardElement = elements.getElement(CardElement);
    
    try {
      // Create PaymentMethod (no card data leaves Stripe's servers)
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: 'user@example.com', // Use actual user email
        },
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // ✅ PCI-Compliant: Only send PaymentMethod ID to backend
      const response = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id, // ✅ Safe to transmit
          // ❌ Never include: card number, cvv, expiration
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save payment method');
      }
      
      const result = await response.json();
      onPaymentMethodCreated(result);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="text-red-600 mb-4">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Add Payment Method'}
      </button>
    </form>
  );
}
```

#### Usage

```jsx
// App.jsx
import { PaymentSetup } from './PaymentSetup';
import { PaymentMethodForm } from './PaymentMethodForm';

function App() {
  const handlePaymentMethodCreated = (result) => {
    console.log('Payment method created:', result.id);
    // Update UI to show success
  };
  
  return (
    <PaymentSetup>
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Add Payment Method</h2>
        <PaymentMethodForm onPaymentMethodCreated={handlePaymentMethodCreated} />
      </div>
    </PaymentSetup>
  );
}
```

### Option 2: Stripe Checkout (Easier Implementation)

Stripe Checkout provides a pre-built, hosted payment page that handles the entire payment flow.

#### React Implementation

```jsx
// CheckoutButton.jsx
import { useState } from 'react';

export function CheckoutButton({ amount, userId }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Create Checkout Session on your backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount, // Amount in cents
          userId: userId,
          successUrl: window.location.origin + '/success',
          cancelUrl: window.location.origin + '/cancel',
        }),
      });
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
      
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className="bg-green-600 text-white px-6 py-2 rounded disabled:opacity-50"
    >
      {isLoading ? 'Processing...' : 'Checkout'}
    </button>
  );
}
```

## 🔧 Backend Endpoints

Your backend must provide these PCI-compliant endpoints:

### 1. Create Payment Method

```javascript
// POST /api/payment-methods
app.post('/api/payment-methods', async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    // ✅ Validate PaymentMethod ID format
    if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
      return res.status(400).json({ error: 'Invalid PaymentMethod ID' });
    }
    
    // ✅ Retrieve PaymentMethod from Stripe (never store card data)
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // ✅ Store only the PaymentMethod ID and metadata
    await db.query(`
      INSERT INTO payment_methods (user_id, stripe_payment_method_id, type, last_four, brand)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.userId,
      paymentMethod.id,
      paymentMethod.card.brand,
      paymentMethod.card.last4,
      paymentMethod.card.brand
    ]);
    
    res.json({ 
      success: true, 
      id: paymentMethod.id,
      card: {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save payment method' });
  }
});
```

### 2. Create Checkout Session

```javascript
// POST /api/create-checkout-session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, userId, successUrl, cancelUrl } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'setup', // For saving payment methods
      customer_email: req.userEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        amount: amount
      }
    });
    
    res.json({ sessionId: session.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});
```

### 3. Process Payout (Updated for PaymentMethod IDs)

```javascript
// POST /api/process-payout
app.post('/api/process-payout', async (req, res) => {
  try {
    const { paymentMethodId, amount } = req.body;
    
    // ✅ Validate PaymentMethod ID
    if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
      return res.status(400).json({ error: 'Invalid PaymentMethod ID' });
    }
    
    // ✅ Create payout using PaymentMethod ID
    const payout = await stripe.payouts.create({
      amount: amount,
      currency: 'usd',
      method: 'standard',
      destination: paymentMethodId
    }, {
      stripeAccount: process.env.CONNECTED_ACCOUNT_ID
    });
    
    res.json({ 
      success: true, 
      payoutId: payout.id 
    });
  } catch (error) {
    res.status(500).json({ error: 'Payout failed' });
  }
});
```

## 🔍 Testing & Validation

### Test PaymentMethod IDs

Use these Stripe test PaymentMethod IDs for development:

```javascript
const testPaymentMethods = {
  visa: 'pm_card_visa',
  visaDebit: 'pm_card_visa_debit',
  mastercard: 'pm_card_mastercard',
  amex: 'pm_card_amex',
  declined: 'pm_card_chargeAfterPending',
};
```

### Validation Checklist

- [ ] PaymentMethod IDs always start with `pm_`
- [ ] Never log or expose card data
- [ ] All payment requests use HTTPS
- [ ] Error messages don't reveal card information
- [ ] Card data never stored in frontend state/storage
- [ ] Backend validates all PaymentMethod IDs with Stripe
- [ ] Webhooks handle asynchronous payment events
- [ ] Rate limiting prevents abuse

## 📱 Mobile Considerations

For React Native or mobile apps:

```jsx
// Use @stripe/stripe-react-native
import { useStripe } from '@stripe/stripe-react-native';

export function MobilePaymentForm() {
  const { createPaymentMethod } = useStripe();
  
  const handlePayment = async () => {
    const { error, paymentMethod } = await createPaymentMethod({
      paymentMethodType: 'Card',
      // Card data handled securely by Stripe SDK
    });
    
    if (!error) {
      // ✅ Send only PaymentMethod ID to backend
      await processPayment(paymentMethod.id);
    }
  };
  
  return (
    // Mobile-optimized payment form
  );
}
```

## 🛡️ Security Best Practices

### Environment Variables

```bash
# Frontend (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
VITE_API_BASE_URL=https://api.yourdomain.com

# Backend (.env)
STRIPE_SECRET_KEY_LIVE=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Content Security Policy

```html
<!-- Add to your HTML head -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://js.stripe.com;
  frame-src 'self' https://js.stripe.com;
  connect-src 'self' https://api.stripe.com;
">
```

### Error Handling

```javascript
// ✅ Safe error handling
const handleError = (error) => {
  // Log error details server-side only
  console.error('Payment error:', error.code);
  
  // Show user-friendly message (no sensitive data)
  setError('Payment failed. Please try again.');
};

// ❌ Unsafe error handling
const handleBadError = (error) => {
  // Never expose Stripe error details to user
  setError(error.message); // Could contain sensitive info
};
```

## 📋 Implementation Checklist

- [ ] Installed @stripe/stripe-js and @stripe/react-stripe-js
- [ ] Created PaymentSetup wrapper component
- [ ] Implemented PaymentMethodForm with CardElement
- [ ] Added proper error handling and loading states
- [ ] Created backend endpoints for PaymentMethod handling
- [ ] Validated all PaymentMethod IDs server-side
- [ ] Tested with Stripe test PaymentMethods
- [ ] Added HTTPS enforcement
- [ ] Implemented proper CSP headers
- [ ] Added rate limiting to payment endpoints
- [ ] Set up webhook handling for async events
- [ ] Tested mobile responsiveness
- [ ] Conducted security review

## 🆘 Common Issues & Solutions

### Issue: "PaymentMethod not found"
**Solution**: Ensure you're using the correct Stripe account and the PaymentMethod wasn't created in test mode when using live keys.

### Issue: Cross-origin errors
**Solution**: Add proper CORS headers and ensure your domain is registered with Stripe.

### Issue: Card declined
**Solution**: Use proper error handling and provide clear user feedback without exposing sensitive details.

## 📞 Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements Guide](https://stripe.com/docs/stripe-js)
- [PCI Compliance Guide](https://stripe.com/docs/security)

Remember: **Security is not optional**. Always follow PCI compliance guidelines and never compromise on payment data security.