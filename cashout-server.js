// 1. First, add Stripe.js to your HTML
// Add this to your HTML head section:
// <script src="https://js.stripe.com/v3/"></script>

// 2. Initialize Stripe with your publishable key
let stripe;
let elements;
let cardElement;
let paymentMethodId;

// Initialize Stripe on document load
document.addEventListener('DOMContentLoaded', () => {
  // Your publishable key from Stripe Dashboard
  // IMPORTANT: Use environment variables in production
  const stripePublishableKey = 'pk_test_your_publishable_key';
  stripe = Stripe(stripePublishableKey);
  
  // Other initialization code remains the same...
  updateGameUI();
  setupEventListeners();
});

function setupEventListeners() {
  // All your existing event listeners...
  const cashOutButton = document.querySelector('.cash-out-button');
  if (cashOutButton) {
    cashOutButton.addEventListener('click', openCashOutModal);
  }
  
  // Plus Stripe-specific listeners
  const paymentOptions = document.querySelectorAll('.payment-option');
  paymentOptions.forEach(option => {
    option.addEventListener('click', selectPaymentMethod);
  });
  
  const processCashOutButton = document.querySelector('.cash-out-modal .process-button');
  if (processCashOutButton) {
    processCashOutButton.addEventListener('click', handleStripeCashOut);
  }
}

// 3. Modified payment method selection to handle Stripe elements
function selectPaymentMethod(event) {
  // Get the clicked payment option
  const clicked = event.currentTarget;
  
  // Remove active class from all options
  const paymentOptions = document.querySelectorAll('.payment-option');
  paymentOptions.forEach(option => {
    option.classList.remove('active');
  });
  
  // Add active class to selected option
  clicked.classList.add('active');
  
  // Store selected payment method
  selectedPaymentMethod = clicked.dataset.method;
  
  // For bank card option, initialize Stripe Card Element if it doesn't exist
  if (selectedPaymentMethod === 'bank-card') {
    initializeStripeCardElement();
  }
  
  // Update message
  const methodMessage = document.querySelector('.payment-method-message');
  if (methodMessage) {
    methodMessage.textContent = `Your payment will be processed according to your selected method`;
  }
}

// 4. Initialize Stripe Card Element for bank card option
function initializeStripeCardElement() {
  // Look for an existing card element container
  const cardElementContainer = document.querySelector('#card-element-container');
  
  // If the container exists but doesn't have elements initialized
  if (cardElementContainer && !cardElement) {
    // Create elements instance
    elements = stripe.elements();
    
    // Create and mount the Card Element
    cardElement = elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4'
          }
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a'
        }
      }
    });
    
    cardElement.mount('#card-element-container');
    
    // Handle real-time validation errors from the card Element
    cardElement.on('change', function(event) {
      const displayError = document.getElementById('card-errors');
      if (displayError) {
        if (event.error) {
          displayError.textContent = event.error.message;
        } else {
          displayError.textContent = '';
        }
      }
    });
  }
  
  // Show the card element container only for bank card option
  if (cardElementContainer) {
    if (selectedPaymentMethod === 'bank-card') {
      cardElementContainer.style.display = 'block';
    } else {
      cardElementContainer.style.display = 'none';
    }
  }
}

