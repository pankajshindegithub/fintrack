import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Transaction } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="finance-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
        <button
          className="text-sm text-primary hover:underline"
          onClick={() => navigate("/transactions")}
          type="button"
        >
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {transactions.slice(0, 5).map((transaction, index) => (
          <div
            key={transaction.id}
            className="transaction-row opacity-0 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "forwards" }}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg text-lg",
                transaction.type === "income" ? "bg-income-light" : "bg-expense-light"
              )}>
                {transaction.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">{transaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "font-semibold",
                transaction.type === "income" ? "text-income" : "text-expense"
              )}>
                {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
              </span>
              {transaction.type === "income" ? (
                <ArrowUpRight className="h-4 w-4 text-income" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-expense" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
