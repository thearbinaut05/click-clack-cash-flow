
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

// POST /api/create-account { email: string, name: string }
app.post("/api/create-account", async (req, res) => {
  try {
    const { email, name, country = "US" } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "email and name are required" });
    }
    
    console.log("Creating account for:", { email, name });
    
    // Check if account already exists
    const existingAccounts = await stripe.accounts.list({
      email,
      limit: 1
    });
    
    if (existingAccounts.data.length > 0) {
      return res.json({ 
        success: true, 
        accountId: existingAccounts.data[0].id,
        alreadyExists: true
      });
    }
    
    // Create a new account
    const account = await stripe.accounts.create({
      type: 'express',
      country,
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: name,
      },
    });
    
    console.log("Account created:", account.id);
    
    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.origin}/account-refresh`,
      return_url: `${req.headers.origin}/account-return`,
      type: 'account_onboarding',
    });
    
    res.json({ 
      success: true, 
      accountId: account.id, 
      accountLink: accountLink.url 
    });
  } catch (err) {
    console.error("Account creation error:", err);
    res.status(500).json({ error: err.message || "Error creating account" });
  }
});

// GET /api/account-status/:accountId
app.get("/api/account-status/:accountId", async (req, res) => {
  try {
    const { accountId } = req.params;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }
    
    const account = await stripe.accounts.retrieve(accountId);
    
    res.json({ 
      success: true, 
      accountId: account.id,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled
    });
  } catch (err) {
    console.error("Account status error:", err);
    res.status(500).json({ error: err.message || "Error retrieving account" });
  }
});

// POST /api/create-account-link { accountId: string }
app.post("/api/create-account-link", async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.origin}/account-refresh`,
      return_url: `${req.headers.origin}/account-return`,
      type: 'account_onboarding',
    });
    
    res.json({ success: true, url: accountLink.url });
  } catch (err) {
    console.error("Account link error:", err);
    res.status(500).json({ error: err.message || "Error creating account link" });
  }
});

// POST /api/cashout  { amount: number, userStripeAccountId: string }
app.post("/api/cashout", async (req, res) => {
  try {
    const { amount, userStripeAccountId } = req.body;
    if (!amount || !userStripeAccountId) {
      return res.status(400).json({ error: "amount and userStripeAccountId are required" });
    }
    
    console.log("Processing cashout:", { amount, userStripeAccountId });
    
    // Check account status first
    const account = await stripe.accounts.retrieve(userStripeAccountId);
    if (!account.payouts_enabled) {
      return res.status(400).json({ 
        error: "Account not fully set up for payouts",
        accountStatus: {
          payoutsEnabled: account.payouts_enabled,
          detailsSubmitted: account.details_submitted
        }
      });
    }
    
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
    case 'account.updated':
      const account = event.data.object;
      console.log(`Account updated: ${account.id}. Payouts enabled: ${account.payouts_enabled}`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Cashout server running on ${PORT}`));