// 5. Handle Stripe cash out processing
async function handleStripeCashOut() {
  // Get email address
  const emailInput = document.querySelector('.cash-out-modal .email-input');
  const email = emailInput ? emailInput.value : '';
  
  // Validate email
  if (!validateEmail(email)) {
    alert('Please enter a valid email address');
    return;
  }
  
  // Check minimum coins
  if (gameState.coins < gameState.cashOutMinimum) {
    alert(`You need at least ${gameState.cashOutMinimum} coins to cash out`);
    return;
  }
  
  // Calculate cash value
  const cashValue = (gameState.coins * gameState.conversionRate).toFixed(2);
  
  // Show loading state
  const cashOutButton = document.querySelector('.cash-out-modal .process-button');
  if (cashOutButton) {
    cashOutButton.disabled = true;
    cashOutButton.textContent = 'Processing...';
  }
  
  try {
    // Process based on selected payment method
    switch (selectedPaymentMethod) {
      case 'standard':
        // Standard payment via Stripe PaymentIntents
        await processStandardPayment(email, cashValue);
        break;
        
      case 'virtual-card':
        // Virtual card via Stripe Issuing
        await processVirtualCard(email, cashValue);
        break;
        
      case 'bank-card':
        // Bank card transfer via Stripe Payment Methods
        await processBankCardPayment(email, cashValue);
        break;
        
      default:
        throw new Error('Invalid payment method selected');
    }
    
    // Reset coins after successful cash out
    gameState.coins = 0;
    updateGameUI();
    
    // Close modal
    closeCashOutModal();
    
  } catch (error) {
    // Show error to customer
    console.error('Payment error:', error);
    alert(`Payment processing error: ${error.message}`);
  } finally {
    // Reset button state
    if (cashOutButton) {
      cashOutButton.disabled = false;
      cashOutButton.textContent = 'Cash Out';
    }
  }
}

// 6. Process standard payment (server-side integration)
async function processStandardPayment(email, amount) {
  // 1. Create a PaymentIntent on your server
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      amount: parseFloat(amount) * 100, // Convert to cents
      payment_method: 'standard',
      metadata: {
        user_id: gameState.userId || 'anonymous',
        coins_converted: gameState.coins,
        game_level: gameState.level
      }
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Payment failed');
  }
  
  const paymentData = await response.json();
  
  // 2. Show success message
  alert(`Payment of $${amount} will be sent to ${email}. Transaction ID: ${paymentData.id}`);
  
  // 3. Log transaction
  logTransaction(email, amount, 'standard', paymentData.id);
}

// 7. Process virtual card (requires Stripe Issuing)
async function processVirtualCard(email, amount) {
  // 1. Request virtual card creation from your server
  const response = await fetch('/api/create-virtual-card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      amount: parseFloat(amount) * 100, // Convert to cents
      metadata: {
        user_id: gameState.userId || 'anonymous',
        coins_converted: gameState.coins,
        game_level: gameState.level
      }
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Virtual card creation failed');
  }
  
  const cardData = await response.json();
  
  // 2. Show success message
  alert(`Virtual card with balance of $${amount} has been created. Details will be sent to ${email}`);
  
  // 3. Log transaction
  logTransaction(email, amount, 'virtual-card', cardData.id);
}

// 8. Process bank card payment (direct transfer)
async function processBankCardPayment(email, amount) {
  try {
    // 1. Create a payment method using the card element
    const result = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        email: email,
      },
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // 2. Send the payment method ID to your server
    const response = await fetch('/api/process-payout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_method_id: result.paymentMethod.id,
        email: email,
        amount: parseFloat(amount) * 100, // Convert to cents
        metadata: {
          user_id: gameState.userId || 'anonymous',
          coins_converted: gameState.coins,
          game_level: gameState.level
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Bank card payment failed');
    }
    
    const payoutData = await response.json();
    
    // 3. Show success message
    alert(`$${amount} will be transferred to your bank card. Details sent to ${email}`);
    
    // 4. Log transaction
    logTransaction(email, amount, 'bank-card', payoutData.id);
    
  } catch (error) {
    console.error('Stripe error:', error);
    throw error;
  }
}

// 9. Enhanced transaction logging
function logTransaction(email, amount, method, transactionId) {
  console.log(`Transaction logged: ${email}, $${amount}, via ${method}, ID: ${transactionId}`);
  
  // In a real app, this would send data to a server
  fetch('/api/log-transaction', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      amount: amount,
      payment_method: method,
      transaction_id: transactionId,
      timestamp: new Date().toISOString(),
      user_id: gameState.userId || 'anonymous',
      game_state: {
        level: gameState.level,
        energy: gameState.energy,
        drops: gameState.drops
      }
    })
  }).catch(err => console.error('Failed to log transaction:', err));
}

