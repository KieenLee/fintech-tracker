export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactionCount: number;
  accounts: AccountSummary[];
  topExpenseCategories: CategoryExpense[];
  recentTransactions: RecentTransaction[];
}

export interface AccountSummary {
  accountId: number;
  accountName: string;
  accountType: string;
  currentBalance: number;
}

export interface CategoryExpense {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export interface RecentTransaction {
  transactionId: number;
  description: string;
  amount: number;
  transactionType: string;
  categoryName: string;
  accountName: string;
  transactionDate: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface DashboardStats {
  totalAccounts: number;
  totalCategories: number;
  thisMonthTransactions: number;
}