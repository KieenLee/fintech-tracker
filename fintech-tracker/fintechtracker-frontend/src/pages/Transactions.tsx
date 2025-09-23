import { useState, useEffect } from "react";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Transaction,
  transactionService,
  TransactionFilter,
  TransactionSearchFilter,
} from "@/services/transactionService";
import { accountService, Account } from "@/services/accountService";
import { categoryService, Category } from "@/services/categoryService";
import { useTranslation } from "react-i18next";

const Transactions = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load transactions when filters change
  useEffect(() => {
    loadTransactions(1);
  }, [searchTerm, categoryFilter, accountFilter, typeFilter]);

  const loadInitialData = async () => {
    try {
      const [accountsData, categoriesData] = await Promise.all([
        accountService.getAccounts(),
        categoryService.getCategories(),
      ]);

      setAccounts(accountsData);
      setCategories(categoriesData);
      loadTransactions(1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async (page: number = 1) => {
    setLoading(true);
    try {
      const hasSearchTerm = searchTerm && searchTerm.trim() !== "";

      if (hasSearchTerm) {
        const searchFilter: TransactionSearchFilter = {
          searchTerm: searchTerm.trim(),
          categoryId: getCategoryIdFromName(categoryFilter),
          accountId: getAccountIdFromName(accountFilter),
          transactionType: typeFilter !== "all" ? typeFilter : undefined,
          page,
          pageSize: 20,
          sortBy: "TransactionDate",
          sortOrder: "desc",
        };

        const response = await transactionService.searchTransactions(
          searchFilter
        );
        setTransactions(response.transactions);
        setTotalCount(response.totalCount);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      } else {
        const filter: TransactionFilter = {
          categoryId: getCategoryIdFromName(categoryFilter),
          accountId: getAccountIdFromName(accountFilter),
          transactionType: typeFilter !== "all" ? typeFilter : undefined,
          page,
          pageSize: 20,
          sortBy: "TransactionDate",
          sortOrder: "desc",
        };

        const response = await transactionService.getTransactions(filter);
        setTransactions(response.transactions);
        setTotalCount(response.totalCount);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
      }
    } catch (error: any) {
      console.error("❌ Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIdFromName = (categoryName: string): number | undefined => {
    if (categoryName === "all" || !categoryName) return undefined;

    const category = categories.find(
      (cat) => cat.categoryName.toLowerCase() === categoryName.toLowerCase()
    );
    return category?.categoryId;
  };

  const getAccountIdFromName = (accountName: string): number | undefined => {
    if (accountName === "all" || !accountName) return undefined;

    const account = accounts.find(
      (acc) => acc.accountName.toLowerCase() === accountName.toLowerCase()
    );
    return account?.accountId;
  };

  const handleTransactionSave = () => {
    loadTransactions(currentPage);
    setEditingTransaction(null);
    // Reload accounts to get updated balances
    accountService
      .getAccounts()
      .then(setAccounts)
      .catch(() => {});
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (transactionId: number) => {
    if (!confirm(t("transactions.delete_confirm"))) {
      return;
    }

    try {
      await transactionService.deleteTransaction(transactionId);
      toast({
        title: t("common.success"),
        description: t("transactions.delete_success"),
      });
      loadTransactions(currentPage);
      // Reload accounts to get updated balances
      accountService
        .getAccounts()
        .then(setAccounts)
        .catch(() => {});
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: t("transactions.delete_failed"),
        variant: "destructive",
      });
    }
  };

  const getAmountColor = (amount: number, type: string) => {
    return type === "income" ? "text-green-600" : "text-red-600";
  };

  const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      Food: "default",
      Transportation: "secondary",
      Entertainment: "outline",
      Income: "destructive",
    };
    return variants[category] || "default";
  };

  const formatAmount = (amount: number, type: string) => {
    const prefix = type === "income" ? "+" : "-";
    return `${prefix}${formatCurrency(Math.abs(amount))}`;
  };

  // Get unique categories and accounts for filters
  const expenseCategories = categories.filter(
    (cat) => cat.transactionType === "expense"
  );
  const incomeCategories = categories.filter(
    (cat) => cat.transactionType === "income"
  );
  const allCategories = [...expenseCategories, ...incomeCategories];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("transactions.title")}
          </h1>
          <p className="text-muted-foreground">{t("transactions.subtitle")}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("transactions.add_transaction")}
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">{t("common.search")}</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t("transactions.search_placeholder")}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type-filter">{t("transactions.type")}</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("transactions.all_types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("transactions.all_types")}
                  </SelectItem>
                  <SelectItem value="income">
                    {t("transactions.income")}
                  </SelectItem>
                  <SelectItem value="expense">
                    {t("transactions.expense")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category-filter">
                {t("transactions.category")}
              </Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("transactions.all_categories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("transactions.all_categories")}
                  </SelectItem>
                  {allCategories.map((category) => (
                    <SelectItem
                      key={category.categoryId}
                      value={category.categoryName.toLowerCase()}
                    >
                      {category.categoryName} ({category.transactionType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account-filter">
                {t("transactions.account")}
              </Label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t("transactions.all_accounts")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("transactions.all_accounts")}
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem
                      key={account.accountId}
                      value={account.accountName.toLowerCase()}
                    >
                      {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                {t("common.export")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.recent_transactions")}</CardTitle>
          <CardDescription>
            {t("transactions.latest_activity", { total: totalCount })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("transactions.date")}</TableHead>
                    <TableHead>{t("transactions.description")}</TableHead>
                    <TableHead>{t("transactions.category")}</TableHead>
                    <TableHead>{t("transactions.account")}</TableHead>
                    <TableHead className="text-right">
                      {t("transactions.amount")}
                    </TableHead>
                    <TableHead className="text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.transactionId}>
                      <TableCell className="font-medium">
                        {format(
                          new Date(transaction.transactionDate),
                          "MMM dd, yyyy"
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.description || t("common.no_description")}
                      </TableCell>
                      <TableCell>
                        {transaction.categoryName && (
                          <Badge
                            variant={getCategoryBadgeVariant(
                              transaction.categoryName
                            )}
                          >
                            {transaction.categoryName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.accountName}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium",
                          getAmountColor(
                            transaction.amount,
                            transaction.transactionType
                          )
                        )}
                      >
                        {formatAmount(
                          transaction.amount,
                          transaction.transactionType
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(transaction.transactionId)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="flex items-center px-2">
                    {t("common.page_of", {
                      current: currentPage,
                      total: totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadTransactions(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddTransactionDialog
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleTransactionSave}
        editingTransaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
