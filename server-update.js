const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Define the necessary files and their content
const files = {
  '.env': `STRIPE_SECRET_KEY=your_stripe_secret_key_here
PORT=3000`,
  'server.js': `const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

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
    res.status(400).json({ error: error.message });
  }
});

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
    res.status(400).json({ error: error.message });
  }
});

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
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('Server is running on http://localhost:' + PORT);
});\`
};

// Function to create files if they don't exist
const createFiles = () => {
  Object.keys(files).forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, files[file]);
      console.log(`Created: ${file}`);
    } else {
      console.log(`File already exists: ${file}`);
    }
  });
};

// Function to install necessary packages
const installPackages = () => {
  exec('npm install express stripe cors body-parser dotenv', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing packages: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(stdout);
    startServer();
  });
};

// Function to start the server
const startServer = () => {
  exec('node server.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error starting server: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(stdout);
  });
};

// Main function to run the setup
const main = () => {
  createFiles();
  installPackages();
};

main();
