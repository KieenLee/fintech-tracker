using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;

namespace fintechtracker_backend.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IBudgetRepository _budgetRepository;
        private readonly IAccountRepository _accountRepository;
        private readonly ICategoryRepository _categoryRepository;

        public DashboardService(
            ITransactionRepository transactionRepository,
            IBudgetRepository budgetRepository,
            IAccountRepository accountRepository,
            ICategoryRepository categoryRepository)
        {
            _transactionRepository = transactionRepository;
            _budgetRepository = budgetRepository;
            _accountRepository = accountRepository;
            _categoryRepository = categoryRepository;
        }

        public async Task<DashboardOverviewDto> GetDashboardOverviewAsync(int userId)
        {
            try
            {
                // Get financial summary
                var financialSummary = await GetFinancialSummaryAsync(userId);

                // Get top categories
                var topCategories = await GetTopCategoriesAsync(userId, 1);

                // Get budget progress
                var budgetProgress = await GetBudgetProgressAsync(userId);

                // Get stats
                var stats = await GetDashboardStatsAsync(userId);

                return new DashboardOverviewDto
                {
                    FinancialSummary = financialSummary,
                    TopCategories = topCategories,
                    BudgetProgress = budgetProgress,
                    BudgetAlerts = new List<BudgetAlertDto>(), // TODO: Implement if needed
                    Stats = stats
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboardOverviewAsync: {ex.Message}");
                return new DashboardOverviewDto();
            }
        }

        public async Task<FinancialSummaryDto> GetFinancialSummaryAsync(int userId)
        {
            try
            {
                var currentMonth = DateTime.Now;
                var startOfMonth = new DateTime(currentMonth.Year, currentMonth.Month, 1);
                var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

                // Get accounts balance
                var accounts = await _accountRepository.GetUserAccountsAsync(userId);
                var totalBalance = accounts.Sum(a => a.CurrentBalance);

                // Get monthly transactions
                var monthlyTransactions = await _transactionRepository.GetUserTransactionsAsync(userId, new TransactionFilterDto
                {
                    FromDate = startOfMonth,
                    ToDate = endOfMonth,
                    Page = 1,
                    PageSize = int.MaxValue
                });

                var transactionsList = monthlyTransactions.Transactions.ToList();

                var monthlyIncome = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var monthlyExpense = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                // Get monthly budgets (if IBudgetRepository exists)
                decimal monthlyBudget = 0;
                decimal budgetUsed = 0;

                return new FinancialSummaryDto
                {
                    TotalBalance = totalBalance,
                    MonthlyIncome = monthlyIncome,
                    MonthlyExpense = monthlyExpense,
                    MonthlyBudget = monthlyBudget,
                    BudgetUsed = budgetUsed
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetFinancialSummaryAsync: {ex.Message}");
                return new FinancialSummaryDto();
            }
        }

        public Task<List<BudgetProgressDto>> GetBudgetProgressAsync(int userId)
        {
            try
            {
                // TODO: Implement when IBudgetRepository methods are available
                return Task.FromResult(new List<BudgetProgressDto>());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetBudgetProgressAsync: {ex.Message}");
                return Task.FromResult(new List<BudgetProgressDto>());
            }
        }

        public async Task<List<CategorySpendingDto>> GetTopCategoriesAsync(int userId, int months = 1)
        {
            try
            {
                var startDate = DateTime.Now.AddMonths(-months);

                var transactions = await _transactionRepository.GetUserTransactionsAsync(userId, new TransactionFilterDto
                {
                    FromDate = startDate,
                    TransactionType = "expense",
                    Page = 1,
                    PageSize = int.MaxValue
                });

                var transactionsList = transactions.Transactions.ToList();

                var categorySpending = transactionsList
                    .Where(t => !string.IsNullOrEmpty(t.CategoryName))
                    .GroupBy(t => new { t.CategoryId, t.CategoryName })
                    .Select(g => new
                    {
                        CategoryName = g.Key.CategoryName!,
                        Amount = g.Sum(t => t.Amount),
                        CategoryId = g.Key.CategoryId
                    })
                    .OrderByDescending(c => c.Amount)
                    .Take(5)
                    .ToList();

                var totalExpense = categorySpending.Sum(c => c.Amount);
                var result = new List<CategorySpendingDto>();

                foreach (var category in categorySpending)
                {
                    var percentage = totalExpense > 0 ? (category.Amount / totalExpense) * 100 : 0;

                    result.Add(new CategorySpendingDto
                    {
                        CategoryName = category.CategoryName,
                        Amount = category.Amount,
                        Percentage = percentage,
                        HasBudget = false, // TODO: Check budget when IBudgetRepository is implemented
                        BudgetAmount = null,
                        BudgetProgress = null,
                        BudgetStatus = null
                    });
                }

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTopCategoriesAsync: {ex.Message}");
                return new List<CategorySpendingDto>();
            }
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(int userId)
        {
            try
            {
                var currentDate = DateTime.Now;
                var last30Days = currentDate.AddDays(-30);

                // Get transactions for last 30 days
                var transactions = await _transactionRepository.GetUserTransactionsAsync(userId, new TransactionFilterDto
                {
                    FromDate = last30Days,
                    Page = 1,
                    PageSize = int.MaxValue
                });

                var transactionsList = transactions.Transactions.ToList();

                // Calculate totals
                var totalIncome = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "income")
                    .Sum(t => t.Amount);

                var totalExpense = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                // Get accounts balance
                var accounts = await _accountRepository.GetUserAccountsAsync(userId);
                var netBalance = accounts.Sum(a => a.CurrentBalance);

                // Get top expense categories
                var topCategories = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "expense" && !string.IsNullOrEmpty(t.CategoryName))
                    .GroupBy(t => t.CategoryName)
                    .Select(g => new
                    {
                        CategoryName = g.Key,
                        TotalAmount = g.Sum(t => t.Amount)
                    })
                    .OrderByDescending(c => c.TotalAmount)
                    .Take(5)
                    .ToList();

                var totalExpenseForCategories = topCategories.Sum(c => c.TotalAmount);

                var topExpenseCategories = topCategories.Select(c => new TopExpenseCategoryDto
                {
                    CategoryName = c.CategoryName ?? string.Empty,
                    TotalAmount = c.TotalAmount,
                    Percentage = totalExpenseForCategories > 0 ? (c.TotalAmount / totalExpenseForCategories) * 100 : 0
                }).ToList();

                return new DashboardSummaryDto
                {
                    NetBalance = netBalance,
                    TotalIncome = totalIncome,
                    TotalExpense = totalExpense,
                    TransactionCount = transactionsList.Count,
                    TopExpenseCategories = topExpenseCategories
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboardSummaryAsync: {ex.Message}");
                return new DashboardSummaryDto();
            }
        }

        public async Task<List<MonthlyTrendDto>> GetMonthlyTrendAsync(int userId, int months = 6)
        {
            try
            {
                var trends = new List<MonthlyTrendDto>();
                var currentDate = DateTime.Now;

                for (int i = 0; i < months; i++)
                {
                    var targetDate = currentDate.AddMonths(-i);
                    var startOfMonth = new DateTime(targetDate.Year, targetDate.Month, 1);
                    var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);

                    // Get transactions for this month
                    var monthTransactions = await _transactionRepository.GetUserTransactionsAsync(userId, new TransactionFilterDto
                    {
                        FromDate = startOfMonth,
                        ToDate = endOfMonth,
                        Page = 1,
                        PageSize = int.MaxValue
                    });

                    var transactionsList = monthTransactions.Transactions.ToList();

                    var monthlyIncome = transactionsList
                        .Where(t => t.TransactionType.ToLower() == "income")
                        .Sum(t => t.Amount);

                    var monthlyExpense = transactionsList
                        .Where(t => t.TransactionType.ToLower() == "expense")
                        .Sum(t => t.Amount);

                    trends.Add(new MonthlyTrendDto
                    {
                        Month = targetDate.ToString("yyyy-MM"),
                        Income = monthlyIncome,
                        Expense = monthlyExpense,
                        NetIncome = monthlyIncome - monthlyExpense
                    });
                }

                return trends.OrderBy(t => t.Month).ToList();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetMonthlyTrendAsync: {ex.Message}");
                return new List<MonthlyTrendDto>();
            }
        }

        // Private helper method
        private async Task<DashboardStatsDto> GetDashboardStatsAsync(int userId)
        {
            try
            {
                var currentMonth = DateTime.Now;
                var startOfMonth = new DateTime(currentMonth.Year, currentMonth.Month, 1);

                // Get stats in parallel
                var transactionsTask = _transactionRepository.GetUserTransactionsAsync(userId, new TransactionFilterDto
                {
                    FromDate = startOfMonth,
                    Page = 1,
                    PageSize = int.MaxValue
                });
                var accountsTask = _accountRepository.GetUserAccountsAsync(userId);

                await Task.WhenAll(transactionsTask, accountsTask);

                var transactions = await transactionsTask;
                var accounts = await accountsTask;

                var transactionsList = transactions.Transactions.ToList();
                var totalExpense = transactionsList
                    .Where(t => t.TransactionType.ToLower() == "expense")
                    .Sum(t => t.Amount);

                var averageDailySpending = totalExpense / Math.Max(DateTime.Now.Day, 1);

                return new DashboardStatsDto
                {
                    TotalTransactions = transactions.TotalCount,
                    ActiveBudgets = 0, // TODO: Implement when budget repo is available
                    OverBudgetCount = 0, // TODO: Implement when budget repo is available
                    AccountsCount = accounts.Count(),
                    AverageDailySpending = averageDailySpending
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetDashboardStatsAsync: {ex.Message}");
                return new DashboardStatsDto();
            }
        }
    }
}