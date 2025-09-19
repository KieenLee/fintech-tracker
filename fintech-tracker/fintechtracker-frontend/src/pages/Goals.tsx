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
import {
  Plus,
  Edit,
  Trash2,
  Target,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  goalService,
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
} from "@/services/goalService";

const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: "",
    currentAmount: "",
    deadline: "",
    priority: "Medium",
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const data = await goalService.getAllGoals();
      setGoals(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load goals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.targetAmount || !formData.deadline) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      if (editingGoal) {
        const updateData: UpdateGoalRequest = {
          goalName: formData.title,
          description: formData.description,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          targetDate: formData.deadline,
          priority: formData.priority,
        };

        await goalService.updateGoal(editingGoal.goalId, updateData);
        toast({
          title: "Success",
          description: "Goal updated successfully",
        });
      } else {
        const createData: CreateGoalRequest = {
          goalName: formData.title,
          description: formData.description,
          targetAmount: parseFloat(formData.targetAmount),
          currentAmount: parseFloat(formData.currentAmount) || 0,
          targetDate: formData.deadline,
          priority: formData.priority,
        };

        await goalService.createGoal(createData);
        toast({
          title: "Success",
          description: "Goal created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingGoal(null);
      setFormData({
        title: "",
        description: "",
        targetAmount: "",
        currentAmount: "",
        deadline: "",
        priority: "Medium",
      });
      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save goal",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.goalName,
      description: goal.description || "",
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.targetDate,
      priority: goal.priority,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await goalService.deleteGoal(id);
      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });
      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const handleAddMoney = async (goalId: number, amount: number) => {
    try {
      await goalService.addMoneyToGoal(goalId, amount);
      toast({
        title: "Success",
        description: `Added $${amount} to goal`,
      });
      await loadGoals();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add money",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-destructive";
      case "Medium":
        return "text-warning";
      case "Low":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading goals...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">
            Track your progress towards financial milestones
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingGoal(null);
                setFormData({
                  title: "",
                  description: "",
                  targetAmount: "",
                  currentAmount: "",
                  deadline: "",
                  priority: "Medium",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </DialogTitle>
              <DialogDescription>
                Set a financial target to work towards
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of your goal"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">Target Amount ($) *</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="currentAmount">Current Amount ($)</Label>
                  <Input
                    id="currentAmount"
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentAmount: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Target Date *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingGoal ? "Update" : "Create"} Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {goals.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first financial goal
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </Button>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const isCompleted = percentage >= 100;

            return (
              <Card
                key={goal.goalId}
                className={`transition-all hover:shadow-md animate-scale-in ${
                  isCompleted ? "border-success" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {goal.goalName}
                        {isCompleted && (
                          <span className="text-success text-sm">
                            ✓ Completed
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>{goal.description}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.goalId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        {/* ${goal.currentAmount.toLocaleString()} */}
                        {goal.currentAmount.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {/* of ${goal.targetAmount.toLocaleString()} */}
                        of {goal.targetAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-3"
                    />
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}% complete •{" "}
                      {(goal.targetAmount - goal.currentAmount).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      đ remaining
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysRemaining > 0
                          ? `${daysRemaining} days left`
                          : "Overdue"}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${getPriorityColor(
                        goal.priority
                      )}`}
                    >
                      {goal.priority} Priority
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 50000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      +50.000 đ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 100000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      +100.000 đ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 200000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      +250.000 đ
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 500000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      +500.000 đ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Goals;
