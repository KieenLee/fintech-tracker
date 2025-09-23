import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useCurrency } from "@/contexts/CurrencyContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  goalService,
  Goal,
  CreateGoalRequest,
  UpdateGoalRequest,
} from "@/services/goalService";

const Goals = () => {
  const { t } = useTranslation();
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
  const { formatCurrency } = useCurrency();

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
        title: t("common.error"),
        description: error.response?.data?.message || t("goals.load_failed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.targetAmount || !formData.deadline) {
      toast({
        title: t("goals.validation_error"),
        description: t("goals.validation_error_desc"),
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
          title: t("common.success"),
          description: t("goals.goal_updated"),
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
          title: t("common.success"),
          description: t("goals.goal_created"),
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
        title: t("common.error"),
        description: error.response?.data?.message || t("goals.create_failed"),
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
        title: t("common.success"),
        description: t("goals.goal_deleted"),
      });
      await loadGoals();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("goals.delete_failed"),
        variant: "destructive",
      });
    }
  };

  const handleAddMoney = async (goalId: number, amount: number) => {
    try {
      await goalService.addMoneyToGoal(goalId, amount);
      toast({
        title: t("common.success"),
        description: t("goals.money_added", {
          amount: formatCurrency(amount),
        }),
      });
      await loadGoals();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("goals.add_money_failed"),
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "High":
        return t("goals.high");
      case "Medium":
        return t("goals.medium");
      case "Low":
        return t("goals.low");
      default:
        return priority;
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
        <span className="ml-2">{t("common.loading")}</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("goals.title")}
          </h1>
          <p className="text-muted-foreground">{t("goals.subtitle")}</p>
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
              {t("goals.add_goal")}
            </Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? t("goals.edit_goal") : t("goals.add_new_goal")}
              </DialogTitle>
              <DialogDescription>{t("goals.set_target")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">{t("goals.goal_title")} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t("goals.goal_title_placeholder")}
                />
              </div>
              <div>
                <Label htmlFor="description">{t("goals.description")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={t("goals.description_placeholder")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetAmount">
                    {t("goals.target_amount")} *
                  </Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAmount: e.target.value })
                    }
                    placeholder={t("goals.target_amount_placeholder")}
                  />
                </div>
                <div>
                  <Label htmlFor="currentAmount">
                    {t("goals.current_amount")}
                  </Label>
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
                    placeholder={t("goals.current_amount_placeholder")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">{t("goals.target_date")} *</Label>
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
                  <Label htmlFor="priority">{t("goals.priority")}</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">{t("goals.high")}</SelectItem>
                      <SelectItem value="Medium">
                        {t("goals.medium")}
                      </SelectItem>
                      <SelectItem value="Low">{t("goals.low")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingGoal ? t("common.update") : t("common.create")}{" "}
                {t("goals.goal")}
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
            <h3 className="text-lg font-medium mb-2">{t("goals.no_goals")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("goals.start_creating")}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("goals.add_first_goal")}
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
                            ✓ {t("goals.completed")}
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
                        title={t("common.edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(goal.goalId)}
                        title={t("common.delete")}
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
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {t("goals.of")} {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-3"
                    />
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}% {t("goals.complete")} •{" "}
                      {formatCurrency(goal.targetAmount - goal.currentAmount)}{" "}
                      {t("goals.remaining")}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {daysRemaining > 0
                          ? t("goals.days_left", { days: daysRemaining })
                          : t("goals.overdue")}
                      </span>
                    </div>
                    <span
                      className={`font-medium ${getPriorityColor(
                        goal.priority
                      )}`}
                    >
                      {getPriorityText(goal.priority)} {t("goals.priority")}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 50)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(50)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 100)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(100)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 250)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(250)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 500)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(500)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 50000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(50000)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 100000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(100000)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 250000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(250000)}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddMoney(goal.goalId, 500000)}
                      disabled={isCompleted}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />+
                      {formatCurrency(500000)}
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
