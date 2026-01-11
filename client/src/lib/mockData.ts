export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  icon: string;
}

export interface Category {
  value: string;
  label: string;
  icon: string;
  type: "income" | "expense" | "both";
}

export const categories: Category[] = [
  { value: "salary", label: "Salary", icon: "💼", type: "income" },
  { value: "freelance", label: "Freelance", icon: "💻", type: "income" },
  { value: "investment", label: "Investment", icon: "📈", type: "income" },
  { value: "other-income", label: "Other Income", icon: "💰", type: "income" },
  { value: "food", label: "Food", icon: "🍔", type: "expense" },
  { value: "travel", label: "Travel", icon: "🚕", type: "expense" },
  { value: "rent", label: "Rent", icon: "🏠", type: "expense" },
  { value: "entertainment", label: "Entertainment", icon: "🎮", type: "expense" },
  { value: "utilities", label: "Utilities", icon: "⚡", type: "expense" },
  { value: "shopping", label: "Shopping", icon: "🛍️", type: "expense" },
  { value: "health", label: "Health", icon: "🏥", type: "expense" },
  { value: "education", label: "Education", icon: "📚", type: "expense" },
];

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    amount: 75000,
    category: "salary",
    description: "Monthly salary",
    date: "2024-01-15",
    icon: "💼",
  },
  {
    id: "2",
    type: "expense",
    amount: 15000,
    category: "rent",
    description: "Monthly rent payment",
    date: "2024-01-05",
    icon: "🏠",
  },
  {
    id: "3",
    type: "expense",
    amount: 3500,
    category: "food",
    description: "Groceries from BigBasket",
    date: "2024-01-18",
    icon: "🍔",
  },
  {
    id: "4",
    type: "expense",
    amount: 2000,
    category: "utilities",
    description: "Electricity bill",
    date: "2024-01-10",
    icon: "⚡",
  },
  {
    id: "5",
    type: "income",
    amount: 25000,
    category: "freelance",
    description: "Web development project",
    date: "2024-01-20",
    icon: "💻",
  },
  {
    id: "6",
    type: "expense",
    amount: 5000,
    category: "entertainment",
    description: "Concert tickets",
    date: "2024-01-22",
    icon: "🎮",
  },
  {
    id: "7",
    type: "expense",
    amount: 8000,
    category: "shopping",
    description: "New clothes",
    date: "2024-01-25",
    icon: "🛍️",
  },
  {
    id: "8",
    type: "expense",
    amount: 1500,
    category: "travel",
    description: "Uber rides this week",
    date: "2024-01-26",
    icon: "🚕",
  },
];

export const monthlyData = [
  { month: "Jan", income: 100000, expenses: 45000 },
  { month: "Feb", income: 85000, expenses: 52000 },
  { month: "Mar", income: 95000, expenses: 48000 },
  { month: "Apr", income: 110000, expenses: 55000 },
  { month: "May", income: 90000, expenses: 42000 },
  { month: "Jun", income: 105000, expenses: 60000 },
];

export const categoryExpenses = [
  { name: "Rent", value: 15000, color: "hsl(217, 91%, 60%)" },
  { name: "Food", value: 8500, color: "hsl(152, 69%, 40%)" },
  { name: "Shopping", value: 8000, color: "hsl(38, 92%, 50%)" },
  { name: "Entertainment", value: 5000, color: "hsl(280, 65%, 60%)" },
  { name: "Travel", value: 4500, color: "hsl(173, 58%, 39%)" },
  { name: "Utilities", value: 2000, color: "hsl(0, 84%, 60%)" },
];

export const savingsGoals = [
  {
    id: "1",
    name: "Emergency Fund",
    target: 100000,
    current: 65000,
    deadline: "2024-12-31",
    icon: "🛡️",
  },
  {
    id: "2",
    name: "Vacation Trip",
    target: 50000,
    current: 32000,
    deadline: "2024-06-30",
    icon: "✈️",
  },
  {
    id: "3",
    name: "New Laptop",
    target: 80000,
    current: 45000,
    deadline: "2024-03-31",
    icon: "💻",
  },
];

export const aiInsights = [
  {
    id: "1",
    type: "warning",
    title: "High Entertainment Spending",
    description: "Your entertainment expenses are 25% higher than last month. Consider setting a budget limit.",
    action: "Set Budget",
  },
  {
    id: "2",
    type: "success",
    title: "Great Savings Streak!",
    description: "You've saved ₹15,000 more than your target this month. Keep up the great work!",
    action: "View Details",
  },
  {
    id: "3",
    type: "info",
    title: "Subscription Analysis",
    description: "You have 5 active subscriptions totaling ₹2,500/month. Review to find savings.",
    action: "Review",
  },
  {
    id: "4",
    type: "tip",
    title: "Smart Investment Tip",
    description: "Based on your savings pattern, you could invest ₹10,000/month in mutual funds.",
    action: "Learn More",
  },
];
