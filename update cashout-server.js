const fs = require('fs');
const path = require('path');

// Define the updated cashout-server.js content
const updatedCashoutServerContent = `const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Endpoint to create a payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { email, amount, metadata } = req.body;
    let customer = await stripe.customers.list({ email, limit: 1 });
    let customerId;

    if (customer.data.length === 0) {
      const newCustomer = await stripe.customers.create({ email, metadata });
      customerId = newCustomer.id;
    } else {
      customerId = customer.data[0].id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['card'],
      metadata
    });

    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint to create a virtual card (requires Stripe Issuing)
app.post('/api/create-virtual-card', async (req, res) => {
  try {
    const { email, metadata } = req.body;
    const cardholder = await stripe.issuing.cardholders.create({
      name: email,
      email,
      status: 'active',
      type: 'individual',
      billing: {
        address: {
          line1: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94111',
          country: 'US',
        },
      },
      metadata
    });

    const card = await stripe.issuing.cards.create({
      cardholder: cardholder.id,
      currency: 'usd',
      type: 'virtual',
      metadata
    });

    res.json({ success: true, id: card.id });
  } catch (error) {
    console.error('Error creating virtual card:', error);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint to process a bank card payout
app.post('/api/process-payout', async (req, res) => {
  try {
    const { payment_method_id, email, amount, metadata } = req.body;
    const transfer = await stripe.transfers.create({
      amount,
      currency: 'usd',
      destination: payment_method_id,
      metadata
    });

    res.json({ success: true, id: transfer.id });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(400).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(\`Server is running on http://localhost:\${PORT}\`);
});
`;

// Function to update the cashout-server.js file
const updateCashoutServer = () => {
  const filePath = path.join(__dirname, 'cashout-server.js');
  fs.writeFileSync(filePath, updatedCashoutServerContent);
  console.log('Updated cashout-server.js successfully.');
};

// Run the update function
updateCashoutServer();
