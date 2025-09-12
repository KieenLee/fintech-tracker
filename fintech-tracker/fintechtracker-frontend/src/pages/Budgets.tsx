import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Edit, Trash2, Target, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Budgets = () => {
  const [budgets, setBudgets] = useState([
    { id: 1, category: "Food", amount: 500, spent: 320, period: "Monthly" },
    { id: 2, category: "Transportation", amount: 300, spent: 180, period: "Monthly" },
    { id: 3, category: "Entertainment", amount: 200, spent: 240, period: "Monthly" },
    { id: 4, category: "Utilities", amount: 150, spent: 130, period: "Monthly" },
    { id: 5, category: "Shopping", amount: 400, spent: 350, period: "Monthly" },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    period: "Monthly"
  });

  const handleSave = () => {
    if (formData.category && formData.amount) {
      if (editingBudget) {
        setBudgets(budgets.map(b => 
          b.id === editingBudget.id 
            ? { ...b, category: formData.category, amount: parseFloat(formData.amount), period: formData.period }
            : b
        ));
      } else {
        setBudgets([...budgets, {
          id: Date.now(),
          category: formData.category,
          amount: parseFloat(formData.amount),
          spent: 0,
          period: formData.period
        }]);
      }
      setIsDialogOpen(false);
      setEditingBudget(null);
      setFormData({ category: "", amount: "", period: "Monthly" });
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-warning";
    return "bg-primary";
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallProgress = (totalSpent / totalBudget) * 100;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
          <p className="text-muted-foreground">Track and manage your spending limits</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingBudget(null);
              setFormData({ category: "", amount: "", period: "Monthly" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>{editingBudget ? "Edit Budget" : "Add New Budget"}</DialogTitle>
              <DialogDescription>
                Set spending limits for different categories
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Food, Transportation"
                />
              </div>
              <div>
                <Label htmlFor="amount">Budget Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div>
                <Label htmlFor="period">Period</Label>
                <Select value={formData.period} onValueChange={(value) => setFormData({ ...formData, period: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingBudget ? "Update" : "Create"} Budget
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overall Progress */}
      <Card className="transition-all hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Overall Budget Progress
          </CardTitle>
          <CardDescription>Total spending across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Spent</span>
              <span className="font-medium">${totalSpent.toFixed(2)} / ${totalBudget.toFixed(2)}</span>
            </div>
            <Progress value={Math.min(overallProgress, 100)} className="h-3" />
            <div className="text-xs text-muted-foreground">
              {overallProgress > 100 ? (
                <span className="text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Over budget by ${(totalSpent - totalBudget).toFixed(2)}
                </span>
              ) : (
                <span>${(totalBudget - totalSpent).toFixed(2)} remaining this month</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.amount) * 100;
          return (
            <Card key={budget.id} className="transition-all hover:shadow-md animate-scale-in">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{budget.category}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(budget)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>{budget.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">${budget.spent}</span>
                    <span className="text-sm text-muted-foreground">of ${budget.amount}</span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${getProgressColor(percentage)}`}
                  />
                  <div className="text-xs">
                    {percentage > 100 ? (
                      <span className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Over by ${(budget.spent - budget.amount).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        ${(budget.amount - budget.spent).toFixed(2)} left ({(100 - percentage).toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Budgets;