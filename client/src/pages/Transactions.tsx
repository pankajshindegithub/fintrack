import { useEffect, useState } from "react";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  Pencil, 
  Trash2,
  ChevronDown
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { categories, Transaction } from "@/lib/mockData";
import { deleteTransaction, getTransactions, updateTransaction } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"income" | "expense">("expense");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const { toast } = useToast();

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

    run();
  }, []);

  const openEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditType(transaction.type);
    setEditAmount(String(transaction.amount));
    setEditCategory(transaction.category);
    setEditDescription(transaction.description || "");
    setEditDate(format(new Date(transaction.date), "yyyy-MM-dd"));
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const parsedAmount = Number(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount.",
      });
      return;
    }

    if (!editCategory) {
      toast({
        variant: "destructive",
        title: "Missing category",
        description: "Please select a category.",
      });
      return;
    }

    setIsMutating(true);
    const { success, data, error } = await updateTransaction(
      editingId,
      {
        type: editType,
        amount: parsedAmount,
        category: editCategory,
        description: editDescription,
        date: editDate ? new Date(editDate).toISOString() : undefined,
      },
      token
    );

    if (!success || !data) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error || "Please try again.",
      });
      setIsMutating(false);
      return;
    }

    const cat = categories.find((c) => c.value === data.category);
    const updated: Transaction = {
      id: data._id,
      type: data.type,
      amount: Number(data.amount),
      category: data.category,
      description: data.description || "",
      date: new Date(data.date).toISOString(),
      icon: cat?.icon || "💰",
    };

    setTransactions((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    setIsEditOpen(false);
    setEditingId(null);
    setIsMutating(false);
    window.dispatchEvent(new Event('transactions:changed'));
    toast({
      title: "Transaction updated",
      description: "Your changes have been saved.",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsMutating(true);
    const { success, error } = await deleteTransaction(deletingId, token);

    if (!success) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error || "Please try again.",
      });
      setIsMutating(false);
      return;
    }

    setTransactions((prev) => prev.filter((t) => t.id !== deletingId));
    setIsDeleteOpen(false);
    setDeletingId(null);
    setIsMutating(false);
    window.dispatchEvent(new Event('transactions:changed'));
    toast({
      title: "Transaction deleted",
      description: "The transaction has been removed.",
    });
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesCategory =
      filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Transactions
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all your transactions
            </p>
          </div>
          
          {/* Summary Pills */}
          <div className="flex gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-income-light">
              <ArrowUpRight className="h-4 w-4 text-income" />
              <span className="text-sm font-medium text-income">
                {formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-expense-light">
              <ArrowDownRight className="h-4 w-4 text-expense" />
              <span className="text-sm font-medium text-expense">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="finance-card animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
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
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="finance-card text-center py-12">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className="finance-card p-4 flex items-center justify-between opacity-0 animate-fade-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: "forwards",
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl text-xl",
                      transaction.type === "income"
                        ? "bg-income-light"
                        : "bg-expense-light"
                    )}
                  >
                    {transaction.icon}
                  </div>

                  {/* Details */}
                  <div>
                    <p className="font-semibold text-foreground">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          transaction.type === "income"
                            ? "bg-income-light text-income"
                            : "bg-expense-light text-expense"
                        )}
                      >
                        {categories.find((c) => c.value === transaction.category)
                          ?.label || transaction.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-lg font-bold",
                        transaction.type === "income"
                          ? "text-income"
                          : "text-expense"
                      )}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2"
                        onSelect={(e) => {
                          e.preventDefault();
                          openEdit(transaction);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2 text-expense focus:text-expense"
                        onSelect={(e) => {
                          e.preventDefault();
                          setDeletingId(transaction.id);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Type</label>
                <Select value={editType} onValueChange={(v) => setEditType(v as "income" | "expense")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Amount</label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.type === editType || c.type === "both")
                      .map((cat) => (
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isMutating}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isMutating}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
