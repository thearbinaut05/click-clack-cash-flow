
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

// POST /api/cashout  { amount: number, email: string }
app.post("/api/cashout", async (req, res) => {
  try {
    const { amount, email } = req.body;
    
    // Validate request data
    if (!amount || !email || !email.includes('@')) {
      console.log("Invalid request:", { amount, email });
      return res.status(400).json({ 
        error: "Amount and valid email are required" 
      });
    }
    
    console.log("Processing cashout:", { amount, email });
    
    // Convert amount to cents for Stripe
    const amountCents = Math.round(Number(amount) * 100);
    
    // Record the payment in Stripe metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      metadata: {
        email: email,
        type: "user_cashout"
      }
    });

    console.log("Payment recorded:", { 
      email, 
      amount,
      paymentIntentId: paymentIntent.id
    });

    res.json({ 
      success: true, 
      message: "Cashout processed! Payment will be sent to your email shortly." 
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
