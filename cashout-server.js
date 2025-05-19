// Game state management
let gameState = {
  playerName: "Player",
  level: 1,
  coins: 0,
  energy: 100,
  drops: 0,
  cashOutMinimum: 100,
  conversionRate: 0.01, // 100 coins = $1
};

// DOM Elements - once page is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Update UI with initial game state
  updateGameUI();

  // Add event listeners for cash out modal
  const cashOutButton = document.querySelector('.cash-out-button');
  if (cashOutButton) {
    cashOutButton.addEventListener('click', openCashOutModal);
  }
  
  // Close modal when X is clicked
  const closeModalButton = document.querySelector('.cash-out-modal .close-button');
  if (closeModalButton) {
    closeModalButton.addEventListener('click', closeCashOutModal);
  }
  
  // Payment method selection
  const paymentOptions = document.querySelectorAll('.payment-option');
  paymentOptions.forEach(option => {
    option.addEventListener('click', selectPaymentMethod);
  });
  
  // Cash out button in modal
  const processCashOutButton = document.querySelector('.cash-out-modal .process-button');
  if (processCashOutButton) {
    processCashOutButton.addEventListener('click', processCashOut);
  }
  
  // Game feature buttons (energy boost, premium tap)
  const energyBoostButton = document.querySelector('.energy-boost-button');
  if (energyBoostButton) {
    energyBoostButton.addEventListener('click', purchaseEnergyBoost);
  }
  
  const premiumTapButton = document.querySelector('.premium-tap-button');
  if (premiumTapButton) {
    premiumTapButton.addEventListener('click', purchasePremiumTap);
  }
  
  // Analytics button
  const analyticsButton = document.querySelector('.analytics-button');
  if (analyticsButton) {
    analyticsButton.addEventListener('click', openAnalytics);
  }
  
  // Main game area - clicking/tapping mechanism
  const gameArea = document.querySelector('.game-area');
  if (gameArea) {
    gameArea.addEventListener('click', handleGameTap);
  }
});

// Update all UI elements with current game state
function updateGameUI() {
  // Update level display
  const levelElement = document.querySelector('.level-display');
  if (levelElement) levelElement.textContent = `Lvl ${gameState.level}`;
  
  // Update coin display
  const coinElement = document.querySelector('.coin-display');
  if (coinElement) coinElement.textContent = gameState.coins;
  
  // Update energy bar
  const energyBar = document.querySelector('.energy-bar');
  if (energyBar) {
    energyBar.style.width = `${gameState.energy}%`;
    energyBar.textContent = `Energy: ${gameState.energy}%`;
  }
  
  // Update drops display
  const dropsElement = document.querySelector('.drops-display');
  if (dropsElement) dropsElement.textContent = gameState.drops;
  
  // Update cash out button display
  const cashOutButtonText = document.querySelector('.cash-out-button');
  if (cashOutButtonText) {
    const cashValue = (gameState.coins * gameState.conversionRate).toFixed(2);
    cashOutButtonText.textContent = `Cash Out Real Money ($${cashValue})`;
  }
}

// Cash out modal functionality
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
}

function closeCashOutModal() {
  const modal = document.querySelector('.cash-out-modal');
  if (modal) modal.style.display = 'none';
}

// Select payment method
let selectedPaymentMethod = 'standard';

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
  
  // Update message
  const methodMessage = document.querySelector('.payment-method-message');
  if (methodMessage) {
    methodMessage.textContent = `Your payment will be processed according to your selected method`;
  }
}

// Process cash out request
function processCashOut() {
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
  
  // Process based on selected payment method
  let confirmationMessage = '';
  switch (selectedPaymentMethod) {
    case 'standard':
      confirmationMessage = `Payment of $${cashValue} will be sent to ${email}`;
      break;
    case 'virtual-card':
      confirmationMessage = `Virtual card with balance of $${cashValue} will be created and details sent to ${email}`;
      break;
    case 'bank-card':
      confirmationMessage = `$${cashValue} will be transferred to your bank card. Details sent to ${email}`;
      break;
    default:
      confirmationMessage = `Payment of $${cashValue} will be processed. Confirmation sent to ${email}`;
  }
  
  // Show success message
  alert(confirmationMessage);
  
  // Reset coins after successful cash out
  gameState.coins = 0;
  updateGameUI();
  
  // Close modal
  closeCashOutModal();
  
  // Log transaction
  logTransaction(email, cashValue, selectedPaymentMethod);
}

