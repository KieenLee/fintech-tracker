import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Target, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AddBudgetDialog from "@/components/AddBudgetDialog";
import {
  Budget,
  BudgetResponse,
  budgetService,
} from "@/services/budgetService";

const Budgets = () => {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Load budgets
  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await budgetService.getBudgets();
      setBudgets(data.budgets);
      setBudgetSummary(data);
    } catch (error: any) {
      console.error("Error loading budgets:", error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleBudgetSave = () => {
    loadBudgets();
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
  };

  const handleDelete = async (budgetId: number) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await budgetService.deleteBudget(budgetId);
      toast({
        title: "Success",
        description: "Budget deleted successfully",
      });
      loadBudgets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      });
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Loading state
  if (loading && budgets.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Budget Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage your spending limits
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBudget(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Overall Progress */}
      {budgetSummary && (
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Budget Progress
            </CardTitle>
            <CardDescription>
              Total spending across all categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Spent</span>
                <span className="font-medium">
                  {formatCurrency(budgetSummary.totalSpentAmount)} /{" "}
                  {formatCurrency(budgetSummary.totalBudgetAmount)}
                </span>
              </div>
              <Progress
                value={Math.min(budgetSummary.overallProgressPercentage, 100)}
                className="h-3"
              />
              <div className="text-xs text-muted-foreground">
                {budgetSummary.overallProgressPercentage > 100 ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Over budget by{" "}
                    {formatCurrency(
                      budgetSummary.totalSpentAmount -
                        budgetSummary.totalBudgetAmount
                    )}
                  </span>
                ) : (
                  <span>
                    {formatCurrency(
                      budgetSummary.totalBudgetAmount -
                        budgetSummary.totalSpentAmount
                    )}{" "}
                    remaining this period
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Budgets Found</h2>
            <p className="text-muted-foreground mb-4">
              Start managing your finances by creating your first budget
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <Card
              key={budget.budgetId}
              className="transition-all hover:shadow-md animate-scale-in"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {budget.categoryName}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(budget.budgetId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {new Date(budget.startDate).toLocaleDateString()} -{" "}
                  {new Date(budget.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {formatCurrency(budget.spentAmount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(budget.progressPercentage, 100)}
                    className={`h-2 ${getProgressColor(
                      budget.progressPercentage
                    )}`}
                  />
                  <div className="text-xs">
                    {budget.progressPercentage > 100 ? (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over by{" "}
                        {formatCurrency(budget.spentAmount - budget.amount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {formatCurrency(budget.remainingAmount)} left (
                        {(100 - budget.progressPercentage).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddBudgetDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleBudgetSave}
        editingBudget={editingBudget}
      />
    </div>
  );
};

export default Budgets;
