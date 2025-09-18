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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Transaction,
  CreateTransactionRequest,
  transactionService,
} from "@/services/transactionService";
import { accountService, Account } from "@/services/accountService";
import { categoryService, Category } from "@/services/categoryService";

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingTransaction?: Transaction | null;
}

const AddTransactionDialog = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}: AddTransactionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    accountId: "",
    categoryId: "",
    description: "",
    location: "",
    date: new Date(),
  });

  // Load accounts and categories
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      setDataLoading(true);
      try {
        console.log("Loading accounts and categories...");

        const [accountsData, categoriesData] = await Promise.all([
          accountService.getAccounts(),
          categoryService.getCategories(),
        ]);

        console.log("Accounts loaded:", accountsData);
        console.log("Categories loaded:", categoriesData);

        setAccounts(accountsData);
        setCategories(categoriesData);

        if (accountsData.length === 0) {
          toast({
            title: "No Accounts Found",
            description:
              "Please create an account first before adding transactions.",
            variant: "destructive",
          });
        }

        if (categoriesData.length === 0) {
          toast({
            title: "No Categories Found",
            description: "No categories available. Please check your data.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to load accounts and categories",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isOpen, toast]);

  // Filter categories based on transaction type
  useEffect(() => {
    const filtered = categories.filter(
      (cat) => cat.transactionType === formData.type
    );
    setFilteredCategories(filtered);
    console.log(`Filtered categories for ${formData.type}:`, filtered);

    // Reset category if it doesn't match the new type
    if (
      formData.categoryId &&
      !filtered.find((cat) => cat.categoryId.toString() === formData.categoryId)
    ) {
      setFormData((prev) => ({ ...prev, categoryId: "" }));
    }
  }, [formData.type, categories]);

  // Populate form when editing
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.transactionType as "income" | "expense",
        amount: editingTransaction.amount.toString(),
        accountId: editingTransaction.accountId.toString(),
        categoryId: editingTransaction.categoryId?.toString() || "",
        description: editingTransaction.description || "",
        location: editingTransaction.location || "",
        date: new Date(editingTransaction.transactionDate),
      });
    } else {
      setFormData({
        type: "expense",
        amount: "",
        accountId: "",
        categoryId: "",
        description: "",
        location: "",
        date: new Date(),
      });
    }
  }, [editingTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.accountId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const transactionData: CreateTransactionRequest = {
        accountId: parseInt(formData.accountId),
        categoryId: formData.categoryId
          ? parseInt(formData.categoryId)
          : undefined,
        amount: parseFloat(formData.amount),
        transactionType: formData.type,
        description: formData.description,
        location: formData.location,
        transactionDate: formData.date.toISOString(),
      };

      if (editingTransaction) {
        await transactionService.updateTransaction(
          editingTransaction.transactionId,
          transactionData
        );
        toast({
          title: "Success",
          description: "Transaction updated successfully",
        });
      } else {
        await transactionService.createTransaction(transactionData);
        toast({
          title: "Success",
          description: "Transaction created successfully",
        });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to save transaction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      type: "expense",
      amount: "",
      accountId: "",
      categoryId: "",
      description: "",
      location: "",
      date: new Date(),
    });
    onClose();
  };

  // Get account type display name
  const getAccountTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      cash: "Cash",
      bank_account: "Bank Account",
      e_wallet: "E-Wallet",
      credit_card: "Credit Card",
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? "Update your transaction details"
              : "Record a new income or expense"}
          </DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Transaction Type */}
            <div>
              <Label>Transaction Type</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "expense",
                      categoryId: "",
                    })
                  }
                  className="justify-start"
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  onClick={() =>
                    setFormData({ ...formData, type: "income", categoryId: "" })
                  }
                  className="justify-start"
                >
                  Income
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Account */}
            <div>
              <Label htmlFor="account">
                Account * ({accounts.length} available)
              </Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      accounts.length > 0
                        ? "Select an account"
                        : "No accounts available"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {accounts.length > 0 ? (
                    accounts.map((account) => (
                      <SelectItem
                        key={account.accountId}
                        value={account.accountId.toString()}
                      >
                        {account.accountName} (
                        {getAccountTypeDisplay(account.accountType)}) -{" "}
                        {account.currencyCode}{" "}
                        {account.currentBalance.toFixed(2)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No accounts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">
                Category ({filteredCategories.length} available for{" "}
                {formData.type})
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
                      filteredCategories.length > 0
                        ? "Select a category"
                        : `No ${formData.type} categories available`
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <SelectItem
                        key={category.categoryId}
                        value={category.categoryId.toString()}
                      >
                        {category.categoryName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No {formData.type} categories available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter transaction description..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Enter location (optional)"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Date */}
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || accounts.length === 0}>
                {loading ? "Saving..." : editingTransaction ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