// Email validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Log transaction for analytics and records
function logTransaction(email, amount, method) {
  console.log(`Transaction logged: ${email}, $${amount}, via ${method}`);
  // In a real app, this would send data to a server
}

// Game mechanics
function handleGameTap(event) {
  // Check if player has energy
  if (gameState.energy <= 0) {
    alert('Out of energy! Purchase an energy boost to continue.');
    return;
  }
  
  // Reduce energy slightly with each tap
  gameState.energy = Math.max(0, gameState.energy - 1);
  
  // Add coins based on game logic (more coins at higher levels)
  const baseCoins = 1;
  const levelBonus = Math.floor(gameState.level / 5); // Bonus every 5 levels
  const coinsEarned = baseCoins + levelBonus;
  
  gameState.coins += coinsEarned;
  
  // Occasionally earn drops (rarer resource)
  if (Math.random() < 0.05) { // 5% chance
    gameState.drops += 1;
  }
  
  // Level up logic based on taps or some other metric
  // (Simplified for this example - could be more complex in real game)
  if (gameState.coins > gameState.level * 100) {
    gameState.level += 1;
    // Maybe give rewards for leveling up
    gameState.energy = 100; // Refill energy on level up
    alert(`Level up! You are now level ${gameState.level}`);
  }
  
  // Create visual feedback for tap (coin animation, etc)
  createTapAnimation(event.clientX, event.clientY, coinsEarned);
  
  // Update UI
  updateGameUI();
}

// Visual feedback for tapping
function createTapAnimation(x, y, coins) {
  const animation = document.createElement('div');
  animation.className = 'tap-animation';
  animation.textContent = `+${coins}`;
  animation.style.left = `${x}px`;
  animation.style.top = `${y}px`;
  
  document.body.appendChild(animation);
  
  // Remove animation after it completes
  setTimeout(() => {
    document.body.removeChild(animation);
  }, 1000);
}

// Game features
function purchaseEnergyBoost() {
  if (gameState.coins < 20) {
    alert('Not enough coins! You need 20 coins for an energy boost.');
    return;
  }
  
  gameState.coins -= 20;
  gameState.energy = Math.min(100, gameState.energy + 20);
  
  updateGameUI();
  alert('Energy boosted by 20%!');
}

function purchasePremiumTap() {
  if (gameState.drops < 5) {
    alert('Not enough drops! You need 5 drops to activate Premium Tap.');
    return;
  }
  
  gameState.drops -= 5;
  
  // Activate premium tap mode for 60 seconds
  const originalCoinsPerTap = 1;
  const premiumBonus = 5;
  
  // Store original value and set new value
  const originalTapValue = baseCoins;
  baseCoins = originalTapValue + premiumBonus;
  
  // Update UI to show active premium status
  const premiumIndicator = document.createElement('div');
  premiumIndicator.className = 'premium-active';
  premiumIndicator.textContent = 'PREMIUM ACTIVE! +5 coins per tap';
  document.body.appendChild(premiumIndicator);
  
  updateGameUI();
  
  // Reset after duration
  setTimeout(() => {
    baseCoins = originalTapValue;
    document.body.removeChild(premiumIndicator);
    alert('Premium tap boost has ended');
    updateGameUI();
  }, 60000); // 60 seconds
}

// Analytics screen
function openAnalytics() {
  // This would typically load a more complex analytics dashboard
  // Simplified for this example
  alert(`Game Stats:\n- Level: ${gameState.level}\n- Total Coins Earned: ${gameState.coins}\n- Drops Collected: ${gameState.drops}`);
}

// CSS for animations and UI feedback
const gameStyles = `
.tap-animation {
  position: absolute;
  font-size: 16px;
  color: gold;
  font-weight: bold;
  pointer-events: none;
  animation: float-up 1s ease-out forwards;
  z-index: 1000;
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-50px) scale(1.5);
    opacity: 0;
  }
}

.premium-active {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: gold;
  color: black;
  padding: 10px;
  border-radius: 5px;
  z-index: 1000;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(1); }
  50% { transform: translateX(-50%) scale(1.05); }
  100% { transform: translateX(-50%) scale(1); }
}
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = gameStyles;
document.head.appendChild(styleElement);