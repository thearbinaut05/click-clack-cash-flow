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
const OWNER_STRIPE_ACCOUNT_ID = process.env.OWNER_STRIPE_ACCOUNT_ID;

// POST /api/cashout  { amount: number, email: string }
app.post("/api/cashout", async (req, res) => {
  try {
    const { amount, email } = req.body;
    if (!amount || !email || !email.includes('@')) {
      return res.status(400).json({ 
        error: "Amount and valid email are required" 
      });
    }
    
    console.log("Processing cashout:", { amount, email });
    
    // Convert amount to cents for Stripe
    const totalCents = Math.round(Number(amount) * 100);
    const userCents = Math.floor(totalCents / 2);
    const ownerCents = totalCents - userCents;

    // Store transaction in Stripe metadata for record keeping
    const metadata = {
      email: email,
      totalAmount: amount.toString(),
      userAmount: (userCents / 100).toString(),
      ownerAmount: (ownerCents / 100).toString()
    };

    console.log("Transaction details:", metadata);
    
    // Transfer to owner's account (since we can't transfer to user without account)
    await stripe.transfers.create({
      amount: ownerCents,
      currency: "usd",
      destination: OWNER_STRIPE_ACCOUNT_ID,
      metadata: {
        ...metadata,
        type: "owner_split"
      }
    });
    
    // Record the user's share as a payment intent
    // In a real app, you would implement another way to pay the user 
    // (e.g., PayPal, direct deposit, manual process)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: userCents,
      currency: "usd",
      metadata: {
        ...metadata,
        email: email,
        type: "user_cashout"
      }
    });

    console.log("Payment recorded, user will be paid manually:", { 
      email, 
      amount: userCents / 100 
    });

    res.json({ 
      success: true, 
      message: "Cashout processed! Payment will be sent shortly." 
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
