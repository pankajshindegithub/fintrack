import { useEffect, useState } from "react";
import { Plus, Target, Calendar, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { addGoalFunds, createGoal, deleteGoal, getGoals, updateGoal } from "@/lib/api";

type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  icon: string;
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTarget, setCreateTarget] = useState("");
  const [createDeadline, setCreateDeadline] = useState("");
  const [createIcon, setCreateIcon] = useState("🎯");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editIcon, setEditIcon] = useState("🎯");

  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isMutating, setIsMutating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { success, data, error } = await getGoals(token);
      if (!success || !data) {
        toast({
          variant: "destructive",
          title: "Failed to load goals",
          description: error || "Please try again.",
        });
        return;
      }

      const mapped: Goal[] = data.map((g: any) => ({
        id: g._id,
        name: g.name,
        target: Number(g.target),
        current: Number(g.current),
        deadline: new Date(g.deadline).toISOString(),
        icon: g.icon || "🎯",
      }));

      setGoals(mapped);
    };

    run();
  }, [toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-income";
    if (progress >= 50) return "bg-warning";
    return "bg-primary";
  };

  const openCreate = () => {
    setCreateName("");
    setCreateTarget("");
    setCreateDeadline("");
    setCreateIcon("🎯");
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const parsedTarget = Number(createTarget);
    if (!createName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing name",
        description: "Please enter a goal name.",
      });
      return;
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid target",
        description: "Please enter a valid target amount.",
      });
      return;
    }

    if (!createDeadline) {
      toast({
        variant: "destructive",
        title: "Missing deadline",
        description: "Please select a deadline.",
      });
      return;
    }

    setIsMutating(true);
    const { success, data, error } = await createGoal(
      {
        name: createName.trim(),
        target: parsedTarget,
        deadline: createDeadline,
        icon: createIcon || "🎯",
      },
      token
    );

    if (!success || !data) {
      toast({
        variant: "destructive",
        title: "Create failed",
        description: error || "Please try again.",
      });
      setIsMutating(false);
      return;
    }

    const created: Goal = {
      id: data._id,
      name: data.name,
      target: Number(data.target),
      current: Number(data.current),
      deadline: new Date(data.deadline).toISOString(),
      icon: data.icon || "🎯",
    };

    setGoals((prev) => [created, ...prev]);
    setIsCreateOpen(false);
    setIsMutating(false);
    toast({
      title: "Goal created",
      description: "Your goal has been added.",
    });
  };

  const openEdit = (goal: Goal) => {
    setEditingId(goal.id);
    setEditName(goal.name);
    setEditTarget(String(goal.target));
    setEditDeadline(format(new Date(goal.deadline), "yyyy-MM-dd"));
    setEditIcon(goal.icon || "🎯");
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const parsedTarget = Number(editTarget);
    if (!editName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing name",
        description: "Please enter a goal name.",
      });
      return;
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid target",
        description: "Please enter a valid target amount.",
      });
      return;
    }

    if (!editDeadline) {
      toast({
        variant: "destructive",
        title: "Missing deadline",
        description: "Please select a deadline.",
      });
      return;
    }

    setIsMutating(true);
    const { success, data, error } = await updateGoal(
      editingId,
      {
        name: editName.trim(),
        target: parsedTarget,
        deadline: editDeadline,
        icon: editIcon || "🎯",
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

    const updated: Goal = {
      id: data._id,
      name: data.name,
      target: Number(data.target),
      current: Number(data.current),
      deadline: new Date(data.deadline).toISOString(),
      icon: data.icon || "🎯",
    };

    setGoals((prev) => prev.map((g) => (g.id === editingId ? updated : g)));
    setIsEditOpen(false);
    setEditingId(null);
    setIsMutating(false);
    toast({
      title: "Goal updated",
      description: "Your changes have been saved.",
    });
  };

  const openAddFunds = (goal: Goal) => {
    setFundingId(goal.id);
    setFundAmount("");
    setIsAddFundsOpen(true);
  };

  const handleAddFunds = async () => {
    if (!fundingId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const parsedAmount = Number(fundAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter a valid amount.",
      });
      return;
    }

    setIsMutating(true);
    const { success, data, error } = await addGoalFunds(fundingId, parsedAmount, token);

    if (!success || !data) {
      toast({
        variant: "destructive",
        title: "Add funds failed",
        description: error || "Please try again.",
      });
      setIsMutating(false);
      return;
    }

    const updated: Goal = {
      id: data._id,
      name: data.name,
      target: Number(data.target),
      current: Number(data.current),
      deadline: new Date(data.deadline).toISOString(),
      icon: data.icon || "🎯",
    };

    setGoals((prev) => prev.map((g) => (g.id === fundingId ? updated : g)));
    setIsAddFundsOpen(false);
    setFundingId(null);
    setIsMutating(false);
    toast({
      title: "Funds added",
      description: "Your goal progress has been updated.",
    });
  };

  const openDelete = (goal: Goal) => {
    setDeletingId(goal.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setIsMutating(true);
    const { success, error } = await deleteGoal(deletingId, token);

    if (!success) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error || "Please try again.",
      });
      setIsMutating(false);
      return;
    }

    setGoals((prev) => prev.filter((g) => g.id !== deletingId));
    setIsDeleteOpen(false);
    setDeletingId(null);
    setIsMutating(false);
    toast({
      title: "Goal deleted",
      description: "The goal has been removed.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Savings Goals
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your progress towards financial goals
            </p>
          </div>
          <Button variant="gradient" className="gap-2" onClick={openCreate}>
            <Plus className="h-5 w-5" />
            Create Goal
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 animate-slide-up">
          <div className="finance-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Active Goals</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{goals.length}</p>
          </div>
          
          <div className="finance-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-income/10">
                <TrendingUp className="h-5 w-5 text-income" />
              </div>
              <span className="text-sm text-muted-foreground">Total Saved</span>
            </div>
            <p className="text-2xl font-bold text-income">
              {formatCurrency(goals.reduce((sum, g) => sum + g.current, 0))}
            </p>
          </div>
          
          <div className="finance-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <span className="text-sm text-muted-foreground">Target Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(goals.reduce((sum, g) => sum + g.target, 0))}
            </p>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal, index) => {
            const progress = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            
            return (
              <div
                key={goal.id}
                className="finance-card group opacity-0 animate-fade-in"
                style={{
                  animationDelay: `${index * 0.1}s`,
                  animationFillMode: "forwards",
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{goal.icon}</div>
                    <div>
                      <h3 className="font-semibold text-foreground">{goal.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(goal)}
                      disabled={isMutating}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-expense"
                      onClick={() => openDelete(goal)}
                      disabled={isMutating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getProgressColor(progress)
                      )}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Saved: </span>
                      <span className="font-semibold text-income">
                        {formatCurrency(goal.current)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(goal.target)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(remaining)} to go
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddFunds(goal)}
                      disabled={isMutating}
                    >
                      Add Funds
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Goal Card */}
          <div
            className="finance-card border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[280px] group"
            onClick={openCreate}
          >
            <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors mb-3">
              <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Create New Goal
            </p>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Emergency Fund" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Target Amount</div>
                <Input value={createTarget} onChange={(e) => setCreateTarget(e.target.value)} inputMode="numeric" placeholder="e.g. 100000" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Deadline</div>
                <Input value={createDeadline} onChange={(e) => setCreateDeadline(e.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Icon</div>
                <Input value={createIcon} onChange={(e) => setCreateIcon(e.target.value)} placeholder="e.g. 🎯" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isMutating}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Name</div>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Target Amount</div>
                <Input value={editTarget} onChange={(e) => setEditTarget(e.target.value)} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Deadline</div>
                <Input value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Icon</div>
                <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isMutating}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Amount</div>
                <Input value={fundAmount} onChange={(e) => setFundAmount(e.target.value)} inputMode="numeric" placeholder="e.g. 5000" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFundsOpen(false)} disabled={isMutating}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds} disabled={isMutating}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isMutating}
                className={cn("bg-expense text-expense-foreground hover:bg-expense/90")}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
