import api from "./api";

export interface Transaction {
  transactionId: number;
  userId: number;
  accountId: number;
  accountName: string;
  categoryId?: number;
  categoryName?: string;
  amount: number;
  transactionType: "income" | "expense";
  description?: string;
  transactionDate: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface CreateTransactionRequest {
  accountId: number;
  categoryId?: number;
  amount: number;
  transactionType: "income" | "expense";
  description?: string;
  transactionDate: string;
  location?: string;
}
export interface TransactionFilter {
  categoryId?: number;
  accountId?: number;
  fromDate?: string;
  toDate?: string;
  transactionType?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}
export interface TransactionSearchFilter extends TransactionFilter {
  searchTerm?: string;
}
export interface TransactionResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const transactionService = {
  async getTransactions(filter: TransactionFilter = {}) {
    try {
      // GIỮ NGUYÊN HOÀN TOÀN LOGIC XỬ LÝ PARAMS NÀY
      const params = new URLSearchParams();
      if (filter.categoryId)
        params.append("categoryId", filter.categoryId.toString());
      if (filter.accountId)
        params.append("accountId", filter.accountId.toString());
      if (filter.fromDate) params.append("fromDate", filter.fromDate);
      if (filter.toDate) params.append("toDate", filter.toDate);
      if (filter.transactionType && filter.transactionType !== "all") {
        params.append("transactionType", filter.transactionType);
      }
      if (filter.minAmount)
        params.append("minAmount", filter.minAmount.toString());
      if (filter.maxAmount)
        params.append("maxAmount", filter.maxAmount.toString());
      params.append("page", (filter.page || 1).toString());
      params.append("pageSize", (filter.pageSize || 10).toString());
      params.append("sortBy", filter.sortBy || "TransactionDate");
      params.append("sortOrder", filter.sortOrder || "desc");
      console.log("🔍 Transaction API call with params:", params.toString());

      const response = await api.get(`/transaction?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      throw error;
    }
  },

  async searchTransactions(searchFilter: TransactionSearchFilter = {}) {
    try {
      const { searchTerm, ...filter } = searchFilter;
      if (!searchTerm) {
        return await this.getTransactions(filter);
      }
      const params = new URLSearchParams();
      params.append("searchTerm", searchTerm);
      if (filter.categoryId)
        params.append("categoryId", filter.categoryId.toString());
      if (filter.accountId)
        params.append("accountId", filter.accountId.toString());
      if (filter.fromDate) params.append("fromDate", filter.fromDate);
      if (filter.toDate) params.append("toDate", filter.toDate);
      if (filter.transactionType && filter.transactionType !== "all") {
        params.append("transactionType", filter.transactionType);
      }
      if (filter.minAmount)
        params.append("minAmount", filter.minAmount.toString());
      if (filter.maxAmount)
        params.append("maxAmount", filter.maxAmount.toString());
      params.append("page", (filter.page || 1).toString());
      params.append("pageSize", (filter.pageSize || 10).toString());

      // SỬA ĐỔI: Thay 'apiClient' bằng 'api'
      const response = await api.get(
        `/transaction/search?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("❌ Error searching transactions:", error);
      throw error;
    }
  },

  async getTransaction(id: number): Promise<Transaction> {
    const response = await api.get(`/transaction/${id}`);
    return response.data;
  },

  async createTransaction(transaction: CreateTransactionRequest) {
    const response = await api.post("/transaction", transaction);
    return response.data;
  },

  async updateTransaction(id: number, transaction: CreateTransactionRequest) {
    const response = await api.put(`/transaction/${id}`, transaction);
    return response.data;
  },

  async deleteTransaction(id: number) {
    const response = await api.delete(`/transaction/${id}`);
    return response.data;
  },
};