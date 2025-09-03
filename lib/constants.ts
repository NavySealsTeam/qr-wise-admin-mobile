export const SESSION_KEY = 'auth_session';

export const SESSION_STORE_ID = 'session_store_id';

export const PROMPTS = [
  'What is the total sales revenue for the selected period (daily, weekly, monthly)?',
  'How many transactions were completed within the period?',
  'What is the average transaction value?',
  'What is the average Daily Sales for the Month?',
  'What are the sales trends over time (Hourly, Daily, Weekly, Monthly)?',
  'How much is the Drop/Increase in Sales % VS (Specific Month)?',
  'Compare Weekends VS Weekdays Sales for the Week?',
  'Which products had the highest and lowest sales volume?',
  'What is the revenue per product?',
  'Which products are mostly ordered in the morning/Afternoon?',
  'Which products are frequently bought together?',
  'What is the average Daily Orders Per product?',
  'Which payment method holds highest to lowest?',
  'How many refunds, voids, or cancellations were processed?',
  'What is the percentage of failed or declined transactions?',
  'What is the average number of items per transaction?',
  'Which promotions generated the most sales?',
  'Which Product Holds the Fastest/ Slowest service prep time?',
];

export function getRandomPrompts(count = 3) {
  const shuffled = [...PROMPTS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export const MENU_GROUP_OPTION_CATEGORIES = [
  { value: 'FOOD', label: 'Food' },
  { value: 'BEVERAGE', label: 'Beverage' },
];

export const MENU_FOOD_CATEGORIES = [
  { value: 'BRUNCH', label: 'Brunch' },
  { value: 'DESSERTS', label: 'Desserts' },
];

export const MENU_BEVERAGE_CATEGORIES = [
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'NON-COFFEE', label: 'Non-coffee' },
];
