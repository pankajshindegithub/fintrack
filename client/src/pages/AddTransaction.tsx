import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Plus, FileText, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/mockData";
import { createTransaction } from "@/lib/api";
import { cn } from "@/lib/utils";

type TransactionType = "income" | "expense";

export default function AddTransaction() {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !category) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }
    
    setIsLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please log in to add a transaction.",
      });
      setIsLoading(false);
      navigate("/");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount.",
      });
      setIsLoading(false);
      return;
    }

    const { success, error } = await createTransaction(
      {
        type,
        amount: parsedAmount,
        category,
        description: notes,
        date: date.toISOString(),
      },
      token
    );

    if (!success) {
      toast({
        variant: "destructive",
        title: "Failed to add transaction",
        description: error || "Please try again.",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Transaction added!",
      description: `Your ${type} of ₹${parsedAmount.toLocaleString("en-IN")} has been recorded.`,
    });

    window.dispatchEvent(new Event('transactions:changed'));

    setIsLoading(false);
    navigate("/transactions");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Add Transaction
          </h1>
          <p className="text-muted-foreground mt-1">
            Record your income or expense
          </p>
        </div>

        {/* Form Card */}
        <div className="finance-card animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type Toggle */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Transaction Type
              </label>
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => {
                    setType("income");
                    setCategory("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md transition-all duration-200",
                    type === "income"
                      ? "bg-income text-income-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-lg">📈</span>
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategory("");
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium rounded-md transition-all duration-200",
                    type === "expense"
                      ? "bg-expense text-expense-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-lg">📉</span>
                  Expense
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-lg font-semibold h-14"
                  min="0"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Textarea
                  placeholder="Add a description..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="pl-10 min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant={type === "income" ? "income" : "expense"}
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add {type === "income" ? "Income" : "Expense"}
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
