import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { Transaction, categories } from "@/lib/mockData";
import { getTransactions } from "@/lib/api";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { success, data } = await getTransactions(token);
      if (!success || !data) return;

      const mapped: Transaction[] = data.map((t: any) => {
        const cat = categories.find((c) => c.value === t.category);
        return {
          id: t._id,
          type: t.type,
          amount: Number(t.amount),
          category: t.category,
          description: t.description || '',
          date: new Date(t.date).toISOString(),
          icon: cat?.icon || '💰',
        };
      });

      setTransactions(mapped);
    };

    const onChanged = () => run();

    run();
    window.addEventListener('transactions:changed', onChanged);
    window.addEventListener('focus', onChanged);

    return () => {
      window.removeEventListener('transactions:changed', onChanged);
      window.removeEventListener('focus', onChanged);
    };
  }, []);

  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalExpenses = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const balance = totalIncome - totalExpenses;

  const percentChange = (current: number, previous: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(previous)) return undefined;
    if (previous <= 0) return undefined;
    return ((current - previous) / previous) * 100;
  };

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPrevMonth = startOfThisMonth;

  const thisMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'income' && d >= startOfThisMonth && d < startOfNextMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfThisMonth, startOfNextMonth]);

  const thisMonthExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d >= startOfThisMonth && d < startOfNextMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfThisMonth, startOfNextMonth]);

  const prevMonthIncome = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'income' && d >= startOfPrevMonth && d < endOfPrevMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfPrevMonth, endOfPrevMonth]);

  const prevMonthExpenses = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d >= startOfPrevMonth && d < endOfPrevMonth;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, startOfPrevMonth, endOfPrevMonth]);

  const incomeChange = useMemo(() => percentChange(thisMonthIncome, prevMonthIncome), [thisMonthIncome, prevMonthIncome]);
  const expenseChange = useMemo(() => percentChange(thisMonthExpenses, prevMonthExpenses), [thisMonthExpenses, prevMonthExpenses]);
  const balanceChange = useMemo(() => {
    const thisBal = thisMonthIncome - thisMonthExpenses;
    const prevBal = prevMonthIncome - prevMonthExpenses;
    if (prevBal === 0) return undefined;
    return percentChange(thisBal, Math.abs(prevBal));
  }, [thisMonthIncome, thisMonthExpenses, prevMonthIncome, prevMonthExpenses]);

  const savings = Math.max(balance, 0);
  const thisMonthSavings = Math.max(thisMonthIncome - thisMonthExpenses, 0);
  const prevMonthSavings = Math.max(prevMonthIncome - prevMonthExpenses, 0);
  const savingsChange = useMemo(() => percentChange(thisMonthSavings, prevMonthSavings), [thisMonthSavings, prevMonthSavings]);

  const incomeExpenseData = useMemo(() => {
    const monthsToShow = 6;
    const points: Array<{ key: string; month: string; income: number; expenses: number }> = [];
    const monthMap = new Map<string, { key: string; month: string; income: number; expenses: number }>();

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const p = { key, month: label, income: 0, expenses: 0 };
      points.push(p);
      monthMap.set(key, p);
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const p = monthMap.get(key);
      if (!p) return;
      if (t.type === 'income') p.income += t.amount;
      if (t.type === 'expense') p.expenses += t.amount;
    });

    return points.map(({ month, income, expenses }) => ({ month, income, expenses }));
  }, [transactions]);

  const categoryExpenseData = useMemo(() => {
    const totals: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const d = new Date(t.date);
      if (d < startOfThisMonth || d >= startOfNextMonth) return;
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });

    const palette = [
      'hsl(217, 91%, 60%)',
      'hsl(152, 69%, 40%)',
      'hsl(38, 92%, 50%)',
      'hsl(280, 65%, 60%)',
      'hsl(173, 58%, 39%)',
      'hsl(0, 84%, 60%)',
      'hsl(199, 89%, 48%)',
      'hsl(262, 83%, 58%)',
    ];

    return Object.entries(totals)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .map(([catValue, value], idx) => {
        const cat = categories.find((c) => c.value === catValue);
        return {
          name: cat?.label || catValue,
          value,
          color: palette[idx % palette.length],
        };
      });
  }, [transactions, startOfThisMonth, startOfNextMonth]);

  const thisMonthAnalysis = useMemo(() => {
    const expensesThisMonth = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d >= startOfThisMonth && d < startOfNextMonth;
      })
      .sort((a, b) => b.amount - a.amount);

    const biggestExpense = expensesThisMonth[0];

    const topCategory = categoryExpenseData[0];
    const savingsRate = thisMonthIncome > 0 ? (thisMonthIncome - thisMonthExpenses) / thisMonthIncome : 0;

    return {
      topCategory,
      biggestExpense,
      savingsRate,
    };
  }, [transactions, startOfThisMonth, startOfNextMonth, categoryExpenseData, thisMonthIncome, thisMonthExpenses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview for this month
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up stagger-1">
            <StatCard
              title="Total Balance"
              value={formatCurrency(balance)}
              change={balanceChange}
              icon={<Wallet className="h-5 w-5" />}
              variant="primary"
            />
          </div>
          <div className="animate-slide-up stagger-2">
            <StatCard
              title="Total Income"
              value={formatCurrency(totalIncome)}
              change={incomeChange}
              icon={<TrendingUp className="h-5 w-5" />}
              variant="income"
            />
          </div>
          <div className="animate-slide-up stagger-3">
            <StatCard
              title="Total Expenses"
              value={formatCurrency(totalExpenses)}
              change={expenseChange}
              icon={<TrendingDown className="h-5 w-5" />}
              variant="expense"
            />
          </div>
          <div className="animate-slide-up stagger-4">
            <StatCard
              title="Savings"
              value={formatCurrency(savings)}
              change={savingsChange}
              icon={<PiggyBank className="h-5 w-5" />}
              variant="default"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="animate-slide-up stagger-3">
            <IncomeExpenseChart data={incomeExpenseData} />
          </div>
          <div className="animate-slide-up stagger-4 relative">
            <CategoryPieChart data={categoryExpenseData} />
          </div>
        </div>

        <div className="finance-card animate-slide-up">
          <h3 className="text-lg font-semibold text-foreground mb-4">This Month Analysis</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Savings rate</div>
              <div className="text-xl font-bold text-foreground">
                {(thisMonthAnalysis.savingsRate * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Top expense category</div>
              <div className="text-xl font-bold text-foreground">
                {thisMonthAnalysis.topCategory ? thisMonthAnalysis.topCategory.name : "-"}
              </div>
              {thisMonthAnalysis.topCategory && (
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(thisMonthAnalysis.topCategory.value)}
                </div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Biggest expense</div>
              <div className="text-xl font-bold text-foreground">
                {thisMonthAnalysis.biggestExpense ? formatCurrency(thisMonthAnalysis.biggestExpense.amount) : "-"}
              </div>
              {thisMonthAnalysis.biggestExpense && (
                <div className="text-sm text-muted-foreground">
                  {categories.find((c) => c.value === thisMonthAnalysis.biggestExpense?.category)?.label || thisMonthAnalysis.biggestExpense.category}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="animate-slide-up stagger-5">
          <RecentTransactions transactions={transactions} />
        </div>
      </div>
    </DashboardLayout>
  );
}
