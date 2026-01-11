const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
}

export interface CreateTransactionPayload {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export interface UpdateTransactionPayload {
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}

export interface CreateGoalPayload {
  name: string;
  target: number;
  deadline: string;
  icon?: string;
}

export interface UpdateGoalPayload {
  name?: string;
  target?: number;
  deadline?: string;
  icon?: string;
}

export interface InsightsSummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
  savingsRateChange: number;
  onBudget: number;
  totalCategories: number;
  title: string;
  message: string;
}

export interface PreviousMonthSummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export interface InsightItem {
  id: string;
  type: 'warning' | 'success' | 'tip' | 'info';
  title: string;
  description: string;
  action: string;
}

export interface AnomalyItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface BudgetItem {
  _id: string;
  category: string;
  month: string;
  limit: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InsightsResponse {
  summary: InsightsSummary;
  previousSummary?: PreviousMonthSummary;
  insights: InsightItem[];
  anomalies: AnomalyItem[];
}

export const register = async (name: string, email: string, password: string): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    return { success: true, token: data.token };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const getInsights = async (token: string): Promise<ApiResponse<InsightsResponse>> => {
  try {
    const response = await fetch(`${API_URL}/insights`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch insights' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Get insights error:', error);
    return { success: false, error: 'Failed to fetch insights' };
  }
};

export const chatInsights = async (
  message: string,
  token: string
): Promise<ApiResponse<{ reply: string; provider?: string; _debug?: any }>> => {
  try {
    const response = await fetch(`${API_URL}/insights/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to get assistant response' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Chat insights error:', error);
    return { success: false, error: 'Failed to get assistant response' };
  }
};

export const upsertBudget = async (
  payload: { category: string; month: string; limit: number },
  token: string
): Promise<ApiResponse<BudgetItem>> => {
  try {
    const response = await fetch(`${API_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to save budget' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Upsert budget error:', error);
    return { success: false, error: 'Failed to save budget' };
  }
};

export const getBudgets = async (
  token: string,
  month?: string
): Promise<ApiResponse<BudgetItem[]>> => {
  try {
    const url = month ? `${API_URL}/budgets?month=${encodeURIComponent(month)}` : `${API_URL}/budgets`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch budgets' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Get budgets error:', error);
    return { success: false, error: 'Failed to fetch budgets' };
  }
};

export const deleteBudget = async (id: string, token: string): Promise<ApiResponse<{}>> => {
  try {
    const response = await fetch(`${API_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete budget' };
    }

    return { success: true, data: {} };
  } catch (error) {
    console.error('Delete budget error:', error);
    return { success: false, error: 'Failed to delete budget' };
  }
};

export const createGoal = async (
  payload: CreateGoalPayload,
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create goal' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Create goal error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const getGoals = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`${API_URL}/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch goals' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Get goals error:', error);
    return { success: false, error: 'Failed to fetch goals' };
  }
};

export const updateGoal = async (
  id: string,
  payload: UpdateGoalPayload,
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update goal' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Update goal error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const deleteGoal = async (id: string, token: string): Promise<ApiResponse<{}>> => {
  try {
    const response = await fetch(`${API_URL}/goals/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete goal' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Delete goal error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const addGoalFunds = async (
  id: string,
  amount: number,
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/goals/${id}/funds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to add funds' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Add goal funds error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const updateTransaction = async (
  id: string,
  payload: UpdateTransactionPayload,
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update transaction' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Update transaction error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const deleteTransaction = async (
  id: string,
  token: string
): Promise<ApiResponse<{}>> => {
  try {
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete transaction' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Delete transaction error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const createTransaction = async (
  payload: CreateTransactionPayload,
  token: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create transaction' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Create transaction error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const getTransactions = async (token: string): Promise<ApiResponse<any[]>> => {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch transactions' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { success: false, error: 'Failed to fetch transactions' };
  }
};

export const login = async (email: string, password: string): Promise<ApiResponse<{ token: string }>> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }

    return { success: true, token: data.token };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

export const getCurrentUser = async (token: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch user data' };
    }

    return { success: true, data: data.data };
  } catch (error) {
    console.error('Fetch user error:', error);
    return { success: false, error: 'Failed to fetch user data' };
  }
};
