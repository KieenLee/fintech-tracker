export interface DashboardSummary {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  topExpenseCategories: TopExpenseCategory[];
}

export interface AccountSummary {
  accountId: number;
  accountName: string;
  accountType: string;
  currentBalance: number;
}

export interface TopExpenseCategory {
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
  month: string; // Format: "2024-01"
  income: number;
  expense: number;
  netIncome: number;
}

export interface DashboardOverview {
  financialSummary: FinancialSummary;
  budgetProgress: BudgetProgress[];
  topCategories: CategorySpending[];
  budgetAlerts: BudgetAlert[];
  stats: DashboardStats;
}

export interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBudget: number;
  budgetUsed: number;
}

export interface BudgetProgress {
  budgetId: number;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  progressPercentage: number;
  status: string;
  statusColor: string;
}

export interface CategorySpending {
  categoryName: string;
  amount: number;
  percentage: number;
  hasBudget: boolean;
  budgetAmount?: number;
  budgetProgress?: number;
  budgetStatus?: string;
}

export interface BudgetAlert {
  budgetId: number;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  progressPercentage: number;
  alertType: string;
  alertDate: string;
}

export interface DashboardStats {
  totalTransactions: number;
  activeBudgets: number;
  overBudgetCount: number;
  accountsCount: number;
  averageDailySpending: number;
}
