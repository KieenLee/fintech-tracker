import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Target } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Budget,
  CreateBudgetRequest,
  budgetService,
} from "@/services/budgetService";
import { categoryService, Category } from "@/services/categoryService";

interface AddBudgetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingBudget?: Budget | null;
}

const AddBudgetDialog = ({
  isOpen,
  onClose,
  onSave,
  editingBudget,
}: AddBudgetDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    isRecurring: false,
    notificationThreshold: "90",
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      if (!isOpen) return;

      setDataLoading(true);
      try {
        const categoriesData = await categoryService.getCategories();
        // Only show expense categories for budgets
        const expenseCategories = categoriesData.filter(
          (c) => c.transactionType === "expense"
        );
        setCategories(expenseCategories);
      } catch (error: any) {
        console.error("Error loading categories:", error);
        toast({
          title: "Error",
          description: "Failed to load categories",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadCategories();
  }, [isOpen, toast]);

  // Set form data when editing
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        categoryId: editingBudget.categoryId.toString(),
        amount: editingBudget.amount.toString(),
        startDate: new Date(editingBudget.startDate),
        endDate: new Date(editingBudget.endDate),
        isRecurring: editingBudget.isRecurring,
        notificationThreshold: editingBudget.notificationThreshold.toString(),
      });
    } else {
      setFormData({
        categoryId: "",
        amount: "",
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isRecurring: false,
        notificationThreshold: "90",
      });
    }
  }, [editingBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.categoryId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const budgetData: CreateBudgetRequest = {
        categoryId: parseInt(formData.categoryId),
        amount: parseFloat(formData.amount),
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        isRecurring: formData.isRecurring,
        notificationThreshold: parseFloat(formData.notificationThreshold),
      };

      if (editingBudget) {
        await budgetService.updateBudget(editingBudget.budgetId, budgetData);
        toast({
          title: "Success",
          description: "Budget updated successfully",
        });
      } else {
        await budgetService.createBudget(budgetData);
        toast({
          title: "Success",
          description: "Budget created successfully",
        });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving budget:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save budget",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      categoryId: "",
      amount: "",
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isRecurring: false,
      notificationThreshold: "90",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editingBudget ? "Edit Budget" : "Add New Budget"}
          </DialogTitle>
          <DialogDescription>
            {editingBudget
              ? "Update your budget details"
              : "Set spending limits for different categories"}
          </DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Category */}
            <div>
              <Label htmlFor="category">
                Category * ({categories.length} available)
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      categories.length > 0
                        ? "Select a category"
                        : "No categories available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.categoryId}
                      value={category.categoryId.toString()}
                    >
                      {category.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Budget Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="500.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
            </div>

            {/* Start Date */}
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      format(formData.startDate, "PPP")
                    ) : (
                      <span>Pick a start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, startDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div>
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? (
                      format(formData.endDate, "PPP")
                    ) : (
                      <span>Pick an end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, endDate: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notification Threshold */}
            <div>
              <Label htmlFor="threshold">Notification Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="0"
                max="100"
                placeholder="90"
                value={formData.notificationThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notificationThreshold: e.target.value,
                  })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || dataLoading}>
                {loading ? "Saving..." : editingBudget ? "Update" : "Create"}{" "}
                Budget
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddBudgetDialog;