// 10. Add required HTML for Stripe Card Elements
function addStripeUIElements() {
  // Create container for card element if it doesn't exist
  if (!document.getElementById('card-element-container')) {
    // Find payment method container
    const paymentMethodContainer = document.querySelector('.payment-methods-container');
    if (paymentMethodContainer) {
      // Create and append card element container
      const cardContainer = document.createElement('div');
      cardContainer.innerHTML = `
        <div id="card-element-container" style="display: none; margin-top: 15px; padding: 10px; border-radius: 4px; background: #f7f7f7;">
          <p>Please enter your card details:</p>
          <div id="card-element" style="margin-bottom: 10px;"></div>
          <div id="card-errors" role="alert" style="color: #fa755a; margin-top: 8px;"></div>
        </div>
      `;
      paymentMethodContainer.appendChild(cardContainer);
    }
  }
}

// 11. Modified openCashOutModal to include Stripe elements
function openCashOutModal() {
  const modal = document.querySelector('.cash-out-modal');
  if (modal) modal.style.display = 'block';
  
  // Update values in the modal
  const coinsDisplay = document.querySelector('.cash-out-modal .your-coins');
  if (coinsDisplay) coinsDisplay.textContent = gameState.coins;
  
  const cashValueDisplay = document.querySelector('.cash-out-modal .cash-value');
  if (cashValueDisplay) {
    const cashValue = (gameState.coins * gameState.conversionRate).toFixed(2);
    cashValueDisplay.textContent = `$${cashValue}`;
  }
  
  // Show appropriate message based on coin amount
  const minimumMessage = document.querySelector('.cash-out-modal .minimum-message');
  if (minimumMessage) {
    if (gameState.coins < gameState.cashOutMinimum) {
      minimumMessage.style.display = 'block';
      minimumMessage.textContent = `You need at least ${gameState.cashOutMinimum} coins to cash out`;
    } else {
      minimumMessage.style.display = 'none';
    }
  }
  
  // Disable cash out button if below minimum
  const cashOutButton = document.querySelector('.cash-out-modal .process-button');
  if (cashOutButton) {
    cashOutButton.disabled = gameState.coins < gameState.cashOutMinimum;
  }
  
  // Add Stripe UI elements if not already present
  addStripeUIElements();
  
  // Initialize Stripe elements based on default selected payment method
  if (selectedPaymentMethod === 'bank-card') {
    initializeStripeCardElement();
  }
}

// 12. Server-side code (for reference - implement in Node.js, Python, etc.)
/*
  // Example Express.js endpoint to create a payment intent
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { email, amount, payment_method, metadata } = req.body;
      
      // Create a Customer if they don't exist
      let customer = await stripe.customers.list({
        email: email,
        limit: 1
      });
      
      let customerId;
      if (customer.data.length === 0) {
        const newCustomer = await stripe.customers.create({
          email: email,
          metadata: metadata
        });
        customerId = newCustomer.id;
      } else {
        customerId = customer.data[0].id;
      }
      
      // Create a PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        customer: customerId,
        payment_method_types: ['card'],
        metadata: metadata
      });
      
      // Send payment intent client secret to client
      res.json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Example endpoint to create a virtual card (Stripe Issuing)
  app.post('/api/create-virtual-card', async (req, res) => {
    try {
      const { email, amount, metadata } = req.body;
      
      // Create a cardholder first (required for Issuing)
      const cardholder = await stripe.issuing.cardholders.create({
        name: email,
        email: email,
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
        metadata: metadata
      });
      
      // Then create a card
      const card = await stripe.issuing.cards.create({
        cardholder: cardholder.id,
        currency: 'usd',
        type: 'virtual',
        metadata: metadata
      });
      
      // Send virtual card details to user's email
      // (implement your email sending logic here)
      
      res.json({
        success: true,
        id: card.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Example endpoint to process a bank card payout
  app.post('/api/process-payout', async (req, res) => {
    try {
      const { payment_method_id, email, amount, metadata } = req.body;
      
      // For demonstration - in production, you would:
      // 1. Verify the bank account details
      // 2. Create a transfer or payout to that account
      
      // Example using Stripe Transfer
      const transfer = await stripe.transfers.create({
        amount: amount,
        currency: 'usd',
        destination: payment_method_id, // In reality, this would be a connected account
        metadata: metadata
      });
      
      res.json({
        success: true,
        id: transfer.id
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
*/