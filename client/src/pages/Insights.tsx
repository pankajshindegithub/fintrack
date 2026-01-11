import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb,
  ArrowRight,
  Brain,
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { chatInsights, getInsights, InsightItem, InsightsResponse, upsertBudget } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/mockData";

export default function Insights() {
  const [insightsData, setInsightsData] = useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState<string>("");
  const [budgetMonth, setBudgetMonth] = useState<string>("");
  const [budgetLimit, setBudgetLimit] = useState<string>("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [askMessage, setAskMessage] = useState("");
  const [askReply, setAskReply] = useState<string | null>(null);
  const [askProvider, setAskProvider] = useState<string | null>(null);
  const [askDebug, setAskDebug] = useState<any>(null);
  const [isAsking, setIsAsking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setIsLoading(true);
      const { success, data, error } = await getInsights(token);
      setIsLoading(false);

      if (!success || !data) {
        toast({
          variant: 'destructive',
          title: 'Failed to load insights',
          description: error || 'Please try again.',
        });
        return;
      }

      setInsightsData(data);
    };

    run();
  }, [toast]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "success":
        return <TrendingUp className="h-5 w-5" />;
      case "tip":
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getInsightStyles = (type: string) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-warning/10",
          border: "border-warning/20",
          icon: "bg-warning text-warning-foreground",
          text: "text-warning",
        };
      case "success":
        return {
          bg: "bg-income/10",
          border: "border-income/20",
          icon: "bg-income text-income-foreground",
          text: "text-income",
        };
      case "tip":
        return {
          bg: "bg-accent/10",
          border: "border-accent/20",
          icon: "bg-accent text-accent-foreground",
          text: "text-accent",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: "bg-primary text-primary-foreground",
          text: "text-primary",
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const openAsk = () => {
    setAskMessage("");
    setAskReply(null);
    setAskProvider(null);
    setAskDebug(null);
    setIsAskOpen(true);
  };

  const handleAsk = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!askMessage.trim()) {
      toast({
        variant: 'destructive',
        title: 'Enter a question',
        description: 'Type a question to ask the assistant.',
      });
      return;
    }

    setIsAsking(true);
    const { success, data, error } = await chatInsights(askMessage.trim(), token);
    setIsAsking(false);

    if (!success || !data) {
      toast({
        variant: 'destructive',
        title: 'Assistant error',
        description: error || 'Please try again.',
      });
      return;
    }

    setAskReply(data.reply);
    setAskProvider(data.provider || null);
    setAskDebug((data as any)._debug || null);
  };

  const summary = insightsData?.summary;
  const previousSummary = insightsData?.previousSummary;
  const insights: InsightItem[] = insightsData?.insights || [];
  const anomalies = insightsData?.anomalies || [];

  const handleInsightAction = (insight: InsightItem) => {
    if (insight.action === 'Compare Months' || insight.id === 'savings-change') {
      setIsCompareOpen(true);
      return;
    }

    if (insight.action === 'View Summary' || insight.id === 'savings-success') {
      setIsSummaryOpen(true);
      return;
    }

    if (insight.action === 'Set Budget' || insight.id.startsWith('topcat-')) {
      const match = insight.title.match(/Top Expense Category:\s*(.+)$/i);
      const catValue = match ? match[1].trim() : '';
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const monthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

      setBudgetCategory(catValue || '');
      setBudgetMonth(monthStr);
      setBudgetLimit('');
      setIsBudgetOpen(true);
      return;
    }

    toast({
      title: insight.action,
      description: 'This action is not implemented yet.',
    });
  };

  const percent = (v: number) => `${Math.round(v * 100)}%`;
  const safeDeltaPct = (current: number, previous: number) => {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const handleSaveBudget = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!budgetCategory || !budgetMonth || !budgetLimit) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please select category, month and enter a limit.',
      });
      return;
    }

    const parsedLimit = Number(budgetLimit);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid limit',
        description: 'Please enter a valid budget amount.',
      });
      return;
    }

    setIsSavingBudget(true);
    const { success, error } = await upsertBudget(
      { category: budgetCategory, month: budgetMonth, limit: parsedLimit },
      token
    );
    setIsSavingBudget(false);

    if (!success) {
      toast({
        variant: 'destructive',
        title: 'Failed to save budget',
        description: error || 'Please try again.',
      });
      return;
    }

    toast({
      title: 'Budget saved',
      description: `Budget set for ${budgetCategory} (${budgetMonth}).`,
    });
    setIsBudgetOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              AI Insights
            </h1>
          </div>
          <p className="text-muted-foreground">
            Personalized recommendations powered by AI to help you manage your finances better
          </p>
        </div>

        {/* AI Summary Card */}
        <div className="finance-card bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/10 animate-slide-up">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">Monthly Summary</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {isLoading ? "Loading insights..." : summary?.title || "Monthly Summary"}
              </h2>
              <p className="text-muted-foreground">
                {summary?.message || "Add transactions to get personalized recommendations."}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-card border border-border">
                <p className="text-2xl font-bold text-income">
                  {summary ? `${Math.round(summary.savingsRate * 100)}%` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">Savings Rate</p>
              </div>
              <div className="text-center px-6 py-4 rounded-xl bg-card border border-border">
                <p className="text-2xl font-bold text-primary">
                  {summary ? `${summary.onBudget}/${summary.totalCategories}` : "-"}
                </p>
                <p className="text-xs text-muted-foreground">On Budget</p>
              </div>
            </div>
          </div>
        </div>

        {summary && (
          <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
            <div className="finance-card">
              <div className="text-sm text-muted-foreground">Income ({summary.month})</div>
              <div className="text-xl font-bold text-income">{formatCurrency(summary.income)}</div>
            </div>
            <div className="finance-card">
              <div className="text-sm text-muted-foreground">Expenses ({summary.month})</div>
              <div className="text-xl font-bold text-expense">{formatCurrency(summary.expenses)}</div>
            </div>
            <div className="finance-card">
              <div className="text-sm text-muted-foreground">Balance ({summary.month})</div>
              <div className="text-xl font-bold text-foreground">{formatCurrency(summary.balance)}</div>
            </div>
          </div>
        )}

        {/* Insights Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            
            return (
              <div
                key={insight.id}
                className={cn(
                  "finance-card border opacity-0 animate-fade-in group cursor-pointer",
                  styles.bg,
                  styles.border
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl", styles.icon)}>
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {insight.description}
                    </p>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("gap-1 p-0 h-auto", styles.text)}
                      onClick={() => handleInsightAction(insight)}
                    >
                      {insight.action}
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {anomalies.length > 0 && (
          <div className="finance-card animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Unusual expenses</h3>
            </div>
            <div className="space-y-2">
              {anomalies.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <div className="font-medium text-foreground">{a.category}</div>
                    <div className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className="font-semibold text-expense">{formatCurrency(a.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ask AI Section */}
        <div className="finance-card text-center py-12 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow mb-4">
            <Brain className="h-8 w-8 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Have a question about your finances?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our AI assistant can help you understand your spending patterns, 
            find savings opportunities, and plan for the future.
          </p>
          <Button variant="gradient" size="lg" className="gap-2" onClick={openAsk}>
            <Sparkles className="h-5 w-5" />
            Ask AI Assistant
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>

        <Dialog open={isAskOpen} onOpenChange={setIsAskOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask AI Assistant</DialogTitle>
              <DialogDescription>
                Ask about your spending, savings, or budgets. The assistant uses your current-month transactions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Question</div>
                <Textarea
                  value={askMessage}
                  onChange={(e) => setAskMessage(e.target.value)}
                  placeholder='Try: "What is my top spending category this month?"'
                />
              </div>

              {askReply && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Answer</div>
                  <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground">
                    {askReply}
                    {(askProvider || askDebug) && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        {askProvider ? `Provider: ${askProvider}` : null}
                        {askDebug?.geminiError ? ` | Gemini error: ${askDebug.geminiError}` : null}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAskOpen(false)} disabled={isAsking}>
                Close
              </Button>
              <Button onClick={handleAsk} disabled={isAsking}>
                Ask
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compare Months</DialogTitle>
              <DialogDescription>
                Compare this month with last month based on your transactions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!summary || !previousSummary ? (
                <div className="text-sm text-muted-foreground">
                  Not enough data to compare months yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">This month ({summary.month})</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Income</span>
                        <span className="font-semibold text-income">{formatCurrency(summary.income)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="font-semibold text-expense">{formatCurrency(summary.expenses)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className="font-semibold text-foreground">{formatCurrency(summary.balance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Savings rate</span>
                        <span className="font-semibold text-foreground">{percent(summary.savingsRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Last month ({previousSummary.month})</div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Income</span>
                        <span className="font-semibold text-income">{formatCurrency(previousSummary.income)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="font-semibold text-expense">{formatCurrency(previousSummary.expenses)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className="font-semibold text-foreground">{formatCurrency(previousSummary.balance)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Savings rate</span>
                        <span className="font-semibold text-foreground">{percent(previousSummary.savingsRate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 rounded-lg border border-border bg-card p-4">
                    <div className="text-sm font-medium text-foreground">Change</div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Income</span>
                        <span className="text-sm font-semibold text-foreground">
                          {safeDeltaPct(summary.income, previousSummary.income) === null
                            ? '-'
                            : `${safeDeltaPct(summary.income, previousSummary.income)!.toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expenses</span>
                        <span className="text-sm font-semibold text-foreground">
                          {safeDeltaPct(summary.expenses, previousSummary.expenses) === null
                            ? '-'
                            : `${safeDeltaPct(summary.expenses, previousSummary.expenses)!.toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Balance</span>
                        <span className="text-sm font-semibold text-foreground">
                          {safeDeltaPct(summary.balance, previousSummary.balance) === null
                            ? '-'
                            : `${safeDeltaPct(summary.balance, previousSummary.balance)!.toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Savings rate</span>
                        <span className="text-sm font-semibold text-foreground">
                          {`${(summary.savingsRateChange * 100).toFixed(0)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCompareOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Monthly Summary</DialogTitle>
              <DialogDescription>
                A quick overview of your current month performance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!summary ? (
                <div className="text-sm text-muted-foreground">No summary data available yet.</div>
              ) : (
                <>
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">Month</div>
                    <div className="text-lg font-semibold text-foreground">{summary.month}</div>
                    <div className="mt-3 text-sm text-muted-foreground">{summary.title}</div>
                    <div className="mt-2 text-sm text-foreground">{summary.message}</div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Income</div>
                      <div className="text-xl font-bold text-income">{formatCurrency(summary.income)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Expenses</div>
                      <div className="text-xl font-bold text-expense">{formatCurrency(summary.expenses)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Balance</div>
                      <div className="text-xl font-bold text-foreground">{formatCurrency(summary.balance)}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="text-sm text-muted-foreground">Savings rate</div>
                      <div className="text-xl font-bold text-foreground">{percent(summary.savingsRate)}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {`${(summary.savingsRateChange * 100).toFixed(0)}% vs last month`}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="text-sm text-muted-foreground">On budget categories</div>
                    <div className="text-lg font-semibold text-foreground">{summary.onBudget}/{summary.totalCategories}</div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSummaryOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Budget</DialogTitle>
              <DialogDescription>
                Set a monthly spending limit for a category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Category</div>
                <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.type === 'expense' || c.type === 'both')
                      .map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Month (YYYY-MM)</div>
                <Input value={budgetMonth} onChange={(e) => setBudgetMonth(e.target.value)} placeholder="2026-02" />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Monthly limit (₹)</div>
                <Input
                  type="number"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="5000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBudgetOpen(false)} disabled={isSavingBudget}>
                Cancel
              </Button>
              <Button onClick={handleSaveBudget} disabled={isSavingBudget}>
                Save Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
