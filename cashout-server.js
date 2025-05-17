require("dotenv").config();
const express = require("express");
const Stripe = require("stripe");
const cors = require("cors");

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
    const totalCents = Math.round(Number(amount) * 100);
    const userCents = Math.floor(totalCents / 2);
    const ownerCents = totalCents - userCents;

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
    console.error(err);
    res.status(500).json({ error: err.message || "Stripe error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Cashout server running on ${PORT}`));
