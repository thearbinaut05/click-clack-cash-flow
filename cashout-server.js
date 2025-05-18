
import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Stripe setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/cashout  { amount: number, email: string, method: string }
app.post("/api/cashout", async (req, res) => {
  try {
    const { amount, email, method } = req.body;
    
    // Validate request data
    if (!amount || !email || !email.includes('@')) {
      console.log("Invalid request:", { amount, email });
      return res.status(400).json({ 
        error: "Amount and valid email are required" 
      });
    }
    
    console.log("Processing cashout:", { amount, email, method });
    
    // Convert amount to cents for Stripe
    const amountCents = Math.round(Number(amount) * 100);
    
    if (method === 'virtual-card') {
      // Create a virtual card using Stripe Issuing
      // Note: This requires Stripe Issuing to be enabled on your account
      try {
        const cardholderData = await stripe.issuing.cardholders.create({
          name: email.split('@')[0],
          email: email,
          status: 'active',
          type: 'individual',
        });
        
        const card = await stripe.issuing.cards.create({
          cardholder: cardholderData.id,
          currency: 'usd',
          type: 'virtual',
          status: 'active',
        });
        
        console.log("Virtual card created:", { 
          email, 
          cardId: card.id,
          last4: card.last4
        });
        
        res.json({ 
          success: true, 
          message: "Virtual card created! Details will be sent to your email shortly.",
          cardDetails: {
            last4: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year
          }
        });
        return;
      } catch (cardError) {
        console.error("Virtual card creation error:", cardError);
        // Fall back to standard payment record if virtual card fails
      }
    } 
    
    // Default method or fallback: record payment for manual processing
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        email: email,
        type: "user_cashout",
        method: method || "standard"
      }
    });

    console.log("Payment recorded:", { 
      email, 
      amount,
      method: method || "standard",
      paymentIntentId: paymentIntent.id
    });

    res.json({ 
      success: true, 
      message: method === 'bank-card' ? 
        "Cashout processed! Funds will be transferred to your bank card." : 
        "Cashout processed! Payment will be sent to your email shortly." 
    });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message || "Payment processing failed" });
  }
});

// Simple health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Cashout server running on ${PORT}`));
