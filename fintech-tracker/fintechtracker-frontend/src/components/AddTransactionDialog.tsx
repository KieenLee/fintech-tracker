import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import { useToast } from "@/hooks/use-toast";
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
  const { t } = useTranslation();
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
            title: t("transactions.no_accounts_found"),
            description: t("transactions.create_account_first"),
            variant: "destructive",
          });
        }

        if (categoriesData.length === 0) {
          toast({
            title: t("transactions.no_categories_found"),
            description: t("transactions.no_categories_available"),
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({
          title: t("common.error"),
          description:
            error.response?.data?.message || t("transactions.failed_load_data"),
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [isOpen, toast, t]);

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
        title: t("transactions.validation_error"),
        description: t("transactions.validation_error_desc"),
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
          title: t("common.success"),
          description: t("transactions.updated_successfully"),
        });
      } else {
        await transactionService.createTransaction(transactionData);
        toast({
          title: t("common.success"),
          description: t("transactions.created_successfully"),
        });
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast({
        title: t("common.error"),
        description:
          error.response?.data?.message || t("transactions.failed_to_save"),
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
      cash: t("transactions.account_type_cash"),
      bank_account: t("transactions.account_type_bank"),
      e_wallet: t("transactions.account_type_ewallet"),
      credit_card: t("transactions.account_type_credit"),
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {editingTransaction
              ? t("transactions.edit_transaction")
              : t("transactions.add_new_transaction")}
          </DialogTitle>
          <DialogDescription>
            {editingTransaction
              ? t("transactions.update_details")
              : t("transactions.record_new")}
          </DialogDescription>
        </DialogHeader>

        {dataLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">{t("transactions.loading_data")}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Transaction Type */}
            <div>
              <Label>{t("transactions.transaction_type")}</Label>
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
                  {t("transactions.expense")}
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  onClick={() =>
                    setFormData({ ...formData, type: "income", categoryId: "" })
                  }
                  className="justify-start"
                >
                  {t("transactions.income")}
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">{t("transactions.amount")} *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder={t("transactions.amount_placeholder")}
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
                {t("transactions.account")} * ({accounts.length}{" "}
                {t("transactions.available")})
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
                        ? t("transactions.select_account")
                        : t("transactions.no_accounts_available")
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
                      {t("transactions.no_accounts_available")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">
                {t("transactions.category")} ({filteredCategories.length}{" "}
                {t("transactions.available_for")}{" "}
                {formData.type === "income"
                  ? t("transactions.income")
                  : t("transactions.expense")}
                )
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
                        ? t("transactions.select_category")
                        : t("transactions.no_categories_for_type", {
                            type:
                              formData.type === "income"
                                ? t("transactions.income")
                                : t("transactions.expense"),
                          })
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
                      {t("transactions.no_categories_for_type", {
                        type:
                          formData.type === "income"
                            ? t("transactions.income")
                            : t("transactions.expense"),
                      })}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">
                {t("transactions.description")}
              </Label>
              <Textarea
                id="description"
                placeholder={t("transactions.description_placeholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">{t("transactions.location")}</Label>
              <Input
                id="location"
                placeholder={t("transactions.location_placeholder")}
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            {/* Date */}
            <div>
              <Label>{t("transactions.date")} *</Label>
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
                      <span>{t("transactions.pick_date")}</span>
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
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading || accounts.length === 0}>
                {loading
                  ? t("transactions.saving")
                  : editingTransaction
                  ? t("common.update")
                  : t("common.save")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
