
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

// POST /api/cashout  { amount: number, userStripeAccountId: string }
app.post("/api/cashout", async (req, res) => {
  try {
    const { amount, userStripeAccountId } = req.body;
    if (!amount || !userStripeAccountId) {
      return res.status(400).json({ error: "amount and userStripeAccountId are required" });
    }
    
    console.log("Processing cashout:", { amount, userStripeAccountId });
    
    const totalCents = Math.round(Number(amount) * 100);
    const userCents = Math.floor(totalCents / 2);
    const ownerCents = totalCents - userCents;

    console.log("Transferring to user:", { userCents });
    console.log("Transferring to owner:", { ownerCents });
    
    // Transfer to user
    await stripe.transfers.create({
      amount: userCents,
      currency: "usd",
      destination: userStripeAccountId,
      description: "User cashout"
    });

    // Transfer to owner
    await stripe.transfers.create({
      amount: ownerCents,
      currency: "usd",
      destination: OWNER_STRIPE_ACCOUNT_ID,
      description: "Owner split"
    });

    res.json({ success: true, message: "Cashout split sent!" });
  } catch (err) {
    console.error("Cashout error:", err);
    res.status(500).json({ error: err.message || "Stripe error" });
  }
});

// Webhook endpoint for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'transfer.created':
      const transfer = event.data.object;
      console.log(`Transfer created: ${transfer.id} for ${transfer.amount / 100} USD`);
      break;
    case 'transfer.failed':
      const failedTransfer = event.data.object;
      console.error(`Transfer failed: ${failedTransfer.id}. Reason: ${failedTransfer.failure_message}`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Cashout server running on ${PORT}`));
